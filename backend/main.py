from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── NEON POSTGRESQL DATABASE CONNECTION ─────────────────────────────
DATABASE_URL = "postgresql://neondb_owner:npg_FNHkRhuoU70Z@ep-dawn-pond-atrfn6tb-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define our User database table structure
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)

# Automatically create the 'users' table inside your Neon database if it's missing!
Base.metadata.create_all(bind=engine)

# Helper function to open/close database sessions cleanly
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
async def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    clean_role = payload.role.strip().lower()
    
    user_exists = db.query(UserDB).filter(UserDB.email == clean_email).first()
    if user_exists:
        return {"success": False, "message": "An account with this email already exists."}
    
    # Write the new user straight to Neon Postgres cloud!
    new_user = UserDB(email=clean_email, password=payload.password, role=clean_role)
    db.add(new_user)
    db.commit()
    
    print(f"\n🚀 [NEON POSTGRES] Saved new {clean_role.upper()} to the cloud: {clean_email}")
    return {"success": True, "message": "Account created successfully!"}


# ─── 2. POSTGRES LOGIN ───────────────────────────────────────────────
@app.post("/api/auth/login")
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    
    user = db.query(UserDB).filter(UserDB.email == clean_email).first()
    
    if user and user.password == payload.password:
        return {
            "success": True, 
            "message": "Login successful",
            "user": {"email": user.email, "role": user.role}
        }
    
    return {"success": False, "message": "Invalid email or password configuration."}


# ─── 3. POSTGRES FORGOT PASSWORD ─────────────────────────────────────
@app.post("/api/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    
    user = db.query(UserDB).filter(UserDB.email == clean_email).first()
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
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    
    user = db.query(UserDB).filter(UserDB.email == clean_email).first()
    if user:
        user.password = payload.new_password 
        db.commit()
        print(f"🔑 [NEON UPDATE] Credential change saved to cloud for: {clean_email}")
        return {"success": True, "message": "Your password has been securely updated."}
        
    return {"success": False, "message": "Account validation failed during updating."}