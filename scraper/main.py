import os
import sys
import traceback
from dotenv import load_dotenv

# Ensure local scraper directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper import scrape_internships
from scraper_linkedin import scrape_linkedin_internships
from db import (
    insert_internships, 
    deactivate_stale_jobs, 
    regenerate_all_matches,
    create_scrape_run,
    update_scrape_run
)
from alerts import send_telegram_alert

def main():
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

    print("=" * 50)
    print("  FitFlow Internship Extraction Service")
    print("=" * 50)

    # Initialize tracking variables
    total_found = 0
    total_processed = 0
    total_failed = 0
    
    # ── 1. Create Scraper Run Log ─────────────────────────
    run_id = create_scrape_run()
    print(f"[MONITOR] Initialized Scraper Run Log ID: {run_id}")

    try:
        all_jobs = []

        # ── 2. JobStreet Scraper ───────────────────────────
        print("\n[1/2] JobStreet Scraper")
        try:
            jobstreet_jobs = scrape_internships()
            raw_js_count = len(jobstreet_jobs)
            jobstreet_jobs = [j for j in jobstreet_jobs if not j.pop("_drop", False)]
            filtered_js_count = len(jobstreet_jobs)
            print(f"  -> Discovered {raw_js_count} tech internships, kept {filtered_js_count} after tech filters.")
            total_found += raw_js_count
            total_failed += (raw_js_count - filtered_js_count)
            all_jobs.extend(jobstreet_jobs)
        except Exception as e:
            print(f"  [ERROR] JobStreet scraper execution failed: {e}")
            raise

        # ── 3. LinkedIn Scraper ────────────────────────────
        print("\n[2/2] LinkedIn Scraper")
        try:
            linkedin_jobs = scrape_linkedin_internships()
            raw_li_count = len(linkedin_jobs)
            linkedin_jobs = [j for j in linkedin_jobs if not j.pop("_drop", False)]
            filtered_li_count = len(linkedin_jobs)
            print(f"  -> Discovered {raw_li_count} tech internships, kept {filtered_li_count} after tech filters.")
            total_found += raw_li_count
            total_failed += (raw_li_count - filtered_li_count)
            all_jobs.extend(linkedin_jobs)
        except Exception as e:
            print(f"  [ERROR] LinkedIn scraper execution failed: {e}")
            raise

        # ── Summary ───────────────────────────────────────────
        print(f"\n{'=' * 50}")
        print(f"  Total scraped: {len(all_jobs)} internships")
        print(f"  JobStreet: {len(jobstreet_jobs)}  |  LinkedIn: {len(linkedin_jobs)}")
        print(f"{'=' * 50}")

        if not all_jobs:
            print("No jobs found to sync. Finalizing run.")
            update_scrape_run(
                run_id=run_id,
                status="success",
                total_found=total_found,
                total_processed=0,
                total_failed=total_failed
            )
            return

        # ── 4. Sync to Supabase ───────────────────────────────
        print("\n--- Database Synchronization ---")
        processed, failed = insert_internships(all_jobs)
        total_processed += processed
        total_failed += failed
        print(f"Upsert complete: {processed} rows synced, {failed} rows failed validation.")

        # Deactivate stale listings per source (3-consecutive missed scrapes rule)
        for source in ("JobStreet", "LinkedIn"):
            dropped = deactivate_stale_jobs(source=source)
            if dropped:
                print(f"Cleanup: {dropped} stale {source} job(s) marked inactive.")

        # ── 5. Regenerate matches for all students ───────────
        print("\n--- Regenerating Matches ---")
        students = regenerate_all_matches()
        print(f"Matches refreshed for {students} student(s).")

        # ── 6. Log Run Success ───────────────────────────────
        update_scrape_run(
            run_id=run_id,
            status="success",
            total_found=total_found,
            total_processed=total_processed,
            total_failed=total_failed
        )
        print("\nScraper pipeline successfully completed!")

    except Exception as e:
        error_msg = str(e)
        tb_str = traceback.format_exc()
        
        print(f"\n[FATAL] Scraper pipeline failed: {error_msg}")
        print(tb_str)
        
        # Log failure metrics
        update_scrape_run(
            run_id=run_id,
            status="failed",
            total_found=total_found,
            total_processed=total_processed,
            total_failed=total_failed + (total_found - total_processed),
            error_message=f"{error_msg}\n{tb_str}"
        )
        
        # Send Telegram notification alert
        send_telegram_alert(run_id=run_id, error_message=error_msg, traceback_str=tb_str)
        
        # Exit with error status code for workflow runner
        sys.exit(1)

if __name__ == "__main__":
    main()
