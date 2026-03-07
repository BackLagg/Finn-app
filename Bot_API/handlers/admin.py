from aiogram import Bot, Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.filters import StateFilter
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from configs.config import (
    MONGO_URI,
    DB_NAME,
    SUPERUSER_COLLECTION,
    USERS_COLLECTION,
    USERPROFILES_COLLECTION,
)
from keyboards.keyboards import (
    get_admin_keyboard,
    get_webapp_keyboard,
    get_admins_list_keyboard,
    get_user_list_keyboard,
    get_subscription_actions_keyboard,
)
from handlers.start import WELCOME_TEXT
from handlers.user_search import search_users, format_user_list_message

# Кэш для video_id
welcome_video_id_cache = None

# Коллекция для настроек бота
BOT_SETTINGS_COLLECTION = "bot_settings"

class AdminStates(StatesGroup):
    waiting_for_video = State()
    waiting_admin_id = State()
    waiting_user_search_query = State()

# Создаем роутер для админ-команд
admin_router = Router(name="admin_router")

# Инициализация подключения к MongoDB
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
superuser_collection = db[SUPERUSER_COLLECTION]
bot_settings_collection = db[BOT_SETTINGS_COLLECTION]

async def load_welcome_video_id():
    """Загружает video_id из БД и сохраняет в кэш"""
    global welcome_video_id_cache
    try:
        settings = await bot_settings_collection.find_one({"key": "welcome_video_id"})
        if settings:
            welcome_video_id_cache = settings.get("value")
            print(f"✅ Вступительное видео загружено из БД: {welcome_video_id_cache}")
        else:
            welcome_video_id_cache = None
            print("ℹ️ Вступительное видео не найдено в БД")
    except Exception as e:
        print(f"❌ Ошибка при загрузке video_id: {e}")
        welcome_video_id_cache = None

async def save_welcome_video_id(video_id: str):
    """Сохраняет video_id в БД и обновляет кэш"""
    global welcome_video_id_cache
    try:
        await bot_settings_collection.update_one(
            {"key": "welcome_video_id"},
            {"$set": {"key": "welcome_video_id", "value": video_id}},
            upsert=True
        )
        welcome_video_id_cache = video_id
        print(f"✅ Вступительное видео сохранено в БД и кэш обновлен: {video_id}")
    except Exception as e:
        print(f"❌ Ошибка при сохранении video_id: {e}")

@admin_router.callback_query(F.data == "admin_panel")
async def admin_panel_handler(callback: CallbackQuery, state: FSMContext):
    """Обработчик открытия админ-панели"""
    user_id = callback.from_user.id
    telegram_id = str(user_id)
    
    # Проверяем, является ли пользователь админом
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    
    if not is_superuser:
        await callback.answer("У вас нет прав администратора.", show_alert=True)
        return
    
    # Отправляем админ-панель
    await callback.message.edit_text(
        "Панель администратора",
        reply_markup=get_admin_keyboard()
    )

@admin_router.callback_query(F.data == "back_to_menu")
async def back_to_menu_handler(callback: CallbackQuery, state: FSMContext):
    """Обработчик возврата в главное меню"""
    await callback.message.edit_text(
        WELCOME_TEXT,
        parse_mode="HTML",
        reply_markup=get_webapp_keyboard(is_admin=True)
    )

@admin_router.callback_query(F.data == "add_admin")
async def add_admin_handler(callback: CallbackQuery, state: FSMContext):
    """Обработчик добавления админа"""
    await state.set_state(AdminStates.waiting_admin_id)
    # Сохраняем сообщение в состоянии
    await state.update_data(last_bot_message=callback.message)
    await callback.message.edit_text(
        "Отправьте Telegram ID пользователя, которого хотите сделать администратором.\n\n"
        "ID должен содержать только цифры.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ ОТМЕНА", callback_data="back_to_admin")]
        ])
    )

