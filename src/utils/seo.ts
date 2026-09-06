/**
 * SEO & Metadata Utility for Universifit
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
 * Updates or creates a <script type="application/ld+json"> tag in document.head.
 */
export function setJsonLd(id: string, data: object | null): void {
  const scriptId = `jsonld-${id}`;
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data, null, 2);
}

/**
 * Injects Organization schema (online coaching marketplace, not LocalBusiness)
 */
export function setOrganizationSchema(): void {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://universifit.vercel.app';
  setJsonLd('organization', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Universifit',
    alternateName: 'Universifit Coaching Network',
    url: `${origin}/`,
    logo: `${origin}/favicon.svg`,
    description:
      'Vetted 1-on-1 coaching platform and athletic curriculum marketplace connecting athletes with verified practitioners in strength biomechanics, clinical metabolic nutrition, posture restoration, and longevity protocols.',
    email: 'support@universifit.com',
    sameAs: [
      'https://twitter.com/universifit',
      'https://instagram.com/universifit',
    ],
  });
}

export function clearOrganizationSchema(): void {
  setJsonLd('organization', null);
}

export interface CourseSchemaParams {
  id: string;
  title: string;
  description?: string;
  coachName?: string;
  price?: number | string;
  currency?: string;
  thumbnailUrl?: string;
}

/**
 * Injects Course schema for video syllabi and curriculums
 */
export function setCourseSchema(params: CourseSchemaParams): void {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://universifit.vercel.app';
  const {
    id,
    title,
    description = 'Evidence-based video curriculum and protocols on Universifit.',
    coachName = 'Verified Coach',
    price = 150,
    currency = 'USD',
    thumbnailUrl = `${origin}/og-image.svg`,
  } = params;

  setJsonLd('course', {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description,
    provider: {
      '@type': 'Organization',
      name: 'Universifit',
      sameAs: `${origin}/`,
    },
    instructor: {
      '@type': 'Person',
      name: coachName,
    },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      price: price.toString(),
      priceCurrency: currency,
      url: `${origin}/course/${encodeURIComponent(id)}`,
      availability: 'https://schema.org/InStock',
    },
    image: thumbnailUrl.startsWith('http') ? thumbnailUrl : `${origin}${thumbnailUrl}`,
    inLanguage: 'en',
    url: `${origin}/course/${encodeURIComponent(id)}`,
  });
}

export function clearCourseSchema(): void {
  setJsonLd('course', null);
}

export interface CreatorSchemaParams {
  id: string;
  fullName: string;
  handle: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  specialtyTags?: string[];
  rating?: number;
  totalReviews?: number;
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    discord?: string;
  };
}

/**
 * Injects Person & ProfessionalService schema for verified creator profiles (online, not LocalBusiness)
 */
export function setCreatorSchema(params: CreatorSchemaParams): void {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://universifit.vercel.app';
  const {
    fullName,
    handle,
    headline = 'Verified Coach',
    bio = 'Verified practitioner on Universifit coaching marketplace.',
    avatarUrl = `${origin}/og-image.svg`,
    specialtyTags = [],
    rating = 5.0,
    totalReviews = 1,
    socialLinks,
  } = params;

  const sameAs: string[] = [];
  if (socialLinks?.youtube) sameAs.push(socialLinks.youtube);
  if (socialLinks?.instagram) sameAs.push(socialLinks.instagram);
  if (socialLinks?.discord) sameAs.push(socialLinks.discord);

  setJsonLd('creator', {
    '@context': 'https://schema.org',
    '@type': ['Person', 'ProfessionalService'],
    name: fullName,
    alternateName: `@${handle}`,
    url: `${origin}/creator/${encodeURIComponent(handle || params.id)}`,
    image: avatarUrl.startsWith('http') ? avatarUrl : `${origin}${avatarUrl}`,
    jobTitle: headline,
    description: bio,
    knowsAbout: specialtyTags,
    worksFor: {
      '@type': 'Organization',
      name: 'Universifit',
      url: `${origin}/`,
    },
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating.toString(),
      reviewCount: Math.max(1, totalReviews).toString(),
      bestRating: '5',
      worstRating: '1',
    },
  });
}

export function clearCreatorSchema(): void {
  setJsonLd('creator', null);
}

/**
 * Builds dynamic Open Graph / Twitter share image URL for a coach profile
 */
