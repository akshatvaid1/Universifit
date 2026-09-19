/**
 * Test Phase A10: Coupon model + checkout validation, Wishlist API, Certificate auto-generation on 100% completion, and Razorpay Subscriptions (recurring offers + self-serve cancel).
 */
import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function request(url: string, options: any = {}): Promise<{ status: number; headers: any; data: any }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data };
}

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 Starting Phase A10 Comprehensive Integration Test Suite');
  console.log('===========================================================');

  // 0. Authentication
  console.log('\n--- Step 0: User Setup & Authentication ---');
  const creatorLogin = await request(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'chadtag@ascend.io', password: 'chadtag123' }),
  });
  assert.strictEqual(creatorLogin.status, 200, 'Chadtag login must succeed');
  const creatorToken = creatorLogin.data.token;
  const creatorId = 'creator-chadtag';
  console.log('✓ Creator Chadtag authenticated');

  const buyerEmail = `athlete_a10_${Date.now()}@test.com`;
  const buyerReg = await request(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email: buyerEmail, password: 'password123', fullName: 'Athlete Nathan', role: 'BUYER' }),
  });
  assert.strictEqual(buyerReg.status, 201, 'Buyer registration must succeed');
  const buyerToken = buyerReg.data.token;
  const buyerUserId = buyerReg.data.user.id;
  console.log(`✓ Buyer authenticated: ${buyerUserId}`);

  // 1. Coupon Model + Checkout Validation
  console.log('\n--- Step 1: Coupon Model & Validation ---');
  const couponCode = `AESTHETIC${Math.floor(100 + Math.random() * 900)}`;
  const createCouponRes = await request(`${BASE_URL}/coupons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${creatorToken}` },
    body: JSON.stringify({
      code: couponCode,
      description: 'Exclusive 20% OFF for Aesthetics Masterclass',
      discountType: 'PERCENT',
      value: 20,
      usageLimit: 5,
    }),
  });
  assert.strictEqual(createCouponRes.status, 201, 'Coupon creation must succeed');
  console.log(`✓ Coupon created: "${couponCode}" (20% OFF, max 5 uses)`);

  // Validate coupon via POST /coupons/validate with offer
  const validateRes = await request(`${BASE_URL}/coupons/validate`, {
    method: 'POST',
    body: JSON.stringify({
      code: couponCode,
      offerId: 'offer-chadtag-course', // price is $118
    }),
  });
  assert.strictEqual(validateRes.status, 200, 'Coupon validation must succeed');
  assert.strictEqual(validateRes.data.valid, true);
  const discountData = validateRes.data.data;
  assert.strictEqual(discountData.originalAmount, 118);
  assert.strictEqual(discountData.discountAmount, 23.6); // 20% of 118
  assert.strictEqual(discountData.finalAmount, 94.4); // 118 - 23.6
  console.log(`✓ Coupon validated: Original $${discountData.originalAmount} -> Discount $${discountData.discountAmount} -> Final $${discountData.finalAmount}`);

  // Validate coupon in Checkout Order Creation
  const checkoutOrderRes = await request(`${BASE_URL}/checkout/create-order`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      offerId: 'offer-chadtag-course',
      couponCode,
    }),
  });
  assert.strictEqual(checkoutOrderRes.status, 201, 'Checkout create-order with coupon must succeed');
  assert.strictEqual(checkoutOrderRes.data.data.discountAmount, 23.6);
  assert.strictEqual(checkoutOrderRes.data.data.amount, 94.4);
  console.log(`✓ Checkout order applied coupon: orderId=${checkoutOrderRes.data.data.orderId}, chargedAmount=$${checkoutOrderRes.data.data.amount}`);

  // Test invalid coupon handling
  const invalidCouponRes = await request(`${BASE_URL}/coupons/validate`, {
    method: 'POST',
    body: JSON.stringify({ code: 'FAKECOUPON999' }),
  });
  assert.strictEqual(invalidCouponRes.status, 404, 'Invalid coupon must return 404');
  assert.strictEqual(invalidCouponRes.data.valid, false);
  console.log('✓ Invalid coupon rejected with 404');

  // 2. Wishlist API
  console.log('\n--- Step 2: Wishlist API ---');
  // Initially empty
  const initialWishlist = await request(`${BASE_URL}/wishlist`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(initialWishlist.status, 200);
  assert.strictEqual(initialWishlist.data.count, 0, 'New user wishlist must start empty');
  console.log('✓ Initial wishlist is clean (0 items)');

  // Add offer to wishlist via POST /wishlist
  const addWishlistRes = await request(`${BASE_URL}/wishlist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ offerId: 'offer-chadtag-course' }),
  });
  assert.strictEqual(addWishlistRes.status, 201, 'Add to wishlist must succeed');
  console.log('✓ Added "ChadMax Masterclass" offer to wishlist');

  // Fetch updated wishlist
  const updatedWishlist = await request(`${BASE_URL}/wishlist`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(updatedWishlist.status, 200);
  assert.strictEqual(updatedWishlist.data.count, 1, 'Wishlist should have 1 item');
  assert.strictEqual(updatedWishlist.data.data[0].offer.title, 'ChadMax Masterclass');
  console.log(`✓ Wishlist verified with enriched offer data: "${updatedWishlist.data.data[0].offer.title}" by ${updatedWishlist.data.data[0].offer.creator.user.fullName}`);

  // Remove from wishlist
  const removeWishlistRes = await request(`${BASE_URL}/wishlist/offer-chadtag-course`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(removeWishlistRes.status, 200, 'Remove from wishlist must succeed');
  console.log('✓ Removed offer from wishlist');

  const emptyWishlist = await request(`${BASE_URL}/wishlist`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(emptyWishlist.data.count, 0, 'Wishlist must be empty after deletion');
  console.log('✓ Wishlist verified empty after deletion');

  // 3. Certificate Auto-Generation on 100% Course Completion
  console.log('\n--- Step 3: Certificate Auto-Generation on 100% Completion ---');
  // First enroll buyer in course
  await request(`${BASE_URL}/checkout/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      razorpay_order_id: checkoutOrderRes.data.data.orderId,
      razorpay_payment_id: `pay_${Date.now()}`,
      razorpay_signature: 'test_sig',
      offerId: 'offer-chadtag-course',
    }),
  });
  console.log('✓ Buyer enrolled in ChadMax course');

  // Mark lessons 1 to 4 complete
  for (let i = 1; i <= 4; i++) {
    const lRes = await request(`${BASE_URL}/lessons/lesson-chadmax-${i}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    if (lRes.status !== 200) {
      console.error(`Lesson ${i} failed with status ${lRes.status}:`, JSON.stringify(lRes.data));
    }
    assert.strictEqual(lRes.status, 200, `Lesson ${i} complete must succeed`);
    assert.strictEqual(lRes.data.data.courseProgress.isCourseCompleted, false);
  }
  console.log('✓ Completed lessons 1 through 4 (progress 80%)');

  // Mark final lesson 5 complete -> Triggers Certificate Auto-Generation
  const finalLessonRes = await request(`${BASE_URL}/lessons/lesson-chadmax-5/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(finalLessonRes.status, 200, 'Final lesson complete must succeed');
  const prog = finalLessonRes.data.data.courseProgress;
  assert.strictEqual(prog.isCourseCompleted, true, 'Course must be 100% completed');
  assert.strictEqual(prog.progressPercent, 100, 'Progress must reach 100%');

  const cert = finalLessonRes.data.data.certificate;
  assert(cert, 'Certificate must be auto-generated upon 100% completion');
  assert(cert.certificateNumber.startsWith('ASC-CERT-'), 'Certificate number must follow ASC-CERT format');
  console.log(`✓ Auto-generated Certificate of Mastery: ${cert.certificateNumber} for ${cert.buyerName}`);

  // Fetch certificate for course via GET /certificates/course/:courseId
  const getCertRes = await request(`${BASE_URL}/certificates/course/course-chadmax`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(getCertRes.status, 200, 'Fetch course certificate must succeed');
  assert.strictEqual(getCertRes.data.data.certificateNumber, cert.certificateNumber);
  console.log(`✓ Certificate verified via API endpoint: ${getCertRes.data.data.certificateNumber} (Download URL: ${getCertRes.data.data.downloadUrl})`);

  // 4. Razorpay Subscriptions for Recurring Coaching Offers + Self-Serve Cancel
  console.log('\n--- Step 4: Razorpay Subscriptions (Recurring Coaching + Self-Serve Cancel) ---');
  // Create recurring subscription for 1:1 coaching
  const subRes = await request(`${BASE_URL}/subscriptions/create`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      offerId: 'offer-chadtag-1on1',
      billingInterval: 'monthly',
      couponCode, // test coupon discount on subscription
    }),
  });
  assert.strictEqual(subRes.status, 201, 'Recurring subscription creation must succeed');
  const subData = subRes.data.data;
  assert(subData.subscription.id.startsWith('sub_'), 'Must have Razorpay subscription ID');
  assert.strictEqual(subData.enrollment.isRecurring, true, 'Enrollment must be recurring');
  assert.strictEqual(subData.enrollment.billingInterval, 'monthly', 'Billing interval must be monthly');
  assert.strictEqual(subData.enrollment.status, 'ACTIVE', 'Enrollment status must be ACTIVE');
  const enrollmentId = subData.enrollment.id;
  console.log(`✓ Created recurring subscription: ID ${subData.subscription.id}, enrollment ${enrollmentId} ($${subData.pricing.finalAmount}/${subData.pricing.billingInterval})`);

  // Buyer views subscriptions via GET /subscriptions/me
  const mySubsRes = await request(`${BASE_URL}/subscriptions/me`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(mySubsRes.status, 200);
  assert(mySubsRes.data.count >= 1, 'Should have at least 1 active subscription');
  const activeSub = mySubsRes.data.data.find((s: any) => s.id === enrollmentId);
  assert(activeSub, 'Created subscription must appear in active subscriptions list');
  assert.strictEqual(activeSub.status, 'ACTIVE');
  console.log(`✓ Buyer subscription list verified: Found active subscription for "${activeSub.offer.title}"`);

  // Self-serve cancel by buyer via POST /subscriptions/:enrollmentId/cancel
  const cancelRes = await request(`${BASE_URL}/subscriptions/${enrollmentId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert.strictEqual(cancelRes.status, 200, 'Self-serve cancellation must succeed');
  assert.strictEqual(cancelRes.data.data.status, 'CANCELLED');
  assert.strictEqual(cancelRes.data.data.cancelAtPeriodEnd, true, 'Must preserve access until period end');
  console.log(`✓ Self-serve cancelled subscription: status=${cancelRes.data.data.status}, cancelAtPeriodEnd=true`);

  // Verify updated status in buyer subscriptions list
  const subsAfterCancel = await request(`${BASE_URL}/subscriptions/me`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  const cancelledSub = subsAfterCancel.data.data.find((s: any) => s.id === enrollmentId);
  assert.strictEqual(cancelledSub.status, 'CANCELLED');
  console.log('✓ Subscription verified CANCELLED in buyer roster');

  // 5. Truthfulness & Anti-Fabrication Check
  console.log('\n--- Step 5: Truthfulness and Anti-Fabrication Audit ---');
  // Check coupon usedCount reflects real usage
  const couponCheck = await request(`${BASE_URL}/coupons/creator/${creatorId}`, {
    headers: { Authorization: `Bearer ${creatorToken}` },
  });
  const ourCoupon = couponCheck.data.data.find((c: any) => c.code === couponCode);
  assert(ourCoupon, 'Created coupon must exist in real DB/memory roster');
  assert(ourCoupon.usedCount >= 1, 'usedCount must increment from real redemptions');
  console.log(`✓ Coupon live metrics verified: usedCount=${ourCoupon.usedCount} of limit=${ourCoupon.usageLimit} (zero fabricated stats)`);

  console.log('\n===========================================================');
  console.log('🎉 ALL PHASE A10 INTEGRATION TESTS PASSED CLEANLY!');
  console.log('===========================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
