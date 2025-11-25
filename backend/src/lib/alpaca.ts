import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ALPACA_API_KEY;
const SECRET_KEY = process.env.ALPACA_SECRET_KEY;
const BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

// DEBUG: Log what we're getting
console.log('=== ALPACA DEBUG ===');
console.log('API_KEY exists:', !!API_KEY);
console.log('API_KEY length:', API_KEY?.length || 0);
console.log('API_KEY first 5 chars:', API_KEY?.substring(0, 5) || 'NONE');
console.log('SECRET_KEY exists:', !!SECRET_KEY);
console.log('SECRET_KEY length:', SECRET_KEY?.length || 0);
console.log('BASE_URL:', BASE_URL);
console.log('===================');

if (!API_KEY || !SECRET_KEY) {
  throw new Error(
    `Alpaca keys missing!\n` +
    `API_KEY: ${API_KEY ? '✓' : '✗'}\n` +
    `SECRET_KEY: ${SECRET_KEY ? '✓' : '✗'}\n` +
    `Check your .env file!`
  );
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
    'APCA-API-SECRET-KEY': SECRET_KEY,  // THIS WAS MISSING!
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  console.log(`[Alpaca Request] ${method} ${endpoint}`);
  
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
    if (period) params.append('period', period);
    if (timeframe) params.append('timeframe', timeframe);
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
  if (status) params.append('status', status);
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