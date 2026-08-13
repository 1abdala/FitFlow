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

companies = ["Astro", "Infineon Technologies", "Grab", "Sunway Berhad", "Neusoft Malaysia Sdn Bhd"]

try:
    print("Checking specific companies in internships table:")
    for co in companies:
        res = supabase.table("internships")\
            .select("id, title, company_name, is_active, company_logo_url")\
            .ilike("company_name", f"%{co}%")\
            .execute()
            
        print(f"\nResults for '{co}':")
        if res.data:
            for d in res.data:
                print(f"  - Title: {d['title']}")
                print(f"    Company: {d['company_name']}")
                print(f"    Active: {d['is_active']}")
                print(f"    Logo URL: {d['company_logo_url']}")
        else:
            print("  No records found.")
except Exception as e:
    print("Error:", e)
