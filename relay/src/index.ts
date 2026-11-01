// The live relay (docs/backend.md#live-relay): a Worker that hands browser WebSockets from the allowed origins to one
// Durable Object, the island room, which relays each person's intents to the other. The room uses the WebSocket
// Hibernation API, so an idle connection costs nothing; a phone connects only while the app is on screen.
import { DurableObject } from 'cloudflare:workers';
import { LIVE_V, type Relayed } from '../../app/src/lib/sync/live-protocol.ts';
import { originAllowed } from './auth.ts';
import { HELLO_MS, RoomCore, type Meta } from './room.ts';

export interface Env {
  ROOM: DurableObjectNamespace<IslandRoom>;
  /** Comma-separated page origins allowed to connect (localhost is always allowed). */
  ALLOWED_ORIGINS: string;
  /** The person keys (secrets). Unset = nobody gets in. */
  KEY_A?: string;
  KEY_B?: string;
}

const RING = 'ring';

export class IslandRoom extends DurableObject<Env> {
  private core!: RoomCore<WebSocket>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      const ring = (await ctx.storage.get<Relayed[]>(RING)) ?? [];
      this.core = new RoomCore<WebSocket>({
        sockets: () => ctx.getWebSockets(),
        meta: (s) => (s.deserializeAttachment() as Meta | null) ?? null,
        setMeta: (s, m) => s.serializeAttachment(m),
        keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B },
        now: () => Date.now(),
        save: (r) => void ctx.storage.put(RING, r)
      }, ring);
    });
  }

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected a WebSocket', { status: 426 });
    if (!this.core.roomFor()) return new Response('room full', { status: 503 });
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    this.core.open(server);
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + HELLO_MS);
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    this.core.message(ws, typeof message === 'string' ? message : null);
  }

  webSocketClose(ws: WebSocket, code: number): void {
    this.core.close(ws);
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, 'bye');
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws: WebSocket): void {
    this.core.close(ws);
  }

  async alarm(): Promise<void> {
    const next = this.core.sweep();
    if (next !== null) await this.ctx.storage.setAlarm(next);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      return Response.json({ ok: true, v: LIVE_V, t: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (url.pathname !== '/room') return new Response('not found', { status: 404 });
    if (!originAllowed(req.headers.get('Origin'), env.ALLOWED_ORIGINS ?? '')) return new Response('forbidden', { status: 403 });
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected a WebSocket', { status: 426 });
    return env.ROOM.get(env.ROOM.idFromName('island')).fetch(req);
  }
} satisfies ExportedHandler<Env>;
