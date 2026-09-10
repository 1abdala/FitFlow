import re
import time
import random
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TARGET_URL = "https://my.jobstreet.com/internship-jobs"

JOBSTREET_SEARCH_QUERIES = [
    "internship",
    "cybersecurity-jobs",
    "cyber-security-jobs",
    "information-security-jobs",
    "it-security-jobs",
    "software-internship-jobs",
    "data-internship-jobs",
    "it-internship-jobs"
]

# ── Tech title allowlist ─────────────────────────────────────────────
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
NON_TECH_ANTI_KEYWORDS = [
    'marketing', 'hr ', 'human resource', 'human resources',
    'accounting', 'accountant', 'finance', 'financial',
    'tax ', 'taxation', 'audit', 'auditing', 'compliance',
    'legal', ' law ', 'paralegal',
    'sales', 'business development',
    'procurement', 'purchasing', 'supply chain', 'logistics',
    'banking', 'insurance', 'investment',
    'real estate', 'property management',
    'recruitment', 'talent acquisition',
    'admin ', 'administration', 'administrative',
    'clerical', 'receptionist',
    'operation ', 'operations management',
    'civil engineering', 'civil intern',
    'mechanical engineer', 'mechatronic',
    'electrical engineer',
    'chemical engineer', 'chemical process',
    'plant ', 'process engineer', 'process technician',
    'manufacturing', 'production planning',
    'quantity surveyor', 'architecture intern',
    'geotechnical', 'structural engineer',
    'customer service', 'customer experience', 'customer success',
    'customer engagement', 'customer support', 'customer care',
    'call centre', 'call center',
    'public relation', 'pr intern',
    'content writer', 'copywriter', 'journalist',
    'media relation', 'broadcast',
    'graphic design', 'interior design', 'fashion design',
    'textile',
    'healthcare', 'medical ', 'nursing', ' nurse ',
    'pharmacy', 'pharmacist', 'clinical ',
    ' teacher', 'teaching ', 'tutor',
    'hospitality', 'tourism', 'hotel', 'culinary',
    'event management', 'event planning',
    'retail', 'merchandising',
    'security officer', 'security guard', 'warehouse security', 'hotel security', 'loss prevention', 'security control room', 'security executive',
    'teraju', 'yayasan',
]

