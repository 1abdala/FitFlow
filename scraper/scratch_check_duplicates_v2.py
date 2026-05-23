import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Path to .env is in the current directory (scraper/)
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def check_duplicates():
    print("--- Checking for duplicate titles/companies in internships table ---")
    
    # Query all internships
    res = supabase.table("internships").select("title, company_name, apply_url").execute()
    
    data = res.data
    seen = {}
    duplicates = []
    
    for item in data:
        key = (item['title'], item['company_name'])
        if key in seen:
            duplicates.append((key, item['apply_url'], seen[key]))
        else:
            seen[key] = item['apply_url']
            
    if not duplicates:
        print("No duplicates found by title/company.")
    else:
        print(f"Found {len(duplicates)} duplicates!")
        for key, url1, url2 in duplicates[:5]:
            print(f"Title: {key[0]}")
            print(f"Company: {key[1]}")
            print(f"URL 1: {url1}")
            print(f"URL 2: {url2}")
            print("-" * 20)

if __name__ == "__main__":
    check_duplicates()
