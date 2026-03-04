# Деплой на Render.com

Проект подготовлен к деплою через Render Blueprint (`render.yaml`): бэкенд, файловый сервис, фронтенд, бот и Redis заданы в конфиге.

## Сервисы в Blueprint

| Сервис           | Тип       | rootDir     | Описание                          |
|------------------|-----------|-------------|-----------------------------------|
| finn-redis       | keyvalue  | —           | Redis-совместимый кэш (Render Key Value) |
| finn-backend     | web       | backend     | NestJS API                        |
| finn-file-service | web     | file-service| Файловый сервис (Express)         |
| finn-frontend    | web       | frontend    | SPA на React + Nginx              |
| finn-bot         | worker    | Bot_API     | Telegram-бот (Python)            |

## База данных (MongoDB) и Redis

**MongoDB** на Render управляемого сервиса нет. Нужно использовать один из вариантов:

- **MongoDB Atlas** (рекомендуется) — создать кластер на [atlas.mongodb.com](https://www.mongodb.com/cloud/atlas), взять connection string и задать переменную **`MONGO_URI`** в Dashboard для **finn-backend** и **finn-bot**.
- Либо развернуть свой MongoDB (например, через Docker на отдельном сервере) и прописать его URL в **`MONGO_URI`**.

В Blueprint MongoDB **не добавляется** — только переменная окружения вручную.

**Redis** уже описан в `render.yaml` как сервис **finn-redis** (тип `keyvalue`). Render создаёт инстанс Redis (Valkey), а в **finn-backend** автоматически подставляются **`REDIS_HOST`** и **`REDIS_PORT`** через `fromService`. Отдельно задавать их не нужно. Пароль для внутреннего подключения обычно не используется.

## Шаги деплоя

1. Подключите репозиторий в [Render Dashboard](https://dashboard.render.com).
2. **New → Blueprint** и укажите репозиторий. Render подхватит `render.yaml` из корня.
3. Задайте переменные окружения в Dashboard для каждого сервиса (или через Environment Groups).

## Переменные окружения

Их нужно задать в Render для каждого сервиса (не храните секреты в репозитории).

### Backend (finn-backend)

- **`MONGO_URI`** — строка подключения к MongoDB (Atlas или свой инстанс). Обязательно.
- `BOT_TOKEN`, `BOT_USERNAME`
- `FILE_SERVICE_URL` — URL файлового сервиса (например `https://finn-file-service.onrender.com`)
- `FILE_API_KEY` — ключ для запросов к файловому сервису
- `ALLOWED_ORIGINS` — через запятую, например: `https://your-frontend.onrender.com,https://your-domain.com`
- Остальные по необходимости: `PAYMENT_SERVICE_URL`, `OPENAI_API_KEY` и т.д.

**Redis**: `REDIS_HOST` и `REDIS_PORT` задаются автоматически из сервиса **finn-redis** через Blueprint; вручную не указывать.

`PORT` на Render выставляется автоматически; бэкенд его использует.

### File Service (finn-file-service)

- `FILE_API_KEY` — тот же ключ, что и в бэкенде
- При использовании S3: `S3_ENABLED`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`
- При необходимости: `CORS_ORIGIN`, `STORAGE_PATH`

`PORT` задаётся Render автоматически.

### Frontend (finn-frontend)

- Обычно достаточно переменных для API (если фронт обращается к бэкенду по URL). URL бэкенда можно задать через build-time или runtime (например через `VITE_API_URL` в Vite, если используется).

`PORT` задаётся Render; Nginx в контейнере слушает этот порт через скрипт `scripts/start-nginx.sh`.

### Bot (finn-bot, worker)

- `API_TOKEN` (Telegram Bot Token)
- `MONGO_URI`, `DB_NAME`, `SUPERUSER_COLLECTION`, `SUPER_ADMIN_ID`
- Остальные переменные из `Bot_API/configs`.

## Связь сервисов

- В **Backend** в `FILE_SERVICE_URL` укажите внутренний URL файлового сервиса Render (например `https://finn-file-service.onrender.com`).
- В **Frontend** укажите URL бэкенда (тот, что выдаёт Render для finn-backend).
- В **ALLOWED_ORIGINS** бэкенда добавьте URL фронтенда и свой домен.

## Монорепо

Используется `rootDir` для каждого сервиса; сборка и запуск выполняются из соответствующей папки. При пуше в репозиторий можно настроить **Build Filter** в Render, чтобы пересобирать только затронутые сервисы (например, только при изменениях в `backend/` для finn-backend).

## Дополнительно

- Бэкенд и файловый сервис слушают `0.0.0.0` и порт из `PORT`.
- Фронтенд в Docker подставляет `PORT` в конфиг Nginx при старте контейнера.
- Бот запускается как Background Worker (без входящего HTTP).
