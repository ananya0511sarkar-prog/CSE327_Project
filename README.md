# CSE327 Project — AI & Expert-Led Interview/Exam Prep Platform

An AI-powered platform for interview and exam preparation, combining AI mentorship, live mock interviews, expert-led coaching, and OCR-based note evaluation.

Built for CSE327 — Software Engineering.

## Tech Stack

- **Frontend:** Next.js
- **Backend:** FastAPI
- **Database:** PostgreSQL (hosted on Neon)
- **Video calls:** WebRTC
- **Real-time chat:** WebSocket

## Prerequisites

- Node.js 18+
- Python 3.10+
- Git

## Project Structure

CSE327_Project/

├── backend/      # FastAPI app
└── frontend/     # Next.js app


## Backend Setup

1. Clone the repo and navigate into backend:
```bash
   git clone <repo-url>
   cd CSE327_Project/backend
```

2. Create and activate a virtual environment:

   **Windows (PowerShell):**
```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1
```

   **Mac/Linux:**
```bash
   python3 -m venv venv
   source venv/bin/activate
```

3. Install dependencies:
```bash
   pip install -r requirements.txt
```

4. Create your `.env` file:
```bash
   cp .env.example .env
```
   Then fill in `DATABASE_URL` and `SECRET_KEY` — **ask a teammate privately for the real Neon connection string** (never commit real credentials).

5. Run the server:
```bash
   uvicorn app.main:app --reload
```
   Visit `http://localhost:8000/docs` to see the API docs.

## Frontend Setup

1. Navigate into frontend:
```bash
   cd ../frontend
```

2. Install dependencies:
```bash
   npm install
```

3. Run the dev server:
```bash
   npm run dev
```
   Visit `http://localhost:3000`.

## Notes

- Never commit `.env` files — only `.env.example` should be in the repo.
- Each teammate needs their own `.env` set up locally, pointing to the shared Neon database.