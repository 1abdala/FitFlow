import os
from dotenv import load_dotenv
from scraper import scrape_internships
from scraper_linkedin import scrape_linkedin_internships
from db import insert_internships, deactivate_stale_jobs, regenerate_all_matches

def main():
    load_dotenv()

    print("=" * 50)
    print("  FitFlow Internship Extraction Service")
    print("=" * 50)

    all_jobs = []

    # ── 1. JobStreet ──────────────────────────────────────
    print("\n[1/2] JobStreet Scraper")
    jobstreet_jobs = scrape_internships()
    print(f"  -> {len(jobstreet_jobs)} tech internships from JobStreet.")
    jobstreet_jobs = [j for j in jobstreet_jobs if not j.pop("_drop", False)]
    print(f"  -> {len(jobstreet_jobs)} tech internships from JobStreet.")
    all_jobs.extend(jobstreet_jobs)

    # ── 2. LinkedIn ───────────────────────────────────────
    print("\n[2/2] LinkedIn Scraper")
    linkedin_jobs = scrape_linkedin_internships()
    linkedin_jobs = [j for j in linkedin_jobs if not j.pop("_drop", False)]
    print(f"  -> {len(linkedin_jobs)} tech internships from LinkedIn.")
    all_jobs.extend(linkedin_jobs)

    # ── Summary ───────────────────────────────────────────
    print(f"\n{'=' * 50}")
    print(f"  Total scraped: {len(all_jobs)} internships")
    print(f"  JobStreet: {len(jobstreet_jobs)}  |  LinkedIn: {len(linkedin_jobs)}")
    print(f"{'=' * 50}")

    if not all_jobs:
        print("No jobs found to sync. Exiting.")
        return

    # ── 3. Sync to Supabase ───────────────────────────────
    print("\n--- Database Synchronization ---")
    try:
        inserted = insert_internships(all_jobs)
        print(f"Upsert complete: {inserted} rows synced to 'internships'.")

        # Deactivate stale listings per source
        for source in ("JobStreet", "LinkedIn"):
            dropped = deactivate_stale_jobs(source=source, days_old=7)
            if dropped:
                print(f"Cleanup: {dropped} stale {source} job(s) marked inactive.")

        # ── 4. Regenerate matches for all students ────────
        print("\n--- Regenerating Matches ---")
        students = regenerate_all_matches()
        print(f"Matches refreshed for {students} student(s).")

    except Exception as e:
        print(f"Database sync failed: {e}")


if __name__ == "__main__":
    main()
