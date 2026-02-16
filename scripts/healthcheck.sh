#!/bin/bash
# Скрипт для проверки здоровья сервисов после деплоя
# Использование: ./scripts/healthcheck.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Функции логирования
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${CYAN}🔍 $1${NC}"; }
log_header() { echo -e "${MAGENTA}$1${NC}"; }

# Функция проверки сервиса
check_service() {
    local url=$1
    local name=$2
    local timeout=${3:-5}
    
    if wget --no-verbose --tries=1 --spider --timeout=$timeout "$url" > /dev/null 2>&1; then
        log_success "$name - OK"
        return 0
    else
        log_error "$name - FAILED"
        return 1
    fi
}

# Функция проверки контейнера
check_container() {
    local container_name=$1
    local service_name=$2
    
    if docker ps --format '{{.Names}}' | grep -q "$container_name"; then
        if docker ps --format '{{.Names}} {{.Status}}' | grep -q "$container_name.*Up"; then
            log_success "$service_name (container running) - OK"
            return 0
        else
            log_error "$service_name (container not running) - FAILED"
            return 1
        fi
    else
        log_warning "$service_name - container not found"
        return 1
    fi
}

# Функция проверки MongoDB
check_mongodb() {
    if mongosh fabricbot-app --eval 'db.adminCommand("ping")' --quiet > /dev/null 2>&1; then
        log_success "MongoDB - OK"
        return 0
    else
        log_error "MongoDB - FAILED"
        return 1
    fi
}

# Основная функция healthcheck
main() {
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_step "Health Check Report"
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Ожидание перед проверкой
    log_info "Waiting 30 seconds for services to stabilize..."
    sleep 30
    echo ""
    
    # Проверка статуса контейнеров
    log_step "📦 Container Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || \
    log_warning "Could not get container status"
    echo ""
    
    # Health checks для каждого сервиса
    log_step "🏥 Service Health Checks:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # MongoDB
    check_mongodb
    
    # Backend
    check_service "http://localhost:8080/api/health" "Backend (http://localhost:8080/api/health)"
    
    # Frontend (проверяем через контейнер, так как доступен через nginx)
    check_container "fabricbot-frontend" "Frontend"
    
    # Docs Frontend
    check_service "http://localhost:3004/" "Docs Frontend (http://localhost:3004/)"
    
    # File Service
    check_service "http://localhost:3002/health" "File Service (http://localhost:3002/health)"
    
    # Payment Service
    check_service "http://localhost:3001/api/v1/payment/health" "Payment Service (http://localhost:3001/api/v1/payment/health)"
    
    # Integration API Service
    check_service "http://localhost:3005/metrics" "Integration API Service (http://localhost:3005/metrics)"
    
    # Bot (проверка через статус контейнера)
    check_container "fabricbot-bot" "Bot"
    
    # Prometheus
    check_service "http://localhost:9090/-/healthy" "Prometheus (http://localhost:9090/-/healthy)"
    
    # Grafana (проверяем через контейнер, так как /api/health может быть недоступен)
    check_container "fabricbot-grafana" "Grafana"
    
    # Redis для Payment Service
    if docker ps --format '{{.Names}}' | grep -q 'payment-redis'; then
        check_container "payment-redis" "Payment Redis"
    else
        log_warning "Payment Redis - container not found"
    fi
    
    # Redis для Backend
    if docker ps --format '{{.Names}}' | grep -q 'backend-redis'; then
        check_container "backend-redis" "Backend Redis"
    else
        log_warning "Backend Redis - container not found"
    fi
    
    echo ""
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_step "📋 Recent Logs (last 30 lines per service):"
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Логи основных сервисов
    for service in backend integration-api-service payment-service file-service; do
        if docker ps --format '{{.Names}}' | grep -q "$service"; then
            log_info "--- $service ---"
            docker-compose logs --tail=30 "$service" 2>/dev/null || \
            docker logs "$(docker ps --format '{{.Names}}' | grep "$service" | head -1)" --tail=30 2>/dev/null || \
            log_warning "No logs available"
            echo ""
        fi
    done
    
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_step "📊 System Resources:"
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    log_info "Memory usage:"
    free -h
    echo ""
    
    log_info "Disk usage:"
    df -h / | tail -1
    echo ""
    
    log_info "Docker disk usage:"
    docker system df 2>/dev/null || log_warning "Docker system info not available"
    echo ""
    
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "Health check completed"
    log_header "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Запуск основной функции
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi

