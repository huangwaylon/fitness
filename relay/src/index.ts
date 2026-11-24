// The live relay (docs/backend.md#live-relay): a Worker that hands browser WebSockets from the allowed origins to one
// Durable Object, the island room, which relays each person's intents to the other. The room uses the WebSocket
// Hibernation API, so an idle connection costs nothing; a phone connects only while the app is on screen.
import { DurableObject } from 'cloudflare:workers';
import { HB_PING, HB_PONG, LIVE_V, LIVE_VS, type Notice, type RecordMark, type Gone } from '../../app/src/lib/contract/live-protocol.ts';
import { admission, originAllowed, roleOfKey, subprotocolOf, TICKET_HEADER } from './auth.ts';
import { HELLO_MS, RoomCore, SILENT_MS, type Acked, type DayIndex, type Held, type Kept, type Meta, type Music, type Pres, type SgRow } from './room.ts';
import { IslandStore } from './storeObject.ts';
import { ARCHIVE_CRON } from './archive.ts';
import { isCatchup } from './nightly.ts';
import { IslandLog } from './logObject.ts';
import { adminRoute, apiRoute } from './storeRoute.ts';
import { logHealthRoute, logRoute } from './logRoute.ts';
import { logDo, record, room, sinkOf } from './objects.ts';
import { sttRoute, type SttAi } from './sttRoute.ts';
import { gradeRoute, type GradeAi } from './gradeRoute.ts';
import { HIKE_DAY_MAX, hikeRoute } from './hikeRoute.ts';
import { isPushPath, pushRoute } from './pushRoute.ts';
import { IMG_DAY_MAX, imgGetRoute, imgPostRoute } from './img.ts';
import { shareRoute } from './share.ts';
import { placesRoute } from './places.ts';
import { jobsRoute } from './jobs.ts';
import { errData, errName, type RelayEvent } from './log.ts';
import type { ReqMeta } from './reqMeta.ts';
import { TOKYO, WX_EMPTY, due, fetchTick, fixture, omUrl, wxHealth, type WxState } from './weather.ts';
import { wxWetDays } from '../../app/src/lib/contract/wet.ts';

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
  /** The places pull's own admin secret (sign.ts placesSecret: places ops only; GitHub's RELAY_PLACES_KEY). Unset: off. */
  PLACES_KEY?: string;
  /** Where the real weather is fetched for (weather.ts): central Tokyo, by the 東京 AMeDAS station. */
  WX_LAT?: string;
  WX_LON?: string;
  /** Workers AI (`/stt`, sttRoute.ts; `/grade`, gradeRoute.ts); `*_OFF` `1`: refused; `*_DAY_MAX`: a role's calls a UTC day. */
  AI?: SttAi & GradeAi;
  STT_OFF?: string;
  STT_DAY_MAX?: string;
  GRADE_OFF?: string;
  GRADE_DAY_MAX?: string;
  /** `POST /img` (img.ts): a role's uploads a UTC day (default IMG_DAY_MAX). */
  IMG_DAY_MAX?: string;
  /** The daily backup (archive.ts): the private repo (`owner/name`), its release's tag, the age recipient (public), and
   *  GitHub's token: the GitHub App's (its/worker/src/ghApp.ts: its ID, installation ID and the relay's private key,
   *  PKCS#8 PEM, secrets; narrowed to that repo's contents), else ARCHIVE_TOKEN (the fallback PAT, that repo's Contents
   *  read/write). Neither: no backup. `ARCHIVE_AUTO` "0": none on its own (the 03:00 slot never armed: the test copy's),
   *  the admin `backup` still runs one. */
  ARCHIVE_AUTO?: string;
  ARCHIVE_REPO?: string;
  ARCHIVE_RELEASE?: string;
  ARCHIVE_RECIPIENT?: string;
  ARCHIVE_TOKEN?: string;
  GH_APP_ID?: string;
  GH_APP_INSTALLATION_ID?: string;
  GH_APP_KEY_RELAY?: string;
  /** The bots' state in the same backup (archive.ts runBots): service bindings to its-bot and gym-bot (wrangler.toml;
   *  unset in the test copy: `none`), and gym-bot's GYM_TOKEN (a secret, the same value as gym-bot's) for its
   *  `/gym/state`; its-bot's `/its/status` takes KEY_A. */
  ITS_BOT?: Fetcher;
  GYM_BOT?: Fetcher;
  GYM_TOKEN?: string;
  /** やること's reminders (pusher.ts): Web Push's VAPID pair, its-bot's same one (its/README.md "Keys"): the public
   *  key a var (wrangler.toml), the private scalar a secret. Either missing: push is off. */
  VAPID_PUBLIC?: string;
  VAPID_PRIVATE?: string;
  /** The deployed commit (scripts/deploy.sh `--var COMMIT:<short sha>`; `-dirty`: the test copy from a dirty tree). */
  COMMIT?: string;
}

