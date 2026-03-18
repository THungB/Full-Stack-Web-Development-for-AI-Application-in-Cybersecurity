# Backend

FastAPI backend for the spam detection system.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Model file

If you already have a trained model from Assignment 2, place it in one of these locations:

- `backend/ml/spam_classifier.pkl`
- `backend/spam_classifier.pkl`

The server will load it automatically at startup. If no model file is found, the API still runs using a keyword-based fallback predictor so the frontend can be tested end-to-end.

## OCR note

Install the Tesseract engine on your machine separately, then keep `pytesseract` in Python dependencies:

- Windows: install Tesseract OCR and add it to `PATH`
- macOS: `brew install tesseract`
- Linux: `sudo apt install tesseract-ocr`
