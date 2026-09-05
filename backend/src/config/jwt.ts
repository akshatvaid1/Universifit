import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthUserPayload } from '../types/auth.types.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'ascend-default-jwt-secret-key-32chars';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for an authenticated user
 */
export const generateToken = (payload: AuthUserPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verify and decode an incoming JWT token string
 */
export const verifyToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
};

/**
 * Hash a plain password using bcrypt (10 salt rounds)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Synchronous hash password helper for initial seeding
 */
export const hashPasswordSync = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};

/**
 * Compare plain password against a stored bcrypt hash
 */
export const comparePassword = async (
  plain: string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

