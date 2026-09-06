import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';

const router = Router();

function escapeXml(unsafe?: string | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an SVG Open Graph / Twitter Card image for a Coach Profile
 */
export function generateCreatorOgSvg(data: {
  fullName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  specialties?: string[];
  rating?: number | string;
  totalClients?: number | string;
}): string {
  const name = escapeXml(data.fullName || 'Verified Coach');
  const headline = escapeXml(data.headline || 'Head Strength & Biomechanics Coach');
  const avatar = escapeXml(
    data.avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80'
  );
  const rating = escapeXml(String(data.rating || '4.99'));
  const clients = escapeXml(String(data.totalClients || '1,200+'));
  const specialties = (data.specialties && data.specialties.length > 0
    ? data.specialties.slice(0, 3)
    : ['Strength Biomechanics', 'Metabolic Protocols', 'Longevity']
  ).map((s) => escapeXml(s));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="#121315" />
  
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-opacity="0.025" stroke-width="1"/>
    </pattern>
    <radialGradient id="glow" cx="85%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#B8703F" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#B8703F" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#121315" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="bottomGlow" cx="20%" cy="85%" r="50%">
      <stop offset="0%" stop-color="#6E8B6F" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#121315" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="copperText" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E29A68" />
      <stop offset="50%" stop-color="#B8703F" />
      <stop offset="100%" stop-color="#8F5128" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#B8703F" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#6E8B6F" stop-opacity="0.3" />
    </linearGradient>
    <clipPath id="avatarClip">
      <rect width="200" height="200" rx="36" />
    </clipPath>
  </defs>

  <!-- Background Texture & Glows -->
  <rect width="1200" height="630" fill="url(#grid)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect width="1200" height="630" fill="url(#bottomGlow)" />

  <!-- Outer Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="28" stroke="url(#borderGrad)" stroke-width="2" />

  <!-- Top Bar: Brand Logo & Verified Pill -->
  <g transform="translate(80, 70)">
    <!-- Geometric 'U' Apex Glyph -->
    <rect width="50" height="50" rx="14" fill="#16171A" stroke="#B8703F" stroke-width="1.5" stroke-opacity="0.5" />
    <path d="M17 14V28C17 32.4 20.6 36 25 36C29.4 36 33 32.4 33 28V14" stroke="url(#copperText)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="25" cy="14" r="2.5" fill="#E29A68" />
    
    <!-- Brand Wordmark -->
    <text x="68" y="35" font-family="'Fraunces', Georgia, serif" font-size="32" font-weight="800" fill="#F7F4EF" letter-spacing="0.04em">UNIVERSIFIT</text>

    <!-- Verified Pill -->
    <rect x="330" y="8" width="190" height="34" rx="17" fill="#6E8B6F" fill-opacity="0.15" stroke="#6E8B6F" stroke-width="1" stroke-opacity="0.3" />
    <circle cx="348" cy="25" r="4" fill="#6E8B6F" />
    <text x="360" y="30" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#6E8B6F" letter-spacing="0.06em">VERIFIED PRACTITIONER</text>
  </g>

  <!-- Creator Dossier Section -->
  <g transform="translate(80, 170)">
    <!-- Creator Photo Frame -->
    <g transform="translate(0, 10)">
      <rect width="206" height="206" rx="39" fill="#16171A" stroke="#B8703F" stroke-width="3" stroke-opacity="0.6" />
      <g transform="translate(3, 3)" clip-path="url(#avatarClip)">
        <image href="${avatar}" width="200" height="200" preserveAspectRatio="xMidYMid slice" />
      </g>
      <!-- Shield Check -->
      <circle cx="186" cy="186" r="18" fill="#6E8B6F" />
      <path d="M179 186L184 191L193 181" stroke="#121315" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- Creator Info Right -->
    <g transform="translate(240, 25)">
      <!-- Name -->
      <text x="0" y="44" font-family="'Fraunces', Georgia, serif" font-size="48" font-weight="800" fill="#F7F4EF" letter-spacing="-0.02em">
        ${name}
      </text>

      <!-- Headline -->
      <text x="0" y="90" font-family="'Inter', sans-serif" font-size="22" font-weight="600" fill="url(#copperText)">
        ${headline}
      </text>

      <!-- Specialties Row -->
      <g transform="translate(0, 125)">
        ${specialties
          .map(
            (spec, idx) => `
        <g transform="translate(${idx * 210}, 0)">
          <rect width="195" height="38" rx="19" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>
          <text x="97" y="24" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#F7F4EF" fill-opacity="0.9" text-anchor="middle">${spec}</text>
        </g>`
          )
          .join('')}
      </g>
    </g>
  </g>

  <!-- Bottom Metric Bar -->
  <g transform="translate(80, 528)">
    <text x="0" y="22" font-family="'Inter', monospace" font-size="15" font-weight="700" fill="#E29A68">
      ★ ${rating} RATING
    </text>
    <text x="180" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="500" fill="#ffffff" fill-opacity="0.35">|</text>
    <text x="205" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#F7F4EF" fill-opacity="0.85">
      ${clients} Athletes Coached
    </text>
    <text x="450" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="500" fill="#ffffff" fill-opacity="0.35">|</text>
    <text x="475" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#6E8B6F">
      1-on-1 Consultations &amp; Custom Splits
    </text>

    <text x="1040" y="22" font-family="'Inter', sans-serif" font-size="16" font-weight="700" fill="#F7F4EF" fill-opacity="0.9" text-anchor="end">
      universifit.vercel.app
    </text>
  </g>
</svg>`;
}

/**
 * Generates an SVG Open Graph / Twitter Card image for a Course Syllabus Page
 */
export function generateCourseOgSvg(data: {
  title: string;
  coachName?: string | null;
  coachAvatar?: string | null;
  lessonsCount?: number | string;
  price?: number | string;
}): string {
  const title = escapeXml(data.title || 'Athletic Mastery Curriculum');
  const coachName = escapeXml(data.coachName || 'Verified Coach');
  const coachAvatar = escapeXml(
    data.coachAvatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80'
  );
  const lessons = escapeXml(String(data.lessonsCount || '12'));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="#121315" />
  
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-opacity="0.025" stroke-width="1"/>
    </pattern>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#B8703F" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#B8703F" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#121315" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="bottomGlow" cx="20%" cy="85%" r="50%">
      <stop offset="0%" stop-color="#6E8B6F" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#121315" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="copperText" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E29A68" />
      <stop offset="50%" stop-color="#B8703F" />
      <stop offset="100%" stop-color="#8F5128" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#B8703F" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#6E8B6F" stop-opacity="0.3" />
    </linearGradient>
    <clipPath id="coachClip">
      <circle cx="28" cy="28" r="28" />
    </clipPath>
  </defs>

  <!-- Background Texture & Glows -->
  <rect width="1200" height="630" fill="url(#grid)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect width="1200" height="630" fill="url(#bottomGlow)" />

  <!-- Outer Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="28" stroke="url(#borderGrad)" stroke-width="2" />

  <!-- Top Bar: Brand Logo & Course Pill -->
  <g transform="translate(80, 70)">
    <!-- Geometric 'U' Apex Glyph -->
    <rect width="50" height="50" rx="14" fill="#16171A" stroke="#B8703F" stroke-width="1.5" stroke-opacity="0.5" />
    <path d="M17 14V28C17 32.4 20.6 36 25 36C29.4 36 33 32.4 33 28V14" stroke="url(#copperText)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="25" cy="14" r="2.5" fill="#E29A68" />
    
    <!-- Wordmark -->
    <text x="68" y="35" font-family="'Fraunces', Georgia, serif" font-size="32" font-weight="800" fill="#F7F4EF" letter-spacing="0.04em">UNIVERSIFIT</text>

    <!-- Curriculum Pill -->
    <rect x="330" y="8" width="200" height="34" rx="17" fill="#B8703F" fill-opacity="0.15" stroke="#B8703F" stroke-width="1" stroke-opacity="0.4" />
    <circle cx="348" cy="25" r="4" fill="#E29A68" />
    <text x="360" y="30" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#E29A68" letter-spacing="0.06em">VERIFIED CURRICULUM</text>
  </g>

  <!-- Course Headline & Details -->
  <g transform="translate(80, 180)">
    <!-- Course Title -->
    <text x="0" y="50" font-family="'Fraunces', Georgia, serif" font-size="52" font-weight="800" fill="#F7F4EF" letter-spacing="-0.02em">
      ${title}
    </text>

    <!-- Coach Info Strip -->
    <g transform="translate(0, 95)">
      <g clip-path="url(#coachClip)">
        <image href="${coachAvatar}" width="56" height="56" preserveAspectRatio="xMidYMid slice" />
      </g>
      <circle cx="28" cy="28" r="28" fill="none" stroke="#B8703F" stroke-width="2" stroke-opacity="0.6"/>
      
      <text x="74" y="24" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#F7F4EF" fill-opacity="0.6" letter-spacing="0.05em">
        INSTRUCTED BY
      </text>
      <text x="74" y="47" font-family="'Inter', sans-serif" font-size="20" font-weight="700" fill="#F7F4EF">
        Coach ${coachName}
      </text>
    </g>

    <!-- Curriculum Features Chips -->
    <g transform="translate(0, 195)">
      <!-- Chip 1: HD Modules -->
      <rect x="0" y="0" width="210" height="42" rx="21" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
      <text x="105" y="26" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#F7F4EF" text-anchor="middle">🎥 ${lessons} HD Video Modules</text>

      <!-- Chip 2: Biomechanics -->
      <rect x="226" y="0" width="230" height="42" rx="21" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
      <text x="341" y="26" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#F7F4EF" text-anchor="middle">📊 Biomechanics Protocols</text>

      <!-- Chip 3: Form Checks -->
      <rect x="472" y="0" width="200" height="42" rx="21" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
      <text x="572" y="26" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#F7F4EF" text-anchor="middle">💬 Weekly Form Checks</text>
    </g>
  </g>

  <!-- Bottom Metric Bar -->
  <g transform="translate(80, 528)">
    <text x="0" y="22" font-family="'Inter', monospace" font-size="15" font-weight="700" fill="#6E8B6F">
      ✓ 30-DAY SATISFACTION GUARANTEE
    </text>
    <text x="330" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="500" fill="#ffffff" fill-opacity="0.35">|</text>
    <text x="355" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#F7F4EF" fill-opacity="0.85">
      Lifetime Curriculum Access
    </text>
    <text x="600" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="500" fill="#ffffff" fill-opacity="0.35">|</text>
    <text x="625" y="22" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#E29A68">
      Certificate of Mastery
    </text>

    <text x="1040" y="22" font-family="'Inter', sans-serif" font-size="16" font-weight="700" fill="#F7F4EF" fill-opacity="0.9" text-anchor="end">
      universifit.vercel.app
    </text>
  </g>
</svg>`;
}

/**
 * GET /api/og/creator/:id or /og/creator/:id
 */
router.get(['/og/creator/:id', '/api/og/creator/:id'], async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const { name, avatar, headline } = req.query as Record<string, string>;

    let creator: any = null;
    try {
      creator = await prisma.creatorProfile.findFirst({
        where: {
          OR: [{ id }, { handle: id }],
        },
        include: { user: true },
      });
    } catch (_e) {}

    if (!creator) {
      const mem = inMemoryStore.creatorProfiles.find(
        (c) => c.id === id || c.handle.toLowerCase() === id.toLowerCase()
      );
      if (mem) {
        const user = inMemoryStore.users.find((u) => u.id === mem.userId);
        creator = {
          fullName: user?.fullName || mem.handle,
          avatarUrl: user?.avatarUrl,
          headline: mem.headline,
          specialtyTags: mem.specialtyTags,
          rating: mem.rating,
          totalClients: mem.totalClients,
        };
      }
    }

    const svg = generateCreatorOgSvg({
      fullName: name || creator?.fullName || creator?.user?.fullName || id,
      avatarUrl: avatar || creator?.avatarUrl || creator?.user?.avatarUrl,
      headline: headline || creator?.headline || 'Verified Coaching Specialist',
      specialties: creator?.specialtyTags,
      rating: creator?.rating,
      totalClients: creator?.totalClients,
    });

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(svg);
  } catch (err) {
    console.error('[OG Creator Error]:', err);
    res.status(500).send('<svg><text>OG Generation Error</text></svg>');
  }
});

