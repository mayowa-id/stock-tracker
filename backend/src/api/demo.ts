import { Hono } from 'hono';
import type { Context } from 'hono';
import { resetMockAccount, placeMockOrder, createMockWatchlist } from '../lib/mock-trading';

const app = new Hono();

// POST /demo/reset - Reset account to initial state
app.post('/reset', async (c: Context) => {
  try {
    resetMockAccount();
    return c.json({
      message: 'Account reset to initial state',
      cash: 100000,
      buyingPower: 100000,
      portfolioValue: 100000,
    });
  } catch (err) {
    console.error('Error resetting account:', err);
    return c.json({ error: 'Failed to reset account' }, 500);
  }
});

// POST /demo/seed - Add sample data (orders, watchlist, etc.)
app.post('/seed', async (c: Context) => {
  try {
    // Reset first
    resetMockAccount();
    
    // Place some sample orders
    await placeMockOrder({
      symbol: 'AAPL',
      quantity: 10,
      side: 'buy',
      type: 'market',
    });
    
    await placeMockOrder({
      symbol: 'MSFT',
      quantity: 5,
      side: 'buy',
      type: 'market',
    });
    
    await placeMockOrder({
      symbol: 'GOOGL',
      quantity: 3,
      side: 'buy',
      type: 'market',
    });
    
    // Create sample watchlists
    createMockWatchlist('Tech Stocks', ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']);
    createMockWatchlist('Blue Chips', ['JNJ', 'WMT', 'KO', 'PG', 'DIS']);
    
    return c.json({
      message: 'Demo data seeded successfully',
      positions: 3,
      watchlists: 2,
    });
  } catch (err) {
    console.error('Error seeding demo data:', err);
    return c.json({ error: 'Failed to seed demo data' }, 500);
  }
});

// GET /demo/status - Get demo account status
app.get('/status', async (c: Context) => {
  try {
    return c.json({
      message: 'Mock trading system active',
      features: {
        trading: 'Fully simulated - no real money',
        startingCash: 100000,
        apiKeysNeeded: 'None!',
        dataSource: 'Yahoo Finance (free)',
      },
    });
  } catch (err) {
    console.error('Error getting demo status:', err);
    return c.json({ error: 'Failed to get demo status' }, 500);
  }
});

export default app;