import math
import os
import pickle
from pathlib import Path

try:
    import joblib
except ImportError:  # pragma: no cover
    joblib = None


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_CANDIDATES = []
if os.getenv("SPAM_MODEL_PATH"):
    MODEL_CANDIDATES.append(Path(os.getenv("SPAM_MODEL_PATH", "")))
MODEL_CANDIDATES.extend(
    [
        BASE_DIR / "ml" / "spam_classifier.pkl",
        BASE_DIR / "ml" / "spam_classifier.joblib",
        BASE_DIR / "spam_classifier.pkl",
        BASE_DIR.parent / "spam_classifier.pkl",
    ]
)

SPAM_KEYWORDS = {
    "urgent",
    "winner",
    "claim",
    "limited",
    "offer",
    "free",
    "bonus",
    "prize",
    "click",
    "verify",
    "bank",
    "password",
    "otp",
    "gift",
    "discount",
    "bitcoin",
    "crypto",
    "loan",
    "refund",
    "act now",
    "congratulations",
}


def _load_model():
    for path in MODEL_CANDIDATES:
        if not path or not path.exists():
            continue

        if path.suffix == ".pkl":
            with path.open("rb") as file:
                return pickle.load(file)

        if path.suffix == ".joblib" and joblib is not None:
            return joblib.load(path)

    return None


MODEL = _load_model()


def preprocess(text: str) -> str:
    return " ".join(text.lower().split())


def extract_keywords(text: str) -> list[str]:
    normalized = preprocess(text)
    matches = [keyword for keyword in SPAM_KEYWORDS if keyword in normalized]
    return sorted(set(matches))


def _sigmoid(value: float) -> float:
    if value >= 0:
        z = math.exp(-value)
        return 1 / (1 + z)
    z = math.exp(value)
    return z / (1 + z)


def _fallback_predict(text: str):
    normalized = preprocess(text)
    keywords = extract_keywords(normalized)
    score = 0.12

    if "http://" in normalized or "https://" in normalized:
        score += 0.18
    if any(char.isdigit() for char in normalized):
        score += 0.08
    if normalized.count("!") >= 2:
        score += 0.06
    if len(normalized) > 140:
        score += 0.04

    score += min(len(keywords) * 0.16, 0.56)
    confidence = min(max(score, 0.05), 0.99)
    result = "spam" if confidence >= 0.5 else "ham"
    return result, confidence, keywords


def predict(text: str):
    if MODEL is None:
        return _fallback_predict(text)

    normalized = preprocess(text)
    keywords = extract_keywords(normalized)

    try:
        if hasattr(MODEL, "predict_proba"):
            probabilities = MODEL.predict_proba([normalized])[0]
            spam_confidence = float(probabilities[1])
        elif hasattr(MODEL, "decision_function"):
            score = float(MODEL.decision_function([normalized])[0])
            spam_confidence = _sigmoid(score)
        else:
            prediction = MODEL.predict([normalized])[0]
            spam_confidence = 0.85 if str(prediction).lower() == "spam" else 0.15

        result = "spam" if spam_confidence >= 0.5 else "ham"
        return result, spam_confidence, keywords
    except Exception:
        return _fallback_predict(text)
