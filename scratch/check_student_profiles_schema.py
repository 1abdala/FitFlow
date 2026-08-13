import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/bodyg/OneDrive/Pictures/sem5/fyp-project/fitflow(1)/.env')
url = os.environ.get("SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_KEY")
headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}

try:
    resp = requests.get(url + "/rest/v1/", headers=headers)
    schema = resp.json()
    definitions = schema.get("definitions", {})
    if "student_profiles" in definitions:
        print("\n--- student_profiles table schema ---")
        properties = definitions["student_profiles"].get("properties", {})
        for col, details in properties.items():
            print(f"Column: {col} | Type: {details.get('type')} | Format: {details.get('format')} | Description: {details.get('description')}")
    else:
        print("\n'student_profiles' not found in definitions")
except Exception as e:
    print("Error:", e)
