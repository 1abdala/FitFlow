import os
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "https://frsxpsgshyksykouzbfh.supabase.co")
key = os.environ.get("SUPABASE_SERVICE_KEY", "sb_secret_QioAJdvG_D3ejbfMosI-kg_mZNslB-Y")
supabase: Client = create_client(url, key)

try:
    response = supabase.table("matching_results").select("id, match_score, internships(title, company_name, location, apply_url), skill_gaps(skills(name))").execute()
    print("SUCCESS")
    print(f"Returned {len(response.data)} matches.")
except Exception as e:
    print(f"FAILED WITH ERROR: {e}")
