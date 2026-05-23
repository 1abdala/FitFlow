import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def run_migration():
    # Since we can't easily run raw SQL DDL through the python client without a specific RPC
    # and the MCP tool is unauthorized, we'll assume the user might have to run this in their 
    # Supabase SQL Editor, OR we can try to use the 'postgrest' way if possible.
    # However, usually DDL requires the SQL tool. 
    # I'll try to use the 'execute_sql' RPC if it exists in the project.
    
    sql = """
    ALTER TABLE internships 
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();
    CREATE INDEX IF NOT EXISTS idx_internships_last_seen ON internships(last_seen_at);
    """
    
    print("Please run the following SQL in your Supabase SQL Editor:")
    print(sql)

if __name__ == "__main__":
    run_migration()
