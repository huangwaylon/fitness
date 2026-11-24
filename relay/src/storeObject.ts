// The record's Durable Object (docs/backend.md#the-record): one instance (`idFromName('record')`), SQLite-backed, apart
// from the island room (which holds the sockets and the day's shared world), so the record's code and the room's change
// independently. The Worker hands it the bodies of `/api` and `/admin` (storeRoute.ts) as they came: the parsing and
// the JSON happen here, on the object's CPU budget. After a write it tells the room, which passes `changed` to the
// open phones.
import { DurableObject } from 'cloudflare:workers';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { StoreCore, type Sql } from './store.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';
import type { StoreRoom } from './storeRoute.ts';
import type { Env } from './index.ts';
import { apiWithMeta, countingSql, type ReqMeta } from './reqMeta.ts';
import { roleOfKey } from './auth.ts';
import { logDo, room, sinkOf } from './objects.ts';
import { isToken } from '../../app/src/lib/contract/log.ts';
import { errName } from './log.ts';
import type { ShareReadIn } from './share.ts';
import type { ShareReadReply } from '../../app/src/lib/contract/share.ts';
import { after, backoff, BOTS as BOT_NAMES, due, nextSlotAt, NO_STATE, runArchive, runBots, slotOf, type ArchiveRun, type ArchiveState } from './archive.ts';
import { Pusher, PUSH_HOSTS, type PushAnswer, type PushDeps } from './pusher.ts';
import type { PushOp } from './pushRoute.ts';
import { vapidOf } from '../../its/worker/src/push.ts';
import { dropToken, ghAuth, type TokenStore } from '../../its/worker/src/ghApp.ts';
import { cronLog, ingestOp, placesLog, placesTick, type ListGot, type TickOut } from './places.ts';
import type { PlacesStatus } from '../../app/src/lib/contract/places.ts';

/** A call, and once more if it fails (a reset between two objects: the room's `changed`); the second's error if both do. */
export async function twice<T>(f: () => Promise<T>): Promise<T> {
  try {
    return await f();
  } catch {
    return f();
  }
}

/** The backups' state (archive.ts): one key of the object's storage, never the record's tables. */
const ARCHIVE = 'archive';
/** The GitHub App's installation token for the backup (its/worker/src/ghApp.ts TokenStore): a key beside it. */
const GH_TOKEN = 'gh_token';
/** An alarm this far past its time is lost, not late (armCheck: an alarm runs within seconds). */
const ALARM_LATE_MS = 5 * 60_000;
/** The record's rows outside a request are told the log (meter) once this many are read, any written, or this long
 *  after the last time: a gauge (an instance gone first loses its few). */
const METER_ROWS = 1_000, METER_MS = 10 * 60_000;
/** The signed ops that only read (no audit row when they succeed). */
const READ_OPS = new Set(['logs', 'logstats', 'counts', 'held', 'wallet', 'imgdump']);

