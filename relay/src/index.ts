// The live relay (docs/backend.md#live-relay): a Worker that hands browser WebSockets from the allowed origins to one
// Durable Object, the island room, which relays each person's intents to the other. The room uses the WebSocket
// Hibernation API, so an idle connection costs nothing; a phone connects only while the app is on screen.
import { DurableObject } from 'cloudflare:workers';
import { HB_PING, HB_PONG, LIVE_V, LIVE_VS, MAX_BYTES, parseNotice, type Notice, type RecordMark, type Gone } from '../../app/src/lib/contract/live-protocol.ts';
import { admission, originAllowed, subprotocolOf, TICKET_HEADER } from './auth.ts';
import { SIG_HEADER, TIME_HEADER, verifyNotify } from './notify.ts';
import { HELLO_MS, RoomCore, SILENT_MS, type Acked, type DayIndex, type Held, type Kept, type Meta, type Music } from './room.ts';
import { IslandStore } from './storeObject.ts';
import { isCompactTick } from './store.ts';
import { IslandLog } from './logObject.ts';
import { adminRoute, apiRoute } from './storeRoute.ts';
import { logHealthRoute, logRoute, relaySink } from './logRoute.ts';
import { sttRoute, type SttAi } from './sttRoute.ts';
import { keyOwner } from './auth.ts';
import { errName, type RelayEvent } from './log.ts';
import type { ReqMeta } from './reqMeta.ts';
import { TOKYO, WX_EMPTY, due, fetchTick, fixture, omUrl, wxHealth, type WxState } from './weather.ts';

export { IslandStore, IslandLog };

export interface Env {
  ROOM: DurableObjectNamespace<IslandRoom>;
  /** The record (docs/backend.md#the-record): one SQLite-backed object, `idFromName('record')`. */
  STORE: DurableObjectNamespace<IslandStore>;
  /** The log (docs/ops/observability.md): one SQLite-backed object, `idFromName('log')`. */
  LOG: DurableObjectNamespace<IslandLog>;
  /** `1`: the log's off switch (`/log` acknowledges, nothing is kept; the relay sends it nothing). */
  LOG_OFF?: string;
  /** The health workflow's token for `/health/log` (a secret: counts only). Unset: no `/health/log`. */
  HEALTH_TOKEN?: string;
  /** Comma-separated page origins allowed to connect (localhost is always allowed). */
  ALLOWED_ORIGINS: string;
  /** The person keys (secrets). Unset = nobody gets in. */
  KEY_A?: string;
  KEY_B?: string;
  /** The guest's key (docs/backend.md#the-guest): a secret like the others; unset = no guest. */
  KEY_C?: string;
  /** Where the real weather is fetched for (weather.ts): central Tokyo, by the 東京 AMeDAS station. */
  WX_LAT?: string;
  WX_LON?: string;
  /** `1`: the cron compacts the record once a day (04:15 Tokyo). Unset: it doesn't (the user's hold, 2026-11-05: the
   *  locked days' history is kept); the admin `compact` still runs it by hand. */
  COMPACT_CRON?: string;
  /** Workers AI (`/stt`, sttRoute.ts); `STT_OFF` `1`: refused; `STT_DAY_MAX`: a role's calls a UTC day. */
  AI?: SttAi;
  STT_OFF?: string;
  STT_DAY_MAX?: string;
}

/** What `/health` and the room's weather ops say of the real weather (weather.ts wxHealth). */
export type WxHealth = ReturnType<typeof wxHealth>;

const RING = 'ring';
/** The day's claims and nests (room.ts DayIndex): apart from the ring, which trims. */
const DAY = 'day';
/** The record's last change (welcome `rec`). */
const REC = 'rec';
/** The last change the guest heard of (room.ts guestNotice: no member's ingest), its welcome's `rec`. */
const REC_G = 'rec-g';
/** What the room acked but doesn't keep (room.ts Acked): a resend after a wake is acked again. */
const ACKED = 'acked';
/** The high-fives held for a partner who was away (room.ts Held). */
const HELD = 'held';
/** When each person's phone last left (room.ts gone: the welcome's). */
const GONE = 'gone';
/** The music stages (room.ts Music). */
const MUSIC = 'music';
/** The real weather (weather.ts WxState): the timeline and the failures since the last good fetch. */
const WX = 'wx';
/** A restore of the record under way (storeObject.ts restore): when to tell the restored record to start a new epoch,
 *  and how many tries so far. */
