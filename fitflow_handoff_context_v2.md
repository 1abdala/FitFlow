# FitFlow End-to-End System Context (Handoff for AI Review)

**Project Concept:** FitFlow is a sophisticated internship matching platform designed to intelligently map university students to real-world technical internships. Instead of a standard job board, the system calculates algorithmic Match Scores based on specific technical capabilities, surfacing explicit "Skill Gaps" to help students prioritize learning.

---

## 🏗️ 1. What Has Been Completely Built (Current Production State)

### A. The Database Backend (Supabase PostgreSQL)
The core infrastructure is 100% physically deployed and structurally locked.
- **Relational Integrity:** Implemented explicit mapping tables (`profiles`, `student_profiles`, `skills`, `internships`, `user_skills`, `internship_skills`, `matching_results`, `skill_gaps`).
- **The "Match Engine":** A heavily engineered SQL RPC stored procedure (`generate_internship_matches(p_student_id)`) exists natively. When executed, it calculates pure mathematical intersections crossing `user_skills` dynamically against `internship_skills`, dropping exact Match Percentages correctly into `matching_results`.

### B. The External Data Pipeline (Python Scraper)
Because the Match Engine is useless without real jobs, we built a fully autonomous Python Scraper targeting `my.jobstreet.com`.
- **Bypass Capabilities:** Successfully ducks Cloudflare and DataDome natively parsing raw DOM payloads without headless detection.
- **NLP Dictionary Mapping (The Flaw):** Automatically rips text from employment boxes attempting to pull explicit skills mapping them against a strict internal `SKILL_KEYWORDS` Python dictionary. Drops the scrubbed arrays organically into `internship_skills` without breaking Database schema constraints.

### C. The Frontend UI (React + Tailwind + Vite)
We have an operational Client web application managing lifecycle flow.
- **`AuthPage.jsx`:** Fully working Google OAuth & Email/Password routing directly hooking Supabase Auth natively.
- **`OnboardingModal.jsx`:** A highly complex popup triggering if the user's `completion_percentage` is below 100%. **Crucially**, it possesses a working Dynamic Skill Tagging UI allowing students to type abilities (e.g. "React") mapping perfectly locally into `user_skills`, culminating in automatically firing the Supabase Match Engine RPC cleanly.
- **`Dashboard.jsx`:** Features a modern, Glassmorphic Bento-Grid UI layout successfully rendering a small widget highlighting the "Top 3 Generated Matches" live from the Database utilizing a `use_effect` initialization sequence.

---

## 🚨 2. The Current Fatal Flaws (What We Must Fix Immediately)

As identified previously during peer-review, the system is actively failing in two core ways preventing a successful End-to-End lifecycle demonstration:

### A. The Scraper's NLP Dictionary is Too Small (The 0% Match Bug)
Currently, the `SKILL_KEYWORDS` array inside `scraper.py` only contains ~15 hardcoded tech words. Because JobStreet listings regularly use alternative vernacular or diverse technologies (e.g., C++, Figma, Agile, Marketing), the scraper fails to identify them, saving countless internships with an EMPTY `skills` array.
👉 **The Impact:** When an internship possesses 0 skills, the `generate_internship_matches` engine calculates a 0% Match, rendering the mathematical accuracy completely useless to the student.

### B. The "My Matches" Screen is Fake
Inside `Dashboard.jsx`, the Sidebar possesses a button specifically mapped for `<SidebarItem label="My Matches"/>`. Clicking this button does absolutely nothing. The Dashboard stubbornly only ever renders the single "Overview Widget" because the dynamic routing logic handling the `activeTab === 'matches'` state was never written.

---

## 🚀 3. What Needs to Be Built Next (The Critical Path)

If we want the project to practically succeed as a measurable system for university examiners, we must exclusively prioritize the following components before touching secondary attributes (like TF-IDF rankings).

1. **Supercharge the Python NLP Taxonomy:** Overhaul `scraper.py`'s lexical tracking array dropping in 100+ generic Business, Core-Tech, and Design keywords guaranteeing a 90%+ skill capture rate across all 50 internships we download.
2. **Build the Full `My Matches` React View:** Inside `Dashboard.jsx`, wrap the current Grid inside `{activeTab === 'overview'}`, and formally build out a full-screen vertical scrolling view specifically mapping the student's `matching_results` when they switch tabs to view all available percentages natively.
3. **Resolve Skill Gaps UI:** `Dashboard.jsx` currently displays the top missing skills. The next UX goal is integrating actionable routing providing URLs (simulated or real) mapping those specific `skill_gaps` against a `learning_resources` table explicitly directing students where they can master their deficits.
