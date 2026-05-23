# FitFlow Security Audit Report

**Date:** 2026-05-23  
**Auditor:** Claude Code (Automated Static Analysis)  
**Scope:** Full codebase — frontend, backend API, scraper pipeline, configuration  
**Commit range:** 7285fb3 → 1d42187

---

## EXECUTIVE SUMMARY

| Severity | Count |
|----------|-------|
| CRITICAL | 4     |
| HIGH     | 6     |
| MEDIUM   | 7     |
| LOW      | 5     |
| **Total**| **22**|

**Overall Risk Level: CRITICAL**

**Recommendation: ⛔ DO NOT DEPLOY** until all Critical and High findings are resolved.

Two findings alone make immediate deployment dangerous: plaintext passwords being written to a database table, and real credentials living in git history. These must be remediated first.

---

## FINDINGS BY CATEGORY

---

### 1. AUTHENTICATION & AUTHORIZATION

---

#### 1.1 Plaintext Password Stored in Custom `users` Table

**Severity: CRITICAL**  
**Location:** `src/components/AuthPage.jsx:96`

**Issue:** When a new user verifies their OTP, the app inserts a row into the public `users` table and passes the raw `password` string as `password_hash`. The column name implies hashing but the value is the plaintext password typed by the user.

```javascript
// BAD — AuthPage.jsx:96
const { data: userData } = await supabase.from('users').insert([{
  id: data.user.id,
  name,
  email,
  password_hash: password,   // ← literal plaintext password!
  role
}]).select().single();

// GOOD — never store passwords outside auth.users.
// Remove the password_hash column entirely.
// Supabase Auth already handles hashing in auth.users.
const { data: userData } = await supabase.from('users').insert([{
  id: data.user.id,
  name,
  email,
  role
}]).select().single();
```

**Impact:** Any database read (e.g. via an over-permissive RLS policy, a compromised Supabase project, a future SQL injection, or an admin mistake) exposes every user's real password in cleartext. Because people reuse passwords, this cascades to credential stuffing attacks on other services.

**Fix:**
1. Remove the `password_hash` column from the public `users` table via a migration.
2. Delete the `password_hash` field from the insert call.
3. Run a one-time script to NULL out any existing rows.

**Estimated fix time:** 1 hour  

---

#### 1.2 User Session / Role Stored in Mutable `localStorage`

**Severity: HIGH**  
**Location:** `src/components/AuthPage.jsx:63,97,125`, `src/components/Dashboard.jsx:355`, `src/components/OnboardingModal.jsx:142,174`, `src/components/CVAnalyzerPage.jsx:94`

**Issue:** The entire user object — including `role`, `completion_percentage`, `id`, and profile fields — is stored in `localStorage` under the key `fitflow_user`. Dashboard authorization decisions (which tab to show, which data to fetch) are made from this client-controlled value.

```javascript
// BAD — Dashboard.jsx:355-366
const userData = localStorage.getItem('fitflow_user');
setUser(JSON.parse(userData));  // anyone can edit this in DevTools

// If user edits localStorage to set role: "coordinator", they
// get a different UI. Frontend role-gating is not security.

// GOOD — derive role server-side on every auth change
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    const { data } = await supabase.from('users')
      .select('id, name, role, profile_completed, completion_percentage')
      .eq('id', session.user.id)
      .single();
    setUser(data);
  }
});
```

**Impact:**
- A user can change their `role` to `coordinator` by editing localStorage and see coordinator UI paths.
- An XSS attack that runs JS in the page context steals the full user profile.
- A stale object in localStorage (e.g. after password reset) may grant incorrect access.

**Fix:**
1. Remove all `localStorage.setItem('fitflow_user', ...)` calls.
2. On `supabase.auth.onAuthStateChange` re-fetch the minimal profile from the DB.
3. Store only ephemeral UI state (e.g. `activeTab`) in localStorage, never identity data.
4. All authorization decisions that matter must be enforced by RLS policies in Supabase, not by the frontend.

**Estimated fix time:** 3–4 hours

---

#### 1.3 No Route Guard on `/dashboard`

**Severity: HIGH**  
**Location:** `src/App.jsx:12-22`

**Issue:** The `/dashboard` route is not protected. `Dashboard.jsx` reads `fitflow_user` from localStorage and redirects to `/auth` if missing, but this is a client-side check only. There is no server-side session verification and no React-level protected route wrapper.

