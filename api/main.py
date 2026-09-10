import os
import json
import io
from typing import Optional
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv
from google import genai
from google.genai import types
import PyPDF2
import urllib.request
import urllib.error

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_KEY")

app = FastAPI()

# Setup API Rate Limiter to protect Gemini API quota
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

def get_user_id_from_token(auth_header: str, supabase_client: Client) -> str:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = auth_header.replace("Bearer ", "")
    try:
        # Verify token against Supabase auth to fetch user
        user_resp = supabase_client.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_resp.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

raw_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_origins = [o.strip() for o in raw_origins if o.strip()]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://fit-flow-eta.vercel.app"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not all([SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_KEY]):
    print("Warning: Missing environment variables.")

gemini_client = None
if GEMINI_KEY:
    gemini_client = genai.Client(api_key=GEMINI_KEY)
    print("DEBUG: Gemini client initialized.")

MODELS_TO_TRY = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"]

def generate_content_with_fallback(contents, config=None):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized")
        
    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            print(f"DEBUG: Attempting generation with model {model_name}...")
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
            print(f"DEBUG: Successful generation using model {model_name}!")
            return response
        except Exception as e:
            print(f"DEBUG: Model {model_name} failed: {e}")
            last_error = e
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                continue
            else:
                raise e
    
    if last_error:
        raise HTTPException(status_code=429, detail=f"Gemini API quota exceeded on all available models: {str(last_error)}")
    raise HTTPException(status_code=500, detail="Generation failed")


OPENAI_KEY = os.getenv("OPENAI_API_KEY")


class MockResponse:
    def __init__(self, text: str):
        self.text = text


def generate_content_unified(contents, config=None):
    if OPENAI_KEY:
        print("DEBUG: Using OpenAI API for content generation...")
        try:
            is_json = False
            if config and hasattr(config, 'response_mime_type') and config.response_mime_type == "application/json":
                is_json = True
            
            model = "gpt-4o" if is_json else "gpt-4o-mini"
            
            messages = []
            system_instr = None
            if config and hasattr(config, 'system_instruction') and config.system_instruction:
                instr = config.system_instruction
                if isinstance(instr, str):
                    system_instr = instr
                elif hasattr(instr, 'text'):
                    system_instr = instr.text
                elif isinstance(instr, list):
                    system_instr = " ".join([getattr(p, 'text', str(p)) for p in instr])
                else:
                    system_instr = str(instr)
            
            if system_instr:
                messages.append({"role": "system", "content": system_instr})
            
            if isinstance(contents, list):
                for item in contents:
                    if isinstance(item, dict) and "role" in item and "content" in item:
                        r = "assistant" if item["role"] in ["interviewer", "assistant"] else "user"
                        messages.append({"role": r, "content": item["content"]})
                    else:
                        messages.append({"role": "user", "content": str(item)})
            else:
                messages.append({"role": "user", "content": str(contents)})
            
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.7
            }
            if is_json:
                payload["response_format"] = {"type": "json_object"}
            
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_KEY}"
            }
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
            
            with urllib.request.urlopen(req, timeout=60) as response:
                resp_data = response.read().decode("utf-8")
                resp_json = json.loads(resp_data)
                text = resp_json["choices"][0]["message"]["content"]
                print(f"DEBUG: OpenAI generation successful using model {model}!")
                return MockResponse(text)
        except Exception as e:
            print(f"DEBUG: OpenAI generation failed: {e}. Falling back to Gemini...")
            return generate_content_with_fallback(contents, config)
    else:
        return generate_content_with_fallback(contents, config)


import re


def clean_interviewer_response(text: str) -> str:
    # 1. Remove prefixes like "Interviewer:", "Recruiter:", "Grab Recruiter:" at the start
    text = re.sub(r'^(Interviewer|Recruiter|Grab Recruiter|Grab Hiring Manager)\s*:\s*', '', text, flags=re.IGNORECASE)
    # 2. Remove placeholders like "[Your Name]", "[Recruiter Name]"
    text = re.sub(r'\[Your Name\]|\[Recruiter\'s Name\]|\[Recruiter Name\]', 'the Recruiter', text, flags=re.IGNORECASE)
    return text.strip()


SUMMARY_SYSTEM = (
    "You are a career-coach assistant for FitFlow, an internship matching platform. "
    "Please summarize the given internship description into two short, concise sections: "
    "'About the role' and 'What you'll be doing'. "
    "Keep it highly professional, clear, and very concise without any extra fluff."
)

MODEL = "gemini-2.5-flash"


class SummaryResponse(BaseModel):
    internship_id: str
    summary: str


