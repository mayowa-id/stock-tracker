import { Hono } from 'hono';
import type { Context } from 'hono';
import { getMockAccount } from '../lib/mock-trading';

const app = new Hono();

// GET /account - Get account summary
app.get('/', async (c: Context) => {
  try {
    const account = getMockAccount();
    return c.json({
      accountId: account.id,
      status: 'active',
      cash: account.cash,
      buyingPower: account.buyingPower,
      portfolioValue: account.portfolioValue,
      equity: account.portfolioValue,
      patternDayTrader: false,
      tradingBlocked: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching account:', err);
    return c.json({ error: 'Failed to fetch account' }, 500);
  }
});

// GET /account/portfolio-history - Get portfolio performance over time
app.get('/portfolio-history', async (c: Context) => {
  try {
    // Mock portfolio history data
    const account = getMockAccount();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Generate 30 days of mock history
    const timestamps: number[] = [];
    const equity: number[] = [];
    
    for (let i = 30; i >= 0; i--) {
      timestamps.push(now - (i * dayMs));
      // Simulate some growth/volatility
      const variance = (Math.random() - 0.5) * 2000;
      equity.push(Math.max(90000, account.portfolioValue + variance - (i * 100)));
    }
    
    return c.json({
      timestamp: timestamps,
      equity,
      profit_loss: equity.map(e => e - 100000),
      profit_loss_pct: equity.map(e => ((e - 100000) / 100000) * 100),
      base_value: 100000,
    });
  } catch (err) {
    console.error('Error fetching portfolio history:', err);
    return c.json({ error: 'Failed to fetch portfolio history' }, 500);
  }
});

// GET /account/buying-power - Get available buying power
app.get('/buying-power', async (c: Context) => {
  try {
    const account = getMockAccount();
    return c.json({
      buyingPower: account.buyingPower,
      regtBuyingPower: account.buyingPower,
      dayTradingBuyingPower: account.buyingPower * 4, // 4x leverage for day trading
      cash: account.cash,
    });
  } catch (err) {
    console.error('Error fetching buying power:', err);
    return c.json({ error: 'Failed to fetch buying power' }, 500);
  }
});

// GET /account/status - Get market status
app.get('/status', async (c: Context) => {
  try {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 60 + minute; // Minutes since midnight
    
    // Market hours: 9:30 AM - 4:00 PM ET (Mon-Fri)
    const marketOpen = 9 * 60 + 30; // 570 minutes
    const marketClose = 16 * 60; // 960 minutes
    
    const isWeekday = day >= 1 && day <= 5;
    const isDuringMarketHours = time >= marketOpen && time < marketClose;
    const isOpen = isWeekday && isDuringMarketHours;
    
    // Calculate next open/close
    let nextOpen = new Date(now);
    let nextClose = new Date(now);
    
    if (!isOpen) {
      // Set next open to tomorrow 9:30 AM
      nextOpen.setDate(nextOpen.getDate() + 1);
      nextOpen.setHours(9, 30, 0, 0);
      // Skip weekends
      while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
        nextOpen.setDate(nextOpen.getDate() + 1);
      }
    }
    
    // Set next close to today 4:00 PM (or next business day)
    nextClose.setHours(16, 0, 0, 0);
    if (!isOpen || time >= marketClose) {
      nextClose.setDate(nextClose.getDate() + 1);
      while (nextClose.getDay() === 0 || nextClose.getDay() === 6) {
        nextClose.setDate(nextClose.getDate() + 1);
      }
    }
    
    return c.json({
      isOpen,
      currentTime: now.toISOString(),
      nextOpen: nextOpen.toISOString(),
      nextClose: nextClose.toISOString(),
    });
  } catch (err) {
    console.error('Error fetching market status:', err);
    return c.json({ error: 'Failed to fetch market status' }, 500);
  }
});

export default app;