```javascript
// BAD — App.jsx
<Route path="/dashboard" element={<Dashboard />} />

// GOOD — wrap in a ProtectedRoute component
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);
  if (session === undefined) return null; // loading
  return session ? children : <Navigate to="/auth" replace />;
}

<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

**Impact:** Slightly mitigated by backend RLS (Supabase rejects unauthenticated queries), but combined with the localStorage-reliance issue, a user with a stale/fake localStorage object may see a broken dashboard rather than being properly redirected.

**Estimated fix time:** 1 hour

---

#### 1.4 No Rate Limiting on Authentication or API Endpoints

**Severity: HIGH**  
**Location:** `api/main.py` (FastAPI backend); also applies to Supabase Auth

**Issue:** The FastAPI backend has no rate limiting middleware. The `/analyze-cv` endpoint accepts large PDF files and makes Gemini API calls with no throttle. The Supabase auth endpoints (login, signup, OTP) also have no application-level rate limit configured.

```python
# BAD — api/main.py
@app.post("/analyze-cv")
async def analyze_cv(request: Request, student_id: str = Form(...), file: UploadFile = File(...)):
    # no rate check — anyone can spam Gemini API calls

# GOOD — add slowapi middleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/analyze-cv")
@limiter.limit("5/minute")
async def analyze_cv(request: Request, ...):
    ...
```

**Impact:**
- Gemini API quota exhausted by a single attacker, denying service to all users.
- Brute-force of OTP or login credentials (Supabase has some built-in protection but it is minimal).
- Uncontrolled file upload cost (PyPDF2 parsing large files in memory).

**Fix:**
1. Add `slowapi` (or similar) to the FastAPI backend with limits: `5/minute` on `/analyze-cv`, `10/minute` on `/internship/{id}/summary`.
2. Set Supabase Auth rate limiting in the project settings Dashboard.

**Estimated fix time:** 2 hours

---

#### 1.5 CV Analyzer Endpoint — Unverified `student_id` Allows Cross-User Data Writes

**Severity: CRITICAL**  
**Location:** `api/main.py:97-199`

**Issue:** The `/analyze-cv` endpoint accepts `student_id` as a form field and uses it directly to write skills and CV analysis records. The authorization header is checked optionally (`if auth_header`), but even when present, the authenticated user's ID is never compared against the submitted `student_id`.

```python
# BAD — api/main.py:97-199
@app.post("/analyze-cv")
async def analyze_cv(request: Request, student_id: str = Form(...), file: UploadFile = File(...)):
    auth_header = request.headers.get("Authorization")
    if auth_header:                              # ← completely optional!
        token = auth_header.replace("Bearer ", "")
        supabase.postgrest.auth(token)
    # ...
    # student_id from form is NEVER verified against the authenticated user
    supabase.table("user_skills").upsert({"user_id": student_id, ...})
    supabase.table("users").update({"skills": new_skills}).eq("id", student_id)
    supabase.table("cv_analyses").insert({"student_id": student_id, ...})

# GOOD — verify token and extract uid server-side
from supabase import create_client
from fastapi import Depends, Header

async def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    # Verify token with Supabase
    user_resp = supabase.auth.get_user(token)
    if not user_resp.user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_resp.user.id

@app.post("/analyze-cv")
async def analyze_cv(
    request: Request,
    file: UploadFile = File(...),
    authenticated_user_id: str = Depends(get_current_user)  # ← server-derived
):
    # use authenticated_user_id, never trust client-supplied student_id
```

**Impact:** An authenticated attacker can supply a victim's `student_id` in the form body to:
- Overwrite the victim's skill profile.
- Insert malicious CV analysis records under the victim's account.
- Trigger match regeneration for the victim with attacker-controlled skills.

**Estimated fix time:** 2 hours

---

#### 1.6 No Minimum Password Length Enforced Client-Side

**Severity: MEDIUM**  
**Location:** `src/components/AuthPage.jsx:23-31`

**Issue:** The password strength UI shows a strength indicator but does not block submission if the password is weak. A 1-character password would pass.

```javascript
// BAD — no minimum length guard on form submit
if (isLogin) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// GOOD — add to handleSubmit before signUp call
if (!isLogin) {
  if (password.length < 8) {
    setError('Password must be at least 8 characters.');
    return;
  }
  if (password !== confirmPassword) {
    setError('Passwords do not match.');
    return;
  }
}
```

Note: Supabase can enforce minimum length server-side in Auth settings — this should also be configured there.

**Estimated fix time:** 30 minutes

---

### 2. SECRETS MANAGEMENT

---

#### 2.1 Credentials Committed to Git History

**Severity: CRITICAL**  
**Location:** Git commit `7285fb3` (Initial commit)

**Issue:** The initial commit included a `.env` file with real credentials:

```
VITE_SUPABASE_URL=https://frsxpsgshyksykouzbfh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The second commit (`1d42187`) removed the file and updated `.gitignore`, but **the credentials are permanently in the git object store**. Anyone who clones this repo can recover them with `git show 7285fb3:.env`.

