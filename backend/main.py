import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, String, Integer, select          # ← CHANGED: added select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker  # ← CHANGED: async imports instead of create_engine/Session/sessionmaker
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── NEON POSTGRESQL DATABASE CONNECTION ─────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")      # ← unchanged: already loads postgresql+asyncpg://... from .env

engine = create_async_engine(DATABASE_URL)    # ← CHANGED: create_async_engine instead of create_engine
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)  # ← CHANGED: async_sessionmaker instead of sessionmaker
Base = declarative_base()

# ─── BCRYPT + JWT SETUP ──────────────────────────────────────────────
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

# Define our User database table structure
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)

# ← CHANGED: table creation moved into an async startup event, since async engines can't run create_all() directly at import time
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ← CHANGED: get_db is now an async generator using AsyncSession
async def get_db():
    async with AsyncSessionLocal() as db:
        yield db

# ─── PYDANTIC VALIDATION MODELS ──────────────────────────────────────
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


# ─── 1. POSTGRES SIGN UP ─────────────────────────────────────────────
@app.post("/api/auth/signup")
async def signup(payload: SignUpRequest, db: AsyncSession = Depends(get_db)):  # ← CHANGED: type hint AsyncSession
    clean_email = payload.email.strip().lower()
    clean_role = payload.role.strip().lower()
    
    # user_exists = db.query(UserDB).filter(UserDB.email == clean_email).first()  # ← REMOVED: sync query style
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))  # ← CHANGED: async select
    user_exists = result.scalar_one_or_none()                                     # ← NEW
    if user_exists:
        return {"success": False, "message": "An account with this email already exists."}
    
    new_user = UserDB(email=clean_email, password=hash_password(payload.password), role=clean_role)
    db.add(new_user)
    await db.commit()                                    # ← CHANGED: await added
    
    print(f"\n🚀 [NEON POSTGRES] Saved new {clean_role.upper()} to the cloud: {clean_email}")
    return {"success": True, "message": "Account created successfully!"}


# ─── 2. POSTGRES LOGIN ───────────────────────────────────────────────
@app.post("/api/auth/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):  # ← CHANGED
    clean_email = payload.email.strip().lower()
    
    # user = db.query(UserDB).filter(UserDB.email == clean_email).first()  # ← REMOVED
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))  # ← CHANGED
    user = result.scalar_one_or_none()                                            # ← NEW
    
    if user and verify_password(payload.password, user.password):
        token = create_access_token({"sub": user.email, "role": user.role})
        return {
            "success": True, 
            "message": "Login successful",
            "token": token,
            "user": {"email": user.email, "role": user.role}
        }
    
    return {"success": False, "message": "Invalid email or password configuration."}


# ─── 3. POSTGRES FORGOT PASSWORD ─────────────────────────────────────
@app.post("/api/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):  # ← CHANGED
    clean_email = payload.email.strip().lower()
    
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))  # ← CHANGED
    user = result.scalar_one_or_none()                                            # ← NEW
    if not user:
        return {"success": False, "message": "This email address is not registered in our system."}
    
    print("\n" + "="*60)
    print("📧 SECURE SMTP MAIL TRANSMISSION SIMULATOR")
    print(f"TO:      {clean_email}")
    print(f"ROLE:    {user.role.upper()}")
    print("SUBJECT: Password Reset Request Link")
    print("-"*60)
    print(f"  🔗 http://localhost:3000/reset-password?email={clean_email}")
    print("="*60 + "\n")
    
    return {"success": True, "message": "Reset verification link sent successfully."}


# ─── 4. POSTGRES RESET PASSWORD ──────────────────────────────────────
@app.post("/api/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):  # ← CHANGED
    clean_email = payload.email.strip().lower()
    
    result = await db.execute(select(UserDB).where(UserDB.email == clean_email))  # ← CHANGED
    user = result.scalar_one_or_none()                                            # ← NEW
    if user:
        user.password = hash_password(payload.new_password)
        await db.commit()                                    # ← CHANGED: await added
        print(f"🔑 [NEON UPDATE] Credential change saved to cloud for: {clean_email}")
        return {"success": True, "message": "Your password has been securely updated."}
        
    return {"success": False, "message": "Account validation failed during updating."}