/** What `/health` and the room's weather ops say of the real weather (weather.ts wxHealth). */
export type WxHealth = ReturnType<typeof wxHealth>;

const RING = 'ring';
/** 英語すごろく's games (room.ts SgGame: a fold row `sg:<game>`, and a row a move since, `sg:<game>:<i>`, `sg:<game>:e`):
 *  read when a message needs them (SG_NEEDS: a hello replays them, a move or a view joins one), never on a wake that
 *  doesn't (the ghosts' alarm, a world intent, the record's RPC: 2026-11-18, network review N4). */
const SG = 'sg:';
const SG_NEEDS = new Set(['hello', 'sg', 'sgv']);
/** The day's claims and nests (room.ts DayIndex): apart from the ring, which trims. */
const DAY = 'day';
/** The record's last change (welcome `rec`), the last the guest heard of (room.ts guestNotice: no member's ingest), and
 *  the room's rows written (`rw`: all since the object began; `sent`: those the log has heard of): one key, written on
 *  nearly every record write (Marks). */
const MARKS = 'marks';
type Marks = { rec: RecordMark | null; recG: RecordMark | null; rw: number; sent: number };
/** What the room acked but doesn't keep (room.ts Acked): a resend after a wake is acked again. */
const ACKED = 'acked';
/** The high-fives held for a partner who was away (room.ts Held). */
const HELD = 'held';
/** When each person's phone last left (room.ts gone: the welcome's). */
const GONE = 'gone';
/** The music stages (room.ts Music). */
const MUSIC = 'music';
/** Each person's last presence replayed at hello (room.ts Pres: a room's `tent`, a line's `fish`). */
const PRES = 'pres';
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
  /** The rows this room wrote (each put one row of the object's SQLite), kept on MARKS with each of its writes. */
  private marks: Marks = { rec: null, recG: null, rw: 0, sent: 0 };
  private put(k: string, v: unknown): Promise<void> {
    this.marks.rw++;
    return this.ctx.storage.put(k, v);
  }
  /** The rows written since the log last heard (room.close's `rw`), now heard. */
  private unsaid(): number {
    const n = this.marks.rw - this.marks.sent;
    this.marks.sent = this.marks.rw;
    return n;
  }

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // the heartbeat (live-protocol.ts HB_PING): answered by the runtime, the room left asleep (no duration billed)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(HB_PING, HB_PONG));
    void ctx.blockConcurrencyWhile(async () => {
      const ring = (await ctx.storage.get<Kept[]>(RING)) ?? [];
      this.marks = (await ctx.storage.get<Marks>(MARKS)) ?? { rec: null, recG: null, rw: 0, sent: 0 };
      const held = (await ctx.storage.get<Held>(HELD)) ?? {};
      const gone = (await ctx.storage.get<Gone>(GONE)) ?? {};
      const day = (await ctx.storage.get<DayIndex>(DAY)) ?? null;
      const acked = (await ctx.storage.get<Acked>(ACKED)) ?? [];
      const music = (await ctx.storage.get<Music>(MUSIC)) ?? {};
      const pres = (await ctx.storage.get<Pres>(PRES)) ?? {};
      this.wx = (await ctx.storage.get<WxState>(WX)) ?? WX_EMPTY;
      this.core = new RoomCore<WebSocket>({
        sockets: () => ctx.getWebSockets(),
        meta: (s) => (s.deserializeAttachment() as Meta | null) ?? null,
        setMeta: (s, m) => s.serializeAttachment(m),
        keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
        now: () => Date.now(),
        save: (r) => void this.put(RING, r),
        saveDay: (d) => void this.put(DAY, d),
        saveRec: (rec, recG) => {
          this.marks = { ...this.marks, rec, recG, rw: this.marks.rw + 1 };
          void this.ctx.storage.put(MARKS, this.marks);
        },
        saveAcked: (a) => void this.put(ACKED, a),
        hold: (h) => void this.put(HELD, h),
        saveGone: (g) => void this.put(GONE, g),
        saveMusic: (m) => void this.put(MUSIC, m),
        savePres: (p) => void this.put(PRES, p),
        // room.shut, room.drop, ws.hello (best effort, off the socket's path)
        log: (e) => this.log([e]),
        saveSg: (k, e) => void this.put(k, e),
        dropSg: (keys) => {
          for (let i = 0; i < keys.length; i += 128) void this.ctx.storage.delete(keys.slice(i, i + 128));
        },
        // the heartbeat's last answer (the runtime's: HB_PING never wakes the room), for the ghosts' watch
        heardAt: (s) => ctx.getWebSocketAutoResponseTimestamp(s)?.getTime() ?? null,
        // the test copy has no cron: a hello fetches the weather when it's due (production's safety net too)
        // (its log, ws.hello, is the room's: the page's build and the others', 2026-11-22)
        onHello: () => {
          // the ghosts' watch (room.ts sweepSilent) while anyone is in
          void this.alarmBy(Date.now() + SILENT_MS).catch((e) => this.warn('alarm', e));
          void this.weatherTick().catch((e) => this.warn('wx', e));
        }
      }, ring, this.marks.rec, held, gone, this.wx.wx, day, this.marks.recG, acked, music, undefined, pres);
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
    await this.put(RESTORE, { due, tries: 0 });
    await this.alarmBy(due);
  }

  /** The すごろく games being read in (once a wake; the room's other events held till then: every message waits in its
   *  order), and once they are. */
  private sgIn: Promise<void> | null = null;
  private sgDone = false;

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (!this.sgDone) {
      if (!this.sgIn && typeof message === 'string' && SG_NEEDS.has(kindOf(message))) {
        this.sgIn = this.ctx.blockConcurrencyWhile(async () => {
          this.core.loadSg([...(await this.ctx.storage.list<SgRow>({ prefix: SG })).values()]);
          this.sgDone = true;
        });
      }
      if (this.sgIn) await this.sgIn;
    }
    // a throw here (a bug, a storage hiccup) would be the runtime's: an error logged nowhere we read, the socket
    // possibly reset. Caught: the log's do.error (its class only), the socket kept
    try {
      this.core.message(ws, typeof message === 'string' ? message : null);
    } catch (e) {
      console.error('ws.message', errName(e));
      this.log([{ e: 'do.error', l: 3, d: errData('ws.message', e) }]);
    }
  }

  webSocketClose(ws: WebSocket, code: number): void {
    const m = ws.deserializeAttachment() as Meta | null;
    this.core.close(ws);
    const rw = this.unsaid();
    this.log([{ e: 'room.close', l: 1, role: m?.who ?? null, d: { code, secs: m?.opened ? Math.round((Date.now() - m.opened) / 1000) : -1, socks: this.ctx.getWebSockets().length - 1, ...(rw ? { rw } : {}), ...(m?.dv ? { dv: m.dv } : {}) } }]);
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, 'bye');
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws: WebSocket): void {
    this.core.close(ws);
  }

  /** The room's events to the log (objects.ts sinkOf: best effort). */
  private readonly log = sinkOf(this.env, (p) => this.ctx.waitUntil(p));
  /** A failure the room gets over by itself (the next hello, the next try): the console and a warn `do.error`. */
  private warn(where: string, e: unknown, l: 2 | 3 = 2): void {
    console.warn(where, errName(e));
    this.log([{ e: 'do.error', l, d: errData(where, e) }]);
  }

  /** RPC from the record: pass the change to the connected phones. */
  notify(n: Notice, guest?: boolean): number {
    return this.core.notify(n, guest);
  }

  /**
   * The real weather (weather.ts, docs/backend.md "The real weather"): fetch Open-Meteo's forecast when it's due (or
   * `force`), keep the timeline, and send `wx` to the phones when it changed. From the cron (at :15 and :45) and a
   * hello. A failure keeps the timeline it had and backs off. `cron`: the cron's tick, kept as `cronAt` in the same
   * row (its heartbeat: a hello's fetch hides a dead cron); with no fetch due, put at most once an hour.
   */
  async weatherTick(force = false, cron = false): Promise<WxTick> {
    if (this.wxBusy) return this.wxBusy;
    const now = Date.now();
    if (!force && !due(this.wx, now)) {
      if (cron && now - (this.wx.cronAt ?? 0) >= CRON_BEAT_MS) {
        this.wx = { ...this.wx, cronAt: now };
        await this.put(WX, this.wx);
      }
      return { ok: true, fetched: false, heard: 0, health: wxHealth(this.wx, now), wet: wxWetDays(this.wx.wx, now) };
    }
    const lat = Number(this.env.WX_LAT) || TOKYO.lat, lon = Number(this.env.WX_LON) || TOKYO.lon;
    this.wxBusy = (async () => {
      try {
        const r = await fetchTick(this.wx, now, (u, i) => fetch(u, i), omUrl(lat, lon));
        const cronAt = cron ? now : this.wx.cronAt;
        this.wx = { ...r.st, ...(cronAt ? { cronAt } : {}) };
        await this.put(WX, this.wx);
        if (r.fail) console.warn('wx-fail', r.fail);
        const heard = this.core.setWx(r.st.wx, r.send);
        return { ok: !r.fail, fetched: true, ...(r.fail ? { fail: r.fail } : {}), sent: r.send, heard, health: wxHealth(r.st, Date.now()), wet: wxWetDays(r.st.wx, Date.now()) };
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
      const fxd = typeof o.s === 'string' ? fixture(this.wx, o.s, fx, now) : null;
      if (!fxd) return { ok: false, error: 'bad_request' };
      const st = { ...fxd, ...(this.wx.cronAt ? { cronAt: this.wx.cronAt } : {}) };
      this.wx = st;
      await this.put(WX, st);
      return { ok: true, wx: st.wx, heard: this.core.setWx(st.wx, true) };
    }
    return { ok: true, wx: this.wx.wx, health: wxHealth(this.wx, now) };
  }

  /** What `/health` says of the weather, and the cron's last tick (`cronAt`, ms; null none yet). */
  wxHealth(): WxHealth & { cronAt: number | null } {
    return { ...wxHealth(this.wx, Date.now()), cronAt: this.wx.cronAt ?? null };
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
          const { rev } = await record(this.env).restored();
          console.log('restored', rev);
          due = null;
        } catch (e) {
          due = r.tries + 1 < RESTORE_TRIES ? Date.now() + RESTORE_RETRY_MS : null;
          // (the last try an error: the phones never told of the new epoch, the runbook's `rev` by hand)
          this.warn('restored', e, due === null ? 3 : 2);
        }
        if (due === null) await this.ctx.storage.delete(RESTORE);
        else await this.put(RESTORE, { due, tries: r.tries + 1 });
      }
      if (due !== null) next = next === null ? due : Math.min(next, due);
    }
    if (next !== null) await this.ctx.storage.setAlarm(next);
  }
}

