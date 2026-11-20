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
import { after, backoff, BOTS as BOT_NAMES, due, NO_STATE, runArchive, runBots, type ArchiveRun, type ArchiveState } from './archive.ts';
import { Pusher, PUSH_HOSTS, type PushAnswer, type PushDeps } from './pusher.ts';
import type { PushOp } from './pushRoute.ts';
import { vapidOf } from '../../its/worker/src/push.ts';

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
/** The signed ops that only read (no audit row when they succeed). */
const READ_OPS = new Set(['logs', 'logstats', 'counts', 'held', 'wallet', 'imgdump']);

export class IslandStore extends DurableObject<Env> implements StoreRoom {
  private core: StoreCore;
  /** The rows each request wrote and read (reqMeta.ts countingSql): the log's `req` `rw`, `rr`. */
  private rows: () => { rw: number; rr: number };
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
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
      build: env.COMMIT,
      now: () => Date.now(),
      notify: (n, guest) => this.tellRoom(n, guest),
      // a stored row that isn't JSON, skipped by a fold: a warning in the log (store.ts rowRec)
      corrupt: (where) => this.log([{ e: 'store.corrupt', l: 2, d: { where } }]),
      // the wallet's (store.ts shopState, walletCheck): a seed is news (info), a drift the admin's to settle (warn)
      log: (e, d) => this.log([{ e, l: e === 'wallet.drift' ? 2 : 1, d }]),
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

  /** The record changed: the room passes `changed` to the open phones (after the commit, off the reply's path; once
   *  more, on a fresh stub, if the first call fails: a phone's push is otherwise only caught up by its next poll). */
  private tellRoom(n: Notice, guest?: boolean): void {
    this.ctx.waitUntil(twice(() => Promise.resolve(room(this.env).notify(n, guest))).then(() => undefined, (e) => console.warn('notify the room', errName(e))));
  }

  /** RPC from the room's alarm after a restore (index.ts restoring): this is the restored record's first session, so
   *  a new epoch (every phone drops its cache and refetches; bumpRev tells the open ones). */
  restored(): { ok: true; rev: string } {
    this.ctx.waitUntil(this.arm());
    return { ok: true, rev: this.core.bumpRev() };
  }

  /** RPC from the Worker's cron at each weather tick (index.ts): the wet days into the record (store.ts wetTick). */
  wetTick(real: string[]): string[] {
    return this.core.wetTick(real);
  }

  /** RPC from the Worker's cron, once a day (index.ts): the record's compaction (store.ts compact), logged. */
  compactTick(): { ok: true; dates: number; deleted: number; more: boolean; metrics: number } {
    const t0 = Date.now();
    const r = this.core.compact();
    this.log([{ e: 'cron.compact', l: 1, d: { dates: r.dates, deleted: r.deleted, more: r.more, metrics: r.metrics, ms: Date.now() - t0 } }]);
    return { ok: true, ...r };
  }

  /** RPC from the Worker's cron at 03:00 Tokyo (index.ts): the daily walletcheck (store.ts walletCheck: each drift
   *  logged `wallet.drift`, never fixed). */
  walletTick(): { ok: true; drift: number } {
    return { ok: true, drift: this.core.walletCheck().drift.length };
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
   *  (pusher.ts next); set to the earlier, or cleared when neither wants it. Each write that moves either calls it. */
  private async arm(): Promise<void> {
    const now = Date.now();
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    const d = due(s, now);
    const backup = d === 'run' ? now : d === 'wait' ? s.lastAt + backoff(s.fails) : null;
    let remind: number | null = null;
    try {
      remind = this.pusher.next(now);
    } catch (e) {
      console.warn('remind next', errName(e));
    }
    const t = backup === null ? remind : remind === null ? backup : Math.min(backup, remind);
    const at = await this.ctx.storage.getAlarm();
    if (t === null) {
      if (at !== null) await this.ctx.storage.deleteAlarm();
    } else if (at !== t) await this.ctx.storage.setAlarm(t);
  }

  /** The reminders due first (a minute matters to them, pusher.ts tick: never throws), then the backup if it is due
   *  (after 03:00 with today's not up: the cron's kick, a failure's retry, or a reminder's alarm finding it missed),
   *  then the alarm again. */
  async alarm(): Promise<void> {
    await this.pusher.tick(Date.now());
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    if (due(s, Date.now()) === 'run') await this.archive(s);
    await this.arm();
  }

  /** RPC from the push routes (pushRoute.ts): the state, a subscription kept or forgotten, a test (pusher.ts). A
   *  subscription may wake a reminder pending for its person: the alarm again. */
  async pushOp(op: PushOp, who: Who, b: Record<string, unknown>): Promise<PushAnswer> {
    const p = this.pusher;
    const r = op === 'subscribe' ? await p.subscribe(who, b) : op === 'unsubscribe' ? await p.unsubscribe(who, b.endpoint) : op === 'test' ? await p.test(who, b.endpoint) : await p.state(who, b.endpoint);
    if (op === 'subscribe' || op === 'unsubscribe') await this.arm();
    return r;
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
    this.rows();
    const gh = { fetch: (u: string, i: RequestInit) => fetch(u, i), token: this.env.ARCHIVE_TOKEN?.trim(), repo: this.env.ARCHIVE_REPO ?? '', tag: this.env.ARCHIVE_RELEASE ?? '' };
    const recipient = this.env.ARCHIVE_RECIPIENT?.trim();
    const r = await runArchive({
      dump: () => {
        const c = this.core.counts();
        return { metrics: c.metrics, events: c.events, pieces: this.core.dumpText() };
      },
      gh, recipient, now: Date.now
    });
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
    this.log([{ e: 'cron.backup', l: r.ok ? (botsBad ? 2 : 1) : r.st === 'no_token' ? 2 : 3, d: { ...d, rw, rr, fails: next.fails, ...gc, ...bots, ...(force ? { force } : {}) } }]);
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
    return { status: r.status, reply: r.reply };
  }

  /** RPC from the Worker's cron at 03:00 Tokyo (index.ts): ended links deleted 90 days on (share.ts sweep), logged
   *  when there were some. */
  shareTick(): { ok: true; n: number } {
    const t0 = Date.now();
    const { n } = this.core.share.sweep();
    if (n) this.log([{ e: 'share', l: 1, d: { op: 'sweep', kind: 'other', ok: true, n, ms: Date.now() - t0 } }]);
    return { ok: true, n };
  }

  /** RPC from `POST /img` (img.ts imgPostRoute): a picture kept, or why not. */
  imgPut(who: Who, id: string, b: Uint8Array): ReturnType<StoreCore['imgPut']> {
    return this.core.imgPut(who, id, b);
  }

  /** RPC from `GET /img/<id>`: its type and bytes, or null. */
  imgGet(id: string): ReturnType<StoreCore['imgGet']> {
    return this.core.imgGet(id);
  }

  /** The same, with the request's meta for the log's `req` (reqMeta.ts; the Worker times it and sends it). */
  apiMeta(text: string): { body: string; meta: ReqMeta } {
    const keys = { KEY_A: this.env.KEY_A, KEY_B: this.env.KEY_B, KEY_C: this.env.KEY_C };
    this.rows();
    return apiWithMeta(this.core, text, (k) => roleOfKey(k, keys), this.rows);
  }

  /** A signed `/admin` body (storeRoute.ts): `{op, ...}` → its status and JSON reply. */
  async adminSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> {
    const v = await this.core.signedOp(text, t, sig);
    if ('status' in v) return v;
    // each signed op that changes or exports something in the log (an audit: its name and outcome); a read (the log's
    // own, the counts, a check without `fix`) only when it fails: reading the log wrote to it (~40 rows a day)
    const read = READ_OPS.has(String(v.op.op)) || (/check$/.test(String(v.op.op)) && v.op.fix !== true);
    const audit = (st: string) => (read && st === 'ok') || this.log([{ e: 'admin', l: st === 'ok' ? 1 : 2, d: { op: isToken(v.op.op) ? v.op.op : 'other', st } }]);
    try {
      const r = await this.admin(v.op);
      audit(r.ok === true ? 'ok' : String(r.error ?? 'refused'));
      return { status: 200, body: JSON.stringify(r) };
    } catch (e) {
      audit('unavailable');
      return { status: 200, body: JSON.stringify({ ok: false, error: 'unavailable', detail: String(e) }) };
    }
  }

  /**
   * - `counts`: rows per table, the revision and the newest `at`;
   * - `bookmark {ms?}`: point-in-time recovery's bookmark now and `ms` ago (default 1 h);
   * - `restore {bookmark}`: restore the record to that bookmark (the object restarts; every phone refetches: a new epoch);
   * - `rev`: start a new epoch (every phone drops its cache and fetches everything);
   * - `decorcheck {fix?}`: the decor caps' kept counts against the rows' (store.ts decorCheck);
   * - `shopcheck {fix?}`: the running field and each person's running shop ledger against the full fold of the rows (store.ts shopCheck);
   * - `adjust {id, who, v, note}`: a correction of `who`'s かいがら (`v`, either sign: a `shop_adjust` row, store.ts adjust);
   *   `unadjust {id}`: that row deleted (a new epoch); `walletset {id, who, h, note}`: the wallet made `h`, a correction
   *   row of what the rows lack for it (store.ts walletSet);
   * - `inbody {id, who, date, muscle_kg, smm_kg}`: a member's InBody sheet, their estimates' calibration (store.ts inbody);
   * - `wallet`: each wallet, its changes, the fold beside it; `walletcheck`: the wallets that differ from their fold;
   * - `held {person?}`: the values an ingest held back (a past day's 0 over a value above it: never served);
   *   `promote {person, date, metric, value?}`: one made a row of the day's history (its latest now);
   * - `dump {limit?, after?, all?}`: the rows a page at a time (the backup, docs/ops/runbook.md#9-the-record; `all`: at once)
   *   (`next`: the `after` of the next page; the audit on the first);
   * - `compact {confirm: 'delete-health-history', max?, rev?}`: the record's compaction now (store.ts compactOp: it
   *   deletes Health history rows, refused without the confirm; `rev: true` starts a new epoch after it);
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
      // the values an ingest held back (a past day's 0: store.ts metrics_held), and one made a row of the history
      case 'held':
        return { ok: true, rows: this.core.heldRows(typeof o.person === 'string' ? o.person : undefined) };
      case 'promote':
        return this.core.promoteHeld(o);
      // the running shop ledgers against the full fold of the rows (`fix`: the fold's taken)
      case 'shopcheck':
        return this.core.shopCheck(o);
      // a correction of someone's かいがら, and its undoing (store.ts adjust, unadjust)
      case 'adjust':
        return this.core.adjust(o);
      case 'unadjust':
        return this.core.unadjust(o);
      // an InBody sheet (store.ts inbody)
      case 'inbody':
        return this.core.inbody(o);
      // the かいがら wallets: read with the fold beside them, the drift check, and one set (store.ts)
      case 'wallet':
        return this.core.wallets();
      case 'walletcheck':
        return this.core.walletCheck();
      case 'walletset':
        return this.core.walletSet(o);
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
      case 'compact':
        // the record's compaction by hand: it deletes Health history rows, so only with its confirm (store.ts
        // compactOp; the cron runs it only with COMPACT_CRON=1); `rev`: a new epoch after it
        return this.core.compactOp(o);
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
