import { Router, Request, Response, NextFunction } from 'express';
import passport, { isGoogleOAuthConfigured } from '../config/passport.js';
import {
  register,
  login,
  getMe,
  googleCallbackHandler,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Rate limiting on all authentication routes (brute-force protection)
router.use(authRateLimiter);

// Standard Password Registration & Login
router.post('/register', register);
router.post('/login', login);

// Password Recovery & Reset Flow (F18)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Email Verification Flow (F18)
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Session Verification
router.get('/me', authenticateJWT, getMe);

// Initiate Google OAuth 2.0 Flow
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (!isGoogleOAuthConfigured()) {
    res.status(503).json({
      success: false,
      error:
        'Google OAuth credentials are not configured on the server. Please define GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.',
    });
    return;
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});

// Google OAuth 2.0 Callback
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    if (!isGoogleOAuthConfigured()) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(
        `${frontendUrl}/#auth_error=${encodeURIComponent(
          'Google OAuth is not configured in backend/.env'
        )}`
      );
      return;
    }

    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#auth_error=google_auth_failed`,
    })(req, res, next);
  },
  googleCallbackHandler
);

export default router;
