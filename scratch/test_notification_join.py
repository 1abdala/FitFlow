import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/bodyg/OneDrive/Pictures/sem5/fyp-project/fitflow(1)/.env')

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def test_join():
    try:
        # Let's try to query notifications with nested internships details
        # We can simulate the JS join:
        # select('id, type, is_read, sent_at, internship_id, internships(title, company_name)')
        res = supabase.table("notifications").select("id, type, is_read, sent_at, internship_id, internships(title, company_name)").limit(1).execute()
        print("SUCCESS! PostgREST join query works.")
        print("Data:", res.data)
    except Exception as e:
        print("Error during join query:", e)

if __name__ == "__main__":
    test_join()
