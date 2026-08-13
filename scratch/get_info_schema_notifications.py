import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/bodyg/OneDrive/Pictures/sem5/fyp-project/fitflow(1)/.env')

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

supabase = create_client(url, key)

def query_info_schema():
    try:
        query = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'"
        res = supabase.rpc("execute_sql", {"query": query}).execute()
        print("Notifications columns and data types:")
        for col in res.data:
            print(f" - {col['column_name']}: {col['data_type']}")
    except Exception as e:
        print("Error querying database catalog:", e)

if __name__ == "__main__":
    query_info_schema()
