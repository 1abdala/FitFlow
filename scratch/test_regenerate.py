import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

student_id = "2ed289cb-7226-4f2f-b112-c01c4c2179f0"
coke_id = "a93ba6d6-bdc4-4d90-bc71-d8f159fbb231"
westcon_id = "fc430e9a-0cb4-48c4-a595-a6bf8994e5fa"

def test_regenerate():
    print("Deleting existing matching results for student...")
    try:
        del_res = supabase.table("matching_results").delete().eq("student_id", student_id).execute()
        print(f"Deleted {len(del_res.data or [])} matching rows.")
    except Exception as e:
        print(f"Failed to delete matching results: {e}")
        return

    print("Calling generate_internship_matches RPC...")
    try:
        rpc_res = supabase.rpc("generate_internship_matches", {"p_student_id": student_id}).execute()
        print("RPC executed successfully. Return value:", rpc_res.data)
    except Exception as e:
        print(f"RPC failed: {e}")
        return

    # Check new match results
    print("\nFetching updated Coca-Cola match...")
    coke_match = supabase.table("matching_results").select("*").eq("student_id", student_id).eq("internship_id", coke_id).execute()
    print("New Coca-Cola Match Row:", coke_match.data)

    print("\nFetching updated Westcon match...")
    westcon_match = supabase.table("matching_results").select("*").eq("student_id", student_id).eq("internship_id", westcon_id).execute()
    print("New Westcon Match Row:", westcon_match.data)

if __name__ == "__main__":
    test_regenerate()
