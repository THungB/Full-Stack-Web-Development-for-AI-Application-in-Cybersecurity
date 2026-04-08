"""Generate compact AI labels with warning-friendly prefixes."""

import re

import httpx

from config import settings


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "You summarize spam-analysis evidence. "
    "Return one ultra-short phrase only (max 8 words), no punctuation at end, no markdown."
)

URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
WS_RE = re.compile(r"\s+")

PREFIX_BY_RESULT = {
    "spam": "WARNING",
    "needs_review": "ATTENSION",
    "ham": "SAFE",
}


def _compact_text(value: str, max_words: int = 8) -> str:
    text = URL_RE.sub("", value or "")
    text = WS_RE.sub(" ", text).strip()
    if not text:
        return "Unknown content"
    words = text.split(" ")
    return " ".join(words[:max_words]).strip()


def _format_warning_label(
    *,
    result: str | None,
    base_text: str,
    confidence: float,
) -> str:
    normalized_result = (result or "needs_review").strip().lower()
    prefix = PREFIX_BY_RESULT.get(normalized_result, "ATTENSION")
    short_text = _compact_text(base_text, max_words=8)
    if short_text.lower() == "Unknown content":
        short_text = f"confidence {confidence:.2f}"
    return f"{prefix}: {short_text}"[:120]


async def get_ai_label(
    message: str,
    confidence: float,
    result: str | None = None,
    *,
    force: bool = False,
) -> str | None:
    """Return compact AI label with warning prefix."""
    if not settings.ai_label_enabled:
        return _format_warning_label(result=result, base_text=message, confidence=confidence)
    if not force and confidence < settings.ai_label_min_confidence:
        return _format_warning_label(result=result, base_text=message, confidence=confidence)
    if not settings.openrouter_api_key:
        return _format_warning_label(result=result, base_text=message, confidence=confidence)

    prompt = f"Message: {(message or '')[:500]}"

    try:
        async with httpx.AsyncClient(timeout=settings.ai_label_timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "Tech Nova's Spam Detector",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openrouter_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 30,
                    "temperature": 0.1,
                },
            )
            response.raise_for_status()
            data = response.json()
            label = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
            base_text = label if label else message
            return _format_warning_label(
                result=result,
                base_text=base_text,
                confidence=confidence,
            )
    except Exception:
        return _format_warning_label(result=result, base_text=message, confidence=confidence)
