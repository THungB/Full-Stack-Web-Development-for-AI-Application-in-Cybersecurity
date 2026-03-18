import os

import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters


FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8000/scan")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return

    text = update.message.text
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

        label = str(data["result"]).upper()
        confidence = round(float(data["confidence"]) * 100, 1)
        keywords = ", ".join(data.get("keywords", [])) or "none"

        await update.message.reply_text(
            f"Result: {label}\nConfidence: {confidence}%\nKeywords: {keywords}"
        )
    except Exception as error:
        await update.message.reply_text(f"Error: {error}")


def main():
    if not BOT_TOKEN:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN before running the Telegram bot.")

    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.run_polling()


if __name__ == "__main__":
    main()
