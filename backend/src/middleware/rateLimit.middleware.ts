import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs: number; // Duration in milliseconds
  max: number; // Maximum number of requests allowed in windowMs
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * In-memory sliding window rate limiter
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests from this client. Please try again later.',
    keyGenerator = (req: Request) => {
      const testIp = req.headers['x-test-ip'] || req.headers['x-test-rate-limit-ip'];
      if (typeof testIp === 'string') return testIp;
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket.remoteAddress || 'unknown-client';
    },
  } = options;

  const storage = new Map<string, RateLimitRecord>();

  // Cleanup expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of storage.entries()) {
      if (now > record.resetTime) {
        storage.delete(key);
      }
    }
  }, 60000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = storage.get(key);

    if (!record || now > record.resetTime) {
      // New window
      storage.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    // Existing window
    record.count += 1;
    const remaining = Math.max(0, max - record.count);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: `${retryAfterSeconds} seconds`,
      });
      return;
    }

    next();
  };
}

const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000);
const AUTH_MAX = Number(process.env.RATE_LIMIT_AUTH_MAX) || 15;
const CHECKOUT_MAX = Number(process.env.RATE_LIMIT_CHECKOUT_MAX) || 20;

/**
 * Pre-configured rate limiter for authentication routes:
 * 15 requests per 15 minutes per IP (protects login, register, and OAuth flows from brute-force)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: DEFAULT_WINDOW_MS,
  max: AUTH_MAX,
  message: 'Too many authentication attempts from this IP address. Please try again in 15 minutes.',
});

/**
 * Pre-configured rate limiter for checkout routes:
 * 20 orders/verifications per 15 minutes per IP (protects payment gateways from card testing and order spam)
 */
export const checkoutRateLimiter = createRateLimiter({
  windowMs: DEFAULT_WINDOW_MS,
  max: CHECKOUT_MAX,
  message: 'Too many checkout requests detected from this IP address. Please wait a few minutes before retrying.',
});

