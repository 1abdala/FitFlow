import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def cleanup():
    print("--- Starting Internship Cleanup ---")
    
    # 1. Fetch all internships
    res = supabase.table("internships").select("id, title, company_name, apply_url").execute()
    data = res.data
    
    seen = {}
    ids_to_delete = []
    
    for item in data:
        # Normalize the URL for comparison
        clean_url = item['apply_url']
        if "?" in clean_url:
            clean_url = clean_url.split("?")[0]
        if "#" in clean_url:
            clean_url = clean_url.split("#")[0]
            
        # Use (title, company, clean_url) as the unique key
        key = (item['title'], item['company_name'], clean_url)
        
        if key in seen:
            ids_to_delete.append(item['id'])
        else:
            seen[key] = item['id']
            
    if not ids_to_delete:
        print("No duplicates detected after normalization.")
        return
        
    print(f"Found {len(ids_to_delete)} duplicate rows to remove.")
    
    # Delete in batches (Supabase limit)
    batch_size = 50
    for i in range(0, len(ids_to_delete), batch_size):
        batch = ids_to_delete[i:i + batch_size]
        supabase.table("internships").delete().in_("id", batch).execute()
        print(f"Deleted batch {i//batch_size + 1}")

    print("Cleanup completed successfully.")

if __name__ == "__main__":
    cleanup()
