import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { prisma } from './db.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback';

export const isGoogleOAuthConfigured = (): boolean => {
  return Boolean(
    GOOGLE_CLIENT_ID &&
      GOOGLE_CLIENT_SECRET &&
      !GOOGLE_CLIENT_ID.includes('your-google-client-id') &&
      !GOOGLE_CLIENT_SECRET.includes('your-google-client-secret')
  );
};

// Initialize Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID || 'dummy_client_id_unconfigured',
      clientSecret: GOOGLE_CLIENT_SECRET || 'dummy_client_secret_unconfigured',
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No verified email address returned by Google profile.'), false);
        }

        const fullName = profile.displayName || profile.name?.givenName || 'Ascend Member';
        const avatarUrl = profile.photos?.[0]?.value || null;
        const googleId = profile.id;

        // Query database for existing user matching email
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Create new user in PostgreSQL database
          user = await prisma.user.create({
            data: {
              email,
              fullName,
              avatarUrl,
              passwordHash: 'oauth_google_' + Math.random().toString(36).slice(2),
              role: 'BUYER',
            },
          });
        } else if (!user.avatarUrl && avatarUrl) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl },
          });
        }

        const authUser = {
          userId: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        };

        return done(null, authUser);
      } catch (err) {
        console.error('[Passport GoogleStrategy Error]:', err);
        return done(err, false);
      }
    }
  )
);

export default passport;
