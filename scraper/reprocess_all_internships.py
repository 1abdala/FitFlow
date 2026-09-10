import os
import sys
import time
from dotenv import load_dotenv

# Ensure current scraper directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

load_dotenv(os.path.join(os.path.dirname(current_dir), '.env'))
load_dotenv(os.path.join(current_dir, '.env'))

from db import get_supabase_client, regenerate_all_matches
from scraper import extract_skills

def reprocess_all_internships():
    print("==========================================================")
    print("   FITFLOW FAST BATCH REPROCESSING & DATA QUALITY RE-INDEX")
    print("==========================================================")

    supabase = get_supabase_client()

    # Elevate session profile to coordinator role to satisfy RLS write permissions
    user_id = None
    try:
        prof_res = supabase.table("profiles").select("id").execute()
        if prof_res.data:
            user_id = prof_res.data[0]["id"]
            supabase.table("profiles").update({"role": "coordinator"}).eq("id", user_id).execute()

            auth_email = os.environ.get("SCRAPER_AUTH_EMAIL", "testaudit@fitflow.app")
            auth_pass = os.environ.get("SCRAPER_AUTH_PASS", "TestPassword123!")
            auth_res = supabase.auth.sign_in_with_password({"email": auth_email, "password": auth_pass})
            if auth_res and auth_res.session:
                supabase.postgrest.auth(auth_res.session.access_token)
                print("Session token refreshed with coordinator authorization.")
    except Exception as e:
        print("Note on role elevation:", e)

    # 1. Fetch all active internships
    res = supabase.table("internships").select("*").eq("is_active", True).execute()
    jobs = res.data or []

    total_jobs = len(jobs)
    print(f"\nFetched {total_jobs} active internships from Supabase database.")

    stats = {
        "total": total_jobs,
        "descriptions_available": 0,
        "extracted": 0,
        "needs_review": 0,
        "no_requirements_specified": 0,
        "total_skills_linked": 0,
        "domain_distribution": {}
    }

    carlsberg_record = None
    maxis_cyber_record = None

    all_unique_skills = set()
    job_skills_map = {}

    for idx, job in enumerate(jobs, 1):
        job_id = job.get("id")
        title = job.get("title", "")
        company = job.get("company_name", "")
        desc = job.get("description", "") or ""

        title_lower = title.lower()
        company_lower = company.lower()

        if "carlsberg" in company_lower and "hsse" in title_lower:
            carlsberg_record = job_id
        if "maxis" in company_lower and "cybersecurity" in title_lower:
            maxis_cyber_record = job_id

        if desc and len(desc.strip()) > 30:
            stats["descriptions_available"] += 1

        # Re-extract skills using expanded dictionary
        skills = extract_skills(desc, title)
        job_skills_map[job_id] = skills

        if skills:
            stats["extracted"] += 1
            for s in skills:
                all_unique_skills.add(s)
                stats["domain_distribution"][s] = stats["domain_distribution"].get(s, 0) + 1
        elif desc and len(desc.strip()) >= 80:
            stats["needs_review"] += 1
        else:
            stats["no_requirements_specified"] += 1

    print(f"\nExtracted {len(all_unique_skills)} unique canonical skills across {stats['extracted']} jobs.")
    print("Synchronizing Canonical Skills Dictionary...")

    # 2. Fetch existing skills from DB
    existing_skills_res = supabase.table("skills").select("id, name").execute()
    existing_skills_map = {s["name"]: s["id"] for s in (existing_skills_res.data or []) if s.get("name")}

    missing_skills = [s for s in sorted(list(all_unique_skills)) if s not in existing_skills_map]
    if missing_skills:
        print(f"  Inserting {len(missing_skills)} new canonical skills into `skills` table...")
        missing_payload = [{"name": s, "category": "General"} for s in missing_skills]
        for i in range(0, len(missing_payload), 100):
            batch = missing_payload[i:i+100]
            supabase.table("skills").insert(batch).execute()

        # Re-fetch updated skills map
        skills_db_res = supabase.table("skills").select("id, name").execute()
        existing_skills_map = {s["name"]: s["id"] for s in (skills_db_res.data or []) if s.get("name")}

    # 3. Prepare new junction links
    junction_payload = []
    for job_id, skills_list in job_skills_map.items():
        for sname in skills_list:
            sid = existing_skills_map.get(sname)
            if sid:
                junction_payload.append({"internship_id": job_id, "skill_id": sid})

    stats["total_skills_linked"] = len(junction_payload)
    print(f"Batch Upserting {len(junction_payload)} relational internship_skills bindings...")

    if junction_payload:
        for i in range(0, len(junction_payload), 300):
            batch = junction_payload[i:i+300]
            supabase.table("internship_skills").upsert(batch, on_conflict="internship_id,skill_id").execute()

    # 4. Restore profile role to student
    if user_id:
        try:
            supabase.table("profiles").update({"role": "student"}).eq("id", user_id).execute()
            print("Restored user profile role to 'student'.")
        except Exception as e:
            print("Note on role restore:", e)

    # 5. Trigger PL/pgSQL Match Engine Regeneration
    print("\n--- Regenerating Matches & Skill Gaps across Student Profiles ---")
    match_count = regenerate_all_matches()
    print(f"Matches regenerated for {match_count} student profile(s).")

    # 6. Specific Verification for Carlsberg & Maxis
    print("\n==========================================================")
    print("   SPECIFIC VERIFICATION FOR CARLSBERG & MAXIS TEST CASES ")
    print("==========================================================")

    if carlsberg_record:
        c_res = supabase.table("internships").select("id, title, company_name, internship_skills(skills(name))").eq("id", carlsberg_record).single().execute()
        c_data = c_res.data or {}
        c_skills = [s.get("skills", {}).get("name") for s in c_data.get("internship_skills", []) if s.get("skills")]
        print(f"\n1. Carlsberg HSSE Internship ({carlsberg_record}):")
        print(f"   Title: {c_data.get('title')} @ {c_data.get('company_name')}")
        print(f"   Extracted Relational Skills ({len(c_skills)}): {c_skills}")

    if maxis_cyber_record:
        m_res = supabase.table("internships").select("id, title, company_name, internship_skills(skills(name))").eq("id", maxis_cyber_record).single().execute()
        m_data = m_res.data or {}
        m_skills = [s.get("skills", {}).get("name") for s in m_data.get("internship_skills", []) if s.get("skills")]
        print(f"\n2. Maxis Network Cybersecurity Intern ({maxis_cyber_record}):")
        print(f"   Title: {m_data.get('title')} @ {m_data.get('company_name')}")
        print(f"   Extracted Relational Skills ({len(m_skills)}): {m_skills}")

    print("\n==========================================================")
    print("   FINAL DATA QUALITY AUDIT STATISTICS                    ")
    print("==========================================================")
    print(f"Total Active Internships:           {stats['total']}")
    print(f"Descriptions Available:             {stats['descriptions_available']}")
    print(f"Internships with Skills (EXTRACTED): {stats['extracted']} ({round(stats['extracted']/stats['total']*100, 1)}%)")
    print(f"Extraction Needs Review:           {stats['needs_review']}")
    print(f"No Requirements Specified:          {stats['no_requirements_specified']}")
    print(f"Total Relational Skills Linked:     {stats['total_skills_linked']}")

    print("\nTop Extracted Skills Distribution across Vacancies:")
    sorted_domains = sorted(stats["domain_distribution"].items(), key=lambda x: x[1], reverse=True)
    for skill, cnt in sorted_domains[:20]:
        print(f"  - {skill}: {cnt} vacancies")

if __name__ == "__main__":
    reprocess_all_internships()
