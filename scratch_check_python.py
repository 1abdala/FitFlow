import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
if not url or not key:
    raise RuntimeError("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable.")
supabase: Client = create_client(url, key)

def check_db():
    try:
        # Check Python in skills
        print("--- Skills matching Python ---")
        res = supabase.table("skills").select("*").ilike("name", "%python%").execute()
        for s in res.data:
            print(s)
            
        # Check student mapping
        print("\n--- User mapping for configured test user ---")
        # His user ID is 414be029-3fed-4811-bfc0-ff099313c2ca
        res2 = supabase.table("user_skills").select("skill_id, skills(name)").eq("user_id", "414be029-3fed-4811-bfc0-ff099313c2ca").execute()
        for s in res2.data:
            print(s)

        # Check matched skills for user
        print("\n--- Match results ---")
        res3 = supabase.table("matching_results").select("id, match_score, matched_skills_count").eq("student_id", "414be029-3fed-4811-bfc0-ff099313c2ca").limit(3).execute()
        for m in res3.data:
            print(m)
            
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    check_db()
