import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Add project root to python path to import local modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def inspect_table(table_name):
    try:
        res = supabase.table(table_name).select("*").limit(1).execute()
        print(f"\n--- Table: {table_name} ---")
        if res.data:
            record = res.data[0]
            for col, val in record.items():
                print(f"  {col}: {type(val).__name__} (example: {val})")
        else:
            print("  No records found, but table exists.")
    except Exception as e:
        print(f"Error querying table {table_name}: {e}")

if __name__ == "__main__":
    inspect_table("profiles")
    inspect_table("student_profiles")
    inspect_table("users")
