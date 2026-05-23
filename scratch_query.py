import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

try:
    response = supabase.table("tracker_application_events").select("*").limit(1).execute()
    print("SUCCESS: Events Table exists!")
    print(f"Data schema fields: {response.data[0].keys() if response.data else 'No rows in events table yet, but table exists!'}")
except Exception as e:
    print(f"FAILED WITH ERROR: {e}")
