import { Hono } from 'hono';
import type { Context } from 'hono';
import { getPositions, getPosition, closePosition, closeAllPositions } from '../lib/alpaca';

const app = new Hono();

// GET /positions - Get all open positions
app.get('/', async (c: Context) => {
  try {
    const positions = await getPositions();
    const formatted = positions.map((pos: any) => ({
      symbol: pos.symbol,
      quantity: parseFloat(pos.qty),
      side: pos.side,
      avgFillPrice: parseFloat(pos.avg_fill_price),
      currentPrice: parseFloat(pos.current_price),
      marketValue: parseFloat(pos.market_value),
      costBasis: parseFloat(pos.cost_basis),
      unrealizedGain: parseFloat(pos.unrealized_gain),
      unrealizedGainPercent: parseFloat(pos.unrealized_gain_pct),
      unrealizedIntradayGain: parseFloat(pos.unrealized_intraday_gain),
      unrealizedIntradayGainPercent: parseFloat(pos.unrealized_intraday_gain_pct),
    }));
    return c.json({ positions: formatted });
  } catch (err) {
    console.error('Error fetching positions:', err);
    return c.json({ error: 'Failed to fetch positions' }, 500);
  }
});

// GET /positions/:symbol - Get specific position
app.get('/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const position = await getPosition(symbol);
    const formatted = {
      symbol: position.symbol,
      quantity: parseFloat(position.qty),
      side: position.side,
      avgFillPrice: parseFloat(position.avg_fill_price),
      currentPrice: parseFloat(position.current_price),
      marketValue: parseFloat(position.market_value),
      costBasis: parseFloat(position.cost_basis),
      unrealizedGain: parseFloat(position.unrealized_gain),
      unrealizedGainPercent: parseFloat(position.unrealized_gain_pct),
    };
    return c.json(formatted);
  } catch (err) {
    console.error('Error fetching position:', err);
    return c.json({ error: 'Position not found or error fetching' }, 404);
  }
});

// DELETE /positions/:symbol - Close position (sell all or specified quantity)
app.delete('/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const qty = c.req.query('qty');

    const result = await closePosition(symbol, qty ? parseInt(qty) : undefined);
    return c.json({
      message: `Position for ${symbol} closed successfully`,
      order: result,
    });
  } catch (err) {
    console.error('Error closing position:', err);
    return c.json({ error: 'Failed to close position' }, 500);
  }
});

// DELETE /positions - Close all positions
app.delete('/', async (c: Context) => {
  try {
    const results = await closeAllPositions();
    return c.json({
      message: 'All positions closed successfully',
      orders: results,
    });
  } catch (err) {
    console.error('Error closing all positions:', err);
    return c.json({ error: 'Failed to close all positions' }, 500);
  }
});

export default app;