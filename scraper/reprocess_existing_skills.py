import os
import sys
from dotenv import load_dotenv

# Ensure scraper directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scraper import extract_skills, classify_job
from db import get_supabase_client, regenerate_all_matches

def reprocess_all_jobs():
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
    supabase = get_supabase_client()
    
    print("Fetching all internships from database...")
    res = supabase.table("internships").select("id", "title", "company_name", "description").execute()
    jobs = res.data or []
    print(f"Found {len(jobs)} internships to reprocess.")
    
    for i, job in enumerate(jobs):
        job_id = job["id"]
        title = job["title"]
        company = job["company_name"]
        desc = job.get("description", "")
        
        print(f"\n[{i+1}/{len(jobs)}] Reprocessing '{title}' @ '{company}'")
        
        # 1. Extract new skills from the full description
        new_skills = extract_skills(desc)
        print(f"  -> Extracted Skills: {new_skills}")
        
        # 1.5 Classify job category & confidence and update core table
        try:
            category, confidence = classify_job(title, desc)
            print(f"  -> Classified Category: {category} (Confidence: {confidence})")
            supabase.table("internships").update({
                "category": category,
                "classification_confidence": confidence
            }).eq("id", job_id).execute()
        except Exception as e:
            print(f"  [ERROR] Failed to update category/confidence: {e}")
        
        # 2. Clear existing skill mappings for this job to avoid stale data
        try:
            supabase.table("internship_skills").delete().eq("internship_id", job_id).execute()
        except Exception as e:
            print(f"  [ERROR] Failed to clear old skills: {e}")
            continue
            
        # 3. Insert new skills
        for skill_name in new_skills:
            try:
                # Upsert skill into master taxonomy
                skill_res = supabase.table("skills").upsert(
                    [{"name": skill_name, "category": "General"}],
                    on_conflict="name"
                ).execute()

                if skill_res.data:
                    skill_id = skill_res.data[0]["id"]
                    # Link skill to internship
                    supabase.table("internship_skills").upsert(
                        [{"internship_id": job_id, "skill_id": skill_id}],
                        on_conflict="internship_id,skill_id"
                    ).execute()
            except Exception as e:
                print(f"  [Warning] Failed to bind skill '{skill_name}': {e}")
                
    # 4. Regenerate matches for all students
    print("\n--- Regenerating Match Scores for All Students ---")
    students = regenerate_all_matches()
    print(f"Matches successfully refreshed for {students} student(s)!")
    print("Reprocessing complete!")

if __name__ == "__main__":
    reprocess_all_jobs()
