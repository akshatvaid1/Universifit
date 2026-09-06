#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

const BASE_URL = process.env.VITE_FRONTEND_URL || 'https://universifit.vercel.app';
const today = new Date().toISOString().split('T')[0];

const staticRoutes = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: 'discover', changefreq: 'daily', priority: '0.9' },
  { path: 'community', changefreq: 'daily', priority: '0.8' },
  { path: 'privacy', changefreq: 'monthly', priority: '0.4' },
  { path: 'terms', changefreq: 'monthly', priority: '0.4' },
  { path: 'refund-policy', changefreq: 'monthly', priority: '0.4' },
  { path: 'contact', changefreq: 'monthly', priority: '0.5' },
];

// Production creator handles
const creatorHandles = [
  'chadtag',
  'marcus.vance',
  'dr.elena.metabolism',
  'kai.mobility',
  'sarah.skin',
];

// Production courses
const courses = [
  'course-chadmax',
  'c-big3-mechanics',
];

const urls = [];

// 1. Static Pages
for (const route of staticRoutes) {
  const loc = route.path ? `${BASE_URL}/${route.path}` : `${BASE_URL}/`;
  urls.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
}

// 2. Creator Profiles
for (const handle of creatorHandles) {
  urls.push(`  <url>
    <loc>${BASE_URL}/creator/${encodeURIComponent(handle)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
}

// 3. Courses
for (const courseId of courses) {
  urls.push(`  <url>
    <loc>${BASE_URL}/course/${encodeURIComponent(courseId)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>`);
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.resolve(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`✓ [Sitemap Generator]: Generated public/sitemap.xml with ${urls.length} URLs (static pages, creators, and courses).`);
