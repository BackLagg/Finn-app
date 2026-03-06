import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const environment = process.env.NODE_ENV || 'development';
  return {
    port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '8080', 10) || 8080,
    baseUrl:
      process.env.RENDER_EXTERNAL_URL ||
      process.env.BACKEND_BASE_URL ||
      'http://localhost:8080',
    environment,
    isDevelopment: environment === 'development',

    // CORS settings
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],

    // Telegram Bot settings
    botToken: process.env.BOT_TOKEN,
    botUsername: process.env.BOT_USERNAME || 'fabricbotbot',

    // Payment Service settings
    paymentServiceUrl:
      process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001',
    paymentApiKey: process.env.PAYMENT_API_KEY || '',

    // File Service settings
    fileServiceUrl: process.env.FILE_SERVICE_URL || 'http://localhost:3002',
    fileServiceApiKey: process.env.FILE_API_KEY || '',

    // Integration API Service settings
    integrationApiKey: process.env.INTEGRATION_API_KEY || '',
    // Секрет для подписи межсервисных запросов (HMAC-SHA256)
    interServiceSecret:
      process.env.INTER_SERVICE_SECRET || process.env.INTEGRATION_API_KEY || '',
    // Секрет для подписи токенов платежных запросов (должен совпадать с TOKEN_SECRET в integration-api-service)
    integrationTokenSecret:
      process.env.INTEGRATION_TOKEN_SECRET || 'change-me-in-production',

    // Публичный URL для файлов (через nginx/домен)
    filePublicUrl: process.env.FILE_PUBLIC_URL || '',

    aiReceiptProvider: (process.env.AI_RECEIPT_PROVIDER || 'openai') as
      | 'openai'
      | 'google',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  };
});
