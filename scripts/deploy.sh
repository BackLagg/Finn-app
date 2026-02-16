#!/bin/bash
# Единый скрипт для деплоя приложения
# Использование: ./scripts/deploy.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${GREEN}🚀 $1${NC}"; }

# Функция ожидания готовности сервиса
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-90}
    
    log_info "Waiting for $name to be ready (max ${max_attempts}s)..."
    for i in $(seq 1 $max_attempts); do
        if wget --no-verbose --tries=1 --spider "$url" > /dev/null 2>&1; then
            log_success "$name is ready!"
            return 0
        fi
        if [ $((i % 15)) -eq 0 ]; then
            log_info "Still waiting... ($i/$max_attempts seconds)"
        fi
        sleep 1
    done
    
    log_error "$name failed to start within $max_attempts seconds"
    log_info "Showing container logs:"
    docker-compose logs --tail=50 "$(echo $name | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')" 2>/dev/null || true
    return 1
}

# Функция ожидания готовности контейнера
wait_for_container() {
    local container_name=$1
    local name=$2
    local max_attempts=${3:-90}
    
    log_info "Waiting for $name container to be ready (max ${max_attempts}s)..."
    for i in $(seq 1 $max_attempts); do
        if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
            if docker ps --format '{{.Names}} {{.Status}}' | grep -q "${container_name}.*Up"; then
                log_success "$name container is ready!"
                return 0
            fi
        fi
        if [ $((i % 15)) -eq 0 ]; then
            log_info "Still waiting... ($i/$max_attempts seconds)"
        fi
        sleep 1
    done
    
    log_error "$name container failed to start within $max_attempts seconds"
    log_info "Showing container logs:"
    docker logs "$container_name" --tail=50 2>/dev/null || true
    return 1
}

# Установка Git
install_git() {
    if ! command -v git &> /dev/null; then
        log_step "Installing Git..."
        apt-get update && apt-get install -y git
        log_success "Git installed"
    fi
}

# Установка Node.js и PM2
install_nodejs() {
    if ! command -v node &> /dev/null; then
        log_step "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        log_success "Node.js installed"
    fi
    if ! command -v pm2 &> /dev/null; then
        log_step "Installing PM2..."
        npm install -g pm2
        log_success "PM2 installed"
    fi
}

# Установка Docker
install_docker() {
    if ! command -v docker &> /dev/null; then
        log_step "Installing Docker..."
        apt-get update
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu jammy stable' | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io
        systemctl start docker && systemctl enable docker
        log_success "Docker installed"
    fi
}

# Установка Docker Compose
install_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log_step "Installing Docker Compose..."
        curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64' -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose installed"
    fi
}

# Обновление репозитория
update_repository() {
    local repo_url=$1
    
    if [ ! -d '/root/Ref-app' ]; then
        log_step "Cloning repository..."
        cd /root && git clone "$repo_url" Ref-app
        cd /root/Ref-app
        export PREVIOUS_HEAD=""
        export CURRENT_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")
    else
        cd /root/Ref-app
        export PREVIOUS_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")
        log_info "Previous HEAD: ${PREVIOUS_HEAD:-none}"
        
        log_step "Updating repository..."
        git fetch origin main
        
        # Сбрасываем все локальные изменения в отслеживаемых файлах
        git reset --hard HEAD || true
        git clean -fd || true
        
        # Обновляем репозиторий
        git pull origin main || {
            log_error "Failed to pull changes"
            exit 1
        }
        
        export CURRENT_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")
        log_info "Current HEAD: $CURRENT_HEAD"
    fi
}

