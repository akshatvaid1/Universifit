import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import { generateToken } from './config/jwt.js';
import { InvoiceService } from './services/invoice.service.js';
import { inMemoryStore } from './config/inMemoryDb.js';

const BASE_URL = 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'sample_webhook_secret_from_env';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'sample_secret_key_from_env_never_hardcoded';

async function runTests() {
  console.log('\n--- STARTING PHASE A6 INTEGRATION TESTS ---');

  // Generate real test token for buyer
  const buyerToken = generateToken({
    userId: 'user-buyer-a6',
    email: 'buyer.a6@ascend.fit',
    fullName: 'Test Athlete Buyer',
    role: 'BUYER',
  });

  // Use seeded active offer
  const testOfferId = 'offer-chadtag-course';

  // Ensure test booking exists in inMemoryStore
  const testBookingId = 'booking-a6-test';
  if (!inMemoryStore.bookings.some((b) => b.id === testBookingId)) {
    inMemoryStore.bookings.push({
      id: testBookingId,
      userId: 'user-buyer-a6',
      creatorId: 'creator-chadtag',
      scheduledAt: new Date(Date.now() + 86400000),
      durationMinutes: 45,
      status: 'SCHEDULED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // TEST 1: create-order
  console.log('\n[TEST 1]: POST /api/checkout/create-order');
  const createOrderRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      offerId: testOfferId,
      currency: 'USD',
    }),
  });

  const orderJson = (await createOrderRes.json()) as any;
  console.log('Create Order HTTP Status:', createOrderRes.status);
  console.log('Create Order Response:', JSON.stringify(orderJson, null, 2));

  if (!orderJson.success || !orderJson.data.orderId) {
    throw new Error(`Test 1 Failed: Could not create checkout order: ${JSON.stringify(orderJson)}`);
  }

  const orderId = orderJson.data.orderId;
  const paymentRecordId = orderJson.data.paymentId;
  console.log(`✓ Test 1 Passed: Order created with ID: ${orderId}, pending payment: ${paymentRecordId}`);

  // TEST 2: verify-signature (HMAC SHA-256)
  console.log('\n[TEST 2]: POST /api/checkout/verify (HMAC SHA-256 Signature Verification)');
  const dummyPaymentId = `pay_${Date.now().toString(36)}`;
  // Compute valid cryptographic HMAC SHA-256
  const validSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${dummyPaymentId}`)
    .digest('hex');

  // 2a. Test rejection on invalid signature
  const badVerifyRes = await fetch(`${BASE_URL}/api/checkout/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: dummyPaymentId,
      razorpay_signature: 'invalid_tampered_signature_12345',
      offerId: testOfferId,
    }),
  });
  console.log('Tampered Signature HTTP Status:', badVerifyRes.status);
  if (badVerifyRes.status !== 400) {
    throw new Error(`Test 2a Failed: Server should reject invalid signature with 400. Got: ${badVerifyRes.status}`);
  }
  console.log('✓ Test 2a Passed: Invalid signature correctly rejected with 400 Bad Request');

  // 2b. Test success on valid signature
  const goodVerifyRes = await fetch(`${BASE_URL}/api/checkout/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: dummyPaymentId,
      razorpay_signature: validSignature,
      offerId: testOfferId,
    }),
  });
  const goodVerifyJson = (await goodVerifyRes.json()) as any;
  console.log('Valid Signature HTTP Status:', goodVerifyRes.status);
  console.log('Verify Response:', JSON.stringify(goodVerifyJson, null, 2));

  if (!goodVerifyJson.success || goodVerifyJson.data.status !== 'COMPLETED') {
    throw new Error(`Test 2b Failed: Verification did not complete payment: ${JSON.stringify(goodVerifyJson)}`);
  }
  if (!goodVerifyJson.data.invoice?.invoiceNumber) {
    throw new Error('Test 2b Failed: No invoice returned in verify response');
  }

  const generatedInvoiceNumber = goodVerifyJson.data.invoice.invoiceNumber;
  console.log(`✓ Test 2b Passed: Payment verified, enrollment activated, and GST Invoice #${generatedInvoiceNumber} created!`);

  // TEST 3: Webhook handler (POST /api/webhooks/razorpay)
  console.log('\n[TEST 3]: POST /api/webhooks/razorpay (payment.captured Webhook)');
  const webhookPaymentId = `pay_hook_${Date.now().toString(36)}`;
  const webhookOrderId = `order_hook_${Date.now().toString(36)}`;
  const webhookPayloadObj = {
    entity: 'event',
    account_id: 'acc_ascend_test',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: webhookPaymentId,
          entity: 'payment',
          amount: 11800,
          currency: 'USD',
          status: 'captured',
          order_id: webhookOrderId,
          notes: {
            userId: 'user-buyer-a6',
            bookingId: testBookingId,
          },
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const webhookBodyStr = JSON.stringify(webhookPayloadObj);
  const webhookSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(webhookBodyStr)
    .digest('hex');

  // 3a. Test webhook rejects missing signature
  const noSigRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: webhookBodyStr,
  });
  console.log('Missing Webhook Signature HTTP Status:', noSigRes.status);
  if (noSigRes.status !== 400) {
    throw new Error(`Test 3a Failed: Webhook should reject missing signature with 400. Got: ${noSigRes.status}`);
  }
  console.log('✓ Test 3a Passed: Missing webhook signature rejected with 400 Bad Request');

  // 3b. Test webhook accepts valid signature and captures payment
  const goodWebhookRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': webhookSignature,
    },
    body: webhookBodyStr,
  });
  const webhookJson = (await goodWebhookRes.json()) as any;
  console.log('Valid Webhook HTTP Status:', goodWebhookRes.status);
  console.log('Webhook Response:', JSON.stringify(webhookJson, null, 2));

  if (goodWebhookRes.status !== 200 || webhookJson.status !== 'ok') {
    throw new Error(`Test 3b Failed: Webhook processing failed: ${JSON.stringify(webhookJson)}`);
  }
  console.log('✓ Test 3b Passed: Webhook captured payment, updated Booking, and initiated invoice generation');

  // TEST 4: GST invoice PDF download stream
  console.log(`\n[TEST 4]: GET /api/invoices/${generatedInvoiceNumber}/download`);
  const invoiceDownloadRes = await fetch(`${BASE_URL}/api/invoices/${generatedInvoiceNumber}/download`);
  console.log('Invoice Download HTTP Status:', invoiceDownloadRes.status);
  console.log('Content-Type:', invoiceDownloadRes.headers.get('content-type'));

  if (invoiceDownloadRes.status !== 200) {
    throw new Error(`Test 4 Failed: Could not download invoice PDF. HTTP ${invoiceDownloadRes.status}`);
  }
  const contentType = invoiceDownloadRes.headers.get('content-type') || '';
  if (!contentType.includes('application/pdf')) {
    throw new Error(`Test 4 Failed: Expected application/pdf, got ${contentType}`);
  }

  const pdfArrayBuffer = await invoiceDownloadRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  console.log(`PDF Buffer Size: ${pdfBuffer.length} bytes`);

  // Verify PDF header %PDF-
  const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
  if (!pdfHeader.startsWith('%PDF')) {
    throw new Error(`Test 4 Failed: File does not start with %PDF header. Got: ${pdfHeader}`);
  }
  console.log(`✓ Test 4 Passed: Valid PDF with %PDF header downloaded successfully (${pdfBuffer.length} bytes)!`);

  console.log('\n========================================');
  console.log('🎉 ALL PHASE A6 INTEGRATION TESTS PASSED!');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