@app.get("/internship/{internship_id}/summary")
@limiter.limit("15/minute")
async def get_summary(request: Request, internship_id: str):
    print(f"DEBUG: Received summary request for ID: {internship_id}")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase or not (gemini_client or OPENAI_KEY):
        raise HTTPException(status_code=500, detail="Backend not fully configured (missing API keys)")

    # Enforce valid authentication token
    auth_header = request.headers.get("Authorization")
    user_id = get_user_id_from_token(auth_header, supabase)
    
    # Apply the auth token to database client for RLS context
    if auth_header:
        token = auth_header.replace("Bearer ", "")
        supabase.postgrest.auth(token)

    try:
        resp = supabase.table("internships").select("*").eq("id", internship_id).single().execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Internship not found")

        job = resp.data
        title = job.get('title', 'Internship')
        company = job.get('company_name', job.get('company', 'Unknown Company'))
        desc = job.get('description', '')

        # Fetch relational skills & candidate match breakdown
        skills_res = supabase.table("internship_skills").select("skills(name)").eq("internship_id", internship_id).execute()
        req_skills = [s.get("skills", {}).get("name") for s in (skills_res.data or []) if s.get("skills")]

        match_res = supabase.table("matching_results").select("match_score, skill_gaps(skills(name))").eq("internship_id", internship_id).eq("student_id", user_id).execute()
        match_info = match_res.data[0] if match_res.data else {}
        gaps = [g.get("skills", {}).get("name") for g in match_info.get("skill_gaps", []) if g.get("skills")]
        score = round(float(match_info.get("match_score", 0)))
        verified = [s for s in req_skills if s not in gaps]

        print(f"DEBUG: Found job: {title}. Verified: {verified}, Gaps: {gaps}. Sending to Gemini...")

        prompt = (
            f"Target Internship Role: {title}\n"
            f"Company: {company}\n"
            f"Candidate Match Score: {score}%\n"
            f"Required Role Skills: {', '.join(req_skills) if req_skills else 'No explicit skills extracted'}\n"
            f"Candidate Verified Skills: {', '.join(verified) if verified else 'None'}\n"
            f"Candidate Skill Gaps to Address: {', '.join(gaps) if gaps else 'None'}\n"
            f"Job Description: {desc[:2000]}\n"
        )

        try:
            response = generate_content_unified(
                contents=prompt,
                config=types.GenerateContentConfig(system_instruction=SUMMARY_SYSTEM),
            )
            summary_text = response.text.strip()
            print("DEBUG: Gemini summary generated successfully.")
        except Exception as e:
            print(f"DEBUG: Gemini API failed: {str(e)}. Using fallback summary.")
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait a minute and try again.")
            summary_text = f"About the role:\nThis is a {title} position at {company}.\n\nWhat you'll be doing:\nYou will be expected to utilize your technical skills to contribute to the team's ongoing projects."

        return {"internship_id": internship_id, "summary": summary_text}

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: EXCEPTION: {str(e)}")
        raise HTTPException(status_code=500, detail="Unable to generate internship summary")


