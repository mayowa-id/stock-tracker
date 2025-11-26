import { Context, Next } from 'hono';
import { extractToken, verifyToken } from '../lib/auth';
import { prisma } from '../lib/db';

// Extend Context to include user
export interface AuthContext extends Context {
  user?: {
    userId: string;
    email: string;
  };
}

// Authentication middleware
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  try {
    const payload = verifyToken(token);
    
    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return c.json({ error: 'Unauthorized - User not found' }, 401);
    }

    // Attach user to context
    c.set('user', { userId: user.id, email: user.email });
    await next();
  } catch (err: any) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (token) {
    try {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true },
      });

      if (user) {
        c.set('user', { userId: user.id, email: user.email });
      }
    } catch (err) {
      // Ignore invalid tokens for optional auth
    }
  }

  await next();
}