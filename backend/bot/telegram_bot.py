"""Telegram bot runtime that forwards messages to the spam API.

Responsibilities:
1) Listen to group messages and pre-filter short/ignored inputs.
2) Send scan requests to FastAPI with Telegram metadata.
3) Apply strike-based warning and mute policy using backend settings.
"""

import os

import requests
from telegram import Update, ChatPermissions
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters
import datetime

FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8000/scan")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
MIN_MESSAGE_LENGTH = 10


def classify_advice(result: str, confidence: float):
    """Map model output to a human-readable risk label and action advice."""
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
    """Main telegram message handler used by python-telegram-bot."""
    if not update.message or not update.message.text:
        return

    text = update.message.text.strip()
    if len(text) < MIN_MESSAGE_LENGTH:
        return
    username = update.effective_user.username
    if username:
        user_tag = f"@{username}"
    else:
        username = update.effective_user.first_name
        user_tag = username
    
    # Extract platform IDs once so scan requests and enforcement reuse the same values.
    user_id = str(update.effective_user.id) if update.effective_user else None
    chat_id = str(update.effective_chat.id) if update.effective_chat else None

    # Admin immunity: never moderate creator/admin messages in group chats.
    if update.message.chat.type in ["group", "supergroup"]:
        try:
            member = await context.bot.get_chat_member(chat_id, user_id)
            if member.status in ["creator", "administrator"]:
                return
        except Exception:
            pass
    try:
        response = requests.post(
            FASTAPI_URL,
            json={
                "message": text,
                "source": "telegram",
                "username": username,
                "user_id": user_id,  # 2. Add them to the payload
                "chat_id": chat_id,
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
            
            # Defaults 
            max_strikes = 3
            ban_duration_hours = 0
            spam_decay_hours = 0
            current_strikes = 1
            is_group = update.message.chat.type in ["group", "supergroup"]
            is_bot_admin = False

            try:
                # 2. Load Real Settings
                settings_res = requests.get(FASTAPI_URL.replace("/scan", "/telegram/settings")).json()
                max_strikes = settings_res.get("max_strikes", 3)
                ban_duration_hours = settings_res.get("ban_duration_hours", 0)
                spam_decay_hours = settings_res.get("spam_decay_hours", 0)
                strikes_res = requests.get(FASTAPI_URL.replace("/scan", f"/telegram/strikes/{user_id}")).json()
                current_strikes = strikes_res.get("strikes", 1)

                # 3. Check the Bot's Admin Rights
                if is_group:
                    try:
                        bot_member = await context.bot.get_chat_member(chat_id, context.bot.id)
                        is_bot_admin = bot_member.status in ["administrator", "creator"]
                    except Exception:
                        pass

                # 4. Handle users who crossed the max threshold
                if current_strikes >= max_strikes and is_group:
                    ban_time = None if ban_duration_hours == 0 else (datetime.datetime.now() + datetime.timedelta(hours=ban_duration_hours))
                    time_text = "FOREVER" if ban_duration_hours == 0 else f"for {ban_duration_hours} hours"
                    ban_msg = f"{user_tag} **MUTED** \nUser has been locked from sending messages {time_text} for reaching {max_strikes} spam messages."
                    
                    if is_bot_admin:
                        await context.bot.restrict_chat_member(
                            chat_id=chat_id, 
                            user_id=user_id, 
                            permissions=ChatPermissions(can_send_messages=False),
                            until_date=ban_time
                        )
                        await update.message.reply_text(text=ban_msg)
                    
                    try:
                        await context.bot.send_message(chat_id=user_id, text=f"Group Violation: {ban_msg}")
                    except Exception:
                        pass
                    return

            except Exception as e:
                print(f"Bouncer auto-ban logic failed: {e}")
            
            # 5. Determine the mathematical decay text
            decay_text = "Never" if spam_decay_hours == 0 else f"{spam_decay_hours} Hours"

            # 6. Compose the Warning Document
            warning_msg = (
                f"{user_tag} **Spam Alert** ({current_strikes} of {max_strikes} Spam Messages) \n"
                f"Result: {final_label} | Risk: {risk_level}\n"
                f"Keywords: {keywords}\n"
                f"*(You will be muted if you reach {max_strikes} spam messages)*\n"
               # f"Your counting reset in: {decay_text}" # This is only use for testing
            )
            
            # 7. Deliver payloads based on Admin constraints
            if is_group and is_bot_admin:
                try:
                    await update.message.reply_text(text=warning_msg)
                except Exception as e:
                    print(f"Could not send group warning: {e}")
            
            try:
                await context.bot.send_message(chat_id=user_id, text=f"Group Warning: {warning_msg}")
            except Exception:
                pass
                
    except Exception as error:
        print(f"Error processing message: {error}")

def main():
    """Bot entrypoint for local execution."""
    if not BOT_TOKEN:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN before running the Telegram bot.")

    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.run_polling()


if __name__ == "__main__":
    main()
