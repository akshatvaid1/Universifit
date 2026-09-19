/**
 * Frontend Sentry Real-Time Error Tracking Integration
 * Gracefully activates if VITE_SENTRY_DSN is provided in the environment.
 */
import * as Sentry from '@sentry/react';

export interface SentryUserContext {
  id: string;
  email?: string;
  role?: string;
  fullName?: string;
}

let isSentryInitialized = false;

/**
 * Initializes Sentry in the frontend environment.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';

  if (!dsn) {
    // Graceful offline/local mode when DSN is not configured
    console.info('[Sentry Frontend]: VITE_SENTRY_DSN not configured. Running in diagnostic mock mode.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release: 'ascend-frontend@1.0.0',
      tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      beforeSend(event) {
        // Redact any sensitive passwords or credit card numbers in payloads
        if (event.request?.data) {
          const data = event.request.data;
          if (typeof data === 'object' && data !== null) {
            if ('password' in data) (data as any).password = '[REDACTED]';
            if ('card' in data) (data as any).card = '[REDACTED]';
          }
        }
        return event;
      },
    });
    isSentryInitialized = true;
    console.info(`⚡ [Sentry Frontend]: Initialized successfully in "${environment}" environment.`);
  } catch (err) {
    console.warn('[Sentry Frontend]: Initialization error:', err);
  }
}

/**
 * Capture an unhandled exception or caught error to Sentry
 */
export function captureFrontendError(error: unknown, context?: Record<string, any>): string | undefined {
  if (isSentryInitialized) {
    return Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.debug('[Frontend Diagnostic Error]:', error, context);
    return undefined;
  }
}

/**
 * Capture an informative or warning message to Sentry
 */
export function captureFrontendMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string | undefined {
  if (isSentryInitialized) {
    return Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.debug(`[Frontend Diagnostic ${level.toUpperCase()}]:`, message, context);
    return undefined;
  }
}

/**
 * Set current authenticated user context in Sentry
 */
export function setSentryUserContext(user: SentryUserContext | null): void {
  if (!isSentryInitialized) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.fullName,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Clear authenticated user context (e.g. on logout)
 */
export function clearSentryUserContext(): void {
  if (isSentryInitialized) {
    Sentry.setUser(null);
  }
}

export { Sentry };
