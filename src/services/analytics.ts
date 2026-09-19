/**
 * Privacy-Respecting Analytics Service for Ascend / Universifit
 * 
 * Powered by PostHog with strict privacy guarantees:
 * - Cookieless / in-memory persistence by default (no persistent tracker cookies)
 * - Strict Respect for 'Do Not Track' (DNT) headers
 * - Autocapture disabled (no arbitrary DOM scraping or keystroke interception)
 * - PII scrubbing before dispatch (stripping passwords, cards, bearer tokens)
 * - Graceful fallback to local telemetry logging when offline or unconfigured
 * - Simultaneous relay of key conversion events to backend to power creator analytics
 */

let posthogInstance: any = null;

// Environment variables
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let isInitialized = false;

export interface CookieConsentPreferences {
  essential: boolean; // strictly necessary, always true
  analytics: boolean; // performance / route views
  functional: boolean; // preferences / audio / filters
  timestamp: string;
  version: string;
}

export const COOKIE_CONSENT_KEY = 'ascend_cookie_consent_v1';

export function getCookieConsent(): CookieConsentPreferences | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCookieConsent(prefs: Omit<CookieConsentPreferences, 'timestamp' | 'version'>): void {
  const full: CookieConsentPreferences = {
    ...prefs,
    essential: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(full));
  } catch {}

  window.dispatchEvent(new CustomEvent('cookie_consent_updated', { detail: full }));

  if (posthogInstance) {
    try {
      if (full.analytics) {
        posthogInstance.opt_in_capturing();
      } else {
        posthogInstance.opt_out_capturing();
      }
    } catch {}
  }
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent('open_cookie_preferences'));
}

/**
 * Initialize PostHog client with privacy-first configuration (dynamically imported)
 */
export async function initAnalytics(): Promise<void> {
  if (isInitialized) return;

  const consent = getCookieConsent();
  // If user has already explicitly rejected analytics, avoid initializing external tracking
  if (consent && !consent.analytics) {
    console.info('[Analytics]: Analytics opted out per user privacy preferences (Indian IT Rules / DPDP Act).');
    isInitialized = true;
    return;
  }

  if (POSTHOG_KEY && POSTHOG_KEY !== 'undefined') {
    try {
      const { default: posthog } = await import('posthog-js');
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Privacy-first settings:
        persistence: 'memory', // Cookieless: in-memory state only
        respect_dnt: true, // Honor browser Do Not Track
        autocapture: false, // Do NOT scrape random DOM elements or forms
        capture_pageview: false, // We trigger explicit, sanitized route views manually
        disable_session_recording: true, // Never record user screen/sessions
        sanitize_properties: (properties) => {
          // Deep scrub sensitive keys
          const cleaned: Record<string, any> = { ...properties };
          const forbiddenKeys = ['password', 'token', 'secret', 'cardNumber', 'cvv', 'creditCard'];
          for (const key of Object.keys(cleaned)) {
            if (forbiddenKeys.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
              delete cleaned[key];
            }
          }
          return cleaned;
        },
        loaded: () => {
          console.info('[Analytics]: Privacy-respecting PostHog analytics initialized.');
        },
      });
      posthogInstance = posthog;
      isInitialized = true;
    } catch (err) {
      console.warn('[Analytics]: Failed to initialize PostHog, falling back to local bus:', err);
    }
  } else {
    console.info('[Analytics]: VITE_POSTHOG_KEY not provided. Running in privacy local diagnostic mode.');
    isInitialized = true;
  }
}

/**
 * Asynchronously relays key business events to the backend telemetry engine
 * to power the Creator Analytics tab and real-time dashboard telemetry.
 */
async function relayToBackend(
  eventName: string,
  data: {
    creatorId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const token = localStorage.getItem('ascend_token') || sessionStorage.getItem('ascend_token');
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        eventName,
        creatorId: data.creatorId,
        userId: data.userId,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // Non-blocking telemetry delivery
    console.debug('[Analytics Backend Relay Notice]:', err);
  }
}

/**
 * Base event capture helper
 */
