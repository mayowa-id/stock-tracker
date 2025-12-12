import { Hono } from 'hono';
import type { Context } from 'hono';
import { getQuote } from '../lib/yahoo-finance.js';
import type { StockQuote } from '../lib/types';

const app = new Hono();

// GET /quotes/:symbol - Fetch latest quote
app.get('/:symbol', async (c: Context) => {
  const symbol = c.req.param('symbol').toUpperCase();
  if (!symbol) {
    return c.json({ error: 'Symbol is required' }, 400);
  }

  try {
    const data = await getQuote(symbol);
    console.log('Raw Yahoo quote response:', data); // Debug

    // Map to StockQuote
    const quote: StockQuote = {
      askprice: data.price || 0, // Fallback
      asksize: 0, // Not in basic quote
      bidprice: data.price || 0,
      bidsize: 0,
      timestamp: Date.now(),
    };

    return c.json(quote);
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return c.json({ error: 'Failed to fetch quote' }, 500);
  }
});

export default app;