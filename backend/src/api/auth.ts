import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { hashPassword, verifyPassword, generateToken } from '../lib/auth';
import { authMiddleware } from '../middleware/auth';

const app = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// POST /auth/register - Register new user
app.post('/register', async (c: Context) => {
  try {
    const body = await c.req.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);

    // Create user and account in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email,
          password: hashedPassword,
          firstName: validated.firstName,
          lastName: validated.lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      // Create account with starting balance
      await tx.account.create({
        data: {
          userId: newUser.id,
          cash: 100000,
          buyingPower: 100000,
          portfolioValue: 100000,
        },
      });

      return newUser;
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return c.json(
      {
        message: 'User registered successfully',
        user,
        token,
      },
      201
    );
  } catch (err: unknown) {
    // Safe logging & zod handling
    const message = err instanceof Error ? err.message : String(err);
    console.error('Registration error:', message);

    if (err instanceof z.ZodError) {
      // Zod exposes `issues` (not `errors`)
      const details = err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return c.json({ error: 'Invalid input', details }, 400);
    }

    return c.json({
      error: 'Registration failed',
      debug: process.env.NODE_ENV === 'development' ? message : undefined,
    }, 500);
  }
});

// POST /auth/login - Login user
app.post('/login', async (c: Context) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(validated.password, user.password);

    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Login error:', message);

    if (err instanceof z.ZodError) {
      const details = err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return c.json({ error: 'Invalid input', details }, 400);
    }
    return c.json({ error: 'Login failed' }, 500);
  }
});

// GET /auth/me - Get current user (protected route)
app.get('/me', authMiddleware, async (c: Context) => {
  try {
    const { userId } = c.get('user');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Get user error:', message);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// POST /auth/logout - Logout (client should delete token)
app.post('/logout', authMiddleware, async (c: Context) => {
  // JWT is stateless, so logout is handled client-side by deleting the token
  // This endpoint exists for consistency and future session management
  return c.json({ message: 'Logged out successfully' });
});

export default app;
