import os
import requests
import re
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
    Also cleans up matching results for any inactive internships first.
    Performs old vs new match comparison to insert student notifications for new matches/improvements.
    """
    supabase = get_supabase_client()
    try:
        # 1. Clean up matches for inactive internships
        inactive_jobs_res = supabase.table("internships").select("id").eq("is_active", False).execute()
        inactive_ids = [j["id"] for j in (inactive_jobs_res.data or [])]
        if inactive_ids:
            print(f"[CLEANUP] Found {len(inactive_ids)} inactive internships. Deleting matching results...")
            for i in range(0, len(inactive_ids), 100):
                batch = inactive_ids[i:i+100]
                supabase.table("matching_results").delete().in_("internship_id", batch).execute()
        
        # 2. Re-run matches for active students
        students = supabase.table("profiles").select("id").eq("role", "student").execute()
        count = 0
        for s in (students.data or []):
            student_id = s["id"]
            
            # Fetch notification preferences
            prof_res = supabase.table("profiles").select("notification_preferences").eq("id", student_id).single().execute()
            prefs = (prof_res.data or {}).get("notification_preferences") or {}
            
            # Fetch preferred roles
            sp_res = supabase.table("student_profiles").select("preferred_roles").eq("id", student_id).execute()
            preferred_roles = (sp_res.data[0] if sp_res.data else {}).get("preferred_roles") or []

            match_enabled = prefs.get("match_updates") != False
            new_internships_enabled = prefs.get("new_internships") != False
            
            if not match_enabled and not new_internships_enabled:
                supabase.rpc("generate_internship_matches", {"p_student_id": student_id}).execute()
                count += 1
                continue

            # Fetch old matches
            old_matches_res = supabase.table("matching_results").select("internship_id, match_score").eq("student_id", student_id).execute()
            old_matches = {m["internship_id"]: float(m["match_score"]) for m in (old_matches_res.data or []) if m.get("internship_id")}

            # Run matching RPC
            supabase.rpc("generate_internship_matches", {"p_student_id": student_id}).execute()
            count += 1

            # Fetch new matches
            new_matches_res = supabase.table("matching_results").select("internship_id, match_score, internships(title, company_name, category)").eq("student_id", student_id).execute()

            # Fetch recent notifications to prevent duplicate inserts
            recent_res = supabase.table("notifications").select("type, action_target, title").eq("student_id", student_id).in_("type", ["match", "internship"]).execute()
            notified_new_internships = set()
            notified_match_internships = set()
            notified_scores = {}

            for n in (recent_res.data or []):
                action_target = n.get("action_target")
                if not action_target:
                    continue
                if n["type"] == "internship":
                    notified_new_internships.add(action_target)
                elif n["type"] == "match":
                    notified_match_internships.add(action_target)
                    match_pct = re.search(r"(\d+)%\s*Match", n["title"]) or re.search(r"->\s*(\d+)%", n["title"])
                    if match_pct:
                        score = float(match_pct.group(1))
                        if action_target not in notified_scores or score > notified_scores[action_target]:
                            notified_scores[action_target] = score

            # Compare and generate notifications
            for m in (new_matches_res.data or []):
                internship_id = m.get("internship_id")
                if not internship_id:
                    continue
                new_score = round(float(m["match_score"]))
                internship = m.get("internships") or {}
                title = internship.get("title", "Internship")
                company = internship.get("company_name", "Company")

                # Scenario A: Newly Scraped Match (High Score) -> type: 'internship'
                is_new = internship_id not in old_matches
                if is_new and new_score >= 80 and internship_id not in notified_new_internships and new_internships_enabled:
                    # Check if it's a High-Match Opportunity based on preferred roles
                    is_pref_high_match = False
                    matched_pref_role = None
                    if preferred_roles and new_score >= 85:
                        category = internship.get("category")
                        for r_pref in preferred_roles:
                            r_pref_l = r_pref.lower()
                            if r_pref_l in title.lower() or (category and r_pref_l == category.lower()):
                                is_pref_high_match = True
                                matched_pref_role = r_pref
                                break

                    if is_pref_high_match:
                        supabase.table("notifications").insert({
                            "student_id": student_id,
                            "type": "internship",
                            "title": f"🔥 High-Match: {title} at {company} ({new_score}% Match in {matched_pref_role})",
                            "priority": "high",
                            "action_type": "open_internship",
                            "action_target": internship_id,
                            "is_read": False,
                            "internship_id": internship_id
                        }).execute()
                    else:
                        supabase.table("notifications").insert({
                            "student_id": student_id,
                            "type": "internship",
                            "title": f"New internship opportunity matches your skills: {title} at {company} ({new_score}% Match)",
                            "priority": "medium",
                            "action_type": "open_internship",
                            "action_target": internship_id,
                            "is_read": False,
                            "internship_id": internship_id
                        }).execute()
                    notified_new_internships.add(internship_id)

                # Scenario B: Match Score Improved -> type: 'match'
                prev_notified = notified_scores.get(internship_id)
                if prev_notified is None and internship_id in old_matches:
                    prev_notified = old_matches[internship_id]

                if prev_notified is not None and new_score > prev_notified and match_enabled:
                    supabase.table("notifications").insert({
                        "student_id": student_id,
                        "type": "match",
                        "title": f"Match score for {title} at {company} increased from {round(prev_notified)}% -> {new_score}%!",
                        "priority": "high",
                        "action_type": "open_internship",
                        "action_target": internship_id,
                        "is_read": False
                    }).execute()
                    notified_scores[internship_id] = float(new_score)

                # Scenario C: High Match -> type: 'match'
                elif new_score >= 80 and internship_id not in notified_match_internships and match_enabled:
                    supabase.table("notifications").insert({
                        "student_id": student_id,
                        "type": "match",
                        "title": f"🎯 High Match Found! You are a {new_score}% match for {title} at {company}.",
                        "priority": "high" if new_score >= 90 else "medium",
                        "action_type": "open_internship",
                        "action_target": internship_id,
                        "is_read": False
                    }).execute()
                    notified_match_internships.add(internship_id)
                    notified_scores[internship_id] = float(new_score)

            # 2.7 Weekly Summary Notification (Digest)
            weekly_summary_enabled = prefs.get("weekly_summary", False)
            if weekly_summary_enabled:
                seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
                
                recent_digest_res = supabase.table("notifications")\
                    .select("id")\
                    .eq("student_id", student_id)\
                    .eq("type", "system")\
                    .like("title", "Weekly Digest:%")\
                    .gt("sent_at", seven_days_ago)\
                    .limit(1)\
                    .execute()
                
                if not (recent_digest_res.data or []):
                    # Count matches >= 80%
                    high_matches = len([m for m in (new_matches_res.data or []) if round(float(m["match_score"])) >= 80])
                    
                    # Fetch active application count from tracker
                    apps_res = supabase.table("tracker_applications")\
                        .select("id")\
                        .eq("user_id", student_id)\
                        .is_("deleted_at", "null")\
                        .execute()
                    apps_count = len(apps_res.data or [])
                    
                    digest_title = f"Weekly Digest: You have {high_matches} high-probability matches (80%+) and {apps_count} active applications."
                    supabase.table("notifications").insert({
                        "student_id": student_id,
                        "type": "system",
                        "title": digest_title,
                        "priority": "low",
                        "action_type": "open_skill_profile",
                        "action_target": "skills",
                        "is_read": False
                    }).execute()
                    print(f"[WEEKLY DIGEST] Sent to student: {student_id}")

        # 3. Retention Cleanup: Delete notifications older than 90 days
        ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
        supabase.table("notifications").delete().lt("sent_at", ninety_days_ago.isoformat()).execute()
        print(f"[CLEANUP] Stale notifications older than 90 days deleted.")

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
        
        # Classify job category & confidence
        try:
            from scraper import classify_job
            category, confidence = classify_job(job_core.get("title", ""), job_core.get("description", ""))
            job_core["category"] = category
            job_core["classification_confidence"] = confidence
        except Exception as class_err:
            print(f"Warning: Failed to classify job: {class_err}")
        
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
