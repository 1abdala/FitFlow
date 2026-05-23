import os
from supabase import create_client, Client
from scraper import extract_skills

url = "https://frsxpsgshyksykouzbfh.supabase.co"
key = os.environ.get("SUPABASE_SERVICE_KEY", "sb_secret_QioAJdvG_D3ejbfMosI-kg_mZNslB-Y")
supabase: Client = create_client(url, key)

def upgrade_database():
    try:
        print("Fetching all internships to apply NLP upgrades...")
        res = supabase.table("internships").select("id, description").execute()
        jobs = res.data
        
        print(f"Found {len(jobs)} internships in database.")
        
        updated_count = 0
        for job in jobs:
            text = job.get('description') or ""
            skills = extract_skills(text)
            
            if skills:
                # Resolve skill globally
                for s in skills:
                    skill_res = supabase.rpc("get_or_create_skill", {"p_name": s}).execute()
                    skill_id = skill_res.data
                    
                    if skill_id:
                        # Insert relationship with ON CONFLICT DO NOTHING natively handled by the FK constraints if we pass it
                        supabase.table("internship_skills").upsert({
                            "internship_id": job['id'],
                            "skill_id": skill_id
                        }, on_conflict="internship_id, skill_id").execute()
                updated_count += 1
                
        print(f"Successfully NLP-scanned and synchronized {updated_count} internships!")
        
        print("Recalculating matched skill constraints for User (abullahageep@gmail.com)...")
        supabase.rpc("generate_internship_matches", {"p_student_id": "414be029-3fed-4811-bfc0-ff099313c2ca"}).execute()
        
        print("Matches successfully recalculated globally.")
    except Exception as e:
        print("FAILED WITH ERROR:", e)

if __name__ == "__main__":
    upgrade_database()