export function getCreatorOgImageUrl(params: {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  headline?: string | null;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://universifit.vercel.app';
  const query = new URLSearchParams();
  if (params.fullName) query.set('name', params.fullName);
  if (params.avatarUrl) query.set('avatar', params.avatarUrl);
  if (params.headline) query.set('headline', params.headline);

  return `${origin}/api/og/creator/${encodeURIComponent(params.id || 'creator')}?${query.toString()}`;
}

/**
 * Builds dynamic Open Graph / Twitter share image URL for a course page
 */
export function getCourseOgImageUrl(params: {
  id: string;
  title: string;
  coachName?: string | null;
  coachAvatar?: string | null;
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://universifit.vercel.app';
  const query = new URLSearchParams();
  if (params.title) query.set('title', params.title);
  if (params.coachName) query.set('coach', params.coachName);
  if (params.coachAvatar) query.set('avatar', params.coachAvatar);

  return `${origin}/api/og/course/${encodeURIComponent(params.id || 'course')}?${query.toString()}`;
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
  setMetaTag('property', 'og:site_name', 'Universifit');
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
    title: 'Universifit — Train, Look, and Feel Better | Vetted Coaching Platform',
    description:
      'Connect 1-on-1 with vetted practitioners in strength biomechanics, clinical metabolic nutrition, posture restoration, and longevity protocols.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  discover: {
    title: 'Discover Verified Coaches & Protocols | Universifit',
    description:
      'Browse vetted coaches across strength, hypertrophy, weight loss, posture reset, and metabolic optimization with transparent pricing and verified client outcomes.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  community: {
    title: 'Athletic Squads & Discussion Feed | Universifit Community',
    description:
      'Join daily PR celebrations, form audits, and evidence-based training discussions with certified coaches and committed athletes. Earn reputation points for constructive feedback.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  myspace: {
    title: 'My Space — Active Curriculums & Consultations | Universifit',
    description:
      'Track your enrolled strength protocols, upcoming 1-on-1 consultation video calls, form check feedback, and official receipt downloads.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  dashboard: {
    title: 'Creator Studio — Telemetry, Roster & Revenue | Universifit',
    description:
      'Monetize elite coaching on Universifit. Manage student rosters, 1-on-1 booking schedules, course syllabi, and instant Razorpay earnings transfers.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  checkout: {
    title: 'Secure 256-Bit Encrypted Checkout | Universifit',
    description:
      'Enroll in verified coaching protocols with complete buyer protection, 30-day money-back guarantee, and encrypted payments via Razorpay.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  auth: {
    title: 'Sign In or Join Universifit | Athlete & Coach Portal',
    description:
      'Sign in to access your coaching dashboard, curriculum modules, and private community circles with Google OAuth or email verification.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  'admin-creators': {
    title: 'Creator Verification Terminal | Universifit Admin',
    description:
      'Administrative review interface for vetting practitioner credentials, clinical certifications, and coaching track records.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  privacy: {
    title: 'Privacy & Biometric Data Security Policy | Universifit',
    description:
      'Transparent documentation on how Universifit collects, encrypts, and restricts member biometric telemetry, form check videos, and account credentials.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  terms: {
    title: 'Terms of Service & Creator Payout Agreement | Universifit',
    description:
      'Official terms governing coaching marketplace transactions, verified practitioner obligations, escrow payouts, and dispute resolution.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  'refund-policy': {
    title: 'Buyer Protection & 30-Day Refund Policy | Universifit',
    description:
      'Clear, risk-free buyer protection terms: 14-day consultation refund window, 30-day curriculum mastery guarantee, and dispute mediation.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  contact: {
    title: 'Concierge Support & Coach Inquiries | Universifit',
    description:
      'Get direct assistance from Universifit concierge: billing inquiries, practitioner application follow-ups, and platform support.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  forbidden: {
    title: 'Access Restricted (403) | Universifit',
    description:
      'This area requires elevated coach or administrative permissions.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
  course: {
    title: 'Curriculum Video Classroom & Modules | Universifit',
    description:
      'Watch HD video training modules, download protocol spreadsheets, and submit weekly form checks to your verified coach on Universifit.',
    ogImage: '/og-image.svg',
    ogType: 'article',
  },
  notFound: {
    title: '404 — Page Not Found | Universifit',
    description:
      'The requested page, coaching profile, or curriculum could not be found on Universifit.',
    ogImage: '/og-image.svg',
    ogType: 'website',
  },
};
