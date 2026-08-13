import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path='c:/Users/bodyg/OneDrive/Pictures/sem5/fyp-project/fitflow(1)/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

def sync_all():
    print("=== STARTING FULL SYNCHRONIZATION ===")
    
    # 1. Fetch all students from users table
    try:
        users_res = supabase.table("users").select("*").eq("role", "student").execute()
        students = users_res.data or []
        print(f"Found {len(students)} students in public.users.")
    except Exception as e:
        print(f"Failed to query public.users: {e}")
        return

    for u in students:
        uid = u["id"]
        email = u.get("email", "N/A")
        print(f"\nProcessing student: {email} ({uid})")
        
        # Check if profiles table has this student
        try:
            prof_res = supabase.table("profiles").select("*").eq("id", uid).execute()
            if not prof_res.data:
                print(f"  -> Profile record missing. Creating in public.profiles...")
                supabase.table("profiles").insert({
                    "id": uid,
                    "role": "student",
                    "full_name": u.get("name", "User")
                }).execute()
            else:
                print("  -> Profile record exists in public.profiles.")
        except Exception as e:
            print(f"  [WARNING] Skipping user {email} - profiles insert failed (likely doesn't exist in auth.users): {e}")
            continue

        # Check if student_profiles table has this student
        try:
            sp_res = supabase.table("student_profiles").select("*").eq("id", uid).execute()
            
            # Map fields from users to student_profiles schema
            sp_payload = {
                "id": uid,
                "phone": u.get("phone"),
                "nationality": u.get("nationality"),
                "dob": u.get("dob"),
                "gender": u.get("gender"),
                "address": u.get("address"),
                "oku_status": u.get("oku_status"),
                "matric": u.get("matric"),
                "faculty": u.get("faculty"),
                "programme": u.get("programme"),
                "year_of_study": int(u.get("yearOfStudy")) if u.get("yearOfStudy") and str(u.get("yearOfStudy")).isdigit() else None,
                "semester": int(u.get("semester")) if u.get("semester") and str(u.get("semester")).isdigit() else None,
                "preferred_location": u.get("preferredLocation"),
                "preferred_industry": u.get("preferredIndustry")
            }
            
            if not sp_res.data:
                print(f"  -> student_profile record missing. Inserting into public.student_profiles...")
                supabase.table("student_profiles").insert(sp_payload).execute()
            else:
                print(f"  -> student_profile record exists. Updating public.student_profiles...")
                supabase.table("student_profiles").update(sp_payload).eq("id", uid).execute()
        except Exception as e:
            print(f"  [ERROR] Failed to update/insert student_profiles for {email}: {e}")
            continue

        # Sync skills to user_skills table
        skills = u.get("skills") or []
        print(f"  -> Syncing skills from users.skills array ({len(skills)} skills): {skills}")
        for s in skills:
            if not s or not s.strip():
                continue
            try:
                # Call get_or_create_skill RPC to canonicalize
                skill_res = supabase.rpc("get_or_create_skill", {"p_name": s}).execute()
                skill_id = skill_res.data
                if skill_id:
                    supabase.table("user_skills").upsert({
                        "user_id": uid,
                        "skill_id": skill_id
                    }, on_conflict="user_id,skill_id").execute()
            except Exception as e:
                print(f"     [ERROR] Failed to upsert skill '{s}': {e}")

        # Re-run matching RPC
        print("  -> Regenerating matches via generate_internship_matches RPC...")
        try:
            supabase.rpc("generate_internship_matches", {"p_student_id": uid}).execute()
            print("     Matches regenerated successfully.")
        except Exception as e:
            print(f"     [ERROR] RPC failed: {e}")

    # 2. Delete matches for inactive internships globally
    print("\n=== CLEANING UP INACTIVE INTERNSHIP MATCHES ===")
    try:
        inactive_jobs_res = supabase.table("internships").select("id, title").eq("is_active", False).execute()
        inactive_jobs = inactive_jobs_res.data or []
        print(f"Found {len(inactive_jobs)} inactive internships in database.")
        
        inactive_ids = [j["id"] for j in inactive_jobs]
        if inactive_ids:
            # Delete matches in batches of 100
            total_deleted = 0
            for i in range(0, len(inactive_ids), 100):
                batch = inactive_ids[i:i+100]
                del_res = supabase.table("matching_results").delete().in_("internship_id", batch).execute()
                total_deleted += len(del_res.data or [])
            print(f"Deleted {total_deleted} matching rows for inactive internships.")
        else:
            print("No inactive internships to clean up.")
    except Exception as e:
        print(f"Failed to clean up inactive matches: {e}")

    print("\n=== SYNCHRONIZATION COMPLETE ===")

if __name__ == "__main__":
    sync_all()