@app.post("/analyze-cv")
@limiter.limit("5/minute")
async def analyze_cv(request: Request, student_id: str = Form(...), file: UploadFile = File(...)):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase or not (gemini_client or OPENAI_KEY):
        raise HTTPException(status_code=500, detail="Backend not fully configured")

    # Secure endpoint by verifying authorization token and enforcing student_id matches token user
    auth_header = request.headers.get("Authorization")
    authenticated_user_id = get_user_id_from_token(auth_header, supabase)
    
    if authenticated_user_id != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only analyze your own CV.")

    # Apply the auth token to database client for RLS context
    token = auth_header.replace("Bearer ", "")
    supabase.postgrest.auth(token)

    if not file.filename or not file.filename.lower().endswith(".pdf") or file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    MAX_FILE_SIZE = 10 * 1024 * 1024
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > MAX_FILE_SIZE + 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds the 10MB limit.")

    # Parse PDF
    try:
        chunks = []
        total_size = 0
        while chunk := await file.read(1024 * 1024):
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="File size exceeds the 10MB limit.")
            chunks.append(chunk)
        content = b"".join(chunks)
        if not content.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        print(f"DEBUG: Extracted {len(text)} characters from PDF")
        if len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract enough text from this PDF. It might be an image-based PDF. Please try a text-based PDF.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to parse PDF file. Ensure it is a valid non-corrupted PDF.")

    # Call Gemini for analysis
    cv_prompt = f"""You are an expert tech recruiter and career coach. Analyze this student's CV text.
Extract the following into a STRICT JSON format:
1. "extracted_skills": A list of top 10 technical skills (e.g., ["Python", "React", "Docker"]). Make sure they match common industry keywords.
2. "skill_gaps": A list of 3-5 high-demand tech skills they DO NOT have but are frequently paired with their current stack.
3. "cv_score": An integer from 0 to 100 scoring the CV's technical depth, clarity, and impact.
4. "improvements": A list of 3 specific, actionable tips to improve this CV. Format as {{"tip": "string", "priority": "High" | "Medium"}}

Return ONLY JSON. Do not include markdown formatting or backticks.

CV TEXT:
{text[:8000]}"""

    try:
        response = generate_content_unified(
            contents=cv_prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        resp_text = response.text.strip()
        analysis = json.loads(resp_text)
    except Exception as e:
        print(f"Gemini Error: {e}")
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait a minute and upload your CV again.")
        print("Falling back to mock analysis due to API error...")
        analysis = {
            "extracted_skills": ["Python", "JavaScript", "React", "SQL", "Git"],
            "skill_gaps": ["Docker", "AWS", "CI/CD"],
            "cv_score": 75,
            "improvements": [
                {"tip": "Add more quantifiable metrics to your experience bullet points.", "priority": "High"},
                {"tip": "Include a link to your GitHub or portfolio.", "priority": "Medium"},
                {"tip": "Make sure your formatting is consistent across all sections.", "priority": "Medium"}
            ]
        }

    # Upsert skills to DB
    extracted_skills = analysis.get("extracted_skills", [])
    for s in extracted_skills:
        try:
            skill_res = supabase.rpc("get_or_create_skill", {"p_name": s}).execute()
            skill_id = skill_res.data
            if skill_id:
                supabase.table("user_skills").upsert({
                    "user_id": student_id,
                    "skill_id": skill_id
                }, on_conflict="user_id,skill_id").execute()
        except Exception as e:
            print("Error upserting skill", s, e)
    # Save analysis
    db_payload = {
        "student_id": student_id,
        "cv_score": analysis.get("cv_score", 0),
        "extracted_skills": extracted_skills,
        "skill_gaps": analysis.get("skill_gaps", []),
        "improvements": analysis.get("improvements", []),
        "raw_analysis": analysis
    }

    try:
        supabase.table("cv_analyses").insert(db_payload).execute()
    except Exception as e:
        print("Could not save to cv_analyses:", e)

    # Re-run match engine
    try:
        supabase.rpc("generate_internship_matches", {"p_student_id": student_id}).execute()
    except Exception as e:
        print("Match engine error:", e)

    return analysis


SYSTEM_INTERVIEWER = (
    "You are an expert Senior Technical Interviewer conducting a realistic job interview. "
    "Your objective is to evaluate the candidate's technical skills, problem-solving ability, and fit for their specific target role.\n"
    "CRITICAL GUIDELINES:\n"
    "1. TAILORED & SPECIFIC: Ask questions directly grounded in the target job title, company, and required tech stack. Never ask generic placeholder questions.\n"
    "2. DYNAMIC FOLLOW-UP: Analyze the candidate's previous response carefully. Ask targeted follow-up questions probing their technical depth, implementation choices, architecture, or trade-offs based on the exact tools/frameworks they mentioned.\n"
    "3. ONE QUESTION AT A TIME: Ask exactly ONE clear question per turn.\n"
    "4. NATURAL CONVERSATIONAL TONE: Briefly acknowledge their response in 1 sentence, then ask your next specific question.\n"
    "5. STRICT LENGTH: Keep your complete response under 3 sentences. Do NOT output lists, bullet points, or prefixes like 'Interviewer:'."
)


class CreateSessionRequest(BaseModel):
    internship_id: Optional[str] = None
    custom_role: Optional[str] = Field(default=None, max_length=100)
    max_questions: int = Field(default=3, ge=1, le=10)
    interview_type: str = Field(min_length=1, max_length=50)
    difficulty: str = Field(min_length=1, max_length=30)


class SubmitAnswerRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=5000)