# Запуск MongoDB
ensure_mongodb() {
    log_step "Ensuring MongoDB is running..."
    if command -v mongod &> /dev/null; then
        if systemctl list-unit-files | grep -q mongodb.service; then
            systemctl start mongodb 2>/dev/null || true
            systemctl enable mongodb 2>/dev/null || true
        elif systemctl list-unit-files | grep -q mongod.service; then
            systemctl start mongod 2>/dev/null || true
            systemctl enable mongod 2>/dev/null || true
        else
            pgrep mongod > /dev/null || (mongod --fork --logpath /var/log/mongodb/mongod.log 2>/dev/null || true)
        fi
        sleep 2
        
        if mongosh --eval 'db.adminCommand("ping")' --quiet > /dev/null 2>&1; then
            log_success "MongoDB is running"
        else
            log_warning "MongoDB is not accessible, but continuing deployment..."
        fi
    else
        log_warning "MongoDB (mongod) not found, skipping backup"
    fi
}

# Деплой file-service через PM2
deploy_file_service() {
    log_step "Deploying file-service via PM2..."
    cd file-service
    npm install
    npm run build || exit 1
    
    if pm2 list | grep -q "file-service"; then
        pm2 restart file-service || exit 1
    else
        pm2 start dist/index.js --name file-service || exit 1
        pm2 startup && pm2 save
    fi
    sleep 5
    cd ..
    log_success "File-service deployed"
}

# Создание бэкапа MongoDB
create_mongodb_backup() {
    log_step "Creating database backup..."
    BACKUP_DIR="/root/Ref-app/backup"
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="mongodb_backup_${BACKUP_DATE}"
    BACKUP_FILE="${BACKUP_NAME}.tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    if ! command -v mongodump &> /dev/null; then
        log_warning "mongodump not found, skipping backup"
        return
    fi
    
    if ! mongosh --eval 'db.adminCommand("ping")' --quiet > /dev/null 2>&1; then
        log_warning "MongoDB is not accessible, skipping backup..."
        return
    fi
    
    # Создание дампа
    if mongodump --uri="mongodb://localhost:27017/fabricbot-app" --out="$BACKUP_DIR/$BACKUP_NAME" --quiet 2>/dev/null || \
       mongodump --uri="mongodb://localhost:27017/ref-app" --out="$BACKUP_DIR/$BACKUP_NAME" --quiet 2>/dev/null || \
       mongodump --uri="mongodb://localhost:27017" --out="$BACKUP_DIR/$BACKUP_NAME" --quiet 2>/dev/null; then
        log_success "MongoDB backup created successfully"
    else
        log_warning "MongoDB dump failed, continuing deployment..."
        return
    fi
    
    if [ ! -d "$BACKUP_DIR/$BACKUP_NAME" ]; then
        return
    fi
    
    # Архивирование
    cd "$BACKUP_DIR"
    tar -czf "$BACKUP_FILE" "$BACKUP_NAME" 2>/dev/null || {
        log_warning "Backup archiving failed"
        return
    }
    rm -rf "$BACKUP_NAME"
    cd /root/Ref-app
    
    # Загрузка в file-service
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(stat -f%z "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || echo "0")
        BACKUP_SIZE_MB=$((BACKUP_SIZE / 1024 / 1024))
        log_info "Backup size: ${BACKUP_SIZE_MB}MB"
        
        if [ -f .env ]; then
            export $(grep -v '^#' .env | grep FILE_API_KEY | xargs)
        fi
        
        if [ -n "$FILE_API_KEY" ] && [ "$BACKUP_SIZE_MB" -lt 50 ] && wget --no-verbose --tries=1 --spider http://localhost:3002/health > /dev/null 2>&1; then
            log_step "Uploading backup to file-service..."
            UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3002/api/upload \
                -H "X-API-Key: $FILE_API_KEY" \
                -F "file=@$BACKUP_DIR/$BACKUP_FILE" \
                -F "folder=backups" \
                -F "prefix=db-backup" 2>/dev/null)
            
            if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
                log_success "Backup uploaded to file-service successfully"
            else
                log_warning "Failed to upload backup to file-service, keeping local copy"
            fi
        else
            if [ "$BACKUP_SIZE_MB" -ge 50 ]; then
                log_warning "Backup too large (${BACKUP_SIZE_MB}MB > 50MB), keeping local copy only"
            else
                log_warning "File-service unavailable or API key missing, keeping local backup"
            fi
        fi
    fi
}

