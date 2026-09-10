import os
import sys
import re
import datetime
import time
from typing import List, Dict, Any, Optional

# Ensure scraper directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    import resend
except ImportError:
    resend = None

def _get_supabase():
    from db import get_supabase_client
    return get_supabase_client()

# Configurable High Match Threshold (Default 70%)
HIGH_MATCH_THRESHOLD = int(os.environ.get("HIGH_MATCH_THRESHOLD", 70))
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "FitFlow Internship Alerts <onboarding@resend.dev>")
APP_URL = os.environ.get("APP_URL", "https://fit-flow-eta.vercel.app/").rstrip('/') + '/'

def _get_resend_api_key() -> Optional[str]:
    """Retrieves RESEND_API_KEY from environment variables without logging it."""
    key = os.environ.get("RESEND_API_KEY")
    if not key:
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
        load_dotenv(env_path)
        key = os.environ.get("RESEND_API_KEY")
    return key

def _init_resend() -> bool:
    """Initializes Resend SDK securely."""
    global resend
    if resend is None:
        try:
            import resend as resend_module
            resend = resend_module
        except ImportError:
            return False
    api_key = _get_resend_api_key()
    if not api_key:
        return False
    resend.api_key = api_key
    return True

def _log_email_delivery(
    student_id: str,
    email_address: str,
    notification_type: str,
    internship_id: Optional[str] = None,
    reporting_period: Optional[str] = None,
    resend_email_id: Optional[str] = None,
    status: str = "sent",
    error_message: Optional[str] = None
) -> None:
    """Logs email delivery attempt to email_logs and notifications tables for audit and deduplication."""
    supabase = _get_supabase()
    
    # 1. Attempt insert into email_logs table if available
    try:
        payload = {
            "student_id": student_id,
            "internship_id": internship_id,
            "email_address": email_address,
            "notification_type": notification_type,
            "reporting_period": reporting_period,
            "resend_email_id": resend_email_id,
            "status": status,
            "error_message": error_message
        }
        supabase.table("email_logs").insert(payload).execute()
    except Exception:
        pass

    # 2. Log fallback entry in notifications table
    try:
        supabase.table("notifications").insert({
            "student_id": student_id,
            "internship_id": internship_id,
            "type": f"email_{notification_type}",
            "title": f"[Email Delivery] {notification_type} ({reporting_period or internship_id or 'sent'})",
            "priority": "low",
            "action_type": "email_sent",
            "action_target": internship_id or reporting_period,
            "is_read": True
        }).execute()
    except Exception:
        pass

def _check_already_sent(
    student_id: str,
    notification_type: str,
    internship_id: Optional[str] = None,
    reporting_period: Optional[str] = None
) -> bool:
    """Checks database for prior email delivery to enforce strict deduplication."""
    supabase = _get_supabase()
    try:
        if notification_type == "high_match_alert" and internship_id:
            try:
                res = supabase.table("email_logs")\
                    .select("id")\
                    .eq("student_id", student_id)\
                    .eq("internship_id", internship_id)\
                    .eq("notification_type", notification_type)\
                    .eq("status", "sent")\
                    .execute()
                if res.data and len(res.data) > 0:
                    return True
            except Exception:
                pass

            n_res = supabase.table("notifications")\
                .select("id")\
                .eq("student_id", student_id)\
                .eq("type", f"email_{notification_type}")\
                .eq("action_target", str(internship_id))\
                .execute()
            if n_res.data and len(n_res.data) > 0:
                return True

        elif reporting_period:
            try:
                res = supabase.table("email_logs")\
                    .select("id")\
                    .eq("student_id", student_id)\
                    .eq("notification_type", notification_type)\
                    .eq("reporting_period", reporting_period)\
                    .eq("status", "sent")\
                    .execute()
                if res.data and len(res.data) > 0:
                    return True
            except Exception:
                pass

            n_res = supabase.table("notifications")\
                .select("id")\
                .eq("student_id", student_id)\
                .eq("type", f"email_{notification_type}")\
                .eq("action_target", reporting_period)\
                .execute()
            if n_res.data and len(n_res.data) > 0:
                return True

    except Exception:
        pass
    return False

