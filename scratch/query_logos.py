import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Add project root to python path to import local modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

try:
    # 1. Check if column exists by querying one record
    response = supabase.table("internships").select("*").limit(1).execute()
    if response.data:
        record = response.data[0]
        print("SUCCESS: Connected to internships table!")
        print("Available fields:", list(record.keys()))
        if "company_logo_url" in record:
            print("company_logo_url column EXISTS!")
        else:
            print("company_logo_url column DOES NOT EXIST!")
    else:
        print("SUCCESS: Table is empty, but query succeeded.")

    # 2. Get counts
    total_res = supabase.table("internships").select("id, company_logo_url, is_active, source").execute()
    if total_res.data:
        jobs = total_res.data
        total_jobs = len(jobs)
        active_jobs = sum(1 for j in jobs if j.get("is_active"))
        jobs_with_logo = sum(1 for j in jobs if j.get("company_logo_url"))
        active_with_logo = sum(1 for j in jobs if j.get("is_active") and j.get("company_logo_url"))
        
        print(f"\n--- Statistics ---")
        print(f"Total Internships: {total_jobs}")
        print(f"Active Internships: {active_jobs}")
        print(f"Internships with Logo URL: {jobs_with_logo}")
        print(f"Active Internships with Logo URL: {active_with_logo}")
        
        # Breakdown by source
        sources = set(j.get("source") for j in jobs)
        for src in sources:
            src_jobs = [j for j in jobs if j.get("source") == src]
            src_total = len(src_jobs)
            src_active = sum(1 for j in src_jobs if j.get("is_active"))
            src_with_logo = sum(1 for j in src_jobs if j.get("company_logo_url"))
            print(f"\nSource '{src}':")
            print(f"  Total: {src_total}")
            print(f"  Active: {src_active}")
            print(f"  With logo: {src_with_logo}")
            
            # Print a few examples
            if src_with_logo > 0:
                print("  Examples with logo:")
                examples = [j for j in src_jobs if j.get("company_logo_url")][:3]
                for ex in examples:
                    # Fetch title/company if needed, but we only selected id and logo. Let's query details for these
                    details = supabase.table("internships").select("title, company_name, company_logo_url").eq("id", ex["id"]).execute()
                    if details.data:
                        d = details.data[0]
                        print(f"    - {d['title']} @ {d['company_name']}")
                        print(f"      Logo URL: {d['company_logo_url']}")
    else:
        print("No internship rows found in database.")

except Exception as e:
    print(f"FAILED WITH ERROR: {e}")