@app.post("/interviews/session/create")
@app.post("/api/interviews/session/create")
@limiter.limit("10/minute")
async def create_interview_session(req: CreateSessionRequest, request: Request):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase or not (gemini_client or OPENAI_KEY):
        raise HTTPException(status_code=500, detail="Backend not fully configured")

    auth_header = request.headers.get("Authorization")
    user_id = get_user_id_from_token(auth_header, supabase)
    
    # Set auth context for RLS
    token = auth_header.replace("Bearer ", "")
    supabase.postgrest.auth(token)

    # 1. Fetch student info
    try:
        profile_res = supabase.table("student_profiles").select("*").eq("id", user_id).single().execute()
        base_profile_res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        skills_res = supabase.table("user_skills").select("skills:skill_id(name)").eq("user_id", user_id).execute()
        
        student_name = base_profile_res.data.get("full_name", "Candidate") if base_profile_res.data else "Candidate"
        programme = profile_res.data.get("programme", "") if profile_res.data else ""
        roles = ", ".join(profile_res.data.get("preferred_roles", [])) if (profile_res.data and profile_res.data.get("preferred_roles")) else ""
        skills_list = [s.get("skills", {}).get("name") for s in (skills_res.data or []) if s.get("skills")]
        skills = ", ".join(skills_list)
    except Exception as e:
        print("Error fetching profile info for interview", e)
        student_name = "Candidate"
        programme = ""
        roles = ""
        skills = ""

    # 2. Fetch internship details and skills if provided
    job_title = ""
    job_company = ""
    job_desc = ""
    job_skills_list = []
    if req.internship_id:
        try:
            job_res = supabase.table("internships").select("*").eq("id", req.internship_id).single().execute()
            if job_res.data:
                job_title = job_res.data.get("title", "")
                job_company = job_res.data.get("company_name", "")
                job_desc = job_res.data.get("description", "")
                
            # Fetch associated skills
            iskills_res = supabase.table("internship_skills").select("skills:skill_id(name)").eq("internship_id", req.internship_id).execute()
            if iskills_res.data:
                job_skills_list = [s.get("skills", {}).get("name") for s in iskills_res.data if s.get("skills")]
        except Exception as e:
            print("Error fetching internship details", e)
    job_skills = ", ".join(job_skills_list) if job_skills_list else "core technical skills"

    # 3. Insert session into database
    try:
        session_payload = {
            "user_id": user_id,
            "internship_id": req.internship_id,
            "interview_type": req.interview_type,
            "difficulty": req.difficulty,
            "status": "running"
        }
        sess_res = supabase.table("interview_sessions").insert(session_payload).execute()
        if not sess_res.data:
            raise HTTPException(status_code=500, detail="Failed to create session record")
        session = sess_res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to create interview session")

    # 4. Generate first question
    init_prompt = f"Candidate Name: {student_name}\n"
    if programme:
        init_prompt += f"Academic Major: {programme}\n"
    if skills:
        init_prompt += f"Candidate Known Skills: {skills}\n"
    if roles:
        init_prompt += f"Candidate Preferred Roles: {roles}\n"
        
    if job_title:
        init_prompt += (
            f"Target Internship Role: {job_title}\n"
            f"Target Company: {job_company}\n"
            f"Required Skills for Job: {job_skills}\n"
            f"Job Description: {job_desc}\n\n"
            f"INSTRUCTION: Welcome {student_name} to the interview for the {job_title} role at {job_company}. "
            f"Ask a sharp, role-specific first technical or situational question directly testing their experience with {job_skills} or a key responsibility of this {job_title} position. "
            f"Do NOT ask a generic 'tell me about yourself' question."
        )
    elif req.custom_role and req.custom_role != 'general':
        role_criteria = {
            "Software Developer": "data structures, system design, Git, backend/frontend frameworks, and clean code practices",
            "Data Analyst": "SQL queries, data cleaning, pandas, data visualization, and statistical analysis",
            "UI/UX Designer": "user research, wireframing in Figma, design systems, and usability testing",
            "Cybersecurity": "network security, vulnerability assessment, encryption, and incident response"
        }
        role_skills = role_criteria.get(req.custom_role, "core domain skills")
        init_prompt += (
            f"Target Role: {req.custom_role}\n"
            f"Required Focus Skills: {role_skills}\n\n"
            f"INSTRUCTION: Welcome {student_name} and ask a sharp, specific technical question focusing on {role_skills} for a {req.custom_role} role. "
            f"Do NOT ask a generic placeholder question."
        )
    else:
        init_prompt += (
            f"Interview Focus: {req.interview_type} ({req.difficulty} level)\n\n"
            f"INSTRUCTION: Welcome {student_name} and ask a practical technical question relevant to their field ({programme or 'technology'})."
        )
    
    init_prompt += f"\nDifficulty Level: {req.difficulty}\nInterview Focus: {req.interview_type}\nKeep total response under 3 sentences."

    try:
        response = generate_content_unified(
            contents=init_prompt,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INTERVIEWER)
        )
        first_question = clean_interviewer_response(response.text.strip())
    except Exception as e:
        print("AI generation failed for first question", e)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="API quota exceeded. Please wait a minute and launch your session again.")
        target_role_display = job_title or req.custom_role or req.interview_type
        first_question = f"Welcome {student_name}! To kick off our {target_role_display} interview, could you walk me through a technical project where you applied {job_skills or skills or 'your key skills'} and how you handled the main implementation challenges?"

    # 5. Save first question to messages with metadata
    try:
        supabase.table("interview_messages").insert({
            "session_id": session["id"],
            "turn_id": 1,
            "role": "interviewer",
            "content": first_question,
            "input_type": "text",
            "metadata_json": {
                "custom_role": req.custom_role,
                "max_questions": req.max_questions
            }
        }).execute()
    except Exception as e:
        print("Error saving first message", e)

    return {
        "session_id": session["id"],
        "first_question": first_question,
        "difficulty": req.difficulty,
        "interview_type": req.interview_type
    }


