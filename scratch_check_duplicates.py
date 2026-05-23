import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def check_duplicates():
    title = "Software Engineering Intern (AI-Enabled Development)"
    company = "Experian Marketing Services (Malaysia) Sdn Bhd"
    
    print(f"--- Searching for: {title} at {company} ---")
    res = supabase.table("internships")\
        .select("id, title, company_name, apply_url")\
        .eq("title", title)\
        .eq("company_name", company)\
        .execute()
    
    print(f"Found {len(res.data)} records:")
    for item in res.data:
        print(item)

if __name__ == "__main__":
    check_duplicates()
