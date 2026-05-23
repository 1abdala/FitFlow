import os
from supabase import create_client, Client

from datetime import datetime, timedelta

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.")
        
    return create_client(url, key)

def deactivate_stale_jobs(source='JobStreet', days_old=7) -> int:
    """
    Mark jobs as inactive if not seen recently.
    Default to 1 day if running daily, to ensure stale jobs are hidden.
    """
    supabase = get_supabase_client()
    try:
        cutoff_date = (datetime.now() - timedelta(days=days_old)).isoformat()
        print(f"[CLEANUP] Deactivating jobs not seen since {cutoff_date}")
        
        res = supabase.table("internships")\
            .update({"is_active": False})\
            .eq("source", source)\
            .eq("is_active", True)\
            .lt("last_seen_at", cutoff_date)\
            .execute()
            
        count = len(res.data) if res.data else 0
        return count
    except Exception as e:
        print(f"Error deactivating stale jobs: {e}")
        return 0

def regenerate_all_matches() -> int:
    """
    After a scrape, call generate_internship_matches for every student in profiles
    so the UI shows fresh results immediately.
    """
    supabase = get_supabase_client()
    try:
        students = supabase.table("profiles").select("id").eq("role", "student").execute()
        count = 0
        for s in (students.data or []):
            supabase.rpc("generate_internship_matches", {"p_student_id": s["id"]}).execute()
            count += 1
        return count
    except Exception as e:
        print(f"Warning: match regeneration failed: {e}")
        return 0

def insert_internships(internships_data: list[dict]) -> int:
    """
    Inserts internships into the core table and dynamically synchronizes extracted 
    skills across the relational `skills` and `internship_skills` FitFlow tables.
    Includes last_seen_at timestamp for soft-deletion strategy.
    """
    if not internships_data:
        return 0

    supabase = get_supabase_client()
    inserted_count = 0
    current_time = datetime.now().isoformat()
    
    for payload in internships_data:
        # 1. Safely decouple dynamic data preventing Schema Cache Rejections
        job_core = dict(payload) # Copy payload to safely mutate
        skills = job_core.pop("required_skills", [])
        requirements = job_core.pop("requirements", None)
        salary = job_core.pop("salary", None)
        
        # Merge requirements and salary organically into the description payload for front-end rendering
        extended_details = ""
        
        if salary:
            extended_details += f"\n\n--- SALARY ---\n{salary}"
            
        if requirements:
            extended_details += f"\n\n--- TARGETED REQUIREMENTS ---\n{requirements}"
            
        if extended_details:
             job_core["description"] = f"{job_core.get('description', '')}{extended_details}"
            
        # Add timestamp and ensure active
        job_core["last_seen_at"] = current_time
        job_core["is_active"] = True
        
        # 2. Upsert Core Internship Record
        try:
            res = supabase.table("internships").upsert(
                [job_core], 
                on_conflict="apply_url"
            ).execute()
        except Exception as e:
            print(f"Skipping insert for {job_core.get('title')} due to DB constraint: {e}")
            continue

        if not res.data:
            continue
            
        internship_id = res.data[0]["id"]
        inserted_count += 1
        
        # 3. Seamlessly execute Relational Skill Binding
        for skill_name in skills:
            try:
                skill_res = supabase.table("skills").upsert(
                    [{"name": skill_name, "category": "General"}],
                    on_conflict="name"
                ).execute()

                if skill_res.data:
                    skill_id = skill_res.data[0]["id"]

                    supabase.table("internship_skills").upsert(
                        [{"internship_id": internship_id, "skill_id": skill_id}],
                        on_conflict="internship_id,skill_id"
                    ).execute()
            except Exception as e:
                print(f"Warning: Failed to lock skill '{skill_name}' to internship: {e}")
                 
    return inserted_count
