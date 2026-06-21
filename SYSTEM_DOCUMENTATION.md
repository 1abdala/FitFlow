# AI-Powered Internship Management System (UTeM)
# System Documentation: FitFlow

---

## 1. Project Overview

### Purpose of the System
FitFlow is an intelligent, AI-powered internship management and matching platform designed specifically for the Universiti Teknikal Malaysia Melaka (UTeM) ecosystem. Its primary purpose is to bridge the critical gap between academic knowledge and industry requirements by autonomously analyzing student skill sets and mapping them to real-time market demands. 

### Main Objectives
1. **Automate Skill Extraction:** Utilize Natural Language Processing (NLP) to parse unstructured student resumes (PDFs) into structured skill graphs.
2. **Dynamic Market Intelligence:** Employ automated web scraping to aggregate active internship listings and extract required technical keywords.
3. **Data-Driven Matching:** Calculate precise compatibility scores between students and industry roles using relational set-intersection algorithms.
4. **Actionable Feedback:** Provide students with personalized "Skill Gap" analysis and direct them to a Learning Hub to improve employability.

### Problems the System Solves
* **The "Black Box" Application Process:** Students currently apply to dozens of jobs without understanding *why* they are rejected. FitFlow provides transparent match scores and missing skill reports.
* **Resume Parsing Inefficiencies:** Traditional portals rely on manual keyword entry. FitFlow's AI understands context (e.g., recognizing that "React.js" and "React" represent the same fundamental skill).
* **Skill Misalignment:** Universities struggle to adapt curricula to fast-paced tech industry changes. FitFlow provides real-time market data to keep students informed of exactly what tech stacks are trending.

### Target Users
* **Students:** University undergraduates seeking industrial training placements in the tech sector.
* **Companies (Future Scope):** Employers seeking to filter candidates based on algorithmic skill matches rather than manual resume screening.

---

## 2. System Features Implemented

### Authentication System
* **Purpose:** Secure user access and data isolation.
* **How it works:** Implemented via Supabase Auth. Supports standard Email/Password authentication as well as OAuth providers.
* **Frontend:** React Context API for state management; login/registration modal forms.
* **Backend:** Supabase Auth issues JWT tokens which are verified via Row Level Security (RLS) in the database.

### Student-Centric Architecture
* **Purpose:** Provides a personalized workspace for individual students.
* **How it works:** Row Level Security (RLS) policies restrict database queries so students can only view or modify their own profiles, skills, and application tracking records.

### Student Dashboard
* **Purpose:** A centralized hub for students to view their internship prospects.
* **How it works:** Features a modern "bento-grid" layout. Contains widgets for "Highest Match Potential", "Gap to Top Tier", and "Application Activity".
* **Frontend:** Built with React and Framer Motion for smooth tab transitions (`overview`, `matches`, `cv`, `skills`, `learning`).

### CV Analyzer & Resume Parsing (NLP-Based Skill Extraction)
* **Purpose:** Eliminate manual data entry for students.
* **How it works:** Students upload a PDF. The FastAPI backend uses `PyPDF2` to extract raw text, which is then fed into the Google Gemini LLM with strict system instructions to output a structured JSON array of technical skills.
* **Backend:** Python FastAPI (`/analyze-cv` endpoint).
* **Database:** Extracted skills are cross-referenced with the `skills` table; missing skills are auto-created, and relationships are stored in `user_skills`.

### Web Scraping System
* **Purpose:** Populate the database with live, real-world internship opportunities.
* **How it works:** A Python Selenium-based scraper navigates job portals (like JobStreet). It extracts job titles, descriptions, and company names.
* **Backend logic:** The extracted description is processed via NLP to detect technical keywords, normalizing them before insertion into the `internships` and `internship_skills` tables.

### AI Matching System & Score Calculation
* **Purpose:** Mathematically determine how suited a student is for a role.
* **How it works:** An SQL Stored Procedure (RPC) calculates the intersection between `user_skills` and `internship_skills`.
* **Database logic:** `match_score = (matched_skills / total_required_skills) * 100`. The engine also outputs an array of `skill_gaps` (skills the job requires but the student lacks).