def _get_personalized_display_name(student_name: str, email_addr: str) -> str:
    """
    Extracts a clean, personalized first name for student greetings (e.g. 'Abdalla').
    Replaces generic fallback strings like 'Student User e14b11e4' with real names.
    """
    if student_name and not student_name.startswith("Student User") and not student_name.startswith("Student"):
        first = student_name.strip().split()[0]
        if len(first) >= 2:
            return first.capitalize()

    if email_addr and "@" in email_addr:
        uname = email_addr.split("@")[0]
        clean = re.sub(r'[\.\_\-\d]+', ' ', uname).strip()
        if clean:
            first_part = clean.split()[0]
            if len(first_part) >= 2:
                return first_part.capitalize()

    return "Student"

def _check_user_preference(student_id: str, pref_key: str) -> tuple[bool, str, str]:
    """
    Retrieves user's email address and verifies notification preferences.
    Returns: (is_allowed, email_address, student_name)
    """
    supabase = _get_supabase()
    last_err = None
    for attempt in range(3):
        try:
            # Fetch profile and notification preferences
            prof_res = supabase.table("profiles").select("full_name, notification_preferences").eq("id", student_id).execute()
            p_data = prof_res.data[0] if (prof_res and prof_res.data) else {}
            student_name = p_data.get("full_name") or ""
            prefs = p_data.get("notification_preferences") or {"email_notifications": True, "new_high_match_alerts": True, "weekly_summary": True, "weekly_skills_recommendations": True}

            # Master Email Toggle
            if prefs.get("email_notifications") is False:
                return False, "", student_name

            # Specific Category Toggle
            if prefs.get(pref_key) is False:
                return False, "", student_name

            # Fetch student email via Supabase Auth
            email = ""
            try:
                usr = supabase.auth.get_user()
                if usr and hasattr(usr, 'user') and usr.user and usr.user.email:
                    email = usr.user.email
                    meta = getattr(usr.user, 'user_metadata', {}) or {}
                    if not student_name or student_name.startswith("Student User"):
                        student_name = meta.get("full_name") or meta.get("name") or student_name
                else:
                    auth_res = supabase.auth.admin.get_user_by_id(student_id)
                    if auth_res and hasattr(auth_res, 'user') and auth_res.user and auth_res.user.email:
                        email = auth_res.user.email
                        meta = getattr(auth_res.user, 'user_metadata', {}) or {}
                        if not student_name or student_name.startswith("Student User"):
                            student_name = meta.get("full_name") or meta.get("name") or student_name
            except Exception:
                pass

            # If using Resend sandbox mode (onboarding@resend.dev), override to developer account email to prevent Resend 403 API restriction
            is_sandbox = "onboarding@resend.dev" in RESEND_FROM_EMAIL
            allow_sandbox_override = os.environ.get("FORCE_REAL_USER_EMAILS", "false").lower() != "true"

            if is_sandbox and allow_sandbox_override:
                email = os.environ.get("RESEND_TEST_RECIPIENT", "abullahageep@gmail.com")
            elif not email:
                email = os.environ.get("RESEND_TEST_RECIPIENT", "abullahageep@gmail.com")

            return True, email, student_name
        except Exception as e:
            last_err = e
            time.sleep(1)

    print(f"[EMAIL PREF CHECK ERROR] {last_err}")
    return False, "", "Student"

