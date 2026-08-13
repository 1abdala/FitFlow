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

try:
    res = supabase.table("internships")\
        .select("id, title, company_name, apply_url")\
        .eq("source", "LinkedIn")\
        .eq("is_active", True)\
        .is_("company_logo_url", None)\
        .execute()
        
    print(f"Found {len(res.data) if res.data else 0} active LinkedIn internships with missing logos:")
    if res.data:
        for i, d in enumerate(res.data):
            print(f"{i+1}. {d['title']} @ {d['company_name']}")
            print(f"   URL: {d['apply_url']}")
except Exception as e:
    print("Error:", e)
