import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, Role } from '../types/auth.types.js';
import { verifyToken } from '../config/jwt.js';
import { prisma } from '../config/db.js';

/**
 * Middleware: Verify Bearer JWT in Authorization header and attach user payload to request
 */
export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Authorization header. Format must be "Bearer <token>".',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Token has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token signature.',
    });
    return;
  }
};

/**
 * Middleware Factory: Enforce role-based access control
 * Usage: requireRole('CREATOR', 'ADMIN') or requireRole('ADMIN')
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted. Required role(s): [${allowedRoles.join(', ')}]. Current user role: "${req.user.role}".`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: Verify that the user is a creator whose profile has been marked 'VERIFIED'
 */
export const requireVerifiedCreator = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: User authentication required.',
    });
    return;
  }

  // Admins bypass verified creator check
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  if (req.user.role !== 'CREATOR') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: User is not registered as a creator.',
    });
    return;
  }

  try {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: req.user.userId },
      select: { verificationStatus: true },
    });

    if (!profile) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Creator profile not found. Please complete profile setup.',
      });
      return;
    }

    if (profile.verificationStatus !== 'VERIFIED') {
      res.status(403).json({
        success: false,
        error: `Forbidden: Creator profile is currently "${profile.verificationStatus}". Only verified coaches can publish offers or host live sessions.`,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking creator verification status.',
    });
  }
};

/**
 * Middleware: Optional JWT authentication (attaches user if valid token exists, proceeds regardless)
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch {
      // ignore token error for optional auth
    }
  }
  next();
};

export const optionalAuthenticateJWT = optionalAuth;