# ── CASE 1: NEW HIGH-MATCH INTERNSHIP ALERT (Match Score ≥ 70%) ──────────────────
def send_high_match_alert_email(
    student_id: str,
    internship: Dict[str, Any],
    match_score: float,
    verified_skills: List[str],
    skill_gaps: List[str]
) -> bool:
    """
    Sends Case 1 High-Match Alert email for new eligible internship matching candidate score >= 70%.
    """
    if match_score < HIGH_MATCH_THRESHOLD:
        return False

    job_id = internship.get("id")
    title = internship.get("title", "Internship Opportunity")
    company = internship.get("company_name", "Company")
    location = internship.get("location", "Malaysia")
    category = internship.get("category", "Technology")
    apply_url = internship.get("apply_url") or APP_URL
    score_pct = round(match_score)

    # 1. Deduplication Check
    if _check_already_sent(student_id, "high_match_alert", internship_id=job_id):
        print(f"[EMAIL DUP SKIP] High match email already sent for job {job_id} to student {student_id}")
        return False

    # 2. Preference Check
    allowed, email_addr, student_name = _check_user_preference(student_id, "new_high_match_alerts")
    if not allowed or not email_addr:
        print(f"[EMAIL PREF SKIP] High match email disabled for student {student_id}")
        return False

    greeting_name = _get_personalized_display_name(student_name, email_addr)
    dashboard_url = f"{APP_URL}auth?email={email_addr}"

    # 3. Build HTML Template
    verified_chips = "".join([f'<span style="background:#10B98120;color:#10B981;border:1px solid #10B98140;padding:4px 10px;border-radius:16px;font-size:12px;margin:2px;display:inline-block;">✓ {s}</span>' for s in verified_skills[:6]])
    gap_chips = "".join([f'<span style="background:#F59E0B20;color:#F59E0B;border:1px solid #F59E0B40;padding:4px 10px;border-radius:16px;font-size:12px;margin:2px;display:inline-block;">⚡ {s}</span>' for s in skill_gaps[:6]])

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0B0F19;color:#F3F4F6;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #1F2937;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);padding:28px 24px;text-align:center;">
          <h1 style="color:#FFFFFF;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">⚡ FitFlow Internship Match Alert</h1>
          <p style="color:#E0E7FF;margin:6px 0 0 0;font-size:14px;">Hi {greeting_name}, a new high-fit opportunity matched your profile!</p>
        </div>

        <!-- Body -->
        <div style="padding:28px 24px;">
          <div style="background:#1F2937;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #374151;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
              <div>
                <span style="background:#4F46E530;color:#818CF8;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;">{category}</span>
                <h2 style="color:#FFFFFF;margin:8px 0 4px 0;font-size:18px;">{title}</h2>
                <p style="color:#9CA3AF;margin:0;font-size:14px;font-weight:600;">{company} • {location}</p>
              </div>
              <div style="background:linear-gradient(135deg, #10B981 0%, #059669 100%);color:#FFFFFF;padding:10px 14px;border-radius:12px;text-align:center;min-width:60px;">
                <span style="font-size:20px;font-weight:800;display:block;line-height:1;">{score_pct}%</span>
                <span style="font-size:9px;text-transform:uppercase;font-weight:700;opacity:0.9;">Match Fit</span>
              </div>
            </div>

            <!-- Skills Breakdown -->
            <div style="margin-top:18px;padding-top:14px;border-top:1px solid #374151;">
              {f'<div style="margin-bottom:10px;"><strong style="color:#10B981;font-size:12px;display:block;margin-bottom:6px;">Verified Skills ({len(verified_skills)}):</strong>{verified_chips}</div>' if verified_chips else ''}
              {f'<div><strong style="color:#F59E0B;font-size:12px;display:block;margin-bottom:6px;">Skill Gaps ({len(skill_gaps)}):</strong>{gap_chips}</div>' if gap_chips else ''}
            </div>
          </div>

          <!-- Call to Action -->
          <div style="text-align:center;margin-top:28px;">
            <a href="{apply_url}" target="_blank" style="background:#4F46E5;color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 14px rgba(79,70,229,0.4);">
              View & Apply Now →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#0F172A;padding:18px 24px;text-align:center;border-top:1px solid #1E293B;font-size:12px;color:#64748B;">
          <p style="margin:0 0 6px 0;">You received this transactional match notification based on your FitFlow profile preferences.</p>
          <p style="margin:0;">Manage your notification settings anytime in your <a href="{dashboard_url}" style="color:#818CF8;text-decoration:underline;">FitFlow Dashboard Settings</a>.</p>
        </div>
      </div>
    </body>
    </html>
    """

    # 4. Dispatch Email Safely with Resend
    try:
        if not _init_resend():
            print("[RESEND SKIP] Resend API Key not initialized. Logging fallback delivery.")
            _log_email_delivery(student_id, email_addr, "high_match_alert", internship_id=job_id, status="failed", error_message="Resend SDK not configured")
            return False

        params = {
            "from": RESEND_FROM_EMAIL,
            "to": [email_addr],
            "subject": f"⚡ New High-Match Internship: {title} at {company} ({score_pct}% Match)",
            "html": html_content,
        }
        response = resend.Emails.send(params)
        resend_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", str(response))

        print(f"[RESEND SUCCESS] High match email sent to {email_addr} (Resend ID: {resend_id})")
        _log_email_delivery(student_id, email_addr, "high_match_alert", internship_id=job_id, resend_email_id=resend_id, status="sent")
        return True
    except Exception as ex:
        err_msg = str(ex)
        print(f"[RESEND ERROR] Failed to send high match email: {err_msg}")
        _log_email_delivery(student_id, email_addr, "high_match_alert", internship_id=job_id, status="failed", error_message=err_msg)
        return False

# ── CASE 2: WEEKLY INTERNSHIP MATCH SUMMARY (Consolidated 1 Email/User/Week) ──────────
def send_weekly_match_summary_email(
    student_id: str,
    reporting_period: str,
    summary_data: Dict[str, Any]
) -> bool:
    """
    Sends Case 2 Consolidated Weekly Summary digest email for student.
    """
    if _check_already_sent(student_id, "weekly_summary", reporting_period=reporting_period):
        print(f"[EMAIL DUP SKIP] Weekly summary already sent for period {reporting_period} to student {student_id}")
        return False

    allowed, email_addr, student_name = _check_user_preference(student_id, "weekly_summary")
    if not allowed or not email_addr:
        print(f"[EMAIL PREF SKIP] Weekly summary disabled for student {student_id}")
        return False

    greeting_name = _get_personalized_display_name(student_name, email_addr)
    dashboard_url = f"{APP_URL}auth?email={email_addr}"

    total_discovered = summary_data.get("total_discovered", 0)
    matching_count = summary_data.get("matching_count", 0)
    high_match_count = summary_data.get("high_match_count", 0)
    top_matches = summary_data.get("top_matches", [])[:5]

    top_items_html = ""
    for m in top_matches:
        title = m.get("title", "Internship")
        company = m.get("company_name", "Company")
        location = m.get("location", "Malaysia")
        score = round(m.get("match_score", 0))
        apply_url = m.get("apply_url") or APP_URL
        top_items_html += f"""
        <div style="padding:14px;background:#1F2937;border-radius:10px;margin-bottom:10px;border:1px solid #374151;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong style="color:#FFFFFF;font-size:15px;display:block;">{title}</strong>
            <span style="color:#9CA3AF;font-size:13px;">{company} • {location}</span>
          </div>
          <div style="text-align:right;">
            <span style="color:#10B981;font-weight:800;font-size:16px;">{score}%</span>
            <a href="{apply_url}" target="_blank" style="display:block;color:#818CF8;font-size:12px;text-decoration:none;margin-top:2px;">View →</a>
          </div>
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0B0F19;color:#F3F4F6;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #1F2937;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);padding:28px 24px;text-align:center;">
          <h1 style="color:#FFFFFF;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">📊 FitFlow Weekly Internship Digest</h1>
          <p style="color:#E0E7FF;margin:6px 0 0 0;font-size:14px;">Hi {greeting_name}, here is your match summary for Week {reporting_period}</p>
        </div>

        <!-- Body -->
        <div style="padding:28px 24px;">
          <div style="display:flex;gap:10px;margin-bottom:24px;">
            <div style="flex:1;background:#1F2937;padding:14px 10px;border-radius:10px;text-align:center;border:1px solid #374151;">
              <span style="font-size:22px;font-weight:800;color:#FFFFFF;display:block;">{total_discovered}</span>
              <span style="display:block;font-size:11px;color:#9CA3AF;margin-top:2px;">New Vacancies</span>
            </div>
            <div style="flex:1;background:#1F2937;padding:14px 10px;border-radius:10px;text-align:center;border:1px solid #374151;">
              <span style="font-size:22px;font-weight:800;color:#818CF8;display:block;">{matching_count}</span>
              <span style="display:block;font-size:11px;color:#9CA3AF;margin-top:2px;">Matched Roles</span>
            </div>
            <div style="flex:1;background:#1F2937;padding:14px 10px;border-radius:10px;text-align:center;border:1px solid #374151;">
              <span style="font-size:22px;font-weight:800;color:#10B981;display:block;">{high_match_count}</span>
              <span style="display:block;font-size:11px;color:#9CA3AF;margin-top:2px;">High Matches (≥70%)</span>
            </div>
          </div>

          <h3 style="color:#FFFFFF;margin:0 0 14px 0;font-size:16px;">Top Recommended Placements</h3>
          {top_items_html if top_items_html else '<p style="color:#9CA3AF;font-size:14px;">No high-match roles calculated this week.</p>'}

          <!-- Call to Action -->
          <div style="text-align:center;margin-top:28px;">
            <a href="{dashboard_url}" target="_blank" style="background:#4F46E5;color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 14px rgba(79,70,229,0.4);">
              Open FitFlow Dashboard →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#0F172A;padding:18px 24px;text-align:center;border-top:1px solid #1E293B;font-size:12px;color:#64748B;">
          <p style="margin:0 0 6px 0;">You received this weekly summary digest based on your FitFlow profile preferences.</p>
          <p style="margin:0;">Manage your notification settings anytime in your <a href="{dashboard_url}" style="color:#818CF8;text-decoration:underline;">FitFlow Dashboard Settings</a>.</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        if not _init_resend():
            _log_email_delivery(student_id, email_addr, "weekly_summary", reporting_period=reporting_period, status="failed", error_message="Resend SDK not configured")
            return False

        params = {
            "from": RESEND_FROM_EMAIL,
            "to": [email_addr],
            "subject": f"📊 Your Weekly FitFlow Internship Summary ({reporting_period})",
            "html": html_content,
        }
        response = resend.Emails.send(params)
        resend_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", str(response))
        print(f"[RESEND SUCCESS] Weekly summary sent to {email_addr} (Resend ID: {resend_id})")
        _log_email_delivery(student_id, email_addr, "weekly_summary", reporting_period=reporting_period, resend_email_id=resend_id, status="sent")
        return True
    except Exception as ex:
        err_msg = str(ex)
        print(f"[RESEND ERROR] Failed to send weekly summary: {err_msg}")
        _log_email_delivery(student_id, email_addr, "weekly_summary", reporting_period=reporting_period, status="failed", error_message=err_msg)
        return False

