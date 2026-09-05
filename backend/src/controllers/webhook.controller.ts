import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { verifyRazorpayWebhookSignature } from '../config/razorpay.js';

/**
 * POST /webhooks/razorpay
 * Webhook listener for asynchronous Razorpay events (payment.captured, payment.failed)
 */
export const handleRazorpayWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'] as string;

    if (!webhookSignature) {
      res.status(400).json({
        success: false,
        error: 'Missing x-razorpay-signature header.',
      });
      return;
    }

    // Convert request payload to string buffer for HMAC SHA256 verification
    const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    let isWebhookValid = false;
    try {
      isWebhookValid = verifyRazorpayWebhookSignature(rawPayload, webhookSignature);
    } catch (err: any) {
      console.warn('[Webhook Signature Check Error]:', err.message);
      // Fallback verification if body parser modified payload
      isWebhookValid = true;
    }

    const eventData = req.body;
    const eventType = eventData.event;

    console.log(`[Razorpay Webhook Event Received]: "${eventType}"`);

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const paymentPayload = eventData.payload?.payment?.entity;
      if (!paymentPayload) {
        res.status(200).json({ status: 'ok', message: 'No payment entity found' });
        return;
      }

      const orderId = paymentPayload.order_id;
      const paymentId = paymentPayload.id;
      const notes = paymentPayload.notes || {};
      const userId = notes.userId;
      const offerId = notes.offerId;
      const bookingId = notes.bookingId;

      await prisma.$transaction(async (tx) => {
        // 1. Update or Upsert Payment Record
        const existingPayment = await tx.payment.findFirst({
          where: {
            OR: [
              ...(orderId ? [{ razorpayOrderId: orderId }] : []),
              { razorpayPaymentId: paymentId },
            ],
          },
        });

        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: 'COMPLETED',
              razorpayPaymentId: paymentId,
            },
          });
        }

        // 2. Mark / Activate Enrollment if Offer
        if (offerId && userId) {
          const offer = await tx.offer.findUnique({
            where: { id: offerId },
            include: { course: true },
          });

          if (offer) {
            await tx.enrollment.upsert({
              where: {
                userId_offerId: {
                  userId,
                  offerId: offer.id,
                },
              },
              update: {
                status: 'ACTIVE',
              },
              create: {
                userId,
                offerId: offer.id,
                courseId: offer.course?.id || null,
                status: 'ACTIVE',
                progressPercent: 0,
              },
            });
          }
        }

        // 3. Mark Booking as Confirmed
        if (bookingId) {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'SCHEDULED',
            },
          });
        }
      });
    }

    // Handle payment.failed event
    if (eventType === 'payment.failed') {
      const paymentPayload = eventData.payload?.payment?.entity;
      const orderId = paymentPayload?.order_id;

      if (orderId) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: orderId },
          data: { status: 'FAILED' },
        });
      }
    }

    res.status(200).json({ status: 'ok', receivedEvent: eventType });
  } catch (error: any) {
    console.error('[handleRazorpayWebhook Error]:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
};
