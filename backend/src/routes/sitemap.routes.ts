import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { inMemoryStore } from '../config/inMemoryDb.js';
import fs from 'fs';
import path from 'path';

const router = Router();

const BASE_URL = process.env.FRONTEND_URL || 'https://universifit.vercel.app';

/**
 * Generates an XML sitemap dynamically from active database records
 */
export async function generateSitemapXml(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  // Static core routes
  const staticRoutes = [
    { loc: `${BASE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${BASE_URL}/discover`, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/community`, changefreq: 'daily', priority: '0.8' },
    { loc: `${BASE_URL}/privacy`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/terms`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/refund-policy`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/contact`, changefreq: 'monthly', priority: '0.5' },
  ];

  // Fetch real creators from Prisma DB with fallback to inMemoryStore
  let creatorHandles: { handle: string; lastmod: string }[] = [];
  try {
    const dbCreators = await prisma.creatorProfile.findMany({
      where: { verificationStatus: 'VERIFIED' },
      select: { handle: true, updatedAt: true },
    });
    if (dbCreators && dbCreators.length > 0) {
      creatorHandles = dbCreators.map((c) => ({
        handle: c.handle,
        lastmod: c.updatedAt ? c.updatedAt.toISOString().split('T')[0] : today,
      }));
    }
  } catch (_err) {
    // Database connection offline, proceed with in-memory fallback
  }

  if (creatorHandles.length === 0) {
    // Memory store fallback
    const memCreators = inMemoryStore.creatorProfiles.filter(
      (c) => c.verificationStatus === 'VERIFIED'
    );
    if (memCreators.length > 0) {
      creatorHandles = memCreators.map((c) => ({
        handle: c.handle,
        lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : today,
      }));
    }
  }

  // Known active production handles
  const knownHandles = [
    'chadtag',
    'marcus.vance',
    'dr.elena.metabolism',
    'kai.mobility',
    'sarah.skin',
  ];
  for (const h of knownHandles) {
    if (!creatorHandles.some((c) => c.handle.toLowerCase() === h.toLowerCase())) {
      creatorHandles.push({ handle: h, lastmod: today });
    }
  }

  // Fetch real courses from Prisma DB with fallback to inMemoryStore
  let courseIds: { id: string; lastmod: string }[] = [];
  try {
    const dbCourses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
    });
    if (dbCourses && dbCourses.length > 0) {
      courseIds = dbCourses.map((c) => ({
        id: c.id,
        lastmod: c.updatedAt ? c.updatedAt.toISOString().split('T')[0] : today,
      }));
    }
  } catch (_err) {
    // Database connection offline, proceed with in-memory fallback
  }

  if (courseIds.length === 0) {
    const memCourses = inMemoryStore.courses;
    if (memCourses.length > 0) {
      courseIds = memCourses.map((c) => ({
        id: c.id,
        lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : today,
      }));
    }
  }

  const knownCourseIds = ['course-chadmax', 'c-big3-mechanics'];
  for (const cid of knownCourseIds) {
    if (!courseIds.some((c) => c.id === cid)) {
      courseIds.push({ id: cid, lastmod: today });
    }
  }

  // Assemble valid XML
  const urlsXml: string[] = [];

  // 1. Static Pages
  for (const route of staticRoutes) {
    urlsXml.push(`  <url>
    <loc>${route.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // 2. Creator URLs
  for (const creator of creatorHandles) {
    urlsXml.push(`  <url>
    <loc>${BASE_URL}/creator/${encodeURIComponent(creator.handle)}</loc>
    <lastmod>${creator.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
  }

  // 3. Course URLs
  for (const course of courseIds) {
    urlsXml.push(`  <url>
    <loc>${BASE_URL}/course/${encodeURIComponent(course.id)}</loc>
    <lastmod>${course.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml.join('\n')}
</urlset>
`;
}

/**
 * GET /sitemap.xml & /api/sitemap.xml
 */
router.get(['/sitemap.xml', '/'], async (_req: Request, res: Response) => {
  try {
    const xml = await generateSitemapXml();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error('[Sitemap Error]:', err);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Unable to generate sitemap</error>');
  }
});

/**
 * GET /llms.txt & /api/llms.txt
 */
router.get(['/llms.txt', '/llms'], async (_req: Request, res: Response) => {
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), 'public/llms.txt'),
      path.resolve(process.cwd(), '../public/llms.txt'),
    ];
    let content: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        content = fs.readFileSync(p, 'utf-8');
        break;
      }
    }
    if (!content) {
      content = `# Universifit\n\n> Vetted 1-on-1 coaching platform for strength, nutrition, and longevity.\n`;
    }
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=86400');
    res.status(200).send(content);
  } catch (err) {
    res.status(500).send('Universifit AI Crawler Context');
  }
});

export default router;
