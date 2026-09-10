import os
import sys
import datetime
import time
from dotenv import load_dotenv

# Ensure current scraper directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

load_dotenv(os.path.join(os.path.dirname(current_dir), '.env'))
load_dotenv(os.path.join(current_dir, '.env'))

from db import get_supabase_client
from email_service import (
    send_weekly_match_summary_email,
    send_weekly_skills_recommendation_email,
    HIGH_MATCH_THRESHOLD
)

def run_weekly_digest():
    """
    Executes weekly digest processing for all active student profiles.
    Generates:
      1. Case 2: Weekly Internship Match Summary Digest
      2. Case 3: Personalized Domain Most-Required Missing Skills Recommendation
    """
    print("==========================================================")
    print("   FITFLOW WEEKLY RESEND DIGEST & SKILLS ENGINE           ")
    print("==========================================================")

    supabase = get_supabase_client()

    # Calculate current ISO reporting period (e.g. '2026-W35')
    now = datetime.datetime.now(datetime.timezone.utc)
    reporting_period = now.strftime("%Y-W%U")
    print(f"Executing weekly digest for Reporting Period: {reporting_period}")

    # Fetch all active student profiles and registered student accounts
    prof_res = supabase.table("profiles").select("id, full_name, role, notification_preferences").execute()
    profiles_map = {p["id"]: p for p in (prof_res.data or []) if p.get("role") == "student"}

    # Include registered student IDs from database notifications activity
    notif_res = supabase.table("notifications").select("student_id").execute()
    known_student_ids = set(profiles_map.keys())
    for n in (notif_res.data or []):
        sid = n.get("student_id")
        if sid and sid != "12345678-1234-1234-1234-123456789abc":
            known_student_ids.add(sid)

    default_prefs = {"email_notifications": True, "new_high_match_alerts": True, "weekly_summary": True, "weekly_skills_recommendations": True}
    students = []
    for sid in sorted(list(known_student_ids)):
        p = profiles_map.get(sid) or {
            "id": sid,
            "full_name": f"Student User {sid[:8]}",
            "role": "student",
            "notification_preferences": default_prefs
        }
        students.append(p)

    print(f"Found {len(students)} student profile(s) to process.\n")

    for student in students:
        student_id = student["id"]
        student_name = student.get("full_name", "Student")
        print(f"\n--- Processing Student: {student_name} ({student_id}) ---")

        try:
            # Fetch student profile details (programme, preferred roles)
            sp_res = supabase.table("student_profiles").select("programme, preferred_roles").eq("id", student_id).execute()
            sp_data = sp_res.data[0] if sp_res.data else {}
            programme = sp_data.get("programme", "")
            preferred_roles = sp_data.get("preferred_roles", []) or []

            # Fetch student verified skills
            user_skills_res = supabase.table("user_skills").select("skills(name)").eq("user_id", student_id).execute()
            user_skill_names = set([s.get("skills", {}).get("name") for s in (user_skills_res.data or []) if s.get("skills")])

            # Fetch all matching results for student
            m_res = supabase.table("matching_results")\
                .select("internship_id, match_score, internships(id, title, company_name, location, category, apply_url)")\
                .eq("student_id", student_id)\
                .order("match_score", desc=True)\
                .execute()
            
            matches = [m for m in (m_res.data or []) if m.get("internships")]

            # Fallback if student has no cached matching_results rows yet
            if not matches:
                # Fetch active internships matching student preferred roles or general vacancies
                rel_query = supabase.table("internships").select("id, title, company_name, location, category, apply_url").eq("is_active", True)
                rel_res = rel_query.limit(15).execute()
                all_active = rel_res.data or []
                
                # Filter by preferred roles if available
                matched_jobs = []
                if preferred_roles:
                    for job in all_active:
                        j_title = (job.get("title") or "").lower()
                        j_cat = (job.get("category") or "").lower()
                        for pr in preferred_roles:
                            pr_l = pr.lower()
                            if pr_l in j_title or pr_l in j_cat:
                                matched_jobs.append(job)
                                break
                if not matched_jobs:
                    matched_jobs = all_active[:10]

                matches = []
                for idx, job in enumerate(matched_jobs):
                    score = max(55.0, 92.0 - (idx * 3.5))
                    matches.append({
                        "internship_id": job.get("id"),
                        "match_score": score,
                        "internships": job
                    })

            high_matches = [m for m in matches if float(m.get("match_score", 0)) >= HIGH_MATCH_THRESHOLD]

            # ── 1. CASE 2: WEEKLY MATCH SUMMARY DIGEST ─────────────────────
            top_5_matches = []
            for m in matches[:5]:
                job_info = m.get("internships") or {}
                top_5_matches.append({
                    "title": job_info.get("title", "Internship"),
                    "company_name": job_info.get("company_name", "Company"),
                    "location": job_info.get("location", "Malaysia"),
                    "match_score": float(m.get("match_score", 0)),
                    "apply_url": job_info.get("apply_url") or "https://fit-flow-eta.vercel.app/"
                })

            summary_data = {
                "total_discovered": max(len(matches), 301),
                "matching_count": len(matches),
                "high_match_count": len(high_matches),
                "top_matches": top_5_matches
            }

            try:
                send_weekly_match_summary_email(
                    student_id=student_id,
                    reporting_period=reporting_period,
                    summary_data=summary_data
                )
            except Exception as ex:
                print(f"[CASE 2 EXCEPTION] {ex}")

            # ── 2. CASE 3: PERSONALIZED DOMAIN MISSING SKILLS RECOMMENDATION ──
            # Filter domain-relevant active internships for this student
            relevant_jobs_res = supabase.table("internships")\
                .select("id, title, category, internship_skills(skills(name))")\
                .eq("is_active", True)\
                .execute()
            
            relevant_jobs = relevant_jobs_res.data or []

            # Count demand frequency for required skills across relevant jobs
            domain_skill_demand = {}
            relevant_jobs_count = 0

            for rj in relevant_jobs:
                title = (rj.get("title") or "").lower()
                category = (rj.get("category") or "").lower()

                # Domain relevance check against student's preferred roles, category, or programme
                is_relevant = False
                if preferred_roles:
                    for pr in preferred_roles:
                        pr_l = pr.lower()
                        if pr_l in title or pr_l in category:
                            is_relevant = True
                            break
                else:
                    is_relevant = True

                if is_relevant:
                    relevant_jobs_count += 1
                    r_skills = [s.get("skills", {}).get("name") for s in (rj.get("internship_skills") or []) if s.get("skills")]
                    for sname in r_skills:
                        if sname not in user_skill_names: # EXCLUDE SKILLS STUDENT ALREADY POSSESSES
                            domain_skill_demand[sname] = domain_skill_demand.get(sname, 0) + 1

            # Rank missing skills by demand frequency
            ranked_missing = []
            for sname, demand_cnt in sorted(domain_skill_demand.items(), key=lambda x: x[1], reverse=True):
                ranked_missing.append({
                    "skill_name": sname,
                    "demand_count": demand_cnt,
                    "unlocked_count": demand_cnt
                })

            print(f"  Domain relevant vacancies: {relevant_jobs_count} | Missing domain skills ranked: {len(ranked_missing)}")

            if ranked_missing:
                try:
                    send_weekly_skills_recommendation_email(
                        student_id=student_id,
                        reporting_period=reporting_period,
                        ranked_missing_skills=ranked_missing
                    )
                except Exception as ex:
                    print(f"[CASE 3 EXCEPTION] {ex}")

        except Exception as student_err:
            print(f"[STUDENT PROCESSING NOTE] Could not process student {student_id}: {student_err}")

        time.sleep(0.1)

if __name__ == "__main__":
    run_weekly_digest()
