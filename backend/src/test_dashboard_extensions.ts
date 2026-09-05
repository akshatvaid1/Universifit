process.env.NODE_ENV = 'test';
import http from 'http';
import { app } from './index.js';
import { inMemoryStore } from './config/inMemoryDb.js';
import { generateToken } from './config/jwt.js';

async function runTests() {
  console.log('=== RUNNING CREATOR DASHBOARD EXTENSION TESTS ===');
  
  const creatorToken = generateToken({
    userId: 'user-marcus',
    email: 'marcus@ascend.io',
    fullName: 'Marcus Vane',
    role: 'CREATOR',
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server running at ${baseUrl}`);

  function makeRequest(path: string, options: http.RequestOptions = {}, body?: any): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqOptions: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'close',
          'Authorization': `Bearer ${creatorToken}`,
          ...(options.headers || {}),
        },
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode || 200, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode || 200, body: data });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    const creatorId = 'creator-marcus';
    const testUserId = 'user-alex';

    // Ensure user-alex is in users and member list
    inMemoryStore.users.push({
      id: testUserId,
      email: 'alex@example.com',
      passwordHash: 'hashed',
      fullName: 'Alex Mercer',
      role: 'BUYER',
      points: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    inMemoryStore.membershipMembers.push({
      id: 'mm-test-alex',
      userId: testUserId,
      creatorId,
      tierId: 'tier-marcus-free',
      status: 'ACTIVE',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    // 1. Test getMemberActivity
    console.log('\n--- 1. Testing GET /api/creators/:id/members/:userId/activity ---');
    const actRes = await makeRequest(`/api/creators/${creatorId}/members/${testUserId}/activity`);
    console.log('Status:', actRes.status);
    console.log('Activity Dossier user:', actRes.body.data?.user?.fullName || actRes.body.data?.user?.id);
    console.log('Membership status:', actRes.body.data?.membership?.status);
    console.log('Gamification Level:', actRes.body.data?.gamification?.level?.tierName);
    if (actRes.status !== 200 || !actRes.body.success) throw new Error('getMemberActivity failed');

    // 2. Test Ban Member
    console.log('\n--- 2. Testing POST /api/creators/:id/members/:userId/ban ---');
    const banRes = await makeRequest(`/api/creators/${creatorId}/members/${testUserId}/ban`, {
      method: 'POST',
    }, { reason: 'Violation of community moderation standards' });
    console.log('Ban status:', banRes.status, 'Message:', banRes.body.message);
    if (banRes.status !== 200 || !banRes.body.success) throw new Error('banMember failed');

    // Verify activity reflects BANNED status
    const actBannedRes = await makeRequest(`/api/creators/${creatorId}/members/${testUserId}/activity`);
    console.log('Updated Activity membership status:', actBannedRes.body.data?.membership?.status);
    if (actBannedRes.body.data?.membership?.status !== 'BANNED') throw new Error('Ban status not reflected in activity');

    // 3. Test Unban Member
    console.log('\n--- 3. Testing POST /api/creators/:id/members/:userId/unban ---');
    const unbanRes = await makeRequest(`/api/creators/${creatorId}/members/${testUserId}/unban`, {
      method: 'POST',
    });
    console.log('Unban status:', unbanRes.status, 'Message:', unbanRes.body.message);
    if (unbanRes.status !== 200 || !unbanRes.body.success) throw new Error('unbanMember failed');

    // 4. Test Remove Member
    console.log('\n--- 4. Testing DELETE /api/creators/:id/members/:userId ---');
    const rmRes = await makeRequest(`/api/creators/${creatorId}/members/${testUserId}`, {
      method: 'DELETE',
    });
    console.log('Remove status:', rmRes.status, 'Message:', rmRes.body.message);
    if (rmRes.status !== 200 || !rmRes.body.success) throw new Error('removeMember failed');

    // 5. Test Community Analytics beyond T1
    console.log('\n--- 5. Testing GET /api/creators/:id/analytics/community ---');
    const analyticsRes = await makeRequest(`/api/creators/${creatorId}/analytics/community`);
    console.log('Status:', analyticsRes.status);
    console.log('Engagement Rate:', analyticsRes.body.data?.engagement?.engagementRate, '%');
    console.log('Active Members 30d:', analyticsRes.body.data?.engagement?.activeMembers30d);
    console.log('Total Community Points:', analyticsRes.body.data?.pointDistribution?.totalPoints);
    console.log('Top Contributors Count:', analyticsRes.body.data?.topContributors?.length);
    if (analyticsRes.status !== 200 || !analyticsRes.body.success) throw new Error('getCreatorCommunityAnalytics failed');

    console.log('\n>>> ALL CREATOR DASHBOARD EXTENSION TESTS PASSED! 🎉 <<<');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runTests();
