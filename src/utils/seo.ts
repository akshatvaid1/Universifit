/**
 * SEO & Metadata Utility for Ascend
 * Dynamically updates document.title, meta tags (description, Open Graph, Twitter),
 * and canonical links across client-side page transitions.
 */

export interface PageMetadataOptions {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'profile' | 'article';
  canonicalUrl?: string;
}

/**
 * Updates or creates a <meta> tag with the specified attribute selector.
 */
function setMetaTag(attributeName: string, attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Updates or creates a <link rel="..."> tag in document.head.
 */
function setLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Primary SEO metadata updater.
 */
export function updatePageMetadata(options: PageMetadataOptions): void {
  const {
    title,
    description,
    ogImage = '/og-image.svg',
    ogType = 'website',
    canonicalUrl = window.location.origin + window.location.pathname,
  } = options;

  // 1. Browser Window & Tab Title
  document.title = title;

  // 2. Standard Search Engine Description
  setMetaTag('name', 'description', description);

  // 3. Open Graph (Facebook, WhatsApp, LinkedIn, iMessage)
  setMetaTag('property', 'og:site_name', 'Ascend');
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`);

  // 4. Twitter Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`);

  // 5. Canonical Link
  setLinkTag('canonical', canonicalUrl);
}

/**
 * Curated real copy per static / system route
 */
export const STATIC_ROUTE_METADATA: Record<string, PageMetadataOptions> = {
  home: {
    title: 'Ascend — Train, Look, and Feel Better | Vetted Coaching Platform',
    description:
      'Connect 1-on-1 with vetted practitioners in strength biomechanics, clinical metabolic nutrition, posture restoration, and longevity protocols.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  discover: {
    title: 'Discover Verified Coaches & Protocols | Ascend',
    description:
      'Browse vetted coaches across strength, hypertrophy, weight loss, posture reset, and metabolic optimization with transparent pricing and verified client outcomes.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  community: {
    title: 'Athletic Squads & Discussion Feed | Ascend Community',
    description:
      'Join daily PR celebrations, form audits, and evidence-based training discussions with certified coaches and committed athletes. Earn reputation points for constructive feedback.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  myspace: {
    title: 'My Space — Active Curriculums & Consultations | Ascend',
    description:
      'Track your enrolled strength protocols, upcoming 1-on-1 consultation video calls, form check feedback, and official receipt downloads.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  dashboard: {
    title: 'Creator Studio — Telemetry, Roster & Revenue | Ascend',
    description:
      'Monetize elite coaching on Ascend. Manage student rosters, 1-on-1 booking schedules, course syllabi, and instant Razorpay earnings transfers.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  checkout: {
    title: 'Secure 256-Bit Encrypted Checkout | Ascend',
    description:
      'Enroll in verified coaching protocols with complete buyer protection, 30-day money-back guarantee, and encrypted payments via Razorpay.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  auth: {
    title: 'Sign In or Join Ascend | Athlete & Coach Portal',
    description:
      'Sign in to access your coaching dashboard, curriculum modules, and private community circles with Google OAuth or email verification.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  'admin-creators': {
    title: 'Creator Verification Terminal | Ascend Admin',
    description:
      'Administrative review interface for vetting practitioner credentials, clinical certifications, and coaching track records.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  privacy: {
    title: 'Privacy & Biometric Data Security Policy | Ascend',
    description:
      'Transparent documentation on how Ascend collects, encrypts, and restricts member biometric telemetry, form check videos, and account credentials.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  terms: {
    title: 'Terms of Service & Creator Payout Agreement | Ascend',
    description:
      'Official terms governing coaching marketplace transactions, verified practitioner obligations, escrow payouts, and dispute resolution.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  'refund-policy': {
    title: 'Buyer Protection & 30-Day Refund Policy | Ascend',
    description:
      'Clear, risk-free buyer protection terms: 14-day consultation refund window, 30-day curriculum mastery guarantee, and dispute mediation.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  contact: {
    title: 'Concierge Support & Coach Inquiries | Ascend',
    description:
      'Get direct assistance from Ascend concierge: billing inquiries, practitioner application follow-ups, and platform support.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
};
