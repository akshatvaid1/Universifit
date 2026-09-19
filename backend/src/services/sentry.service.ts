/**
 * Backend Sentry Error Tracking Service
 * Gracefully activates if SENTRY_DSN is configured in backend environment.
 */
import * as Sentry from '@sentry/node';
import type { Express } from 'express';
import { logger } from '../utils/logger.js';

let isSentryInitialized = false;

export const SentryService = {
  /**
   * Initializes Sentry for Node/Express
   */
  init(app?: Express): void {
    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

    if (!dsn) {
      logger.info('ℹ [Sentry Backend]: SENTRY_DSN not configured. Running in local diagnostic mode.');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        release: 'ascend-backend@1.0.0',
        tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
      });

      if (app && typeof (Sentry as any).setupExpressErrorHandler === 'function') {
        (Sentry as any).setupExpressErrorHandler(app);
      }

      isSentryInitialized = true;
      logger.info(`⚡ [Sentry Backend]: Initialized error tracking in "${environment}" mode.`);
    } catch (err) {
      logger.warn('[Sentry Backend]: Failed to initialize Sentry:', { error: err });
    }
  },

  /**
   * Capture an exception in Sentry with metadata tags
   */
  captureException(error: unknown, context?: Record<string, any>): string | undefined {
    if (isSentryInitialized) {
      return Sentry.captureException(error, {
        extra: context,
      });
    }
    return undefined;
  },

  /**
   * Capture an alert or warning message to Sentry
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, any>
  ): string | undefined {
    if (isSentryInitialized) {
      return Sentry.captureMessage(message, {
        level,
        extra: context,
      });
    }
    return undefined;
  },

  /**
   * Capture a critical failure alert to Sentry with severity tags
   */
  captureCriticalAlert(
    alertType: string,
    message: string,
    metadata?: Record<string, any>
  ): string | undefined {
    if (isSentryInitialized) {
      return Sentry.captureException(new Error(`[CRITICAL_ALERT:${alertType}] ${message}`), {
        level: 'fatal',
        tags: {
          alertType,
          isCriticalAlert: 'true',
          severity: 'critical',
        },
        extra: metadata,
      });
    }
    return undefined;
  },

  /**
   * Set user context for subsequent error events
   */
  setUser(user: { id: string; email?: string; role?: string } | null): void {
    if (isSentryInitialized) {
      Sentry.setUser(user);
    }
  },

  isAvailable(): boolean {
    return isSentryInitialized;
  },
};

export default SentryService;
