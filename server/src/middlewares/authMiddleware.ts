import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

export function extractUserFromRequest(req: Request): AuthenticatedUser | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);
    if (payload) {
      req.token = token;
      return { id: payload.sub, email: payload.email, role: payload.role };
    }
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = extractUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
    });
    return;
  }
  req.user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const user = extractUserFromRequest(req);
  if (user) {
    req.user = user;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions for this resource.',
      });
      return;
    }
    next();
  };
}