@app.post("/interviews/session/{session_id}/question")
@app.post("/api/interviews/session/{session_id}/question")
@limiter.limit("20/minute")
async def submit_answer(session_id: str, req: SubmitAnswerRequest, request: Request):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase or not (gemini_client or OPENAI_KEY):
        raise HTTPException(status_code=500, detail="Backend not fully configured")

    auth_header = request.headers.get("Authorization")
    user_id = get_user_id_from_token(auth_header, supabase)
    
    token = auth_header.replace("Bearer ", "")
    supabase.postgrest.auth(token)

    # 1. Fetch session to verify ownership
    session_res = supabase.table("interview_sessions").select("*").eq("id", session_id).single().execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = session_res.data
    if session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied")

    # 2. Fetch existing messages to construct conversation history and turn count
    msgs_res = supabase.table("interview_messages").select("*").eq("session_id", session_id).order("turn_id", desc=False).execute()
    messages = msgs_res.data or []
    current_turn = len(messages) + 1  # Next turn ID

    # Extract metadata from first message
    first_msg = messages[0] if messages else None
    metadata = first_msg.get("metadata_json") if first_msg else {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except:
            metadata = {}
    custom_role = metadata.get("custom_role", "") if metadata else ""
    max_questions = int(metadata.get("max_questions", 3)) if metadata else 3

    # 3. Save candidate's answer to database
    supabase.table("interview_messages").insert({
        "session_id": session_id,
        "turn_id": current_turn,
        "role": "candidate",
        "content": req.answer,
        "input_type": "text"
    }).execute()

    # If this candidate answer completes the set (e.g. candidate has answered max_questions questions, meaning we have max_questions * 2 messages)
    if len(messages) + 1 >= (max_questions * 2):
        # Mark session as completed
        supabase.table("interview_sessions").update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", session_id).execute()
        
        return {"completed": True, "message": "Interview completed. Processing your performance review..."}

    # 4. Generate next question using Gemini
    job_title = ""
    job_company = ""
    job_desc = ""
    job_skills_list = []
    if session.get("internship_id"):
        try:
            job_res = supabase.table("internships").select("*").eq("id", session["internship_id"]).single().execute()
            if job_res.data:
                job_title = job_res.data.get("title", "")
                job_company = job_res.data.get("company_name", "")
                job_desc = job_res.data.get("description", "")
                
            # Fetch associated skills
            iskills_res = supabase.table("internship_skills").select("skills:skill_id(name)").eq("internship_id", session["internship_id"]).execute()
            if iskills_res.data:
                job_skills_list = [s.get("skills", {}).get("name") for s in iskills_res.data if s.get("skills")]
        except Exception as e:
            pass
    job_skills = ", ".join(job_skills_list) if job_skills_list else "Not specified"

    # Build multi-turn chat structure
    chat_turns = []
    
    context_header = (
        f"INTERVIEW ROLE CONTEXT:\n"
        f"- Target Position: {job_title or custom_role or 'Technical Role'}" + (f" at {job_company}" if job_company else "") + "\n"
        f"- Required Skills: {job_skills}\n"
        f"- Focus Area: {session.get('interview_type')}\n"
        f"- Difficulty Level: {session.get('difficulty')}\n"
    )
    chat_turns.append({"role": "system", "content": context_header})
    
    # Append existing conversation history
    for m in messages:
        role_key = "assistant" if m["role"] in ["interviewer", "assistant"] else "user"
        chat_turns.append({"role": role_key, "content": m["content"]})
        
    # Append current candidate answer
    chat_turns.append({"role": "user", "content": req.answer})
    
    # Follow-up instruction
    followup_instruction = (
        f"INSTRUCTION FOR INTERVIEWER:\n"
        f"Analyze the candidate's latest response: '{req.answer}'.\n"
        f"Acknowledge what they said in 1 concise, natural sentence.\n"
        f"Then ask a sharp, specific FOLLOW-UP question probing deeper into the exact tools, methodologies, code logic, frameworks, or trade-offs they just mentioned for the {job_title or custom_role or 'target'} position.\n"
        f"Keep your complete response under 3 sentences."
    )
    chat_turns.append({"role": "user", "content": followup_instruction})

    try:
        response = generate_content_unified(
            contents=chat_turns,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INTERVIEWER)
        )
        next_question = clean_interviewer_response(response.text.strip())
    except Exception as e:
        print("AI next question failed", e)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="API quota exceeded. Please wait a minute before submitting your answer.")
        next_question = f"Thanks for explaining that! Building on your point about {req.answer[:40]}..., could you elaborate on how you handled error handling or performance optimization in that workflow?"

    # Save next question
    supabase.table("interview_messages").insert({
        "session_id": session_id,
        "turn_id": current_turn + 1,
        "role": "interviewer",
        "content": next_question,
        "input_type": "text"
    }).execute()

    return {"completed": False, "next_question": next_question}


