import os
import re
from supabase import create_client, Client
from dotenv import load_dotenv
from scraper import _TECH_TITLE_RE, NON_TECH_ANTI_KEYWORDS

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.")
    exit(1)

supabase: Client = create_client(url, key)

def cleanup_non_tech_jobs():
    print("--- Starting Non-Tech Internship Database Purge ---")
    
    # 1. Fetch all active internships
    res = supabase.table("internships").select("id, title, company_name").execute()
    data = res.data or []
    
    print(f"Total internships in database: {len(data)}")
    
    ids_to_delete = []
    
    for item in data:
        title = item['title']
        title_lower = title.lower()
        
        # 1. Must be an internship
        if "intern" not in title_lower:
            ids_to_delete.append(item['id'])
            print(f"  [DELETE - not an intern role] {title} @ {item['company_name']}")
            continue
            
        # 2. Must match tech regex
        if not _TECH_TITLE_RE.search(title_lower):
            ids_to_delete.append(item['id'])
            print(f"  [DELETE - non-tech title] {title} @ {item['company_name']}")
            continue
            
        # 3. Reject non-tech anti-keywords
        if any(kw in title_lower for kw in NON_TECH_ANTI_KEYWORDS):
            ids_to_delete.append(item['id'])
            print(f"  [DELETE - blocked domain] {title} @ {item['company_name']}")
            continue
            
    if not ids_to_delete:
        print("Database is already perfectly clean of non-tech roles!")
        return
        
    print(f"\nFound {len(ids_to_delete)} non-tech or generic internships to purge.")
    
    # Delete in batches
    batch_size = 50
    for i in range(0, len(ids_to_delete), batch_size):
        batch = ids_to_delete[i:i + batch_size]
        supabase.table("internships").delete().in_("id", batch).execute()
        print(f"Purged batch {i//batch_size + 1}")
        
    # Recalculate matches for all students to reflect clean matches instantly
    print("\nRefreshing student matches...")
    try:
        students = supabase.table("profiles").select("id").eq("role", "student").execute()
        for s in (students.data or []):
            supabase.rpc("generate_internship_matches", {"p_student_id": s["id"]}).execute()
        print("Matches successfully refreshed!")
    except Exception as e:
        print(f"Warning: match regeneration failed: {e}")

    print("Purge successfully completed.")

if __name__ == "__main__":
    cleanup_non_tech_jobs()