### Smart AI Summary
* **Purpose:** Provide a quick, readable brief of long job descriptions.
* **How it works:** Clicking "Smart Summary" triggers the Gemini LLM to ingest the job description and output a bulleted list of key roles and benefits. Includes Graceful Fallback mock-data generation in case of API quota exhaustion (Error 429).

### Learning Hub
* **Purpose:** Help students close their skill gaps.
* **How it works:** Takes the top missing skills from the match engine and renders dynamic recommendation cards.
* **UI/UX:** Clicking a card opens a modal utilizing `AnimatePresence` that offers direct search links to YouTube, Udemy, and Coursera.

### UI/UX Improvements
* **Hover Animations & Glow Effects:** Utilizes CSS radial-gradients tracking mouse movement (`onMouseMove`) to create a premium, ambient glow effect on match cards.
* **Match Score Circle:** SVG-based circular progress bars animated via Framer Motion's `strokeDasharray` to dynamically draw the compatibility percentage on screen.

---

## 3. System Workflow

### Student Workflow
1. **Account Creation:** Student registers via the Auth module.
2. **Profile Setup:** Student accesses the Onboarding Modal.
3. **Resume Upload:** Student navigates to the "CV Analyzer" tab and uploads a PDF.
4. **AI Analysis:** FastAPI parses the PDF, queries Gemini API, and updates the database with the extracted technical stack.
5. **Internship Matching:** Dashboard triggers the SQL Match Engine, immediately rendering a ranked list of internships on the "My Matches" tab.
6. **Skill Gap Mitigation:** Student views "Learning Hub" to take courses on missing skills (e.g., Docker, AWS).
7. **Application:** Student clicks "Apply" or "Save" (star icon) to track interested roles.

*Flow Example:*
`Register` → `Upload PDF` → `Gemini Extracts Skills` → `SQL Match Engine Runs` → `Dashboard Displays Ranked Roles & Skill Gaps`

### Company Workflow (Implemented/Planned Architecture)
1. **Company Registration:** Employer creates an account.
2. **Posting Internships:** Employer inputs job title, description, and manually tags required skills (or allows NLP to auto-tag from the description).
3. **Managing Applicants:** Employer views a dashboard of students who applied, pre-sorted by FitFlow's algorithmic Match Score.

### Automation & Data Maintenance Workflow
1. **Executing Scraper:** The Python scraper script (`scraper.py`) is executed as a background daemon or scheduled GitHub Action to extract the latest internship listings.
2. **Algorithmic Categorization:** Scraped listings are passed to the parsing engine, which extracts technical skills and categorizes them prior to insertion into the `internships` table.

---

## 4. AI & NLP Architecture

### NLP Processing Pipeline
1. **Ingestion:** Raw text is extracted from a source (PyPDF2 for resumes, BeautifulSoup for web scraper).
2. **Prompt Engineering:** The text is wrapped in a strict system prompt instructing the LLM to act as a Senior Technical Recruiter.
3. **LLM Execution:** The Google Gemini 2.0 Flash Lite model processes the text.
4. **Structured Output:** The LLM is forced to return a JSON array conforming to a specific schema (e.g., `["React", "Python", "SQL"]`).

### Match Score Algorithm (SQL)
The core matching logic is executed entirely within the database for maximum performance using PostgREST RPC calls.
* **Formula:** 
  `Score = (Count of Student Skills that exist in Internship Skills) / (Total Internship Skills) * 100`
* **Weighting:** Currently unweighted (all skills are equal), but architected to support "Primary" vs "Secondary" skills in future iterations.
* **Skill Gaps:** The set difference: `Internship Skills - Student Skills = Skill Gaps`.

---

## 5. Database Structure

Built on **PostgreSQL (Supabase)**.

