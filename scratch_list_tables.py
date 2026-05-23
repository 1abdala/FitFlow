import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def list_tables():
    # Use the RPC that usually exists or just try to select from a few common ones
    # Actually, let's try to get table names from information_schema
    res = supabase.rpc("execute_sql", {"query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"}).execute()
    print(res.data)

if __name__ == "__main__":
    list_tables()
