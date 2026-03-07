import os
from urllib.parse import urlparse
from dotenv import load_dotenv

# Загрузка переменных из .env файла
load_dotenv()

# Токен бота
API_TOKEN = os.getenv("BOT_TOKEN")
# Резервный токен
#API_TOKEN = "8047430728:AAGoA5HDezSyfd3Z1OS07fNAPEVUOKnLPrg"

# MongoDB — должна совпадать с БД бэкенда (User + UserProfile)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
# Имя БД: если не задано, берётся из пути MONGO_URI (как в Mongoose), иначе "ref-app"
_default_db = "ref-app"
if MONGO_URI:
    parsed = urlparse(MONGO_URI)
    if parsed.path and parsed.path != "/":
        _default_db = parsed.path.lstrip("/").split("/")[0] or _default_db
DB_NAME = os.getenv("DB_NAME", _default_db)
# Коллекции бэкенда (schema User -> users, UserProfile -> userprofiles)
USERS_COLLECTION = os.getenv("USERS_COLLECTION", "users")
USERS_PROFILE_COLLECTION = os.getenv("USERS_PROFILE_COLLECTION", "profiles")
USERPROFILES_COLLECTION = os.getenv("USERPROFILES_COLLECTION", "userprofiles")
SUPERUSER_COLLECTION = os.getenv("SUPERUSER_COLLECTION", "superusers")
QUIZ_RESULTS_COLLECTION = "quizresults"

# Продамус платежная система
PRODAMUS_SECRET_KEY = os.getenv("PRODAMUS_SECRET_KEY")
PRODAMUS_API_URL = os.getenv("PRODAMUS_API_URL", "https://payform.ru/api/v1/create/")

# Webhook URLs
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
CREATE_PAYMENT_URL = os.getenv("CREATE_PAYMENT_URL")
SUCCESS_URL = os.getenv("SUCCESS_URL")

# Стоимость подписки
SUBSCRIPTION_PRICE = float(os.getenv("SUBSCRIPTION_PRICE", "7490"))
SUBSCRIPTION_DAYS = int(os.getenv("SUBSCRIPTION_DAYS", "60"))

# MiniApp
MINIAPP_URL = os.getenv("MINIAPP_URL")

# Админы
SUPER_ADMIN_ID = os.getenv("SUPER_ADMIN_ID", "1808397020")

# ID фотографии для приветственного сообщения
# Текущий ID фотографии недействителен
# Чтобы получить новый ID:
# 1. Отправьте фото боту через Telegram-чат
# 2. Перешлите это фото в @getidsbot
# 3. Скопируйте полученный file_id и вставьте его сюда
# WELCOME_PHOTO_ID = "AgACAgIAAxkBAAOaZ77oD4-Tgy3CNspW1TRqpMPUd64AAsHuMRtYrPhJSKZYXBQpBagBAAMCAAN5AAM2BA"
WELCOME_PHOTO_ID = None  # Временно отключено
