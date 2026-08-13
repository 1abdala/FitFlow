# FitFlow Security Test Report

**Date:** 2026-08-11  
**Method:** static code review, targeted validation tests, and production build.  
**Scope limitation:** no separate Supabase staging project, test accounts, or browser proxy were available. RLS policies, live auth throttling, OTP expiry, and cross-user access must therefore be verified before release.

## Remediated Findings

### SF-01: Matric number accepted invalid characters

- **Severity:** High
- **CWE:** CWE-20, Improper Input Validation
- **Affected components:** onboarding and Settings profile forms
- **Evidence:** the previous handlers wrote the uppercased field value directly and submission only checked that it was non-empty.
- **Fix:** `src/lib/profileValidation.js` accepts only `B` followed by nine digits. Both forms reject invalid submissions, remove invalid typed characters, limit the input to ten characters, and show the expected format. `migrations/04_profile_input_constraints.sql` supplies database `CHECK` constraints for all new or updated rows.
- **Retest:** `B032320119` passes. `ABCD123456`, `B03232O119`, spaces, dashes, and appended characters fail.

### SF-02: CV upload validation could be bypassed and large files were fully read into memory

- **Severity:** High
- **CWE:** CWE-434, Unrestricted Upload of File with Dangerous Type
- **Fix:** the client checks extension, MIME type, and a 10 MB limit. The API independently checks extension/MIME type, preflights content length, streams reads with a 10 MB cap, and validates the PDF signature before `PyPDF2` parsing.
- **Residual risk:** MIME type and signature checks are not malware scanning. Deploy malware scanning if uploaded documents are retained or made available to other users.

### SF-03: Service-role key committed in a utility fallback

- **Severity:** Critical
- **CWE:** CWE-798, Use of Hard-coded Credentials
- **Location:** `scraper/scratch_upgrade_db.py`
- **Fix:** removed the hard-coded URL/key fallback; both values must now be supplied through environment variables.
- **Required operational action:** rotate the exposed Supabase service-role key immediately. Removing it from the working tree does not remove it from Git history or existing clones.
- **History check:** the secret was introduced in commit `e2f53e6` on 2026-05-23 17:31:44 +08:00 and removed in `e6e9e55` on 2026-05-23 17:33:51 +08:00. It is still recoverable from Git history, so rotation remains mandatory.

### SF-04: AI interview endpoints lacked request-size bounds and rate limits

- **Severity:** Medium
- **Fix:** request models now limit role, interview type, difficulty, question count, and answer length. Session creation, questions, and evaluation have per-IP limits of 10/minute, 20/minute, and 5/minute respectively. AI-produced dimension scores are clamped to 0-100 before persistence.

### SF-05: Backend responses exposed internal exception text

- **Severity:** Medium
- **Fix:** reviewed API exception responses were changed to generic client messages while retaining server-side diagnostic logging.

## Verified Controls

- The CV endpoint requires a bearer token and compares the submitted `student_id` with the authenticated user ID.
- Interview question/evaluation endpoints verify the session owner before loading or modifying session data.
- React text rendering escapes normal user-entered values; the only `dangerouslySetInnerHTML` use found is populated by static in-source avatar SVG presets, not user input.
- Supabase query-builder methods are used rather than handwritten SQL concatenation in the application code reviewed.

## Release Blockers / Required Staging Tests

1. Apply migration `04_profile_input_constraints.sql`, remediate any legacy invalid data, then run the commented `VALIDATE CONSTRAINT` statements.
2. Rotate the exposed service-role key and invalidate all old copies.
3. Verify Supabase RLS with two test users for `profiles`, `student_profiles`, `user_skills`, `applications`, `cv_analyses`, interview tables, storage objects, and all RPC functions. In particular, confirm `generate_internship_matches` cannot generate or reveal another user's results.
4. Configure Supabase Auth password, OTP, and login rate limits. The frontend cannot enforce a reliable account lockout.
5. Run authenticated and unauthenticated API tests against staging: malformed JWT, expired JWT, cross-user IDs, 429 response thresholds, and 10 MB plus invalid-PDF uploads.
6. Adopt a Content Security Policy and ensure production CORS allows only the deployed frontend origin. Bearer tokens stored in browser storage make XSS prevention especially important.

## Deployment Hardening Added

- `vercel.json` now emits a Content Security Policy and Permissions Policy alongside the existing security headers.
- Set `ALLOWED_ORIGINS=https://your-production-frontend.example` in the API deployment environment. It accepts a comma-separated allowlist when more than one trusted frontend origin is required; never configure `*` with credentialed requests.

## Verification Performed

- `node --input-type=module` validation assertions passed for valid and invalid matric/phone values.
- `npm.cmd run build` passed.
- `npm.cmd run lint` remains failing due to 153 existing repository-wide lint errors, including unused imports and hook-order violations in unrelated components. It is not a clean baseline for this change.
- Python syntax compilation could not run in this environment because the installed Python launcher is blocked by the execution policy.
