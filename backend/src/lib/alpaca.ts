import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const API_KEY = process.env.ALPACA_API_KEY;
const SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

if (!API_KEY || !SECRET_KEY) {
  throw new Error('ALPACA_API_KEY and ALPACA_SECRET_KEY are required in .env');
}

// Helper to make authenticated requests to Alpaca
export async function fetchAlpaca(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' = 'GET',
  body?: Record<string, any>
) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'APCA-API-KEY-ID': API_KEY,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Alpaca API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

// Account endpoints
export async function getAccount() {
  return fetchAlpaca('/v2/account');
}

export async function getAccountPortfolioHistory(period?: string, timeframe?: string) {
  let endpoint = '/v2/account/portfolio/history';
  if (period || timeframe) {
    const params = new URLSearchParams();
    if (period) params.append('period', period); // e.g., '1M', '3M', '1A'
    if (timeframe) params.append('timeframe', timeframe); // e.g., '1D', '1W'
    endpoint += `?${params.toString()}`;
  }
  return fetchAlpaca(endpoint);
}

// Positions endpoints
export async function getPositions() {
  return fetchAlpaca('/v2/positions');
}

export async function getPosition(symbol: string) {
  return fetchAlpaca(`/v2/positions/${symbol}`);
}

export async function closePosition(symbol: string, qty?: number) {
  let endpoint = `/v2/positions/${symbol}`;
  if (qty) {
    endpoint += `?qty=${qty}`;
  }
  return fetchAlpaca(endpoint, 'DELETE');
}

export async function closeAllPositions() {
  return fetchAlpaca('/v2/positions', 'DELETE');
}

// Orders endpoints
export async function placeOrder(params: {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type?: 'market' | 'limit' | 'stop' | 'trailing_stop' | 'stop_limit';
  time_in_force?: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  trail_price?: number;
  trail_percent?: number;
  extended_hours?: boolean;
  client_order_id?: string;
}) {
  return fetchAlpaca('/v2/orders', 'POST', params);
}

export async function getOrders(status?: string, limit?: number, after?: string) {
  let endpoint = '/v2/orders';
  const params = new URLSearchParams();
  if (status) params.append('status', status); // 'open', 'closed', 'all'
  if (limit) params.append('limit', limit.toString());
  if (after) params.append('after', after);
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  return fetchAlpaca(endpoint);
}

export async function getOrder(orderId: string) {
  return fetchAlpaca(`/v2/orders/${orderId}`);
}

export async function cancelOrder(orderId: string) {
  return fetchAlpaca(`/v2/orders/${orderId}`, 'DELETE');
}

export async function replaceOrder(
  orderId: string,
  params: {
    qty?: number;
    limit_price?: number;
    stop_price?: number;
    trail?: number;
    time_in_force?: string;
    client_order_id?: string;
  }
) {
  return fetchAlpaca(`/v2/orders/${orderId}`, 'PATCH', params);
}

// Watchlist endpoints
export async function getWatchlists() {
  return fetchAlpaca('/v2/watchlists');
}

export async function getWatchlist(watchlistId: string) {
  return fetchAlpaca(`/v2/watchlists/${watchlistId}`);
}

export async function createWatchlist(params: { name: string; symbols?: string[] }) {
  return fetchAlpaca('/v2/watchlists', 'POST', params);
}

export async function addToWatchlist(watchlistId: string, symbol: string) {
  return fetchAlpaca(`/v2/watchlists/${watchlistId}`, 'POST', { symbol });
}

export async function removeFromWatchlist(watchlistId: string, symbol: string) {
  return fetchAlpaca(`/v2/watchlists/${watchlistId}/${symbol}`, 'DELETE');
}

export async function deleteWatchlist(watchlistId: string) {
  return fetchAlpaca(`/v2/watchlists/${watchlistId}`, 'DELETE');
}

// Assets endpoint
export async function getAssets(status?: string) {
  let endpoint = '/v2/assets';
  if (status) {
    endpoint += `?status=${status}`;
  }
  return fetchAlpaca(endpoint);
}

export async function getAsset(symbol: string) {
  return fetchAlpaca(`/v2/assets/${symbol}`);
}

// Calendar endpoint
export async function getMarketCalendar(start?: string, end?: string) {
  let endpoint = '/v2/calendar';
  if (start || end) {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    endpoint += `?${params.toString()}`;
  }
  return fetchAlpaca(endpoint);
}

// Clock endpoint (market status)
export async function getMarketClock() {
  return fetchAlpaca('/v2/clock');
}