@app.post("/interviews/session/{session_id}/evaluate")
@app.post("/api/interviews/session/{session_id}/evaluate")
@limiter.limit("5/minute")
async def evaluate_session(session_id: str, request: Request):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase or not (gemini_client or OPENAI_KEY):
        raise HTTPException(status_code=500, detail="Backend not fully configured")

    auth_header = request.headers.get("Authorization")
    user_id = get_user_id_from_token(auth_header, supabase)
    
    token = auth_header.replace("Bearer ", "")
    supabase.postgrest.auth(token)

    # 1. Fetch session to verify ownership
    session_res = supabase.table("interview_sessions").select("*, internships(*)").eq("id", session_id).single().execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = session_res.data
    if session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # 2. Load all messages
    msgs_res = supabase.table("interview_messages").select("*").eq("session_id", session_id).order("turn_id", desc=False).execute()
    messages = msgs_res.data or []
    
    if not messages:
        raise HTTPException(status_code=400, detail="Cannot evaluate empty session")

    # Extract metadata from first message
    first_msg = messages[0] if messages else None
    metadata = first_msg.get("metadata_json") if first_msg else {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except:
            metadata = {}
    custom_role = metadata.get("custom_role", "") if metadata else ""

    # Construct transcript text
    transcript = ""
    for m in messages:
        role_label = "Candidate" if m["role"] == "candidate" else "Interviewer"
        transcript += f"{role_label}: {m['content']}\n"

    # Fetch internship details if any
    job_title = "General Internship Practice"
    job_desc = ""
    if session.get("internship_id"):
        try:
            job_res = supabase.table("internships").select("*").eq("id", session["internship_id"]).single().execute()
            if job_res.data:
                job_title = job_res.data.get("title", "")
                job_desc = job_res.data.get("description", "")
        except Exception as e:
            pass
    elif custom_role and custom_role != 'general':
        role_criteria = {
            "Software Developer": "programming, data structures, algorithms, databases, APIs, software design",
            "Data Analyst": "SQL, Excel, data visualization, statistics, data cleaning",
            "UI/UX Designer": "design thinking, user research, wireframing, prototyping, usability testing",
            "Cybersecurity": "security concepts, risk assessment, network security, incident response"
        }
        job_title = custom_role
        job_desc = f"Internship position for a {custom_role}. Focus areas: {role_criteria.get(custom_role, 'general competencies')}"

    # Build prompt
    eval_prompt = f"""You are an expert HR and Technical Executive. 
    Evaluate the candidate's performance in this internship interview based on a professional hiring framework.
    Role: {job_title}
    Job Description: {job_desc}

    Transcript of the interview:
    {transcript}

    You must evaluate the candidate on these 4 dimensions and provide evidence-based scoring:

    1. Technical Competency (40% Weight):
       - Assess: Accuracy of technical concepts, understanding of required technologies, problem-solving, depth of explanation.
       - Rubric:
         * 90-100: Expert understanding with accurate, detailed, and structured explanations.
         * 70-89: Strong understanding with minor gaps or slight lack of elaboration.
         * 50-69: Basic understanding, lacks depth, or missed secondary details.
         * 11-49: Very weak understanding, incorrect answers, or significant knowledge gaps.
         * 0-10: No demonstrated competency. This range MUST be applied if the candidate repeatedly says "I don't know", "not sure", "no experience", "never used it", "I have no idea", leaves answers blank, or fails to answer technical questions.
       - Adapt criteria to the target role. (For Software Developer: programming, algorithms, databases, APIs, design; For Data Analyst: SQL, Excel, visualization, statistics, cleaning; etc.).

    2. Communication Skills (25% Weight):
       - Assess: Clarity, structure, professional language, conciseness.
       - Rubric:
         * Well-structured, articulate answers get higher scores.
         * Vague, repetitive, extremely short, or non-substantive responses (like repeatedly saying "I don't know") MUST be penalized heavily and score in the 0-10 range.

    3. Behavioral & Professional Competencies (20% Weight):
       - Assess: Teamwork, adaptability, initiative, learning attitude, accountability.
       - Rubric:
         * Evaluate answers using the STAR framework (Situation, Task, Action, Result).
         * Penalize heavily (score 0-10) if they fail to provide concrete examples, experiences, or structured responses.

    4. Confidence & Delivery (15% Weight):
       - Assess: Confidence level, consistency, hesitation indicators (filler words like "uh", pauses), answer completeness.
       - Rubric:
         * Must be based on actual textual signals.
         * Repeated uncertainty, hesitation, or inability to answer questions (such as saying "I don't know" or equivalent) indicates a complete lack of confidence/competency and MUST score in the 0-10 range.

    CRITICAL SCORING STRICTNESS & CALIBRATION:
    - You must be extremely strict and realistic. Do not award high or average scores out of politeness or encouragement.
    - If a candidate repeatedly answers with "I don't know", "not sure", "no experience", "never used it", "I have no idea", or extremely short non-substantive answers:
      * The scores for Technical, Communication, Confidence, and Behavioral categories MUST be within the 0–10 range. Do NOT award 20-30/100 for non-substantive answers.
    - Score Calibration Table:
      * 0–10: No demonstrated competency (repeated "I don't know", inability to answer, or blank responses).
      * 11–25: Very weak understanding (brief, vague, or incorrect responses).
      * 26–40: Basic awareness only (can list buzzwords but cannot explain how they work or give examples).
      * 41–60: Developing competency (understands basic concepts but has gaps in implementation or lacks depth).
      * 61–80: Good competency (clear, correct answers with minor details missing).
      * 81–100: Strong competency (expert-level explanations with deep technical depth, clear STAR structure, and strong evidence).

    FEEDBACK & EVIDENCE REQUIREMENTS:
    - Never invent strengths. If the candidate was unable to answer most questions and did not demonstrate any positive competency, you MUST return: "strengths": ["No significant strengths were demonstrated during this interview."] in the feedback object. Do not create placeholder strengths like "completed the interview" or "positive learning attitude".
    - Strengths, weaknesses, suggestions, and skill gaps must be generated strictly from the transcript, NOT from templates.
    - In each category, the "reasoning" must clearly explain why points were deducted, detailing specific observed shortcomings.
    - In each category, the "evidence" must contain actual question-and-answer excerpts from the interview transcript (formatted as "Q: <question>" \n "A: <candidate's answer>") justifying the score. If there are multiple examples of unable/refusal to answer, quote multiple excerpts to support the low score.

    Return ONLY a strict JSON object with this exact structure:
    {{
      "technical": {{
        "score": 78,
        "reasoning": "Detailed breakdown of why the score was assigned, including positive contributions (+X) and point deductions (-Y). For example: 'Correct explanation of OOP (+20), SQL database knowledge (+18), but limited API authentication understanding (-10)'",
        "evidence": "Direct candidate quotes or summaries of answers showing their exact knowledge or lack thereof."
      }},
      "communication": {{
        "score": 82,
        "reasoning": "Detailed breakdown. For example: 'Well-structured answers (+20), good professional language (+18), but could provide more concrete examples (-5)'",
        "evidence": "Observed communication style and structure in the answers."
      }},
      "behavioral": {{
        "score": 70,
        "reasoning": "Detailed breakdown. For example: 'Demonstrated strong teamwork (+15), but missed the 'Result' component in the STAR framework when discussing conflicts (-10)'",
        "evidence": "How they structured behavioral answers, highlighting any missing STAR components."
      }},
      "confidence": {{
        "score": 85,
        "reasoning": "Detailed breakdown. For example: 'Maintained consistent tone (+15), answered promptly (+10), but had minor hesitation filler words (-5)'",
        "evidence": "Textual indicators of confidence or hesitation."
      }},
      "feedback": {{
        "strengths": ["Specific strength 1", "Specific strength 2"],
        "weaknesses": ["Specific weakness 1", "Specific weakness 2"],
        "suggestions": ["Specific suggestion 1", "Specific suggestion 2", "Specific suggestion 3"]
      }},
      "skill_gaps": [
        {{
          "skill_name": "Name of missing skill",
          "severity": "critical" | "moderate" | "minor",
          "recommendation": "Actionable learning topic or resource recommendation"
        }}
      ]
    }}
    Do not include any other text, markdown backticks, or explanation. Output ONLY the JSON block.
    """

    try:
        response = generate_content_unified(
            contents=eval_prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        resp_text = response.text.strip()
        analysis = json.loads(resp_text)
    except Exception as e:
        print("Gemini evaluation error:", e)
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait a minute before generating your performance report.")
        analysis = {
            "technical": {
                "score": 60,
                "reasoning": "Basic understanding demonstrated, but lacked technical depth on required tools.",
                "evidence": "Candidate answered general questions but did not detail framework architectures."
            },
            "communication": {
                "score": 70,
                "reasoning": "Answers were clear, but structure could be improved using the STAR method.",
                "evidence": "Candidate kept answers concise but missed opportunity to provide examples."
            },
            "behavioral": {
                "score": 65,
                "reasoning": "Learning attitude is positive, but behavioral answers missed Situation/Result details.",
                "evidence": "No clear STAR method used during conflict descriptions."
            },
            "confidence": {
                "score": 60,
                "reasoning": "Exhibited minor hesitations and brief answers.",
                "evidence": "Candidate had multiple brief, one-sentence answers."
            },
            "feedback": {
                "strengths": ["Completed the full interview session.", "Demonstrated positive learning attitude."],
                "weaknesses": ["Missed structured STAR storytelling.", "Lacked technical elaboration on key tools."],
                "suggestions": ["Use the STAR method for behavioral questions.", "Review foundational framework architectures.", "Elaborate more on past engineering decisions."]
            },
            "skill_gaps": []
        }

    # Extract score values safely
    t_data = analysis.get("technical", {})
    c_data = analysis.get("communication", {})
    b_data = analysis.get("behavioral", {})
    f_data = analysis.get("confidence", {})

    def score_in_range(value, fallback):
        return max(0, min(100, float(value) if isinstance(value, (int, float)) else fallback))

    t_score = score_in_range(t_data.get("score"), 60)
    c_score = score_in_range(c_data.get("score"), 70)
    b_score = score_in_range(b_data.get("score"), 65)
    f_score = score_in_range(f_data.get("score"), 60)
    
    # Calculate overall readiness score on backend using the formula:
    # 40% Technical + 25% Communication + 20% Behavioral + 15% Confidence
    overall = round(0.40 * t_score + 0.25 * c_score + 0.20 * b_score + 0.15 * f_score)

    feedback_payload = {
        "strengths": analysis.get("feedback", {}).get("strengths", []),
        "weaknesses": analysis.get("feedback", {}).get("weaknesses", []),
        "suggestions": analysis.get("feedback", {}).get("suggestions", []),
        "technical_reasoning": t_data.get("reasoning", ""),
        "technical_evidence": t_data.get("evidence", ""),
        "communication_reasoning": c_data.get("reasoning", ""),
        "communication_evidence": c_data.get("evidence", ""),
        "behavioral_reasoning": b_data.get("reasoning", ""),
        "behavioral_evidence": b_data.get("evidence", ""),
        "confidence_reasoning": f_data.get("reasoning", ""),
        "confidence_evidence": f_data.get("evidence", "")
    }

    # Save to interview_results
    try:
        existing_res = supabase.table("interview_results").select("id").eq("session_id", session_id).execute()
        
        result_payload = {
            "session_id": session_id,
            "overall_readiness_score": overall,
            "technical_score": t_score,
            "behavioral_score": b_score,
            "communication_score": c_score,
            "confidence_score": f_score,
            "feedback_json": feedback_payload
        }
        
        if existing_res.data:
            supabase.table("interview_results").update(result_payload).eq("session_id", session_id).execute()
        else:
            supabase.table("interview_results").insert(result_payload).execute()
            
        # Clean up existing skill gaps and write new ones
        supabase.table("interview_skill_gaps").delete().eq("session_id", session_id).execute()
        
        for gap in analysis.get("skill_gaps", []):
            supabase.table("interview_skill_gaps").insert({
                "session_id": session_id,
                "skill_name": gap.get("skill_name"),
                "severity": gap.get("severity", "moderate"),
                "recommendation": gap.get("recommendation", "")
            }).execute()
            
    except Exception as e:
        print("Database save error for results:", e)

    # Update session status
    try:
        started_at = datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
        duration = int((datetime.now(timezone.utc) - started_at).total_seconds())
        
        supabase.table("interview_sessions").update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "duration_seconds": duration
        }).eq("id", session_id).execute()
    except Exception as e:
        print("Database session update error:", e)

    internship_data = session.get("internships")
    if isinstance(internship_data, list):
        internship_data = internship_data[0] if internship_data else None

    return {
        "session_id": session_id,
        "internship_id": session.get("internship_id"),
        "internship": internship_data,
        "overall_readiness_score": overall,
        "technical_score": t_score,
        "behavioral_score": b_score,
        "communication_score": c_score,
        "confidence_score": f_score,
        "feedback": feedback_payload,
        "feedback_json": feedback_payload,
        "skill_gaps": analysis.get("skill_gaps", [])
    }


