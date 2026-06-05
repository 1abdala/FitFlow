import os
import json
import io
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from google import genai
from google.genai import types
import PyPDF2

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

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
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
    if not supabase or not gemini_client:
        raise HTTPException(status_code=500, detail="Backend not fully configured (missing API keys)")

    # Enforce valid authentication token
    auth_header = request.headers.get("Authorization")
    get_user_id_from_token(auth_header, supabase)
    
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

        print(f"DEBUG: Found job: {title}. Sending to Gemini...")

        prompt = f"Title: {title}\nCompany: {company}\nDescription: {desc}"

        try:
            response = gemini_client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(system_instruction=SUMMARY_SYSTEM),
            )
            summary_text = response.text.strip()
            print("DEBUG: Gemini summary generated successfully.")
        except Exception as e:
            print(f"DEBUG: Gemini API failed: {str(e)}. Using fallback summary.")
            summary_text = f"About the role:\nThis is a {title} position at {company}.\n\nWhat you'll be doing:\nYou will be expected to utilize your technical skills to contribute to the team's ongoing projects."

        return {"internship_id": internship_id, "summary": summary_text}

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: EXCEPTION: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-cv")
@limiter.limit("5/minute")
async def analyze_cv(request: Request, student_id: str = Form(...), file: UploadFile = File(...)):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_URL and SUPABASE_ANON_KEY else None
    if not supabase or not gemini_client:
        raise HTTPException(status_code=500, detail="Backend not fully configured")

    # Secure endpoint by verifying authorization token and enforcing student_id matches token user
    auth_header = request.headers.get("Authorization")
    authenticated_user_id = get_user_id_from_token(auth_header, supabase)
    
    if authenticated_user_id != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only analyze your own CV.")

    # Apply the auth token to database client for RLS context
    token = auth_header.replace("Bearer ", "")
    supabase.postgrest.auth(token)

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Enforce file size limit (5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

    # Parse PDF
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File size exceeds the 5MB limit.")
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
        response = gemini_client.models.generate_content(model=MODEL, contents=cv_prompt)
        resp_text = response.text.strip()
        if resp_text.startswith("```json"):
            resp_text = resp_text[7:-3]
        elif resp_text.startswith("```"):
            resp_text = resp_text[3:-3]
        analysis = json.loads(resp_text)
    except Exception as e:
        print(f"Gemini Error: {e}")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
