import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def has_value(val):
    if val is None:
        return False
    if isinstance(val, str):
        return len(val.strip()) > 0
    if isinstance(val, (int, float)):
        return True
    return bool(val)

def get_profile_status(profile, skills):
    required_fields = [
        'full_name',
        'phone', 
        'dob', 
        'nationality', 
        'gender',
        'matric', 
        'faculty', 
        'programme', 
        'year_of_study', 
        'semester', 
        'preferred_location'
    ]
    
    completed_count = 0
    required_missing = []
    
    for f in required_fields:
        val = profile.get(f)
        if f == 'full_name' and not has_value(val):
            val = profile.get('name')
            
        if has_value(val):
            completed_count += 1
        else:
            required_missing.append(f)
            
    # Check preferred_roles
    p_roles = profile.get('preferred_roles')
    if p_roles and isinstance(p_roles, list) and len(p_roles) > 0:
        completed_count += 1
    else:
        required_missing.append('preferred_roles')
        
    # Check skills
    if skills and isinstance(skills, list) and len(skills) > 0:
        completed_count += 1
    else:
        required_missing.append('skills')
        
    total_fields = len(required_fields) + 2 # 11 required + preferred_roles + skills = 13 total
    percentage = round((completed_count / total_fields) * 100)
    
    # Profile is complete if required_fields (excluding skills) are filled
    completed = len([m for m in required_missing if m != 'skills']) == 0
    
    return completed, percentage, required_missing

def main():
    print("Fetching base profiles...")
    profiles_res = supabase.table("profiles").select("*").execute()
    base_profiles = {p['id']: p for p in profiles_res.data}
    
    print("Fetching student profiles...")
    students_res = supabase.table("student_profiles").select("*").execute()
    student_profiles = students_res.data
    
    print("Fetching user skills...")
    # Fetch skill names by joining user_skills and skills
    user_skills_res = supabase.table("user_skills").select("user_id, skills:skill_id(name)").execute()
    
    user_skills = {}
    for us in user_skills_res.data:
        uid = us['user_id']
        skill_name = us.get('skills', {}).get('name')
        if skill_name:
            if uid not in user_skills:
                user_skills[uid] = []
            user_skills[uid].append(skill_name)
            
    print(f"Loaded {len(student_profiles)} student profiles.")
    
    updated_count = 0
    complete_count = 0
    incomplete_count = 0
    
    for sp in student_profiles:
        uid = sp['id']
        bp = base_profiles.get(uid, {})
        
        # Merge base profile and student sub-profile
        merged = {**bp, **sp}
        skills = user_skills.get(uid, [])
        
        completed, percentage, missing = get_profile_status(merged, skills)
        
        # Update in database
        print(f"User: {bp.get('full_name') or uid} | Percentage: {percentage}% | Completed: {completed} | Missing: {missing}")
        
        supabase.table("student_profiles").update({
            "profile_completed": completed
        }).eq("id", uid).execute()
        
        updated_count += 1
        if completed:
            complete_count += 1
        else:
            incomplete_count += 1
            
    print("\n================ RECALCULATION COMPLETE ================")
    print(f"Total Student Profiles Processed: {updated_count}")
    print(f"Complete Profiles: {complete_count}")
    print(f"Incomplete Profiles: {incomplete_count}")

if __name__ == "__main__":
    main()
