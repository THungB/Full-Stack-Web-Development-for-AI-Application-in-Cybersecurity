"""Generate compact AI labels for suspicious spam messages via OpenRouter."""

import httpx

from config import settings


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are a spam analysis tool. "
    "Identify spam keywords or phrases in the given message. "
    "Reply in English with one short sentence under 100 characters. "
    "Format: 'Contains keywords: <word1>, <word2>' or "
    "'No clear spam keywords detected'. "
    "Do not explain and do not add extra text."
)


async def get_ai_label(
    message: str,
    confidence: float,
    *,
    force: bool = False,
) -> str | None:
    """Call OpenRouter and return a short AI label, or None when skipped/failed."""
    if not settings.ai_label_enabled:
        return None
    if not settings.openrouter_api_key:
        return None
    if not force and confidence < settings.ai_label_min_confidence:
        return None

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
                    "max_tokens": 60,
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
            return label[:200] if label else None
    except Exception:
        return None
