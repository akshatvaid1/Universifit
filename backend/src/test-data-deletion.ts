import dotenv from 'dotenv';
dotenv.config();

import assert from 'assert';
import { generateToken } from './config/jwt.js';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runDataDeletionTests() {
  console.log('\n🛡️ ==================== DATA DELETION & EXPORT TEST ====================');

  // Test 1: Unauthenticated request to /api/users/delete-account returns 401
  const unauthRes = await fetch(`${BASE_URL}/users/delete-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation: 'DELETE' }),
  });
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated deletion request should return 401');
  console.log('  ✅ [PASS]: Unauthenticated delete request strictly returns 401 Unauthorized');

  // Test 2: Unauthenticated request to /api/users/data-export returns 401
  const unauthExport = await fetch(`${BASE_URL}/users/data-export`);
  assert.strictEqual(unauthExport.status, 401, 'Unauthenticated export request should return 401');
  console.log('  ✅ [PASS]: Unauthenticated export request strictly returns 401 Unauthorized');

  // Test 3: Authenticate via login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'chadtag@ascend.io', password: 'chadtag123' }),
  });
  const loginJson: any = await loginRes.json();
  const token = loginJson.token;

  const badConfirmRes = await fetch(`${BASE_URL}/users/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ confirmation: 'NO' }),
  });
  assert.strictEqual(badConfirmRes.status, 400, 'Invalid confirmation should return 400');
  const badJson: any = await badConfirmRes.json();
  assert(badJson.error.includes('DELETE'), 'Error message should instruct typing DELETE');
  console.log('  ✅ [PASS]: Deletion request without typing DELETE strictly returns 400 Mismatch');

  // Test 4: Authenticated data export returns personal data archive
  const exportRes = await fetch(`${BASE_URL}/users/data-export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(exportRes.status, 200, 'Data export should return 200');
  const exportJson: any = await exportRes.json();
  assert.strictEqual(exportJson.success, true);
  assert.strictEqual(exportJson.data.complianceFramework, 'DPDP Act 2023 & GDPR Art. 15');
  assert(exportJson.data.user);
  assert.strictEqual(exportJson.data.user.passwordHash, undefined, 'Password hash must be stripped from export');
  // Test 5: Full Account Deletion flow on newly registered user
  const tempEmail = `delete-test-${Date.now()}@ascend.io`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Ephemeral User',
      email: tempEmail,
      password: 'EphemeralPass123!',
      role: 'BUYER',
    }),
  });
  assert.strictEqual(regRes.status, 201, 'Registration should succeed');
  const regJson: any = await regRes.json();
  const ephemeralToken = regJson.token;

  const deleteRes = await fetch(`${BASE_URL}/users/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ephemeralToken}`,
    },
    body: JSON.stringify({
      confirmation: 'DELETE',
      reason: 'Testing DPDP Act compliance erasure',
      feedback: 'Excellent platform, just running integration tests',
    }),
  });
  assert.strictEqual(deleteRes.status, 200, 'Account deletion should return 200');
  const deleteJson: any = await deleteRes.json();
  assert.strictEqual(deleteJson.success, true);
  assert(deleteJson.message.includes('permanently erased'));
  console.log('  ✅ [PASS]: Full account & personal data erasure flow succeeds with 200 and audit confirmation');

  console.log('\n=============================================================');
  console.log('Data Deletion & Privacy Compliance Tests Passed!');
  console.log('=============================================================\n');
}

runDataDeletionTests().catch((err) => {
  console.error('Data Deletion Test failed:', err);
  process.exit(1);
});
