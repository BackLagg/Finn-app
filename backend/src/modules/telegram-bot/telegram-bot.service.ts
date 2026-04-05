import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Sends notifications via Telegram Bot HTTP microserver.
 * Bot runs aiohttp server on port 3100 (configurable) accepting POST /api/notify.
 */
@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botNotifyUrl: string;

  constructor(private readonly configService: ConfigService) {
    const botHost = this.configService.get<string>('app.botNotificationHost') || 'localhost';
    const botPort = this.configService.get<number>('app.botNotificationPort') || 3100;
    this.botNotifyUrl = `http://${botHost}:${botPort}/api/notify`;
  }

  /**
   * @returns true if bot microserver accepted the notification
   */
  async sendMessage(chatId: number | string, text: string): Promise<boolean> {
    try {
      const response = await axios.post(this.botNotifyUrl, {
        chat_id: String(chatId),
        text,
        parse_mode: 'HTML',
      }, {
        timeout: 5000,
      });
      return response.data?.sent === true;
    } catch (err) {
      this.logger.warn(`Telegram bot notify failed for chatId=${chatId}`, err);
      return false;
    }
  }
}
