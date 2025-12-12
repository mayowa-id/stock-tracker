import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { placeOrder, getOrders, getOrder, cancelOrder, replaceOrder } from '../lib/alpaca';

const app = new Hono();

// Validation schemas
const placeOrderSchema = z.object({
    symbol: z.string().min(1).toUpperCase(),
    qty: z.number().positive().optional(),
    notional: z.number().positive().optional(),
    side: z.enum(['buy', 'sell']),
    type: z.enum(['market', 'limit', 'stop', 'trailing_stop', 'stop_limit']).optional().default('market'),
    time_in_force: z.enum(['day', 'gtc', 'opg', 'cls', 'ioc', 'fok']).optional().default('day'),
    limit_price: z.number().positive().optional(),
    stop_price: z.number().positive().optional(),
    trail_price: z.number().positive().optional(),
    trail_percent: z.number().positive().optional(),
    extended_hours: z.boolean().optional(),
    client_order_id: z.string().optional(),
});

// POST /orders - Place a new order
app.post('/', async (c: Context) => {
    try {
        const body = await c.req.json();
        const validated = placeOrderSchema.parse(body);

        // Ensure either qty or notional is provided
        if (!validated.qty && !validated.notional) {
            return c.json({ error: 'Either qty or notional must be provided' }, 400);
        }

        const order = await placeOrder(validated);

        return c.json({
            orderId: order.id,
            symbol: order.symbol,
            quantity: parseFloat(order.qty),
            filledQuantity: parseFloat(order.filled_qty),
            side: order.side,
            type: order.order_type,
            status: order.status,
            limitPrice: order.limit_price ? parseFloat(order.limit_price) : null,
            stopPrice: order.stop_price ? parseFloat(order.stop_price) : null,
            createdAt: order.created_at,
        });
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Error:', message);

  if (err instanceof z.ZodError) {
    const details = err.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
    return c.json({ error: 'Invalid input', details }, 400);
  }

  return c.json({ error: 'Request failed' }, 500);
}

});

// GET /orders - Get orders (open, closed, or all)
app.get('/', async (c: Context) => {
    try {
        const status = c.req.query('status') || 'open'; // 'open', 'closed', 'all'
        const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10;
        const after = c.req.query('after');

        const orders = await getOrders(status, limit, after);

        const formatted = orders.map((order: any) => ({
            orderId: order.id,
            symbol: order.symbol,
            quantity: parseFloat(order.qty),
            filledQuantity: parseFloat(order.filled_qty),
            filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
            side: order.side,
            type: order.order_type,
            status: order.status,
            timeInForce: order.time_in_force,
            limitPrice: order.limit_price ? parseFloat(order.limit_price) : null,
            stopPrice: order.stop_price ? parseFloat(order.stop_price) : null,
            createdAt: order.created_at,
            filledAt: order.filled_at,
            canceledAt: order.canceled_at,
        }));

        return c.json({ orders: formatted, count: formatted.length });
    } catch (err) {
        console.error('Error fetching orders:', err);
        return c.json({ error: 'Failed to fetch orders' }, 500);
    }
});

// GET /orders/:orderId - Get specific order
app.get('/:orderId', async (c: Context) => {
    try {
        const orderId = c.req.param('orderId');
        const order = await getOrder(orderId);

        return c.json({
            orderId: order.id,
            symbol: order.symbol,
            quantity: parseFloat(order.qty),
            filledQuantity: parseFloat(order.filled_qty),
            filledAvgPrice: order.filled_avg_price ? parseFloat(order.filled_avg_price) : null,
            side: order.side,
            type: order.order_type,
            status: order.status,
            timeInForce: order.time_in_force,
            limitPrice: order.limit_price ? parseFloat(order.limit_price) : null,
            stopPrice: order.stop_price ? parseFloat(order.stop_price) : null,
            createdAt: order.created_at,
            filledAt: order.filled_at,
            canceledAt: order.canceled_at,
        });
    } catch (err) {
        console.error('Error fetching order:', err);
        return c.json({ error: 'Failed to fetch order' }, 404);
    }
});

// DELETE /orders/:orderId - Cancel order
app.delete('/:orderId', async (c: Context) => {
    try {
        const orderId = c.req.param('orderId');
        const result = await cancelOrder(orderId);
        return c.json({
            message: 'Order canceled successfully',
            orderId,
        });
    } catch (err) {
        console.error('Error canceling order:', err);
        return c.json({ error: 'Failed to cancel order' }, 500);
    }
});

// PATCH /orders/:orderId - Replace/modify order
app.patch('/:orderId', async (c: Context) => {
    try {
        const orderId = c.req.param('orderId');
        const body = await c.req.json();

        const order = await replaceOrder(orderId, body);

        return c.json({
            orderId: order.id,
            symbol: order.symbol,
            quantity: parseFloat(order.qty),
            side: order.side,
            status: order.status,
            createdAt: order.created_at,
        });
    } catch (err) {
        console.error('Error replacing order:', err);
        return c.json({ error: 'Failed to replace order' }, 500);
    }
});

export default app;