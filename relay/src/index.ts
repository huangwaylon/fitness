// The live relay (docs/backend.md#live-relay): a Worker that hands browser WebSockets from the allowed origins to one
// Durable Object, the island room, which relays each person's intents to the other. The room uses the WebSocket
// Hibernation API, so an idle connection costs nothing; a phone connects only while the app is on screen.
import { DurableObject } from 'cloudflare:workers';
import { LIVE_V, LIVE_VS, MAX_BYTES, parseNotice, type Notice, type Relayed, type Who } from '../../app/src/lib/sync/live-protocol.ts';
import { originAllowed } from './auth.ts';
import { SIG_HEADER, TIME_HEADER, verifyNotify } from './notify.ts';
import { HELLO_MS, RoomCore, type Kept, type Meta } from './room.ts';
import type { GoalOutcome, GoalReq, PushLang, PushSub } from '../../app/src/lib/sync/push-protocol.ts';
import { PushCore, type StoredSub } from './push.ts';
import { isPushPath, pushRoute, type PushRoom } from './pushRoute.ts';
import { pushRequest, type Vapid } from './webpush.ts';

export interface Env {
  ROOM: DurableObjectNamespace<IslandRoom>;
  /** Comma-separated page origins allowed to connect (localhost is always allowed). */
  ALLOWED_ORIGINS: string;
  /** The person keys (secrets). Unset = nobody gets in. */
  KEY_A?: string;
  KEY_B?: string;
  /** Web Push (docs/backend.md#notifications): the VAPID public key (a var, also in the app) and its private scalar
   *  (a secret), both base64url, and the subject the push services may contact. Unset = no push goes out. */
  VAPID_PUBLIC?: string;
  VAPID_PRIVATE?: string;
  VAPID_SUBJECT?: string;
}

const RING = 'ring';
/** How long a push service may hold a goal notice for an offline phone (s). */
const PUSH_TTL_S = 2 * 3600;

export class IslandRoom extends DurableObject<Env> implements PushRoom {
  private core!: RoomCore<WebSocket>;
  private push: PushCore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      const ring = (await ctx.storage.get<Kept[]>(RING)) ?? [];
      this.core = new RoomCore<WebSocket>({
        sockets: () => ctx.getWebSockets(),
        meta: (s) => (s.deserializeAttachment() as Meta | null) ?? null,
        setMeta: (s, m) => s.serializeAttachment(m),
        keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B },
        now: () => Date.now(),
        save: (r) => void ctx.storage.put(RING, r)
      }, ring);
    });
    const sql = ctx.storage.sql;
    sql.exec('CREATE TABLE IF NOT EXISTS push_subs (endpoint TEXT PRIMARY KEY, who TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, lang TEXT NOT NULL, at INTEGER NOT NULL)');
    sql.exec('CREATE TABLE IF NOT EXISTS push_sent (who TEXT PRIMARY KEY, date TEXT NOT NULL)');
    const vapid: Vapid | null = env.VAPID_PUBLIC && env.VAPID_PRIVATE
      ? { publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE, subject: env.VAPID_SUBJECT || 'https://huangwaylon.github.io/fitness/' }
      : null;
    this.push = new PushCore({
      subs: (who) => sql.exec<Record<string, string | number>>('SELECT * FROM push_subs WHERE who = ?', who).toArray().map((r) => r as unknown as StoredSub),
      putSub: (s) => void sql.exec('INSERT OR REPLACE INTO push_subs (endpoint, who, p256dh, auth, lang, at) VALUES (?, ?, ?, ?, ?, ?)', s.endpoint, s.who, s.p256dh, s.auth, s.lang, s.at),
      dropSub: (endpoint, who) =>
        void (who ? sql.exec('DELETE FROM push_subs WHERE endpoint = ? AND who = ?', endpoint, who) : sql.exec('DELETE FROM push_subs WHERE endpoint = ?', endpoint)),
      sentOn: (who) => (sql.exec<{ date: string }>('SELECT date FROM push_sent WHERE who = ?', who).toArray()[0]?.date ?? null),
      setSentOn: (who, date) => void sql.exec('INSERT OR REPLACE INTO push_sent (who, date) VALUES (?, ?)', who, date),
      async send(s, msg) {
        if (!vapid) return 0;
        try {
          const res = await fetch(await pushRequest(s, JSON.stringify(msg), vapid, Date.now(), PUSH_TTL_S));
          if (!res.ok) console.warn('push', new URL(s.endpoint).hostname, res.status, (await res.text()).slice(0, 200));
          return res.status;
        } catch (e) {
          console.warn('push failed', e);
          return 0;
        }
      },
      now: () => Date.now()
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

  /** RPC from the Worker's /notify: pass the sheet change to the connected phones. */
  notify(n: Notice): number {
    return this.core.notify(n);
  }

  /** RPC from the Worker's /push/*: keep a phone's subscription, forget it, or tell the partner a day met all four. */
  pushSubscribe(who: Who, sub: PushSub, lang: PushLang): void {
    this.push.subscribe(who, sub, lang);
  }

  pushUnsubscribe(who: Who, endpoint: string): void {
    this.push.unsubscribe(who, endpoint);
  }

  pushGoal(who: Who, r: Omit<GoalReq, 'key'>): Promise<{ outcome: GoalOutcome; sent: number }> {
    return this.push.goal(who, r);
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
      return Response.json({ ok: true, v: LIVE_V, versions: LIVE_VS, t: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/notify') return notify(req, env);
    if (isPushPath(url.pathname)) {
      return pushRoute(req, url.pathname, { KEY_A: env.KEY_A, KEY_B: env.KEY_B }, env.ALLOWED_ORIGINS ?? '', () => env.ROOM.get(env.ROOM.idFromName('island')));
    }
    if (url.pathname !== '/room') return new Response('not found', { status: 404 });
    if (!originAllowed(req.headers.get('Origin'), env.ALLOWED_ORIGINS ?? '')) return new Response('forbidden', { status: 403 });
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected a WebSocket', { status: 426 });
    return env.ROOM.get(env.ROOM.idFromName('island')).fetch(req);
  }
} satisfies ExportedHandler<Env>;

/**
 * POST /notify (docs/backend.md#push): Apps Script says the sheet changed. Signed (notify.ts), never from a browser
 * (no CORS), the body a Notice. 204 when accepted (whether or not a phone was there to hear it).
 */
async function notify(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > MAX_BYTES) return new Response('too large', { status: 413 });
  const body = await req.text();
  if (body.length > MAX_BYTES) return new Response('too large', { status: 413 });
  const keys = { KEY_A: env.KEY_A, KEY_B: env.KEY_B };
  if (!(await verifyNotify(keys, req.headers.get(TIME_HEADER), req.headers.get(SIG_HEADER), body, Date.now()))) {
    return new Response('unauthorized', { status: 401 });
  }
  const n = parseNotice(body);
  if (!n) return new Response('bad request', { status: 400 });
  const heard = await env.ROOM.get(env.ROOM.idFromName('island')).notify(n);
  return new Response(null, { status: 204, headers: { 'X-Island-Heard': String(heard) } });
}
