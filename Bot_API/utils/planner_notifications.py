# Уведомления о событиях календаря: напоминания и планы с дедлайном.
# Рассылка в 10:00 МСК о тех, кому осталось менее 2 дней до истечения.

import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

MSK = ZoneInfo("Europe/Moscow")

from motor.motor_asyncio import AsyncIOMotorDatabase
from aiogram import Bot

from configs.config import USERS_COLLECTION, PLANNER_EXPIRE_DAYS

logger = logging.getLogger(__name__)

PLANS_COLLECTION = "plans"
REMINDERS_COLLECTION = "reminders"


def _now_msk() -> datetime:
    return datetime.now(MSK)


def _expiry_range_msk(hour_msk: int) -> tuple[datetime, datetime]:
    """Диапазон «сейчас»–«сейчас + PLANNER_EXPIRE_DAYS дней» в МСК (для 10:00)."""
    now = _now_msk()
    # Считаем «сейчас» как сегодня hour_msk:00 в МСК
    today_start = now.replace(hour=hour_msk, minute=0, second=0, microsecond=0)
    if now.hour < hour_msk:
        today_start -= timedelta(days=1)
    end = today_start + timedelta(days=PLANNER_EXPIRE_DAYS)
    return today_start, end


def _format_date(d) -> str:
    if not d:
        return "—"
    # MongoDB возвращает naive UTC; показываем в МСК
    if hasattr(d, "tzinfo") and d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc).astimezone(MSK)
    return d.strftime("%d.%m.%Y %H:%M")


def _format_message(reminders: list, plans: list) -> str:
    lines = ["📅 <b>Календарь: до истечения менее 2 дней</b>\n"]
    if reminders:
        lines.append("🔔 <b>Напоминания:</b>")
        for r in reminders:
            date_str = _format_date(r.get("date"))
            amount = r.get("amount", 0)
            currency = r.get("currency", "USD")
            desc = (r.get("description") or "").strip() or "—"
            lines.append(f"  • {date_str} — {amount} {currency} ({desc})")
        lines.append("")
    if plans:
        lines.append("📋 <b>Планы (дедлайн):</b>")
        for p in plans:
            deadline_str = _format_date(p.get("deadline"))
            name = (p.get("name") or "").strip() or "—"
            amount = p.get("amount", 0)
            lines.append(f"  • {deadline_str} — {name} ({amount})")
        lines.append("")
    if not reminders and not plans:
        return ""
    lines.append("Откройте Finn, чтобы посмотреть детали.")
    return "\n".join(lines).strip()


async def get_events_expiring_soon(db: AsyncIOMotorDatabase, hour_msk: int) -> dict:
    """
    События (напоминания и планы с дедлайном), у которых дата/дедлайн
    в диапазоне [сейчас, сейчас + PLANNER_EXPIRE_DAYS] по МСК.
    Возвращает: { "user_id_hex": { "telegram_id": str, "reminders": [...], "plans": [...] } }
    """
    start_msk, end_msk = _expiry_range_msk(hour_msk)
    # MongoDB хранит даты в UTC (naive)
    start_utc = start_msk.astimezone(timezone.utc).replace(tzinfo=None)
    end_utc = end_msk.astimezone(timezone.utc).replace(tzinfo=None)

    reminders_cursor = db[REMINDERS_COLLECTION].find({
        "date": {"$gte": start_utc, "$lte": end_utc},
    })
    plans_cursor = db[PLANS_COLLECTION].find({
        "deadline": {"$gte": start_utc, "$lte": end_utc},
        "$or": [{"completedAt": {"$exists": False}}, {"completedAt": None}],
    })

    reminders = await reminders_cursor.to_list(length=None)
    plans = await plans_cursor.to_list(length=None)

    user_ids = set()
    for r in reminders:
        uid = r.get("userId")
        if uid:
            user_ids.add(uid)
    for p in plans:
        uid = p.get("userId")
        if uid:
            user_ids.add(uid)

    if not user_ids:
        return {}

    users_cursor = db[USERS_COLLECTION].find({"_id": {"$in": list(user_ids)}})
    users = await users_cursor.to_list(length=None)
    user_id_to_telegram = {str(u["_id"]): u.get("telegramID") for u in users if u.get("telegramID")}

    result = {}
    for uid in user_ids:
        uid_str = str(uid) if hasattr(uid, "__str__") else uid
        telegram_id = user_id_to_telegram.get(uid_str)
        if not telegram_id:
            continue
        user_reminders = [r for r in reminders if r.get("userId") == uid]
        user_plans = [p for p in plans if p.get("userId") == uid]
        if user_reminders or user_plans:
            result[uid_str] = {
                "telegram_id": telegram_id,
                "reminders": user_reminders,
                "plans": user_plans,
            }
    return result


async def send_planner_notifications(bot: Bot, db: AsyncIOMotorDatabase, hour_msk: int) -> None:
    """Отправить каждому пользователю уведомление о событиях с истечением < 2 дней."""
    try:
        data = await get_events_expiring_soon(db, hour_msk)
        for uid_str, payload in data.items():
            telegram_id = payload["telegram_id"]
            reminders = payload["reminders"]
            plans = payload["plans"]
            text = _format_message(reminders, plans)
            if not text:
                continue
            try:
                await bot.send_message(
                    chat_id=int(telegram_id),
                    text=text,
                    parse_mode="HTML",
                )
                logger.info("Planner notification sent to %s", telegram_id)
            except Exception as e:
                logger.warning("Failed to send planner notification to %s: %s", telegram_id, e)
    except Exception as e:
        logger.exception("Planner notifications error: %s", e)
