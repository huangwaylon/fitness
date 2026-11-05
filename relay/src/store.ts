// The record (docs/backend.md#the-record): metrics, events and the ingest audit in the store Durable Object's SQLite,
// free of the Workers runtime so it is unit-testable (test/store.test.ts runs it on node:sqlite). The same API as the
// Apps Script web app had (`{key, action, ...}` → `{ok, ...}`), so the app and the Shortcut only change the URL.
//
// - `at` is the record's clock: strictly increasing (max(now, last + 1 ms)), shared by the rows of one ingest.
// - An event id is accepted once, forever (`ids`: a replaced event's id still dedupes a late retry).
// - A slot (app contract/record.ts eventSlot) holds one event: a later one of the same slot replaces it, so a tally or an
//   island day is one row per person and day (a tally's counts the larger of the two rows', entry by entry: they only
//   grow), a cosmetic pref one per person, a goal one per person and Tokyo day, a decoration one per item, a board
//   post, a meal entry, a repeat, a recipe and a custom food one per id (each one's latest op).
// - A `sell` or a `buy` (the shop, contract/shop.ts) is kept only when the sender's own rows cover it: their tallies'
//   catches less their sells (the pocket), their sells' かいがら less their buys (shopLedger), a piece bought once.
// - `since` is answered from the `at` index. A row that arrived out of `at` order (only while Apps Script mirrored
//   its writes here: two requests' copies racing) is marked `late` with its arrival time, and a poll also returns
//   the late rows that arrived after `since` (less a margin for the two servers' clocks), so no phone misses one.
import { parseShortcut } from './parse.ts';
import { auditNotes, auditRow } from './audit.ts';
import { eventSlot, validEventData } from '../../app/src/lib/contract/record.ts';
import {
  CURSOR_RE, eventSubject, EVENT_TYPES, isId, isMetricKey, isPersonId, isRec, isWho, SNAPSHOT_PAGE_MAX,
  type ApiError, type EventRow, type Fail, type MetricRow, type SnapshotRows
} from '../../app/src/lib/contract/api.ts';
import { compactKeep, weekLockMs } from '../../app/src/lib/contract/compact.ts';
import { localDateAt } from '../../app/src/lib/contract/tokyo.ts';
import { decorAccept, decorOpOf, type DecorEntry } from '../../app/src/lib/contract/decor.ts';
import { tentAccept, tentOpOf, type TentEntry } from '../../app/src/lib/contract/tent.ts';
import { isRoomScope, isVoid, layoutAccept, layoutOpOf, scopeMayWrite, type LayoutEntry } from '../../app/src/lib/contract/layout.ts';
import { BOARD_MAX, boardAccept, boardOpOf, cleanText, type BoardEntry } from '../../app/src/lib/contract/board.ts';
import { foodAccept, foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp, repeatAccept, repeatNext, type RepeatOpBy } from '../../app/src/lib/contract/food.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { verifyNotify } from './notify.ts';
import { errName } from './log.ts';
import { scrubMsg } from '../../app/src/lib/contract/log.ts';
import { keyOwner, type Keys } from './auth.ts';
import { guestMayWrite, rowsFor } from '../../app/src/lib/contract/guest.ts';
import { buyOf, sellOf, shopLedger, shopRefusal, type ShopRow } from '../../app/src/lib/contract/shop.ts';
import { isTally, mergeTally } from '../../app/src/lib/contract/tally.ts';
import type { PersonId, Who } from '../../app/src/lib/contract/api.ts';

type Rec = Record<string, unknown>;
type Bind = string | number | null;

/** The SQL the store needs: Durable Objects' `ctx.storage.sql` (and node:sqlite in the tests). */
export interface Sql {
  exec<T extends Record<string, Bind> = Record<string, Bind>>(query: string, ...bindings: Bind[]): { toArray(): T[] };
}

export interface StoreIO {
  sql: Sql;
  /** Run `fn` as one transaction (`ctx.storage.transactionSync`). */
  tx<R>(fn: () => R): R;
  keys: Keys;
  now(): number;
  /** Tell the open phones the record changed (the room's `changed`); best effort, after the commit. */
  notify(n: Notice): void;
  /** A stored row that isn't JSON (or not an object) was skipped, at `where` (a fold's name): the log's warning
   *  (`store.corrupt`), once a request per place. */
  corrupt?(where: string): void;
}

/** What the store answers to `health` and `whoami` (`build`): bumped with the store's code. */
export const STORE_BUILD = 'relay-2';
export const MAX_BODY_CHARS = 1_000_000;
export const RATE_PER_MINUTE = 120;
const MAX_EVENT_DATA_CHARS = 20_000;
const UPLOADS_SHOWN = 20;
/** The ingest audit keeps this long (ms): each ingest lets older rows go. */
export const UPLOADS_KEEP_MS = 60 * 86_400_000;
/** At most this many events in one `events` request (a queue that grew offline goes in a few). */
const EVENTS_MAX = 50;
/** A late row is returned to a poll whose `since` is at most this much after its arrival (the servers' clocks). */
export const LATE_MARGIN_MS = 10_000;
const KEY_RE = /^[0-9a-fA-F]{32,128}$/;
/** The admin ops taken once per signature (a replay within the window would restore, start an epoch or purge again). */
const ADMIN_ONCE = ['restore', 'rev', 'logpurge'];
/** How long their signatures are remembered: past the signature's own window (±5 minutes) on both sides. */
const ADMIN_SEEN_MS = 10 * 60_000;
/** Compaction (compact): at most this many metrics rows deleted a run. Each delete writes ~4 rows (the row, its `at`
 *  index, its unique key, the meta) against the Free plan's 100,000 a day; a week brings ~2,000 new rows to drop, so a
 *  run a day keeps up and a year's backlog goes in a few weeks. */