const RESTORE = 'restore';
/** The record restarts on its bookmark ~200 ms after its reply: the room calls it this long after. */
const RESTORE_AFTER_MS = 5_000;
const RESTORE_RETRY_MS = 30_000;
const RESTORE_TRIES = 10;
export class IslandRoom extends DurableObject<Env> {
  private core!: RoomCore<WebSocket>;
  private wx: WxState = WX_EMPTY;
  /** The fetch under way (one at a time: the cron's and a hello's share it). */
  private wxBusy: Promise<WxTick> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // the heartbeat (live-protocol.ts HB_PING): answered by the runtime, the room left asleep (no duration billed)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(HB_PING, HB_PONG));
    void ctx.blockConcurrencyWhile(async () => {
      const ring = (await ctx.storage.get<Kept[]>(RING)) ?? [];
      const rec = (await ctx.storage.get<RecordMark>(REC)) ?? null;
      const held = (await ctx.storage.get<Held>(HELD)) ?? {};
      const gone = (await ctx.storage.get<Gone>(GONE)) ?? {};
      const day = (await ctx.storage.get<DayIndex>(DAY)) ?? null;
      const recG = (await ctx.storage.get<RecordMark>(REC_G)) ?? null;
      const acked = (await ctx.storage.get<Acked>(ACKED)) ?? [];
      const music = (await ctx.storage.get<Music>(MUSIC)) ?? {};
      this.wx = (await ctx.storage.get<WxState>(WX)) ?? WX_EMPTY;
      this.core = new RoomCore<WebSocket>({
        sockets: () => ctx.getWebSockets(),
        meta: (s) => (s.deserializeAttachment() as Meta | null) ?? null,
        setMeta: (s, m) => s.serializeAttachment(m),
        keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
        now: () => Date.now(),
        save: (r) => void ctx.storage.put(RING, r),
        saveDay: (d) => void ctx.storage.put(DAY, d),
        saveRec: (r) => void ctx.storage.put(REC, r),
        saveRecG: (r) => void ctx.storage.put(REC_G, r),
        saveAcked: (a) => void ctx.storage.put(ACKED, a),
        hold: (h) => void ctx.storage.put(HELD, h),
        saveGone: (g) => void ctx.storage.put(GONE, g),
        saveMusic: (m) => void ctx.storage.put(MUSIC, m),
        // the heartbeat's last answer (the runtime's: HB_PING never wakes the room), for the ghosts' watch
        heardAt: (s) => ctx.getWebSocketAutoResponseTimestamp(s)?.getTime() ?? null,
        // the test copy has no cron: a hello fetches the weather when it's due (production's safety net too)
        onHello: (who, v, build) => {
          // each phone's protocol version and build (the log's ws.hello: which phones speak what)
          this.log([{ e: 'ws.hello', l: 1, role: who, d: { v, ...(build ? { build } : {}) } }]);
          // the ghosts' watch (room.ts sweepSilent) while anyone is in
          void this.alarmBy(Date.now() + SILENT_MS).catch((e) => console.warn('alarm', errName(e)));
          void this.weatherTick().catch((e) => console.warn('wx-fail', e));
        }
      }, ring, rec, held, gone, this.wx.wx, day, recG, acked, music);
    });
  }

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected a WebSocket', { status: 426 });
    // never refused: the oldest socket still waiting for its hello is let go instead (room.ts makeRoom)
    const evicted = this.core.makeRoom();
    if (evicted) this.log([{ e: 'room.full', l: 2, d: { socks: this.ctx.getWebSockets().length } }]);
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    // whose admission ticket it came with (the Worker checked it: admission, below), never let go to make room
    const tk = req.headers.get(TICKET_HEADER);
    this.core.open(server, tk === 'A' || tk === 'B' || tk === 'G' ? tk : undefined);
    await this.alarmBy(Date.now() + HELLO_MS);
    // a phone that offered subprotocols hears one back (a browser drops a socket whose answer names none it offered)
    const proto = subprotocolOf(req.headers.get('Sec-WebSocket-Protocol'));
    return new Response(null, { status: 101, webSocket: client, ...(proto ? { headers: { 'Sec-WebSocket-Protocol': proto } } : {}) });
  }

  /** The alarm at `at` at the latest (one alarm: the hello sweep's and a restore's share it). */
  private async alarmBy(at: number): Promise<void> {
    const cur = await this.ctx.storage.getAlarm();
    if (cur === null || at < cur) await this.ctx.storage.setAlarm(at);
  }

  /** RPC from the record: it is restoring a bookmark. A few seconds on, the alarm tells the restored record to start
   *  a new epoch (`restored`), so every phone refetches; kept in the room's storage (the record's is the bookmark's). */
  async restoring(): Promise<void> {
    const due = Date.now() + RESTORE_AFTER_MS;
    await this.ctx.storage.put(RESTORE, { due, tries: 0 });
    await this.alarmBy(due);
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    // a throw here (a bug, a storage hiccup) would be the runtime's: an error logged nowhere we read, the socket
    // possibly reset. Caught: the log's do.error (its class only), the socket kept
    try {
      this.core.message(ws, typeof message === 'string' ? message : null);
    } catch (e) {
      console.error('ws.message', errName(e));
      this.log([{ e: 'do.error', l: 3, d: { where: 'ws.message', name: errName(e) } }]);
    }
  }

  webSocketClose(ws: WebSocket, code: number): void {
    const m = ws.deserializeAttachment() as Meta | null;
    this.core.close(ws);
    this.log([{ e: 'room.close', l: 1, role: m?.who ?? null, d: { code, secs: m?.opened ? Math.round((Date.now() - m.opened) / 1000) : -1, socks: this.ctx.getWebSockets().length - 1 } }]);
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, 'bye');
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws: WebSocket): void {
    this.core.close(ws);
  }

  /** The room's events to the log (logRoute.ts relaySink: best effort). */
  private log(evs: RelayEvent[]): void {
    if (this.env.LOG_OFF === '1') return;
    relaySink(() => this.env.LOG.get(this.env.LOG.idFromName('log')), (p) => this.ctx.waitUntil(p), Date.now)(evs);
  }

  /** RPC from the record (and the Worker's /notify): pass the change to the connected phones. */
  notify(n: Notice, guest?: boolean): number {
    return this.core.notify(n, guest);
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
    // the hello sweep's and the ghosts' watch (while anyone is in), the sooner
    const a = this.core.sweep(), b = this.core.sweepSilent();
    let next = a === null ? b : b === null ? a : Math.min(a, b);
    const r = await this.ctx.storage.get<{ due: number; tries: number }>(RESTORE);
    if (r) {
      let due: number | null = r.due;
      if (r.due <= Date.now()) {
        try {
          const { rev } = await this.env.STORE.get(this.env.STORE.idFromName('record')).restored();
          console.log('restored', rev);
          due = null;
        } catch (e) {
          console.warn('restored', errName(e));
          due = r.tries + 1 < RESTORE_TRIES ? Date.now() + RESTORE_RETRY_MS : null;
        }
        if (due === null) await this.ctx.storage.delete(RESTORE);
        else await this.ctx.storage.put(RESTORE, { due, tries: r.tries + 1 });
      }
      if (due !== null) next = next === null ? due : Math.min(next, due);
    }
    if (next !== null) await this.ctx.storage.setAlarm(next);
  }
}

