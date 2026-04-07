import os

import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters


FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8000/scan")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
MIN_MESSAGE_LENGTH = 10


def classify_advice(result: str, confidence: float):
    label = str(result or "").lower()
    score = float(confidence or 0)

    if 0.45 <= score <= 0.55:
        return ("UNCERTAIN", "Caution", "Model is near boundary, verify sender/link first.")
    if label == "spam" and score >= 0.8:
        return ("SPAM", "Risky", "Ignore this message and do not click unknown links.")
    if label == "spam" and score >= 0.55:
        return ("SPAM", "Caution", "Potential scam. Verify source before any action.")
    return ("HAM", "Safe", "Looks acceptable, but still verify unusual requests.")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return

    text = update.message.text.strip()
    if len(text) < MIN_MESSAGE_LENGTH:
        return
    username = update.effective_user.username if update.effective_user else None

    try:
        response = requests.post(
            FASTAPI_URL,
            json={
                "message": text,
                "source": "telegram",
                "username": username,
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        result = str(data.get("result", "ham"))
        confidence_raw = float(data.get("confidence", 0))
        confidence = round(confidence_raw * 100, 1)
        keywords = ", ".join(data.get("keywords", [])) or "none"
        final_label, risk_level, advice = classify_advice(result, confidence_raw)   
        if final_label in ["SPAM", "UNCERTAIN"]:
            warning_msg = (
                f"⚠️ **Spam Alert** ⚠️\n"
                f"We detected a suspicious message you sent.\n"
                f"Result: {final_label}\n"
                f"Confidence: {confidence}%\n"
                f"Risk: {risk_level}\n"
                f"Advice: {advice}\n"
                f"Keywords: {keywords}"
            )
            try:
                # Send DM to the user in the private bot chat
                await context.bot.send_message(chat_id=update.effective_user.id, text=warning_msg)
            except Exception as e:
                # This exception happens if the user hasn't started a direct chat with the bot yet.
                print(f"Could not send DM to user {update.effective_user.id}: {e}")
                
    except Exception as error:
        print(f"Error processing message: {error}")


def main():
    if not BOT_TOKEN:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN before running the Telegram bot.")

    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.run_polling()


if __name__ == "__main__":
    main()
