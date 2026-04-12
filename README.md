# Full-Stack Web Development for AI Application in Cybersecurity

[English](README.md) | [Tiếng Việt](README_vi.md)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Python](https://img.shields.io/badge/Python-14354C?style=for-the-badge&logo=python&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](#)
[![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)](#)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](#)

> A comprehensive full-stack spam detection platform integrating an OCR scanner, Telegram bot, browser extension, and analytics dashboard.

---

## Disclaimer

- **Educational Purpose:** This project was developed solely for academic purposes as part of the COS30049 coursework at Swinburne University of Technology.
- **AI Accuracy:** The spam classification relies on experimental machine learning models and third-party AI APIs (OpenRouter). Results may contain inaccuracies or false positives. Please do not rely entirely on this application for critical security decisions.
- **Data Privacy:** As this is an educational prototype (may get updated in future for other purposes), users are strongly advised **not** to scan or upload highly sensitive, personal, or confidential information.
- **No Warranty:** This software is provided "as is" and without any guarantees or warranties of any kind.

---

## Features

- **Omni-channel Input:** Scan text from the website, OCR extraction, Telegram bot, or browser extension.
- **AI-Powered Detection:** Classifies messages as Spam or Ham with confidence scoring and fallback support.
- **Analytics Dashboard:** Visualize scan history and traffic with interactive charts.
- **Batch Evaluation:** Test and evaluate AI models using CSV dataset batch uploads.

---

## Project Modules

| Module               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `frontend/`          | React dashboard for overview, scanning, and history. |
| `backend/`           | FastAPI, ML prediction, OCR handling, and SQLite.    |
| `backend/bot/`       | Telegram bot that forwards chats to the backend.     |
| `browser-extension/` | Extension for scanning highlighted text in browsers. |

---

## Quick Start

### 1. One-Click Start (Windows)

Easily launch both the frontend and backend using our shortcut scripts:

**PowerShell:**

```powershell
powershell -ExecutionPolicy Bypass -File .\run-project.ps1
```

**Command Prompt:**

```bat
run-project.bat
```

---

### 2. Manual Setup

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Telegram Bot

```bash
cd backend
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Mac/Linux
python bot/telegram_bot.py
```

---

## Environment Configuration

Create an `.env` file in your **backend** folder based on `.env_example`.

**`backend/.env`**

```env
# Required for API endpoints
FASTAPI_URL=http://localhost:8000/scan

# Required to run the Telegram Bot
TELEGRAM_BOT_TOKEN="YOUR_TOKEN_BOT"

# AI Model Configuration
OPENROUTER_API_KEY="YOUR_API_KEY"
OPENROUTER_MODEL="YOUR_AI_MODEL"

# Additional backend configuration
SPAM_MODEL_PATH=
APP_SEED_DEMO=true
DATABASE_URL=sqlite:///spam_detection.db
AI_LABEL_ENABLED=true
AI_LABEL_MIN_CONFIDENCE=0.60
AI_LABEL_TIMEOUT=5.0
```

If needed, set up your frontend `.env`:
**`frontend/.env`**

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Important Note

> - You **must** populate the `TELEGRAM_BOT_TOKEN` in your backend `.env` file for the bot module to run. You can acquire a token from [@BotFather](https://t.me/botfather) on Telegram.
> - You **must** populate `OPENROUTER_API_KEY` for the AI Label summarization to function properly.
> - Ensure you have the `Tesseract OCR` engine installed locally on your operating system for image scanning to work.
> - By design, the **Telegram Bot** automatically monitors and scans messages exclusively within Telegram Group Chats. You must set up the bot to join a group chat and promote it to admin to use the bot. For scanning direct 1-on-1 private messages, please use the **Browser Extension** highlight tool.

---

## Documentation & Resources

**Telegram Bot Setup Guide:**
To run the bot locally, you must create a Telegram bot and get an API token:

1. Open Telegram and search for the **@BotFather** bot.
2. Send the `/start` command, followed by `/newbot`.
3. Give your bot a display name and a unique username (ending in `bot`).
4. BotFather will generate an **HTTP API Token** (Example: `110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`).
5. Copy this token and paste it securely into your `backend/.env` file:

```env
TELEGRAM_BOT_TOKEN="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" # Put your real Bot Token here
```

**Documentation:**
For developers looking to contribute or understand the codebase, here are the official references:

- **[React.js](https://react.dev/learn):** Documentation for the frontend UI components and hooks.
- **[FastAPI](https://fastapi.tiangolo.com/):** Documentation for the asynchronous Python backend.
- **[Vite](https://vitejs.dev/guide/):** Documentation for our frontend build tool.
- **[Tesseract OCR](https://tesseract-ocr.github.io/):** Guide on installing the OCR engine for image scanning.

---

## Team Members

This project was built by:

- **Nguyen Thanh Kien** - [@KindaRusty](https://github.com/KindaRusty)
- **Bui Tien Hung** - [@THungB](https://github.com/THungB)
- **Nam Hung Truong** - [@NamHung276](https://github.com/NamHung276)
- **Nguyen Huu Hieu** - [@huuhieu9925](https://github.com/huuhieu9925)

---

## Acknowledgements

We would like to express our sincere gratitude to our tutors at **Swinburne University of Technology Da Nang**: **Mr. Dang Phuoc Nhat** and **Ms. Tran Ly Quynh**, for their invaluable guidance, feedback, and support throughout the development of this application.
