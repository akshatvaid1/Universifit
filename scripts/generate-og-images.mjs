/**
 * Build-time Open Graph Share Image Generator
 * Generates static, high-resolution 1200x630 vector share graphics for all verified creators and published courses.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_OG_DIR = path.join(ROOT_DIR, 'public', 'og');
const CREATORS_OG_DIR = path.join(PUBLIC_OG_DIR, 'creators');
const COURSES_OG_DIR = path.join(PUBLIC_OG_DIR, 'courses');

fs.mkdirSync(CREATORS_OG_DIR, { recursive: true });
fs.mkdirSync(COURSES_OG_DIR, { recursive: true });

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderCreatorSvg({ fullName, avatarUrl, headline, specialties, rating, totalClients }) {
  const name = escapeXml(fullName);
  const head = escapeXml(headline || 'Verified Coaching Specialist');
  const avatar = escapeXml(avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80');
  const rate = escapeXml(String(rating || '4.99'));
  const clients = escapeXml(String(totalClients || '1,200+'));
  const specs = (specialties || ['Strength Biomechanics', 'Metabolic Protocols', 'Longevity']).slice(0, 3).map(escapeXml);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
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

  <rect width="1200" height="630" fill="url(#grid)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect width="1200" height="630" fill="url(#bottomGlow)" />
  <rect x="24" y="24" width="1152" height="582" rx="28" stroke="url(#borderGrad)" stroke-width="2" />

  <g transform="translate(80, 70)">
    <rect width="50" height="50" rx="14" fill="#16171A" stroke="#B8703F" stroke-width="1.5" stroke-opacity="0.5" />
    <path d="M17 14V28C17 32.4 20.6 36 25 36C29.4 36 33 32.4 33 28V14" stroke="url(#copperText)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="25" cy="14" r="2.5" fill="#E29A68" />
    <text x="68" y="35" font-family="'Fraunces', Georgia, serif" font-size="32" font-weight="800" fill="#F7F4EF" letter-spacing="0.04em">UNIVERSIFIT</text>
    <rect x="330" y="8" width="190" height="34" rx="17" fill="#6E8B6F" fill-opacity="0.15" stroke="#6E8B6F" stroke-width="1" stroke-opacity="0.3" />
    <circle cx="348" cy="25" r="4" fill="#6E8B6F" />
    <text x="360" y="30" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#6E8B6F" letter-spacing="0.06em">VERIFIED PRACTITIONER</text>
  </g>

  <g transform="translate(80, 170)">
    <g transform="translate(0, 10)">
      <rect width="206" height="206" rx="39" fill="#16171A" stroke="#B8703F" stroke-width="3" stroke-opacity="0.6" />
      <g transform="translate(3, 3)" clip-path="url(#avatarClip)">
        <image href="${avatar}" width="200" height="200" preserveAspectRatio="xMidYMid slice" />
      </g>
      <circle cx="186" cy="186" r="18" fill="#6E8B6F" />
      <path d="M179 186L184 191L193 181" stroke="#121315" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <g transform="translate(240, 25)">
      <text x="0" y="44" font-family="'Fraunces', Georgia, serif" font-size="48" font-weight="800" fill="#F7F4EF" letter-spacing="-0.02em">
        ${name}
      </text>
      <text x="0" y="90" font-family="'Inter', sans-serif" font-size="22" font-weight="600" fill="url(#copperText)">
        ${head}
      </text>
      <g transform="translate(0, 125)">
        ${specs.map((s, i) => `
        <g transform="translate(${i * 210}, 0)">
          <rect width="195" height="38" rx="19" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>
          <text x="97" y="24" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#F7F4EF" fill-opacity="0.9" text-anchor="middle">${s}</text>
        </g>`).join('')}
      </g>
    </g>
  </g>

  <g transform="translate(80, 528)">
    <text x="0" y="22" font-family="'Inter', monospace" font-size="15" font-weight="700" fill="#E29A68">
      ★ ${rate} RATING
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

function renderCourseSvg({ title, coachName, coachAvatar, lessonsCount }) {
  const t = escapeXml(title);
  const coach = escapeXml(coachName || 'Verified Coach');
  const avatar = escapeXml(coachAvatar || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80');
  const lessons = escapeXml(String(lessonsCount || 12));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
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

  <rect width="1200" height="630" fill="url(#grid)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect width="1200" height="630" fill="url(#bottomGlow)" />
  <rect x="24" y="24" width="1152" height="582" rx="28" stroke="url(#borderGrad)" stroke-width="2" />

  <g transform="translate(80, 70)">
    <rect width="50" height="50" rx="14" fill="#16171A" stroke="#B8703F" stroke-width="1.5" stroke-opacity="0.5" />
    <path d="M17 14V28C17 32.4 20.6 36 25 36C29.4 36 33 32.4 33 28V14" stroke="url(#copperText)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="25" cy="14" r="2.5" fill="#E29A68" />
    <text x="68" y="35" font-family="'Fraunces', Georgia, serif" font-size="32" font-weight="800" fill="#F7F4EF" letter-spacing="0.04em">UNIVERSIFIT</text>
    <rect x="330" y="8" width="200" height="34" rx="17" fill="#B8703F" fill-opacity="0.15" stroke="#B8703F" stroke-width="1" stroke-opacity="0.4" />
    <circle cx="348" cy="25" r="4" fill="#E29A68" />
    <text x="360" y="30" font-family="'Inter', sans-serif" font-size="12" font-weight="700" fill="#E29A68" letter-spacing="0.06em">VERIFIED CURRICULUM</text>
  </g>

  <g transform="translate(80, 180)">
    <text x="0" y="50" font-family="'Fraunces', Georgia, serif" font-size="52" font-weight="800" fill="#F7F4EF" letter-spacing="-0.02em">
      ${t}
    </text>

    <g transform="translate(0, 95)">
      <g clip-path="url(#coachClip)">
        <image href="${avatar}" width="56" height="56" preserveAspectRatio="xMidYMid slice" />
      </g>
      <circle cx="28" cy="28" r="28" fill="none" stroke="#B8703F" stroke-width="2" stroke-opacity="0.6"/>
      <text x="74" y="24" font-family="'Inter', sans-serif" font-size="13" font-weight="600" fill="#F7F4EF" fill-opacity="0.6" letter-spacing="0.05em">
        INSTRUCTED BY
      </text>
      <text x="74" y="47" font-family="'Inter', sans-serif" font-size="20" font-weight="700" fill="#F7F4EF">
        Coach ${coach}
      </text>
    </g>

    <g transform="translate(0, 195)">
      <rect x="0" y="0" width="210" height="42" rx="21" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
      <text x="105" y="26" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#F7F4EF" text-anchor="middle">🎥 ${lessons} HD Video Modules</text>

      <rect x="226" y="0" width="230" height="42" rx="21" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
      <text x="341" y="26" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#F7F4EF" text-anchor="middle">📊 Biomechanics Protocols</text>

      <rect x="472" y="0" width="200" height="42" rx="21" fill="#16171A" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1" />
      <text x="572" y="26" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#F7F4EF" text-anchor="middle">💬 Weekly Form Checks</text>
    </g>
  </g>

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

const seedCreators = [
  {
    slug: 'marcus-vance',
    handles: ['marcus-vance', 'marcus.vance', 'creator-1'],
    fullName: 'Marcus Vance',
    headline: 'Head Strength & Biomechanics Coach',
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&auto=format&fit=crop&q=80',
    specialties: ['Squat Mechanics', 'Deadlift Biomechanics', 'Hypertrophy'],
    rating: '4.99',
    totalClients: '1,420+',
  },
  {
    slug: 'chadtag',
    handles: ['chadtag', 'creator-chadtag'],
    fullName: 'Chad Tagemb',
    headline: 'Elite Powerlifting & Posture Restoration Coach',
    avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=900&auto=format&fit=crop&q=80',
    specialties: ['Powerlifting', 'Core Restoration', 'Injury Prevention'],
    rating: '4.99',
    totalClients: '1,850+',
  },
  {
    slug: 'elena-rostova',
    handles: ['elena-rostova', 'dr.elena.metabolism', 'creator-2'],
    fullName: 'Dr. Elena Rostova',
    headline: 'Clinical Metabolic Nutritionist & Longevity Scientist',
    avatarUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=900&auto=format&fit=crop&q=80',
    specialties: ['Metabolic Health', 'Fat Loss Biology', 'Blood Work Audits'],
    rating: '4.98',
    totalClients: '920+',
  },
  {
    slug: 'kai-greene',
    handles: ['kai-greene', 'kai.mobility', 'creator-3'],
    fullName: 'Kai Greene',
    headline: 'Master Hypertrophy & Positional Posing Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=900&auto=format&fit=crop&q=80',
    specialties: ['Peak Hypertrophy', 'Mind-Muscle Link', 'Posing'],
    rating: '4.97',
    totalClients: '2,100+',
  },
  {
    slug: 'sarah-connor',
    handles: ['sarah-connor', 'sarah.skin', 'creator-4'],
    fullName: 'Sarah Connor',
    headline: 'Athletic Posture & Rotational Mechanics Coach',
    avatarUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=900&auto=format&fit=crop&q=80',
    specialties: ['Thoracic Mobility', 'Pelvic Reset', 'Kettlebell Flow'],
    rating: '4.99',
    totalClients: '650+',
  },
];

const seedCourses = [
  {
    slug: 'course-chadmax',
    ids: ['course-chadmax'],
    title: 'ChadMax Biomechanics & Strength Foundation',
    coachName: 'Chad Tagemb',
    coachAvatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80',
    lessonsCount: 16,
  },
  {
    slug: 'c-big3-mechanics',
    ids: ['c-big3-mechanics', 'course-1'],
    title: 'The Big 3 Mechanics: Squat, Bench & Deadlift',
    coachName: 'Marcus Vance',
    coachAvatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80',
    lessonsCount: 12,
  },
  {
    slug: 'course-metabolic-reset',
    ids: ['course-metabolic-reset', 'course-2'],
    title: 'Clinical Metabolic Reset & Hormone Nutrition',
    coachName: 'Dr. Elena Rostova',
    coachAvatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&auto=format&fit=crop&q=80',
    lessonsCount: 14,
  },
];

let creatorCount = 0;
for (const creator of seedCreators) {
  const svg = renderCreatorSvg(creator);
  // Write canonical slug
  fs.writeFileSync(path.join(CREATORS_OG_DIR, `${creator.slug}.svg`), svg, 'utf-8');
  creatorCount++;
  // Write alias handles
  for (const h of creator.handles) {
    if (h !== creator.slug) {
      fs.writeFileSync(path.join(CREATORS_OG_DIR, `${h}.svg`), svg, 'utf-8');
      creatorCount++;
    }
  }
}

let courseCount = 0;
for (const course of seedCourses) {
  const svg = renderCourseSvg(course);
  fs.writeFileSync(path.join(COURSES_OG_DIR, `${course.slug}.svg`), svg, 'utf-8');
  courseCount++;
  for (const id of course.ids) {
    if (id !== course.slug) {
      fs.writeFileSync(path.join(COURSES_OG_DIR, `${id}.svg`), svg, 'utf-8');
      courseCount++;
    }
  }
}

console.log(`✓ [OG Image Generator]: Pre-generated ${creatorCount} creator OG SVGs and ${courseCount} course OG SVGs in public/og/.`);