export const COMPACT_MAX = 5_000;
/** The cron's tick that compacts the record (index.ts scheduled): 19:15 UTC, 04:15 Tokyo, once a day. */
export const isCompactTick = (t: number): boolean => Math.floor((t % 86_400_000) / 60_000) === 19 * 60 + 15;
/** Seqs per DELETE (Durable Objects' SQLite binds at most 100 parameters). */
const DELETE_CHUNK = 90;
/** Dates compacted in one transaction. */
const COMPACT_DATES_PER_TX = 7;
const SEQ_MAX = 9e15;
const utf8 = new TextEncoder();
const ISO_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** The meal log's events, each one's latest op per id kept by its owner's rule (contract/food.ts foodAccept). */
const FOOD_PARSE = { food: foodOp, food_repeat: foodRepeatOp, food_recipe: foodRecipeOp, food_custom: foodCustomOp } as const;
type FoodType = keyof typeof FOOD_PARSE;
const isFoodType = (t: string): t is FoodType => Object.hasOwn(FOOD_PARSE, t);
const fail = (error: ApiError, detail?: string): Fail => (detail ? { ok: false, error, detail } : { ok: false, error });

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  // value is REAL: weights and body metrics have one decimal
  'CREATE TABLE IF NOT EXISTS metrics (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, person TEXT NOT NULL, date TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL, late INTEGER, UNIQUE (person, date, metric, at))',
  'CREATE INDEX IF NOT EXISTS metrics_at ON metrics (at)',
  'CREATE INDEX IF NOT EXISTS metrics_late ON metrics (late) WHERE late IS NOT NULL',
  'CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, at TEXT NOT NULL, person TEXT NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL, slot TEXT UNIQUE, late INTEGER)',
  'CREATE INDEX IF NOT EXISTS events_at ON events (at)',
  'CREATE INDEX IF NOT EXISTS events_type ON events (type)',
  'CREATE INDEX IF NOT EXISTS events_late ON events (late) WHERE late IS NOT NULL',
  // the signatures of the admin's one-shot ops (ADMIN_ONCE) of the last ADMIN_SEEN_MS: a replay is refused
  'CREATE TABLE IF NOT EXISTS admin_seen (sig TEXT PRIMARY KEY, t INTEGER NOT NULL) WITHOUT ROWID',
  // every event id ever accepted, also of events a later one replaced
  'CREATE TABLE IF NOT EXISTS ids (id TEXT PRIMARY KEY) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS uploads (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, person TEXT NOT NULL, status TEXT NOT NULL, bytes INTEGER NOT NULL, notes TEXT NOT NULL, UNIQUE (at, person))',
  'CREATE INDEX IF NOT EXISTS uploads_person ON uploads (person, seq)',
  // the phones' anonymous telemetry until 2026-11-05 (its unscrubbed messages): the log has it now
  // (docs/ops/observability.md, relay/src/log.ts)
  'DROP TABLE IF EXISTS telemetry'
];

/** The rows a load brings (the admin `load`: a dump's; once the sheet's history and Apps Script's copies), each with its `at`. */
export interface ImportRows {
  metrics?: unknown[][];
  events?: unknown[][];
  uploads?: unknown[][];
}

export interface ImportResult { metrics: number; events: number; uploads: number; skipped: number }

type Reply = Rec & { ok: boolean };

export class StoreCore {
  private lastAt: number;
  private rate = { minute: 0, A: 0, B: 0, G: 0 };
  private exc: string | null = null;
  /** The places a corrupt row was skipped this request (each told once). */
  private told = new Set<string>();

  constructor(private io: StoreIO) {
    for (const s of SCHEMA) io.sql.exec(s);
    this.lastAt = Number(this.meta('last_at') ?? 0);
    if (this.meta('rev') === null) this.setMeta('rev', 'e1');
  }

  private meta(k: string): string | null {
    return this.io.sql.exec<{ v: string }>('SELECT v FROM meta WHERE k = ?', k).toArray()[0]?.v ?? null;
  }
  private setMeta(k: string, v: string): void {
    this.io.sql.exec('INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v', k, v);
  }

  /** The data revision (docs/backend.md#revision): an epoch, changed only when the record is rebuilt (an import over it, a restore). */
  rev(): string {
    return this.meta('rev') ?? 'e1';
  }

  /** Start a new epoch: every phone drops its cache and fetches everything, at once when it is open (the notice). */
  bumpRev(): string {
    const n = Number(/^e(\d+)$/.exec(this.rev())?.[1] ?? 0) + 1;
    this.setMeta('rev', `e${n}`);
    this.tellAll();
    return `e${n}`;
  }

  /** The admin's change (a new epoch, a load) to the open phones: `changed` at the newest `at` (`ingest`, never
   *  skipped as a phone's own event; a phone refetches when the rev or the `at` is new to it). */
  private tellAll(): void {
    this.io.notify({ what: 'ingest', who: 'A', at: this.newestAt() ?? new Date(this.io.now()).toISOString(), rev: this.rev() });
  }

  /** The next `at`: strictly after every one handed out before. */
  private nextAt(): string {
    this.lastAt = Math.max(this.io.now(), this.lastAt + 1);
    this.setMeta('last_at', String(this.lastAt));
    return new Date(this.lastAt).toISOString();
  }

  /** Take `at` (an import's) into the clock, so later ones stay after it; true when it is out of order (late). */
  private seeAt(at: string): boolean {
    const ms = Date.parse(at);
    if (ms > this.lastAt) {
      this.lastAt = ms;
      this.setMeta('last_at', String(ms));
      return false;
    }
    return ms < this.lastAt;
  }

  private underRateLimit(me: Who): boolean {
    const minute = Math.floor(this.io.now() / 60_000);
    if (this.rate.minute !== minute) this.rate = { minute, A: 0, B: 0, G: 0 };
    return ++this.rate[me] <= RATE_PER_MINUTE;
  }

  /** An API request's parsed body (`bytes`: its size, for the audit). Never throws. */
  handle(body: unknown, bytes: number): Reply {
    this.exc = null;
    this.told.clear();
    try {
      return this.route(body, bytes);
    } catch (e) {
      // its class and its scrubbed message only: a message can quote the body (docs/ops/observability.md)
      this.exc = errName(e);
      console.error('store', this.exc, scrubMsg(e instanceof Error ? e.message : ''));
      return fail('unavailable');
    }
  }

  /** The class of what the last request threw (its `unavailable`), or null: the log's `req` (reqMeta.ts). */
  lastError(): string | null {
    return this.exc;
  }

