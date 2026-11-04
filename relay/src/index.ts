// The live relay (docs/backend.md#live-relay): a Worker that hands browser WebSockets from the allowed origins to one
// Durable Object, the island room, which relays each person's intents to the other. The room uses the WebSocket
// Hibernation API, so an idle connection costs nothing; a phone connects only while the app is on screen.
import { DurableObject } from 'cloudflare:workers';
import { LIVE_V, LIVE_VS, MAX_BYTES, parseNotice, type Notice, type RecordMark, type Gone } from '../../app/src/lib/sync/live-protocol.ts';
import { originAllowed } from './auth.ts';
import { SIG_HEADER, TIME_HEADER, verifyNotify } from './notify.ts';
import { HELLO_MS, RoomCore, type Held, type Kept, type Meta } from './room.ts';
import { isOldPushPath, pushGone } from './pushGone.ts';
import { IslandStore } from './storeObject.ts';
import { adminRoute, apiRoute } from './storeRoute.ts';
import { TOKYO, WX_EMPTY, due, fetchTick, fixture, omUrl, wxHealth, type WxState } from './weather.ts';

export { IslandStore };

export interface Env {
  ROOM: DurableObjectNamespace<IslandRoom>;
  /** The record (docs/backend.md#the-record): one SQLite-backed object, `idFromName('record')`. */
  STORE: DurableObjectNamespace<IslandStore>;
  /** Comma-separated page origins allowed to connect (localhost is always allowed). */
  ALLOWED_ORIGINS: string;
  /** The person keys (secrets). Unset = nobody gets in. */
  KEY_A?: string;
  KEY_B?: string;
  /** The guest's key (docs/backend.md#the-guest): a secret like the others; unset = no guest. */
  KEY_C?: string;
  /** The Apps Script web app's /exec URL the cron exports the record to (docs/backend.md#the-record "Export"); unset: no export (the test copy). */
  EXPORT_URL?: string;
  /** Where the real weather is fetched for (weather.ts): central Tokyo, by the 東京 AMeDAS station. */
  WX_LAT?: string;
  WX_LON?: string;
}

/** What `/health` and the room's weather ops say of the real weather (weather.ts wxHealth). */
export type WxHealth = ReturnType<typeof wxHealth>;

const RING = 'ring';
/** The record's last change (welcome `rec`). */
const REC = 'rec';
/** The high-fives held for a partner who was away (room.ts Held). */
const HELD = 'held';
/** When each person's phone last left (room.ts gone: the welcome's). */
const GONE = 'gone';
/** The real weather (weather.ts WxState): the timeline and the failures since the last good fetch. */
const WX = 'wx';
export class IslandRoom extends DurableObject<Env> {
  private core!: RoomCore<WebSocket>;
  private wx: WxState = WX_EMPTY;
  /** The fetch under way (one at a time: the cron's and a hello's share it). */
  private wxBusy: Promise<WxTick> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      const ring = (await ctx.storage.get<Kept[]>(RING)) ?? [];
      const rec = (await ctx.storage.get<RecordMark>(REC)) ?? null;
      const held = (await ctx.storage.get<Held>(HELD)) ?? {};
      const gone = (await ctx.storage.get<Gone>(GONE)) ?? {};
      this.wx = (await ctx.storage.get<WxState>(WX)) ?? WX_EMPTY;
      this.core = new RoomCore<WebSocket>({
        sockets: () => ctx.getWebSockets(),
        meta: (s) => (s.deserializeAttachment() as Meta | null) ?? null,
        setMeta: (s, m) => s.serializeAttachment(m),
        keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
        now: () => Date.now(),
        save: (r) => void ctx.storage.put(RING, r),
        saveRec: (r) => void ctx.storage.put(REC, r),
        hold: (h) => void ctx.storage.put(HELD, h),
        saveGone: (g) => void ctx.storage.put(GONE, g),
        // the test copy has no cron: a hello fetches the weather when it's due (production's safety net too)
        onHello: () => void this.weatherTick().catch((e) => console.warn('wx-fail', e))
      }, ring, rec, held, gone, this.wx.wx);
    });
    // the Web Push subscriptions and the goal days, kept until notifications were removed (2026-11-02): gone
    ctx.storage.sql.exec('DROP TABLE IF EXISTS push_subs');
    ctx.storage.sql.exec('DROP TABLE IF EXISTS push_sent');
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

  /** RPC from the record (and the Worker's /notify): pass the change to the connected phones. */
  notify(n: Notice): number {
    return this.core.notify(n);
  }

  /**
   * The real weather (weather.ts, docs/backend.md "The real weather"): fetch Open-Meteo's forecast when it's due (or
   * `force`), keep the timeline, and send `wx` to the phones when it changed. From the cron (every 15 minutes) and a
   * hello. A failure keeps the timeline it had and backs off.
   */
  async weatherTick(force = false): Promise<WxTick> {
    if (this.wxBusy) return this.wxBusy;
    const now = Date.now();
    if (!force && !due(this.wx, now)) return { ok: true, fetched: false, heard: 0, health: wxHealth(this.wx, now) };
    const lat = Number(this.env.WX_LAT) || TOKYO.lat, lon = Number(this.env.WX_LON) || TOKYO.lon;
    this.wxBusy = (async () => {
      try {
        const r = await fetchTick(this.wx, now, (u, i) => fetch(u, i), omUrl(lat, lon));
        this.wx = r.st;
        await this.ctx.storage.put(WX, r.st);
        if (r.fail) console.warn('wx-fail', r.fail);
        const heard = this.core.setWx(r.st.wx, r.send);
        return { ok: !r.fail, fetched: true, ...(r.fail ? { fail: r.fail } : {}), sent: r.send, heard, health: wxHealth(r.st, Date.now()) };
      } finally {
        this.wxBusy = null;
      }
    })();
    return this.wxBusy;
  }

  /** The `/admin` op `wx` (storeObject.ts): `{refresh: true}` fetches now; `{s, fx?}` puts a fixture timeline in from
   *  the current hour (the smoke test); `{}` says how it is. */
  async wxAdmin(o: { s?: unknown; fx?: unknown; refresh?: unknown }): Promise<Record<string, unknown>> {
    if (o.refresh === true) return { ...(await this.weatherTick(true)) };
    const now = Date.now();
    if (o.s !== undefined) {
      const fx = Array.isArray(o.fx) ? (o.fx as number[]) : undefined;
      const st = typeof o.s === 'string' ? fixture(this.wx, o.s, fx, now) : null;
      if (!st) return { ok: false, error: 'bad_request' };
      this.wx = st;
      await this.ctx.storage.put(WX, st);
      return { ok: true, wx: st.wx, heard: this.core.setWx(st.wx, true) };
    }
    return { ok: true, wx: this.wx.wx, health: wxHealth(this.wx, now) };
  }

  /** What `/health` says of the weather. */
  wxHealth(): WxHealth {
    return wxHealth(this.wx, Date.now());
  }

  async alarm(): Promise<void> {
    const next = this.core.sweep();
    if (next !== null) await this.ctx.storage.setAlarm(next);
  }
}

