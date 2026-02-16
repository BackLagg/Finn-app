#!/bin/bash
# Скрипт для создания .env файла из GitHub Secrets
# Использование: ./scripts/setup-env-from-secrets.sh

set -e

# Функции логирования
log_info() { echo "ℹ️  $1"; }
log_success() { echo "✅ $1"; }
log_warning() { echo "⚠️  $1"; }
log_error() { echo "❌ $1"; }

# Проверка наличия .env файла
ENV_FILE=".env"
ENV_EXAMPLE="env.example"

log_info "Setting up .env file from environment variables..."

# Создаем .env из примера, если его нет
if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        log_info "Creating .env from env.example..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
    else
        log_warning "env.example not found, creating empty .env file..."
        touch "$ENV_FILE"
    fi
fi

# Функция для обновления значения в .env файле
update_env_value() {
    local key=$1
    local value=$2
    local file=$3
    
    if [ -z "$value" ]; then
        return 0  # Пропускаем пустые значения
    fi
    
    # Экранируем специальные символы для sed (включая /, |, &, и другие)
    local escaped_value=$(echo "$value" | sed 's/[[\.*^$()+?{|&\/]/\\&/g')
    
    if grep -q "^${key}=" "$file"; then
        # Обновляем существующее значение (включая закомментированные строки)
        # Сначала удаляем старую строку, затем добавляем новую
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "/^${key}=/d" "$file"
            sed -i '' "/^#.*${key}=/d" "$file"
        else
            # Linux
            sed -i "/^${key}=/d" "$file"
            sed -i "/^#.*${key}=/d" "$file"
        fi
        # Добавляем новое значение в конец файла
        echo "${key}=${value}" >> "$file"
    else
        # Добавляем новое значение
        echo "${key}=${value}" >> "$file"
    fi
}

# Список критических секретов из GitHub Secrets
# Только API ключи/секреты и TON переменные

CRITICAL_SECRETS=(
    # API ключи и секреты
    "BOT_TOKEN"
    "PAYMENT_API_KEY"
    "FILE_API_KEY"
    "INTEGRATION_API_KEY"
    "INTER_SERVICE_SECRET"
    "TOKEN_SECRET"
    "INTEGRATION_TOKEN_SECRET"
    "WEBHOOK_SECRET"
    "INTEGRATION_WEBHOOK_SECRET"
    # TON переменные
    "TON_API_KEY"
    "PLATFORM_WALLET_MNEMONIC"
    "PLATFORM_SECRET_KEY"
    "PLATFORM_PUBLIC_KEY"
    "PROXY_CONTRACT_ADDRESS"
    "FBC_JETTON_MASTER_ADDRESS"
)

# Обновляем критические секреты из переменных окружения
UPDATED_COUNT=0
MISSING_COUNT=0

for secret in "${CRITICAL_SECRETS[@]}"; do
    # Проверяем переменную окружения
    env_value="${!secret}"
    
    # Проверяем, есть ли уже значение в .env файле (игнорируем комментарии и пустые строки)
    existing_line=$(grep "^${secret}=" "$ENV_FILE" 2>/dev/null | head -n1 || echo "")
    existing_value=$(echo "$existing_line" | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || echo "")
    
    # Если переменная окружения установлена и не пустая
    if [ -n "$env_value" ] && [ "$env_value" != "" ]; then
        # Обновляем значение из переменной окружения
        update_env_value "$secret" "$env_value" "$ENV_FILE"
        UPDATED_COUNT=$((UPDATED_COUNT + 1))
        log_info "Updated $secret from environment variable"
    elif [ -n "$existing_value" ] && [ "$existing_value" != "" ]; then
        # Если переменная окружения не установлена, но есть значение в .env, сохраняем его
        log_info "Keeping existing $secret value from .env file (env var not set or empty)"
    else
        # Если нет ни в окружении, ни в .env
        MISSING_COUNT=$((MISSING_COUNT + 1))
        log_warning "$secret not provided in env and not found in .env file"
    fi
done

log_success "Environment setup completed"
log_info "Updated: $UPDATED_COUNT secrets"
if [ $MISSING_COUNT -gt 0 ]; then
    log_warning "Missing: $MISSING_COUNT secrets (using existing/default values)"
fi

# Устанавливаем правильные права доступа
chmod 600 "$ENV_FILE" 2>/dev/null || true

log_success ".env file is ready"