@app.get("/interviews/sessions")
@app.get("/api/interviews/sessions")
async def get_interview_sessions(request: Request):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase:
        raise HTTPException(status_code=500, detail="Backend not fully configured")

    auth_header = request.headers.get("Authorization")
    user_id = get_user_id_from_token(auth_header, supabase)
    
    token = auth_header.replace("Bearer ", "")
    supabase.postgrest.auth(token)

    try:
        sess_res = supabase.table("interview_sessions")\
            .select("*, internships(id, title, company_name, company_logo_url), interview_results(*), interview_messages(*), interview_skill_gaps(*)")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return sess_res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load interview sessions")


@app.get("/interviews/analytics")
@app.get("/api/interviews/analytics")
async def get_interview_analytics(request: Request):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase:
        raise HTTPException(status_code=500, detail="Backend not fully configured")

    auth_header = request.headers.get("Authorization")
    user_id = get_user_id_from_token(auth_header, supabase)
    
    token = auth_header.replace("Bearer ", "")
    supabase.postgrest.auth(token)

    try:
        sess_res = supabase.table("interview_sessions").select("id").eq("user_id", user_id).execute()
        session_ids = [s["id"] for s in (sess_res.data or [])]

        if not session_ids:
            return {
                "average_readiness": 0,
                "history": [],
                "common_weaknesses": []
            }

        # Fetch results
        results_res = supabase.table("interview_results")\
            .select("*, interview_sessions(id, created_at, interview_type, difficulty, internships(title, company_name))")\
            .in_("session_id", session_ids)\
            .order("created_at", desc=False)\
            .execute()
        results = results_res.data or []

        # Fetch skill gaps
        gaps_res = supabase.table("interview_skill_gaps")\
            .select("skill_name, severity")\
            .in_("session_id", session_ids)\
            .execute()
        gaps = gaps_res.data or []

        avg_score = 0
        if results:
            avg_score = round(sum(float(r["overall_readiness_score"]) for r in results) / len(results))

        weaknesses_counts = {}
        for g in gaps:
            name = g["skill_name"]
            weaknesses_counts[name] = weaknesses_counts.get(name, 0) + 1
        
        common_weaknesses = sorted(
            [{"skill_name": k, "count": v} for k, v in weaknesses_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:5]

        history = []
        for r in results:
            history.append({
                "session_id": r["session_id"],
                "score": float(r["overall_readiness_score"]),
                "date": r["created_at"],
                "type": r["interview_sessions"]["interview_type"] if r.get("interview_sessions") else "mixed",
                "role": r["interview_sessions"]["internships"]["title"] if (r.get("interview_sessions") and r["interview_sessions"].get("internships")) else "General Practice"
            })

        return {
            "average_readiness": avg_score,
            "history": history,
            "common_weaknesses": common_weaknesses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Unable to load interview analytics")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
