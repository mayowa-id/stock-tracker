import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import {
  getWatchlists,
  getWatchlist,
  createWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  deleteWatchlist,
} from '../lib/alpaca';

const app = new Hono();

const createWatchlistSchema = z.object({
  name: z.string().min(1),
  symbols: z.array(z.string()).optional(),
});

// GET /watchlists - Get all watchlists
app.get('/', async (c: Context) => {
  try {
    const watchlists = await getWatchlists();
    const formatted = watchlists.map((wl: any) => ({
      id: wl.id,
      name: wl.name,
      assetCount: wl.assets ? wl.assets.length : 0,
      createdAt: wl.created_at,
      updatedAt: wl.updated_at,
      assets: wl.assets?.map((asset: any) => ({
        symbol: asset.symbol,
        name: asset.name,
      })) || [],
    }));
    return c.json({ watchlists: formatted });
  } catch (err) {
    console.error('Error fetching watchlists:', err);
    return c.json({ error: 'Failed to fetch watchlists' }, 500);
  }
});

// POST /watchlists - Create new watchlist
app.post('/', async (c: Context) => {
  try {
    const body = await c.req.json();
    const validated = createWatchlistSchema.parse(body);

    const watchlist = await createWatchlist({
      name: validated.name,
      symbols: validated.symbols,
    });

    return c.json({
      id: watchlist.id,
      name: watchlist.name,
      assetCount: watchlist.assets ? watchlist.assets.length : 0,
      createdAt: watchlist.created_at,
    });
  } catch (err: any) {
    console.error('Error creating watchlist:', err);
    if (err instanceof z.ZodError) {
      return c.json({ error: 'Invalid watchlist parameters', details: err.errors }, 400);
    }
    return c.json({ error: 'Failed to create watchlist' }, 500);
  }
});

// GET /watchlists/:watchlistId - Get specific watchlist
app.get('/:watchlistId', async (c: Context) => {
  try {
    const watchlistId = c.req.param('watchlistId');
    const watchlist = await getWatchlist(watchlistId);

    return c.json({
      id: watchlist.id,
      name: watchlist.name,
      assets: watchlist.assets?.map((asset: any) => ({
        symbol: asset.symbol,
        name: asset.name,
        exchange: asset.exchange,
        class: asset.class,
      })) || [],
      createdAt: watchlist.created_at,
      updatedAt: watchlist.updated_at,
    });
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return c.json({ error: 'Watchlist not found' }, 404);
  }
});

// POST /watchlists/:watchlistId/assets - Add symbol to watchlist
app.post('/:watchlistId/assets', async (c: Context) => {
  try {
    const watchlistId = c.req.param('watchlistId');
    const body = await c.req.json();
    const symbol = body.symbol?.toUpperCase();

    if (!symbol) {
      return c.json({ error: 'Symbol is required' }, 400);
    }

    const result = await addToWatchlist(watchlistId, symbol);
    return c.json({
      message: `${symbol} added to watchlist`,
      watchlist: result,
    });
  } catch (err) {
    console.error('Error adding to watchlist:', err);
    return c.json({ error: 'Failed to add symbol to watchlist' }, 500);
  }
});

// DELETE /watchlists/:watchlistId/assets/:symbol - Remove symbol from watchlist
app.delete('/:watchlistId/assets/:symbol', async (c: Context) => {
  try {
    const watchlistId = c.req.param('watchlistId');
    const symbol = c.req.param('symbol').toUpperCase();

    await removeFromWatchlist(watchlistId, symbol);
    return c.json({
      message: `${symbol} removed from watchlist`,
    });
  } catch (err) {
    console.error('Error removing from watchlist:', err);
    return c.json({ error: 'Failed to remove symbol from watchlist' }, 500);
  }
});

// DELETE /watchlists/:watchlistId - Delete watchlist
app.delete('/:watchlistId', async (c: Context) => {
  try {
    const watchlistId = c.req.param('watchlistId');
    await deleteWatchlist(watchlistId);
    return c.json({
      message: 'Watchlist deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting watchlist:', err);
    return c.json({ error: 'Failed to delete watchlist' }, 500);
  }
});

export default app;