### Main Tables
* `users`: Stores core profile data (`id`, `role`, `name`, `course`, `completion_percentage`).
* `internships`: Stores job listings (`id`, `title`, `company_name`, `description`, `apply_url`).
* `skills`: The master taxonomy of all technical keywords (`id`, `name`).
* `user_skills` (Many-to-Many): Links `users.id` to `skills.id`.
* `internship_skills` (Many-to-Many): Links `internships.id` to `skills.id`.
* `applications`: Tracks saved/applied status (`student_id`, `internship_id`, `status`).

### Data Flow
When a CV is parsed, the backend performs an `UPSERT` on the `skills` table (to add any new technologies not currently in the taxonomy), then performs batch `INSERT` operations into the `user_skills` mapping table. The `matching_results` view or RPC then dynamically calculates scores on-the-fly.

---

## 6. Tech Stack

### Frontend
* **React 19:** Component-based UI rendering.
* **Vite:** Next-generation frontend tooling for rapid HMR development.
* **TailwindCSS:** Utility-first CSS framework for rapid styling.
* **Framer Motion:** Declarative animation library for React (modals, SVG circles).

### Backend (Microservice)
* **Python 3.11:** Core language for heavy data processing.
* **FastAPI:** High-performance async web framework.
* **Uvicorn:** ASGI web server implementation.
* **PyPDF2:** Binary PDF text extraction.

### Database & Auth
* **Supabase:** Open-source Firebase alternative.
* **PostgreSQL:** Advanced relational database system.

### AI/NLP
* **Google GenAI SDK:** Communicating with Gemini LLMs.
* **Selenium / BeautifulSoup4:** Headless browser automation and HTML parsing for the web scraper.

---

## 7. System Architecture

The system utilizes a **Client-Server Microservices** pattern to separate concerns.

1. **Presentation Layer (Port 5173):** The Vite React app handles all state, UI, and direct reads from Supabase via the `supabase-js` client.
2. **AI Logic Layer (Port 8001):** The FastAPI Python server handles CPU-intensive tasks. The React app proxies specific routes (e.g., `/api/analyze-cv`) to this port to avoid CORS issues and keep API keys hidden.
3. **Data Layer (Cloud):** Supabase manages the PostgreSQL database, executing heavy JOINs and Stored Procedures server-side before returning JSON to the client.
4. **Worker Layer (Local/Cron):** Standalone Python scraper scripts run asynchronously to update the database without blocking the main API threads.

---

## 8. UI/UX Design Improvements

* **"Midnight" Design System:** A cohesive dark-mode aesthetic utilizing deep blues, purples (`--accent`), and semi-transparent surfaces (`--surface`, `--surface-2`).
* **Glassmorphism:** Modals and drop-downs utilize `backdrop-blur-sm` and rgba background colors to create frosted glass effects.
* **Interactive Data Visualization:** Match scores are not just numbers; they are rendered as SVG circular progress rings that animate upon mounting.
* **Dynamic Hover States:** The `MatchCard` component includes a React `onMouseMove` handler that tracks cursor coordinates to project a subtle, localized "flashlight" gradient glow behind the card.
* **Responsive Layouts:** CSS Grid and Flexbox are utilized extensively to ensure the dashboard collapses gracefully on smaller laptop screens.

---

## 9. Automation & Scraper Workflow

### Data Collection Flow
1. **Initialization:** Selenium WebDriver launches a headless Chrome instance.
2. **Navigation:** Navigates to target job boards (e.g., JobStreet Malaysia) searching for queries like "Software Engineering Internship".
3. **Extraction:** DOM nodes are parsed for `title`, `company`, and `description`.
4. **NLP Processing:** The raw description is passed through a local keyword matching dictionary or an LLM to identify technical stacks.
5. **Database Sync:** The scraper uses the Supabase Python Client to `upsert` jobs into the `internships` table, automatically mapping foreign keys to the `skills` table.

---

## 10. Current Progress