/** A weather tick's outcome (the cron's log, the `/admin` op). */
type WxTick = { ok: boolean; fetched: boolean; fail?: string; sent?: boolean; heard: number; health: WxHealth };

export default {
  /** Every 15 minutes: the real weather when it's due (IslandRoom weatherTick); once a day, at 04:15 Tokyo (just after a
   *  Wednesday's week lock), the record's compaction (store.ts compact) when COMPACT_CRON is `1`. */
  async scheduled(ev: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const t0 = Date.now();
    const log = sinkOf(env, ctx);
    if (env.COMPACT_CRON === '1' && isCompactTick(ev.scheduledTime)) {
      ctx.waitUntil(env.STORE.get(env.STORE.idFromName('record')).compactTick().then(
        (r) => console.log('compact', JSON.stringify(r)),
        (e) => {
          console.warn('compact-fail', errName(e));
          log([{ e: 'do.error', l: 3, d: { where: 'compact', name: errName(e) } }]);
        }
      ));
    }
    ctx.waitUntil(
      env.ROOM.get(env.ROOM.idFromName('island')).weatherTick().then(
        (r) => {
          if (r.fetched) console.log('wx', JSON.stringify({ ok: r.ok, fail: r.fail, hours: r.health.hours }));
          // a tick that fetched (at :15 and :45) or failed: the log's `cron.wx`
          if (r.fetched) log([{ e: 'cron.wx', l: r.ok ? 1 : 2, d: { ok: r.ok, fetched: true, fail: r.fail, hours: r.health.hours, age: r.health.age, ms: Date.now() - t0 } }]);
        },
        (e) => {
          console.warn('wx-fail', errName(e));
          log([{ e: 'cron.wx', l: 3, d: { ok: false, fetched: false, fail: errName(e), ms: Date.now() - t0 } }]);
        }
      )
    );
  },
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const logObj = () => env.LOG.get(env.LOG.idFromName('log'));
    if (url.pathname === '/health') {
      // the real weather's age (the runbook, the smoke test): never in the way of the health itself
      const wx = await env.ROOM.get(env.ROOM.idFromName('island')).wxHealth().catch(() => null);
      return Response.json({ ok: true, v: LIVE_V, versions: LIVE_VS, t: Date.now(), wx }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/notify') return notify(req, env);
    if (url.pathname === '/api') {
      const log = sinkOf(env, ctx);
      return apiRoute(req, env.ALLOWED_ORIGINS ?? '', () => env.STORE.get(env.STORE.idFromName('record')), (m, ms) => log([reqEvent(m, ms)]), { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C });
    }
    if (url.pathname === '/log') {
      return logRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', off: env.LOG_OFF === '1', roleOf: (k) => (typeof k === 'string' && /^[0-9a-fA-F]{32,128}$/.test(k) ? keyOwner(k, env) : null), now: Date.now }, logObj);
    }
    if (url.pathname === '/stt') return sttRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', off: env.STT_OFF === '1', roleOf: (k) => keyOwner(k, env), spend: (r) => logObj().spend(`stt:${r}`, Number(env.STT_DAY_MAX) || 300), ai: env.AI, log: sinkOf(env, ctx), now: Date.now });
    if (url.pathname === '/health/log') return logHealthRoute(req, env.HEALTH_TOKEN, logObj);
    if (url.pathname === '/admin') return adminRoute(req, () => env.STORE.get(env.STORE.idFromName('record')));
    if (url.pathname !== '/room') return new Response('not found', { status: 404 });
    if (!originAllowed(req.headers.get('Origin'), env.ALLOWED_ORIGINS ?? '')) return new Response('forbidden', { status: 403 });
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected a WebSocket', { status: 426 });
    const adm = await admission(req, env, Date.now());
    if (!adm) return new Response('forbidden', { status: 403 });
    return env.ROOM.get(env.ROOM.idFromName('island')).fetch(adm);
  }
} satisfies ExportedHandler<Env>;

/** The relay's events to the log from a request or the cron (none with the off switch). */
function sinkOf(env: Env, ctx: ExecutionContext): (evs: RelayEvent[]) => void {
  if (env.LOG_OFF === '1') return () => {};
  return relaySink(() => env.LOG.get(env.LOG.idFromName('log')), (p) => ctx.waitUntil(p), Date.now);
}

/** An `/api` request as the log's `req` (reqMeta.ts): warn when refused, error when the record failed. */
function reqEvent(m: ReqMeta, ms: number): RelayEvent {
  const { role, rid, sid, ...d } = m;
  const l = m.st === 'unavailable' ? 3 : m.st === 'ok' && !m.rej ? 1 : 2;
  return { e: 'req', l, role, rid, sid, d: { ...d, ms } };
}

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