# Настройка SSL сертификатов
setup_ssl() {
    local domain=$1
    local cron_hour=$2
    
    if [ ! -f "ssl/live/$domain/fullchain.pem" ]; then
        if ! command -v certbot &> /dev/null; then
            apt-get update && apt-get install -y certbot
        fi
        
        docker-compose stop nginx 2>/dev/null || true
        certbot certonly --standalone --non-interactive --email admin@fabricbot.tech --agree-tos --no-eff-email -d "$domain" || true
        
        if [ -d "/etc/letsencrypt/live/$domain" ]; then
            mkdir -p "ssl/live/$domain"
            cp "/etc/letsencrypt/live/$domain/fullchain.pem" "ssl/live/$domain/"
            cp "/etc/letsencrypt/live/$domain/privkey.pem" "ssl/live/$domain/"
            chmod 644 "ssl/live/$domain/fullchain.pem"
            chmod 600 "ssl/live/$domain/privkey.pem"
        else
            mkdir -p "ssl/live/$domain"
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "ssl/live/$domain/privkey.pem" \
                -out "ssl/live/$domain/fullchain.pem" \
                -subj "/C=RU/ST=Moscow/L=Moscow/O=FabricBot/CN=$domain"
            chmod 644 "ssl/live/$domain/fullchain.pem"
            chmod 600 "ssl/live/$domain/privkey.pem"
        fi
        
        (crontab -l 2>/dev/null | grep -v "certbot renew.*$domain"; \
         echo "$cron_hour * * * /usr/bin/certbot renew --quiet && mkdir -p /root/Ref-app/ssl/live/$domain && cp /etc/letsencrypt/live/$domain/fullchain.pem /root/Ref-app/ssl/live/$domain/ && cp /etc/letsencrypt/live/$domain/privkey.pem /root/Ref-app/ssl/live/$domain/ && chmod 644 /root/Ref-app/ssl/live/$domain/fullchain.pem && chmod 600 /root/Ref-app/ssl/live/$domain/privkey.pem && docker-compose restart nginx") | crontab -
    fi
}

