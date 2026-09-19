/**
 * Express Request Logger Middleware
 * Logs incoming HTTP requests and response latency using structured logger
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Skip logging high-frequency health checks to keep logs concise
  if (req.path === '/health' || req.path === '/api/health') {
    next();
    return;
  }

  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Listen for the finish event on the response
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const user = (req as any).user;
    const userId = user?.userId || user?.id;

    const meta = {
      method,
      url: originalUrl,
      statusCode,
      durationMs,
      ip: ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      ...(userId ? { userId } : {}),
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${method} ${originalUrl} ${statusCode} (${durationMs}ms)`, meta);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${method} ${originalUrl} ${statusCode} (${durationMs}ms)`, meta);
    } else {
      logger.info(`HTTP ${method} ${originalUrl} ${statusCode} (${durationMs}ms)`, meta);
    }
  });

  next();
};

export default requestLogger;
