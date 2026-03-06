# Этап сборки React приложения
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Обновляем npm до последней версии
RUN npm install -g npm@latest

# Копируем файлы зависимостей
COPY package*.json ./

# Очищаем npm кэш и устанавливаем зависимости
RUN npm cache clean --force && \
    npm install

# Копируем исходный код
COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Этап продакшена с Nginx
FROM nginx:alpine AS production

# Устанавливаем wget для health checks
RUN apk add --no-cache wget

# Создаем пользователя для Nginx
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001

# Копируем собранное приложение
COPY --from=builder --chown=nginx-user:nginx-user /app/dist /usr/share/nginx/html

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY scripts/start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

# Создаем директории и устанавливаем права
RUN mkdir -p /var/log/nginx /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    chown -R nginx-user:nginx-user /tmp

EXPOSE 80
CMD ["/start-nginx.sh"]
