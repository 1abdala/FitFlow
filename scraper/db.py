import os
import requests
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file.")
        
    return create_client(url, key)

# ── 1. Scraper Monitoring (scrape_runs tracking) ─────────────

def create_scrape_run() -> str:
    """Creates a new run record in scrape_runs table with status 'running' and returns the run ID."""
    supabase = get_supabase_client()
    try:
        res = supabase.table("scrape_runs").insert({
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "total_found": 0,
            "total_processed": 0,
            "total_failed": 0
        }).execute()
        
        if res.data:
            return res.data[0]["id"]
        raise RuntimeError("No data returned from scrape_runs insert.")
    except Exception as e:
        print(f"[ERROR] Failed to create scrape run: {e}")
        # Return a fallback string ID if DB is down, to prevent scraper crash
        return "fallback-run-id"

def update_scrape_run(run_id: str, status: str, total_found: int, total_processed: int, total_failed: int, error_message: str = None):
    """Updates the run record with final statistics and completed status."""
    if run_id == "fallback-run-id":
        return
    supabase = get_supabase_client()
    try:
        payload = {
            "status": status,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "total_found": total_found,
            "total_processed": total_processed,
            "total_failed": total_failed
        }
        if error_message:
            payload["error_message"] = error_message
            
        supabase.table("scrape_runs").update(payload).eq("id", run_id).execute()
        print(f"[MONITOR] Scrape run {run_id} updated with status: {status}")
    except Exception as e:
        print(f"[ERROR] Failed to update scrape run {run_id}: {e}")

# ── 2. Expiration Logic: 3-Consecutive Missed Scrapes ────────

def deactivate_stale_jobs(source='JobStreet') -> int:
    """
    Deactivates jobs from a given source that have missed 3 consecutive successful scraper runs.
    Uses the 3rd most recent successful run's completed_at time as the cutoff threshold.
    """
    supabase = get_supabase_client()
    try:
        print(f"[CLEANUP] Executing 3-consecutive missed scrapes check for {source}...")
        
        # Query the last 3 successful runs
        runs_res = supabase.table("scrape_runs")\
            .select("completed_at")\
            .eq("status", "success")\
            .order("completed_at", desc=True)\
            .limit(3)\
            .execute()
            
        if runs_res.data and len(runs_res.data) >= 3:
            cutoff_date = runs_res.data[2]["completed_at"]
            print(f"[CLEANUP] Found 3 successful runs. Cutoff date set to 3rd run completed_at: {cutoff_date}")
        else:
            # Fallback: if we don't have 3 runs yet, use a safe 14-day threshold
            cutoff_date = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
            print(f"[CLEANUP] Less than 3 successful runs in history. Using fallback 14-day threshold: {cutoff_date}")
            
        res = supabase.table("internships")\
            .update({"is_active": False})\
            .eq("source", source)\
            .eq("is_active", True)\
            .lt("last_seen_at", cutoff_date)\
            .execute()
            
        count = len(res.data) if res.data else 0
        return count
    except Exception as e:
        print(f"Error deactivating stale jobs: {e}")
        return 0

# ── 3. Internship Validation Layer ───────────────────────────