Additionally, the current working `.env` on disk (not committed but present) contains:
- `SUPABASE_SERVICE_KEY=sb_secret_QioAJdvG_D3ejbfMosI-kg_mZNslB-Y` — **service role key bypasses ALL RLS policies**
- `GEMINI_API_KEY=AIzaSyDMTFB3nL1SQ8uF-XTTBVDgED3vqQ1sP10`

**Impact:**
- The anon key exposed in history is lower risk (it's public by design and RLS restricts it), but it still confirms the project URL.
- If this repository is ever pushed to a public remote (GitHub, GitLab), the service role key will be accessible in history.
- The service role key grants full database admin access — can read/write any table, bypass RLS, delete data.

**Fix (must do in order):**
1. **Immediately rotate** the Supabase service role key and Gemini API key via their respective dashboards.
2. Do NOT push this repository to any public hosting without first purging git history.
3. To purge: use `git filter-repo --path .env --invert-paths` or BFG Repo Cleaner, then force-push all branches (requires team coordination).
4. For the working .env: confirm it is in `.gitignore` (it is as of commit 1d42187) — do not commit it.
5. In production, inject secrets via environment variables from your hosting platform (Vercel, Railway), never from a committed file.

**Estimated fix time:** 1–2 hours (rotation) + coordination time for history rewrite

---

#### 2.2 `scraper/.env` Contains Service Role Key

**Severity: HIGH**  
**Location:** `scraper/.env:2`

`SUPABASE_SERVICE_KEY=sb_secret_QioAJdvG_D3ejbfMosI-kg_mZNslB-Y`

The scraper correctly reads from environment (`os.environ.get("SUPABASE_SERVICE_KEY")`), but the file itself — if accidentally committed or shared — exposes the highest-privilege Supabase credential.

**Fix:**
- Ensure `scraper/.env` is in `.gitignore` (it is — confirmed in `.gitignore:19`).
- Rotate the key as part of the action in finding 2.1.
- Consider using a Supabase role with only INSERT/UPDATE permissions on `internships`, `skills`, and `internship_skills` — no need for the full service role key in the scraper.

---

### 3. API SECURITY

---

#### 3.1 CORS Allows All Origins

**Severity: HIGH**  
**Location:** `api/main.py:21-27`

```python
# BAD
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # ← any origin can call this API
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GOOD — whitelist only your frontend origin(s)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**Impact:** Any website can make cross-origin requests to your API. Combined with the missing auth checks (finding 1.5), an attacker's website can trick a logged-in user's browser into making requests on their behalf.

**Estimated fix time:** 30 minutes

---

#### 3.2 Detailed Internal Error Messages Leak to Client

**Severity: MEDIUM**  
**Location:** `api/main.py:93`

```python
# BAD — reveals stack trace / internal exception details
except Exception as e:
    print(f"DEBUG: EXCEPTION: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))  # ← leaks to client!

# Also bad — exposes PDF parser errors
raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

# GOOD — generic message to client, full detail in server logs
import logging
logger = logging.getLogger(__name__)

except Exception as e:
    logger.error(f"Internship summary error for {internship_id}: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
```

**Impact:** Exception messages often contain database table names, column names, internal paths, library versions, and query structure — invaluable information for an attacker mapping the system.

**Estimated fix time:** 1 hour

---

#### 3.3 Unauthenticated Internship Summary Endpoint

**Severity: MEDIUM**  
**Location:** `api/main.py:53-93`

```python
@app.get("/internship/{internship_id}/summary")
async def get_summary(internship_id: str, request: Request):
    # No authentication check whatsoever
```

The `/internship/{internship_id}/summary` endpoint makes a Gemini API call for any internship ID without verifying the caller is authenticated. Anyone can enumerate internship IDs and drain your Gemini quota.

**Fix:** Require a valid Supabase JWT (same `Depends(get_current_user)` approach as finding 1.5).

**Estimated fix time:** 30 minutes

---

#### 3.4 No File Size Limit Enforced on Backend

**Severity: MEDIUM**  
**Location:** `api/main.py:107-118`, `src/components/CVAnalyzerPage.jsx:39`

The frontend mentions "Max 5MB" in the UI label, but neither the frontend nor the backend enforces this limit. A user can upload a 500MB PDF and the server will attempt to read and parse it in memory.

```python
# GOOD — add to analyze_cv endpoint
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

content = await file.read()
if len(content) > MAX_FILE_SIZE:
    raise HTTPException(status_code=413, detail="File exceeds 5MB limit.")
```

**Estimated fix time:** 15 minutes

---

### 4. FRONTEND SECURITY

---

#### 4.1 No XSS Vulnerabilities Found via `dangerouslySetInnerHTML`

**Status: SECURE**

A search across all `.jsx` files found no usage of `dangerouslySetInnerHTML`, `eval()`, or `innerHTML`. React's default JSX rendering auto-escapes user-supplied strings. This area is clean.

---

#### 4.2 Sensitive Data in `localStorage`

**Severity: HIGH** (duplicated from 1.2 for completeness)

Summary of all `localStorage` usage found:

| Location | Key | Content | Risk |
|---|---|---|---|
| `AuthPage.jsx:63,97,125` | `fitflow_user` | Full user profile incl. role | HIGH |
| `OnboardingModal.jsx:142,174` | `fitflow_user` | Updated profile | HIGH |
| `CVAnalyzerPage.jsx:94` | `fitflow_user` | Re-fetched profile | HIGH |
| `Dashboard.jsx:507` | `fitflow_user` | Removed on logout ✓ | — |

**Supabase JWT tokens** are managed by the `@supabase/supabase-js` SDK which stores them in localStorage by default. This is acceptable for SPAs but means any XSS can steal them. Mitigation: prevent XSS (React does this well), and use short JWT expiry with refresh tokens (Supabase default is 1 hour).

**The user profile object** should not be in localStorage — see finding 1.2 for the fix.

---

#### 4.3 `VITE_SUPABASE_ANON_KEY` Exposed in Client Bundle

**Status: ACCEPTABLE WITH CAVEATS**

The Supabase anon key is visible in the compiled frontend bundle. This is the intended design: the anon key is a publishable key that grants only the access RLS policies allow. However:
- The anon key must NEVER have elevated privileges.
- RLS policies must be correctly configured on every table.
- The service role key (`SUPABASE_SERVICE_KEY`) must never appear in any frontend file — confirmed it does not.

**Recommendation:** Audit RLS policies (see section 5) to confirm the anon key cannot be abused.

---

#### 4.4 Hardcoded Data in Dashboard

**Severity: LOW**  
**Location:** `src/components/Dashboard.jsx:299,590-599`

Several values are hardcoded as placeholder UI elements without a note that they're fake:

```javascript
// Dashboard.jsx:299 — hardcoded salary for every job
<span className="mono">RM 1,500 - 2,500/mo</span>

// Dashboard.jsx:590-599 — fake KPI delta
delta="▲ 6 pts"
value="12"  // "Saved roles" is hardcoded, not from data
```

**Impact:** Not a security vulnerability per se, but misleading data in a production app erodes trust and could be considered false advertising.

---

### 5. DATABASE SECURITY

---

#### 5.1 SQL Injection

**Status: SECURE**

All database access uses the Supabase JS SDK (frontend) and Supabase Python SDK (backend), both of which use parameterized queries. No raw SQL string concatenation was found in the application code.

The scraper's `insert_internships` also uses the SDK. Scraped data (job titles, descriptions) is passed as values, not concatenated into query strings.

---

#### 5.2 Row Level Security — Cannot Fully Audit Without Schema Access

**Status: NEEDS VERIFICATION**

RLS policies cannot be audited through source code alone. The following tables are referenced in code and need RLS verification:

| Table | Access Pattern | RLS Required |
|---|---|---|
| `users` | Read/write by user id | `auth.uid() = id` on ALL operations |
| `student_profiles` | Read/write by user id | `auth.uid() = id` |
| `coordinator_profiles` | Read/write by user id | `auth.uid() = id` |
| `user_skills` | Read/write by user_id | `auth.uid() = user_id` |
| `tracker_applications` | Read/write by user_id | `auth.uid() = user_id` |
| `applications` | Read/write by student_id | `auth.uid() = student_id` |
| `matching_results` | Read by student_id | `auth.uid() = student_id` |
| `cv_analyses` | Read/write by student_id | `auth.uid() = student_id` |
| `internships` | Public read | `is_active = true` filter recommended |
| `skills` | Public read | No PII, acceptable |
| `internship_skills` | Public read | No PII, acceptable |

**Critical check:** The `users` table is updated by the backend `/analyze-cv` endpoint using the `anon` key + user JWT. If the RLS `UPDATE` policy on `users` is `auth.uid() = id`, an attacker who passes a different `student_id` will be blocked by RLS. However, the `user_skills` upsert and `cv_analyses` insert are at similar risk.

**Recommendation:**
```sql
-- Run these verification queries in Supabase SQL editor:
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Verify no table is missing RLS:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
);
```

---

#### 5.3 `password_hash` Column in `users` Table

**Severity: CRITICAL** (see finding 1.1)

The schema includes a `password_hash` column that receives plaintext passwords. This column should be dropped immediately.

---

#### 5.4 Data at Rest & Backups

**Status: ACCEPTABLE**

Supabase encrypts data at rest (AES-256) and provides automatic daily backups on the Pro plan. Confirm the project is on Pro if backups are required.

---

### 6. DEPENDENCY VULNERABILITIES

---

#### 6.1 npm audit Results

**3 vulnerabilities found: 1 high, 2 moderate**

| Package | Current | Severity | Issue | Fix |
|---|---|---|---|---|
| `vite` | 8.0.0–8.0.4 | HIGH | Path traversal in optimized deps `.map` handling; `server.fs.deny` bypass; arbitrary file read via dev server WebSocket | `npm install vite@latest` |
| `postcss` | <8.5.10 | MODERATE | XSS via unescaped `</style>` in CSS stringify output | `npm install postcss@latest` |
| `ws` | 8.0.0–8.20.0 | MODERATE | Uninitialized memory disclosure | `npm audit fix` |

**Note:** The Vite vulnerabilities affect the **dev server**, not the production build. They are still worth patching because:
- Developers run `vite dev` locally, exposing their filesystem if they visit a malicious site.
- The `server.fs.deny` bypass could leak files from the project root (including `.env`!).

**Fix:**
```bash
npm install vite@latest postcss@latest
npm audit fix
```

---

### 7. SCRAPER SECURITY

---

#### 7.1 Scraped Data Written to DB Without Sanitization Validation

**Severity: LOW**

The scraper writes job titles, company names, descriptions, and location strings directly from third-party websites into the database. These fields are then rendered in the frontend. React auto-escapes JSX, so XSS via stored scraped data is mitigated.

However, there is no length validation on scraped fields. A maliciously long `description` field could bloat the database.

**Recommendation:** Add length caps in `db.py`:
```python
job_core["title"] = job_core.get("title", "")[:255]
job_core["description"] = job_core.get("description", "")[:50000]
```

---

#### 7.2 Scraper Uses Stealth Mode — Potential ToS Violation

**Severity: LOW (Legal/Compliance)**

`scraper.py` disables the `navigator.webdriver` flag and sets a fake user agent to bypass bot detection on JobStreet. While common in scraping, this may violate the target sites' Terms of Service. LinkedIn scraping (via `scraper_linkedin.py`) is particularly sensitive — LinkedIn actively enforces anti-scraping measures.

**Recommendation:** Review whether a JobStreet/LinkedIn official API or data partnership is available for a production system.

---

#### 7.3 Debug Logs Include Sensitive API Output

**Severity: LOW**  
**Location:** `api/main.py:35,55,71,84`

```python
print("DEBUG: Gemini client initialized.")
print(f"DEBUG: Received summary request for ID: {internship_id}")
print(f"DEBUG: Found job: {title}. Sending to Gemini...")
```

Debug-level prints should not appear in production logs. They reveal internal flow, internship IDs, and Gemini usage. In Railway/Docker, `stdout` is often aggregated into a centralized log — these lines would appear there.

**Fix:** Use Python's `logging` module with log levels, and set `LOG_LEVEL=WARNING` in production.

---

### 8. THIRD-PARTY INTEGRATIONS

---

#### 8.1 Gemini API Key

- Key is in `.env` (gitignored — good).
- Key is used only in the backend — not exposed to frontend (good).
- No per-user or per-IP quota tracking is implemented (see finding 3.1 rate limiting).
- The free tier quota could be exhausted; add monitoring/alerting.

---

#### 8.2 Google OAuth Redirect URI

**Status: LOW**

```javascript
// AuthPage.jsx:82
options: { redirectTo: `${window.location.origin}/auth` }
```

Using `window.location.origin` is acceptable, but ensure only `https://your-production-domain.com/auth` is whitelisted in the Google Cloud Console OAuth consent screen. Open redirect via manipulated `window.location.origin` is not possible here (the origin is read-only), but a misconfigured Google Cloud project with too-broad redirect URIs is a common mistake.

**Action:** Verify in Google Cloud Console that only your exact production and development origins are listed.

---

### 9. INFRASTRUCTURE & DEPLOYMENT SECURITY

---

#### 9.1 Security Headers Not Set

**Severity: MEDIUM**

The FastAPI backend does not set security headers. The frontend is served by Vite/Vercel which may add some defaults, but the API has none.

**Recommended headers for the FastAPI backend:**

```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

For Vercel (frontend), add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co;" }
      ]
    }
  ]
}
```

**Estimated fix time:** 1 hour

---

#### 9.2 No HTTPS Enforcement in Backend

**Status: ACCEPTABLE** (when deployed on Railway/Render)

Railway and similar PaaS platforms terminate TLS automatically. The backend does not need to handle HTTPS itself. Confirm `HTTPS-only` is enabled on the Railway service.

---

### 10. PDPA COMPLIANCE (Malaysia)

---

#### 10.1 Sensitive Personal Data Collected

The following personal data is collected from students:

| Field | Sensitivity | PDPA Concern |
|---|---|---|
| Full name | Personal | Need consent |
| Email | Personal | Need consent |
| Date of birth | Sensitive | Need explicit consent |
| Phone number | Personal | Need consent |
| Gender | Personal | Need consent |
| Matric number | Institutional | Need consent |
| Address | Personal | Need consent |
| OKU status | **Sensitive** (disability status) | Explicit consent + strict access control |
| Nationality | Personal | Need consent |

**OKU (disability) status** is classified as sensitive data under PDPA. Storing and processing it requires:
- Explicit, informed consent (separate from general terms).
- Strong access control — only the student and authorized coordinators should see it.
- It should NOT be visible in any analytics or aggregate reporting.

---

#### 10.2 Compliance Checklist

- [ ] **Privacy Policy** — A clear privacy policy must be presented before data collection (no evidence of one found).
- [ ] **Consent screen** — Users should explicitly agree to data collection before the onboarding form.
- [ ] **Right to access** — No `/api/user/data` export endpoint exists.
- [ ] **Right to erasure** — No account deletion feature found. `deleted_at` is used for soft-deleting applications, but not for full user account deletion.
- [ ] **Data retention** — No documented policy on how long CV analyses, skill data, and application history are retained.
- [ ] **Breach notification** — No documented plan for notifying users within 72 hours of a breach (required by PDPA amendments).
- [ ] **Data minimization** — Review whether collecting address is necessary for an internship matching app.

**Recommendation:** Consult a legal advisor familiar with PDPA before handling OKU status data and before public launch.

---

## SUMMARY TABLE

| # | Category | Vulnerability | Severity | Fix Time |
|---|---|---|---|---|
| 1.1 | Auth | Plaintext password in `users` table | CRITICAL | 1h |
| 1.5 | Auth | Unverified `student_id` in `/analyze-cv` | CRITICAL | 2h |
| 2.1 | Secrets | Credentials committed to git history | CRITICAL | 1–2h + rewrite |
| 4.2 | Frontend | User profile (including role) in localStorage | HIGH | 3–4h |
| 1.2 | Auth | Mutable localStorage controls access decisions | HIGH | (same as above) |
| 1.3 | Auth | No route guard on `/dashboard` | HIGH | 1h |
| 1.4 | Auth | No rate limiting on any endpoint | HIGH | 2h |
| 2.2 | Secrets | `SUPABASE_SERVICE_KEY` in `scraper/.env` | HIGH | Rotate now |
| 3.1 | API | CORS `allow_origins: ["*"]` | HIGH | 30m |
| 6.1 | Deps | Vite HIGH severity (path traversal, file read) | HIGH | 15m |
| 1.6 | Auth | No minimum password length enforced | MEDIUM | 30m |
| 3.2 | API | Internal exceptions returned to client | MEDIUM | 1h |
| 3.3 | API | Unauthenticated internship summary endpoint | MEDIUM | 30m |
| 3.4 | API | No file size limit on CV upload (backend) | MEDIUM | 15m |
| 5.2 | Database | RLS policies not audited — needs verification | MEDIUM | 2h audit |
| 6.1 | Deps | PostCSS MODERATE (XSS in CSS stringify) | MEDIUM | 5m |
| 6.1 | Deps | `ws` MODERATE (memory disclosure) | MEDIUM | 5m |
| 9.1 | Infra | Security headers missing | MEDIUM | 1h |
| 4.4 | Frontend | Hardcoded fake data in production UI | LOW | 30m |
| 7.1 | Scraper | No length limits on scraped field storage | LOW | 30m |
| 7.2 | Scraper | Scraper violates ToS (stealth mode) | LOW | Review |
| 7.3 | Scraper | Debug prints in production code | LOW | 30m |

---

## REMEDIATION PRIORITY

### CRITICAL — Fix before any further development or deployment

1. **Remove plaintext password from `users` table** (`AuthPage.jsx:96`) — drop `password_hash` from the INSERT and run a migration to remove/nullify the column.
2. **Verify `student_id` against auth token in `/analyze-cv`** — extract user ID from the JWT server-side, never trust a client-supplied ID.
3. **Rotate all secrets immediately** — Supabase service role key and Gemini API key. Do NOT push to any public remote until git history is cleaned.
4. **Never store user profile object in localStorage** — re-derive from Supabase on auth state change.

### HIGH — Fix before launch

5. **Restrict CORS** to your production domain in `api/main.py`.
6. **Add rate limiting** to `/analyze-cv` and `/internship/{id}/summary`.
7. **Add route guard** to `/dashboard` using Supabase session check.
8. **Update Vite** to fix path traversal and file read vulnerabilities.
9. **Rotate `SUPABASE_SERVICE_KEY`** even if `scraper/.env` was never committed — as a precaution.

### MEDIUM — Fix within the first sprint post-launch

10. **Add security headers** (HSTS, X-Frame-Options, CSP) to backend and Vercel config.
11. **Replace `str(e)` error responses** with generic messages; log detail server-side.
12. **Require authentication** on the internship summary endpoint.
13. **Enforce 5MB file size limit** in the backend.
14. **Audit all RLS policies** in Supabase dashboard.
15. **Enforce minimum password length** (8 chars) on the frontend form.
16. **Update postcss and ws** via `npm audit fix`.

### LOW — Plan for near term

17. Add account deletion endpoint (PDPA right to erasure).
18. Add a privacy policy and consent screen before data collection.
19. Replace debug `print()` statements with structured logging.
20. Add length limits on scraped data before DB insert.
21. Review scraper ToS compliance with JobStreet/LinkedIn.

---

## DEPLOYMENT READINESS

**Security Score: 38/100**

**Safe to deploy? ⛔ NO**

The combination of plaintext passwords stored in the database, credentials in git history, and the unauthenticated `/analyze-cv` authorization bypass makes this application unsafe to expose publicly in its current state.

**Realistic timeline to safe deployment:**
- Day 1: Fix CRITICAL items (4–6 hours of work)
- Day 2: Fix HIGH items (8–10 hours of work)
- Day 3–5: Fix MEDIUM items, audit RLS, update deps
- Day 6: Re-test and verify all fixes, re-run audit

**Post-deployment monitoring recommendations:**
1. Enable Supabase Auth logs and alert on spike in failed login attempts.
2. Set up Gemini API quota alerting in Google Cloud Console.
3. Use Railway/Vercel log drains to a centralized logging service (e.g. Logtail, Better Stack).
4. Add uptime monitoring (e.g. UptimeRobot) on the FastAPI backend health endpoint.
5. Schedule monthly `npm audit` and Python dependency audits.

---

*Generated by automated static analysis — human review recommended before sign-off.*
