import re
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TARGET_URL = "https://my.jobstreet.com/internship-jobs"

# ── Tech title allowlist ─────────────────────────────────────────────
# A job MUST match at least one of these (word-boundary aware) to be kept.
# Short tokens like "it", "ai", "qa" use \b so they don't match inside
# longer words (e.g. \bit\b won't match "audit" or "hospitality").
_TECH_TITLE_RE = re.compile(
    r'\b(?:'
    r'software|developer|development|'
    r'engineer(?:ing)?|'
    r'programmer|programming|'
    r'data|analyst|analytics|'
    r'science|scientist|'
    r'computer|computing|'
    r'technolog(?:y|ies|ical)|technical|'
    r'tech|'
    r'cloud|devops|devsecops|mlops|'
    r'network(?:ing)?|'
    r'systems?|infrastructure|'
    r'cybersecurity|cyber|'
    r'web|'
    r'mobile|'
    r'frontend|back.?end|fullstack|full.?stack|'
    r'ui.?ux|user.experience|user.interface|'
    r'qa|quality.assurance|'
    r'testing|automation|'
    r'iot|embedded|firmware|robotic|'
    r'blockchain|database|'
    r'sap|erp|salesforce|'
    r'helpdesk|help.desk|service.desk|'
    r'ict|it|'
    r'multimedia|animation|gaming|'
    r'sre|platform|'
    r'machine.learning|artificial.intelligence|'
    r'ai|ml|'
    r'information.technolog|information.system|'
    r'digital|'
    r'security'
    r')\b',
    re.IGNORECASE,
)

# ── Non-tech blocklist ───────────────────────────────────────────────
# Secondary guard: even if a tech keyword slips in (e.g. "Digital Marketing"),
# these phrases immediately reject the title.
NON_TECH_ANTI_KEYWORDS = [
    # Business & finance
    'marketing', 'hr ', 'human resource', 'human resources',
    'accounting', 'accountant', 'finance', 'financial',
    'tax ', 'taxation', 'audit', 'auditing', 'compliance',
    'legal', ' law ', 'paralegal',
    'sales', 'business development',
    'procurement', 'purchasing', 'supply chain', 'logistics',
    'banking', 'insurance', 'investment',
    'real estate', 'property management',
    # HR & admin
    'recruitment', 'talent acquisition',
    'admin ', 'administration', 'administrative',
    'clerical', 'receptionist',
    'operation ', 'operations management',
    # Non-IT engineering & manufacturing
    'civil engineering', 'civil intern',
    'mechanical engineer', 'mechatronic',
    'electrical engineer',
    'chemical engineer', 'chemical process',
    'plant ', 'process engineer', 'process technician',
    'manufacturing', 'production planning',
    'quantity surveyor', 'architecture intern',
    'geotechnical', 'structural engineer',
    # Customer-facing (non-tech)
    'customer service', 'customer experience', 'customer success',
    'customer engagement', 'customer support', 'customer care',
    'call centre', 'call center',
    # Communications & media
    'public relation', 'pr intern',
    'content writer', 'copywriter', 'journalist',
    'media relation', 'broadcast',
    # Design (non-digital)
    'graphic design', 'interior design', 'fashion design',
    'textile',
    # Healthcare
    'healthcare', 'medical ', 'nursing', ' nurse ',
    'pharmacy', 'pharmacist', 'clinical ',
    # Education
    ' teacher', 'teaching ', 'tutor',
    # Hospitality & tourism
    'hospitality', 'tourism', 'hotel', 'culinary',
    'event management', 'event planning',
    # Retail
    'retail', 'merchandising',
    # Generic govt / non-specific programmes
    'teraju', 'yayasan',
]