def validate_internship(job: dict) -> bool:
    """
    Validates the job schema constraints and checks URL reachability (allows 200, 301, 302, 307, 308).
    """
    title = job.get("title")
    company = job.get("company_name")
    url = job.get("apply_url")
    description = job.get("description", "")
    
    # 1. Standard Content validation checks
    if not title or not title.strip():
        print(f"  [VALIDATION FAILED] Title is empty.")
        return False
    if not company or not company.strip():
        print(f"  [VALIDATION FAILED] Company name is empty for '{title}'.")
        return False
    if not url or not url.strip() or not url.startswith("http"):
        print(f"  [VALIDATION FAILED] Invalid apply URL: '{url}' for '{title}'.")
        return False
    if not description or len(description.strip()) < 200:
        print(f"  [VALIDATION FAILED] Description is too short ({len(description) if description else 0} chars) for '{title}'.")
        return False

    # 2. HTTP validation (allows redirects)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    allowed_statuses = {200, 301, 302, 307, 308}
    
    try:
        # Try HEAD request first for lightweight validation (disable auto redirects)
        resp = requests.head(url, headers=headers, timeout=8, allow_redirects=False)
        
        # If HEAD method is rejected (e.g. 403, 405), try a lightweight streaming GET
        if resp.status_code not in allowed_statuses:
            resp = requests.get(url, headers=headers, timeout=8, allow_redirects=False, stream=True)
            
        status = resp.status_code
        if status not in allowed_statuses:
            print(f"  [VALIDATION FAILED] URL accessibility returned HTTP {status} (expected {allowed_statuses}) for '{title}' @ {url}")
            return False
            
    except Exception as e:
        print(f"  [VALIDATION FAILED] URL connection failed: {e} for '{title}' @ {url}")
        return False
        
    return True

# ── 4. Ingestion Sync Layer ──────────────────────────────────

def regenerate_all_matches() -> int:
    """
    After a scrape, call generate_internship_matches for every student in profiles
    so the UI shows fresh results immediately.
    """
    supabase = get_supabase_client()
    try:
        students = supabase.table("profiles").select("id").eq("role", "student").execute()
        count = 0
        for s in (students.data or []):
            supabase.rpc("generate_internship_matches", {"p_student_id": s["id"]}).execute()
            count += 1
        return count
    except Exception as e:
        print(f"Warning: match regeneration failed: {e}")
        return 0

def insert_internships(internships_data: list[dict]) -> tuple[int, int]:
    """
    Inserts validated internships into core tables and links relational skills.
    Returns: tuple (processed_count, failed_count)
    """
    if not internships_data:
        return 0, 0

    supabase = get_supabase_client()
    processed_count = 0
    failed_count = 0
    current_time = datetime.now(timezone.utc).isoformat()
    
    for payload in internships_data:
        # 1. Validation checks
        if not validate_internship(payload):
            failed_count += 1
            continue

        job_core = dict(payload) # Copy payload to safely mutate
        skills = job_core.pop("required_skills", [])
        requirements = job_core.pop("requirements", None)
        salary = job_core.pop("salary", None)
        
        # Merge requirements and salary organically into the description payload for front-end rendering
        extended_details = ""
        if salary:
            extended_details += f"\n\n--- SALARY ---\n{salary}"
        if requirements:
            extended_details += f"\n\n--- TARGETED REQUIREMENTS ---\n{requirements}"
        if extended_details:
             job_core["description"] = f"{job_core.get('description', '')}{extended_details}"
            
        # Add tracking metadata
        job_core["last_seen_at"] = current_time
        job_core["last_verified_at"] = current_time
        job_core["is_active"] = True
        
        # 2. Upsert Core Internship Record
        try:
            res = supabase.table("internships").upsert(
                [job_core], 
                on_conflict="apply_url"
            ).execute()
            
            if not res.data:
                failed_count += 1
                continue
                
            internship_id = res.data[0]["id"]
            processed_count += 1
            
        except Exception as e:
            print(f"Skipping insert for {job_core.get('title')} due to DB constraint: {e}")
            failed_count += 1
            continue
        
        # 3. Relational Skill Binding
        for skill_name in skills:
            try:
                skill_res = supabase.table("skills").upsert(
                    [{"name": skill_name, "category": "General"}],
                    on_conflict="name"
                ).execute()

                if skill_res.data:
                    skill_id = skill_res.data[0]["id"]

                    supabase.table("internship_skills").upsert(
                        [{"internship_id": internship_id, "skill_id": skill_id}],
                        on_conflict="internship_id,skill_id"
                    ).execute()
            except Exception as e:
                print(f"Warning: Failed to lock skill '{skill_name}' to internship: {e}")
                 
    return processed_count, failed_count
