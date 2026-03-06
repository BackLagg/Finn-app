from aiogram import Bot, Router
from aiogram.types import Message
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from motor.motor_asyncio import AsyncIOMotorClient

from configs.config import (
    MONGO_URI,
    DB_NAME,
    SUPERUSER_COLLECTION,
    MINIAPP_URL
)
from keyboards.keyboards import get_webapp_keyboard

# Создаем роутер для команды start
start_router = Router(name="start_router")

# Текст приветственного сообщения
WELCOME_TEXT = """👋 Добро пожаловать в Finn!

Приложение для учёта личных финансов прямо в Telegram: доходы и расходы, бюджеты, цели накоплений и напоминания о платежах.

Что уже есть:

📊 Учёт расходов и доходов по категориям
🎯 Цели и накопления с прогрессом
📅 Напоминания о регулярных платежах
🧾 Сканер чеков с распознаванием
👥 Партнёрские комнаты для общих трат
📈 Планировщик и статистика

Откройте приложение по кнопке ниже — укажите доход и настройте распределение бюджета под себя."""

# Инициализация подключения к MongoDB
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
superuser_collection = db[SUPERUSER_COLLECTION]

@start_router.message(Command("start"))
async def start_command_handler(message: Message, state: FSMContext, bot: Bot):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    telegram_id = str(user_id)
    
    # Проверяем, является ли пользователь админом
    is_superuser = await superuser_collection.find_one({"telegramID": telegram_id})
    
    # Создаем клавиатуру с кнопкой приложения
    keyboard = get_webapp_keyboard(is_admin=bool(is_superuser))
    
    # Импортируем кэш для video_id
    from handlers.admin import welcome_video_id_cache
    
    # Если есть вступительное видео, отправляем его вместе с текстом
    if welcome_video_id_cache:
        await message.answer_video(
            video=welcome_video_id_cache,
            caption=WELCOME_TEXT,
            parse_mode="HTML",
            reply_markup=keyboard
        )
    else:
        # Отправляем только приветственное сообщение
        await message.answer(
            WELCOME_TEXT,
            parse_mode="HTML",
            reply_markup=keyboard
        )

