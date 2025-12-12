declare module '@hono/node-ws' {
  import type { Context } from 'hono';
  type WSHandler = (c: Context) => {
    onOpen?: (evt: any, ws: any) => void;
    onMessage?: (evt: any, ws: any) => void;
    onClose?: (evt: any, ws: any) => void;
    onError?: (evt: any, ws: any) => void;
  } | unknown;
  export function upgradeWebSocket(handler: WSHandler): any;
}
