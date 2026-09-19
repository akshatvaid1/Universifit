import 'dotenv/config';
import { generateToken } from './config/jwt.js';
import { inMemoryStore } from './config/inMemoryDb.js';

const BASE_URL = 'http://localhost:5000';

async function runA7Tests() {
  console.log('\n======================================================');
  console.log('--- STARTING PHASE A7 CREATOR VERIFICATION TESTS ---');
  console.log('======================================================\n');

  const testCreatorUserId = 'user-chadtag';
  const testCreatorId = 'creator-chadtag';

  // Tokens
  const creatorToken = generateToken({
    userId: testCreatorUserId,
    email: 'chadtag@ascend.io',
    fullName: 'Chadtag',
    role: 'CREATOR',
  });

  const buyerToken = generateToken({
    userId: 'user-buyer-unauthorized',
    email: 'buyer@ascend.io',
    fullName: 'Random Buyer',
    role: 'BUYER',
  });

  const adminToken = generateToken({
    userId: 'user-admin',
    email: 'admin@ascend.io',
    fullName: 'Ascend Platform Admin',
    role: 'ADMIN',
  });

  // ----------------------------------------------------
  // TEST 1: Creator Document Upload (POST /api/creators/:id/verification-docs)
  // ----------------------------------------------------
  console.log('[TEST 1]: Creator Uploading Verification Documents');
  const uploadDocsRes = await fetch(`${BASE_URL}/api/creators/${testCreatorId}/verification-docs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creatorToken}`,
    },
    body: JSON.stringify({
      documents: [
        'https://ascend-media.s3.amazonaws.com/verifications/a7athlete/nasm_certification.pdf',
        'https://ascend-media.s3.amazonaws.com/verifications/a7athlete/govt_id_card.pdf',
      ],
    }),
  });

  const uploadDocsData = (await uploadDocsRes.json()) as any;
  console.log('Upload Docs Status:', uploadDocsRes.status);
  console.log('Upload Docs Response:', uploadDocsData);

  if (!uploadDocsRes.ok || !uploadDocsData.success) {
    throw new Error(`Test 1 Failed: Upload docs error: ${JSON.stringify(uploadDocsData)}`);
  }
  if (uploadDocsData.data.verificationStatus !== 'PENDING') {
    throw new Error(`Test 1 Failed: Status should be PENDING, got: ${uploadDocsData.data.verificationStatus}`);
  }
  const returnedDocs = uploadDocsData.data.allVerificationDocs || uploadDocsData.data.uploadedDocuments || uploadDocsData.data.verificationDocs;
  if (!returnedDocs || returnedDocs.length < 2) {
    throw new Error(`Test 1 Failed: Expected at least 2 documents in verificationDocs`);
  }
  console.log('✔ TEST 1 PASSED: Verification documents saved, status set to PENDING\n');

  // ----------------------------------------------------
  // TEST 2: Check Public Profile Prior to Approval (Badge must be FALSE)
  // ----------------------------------------------------
  console.log('[TEST 2]: Checking Public Profile — Verified Badge Must Be Inactive');
  const profilePendingRes = await fetch(`${BASE_URL}/api/creators/${testCreatorId}`);
  const profilePendingData = (await profilePendingRes.json()) as any;
  const profilePending = profilePendingData.data || profilePendingData.creator;
  console.log('Public Profile Status:', profilePendingRes.status);
  console.log('Public Profile isVerified:', profilePending?.isVerified, 'Status:', profilePending?.verificationStatus);

  if (profilePending?.isVerified === true) {
    throw new Error('Test 2 Failed: isVerified must be FALSE while status is PENDING');
  }
  if (profilePending?.verificationStatus !== 'PENDING') {
    throw new Error(`Test 2 Failed: verificationStatus expected PENDING, got: ${profilePending?.verificationStatus}`);
  }
  console.log('✔ TEST 2 PASSED: Public profile correctly reflects unverified status (no badge)\n');

  // ----------------------------------------------------
  // TEST 3: Unauthorized User Cannot Approve (Role Guard)
  // ----------------------------------------------------
  console.log('[TEST 3]: Unauthorized Buyer Attempting Admin Approve');
  const unauthApproveRes = await fetch(`${BASE_URL}/api/admin/creators/${testCreatorId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({ note: 'Sneaky approval' }),
  });

  console.log('Unauth Approve HTTP Status:', unauthApproveRes.status);
  if (unauthApproveRes.status !== 403 && unauthApproveRes.status !== 401) {
    throw new Error(`Test 3 Failed: Expected 403 Forbidden for non-admin, got: ${unauthApproveRes.status}`);
  }
  console.log('✔ TEST 3 PASSED: Non-admin rejected with 403 Forbidden\n');

  // ----------------------------------------------------
  // TEST 4: Admin Approve Route (POST /api/admin/creators/:id/approve)
  // ----------------------------------------------------
  console.log('[TEST 4]: Admin Approving Creator Application');
  const adminApproveRes = await fetch(`${BASE_URL}/api/admin/creators/${testCreatorId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ note: 'Credentials authenticated with NASM registry.' }),
  });

  const approveData = (await adminApproveRes.json()) as any;
  console.log('Admin Approve HTTP Status:', adminApproveRes.status);
  console.log('Admin Approve Response:', approveData);

  if (!adminApproveRes.ok || !approveData.success) {
    throw new Error(`Test 4 Failed: Admin approve failed: ${JSON.stringify(approveData)}`);
  }
  if (approveData.data.verificationStatus !== 'VERIFIED') {
    throw new Error(`Test 4 Failed: Expected VERIFIED, got ${approveData.data.verificationStatus}`);
  }
  if (!approveData.data.verifiedAt) {
    throw new Error('Test 4 Failed: Expected verifiedAt timestamp to be set');
  }
  if (approveData.data.isVerified !== true) {
    throw new Error('Test 4 Failed: Expected isVerified to be true');
  }
  console.log('✔ TEST 4 PASSED: Creator successfully approved, verifiedAt timestamp saved\n');

  // ----------------------------------------------------
  // TEST 5: Public Profile Now Displays Verified Status (Drives Badge)
  // ----------------------------------------------------
  console.log('[TEST 5]: Checking Public Profile — Verified Badge Must Be ACTIVE');
  const profileVerifiedRes = await fetch(`${BASE_URL}/api/creators/${testCreatorId}`);
  const profileVerifiedData = (await profileVerifiedRes.json()) as any;
  const profileVerified = profileVerifiedData.data || profileVerifiedData.creator;
  console.log('Public Profile Status:', profileVerifiedRes.status);
  console.log('Public Profile isVerified:', profileVerified?.isVerified, 'Status:', profileVerified?.verificationStatus);

  if (profileVerified?.isVerified !== true) {
    throw new Error('Test 5 Failed: isVerified must be TRUE when VERIFIED');
  }
  if (profileVerified?.verificationStatus !== 'VERIFIED') {
    throw new Error(`Test 5 Failed: verificationStatus expected VERIFIED, got: ${profileVerified?.verificationStatus}`);
  }
  console.log('✔ TEST 5 PASSED: Public profile status is VERIFIED and isVerified is TRUE (badge renders)\n');

  // ----------------------------------------------------
  // TEST 6: Admin Reject Route (POST /api/admin/creators/:id/reject)
  // ----------------------------------------------------
  console.log('[TEST 6]: Admin Rejecting Creator Application');
  const adminRejectRes = await fetch(`${BASE_URL}/api/admin/creators/${testCreatorId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ reason: 'Official certification has expired and requires renewal.' }),
  });

  const rejectData = (await adminRejectRes.json()) as any;
  console.log('Admin Reject HTTP Status:', adminRejectRes.status);
  console.log('Admin Reject Response:', rejectData);

  if (!adminRejectRes.ok || !rejectData.success) {
    throw new Error(`Test 6 Failed: Admin reject failed: ${JSON.stringify(rejectData)}`);
  }
  if (rejectData.data.verificationStatus !== 'REJECTED') {
    throw new Error(`Test 6 Failed: Expected REJECTED, got: ${rejectData.data.verificationStatus}`);
  }
  if (!rejectData.data.rejectionReason) {
    throw new Error('Test 6 Failed: Expected rejectionReason to be set');
  }
  if (rejectData.data.isVerified !== false) {
    throw new Error('Test 6 Failed: Expected isVerified to be false upon rejection');
  }
  console.log('✔ TEST 6 PASSED: Creator successfully rejected with reason stored\n');

  // ----------------------------------------------------
  // TEST 7: Public Profile After Rejection (Badge must be FALSE)
  // ----------------------------------------------------
  console.log('[TEST 7]: Checking Public Profile Post-Rejection');
  const profileRejectedRes = await fetch(`${BASE_URL}/api/creators/${testCreatorId}`);
  const profileRejectedData = (await profileRejectedRes.json()) as any;
  const profileRejected = profileRejectedData.data || profileRejectedData.creator;
  console.log('Public Profile isVerified:', profileRejected?.isVerified, 'Status:', profileRejected?.verificationStatus);

  if (profileRejected?.isVerified === true) {
    throw new Error('Test 7 Failed: isVerified must be FALSE after rejection');
  }
  if (profileRejected?.verificationStatus !== 'REJECTED') {
    throw new Error(`Test 7 Failed: verificationStatus expected REJECTED, got: ${profileRejected?.verificationStatus}`);
  }
  console.log('✔ TEST 7 PASSED: Public profile reflects REJECTED status (no badge rendered)\n');

  // ----------------------------------------------------
  // TEST 8: Admin List Creators (GET /api/admin/creators)
  // ----------------------------------------------------
  console.log('[TEST 8]: Admin Fetching Creator Applications List');
  const adminListRes = await fetch(`${BASE_URL}/api/admin/creators?status=all`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  const adminListData = (await adminListRes.json()) as any;
  const creatorList = adminListData.data?.creators || adminListData.creators || [];
  console.log('Admin List HTTP Status:', adminListRes.status);
  console.log('Admin List Creator Count:', creatorList.length);

  if (!adminListRes.ok || !adminListData.success) {
    throw new Error(`Test 8 Failed: Failed to fetch admin creators list: ${JSON.stringify(adminListData)}`);
  }
  const foundCreator = creatorList.find((c: any) => c.id === testCreatorId);
  if (!foundCreator) {
    throw new Error(`Test 8 Failed: test creator ${testCreatorId} not found in admin creators list`);
  }
  console.log('Found creator in admin list:', {
    id: foundCreator.id,
    handle: foundCreator.handle,
    status: foundCreator.verificationStatus,
    docsCount: foundCreator.verificationDocs?.length,
  });
  console.log('✔ TEST 8 PASSED: Admin list accurately returns application data without fabricated entries\n');

  // ----------------------------------------------------
  // TEST 9: Admin Re-Verify / Restore Seed State (PATCH /api/admin/creators/:id/verify)
  // ----------------------------------------------------
  console.log('[TEST 9]: Admin Restoring Verified State');
  const restoreRes = await fetch(`${BASE_URL}/api/admin/creators/${testCreatorId}/verify`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'VERIFIED' }),
  });

  const restoreData = (await restoreRes.json()) as any;
  if (!restoreRes.ok || !restoreData.success || restoreData.data?.verificationStatus !== 'VERIFIED') {
    throw new Error(`Test 9 Failed: Failed to restore VERIFIED status: ${JSON.stringify(restoreData)}`);
  }
  console.log('✔ TEST 9 PASSED: Seed creator restored to VERIFIED status\n');

  console.log('======================================================');
  console.log('🎉 ALL 9 PHASE A7 VERIFICATION INTEGRATION TESTS PASSED!');
  console.log('======================================================\n');
}

runA7Tests().catch((err) => {
  console.error('\n❌ PHASE A7 INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