# Определение сервисов для пересборки
determine_services_to_rebuild() {
    local changed_files=""
    local services_to_rebuild=""
    local rebuild_all=false
    
    # Получение списка измененных файлов
    if [ -z "$PREVIOUS_HEAD" ]; then
        log_info "First deployment, rebuilding all services" >&2
        rebuild_all=true
    elif [ "$PREVIOUS_HEAD" = "$CURRENT_HEAD" ]; then
        log_info "No changes detected (HEAD unchanged), skipping rebuild" >&2
        echo ""
        return 0
    else
        changed_files=$(git diff --name-only "$PREVIOUS_HEAD" "$CURRENT_HEAD" 2>/dev/null || echo "")
        log_info "Comparing changes between $PREVIOUS_HEAD and $CURRENT_HEAD" >&2
        
        if [ -n "$changed_files" ]; then
            log_info "Changed files:" >&2
            echo "$changed_files" | head -20 >&2
            [ $(echo "$changed_files" | wc -l) -gt 20 ] && echo "... (and more)" >&2
        else
            log_info "No file changes detected, but commits differ - rebuilding all" >&2
            rebuild_all=true
        fi
    fi
    
    # Если изменился docker-compose.yaml или .env, пересобираем все
    if [ -n "$changed_files" ] && echo "$changed_files" | grep -qE "(docker-compose\.yaml|\.env|env\.example)"; then
        log_info "docker-compose.yaml or .env changed, rebuilding all services" >&2
        rebuild_all=true
    fi
    
    if [ "$rebuild_all" = true ]; then
        docker-compose config --services 2>/dev/null | grep -vE "(payment-redis|backend-redis|node-exporter|cadvisor|docker-cleanup)" || echo ""
        return
    fi
    
    # Проверка изменений в директориях
    if echo "$changed_files" | grep -q "^backend/"; then
        services_to_rebuild="$services_to_rebuild backend"
    fi
    if echo "$changed_files" | grep -q "^frontend/"; then
        services_to_rebuild="$services_to_rebuild frontend"
    fi
    if echo "$changed_files" | grep -q "^docs-frontend/"; then
        services_to_rebuild="$services_to_rebuild docs-frontend"
    fi
    if echo "$changed_files" | grep -q "^Bot_API/"; then
        services_to_rebuild="$services_to_rebuild bot"
    fi
    if echo "$changed_files" | grep -q "^payment-service/"; then
        services_to_rebuild="$services_to_rebuild payment-service"
    fi
    if echo "$changed_files" | grep -q "^integration-api-service/"; then
        services_to_rebuild="$services_to_rebuild integration-api-service"
    fi
    if echo "$changed_files" | grep -q "^docker/nginx/"; then
        services_to_rebuild="$services_to_rebuild nginx"
    fi
    if echo "$changed_files" | grep -q "^monitoring/"; then
        services_to_rebuild="$services_to_rebuild prometheus grafana"
    fi
    
    # Если не определены конкретные сервисы, но есть изменения - пересобираем все
    if [ -z "$services_to_rebuild" ] && [ -n "$changed_files" ]; then
        log_info "Unknown changes detected, rebuilding all services" >&2
        docker-compose config --services 2>/dev/null | grep -vE "(payment-redis|backend-redis|node-exporter|cadvisor|docker-cleanup)" || echo ""
        return
    fi
    
    # Добавление зависимых сервисов
    local final_services=""
    for service in $services_to_rebuild; do
        final_services="$final_services $service"
        # nginx зависит от frontend, docs-frontend, grafana, prometheus
        if [ "$service" = "frontend" ] || [ "$service" = "docs-frontend" ] || [ "$service" = "grafana" ] || [ "$service" = "prometheus" ]; then
            if ! echo "$final_services" | grep -q "nginx"; then
                final_services="$final_services nginx"
            fi
        fi
        # backend зависит от payment-service
        if [ "$service" = "backend" ]; then
            if ! echo "$final_services" | grep -q "payment-service"; then
                final_services="$final_services payment-service"
            fi
        fi
        # bot зависит от backend
        if [ "$service" = "bot" ]; then
            if ! echo "$final_services" | grep -q "backend"; then
                final_services="$final_services backend"
            fi
            if ! echo "$final_services" | grep -q "payment-service"; then
                final_services="$final_services payment-service"
            fi
        fi
    done
    
    echo "$final_services" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' '
}

