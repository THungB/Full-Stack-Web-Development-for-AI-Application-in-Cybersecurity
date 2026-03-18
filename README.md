# Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity

Full-stack spam detection project with:

- `frontend/`: React + Vite + Tailwind dashboard
- `backend/`: FastAPI + SQLite API
- `browser-extension/`: Chromium extension for highlighted text scanning

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If you do not have the trained `.pkl` model yet, the backend still runs with a fallback predictor so the UI and API can be tested end-to-end.
