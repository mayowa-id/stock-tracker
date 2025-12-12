import { Hono } from 'hono';
import { serve } from '@hono/node-server';
// Note: avoid static import of createNodeWebSocket which can differ between versions
// We'll try to `require` it dynamically below.
import { corsMiddleware } from './middleware/cors';

// Import route handlers
import auth from './api/auth';
import quotes from './api/quotes';
import historical from './api/historical';
import analytics from './api/analytics';
import account from './api/account';
import positions from './api/positions';
import orders from './api/orders';
import watchlists from './api/watchlists';
import fundamentals from './api/fundamentals';
import market from './api/market';
import demo from './api/demo';
import { createWebSocketRouter } from './api/websocket';

const app = new Hono();

// Try to load createNodeWebSocket dynamically — if it exists, wire WS support.
// If not available, fall back to a placeholder route so TypeScript and builds succeed.
let injectWebSocket: any = undefined;
let upgradeWebSocket: any = undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const nodeWs = require('@hono/node-ws');
  if (nodeWs && typeof nodeWs.createNodeWebSocket === 'function') {
    const res = nodeWs.createNodeWebSocket({ app });
    injectWebSocket = res.injectWebSocket;
    upgradeWebSocket = res.upgradeWebSocket;
    console.log('Loaded @hono/node-ws createNodeWebSocket helper');
  } else {
    // some versions may export differently; try a common alternate export shape
    if (nodeWs && typeof nodeWs.default?.createNodeWebSocket === 'function') {
      const res = nodeWs.default.createNodeWebSocket({ app });
      injectWebSocket = res.injectWebSocket;
      upgradeWebSocket = res.upgradeWebSocket;
      console.log('Loaded @hono/node-ws (default) createNodeWebSocket helper');
    } else {
      console.warn('@hono/node-ws does not expose createNodeWebSocket — WS routes will be a 501 fallback.');
    }
  }
} catch (e) {
  // Module not found or require failed — just continue without WS helper.
  // Do not throw here so deployment can continue.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.warn('Optional @hono/node-ws helper not available:', (e as Error)?.message || String(e));
}

// Global middleware
app.use('*', corsMiddleware);

// Mount routes
app.route('/auth', auth);
app.route('/quotes', quotes);
app.route('/historical', historical);
app.route('/analytics', analytics);
app.route('/account', account);
app.route('/positions', positions);
app.route('/orders', orders);
app.route('/watchlists', watchlists);
app.route('/fundamentals', fundamentals);
app.route('/market', market);
app.route('/demo', demo);

// Mount WS router conditionally
if (typeof upgradeWebSocket === 'function') {
  const wsRouter = createWebSocketRouter(upgradeWebSocket);
  app.route('/ws', wsRouter);
} else {
  // fallback: return 501 for WS endpoints when no upgrade helper available
  app.get('/ws/:any', (c) => c.json({ error: 'WebSocket support not available in this deployment' }, 501));
}

// Health check
app.get('/', (c) =>
  c.json({
    message: 'Stock Tracker API is running!',
    mode: 'Demo Mode - No API Keys Required! ',
    features: {
      trading: 'Mock trading with $100k starting balance',
      marketData: 'Yahoo Finance (real-time, no key needed)',
      apiDocs: '/api-docs',
    },
  })
);

// API Documentation
app.get('/api-docs', (c) => {
  const docs = {
    version: '1.0.0',
    description: 'Stock Tracker Trading API with Alpaca, Polygon, and FMP',
    baseUrl: 'http://localhost:3000',
    endpoints: {
      account: {
        '/account': 'Get account summary',
        '/account/portfolio-history': 'Get portfolio performance history',
        '/account/buying-power': 'Get available buying power',
        '/account/status': 'Get market open/close status',
      },
      positions: {
        'GET /positions': 'Get all open positions',
        'GET /positions/:symbol': 'Get specific position',
        'DELETE /positions/:symbol': 'Close position (sell all or qty)',
        'DELETE /positions': 'Close all positions',
      },
      orders: {
        'POST /orders': 'Place new order',
        'GET /orders': 'Get orders (open, closed, all)',
        'GET /orders/:orderId': 'Get specific order',
        'DELETE /orders/:orderId': 'Cancel order',
        'PATCH /orders/:orderId': 'Replace/modify order',
      },
      watchlists: {
        'GET /watchlists': 'Get all watchlists',
        'POST /watchlists': 'Create new watchlist',
        'GET /watchlists/:watchlistId': 'Get watchlist details',
        'POST /watchlists/:watchlistId/assets': 'Add symbol to watchlist',
        'DELETE /watchlists/:watchlistId/assets/:symbol': 'Remove from watchlist',
        'DELETE /watchlists/:watchlistId': 'Delete watchlist',
      },
      fundamentals: {
        'GET /fundamentals/:symbol': 'Get company profile',
        'GET /fundamentals/:symbol/income-statement': 'Get income statement',
        'GET /fundamentals/:symbol/balance-sheet': 'Get balance sheet',
        'GET /fundamentals/:symbol/cash-flow': 'Get cash flow statement',
        'GET /fundamentals/:symbol/key-metrics': 'Get key metrics',
        'GET /fundamentals/:symbol/ratios': 'Get financial ratios',
        'GET /fundamentals/:symbol/earnings': 'Get earnings history',
        'GET /fundamentals/:symbol/earnings-surprises': 'Get earnings surprises',
        'GET /fundamentals/:symbol/rating': 'Get company rating',
        'GET /fundamentals/:symbol/analyst-estimates': 'Get analyst estimates',
        'GET /fundamentals/:symbol/analyst-ratings': 'Get analyst ratings',
        'GET /fundamentals/:symbol/dividends': 'Get dividend history',
        'GET /fundamentals/:symbol/splits': 'Get stock splits',
        'GET /fundamentals/:symbol/insider-trades': 'Get insider trading activity',
      },
      market: {
        'GET /market/quote/:symbol': 'Get real-time quote',
        'GET /market/sectors': 'Get sector performance',
        'GET /market/gainers': 'Get top gainers',
        'GET /market/losers': 'Get top losers',
        'GET /market/most-active': 'Get most active stocks',
        'GET /market/search': 'Search stocks by name/symbol',
        'GET /market/news': 'Get stock news',
        'GET /market/aggregates/:symbol': 'Get historical OHLCV data',
      },
      websocket: {
        'WS /ws/:symbol': 'Real-time quote stream for symbol',
      },
    },
  };
  return c.json(docs);
});

// Local dev server
if (process.env.NODE_ENV !== 'production') {
  const PORT = parseInt(process.env.PORT || '3000');
  const server = serve({
    fetch: app.fetch,
    port: PORT,
  });

  // If injectWebSocket exists, call it to enable WS upgrades on the dev server
  if (typeof injectWebSocket === 'function') {
    injectWebSocket(server);
  } else {
    console.warn('injectWebSocket helper not available in dev server — WS upgrades disabled locally.');
  }

  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API Documentation available at: http://localhost:${PORT}/api-docs`);
}

export default app;
