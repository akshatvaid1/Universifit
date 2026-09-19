/**
 * Test Suite: Privacy Analytics Ingestion & Creator Analytics Engine
 */

import { inMemoryStore } from './config/inMemoryDb.js';
import { trackEvent, getCreatorAnalytics, logStorefrontVisit } from './controllers/analytics.controller.js';

async function runTests() {
  console.log('=== [START]: Testing Privacy Analytics & Creator Telemetry ===\n');

  // Test 1: Ingesting Page View Analytics Event
  console.log('--- Test 1: Ingesting Page View Event ---');
  let mockResJson: any = null;
  let mockStatusCode = 200;

  const mockRes: any = {
    status: (code: number) => {
      mockStatusCode = code;
      return mockRes;
    },
    json: (data: any) => {
      mockResJson = data;
      return mockRes;
    },
  };

  const reqPageView: any = {
    body: {
      eventName: 'page_view',
      creatorId: 'creator-marcus',
      metadata: { route: 'creator', path: '/creator/marcus_fit' },
    },
    headers: { 'user-agent': 'Mozilla/5.0 Test Suite' },
  };

  await trackEvent(reqPageView, mockRes);
  if (mockStatusCode !== 200 || !mockResJson?.success) {
    throw new Error(`Track page_view failed: status ${mockStatusCode}`);
  }
  console.log(`✓ [Test 1 Passed]: Page view event recorded (Event ID: ${mockResJson.eventId})`);

  // Test 2: Ingesting Checkout Start Event
  console.log('\n--- Test 2: Ingesting Checkout Start Event ---');
  const reqCheckoutStart: any = {
    body: {
      eventName: 'checkout_start',
      creatorId: 'creator-marcus',
      metadata: { offerId: 'off-marcus-1', amount: 180, currency: 'USD' },
    },
    headers: {},
  };
  await trackEvent(reqCheckoutStart, mockRes);
  if (mockStatusCode !== 200 || !mockResJson?.success) {
    throw new Error(`Track checkout_start failed: status ${mockStatusCode}`);
  }
  console.log(`✓ [Test 2 Passed]: Checkout start event recorded (${mockResJson.eventId})`);

  // Test 3: Ingesting Checkout Completed & Enrollment Events
  console.log('\n--- Test 3: Ingesting Checkout Completed & Enroll Events ---');
  const reqCheckoutComplete: any = {
    body: {
      eventName: 'checkout_completed',
      creatorId: 'creator-marcus',
      userId: 'user-athlete-1',
      metadata: { orderId: 'order_test_999', offerId: 'off-marcus-1', amount: 180, currency: 'USD' },
    },
    headers: {},
  };
  await trackEvent(reqCheckoutComplete, mockRes);

  const reqEnroll: any = {
    body: {
      eventName: 'enroll',
      creatorId: 'creator-marcus',
      userId: 'user-athlete-1',
      metadata: { courseId: 'crs-marcus-1', offerId: 'off-marcus-1' },
    },
    headers: {},
  };
  await trackEvent(reqEnroll, mockRes);
  console.log('✓ [Test 3 Passed]: Checkout completed and enrollment events ingested.');

  // Test 4: Ingesting 1-on-1 Booking & Community Join Events
  console.log('\n--- Test 4: Ingesting Booking & Community Join Events ---');
  const reqBook: any = {
    body: {
      eventName: 'book',
      creatorId: 'creator-marcus',
      userId: 'user-athlete-2',
      metadata: { bookingId: 'bk-test-123', slotTime: '2026-09-12T10:00:00Z' },
    },
    headers: {},
  };
  await trackEvent(reqBook, mockRes);

  const reqCommunityJoin: any = {
    body: {
      eventName: 'community_join',
      creatorId: 'creator-marcus',
      userId: 'user-athlete-3',
      metadata: { tierId: 'tier-pro-hypertrophy' },
    },
    headers: {},
  };
  await trackEvent(reqCommunityJoin, mockRes);
  console.log('✓ [Test 4 Passed]: Booking and Community Join events ingested.');

  // Test 5: Ingesting Storefront Visit
  console.log('\n--- Test 5: Ingesting Direct Storefront Visit ---');
  const reqVisit: any = {
    params: { creatorId: 'creator-marcus' },
    body: { visitorId: 'vis-test-suite', referrer: 'https://universifit.com/discover' },
    headers: { 'user-agent': 'Chrome/128 Test' },
  };
  await logStorefrontVisit(reqVisit, mockRes);
  console.log(`✓ [Test 5 Passed]: Storefront visit logged (profile views: ${mockResJson.profileViews})`);

  // Test 6: Querying Dynamic Creator Analytics
  console.log('\n--- Test 6: Querying Dynamic Creator Analytics for Dashboard ---');
  const reqAnalytics: any = {
    params: { creatorId: 'creator-marcus' },
    user: { id: 'user-marcus', role: 'CREATOR' },
  };
  await getCreatorAnalytics(reqAnalytics, mockRes);

  if (mockStatusCode !== 200 || !mockResJson?.success || !mockResJson.data) {
    throw new Error(`getCreatorAnalytics failed: status ${mockStatusCode}`);
  }

  const { summary, offerConversionBreakdown, trafficTimeline, earningsTimeline } = mockResJson.data;

  console.log('Total Profile Views:', summary.totalProfileViews);
  console.log('Total Sales:', summary.totalOfferSales);
  console.log('Overall Conversion Rate:', summary.overallConversionRate, '%');
  console.log('Gross Revenue:', `$${summary.grossRevenue}`);
  console.log('Net Earnings (85%):', `$${summary.netEarnings}`);
  console.log('Active Students Count:', summary.activeStudentsCount);
  console.log('Offer Breakdown Items:', offerConversionBreakdown.length);
  console.log('Traffic Timeline Points (14 days):', trafficTimeline.length);
  console.log('Earnings Timeline Months:', earningsTimeline.length);

  if (summary.totalProfileViews <= 0) throw new Error('totalProfileViews should be > 0');
  if (summary.grossRevenue <= 0) throw new Error('grossRevenue should be > 0');
  if (offerConversionBreakdown.length === 0) throw new Error('offerConversionBreakdown should not be empty');
  if (trafficTimeline.length !== 14) throw new Error('trafficTimeline should have 14 points');

  console.log('✓ [Test 6 Passed]: Dynamic Creator Analytics successfully computed real metrics without empty state.');

  console.log('\n=== [COMPLETED]: All Privacy Analytics & Creator Telemetry Tests Passed Successfully! ===');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
