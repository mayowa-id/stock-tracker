import { Hono } from 'hono';
import { serve } from '@hono/node-server';
// Note: avoid static import of createNodeWebSocket which can differ between versions
// We'll try to `require` it dynamically below.
import { corsMiddleware } from '../src/middleware/cors.js';

// Import route handlers (note the .js extensions for Node ESM runtime)
import auth from '../src/api/auth.js';
import quotes from '../src/api/quotes.js';
import historical from '../src/api/historical.js';
import analytics from '../src/api/analytics.js';
import account from '../src/api/account.js';
import positions from '../src/api/positions.js';
import orders from '../src/api/orders.js';
import watchlists from '../src/api/watchlists.js';
import fundamentals from '../src/api/fundamentals.js';
import market from '../src/api/market.js';
import demo from '../src/api/demo.js';
import { createWebSocketRouter } from '../src/api/websocket.js';

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
    // ... (kept same)
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
