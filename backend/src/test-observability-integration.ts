/**
 * Integration Test: Sentry Error Tracking, Winston Structured Logging & Critical Alerts
 */
import { logger } from './utils/logger.js';
import { AlertService } from './services/alert.service.js';
import { SentryService } from './services/sentry.service.js';
import { inMemoryStore } from './config/inMemoryDb.js';

async function runObservabilityTests() {
  console.log('=== [START]: Testing Observability, Logging, Sentry & Alerts ===\n');

  // 1. Test Winston Structured Logging
  console.log('--- Test 1: Winston Structured Event Logging ---');
  logger.info('System test starting...', { test: 'observability_suite' });

  logger.paymentAttempt({
    orderId: 'order_test_obs_123',
    userId: 'user-test-obs',
    amount: 149.00,
    currency: 'USD',
    offerId: 'offer-chadtag-1on1',
  });

  logger.paymentSuccess({
    paymentId: 'pay_test_obs_456',
    orderId: 'order_test_obs_123',
    userId: 'user-test-obs',
    amount: 149.00,
    currency: 'USD',
  });

  logger.paymentFailure({
    orderId: 'order_test_obs_fail',
    userId: 'user-test-obs',
    error: 'card_declined_insufficient_funds',
    amount: 149.00,
  });

  logger.authSuccess({
    userId: 'user-chadtag',
    email: 'chadtag@ascend.io',
    role: 'CREATOR',
    method: 'password',
    ip: '127.0.0.1',
  });

  logger.authFailure({
    email: 'intruder@badactor.io',
    reason: 'invalid_password',
    ip: '198.51.100.42',
  });

  console.log('✓ [Test 1 Passed]: Structured event methods executed without error.\n');

  // 2. Test Sentry Service APIs
  console.log('--- Test 2: Sentry Service Wrapper APIs ---');
  SentryService.init(); // runs in mock/diagnostic mode if DSN is not set

  const sentryMsg = SentryService.captureMessage('Diagnostic telemetry event', 'info', {
    component: 'test_suite',
  });

  const testError = new Error('Simulated handled test error for Sentry');
  const sentryErr = SentryService.captureException(testError, {
    simulated: true,
  });

  console.log(`✓ [Test 2 Passed]: SentryService APIs safely handled (isAvailable: ${SentryService.isAvailable()}).\n`);

  // 3. Test Critical Failure Alert: Payment Webhook Failure
  console.log('--- Test 3: Critical Alert - Payment Webhook Failure ---');
  const webhookAlert = await AlertService.triggerWebhookFailureAlert({
    eventType: 'payment.captured',
    error: 'Invalid HMAC SHA256 cryptographic signature header',
    sourceIp: '203.0.113.195',
    signatureReceived: 'bad_signature_abc123',
  });

  if (!webhookAlert || webhookAlert.type !== 'PAYMENT_WEBHOOK_FAILURE' || webhookAlert.severity !== 'CRITICAL') {
    throw new Error('Failed to record PAYMENT_WEBHOOK_FAILURE alert');
  }
  console.log(`✓ [Test 3 Passed]: Webhook failure alert created with ID "${webhookAlert.id}".\n`);

  // 4. Test Critical Failure Alert: Payment Gateway Error
  console.log('--- Test 4: Critical Alert - Payment Gateway Failure ---');
  const paymentAlert = await AlertService.triggerPaymentFailureAlert({
    orderId: 'order_corrupt_999',
    userId: 'user-buyer-1',
    error: 'Razorpay Orders API gateway 502 Bad Gateway timeout',
    amount: 29.00,
    currency: 'USD',
  });

  if (!paymentAlert || paymentAlert.type !== 'PAYMENT_GATEWAY_ERROR') {
    throw new Error('Failed to record PAYMENT_GATEWAY_ERROR alert');
  }
  console.log(`✓ [Test 4 Passed]: Payment failure alert created with ID "${paymentAlert.id}".\n`);

  // 5. Test Critical Alert: Auth Anomaly (Brute-Force Tracker)
  console.log('--- Test 5: Critical Alert - Auth Anomaly Detection (5 Failures) ---');
  const bruteForceIp = '198.51.100.99';
  let triggeredAlert: any = null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await AlertService.recordAuthFailure({
      email: 'target_account@ascend.fit',
      ip: bruteForceIp,
      reason: 'invalid_password',
      userAgent: 'Mozilla/5.0 (Automated Test Bot)',
    });
    if (res) {
      triggeredAlert = res;
    }
  }

  if (!triggeredAlert || triggeredAlert.type !== 'AUTH_ANOMALY') {
    throw new Error('Failed to trigger AUTH_ANOMALY alert after 5 consecutive failures');
  }
  console.log(`✓ [Test 5 Passed]: Auth anomaly alert triggered: "${triggeredAlert.message}".\n`);

  // 6. Test InMemoryStore Alert Persistence & Query
  console.log('--- Test 6: In-Memory Alert Store & Admin Query ---');
  const recentAlerts = AlertService.getRecentAlerts();
  console.log(`Total active alerts in store: ${recentAlerts.length}`);

  if (recentAlerts.length < 3) {
    throw new Error(`Expected at least 3 alerts, found ${recentAlerts.length}`);
  }

  const alertTypes = recentAlerts.map((a) => a.type);
  if (
    !alertTypes.includes('PAYMENT_WEBHOOK_FAILURE') ||
    !alertTypes.includes('PAYMENT_GATEWAY_ERROR') ||
    !alertTypes.includes('AUTH_ANOMALY')
  ) {
    throw new Error('Alert store missing expected alert types');
  }
  console.log('✓ [Test 6 Passed]: All alert types verified in store.\n');

  console.log('=== [COMPLETED]: All Observability, Logging, Sentry & Alerting Tests Passed Successfully! ===');
}

runObservabilityTests().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
