from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from configs.config import MINIAPP_URL

# Основная клавиатура с кнопкой входа в MiniApp
def get_webapp_keyboard(is_admin: bool = False) -> InlineKeyboardMarkup:
    """Создает клавиатуру с кнопкой приложения"""
    keyboard = []
    if MINIAPP_URL and isinstance(MINIAPP_URL, str) and MINIAPP_URL.strip():
        keyboard.append([
            InlineKeyboardButton(
                text="📱 Открыть Finn",
                web_app=WebAppInfo(url=MINIAPP_URL.strip())
            )
        ])
    keyboard.append([
        InlineKeyboardButton(
            text="💬 Поддержка",
            url="https://t.me/kirbudilovfbc"
        )
    ])
    
    # Добавляем кнопку админ-панели только для админов
    if is_admin:
        keyboard.append([
            InlineKeyboardButton(
                text="👑 Панель администратора",
                callback_data="admin_panel"
            )
        ])
    
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

def get_admin_keyboard() -> InlineKeyboardMarkup:
    """Создает клавиатуру для админ-панели"""
    keyboard = [
        [
            InlineKeyboardButton(
                text="➕ ДОБАВИТЬ АДМИНА",
                callback_data="add_admin"
            )
        ],
        [
            InlineKeyboardButton(
                text="➖ УДАЛИТЬ АДМИНА",
                callback_data="remove_admin"
            )
        ],
        [
            InlineKeyboardButton(
                text="📋 Менеджер подписок",
                callback_data="subscription_manager"
            )
        ],
        [
            InlineKeyboardButton(
                text="🎥 ИЗМЕНИТЬ ВСТУПИТЕЛЬНОЕ ВИДЕО",
                callback_data="change_welcome_video"
            )
        ],
        [
            InlineKeyboardButton(
                text="◀️ НАЗАД",
                callback_data="back_to_menu"
            )
        ]
    ]
    
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


# Ограничение длины текста кнопки (Telegram лимит callback_data 64 байта, текст кнопки — разумный лимит)
def _short_label(telegram_id: str, username: str, max_len: int = 35) -> str:
    uname = f"@{username}" if username and username != "—" else ""
    s = f"{telegram_id} {uname}".strip() or telegram_id
    return (s[: max_len - 3] + "…") if len(s) > max_len else s


def get_user_list_keyboard(
    items: list,
    page: int,
    total_pages: int,
) -> InlineKeyboardMarkup:
    """Клавиатура: юзеры как кнопки (клик → начислить/снять подписку) + пагинация."""
    keyboard = []
    for u in items:
        user_id = u.get("user_id") or ""
        telegram_id = u.get("telegram_id") or ""
        username = u.get("username") or "—"
        label = _short_label(telegram_id, username)
        keyboard.append([
            InlineKeyboardButton(
                text=f"👤 {label}",
                callback_data=f"sub_sel_{user_id}",
            )
        ])
    row = []
    if page > 0:
        row.append(InlineKeyboardButton(text="◀️ Назад", callback_data=f"user_search_p_{page - 1}"))
    if total_pages > 1 and page < total_pages - 1:
        row.append(InlineKeyboardButton(text="Вперёд ▶️", callback_data=f"user_search_p_{page + 1}"))
    if row:
        keyboard.append(row)
    keyboard.append([
        InlineKeyboardButton(text="🔍 Поиск", callback_data="user_search_start"),
        InlineKeyboardButton(text="📋 Обновить", callback_data="subscription_manager"),
    ])
    keyboard.append([InlineKeyboardButton(text="◀️ В админку", callback_data="back_to_admin")])
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_subscription_actions_keyboard(user_id: str) -> InlineKeyboardMarkup:
    """Клавиатура после клика по юзеру: начислить или снять подписку."""
    keyboard = [
        [
            InlineKeyboardButton(text="➕ Начислить finn", callback_data=f"sub_grant_{user_id}_finn"),
            InlineKeyboardButton(text="➕ finn_plus", callback_data=f"sub_grant_{user_id}_finn_plus"),
        ],
        [InlineKeyboardButton(text="➖ Снять подписку", callback_data=f"sub_revoke_{user_id}")],
        [InlineKeyboardButton(text="◀️ К списку", callback_data="subscription_manager")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_user_search_pagination_keyboard(
    page: int,
    total_pages: int,
    has_query: bool,
) -> InlineKeyboardMarkup:
    """Пагинация без кнопок юзеров (для обратной совместимости)."""
    return get_user_list_keyboard([], page, total_pages)

def get_admins_list_keyboard(admins: list) -> InlineKeyboardMarkup:
    """Создает клавиатуру со списком админов для удаления"""
    keyboard = []
    
    for admin in admins:
        keyboard.append([
            InlineKeyboardButton(
                text=f"❌ УДАЛИТЬ АДМИНА {admin['telegramID']}",
                callback_data=f"delete_admin_{admin['telegramID']}"
            )
        ])
    
    keyboard.append([
        InlineKeyboardButton(
            text="◀️ НАЗАД",
            callback_data="admin_panel"
        )
    ])
    
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

def get_back_keyboard() -> InlineKeyboardMarkup:
    """Создает клавиатуру с кнопкой возврата"""
    keyboard = [
        [
            InlineKeyboardButton(
                text="◀️ НАЗАД",
                callback_data="admin_panel"
            )
        ]
    ]
    
    return InlineKeyboardMarkup(inline_keyboard=keyboard)