/** A weather tick's outcome (the cron's log, the `/admin` op). */
type WxTick = { ok: boolean; fetched: boolean; fail?: string; sent?: boolean; heard: number; health: WxHealth; wet: string[] };

export default {
  /** At 03:00 Tokyo (ARCHIVE_CRON): the record's backup and its nightly jobs only. At :15 and :45: the real weather when
   *  it's due (IslandRoom weatherTick), the wet days, the places' categories, the record's alarm checked and, from
   *  04:15, the nightly jobs not done today (nightly.ts; the health workflows' dispatch is its-bot's: its/worker
   *  dispatch.ts). */
  async scheduled(ev: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const t0 = Date.now();
    const log = sinkOf(env, (p) => ctx.waitUntil(p));
    /** A record call off the tick's path; its failure the log's do.error `where`. */
    const kick = (where: string, p: Promise<unknown>) => p.then(
      () => {},
      (e) => {
        console.warn(`${where}-fail`, errName(e));
        log([{ e: 'do.error', l: 3, d: errData(where, e) }]);
      }
    );
    // 03:00 Tokyo: the record's backup and then the bots' state, on its own alarm (archive.ts; storeObject.ts
    // archiveKick), and the nightly jobs (storeObject.ts nightly: the ledgers' check, the 共有リンク sweep, the prunes);
    // nothing else
    if (ev.cron === ARCHIVE_CRON) {
      const store = record(env);
      ctx.waitUntil(kick('backup', store.archiveKick()));
      ctx.waitUntil(kick('nightly', store.nightly(false)));
      return;
    }
    // the record's alarm again if it was lost (やること's reminders), and from 04:15 the nightly jobs not done today
    ctx.waitUntil(kick('armcheck', record(env).armCheck()));
    if (isCatchup(ev.scheduledTime)) ctx.waitUntil(kick('nightly', record(env).nightly(true)));
    // 行きたい場所's categories (storeObject.ts placesTick: logged there; the list itself is places-pull.yml's)
    const places = record(env).placesTick();
    ctx.waitUntil(kick('places', places));
    const wx = room(env).weatherTick(false, true);
    // ボット → 定期処理 (jobs.ts): the tick's outcomes kept, one put, once the weather and the places are done
    ctx.waitUntil(kick('jobs', Promise.allSettled([wx, places]).then(([w, p]) => record(env).jobsTick({
      t: ev.scheduledTime, ms: Date.now() - t0,
      wx: w.status === 'fulfilled' ? { ok: w.value.ok, fetched: w.value.fetched, fail: w.value.fail } : null,
      places: p.status === 'fulfilled' ? { ok: p.value.ok, why: p.value.why, ai: p.value.ai, aiFail: p.value.aiFail } : null
    }))));
    ctx.waitUntil(
      wx.then(
        (r) => {
          // the log's `cron.wx`: a fetch that failed, and the weather's health once a Tokyo day (00:15; 46 ok fetches a
          // day said nothing a reader used)
          if ((r.fetched && !r.ok) || isWxDaily(ev.scheduledTime)) {
            log([{ e: 'cron.wx', l: r.ok ? 1 : 2, d: { ok: r.ok, fetched: r.fetched, fail: r.fail, hours: r.health.hours, age: r.health.age, fails: r.health.fails, ms: Date.now() - t0 } }]);
          }
          // the wet days into the record (the fields' rain: store.ts wetTick), every tick (the game mode's too)
          return kick('wet', record(env).wetTick(r.wet).then((kept) => void (kept.length && console.log('wet', kept.join(',')))));
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
    const logObj = () => logDo(env);
    const log = sinkOf(env, (p) => ctx.waitUntil(p));
    if (url.pathname === '/health') {
      // the real weather's age (the runbook, the smoke test): never in the way of the health itself; asked of the room
      // at most once a minute per isolate (an anonymous URL: a flood spends Worker requests, not the room's)
      const now = Date.now();
      if (!wxSeen || now - wxSeen.at > WX_HEALTH_MS) {
        const r = await room(env).wxHealth().catch(() => null);
        wxSeen = { at: now, wx: r && (({ cronAt: _c, ...w }) => w)(r), cronAt: r?.cronAt ?? null };
      }
      // (`cronAt`: the :15/:45 cron's last weather tick, ms; health.yml errors when it is over 2 h old)
      const { wx, cronAt } = wxSeen;
      return Response.json({ ok: true, v: LIVE_V, versions: LIVE_VS, sha: env.COMMIT ?? null, t: Date.now(), wx, cronAt }, { headers: { 'Cache-Control': 'no-store' } });
    }
    // (a keyless `health` that answered ok, the health workflow's every 30 min: no row, ~60 a day that said nothing)
    if (url.pathname === '/api') return apiRoute(req, env.ALLOWED_ORIGINS ?? '', () => record(env), (m, ms) => (m.action === 'health' && m.st === 'ok') || log([reqEvent(m, ms)]), { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C });
    if (url.pathname === '/log') {
      return logRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', off: env.LOG_OFF === '1', roleOf: (k) => roleOfKey(k, env), now: Date.now }, logObj);
    }
    if (url.pathname === '/stt') return sttRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', off: env.STT_OFF === '1', roleOf: (k) => roleOfKey(k, env), spend: (r) => logObj().spend(`stt:${r}`, Number(env.STT_DAY_MAX) || 100), ai: env.AI, log, now: Date.now });
    if (url.pathname === '/img') {
      return imgPostRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', roleOf: (k) => roleOfKey(k, env), spend: (r) => logObj().spend(`img:${r}`, Number(env.IMG_DAY_MAX) || IMG_DAY_MAX), put: (r, id, b) => record(env).imgPut(r, id, b), log, now: Date.now });
    }
    if (url.pathname.startsWith('/img/')) return imgGetRoute(req, url.pathname.slice(5), { allowed: env.ALLOWED_ORIGINS ?? '', get: (id) => record(env).imgGet(id) });
    if (url.pathname === '/grade') return gradeRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', off: env.GRADE_OFF === '1', roleOf: (k) => roleOfKey(k, env), spend: (r) => logObj().spend(`grade:${r}`, Number(env.GRADE_DAY_MAX) || 250), ai: env.AI, log, now: Date.now });
    if (url.pathname === '/hiking') return hikeRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', roleOf: (k) => roleOfKey(k, env), spend: (r) => logObj().spend(`hike:${r}`, HIKE_DAY_MAX), fetch: (u, i) => fetch(u, i), log, now: Date.now });
    if (isPushPath(url.pathname)) return pushRoute(req, url.pathname, { allowed: env.ALLOWED_ORIGINS ?? '', roleOf: (k) => roleOfKey(k, env), op: (op, who, b) => record(env).pushOp(op, who, b) });
    if (url.pathname === '/places' || url.pathname === '/places/pics' || url.pathname === '/places/status' || url.pathname === '/places/sync') {
      const store = record(env);
      return placesRoute(req, url.pathname, {
        allowed: env.ALLOWED_ORIGINS ?? '', roleOf: (k) => roleOfKey(k, env), read: (s) => store.placesRead(s), status: () => store.placesStatus(),
        pics: (id) => store.placesPics(id)
      });
    }
    if (url.pathname === '/jobs') return jobsRoute(req, { allowed: env.ALLOWED_ORIGINS ?? '', roleOf: (k) => roleOfKey(k, env), read: () => record(env).jobsRead() });
    if (url.pathname === '/share') return shareRoute(req, env.ALLOWED_ORIGINS ?? '', (i) => record(env).shareRead(i));
    // (with the saved places' list's age, hours: places-pull.yml is its only reader, its-bot's dispatch its only trigger
    // that runs; -1 never pulled)
    // (and the nightly jobs' ages, hours: nightlyH the oldest, -1 one never done; storeObject.ts nightlyStatus)
    if (url.pathname === '/health/log') return logHealthRoute(req, env.HEALTH_TOKEN, logObj, async () => {
      const store = record(env);
      const [s, n] = await Promise.all([store.placesStatus(), store.nightlyStatus()]);
      return { placesH: s.syncedAt ? Math.floor((Date.now() - s.syncedAt) / 3_600_000) : -1, ...n };
    });
    if (url.pathname === '/admin') return adminRoute(req, () => record(env), { KEY_A: env.KEY_A, KEY_B: env.KEY_B, PLACES_KEY: env.PLACES_KEY }, Date.now, (why) => refusal('admin.refused', why, log));
    if (url.pathname !== '/room') return new Response('not found', { status: 404 });
    if (!originAllowed(req.headers.get('Origin'), env.ALLOWED_ORIGINS ?? '')) return refusal('room.refused', 'origin', log, new Response('forbidden', { status: 403 }));
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return refusal('room.refused', 'upgrade', log, new Response('expected a WebSocket', { status: 426 }));
    const adm = await admission(req, env, Date.now());
    if (!adm) return refusal('room.refused', 'ticket', log, new Response('forbidden', { status: 403 }));
    return room(env).fetch(adm);
  }
} satisfies ExportedHandler<Env>;

/** The cron tick that says the weather's health (00:15 Tokyo, 15:15 UTC). */
const isWxDaily = (t: number): boolean => Math.floor((t % 86_400_000) / 60_000) === 15 * 60 + 15;

/** `/health`'s weather as the room last said it (per isolate), and how long that holds. */
let wxSeen: { at: number; wx: WxHealth | null; cronAt: number | null } | null = null;
const WX_HEALTH_MS = 60_000;
/** The cron's heartbeat (`cronAt`) put this often at most when its tick fetched nothing. */
const CRON_BEAT_MS = 3_600_000;

/** The refusals the Worker answers itself, counted per isolate (event and why): the first said at once, the rest at
 *  most once a minute (the count since the last line), so a flood costs the log one row a minute, not one each. */
const refused = new Map<string, { n: number; at: number }>();
const REFUSED_MS = 60_000;
function refusal<T>(e: 'room.refused' | 'admin.refused', why: string, log: (evs: RelayEvent[]) => void, res?: T): T {
  const k = `${e}|${why}`, now = Date.now(), c = refused.get(k) ?? { n: 0, at: 0 };
  c.n++;
  if (now - c.at >= REFUSED_MS) {
    log([{ e, l: 2, d: { why, n: c.n } }]);
    c.n = 0;
    c.at = now;
  }
  refused.set(k, c);
  return res as T;
}
/** Tests: forget the counts. */
export const resetRefused = (): void => refused.clear();

/** An `/api` request as the log's `req` (reqMeta.ts): warn when refused, error when the record failed. */
function reqEvent(m: ReqMeta, ms: number): RelayEvent {
  const { role, rid, sid, ...d } = m;
  const l = m.st === 'unavailable' ? 3 : m.st === 'ok' && !m.rej ? 1 : 2;
  return { e: 'req', l, role, rid, sid, d: { ...d, ms } };
}

/** A message's `kind` (cheaply: the room parses it again), '' when it has none. */
function kindOf(raw: string): string {
  try {
    const k = (JSON.parse(raw) as { kind?: unknown } | null)?.kind;
    return typeof k === 'string' ? k : '';
  } catch {
    return '';
  }
}
