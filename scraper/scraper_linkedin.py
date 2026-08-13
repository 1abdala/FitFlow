import re
import time
import random
import requests
from bs4 import BeautifulSoup
from scraper import extract_skills, extract_requirements, _TECH_TITLE_RE, NON_TECH_ANTI_KEYWORDS

# ── LinkedIn guest API endpoint (no login required) ──────────────────
# Returns server-rendered HTML — no Selenium/JS needed.
GUEST_API_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
JOB_DETAIL_URL = "https://www.linkedin.com/jobs/view/{job_id}/"

# ── Search queries — cover all major tech internship categories ───────
# Consolidating from 15 to 4 high-yield, broad queries to stay completely
# under LinkedIn's guest search rate limits and prevent security walls.
# We omit "Malaysia" since 'location="Malaysia"' is passed as a param.
SEARCH_QUERIES = [
    "software intern",
    "IT intern",
    "data intern",
    "tech intern",
    "cybersecurity intern",
    "security intern",
    "network intern",
    "cloud intern",
    "devops intern",
    "web intern",
    "UI UX intern",
    "QA intern",
    "systems analyst intern"
]


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.linkedin.com/",
    "Connection": "keep-alive",
}


# ── Helpers ───────────────────────────────────────────────────────────

def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def _extract_job_id(url: str) -> str | None:
    """Pull the numeric job ID out of a LinkedIn job URL."""
    # Match any sequence of 8 or more digits (job ID) in the URL
    m = re.search(r'(\d{8,})', url)
    return m.group(1) if m else None


def _fetch_listings(session: requests.Session, query: str, start: int = 0) -> list[dict]:
    """Fetch one page of job cards from the LinkedIn guest API."""
    params = {
        "keywords": query,
        "location": "Malaysia",
        "start": start,
        "count": 25,
        "f_JT": "I",        # Internship job type
        "f_TPR": "r2592000", # Posted within last 30 days
    }
    try:
        resp = session.get(GUEST_API_URL, params=params, timeout=15)
        if resp.status_code == 429:
            print("    [LinkedIn] Rate limited — waiting 30s...")
            time.sleep(30)
            resp = session.get(GUEST_API_URL, params=params, timeout=15)

        if resp.status_code != 200:
            print(f"    [LinkedIn] HTTP {resp.status_code} for '{query}' — skipping.")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        cards = soup.find_all("li")
        print(f"    [LinkedIn] Search: '{query}' -> Found {len(cards)} raw cards")

        jobs = []
        for card in cards:
            try:
                title_el   = card.find("h3", class_=re.compile(r"base-search-card__title"))
                company_el = card.find("h4", class_=re.compile(r"base-search-card__subtitle"))
                loc_el     = card.find("span", class_=re.compile(r"job-search-card__location"))
                link_el    = card.find("a", class_=re.compile(r"base-card__full-link"))

                if not title_el or not link_el:
                    continue

                url = link_el.get("href", "").split("?")[0].strip()
                if not url or not _extract_job_id(url):
                    continue

                # Ensure URL is directed to global www subdomain to force English locale
                url = url.replace("my.linkedin.com", "www.linkedin.com")

                logo_el    = card.find("img")
                logo_url   = None
                if logo_el:
                    logo_url = logo_el.get("data-delayed-url") or logo_el.get("src")

                jobs.append({
                    "title":        title_el.get_text(strip=True),
                    "company_name": company_el.get_text(strip=True) if company_el else "Unknown",
                    "location":     loc_el.get_text(strip=True)     if loc_el     else "Malaysia",
                    "apply_url":    url,
                    "company_logo_url": logo_url
                })
            except Exception:
                continue

        return jobs

    except Exception as e:
        print(f"    [LinkedIn] Error fetching listings for '{query}': {e}")
        return []


