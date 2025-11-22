import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { fetchPolygon } from '../lib/polygon';
import type { AggregatesResponse } from '../lib/types';

const app = new Hono();

// Validation schema for query params
const historicalSchema = z.object({
  from: z.string().optional(), // YYYY-MM-DD
  to: z.string().optional(),   // YYYY-MM-DD
  timespan: z.enum(['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']).optional().default('day'),
  multiplier: z.coerce.number().min(1).optional().default(1),
});

// GET /historical/:symbol - Fetch historical aggregates
app.get('/:symbol', async (c: Context) => {
  const symbol = c.req.param('symbol').toUpperCase();
  if (!symbol) {
    return c.json({ error: 'Symbol is required' }, 400);
  }

  let params;
  try {
    params = historicalSchema.parse(c.req.query());
  } catch (err) {
    return c.json({ error: 'Invalid query parameters' }, 400);
  }

  const from = params.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default: 30 days ago
  const to = params.to || new Date().toISOString().split('T')[0];

  try {
    // Endpoint: /v2/aggs/ticker/:symbol/range/:multiplier/:timespan/:from/:to
    const endpoint = `/v2/aggs/ticker/${symbol}/range/${params.multiplier}/${params.timespan}/${from}/${to}`;
    const data: AggregatesResponse = await fetchPolygon(endpoint, { adjusted: 'true' }); // Add params like adjusted=true

    if (!data.results || data.results.length === 0) {
      return c.json({ error: 'No historical data found' }, 404);
    }

    return c.json(data);
  } catch (err) {
    console.error(`Error fetching historical for ${symbol}:`, err);
    return c.json({ error: 'Failed to fetch historical data' }, 500);
  }
});

export default app;