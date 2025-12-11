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
    if (!data?.last) {
      return c.json({ error: 'No quote found for symbol' }, 404);
    }

    // Map to our type (correct Polygon fields: P=ask, p=bid, etc.)
    const quote: StockQuote = {
      askprice: data.last.P || 0,
      asksize: data.last.S || 0,
      bidprice: data.last.p || 0,
      bidsize: data.last.s || 0,
      timestamp: data.last.t || Date.now(),
    };

    return c.json(quote);
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return c.json({ error: 'Failed to fetch quote' }, 500);
  }
});

export default app;