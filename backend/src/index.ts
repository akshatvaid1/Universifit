import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import creatorRoutes from './routes/creator.routes.js';
import offerRoutes from './routes/offer.routes.js';
import discoverRoutes from './routes/discover.routes.js';
import courseRoutes from './routes/course.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import supportRoutes from './routes/support.routes.js';
import searchRoutes from './routes/search.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import referralRoutes from './routes/referral.routes.js';
import eventRoutes from './routes/event.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import passport from './config/passport.js';
import prisma from './config/db.js';
import { CronService } from './services/cron.service.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Support JSON & URL-encoded parsing for standard requests & webhooks
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport Middleware
app.use(passport.initialize());

// Comprehensive Health-Check Endpoints (/api/health and /health)
const healthHandler = async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  let dbLatencyMs: number | undefined = undefined;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (_err) {
    dbStatus = 'disconnected';
  }

  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    service: 'Ascend REST API Backend',
    database: {
      status: dbStatus,
      ...(dbLatencyMs !== undefined ? { latencyMs: dbLatencyMs } : {}),
    },
    memory: {
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    },
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// REST Routes Mounts
app.use('/auth', authRoutes);
app.use('/creators', creatorRoutes);
app.use('/offers', offerRoutes);
app.use('/discover', discoverRoutes);
app.use('/courses', courseRoutes);
app.use('/lessons', lessonRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/community', postRoutes);
app.use('/bookings', bookingRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/admin', adminRoutes);
app.use('/messages', messageRoutes);
app.use('/reviews', reviewRoutes);
app.use('/notifications', notificationRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/support', supportRoutes);
app.use('/search', searchRoutes);
app.use('/coupons', couponRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/certificates', certificateRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/referrals', referralRoutes);
app.use('/events', eventRoutes);
app.use('/membership', membershipRoutes);

// API Prefix Mounts
app.use('/api/auth', authRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/community', postRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/membership', membershipRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

export default app;
export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ [Ascend Backend]: REST API server is listening at http://localhost:${PORT}`);
    CronService.start();
  });
}
