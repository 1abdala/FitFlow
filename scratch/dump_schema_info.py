import os
import requests
from dotenv import load_dotenv

load_dotenv(r"c:\Users\bodyg\OneDrive\Pictures\sem5\fyp-project\fitflow(1)\.env")
url = os.environ.get("SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_KEY")
headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}

try:
    resp = requests.get(url + "/rest/v1/?apikey=" + service_key, headers=headers)
    schema = resp.json()
    print("Definitions keys:")
    print(list(schema.get("definitions", {}).keys()))
    
    # Print definitions for notifications
    definitions = schema.get("definitions", {})
    if "notifications" in definitions:
        import json
        print("\n--- notifications table schema ---")
        print(json.dumps(definitions["notifications"], indent=2))
    else:
        print("\n'notifications' not found in definitions")
except Exception as e:
    print("Error:", e)
