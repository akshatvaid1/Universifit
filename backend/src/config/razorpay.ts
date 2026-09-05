import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

/**
 * Verifies Razorpay checkout signature for payment confirmation
 */
export const verifyRazorpayPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET environment variable is missing.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

/**
 * Verifies Razorpay webhook payload signature against RAZORPAY_WEBHOOK_SECRET
 */
export const verifyRazorpayWebhookSignature = (
  rawBody: string | Buffer,
  webhookSignature: string
): boolean => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET environment variable is missing.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === webhookSignature;
};
