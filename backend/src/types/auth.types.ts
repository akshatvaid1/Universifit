import { Request } from 'express';

export type Role = 'BUYER' | 'CREATOR' | 'ADMIN';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: Role;
  fullName: string;
}

declare global {
  namespace Express {
    interface User extends AuthUserPayload {}
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
