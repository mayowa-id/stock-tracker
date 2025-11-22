import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  getCompanyQuote,
  getSectorPerformance,
  getMostActiveStocks,
  getTopGainers,
  getTopLosers,
  searchStocks,
  getStockNews,
} from '../lib/fmp';
import { fetchPolygon } from '../lib/polygon';

const app = new Hono();

// GET /market/quote/:symbol - Get real-time quote
app.get('/quote/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const quote = await getCompanyQuote(symbol);
    
    if (Array.isArray(quote) && quote.length === 0) {
      return c.json({ error: 'Symbol not found' }, 404);
    }

    const data = Array.isArray(quote) ? quote[0] : quote;
    return c.json({
      symbol: data.symbol,
      price: data.price,
      change: data.changes,
      changePercent: data.changesPercentage,
      bid: data.bid,
      ask: data.ask,
      volume: data.volume,
      marketCap: data.marketCap,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching quote:', err);
    return c.json({ error: 'Failed to fetch quote' }, 500);
  }
});

// GET /market/sectors - Get sector performance
app.get('/sectors', async (c: Context) => {
  try {
    const data = await getSectorPerformance();
    return c.json({
      sectors: data.map((sector: any) => ({
        name: sector.sector,
        changePercent: sector.changesPercentage,
      })),
    });
  } catch (err) {
    console.error('Error fetching sector performance:', err);
    return c.json({ error: 'Failed to fetch sector performance' }, 500);
  }
});

// GET /market/gainers - Top gainers
app.get('/gainers', async (c: Context) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const data = await getTopGainers(limit);
    
    const formatted = data.map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      changePercent: stock.changesPercentage,
      marketCap: stock.marketCap,
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
    const limit = parseInt(c.req.query('limit') || '10');
    const data = await getTopLosers(limit);
    
    const formatted = data.map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      changePercent: stock.changesPercentage,
      marketCap: stock.marketCap,
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
    const limit = parseInt(c.req.query('limit') || '10');
    const data = await getMostActiveStocks(limit);
    
    const formatted = data.map((stock: any) => ({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      changePercent: stock.changesPercentage,
      volume: stock.volume,
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

    const results = await searchStocks(query);
    
    const formatted = results.map((result: any) => ({
      symbol: result.symbol,
      name: result.name,
      exchange: result.exchangeShortName,
      currency: result.currency,
    }));

    return c.json({ results: formatted });
  } catch (err) {
    console.error('Error searching stocks:', err);
    return c.json({ error: 'Failed to search stocks' }, 500);
  }
});

// GET /market/news - Get stock news
app.get('/news', async (c: Context) => {
  try {
    const symbol = c.req.query('symbol')?.toUpperCase();
    const limit = parseInt(c.req.query('limit') || '20');

    if (!symbol) {
      return c.json({ error: 'Symbol is required' }, 400);
    }

    const news = await getStockNews(symbol, limit);
    
    const formatted = news.map((article: any) => ({
      title: article.title,
      description: article.text,
      url: article.url,
      source: article.site,
      image: article.image,
      publishedAt: article.publishedDate,
    }));

    return c.json({ symbol, news: formatted });
  } catch (err) {
    console.error('Error fetching news:', err);
    return c.json({ error: 'Failed to fetch news' }, 500);
  }
});

// GET /market/aggregates/:symbol - Get historical aggregates (OHLCV)
app.get('/aggregates/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const timespan = c.req.query('timespan') || 'day'; // minute, hour, day, week, month, quarter, year
    const multiplier = c.req.query('multiplier') || '1';
    const from = c.req.query('from'); // YYYY-MM-DD
    const to = c.req.query('to'); // YYYY-MM-DD

    if (!from || !to) {
      return c.json({ error: 'from and to dates are required (YYYY-MM-DD)' }, 400);
    }

    const endpoint = `/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}`;
    const data = await fetchPolygon(endpoint, { sort: 'asc' });

    if (!data.results) {
      return c.json({ error: 'No data found' }, 404);
    }

    const formatted = data.results.map((bar: any) => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
      vwap: bar.vw,
      trades: bar.n,
    }));

    return c.json({
      symbol,
      timespan,
      multiplier,
      from,
      to,
      bars: formatted,
      count: formatted.length,
    });
  } catch (err) {
    console.error('Error fetching aggregates:', err);
    return c.json({ error: 'Failed to fetch historical data' }, 500);
  }
});

export default app;