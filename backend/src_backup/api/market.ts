import { Hono } from 'hono';
import type { Context } from 'hono';
import { getQuote, getHistoricalData, searchSymbols, getMarketMovers } from '../lib/yahoo-finance';

const app = new Hono();

// GET /market/quote/:symbol - Get real-time quote
app.get('/quote/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const quote = await getQuote(symbol);
    
    return c.json({
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      open: quote.open,
      high: quote.dayHigh,
      low: quote.dayLow,
      previousClose: quote.previousClose,
      volume: quote.volume,
      marketCap: quote.marketCap,
      currency: quote.currency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching quote:', err);
    return c.json({ error: 'Failed to fetch quote' }, 500);
  }
});

// GET /market/gainers - Top gainers
app.get('/gainers', async (c: Context) => {
  try {
    const movers = await getMarketMovers();
    
    const formatted = movers.gainers.slice(0, 10).map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.shortName || stock.longName,
      price: stock.regularMarketPrice,
      changePercent: stock.regularMarketChangePercent,
      volume: stock.regularMarketVolume,
    }));

    return c.json({ gainers: formatted });
  } catch (err) {
    console.error('Error fetching top gainers:', err);
    return c.json({ error: 'Failed to fetch top gainers' }, 500);
  }
});

// GET /market/losers - Top losers
app.get('/losers', async (c: Context) => {
  try {
    const movers = await getMarketMovers();
    
    const formatted = movers.losers.slice(0, 10).map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.shortName || stock.longName,
      price: stock.regularMarketPrice,
      changePercent: stock.regularMarketChangePercent,
      volume: stock.regularMarketVolume,
    }));

    return c.json({ losers: formatted });
  } catch (err) {
    console.error('Error fetching top losers:', err);
    return c.json({ error: 'Failed to fetch top losers' }, 500);
  }
});

// GET /market/most-active - Most active stocks
app.get('/most-active', async (c: Context) => {
  try {
    const movers = await getMarketMovers();
    
    const formatted = movers.mostActive.slice(0, 10).map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.shortName || stock.longName,
      price: stock.regularMarketPrice,
      changePercent: stock.regularMarketChangePercent,
      volume: stock.regularMarketVolume,
    }));

    return c.json({ mostActive: formatted });
  } catch (err) {
    console.error('Error fetching most active stocks:', err);
    return c.json({ error: 'Failed to fetch most active stocks' }, 500);
  }
});

// GET /market/search - Search stocks by name or symbol
app.get('/search', async (c: Context) => {
  try {
    const query = c.req.query('q');
    if (!query || query.length < 1) {
      return c.json({ error: 'Search query required' }, 400);
    }

    const results = await searchSymbols(query);
    
    const formatted = results.slice(0, 20).map((result: any) => ({
      symbol: result.symbol,
      name: result.name,
      exchange: result.exchange,
      type: result.type,
    }));

    return c.json({ results: formatted });
  } catch (err) {
    console.error('Error searching stocks:', err);
    return c.json({ error: 'Failed to search stocks' }, 500);
  }
});

// GET /market/historical/:symbol - Get historical data
app.get('/historical/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const period = c.req.query('period') || '1mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y
    const interval = c.req.query('interval') || '1d'; // 1d, 1wk, 1mo
    
    // Calculate period timestamps
    const now = Math.floor(Date.now() / 1000);
    let period1: number;
    
    switch (period) {
      case '1d': period1 = now - (1 * 24 * 60 * 60); break;
      case '5d': period1 = now - (5 * 24 * 60 * 60); break;
      case '1mo': period1 = now - (30 * 24 * 60 * 60); break;
      case '3mo': period1 = now - (90 * 24 * 60 * 60); break;
      case '6mo': period1 = now - (180 * 24 * 60 * 60); break;
      case '1y': period1 = now - (365 * 24 * 60 * 60); break;
      case '5y': period1 = now - (5 * 365 * 24 * 60 * 60); break;
      default: period1 = now - (30 * 24 * 60 * 60);
    }
    
    const data = await getHistoricalData(
      symbol,
      period1,
      now,
      interval as '1d' | '1wk' | '1mo'
    );
    
    return c.json({
      symbol,
      period,
      interval,
      bars: data,
      count: data.length,
    });
  } catch (err) {
    console.error('Error fetching historical data:', err);
    return c.json({ error: 'Failed to fetch historical data' }, 500);
  }
});

// GET /market/sectors - Mock sector performance (Yahoo doesn't provide this easily)
app.get('/sectors', async (c: Context) => {
  try {
    // Mock sector data
    const sectors = [
      { name: 'Technology', changePercent: 1.2 },
      { name: 'Healthcare', changePercent: 0.8 },
      { name: 'Financial', changePercent: -0.3 },
      { name: 'Energy', changePercent: 2.1 },
      { name: 'Consumer Cyclical', changePercent: 0.5 },
      { name: 'Industrials', changePercent: -0.2 },
      { name: 'Materials', changePercent: 0.9 },
      { name: 'Utilities', changePercent: -0.1 },
      { name: 'Real Estate', changePercent: 0.4 },
      { name: 'Consumer Defensive', changePercent: 0.3 },
    ];
    
    return c.json({ sectors });
  } catch (err) {
    console.error('Error fetching sector performance:', err);
    return c.json({ error: 'Failed to fetch sector performance' }, 500);
  }
});

export default app;