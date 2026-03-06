import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { getLogger } from '../services/logger.service';

const logger = getLogger();

/**
 * Middleware для обработки ошибок
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Internal server error', err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (res.headersSent || typeof res.status !== 'function') {
    return;
  }
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined,
  });
}
