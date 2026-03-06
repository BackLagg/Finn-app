import { Express } from 'express';

/**
 * Настраивает роуты для health check
 */
export function setupHealthRoutes(app: Express): void {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.head('/health', (_req, res) => {
    res.status(200).end();
  });

  app.get('/', (_req, res) => {
    res.status(200).json({ service: 'file-service', status: 'ok' });
  });

  app.head('/', (_req, res) => {
    res.status(200).end();
  });
}
