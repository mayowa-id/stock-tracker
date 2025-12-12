import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getHistoricalData } from '../lib/yahoo-finance';

const app = new Hono();

// Validation schema for query params
const analyticsSchema = z.object({
  period: z.coerce.number().min(1).max(200).optional().default(50), // e.g., 50-day SMA
});

// GET /analytics/:symbol - Compute simple analytics (e.g., SMA)
app.get('/:symbol', async (c: Context) => {
  const symbol = c.req.param('symbol').toUpperCase();
  if (!symbol) {
    return c.json({ error: 'Symbol is required' }, 400);
  }

  let params;
  try {
    params = analyticsSchema.parse(c.req.query());
  } catch (err) {
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const period = params.period;

  // Fetch enough historical data (double the period for buffer)
  const fromUnix = Math.floor((Date.now() - period * 2 * 24 * 60 * 60 * 1000) / 1000);
  const toUnix = Math.floor(Date.now() / 1000);

  try {
    const data = await getHistoricalData(symbol, fromUnix, toUnix, '1d');
    console.log('Raw Yahoo analytics historical:', data); // Debug

    if (data.length < period) {
      return c.json({ error: 'Insufficient data for analytics' }, 404);
    }

    // Compute SMA from last 'period' closing prices
    const closes = data.slice(-period).map((bar: any) => bar.close);
    const sma = closes.reduce((sum, price) => sum + price, 0) / period;

    return c.json({
      symbol,
      period,
      sma: Number(sma.toFixed(2)), // Round to 2 decimals
      lastClose: closes[closes.length - 1],
    });
  } catch (err) {
    console.error(`Error computing analytics for ${symbol}:`, err);
    return c.json({ error: 'Failed to compute analytics' }, 500);
  }
});

export default app;