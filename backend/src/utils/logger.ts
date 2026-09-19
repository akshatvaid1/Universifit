/**
 * Backend Structured Logging Service (Winston)
 * Produces structured JSON logs with correlation metadata for key business & security events.
 */
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Custom format for local terminal readability in development
const devConsoleFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
});

// Base Winston logger instance
const baseLogger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ascend-backend',
    env: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
            devConsoleFormat
          ),
    }),
  ],
});

// Event payload types
export interface PaymentAttemptLog {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  offerId?: string | null;
  bookingId?: string | null;
  couponCode?: string | null;
  notes?: Record<string, any>;
}

export interface PaymentSuccessLog {
  paymentId: string;
  orderId: string;
  userId?: string;
  amount?: number;
  currency?: string;
  offerId?: string | null;
  bookingId?: string | null;
}

export interface PaymentFailureLog {
  orderId?: string;
  paymentId?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  error: string;
  reason?: string;
}

export interface AuthSuccessLog {
  userId: string;
  email: string;
  role: string;
  method: 'password' | 'google-oauth' | 'session-verify';
  ip?: string;
}

export interface AuthFailureLog {
  email?: string;
  reason: string;
  method?: 'password' | 'google-oauth' | 'jwt-verify';
  ip?: string;
  userAgent?: string;
  attemptCount?: number;
}

export interface WebhookReceivedLog {
  razorpayEvent: string;
  signatureStatus: 'valid' | 'invalid' | 'mock_bypassed';
  eventId?: string;
  sourceIp?: string;
}

export interface WebhookFailureLog {
  razorpayEvent?: string;
  error: string;
  signature?: string;
  sourceIp?: string;
  payload?: any;
}

export interface ApiErrorLog {
  route: string;
  method: string;
  statusCode: number;
  error: string;
  stack?: string;
  userId?: string;
  ip?: string;
}

export interface CriticalAlertLog {
  alertId: string;
  alertType: string;
  severity: 'warning' | 'critical' | 'fatal';
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Ascend Structured Logger
 */
export const logger = {
  // Standard log methods
  debug: (message: string, meta?: Record<string, any>) => baseLogger.debug(message, meta),
  info: (message: string, meta?: Record<string, any>) => baseLogger.info(message, meta),
  warn: (message: string, meta?: Record<string, any>) => baseLogger.warn(message, meta),
  error: (message: string, meta?: Record<string, any>) => baseLogger.error(message, meta),

  // 1. Payment Attempt Structured Event
  paymentAttempt: (data: PaymentAttemptLog) => {
    baseLogger.info('PAYMENT_ATTEMPT: Razorpay order initialized', {
      eventType: 'PAYMENT_ATTEMPT',
      ...data,
    });
  },

  // 2. Payment Success Structured Event
  paymentSuccess: (data: PaymentSuccessLog) => {
    baseLogger.info('PAYMENT_SUCCESS: Transaction completed and verified', {
      eventType: 'PAYMENT_SUCCESS',
      ...data,
    });
  },

  // 3. Payment Failure Structured Event
  paymentFailure: (data: PaymentFailureLog) => {
    baseLogger.error('PAYMENT_FAILURE: Transaction failed or signature mismatch', {
      eventType: 'PAYMENT_FAILURE',
      ...data,
    });
  },

  // 4. Auth Success Structured Event
  authSuccess: (data: AuthSuccessLog) => {
    baseLogger.info(`AUTH_SUCCESS: User authenticated via ${data.method}`, {
      eventType: 'AUTH_SUCCESS',
      userId: data.userId,
      email: data.email,
      role: data.role,
      method: data.method,
      ip: data.ip,
    });
  },

  // 5. Auth Failure Structured Event
  authFailure: (data: AuthFailureLog) => {
    baseLogger.warn(`AUTH_FAILURE: Authentication rejected (${data.reason})`, {
      eventType: 'AUTH_FAILURE',
      email: data.email,
      reason: data.reason,
      method: data.method || 'password',
      ip: data.ip,
      userAgent: data.userAgent,
      attemptCount: data.attemptCount,
    });
  },

  // 6. Webhook Received Structured Event
  webhookReceived: (data: WebhookReceivedLog) => {
    baseLogger.info(`WEBHOOK_RECEIVED: Razorpay event "${data.razorpayEvent}"`, {
      eventType: 'WEBHOOK_RECEIVED',
      ...data,
    });
  },

  // 7. Webhook Failure Structured Event
  webhookFailure: (data: WebhookFailureLog) => {
    baseLogger.error(`WEBHOOK_FAILURE: Razorpay webhook processing error`, {
      eventType: 'WEBHOOK_FAILURE',
      ...data,
    });
  },

  // 8. API Error Structured Event
  apiError: (data: ApiErrorLog) => {
    baseLogger.error(`API_ERROR: ${data.method} ${data.route} (${data.statusCode})`, {
      eventType: 'API_ERROR',
      ...data,
    });
  },

  // 9. Critical Alert Structured Event
  criticalAlert: (data: CriticalAlertLog) => {
    baseLogger.error(`CRITICAL_ALERT: [${data.alertType}] ${data.message}`, {
      eventType: 'CRITICAL_ALERT',
      ...data,
    });
  },
};

export default logger;