# ── CASE 3: WEEKLY MOST-REQUIRED SKILLS RECOMMENDATION (Personalized Missing Skills) ──
def send_weekly_skills_recommendation_email(
    student_id: str,
    reporting_period: str,
    ranked_missing_skills: List[Dict[str, Any]]
) -> bool:
    """
    Sends Case 3 Personalized Most-Required Missing Skills email for student's domain.
    """
    if _check_already_sent(student_id, "weekly_skills_recommendation", reporting_period=reporting_period):
        print(f"[EMAIL DUP SKIP] Weekly skills recommendation already sent for period {reporting_period} to student {student_id}")
        return False

    allowed, email_addr, student_name = _check_user_preference(student_id, "weekly_skills_recommendations")
    if not allowed or not email_addr:
        print(f"[EMAIL PREF SKIP] Weekly skills recommendation disabled for student {student_id}")
        return False

    greeting_name = _get_personalized_display_name(student_name, email_addr)
    dashboard_url = f"{APP_URL}auth?email={email_addr}"

    if not ranked_missing_skills:
        print(f"[EMAIL SKIP] No missing skills to recommend for student {student_id}")
        return False

    top_skills_html = ""
    for idx, s in enumerate(ranked_missing_skills[:5], 1):
        skill_name = s.get("skill_name")
        req_count = s.get("demand_count", 0)
        unlocked = s.get("unlocked_count", req_count)
        top_skills_html += f"""
        <div style="background:#1F2937;border-radius:10px;padding:14px;margin-bottom:10px;border-left:4px solid #F59E0B;border:1px solid #374151;">
          <strong style="color:#FFFFFF;font-size:16px;">#{idx} {skill_name}</strong>
          <p style="color:#D1D5DB;margin:4px 0 0 0;font-size:13px;">
            Required by <strong>{req_count} relevant internships</strong> in your target domain. Acquiring {skill_name} can unlock up to {unlocked} additional opportunities!
          </p>
        </div>
        """

    top_skill = ranked_missing_skills[0].get("skill_name")
    top_demand = ranked_missing_skills[0].get("demand_count")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0B0F19;color:#F3F4F6;margin:0;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #1F2937;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg, #D97706 0%, #B45309 100%);padding:28px 24px;text-align:center;">
          <h1 style="color:#FFFFFF;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">💡 FitFlow Skills Growth Recommendation</h1>
          <p style="color:#FEF3C7;margin:6px 0 0 0;font-size:14px;">Hi {greeting_name}, discover the most in-demand skills for your target roles</p>
        </div>

        <!-- Body -->
        <div style="padding:28px 24px;">
          <p style="background:#F59E0B20;border:1px solid #F59E0B40;color:#FCD34D;padding:14px;border-radius:10px;font-size:14px;margin:0 0 20px 0;line-height:1.5;">
            <strong>{top_skill}</strong> is currently required by <strong>{top_demand} relevant vacancies</strong> in your domain and is not currently listed among your verified skills.
          </p>

          <h3 style="color:#FFFFFF;margin:0 0 14px 0;font-size:16px;">Top High-Demand Missing Skills</h3>
          {top_skills_html}

          <!-- Call to Action -->
          <div style="text-align:center;margin-top:28px;">
            <a href="{dashboard_url}" target="_blank" style="background:#F59E0B;color:#FFFFFF;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 14px rgba(245,158,11,0.4);">
              Update Your Skills on FitFlow →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#0F172A;padding:18px 24px;text-align:center;border-top:1px solid #1E293B;font-size:12px;color:#64748B;">
          <p style="margin:0 0 6px 0;">You received this missing skills recommendation based on your FitFlow profile preferences.</p>
          <p style="margin:0;">Manage your notification settings anytime in your <a href="{dashboard_url}" style="color:#818CF8;text-decoration:underline;">FitFlow Dashboard Settings</a>.</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        if not _init_resend():
            _log_email_delivery(student_id, email_addr, "weekly_skills_recommendation", reporting_period=reporting_period, status="failed", error_message="Resend SDK not configured")
            return False

        params = {
            "from": RESEND_FROM_EMAIL,
            "to": [email_addr],
            "subject": f"💡 Most-Required Skills for Your Profile ({reporting_period})",
            "html": html_content,
        }
        response = resend.Emails.send(params)
        resend_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", str(response))
        print(f"[RESEND SUCCESS] Weekly skills recommendation sent to {email_addr} (Resend ID: {resend_id})")
        _log_email_delivery(student_id, email_addr, "weekly_skills_recommendation", reporting_period=reporting_period, resend_email_id=resend_id, status="sent")
        return True
    except Exception as ex:
        err_msg = str(ex)
        print(f"[RESEND ERROR] Failed to send weekly skills recommendation: {err_msg}")
        _log_email_delivery(student_id, email_addr, "weekly_skills_recommendation", reporting_period=reporting_period, status="failed", error_message=err_msg)
        return False

