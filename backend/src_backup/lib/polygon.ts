import dotenv from 'dotenv';
import { WSQuoteMessage } from './types';

dotenv.config();

const API_KEY = process.env.POLYGON_API_KEY;

if (!API_KEY) {
  throw new Error('POLYGON_API_KEY is required in .env');
}

const BASE_URL = 'https://api.polygon.io';

// Helper for authenticated fetch to Polygon REST endpoints
export async function fetchPolygon(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('apiKey', API_KEY!); // Non-null assertion to fix TS warning
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.statusText}`);
  }
  return response.json();
}

// WebSocket (native; delayed for free tier)
let polygonWS: WebSocket | null = null;
const symbolClients: Map<string, Set<WebSocket>> = new Map(); // Symbol -> Set of client WebSockets

export function getPolygonWS() {
  if (!polygonWS || polygonWS.readyState === WebSocket.CLOSED) {
    polygonWS = new WebSocket('wss://delayed.polygon.io/stocks'); // Use 'wss://socket.polygon.io/stocks' for paid real-time

    polygonWS.onopen = () => {
      console.log('Connected to Polygon WebSocket');
      // Authenticate
      polygonWS?.send(JSON.stringify({ action: 'auth', params: API_KEY! })); // Assertion here too
    };

    polygonWS.onmessage = (evt) => {
      const messages: WSQuoteMessage[] = JSON.parse(evt.data.toString());
      for (const msg of messages) {
        if (msg.ev !== 'Q') continue; // Only handle quotes
        const clients = symbolClients.get(msg.sym);
        if (clients) {
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(msg));
            }
          });
        }
      }
    };

    polygonWS.onerror = (err) => console.error('Polygon WS error:', err);
    polygonWS.onclose = () => {
      console.log('Polygon WS closed');
      polygonWS = null; // Allow reconnection
    };
  }
  return polygonWS;
}

// Subscribe/unsubscribe functions
export function subscribeSymbol(symbol: string) {
  const ws = getPolygonWS();
  if (!symbolClients.has(symbol)) {
    symbolClients.set(symbol, new Set());
    ws.send(JSON.stringify({ action: 'subscribe', params: `Q.${symbol}` }));
  }
}

export function unsubscribeSymbol(symbol: string) {
  const ws = getPolygonWS();
  const clients = symbolClients.get(symbol);
  if (clients && clients.size === 0) {
    symbolClients.delete(symbol);
    ws.send(JSON.stringify({ action: 'unsubscribe', params: `Q.${symbol}` }));
  }
}

export { symbolClients };