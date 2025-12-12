import { Hono } from 'hono';
import type { Context } from 'hono';
import { fetchFinnhub } from '../lib/finhub';
import type { StockQuote } from '../lib/types';

const app = new Hono();

// GET /quotes/:symbol - Fetch latest quote
app.get('/:symbol', async (c: Context) => {
  const symbol = c.req.param('symbol').toUpperCase();
  if (!symbol) {
    return c.json({ error: 'Symbol is required' }, 400);
  }

  try {
    // Endpoint: /quote?symbol=:symbol
    const data = await fetchFinnhub('/quote', { symbol });
    console.log('Raw Finnhub quote response:', data); // Debug log - check terminal when hitting endpoint

    if (!data.c) {
      return c.json({ error: 'No quote found for symbol (check API key or tier)' }, 404);
    }

    // Map with fallbacks (Finnhub: c=current, h=high, l=low, o=open, pc=previous close; no size/bid/ask in free)
    const quote: StockQuote = {
      askprice: data.c || data.h || 0,
      asksize: 0,
      bidprice: data.c || data.l || 0,
      bidsize: 0,
      timestamp: data.t * 1000 || Date.now(),
    };

    return c.json(quote);
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return c.json({ error: 'Failed to fetch quote - check Finnhub rate limits or key' }, 500);
  }
});

export default app;