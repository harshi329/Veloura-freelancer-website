import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/index.js';
import type { UserRole } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'veloura-local-jwt-secret-key-2026-secure';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export function signToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

/** Short-lived signed payloads (e.g. OAuth `state`) using the same server secret. */
export function signShortLived(payload: Record<string, unknown>, expiresIn = '10m'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyShortLived<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.cookies && req.cookies.veloura_token) {
    return req.cookies.veloura_token;
  }
  return null;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: UserRole };
    const user = await User.findById(decoded.sub);
    if (!user) {
      res.status(401).json({ error: 'User session is no longer valid.' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: UserRole };
      const user = await User.findById(decoded.sub);
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
      });
      return;
    }
    next();
  };
}
