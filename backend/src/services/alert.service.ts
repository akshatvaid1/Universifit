/**
 * AlertService — Critical Failure Alerting Engine
 * Dispatches notifications across Sentry, Ops Webhooks, and Structured Logger
 */
import { inMemoryStore, MemoryAlert } from '../config/inMemoryDb.js';
import { logger } from '../utils/logger.js';
import { SentryService } from './sentry.service.js';

export type AlertType =
  | 'PAYMENT_WEBHOOK_FAILURE'
  | 'PAYMENT_GATEWAY_ERROR'
  | 'AUTH_ANOMALY'
  | 'UNHANDLED_EXCEPTION';

export interface AlertPayload {
  type: AlertType;
  severity: 'WARNING' | 'CRITICAL' | 'FATAL';
  message: string;
  metadata?: Record<string, any>;
}

// In-memory brute force / auth failure tracking: ip -> { count, lastAttempt }
const authFailureTracker = new Map<string, { count: number; lastAttempt: number }>();

export const AlertService = {
  /**
   * Primary dispatcher for all critical system alerts
   */
  async dispatch(alert: AlertPayload): Promise<MemoryAlert> {
    const alertId = `alt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: MemoryAlert = {
      id: alertId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metadata: alert.metadata,
      createdAt: new Date(),
    };

    // 1. Store in memory (retain last 100 alerts for admin query)
    inMemoryStore.alerts.unshift(record);
    if (inMemoryStore.alerts.length > 100) {
      inMemoryStore.alerts.pop();
    }

    // 2. Structured Log Output
    logger.criticalAlert({
      alertId,
      alertType: alert.type,
      severity: alert.severity.toLowerCase() as any,
      message: alert.message,
      metadata: alert.metadata,
    });

    // 3. Sentry Alert Dispatch
    SentryService.captureCriticalAlert(alert.type, alert.message, {
      alertId,
      severity: alert.severity,
      ...alert.metadata,
    });

    // 4. Optional Ops / Webhook Dispatch (Slack, Discord, PagerDuty, etc.)
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      this.sendWebhookNotification(webhookUrl, record).catch((err) => {
        logger.warn('[AlertService]: Failed to dispatch alert to webhook URL:', { error: err.message });
      });
    }

    return record;
  },

  /**
   * Critical Alert: Payment Webhook Failure
   */
  async triggerWebhookFailureAlert(params: {
    eventType?: string;
    error: string;
    sourceIp?: string;
    signatureReceived?: string;
  }): Promise<MemoryAlert> {
    return this.dispatch({
      type: 'PAYMENT_WEBHOOK_FAILURE',
      severity: 'CRITICAL',
      message: `Razorpay Webhook Error: ${params.error} (Event: "${params.eventType || 'unknown'}")`,
      metadata: {
        eventType: params.eventType,
        error: params.error,
        sourceIp: params.sourceIp,
        signatureSample: params.signatureReceived ? `${params.signatureReceived.slice(0, 10)}...` : undefined,
      },
    });
  },

  /**
   * Critical Alert: Payment Gateway Error
   */
  async triggerPaymentFailureAlert(params: {
    orderId?: string;
    paymentId?: string;
    userId?: string;
    error: string;
    amount?: number;
    currency?: string;
  }): Promise<MemoryAlert> {
    return this.dispatch({
      type: 'PAYMENT_GATEWAY_ERROR',
      severity: 'CRITICAL',
      message: `Payment Error on Order "${params.orderId || 'unknown'}": ${params.error}`,
      metadata: params,
    });
  },

  /**
   * Critical Alert: Auth Anomaly / Brute Force Protection
   */
  async recordAuthFailure(params: {
    email?: string;
    ip?: string;
    reason: string;
    userAgent?: string;
  }): Promise<MemoryAlert | null> {
    const key = params.ip || params.email || 'unknown';
    const now = Date.now();
    const existing = authFailureTracker.get(key) || { count: 0, lastAttempt: now };

    // Reset window after 15 minutes
    if (now - existing.lastAttempt > 15 * 60 * 1000) {
      existing.count = 0;
    }

    existing.count += 1;
    existing.lastAttempt = now;
    authFailureTracker.set(key, existing);

    // Alert if more than 5 failed attempts within window
    if (existing.count >= 5) {
      return this.dispatch({
        type: 'AUTH_ANOMALY',
        severity: 'CRITICAL',
        message: `High volume of authentication failures detected from ${key} (${existing.count} failed attempts)`,
        metadata: {
          identifier: key,
          failedAttempts: existing.count,
          lastReason: params.reason,
          email: params.email,
          ip: params.ip,
          userAgent: params.userAgent,
        },
      });
    }

    return null;
  },

  /**
   * Critical Alert: Unhandled Exception
   */
  async triggerUnhandledExceptionAlert(params: {
    route: string;
    method: string;
    error: string;
    stack?: string;
  }): Promise<MemoryAlert> {
    return this.dispatch({
      type: 'UNHANDLED_EXCEPTION',
      severity: 'FATAL',
      message: `Uncaught Server Exception in ${params.method} ${params.route}: ${params.error}`,
      metadata: params,
    });
  },

  /**
   * Dispatches payload to external alert webhook (Slack/Discord format compatible)
   */
  async sendWebhookNotification(url: string, alert: MemoryAlert): Promise<void> {
    try {
      const body = {
        text: `🚨 *[Ascend Alert: ${alert.severity}]* ${alert.message}`,
        attachments: [
          {
            color: alert.severity === 'FATAL' ? '#E11D48' : alert.severity === 'CRITICAL' ? '#DC2626' : '#F59E0B',
            fields: [
              { title: 'Alert ID', value: alert.id, short: true },
              { title: 'Type', value: alert.type, short: true },
              { title: 'Timestamp', value: alert.createdAt.toISOString(), short: false },
              { title: 'Metadata', value: JSON.stringify(alert.metadata || {}, null, 2), short: false },
            ],
          },
        ],
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      logger.warn('[AlertService]: Webhook post failed:', { error: err.message });
    }
  },

  /**
   * Retrieves all recent system alerts
   */
  getRecentAlerts(): MemoryAlert[] {
    return inMemoryStore.alerts;
  },
};

export default AlertService;
