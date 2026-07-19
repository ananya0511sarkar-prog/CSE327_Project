import os
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from sqlalchemy import Column, String, Integer, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from passlib.context import CryptContext
import jwt

# --- SDK CLIENT IMPORTS ---
from openai import OpenAI
from google import genai
from anthropic import Anthropic

# Load environment variables
load_dotenv()

app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── LIVE SDK INITIALIZATION ─────────────────────────────────────────
openai_key = os.getenv("OPENAI_API_KEY")
gemini_key = os.getenv("GEMINI_API_KEY")
anthropic_key = os.getenv("ANTHROPIC_API_KEY")

openai_client = OpenAI(api_key=openai_key) if openai_key else None
gemini_client = genai.Client(api_key=gemini_key) if gemini_key else None
anthropic_client = Anthropic(api_key=anthropic_key) if anthropic_key else None

print("\n" + "🔑 SDK INITIALIZATION STATUS " + "="*30)
print(f"OpenAI Client:  {'✅ Ready' if openai_client else '❌ Missing Key (OPENAI_API_KEY)'}")
print(f"Gemini Client:  {'✅ Ready' if gemini_client else '❌ Missing Key (GEMINI_API_KEY)'}")
print(f"Claude Client:  {'✅ Ready' if anthropic_client else '❌ Missing Key (ANTHROPIC_API_KEY)'}")
print("="*60 + "\n")


# ─── DATABASE SETUP ─────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()


# ─── AUTHENTICATION SETUP ───────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

from sqlalchemy import ARRAY
# ─── DATABASE MODELS ────────────────────────────────────────────────
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)
    #for dashboard page
    phone_number = Column(String, nullable=True)
    tech_stack = Column(ARRAY(String), nullable=True, default=list)
    summary = Column(String, nullable=True)

class UserProfileOut(BaseModel):
    id: int
    email: str
    role: str
    phone_number: Optional[str] = None
    tech_stack: Optional[list[str]] = []
    summary: Optional[str] = None
    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    phone_number: Optional[str] = None
    tech_stack: Optional[list[str]] = None
    summary: Optional[str] = None

from sqlalchemy import ForeignKey, DateTime, func

