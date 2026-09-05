process.env.NODE_ENV = 'test';
import http from 'http';
import { app } from '../index.js';
import { generateToken } from '../config/jwt.js';

let server: http.Server;
const TEST_PORT = 5055;

async function request(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  const url = `http://localhost:${TEST_PORT}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const status = res.status;
  const json: any = await res.json().catch(() => null);
  return { status, body: json };
}

async function runTests() {
  console.log('--- Starting Creator Membership Tiers & Access Gating Verification ---');

  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  // Generate test tokens
  const tokenAkshat = generateToken({
    userId: 'user-akshat',
    email: 'akshat@ascend.io',
    role: 'BUYER',
    fullName: 'Akshat Sharma',
  });

  const tokenMarcus = generateToken({
    userId: 'user-marcus',
    email: 'marcus@ascend.io',
    role: 'CREATOR',
    fullName: 'Marcus Vance',
  });

  const tokenDevon = generateToken({
    userId: 'user-ref-1', // Devon Cooper (Free tier member)
    email: 'devon.cooper@athletic.io',
    role: 'BUYER',
    fullName: 'Devon Cooper',
  });

  const tokenNewBuyer = generateToken({
    userId: 'user-ref-7', // Sam Reid (No membership yet)
    email: 'sam.reid@unverified.org',
    role: 'BUYER',
    fullName: 'Sam Reid',
  });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  try {
    // 1. GET /api/creators/creator-marcus/tiers
    console.log('\n1. Test: Fetch Membership Tiers for Creator');
    const resTiers = await request('GET', '/api/creators/creator-marcus/tiers');
    assert(resTiers.status === 200, 'GET /api/creators/creator-marcus/tiers returns 200');
    assert(Array.isArray(resTiers.body?.data?.tiers), 'Tiers array is returned');
    assert(resTiers.body?.data?.tiers.length >= 2, 'Has at least Free and Paid tier for Marcus');

    const freeTier = resTiers.body?.data?.tiers.find((t: any) => t.access === 'FREE');
    const paidTier = resTiers.body?.data?.tiers.find((t: any) => t.access === 'PAID');
    assert(Boolean(freeTier), 'Free community tier exists');
    assert(Boolean(paidTier), 'Paid Apex VIP tier exists');

    // 2. GET /api/creators/creator-marcus/membership/my-tier (Akshat has Paid Tier)
    console.log('\n2. Test: Check Buyer Tier Status');
    const resMyTier = await request('GET', '/api/creators/creator-marcus/membership/my-tier', undefined, {
      Authorization: `Bearer ${tokenAkshat}`,
    });
    assert(resMyTier.status === 200, 'GET my-tier returns 200 for Akshat');
    assert(resMyTier.body?.data?.isPaidMember === true, 'Akshat is recognized as Paid Member');
    assert(resMyTier.body?.data?.access === 'PAID', 'Akshat access level is PAID');

    // 3. Buyer Joining Tier: Sam Reid joins Free Tier
    console.log('\n3. Test: Buyer Joins Free Community Tier');
    const resJoin = await request('POST', '/api/creators/creator-marcus/membership/join', { tierId: freeTier.id }, {
      Authorization: `Bearer ${tokenNewBuyer}`,
    });
    assert(resJoin.status === 200, 'POST /membership/join returns 200');
    assert(resJoin.body?.data?.membership?.tierId === freeTier.id, 'Sam Reid joined Free Community Squad tier');

    // 4. Community Post Gating:
    // Devon (Free tier) vs Akshat (Paid tier)
    console.log('\n4. Test: Community Post Gating (Free vs Paid Members)');
    const resPostsDevon = await request('GET', '/api/creators/creator-marcus/posts', undefined, {
      Authorization: `Bearer ${tokenDevon}`,
    });
    assert(resPostsDevon.status === 200, 'GET posts returns 200 for Free Tier member Devon');
    const vipPostForDevon = resPostsDevon.body?.data?.posts.find((p: any) => p.tierAccess === 'PAID');
    assert(Boolean(vipPostForDevon), 'VIP post is included in post list');
    assert(vipPostForDevon.isLocked === true, 'VIP post is flagged isLocked: true for Free tier member');
    assert(vipPostForDevon.content.includes('🔒 Content Locked'), 'VIP post content is redacted server-side for Free tier member');

    const resPostsAkshat = await request('GET', '/api/creators/creator-marcus/posts', undefined, {
      Authorization: `Bearer ${tokenAkshat}`,
    });
    const vipPostForAkshat = resPostsAkshat.body?.data?.posts.find((p: any) => p.tierAccess === 'PAID');
    assert(vipPostForAkshat.isLocked === false, 'VIP post is UNLOCKED for Paid tier member Akshat');
    assert(!vipPostForAkshat.content.includes('🔒 Content Locked'), 'VIP post full unredacted content is served to Paid tier member');

    // 5. Course & Lesson Video Access Gating:
    console.log('\n5. Test: Course Access Gating (Paid Tier Unlocks Curriculum)');
    // Akshat has Paid Tier covering 'off-marcus-2' -> full course access
    const resCourseAkshat = await request('GET', '/api/courses/course-marcus-hypertrophy', undefined, {
      Authorization: `Bearer ${tokenAkshat}`,
    });
    assert(resCourseAkshat.status === 200, 'GET course returns 200 for Akshat');
    const l2Akshat = resCourseAkshat.body?.data?.lessons.find((l: any) => l.id === 'les-2');
    assert(l2Akshat.isLocked === false, 'Non-preview Lesson 2 is unlocked for Paid Tier member');
    assert(Boolean(l2Akshat.videoUrl), 'Lesson 2 video URL is provided to Paid Tier member');

    // Devon (Free Tier) does not have enrollment or Paid Tier for Marcus -> locked lessons
    const resCourseDevon = await request('GET', '/api/courses/course-marcus-hypertrophy', undefined, {
      Authorization: `Bearer ${tokenDevon}`,
    });
    const l2Devon = resCourseDevon.body?.data?.lessons.find((l: any) => l.id === 'les-2');
    assert(l2Devon.isLocked === true, 'Non-preview Lesson 2 is LOCKED for Free Tier member');
    assert(l2Devon.videoUrl === null, 'Non-preview Lesson 2 video URL is REDACTED (null) server-side for Free Tier member');

    // 6. Event RSVP Gating:
    console.log('\n6. Test: Event RSVP Server-Side Gating');
    // Devon (Free tier) attempting to RSVP to Live Masterclass 'evt-2' (Paid tier access required)
    const resRsvpDevon = await request('POST', '/api/events/evt-2/rsvp', undefined, {
      Authorization: `Bearer ${tokenDevon}`,
    });
    assert(resRsvpDevon.status === 403, 'Free tier member RSVP to paid event is REJECTED with 403 Forbidden');
    assert(resRsvpDevon.body?.error.includes('Paid Membership Tier'), 'Error clearly indicates Paid Membership Tier required');

    // Akshat (Paid tier member) attempting to RSVP to Live Q&A 'evt-3'
    const resRsvpAkshat = await request('POST', '/api/events/evt-3/rsvp', undefined, {
      Authorization: `Bearer ${tokenAkshat}`,
    });
    assert(resRsvpAkshat.status === 201, 'Paid tier member RSVP is ACCEPTED with 201 Created');
    assert(Boolean(resRsvpAkshat.body?.data?.joinUrl), 'Join link is generated for Paid tier member');

    console.log(`\n--- Verification Summary: ${passed} passed, ${failed} failed ---`);
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