/** A weather tick's outcome (the cron's log, the `/admin` op). */
type WxTick = { ok: boolean; fetched: boolean; fail?: string; sent?: boolean; heard: number; health: WxHealth };

/** The cron's nightly run (UTC 18:00 = Tokyo 03:00): the export goes whatever changed. */
const NIGHTLY = '0 18 * * *';

export default {
  /** Every 15 minutes, the record's export to the sheet when it changed (storeObject.ts exportTick), and the real
   *  weather when it's due (IslandRoom weatherTick). */
  async scheduled(ev: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(env.STORE.get(env.STORE.idFromName('record')).exportTick(ev.cron === NIGHTLY).then((r) => console.log('export', JSON.stringify(r).slice(0, 200))));
    ctx.waitUntil(
      env.ROOM.get(env.ROOM.idFromName('island')).weatherTick().then(
        (r) => r.fetched && console.log('wx', JSON.stringify(r).slice(0, 200)),
        (e) => console.warn('wx-fail', e)
      )
    );
  },
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      // the real weather's age (the runbook, the smoke test): never in the way of the health itself
      const wx = await env.ROOM.get(env.ROOM.idFromName('island')).wxHealth().catch(() => null);
      return Response.json({ ok: true, v: LIVE_V, versions: LIVE_VS, t: Date.now(), wx }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/notify') return notify(req, env);
    if (url.pathname === '/api') return apiRoute(req, env.ALLOWED_ORIGINS ?? '', () => env.STORE.get(env.STORE.idFromName('record')));
    if (url.pathname === '/admin') return adminRoute(req, () => env.STORE.get(env.STORE.idFromName('record')));
    // notifications are gone: an old app's /push/* gets 410 (pushGone.ts)
    if (isOldPushPath(url.pathname)) return pushGone(req, env.ALLOWED_ORIGINS ?? '');
    if (url.pathname !== '/room') return new Response('not found', { status: 404 });
    if (!originAllowed(req.headers.get('Origin'), env.ALLOWED_ORIGINS ?? '')) return new Response('forbidden', { status: 403 });
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected a WebSocket', { status: 426 });
    return env.ROOM.get(env.ROOM.idFromName('island')).fetch(req);
  }
} satisfies ExportedHandler<Env>;

/**
 * POST /notify (docs/backend.md#push): a server says the record changed (the record itself tells the room by RPC). Signed (notify.ts), never from a browser
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
