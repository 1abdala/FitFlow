import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

student_id = "2ed289cb-7226-4f2f-b112-c01c4c2179f0"

def view_matches():
    # Fetch all matches for the student
    res = supabase.table("matching_results")\
        .select("id, match_score, matched_skills_count, total_required_skills, internships(id, title, company_name, is_active)")\
        .eq("student_id", student_id)\
        .execute()
    
    matches = res.data or []
    print(f"Total Matches: {len(matches)}")
    print(f"{'Title':<50} | {'Company':<30} | {'Score':<6} | {'Matched':<7} | {'Total':<5} | {'Active':<6}")
    print("-" * 115)
    for m in matches:
        job = m.get("internships") or {}
        title = job.get("title", "N/A")[:48]
        company = job.get("company_name", "N/A")[:28]
        score = m.get("match_score")
        matched = m.get("matched_skills_count")
        total = m.get("total_required_skills")
        active = job.get("is_active")
        print(f"{title:<50} | {company:<30} | {score:<6} | {matched:<7} | {total:<5} | {active:<6}")

if __name__ == "__main__":
    view_matches()
