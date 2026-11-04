import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def test_insert():
    try:
        student_res = supabase.table("profiles").select("id").eq("role", "student").limit(1).execute()
        if student_res.data:
            student_id = student_res.data[0]["id"]
            res = supabase.table("notifications").insert({"student_id": student_id}).execute()
            if res.data:
                print("SUCCESS! Returned columns:", list(res.data[0].keys()))
                print("Returned data:", res.data[0])
                # Clean up
                supabase.table("notifications").delete().eq("id", res.data[0]["id"]).execute()
            else:
                print("Insert succeeded but returned no data.")
        else:
            print("No student found.")
    except Exception as e:
        print("Error during test insert:", e)

if __name__ == "__main__":
    test_insert()
