# Full-Stack Web Development for AI Application in Cybersecurity

Full-stack spam detection project for COS30049 Assignment 3. The repository combines a React + Vite frontend, a FastAPI + SQLite backend, a Telegram bot, and a Chromium browser extension around a shared spam-classification workflow.

As of 2026-03-23, the repo already includes the planned website, OCR, Telegram, dashboard, history, and extension flows. It also includes extra scope beyond the original assignment plan: batch CSV testing, a `/health` endpoint, and demo data seeding for first-run experience.

## Current Modules

- `frontend/`: React dashboard with routes for overview, scanning, and history.
- `backend/`: FastAPI API, SQLite persistence, ML prediction flow, OCR handling, and health check.
- `backend/bot/`: Telegram bot that forwards chat messages to the backend.
- `browser-extension/`: Manifest V3 extension for scanning highlighted text in Chromium-based browsers.
- `requirements/`: Assignment description and grading criteria PDFs.
- `run-project.ps1` and `run-project.bat`: Convenience launchers for local frontend + backend startup.

## Progress By Assignment Timeline

| Timeline window | Planned deliverable | Status on 2026-03-23 | Notes |
| --- | --- | --- | --- |
| Mar 18 to 19 | Project setup, folder structure, FastAPI skeleton, CORS | Completed | Repo structure, launch scripts, FastAPI app, and CORS config are present. |
| Mar 20 to 22 | API endpoints, SQLite schema, load pre-trained model | Completed | `/scan`, `/scan/ocr`, `/history`, `/stats`, and database-backed persistence are implemented. |
| Mar 21 to 22 | Telegram bot integration | Completed | `backend/bot/telegram_bot.py` posts Telegram messages to `/scan`. |
| Mar 23 to 27 | React frontend pages, Axios layer, OCR scanner | In Progress | Core pages and OCR UI are implemented; frontend polish is still active on 2026-03-23. |
| Mar 28 to 30 | Charts, auto-refresh, CSV export | Completed | Dashboard charts, history polling, and CSV export are already in the repo. |
| Mar 31 to Apr 2 | Browser extension | Completed | Manifest V3 extension and content script are present. |
| Apr 1 to Apr 2 | OCR endpoint and integration | Completed | OCR upload flow is wired from frontend to backend. |
| Apr 3 to Apr 5 | Testing, error handling, responsive polish | In Progress | Frontend tests exist, build succeeds, but backend automated tests are not evidenced and Vitest is blocked in this sandbox by `spawn EPERM`. |
| Apr 6 to Apr 7 | Report and README | In Progress | Main docs exist and are being synchronized with actual repo state. |
| Apr 8 to Apr 10 | Demo video and final submission | Pending | No repo evidence yet. |

## Implemented Features

### Input Channels

- Website text scanning through `POST /scan`
- OCR image scanning through `POST /scan/ocr`
- Telegram bot relay through `backend/bot/telegram_bot.py`
- Browser extension scan flow for highlighted text
- Batch CSV testing through `POST /scan/batch` as extra scope

### Frontend

- Routes: `/`, `/scan`, `/history`
- Dashboard with summary cards and three Recharts visualizations
- Scan workspace with text input, OCR scanner, batch tester, toast feedback, and system status
- History page with filtering, sorting, auto-refresh, CSV export, and deletion

### Backend

- FastAPI app with `/health`, `/scan`, `/scan/ocr`, `/scan/batch`, `/history`, `/stats`, and `DELETE /history/{id}`
- SQLite persistence via SQLAlchemy
- Fallback predictor support when a trained `.pkl` model is missing
- Automatic demo seed when the database starts empty

## Run Locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Default API URL: `http://localhost:8000`

### Telegram Bot

```bash
cd backend
.venv\Scripts\activate
python bot/telegram_bot.py
```

Set `TELEGRAM_BOT_TOKEN` first. The bot posts to `FASTAPI_URL`, which defaults to `http://localhost:8000/scan`.

### Browser Extension

1. Open the browser extensions page in Chrome, Coc Coc, or Opera.
2. Enable Developer Mode.
3. Choose **Load unpacked**.
4. Select the `browser-extension/` folder.

The extension sends highlighted text to `http://localhost:8000/scan` with `source: "extension"`.

### Combined Startup Script

On Windows, you can also run:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-project.ps1
```

or:

```bat
run-project.bat
```

## Environment Notes

### Frontend

`frontend/.env.example`

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend

`backend/.env.example`

```env
FASTAPI_URL=http://localhost:8000/scan
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
SPAM_MODEL_PATH=
APP_SEED_DEMO=true
DATABASE_URL=sqlite:///backend/spam_detection.db
```

### Model Behavior

- If a trained Assignment 2 model is available, place it at `backend/ml/spam_classifier.pkl` or another configured path.
- If no model file is found, the backend still serves predictions with a fallback keyword-based predictor so the app can be exercised end-to-end.

### OCR Requirements

- Install the Tesseract OCR engine separately on the machine.
- Keep `pytesseract` and Pillow installed through backend dependencies.
- The backend accepts PNG, JPG, and WebP uploads up to 5 MB for OCR scanning.

### Batch CSV Workflow

- Upload a UTF-8 CSV file through the Scan page batch tab.
- The CSV must include a `message` column.
- Optional columns include `expected_label`, `source`, and `username`.
- `expected_label` enables accuracy, precision, recall, and F1 reporting.
- Batch testing is implemented scope beyond the original assignment outline.

## API Surface Documented From Code

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend availability check |
| `POST` | `/scan` | Scan one text message |
| `POST` | `/scan/ocr` | OCR image upload and scan |
| `POST` | `/scan/batch` | Batch CSV scan and evaluation |
| `GET` | `/history` | Paginated scan history |
| `DELETE` | `/history/{id}` | Delete one stored record |
| `GET` | `/stats` | Dashboard summary and chart data |

## Known Status

- Frontend production build succeeds with `npm run build`.
- Frontend Vitest execution in this environment is currently blocked by a sandbox startup error: `spawn EPERM`.
- Backend automated tests are not evidenced in the repo yet.
- Demo video and final submission artifacts are not evidenced in the repo yet.

## Team Members

- Nguyen Thanh Kien ([KindaRusty](https://github.com/KindaRusty))
- Bui Tien Hung ([THungB](https://github.com/THungB))
- Nguyen Huu Hieu ([huuhieu9925](https://github.com/huuhieu9925))
- Truong Nam Hung ([NamHung276](https://github.com/NamHung276))