SKILL_KEYWORDS = {
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
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "Oracle": ["oracle", "oracle database", "oracle db"],
    "Snowflake": ["snowflake"],
    "Databricks": ["databricks"],
    "Databases": ["database", "databases", "dbms"],
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
    "Machine Learning": ["machine learning", "ml", "machine-learning"],
    "Artificial Intelligence": ["artificial intelligence", "artificial intelligent", "ai"],
    "Data Analysis": ["data analysis", "data analytics", "data analyst", "visualization"],
    "Data Science": ["data science", "data scientist"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch"],
    "Pandas": ["pandas"],
    "Data Engineering": ["data engineering", "data pipeline", "etl", "data ingestion", "data integration", "data lake", "data modelling"],
    "Power BI": ["power bi", "powerbi", "tableau"],
    "Computer Vision": ["computer vision"],
    "NLP": ["nlp", "natural language processing"],

    # Cybersecurity & Networking Domain
    "Cybersecurity": ["cybersecurity", "cyber security", "information security", "infosec", "comptia", "it security"],
    "Network Security": ["network security", "network defence", "network defense"],
    "SIEM": ["siem", "siem tools", "siem platforms", "security information and event management"],
    "Splunk": ["splunk"],
    "Vulnerability Assessment": ["vulnerability assessment", "vulnerability scan", "vulnerability scanning", "vulnerability management", "vapt"],
    "Penetration Testing": ["penetration testing", "pen testing", "pentest", "ethical hacking"],
    "Incident Response": ["incident response", "incident reporting", "threat detection", "incident management", "incident investigation"],
    "Firewall": ["firewall", "firewalls", "ips", "ids", "fortinet", "palo alto"],
    "Active Directory": ["active directory", "ad", "identity management", "iam"],
    "Networking": ["networking", "network management", "lan/wan", "network+"],
    "Network Protocols": ["network protocols", "tcp/ip", "tcp ip", "routing and switching"],
    "OSI Model": ["osi model", "osi"],
    "Patch Management": ["patch management", "configuration management", "patch deployment"],

    # Health, Safety, Security & Environment (HSSE) Domain
    "Occupational Safety & Health": ["occupational safety", "occupational safety & health", "occupational safety and health", "osh", "hse", "hsse", "ehs"],
    "Health & Safety": ["health and safety", "health & safety", "workplace safety", "safety management"],
    "Safety Compliance": ["safety compliance", "compliance initiatives", "regulatory compliance", "safety regulations"],
    "Environmental Management": ["environmental management", "environmental safety", "iso 14001", "iso 45001"],
    "Risk Assessment": ["risk assessment", "risk mitigation", "risk management", "hazard identification"],
    "Auditing": ["auditing", "safety audit", "internal audit", "iso audit"],

    # Business, Office & General Skills
    "Troubleshooting": ["troubleshooting", "hardware troubleshooting", "software troubleshooting", "technical support", "it support"],
    "System Administration": ["system administration", "sysadmin", "system admin"],
    "VMware": ["vmware", "virtualization", "hyper-v"],
    "Microsoft Office": ["microsoft office", "ms office", "office 365", "microsoft office suite", "excel", "powerpoint", "word", "ms excel", "ms word"],
    "Project Management": ["project management", "agile", "scrum", "kanban", "jira", "azure devops"],
    "Git": ["git", "version control", "github", "gitlab"],
    "UI/UX Design": ["ui/ux", "ui ux", "ux design", "user experience", "user interface", "figma", "adobe xd", "photoshop"],
    "Communication": ["communication", "interpersonal skills", "presentation skills"],
    "Problem Solving": ["problem solving", "problem-solving", "analytical skills"],
    "ITIL": ["itil", "it infrastructure library"],
    "CRM": ["crm"],
    "Software Testing": ["software testing", "quality assurance", "qa testing", "software qa", "manual testing", "automated testing", "test automation", "test execution", "unit testing", "integration testing"],
    "Debugging": ["debugging", "debug", "bug reporting", "error logging"],
    "Software Engineering": ["software engineering", "software development", "software developer", "computer science degree"],
    "API": ["api", "apis", "backend services", "web services"],
    "SDLC": ["sdlc", "software development lifecycle", "software development life cycle"],
    "Data Structures & Algorithms": ["data structures", "algorithms", "data structures and algorithms"],
    "System Integration": ["system integration", "systems integration", "system integrations", "integration"],
    "Backend Development": ["backend", "back-end", "backend development", "backend services"],
    "Frontend Development": ["frontend", "front-end", "frontend development", "frontend services"],
    "Full Stack Development": ["fullstack", "full-stack", "full stack development"]
}

def normalize_text(text):
    text = text.lower()
    text = re.sub(r'(?<=[a-z])/(?=[a-z])', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_skills(text, title=""):
    if not text:
        return []
    
    full_text = f"{title}\n{text}"
    normalized = normalize_text(full_text)
    extracted = set()

    for canonical_skill, synonyms in SKILL_KEYWORDS.items():
        for syn in synonyms:
            safe_syn = re.escape(syn).replace(r'\ ', r'\s+')
            pattern = r'(?:^|[\s,.;:()\[\]{}|\\/!"\'-])' + safe_syn + r'(?:$|[\s,.;:()\[\]{}|\\/!"\'-])'
            if re.search(pattern, normalized):
                extracted.add(canonical_skill)
                break
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

    lines = text.split("\n")
    bullet_lines = [l.strip() for l in lines if ("•" in l or "-" in l)]
    if len(bullet_lines) >= 3:
        return "\n".join(bullet_lines)
    return None

def _parse_job_card(card, index):
    try:
        title_elem = card.find_element(By.CSS_SELECTOR, "a[data-automation='jobTitle']")
        title = title_elem.get_attribute("innerText").strip()
        job_url = title_elem.get_attribute("href")

        company = "Unknown"
        try:
            company = card.find_element(By.CSS_SELECTOR, "[data-automation='jobCompany']").text.strip()
        except Exception:
            pass

        location = "Malaysia"
        try:
            location = card.find_element(By.CSS_SELECTOR, "[data-automation='jobLocation']").text.strip()
        except Exception:
            pass

        salary = None
        try:
            salary = card.find_element(By.CSS_SELECTOR, "[data-automation='jobSalary']").text.strip()
        except Exception:
            pass

        logo_url = None
        try:
            logo_img = card.find_element(By.CSS_SELECTOR, "img")
            logo_url = logo_img.get_attribute("src")
        except Exception:
            pass

        title_lower = title.lower()

        # Flexible Internship & Tech matching:
        # Match if title has intern / protege / trainee / training terms OR explicit tech/cyber keywords
        is_intern = any(term in title_lower for term in ["intern", "protege", "protégé", "trainee", "training", "placement", "attachment", "junior", "associate", "fresh"])
        is_tech = _TECH_TITLE_RE.search(title_lower)
        is_cyber = any(term in title_lower for term in ["cyber", "security", "soc", "infosec", "penetration", "risk"])

        if not is_tech and not is_cyber:
            return None

        if any(kw in title_lower for kw in NON_TECH_ANTI_KEYWORDS):
            return None
            
        if job_url.startswith("/"):
            job_url = f"https://my.jobstreet.com{job_url}"

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

    except Exception:
        return None

def scrape_internships(headless: bool = True, max_pages_per_query: int = 3) -> list[dict]:
    """
    PHASE 1: Scrapes listing pages from JobStreet across multiple search queries & pagination.
    """
    print(f"\n--- JobStreet Internship Scraper (Expanded Malaysia Coverage) ---")
    scraped_data = []
    seen_urls = set()

    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    driver = None
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined
            })
            """
        })

        print("Launching browser session for JobStreet...")

        for query_slug in JOBSTREET_SEARCH_QUERIES:
            print(f"\n  [JobStreet Query] '{query_slug}'...")
            
            for page in range(1, max_pages_per_query + 1):
                target_url = f"https://my.jobstreet.com/{query_slug}?page={page}" if page > 1 else f"https://my.jobstreet.com/{query_slug}"
                print(f"    Navigating to Page {page}: {target_url}")
                
                try:
                    driver.get(target_url)
                    time.sleep(5)

                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)

                    job_cards = driver.find_elements(By.CSS_SELECTOR, "article")

                    if not job_cards:
                        print(f"    No cards found on page {page} for '{query_slug}'")
                        break

                    page_added = 0
                    for index, card in enumerate(job_cards):
                        internship = _parse_job_card(card, index + 1)
                        if internship:
                            url = internship["apply_url"]
                            if url not in seen_urls:
                                seen_urls.add(url)
                                scraped_data.append(internship)
                                page_added += 1

                    print(f"    -> Page {page}: Found {len(job_cards)} cards, Kept {page_added} new candidate(s)")
                    
                    if len(job_cards) < 10:
                        break

                except Exception as e:
                    print(f"    Error processing {target_url}: {e}")
                    break

        print(f"\n--- PHASE 2: Deep Extraction Initiating ({len(scraped_data)} JobStreet Candidates) ---")
        
        for idx, job in enumerate(scraped_data, 1):
            url = job.get("apply_url")
            if not url or not url.startswith("http"):
                continue
                
            print(f"  [{idx}/{len(scraped_data)}] Visiting: {url}")
            
            try:
                driver.get(url)
                time.sleep(2.5)
                
                WebDriverWait(driver, 8).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, '[data-automation="jobAdDetails"]'))
                )
                
                desc = driver.find_element(By.CSS_SELECTOR, '[data-automation="jobAdDetails"]').text
                job["description"] = desc
                
                requirements = extract_requirements(desc)
                job["requirements"] = requirements
                
                skills = extract_skills(desc)
                job["required_skills"] = skills

                print(f"    + Description: {len(desc)} chars | Skills ({len(skills)}): {skills[:5]}")

                if not skills and not _TECH_TITLE_RE.search(desc.lower()) and not any(k in desc.lower() for k in ["cyber", "security", "soc"]):
                    print(f"    [SKIP – no tech skills in description] {job['title']}")
                    job["_drop"] = True
                
            except Exception as e:
                print(f"    Phase 2 Deep Extraction Failed for {url}: {e}")
                job["description"] = "Description extraction failed."

    except Exception as e:
        print(f"Selenium error while scraping JobStreet: {e}")
    finally:
        if driver:
            driver.quit()
        
    kept = [j for j in scraped_data if not j.get("_drop", False)]
    print(f"\n  JobStreet scrape complete: {len(kept)} jobs ready for DB sync.")
    return scraped_data

def classify_job(title: str, description: str = "") -> tuple[str, float]:
    """
    Classifies an internship title (and description) into standard career interest categories.
    """
    t = title.lower()
    d = description.lower()
    
    # 1. Cybersecurity (High priority check for all security terms)
    if any(x in t for x in ["cyber", "security", "infosec", "cybersecurity", "penetration", "soc ", "vulnerability", "technology risk", "it risk", "grc", "defense"]):
        return "Cybersecurity", 0.95
    if "cybersecurity" in d or "information security" in d:
        return "Cybersecurity", 0.85

    # 2. Backend Developer
    if any(x in t for x in ["backend", "back-end", "back end"]):
        return "Backend Developer", 0.90
        
    # 3. Frontend Developer
    if any(x in t for x in ["frontend", "front-end", "front end"]):
        return "Frontend Developer", 0.90
        
    # 4. Full Stack Developer
    if any(x in t for x in ["fullstack", "full-stack", "full stack"]):
        return "Full Stack Developer", 0.90
        
    # 5. Mobile App Developer
    if any(x in t for x in ["mobile", "ios", "android", "swift", "kotlin", "app developer"]):
        return "Mobile App Developer", 0.90
        
    # 6. Data Scientist
    if "data scientist" in t or "data science" in t:
        return "Data Scientist", 0.90
        
    # 7. Data Analyst
    if any(x in t for x in ["data analyst", "data analytics", "data analysis"]):
        return "Data Analyst", 0.90
        
    # 8. AI / Machine Learning
    if any(x in t for x in ["machine learning", "ml", "artificial intelligence", "deep learning", "intelligent system"]) or re.search(r'\bai\b', t):
        return "AI / Machine Learning", 0.90
        
    # 9. DevOps Engineer
    if any(x in t for x in ["devops", "sre", "platform engineer", "platform engineering", "ci/cd", "cicd"]):
        return "DevOps Engineer", 0.90
        
    # 10. Cloud Computing
    if any(x in t for x in ["cloud", "aws", "azure", "gcp", "infrastructure"]):
        return "Cloud Computing", 0.90
        
    # 11. Networking
    if any(x in t for x in ["network", "networking", "cisco", "telecom"]):
        return "Networking", 0.90
        
    # 12. UI / UX Designer
    if any(x in t for x in ["ui", "ux", "design", "figma", "designer", "product design", "graphic design", "multimedia"]):
        return "UI / UX Designer", 0.90
        
    # 13. QA Tester
    if any(x in t for x in ["qa", "test", "testing", "quality assurance", "test engineer", "automation testing"]):
        return "QA Tester", 0.90
        
    # 14. Business Analyst
    if any(x in t for x in ["business analyst", "systems analyst", "system analyst", "product manager", "project manager", "scrum"]):
        return "Business Analyst", 0.90
        
    # 15. Software Engineer (General Fallback)
    if any(x in t for x in ["software", "programmer", "developer", "development", "engineer", "web", "application", "coding"]):
        return "Software Engineer", 0.80
        
    return "Software Engineer", 0.50

if __name__ == "__main__":
    scrape_internships(headless=True)
