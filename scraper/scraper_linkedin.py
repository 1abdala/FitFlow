import re
import time
import random
import requests
from bs4 import BeautifulSoup
from scraper import extract_skills, extract_requirements, _TECH_TITLE_RE, NON_TECH_ANTI_KEYWORDS

# ── LinkedIn guest API endpoint (no login required) ──────────────────
GUEST_API_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
JOB_DETAIL_URL = "https://www.linkedin.com/jobs/view/{job_id}/"

# ── Comprehensive Malaysia Tech & Cybersecurity Search Queries ───────
SEARCH_QUERIES = [
    # Cybersecurity & Information Security Focus
    "cybersecurity intern",
    "cyber security intern",
    "information security intern",
    "IT security intern",
    "SOC intern",
    "security engineer intern",
    "cyber defense intern",
    "penetration testing intern",
    "technology risk intern",
    "IT risk intern",
    "GRC intern",
    "information assurance intern",
    "PROTÉGÉ cybersecurity",

    # Software Engineering & Web
    "software intern",
    "software engineer intern",
    "software developer intern",
    "backend intern",
    "frontend intern",
    "full stack intern",
    "web developer intern",
    "mobile developer intern",

    # Data Science, AI & Analytics
    "data science intern",
    "data analyst intern",
    "data engineer intern",
    "machine learning intern",
    "AI intern",

    # Cloud, DevOps & Systems
    "devops intern",
    "cloud intern",
    "systems analyst intern",
    "network intern",
    "QA intern",
    "IT intern",
    "tech intern"
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

def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update(HEADERS)
    return s

def _extract_job_id(url: str) -> str | None:
    """Pull the numeric job ID out of a LinkedIn job URL."""
    m = re.search(r'(\d{8,})', url)
    return m.group(1) if m else None

def _fetch_listings(session: requests.Session, query: str, start: int = 0) -> list[dict]:
    """Fetch one page of job cards from the LinkedIn guest API (start=0, 25, 50...)."""
    params = {
        "keywords": query,
        "location": "Malaysia",
        "start": start,
        "count": 25,
        "f_TPR": "r2592000", # Posted within last 30 days
    }
    try:
        resp = session.get(GUEST_API_URL, params=params, timeout=15)
        if resp.status_code == 429:
            print("    [LinkedIn] Rate limited — waiting 20s...")
            time.sleep(20)
            resp = session.get(GUEST_API_URL, params=params, timeout=15)

        if resp.status_code != 200:
            print(f"    [LinkedIn] HTTP {resp.status_code} for '{query}' start={start} — skipping.")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        cards = soup.find_all("li")

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

                url = url.replace("my.linkedin.com", "www.linkedin.com")

                logo_el  = card.find("img")
                logo_url = None
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
        print(f"    [LinkedIn] Error fetching listings for '{query}' start={start}: {e}")
        return []

def _fetch_description(session: requests.Session, url: str) -> str | None:
    """Fetch full job description from a LinkedIn job detail page."""
    try:
        time.sleep(random.uniform(1.2, 2.5))
        resp = session.get(url, timeout=12)

        if resp.status_code == 429:
            print("    [LinkedIn] Rate limited on detail page — waiting 25s...")
            time.sleep(25)
            resp = session.get(url, timeout=12)

        if resp.status_code != 200:
            return None

        if "authwall" in resp.url or "login" in resp.url:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        desc = (
            soup.find("div", class_=re.compile(r"show-more-less-html__markup")) or
            soup.find("div", class_=re.compile(r"description__text"))           or
            soup.find("section", class_=re.compile(r"description"))             or
            soup.find("div",  {"id": "job-details"})
        )

        return desc.get_text(separator="\n", strip=True) if desc else None

    except Exception:
        return None

def scrape_linkedin_internships(max_pages_per_query: int = 3) -> list[dict]:
    """
    Scrape tech & cybersecurity internships from LinkedIn across Malaysia using multi-keyword search & pagination.
    """
    print("\n--- LinkedIn Internship Scraper (Expanded Malaysia Coverage) ---")
    session = _session()

    seen_urls  = set()
    candidates = []
    
    total_discovered = 0
    total_rejected = 0
    total_duplicates = 0

    # ── Phase 1: Collect & Filter Listings with Multi-Page Pagination ──
    for query in SEARCH_QUERIES:
        print(f"\n  [LinkedIn Query] Searching: '{query}'...")
        
        for page in range(max_pages_per_query):
            start = page * 25
            listings = _fetch_listings(session, query, start=start)
            
            if not listings:
                break
                
            total_discovered += len(listings)
            page_kept = 0

            for job in listings:
                url         = job["apply_url"]
                title_lower = job["title"].lower()

                if url in seen_urls:
                    total_duplicates += 1
                    continue

                # Reject senior/executive management roles
                if any(s in title_lower for s in ["senior", "lead", "principal", "head of", "director", "manager", "architect", "vp ", "chief"]):
                    total_rejected += 1
                    continue

                # Title must match tech/cybersecurity allowlist OR contain intern/protege terms
                is_tech = _TECH_TITLE_RE.search(title_lower)
                is_cyber = any(term in title_lower for term in ["cyber", "security", "soc", "infosec", "penetration", "risk"])
                
                if not is_tech and not is_cyber:
                    total_rejected += 1
                    continue

                if any(kw in title_lower for kw in NON_TECH_ANTI_KEYWORDS):
                    total_rejected += 1
                    continue

                seen_urls.add(url)
                candidates.append(job)
                page_kept += 1

            print(f"    -> Page {page+1} (start={start}): Discovered {len(listings)} cards, Kept {page_kept} new candidate(s)")
            
            # If fewer than 10 cards returned, no more pages for this query
            if len(listings) < 10:
                break

            time.sleep(random.uniform(1.5, 3.0))

    print(f"\n  Phase 1 Complete: Discovered {total_discovered} raw listings, Rejected {total_rejected}, Duplicates {total_duplicates}. Kept {len(candidates)} unique candidates.")

    # ── Phase 2: Fetch Descriptions & Extract Skills ──────────────────
    print(f"\n  Phase 2: Extracting details & skills for {len(candidates)} candidates...\n")
    results = []

    for idx, job in enumerate(candidates, 1):
        print(f"  [{idx}/{len(candidates)}] Visiting: {job['apply_url']}")
        desc = _fetch_description(session, job["apply_url"])

        if desc:
            requirements = extract_requirements(desc)
            skills       = extract_skills(desc)

            job["description"]     = desc
            job["requirements"]    = requirements
            job["required_skills"] = skills

            print(f"    + Description: {len(desc)} chars | Skills ({len(skills)}): {skills[:5]}")

            if not skills and not _TECH_TITLE_RE.search(desc.lower()) and not any(k in desc.lower() for k in ["cyber", "security", "soc"]):
                print(f"    [SKIP – no tech signal in description]")
                job["_drop"] = True
        else:
            job["description"]     = "Description unavailable."
            job["required_skills"] = []

        job["source"]    = "LinkedIn"
        job["is_active"] = True
        job["salary"]    = None
        results.append(job)

    kept_results = [j for j in results if not j.get("_drop", False)]
    print(f"\n  LinkedIn scrape complete: {len(kept_results)} jobs ready for DB sync.")
    return results

if __name__ == "__main__":
    scrape_linkedin_internships()