/**
 * GET /api/og/course/:id or /og/course/:id
 */
router.get(['/og/course/:id', '/api/og/course/:id'], async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const { title, coach, avatar } = req.query as Record<string, string>;

    let course: any = null;
    try {
      course = await prisma.course.findUnique({
        where: { id },
        include: { lessons: true, creator: { include: { user: true } } },
      });
    } catch (_e) {}

    if (!course) {
      const mem = inMemoryStore.courses.find((c) => c.id === id);
      if (mem) {
        const creatorProfile = inMemoryStore.creatorProfiles.find((cp) => cp.id === mem.creatorId);
        const creatorUser = creatorProfile
          ? inMemoryStore.users.find((u) => u.id === creatorProfile.userId)
          : null;
        const lessonList = inMemoryStore.lessons.filter((l) => l.courseId === mem.id);
        course = {
          title: mem.title,
          coachName: creatorUser?.fullName || 'Verified Coach',
          coachAvatar: creatorUser?.avatarUrl,
          lessons: lessonList,
          price: 150,
        };
      }
    }

    const svg = generateCourseOgSvg({
      title: title || course?.title || 'Athletic Mastery Curriculum',
      coachName: coach || course?.coachName || course?.creator?.user?.fullName || 'Verified Coach',
      coachAvatar: avatar || course?.coachAvatar || course?.creator?.user?.avatarUrl,
      lessonsCount: course?.lessons?.length || 12,
      price: course?.price || 150,
    });

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(svg);
  } catch (err) {
    console.error('[OG Course Error]:', err);
    res.status(500).send('<svg><text>OG Generation Error</text></svg>');
  }
});