  /** A stored row's data as an object, or null when it isn't one: a corrupt row, skipped by the fold `where` and told
   *  to the log (never silently: the record's own writes are always JSON objects, so one that isn't is a bug or
   *  damage). */
  private rowRec(data: string, where: string): Rec | null {
    let x: unknown;
    try {
      x = JSON.parse(data);
    } catch {
      x = undefined;
    }
    if (isRec(x)) return x;
    if (!this.told.has(where)) {
      this.told.add(where);
      this.io.corrupt?.(where);
    }
    return null;
  }

  /** An `/api` body as sent → its JSON reply. Never throws. */
  handleText(text: string): string {
    if (!text) return JSON.stringify(fail('bad_request'));
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return JSON.stringify(fail('bad_request'));
    }
    return JSON.stringify(this.handle(body, utf8.encode(text).length));
  }

  /** A signed `/admin` body: its `{op, ...}`, or the status and reply refusing it. */
  async signedOp(text: string, t: string | null, sig: string | null): Promise<{ op: Rec } | { status: number; body: string }> {
    if (!(await verifyNotify(this.io.keys, t, sig, text, this.io.now()))) return { status: 401, body: 'unauthorized' };
    let o: unknown;
    try {
      o = JSON.parse(text);
    } catch {
      return { status: 400, body: 'bad request' };
    }
    if (!isRec(o) || typeof o.op !== 'string') return { status: 400, body: 'bad request' };
    if (ADMIN_ONCE.includes(o.op) && sig && !this.firstSeen(sig)) return { status: 409, body: 'replayed' };
    return { op: o };
  }

  /** Whether a one-shot admin op's signature is new (and remember it; the old ones let go). */
  private firstSeen(sig: string): boolean {
    return this.io.tx(() => {
      const now = this.io.now();
      this.io.sql.exec('DELETE FROM admin_seen WHERE t < ?', now - ADMIN_SEEN_MS);
      if (this.io.sql.exec('SELECT 1 AS x FROM admin_seen WHERE sig = ?', sig).toArray().length) return false;
      this.io.sql.exec('INSERT INTO admin_seen (sig, t) VALUES (?, ?)', sig, now);
      return true;
    });
  }

  /** The admin `load {rows}`: rows that already have their `at` (a dump's), by the record's rules. */
  load(o: Rec): Record<string, unknown> {
    const rows = o.rows;
    if (!isRec(rows) || !(['metrics', 'events', 'uploads'] as const).every((k) => rows[k] === undefined || Array.isArray(rows[k]))) return { ok: false, error: 'bad_request' };
    const r = this.import(rows as ImportRows);
    if (r.metrics + r.events) this.tellAll();
    return { ok: true, ...r, counts: this.counts() };
  }

  private route(body: unknown, bytes: number): Reply {
    if (!isRec(body)) return fail('bad_request');
    if (body.action === 'health' && body.key === undefined) return { ok: true, build: STORE_BUILD };
    const me = typeof body.key === 'string' && KEY_RE.test(body.key) ? keyOwner(body.key, this.io.keys) : null;
    if (!me) return fail('unauthorized');
    if (!this.underRateLimit(me)) return fail('busy');
    // the guest (docs/backend.md#the-guest): no health data in, no audit to read
    if (me === 'G' && (body.action === 'ingest' || body.action === 'uploads')) return fail('forbidden');
    switch (body.action) {
      case 'ingest': return this.ingest(me as PersonId, body, bytes);
      case 'event': return this.event(me, body);
      case 'events': return this.events(me, body);
      case 'snapshot': return this.snapshot(me, body);
      case 'uploads': return this.uploads(me);
      case 'whoami': return { ok: true, me, build: STORE_BUILD };
      default: return fail('bad_request');
    }
  }

  // ---------------------------------------------------------------- reads

  private snapshot(me: Who, body: Rec): Reply {
    let since = '';
    if (typeof body.since === 'string' && body.since) {
      const ms = Date.parse(body.since);
      if (Number.isNaN(ms)) return fail('bad_request');
      since = new Date(ms).toISOString();
    } else if (body.since !== undefined && body.since !== null && body.since !== '') return fail('bad_request');
    // paged (`page`: rows at most, `after`: the last page's `next`); without `page` every row at once, as before
    let page: { limit: number; after: Cursor | null } | null = null;
    if (body.page !== undefined) {
      const after = body.after === undefined ? null : cursorOf(body.after);
      if (!isPageSize(body.page) || after === undefined) return fail('bad_request');
      page = { limit: body.page, after };
    } else if (body.after !== undefined) return fail('bad_request');
    // the guest's: the activity and the events, never a からだ row, a からだ goal or a member's profile; a member's:
    // never the guest's profile (contract/guest.ts rowsFor)
    const head = { ok: true, me, now: new Date(this.io.now()).toISOString(), rev: this.rev() };
    if (!page) return { ...head, rows: rowsFor(me, this.rowsSince(since)) };
    const p = this.rowsPage(since, page.after, page.limit);
    return { ...head, rows: rowsFor(me, p.rows), ...(p.next ? { next: p.next } : {}) };
  }

  /** Every row after `since` ('' = all), in `at` order: the `at` index, and the late rows that came in after it. */
  rowsSince(since: string): SnapshotRows {
    const sql = this.io.sql;
    const pick = <T extends Record<string, Bind>>(tab: 'metrics' | 'events', cols: string): (T & { seq: number; at: string })[] => {
      const rows = sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE at > ? ORDER BY at, seq`, since).toArray();
      if (!since) return rows;
      const extra = this.lateRows<T>(tab, cols, since);
      return extra.length ? [...rows, ...extra].sort(byAt) : rows;
    };
    return { metrics: pick<MetricCols>('metrics', METRIC_COLS).map(metricRow), events: pick<EventCols>('events', EVENT_COLS).map(eventRow) };
  }

  /** The late rows a poll at `since` also gets: stamped at or before it, arrived after it less LATE_MARGIN_MS. */
  private lateRows<T extends Record<string, Bind>>(tab: 'metrics' | 'events', cols: string, since: string): (T & { seq: number; at: string })[] {
    return this.io.sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE late > ? AND at <= ?`, Date.parse(since) - LATE_MARGIN_MS, since).toArray();
  }

  /**
   * A page of the rows after `since`: the next `limit` in (at, table, seq) order after `after` (null: the first page,
   * which also brings the late rows), with the cursor of its last row when there are more (`next`). The pages together
   * are rowsSince(since); a row written between two pages comes in a later one (its `at` is after every row handed
   * out before), so a phone that applies the pages together has the record as of the last one. Reads ≤ 2 (limit + 1)
   * rows from the `at` indexes.
   */
  rowsPage(since: string, after: Cursor | null, limit: number): { rows: SnapshotRows; next: string | null } {
    const sql = this.io.sql;
    const c: Cursor = after ?? { at: since, t: 'e', seq: SEQ_MAX };
    // the rows of one `at` go metrics first, then events: past an event's row none of that `at`'s metrics are left
    const floor = (t: 'm' | 'e') => (c.t === t ? c.seq : t === 'm' ? SEQ_MAX : -1);
    const take = <T extends Record<string, Bind>>(tab: 'metrics' | 'events', t: 'm' | 'e', cols: string) =>
      sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE at >= ? AND (at > ? OR seq > ?) ORDER BY at, seq LIMIT ?`, c.at, c.at, floor(t), limit + 1)
        .toArray();
    const ms = take<MetricCols>('metrics', 'm', METRIC_COLS), es = take<EventCols>('events', 'e', EVENT_COLS);
    // merged in (at, table, seq) order: the first `limit`
    let i = 0, j = 0, n = 0;
    let last: string | null = null;
    while (n < limit && (i < ms.length || j < es.length)) {
      const m = ms[i], e = es[j];
      const r = m && (!e || m.at <= e.at) ? { x: ms[i++], t: 'm' } : { x: es[j++], t: 'e' };
      last = `${r.x.at}|${r.t}|${r.x.seq}`;
      n++;
    }
    const metrics = ms.slice(0, i), events = es.slice(0, j);
    const more = i < ms.length || j < es.length;
    if (!after && since) {
      const lm = this.lateRows<MetricCols>('metrics', METRIC_COLS, since), le = this.lateRows<EventCols>('events', EVENT_COLS, since);
      if (lm.length) metrics.push(...lm), metrics.sort(byAt);
      if (le.length) events.push(...le), events.sort(byAt);
    }
    return { rows: { metrics: metrics.map(metricRow), events: events.map(eventRow) }, next: more ? last : null };
  }

  private uploads(me: Who): Reply {
    const rows = this.io.sql.exec<{ at: string; status: string; bytes: number; notes: string }>(
      'SELECT at, status, bytes, notes FROM uploads WHERE person = ? ORDER BY seq DESC LIMIT ?', me, UPLOADS_SHOWN
    ).toArray().map((r) => ({ at: r.at, status: r.status, bytes: r.bytes, notes: r.notes }));
    return { ok: true, rows };
  }

  // ---------------------------------------------------------------- ingest

  /** The Shortcut's health body (parse.ts): each value that differs from its day's latest row is appended. */
  private ingest(me: PersonId, body: Rec, bytes: number): Reply {
    let parsed: ReturnType<typeof parseShortcut>;
    try {
      parsed = parseShortcut(body);
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)).slice(0, 300);
      this.io.tx(() => this.audit(auditRow(this.nextAt(), me, 'error', bytes, msg, body)));
      return fail('bad_request', msg);
    }
    const added = this.io.tx(() => {
      const at = this.nextAt();
      // Apple Health's current total is the truth: a day's value is its latest row, and a different one is appended
      // (up or down). Read from the (person, date, metric, at) key over the body's days only.
      const latest = new Map<string, number>();
      const days = parsed.metrics.map((m) => m.date).sort();
      if (days.length) {
        const rows = this.io.sql.exec<{ date: string; metric: string; value: number }>(
          'SELECT date, metric, value FROM metrics WHERE person = ? AND date >= ? AND date <= ? ORDER BY at, seq', me, days[0], days[days.length - 1]
        ).toArray();
        for (const r of rows) latest.set(`${r.date}|${r.metric}`, r.value);
      }
      // a past Tokyo day never drops to 0 from a value above it: a run that read nothing (Health locked, Fill
      // Missing's 0 for every day) would rewrite the history; today may still go down to 0
      const today = new Date(this.io.now() + 9 * 3600_000).toISOString().slice(0, 10);
      let n = 0, zeros = 0;
      for (const m of parsed.metrics) {
        const k = `${m.date}|${m.metric}`;
        if (latest.get(k) === m.value) continue;
        if (m.value === 0 && m.date < today && (latest.get(k) ?? 0) > 0) {
          zeros++;
          continue;
        }
        latest.set(k, m.value);
        this.io.sql.exec('INSERT INTO metrics (at, person, date, metric, value) VALUES (?, ?, ?, ?, ?)', at, me, m.date, m.metric, m.value);
        n++;
      }
      const notes = [zeros ? `${zeros} past zeros ignored` : '', auditNotes(parsed)].filter(Boolean).join('; ');
      this.audit(auditRow(at, me, parsed.skipped ? 'partial' : 'ok', bytes, notes, body));
      return n ? { n, at } : { n, at: null };
    });
    if (added.at) this.io.notify({ what: 'ingest', who: me, at: added.at, rev: this.rev() });
    return {
      ok: true, metrics: added.n,
      ...(parsed.skipped ? { skipped: parsed.skipped } : {}),
      ...(parsed.warnings.length ? { warnings: parsed.warnings } : {})
    };
  }

  /** An ingest's audit row, and the rows older than UPLOADS_KEEP_MS let go (the (at, person) key's index). */
  private audit(r: readonly unknown[]): void {
    this.addUpload(r);
    this.io.sql.exec('DELETE FROM uploads WHERE at < ?', new Date(this.io.now() - UPLOADS_KEEP_MS).toISOString());
  }

  private addUpload(r: readonly unknown[]): void {
    this.io.sql.exec('INSERT OR IGNORE INTO uploads (at, person, status, bytes, notes) VALUES (?, ?, ?, ?, ?)', ...(r as Bind[]));
  }

  // ---------------------------------------------------------------- events

  private event(me: Who, body: Rec): Reply {
    const r = this.keep(me, body);
    if (r.ok && r.at) this.io.notify({ what: 'event', who: me, at: r.at, rev: this.rev() });
    const { at: _at, ...reply } = r;
    return reply;
  }

  /**
   * `events: [{id, type, data}, …]` (≤ EVENTS_MAX), kept in order, each as `event` would: `{ok, results}`, one per
   * event (`{id, ok, duplicate?, at?}` or `{id, ok: false, error, detail?}`), `at` the stored row's. One notice for
   * the lot. An event whose write throws is `unavailable` alone (nothing of it kept), never the batch.
   */
  private events(me: Who, body: Rec): Reply {
    const list = body.events;
    if (!Array.isArray(list) || !list.length || list.length > EVENTS_MAX) return fail('bad_request');
    let last: string | null = null;
    const results = list.map((e) => {
      let r: Reply & { at?: string };
      try {
        r = isRec(e) ? this.keep(me, e) : fail('bad_request');
      } catch (err) {
        // that event alone (its transaction rolled back, its id still free for a retry): the others go on, and the
        // notice tells of what committed. Its class only (a message can quote the body).
        this.exc = errName(err);
        console.error('store', this.exc, scrubMsg(err instanceof Error ? err.message : ''));
        r = fail('unavailable');
      }
      if (r.ok && r.at) last = r.at;
      return { id: isRec(e) && typeof e.id === 'string' ? e.id : null, ...r };
    });
    if (last) this.io.notify({ what: 'event', who: me, at: last, rev: this.rev() });
    return { ok: true, results };
  }

  /** One event checked and kept (or acknowledged): the reply, with the stored row's `at` when one was written. */
  private keep(me: Who, body: Rec): Reply & { at?: string } {
    const id = body.id;
    if (!isId(id)) return fail('bad_request');
    if (typeof body.type !== 'string' || !(EVENT_TYPES as readonly string[]).includes(body.type)) return fail('bad_request');
    const sent = body.data === undefined ? {} : body.data;
    if (!isRec(sent)) return fail('bad_request');
    // a board note's text: plain text, sanitised here as on the phone (contract/board.ts cleanText)
    // a meal entry, a repeat, a recipe or a custom food as the phone keeps it: names cleaned, grams to one decimal
    // (contract/food.ts)
    const data: Rec = body.type === 'board' && typeof sent.t === 'string' ? { ...sent, t: cleanText(sent.t) }
      : isFoodType(body.type) ? (FOOD_PARSE[body.type](sent) ?? sent) : sent;
    // the guest writes only its finds, tallies, notes, meals, the tent's decor and its own prefs (contract/guest.ts)
    if (me === 'G' && !guestMayWrite(body.type, data)) return fail('forbidden');
    // a scoped decor op: the outdoors the members', a home's look and room its owner's (contract/layout.ts)
    if (body.type === 'decor' && !scopeMayWrite(me, data)) return fail('forbidden');
    const json = JSON.stringify(data);
    if (json.length > MAX_EVENT_DATA_CHARS) return fail('too_large');
    const subject = eventSubject(body.type, data, me);
    if (!subject || !validEventData(body.type, data, this.io.now())) return fail('bad_request');
    const type = body.type;
    return this.io.tx((): Reply & { at?: string } => {
      if (this.known(id)) return { ok: true, duplicate: true };
      if (type === 'spend_void') {
        const v = this.voidTarget(data.spendId as string);
        // a void names a buy in the record; a second void of it (the other phone got there first) changes nothing
        if (v === 'missing') return fail('bad_request', 'no such spend');
        if (v === 'voided') return { ok: true, duplicate: true };
      }
      if (type === 'decor') {
        const v = this.decorTarget(me, data);
        if (v === 'full') return fail('bad_request', isRoomScope(data.sc) ? 'tent full' : data.sc ? 'layout full' : 'decor full');
        if (v === 'stale') {
          this.io.sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
          return { ok: true, duplicate: true };
        }
      }
      if (type === 'sell' || type === 'buy') {
        // the shop: only what the sender's pocket holds, only what their かいがら cover, a piece once (contract/shop.ts)
        const why = this.shopTarget(me, type, data);
        if (why) return fail('bad_request', why === 'owned' ? 'owned' : `${why} short`);
      }
      let drop: string | null = null;
      if (type === 'board') {
        const v = this.boardTarget(me, data);
        if (v.v === 'forbidden') return fail('forbidden');
        if (v.v === 'stale') {
          this.io.sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
          return { ok: true, duplicate: true };
        }
        if (v.v === 'append') drop = v.drop;
      }
      let kept = json;
      if (isFoodType(type)) {
        // only its owner changes an entry, a repeat, a recipe or a custom food; an op beaten by the one held is
        // acknowledged (contract/food.ts foodAccept); a repeat's skipped days are never lost (repeatAccept)
        const v = this.foodTarget(type, me, data);
        if (v === 'forbidden') return fail('forbidden');
        // a repeat's end that names the repeat following it (`nx`) only once the record holds that one, so a change is
        // both or neither (contract/food.ts repeatNext)
        const nx = type === 'food_repeat' ? repeatNext(sent) : undefined;
        const next = nx === undefined ? null : this.foodHeld('food_repeat', nx);
        if (nx !== undefined && (!next || next.rm || next.who !== me)) return fail('bad_request', 'no such repeat');
        if (v === 'stale') {
          this.io.sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
          return { ok: true, duplicate: true };
        }
        kept = JSON.stringify(v);
      }
      // a day's tally only grows: the slot keeps each entry's larger count of the held row and this one, so a stale
      // lower send (a second phone's, a queue that waited) never takes back a catch a sale counted (contract/tally.ts)
      if (type === 'tally') kept = this.tallyKept(me, data);
      const at = this.nextAt();
      if (drop) this.io.sql.exec('DELETE FROM events WHERE slot = ?', `board|${drop}`);
      if (type === 'decor' && data.sc === 'r' && typeof data.at === 'number') this.dropVoided(data.at);
      this.put(id, at, me, type, kept, eventSlot(type, me, subject, data, Date.parse(at)), null);
      if (type === 'board' && data.rm === true) this.pruneBoard();
      return { ok: true, at };
    });
  }

  private known(id: string): boolean {
    return this.io.sql.exec('SELECT 1 AS x FROM ids WHERE id = ?', id).toArray().length > 0;
  }

  /** Append an event (its slot's earlier event replaced). */
  private put(id: string, at: string, who: Who, type: string, json: string, slot: string | null, late: number | null): void {
    const sql = this.io.sql;
    if (slot) sql.exec('DELETE FROM events WHERE slot = ?', slot);
    sql.exec('INSERT INTO ids (id) VALUES (?)', id);
    sql.exec('INSERT INTO events (id, at, person, type, data, slot, late) VALUES (?, ?, ?, ?, ?, ?, ?)', id, at, who, type, json, slot, late);
  }

  /** What a `spend_void` of `spendId` would undo: `missing`, `voided` (already undone) or `ok`. */
  private voidTarget(spendId: string): 'missing' | 'voided' | 'ok' {
    let found = false;
    const rows = this.io.sql.exec<{ type: string; data: string }>(
      "SELECT type, data FROM events WHERE type IN ('spend', 'spend_void') AND instr(data, ?) > 0", JSON.stringify(spendId)
    ).toArray();
    for (const r of rows) {
      const d = this.rowRec(r.data, 'spend');
      if (!d || d.spendId !== spendId) continue;
      if (r.type === 'spend_void') return 'voided';
      found = true;
    }
    return found ? 'ok' : 'missing';
  }

  /** A decor op against the record's (each id's latest op, per scope): `stale`, `full` or `append` (contract/decor.ts
   *  decorAccept, contract/tent.ts tentAccept, contract/layout.ts layoutAccept). */
  private decorTarget(me: Who, d: Rec): 'append' | 'stale' | 'full' {
    const kind = d.sc === undefined ? 'island' : isRoomScope(d.sc) ? 'room' : 'layout';
    const parse = (x: Rec) => (kind === 'room' ? tentOpOf(x) : kind === 'layout' ? layoutOpOf(x) : decorOpOf(x));
    const e = { ...parse(d)!, who: me };
    const held: (DecorEntry | TentEntry | LayoutEntry)[] = [];
    for (const r of this.decorRows()) {
      const op = parse(r.d);
      if (op) held.push({ ...op, who: r.person } as DecorEntry | TentEntry | LayoutEntry);
    }
    if (kind === 'room') return tentAccept(held as TentEntry[], e as TentEntry);
    if (kind === 'layout') return layoutAccept(held as LayoutEntry[], e as LayoutEntry);
    return decorAccept(held as DecorEntry[], e as DecorEntry);
  }

  /** Every board row's op (each post's latest), with who sent it. */
  private boardRows(): (BoardEntry & { seq: number })[] {
    const out: (BoardEntry & { seq: number })[] = [];
    for (const r of this.io.sql.exec<{ seq: number; person: string; data: string }>("SELECT seq, person, data FROM events WHERE type = 'board'").toArray()) {
      const x = this.rowRec(r.data, 'board');
      const op = x ? boardOpOf(x) : null;
      if (op && isWho(r.person)) out.push({ ...op, who: r.person, seq: r.seq });
    }
    return out;
  }

  /** A board op against the posts the record holds (contract/board.ts boardAccept): who may, and the cap. */
  private boardTarget(me: Who, d: Rec): ReturnType<typeof boardAccept> {
    return boardAccept(this.boardRows(), { ...boardOpOf(d)!, who: me });
  }

  /** The removed posts' rows past BOARD_MAX (the oldest removals) are dropped: a removal only has to outlive the ops
   *  that could still arrive for it (their ids stay known; an edit of a post the record doesn't hold is dropped). */
  private pruneBoard(): void {
    const gone = this.boardRows().filter((r) => r.rm).sort((a, b) => b.at - a.at || b.seq - a.seq);
    for (const r of gone.slice(BOARD_MAX)) this.io.sql.exec('DELETE FROM events WHERE seq = ?', r.seq);
  }

  /** A meal, a repeat, a recipe or a custom food op against the entry's (the repeat's, the recipe's) latest op the record holds (its
   *  slot's row, with who sent it): `forbidden`, `stale` (nothing to keep), or the op its slot then keeps (a repeat's
   *  with every op's skipped days: contract/food.ts repeatAccept). */
  private foodTarget(type: FoodType, me: Who, d: Rec): 'forbidden' | 'stale' | Rec {
    const parse = FOOD_PARSE[type];
    const held = this.foodHeld(type, String(d.id));
    const e = { ...parse(d)!, who: me };
    if (type === 'food_repeat') {
      const { v, keep } = repeatAccept(held as RepeatOpBy | null, e as RepeatOpBy);
      if (v === 'forbidden') return v;
      if (!keep) return 'stale';
      const { who: _who, ...op } = keep;
      return op;
    }
    const v = foodAccept(held, e);
    return v === 'append' ? parse(d)! : v;
  }

  /** The op a meal's, a repeat's, a recipe's or a custom food's slot holds, with who sent it, or null. */
  private foodHeld(type: FoodType, id: string): (NonNullable<ReturnType<(typeof FOOD_PARSE)[FoodType]>> & { who: Who }) | null {
    const r = this.io.sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', `${type}|${id}`).toArray()[0];
    if (!r || !isWho(r.person)) return null;
    const op = FOOD_PARSE[type](this.rowRec(r.data, 'food'));
    return op ? { ...op, who: r.person } : null;
  }

  /** A `tally` of `who`'s as its slot keeps it (JSON): merged with the day's row held (contract/tally.ts mergeTally). */
  private tallyKept(who: Who, d: Rec): string {
    const held = this.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', `tally|${who}|${String(d.date)}`).toArray()[0];
    const h = held ? this.rowRec(held.data, 'tally') : null;
    if (!h || !isTally(h) || !isTally(d)) return JSON.stringify(d);
    return JSON.stringify({ date: d.date, counts: mergeTally(h.counts, d.counts) });
  }

  /** Why a sell or a buy of `me`'s isn't covered by their rows (contract/shop.ts shopRefusal), or null. The fold reads
   *  their day tallies (one row a day: ≤ 366 a year) and their shop rows, in the object, never the Worker. */
  private shopTarget(me: Who, type: 'sell' | 'buy', d: Rec): 'pocket' | 'wallet' | 'owned' | null {
    const parse = (raw: string): Rec | null => this.rowRec(raw, 'shop');
    const caught = new Map<string, number>();
    for (const r of this.io.sql.exec<{ data: string }>("SELECT data FROM events WHERE type = 'tally' AND person = ?", me).toArray()) {
      const t = parse(r.data);
      if (t && isTally(t)) for (const k in t.counts) caught.set(k, (caught.get(k) ?? 0) + t.counts[k]);
    }
    const rows: ShopRow[] = [];
    for (const r of this.io.sql.exec<{ type: string; data: string }>("SELECT type, data FROM events WHERE type IN ('sell', 'buy') AND person = ? ORDER BY at, seq", me).toArray()) {
      const x = parse(r.data);
      const s = x && r.type === 'sell' ? sellOf(x) : null;
      const b = x && r.type === 'buy' ? buyOf(x) : null;
      if (s) rows.push({ type: 'sell', data: s });
      else if (b) rows.push({ type: 'buy', data: b });
    }
    const row: ShopRow = type === 'sell' ? { type, data: sellOf(d)! } : { type, data: buyOf(d)! };
    return shopRefusal(shopLedger(caught, rows), caught, row);
  }

  /** Every decor row (its seq, sender and data). */
  private decorRows(): { seq: number; person: Who; d: Rec }[] {
    const out: { seq: number; person: Who; d: Rec }[] = [];
    for (const r of this.io.sql.exec<{ seq: number; person: string; data: string }>("SELECT seq, person, data FROM events WHERE type = 'decor'").toArray()) {
      const x = this.rowRec(r.data, 'decor');
      if (x && isWho(r.person)) out.push({ seq: r.seq, person: r.person, d: x });
    }
    return out;
  }

  /** A layout reset's rows: the objects' and the chunks' ops it voids are dropped (their ids stay known). */
  private dropVoided(at: number): void {
    for (const r of this.decorRows()) {
      const op = layoutOpOf(r.d);
      if (op && isVoid({ ...op, who: r.person }, at)) this.io.sql.exec('DELETE FROM events WHERE seq = ?', r.seq);
    }
  }

  // ---------------------------------------------------------------- import

  /**
   * Take rows that already have their `at` (the sheet's history, or Apps Script's copy of a write it just made), by
   * the same rules as the record's own writes: an event id once, a slot's latest (by `at`) kept, a decor op by the
   * merge's rules; rows the model can't read (an old high-five's) are skipped. Idempotent: an import again adds nothing.
   */
  import(rows: ImportRows): ImportResult {
    // in `at` order across the tables, so a batch is late only where it is older than what the record had
    const all = [
      ...(rows.metrics ?? []).map((r) => ({ tab: 'metrics' as const, r })),
      ...(rows.events ?? []).map((r) => ({ tab: 'events' as const, r })),
      ...(rows.uploads ?? []).map((r) => ({ tab: 'uploads' as const, r }))
    ].map((x, i) => ({ ...x, i, at: Array.isArray(x.r) ? String(x.r[0]) : '' }))
      .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.i - y.i));
    return this.io.tx(() => {
      const out: ImportResult = { metrics: 0, events: 0, uploads: 0, skipped: 0 };
      const arrived = this.io.now();
      for (const { tab, r } of all) {
        const v = !Array.isArray(r) ? 'skipped' : tab === 'metrics' ? this.importMetric(r, arrived) : tab === 'events' ? this.importEvent(r, arrived) : this.importUpload(r);
        if (v === 'added') out[tab]++;
        else if (v === 'skipped') out.skipped++;
      }
      return out;
    });
  }

  private importMetric(r: unknown[], arrived: number): 'added' | 'had' | 'skipped' {
    const [at, person, date, metric, value] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person) || typeof date !== 'string' || !isMetricKey(metric) || typeof value !== 'number' || !Number.isFinite(value)) return 'skipped';
    const sql = this.io.sql;
    if (sql.exec('SELECT 1 AS x FROM metrics WHERE person = ? AND date = ? AND metric = ? AND at = ?', person, date, metric, at).toArray().length) return 'had';
    sql.exec('INSERT INTO metrics (at, person, date, metric, value, late) VALUES (?, ?, ?, ?, ?, ?)', at, person, date, metric, value, this.seeAt(at) ? arrived : null);
    return 'added';
  }

  private importEvent(r: unknown[], arrived: number): 'added' | 'had' | 'skipped' {
    const [at, person, id, type, raw] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isWho(person) || !isId(id) || typeof type !== 'string' || typeof raw !== 'string') return 'skipped';
    if (!(EVENT_TYPES as readonly string[]).includes(type)) return 'skipped';
    if (this.known(id)) return 'had';
    let d: unknown;
    try { d = JSON.parse(raw || '{}'); } catch { d = null; }
    const subject = isRec(d) ? eventSubject(type, d, person) : null;
    if (!isRec(d) || !subject) return 'skipped';
    const sql = this.io.sql;
    if (type === 'board') {
      if (!boardOpOf(d)) return 'skipped';
      const v = this.boardTarget(person, d);
      if (v.v !== 'append') {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
        return 'had';
      }
      if (v.drop) sql.exec('DELETE FROM events WHERE slot = ?', `board|${v.drop}`);
    }
    let json = raw || '{}';
    if (isFoodType(type)) {
      if (!FOOD_PARSE[type](d)) return 'skipped';
      const v = this.foodTarget(type, person, d);
      if (typeof v === 'string') {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
        return 'had';
      }
      if (type === 'food_repeat') json = JSON.stringify(v); // with the skipped days of the one it replaces
    }
    if (type === 'decor' && (decorOpOf(d) || tentOpOf(d) || layoutOpOf(d)) && this.decorTarget(person, d) !== 'append') {
      sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // beaten (or past the cap): only its id is kept
      return 'had';
    }
    const slot = eventSlot(type, person, subject, d, Date.parse(at));
    if (slot && type !== 'decor' && type !== 'board' && !isFoodType(type)) {
      const held = sql.exec<{ at: string }>('SELECT at FROM events WHERE slot = ?', slot).toArray()[0];
      if (held && held.at >= at) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // a later one of the slot is there already
        return 'had';
      }
      if (type === 'tally') json = this.tallyKept(person, d); // with the larger counts of the row it replaces
    }
    this.put(id, at, person, type, json, slot, this.seeAt(at) ? arrived : null);
    return 'added';
  }

  private importUpload(r: unknown[]): 'added' | 'skipped' {
    const [at, person, status, bytes, notes] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person)) return 'skipped';
    this.addUpload([at, person, String(status ?? ''), Number(bytes) || 0, String(notes ?? '')]);
    return 'added';
  }

  /** The newest `at` in the record (for a notice after an import), or null. */
  newestAt(): string | null {
    return this.lastAt ? new Date(this.lastAt).toISOString() : null;
  }

  /** Row counts per table (the import's check, the runbook). */
  counts(): Record<string, number> {
    const n = (t: string) => Number(this.io.sql.exec<{ n: number }>(`SELECT count(*) AS n FROM ${t}`).toArray()[0]?.n ?? 0);
    return { metrics: n('metrics'), events: n('events'), ids: n('ids'), uploads: n('uploads') };
  }

  /** Every row, as `load` takes them (the backup, docs/ops/runbook.md#7-backups): the load of a dump is the record. */
  dump(): { rows: Required<ImportRows> } {
    return { rows: { ...this.rowsSince(''), uploads: this.uploadRows() } };
  }

  /** The admin's `dump {limit?, after?}`: with `limit`, a page of the dump (the metrics and events as rowsPage pages
   *  them, the audit on the first page, `next` the `after` of the next); without, every row at once (dump). */
  dumpPage(o: Rec): { ok: true; rows: Required<ImportRows>; next?: string } | Fail {
    if (o.limit === undefined && o.after === undefined) return { ok: true, ...this.dump() };
    const after = o.after === undefined ? null : cursorOf(o.after);
    if (after === undefined || !isPageSize(o.limit)) return fail('bad_request');
    const p = this.rowsPage('', after, o.limit);
    return { ok: true, rows: { ...p.rows, uploads: after ? [] : this.uploadRows() }, ...(p.next ? { next: p.next } : {}) };
  }

  private uploadRows(): unknown[][] {
    return this.io.sql.exec<{ at: string; person: string; status: string; bytes: number; notes: string }>('SELECT at, person, status, bytes, notes FROM uploads ORDER BY seq').toArray()
      .map((r) => [r.at, r.person, r.status, r.bytes, r.notes]);
  }

  // ---------------------------------------------------------------- compaction

  /**
   * Drop the `metrics` rows of locked weeks the model can no longer read (contract/compact.ts compactKeep, the phones'
   * own rule: the same views, ~90 % fewer rows), a date at a time (its rows read by the (person, date, …) key), a week
   * of dates a transaction, at most `max` rows deleted a run. The dates looked at: on the first run every date; then
   * those with rows written (or loaded late) since the last run and those whose week locked since. A run that stopped
   * at `max` leaves its mark where it was, so the next one looks at them again (a compacted date is read, nothing
   * deleted). Events are never touched (their slots keep one row each already) and no id leaves `ids`.
   */
  compact(max = COMPACT_MAX): { dates: number; deleted: number; more: boolean; metrics: number } {
    const sql = this.io.sql;
    const now = this.io.now();
    const mark = this.meta('compact');
    const was = mark ? (JSON.parse(mark) as { at: string; now: number }) : null;
    const dates = new Set<string>();
    const add = (rows: { date: string }[]) => rows.forEach((r) => dates.add(r.date));
    if (!was) add(sql.exec<{ date: string }>('SELECT DISTINCT date FROM metrics').toArray());
    else {
      add(sql.exec<{ date: string }>('SELECT DISTINCT date FROM metrics WHERE at > ?', was.at).toArray());
      add(sql.exec<{ date: string }>('SELECT DISTINCT date FROM metrics WHERE late > ?', was.now).toArray());
      // the weeks that locked since: their dates (a week locks 9 days and 4 hours after its Monday began)
      for (let t = was.now - 10 * 86_400_000; t <= now + 86_400_000; t += 86_400_000) {
        const d = localDateAt(t), lock = weekLockMs(d);
        if (lock > was.now && lock <= now) dates.add(d);
      }
    }
    const due = [...dates].filter((d) => weekLockMs(d) <= now).sort();
    const newest = this.newestAt() ?? '';
    let deleted = 0, done = 0;
    for (let i = 0; i < due.length && deleted < max; i += COMPACT_DATES_PER_TX) {
      deleted += this.io.tx(() => {
        let n = 0;
        for (const date of due.slice(i, i + COMPACT_DATES_PER_TX)) {
          const rows = (['A', 'B'] as const).flatMap((p) => sql.exec<MetricCols & { seq: number; at: string }>(
            `SELECT seq, ${METRIC_COLS} FROM metrics WHERE person = ? AND date = ? ORDER BY at, seq`, p, date
          ).toArray());
          const keep = compactKeep(rows.map(metricRow), now);
          const gone = keep ? rows.filter((_, k) => !keep.has(k)).map((r) => r.seq) : [];
          for (let k = 0; k < gone.length; k += DELETE_CHUNK) {
            const part = gone.slice(k, k + DELETE_CHUNK);
            sql.exec(`DELETE FROM metrics WHERE seq IN (${part.map(() => '?').join(', ')})`, ...part);
          }
          n += gone.length;
          done++;
        }
        return n;
      });
    }
    const more = done < due.length;
    if (!more) this.setMeta('compact', JSON.stringify({ at: newest, now }));
    return { dates: done, deleted, more, metrics: this.counts().metrics };
  }
}

/** A page's place (contract/api.ts CURSOR_RE): the last row's `at`, its table and its seq. */
interface Cursor { at: string; t: 'm' | 'e'; seq: number }
/** A cursor from the wire, or undefined when it isn't one. */
function cursorOf(x: unknown): Cursor | undefined {
  const m = typeof x === 'string' ? CURSOR_RE.exec(x) : null;
  return m ? { at: m[1], t: m[2] as 'm' | 'e', seq: Number(m[3]) } : undefined;
}
const isPageSize = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= SNAPSHOT_PAGE_MAX;

type MetricCols = { at: string; person: PersonId; date: string; metric: MetricRow[3]; value: number };
type EventCols = { at: string; person: Who; id: string; type: EventRow[3]; data: string };
const METRIC_COLS = 'at, person, date, metric, value';
const EVENT_COLS = 'at, person, id, type, data';
const metricRow = (r: MetricCols): MetricRow => [r.at, r.person, r.date, r.metric, r.value];
const eventRow = (r: EventCols): EventRow => [r.at, r.person, r.id, r.type, r.data];
/** `at`, then `seq`. */
const byAt = (x: { at: string; seq: number }, y: { at: string; seq: number }): number => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.seq - y.seq);
