import datetime
from pathlib import Path

try:
    import joblib
except ImportError:
    joblib = None

try:
    import pandas as pd
except ImportError:
    pd = None

BASE_DIR = Path(__file__).resolve().parent.parent

# Use the correct path to the model file
MODEL_PATH = BASE_DIR / "ml" / "spam_pipeline_with_metadata.pkl"

def _load_model():
    if not MODEL_PATH.exists() or joblib is None:
        return None
    return joblib.load(MODEL_PATH)

MODEL = _load_model()

SPAM_KEYWORDS = {
    "urgent", "winner", "claim", "limited", "offer", "free", "bonus", "prize",
    "click", "verify", "bank", "password", "otp", "gift", "discount",
    "bitcoin", "crypto", "loan", "refund", "act now", "congratulations",
}

def preprocess(text: str) -> str:
    return " ".join(text.lower().split())

def extract_keywords(text: str) -> list[str]:
    normalized = preprocess(text)
    matches = [keyword for keyword in SPAM_KEYWORDS if keyword in normalized]
    return sorted(set(matches))

def predict(text: str):
    if MODEL is None:
        raise RuntimeError("Model file spam_pipeline_with_metadata.pkl not found or joblib not installed.")

    if pd is None:
        raise RuntimeError("Pandas is required to construct metadata features for this pipeline.")

    normalized = preprocess(text)
    keywords = extract_keywords(normalized)

    # Get 6 features that the pipeline requires
    text_length = len(text)
    word_count = len(text.split())
    special_char_count = sum(not c.isalnum() and not c.isspace() for c in text)
    
    now = datetime.datetime.now()
    hour = now.hour
    is_weekend = int(now.weekday() >= 5)

    features_df = pd.DataFrame([{
        'cleaned_text': normalized,
        'text_length': text_length,
        'word_count': word_count,
        'special_char_count': special_char_count,
        'hour': hour,
        'is_weekend': is_weekend
    }])

    # Predict through Pipeline
    if hasattr(MODEL, "predict_proba"):
        probabilities = MODEL.predict_proba(features_df)[0]
        spam_confidence = float(probabilities[1])
    else:
        prediction = MODEL.predict(features_df)[0]
        spam_confidence = 0.85 if str(prediction).lower() == "spam" else 0.15

    if spam_confidence >= 0.60:
        result = "spam"
    elif spam_confidence >= 0.41:
        result = "needs_review"
    else:
        result = "ham"
    return result, spam_confidence, keywords