/**
 * Universal query-based generator: GET /api/og?type=creator|course|home
 */
router.get(['/og', '/api/og'], async (req: Request, res: Response) => {
  try {
    const { type, name, title, avatar, headline, coach, lessons, rating, clients } = req.query as Record<
      string,
      string
    >;

    if (type === 'course') {
      const svg = generateCourseOgSvg({
        title: title || 'Athletic Mastery Curriculum',
        coachName: coach || 'Verified Coach',
        coachAvatar: avatar,
        lessonsCount: lessons || 12,
      });
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(svg);
    }

    if (type === 'creator') {
      const svg = generateCreatorOgSvg({
        fullName: name || 'Verified Coach',
        avatarUrl: avatar,
        headline: headline || 'Head Strength & Biomechanics Coach',
        rating: rating || 4.99,
        totalClients: clients || '1,200+',
      });
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(svg);
    }

    // Default: Return Creator / General OG
    const svg = generateCreatorOgSvg({
      fullName: name || 'Universifit Coaching Network',
      headline: headline || 'Train, Look, and Feel Better — Guided by Vetted Elite Coaches',
      avatarUrl: avatar,
    });
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(svg);
  } catch (err) {
    res.status(500).send('<svg><text>OG Error</text></svg>');
  }
});

export default router;
