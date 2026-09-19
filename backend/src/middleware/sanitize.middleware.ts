import { Request, Response, NextFunction } from 'express';

/**
 * Ascend Input Sanitization Middleware
 * Recursively cleans incoming req.body, req.query, and req.params:
 * 1. Strips null bytes (\0) to prevent poison-null-byte attacks
 * 2. Neutralizes <script> tags and javascript: pseudo-protocols on user input
 * 3. Preserves password fields exactly as entered (passwords should not be altered)
 * 4. Trims leading/trailing whitespace on string values
 */

const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const JAVASCRIPT_PROTO_REGEX = /javascript\s*:/gi;
const NULL_BYTE_REGEX = /\0/g;

export function sanitizeValue(value: any, keyName?: string): any {
  if (value === null || value === undefined) {
    return value;
  }

  // Passwords must NOT be modified or stripped of special characters
  if (keyName && /password/i.test(keyName)) {
    if (typeof value === 'string') {
      // Only remove null bytes from passwords
      return value.replace(NULL_BYTE_REGEX, '');
    }
    return value;
  }

  if (typeof value === 'string') {
    return value
      .replace(NULL_BYTE_REGEX, '')
      .replace(SCRIPT_REGEX, '')
      .replace(JAVASCRIPT_PROTO_REGEX, 'blocked-protocol:')
      .trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, keyName));
  }

  if (typeof value === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitizedObj[k] = sanitizeValue(v, k);
    }
    return sanitizedObj;
  }

  return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }
  } catch (err) {
    console.warn('[SanitizeInput Middleware Warning]:', err);
  }
  next();
}
