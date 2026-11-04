import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def check_users():
    res = supabase.table("profiles").select("*").execute()
    profiles = {p['id']: p for p in res.data}
    
    res_sub = supabase.table("student_profiles").select("*").execute()
    for sp in res_sub.data:
        uid = sp['id']
        bp = profiles.get(uid, {})
        name = bp.get("full_name") or bp.get("name") or "Unknown"
        print(f"\nUser Name: {name} (ID: {uid})")
        print(f"  profile_completed (db column): {sp.get('profile_completed')}")
        print("  Base Profile fields:")
        for k, v in bp.items():
            if k != 'id':
                print(f"    {k}: {v}")
        print("  Student Profile fields:")
        for k, v in sp.items():
            if k != 'id':
                print(f"    {k}: {v}")

if __name__ == "__main__":
    check_users()
