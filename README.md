# Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity

Full-stack spam detection project with:

- `frontend/`: React + Vite + Tailwind dashboard
- `backend/`: FastAPI + SQLite API
- `browser-extension/`: Chromium extension for highlighted text scanning

## Project Structure

```text
Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity/
├── backend/                  # FastAPI backend, ML models, and SQLite database
│   ├── bot/                  # Chat/Bot related code
│   ├── database/             # SQLite database and models
│   ├── ml/                   # Machine learning models and scripts
│   ├── routes/               # FastAPI API endpoints
│   ├── main.py               # FastAPI application entry point
│   └── requirements.txt      # Backend dependencies
├── browser-extension/        # Chromium extension for spam detection
│   ├── background.js         # Extension background script
│   ├── content.js            # Extension content script
│   └── manifest.json         # Extension manifest
├── frontend/                 # React dashboard UI
│   ├── src/                  # React source files
│   ├── index.html            # Main HTML file
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
├── requirements/             # Assigment Description and Criteria
├── .gitignore                # Git ignore file
├── LICENSE                   # Project license
└── README.md                 # Project documentation
```

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
# Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity

Full-stack spam detection project with:

- `frontend/`: React + Vite + Tailwind dashboard
- `backend/`: FastAPI + SQLite API
- `browser-extension/`: Chromium extension for highlighted text scanning

## Project Structure

```text
Full-Stack-Web-Development-for-AI-Application-in-Cybersecurity/
├── backend/                  # FastAPI backend, ML models, and SQLite database
│   ├── bot/                  # Chat/Bot related code
│   ├── database/             # SQLite database and models
│   ├── ml/                   # Machine learning models and scripts
│   ├── routes/               # FastAPI API endpoints
│   ├── main.py               # FastAPI application entry point
│   └── requirements.txt      # Backend dependencies
├── browser-extension/        # Chromium extension for spam detection
│   ├── background.js         # Extension background script
│   ├── content.js            # Extension content script
│   └── manifest.json         # Extension manifest
├── frontend/                 # React dashboard UI
│   ├── src/                  # React source files
│   ├── index.html            # Main HTML file
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
├── requirements/             # Assigment Description and Criteria
├── .gitignore                # Git ignore file
├── LICENSE                   # Project license
└── README.md                 # Project documentation
```

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

## Team Members

- **Nguyễn Thành Kiên** (GitHub: [`KindaRusty`](https://github.com/KindaRusty))
- **Bùi Tiến Hưng** (GitHub: [`THungB`](https://github.com/THungB))
