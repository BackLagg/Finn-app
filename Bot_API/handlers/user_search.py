# Поиск по тем же таблицам, что и бэкенд: User -> users, UserProfile -> userprofiles.
# users: _id, telegramID; userprofiles: userId (ref users._id), username, name.

import re
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

USERS_PER_PAGE = 6


def _regex_escape(s: str) -> str:
    """Экранирует спецсимволы для безопасного использования в $regex."""
    return re.escape(s)


async def search_users(
    db: AsyncIOMotorDatabase,
    query: str,
    page: int = 0,
    users_collection: str = "users",
    userprofiles_collection: str = "userprofiles",
) -> dict:
    """
    Поиск по частичному совпадению: ID (telegramID), username, name.
    Например "8" найдёт ID 12345678, 8000 и т.д.
    """
    query = (query or "").strip()

    # Поиск по совпадению (подстрока), не только по началу
    match_stage = None
    if query:
        safe = _regex_escape(query)
        match_stage = {
            "$or": [
                {"telegramID": {"$regex": safe, "$options": "i"}},
                {"profile.username": {"$regex": safe, "$options": "i"}},
                {"profile.name": {"$regex": safe, "$options": "i"}},
            ]
        }

    pipeline = [
        {"$lookup": {
            "from": userprofiles_collection,
            "localField": "_id",
            "foreignField": "userId",
            "as": "profile_arr",
        }},
        {"$addFields": {
            "profile": {"$arrayElemAt": ["$profile_arr", 0]},
        }},
        {"$project": {"profile_arr": 0}},
    ]
    if match_stage is not None:
        pipeline.append({"$match": match_stage})

    # Считаем всего для пагинации
    count_pipeline = pipeline + [{"$count": "total"}]
    cursor_count = db[users_collection].aggregate(count_pipeline)
    count_result = await cursor_count.to_list(length=1)
    total = count_result[0]["total"] if count_result else 0
    total_pages = max(1, (total + USERS_PER_PAGE - 1) // USERS_PER_PAGE) if total else 1
    current_page = max(0, min(page, total_pages - 1))

    # Выборка страницы
    pipeline.extend([
        {"$sort": {"telegramID": 1}},
        {"$skip": current_page * USERS_PER_PAGE},
        {"$limit": USERS_PER_PAGE},
    ])

    cursor = db[users_collection].aggregate(pipeline)
    raw_items = await cursor.to_list(length=USERS_PER_PAGE + 1)

    items = []
    for u in raw_items:
        profile = u.get("profile") or {}
        username = (profile.get("username") or "").strip()
        name = (profile.get("name") or "").strip()
        items.append({
            "user_id": str(u["_id"]),
            "telegram_id": u.get("telegramID") or "",
            "username": username or "—",
            "name": name or "—",
        })

    return {
        "items": items,
        "total": total,
        "total_pages": total_pages,
        "page": current_page,
    }


def format_user_list_message(
    items: list,
    total: int,
    page: int,
    total_pages: int,
    query: Optional[str] = None,
) -> str:
    """Текст сообщения: только заголовок и пагинация. Юзеры — только кнопками."""
    lines = ["👤 <b>Результаты поиска</b>"]
    if query:
        lines.append(f"🔍 Запрос: <code>{query}</code>")
    lines.append(f"📄 Страница {page + 1} из {total_pages} (всего: {total})")
    return "\n".join(lines)