function capture(eventName: string, properties: Record<string, any> = {}): void {
  const sanitizedProps = {
    ...properties,
    timestamp: new Date().toISOString(),
    path: typeof window !== 'undefined' ? window.location.pathname : '',
  };

  if (POSTHOG_KEY && isInitialized && posthogInstance) {
    try {
      posthogInstance.capture(eventName, sanitizedProps);
    } catch (err) {
      console.debug('[Analytics PostHog Dispatch Failed]:', err);
    }
  } else {
    // Local diagnostic log
    if (import.meta.env.DEV) {
      console.debug(`[Analytics Local]: ${eventName}`, sanitizedProps);
    }
  }
}

// ==========================================
// CORE ANALYTICS TRACKING METHODS
// ==========================================

/**
 * 1. Track page view per route
 */
export function trackPageView(route: string, path?: string, properties: Record<string, any> = {}): void {
  const activePath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  capture('page_view', {
    route,
    path: activePath,
    ...properties,
  });

  // Also notify backend of route view
  relayToBackend('page_view', {
    metadata: { route, path: activePath, ...properties },
  });
}

/**
 * 2. Track user signup
 */
export function trackSignup(userId: string, role: string, method: string = 'email'): void {
  capture('signup', {
    userId,
    role,
    method,
  });

  // Identify in PostHog without storing PII
  if (POSTHOG_KEY && isInitialized && posthogInstance) {
    try {
      posthogInstance.identify(userId, { role });
    } catch (_e) {
      // Ignored
    }
  }

  relayToBackend('signup', {
    userId,
    metadata: { role, method },
  });
}

/**
 * 3. Track creator content publishing (course, offer, tier)
 */
export function trackCreatorPublish(
  creatorId: string,
  itemType: 'course' | 'offer' | 'tier',
  itemId: string,
  title: string
): void {
  capture('creator_publish', {
    creatorId,
    itemType,
    itemId,
    title,
  });

  relayToBackend('creator_publish', {
    creatorId,
    metadata: { itemType, itemId, title },
  });
}

/**
 * 4. Track checkout start
 */
export function trackCheckoutStart(
  offerId: string,
  amount: number,
  currency: string = 'USD',
  creatorId?: string
): void {
  capture('checkout_start', {
    offerId,
    amount,
    currency,
    creatorId,
  });

  relayToBackend('checkout_start', {
    creatorId,
    metadata: { offerId, amount, currency },
  });
}

/**
 * 5. Track checkout completion (purchase successful)
 */
export function trackCheckoutCompleted(
  orderId: string,
  offerId: string,
  amount: number,
  currency: string = 'USD',
  creatorId?: string
): void {
  capture('checkout_completed', {
    orderId,
    offerId,
    amount,
    currency,
    creatorId,
  });

  relayToBackend('checkout_completed', {
    creatorId,
    metadata: { orderId, offerId, amount, currency },
  });
}

/**
 * 6. Track course/program enrollment
 */
export function trackEnroll(
  userId: string,
  courseId: string,
  offerId?: string,
  creatorId?: string
): void {
  capture('enroll', {
    userId,
    courseId,
    offerId,
    creatorId,
  });

  relayToBackend('enroll', {
    creatorId,
    userId,
    metadata: { courseId, offerId },
  });
}

/**
 * 7. Track 1-on-1 coaching or event booking
 */
export function trackBook(
  userId: string,
  bookingId: string,
  creatorId?: string,
  slotTime?: string
): void {
  capture('book', {
    userId,
    bookingId,
    creatorId,
    slotTime,
  });

  relayToBackend('book', {
    creatorId,
    userId,
    metadata: { bookingId, slotTime },
  });
}

/**
 * 8. Track community membership join
 */
export function trackCommunityJoin(
  userId: string,
  creatorId: string,
  tierId: string
): void {
  capture('community_join', {
    userId,
    creatorId,
    tierId,
  });

  relayToBackend('community_join', {
    creatorId,
    userId,
    metadata: { tierId },
  });
}

/**
 * 9. Custom generic event tracking
 */
export function trackCustomEvent(eventName: string, properties: Record<string, any> = {}): void {
  capture(eventName, properties);
}

/**
 * Reset analytics state on user logout
 */
export function resetAnalytics(): void {
  if (POSTHOG_KEY && isInitialized && posthogInstance) {
    try {
      posthogInstance.reset();
    } catch (_e) {
      // Ignored
    }
  }
}
