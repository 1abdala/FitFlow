import os
from supabase import create_client, Client

url = "https://frsxpsgshyksykouzbfh.supabase.co"
key = os.environ.get("SUPABASE_SERVICE_KEY")
if not key:
    raise RuntimeError("Missing SUPABASE_SERVICE_KEY environment variable.")
supabase: Client = create_client(url, key)

def delete_bad_skills():
    print("Deleting 'Aws'...")
    supabase.table("skills").delete().eq("name", "Aws").execute()
    print("Deleted successfully!")

if __name__ == "__main__":
    delete_bad_skills()