def _fetch_description(session: requests.Session, url: str) -> str | None:
    """Fetch full job description from a LinkedIn job detail page."""
    try:
        time.sleep(random.uniform(1.8, 3.5))   # polite rate limiting
        resp = session.get(url, timeout=15)

        if resp.status_code == 429:
            print("    [LinkedIn] Rate limited on detail page — waiting 45s...")
            time.sleep(45)
            resp = session.get(url, timeout=15)

        if resp.status_code != 200:
            return None

        # Redirect to login wall — LinkedIn blocked us
        if "authwall" in resp.url or "login" in resp.url:
            print("    [LinkedIn] Auth wall hit — skipping description.")
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # Try selectors in order of reliability (LinkedIn changes these)
        desc = (
            soup.find("div", class_=re.compile(r"show-more-less-html__markup")) or
            soup.find("div", class_=re.compile(r"description__text"))           or
            soup.find("section", class_=re.compile(r"description"))             or
            soup.find("div",  {"id": "job-details"})
        )

        return desc.get_text(separator="\n", strip=True) if desc else None

    except Exception as e:
        print(f"    [LinkedIn] Description fetch failed for {url}: {e}")
        return None


# ── Main scrape function ──────────────────────────────────────────────

def scrape_linkedin_internships() -> list[dict]:
    """
    Scrape tech internships from LinkedIn using the public guest API.
    Returns job dicts in the same format used by the JobStreet scraper.
    """
    print("\n--- LinkedIn Internship Scraper ---")
    session = _session()

    seen_urls  = set()
    candidates = []

    # ── Phase 1: collect & filter listings ───────────────────────────
    for query in SEARCH_QUERIES:
        print(f"  Searching: '{query}'...")
        listings = _fetch_listings(session, query)

        for job in listings:
            url        = job["apply_url"]
            title_lower = job["title"].lower()

            if url in seen_urls:
                continue
            
            # Reject senior/executive management roles
            if any(s in title_lower for s in ["senior", "lead", "principal", "head of", "director", "manager", "architect", "vp ", "chief"]):
                print(f"    [SKIP – senior/manager role] {job['title']}")
                continue

            if not _TECH_TITLE_RE.search(title_lower):
                print(f"    [SKIP – non-tech] {job['title']}")
                continue

            if any(kw in title_lower for kw in NON_TECH_ANTI_KEYWORDS):
                print(f"    [SKIP – blocked domain] {job['title']}")
                continue

            seen_urls.add(url)
            candidates.append(job)
            print(f"    [KEEP] {job['title']} @ {job['company_name']}")

        # Pause between search queries to avoid rate limits
        time.sleep(random.uniform(3.0, 5.5))

    print(f"\n  Phase 1 done: {len(candidates)} LinkedIn tech internships found.")

    # ── Phase 2: fetch descriptions & extract skills ──────────────────
    print("  Phase 2: Extracting descriptions & skills...\n")
    results = []

    for job in candidates:
        print(f"  Visiting: {job['apply_url']}")
        desc = _fetch_description(session, job["apply_url"])

        if desc:
            requirements = extract_requirements(desc)
            skills       = extract_skills(desc)

            job["description"]    = desc
            job["requirements"]   = requirements
            job["required_skills"] = skills

            print(f"    + Description: {len(desc)} chars")
            print(f"    + Skills: {skills}")

            # Phase 2 safety net: no tech signal at all → drop
            if not skills and not _TECH_TITLE_RE.search(desc.lower()):
                print(f"    [SKIP – no tech signal in description]")
                job["_drop"] = True
        else:
            # Description unavailable (auth wall, error, etc.)
            # Keep the job but record no skills — better than losing it entirely
            job["description"]     = "Description unavailable."
            job["required_skills"] = []

        job["source"]    = "LinkedIn"
        job["is_active"] = True
        job["salary"]    = None
        results.append(job)

    print(f"\n  LinkedIn scrape complete: {len(results)} jobs ready for DB sync.")
    return results

if __name__ == "__main__":
    scrape_linkedin_internships()
