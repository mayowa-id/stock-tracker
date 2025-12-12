import { cors } from 'hono/cors';
import type { Context } from 'hono';

// Configured CORS middleware (allow all origins for dev; restrict in prod)
export const corsMiddleware = cors({
  origin: '*', // Change to specific origins like ['http://localhost:3000', 'https://your-frontend.com']
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
});