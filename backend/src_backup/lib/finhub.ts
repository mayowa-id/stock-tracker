import dotenv from 'dotenv';
import { WSQuoteMessage } from './types';

dotenv.config();

const API_KEY = process.env.FINNHUB_API_KEY;
if (!API_KEY) {
  throw new Error('FINNHUB_API_KEY is required in .env');
}

const BASE_URL = 'https://finnhub.io/api/v1';

// Helper for authenticated fetch to Finnhub REST endpoints
export async function fetchFinnhub(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('token', API_KEY!); // Non-null assertion
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.statusText}`);
  }
  return response.json();
}

// WebSocket (native; real-time for free tier)
let finnhubWS: WebSocket | null = null;
const symbolClients: Map<string, Set<WebSocket>> = new Map(); // Symbol -> Set of client WebSockets

export function getFinnhubWS() {
  if (!finnhubWS || finnhubWS.readyState === WebSocket.CLOSED) {
    finnhubWS = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY!}`); // Use token for auth

    finnhubWS.onopen = () => {
      console.log('Connected to Finnhub WebSocket');
      // Finnhub authenticates via token in URL, no separate auth message
    };

    finnhubWS.onmessage = (evt) => {
      const data = JSON.parse(evt.data.toString());
      if (data.type === 'trade') {
        const messages: WSQuoteMessage[] = data.data.map((trade: any) => ({
          ev: 'Q', // Simulate quote event
          sym: trade.s,
          bx: 0, // Not available
          bp: trade.p,
          bs: trade.v,
          ax: 0,
          ap: trade.p, // Use price for ask
          as: trade.v,
          c: 0,
          t: trade.t,
          z: ''
        }));
        for (const msg of messages) {
          const clients = symbolClients.get(msg.sym);
          if (clients) {
            clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(msg));
              }
            });
          }
        }
      } else if (data.type === 'error') {
        console.error('Finnhub WS error message:', data.msg);
      }
    };

    finnhubWS.onerror = (err) => console.error('Finnhub WS error:', err);
    finnhubWS.onclose = () => {
      console.log('Finnhub WS closed');
      finnhubWS = null; // Allow reconnection
    };
  }
  return finnhubWS;
}

// Subscribe/unsubscribe functions
export function subscribeSymbol(symbol: string) {
  const ws = getFinnhubWS();
  if (!symbolClients.has(symbol)) {
    symbolClients.set(symbol, new Set());
    ws.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
  }
}

export function unsubscribeSymbol(symbol: string) {
  const ws = getFinnhubWS();
  const clients = symbolClients.get(symbol);
  if (clients && clients.size === 0) {
    symbolClients.delete(symbol);
    ws.send(JSON.stringify({ type: 'unsubscribe', symbol: symbol }));
  }
}

export { symbolClients };