# Пересборка и запуск сервисов
rebuild_and_start_services() {
    local services=$1
    
    # Очищаем пробелы в начале и конце
    services=$(echo "$services" | xargs)
    
    if [ -z "$services" ] || [ "$services" = "" ]; then
        log_info "No services need rebuilding, starting existing containers..."
        docker-compose up -d --remove-orphans
        return
    fi
    
    log_info "Services to rebuild: $services"
    
    # Остановка сервисов для пересборки
    for service in $services; do
        log_info "Stopping $service..."
        if docker-compose ps -q "$service" > /dev/null 2>&1; then
            docker-compose stop "$service" 2>/dev/null || true
            docker-compose rm -f "$service" 2>/dev/null || true
        else
            log_info "$service container not found, skipping stop/rm"
        fi
    done
    
    # Пересборка и запуск в правильном порядке
    if echo "$services" | grep -q "payment-service"; then
        log_step "Rebuilding and starting payment-service..."
        docker-compose build payment-service
        docker-compose up -d payment-service
        sleep 15
        if ! wait_for_service "http://localhost:3001/api/v1/payment/health" "Payment Service" 90; then
            log_error "Payment service failed to start!"
            docker-compose logs --tail=50 payment-service
            exit 1
        fi
        sleep 3
    fi
    
    if echo "$services" | grep -q "backend"; then
        log_step "Rebuilding and starting backend..."
        docker-compose build backend
        docker-compose up -d backend
        sleep 15
        wait_for_service "http://localhost:8080/api/health" "Backend" 90 || exit 1
    fi
    
    if echo "$services" | grep -q "frontend"; then
        log_step "Rebuilding and starting frontend..."
        docker-compose build frontend
        docker-compose up -d frontend
        # Frontend доступен через nginx, проверяем контейнер
        wait_for_container "fabricbot-frontend" "Frontend" || exit 1
    fi
    
    if echo "$services" | grep -q "docs-frontend"; then
        log_step "Rebuilding and starting docs-frontend..."
        docker-compose build docs-frontend
        docker-compose up -d docs-frontend
        wait_for_service "http://localhost:3004/" "Docs Frontend" || exit 1
    fi
    
    if echo "$services" | grep -q "integration-api-service"; then
        log_step "Rebuilding and starting integration-api-service..."
        docker-compose build integration-api-service
        docker-compose up -d integration-api-service
        sleep 5
    fi
    
    if echo "$services" | grep -q "prometheus"; then
        log_step "Rebuilding and starting prometheus..."
        docker-compose build prometheus
        docker-compose up -d prometheus
        sleep 5
    fi
    
    if echo "$services" | grep -q "grafana"; then
        log_step "Rebuilding and starting grafana..."
        docker-compose build grafana
        docker-compose up -d grafana
        sleep 5
    fi
    
    if echo "$services" | grep -q "bot"; then
        log_step "Rebuilding and starting bot..."
        docker-compose build bot
        docker-compose up -d bot
        sleep 5
    fi
    
    if echo "$services" | grep -q "nginx"; then
        log_step "Pulling and starting nginx..."
        # Удаляем старый контейнер nginx, если он помечен для удаления
        if docker ps -a --format '{{.Names}} {{.Status}}' | grep -q 'fabricbot-nginx.*Removal'; then
            log_info "Removing nginx container marked for removal..."
            docker rm -f fabricbot-nginx 2>/dev/null || true
        fi
        docker-compose pull nginx
        docker-compose up -d nginx
        sleep 3
    fi
    
    # Запуск всех остальных сервисов
    log_info "Ensuring all required services are running..."
    # Удаляем контейнеры, помеченные для удаления, перед запуском
    docker ps -a --filter "status=removing" --format '{{.Names}}' | xargs -r docker rm -f 2>/dev/null || true
    docker-compose up -d --remove-orphans
}

# Проверка здоровья сервисов
health_check() {
    log_step "Running health checks..."
    mongosh fabricbot-app --eval 'db.adminCommand("ping")' --quiet > /dev/null 2>&1 && log_success "MongoDB" || log_warning "MongoDB"
    wget --no-verbose --tries=1 --spider http://localhost:8080/api/health > /dev/null 2>&1 && log_success "Backend" || log_warning "Backend"
    # Frontend проверяем через контейнер, так как доступен через nginx
    if docker ps --format '{{.Names}} {{.Status}}' | grep -q 'fabricbot-frontend.*Up'; then
        log_success "Frontend"
    else
        log_warning "Frontend (check logs: docker logs fabricbot-frontend)"
    fi
    wget --no-verbose --tries=1 --spider http://localhost:3004/ > /dev/null 2>&1 && log_success "Docs Frontend" || log_warning "Docs Frontend"
    wget --no-verbose --tries=1 --spider http://localhost:3002/health > /dev/null 2>&1 && log_success "File-service" || log_warning "File-service"
    wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/payment/health > /dev/null 2>&1 && log_success "Payment Service" || log_warning "Payment Service"
    wget --no-verbose --tries=1 --spider http://localhost:3005/metrics > /dev/null 2>&1 && log_success "Integration API Service" || log_warning "Integration API Service"
    # Проверка бота через статус контейнера
    if docker ps --format '{{.Names}} {{.Status}}' | grep -q 'fabricbot-bot.*Up'; then
        log_success "Bot"
    else
        log_warning "Bot (check logs: docker logs fabricbot-bot)"
    fi
    wget --no-verbose --tries=1 --spider http://localhost:9090/-/healthy > /dev/null 2>&1 && log_success "Prometheus" || log_warning "Prometheus"
    # Grafana проверяем через контейнер, так как /api/health может быть недоступен
    if docker ps --format '{{.Names}} {{.Status}}' | grep -q 'fabricbot-grafana.*Up'; then
        log_success "Grafana"
    else
        log_warning "Grafana (check logs: docker logs fabricbot-grafana)"
    fi
}

