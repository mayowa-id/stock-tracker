import { Hono } from 'hono';
import type { Context } from 'hono';
import { getAccount, getMarketClock, getAccountPortfolioHistory, getAssets } from '../lib/alpaca';
import type { AlpacaAccount } from '../lib/types';

const app = new Hono();

// GET /account - Get account summary
app.get('/', async (c: Context) => {
  try {
    const account: AlpacaAccount = await getAccount();
    return c.json({
      accountId: account.id,
      status: account.status,
      cash: parseFloat(account.cash.toString()),
      buyingPower: parseFloat(account.buying_power.toString()),
      portfolioValue: parseFloat(account.portfolio_value.toString()),
      equity: parseFloat(account.equity.toString()),
      patternDayTrader: account.pattern_day_trader,
      tradingBlocked: account.trading_blocked,
      createdAt: account.created_at,
    });
  } catch (err) {
    console.error('Error fetching account:', err);
    return c.json({ error: 'Failed to fetch account' }, 500);
  }
});

// GET /account/portfolio-history - Get portfolio performance over time
app.get('/portfolio-history', async (c: Context) => {
  try {
    const period = c.req.query('period') || '1M'; // 1M, 3M, 1A, all
    const timeframe = c.req.query('timeframe') || '1D'; // 1D, 1W, 1M

    const history = await getAccountPortfolioHistory(period, timeframe);
    return c.json(history);
  } catch (err) {
    console.error('Error fetching portfolio history:', err);
    return c.json({ error: 'Failed to fetch portfolio history' }, 500);
  }
});

// GET /account/buying-power - Get available buying power
app.get('/buying-power', async (c: Context) => {
  try {
    const account = await getAccount();
    return c.json({
      buyingPower: parseFloat(account.buying_power.toString()),
      regtBuyingPower: parseFloat(account.regt_buying_power.toString()),
      dayTradingBuyingPower: parseFloat(account.daytrading_buying_power.toString()),
      cash: parseFloat(account.cash.toString()),
    });
  } catch (err) {
    console.error('Error fetching buying power:', err);
    return c.json({ error: 'Failed to fetch buying power' }, 500);
  }
});

// GET /account/status - Get market status
app.get('/status', async (c: Context) => {
  try {
    const clock = await getMarketClock();
    return c.json({
      isOpen: clock.is_open,
      currentTime: clock.timestamp,
      nextOpen: clock.next_open,
      nextClose: clock.next_close,
    });
  } catch (err) {
    console.error('Error fetching market status:', err);
    return c.json({ error: 'Failed to fetch market status' }, 500);
  }
});

export default app;