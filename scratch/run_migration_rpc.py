import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/bodyg/OneDrive/Pictures/sem5/fyp-project/fitflow(1)/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def run_migration():
    ddl = "ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE;"
    print("Running DDL migration via execute_sql RPC...")
    try:
        res = supabase.rpc("execute_sql", {"query": ddl}).execute()
        print("Migration Result:", res.data)
        
        # Tell PostgREST to refresh schema cache
        reload_res = supabase.rpc("execute_sql", {"query": "NOTIFY pgrst, 'reload schema';"}).execute()
        print("Reload Result:", reload_res.data)
        print("Migration and reload successfully executed!")
    except Exception as e:
        print("Failed to run migration:", e)

if __name__ == "__main__":
    run_migration()
