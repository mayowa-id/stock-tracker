import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { getFinnhubWS, subscribeSymbol, unsubscribeSymbol, symbolClients } from '../lib/finhub';
import { Buffer } from 'node:buffer'; // For onMessage/onClose types

// Export a function that takes upgradeWebSocket
export function createWebSocketRouter(
  upgradeWebSocket: (handler: (c: Context) => any) => (c: Context, next: Next) => Promise<Response | void>
) {
  const app = new Hono();
  app.get(
    '/:symbol',
    upgradeWebSocket((c: Context) => {
      const symbol = c.req.param('symbol').toUpperCase();
      if (!symbol) {
        return { onOpen: () => {} };
      }
      return {
        onOpen: (ws: any) => {
          getFinnhubWS();
          let clients = symbolClients.get(symbol);
          if (!clients) {
            clients = new Set();
            symbolClients.set(symbol, clients);
          }
          clients.add(ws);
          subscribeSymbol(symbol);
          console.log(`Client connected to ${symbol}`);
        },
        onMessage: (message: Buffer | string, ws: any) => {
          // Handle message (convert to string if Buffer)
          const data = typeof message === 'string' ? message : message.toString();
          console.log(`Message from client for ${symbol}: ${data}`);
        },
        onClose: (code: number, reason: Buffer, ws: any) => {
          const clients = symbolClients.get(symbol);
          if (clients) {
            clients.delete(ws);
            unsubscribeSymbol(symbol);
          }
          console.log(`Client disconnected from ${symbol}. Code: ${code}, Reason: ${reason.toString()}`);
        },
        onError: (err: Error, ws: any) => {
          console.error(`WS error for ${symbol}:`, err);
        },
      };
    })
  );
  return app;
}