@admin_router.message(StateFilter(AdminStates.waiting_admin_id), F.text)
async def process_admin_id(message: Message, state: FSMContext):
    """Обработчик получения ID нового админа"""
    # Удаляем сообщение с ID в любом случае
    await message.delete()
    
    # Получаем последнее сообщение бота из состояния
    state_data = await state.get_data()
    last_bot_message = state_data.get('last_bot_message')
    
    # Проверяем, что сообщение содержит только цифры
    if not message.text.isdigit():
        await last_bot_message.edit_text(
            "❌ ID должен содержать только цифры. Попробуйте еще раз или нажмите 'Отмена'.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="◀️ ОТМЕНА", callback_data="back_to_admin")]
            ])
        )
        return
    
    new_admin_id = message.text
    
    # Проверяем, не является ли пользователь уже админом
    existing_admin = await superuser_collection.find_one({"telegramID": new_admin_id})
    if existing_admin:
        await last_bot_message.edit_text(
            f"❌ Пользователь {new_admin_id} уже является администратором.",
            reply_markup=get_admin_keyboard()
        )
        await state.clear()
        return
    
    # Добавляем нового админа
    await superuser_collection.update_one(
        {"telegramID": new_admin_id},
        {"$set": {"telegramID": new_admin_id}},
        upsert=True
    )
    
    await last_bot_message.edit_text(
        f"✅ Пользователь {new_admin_id} успешно добавлен как администратор.",
        reply_markup=get_admin_keyboard()
    )
    await state.clear()

@admin_router.callback_query(F.data == "remove_admin")
async def remove_admin_handler(callback: CallbackQuery, state: FSMContext):
    """Обработчик удаления админа"""
    # Получаем список всех админов
    admins = await superuser_collection.find().to_list(length=None)
    
    if not admins:
        await callback.answer("Список администраторов пуст", show_alert=True)
        return
    
    await callback.message.edit_text(
        "Выберите администратора для удаления:",
        reply_markup=get_admins_list_keyboard(admins)
    )

@admin_router.callback_query(F.data.startswith("delete_admin_"))
async def process_delete_admin(callback: CallbackQuery, state: FSMContext):
    """Обработчик удаления выбранного админа"""
    admin_id = callback.data.replace("delete_admin_", "")
    
    # Удаляем админа
    result = await superuser_collection.delete_one({"telegramID": admin_id})
    
    if result.deleted_count > 0:
        await callback.answer(f"Администратор {admin_id} удален", show_alert=True)
    else:
        await callback.answer(f"Администратор с ID {admin_id} не найден", show_alert=True)
    
    # Обновляем список админов
    admins = await superuser_collection.find().to_list(length=None)
    
    if not admins:
        await callback.message.edit_text(
            "Список администраторов пуст",
            reply_markup=get_admin_keyboard()
        )
    else:
        await callback.message.edit_text(
            "Выберите администратора для удаления:",
            reply_markup=get_admins_list_keyboard(admins)
        )

@admin_router.callback_query(F.data == "back_to_admin")
async def back_to_admin(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text(
        "Панель администратора",
        reply_markup=get_admin_keyboard()
    )


# ——— Менеджер подписок: переиспользуемый компонент со списком юзеров ———
@admin_router.callback_query(F.data == "subscription_manager")
async def subscription_manager_handler(callback: CallbackQuery, state: FSMContext):
    """Менеджер подписок: по умолчанию показываем всех пользователей (первая страница)."""
    telegram_id = str(callback.from_user.id)
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    if not is_superuser:
        await callback.answer("У вас нет прав администратора.", show_alert=True)
        return
    await state.update_data(last_bot_message=callback.message)
    # По стандарту — все юзеры без фильтра, страница 0
    result = await search_users(
        db,
        query="",
        page=0,
        users_collection=USERS_COLLECTION,
        userprofiles_collection=USERPROFILES_COLLECTION,
    )
    await state.update_data(user_search_query="", user_search_page=0)
    text = format_user_list_message(
        result["items"],
        result["total"],
        result["page"],
        result["total_pages"],
        query=None,
    )
    await callback.message.edit_text(
        text,
        parse_mode="HTML",
        reply_markup=get_user_list_keyboard(
            result["items"],
            result["page"],
            result["total_pages"],
        ),
    )
    await callback.answer()


@admin_router.callback_query(F.data == "user_search_start")
async def user_search_start_handler(callback: CallbackQuery, state: FSMContext):
    """Ввод фильтра поиска (ID или username). После ввода — показ списка."""
    telegram_id = str(callback.from_user.id)
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    if not is_superuser:
        await callback.answer("У вас нет прав администратора.", show_alert=True)
        return
    await state.set_state(AdminStates.waiting_user_search_query)
    await state.update_data(last_bot_message=callback.message)
    await callback.message.edit_text(
        "🔍 <b>Поиск</b>\n\n"
        "Введите <b>ID</b> (Telegram ID) или <b>юзернейм</b> (без @).\n"
        "Пустой ввод — показать всех.",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ Отмена", callback_data="subscription_manager")]
        ]),
    )
    await callback.answer()


