# TechNova - Telegram Auto-Moderator Bot

This module provides an interactive Telegram Bot that automatically monitors group chats, queries the Machine Learning API for spam classification, and enforces an autonomous Auto-Strike Banning system.

## How It Works

1. **Message Interception**: The bot silently reads all text messages in the attached Telegram Group.
2. **ML Scanning**: It extracts the message and sends it securely to our FastAPI backend (`POST /scan`).
3. **Strike System**: If the ML model classifies the text as `SPAM`, the backend logs a strike against the user's hidden Telegram `user_id` inside our SQLite database.
4. **Enforcement**:
   - **Warning**: If the user is below the maximum strike limit, the bot replies to them directly with a public warning outlining their risk level and current strike count.
   - **Mute / Restrict**: If the user hits the maximum limit (configurable in the React Dashboard), the bot physically executes a `restrictChatMember` command to the Telegram servers. This securely locks their keyboard, preventing them from sending any texts, media, or links in the group until their penalty timer expires (or forever). The React Dashboard also contains a "Pardon" button to instantly restore a muted user's typing permissions.

## Setup Instructions for Team Members

If a team member wants to run this on their own machine, they can easily do so by following these steps:

### 1. Configure the Environment

You must have your own Telegram Bot Token (obtained from [@BotFather](https://t.me/BotFather) on Telegram).
Set it as an environment variable or place it in the `.env` file at the root of the project:

```env
TELEGRAM_BOT_TOKEN="your_bot_token_here"
FASTAPI_URL="http://localhost:8000/scan"
```

### 2. Run the Systems

The bot requires the FastAPI backend to function. Open two separate terminals:

```bash
# Terminal 1: Start the Backend and Database
uvicorn main:app --reload

# Terminal 2: Start the Telegram Bot
python backend/bot/telegram_bot.py
```

### 3. Grant Bot Permissions

If the bot is placed in a group chat, it **MUST** be promoted to an Administrator.

- Go to Group Info -> Edit -> Administrators
- Add your bot.
- Ensure the **"Mute Users"** privilege is enabled.
  _(Note: If the bot is not an admin, it will catch spam, but it will physically fail to kick spammers!)_

### 4. Admin Immunity

Group Creators and Administrators are completely immune to the bot. The bot will automatically ignore their messages and will not log strikes against them in the database for testing purposes.

## Database Integration

The bot acts as a lightweight client that relies entirely on the central **FastAPI API & SQLite Database**.

- **`scans` table**: Stores the message text, ML confidence score, `user_id`, and `chat_id`. This table acts as the historical ledger to count how many "Spam" strikes a user has.
- **`system_settings` table**: Stores the dynamic configuration variables like `max_strikes` and `ban_duration_hours`. When the React UI updates these values, the Bot instantly adapts its enforcement logic on the very next message!
