import { Hono } from 'hono';
import type { Context } from 'hono';
import { fetchPolygon } from '../lib/polygon';
import type { StockQuote } from '../lib/types';

const app = new Hono();

// GET /quotes/:symbol - Fetch latest quote
app.get('/:symbol', async (c: Context) => {
  const symbol = c.req.param('symbol').toUpperCase();
  if (!symbol) {
    return c.json({ error: 'Symbol is required' }, 400);
  }

  try {
    // Endpoint: /v2/last/nbbo/:symbol
    const data = await fetchPolygon(`/v2/last/nbbo/${symbol}`);
    console.log('Raw Polygon quote response:', data); // Debug log - check terminal when hitting endpoint

    if (!data?.last) {
      return c.json({ error: 'No quote found for symbol (check API key or tier)' }, 404);
    }

    // Map with fallbacks (Polygon: P=ask price, S=ask size, p=bid price, s=bid size)
    const quote: StockQuote = {
      askprice: data.last.P || data.last.p || 0, // Fallback to bid if ask missing
      asksize: data.last.S || data.last.s || 0,
      bidprice: data.last.p || data.last.P || 0, // Fallback to ask if bid missing
      bidsize: data.last.s || data.last.S || 0,
      timestamp: data.last.t || Date.now(),
    };

    return c.json(quote);
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return c.json({ error: 'Failed to fetch quote - check Polygon rate limits or key' }, 500);
  }
});

export default app;