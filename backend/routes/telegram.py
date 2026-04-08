import requests
import os

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database.database import get_db
from database.schema import Scan, SystemSettings
from routes.common import serialize_scan

router = APIRouter()

TELEGRAM_SOURCE = "telegram"


@router.get("/telegram/messages")
async def get_telegram_messages(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    filter: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated scan records that came from the Telegram bot."""
    base_stmt = select(Scan).where(Scan.source == TELEGRAM_SOURCE)
    count_stmt = select(func.count(Scan.id)).where(Scan.source == TELEGRAM_SOURCE)

    if filter:
        normalized = filter.strip().lower()
        if normalized in {"spam", "ham"}:
            base_stmt = base_stmt.where(Scan.result == normalized)
            count_stmt = count_stmt.where(Scan.result == normalized)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    records_result = await db.execute(
        base_stmt.order_by(Scan.timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    records = records_result.scalars().all()

    return {
        "data": [serialize_scan(record) for record in records],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.delete("/telegram/messages/{record_id}")
async def delete_telegram_message(record_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a single Telegram scan record by ID."""
    result = await db.execute(
        select(Scan).where(Scan.id == record_id, Scan.source == TELEGRAM_SOURCE)
    )
    record = result.scalar_one_or_none()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Telegram record not found.",
        )

    await db.delete(record)
    await db.commit()
    return {"success": True, "deleted_id": record_id}

class SettingsUpdate(BaseModel):
    max_strikes: int
    ban_duration_hours: int

@router.get("/telegram/settings")
async def get_bot_settings(db: AsyncSession = Depends(get_db)):
    """Fetch the Auto-Bouncer configuration."""
    records = (await db.execute(select(SystemSettings))).scalars().all()
    settings_dict = {r.setting_key: r.setting_value for r in records}
    
    return {
        "max_strikes": int(settings_dict.get("max_strikes", 3)),
        "ban_duration_hours": int(settings_dict.get("ban_duration_hours", 0)) # 0 = Forever
    }
@router.put("/telegram/settings")
async def update_bot_settings(payload: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    """Update the Auto-Bouncer configuration."""
    for key, val in [("max_strikes", payload.max_strikes), ("ban_duration_hours", payload.ban_duration_hours)]:
        record = (await db.execute(select(SystemSettings).where(SystemSettings.setting_key == key))).scalar_one_or_none()
        if record:
            record.setting_value = str(val)
        else:
            db.add(SystemSettings(setting_key=key, setting_value=str(val)))
            
    await db.commit()
    return {"success": True}
@router.get("/telegram/spammers")
async def get_top_spammers(db: AsyncSession = Depends(get_db)):
    """Analyze the database and return users with the highest spam counts."""
    # Group by User ID and Chat ID, counting only "spam" results
    stmt = (
        select(
            Scan.username,
            Scan.user_id,
            Scan.chat_id,
            func.count(Scan.id).label("spam_count")
        )
        .where(Scan.source == "telegram", Scan.result == "spam", Scan.user_id != None)
        .group_by(Scan.username, Scan.user_id, Scan.chat_id)
        .order_by(func.count(Scan.id).desc())
        .limit(10)
    )
    
    result = await db.execute(stmt)
    spammers = []
    for row in result.all():
        spammers.append({
            "username": row.username or "Unknown",
            "user_id": row.user_id,
            "chat_id": row.chat_id,
            "spam_count": row.spam_count
        })
        
    return {"data": spammers}

@router.get("/telegram/strikes/{user_id}")
async def get_user_strikes(user_id: str, db: AsyncSession = Depends(get_db)):
    """Count how many spam strikes a specific user has in the database."""
    count = await db.scalar(
        select(func.count(Scan.id))
        .where(Scan.user_id == user_id, Scan.result == "spam")
    )
    return {"strikes": count or 1}

@router.post("/telegram/ban")
async def manual_group_ban(payload: dict):
    """Hits the Telegram API to manually ban a user from a group."""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = payload.get("chat_id")
    user_id = payload.get("user_id")
    
    url = f"https://api.telegram.org/bot{bot_token}/banChatMember"
    response = requests.post(url, json={"chat_id": chat_id, "user_id": user_id})
    return response.json()

@router.post("/telegram/unban")
async def manual_group_unban(payload: dict, db: AsyncSession = Depends(get_db)):
    """Unbans a user on Telegram and resets their spam strike count to zero!"""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = payload.get("chat_id")
    user_id = str(payload.get("user_id"))

    # 1. Physically un-mute them on Telegram's side (restore typing)
    url = f"https://api.telegram.org/bot{bot_token}/restrictChatMember"
    requests.post(url, json={
        "chat_id": chat_id, 
        "user_id": user_id, 
        "permissions": {
            "can_send_messages": True,
            "can_send_audios": True,
            "can_send_documents": True,
            "can_send_photos": True,
            "can_send_videos": True,
            "can_send_video_notes": True,
            "can_send_voice_notes": True,
            "can_send_polls": True,
            "can_send_other_messages": True,
            "can_add_web_page_previews": True
        }
    })

    # 2. Reset Strikes by permanently wiping their spam history for this chat
    await db.execute(
        delete(Scan)
        .where(Scan.source == "telegram")
        .where(Scan.user_id == user_id)
        .where(Scan.chat_id == str(chat_id))
    )
    await db.commit()

    return {"success": True, "message": "User unbanned and strikes reset to 0."}
