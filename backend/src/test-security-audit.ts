/**
 * Ascend Security Audit Verification Test Suite
 * Validates:
 * 1. Password Hashing (bcrypt, no plaintext anywhere, no passwordHash leakage)
 * 2. Input Sanitization & SQL Injection (zero $queryRawUnsafe, XSS script/protocol neutralizing)
 * 3. CORS Hardening (strict origin whitelist, rejection of untrusted origins, no wildcard with credentials)
 * 4. Sensitive Routes Auth Middleware (401 on unauthenticated, 403 on role/ownership mismatch)
 * 5. Frontend Bundle Secret Scanning (scans dist/ for API keys/secrets)
 */

import fs from 'fs';
import path from 'path';
import { hashPassword, comparePassword } from './config/jwt.js';
import { inMemoryStore } from './config/inMemoryDb.js';
import { sanitizeValue } from './middleware/sanitize.middleware.js';
import { escapeHtml } from './services/email.service.js';

const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ [PASS]: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL]: ${message}`);
    failed++;
  }
}

async function request(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; headers: Headers; data: any }> {
  const url = `${BASE_URL}${endpoint}`;
  const reqHeaders: Record<string, string> = {
    ...(options.headers || {}),
  };

  let payload: string | undefined;
  if (options.body) {
    payload = JSON.stringify(options.body);
    reqHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: reqHeaders,
    body: payload,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, headers: res.headers, data };
}

async function runSecurityAudit() {
  console.log('\n🔒 ==================== ASCEND SECURITY AUDIT ====================');

  // -------------------------------------------------------------
  // 1. Password Hashing Audit
  // -------------------------------------------------------------
  console.log('\n[1/5] Auditing Password Hashing & Credentials Handling...');
  const testPlain = 'SecurePass_2026!';
  const hash = await hashPassword(testPlain);
  assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'hashPassword produces salted bcrypt hash');
  assert(hash !== testPlain, 'Hash is definitely not plaintext');
  const isMatch = await comparePassword(testPlain, hash);
  assert(isMatch === true, 'comparePassword validates correct password against hash');
  const isWrongMatch = await comparePassword('WrongPassword', hash);
  assert(isWrongMatch === false, 'comparePassword rejects incorrect password');

  // Confirm in-memory users have bcrypt hashes
  const adminUser = inMemoryStore.users.find((u) => u.email.toLowerCase() === 'admin@ascend.io');
  const chadtagUser = inMemoryStore.users.find((u) => u.email.toLowerCase() === 'chadtag@ascend.io');
  
  if (!adminUser || !chadtagUser) {
    console.log('  [DEBUG inMemoryStore.users]:', inMemoryStore.users.map(u => ({ email: u.email, hash: u.passwordHash })));
  }

  assert(
    Boolean(adminUser && (adminUser.passwordHash.startsWith('$2a$') || adminUser.passwordHash.startsWith('$2b$'))),
    'Platform admin user has valid bcrypt passwordHash in inMemoryDb'
  );
  assert(
    Boolean(chadtagUser && (chadtagUser.passwordHash.startsWith('$2a$') || chadtagUser.passwordHash.startsWith('$2b$'))),
    'Chadtag creator user has valid bcrypt passwordHash in inMemoryDb'
  );

  // Confirm login response does NOT leak passwordHash
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'chadtag@ascend.io', password: 'chadtag123' },
  });
  assert(loginRes.status === 200, 'Login succeeded with status 200');
  assert(loginRes.data.user && !loginRes.data.user.passwordHash, 'User object in login response omits passwordHash');
  assert(loginRes.data.user && !loginRes.data.user.password, 'User object in login response omits password');

  // Register a test buyer to get a BUYER token
  const testBuyerEmail = `security-test-buyer-${Date.now()}@ascend.io`;
  const buyerRegRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Audit Buyer',
      email: testBuyerEmail,
      password: 'BuyerPassword123!',
      role: 'BUYER',
    },
  });
  assert(buyerRegRes.status === 201, 'Buyer registration succeeded with status 201');
  assert(buyerRegRes.data.user && !buyerRegRes.data.user.passwordHash, 'User object in register response omits passwordHash');
  const buyerToken = buyerRegRes.data.token;

  // -------------------------------------------------------------
  // 2. Input Sanitization & SQL Injection Audit
  // -------------------------------------------------------------
  console.log('\n[2/5] Auditing Input Sanitization & SQL Injection Prevention...');
  
  // Check for $queryRawUnsafe in the backend source tree (excluding this test file)
  const backendSrcDir = fs.existsSync(path.resolve('src'))
    ? path.resolve('src')
    : path.resolve('backend/src');
  const checkUnsafeSql = (dir: string): number => {
    let unsafeCount = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        unsafeCount += checkUnsafeSql(fullPath);
      } else if ((file.endsWith('.ts') || file.endsWith('.js')) && !file.includes('test-security-audit')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('$queryRawUnsafe')) {
          unsafeCount++;
        }
      }
    }
    return unsafeCount;
  };
  const unsafeSqlInstances = checkUnsafeSql(backendSrcDir);
  assert(unsafeSqlInstances === 0, 'Zero occurrences of $queryRawUnsafe in backend codebase (100% parameterized)');

  // Test XSS sanitization
  const xssScript = '<script>alert("XSS")</script>Hello World';
  const sanitizedScript = sanitizeValue(xssScript);
  assert(sanitizedScript === 'Hello World', 'Script tags are completely stripped from user inputs');

  const xssProto = 'javascript:alert(document.cookie)';
  const sanitizedProto = sanitizeValue(xssProto);
  assert(!sanitizedProto.includes('javascript:'), 'javascript: pseudo-protocol is neutralized');

  const nullByteString = 'malicious\0file.pdf';
  const sanitizedNullByte = sanitizeValue(nullByteString);
  assert(!sanitizedNullByte.includes('\0'), 'Null bytes are stripped from input');

  // Test password preservation (passwords must retain special chars like <, >, &, etc.)
  const complexPass = 'P@ssw<o>rd&!123';
  const sanitizedPass = sanitizeValue(complexPass, 'password');
  assert(sanitizedPass === complexPass, 'Password fields are never corrupted or altered by sanitization');

  // Test email HTML escaping
  const dirtyHtml = '<b onmouseover=alert(1)>John & Jane</b>';
  const safeHtml = escapeHtml(dirtyHtml);
  assert(safeHtml === '&lt;b onmouseover=alert(1)&gt;John &amp; Jane&lt;/b&gt;', 'escapeHtml safely escapes HTML special characters');

  // -------------------------------------------------------------
  // 3. CORS Hardening Audit
  // -------------------------------------------------------------
  console.log('\n[3/5] Auditing CORS Security Policy...');

  // Allowed origin: http://localhost:5173
  const corsAllowed5173 = await request('/api/health', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert(
    corsAllowed5173.headers.get('access-control-allow-origin') === 'http://localhost:5173',
    'CORS permits trusted origin: http://localhost:5173'
  );
  assert(
    corsAllowed5173.headers.get('access-control-allow-credentials') === 'true',
    'CORS credentials enabled for trusted origin'
  );

  // Allowed origin: http://localhost:4173 (preview server)
  const corsAllowed4173 = await request('/api/health', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:4173',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert(
    corsAllowed4173.headers.get('access-control-allow-origin') === 'http://localhost:4173',
    'CORS permits trusted preview origin: http://localhost:4173'
  );

  // Blocked origin: malicious website
  const corsMalicious = await request('/api/health', {
    method: 'GET',
    headers: {
      Origin: 'https://evil-untrusted-site.com',
    },
  });
  assert(
    corsMalicious.headers.get('access-control-allow-origin') === null,
    'CORS strictly refuses to set Access-Control-Allow-Origin for untrusted domain'
  );
  assert(
    corsMalicious.headers.get('access-control-allow-origin') !== '*',
    'CORS does not return wildcard (*) origin when credentials are supported'
  );

  // -------------------------------------------------------------
  // 4. Sensitive Routes Auth Middleware Audit
  // -------------------------------------------------------------
  console.log('\n[4/5] Auditing Sensitive Routes for Auth Middleware & RBAC...');

  // Invoice routes
  const unauthInvoiceBuyer = await request('/api/invoices/user/me');
  assert(unauthInvoiceBuyer.status === 401, 'GET /api/invoices/user/me returns 401 Unauthorized without token');

  const unauthInvoiceCreator = await request('/api/invoices/creator/me');
  assert(unauthInvoiceCreator.status === 401, 'GET /api/invoices/creator/me returns 401 Unauthorized without token');

  const buyerInvoiceCreator = await request('/api/invoices/creator/me', {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerInvoiceCreator.status === 403, 'GET /api/invoices/creator/me returns 403 Forbidden for BUYER role');

  // Referral routes
  const unauthReferral = await request('/api/referrals/creator/me');
  assert(unauthReferral.status === 401, 'GET /api/referrals/creator/me returns 401 Unauthorized without token');

  const buyerReferral = await request('/api/referrals/creator/me', {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerReferral.status === 403, 'GET /api/referrals/creator/me returns 403 Forbidden for BUYER role');

  // Analytics routes
  const unauthAnalytics = await request('/api/analytics/creator/creator-chadtag');
  assert(unauthAnalytics.status === 401, 'GET /api/analytics/creator/:id returns 401 Unauthorized without token');

  const buyerAnalytics = await request('/api/analytics/creator/creator-chadtag', {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerAnalytics.status === 403, 'GET /api/analytics/creator/:id returns 403 Forbidden for BUYER role');

  // Coupon creation route
  const buyerCreateCoupon = await request('/api/coupons', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: { code: 'HACKER50', value: 50 },
  });
  assert(buyerCreateCoupon.status === 403, 'POST /api/coupons returns 403 Forbidden for non-creator/buyer');

  // Creator Studio Payout settings
  const unauthPayout = await request('/api/creators/payout-settings');
  assert(unauthPayout.status === 401, 'GET /api/creators/payout-settings returns 401 Unauthorized without token');

  // Admin tickets queue
  const unauthAdmin = await request('/api/admin/tickets');
  assert(unauthAdmin.status === 401, 'GET /api/admin/tickets returns 401 Unauthorized without token');

  const buyerAdmin = await request('/api/admin/tickets', {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerAdmin.status === 403, 'GET /api/admin/tickets returns 403 Forbidden for non-admin');

  // -------------------------------------------------------------
  // 5. Frontend Bundle Secret Scanning
  // -------------------------------------------------------------
  console.log('\n[5/5] Scanning Frontend Production Bundle for Leaked Secrets...');
  const distDir = fs.existsSync(path.resolve('dist/index.html'))
    ? path.resolve('dist')
    : path.resolve('../dist');
  const assetsDir = path.join(distDir, 'assets');

  if (fs.existsSync(assetsDir)) {
    const sensitivePatterns = [
      /JWT_SECRET/i,
      /RAZORPAY_KEY_SECRET/i,
      /rzp_live_[a-zA-Z0-9]{14,}/,
      /DATABASE_URL/i,
      /postgres:\/\//i,
      /postgresql:\/\//i,
      /BEGIN\s+PRIVATE\s+KEY/i,
      /AWS_SECRET_ACCESS_KEY/i,
      /RESEND_API_KEY/i,
      /SENDGRID_API_KEY/i,
    ];

    let leakedCount = 0;
    const scanFiles = (dir: string) => {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanFiles(fullPath);
        } else if (entry.endsWith('.js') || entry.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const pattern of sensitivePatterns) {
            if (pattern.test(content)) {
              console.error(`  🚨 Leaked secret pattern "${pattern}" detected in frontend asset: ${entry}`);
              leakedCount++;
            }
          }
        }
      }
    };

    scanFiles(assetsDir);
    const indexHtmlPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      for (const pattern of sensitivePatterns) {
        if (pattern.test(indexHtml)) {
          console.error(`  🚨 Leaked secret pattern "${pattern}" detected in index.html`);
          leakedCount++;
        }
      }
    }
    assert(leakedCount === 0, 'Zero secrets or sensitive private API keys found in frontend build bundle (dist/)');
  } else {
    console.log('  ⚠️ frontend dist/assets directory not found at: ' + assetsDir);
  }

  console.log('\n=============================================================');
  console.log(`Security Audit Summary: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error('[Security Audit Fatal Error]:', err);
  process.exit(1);
});