class ProjectDB(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    status = Column(String, default="In Progress")
    details = Column(String)
    ai_engine = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

async def get_db():
    async with AsyncSessionLocal() as db:
        yield db

from fastapi.security import OAuth2PasswordBearer
from fastapi import status

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    result = await db.execute(select(UserDB).where(UserDB.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user





@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

#async def get_db():
    #async with AsyncSessionLocal() as db:
        #yield db





# ─── UPDATED REQUEST SCHEMAS TO MATCH NEXT.JS FRONTEND ──────────────
class SignUpRequest(BaseModel):
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

class GenerateQuestionRequest(BaseModel):
    difficulty: str
    topic: str
    project_name: str
    engine: str

class ChatQuestionMetadata(BaseModel):
    question_number: int
    title: str
    difficulty: str

class ChatRequest(BaseModel):
    engine: str
    message: str
    code_context: str
    question_metadata: Optional[ChatQuestionMetadata] = None

class ProjectContext(BaseModel):
    name: str
    topic: str

class EvaluateRequest(BaseModel):
    engine: str
    code_context: str
    difficulty_context: str
    question_id: int          # NEW — which saved question this evaluation belongs to
    question_number: int
    question_title: str
    project_context: ProjectContext


class ProjectCreate(BaseModel):
    title: str
    details: Optional[str] = None
    ai_engine: str

class ProjectOut(BaseModel):
    id: int
    title: str
    status: str
    details: Optional[str]
    ai_engine: str

    class Config:
        from_attributes = True


#to save questions in db
class ProjectQuestionDB(Base):
    __tablename__ = "project_questions"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    difficulty = Column(String, nullable=False)  # "Easy" | "Medium" | "Hard"
    number = Column(Integer, nullable=False)      # position within that difficulty
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    hint = Column(String, nullable=False)
    starter_code = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProjectQuestionOut(BaseModel):
    id: int
    difficulty: str
    number: int
    title: str
    description: str
    hint: str
    starter_code: str

    class Config:
        from_attributes = True


#to save the answers in the db:
class QuestionEvaluationDB(Base):
    __tablename__ = "question_evaluations"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("project_questions.id"), nullable=False)
    code_snapshot = Column(String, nullable=False)   # the code that was submitted for THIS attempt
    evaluation_text = Column(String, nullable=False) # the LLM's reply for THIS attempt
    engine = Column(String, nullable=True)            # which AI graded it
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QuestionEvaluationOut(BaseModel):
    id: int
    question_id: int
    code_snapshot: str
    evaluation_text: str
    engine: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ─── AUTH ENDPOINTS ─────────────────────────────────────────────────
@app.post("/api/auth/signup")
async def signup(payload: SignUpRequest, db: AsyncSession = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    clean_role = payload.role.strip().lower()
    
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))
    user_exists = result.scalar_one_or_none()
    if user_exists:
        return {"success": False, "message": "An account with this email already exists."}
    
    new_user = UserDB(email=clean_email, password=hash_password(payload.password), role=clean_role)
    db.add(new_user)
    await db.commit()
    return {"success": True, "message": "Account created successfully!"}

@app.post("/api/auth/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))
    user = result.scalar_one_or_none()
    
    if user and verify_password(payload.password, user.password):
        token = create_access_token({"sub": user.email, "role": user.role})
        return {"success": True, "token": token, "user": {"email": user.email, "role": user.role}}
    return {"success": False, "message": "Invalid credentials."}

@app.post("/api/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))
    user = result.scalar_one_or_none()
    if not user:
        return {"success": False, "message": "Email not found."}
    return {"success": True, "message": "Reset link sent."}

@app.post("/api/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))
    user = result.scalar_one_or_none()
    if user:
        user.password = hash_password(payload.new_password)
        await db.commit()
        return {"success": True, "message": "Password updated."}
    return {"success": False, "message": "Validation failed."}


# ─── HELPERS FOR RUNNING LIVE API CALLS ──────────────────────────────
def call_live_llm(engine_choice: str, system_instructions: str, user_prompt: str) -> str:
    """Helper utility routing instructions to their matching production API clients."""
    if engine_choice == "ChatGPT":
        if not openai_client:
            raise ValueError("OpenAI client was not initialized. Please check OPENAI_API_KEY.")
            
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.choices[0].message.content

    elif engine_choice == "Gemini":
        if not gemini_client:
            raise ValueError("Gemini client was not initialized. Please check GEMINI_API_KEY.")
            
        response = gemini_client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=f"{system_instructions}\n\nUser Input:\n{user_prompt}"
        )
        return response.text

    elif engine_choice == "Claude":
        if not anthropic_client:
            raise ValueError("Anthropic client was not initialized. Please check ANTHROPIC_API_KEY.")
            
        response = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=system_instructions,
            messages=[{"role": "user", "content": user_prompt}]
        )
        return response.content[0].text
        
    else:
        raise ValueError("Invalid Engine Choice detected.")


@app.get("/api/projects", response_model=list[ProjectOut])
async def get_projects(
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    result = await db.execute(select(ProjectDB).where(ProjectDB.owner_id == current_user.id))
    return result.scalars().all()

@app.post("/api/projects", response_model=ProjectOut)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    new_project = ProjectDB(
        title=payload.title,
        details=payload.details,
        ai_engine=payload.ai_engine,
        owner_id=current_user.id
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project


#for dashboard: 
@app.get("/api/users/me", response_model=UserProfileOut)
async def get_my_profile(current_user: UserDB = Depends(get_current_user)):
    return current_user

@app.patch("/api/users/me", response_model=UserProfileOut)
async def update_my_profile(
    payload: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number
    if payload.tech_stack is not None:
        current_user.tech_stack = payload.tech_stack
    if payload.summary is not None:
        current_user.summary = payload.summary
    await db.commit()
    await db.refresh(current_user)
    return current_user






@app.get("/api/projects/{project_id}/questions", response_model=list[ProjectQuestionOut])
async def get_project_questions(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectQuestionDB)
        .where(ProjectQuestionDB.project_id == int(project_id))
        .order_by(ProjectQuestionDB.difficulty, ProjectQuestionDB.number)
    )
    return result.scalars().all()



@app.get("/api/questions/{question_id}/evaluations", response_model=list[QuestionEvaluationOut])
async def get_question_evaluations(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(QuestionEvaluationDB)
        .where(QuestionEvaluationDB.question_id == question_id)
        .order_by(QuestionEvaluationDB.created_at)
    )
    return result.scalars().all()

# ─── INTERACTIVE API SANDBOX ENDPOINTS ───────────────────────────────

@app.post("/api/projects/{project_id}/generate-question")
async def handle_question_generation(
    project_id: str,
    payload: GenerateQuestionRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        system_context = (
            "You are a coding interview generator. You must generate a single tech question "
            "tailored precisely to the user's project context. You must return your response "
            "EXACTLY as a valid JSON object. Do not include raw markdown wrap strings like ```json.\n\n"
            "The output JSON object structure MUST look like this:\n"
            "{\n"
            '  "title": "Question Name Here",\n'
            '  "description": "Clear step-by-step problem details.",\n'
            '  "hint": "Useful architectural design hint pointer.",\n'
            '  "starterCode": "function solve() {\\n\\n}"\n'
            "}"
        )

        prompt = (
            f"Generate a customized coding challenge with difficulty level '{payload.difficulty}' "
            f"for a project named '{payload.project_name}' focused around this core topic field: '{payload.topic}'."
        )

        raw_reply = call_live_llm(payload.engine, system_context, prompt).strip()

        if raw_reply.startswith("```"):
            lines = raw_reply.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_reply = "\n".join(lines).strip()

        parsed_question = json.loads(raw_reply)

        # count existing questions at this difficulty to assign the next number
        result = await db.execute(
            select(ProjectQuestionDB).where(
                ProjectQuestionDB.project_id == int(project_id),
                ProjectQuestionDB.difficulty == payload.difficulty
            )
        )
        existing_count = len(result.scalars().all())

        new_question = ProjectQuestionDB(
            project_id=int(project_id),
            difficulty=payload.difficulty,
            number=existing_count + 1,
            title=parsed_question["title"],
            description=parsed_question["description"],
            hint=parsed_question["hint"],
            starter_code=parsed_question.get("starterCode", "// Write your solution here...")
        )
        db.add(new_question)
        await db.commit()
        await db.refresh(new_question)

        return {"success": True, "question": parsed_question, "question_id": new_question.id}

    except Exception as e:
        print(f"Generation Error Trace: {str(e)}")
        return {"success": False, "error": f"Failed to synthesize valid code schema structures: {str(e)}"}


@app.post("/api/projects/{project_id}/chat")
async def handle_workspace_chat(project_id: str, payload: ChatRequest):
    try:
        meta_context = ""
        if payload.question_metadata:
            meta_context = (
                f"They are working on Question #{payload.question_metadata.question_number}: "
                f"\"{payload.question_metadata.title}\" under [{payload.question_metadata.difficulty}] constraints.\n"
            )

        system_context = (
            "You are an expert technical interview mentor. The user is writing code in their "
            "Answering Sandbox workspace right now.\n"
            f"{meta_context}"
            f"Here is their current live script context:\n```\n{payload.code_context}\n```\n"
            "Answer their chat query briefly, provide guidance rather than doing it all for them, and focus on clean algorithmic code design patterns."
        )

        ai_reply = call_live_llm(payload.engine, system_context, payload.message)
        return {"success": True, "reply": ai_reply}
        
    except Exception as e:
        print(f"API Error Trace: {str(e)}")
        return {"success": False, "reply": f"API Engine Error: {str(e)}"}


@app.post("/api/projects/{project_id}/evaluate")
async def handle_workspace_evaluation(
    project_id: str,
    payload: EvaluateRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        evaluation_system = (
            "You are an automated code testing and architecture compiler evaluator. "
            f"Review the code context specifically against Question #{payload.question_number}: '{payload.question_title}'.\n"
            f"Target Context Track: {payload.project_context.name} ({payload.project_context.topic})\n"
            f"Difficulty Baseline Evaluation Level: [{payload.difficulty_context}]\n\n"
            "Provide explicit markdown analysis detailing optimization criteria, runtime scale complexity alternatives, "
            "or structural bug concerns directly. Use clear formatting structural lists."
        )
        user_eval_prompt = (
            f"Evaluate this script context for submission metrics:\n\n"
            f"```\n{payload.code_context}\n```"
        )

        evaluation_reply = call_live_llm(payload.engine, evaluation_system, user_eval_prompt)

        # Save this attempt so it's visible when the user comes back to this question later
        new_eval = QuestionEvaluationDB(
            question_id=payload.question_id,
            code_snapshot=payload.code_context,
            evaluation_text=evaluation_reply,
            engine=payload.engine
        )
        db.add(new_eval)
        await db.commit()

        return {"success": True, "reply": evaluation_reply}

    except Exception as e:
        print(f"Evaluation API Error Trace: {str(e)}")
        return {"success": False, "reply": f"Internal Evaluation Compilation Breakout: {str(e)}"}

# Run once in Neon SQL Editor before restarting uvicorn:
# ALTER TABLE users ADD COLUMN phone_number VARCHAR;
# ALTER TABLE users ADD COLUMN tech_stack TEXT[];
# ALTER TABLE users ADD COLUMN summary VARCHAR;