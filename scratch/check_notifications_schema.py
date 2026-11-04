import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def check_notifications():
    try:
        # Check if table exists and get columns
        res = supabase.table("notifications").select("*").limit(1).execute()
        if res.data:
            print("Notifications columns:", list(res.data[0].keys()))
        else:
            print("Notifications table exists but is empty. Let's try to query info_schema or describe it.")
            # Let's insert a test notification to see if it succeeds
            # First, get a student ID
            student_res = supabase.table("profiles").select("id").eq("role", "student").limit(1).execute()
            if student_res.data:
                student_id = student_res.data[0]["id"]
                print(f"Inserting test notification for student: {student_id}")
                insert_res = supabase.table("notifications").insert({
                    "student_id": student_id,
                    "title": "Welcome to FitFlow",
                    "type": "system"
                }).execute()
                print("Insert success! Columns:", list(insert_res.data[0].keys()))
                # Cleanup
                supabase.table("notifications").delete().eq("id", insert_res.data[0]["id"]).execute()
                print("Cleanup success.")
            else:
                print("No student found to test insertion.")
    except Exception as e:
        print("Error checking notifications table:", e)

if __name__ == "__main__":
    check_notifications()