export class IslandStore extends DurableObject<Env> implements StoreRoom {
  private core: StoreCore;
  /** The rows each request wrote and read (reqMeta.ts countingSql): the log's `req` `rw`, `rr`. */
  private rows: () => { rw: number; rr: number };
  /** The rows the record wrote and read outside a request (the cron's, the alarm's, the admin's, the places' and
   *  share's routes) not told the log yet (meter). */
  private bg = { rw: 0, rr: 0, at: 0 };
  /** やること's reminders and the phones' subscriptions (pusher.ts). */
  private pusher: Pusher;
  /** The push services' hosts and the fetch that calls them: tests inject a fake push service here (never an env flag). */
  pushDeps: PushDeps = { hosts: PUSH_HOSTS, fetch: (req) => fetch(req) };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const counted = countingSql(ctx.storage.sql as unknown as Sql);
    this.rows = counted.take;
    this.core = new StoreCore({
      sql: counted.sql,
      tx: (fn) => ctx.storage.transactionSync(fn),
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C, PLACES_KEY: env.PLACES_KEY },
      build: env.COMMIT,
      now: () => Date.now(),
      notify: (n, guest) => this.tellRoom(n, guest),
      // a stored row that isn't JSON, skipped by a fold: a warning in the log (store.ts rowRec)
      corrupt: (where) => this.log([{ e: 'store.corrupt', l: 2, d: { where } }]),
      // the stored ledger's (store.ts ledgerReady, ledgerCheck): a seed is news (info), a drift the admin's to settle (warn)
      log: (e, d) => this.log([{ e, l: e === 'ledger.drift' ? 2 : 1, d }]),
      // a kept `todo` row may move the next reminder: the alarm again (after the write's transaction)
      onTodo: () => this.ctx.waitUntil(this.arm())
    });
    this.pusher = new Pusher({
      sql: ctx.storage.sql as unknown as Sql,
      now: () => Date.now(),
      vapid: vapidOf(env.VAPID_PUBLIC, env.VAPID_PRIVATE),
      deps: () => this.pushDeps,
      todos: () => this.core.todoLists(),
      log: (l, d) => this.log([{ e: 'todo.push', l, d }])
    });
  }

  /** The record's own events to the log (objects.ts sinkOf: best effort, off the reply's path). */
  private readonly log = sinkOf(this.env, (p) => this.ctx.waitUntil(p));

  /** The rows since the last look that no request carries, told the log's daily counts (log.ts meter: /health/log's
   *  rowsPct, rowsReadPct) past METER_ROWS read, any written, METER_MS on, or `now`. Returns `v`. */
  private meter<T>(v: T, now = false): T {
    const t = this.rows(), b = this.bg;
    b.rw += t.rw;
    b.rr += t.rr;
    if ((b.rw || b.rr) && (now || b.rw > 0 || b.rr >= METER_ROWS || Date.now() - b.at >= METER_MS) && this.env.LOG_OFF !== '1') {
      const m = { rw: b.rw, rr: b.rr };
      this.bg = { rw: 0, rr: 0, at: Date.now() };
      this.ctx.waitUntil(Promise.resolve().then(() => logDo(this.env).meter(m)).catch((e) => console.warn('meter', errName(e))));
    }
    return v;
  }

  /** The record changed: the room passes `changed` to the open phones (after the commit, off the reply's path; once
   *  more, on a fresh stub, if the first call fails: a phone's push is otherwise only caught up by its next poll). */
  private tellRoom(n: Notice, guest?: boolean): void {
    this.ctx.waitUntil(twice(() => Promise.resolve(room(this.env).notify(n, guest))).then(() => undefined, (e) => console.warn('notify the room', errName(e))));
  }

  /** RPC from the room's alarm after a restore (index.ts restoring): this is the restored record's first session, so
   *  a new epoch (every phone drops its cache and refetches; bumpRev tells the open ones). */
  restored(): { ok: true; rev: string } {
    this.ctx.waitUntil(this.arm());
    return this.meter({ ok: true as const, rev: this.core.bumpRev() });
  }

  /** RPC from the Worker's cron at each weather tick (index.ts): the wet days into the record (store.ts wetTick). */
  wetTick(real: string[]): string[] {
    return this.meter(this.core.wetTick(real));
  }

  /** RPC from the Worker's cron (index.ts): the nightly jobs not done today (nightly.ts; at 03:00 Tokyo, then from
   *  04:15 each tick's catch-up, `late`): the stored ledgers' check (store.ts ledgerCheck: a drift logged
   *  `ledger.drift`, never fixed), the ended 共有リンク's sweep (share.ts sweep), the island days before yesterday
   *  (store.ts islandPrune, the plants' waterings kept first), the shop's old rows and day tallies (ledgerPrune), the
   *  removals past their keep (tombPrune), each prune PRUNE_BATCH rows a run. A job that threw: `do.error`; the day's
   *  counts once, `cron.nightly`, when the last one finishes. */
  async nightly(late = false): Promise<{ ok: true; ran: string[]; failed: string[]; left: string[] }> {
    // (the prunes only once this slot's backup is up: every row they delete is in a dump; till then they're left,
    // and nightlyH shows it)
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    const r = this.core.nightly(late, s.ok === slotOf(Date.now()), {
      fail: (job, e) => {
        console.warn(`${job}-fail`, errName(e));
        this.log([{ e: 'do.error', l: 3, d: { where: job, name: errName(e) } }]);
      },
      done: (d) => this.log([{ e: 'cron.nightly', l: 1, d }])
    });
    return this.meter({ ok: true as const, ...r });
  }

  /** RPC from `/health/log` (index.ts): hours since each nightly job last finished, `nightlyH` the oldest. */
  nightlyStatus(): ReturnType<StoreCore['nightlyStatus']> {
    return this.meter(this.core.nightlyStatus());
  }

  /** RPC from each :15/:45 tick (index.ts): the alarm again if it is missing or past due (a lost やること reminder's
   *  back within 30 minutes). Only the alarm's time is read; arm() only then. */
  async armCheck(): Promise<{ armed: boolean }> {
    const at = await this.ctx.storage.getAlarm();
    if (at !== null && at > Date.now() - ALARM_LATE_MS) return this.meter({ armed: false }, true);
    await this.arm();
    return this.meter({ armed: true }, true);
  }

  /** RPC from the Worker's cron at 03:00 Tokyo (index.ts): the backup is due, so the alarm runs it (on the object's
   *  CPU budget, not the cron's); a failure's retry is the alarm's own. */
  async archiveKick(): Promise<{ due: string }> {
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    const d = due(s, Date.now());
    await this.arm();
    return { due: d };
  }

  /** The one alarm, two duties: the backup (archive.ts: due now, or a failure's retry) and やること's next reminder
   *  (pusher.ts next); set to the earlier, or to the next backup slot's start when neither wants it sooner (so a
   *  missing alarm is always a lost one: armCheck). Each write that moves either calls it. */
  private async arm(): Promise<void> {
    const now = Date.now(), auto = this.auto;
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    const d = auto ? due(s, now) : 'done';
    const backup = d === 'run' ? now : d === 'wait' ? s.lastAt + backoff(s.fails) : null;
    let remind: number | null = null;
    try {
      remind = this.pusher.next(now);
    } catch (e) {
      console.warn('remind next', errName(e));
    }
    const t = Math.min(backup ?? Infinity, remind ?? Infinity, auto ? nextSlotAt(now) : Infinity);
    const at = await this.ctx.storage.getAlarm();
    if (t === Infinity) {
      if (at !== null) await this.ctx.storage.deleteAlarm();
    } else if (at !== t) await this.ctx.storage.setAlarm(t);
  }

  /** The daily backup on its own (ARCHIVE_AUTO not "0"): else only the admin `backup` runs one (the test copy). */
  private get auto(): boolean {
    return this.env.ARCHIVE_AUTO?.trim() !== '0';
  }

  /** The reminders due first (a minute matters to them, pusher.ts tick: never throws), then the backup if it is due
   *  (after 03:00 with today's not up: the cron's kick, a failure's retry, or a reminder's alarm finding it missed),
   *  then the alarm again. */
  async alarm(): Promise<void> {
    await this.pusher.tick(Date.now());
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    if (this.auto && due(s, Date.now()) === 'run') await this.archive(s);
    await this.arm();
    this.meter(null);
  }

  /** RPC from the push routes (pushRoute.ts): the state, a subscription kept or forgotten, a test (pusher.ts). A
   *  subscription may wake a reminder pending for its person: the alarm again. */
  async pushOp(op: PushOp, who: Who, b: Record<string, unknown>): Promise<PushAnswer> {
    const p = this.pusher;
    const r = op === 'subscribe' ? await p.subscribe(who, b) : op === 'unsubscribe' ? await p.unsubscribe(who, b.endpoint) : op === 'test' ? await p.test(who, b.endpoint) : await p.state(who, b.endpoint);
    if (op === 'subscribe' || op === 'unsubscribe') await this.arm();
    return this.meter(r);
  }

  /** The backup now (the alarm's, or the admin `backup`'s with `force`), one at a time; logged; never throws. */
  private archiving: Promise<ArchiveRun> | null = null;
  private archive(s: ArchiveState, force = false): Promise<ArchiveRun> {
    return (this.archiving ??= this.archiveRun(s, force).finally(() => (this.archiving = null)));
  }

  private async archiveRun(s: ArchiveState, force: boolean): Promise<ArchiveRun> {
    // the pictures no custom food names any more, swept first (img.ts imgGc: its counts on the backup's line)
    let gc = {};
    try {
      gc = this.core.imgGc();
    } catch (e) {
      console.warn('imggc', errName(e));
    }
    this.meter(null);
    // (GitHub: the App's installation token narrowed to the archive repo's contents, else ARCHIVE_TOKEN, the PAT)
    const repo = this.env.ARCHIVE_REPO ?? '', storage = this.ctx.storage;
    const app = { appId: this.env.GH_APP_ID, installationId: this.env.GH_APP_INSTALLATION_ID, key: this.env.GH_APP_KEY_RELAY, pat: this.env.ARCHIVE_TOKEN?.trim() };
    const narrow = { repositories: [repo.split('/').pop() ?? ''], permissions: { contents: 'write' as const } };
    const store: TokenStore = { get: () => storage.get(GH_TOKEN), put: (v) => storage.put(GH_TOKEN, v) };
    const auth = await ghAuth(app, narrow, { now: Date.now(), store });
    const gh = { fetch: (u: string, i: RequestInit) => fetch(u, i), token: auth?.token, repo, tag: this.env.ARCHIVE_RELEASE ?? '' };
    const recipient = this.env.ARCHIVE_RECIPIENT?.trim();
    const r = await runArchive({
      dump: () => {
        const c = this.core.counts();
        return { metrics: c.metrics, events: c.events, pieces: this.core.dumpText() };
      },
      gh, recipient, now: Date.now
    });
    // the App's token refused (the App suspended, its permissions changed): dropped, so the retry mints another
    if (!r.ok && r.http === 401 && auth?.by === 'app') await dropToken(app, narrow, store);
    // the record's rows the run wrote (0: it only reads) and read
    const { rw, rr } = this.rows();
    const next = after(s, r, Date.now());
    await this.ctx.storage.put(ARCHIVE, next);
    await this.arm();
    // then the bots' state (archive.ts runBots), the record's dump already up and its state kept: their outcome only
    // fields of the same line, never its `ok`
    const bots = await runBots({ bots: this.botReads(), gh, recipient, slot: r.slot, now: Date.now });
    const botsBad = BOT_NAMES.some((b) => bots[b] !== 'ok' && bots[b] !== 'none');
    const { slot: _slot, ...d } = r;
    this.log([{ e: 'cron.backup', l: r.ok ? (botsBad ? 2 : 1) : r.st === 'no_token' ? 2 : 3, d: { ...d, rw, rr, fails: next.fails, ...gc, ...bots, ...(auth ? { by: auth.by } : {}), ...(force ? { force } : {}) } }]);
    return r;
  }

  /** The bots' reads through their service bindings (wrangler.toml ITS_BOT, GYM_BOT): its-bot's status with a member's
   *  key (the relay's KEY_A, the one its-bot holds), gym-bot's state with GYM_TOKEN. A missing binding or credential:
   *  that bot is `none`. */
  private botReads(): Partial<Record<'its' | 'gym', (signal: AbortSignal) => Promise<Response>>> {
    const { ITS_BOT, GYM_BOT, KEY_A, GYM_TOKEN } = this.env;
    const get = (svc: Fetcher, url: string, token: string) => (signal: AbortSignal) => svc.fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal });
    return {
      ...(ITS_BOT && KEY_A?.trim() ? { its: get(ITS_BOT, 'https://its-bot/its/status', KEY_A.trim()) } : {}),
      ...(GYM_BOT && GYM_TOKEN?.trim() ? { gym: get(GYM_BOT, 'https://gym-bot/gym/state', GYM_TOKEN.trim()) } : {})
    };
  }

  /** RPC from `POST /share` (share.ts shareRoute: the gate passed): the visitor's read, logged (`share`: the kind and
   *  why it was or wasn't a visit; never the token, the IP or a hash). */
  async shareRead(i: ShareReadIn): Promise<{ status: number; reply: ShareReadReply }> {
    const t0 = Date.now();
    const r = await this.core.share.read(i);
    this.log([{ e: 'share', l: r.why === 'busy' ? 2 : 1, d: { op: 'read', kind: r.kind ?? 'other', ok: r.reply.ok, why: r.why, ms: Date.now() - t0 } }]);
    return this.meter({ status: r.status, reply: r.reply });
  }

  /** The places tick under way (one at a time: a slow one never overlaps the next). */
  private placesBusy: Promise<TickOut> | null = null;

  /** RPC from the Worker's cron (index.ts): 行きたい場所's categories (places.ts placesTick); with `got`, places-pull.yml's
   *  answer first (admin places_ingest: the newest, or `full` the whole), logged `cron.places` (placesLog). One at a
   *  time: an answer waits for the tick under way, then is read; the cron's gets that tick's outcome. */
  async placesTick(full = false, got?: ListGot): Promise<TickOut> {
    while (this.placesBusy) {
      if (!got) return this.placesBusy;
      await this.placesBusy.catch(() => {});
    }
    this.placesBusy = placesTick({ core: this.core.places, ai: this.env.AI, now: Date.now }, full, got)
      .then((r) => {
        // (an answer's outcome each time; the cron's only when its state changes: places.ts cronLog)
        let ev = got ? placesLog(r) : null;
        if (!got) {
          const c = cronLog(r, this.core.places.state().syncedAt, Date.now(), this.core.places.warned());
          if (c.ev) this.core.places.setWarned(c.st);
          ev = c.ev;
        }
        if (ev) this.log([ev]);
        return this.meter(r);
      })
      .finally(() => {
        this.placesBusy = null;
      });
    return this.placesBusy;
  }

  /** RPC from `GET /places` (places.ts placesRoute). */
  placesRead(since: number | null): { ver: number; body: string } {
    return this.meter(this.core.places.read(since));
  }

  /** RPC from `GET /places/pics`. */
  placesPics(id: string): string[] {
    return this.meter(this.core.places.pics(id));
  }

  /** RPC from `GET /places/status`. */
  placesStatus(): PlacesStatus {
    return this.meter(this.core.places.status());
  }

  /** RPC from `POST /img` (img.ts imgPostRoute): a picture kept, or why not. */
  imgPut(who: Who, id: string, b: Uint8Array): ReturnType<StoreCore['imgPut']> {
    return this.meter(this.core.imgPut(who, id, b));
  }

  /** RPC from `GET /img/<id>`: its type and bytes, or null. */
  imgGet(id: string): ReturnType<StoreCore['imgGet']> {
    return this.meter(this.core.imgGet(id));
  }

  /** The same, with the request's meta for the log's `req` (reqMeta.ts; the Worker times it and sends it). */
  apiMeta(text: string): { body: string; meta: ReqMeta } {
    const keys = { KEY_A: this.env.KEY_A, KEY_B: this.env.KEY_B, KEY_C: this.env.KEY_C };
    this.meter(null);
    return apiWithMeta(this.core, text, (k) => roleOfKey(k, keys), this.rows);
  }

  /** A signed `/admin` body (storeRoute.ts): `{op, ...}` → its status and JSON reply. */
  async adminSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> {
    const v = await this.core.signedOp(text, t, sig);
    if ('status' in v) return v;
    // each signed op that changes or exports something in the log (an audit: its name and outcome); a read (the log's
    // own, the counts, a check without `fix`) only when it fails: reading the log wrote to it (~40 rows a day)
    const read = READ_OPS.has(String(v.op.op)) || (/check$/.test(String(v.op.op)) && v.op.fix !== true);
    const audit = (st: string) => (read && st === 'ok') || this.log([{ e: 'admin', l: st === 'ok' ? 1 : 2, d: { op: isToken(v.op.op) ? v.op.op : 'other', st, ...(v.by === 'places' ? { by: 'places' } : {}) } }]);
    try {
      const r = await this.admin(v.op);
      audit(r.ok === true ? 'ok' : String(r.error ?? 'refused'));
      return this.meter({ status: 200, body: JSON.stringify(r) });
    } catch (e) {
      audit('unavailable');
      return this.meter({ status: 200, body: JSON.stringify({ ok: false, error: 'unavailable', detail: String(e) }) });
    }
  }

  /**
   * - `counts`: rows per table, the revision and the newest `at`;
   * - `bookmark {ms?}`: point-in-time recovery's bookmark now and `ms` ago (default 1 h);
   * - `restore {bookmark}`: restore the record to that bookmark (the object restarts; every phone refetches: a new epoch);
   * - `rev`: start a new epoch (every phone drops its cache and fetches everything);
   * - `decorcheck {fix?}`: the decor caps' kept counts against the rows' (store.ts decorCheck);
   * - `shopcheck {fix?}`: the running field against the fold of the farm rows (store.ts shopCheck);
   * - `adjust {id, who, v, note}`: a correction of `who`'s かいがら (`v`, either sign: a `shop_adjust` row, store.ts
   *   adjust); `walletset {id, who, h, note}`: their stored かいがら made `h`, logged (store.ts walletSet);
   * - `inbody {id, who, date, muscle_kg, smm_kg}`: a member's InBody sheet, their estimates' calibration (store.ts inbody);
   * - `wallet`: each person's stored かいがら, the fold beside it;
   * - `ledger {log?, limit?}`: the stored ledgers, part by part (`log: who`: the ops applied, newest first); `ledgercheck`:
   *   each against the fold of the rows (while kept) and its log's chain (store.ts ledgerCheck); `ledger_retire
   *   {confirm: 'retire-ledger-rows', dry?}`: the shop's rows and the old day tallies deleted (store.ts ledgerRetire);
   * - `held {person?}`: the values an ingest held back (a past day's 0 over a value above it: never served);
   *   `promote {person, date, metric, value?}`: one made a row of the day's history (its latest now);
   * - `dump {limit?, after?, all?}`: the rows a page at a time (the backup, docs/ops/runbook.md#9-the-record; `all`: at once)
   *   (`next`: the `after` of the next page; the audit on the first);
   * - `load {rows: {metrics?, events?, uploads?}}`: rows that already have their `at` (a dump's) into the record, by
   *   its rules (idempotent: what it has is skipped);
   * - `logs {since?, until?, after?, before?, desc?, lvl?, ev?, role?, sid?, rid?, src?, build?, limit?}`: the log's
   *   events (log.ts query; relay/scripts/logs.ts); `logstats`: its health; `logpurge {before?, role?}`: deletes;
   * - `imgdump {after?}`: the custom foods' pictures a page at a time; `imgload {img}`: a dump's into the record;
   *   `img-set {who, custom, data, ig?, dry?}`: a picture set on a custom food as `who` would (anyone's since 2026-11-20; store.ts imgSet);
   *   `imggc`: the 03:00 sweep now;
   * - `backup`: the daily backup now (archive.ts), whether or not today's is up (it replaces it); its outcome;
   * - `wx {refresh?, s?, fx?}`: the room's real weather (index.ts wxAdmin): fetch it now, put a fixture timeline in, or
   *   say how it is.
   */
  private async admin(o: Record<string, unknown>): Promise<Record<string, unknown>> {
    const storage = this.ctx.storage;
    switch (o.op) {
      // the real weather, the room's (index.ts wxAdmin): a fetch now, a fixture timeline, or how it is
      case 'wx':
        return room(this.env).wxAdmin(o);
      case 'backup': {
        const r = await this.archive((await storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE, true);
        return { ...r, ok: r.ok, state: await storage.get<ArchiveState>(ARCHIVE) };
      }
      case 'counts':
        return { ok: true, counts: this.core.counts(), rev: this.core.rev(), newest: this.core.newestAt(), schema_v: this.core.schemaV() };
      case 'bookmark': {
        const ms = typeof o.ms === 'number' ? o.ms : 3600_000;
        return { ok: true, now: await storage.getCurrentBookmark(), ago: await storage.getBookmarkForTime(Date.now() - ms) };
      }
      case 'restore': {
        if (typeof o.bookmark !== 'string') return { ok: false, error: 'bad_request' };
        // from here every request is `unavailable` (retried), never acknowledged: a write kept between this and the
        // restart would be acked and then dropped by the bookmark (relay review O4)
        this.core.freeze();
        try {
          await storage.onNextSessionRestoreBookmark(o.bookmark);
        } catch (e) {
          this.core.thaw();
          throw e;
        }
        // the room calls `restored` a few seconds after the restart (a new epoch: every phone refetches); its own
        // storage, since this object's is about to be the bookmark's
        const told = await room(this.env).restoring().then(() => true, (e) => (console.warn('restoring', errName(e)), false));
        setTimeout(() => this.ctx.abort('restoring a bookmark'), 200); // after the reply
        return { ok: true, restoring: o.bookmark, note: told ? 'a new epoch follows by itself in a few seconds (counts shows the rev)' : 'the room was not told: after it restarts, run {op:"rev"} so the phones refetch' };
      }
      case 'rev':
        return { ok: true, rev: this.core.bumpRev() };
      // 行きたい場所's categories now (the cron's tick; the test copy has no cron): its outcome and the status
      case 'places': {
        const r = await this.placesTick();
        return { ok: true, tick: r, status: this.core.places.status() };
      }
      // places-pull.yml's fetch of the list (record.ts places-pull: Google refuses the relay's), and the status
      case 'places_ingest':
        return { ...(await ingestOp(o, (full, got) => this.placesTick(full, got))), status: this.core.places.status() };
      case 'places_status':
        return { ...this.core.places.status() };
      // places-details.yml's ids (record.ts places-ids): the live places with a Google page, ids and coordinates only
      case 'places_ids':
        return { ok: true, ids: this.core.places.ids() };
      // the daily scrape's details (record.ts places-details; the seed's): counts answered
      case 'places_details':
        return this.core.places.setDetails(o);
      // the values an ingest held back (a past day's 0: store.ts metrics_held), and one made a row of the history
      case 'held':
        return { ok: true, rows: this.core.heldRows(typeof o.person === 'string' ? o.person : undefined) };
      case 'promote':
        return this.core.promoteHeld(o);
      // the running field against the fold of the farm rows (`fix`: the fold's taken)
      case 'shopcheck':
        return this.core.shopCheck(o);
      // a correction of someone's かいがら (store.ts adjust; undone by another of −v)
      case 'adjust':
        return this.core.adjust(o);
      // an InBody sheet (store.ts inbody)
      case 'inbody':
        return this.core.inbody(o);
      // the かいがら as the stored ledgers keep them, the fold beside them (store.ts), and one set (walletset)
      case 'wallet':
        return this.core.wallets();
      // the island days before yesterday deleted, the plants' waterings kept first (`dry`: those only; store.ts islandPrune)
      case 'island_prune':
        return { ok: true, ...this.core.islandPrune(o.dry === true) };
      // the removals past their keep deleted (`dry`: counted, their ids; store.ts tombPrune)
      case 'tomb_prune':
        return { ok: true, ...this.core.tombPrune(o.dry === true) };
      case 'walletset':
        return this.core.walletSet(o);
      // the stored ledgers (ledger.ts): read (`log: who`, its ops), and the daily check by hand
      case 'ledger':
        return this.core.ledgerRead(o);
      case 'ledgercheck':
        return this.core.ledgerCheck();
      // the shop's history let go, the stored ledger the record's alone (store.ts ledgerRetire: its confirm; `dry`)
      case 'ledger_retire':
        return this.core.ledgerRetire(o);
      // the decor caps' kept counts against the rows' (`fix`: the rows' taken)
      case 'decorcheck':
        return this.core.decorCheck(o);
      case 'load': {
        const r = this.core.load(o);
        await this.arm();
        return r;
      }
      case 'dump':
        return { rev: this.core.rev(), ...this.core.dumpPage(o) };
      // the custom foods' pictures (img.ts)
      case 'imgdump':
        return this.core.imgDump(o);
      case 'imgload':
        return this.core.imgLoad(o);
      case 'img-set':
        return this.core.imgSet(o);
      case 'imggc':
        return { ok: true, ...this.core.imgGc() };
      // the log (docs/ops/observability.md): its own object's
      case 'logs':
        return { ok: true, ...(await logDo(this.env).query(o)) };
      case 'logstats':
        return { ...(await logDo(this.env).stats()) };
      case 'logpurge':
        return { ...(await logDo(this.env).purge(o)) };
      default:
        return { ok: false, error: 'bad_request' };
    }
  }
}
