import os
import sys
import time
import random
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

# Add project root to python path to import local modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}

def extract_logo_from_page(job_url: str) -> str | None:
    try:
        # Rate limit politely
        time.sleep(random.uniform(2.0, 4.0))
        
        resp = requests.get(job_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            print(f"  [HTTP {resp.status_code}] Failed to fetch page.")
            return None
            
        if "authwall" in resp.url or "login" in resp.url:
            print("  Hit LinkedIn login wall.")
            return None
            
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Method 1: Look for img inside an anchor tag pointing to a company page
        for a in soup.find_all("a"):
            href = a.get("href", "")
            if "company/" in href or "linkedin.com/company" in href:
                img = a.find("img")
                if img:
                    logo_url = img.get("data-delayed-url") or img.get("src")
                    if logo_url and "company-logo" in logo_url:
                        return logo_url.strip()

        # Method 2: Look for any image tag with class containing topcard__org-image or company-logo
        topcard_img = soup.select_one(".topcard__org-image, .company-logo, [class*='logo']")
        if topcard_img:
            logo_url = topcard_img.get("data-delayed-url") or topcard_img.get("src")
            if logo_url:
                return logo_url.strip()
                
        # Method 3: Look for any img with data-delayed-url containing "company-logo"
        for img in soup.find_all("img"):
            logo_url = img.get("data-delayed-url") or img.get("src")
            if logo_url and "company-logo" in logo_url:
                return logo_url.strip()

        return None
    except Exception as e:
        print(f"  Error parsing detail page: {e}")
        return None

def main():
    try:
        # Fetch active LinkedIn internships missing logos
        res = supabase.table("internships")\
            .select("id, title, company_name, apply_url")\
            .eq("source", "LinkedIn")\
            .eq("is_active", True)\
            .is_("company_logo_url", None)\
            .execute()
            
        jobs = res.data or []
        print(f"Starting backfill for {len(jobs)} active LinkedIn internships missing logos...")
        
        updated_count = 0
        for i, job in enumerate(jobs):
            job_id = job["id"]
            title = job["title"]
            company = job["company_name"]
            apply_url = job["apply_url"]
            
            print(f"\n[{i+1}/{len(jobs)}] Fetching logo for: {title} @ {company}")
            print(f"  URL: {apply_url}")
            
            logo_url = extract_logo_from_page(apply_url)
            if logo_url:
                print(f"  Found logo: {logo_url}")
                # Update in DB
                supabase.table("internships")\
                    .update({"company_logo_url": logo_url})\
                    .eq("id", job_id)\
                    .execute()
                updated_count += 1
            else:
                print("  No logo found.")
                
        print(f"\nBackfill complete! Updated {updated_count} internships.")
        
    except Exception as e:
        print("Fatal error in backfill:", e)

if __name__ == "__main__":
    main()
