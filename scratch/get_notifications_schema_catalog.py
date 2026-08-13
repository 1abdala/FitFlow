import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/bodyg/OneDrive/Pictures/sem5/fyp-project/fitflow(1)/.env')

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def get_db_schema():
    try:
        # We can query Postgrest's schema by asking for the OpenAPI description, or run a query if we have a custom RPC or query info schema.
        # But wait! Postgrest has a schema definition on '/' (GET request with headers for openapi).
        # Let's run a GET request to Postgrest to inspect the schema of notifications.
        # Actually, let's try a simple RPC if we have execute_sql, or let's write a python query that queries a dummy select.
        # Wait, since the error said: "Could not find the 'message' column of 'notifications' in the schema cache", 
        # it means the column 'message' is missing but other columns exist.
        # Let's try to query an empty SELECT * from notifications or write a script that queries details.
        # Wait, let's try to query a select with other columns. For example: select("id, student_id, title, read, created_at").
        # If we select * it might work if we select from notifications table. Let's see:
        res = supabase.table("notifications").select("id").limit(1).execute()
        print("Table 'notifications' exists! Querying id succeeded.")
    except Exception as e:
        print("Error querying notifications:", e)

if __name__ == "__main__":
    get_db_schema()
