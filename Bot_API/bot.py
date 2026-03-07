import asyncio
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from motor.motor_asyncio import AsyncIOMotorClient

from configs.config import (
    API_TOKEN,
    MONGO_URI,
    DB_NAME,
    SUPERUSER_COLLECTION,
    SUPER_ADMIN_ID,
    PLANNER_NOTIFY_HOUR_MSK,
)
from handlers.start import start_router
from handlers.admin import admin_router, load_welcome_video_id
from utils.planner_notifications import send_planner_notifications

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Инициализация бота и диспетчера
try:
    bot = Bot(token=API_TOKEN)
except Exception as e:
    logger.error(f"❌ Ошибка при инициализации бота: {e}")
    logger.error(f"Значение API_TOKEN: {repr(API_TOKEN)}")
    logger.error(f"Тип API_TOKEN: {type(API_TOKEN)}")
    logger.error(f"Длина API_TOKEN: {len(API_TOKEN) if API_TOKEN else 0}")
    raise

storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# Подключаем все роутеры к диспетчеру
dp.include_routers(start_router, admin_router)

async def init_super_admin():
    """Инициализация супер-админа при запуске бота"""
    if not SUPER_ADMIN_ID:
        logger.warning("SUPER_ADMIN_ID не установлен, пропускаем инициализацию супер-админа")
        return
    
    logger.info(f"🔧 Инициализация супер-админа: ID={SUPER_ADMIN_ID}, MONGO_URI={MONGO_URI}, DB={DB_NAME}, Collection={SUPERUSER_COLLECTION}")
    
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    superuser_collection = db[SUPERUSER_COLLECTION]
    
    try:
        # Проверяем существование супер-админа
        super_admin = await superuser_collection.find_one({"telegramID": SUPER_ADMIN_ID})
        
        if not super_admin:
            # Добавляем супер-админа
            await superuser_collection.insert_one({"telegramID": SUPER_ADMIN_ID})
            logger.info(f"✅ Супер-админ {SUPER_ADMIN_ID} добавлен в базу данных")
        else:
            logger.info(f"ℹ️ Супер-админ {SUPER_ADMIN_ID} уже существует в базе данных")
    except Exception as e:
        logger.error(f"❌ Ошибка при инициализации супер-админа: {e}")
    finally:
        client.close()

async def planner_notify_scheduler(bot_instance: Bot) -> None:
    """Каждый день в 10:00 МСК рассылает уведомления о событиях с истечением < 2 дней."""
    msk = ZoneInfo("Europe/Moscow")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    while True:
        now = datetime.now(msk)
        next_run = now.replace(
            hour=PLANNER_NOTIFY_HOUR_MSK, minute=0, second=0, microsecond=0
        )
        if now >= next_run:
            next_run = next_run + timedelta(days=1)
        wait_secs = (next_run - now).total_seconds()
        logger.info("Planner notifications next run at %s MSK (in %.0f s)", next_run, wait_secs)
        await asyncio.sleep(max(1, wait_secs))
        await send_planner_notifications(bot_instance, db, PLANNER_NOTIFY_HOUR_MSK)


async def on_startup(bot: Bot) -> None:
    """Функция, выполняемая при запуске бота"""
    logger.info("Бот Finn запущен")
    
    # Инициализация супер-админа
    await init_super_admin()
    
    # Загрузка вступительного видео из БД в кэш
    await load_welcome_video_id()
    logger.info("Вступительное видео загружено в кэш")
    
    # Запуск планировщика уведомлений календаря (10:00 МСК)
    asyncio.create_task(planner_notify_scheduler(bot))
    
    # Сохраняем бота в диспетчере
    dp.bot = bot

async def on_shutdown(bot: Bot) -> None:
    """Функция, выполняемая при остановке бота"""
    logger.info("Бот Finn остановлен")

async def main():
    """Основная функция запуска бота"""
    # Регистрация функций запуска и завершения
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)
    
    try:
        # Запуск бота
        await dp.start_polling(bot)
    finally:
        # Закрытие сессии бота
        await bot.session.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Бот остановлен вручную")