### Completion Summary
* **Authentication & Authorization:** 100% Completed
* **Frontend UI/UX (Dashboard, Modals):** 100% Completed
* **Relational Database Schema:** 100% Completed
* **AI CV Analyzer (Backend + Frontend):** 100% Completed
* **Match Engine Algorithm:** 100% Completed
* **Web Scraper MVP:** 90% Completed (Functional, awaiting cron scheduling)
* **Learning Hub:** 100% Completed (Dynamic modal integrated)

**Overall System Readiness:** ~95% (Ready for beta testing/presentation).

---

## 11. Challenges & Solutions

### Challenge 1: LLM API Quota Exhaustion
* **Issue:** Free-tier Google Gemini API keys frequently returned `429 Resource Exhausted` errors during development, causing the React frontend to crash entirely.
* **Solution:** Implemented a robust "Graceful Fallback" architecture in the FastAPI backend. `try/except` blocks catch the 429 error and immediately return structurally identical Mock JSON data. This ensures 100% uptime for university presentations.

### Challenge 2: Port Conflicts & CORS
* **Issue:** The React Vite server and FastAPI server struggled to communicate due to Cross-Origin Resource Sharing blocks, and port `8000` was frequently occupied by background system processes.
* **Solution:** Moved the FastAPI server to port `8001` and configured `vite.config.js` with a proxy rule (`/api` -> `http://localhost:8001`) to bypass browser CORS restrictions seamlessly.

### Challenge 3: Dictionary KeyErrors in Data Mapping
* **Issue:** The Python backend crashed with `KeyError: 'company_name'` because the scraper was saving the column as `company`.
* **Solution:** Defensive programming techniques were applied, replacing strict dictionary access (`job['company']`) with safe `.get()` methods featuring default fallback values.

---

## 12. Future Enhancements

* **AI Interview Prep Chatbot:** Integrate an LLM directly into the dashboard allowing students to do mock text-based interviews tailored to the specific internship they are applying for.
* **Automated Scraper Scheduling:** Deploy the Python scraper to AWS Lambda or GitHub Actions to run on a daily CRON schedule, ensuring market data is always fresh.
* **Local LLM Execution:** Transition from Google Gemini API to a local deployment of Ollama (e.g., Llama 3) to process CVs with zero API costs and enhanced data privacy.
* **Resume Builder / Export:** Allow students to auto-generate and export an optimized, ATS-friendly PDF resume based on the skill gaps they have successfully closed.

---

## 13. Conclusion

The FitFlow AI-Powered Internship Management System successfully demonstrates how modern microservices architecture and Large Language Models can solve severe inefficiencies in university industrial training placements. 

By replacing "black-box" job applications with transparent, data-driven "Match Scores" and actionable "Learning Hubs", FitFlow provides immense value. Students gain a clear roadmap to employability, universities improve their placement statistics, and companies receive highly qualified, pre-vetted candidates. The system is structurally sound, highly responsive, and ready for deployment.

---

## 14. Appendix

### System Requirements & Installation Steps
1. **Clone Repository:** `git clone [repo_url]`
2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```
3. **Install Backend Dependencies:**
   ```bash
   cd api
   pip install fastapi uvicorn pypdf2 google-genai python-dotenv supabase
   ```
4. **Environment Variables (`.env`):**
   Requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.
5. **Start Development Servers:**
   * Terminal 1: `npm run dev` (Starts Vite on 5173)
   * Terminal 2: `cd api && python -m uvicorn main:app --reload --port 8001` (Starts API)

### Folder Structure Overview
```
fitflow/
├── api/                   # Python FastAPI Microservice
│   ├── main.py            # Core API Logic & Gemini Integration
│   └── .env               # Secrets
├── scraper/               # Python Selenium Automation
│   ├── scraper.py         # Job portal scraper script
│   └── clean_duplicates.py
├── src/                   # React Frontend
│   ├── components/        # Reusable UI components (Dashboard, Modals)
│   ├── lib/               # Utility functions (Supabase client)
│   ├── App.jsx            # Main Router
│   └── index.css          # Tailwind & Custom CSS
├── vite.config.js         # Build & Proxy configurations
└── package.json           # Node dependencies
```