@admin_router.message(AdminStates.waiting_user_search_query, F.text)
async def user_search_query_handler(message: Message, state: FSMContext):
    """Обработка введённого запроса поиска и вывод первой страницы."""
    await message.delete()
    data = await state.get_data()
    last_bot_message = data.get("last_bot_message")
    if not last_bot_message:
        await state.clear()
        return
    query = (message.text or "").strip()
    result = await search_users(
        db,
        query=query,
        page=0,
        users_collection=USERS_COLLECTION,
        userprofiles_collection=USERPROFILES_COLLECTION,
    )
    await state.update_data(
        user_search_query=query,
        user_search_page=0,
    )
    text = format_user_list_message(
        result["items"],
        result["total"],
        result["page"],
        result["total_pages"],
        query=query or None,
    )
    await last_bot_message.edit_text(
        text,
        parse_mode="HTML",
        reply_markup=get_user_list_keyboard(
            result["items"],
            result["page"],
            result["total_pages"],
        ),
    )


@admin_router.callback_query(F.data.startswith("user_search_p_"))
async def user_search_page_handler(callback: CallbackQuery, state: FSMContext):
    """Переключение страницы в результатах поиска."""
    try:
        page = int(callback.data.replace("user_search_p_", ""))
    except ValueError:
        await callback.answer()
        return
    data = await state.get_data()
    query = data.get("user_search_query") or ""
    last_bot_message = data.get("last_bot_message")
    if not last_bot_message:
        await callback.answer("Сессия поиска истекла. Запустите поиск снова.", show_alert=True)
        await state.clear()
        return
    result = await search_users(
        db,
        query=query,
        page=page,
        users_collection=USERS_COLLECTION,
        userprofiles_collection=USERPROFILES_COLLECTION,
    )
    await state.update_data(user_search_page=page)
    text = format_user_list_message(
        result["items"],
        result["total"],
        result["page"],
        result["total_pages"],
        query=query or None,
    )
    await callback.message.edit_text(
        text,
        parse_mode="HTML",
        reply_markup=get_user_list_keyboard(
            result["items"],
            result["page"],
            result["total_pages"],
        ),
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("sub_sel_"))
async def subscription_select_user_handler(callback: CallbackQuery, state: FSMContext):
    """Клик по юзеру: показать «Начислить» / «Снять» подписку."""
    user_id = callback.data.replace("sub_sel_", "")
    if not user_id:
        await callback.answer()
        return
    telegram_id = str(callback.from_user.id)
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    if not is_superuser:
        await callback.answer("Нет прав.", show_alert=True)
        return
    # Данные юзера из кэша не берём — показываем только ID; при grant/revoke обновим по user_id
    user_doc = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        await callback.answer("Пользователь не найден.", show_alert=True)
        return
    profile = await db[USERPROFILES_COLLECTION].find_one({"userId": ObjectId(user_id)})
    telegram_id_u = user_doc.get("telegramID") or ""
    username = (profile or {}).get("username") or "—"
    name = (profile or {}).get("name") or "—"
    tier = (profile or {}).get("subscriptionTier") or "none"
    expires = (profile or {}).get("subscriptionExpiresAt")
    expires_str = expires.strftime("%d.%m.%Y") if expires else "—"
    text = (
        f"👤 <b>Пользователь</b>\n"
        f"ID: <code>{telegram_id_u}</code>\n"
        f"@: {username} | {name}\n"
        f"Подписка: <b>{tier}</b> до {expires_str}\n\n"
        "Выберите действие:"
    )
    await callback.message.edit_text(
        text,
        parse_mode="HTML",
        reply_markup=get_subscription_actions_keyboard(user_id),
    )
    await callback.answer()


