import os
import requests
from dotenv import load_dotenv

load_dotenv(r"c:\Users\bodyg\OneDrive\Pictures\sem5\fyp-project\fitflow(1)\.env")
url = os.environ.get("SUPABASE_URL")
service_key = os.environ.get("SUPABASE_SERVICE_KEY")
headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}

try:
    resp = requests.get(url + "/rest/v1/", headers=headers)
    schema = resp.json()
    paths = schema.get("paths", {})
    
    print("Exposed RPC functions:")
    for path in paths:
        if path.startswith("/rpc/"):
            print(f"  {path}")
            # print parameters
            post_info = paths[path].get("post", {})
            params = post_info.get("parameters", [])
            for p in params:
                if p.get("name") == "args":
                    schema = p.get("schema", {})
                    properties = schema.get("properties", {})
                    print(f"    Parameters: {list(properties.keys())}")
except Exception as e:
    print(f"Error: {e}")