SKILL_KEYWORDS = {
    # --- Core Languages ---
    "Python": ["python", "python3"],
    "Java": ["java", "core java", "j2ee"],
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "C++": ["c++", "cpp", "c/c++", "c c++"],
    "C#": ["c#", "csharp", "c sharp"],
    "C": ["c programming", "c language"],
    "Go": ["golang", "go programming", "go language"],
    "Rust": ["rust"],
    "PHP": ["php"],
    "Swift": ["swift", "swiftos"],
    "Kotlin": ["kotlin"],
    "Ruby": ["ruby", "ruby on rails", "ror"],
    "R": ["r programming", "r language", "rstudio"],
    "SQL": ["sql", "structured query language"],
    "Scala": ["scala"],

    # --- Web & Frameworks ---
    "React": ["react", "react.js", "reactjs", "react native"],
    "Angular": ["angular", "angular.js"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "Node.js": ["node", "node.js", "nodejs"],
    "Django": ["django", "django framework"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi"],
    "Spring Boot": ["spring", "spring boot", "springboot"],
    "Laravel": ["laravel"],
    "ASP.NET": ["asp.net", ".net", "dotnet"],
    "HTML/CSS": ["html", "css", "html5", "css3", "html/css", "html css"],
    "Tailwind CSS": ["tailwind", "tailwindcss"],
    "GraphQL": ["graphql"],
    "REST API": ["rest api", "restful api", "restful"],

    # --- Databases & Warehouses ---
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "Oracle": ["oracle", "oracle database", "oracle db"],
    "Snowflake": ["snowflake"],
    "Databricks": ["databricks"],

    # --- Cloud & DevOps ---
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "microsoft azure"],
    "Google Cloud": ["gcp", "google cloud", "google cloud platform"],
    "Docker": ["docker", "dockerize"],
    "Kubernetes": ["kubernetes", "k8s"],
    "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
    "Jenkins": ["jenkins"],
    "Terraform": ["terraform"],
    "Linux": ["linux", "unix", "ubuntu", "centos", "bash", "shell window"],
    "Azure Data Factory": ["azure data factory", "adf"],

    # --- Data & AI ---
    "Machine Learning": ["machine learning", "ml", "machine-learning"],
    "Artificial Intelligence": ["artificial intelligence", "ai"],
    "Data Analysis": ["data analysis", "data analytics", "data analyst", "visualization"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch"],
    "Pandas": ["pandas"],
    "Data Engineering": ["data engineering", "data pipeline", "etl", "data ingestion", "data integration", "data lake", "data modelling"],
    "Power BI": ["power bi", "powerbi", "tableau"],
    "Computer Vision": ["computer vision"],
    "NLP": ["nlp", "natural language processing"],

    # --- IT Infrastructure & Helpdesk ---
    "Networking": ["networking", "network management", "tcp/ip", "lan/wan", "network+", "tcp ip"],
    "Troubleshooting": ["troubleshooting", "hardware troubleshooting", "software troubleshooting", "technical support", "it support"],
    "System Administration": ["system administration", "sysadmin", "system admin"],
    "Active Directory": ["active directory", "ad"],
    "VMware": ["vmware", "virtualization", "hyper-v"],
    "Cybersecurity": ["cybersecurity", "cyber security", "information security", "infosec", "comptia", "network security", "it security", "firewall", "ips"],
    "OSI Model": ["osi model", "osi"],

    # --- Business, Design & Soft Skills ---
    "Microsoft Office": ["microsoft office", "ms office", "office 365", "microsoft office suite", "excel", "powerpoint", "word"],
    "Project Management": ["project management", "agile", "scrum", "kanban", "jira", "azure devops"],
    "Git": ["git", "version control", "github", "gitlab"],
    "UI/UX Design": ["ui/ux", "ui ux", "ux design", "user experience", "user interface", "figma", "adobe xd", "photoshop"],
    "Communication": ["communication", "interpersonal skills", "presentation skills"],
    "Problem Solving": ["problem solving", "problem-solving", "analytical skills"],
    "ITIL": ["itil", "it infrastructure library"],
    "CRM": ["crm"]
}

def normalize_text(text):
    """Normalize formatting, standardize whitespace & symbols safely."""
    # Convert to lowercase
    text = text.lower()
    # Normalize slashes separating words (e.g. "ui/ux" -> "ui ux")
    text = re.sub(r'(?<=[a-z])/(?=[a-z])', ' ', text)
    # Replace newlines and multiple consecutive spaces/tabs with a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_skills(text):
    """Deterministic NLP extractor supporting multi-word, boundaries, and synonyms."""
    if not text:
        return []
        
    normalized = normalize_text(text)
    extracted = set()

    for canonical_skill, synonyms in SKILL_KEYWORDS.items():
        for syn in synonyms:
            # Handle multi-word matching by explicitly allowing dynamic spacing
            safe_syn = re.escape(syn).replace(r'\ ', r'\s+')
            
            # Smart boundaries: lookbehind/ahead for non-word chars OR start/end of string
            # We explicitly don't use '\b' because it fatally breaks on trailing symbols (c++, .net)
            pattern = r'(?:^|[\s,.;:()\[\]{}|\\/!"\'-])' + safe_syn + r'(?:$|[\s,.;:()\[\]{}|\\/!"\'-])'
            
            if re.search(pattern, normalized):
                extracted.add(canonical_skill)
                break  # Prevents redundant mapping if multiple synonyms match

    return sorted(list(extracted))

def extract_requirements(text):
    text_clean = text.lower()

    patterns = [
        r"(requirements.*?)(responsibilities|benefits|about|$)",
        r"(qualifications.*?)(responsibilities|benefits|about|$)",
        r"(what you.*?looking.*?for.*?)(responsibilities|benefits|about|$)",
        r"(who we.*?looking.*?for.*?)(responsibilities|benefits|about|$)",
        r"(skills.*?experience.*?)(responsibilities|benefits|about|$)",
        r"(what you need.*?)(responsibilities|benefits|about|$)"
    ]

    for pattern in patterns:
        match = re.search(pattern, text_clean, re.DOTALL)
        if match:
            return match.group(1).strip()

    # FALLBACK: extract bullet-like lines without truncating arbitrarily
    lines = text.split("\n")
    bullet_lines = [l.strip() for l in lines if ("•" in l or "-" in l)]

    if len(bullet_lines) >= 3:
        return "\n".join(bullet_lines)  # Removed the [:10] truncation!

    return None

def _parse_job_card(card, index):
    try:
        # Title + URL (Strict JobStreet API matching)
        title_elem = card.find_element(By.CSS_SELECTOR, "a[data-automation='jobTitle']")
        title = title_elem.get_attribute("innerText").strip()
        job_url = title_elem.get_attribute("href")

        # Company
        company = "Unknown"
        try:
            company = card.find_element(By.CSS_SELECTOR, "[data-automation='jobCompany']").text.strip()
        except:
            pass

        # Location
        location = "Malaysia"
        try:
            location = card.find_element(By.CSS_SELECTOR, "[data-automation='jobLocation']").text.strip()
        except:
            pass

        # Salary (optional)
        salary = None
        try:
            salary = card.find_element(By.CSS_SELECTOR, "[data-automation='jobSalary']").text.strip()
        except:
            pass

        # Company Logo (optional)
        logo_url = None
        try:
            logo_img = card.find_element(By.CSS_SELECTOR, "img")
            logo_url = logo_img.get_attribute("src")
        except:
            pass

        # Must be an internship
        title_lower = title.lower()
        if "intern" not in title_lower:
            return None

        # PRIMARY: title must contain at least one tech keyword (allowlist)
        if not _TECH_TITLE_RE.search(title_lower):
            print(f"  [SKIP – non-tech title] {title}")
            return None

        # SECONDARY: reject known non-tech phrases even if a tech word crept in
        # (e.g. "Digital Marketing Intern" has "digital" but is not tech)
        if any(kw in title_lower for kw in NON_TECH_ANTI_KEYWORDS):
            print(f"  [SKIP – blocked domain] {title}")
            return None
            
        if job_url.startswith("/"):
            job_url = f"https://my.jobstreet.com{job_url}"

        # URL Normalization: Strip tracking parameters and anchors for unique constraint stability
        if "?" in job_url:
            job_url = job_url.split("?")[0]
        if "#" in job_url:
            job_url = job_url.split("#")[0]

        return {
            "title": title,
            "company_name": company,
            "location": location,
            "salary": salary,
            "description": "Description pending (Phase 2).",
            "apply_url": job_url,
            "source": "JobStreet",
            "is_active": True,
            "company_logo_url": logo_url
        }

    except Exception as e:
        print("ERROR:", e)
        return None

def scrape_internships(headless: bool = False) -> list[dict]:
    """
    PHASE 1: Scrapes listing page ONLY from JobStreet using resilient native Selenium.
    Handles JavaScript rendering and scrolling bot protections naturally.
    """
    print(f"Scraping from: {TARGET_URL}")
    scraped_data = []

    # Configure Chrome heavily for stealth
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    
    # Critical Anti-bot measures
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    driver = None
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Override navigator.webdriver to bypass advanced bot probes
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined
            })
            """
        })

        print("Launching browser session...")
        driver.get(TARGET_URL)
        
        print("Waiting for page load and Javascript rendering (15 seconds)...")
        time.sleep(15) 
        
        # Ensure lazy loading triggers natively
        print("Scrolling to trigger dynamic content loading...")
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(3)

        # Explicitly wait for structural layout blocks indicating JS finished
        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "article[data-card-type='JobCard']"))
            )
        except Exception:
            print("WARNING: Job cards took too long to load or site structure changed/blocked.")

        job_cards = driver.find_elements(By.CSS_SELECTOR, "article[data-card-type='JobCard']")

        if not job_cards:
            print(f"No <article> tags found. Dumped fully rendered payload to dump.html")
            with open("dump.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            return []

        print(f"Discovered {len(job_cards)} potential job listings.\n")

        for index, card in enumerate(job_cards):
            internship = _parse_job_card(card, index + 1)
            
            if internship:
                scraped_data.append(internship)
                
                # PHASE 1: Print results gracefully matching exactly user pattern
                print(f"[{len(scraped_data)}] {internship['title']} @ {internship['company_name']}")

        print(f"\n--- PHASE 2: Deep Extraction Initiating ({len(scraped_data)} Jobs) ---")
        
        for job in scraped_data:
            url = job.get("apply_url")
            
            if not url or not url.startswith("http"):
                print(f"Skipping invalid URL: {url}")
                continue
                
            print(f"\nVisiting: {url}")
            
            try:
                driver.get(url)
                
                # Enforce a conservative cooldown to handle Javascript payloads
                time.sleep(3)
                
                # Wait explicitly for the newly mapped jobAdDetails node
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, '[data-automation="jobAdDetails"]'))
                )
                
                desc = driver.find_element(By.CSS_SELECTOR, '[data-automation="jobAdDetails"]').text
                
                job["description"] = desc
                
                requirements = extract_requirements(desc)
                job["requirements"] = requirements
                
                skills = extract_skills(desc)
                job["required_skills"] = skills

                print(f"  + Description Extracted successfully ({len(desc)} characters).")
                if requirements:
                    print(f"  + Requirements Extracted ({len(requirements)} chars)")
                else:
                    print("  No requirements section found")
                print(f"  + Skills Extracted: {skills}")

                # Phase 2 safety net: if zero tech skills extracted and the
                # description itself has no tech signal, skip this job entirely.
                if not skills and not _TECH_TITLE_RE.search(desc.lower()):
                    print(f"  [SKIP – no tech skills in description] {job['title']}")
                    job["_drop"] = True
                
            except Exception as e:
                print(f"  Phase 2 Deep Extraction Failed for {url}: {e}")
                job["description"] = "Description extraction failed."

    except Exception as e:
        print(f"Selenium error while scraping: {e}")
    finally:
        if driver:
            driver.quit()
        
    return scraped_data
