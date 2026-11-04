import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

print("Connecting to Supabase URL:", url)
supabase = create_client(url, key)

def test_writes():
    # 1. Fetch a student profile to test with
    res = supabase.table("profiles").select("id, role, full_name").eq("role", "student").limit(1).execute()
    if not res.data:
        print("No student profile found in database to test.")
        return
    
    student = res.data[0]
    student_id = student["id"]
    print(f"Testing write operations on student profile: ID={student_id}, Name={student['full_name']}")
    
    # 2. Query their student_profile details
    sub_res = supabase.table("student_profiles").select("phone, nationality").eq("id", student_id).execute()
    original_phone = None
    original_nationality = None
    if sub_res.data:
        original_phone = sub_res.data[0].get("phone")
        original_nationality = sub_res.data[0].get("nationality")
        print(f"Original Details -> Phone: {original_phone}, Nationality: {original_nationality}")
    
    # 3. Simulate handleSaveProfile steps
    print("\n--- Simulating handleSaveProfile writes ---")
    try:
        # Step 1: Update profiles
        print("1. Updating profile.full_name...")
        update_prof = supabase.table("profiles").update({"full_name": student["full_name"]}).eq("id", student_id).execute()
        print("   SUCCESS: Profile updated.")

        # Step 2: Upsert student_profiles
        print("2. Upserting student_profiles...")
        test_phone = "+60123456789"
        test_nationality = "Malaysian"
        upsert_sub = supabase.table("student_profiles").upsert({
            "id": student_id,
            "phone": test_phone,
            "nationality": test_nationality
        }).execute()
        print("   SUCCESS: Student profile upserted.")

        # Step 3: Run Match Engine RPC
        print("3. Calling generate_internship_matches RPC...")
        rpc_res = supabase.rpc("generate_internship_matches", {"p_student_id": student_id}).execute()
        print(f"   SUCCESS: RPC matched. Output: {rpc_res.data}")

        # 4. Revert to original
        print("\n--- Reverting test details to original state ---")
        supabase.table("student_profiles").upsert({
            "id": student_id,
            "phone": original_phone,
            "nationality": original_nationality
        }).execute()
        print("   SUCCESS: Reverted details.")
        
    except Exception as e:
        print(f"   ERROR encountered during simulation: {e}")

if __name__ == "__main__":
    test_writes()