@admin_router.callback_query(F.data.startswith("sub_grant_"))
async def subscription_grant_handler(callback: CallbackQuery, state: FSMContext):
    """Начислить подписку (finn или finn_plus)."""
    payload = callback.data.replace("sub_grant_", "")
    if payload.endswith("_finn_plus"):
        user_id = payload[: -len("_finn_plus")]
        tier = "finn_plus"
    elif payload.endswith("_finn"):
        user_id = payload[: -len("_finn")]
        tier = "finn"
    else:
        await callback.answer("Ошибка данных.", show_alert=True)
        return
    if not user_id or tier not in ("finn", "finn_plus"):
        await callback.answer("Неверный тариф.", show_alert=True)
        return
    telegram_id = str(callback.from_user.id)
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    if not is_superuser:
        await callback.answer("Нет прав.", show_alert=True)
        return
    try:
        uid = ObjectId(user_id)
    except Exception:
        await callback.answer("Неверный ID.", show_alert=True)
        return
    expires_at = datetime.utcnow() + timedelta(days=30)
    res = await db[USERPROFILES_COLLECTION].update_one(
        {"userId": uid},
        {"$set": {"subscriptionTier": tier, "subscriptionExpiresAt": expires_at}},
    )
    if res.matched_count == 0:
        await callback.answer("Профиль не найден.", show_alert=True)
        return
    await callback.message.edit_text(
        f"✅ Подписка <b>{tier}</b> на 30 дней начислена пользователю {user_id}.",
        parse_mode="HTML",
        reply_markup=get_subscription_actions_keyboard(user_id),
    )
    await callback.answer("Подписка начислена", show_alert=True)


@admin_router.callback_query(F.data.startswith("sub_revoke_"))
async def subscription_revoke_handler(callback: CallbackQuery, state: FSMContext):
    """Снять подписку."""
    user_id = callback.data.replace("sub_revoke_", "")
    if not user_id:
        await callback.answer()
        return
    telegram_id = str(callback.from_user.id)
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    if not is_superuser:
        await callback.answer("Нет прав.", show_alert=True)
        return
    try:
        uid = ObjectId(user_id)
    except Exception:
        await callback.answer("Неверный ID.", show_alert=True)
        return
    res = await db[USERPROFILES_COLLECTION].update_one(
        {"userId": uid},
        {"$set": {"subscriptionTier": "none"}, "$unset": {"subscriptionExpiresAt": 1}},
    )
    if res.matched_count == 0:
        await callback.answer("Профиль не найден.", show_alert=True)
        return
    await callback.message.edit_text(
        f"✅ Подписка снята у пользователя {user_id}.",
        parse_mode="HTML",
        reply_markup=get_subscription_actions_keyboard(user_id),
    )
    await callback.answer("Подписка снята", show_alert=True)


@admin_router.callback_query(F.data == "change_welcome_video")
async def change_welcome_video_handler(callback: CallbackQuery, state: FSMContext):
    """Обработчик изменения вступительного видео"""
    user_id = callback.from_user.id
    telegram_id = str(user_id)
    
    # Проверяем, является ли пользователь админом
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    
    if not is_superuser:
        await callback.answer("У вас нет прав администратора.", show_alert=True)
        return
    
    await state.set_state(AdminStates.waiting_for_video)
    await state.update_data(last_bot_message=callback.message)
    
    await callback.message.edit_text(
        "Отправьте видео файл, которое будет использоваться как вступительное видео при команде /start.\n\n"
        "Видео должно быть в формате MP4.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="◀️ ОТМЕНА", callback_data="back_to_admin")]
        ])
    )

@admin_router.message(AdminStates.waiting_for_video, F.video)
async def process_welcome_video(message: Message, state: FSMContext):
    """Обработчик получения видео файла"""
    user_id = message.from_user.id
    telegram_id = str(user_id)
    
    # Проверяем, является ли пользователь админом
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    
    if not is_superuser:
        await message.answer("У вас нет прав администратора.")
        await state.clear()
        return
    
    # Получаем file_id видео
    video = message.video
    if not video:
        await message.answer("❌ Не удалось получить видео. Попробуйте еще раз.")
        return
    
    video_id = video.file_id
    
    # Сохраняем в БД и обновляем кэш
    await save_welcome_video_id(video_id)
    
    # Удаляем сообщение с видео
    await message.delete()
    
    # Получаем последнее сообщение бота из состояния
    state_data = await state.get_data()
    last_bot_message = state_data.get('last_bot_message')
    
    if last_bot_message:
        await last_bot_message.edit_text(
            f"✅ Вступительное видео успешно обновлено!\n\n"
            f"File ID: {video_id}",
            reply_markup=get_admin_keyboard()
        )
    
    await state.clear()

@admin_router.message(AdminStates.waiting_for_video)
async def process_welcome_video_invalid(message: Message, state: FSMContext):
    """Обработчик неверного типа сообщения при ожидании видео"""
    state_data = await state.get_data()
    last_bot_message = state_data.get('last_bot_message')
    
    if last_bot_message:
        await last_bot_message.edit_text(
            "❌ Пожалуйста, отправьте видео файл (MP4).",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="◀️ ОТМЕНА", callback_data="back_to_admin")]
            ])
        ) 