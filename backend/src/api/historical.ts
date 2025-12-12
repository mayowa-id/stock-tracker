import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { getHistoricalData } from '../lib/yahoo-finance';
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

  const from = params.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const to = params.to || new Date().toISOString().split('T')[0];

  const fromUnix = Math.floor(new Date(from).getTime() / 1000);
  const toUnix = Math.floor(new Date(to).getTime() / 1000);

  const interval = params.timespan === 'day' ? '1d' : params.timespan === 'week' ? '1wk' : '1mo'; // Map to Yahoo intervals

  try {
    const data = await getHistoricalData(symbol, fromUnix, toUnix, interval);
    console.log('Raw Yahoo historical response:', data); // Debug

    if (data.length === 0) {
      return c.json({ error: 'No historical data found' }, 404);
    }

    // Map to AggregatesResponse format
    const results = data.map((bar: any) => ({
      o: bar.open,
      h: bar.high,
      l: bar.low,
      c: bar.close,
      v: bar.volume,
      vw: (bar.open + bar.high + bar.low + bar.close) / 4, // Approximate vw
      t: bar.timestamp,
      n: 0, // Not available
    }));

    const response: AggregatesResponse = {
      ticker: symbol,
      queryCount: results.length,
      resultsCount: results.length,
      adjusted: true,
      results,
      status: 'OK',
      request_id: '',
      count: results.length
    };

    return c.json(response);
  } catch (err) {
    console.error(`Error fetching historical for ${symbol}:`, err);
    return c.json({ error: 'Failed to fetch historical data' }, 500);
  }
});

export default app;