process.env.NODE_ENV = 'test';
import http from 'http';
import { generateToken } from '../config/jwt.js';

let server: http.Server;
const TEST_PORT = 5066;

function request(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          try {
            const json = responseBody ? JSON.parse(responseBody) : null;
            resolve({ status: res.statusCode || 500, body: json });
          } catch {
            resolve({ status: res.statusCode || 500, body: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Creator Members Directory & Privacy Access Verification ---');

  const { app } = await import('../index.js');

  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  // Test tokens
  const tokenMarcusCreator = generateToken({
    userId: 'user-marcus',
    email: 'marcus@ascend.io',
    role: 'CREATOR',
    fullName: 'Marcus Vance',
  });

  const tokenAkshatMember = generateToken({
    userId: 'user-akshat',
    email: 'akshat@ascend.io',
    role: 'BUYER',
    fullName: 'Akshat Sharma',
  });

  const tokenDevonPrivateMember = generateToken({
    userId: 'user-ref-1', // Devon Cooper (isProfilePrivate: true)
    email: 'devon.cooper@athletic.io',
    role: 'BUYER',
    fullName: 'Devon Cooper',
  });

  const tokenNonMember = generateToken({
    userId: 'user-ref-7', // Sam Reid (No membership in Elena's space)
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
    // 1. Creator Full Visibility Test
    console.log('\n1. Test: Creator Owner Views Full Members Directory');
    const resCreator = await request('GET', '/api/creators/creator-marcus/members', undefined, {
      Authorization: `Bearer ${tokenMarcusCreator}`,
    });

    assert(resCreator.status === 200, 'GET /creators/creator-marcus/members returns 200 for Creator');
    assert(resCreator.body?.data?.viewerRole === 'CREATOR', 'viewerRole is CREATOR');
    assert(Array.isArray(resCreator.body?.data?.members), 'Members array returned');
    assert(resCreator.body?.data?.members.length >= 4, 'Multiple members in Marcus community');

    const devonAsSeenByCreator = resCreator.body?.data?.members.find((m: any) => m.userId === 'user-ref-1');
    assert(Boolean(devonAsSeenByCreator), 'Private member Devon is listed');
    assert(devonAsSeenByCreator.name === 'Devon Cooper', 'Creator sees full name of private member');
    assert(devonAsSeenByCreator.email === 'devon.cooper@athletic.io', 'Creator sees member email');
    assert(Boolean(devonAsSeenByCreator.avatarUrl), 'Creator sees member avatar');
    assert(Boolean(devonAsSeenByCreator.level?.tierName), 'Member has S1 gamification level attached');
    assert(Boolean(devonAsSeenByCreator.joinedAt), 'Member has join date attached');

    // 2. Peer Member Privacy Masking Test
    console.log('\n2. Test: Peer Community Member Views Directory (Privacy Masking)');
    const resMember = await request('GET', '/api/creators/creator-marcus/members', undefined, {
      Authorization: `Bearer ${tokenAkshatMember}`,
    });

    assert(resMember.status === 200, 'GET /creators/creator-marcus/members returns 200 for joined member');
    assert(resMember.body?.data?.viewerRole === 'MEMBER', 'viewerRole is MEMBER');

    // Devon (isProfilePrivate: true) should be masked for peer Akshat
    const devonAsSeenByAkshat = resMember.body?.data?.members.find((m: any) => m.userId === 'user-ref-1');
    assert(devonAsSeenByAkshat.isProfilePrivate === true, 'Devon is flagged as private');
    assert(devonAsSeenByAkshat.isPrivateMasked === true, 'Devon is flagged isPrivateMasked: true');
    assert(devonAsSeenByAkshat.name === 'Anonymous Athlete', 'Devon name is anonymized to "Anonymous Athlete" for peer');
    assert(devonAsSeenByAkshat.avatarUrl === null, 'Devon avatar is hidden (null) for peer');
    assert(devonAsSeenByAkshat.email === undefined, 'Devon email is omitted for peer');
    assert(Boolean(devonAsSeenByAkshat.level?.tierName), 'Devon S1 level is still visible');
    assert(Boolean(devonAsSeenByAkshat.joinedAt), 'Devon join date is still visible');

    // Public member (Maya Lin or Akshat self)
    const mayaAsSeenByAkshat = resMember.body?.data?.members.find((m: any) => m.userId === 'user-ref-2');
    if (mayaAsSeenByAkshat) {
      assert(mayaAsSeenByAkshat.name === 'Maya Lin', 'Public member name is displayed');
      assert(mayaAsSeenByAkshat.email === undefined, 'Public member email is withheld from peers');
      assert(Boolean(mayaAsSeenByAkshat.avatarUrl), 'Public member avatar is displayed');
      assert(mayaAsSeenByAkshat.isPrivateMasked === false, 'Public member is not masked');
    }

    // 3. Non-Member Access Rejection Test
    console.log('\n3. Test: Non-Member Access Rejection (403 Forbidden)');
    const resNonMember = await request('GET', '/api/creators/creator-elena/members', undefined, {
      Authorization: `Bearer ${tokenNonMember}`,
    });

    assert(resNonMember.status === 403, 'Non-member request to Elena members directory rejected with 403 Forbidden');
    assert(
      resNonMember.body?.error.includes('must be a member'),
      'Clear error message explaining community membership required'
    );

    // 4. Search Filter Test
    console.log('\n4. Test: Search Member Directory (?search=...)');
    const resSearch = await request('GET', '/api/creators/creator-marcus/members?search=Maya', undefined, {
      Authorization: `Bearer ${tokenAkshatMember}`,
    });

    assert(resSearch.status === 200, 'GET with ?search=Maya returns 200');
    assert(resSearch.body?.data?.members.length >= 1, 'Found matching member for "Maya"');
    assert(
      resSearch.body?.data?.members.every((m: any) => m.name.toLowerCase().includes('maya') || m.tier.name.toLowerCase().includes('maya')),
      'All search results match search term'
    );

    // 5. Tier Filter Test
    console.log('\n5. Test: Tier Filter (?tierId=tier-marcus-vip)');
    const resTierFilter = await request('GET', '/api/creators/creator-marcus/members?tierId=tier-marcus-vip', undefined, {
      Authorization: `Bearer ${tokenAkshatMember}`,
    });

    assert(resTierFilter.status === 200, 'GET with ?tierId= returns 200');
    assert(
      resTierFilter.body?.data?.members.every((m: any) => m.tier.id === 'tier-marcus-vip'),
      'All returned members belong to requested VIP tier'
    );

    console.log(`\n--- Member Directory Verification Summary: ${passed} passed, ${failed} failed ---`);
    if (server) server.close();
    setTimeout(() => {
      process.exit(failed > 0 ? 1 : 0);
    }, 50);
  } catch (err) {
    console.error('Test execution error:', err);
    if (server) server.close();
    setTimeout(() => {
      process.exit(1);
    }, 50);
  }
}

runTests();