# Основная функция деплоя
main() {
    local repo_url=$1
    
    log_step "Starting deployment..."
    
    # Установка зависимостей
    install_git
    install_nodejs
    install_docker
    install_docker_compose
    
    # Обновление репозитория
    update_repository "$repo_url"
    
    # Создание директорий
    mkdir -p logs/{backend,frontend,nginx,bot,mongodb} backup ssl
    
    # Запуск MongoDB
    ensure_mongodb
    
    # Определение изменений для file-service (до определения Docker сервисов)
    FILE_SERVICE_CHANGED=false
    if [ -z "$PREVIOUS_HEAD" ]; then
        FILE_SERVICE_CHANGED=true
    elif [ "$PREVIOUS_HEAD" != "$CURRENT_HEAD" ]; then
        CHANGED_FILES=$(git diff --name-only "$PREVIOUS_HEAD" "$CURRENT_HEAD" 2>/dev/null || echo "")
        if echo "$CHANGED_FILES" | grep -q "^file-service/"; then
            FILE_SERVICE_CHANGED=true
            log_info "File-service changes detected"
        fi
    fi
    
    # Деплой file-service (только если есть изменения или первый деплой)
    if [ "$FILE_SERVICE_CHANGED" = true ]; then
        deploy_file_service
    else
        log_info "No file-service changes, skipping rebuild"
    fi
    
    # Создание бэкапа
    create_mongodb_backup
    
    # Настройка SSL
    setup_ssl fabricbot.tech "0 12"
    setup_ssl stats.fabricbot.tech "0 13"
    setup_ssl docs.fabricbot.tech "0 14"
    
    # Настройка cron для очистки Docker
    (crontab -l 2>/dev/null | grep -v 'docker cleanup' | grep -v 'disk cleanup') | crontab - || true
    (crontab -l 2>/dev/null; echo "0 3 * * * cd /root/Ref-app && docker container prune -f && df -h >> /root/disk-usage.log") | crontab -
    
    # Создание .env если отсутствует
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
        else
            touch .env
            log_info "Created empty .env file (env.example not found)"
        fi
    fi
    
    # Определение сервисов для пересборки
    SERVICES_TO_REBUILD=$(determine_services_to_rebuild)
    
    # Вывод списка сервисов, требующих перезапуска
    echo ""
    log_step "Services requiring restart:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ -z "$SERVICES_TO_REBUILD" ] || [ "$SERVICES_TO_REBUILD" = "" ]; then
        log_info "  ⏭️  No services need restarting (no changes detected)"
    else
        log_info "  🔄 The following services will be rebuilt and restarted:"
        for service in $SERVICES_TO_REBUILD; do
            echo "     • $service"
        done
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Пересборка и запуск сервисов
    rebuild_and_start_services "$SERVICES_TO_REBUILD"
    
    # Очистка остановленных контейнеров после запуска всех сервисов
    docker container prune -f || true
    
    sleep 15
    
    # Проверка здоровья
    health_check
    
    # Очистка
    docker container prune -f || true
    
    # Вывод информации о пересобранных сервисах
    echo ""
    log_step "Deployment Summary:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # File-service
    if [ "$FILE_SERVICE_CHANGED" = true ]; then
        echo "  ✅ file-service (PM2) - rebuilt and restarted"
    else
        echo "  ⏭️  file-service (PM2) - skipped (no changes)"
    fi
    
    # Docker сервисы
    if [ -z "$SERVICES_TO_REBUILD" ]; then
        echo "  ⏭️  Docker services - no rebuild needed (no changes)"
    else
        echo "  ✅ Docker services rebuilt:"
        for service in $SERVICES_TO_REBUILD; do
            echo "     • $service"
        done
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    log_success "Deployment completed"
    echo "🌐 https://fabricbot.tech | 📊 https://stats.fabricbot.tech | 📚 https://docs.fabricbot.tech"
}

# Запуск основной функции
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi

