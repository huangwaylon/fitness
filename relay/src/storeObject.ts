// The record's Durable Object (docs/backend.md#the-record): one instance (`idFromName('record')`), SQLite-backed, apart
// from the island room (which holds the sockets and the day's shared world), so the record's code and the room's change
// independently. The Worker hands it the bodies of `/api` and `/admin` (storeRoute.ts) as they came: the parsing and
// the JSON happen here, on the object's CPU budget. After a write it tells the room, which passes `changed` to the
// open phones.
import { DurableObject } from 'cloudflare:workers';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { StoreCore, type Sql } from './store.ts';
import type { StoreRoom } from './storeRoute.ts';
import type { Env } from './index.ts';
import { apiWithMeta, countingSql, type ReqMeta } from './reqMeta.ts';
import { roleOfKey } from './auth.ts';
import { relaySink } from './logRoute.ts';
import type { RelayEvent } from './log.ts';
import { isToken } from '../../app/src/lib/contract/log.ts';
import { twice } from './notify.ts';
import { errName } from './log.ts';
import { after, backoff, due, NO_STATE, retryAt, runArchive, type ArchiveRun, type ArchiveState } from './archive.ts';

/** The backups' state (archive.ts): one key of the object's storage, never the record's tables. */
const ARCHIVE = 'archive';

