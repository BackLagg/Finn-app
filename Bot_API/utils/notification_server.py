"""
Микросервер уведомлений для приёма запросов от NestJS бэкенда.
Запускается вместе с ботом и принимает POST запросы на /api/notify.
"""

import logging
from typing import Optional

from aiohttp import web
from aiogram import Bot

logger = logging.getLogger(__name__)

class NotificationServer:
    """HTTP сервер для приёма запросов на уведомления от бэкенда."""
    
    def __init__(self, bot: Bot, host: str = "0.0.0.0", port: int = 3100):
        self.bot = bot
        self.host = host
        self.port = port
        self.app = web.Application()
        self.runner: Optional[web.AppRunner] = None
        self._setup_routes()
    
    def _setup_routes(self):
        """Настройка маршрутов API."""
        self.app.router.add_post('/api/notify', self.handle_notify)
        self.app.router.add_get('/api/health', self.handle_health)
    
    async def handle_health(self, request: web.Request) -> web.Response:
        """Health check endpoint."""
        return web.json_response({"status": "ok", "service": "finn-bot-notifications"})
    
    async def handle_notify(self, request: web.Request) -> web.Response:
        """
        Принимает запрос на отправку уведомления.
        
        Ожидаемый JSON:
        {
          "chat_id": "123456789",  # или number
          "text": "Notification text",
          "parse_mode": "HTML"     # optional
        }
        """
        try:
            data = await request.json()
            chat_id = data.get("chat_id")
            text = data.get("text")
            parse_mode = data.get("parse_mode", "HTML")
            
            if not chat_id or not text:
                return web.json_response(
                    {"success": False, "error": "Missing chat_id or text"},
                    status=400
                )
            
            # Преобразуем chat_id в int
            try:
                chat_id = int(chat_id)
            except (ValueError, TypeError):
                return web.json_response(
                    {"success": False, "error": "Invalid chat_id format"},
                    status=400
                )
            
            # Отправляем сообщение
            await self.bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=parse_mode if parse_mode else None
            )
            
            logger.info(f"Notification sent to {chat_id}")
            return web.json_response({"success": True, "sent": True})
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}", exc_info=True)
            return web.json_response(
                {"success": False, "error": str(e)},
                status=500
            )
    
    async def start(self):
        """Запуск сервера."""
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, self.host, self.port)
        await site.start()
        logger.info(f"🌐 Notification server started on http://{self.host}:{self.port}")
    
    async def stop(self):
        """Остановка сервера."""
        if self.runner:
            await self.runner.cleanup()
            logger.info("Notification server stopped")
