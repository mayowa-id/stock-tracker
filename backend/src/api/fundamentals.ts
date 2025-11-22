import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  getCompanyProfile,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getKeyMetrics,
  getRatios,
  getGrowthRates,
  getEarningsHistory,
  getEarningsSurprises,
  getCompanyRating,
  getAnalystEstimates,
  getAnalystRatings,
  getHistoricalDividends,
  getStockSplits,
  getInsiderTrades,
} from '../lib/fmp';

const app = new Hono();

// GET /fundamentals/:symbol - Get company profile
app.get('/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const profile = await getCompanyProfile(symbol);
    if (Array.isArray(profile) && profile.length === 0) {
      return c.json({ error: 'Symbol not found' }, 404);
    }
    const data = Array.isArray(profile) ? profile[0] : profile;
    return c.json({
      symbol: data.symbol,
      name: data.companyName,
      price: data.price,
      exchange: data.exchange,
      currency: data.currency,
      sector: data.sector,
      industry: data.industry,
      website: data.website,
      description: data.description,
      ceo: data.ceo,
      founded: data.founded,
      ipoDate: data.ipoDate,
      marketCap: data.mktCap,
      beta: data.beta,
      isEtf: data.isEtf,
      isActivelyTrading: data.isActivelyTrading,
    });
  } catch (err) {
    console.error('Error fetching company profile:', err);
    return c.json({ error: 'Failed to fetch company profile' }, 500);
  }
});

// GET /fundamentals/:symbol/income-statement - Income statement
app.get('/:symbol/income-statement', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const period = (c.req.query('period') as 'annual' | 'quarterly') || 'annual';
    const limit = parseInt(c.req.query('limit') || '5');

    const data = await getIncomeStatement(symbol, period, limit);
    return c.json({ symbol, period, data });
  } catch (err) {
    console.error('Error fetching income statement:', err);
    return c.json({ error: 'Failed to fetch income statement' }, 500);
  }
});

// GET /fundamentals/:symbol/balance-sheet - Balance sheet
app.get('/:symbol/balance-sheet', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const period = (c.req.query('period') as 'annual' | 'quarterly') || 'annual';
    const limit = parseInt(c.req.query('limit') || '5');

    const data = await getBalanceSheet(symbol, period, limit);
    return c.json({ symbol, period, data });
  } catch (err) {
    console.error('Error fetching balance sheet:', err);
    return c.json({ error: 'Failed to fetch balance sheet' }, 500);
  }
});

// GET /fundamentals/:symbol/cash-flow - Cash flow statement
app.get('/:symbol/cash-flow', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const period = (c.req.query('period') as 'annual' | 'quarterly') || 'annual';
    const limit = parseInt(c.req.query('limit') || '5');

    const data = await getCashFlowStatement(symbol, period, limit);
    return c.json({ symbol, period, data });
  } catch (err) {
    console.error('Error fetching cash flow:', err);
    return c.json({ error: 'Failed to fetch cash flow' }, 500);
  }
});

// GET /fundamentals/:symbol/key-metrics - Key metrics
app.get('/:symbol/key-metrics', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const period = (c.req.query('period') as 'annual' | 'quarterly') || 'annual';
    const limit = parseInt(c.req.query('limit') || '5');

    const data = await getKeyMetrics(symbol, period, limit);
    return c.json({ symbol, period, data });
  } catch (err) {
    console.error('Error fetching key metrics:', err);
    return c.json({ error: 'Failed to fetch key metrics' }, 500);
  }
});

// GET /fundamentals/:symbol/ratios - Financial ratios
app.get('/:symbol/ratios', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const period = (c.req.query('period') as 'annual' | 'quarterly') || 'annual';

    const data = await getRatios(symbol, period);
    return c.json({ symbol, period, data });
  } catch (err) {
    console.error('Error fetching ratios:', err);
    return c.json({ error: 'Failed to fetch ratios' }, 500);
  }
});

// GET /fundamentals/:symbol/earnings - Earnings history
app.get('/:symbol/earnings', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const limit = parseInt(c.req.query('limit') || '10');

    const data = await getEarningsHistory(symbol, limit);
    return c.json({ symbol, data });
  } catch (err) {
    console.error('Error fetching earnings:', err);
    return c.json({ error: 'Failed to fetch earnings' }, 500);
  }
});

// GET /fundamentals/:symbol/earnings-surprises - Earnings surprises
app.get('/:symbol/earnings-surprises', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const limit = parseInt(c.req.query('limit') || '10');

    const data = await getEarningsSurprises(symbol, limit);
    return c.json({ symbol, data });
  } catch (err) {
    console.error('Error fetching earnings surprises:', err);
    return c.json({ error: 'Failed to fetch earnings surprises' }, 500);
  }
});

// GET /fundamentals/:symbol/rating - Company rating
app.get('/:symbol/rating', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const data = await getCompanyRating(symbol);
    return c.json({ symbol, ...data });
  } catch (err) {
    console.error('Error fetching rating:', err);
    return c.json({ error: 'Failed to fetch company rating' }, 500);
  }
});

// GET /fundamentals/:symbol/analyst-estimates - Analyst estimates
app.get('/:symbol/analyst-estimates', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const data = await getAnalystEstimates(symbol);
    return c.json({ symbol, data });
  } catch (err) {
    console.error('Error fetching analyst estimates:', err);
    return c.json({ error: 'Failed to fetch analyst estimates' }, 500);
  }
});

// GET /fundamentals/:symbol/analyst-ratings - Analyst ratings
app.get('/:symbol/analyst-ratings', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const data = await getAnalystRatings(symbol);
    return c.json({ symbol, data });
  } catch (err) {
    console.error('Error fetching analyst ratings:', err);
    return c.json({ error: 'Failed to fetch analyst ratings' }, 500);
  }
});

// GET /fundamentals/:symbol/dividends - Dividend history
app.get('/:symbol/dividends', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const data = await getHistoricalDividends(symbol);
    return c.json({ symbol, data });
  } catch (err) {
    console.error('Error fetching dividends:', err);
    return c.json({ error: 'Failed to fetch dividend history' }, 500);
  }
});

// GET /fundamentals/:symbol/splits - Stock splits
app.get('/:symbol/splits', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const data = await getStockSplits(symbol);
    return c.json({ symbol, data });
  } catch (err) {
    console.error('Error fetching stock splits:', err);
    return c.json({ error: 'Failed to fetch stock splits' }, 500);
  }
});

// GET /fundamentals/:symbol/insider-trades - Insider trading activity
app.get('/:symbol/insider-trades', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const limit = parseInt(c.req.query('limit') || '50');

    const data = await getInsiderTrades(symbol, limit);
    return c.json({ symbol, data });
  } catch (err) {
    console.error('Error fetching insider trades:', err);
    return c.json({ error: 'Failed to fetch insider trades' }, 500);
  }
});

export default app;