export class IslandStore extends DurableObject<Env> implements StoreRoom {
  private core: StoreCore;
  /** The rows each request wrote and read (reqMeta.ts countingSql): the log's `req` `rw`, `rr`. */
  private rows: () => { rw: number; rr: number };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const counted = countingSql(ctx.storage.sql as unknown as Sql);
    this.rows = counted.take;
    this.core = new StoreCore({
      sql: counted.sql,
      tx: (fn) => ctx.storage.transactionSync(fn),
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
      now: () => Date.now(),
      notify: (n, guest) => this.tellRoom(n, guest),
      // a stored row that isn't JSON, skipped by a fold: a warning in the log (store.ts rowRec)
      corrupt: (where) => this.log([{ e: 'store.corrupt', l: 2, d: { where } }])
    });
  }

  private logObj() {
    return this.env.LOG.get(this.env.LOG.idFromName('log'));
  }

  /** The record's own events to the log (logRoute.ts relaySink: best effort, off the reply's path). */
  private log(evs: RelayEvent[]): void {
    if (this.env.LOG_OFF === '1') return;
    relaySink(() => this.logObj(), (p) => this.ctx.waitUntil(p), Date.now)(evs);
  }

  /** The record changed: the room passes `changed` to the open phones (after the commit, off the reply's path; once
   *  more, on a fresh stub, if the first call fails: a phone's push is otherwise only caught up by its next poll). */
  private tellRoom(n: Notice, guest?: boolean): void {
    const room = () => this.env.ROOM.get(this.env.ROOM.idFromName('island'));
    this.ctx.waitUntil(twice(() => Promise.resolve(room().notify(n, guest))).then(() => undefined, (e) => console.warn('notify the room', errName(e))));
  }

  /** RPC from the room's alarm after a restore (index.ts restoring): this is the restored record's first session, so
   *  a new epoch (every phone drops its cache and refetches; bumpRev tells the open ones). */
  restored(): { ok: true; rev: string } {
    return { ok: true, rev: this.core.bumpRev() };
  }

  api(text: string): string {
    return this.core.handleText(text);
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

  /** RPC from the Worker's cron at 03:00 Tokyo (index.ts): the backup is due, so the alarm runs it (on the object's
   *  CPU budget, not the cron's); a failure's retry is the alarm's own. */
  async archiveKick(): Promise<{ due: string }> {
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    const d = due(s, Date.now());
    const at = await this.ctx.storage.getAlarm();
    if (at === null && d !== 'done') await this.ctx.storage.setAlarm(d === 'run' ? Date.now() : s.lastAt + backoff(s.fails));
    return { due: d };
  }

  async alarm(): Promise<void> {
    const s = (await this.ctx.storage.get<ArchiveState>(ARCHIVE)) ?? NO_STATE;
    const d = due(s, Date.now());
    if (d === 'wait') await this.ctx.storage.setAlarm(s.lastAt + backoff(s.fails));
    if (d === 'run') await this.archive(s);
  }

  /** The backup now (the alarm's, or the admin `backup`'s with `force`), one at a time; logged; never throws. */
  private archiving: Promise<ArchiveRun> | null = null;
  private archive(s: ArchiveState, force = false): Promise<ArchiveRun> {
    return (this.archiving ??= this.archiveRun(s, force).finally(() => (this.archiving = null)));
  }

  private async archiveRun(s: ArchiveState, force: boolean): Promise<ArchiveRun> {
    this.rows();
    const r = await runArchive({
      dump: () => {
        const c = this.core.counts();
        return { metrics: c.metrics, events: c.events, pieces: this.core.dumpText() };
      },
      gh: { fetch: (u, i) => fetch(u, i), token: this.env.ARCHIVE_TOKEN?.trim(), repo: this.env.ARCHIVE_REPO ?? '', tag: this.env.ARCHIVE_RELEASE ?? '' },
      recipient: this.env.ARCHIVE_RECIPIENT?.trim(),
      now: Date.now
    });
    // the record's rows the run wrote (0: it only reads) and read
    const { rw, rr } = this.rows();
    const next = after(s, r, Date.now());
    await this.ctx.storage.put(ARCHIVE, next);
    const retry = retryAt(next, r);
    if (retry !== null) await this.ctx.storage.setAlarm(retry);
    const { slot: _slot, ...d } = r;
    this.log([{ e: 'cron.backup', l: r.ok ? 1 : r.st === 'no_token' ? 2 : 3, d: { ...d, rw, rr, fails: next.fails, ...(force ? { force } : {}) } }]);
    console.log('backup', JSON.stringify({ ...d, rw, rr }));
    return r;
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
    // each signed op in the log (an audit: its name and outcome)
    const audit = (st: string) => this.log([{ e: 'admin', l: st === 'ok' ? 1 : 2, d: { op: isToken(v.op.op) ? v.op.op : 'other', st } }]);
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
   * - `backup`: the daily backup now (archive.ts), whether or not today's is up (it replaces it); its outcome;
   * - `wx {refresh?, s?, fx?}`: the room's real weather (index.ts wxAdmin): fetch it now, put a fixture timeline in, or
   *   say how it is.
   */
  private async admin(o: Record<string, unknown>): Promise<Record<string, unknown>> {
    const storage = this.ctx.storage;
    switch (o.op) {
      // the real weather, the room's (index.ts wxAdmin): a fetch now, a fixture timeline, or how it is
      case 'wx':
        return this.env.ROOM.get(this.env.ROOM.idFromName('island')).wxAdmin(o);
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
        const told = await this.env.ROOM.get(this.env.ROOM.idFromName('island')).restoring().then(() => true, (e) => (console.warn('restoring', errName(e)), false));
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
      // the decor caps' kept counts against the rows' (`fix`: the rows' taken)
      case 'decorcheck':
        return this.core.decorCheck(o);
      case 'load':
        return this.core.load(o);
      case 'dump':
        return { rev: this.core.rev(), ...this.core.dumpPage(o) };
      case 'compact':
        // the record's compaction by hand: it deletes Health history rows, so only with its confirm (store.ts
        // compactOp; the cron runs it only with COMPACT_CRON=1); `rev`: a new epoch after it
        return this.core.compactOp(o);
      // the log (docs/ops/observability.md): its own object's
      case 'logs':
        return { ok: true, ...(await this.logObj().query(o)) };
      case 'logstats':
        return { ...(await this.logObj().stats()) };
      case 'logpurge':
        return { ...(await this.logObj().purge(o)) };
      default:
        return { ok: false, error: 'bad_request' };
    }
  }
}
