// The record (docs/backend.md#the-record): metrics, events and the ingest audit in the store Durable Object's SQLite,
// free of the Workers runtime so it is unit-testable (test/store.test.ts runs it on node:sqlite). One API for the app
// and the Shortcut: `{key, action, ...}` → `{ok, ...}`.
//
// - `at` is the record's clock: strictly increasing (max(now, last + 1 ms)), shared by the rows of one ingest.
// - An event id is accepted once, forever (`ids`: a replaced event's id still dedupes a late retry).
// - A slot (app contract/record.ts eventSlot) holds one event: a later one of the same slot replaces it, so a tally or an
//   island day is one row per person and day (a tally's counts the larger of the two rows', entry by entry: they only
//   grow), a cosmetic pref one per person, a goal one per person and Tokyo day, a decoration one per item, a board
//   post, a meal entry, a repeat, a recipe and a custom food one per id (each one's latest op).
// - A `sell` or a `buy` (the shop, contract/shop.ts) is kept only when the sender's own rows cover it: their tallies'
//   catches less their sells (the pocket), their sells' かいがら less their buys (shopLedger), a piece bought once.
// - A `farm` batch (the field, contract/farm.ts) keeps the ops the field and the sender's pocket allow, a harvest at the
//   yield the record reckons; a `buy_starts` only what their かいがら cover. A `wet` day is the record's own (wetTick).
// - An `sg_reward` (英語すごろく's かいがら, contract/shop.ts) is a row of each recipient's ledger (its `to`), whoever sent
//   it: kept when it pays at least one of them (a game pays each once), refused `reward paid` when it pays none.
// - `since` is answered from the `at` index. A row that arrives out of `at` order (an admin `load` of rows older
//   than the record's) is marked `late` with its arrival time, and a poll also returns the late rows that arrived after
//   `since` (less LATE_MARGIN_MS), so no phone misses one.
import { parseShortcut } from './parse.ts';
import { auditNotes, auditRow } from './audit.ts';
import { eventSlot } from '../../app/src/lib/contract/record.ts';
import { validEvent } from '../../app/src/lib/contract/shopCheck.ts';
import {
  CURSOR_RE, eventSubject, EVENTS_MAX, EVENT_TYPES, GROUP_MAX, isActivityMetric, isId, ISO_AT, isMetricKey, isPersonId, isWho, movesWallet, PREF_KEYS, PROFILE_PREF_KEYS, SNAPSHOT_PAGE_MAX,
  type ApiError, type EventRow, type Fail, type MetricRow, type SnapshotRows
} from '../../app/src/lib/contract/api.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { compactKeep, weekLockMs } from '../../app/src/lib/contract/compact.ts';
import { localDateAt, prevDay } from '../../app/src/lib/contract/tokyo.ts';
import { decorAccept, decorOpOf, type DecorEntry } from '../../app/src/lib/contract/decor.ts';
import { isTentPiece, tentAccept, tentOpOf, type TentEntry } from '../../app/src/lib/contract/tent.ts';
import { isRoomScope, isStanding, layoutAccept, layoutOpOf, scopeMayWrite, type LayoutEntry } from '../../app/src/lib/contract/layout.ts';
import { boardAccept, boardBeats, boardOpOf, cleanText, type BoardEntry } from '../../app/src/lib/contract/board.ts';
import { isPackType, packClean, PackBook, packRowOf, packSlot, PACK_TYPES, type PackVerdict } from '../../app/src/lib/contract/pack.ts';
import { isWedType, WedBook, wedClean, wedNeeds, wedRowOf, wedSlot, WNOTE_DATA_CHARS, type WedVerdict } from '../../app/src/lib/contract/wedding.ts';
import { foodAccept, foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp, repeatAccept, repeatNext, type RepeatOpBy } from '../../app/src/lib/contract/food.ts';
import { CALM_EVENTS, type Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { inbodyOf } from '../../app/src/lib/contract/bodyEst.ts';
import { verifyAdmin } from './sign.ts';
import { errName } from './log.ts';
import { isLogId, scrubMsg } from '../../app/src/lib/contract/log.ts';
import { roleOfKey, type Keys } from './auth.ts';
import { guestMayWrite, rowsFor } from '../../app/src/lib/contract/guest.ts';
import { saveName } from '../../app/src/lib/contract/roomSave.ts';
import { ADJUST_MAX, adjustOf, caughtOf, isShopEvent, reowe, rewardOf, shopLedger, shopRefusal, shopRowOf, shopStep, SHOP_EVENTS, type LedgerEvent, type Ledger, type ShopRow, type TallyDay } from '../../app/src/lib/contract/shop.ts';
import { pocketKey } from '../../app/src/lib/contract/pocket.ts';
import { emptyFarm, FARM, farmFromJson, farmJson, farmOf, farmStep, type Farm, type FarmData } from '../../app/src/lib/contract/farm.ts';
import { gameWet } from '../../app/src/lib/contract/wet.ts';
import { backCovered, isTally, mergeTally } from '../../app/src/lib/contract/tally.ts';
import { isIslandDay, mergeIslandDay } from '../../app/src/lib/contract/island.ts';
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
  /** The deployed commit (index.ts Env COMMIT): `health`'s and `whoami`'s `build` (`dev` without one). */
  build?: string;
  now(): number;
  /** Tell the open phones the record changed (the room's `changed`); best effort, after the commit. `guest`: whether
   *  the guest may hear of it (an ingest that brought activity rows; room.ts guestNotice). */
  notify(n: Notice, guest?: boolean): void;
  /** A stored row that isn't JSON (or not an object) was skipped, at `where` (a fold's name): the log's warning
   *  (`store.corrupt`), once a request per place. */
  corrupt?(where: string): void;
  /** The wallet's events to the log (shopState's `wallet.seed`, walletCheck's `wallet.drift`). */
  log?(e: 'wallet.seed' | 'wallet.drift', d: Record<string, string | number>): void;
}

export const RATE_PER_MINUTE = 120;
/** A snapshot's later pages (`after`) per key per minute: their own budget, so a cold fetch of a big record (a page
 *  each SNAPSHOT_PAGE rows) never spends the writes' (O9). */
export const PAGES_PER_MINUTE = 600;
const MAX_EVENT_DATA_CHARS = 20_000;
const UPLOADS_SHOWN = 20;
/** The running field's meta key, named by the growth rules its plots' `from` were reckoned under (contract/farm.ts
 *  FARM): a rule change finds no copy and folds the rows again, once (review 11/14: a 3-day copy refused 1-day harvests). */
const FARM_META = `farm|g${FARM.growDays}r${FARM.regrowDays}`;
/** The ingest audit keeps this long (ms): each ingest lets older rows go. */
const UPLOADS_KEEP_MS = 60 * 86_400_000;
/** A late row is returned to a poll whose `since` is at most this much after its arrival (the servers' clocks). */
export const LATE_MARGIN_MS = 10_000;
/** The admin ops taken once per signature (a replay within the window would restore, start an epoch or purge again). */
const ADMIN_ONCE = ['restore', 'rev', 'logpurge'];
/** How long their signatures are remembered: past the signature's own window (±5 minutes) on both sides. */
const ADMIN_SEEN_MS = 10 * 60_000;
/** Compaction (compact): at most this many metrics rows deleted a run. Each delete writes ~4 rows (the row, its `at`
 *  index, its unique key, the meta) against the Free plan's 100,000 a day; a week brings ~2,000 new rows to drop, so a
 *  run a day keeps up and a year's backlog goes in a few weeks. */
export const COMPACT_MAX = 5_000;
/** What the admin's `compact` must say to run (compactOp): it deletes Health history rows. */
export const COMPACT_CONFIRM = 'delete-health-history';
/** The cron's tick that compacts the record (index.ts scheduled): 19:15 UTC, 04:15 Tokyo, once a day. */
export const isCompactTick = (t: number): boolean => Math.floor((t % 86_400_000) / 60_000) === 19 * 60 + 15;
/** Seqs per DELETE (Durable Objects' SQLite binds at most 100 parameters). */
const DELETE_CHUNK = 90;
/** Dates compacted in one transaction. */
const COMPACT_DATES_PER_TX = 7;
const SEQ_MAX = 9e15;
const utf8 = new TextEncoder();

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

/**
 * The ordered migrations (meta `schema_v`: how many have run). Each runs once, in its own transaction, after SCHEMA;
 * a new table or index is a new step at the end, never an edit of one that shipped. A step that fills a table from the
 * rows already there is how it starts out right; from then on the writes keep it.
 */
const MIGRATIONS: readonly ((sql: Sql) => void)[] = [
  // 1 (2026-11-05): the shop's and the tallies' reads by person (O5)
  (sql) => void sql.exec('CREATE INDEX IF NOT EXISTS events_type_person ON events (type, person)'),
  // 2 (2026-11-05): each day's latest value per person and metric, so an ingest compares against it without reading
  // the body's days of history (O8). The history (`metrics`) is unchanged, append-only.
  (sql) => {
    sql.exec('CREATE TABLE IF NOT EXISTS metrics_latest (person TEXT NOT NULL, date TEXT NOT NULL, metric TEXT NOT NULL, at TEXT NOT NULL, seq INTEGER NOT NULL, value REAL NOT NULL, PRIMARY KEY (person, date, metric)) WITHOUT ROWID');
    sql.exec(`INSERT OR REPLACE INTO metrics_latest (person, date, metric, at, seq, value)
      SELECT person, date, metric, at, seq, value FROM (
        SELECT person, date, metric, at, seq, value, row_number() OVER (PARTITION BY person, date, metric ORDER BY at DESC, seq DESC) AS rn FROM metrics
      ) WHERE rn = 1`);
  },
  // 3 (2026-11-05): the values an ingest holds back rather than append (a past day's 0 over a value above it: a run
  // that read nothing, or a real correction), kept for good, never served; the admin lists and promotes them (R3)
  (sql) => void sql.exec('CREATE TABLE IF NOT EXISTS metrics_held (person TEXT NOT NULL, date TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL, at TEXT NOT NULL, last TEXT NOT NULL, n INTEGER NOT NULL, promoted TEXT, PRIMARY KEY (person, date, metric, value)) WITHOUT ROWID'),
  // 4 (2026-11-13): `events_type ON events (type)` dropped: events_type_person's leftmost column serves every read by
  // type, and the index cost a row written per event (review 11-13 B3)
  (sql) => void sql.exec('DROP INDEX IF EXISTS events_type'),
  // 5 (2026-11-19): the InBody readings (`body_in`, a row a metric) made `inbody` sheets (a row a day, the admin's:
  // contract/bodyEst.ts), then dropped: nothing of the からだ is typed in (the user, 2026-11-19). A new epoch after, so
  // the phones fetch the sheets (their `at` the readings')
  (sql) => {
    const sheets = new Map<string, { at: string; who: unknown; d: Rec }>();
    for (const r of sql.exec<{ at: string; person: string; data: string }>("SELECT at, person, data FROM events WHERE type = 'body_in' ORDER BY at, seq").toArray()) {
      let d: unknown;
      try { d = JSON.parse(r.data); } catch { continue; }
      if (!isRec(d) || typeof d.m !== 'string') continue;
      const who = d.person ?? r.person, k = `${String(who)}|${String(d.date)}`;
      const sh = sheets.get(k) ?? { at: r.at, who, d: { date: d.date } };
      sh.at = r.at;
      sh.d[d.m] = d.v;
      sheets.set(k, sh);
    }
    for (const sh of sheets.values()) {
      const data = inbodyOf(sh.d);
      if (!data || !isPersonId(sh.who)) continue;
      const id = `inbody-${sh.who}-${data.date}`;
      sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
      sql.exec("INSERT OR REPLACE INTO events (id, at, person, type, data, slot, late) VALUES (?, ?, ?, 'inbody', ?, ?, NULL)", id, sh.at, sh.who, JSON.stringify(data), `inbody|${sh.who}|${data.date}`);
    }
    if (sheets.size) sql.exec("UPDATE meta SET v = 'e' || (CAST(substr(v, 2) AS INTEGER) + 1) WHERE k = 'rev'");
    sql.exec("DELETE FROM events WHERE type = 'body_in'");
  }
];
export const SCHEMA_V = MIGRATIONS.length;

/** The rows a load brings (the admin `load`: a dump's), each with its `at`. */
export interface ImportRows {
  metrics?: unknown[][];
  events?: unknown[][];
  uploads?: unknown[][];
  /** metrics_held's rows: `[at, person, date, metric, value, last, n, promoted]` (HeldRow). */
  held?: unknown[][];
}

export interface ImportResult {
  metrics: number; events: number; uploads: number; skipped: number; held?: number;
  /** Of `skipped`: a `pref` row of a key the model no longer reads, a profile row its locked slot already holds. */
  refused?: { prefKey: number; profileLocked: number };
}

/** A value an ingest held back (metrics_held): first held at `at`, last seen at `last`, `n` times; `promoted` when the
 *  admin made it a row of `metrics` (null: never). */
export interface HeldRow { person: string; date: string; metric: string; value: number; at: string; last: string; n: number; promoted: string | null }

type Reply = Rec & { ok: boolean };

/** An event's `group` in an `events` batch (store.ts group), or null. */
const groupOf = (e: unknown): string | null => (isRec(e) && isId(e.group) ? e.group : null);
/** Thrown to roll a group's transaction back (store.ts group). */
class GroupRefused extends Error {}
/** A dump's rows: the held values only when there are some. */
type DumpRows = Required<Omit<ImportRows, 'held'>> & Pick<ImportRows, 'held'>;

export class StoreCore {
  private lastAt: number;
  private rate = { minute: 0, A: 0, B: 0, G: 0 };
  private pages = { minute: 0, A: 0, B: 0, G: 0 };
  private exc: string | null = null;
  /** The request's page session (its body's `sid`): an event's notice carries it, so that page alone skips it. */
  private sid: string | undefined;
  /** The places a corrupt row was skipped this request (each told once). */
  private told = new Set<string>();

  constructor(private io: StoreIO) {
    for (const s of SCHEMA) io.sql.exec(s);
    this.migrate();
    // another relay's copy of the field (a rollback to other rules, or to before FARM_META) means rows this copy lacks:
    // both go, and the first farm op folds them again (review 11/14 r3: a dig kept by the older relay, harvested again)
    if (io.sql.exec("SELECT 1 FROM meta WHERE (k = 'farm' OR k LIKE 'farm|%') AND k != ? LIMIT 1", FARM_META).toArray().length) io.sql.exec("DELETE FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'");
    this.lastAt = Number(this.meta('last_at') ?? 0);
    if (this.meta('rev') === null) this.setMeta('rev', 'e1');
  }

  /** The migrations not run yet, in order (meta `schema_v`), each with its mark in one transaction. */
  private migrate(): void {
    const v = Number(this.meta('schema_v') ?? 0);
    for (let i = v; i < MIGRATIONS.length; i++) {
      this.io.tx(() => {
        MIGRATIONS[i](this.io.sql);
        this.setMeta('schema_v', String(i + 1));
      });
    }
  }

  /** The schema's version (the migrations run): `counts` says it. */
  schemaV(): number {
    return Number(this.meta('schema_v') ?? 0);
  }

  /** A metrics row appended (or loaded): the day's latest value moves to it when it is later (metrics_latest). */
  private noteLatest(person: string, date: string, metric: string, at: string, seq: number, value: number): void {
    this.io.sql.exec(
      `INSERT INTO metrics_latest (person, date, metric, at, seq, value) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (person, date, metric) DO UPDATE SET at = excluded.at, seq = excluded.seq, value = excluded.value
       WHERE excluded.at > metrics_latest.at OR (excluded.at = metrics_latest.at AND excluded.seq > metrics_latest.seq)`,
      person, date, metric, at, seq, value
    );
  }

  /** A date's latest values again from its rows (after rows of it were deleted). */
  private relatest(date: string): void {
    this.io.sql.exec('DELETE FROM metrics_latest WHERE date = ?', date);
    this.io.sql.exec(`INSERT INTO metrics_latest (person, date, metric, at, seq, value)
      SELECT person, date, metric, at, seq, value FROM (
        SELECT person, date, metric, at, seq, value, row_number() OVER (PARTITION BY person, metric ORDER BY at DESC, seq DESC) AS rn FROM metrics WHERE date = ?
      ) WHERE rn = 1`, date);
  }

  /** Append a metrics row and keep the day's latest (the one way rows go into `metrics`). */
  private addMetric(at: string, person: string, date: string, metric: string, value: number, late: number | null): void {
    const r = this.io.sql.exec<{ seq: number }>('INSERT INTO metrics (at, person, date, metric, value, late) VALUES (?, ?, ?, ?, ?, ?) RETURNING seq', at, person, date, metric, value, late).toArray()[0];
    this.noteLatest(person, date, metric, at, Number(r.seq), value);
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

  /** Within the key's minute: RATE_PER_MINUTE requests, and apart from them PAGES_PER_MINUTE snapshot pages after
   *  the first (`page`: a later page's). */
  private underRateLimit(me: Who, page = false): boolean {
    const minute = Math.floor(this.io.now() / 60_000);
    const b = page ? this.pages : this.rate;
    if (b.minute !== minute) Object.assign(b, { minute, A: 0, B: 0, G: 0 });
    return ++b[me] <= (page ? PAGES_PER_MINUTE : RATE_PER_MINUTE);
  }

  /** Set while a restore is under way (storeObject.ts restore): every request is `unavailable` (the phones retry) until
   *  the object restarts on the bookmark, so nothing is acknowledged that the restore then drops. In memory only: the
   *  restart is its end. */
  private frozen = false;

  /** A restore begins (before its bookmark is set): no request is answered but `unavailable` from now on. */
  freeze(): void {
    this.frozen = true;
  }

  /** The restore didn't go ahead (its bookmark refused): requests are answered again. */
  thaw(): void {
    this.frozen = false;
  }

  /** An API request's parsed body (`bytes`: its size, for the audit). Never throws. */
  handle(body: unknown, bytes: number): Reply {
    this.exc = null;
    this.told.clear();
    this.sid = isRec(body) && isLogId(body.sid) ? body.sid : undefined;
    if (this.frozen) return fail('unavailable', 'restoring');
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
    if (!(await verifyAdmin(this.io.keys, t, sig, text, this.io.now()))) return { status: 401, body: 'unauthorized' };
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
    if (!isRec(rows) || !(['metrics', 'events', 'uploads', 'held'] as const).every((k) => rows[k] === undefined || Array.isArray(rows[k]))) return { ok: false, error: 'bad_request' };
    const r = this.import(rows as ImportRows);
    if (r.metrics + r.events) this.tellAll();
    return { ok: true, ...r, counts: this.counts() };
  }

  private route(body: unknown, bytes: number): Reply {
    if (!isRec(body)) return fail('bad_request');
    if (body.action === 'health' && body.key === undefined) return { ok: true, build: this.io.build ?? 'dev' };
    const me = roleOfKey(body.key, this.io.keys);
    if (!me) return fail('unauthorized');
    if (!this.underRateLimit(me, body.action === 'snapshot' && body.page !== undefined && body.after !== undefined)) return fail('busy');
    // the guest (docs/backend.md#the-guest): no health data in, no audit to read
    if (me === 'G' && (body.action === 'ingest' || body.action === 'uploads')) return fail('forbidden');
    switch (body.action) {
      case 'ingest': return this.ingest(me as PersonId, body, bytes);
      case 'event': return this.event(me, body);
      case 'events': return this.events(me, body);
      case 'snapshot': return this.snapshot(me, body);
      case 'uploads': return this.uploads(me);
      case 'whoami': return { ok: true, me, build: this.io.build ?? 'dev' };
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
    // paged (`page`: rows at most, `after`: the last page's `next`); without `page` every row at once, as before: an
    // app from before paging (5a40fa6c, 2026-11-05) never reads `next`, so a reply cut short would lose rows for good
    // (O7: kept unpaged for them; the log's `req` says `pg` 0, so their end shows in `npm run logs`)
    let page: { limit: number; after: Cursor | null } | null = null;
    if (body.page !== undefined) {
      const after = body.after === undefined ? null : cursorOf(body.after);
      if (!isPageSize(body.page) || after === undefined) return fail('bad_request');
      page = { limit: body.page, after };
    } else if (body.after !== undefined) return fail('bad_request');
    // the guest's: the activity and the events, never a からだ row, a からだ goal or a member's profile; a member's:
    // never the guest's profile (contract/guest.ts rowsFor)
    // (and the かいがら: the relay's wallets, the phones' number since 2026-11-18, walletsFor; with a first fetch or
    // rows only, as a wallet moves only with a row kept, so a poll with nothing new still reads nothing; read before
    // the head's rev, as an older relay's ledger read starts a new epoch: shopState)
    const wallets = (rows: SnapshotRows) => (!since || rows.metrics.length || rows.events.length ? { wallets: this.walletsFor(me) } : {});
    const head = () => ({ ok: true, me, now: new Date(this.io.now()).toISOString(), rev: this.rev() });
    if (!page) {
      const rows = this.rowsSince(since), w = wallets(rows);
      return { ...head(), rows: rowsFor(me, rows), ...w };
    }
    const p = this.rowsPage(since, page.after, page.limit), w = wallets(p.rows);
    return { ...head(), rows: rowsFor(me, p.rows), ...(p.next ? { next: p.next } : {}), ...w };
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
    let added: { n: number; at: string | null; act: boolean };
    try {
      added = this.ingestRows(me, parsed, bytes, body);
    } catch (err) {
      // the run rolled back, its audit row with it: an `error` row of its own after, so the failure is seen
      // (`unavailable`, the Shortcut's next run sends it again)
      this.io.tx(() => this.audit(auditRow(this.nextAt(), me, 'error', bytes, `not saved: ${errName(err)}`, body)));
      throw err;
    }
    // (the guest hears of it only when it brought rows the guest sees: room.ts guestNotice)
    if (added.at) this.io.notify({ what: 'ingest', who: me, at: added.at, rev: this.rev() }, added.act);
    return {
      ok: true, metrics: added.n,
      ...(parsed.skipped ? { skipped: parsed.skipped } : {}),
      ...(parsed.warnings.length ? { warnings: parsed.warnings } : {})
    };
  }

  /** An ingest's rows and its audit row, in one transaction. */
  private ingestRows(me: PersonId, parsed: ReturnType<typeof parseShortcut>, bytes: number, body: Rec): { n: number; at: string | null; act: boolean } {
    return this.io.tx(() => {
      const at = this.nextAt();
      // Apple Health's current total is the truth: a day's value is its latest row, and a different one is appended
      // (up or down). Read from metrics_latest over the body's days only (one row a day and metric, never the history).
      const latest = new Map<string, number>();
      const days = parsed.metrics.map((m) => m.date).sort();
      if (days.length) {
        const rows = this.io.sql.exec<{ date: string; metric: string; value: number }>(
          'SELECT date, metric, value FROM metrics_latest WHERE person = ? AND date >= ? AND date <= ?', me, days[0], days[days.length - 1]
        ).toArray();
        for (const r of rows) latest.set(`${r.date}|${r.metric}`, r.value);
      }
      // a past Tokyo day never drops to 0 from a value above it: a run that read nothing (Health locked, Fill
      // Missing's 0 for every day) would rewrite the history; today may still go down to 0
      const today = localDateAt(this.io.now());
      let n = 0, zeros = 0, act = false;
      for (const m of parsed.metrics) {
        const k = `${m.date}|${m.metric}`;
        if (latest.get(k) === m.value) continue;
        if (m.value === 0 && m.date < today && (latest.get(k) ?? 0) > 0) {
          // held, never thrown away (the user's rule: keep all Health data): apart from the history, never served,
          // the admin's to promote (heldRows, promoteHeld)
          this.hold(me, m.date, m.metric, m.value, at, 1, null);
          zeros++;
          continue;
        }
        latest.set(k, m.value);
        this.addMetric(at, me, m.date, m.metric, m.value, null);
        n++;
        act ||= isActivityMetric(m.metric);
      }
      const notes = [zeros ? `${zeros} past zeros held` : '', auditNotes(parsed)].filter(Boolean).join('; ');
      this.audit(auditRow(at, me, parsed.skipped ? 'partial' : 'ok', bytes, notes, body));
      return n ? { n, at, act } : { n, at: null, act };
    });
  }

  /** A held value (metrics_held) seen at `at` (`n` times; a load's row brings its own `last`, `n` and mark). */
  private hold(person: string, date: string, metric: string, value: number, at: string, n: number, promoted: string | null, last = at): void {
    this.io.sql.exec(
      `INSERT INTO metrics_held (person, date, metric, value, at, last, n, promoted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (person, date, metric, value) DO UPDATE SET last = max(last, excluded.last), n = CASE WHEN excluded.last > last THEN n + excluded.n ELSE max(n, excluded.n) END, promoted = coalesce(promoted, excluded.promoted)`,
      person, date, metric, value, at, last, n, promoted
    );
  }

  /** The held values (the admin's `held {person?}`), oldest first. */
  heldRows(person?: string): HeldRow[] {
    const q = 'SELECT person, date, metric, value, at, last, n, promoted FROM metrics_held';
    return (person ? this.io.sql.exec<HeldRow & Record<string, Bind>>(`${q} WHERE person = ? ORDER BY at, date, metric`, person) : this.io.sql.exec<HeldRow & Record<string, Bind>>(`${q} ORDER BY at, date, metric`))
      .toArray().map((r) => ({ person: r.person, date: r.date, metric: r.metric, value: r.value, at: r.at, last: r.last, n: Number(r.n), promoted: r.promoted ?? null }));
  }

  /** The admin's `promote {person, date, metric, value?}`: a held value made a row of `metrics` (the day's latest
   *  now, as an ingest's), the held row kept with its mark. `value`: which, when more than one is held (else the
   *  last seen). */
  promoteHeld(o: Rec): Record<string, unknown> {
    if (!isPersonId(o.person) || typeof o.date !== 'string' || !isMetricKey(o.metric) || (o.value !== undefined && typeof o.value !== 'number')) return fail('bad_request');
    const { person, date, metric } = o as { person: PersonId; date: string; metric: string };
    const r = this.io.tx(() => {
      const h = this.io.sql.exec<{ value: number }>(
        `SELECT value FROM metrics_held WHERE person = ? AND date = ? AND metric = ?${o.value !== undefined ? ' AND value = ?' : ''} ORDER BY last DESC LIMIT 1`,
        ...([person, date, metric, ...(o.value !== undefined ? [o.value as number] : [])] as Bind[])
      ).toArray()[0];
      if (!h) return fail('bad_request', 'nothing held');
      const cur = this.io.sql.exec<{ value: number }>('SELECT value FROM metrics_latest WHERE person = ? AND date = ? AND metric = ?', person, date, metric).toArray()[0];
      if (cur && cur.value === h.value) return fail('bad_request', 'is the latest');
      const at = this.nextAt();
      this.addMetric(at, person, date, metric, h.value, null);
      this.io.sql.exec('UPDATE metrics_held SET promoted = ? WHERE person = ? AND date = ? AND metric = ? AND value = ?', at, person, date, metric, h.value);
      return { ok: true as const, at, value: h.value };
    });
    if (r.ok) this.io.notify({ what: 'ingest', who: person, at: (r as { at: string }).at, rev: this.rev() }, isActivityMetric(metric));
    return r;
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
    if (r.ok && r.at) this.io.notify({ what: 'event', who: me, at: r.at, rev: this.rev(), ...(this.sid ? { sid: this.sid } : {}), ...(calmType(body.type) ? { calm: true } : {}) });
    const { at: _at, ...reply } = r;
    const touched = walletsTouched(me, [body]);
    return touched.size ? { ...reply, wallets: this.walletsFor(me, touched) } : reply;
  }

  /**
   * `events: [{id, type, data, group?}, …]` (≤ EVENTS_MAX; one group alone ≤ GROUP_MAX), kept in order, each as `event` would: `{ok, results}`, one
   * per event (`{id, ok, duplicate?, at?}` or `{id, ok: false, error, detail?}`), `at` the stored row's. One notice for
   * the lot. An event whose write throws is `unavailable` alone (nothing of it kept), never the batch. A `group` (the
   * shop's ぜんぶ: one id, its events side by side) is all or none, in one transaction (`group`).
   */
  private events(me: Who, body: Rec): Reply {
    const list = body.events;
    // (one group alone may be up to GROUP_MAX: a room's whole change, all or none)
    const oneGroup = Array.isArray(list) && list.length <= GROUP_MAX && !!groupOf(list[0]) && list.every((e) => groupOf(e) === groupOf(list[0]));
    if (!Array.isArray(list) || !list.length || (list.length > EVENTS_MAX && !oneGroup)) return fail('bad_request');
    let last: string | null = null, calm = true;
    const results: (Reply & { id: string | null })[] = [];
    for (let i = 0; i < list.length; ) {
      const g = groupOf(list[i]);
      let j = i + 1;
      while (g && j < list.length && groupOf(list[j]) === g) j++;
      const part = list.slice(i, j);
      const rs = g ? this.group(me, part) : [this.keepOne(me, part[0])];
      for (const [k, r] of rs.entries()) {
        const e = part[k];
        if (r.ok && r.at) (last = r.at), (calm &&= isRec(e) && calmType(e.type));
        const { at, ...rest } = r;
        results.push({ id: isRec(e) && typeof e.id === 'string' ? e.id : null, ...rest, ...(at ? { at } : {}) });
      }
      i = j;
    }
    if (last) this.io.notify({ what: 'event', who: me, at: last, rev: this.rev(), ...(this.sid ? { sid: this.sid } : {}), ...(calm ? { calm: true } : {}) });
    // (the wallets the batch may have moved, kept or refused: a phone keeps each one's highest `seq`)
    const touched = walletsTouched(me, list);
    return { ok: true, results, ...(touched.size ? { wallets: this.walletsFor(me, touched) } : {}) };
  }

  /** One event of a batch kept as `keep` would; a write that throws is `unavailable` (its transaction rolled back, its
   *  id still free for a retry). Its class only is logged (a message can quote the body). */
  private keepOne(me: Who, e: unknown, tx?: <R>(fn: () => R) => R): Reply & { at?: string } {
    try {
      return isRec(e) ? this.keep(me, e, tx) : fail('bad_request');
    } catch (err) {
      this.exc = errName(err);
      console.error('store', this.exc, scrubMsg(err instanceof Error ? err.message : ''));
      return fail('unavailable');
    }
  }

  /**
   * A group's events (the shop's ぜんぶ かう: one `buy` a piece) kept all or none, in one transaction: a retry of a
   * group kept is each a duplicate; a buy of a piece the sender has already (their other phone got there first) is
   * refused `owned` alone and costs nothing, the rest kept; any other refusal (`wallet short`: their かいがら spent
   * meanwhile) or a write that throws rolls the lot back, that one answered as it was and the others `group`
   * (`unavailable` for a throw: the phone sends them all again).
   */
  private group(me: Who, part: readonly unknown[]): (Reply & { at?: string })[] {
    const out: (Reply & { at?: string })[] = [];
    let bad: { i: number; r: Reply } | null = null;
    try {
      this.io.tx(() => {
        for (const [i, e] of part.entries()) {
          const r = isRec(e) ? this.keep(me, e, (fn) => fn()) : fail('bad_request');
          if (!r.ok && !(r.error === 'bad_request' && r.detail === 'owned')) {
            bad = { i, r };
            throw new GroupRefused();
          }
          out.push(r);
        }
      });
    } catch (err) {
      if (!(err instanceof GroupRefused)) {
        this.exc = errName(err);
        console.error('store', this.exc, scrubMsg(err instanceof Error ? err.message : ''));
        return part.map(() => fail('unavailable'));
      }
    }
    const b = bad as { i: number; r: Reply } | null;
    return b ? part.map((_, i) => (i === b.i ? b.r : fail('bad_request', 'group'))) : out;
  }

  /** One event checked and kept (or acknowledged): the reply, with the stored row's `at` when one was written. */
  private keep(me: Who, body: Rec, tx: <R>(fn: () => R) => R = (fn) => this.io.tx(fn)): Reply & { at?: string } {
    const id = body.id;
    if (!isId(id)) return fail('bad_request');
    // a retry of an event already kept is acknowledged before any check: its time rules may have lapsed since (a buy
    // retried two days on), and a refusal would drop it on the phone with an error while the record holds it
    if (this.known(id)) return { ok: true, duplicate: true };
    if (typeof body.type !== 'string' || !(EVENT_TYPES as readonly string[]).includes(body.type)) return fail('bad_request');
    const sent = body.data === undefined ? {} : body.data;
    if (!isRec(sent)) return fail('bad_request');
    // a board note's text: plain text, sanitised here as on the phone (contract/board.ts cleanText)
    // a meal entry, a repeat, a recipe or a custom food as the phone keeps it: names cleaned, grams to one decimal
    // (contract/food.ts)
    const data: Rec = body.type === 'board' && typeof sent.t === 'string' ? { ...sent, t: cleanText(sent.t) }
      : isFoodType(body.type) ? (FOOD_PARSE[body.type](sent) ?? sent)
      // a packing list's names and notes, a trip note's values: one clean line each (contract/pack.ts packClean)
      : isPackType(body.type) ? packClean(body.type, sent)
      // the wedding board's titles, categories and settings: one clean line each (contract/wedding.ts wedClean)
      : isWedType(body.type) ? wedClean(body.type, sent)
      // a saved room's name: one clean line (contract/roomSave.ts saveName)
      : body.type === 'room_save' && typeof sent.name === 'string' ? { ...sent, name: saveName(sent.name) } : sent;
    // the profile is locked (2026-11-15): no one sets or clears a sex or a birth date; a change
    // takes a code change (docs/backend.md `pref`). An older app drops it as any `forbidden`.
    if (body.type === 'pref' && PROFILE_PREF_KEYS.includes(data.key as string)) return fail('forbidden', 'profile locked');
    // the guest writes everything on the island a member does, never the economy, a goal of the members' or the
    // members' own records (contract/guest.ts)
    if (me === 'G' && !guestMayWrite(body.type, data)) return fail('forbidden');
    // a scoped decor op: a home's look and room its owner's, the outdoors anyone's (contract/layout.ts)
    if (body.type === 'decor' && !scopeMayWrite(me, data)) return fail('forbidden');
    const json = JSON.stringify(data);
    // (the wedding note its own cap: a document, contract/wedding.ts)
    if (json.length > (body.type === 'wnote' ? WNOTE_DATA_CHARS : MAX_EVENT_DATA_CHARS)) return fail('too_large');
    const subject = eventSubject(body.type, data, me);
    if (!subject || !validEvent(body.type, data, this.io.now())) return fail('bad_request');
    const type = body.type;
    return tx((): Reply & { at?: string } => {
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
          return this.stale(id);
        }
      }
      if (isShopEvent(type)) {
        // the shop: only what the sender's pocket holds, only what their かいがら cover, a piece once (contract/shop.ts)
        const why = this.shopTarget(me, type, data);
        if (why) return fail('bad_request', why === 'owned' ? 'owned' : `${why} short`);
      }
      // 英語すごろく's reward: kept while it pays one of its recipients (contract/shop.ts: a game pays each once)
      const rewardTo = type === 'sg_reward' ? rewardOf(data)?.to ?? [] : [];
      if (type === 'sg_reward' && rewardTo.every((who) => this.shopTarget(who, type, data))) return fail('bad_request', 'reward paid');
      let drop: string | null = null;
      if (type === 'board') {
        const v = this.boardTarget(me, data);
        if (v.v === 'forbidden') return fail('forbidden');
        if (v.v === 'stale') {
          return this.stale(id);
        }
        if (v.v === 'append') drop = v.drop;
      }
      let kept = json;
      let bookDrop: string[] = [];
      if (isPackType(type) || isWedType(type)) {
        // a trip's packing list (the guest changes only what it added, each person only their own ticks, the members
        // the notes; the trip's cap: contract/pack.ts PackBook) or the wedding board (the members' only, a subtask
        // only under a task held, the cap: contract/wedding.ts WedBook): an op beaten by the one held is acknowledged;
        // kept as the rules keep it (a note saved over one it wasn't edited from carries that one)
        const kind = isPackType(type) ? 'pack' : 'wedding';
        const v = kind === 'pack' ? this.packTarget(me, type, data) : this.wedTarget(me, type, data);
        if (v.v !== 'append') {
          if (v.v === 'forbidden') return fail('forbidden');
          if (v.v !== 'stale') return fail('bad_request', `${kind} ${v.v}`);
          return this.stale(id);
        }
        bookDrop = v.drop;
        kept = JSON.stringify(v.row.op);
      }
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
          return this.stale(id);
        }
        kept = JSON.stringify(v);
      }
      // a day's tally only grows: the slot keeps each entry's larger count of the held row and this one, so a stale
      // lower send (a second phone's, a queue that waited) never takes back a catch a sale counted (contract/tally.ts)
      if (type === 'tally') kept = this.tallyKept(me, data);
      if (type === 'island') kept = this.islandKept(me, data);
      // the field: the ops it allows, a harvest at the record's yield (contract/farm.ts farmStep); none: refused
      const farm = type === 'farm' ? this.farmKept(me, data) : null;
      if (type === 'farm') {
        if (!farm) return fail('bad_request', 'farm refused');
        kept = JSON.stringify(farm.data);
      }
      // what's given back of a day (a claim race lost after its tally came in): only grows, and only what that day's
      // tally holds (contract/tally.ts backCovered)
      if (type === 'tally_back') {
        kept = this.tallyKept(me, data, 'tally_back');
        if (!backCovered(this.heldTally(me, String(data.date)), (JSON.parse(kept) as { counts: Record<string, number> }).counts)) return fail('bad_request', 'tally short');
      }
      const at = this.nextAt();
      if (drop) this.io.sql.exec('DELETE FROM events WHERE slot = ?', `board|${drop}`);
      for (const sl of bookDrop) this.io.sql.exec('DELETE FROM events WHERE slot = ?', sl);
      if (type === 'decor' && data.sc === 'r' && typeof data.at === 'number') this.dropVoided(data.at);
      const slot = eventSlot(type, me, subject, data, Date.parse(at));
      const wasDecor = type === 'decor' && slot ? this.io.sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null : null;
      // the running shop ledger (shopNote): a tally's or a give-back's change is the kept row less the one it replaces
      const was = (type === 'tally' || type === 'tally_back') && slot ? this.slotTally(slot) : null;
      // (each ledger it moves made ready first: a step goes into the wallet as it was before this row; shopState)
      const ledgers = type === 'tally' || type === 'tally_back' || isShopEvent(type) ? [me] : rewardTo;
      for (const who of ledgers) this.shopState(who);
      this.put(id, at, me, type, kept, slot, null);
      if (type === 'tally' || type === 'tally_back' || isShopEvent(type)) this.shopNote(me, type, kept, was);
      for (const who of rewardTo) this.shopNote(who, 'sg_reward', kept, null);
      if (farm) this.farmNote(me, farm.f, farm.before);
      if (type === 'decor') this.decorNote(me, data, wasDecor);
      return { ok: true, at };
    });
  }

  /** An op beaten by the one held (a board's, a book's, a food's, a decoration's): only its id kept, acknowledged. */
  private stale(id: string): Reply {
    this.io.sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
    return { ok: true, duplicate: true };
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
   *  decorAccept, contract/tent.ts tentAccept, contract/layout.ts layoutAccept). Only the op's own slots' rows are read
   *  (the piece's and its light switch's, the layout's reset) and the cap's count is the record's own (decorLive);
   *  until 2026-11-05 every op parsed every decor row. */
  private decorTarget(me: Who, d: Rec): 'append' | 'stale' | 'full' {
    const kind = d.sc === undefined ? 'island' : isRoomScope(d.sc) ? 'room' : 'layout';
    const parse = (x: Rec) => (kind === 'room' ? tentOpOf(x) : kind === 'layout' ? layoutOpOf(x) : decorOpOf(x));
    const e = { ...parse(d)!, who: me };
    const sc = typeof d.sc === 'string' ? d.sc : '';
    const slots = kind === 'room' ? [`decor|${sc}|${String(d.id)}`, `decor|${sc}|${String(d.id)}|l`] : kind === 'layout' ? [`decor|${sc}|${String(d.id)}`, 'decor|r|reset'] : [`decor||${String(d.id)}`];
    const held: (DecorEntry | TentEntry | LayoutEntry)[] = [];
    for (const r of this.io.sql.exec<{ person: string; data: string }>(`SELECT person, data FROM events WHERE slot IN (${slots.map(() => '?').join(', ')})`, ...slots).toArray()) {
      const x = this.rowRec(r.data, 'decor');
      const op = x && isWho(r.person) ? parse(x) : null;
      if (op) held.push({ ...op, who: r.person } as DecorEntry | TentEntry | LayoutEntry);
    }
    const fam = kind === 'island' ? '' : kind === 'room' ? sc : sc === 'o' ? 'o' : null;
    const live = fam === null ? undefined : this.decorLive()[fam] ?? 0;
    if (kind === 'room') return tentAccept(held as TentEntry[], e as TentEntry, live);
    if (kind === 'layout') return layoutAccept(held as LayoutEntry[], e as LayoutEntry, live);
    return decorAccept(held as DecorEntry[], e as DecorEntry, live);
  }

  /** What counts toward a decor cap, per family (`''` the island's decorations, `t` `u` `v` the rooms' pieces, `o` the
   *  outdoors' pieces standing): meta `decor_live`, kept by each decor op (decorNote), counted from the rows when it
   *  isn't there (after a load or a reset). */
  private decorLive(): Record<string, number> {
    const raw = this.meta('decor_live');
    if (raw) {
      try {
        const x = JSON.parse(raw) as unknown;
        if (isRec(x)) return x as Record<string, number>;
      } catch { /* counted again */ }
    }
    const n: Record<string, number> = { '': 0, t: 0, u: 0, v: 0, o: 0 };
    const reset = this.layoutReset();
    for (const r of this.decorRows()) {
      const f = this.decorFamily(r.d, r.person, reset);
      if (f?.live) n[f.fam]++;
    }
    this.setMeta('decor_live', JSON.stringify(n));
    return n;
  }

  /** The layout's reset in force (its `at`; 0: none). */
  private layoutReset(): number {
    const r = this.io.sql.exec<{ data: string }>("SELECT data FROM events WHERE slot = 'decor|r|reset'").toArray()[0];
    const x = r ? this.rowRec(r.data, 'decor') : null;
    const op = x ? layoutOpOf(x) : null;
    return op?.sc === 'r' ? op.at : 0;
  }

  /** A decor row's cap family and whether it counts there (null: no cap of its own: a chunk, a reset, a home's look). */
  private decorFamily(d: Rec, who: Who, reset: number): { fam: string; live: boolean } | null {
    if (d.sc === undefined) {
      const op = decorOpOf(d);
      return op ? { fam: '', live: !op.rm } : null;
    }
    if (isRoomScope(d.sc)) {
      const op = tentOpOf(d);
      return op ? { fam: d.sc, live: isTentPiece({ ...op, who } as TentEntry) } : null;
    }
    const op = d.sc === 'o' ? layoutOpOf(d) : null;
    return op ? { fam: 'o', live: isStanding({ ...op, who } as LayoutEntry, reset) } : null;
  }

  /** A kept decor op into the caps' counts (`was`: the row its slot held before): its family's count moves by what it
   *  stands for less what that row did. A reset lets the counts go (counted again, once, at the next op). */
  private decorNote(me: Who, d: Rec, was: { person: string; data: string } | null): void {
    if (d.sc === 'r') return void this.io.sql.exec("DELETE FROM meta WHERE k = 'decor_live'");
    const raw = this.meta('decor_live');
    if (!raw) return;
    const reset = d.sc === 'o' ? this.layoutReset() : 0;
    const now = this.decorFamily(d, me, reset);
    const wx = was ? this.rowRec(was.data, 'decor') : null;
    const before = wx && was && isWho(was.person) ? this.decorFamily(wx, was.person, reset) : null;
    const delta = (now?.live ? 1 : 0) - (before?.live ? 1 : 0);
    if (!delta || !now) return;
    const n = JSON.parse(raw) as Record<string, number>;
    n[now.fam] = (n[now.fam] ?? 0) + delta;
    this.setMeta('decor_live', JSON.stringify(n));
  }

  /** The admin's `decorcheck`: the caps' kept counts against the rows' (`fix`: the rows' taken). */
  decorCheck(o: Rec = {}): Record<string, unknown> {
    const kept = this.meta('decor_live');
    this.io.sql.exec("DELETE FROM meta WHERE k = 'decor_live'");
    const counted = this.decorLive();
    if (kept && o.fix !== true) this.setMeta('decor_live', kept);
    return { ok: true, kept: kept ? JSON.parse(kept) : null, counted };
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

  /** A trip's packing rows (its list's ops, everyone's ticks and resets, its note), each slot's latest. */
  private packBook(trip: string): PackBook {
    const b = new PackBook();
    // (a trip id is [a-z0-9-]: nothing GLOB reads as a pattern)
    const rows = this.io.sql.exec<{ person: string; type: string; data: string }>(
      `SELECT person, type, data FROM events WHERE type IN (${PACK_TYPES.map(() => '?').join(', ')}) AND (slot GLOB ? OR slot GLOB ? OR slot GLOB ? OR slot = ?)`,
      ...PACK_TYPES, `pack|${trip}|*`, `pack_chk|${trip}|*`, `pack_reset|${trip}|*`, `trip_note|${trip}`
    ).toArray();
    for (const r of rows) {
      const x = this.rowRec(r.data, 'pack');
      const row = x && isWho(r.person) ? packRowOf(r.type, x, r.person) : null;
      if (row) b.put(row);
    }
    return b;
  }

  /** A packing op against the trip's rows the record holds (contract/pack.ts PackBook accept). */
  private packTarget(me: Who, type: string, d: Rec): PackVerdict {
    const row = packRowOf(type, d, me);
    return row ? this.packBook(row.op.trip).accept(row) : { v: 'stale' };
  }

  /** A wedding op against the rows of the slots it touches (contract/wedding.ts wedNeeds, WedBook accept) and, for a
   *  task the record doesn't hold, its count of tasks. */
  private wedTarget(me: Who, type: string, d: Rec): WedVerdict {
    const row = wedRowOf(type, d, me);
    if (!row) return { v: 'stale' };
    const b = new WedBook();
    const slots = wedNeeds(type, d);
    for (const r of this.io.sql.exec<{ person: string; type: string; data: string }>(`SELECT person, type, data FROM events WHERE slot IN (${slots.map(() => '?').join(', ')})`, ...slots).toArray()) {
      const x = this.rowRec(r.data, 'wedding');
      const held = x && isWho(r.person) ? wedRowOf(r.type, x, r.person) : null;
      if (held) b.put(held);
    }
    const isNew = row.type === 'wtask' && !b.rows.has(slots[0]);
    const tasks = isNew ? Number(this.io.sql.exec<{ n: number }>("SELECT count(*) AS n FROM events WHERE type = 'wtask'").toArray()[0]?.n ?? 0) : 0;
    return b.accept(row, tasks);
  }

  /** A slot's row (its sender, type and data), or null. */
  private slotRow(slot: string): { person: string; type: string; data: string } | null {
    return this.io.sql.exec<{ person: string; type: string; data: string }>('SELECT person, type, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null;
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

  /** A `tally` (or a `tally_back`) of `who`'s as its slot keeps it (JSON): merged with the day's row held
   *  (contract/tally.ts mergeTally). */
  private tallyKept(who: Who, d: Rec, type: 'tally' | 'tally_back' = 'tally'): string {
    const held = this.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', `${type}|${who}|${String(d.date)}`).toArray()[0];
    const h = held ? this.rowRec(held.data, 'tally') : null;
    if (!h || !isTally(h) || !isTally(d)) return JSON.stringify(d);
    return JSON.stringify({ date: d.date, counts: mergeTally(h.counts, d.counts) });
  }

  /** An island day as kept over the row of the same person and day it replaces (contract/island.ts mergeIslandDay:
   *  what only grows, merged). */
  private islandKept(who: Who, d: Rec): string {
    const held = this.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', `island|${who}|${String(d.date)}`).toArray()[0];
    const h = held ? this.rowRec(held.data, 'island') : null;
    if (!h || !isIslandDay(h) || !isIslandDay(d)) return JSON.stringify(d);
    return JSON.stringify(mergeIslandDay(h, d));
  }

  /** `who`'s tally of `date` the record holds (its counts; none: empty). */
  private heldTally(who: Who, date: string): Record<string, number> {
    const held = this.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', `tally|${who}|${date}`).toArray()[0];
    const h = held ? this.rowRec(held.data, 'tally') : null;
    return h && isTally(h) ? h.counts : {};
  }

  /** Why a sell or a buy of `me`'s isn't covered by their rows (contract/shop.ts shopRefusal), or null: against the
   *  running ledger (shopState: meta, one row), never their history (until 2026-11-05 every sale reread it: a year's
   *  20-sale batch read 153k rows). */
  private shopTarget(me: Who, type: LedgerEvent, d: Rec): 'pocket' | 'wallet' | 'owned' | 'paid' | null {
    const st = this.shopState(me);
    // (its data checked already: validEvent)
    const row = shopRowOf(type, d);
    return row ? shopRefusal(st.l, st.caught, row) : 'pocket';
  }

  /** A tally slot's counts as held (none: empty). */
  private slotTally(slot: string): Record<string, number> {
    const held = this.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', slot).toArray()[0];
    const h = held ? this.rowRec(held.data, 'tally') : null;
    return h && isTally(h) ? h.counts : {};
  }

  /** `who`'s running shop ledger (meta `shop|<who>`), as kept. Its pocket's part folded again from the rows when today's
   *  rules can't read it (a load let it go, an older relay kept it), the wallet kept as it was; the whole seeded from
   *  the fold (`wallet.seed`) only when there's no wallet to keep (the record's first op of theirs, a load into an
   *  empty record, a ledger from before the wallet that its relay folded again too). Nothing else folds the wallet.
   *  A ledger without the change count (`n`: an older relay's, a rollback's) starts it again at 0 in a new epoch, so
   *  the phones take the count as it is (they keep each person's highest within an epoch). */
  private shopState(who: Who): ShopState {
    const raw = this.meta(`shop|${who}`);
    const { pocket, wallet, legacy } = raw ? shopStateOf(raw) : { pocket: null, wallet: null, legacy: false };
    if (pocket && wallet && !legacy) return withWallet(pocket, wallet);
    let st: ShopState;
    if (pocket && wallet) st = withWallet(pocket, wallet);
    else {
      const fold = this.shopFold(who);
      st = withWallet(fold, wallet ?? seedOf(fold, this.iso()));
      if (!wallet) this.io.log?.('wallet.seed', { who, h: st.l.shells });
    }
    this.setMeta(`shop|${who}`, shopStateJson(st));
    if (raw && legacy) this.bumpRev();
    return st;
  }

  /** A kept row into `who`'s running ledger (made ready before the row was put: shopState): a tally's or a
   *  give-back's change (its kept counts less `was`, the row it replaced), a sell, a buy, starts, a reward or a
   *  correction by the fold's own step (contract/shop.ts shopStep), each touched species' debt again (reowe); the
   *  wallet moved by the step's change (keepLedger). */
  private shopNote(who: Who, type: 'tally' | 'tally_back' | LedgerEvent, kept: string, was: Record<string, number> | null): void {
    const st = this.ledgerKept(who);
    if (!st) return;
    const d = this.rowRec(kept, 'shop');
    if (!d) return;
    const before = st.l.shells;
    if (type === 'tally' || type === 'tally_back') {
      if (!isTally(d)) return;
      const sign = type === 'tally_back' ? -1 : 1;
      for (const key in d.counts) {
        // (an old goal fruit's into its goal's, as caughtOf: contract/pocket.ts pocketKey)
        const delta = d.counts[key] - (was?.[key] ?? 0), k = pocketKey(key);
        if (!delta) continue;
        st.caught.set(k, (st.caught.get(k) ?? 0) + sign * delta);
        if (sign < 0) st.back.set(k, (st.back.get(k) ?? 0) + delta);
        if (st.l.sold.has(k)) reowe(st.l, k, st.caught, st.back);
      }
    } else {
      const row = shopRowOf(type, d);
      if (row) shopStep(st.l, st.caught, st.back, row);
    }
    this.keepLedger(who, st, before);
  }

  /** `who`'s running ledger as meta holds it, or null when it isn't ready (shopState makes it so). */
  private ledgerKept(who: Who): ShopState | null {
    const raw = this.meta(`shop|${who}`);
    const p = raw ? shopStateOf(raw) : null;
    return p?.pocket && p.wallet && !p.legacy ? withWallet(p.pocket, p.wallet) : null;
  }

  /** A ledger after a step into meta: the wallet never below 0 (the user, 2026-11-18: a give-back after a sale takes
   *  at most what is left; what the floor took counted in `u`, walletCheck's), and when it moved from `before`, a
   *  change counted (`n`) at the record's time. */
  private keepLedger(who: Who, st: ShopState, before: number): void {
    if (st.l.shells < 0) st.u += -st.l.shells;
    st.l.shells = Math.max(0, st.l.shells);
    if (st.l.shells !== before) (st.n += 1), (st.t = this.iso());
    this.setMeta(`shop|${who}`, shopStateJson(st));
  }

  /** The record's clock now, as an ISO time. */
  private iso(): string {
    return new Date(this.io.now()).toISOString();
  }

  /** The running ledgers' pockets let go (a load or an import brought rows past them: folded again at the next read),
   *  their wallets kept: a load never moves one (a ledger without one goes whole, seeded at its next read). `whole`:
   *  the record had no event before the load, so a wallet there is only a read's seed of nothing (a phone's poll, the
   *  admin's `wallet`): it goes too, seeded from the loaded rows. */
  private shopForget(whole = false): void {
    for (const who of ['A', 'B', 'G'] as const) {
      const raw = whole ? null : this.meta(`shop|${who}`);
      const p = raw ? shopStateOf(raw) : null, w = p?.wallet;
      if (w) this.setMeta(`shop|${who}`, JSON.stringify({ h: w.h, n: w.n, t: w.t, u: w.u }));
      else this.io.sql.exec('DELETE FROM meta WHERE k = ?', `shop|${who}`);
      if (w && p.legacy) this.bumpRev();
    }
    this.io.sql.exec("DELETE FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'");
  }

  /** The wallets a phone of `me`'s is told (a reply's `wallets`): `who`'s of them (all: the visible ones), each its
   *  かいがら and changes. The guest only its own; a member each person's (a member's phone shows only its own). */
  private walletsFor(me: Who, who: Iterable<Who> = ['A', 'B', 'G']): Partial<Record<Who, { h: number; seq: number }>> {
    const out: Partial<Record<Who, { h: number; seq: number }>> = {};
    for (const w of who) {
      if (me === 'G' && w !== 'G') continue;
      const st = this.shopState(w);
      out[w] = { h: st.l.shells, seq: st.n };
    }
    return out;
  }

  /** The admin's `shopcheck {fix?}`: each person's running ledger against the full fold of their rows: its pocket's
   *  part, and its wallet against the fold's かいがら (never below 0); where they differ, the fields (ledgerDiff). `fix`:
   *  the fold's pocket taken; never the wallet (a drift is the admin's to settle with a correction row: walletset). */
  shopCheck(o: Rec = {}): Record<string, unknown> {
    // the field first, folded anew: the ledgers' fold reads its goods (a wrong running field would make them differ)
    const field = this.farmFold(), json = JSON.stringify(farmJson(field)), was = this.meta(FARM_META);
    const out: Record<string, unknown> = { farm: was === null ? 'none' : was === json ? 'same' : 'differs' };
    if (o.fix === true && out.farm === 'differs') this.setMeta(FARM_META, json);
    for (const who of ['A', 'B', 'G'] as const) {
      const raw = this.meta(`shop|${who}`);
      if (raw === null) {
        out[who] = 'none';
        continue;
      }
      const { pocket, wallet, legacy } = shopStateOf(raw);
      const fold = this.shopFold(who, field);
      // (a pocket today's rules can't read is `stale`, folded again at the next read: only its wallet judged)
      const foldParts = pocketParts(fold);
      const diff = ledgerDiff({ ...(pocket ? pocketParts(pocket) : foldParts), h: wallet?.h ?? null }, { ...foldParts, h: Math.max(0, fold.l.shells) });
      out[who] = pocket ? diff ?? 'same' : { ...diff, differs: ['stale', ...((diff?.differs as string[] | undefined) ?? [])] };
      const pocketDiffers = !pocket || (diff?.differs as string[] | undefined)?.some((k) => k !== 'h');
      if (o.fix === true && pocketDiffers) {
        this.setMeta(`shop|${who}`, shopStateJson(withWallet(fold, wallet ?? seedOf(fold, this.iso()))));
        if (legacy) this.bumpRev();
      }
    }
    return { ok: true, ...out };
  }

  /** The admin's `wallet`: each person's wallet (`h`, its changes `seq`, the last one's time `at`, what the floor took
   *  `floor`) and the fold of their rows' かいがら beside it (`fold`: below 0 when a give-back took more than was left;
   *  the wallet stops at 0). */
  wallets(): Record<string, unknown> {
    const out: Record<string, unknown> = { ok: true };
    for (const who of ['A', 'B', 'G'] as const) {
      const st = this.shopState(who);
      out[who] = { h: st.l.shells, seq: st.n, at: st.t, floor: st.u, fold: this.shopFold(who).l.shells };
    }
    return out;
  }

  /** The daily `walletcheck` (and the admin's): each kept wallet against its fold. In order when `h` is the fold plus
   *  what the floor took (`u`: a credit after a floored step pays out in full, the user's rule): `explained`, each
   *  `{who, stored, fold, floor}`, when the floor's part shows; else `drift` (the same fields, `wallet.drift` warn).
   *  Reads only: a drift is the admin's to settle (walletset). */
  walletCheck(): { ok: true; drift: WalletDrift[]; explained: WalletDrift[] } {
    const drift: WalletDrift[] = [], explained: WalletDrift[] = [];
    const field = this.farmFold();
    for (const who of ['A', 'B', 'G'] as const) {
      const raw = this.meta(`shop|${who}`);
      const w = raw ? shopStateOf(raw).wallet : null;
      if (!w) continue;
      const fold = this.shopFold(who, field).l.shells, d = { who, stored: w.h, fold, floor: w.u };
      if (w.h === fold + w.u) {
        if (w.h !== Math.max(0, fold)) explained.push(d);
      } else if (!(w.u === 0 && w.h === Math.max(0, fold))) drift.push(d);
    }
    for (const d of drift) this.io.log?.('wallet.drift', d);
    return { ok: true, drift, explained };
  }

  /** The admin's `adjust {id, who, v, note}`: a `shop_adjust` row of `who`'s (contract/shop.ts adjustOf: `v` かいがら
   *  added, either sign), kept now (a new `at`: the phones fetch it as any new row, no new epoch) and into their wallet
   *  (never below 0). `id` the caller's (a retry is acknowledged as `duplicate`). The only way one comes in besides a
   *  dump's `load`: a phone's is refused (contract/record.ts validEventData). */
  adjust(o: Rec): Record<string, unknown> {
    const { id, who } = o;
    const data = { v: o.v, note: o.note };
    if (!isId(id) || !isWho(who) || !adjustOf(data)) return { ok: false, error: 'bad_request' };
    const r = this.io.tx((): Record<string, unknown> => (this.known(id) ? { ok: true, duplicate: true } : this.adjustKept(id, who, data as { v: number; note: string })));
    // (an `ingest`: never skipped as a phone's own event; the guest hears of it too, its かいがら among them)
    if (typeof r.at === 'string') this.io.notify({ what: 'ingest', who, at: r.at, rev: this.rev() }, true);
    return r;
  }

  /** A correction kept (in the caller's transaction): its row, and the wallet before and after it. */
  private adjustKept(id: string, who: Who, data: { v: number; note: string }): Record<string, unknown> {
    const before = this.shopState(who).l.shells;
    const at = this.nextAt(), json = JSON.stringify(data);
    this.put(id, at, who, 'shop_adjust', json, null, null);
    this.shopNote(who, 'shop_adjust', json, null);
    return { ok: true, id, at, before, after: this.shopState(who).l.shells };
  }

  /** The admin's `walletset {id, who, h, note}`: `who`'s wallet made `h`, with a correction row of what the rows lack
   *  for it (`v`: `h` less the fold of their rows, worked out in the transaction), so the rows explain the stored value
   *  after it. Without a drift that is the wallet's own difference; with one (walletcheck) it settles it, whichever side
   *  the admin takes (`h` the stored value: the rows made to say it; the fold's: the wallet made the rows'). Nothing
   *  written when both are `h` already (`same`); no row when the rows say `h` already. */
  walletSet(o: Rec): Record<string, unknown> {
    const { id, who, h, note } = o;
    if (!isId(id) || !isWho(who) || typeof h !== 'number' || !Number.isInteger(h) || h < 0 || !adjustOf({ v: 1, note })) return { ok: false, error: 'bad_request' };
    const r = this.io.tx((): Record<string, unknown> => {
      if (this.known(id)) return { ok: true, duplicate: true };
      const st = this.shopState(who), before = st.l.shells, v = h - this.shopFold(who).l.shells;
      if (!v && before === h) return { ok: true, same: true, h };
      if (v && !adjustOf({ v, note })) return { ok: false, error: 'bad_request', detail: `a correction of ${v} is past ±${ADJUST_MAX}` };
      const at = v ? this.nextAt() : undefined;
      if (at) this.put(id, at, who, 'shop_adjust', JSON.stringify({ v, note }), null, null);
      // (the rows say `h` after it: nothing of the floor's left to explain)
      st.l.shells = h;
      st.u = 0;
      this.keepLedger(who, st, before);
      return { ok: true, ...(at ? { id, at, v } : {}), before, after: h };
    });
    if (typeof r.at === 'string') this.io.notify({ what: 'ingest', who: who as Who, at: r.at, rev: this.rev() }, true);
    // (no row: no `since` would bring the wallet, so a new epoch, every phone refetching)
    else if (typeof r.after === 'number') return { ...r, rev: this.bumpRev() };
    return r;
  }

  /** The admin's `unadjust {id}`: that `shop_adjust` row deleted (its correction undone; its id stays known), its `v`
   *  taken back from its person's wallet (never below 0), and a new epoch (a phone drops a row only by refetching). */
  unadjust(o: Rec): Record<string, unknown> {
    const id = o.id;
    if (!isId(id)) return { ok: false, error: 'bad_request' };
    const r = this.io.tx(() => {
      const row = this.io.sql.exec<{ person: string; data: string }>("SELECT person, data FROM events WHERE id = ? AND type = 'shop_adjust'", id).toArray()[0];
      if (!row || !isWho(row.person)) return null;
      // (ready before the row goes: a wallet seeded now holds it, so taking it back is right either way)
      const st = this.shopState(row.person), before = st.l.shells;
      const x = this.rowRec(row.data, 'shop');
      this.io.sql.exec('DELETE FROM events WHERE id = ?', id);
      st.l.shells -= (x && adjustOf(x)?.v) ?? 0;
      this.keepLedger(row.person, st, before);
      return { who: row.person, before, after: st.l.shells };
    });
    if (!r) return { ok: false, error: 'bad_request', detail: 'no such shop_adjust' };
    return { ok: true, ...r, rev: this.bumpRev() };
  }

  /** The admin's `inbody {id, who, date, muscle_kg, smm_kg}`: a member's InBody sheet (contract/bodyEst.ts inbodyOf),
   *  which calibrates their 筋肉量 / 骨格筋量 estimates; a day's again replaces it (its slot). Never a phone's
   *  (contract/record.ts validEventData), never the guest's to see (contract/guest.ts). The phones fetch it as any new row. */
  inbody(o: Rec): Record<string, unknown> {
    const { id, who } = o;
    const data = inbodyOf({ date: o.date, muscle_kg: o.muscle_kg, smm_kg: o.smm_kg });
    if (!isId(id) || !isPersonId(who) || !data) return { ok: false, error: 'bad_request' };
    const r = this.io.tx((): Record<string, unknown> => {
      if (this.known(id)) return { ok: true, duplicate: true };
      const at = this.nextAt();
      this.put(id, at, who, 'inbody', JSON.stringify(data), eventSlot('inbody', who, who, { ...data }, Date.parse(at)), null);
      return { ok: true, id, at };
    });
    if (typeof r.at === 'string') this.io.notify({ what: 'ingest', who, at: r.at, rev: this.rev() }, true);
    return r;
  }

  /** `who`'s shop folded from every row of theirs (the running ledger's start, and its admin re-check). The fold reads
   *  their day tallies (one row a day: ≤ 366 a year) and their shop rows, in the object, never the Worker. Its
   *  `shells` are the rows' sum, unfloored (the wallet's, shopState, never below 0). */
  private shopFold(me: Who, field: Farm = this.farmState()): Pocket {
    const parse = (raw: string): Rec | null => this.rowRec(raw, 'shop');
    // (their days' tallies less what was given back, a claim race lost, and the field's net: contract/shop.ts caughtOf,
    // the phones' fold too)
    const days: TallyDay[] = [];
    for (const r of this.io.sql.exec<{ type: string; data: string }>("SELECT type, data FROM events WHERE type IN ('tally', 'tally_back') AND person = ?", me).toArray()) {
      const t = parse(r.data);
      if (t && isTally(t)) days.push({ back: r.type === 'tally_back', counts: t.counts });
    }
    const { caught, back } = caughtOf(days, field.net[me]);
    const rows: ShopRow[] = [];
    const types = SHOP_EVENTS.map((t) => `'${t}'`).join(', ');
    // (their own shop rows, and every 英語すごろく reward naming them, whoever sent it: contract/shop.ts rowConcerns)
    // (and the admin's corrections of theirs: adjust)
    for (const r of this.io.sql.exec<{ type: string; data: string }>(`SELECT type, data FROM events WHERE (type IN (${types}, 'shop_adjust') AND person = ?) OR type = 'sg_reward' ORDER BY at, seq`, me).toArray()) {
      const x = parse(r.data);
      const row = x && (isShopEvent(r.type) || r.type === 'sg_reward' || r.type === 'shop_adjust') ? shopRowOf(r.type, x) : null;
      if (row && (row.type !== 'reward' || row.data.to.includes(me))) rows.push(row);
    }
    return { caught, back, l: shopLedger(caught, rows, back) };
  }

  // ---------------------------------------------------------------- the field

  /** The field (contract/farm.ts) as its rows leave it: meta FARM_META, kept by each farm row (farmNote), folded from
   *  the rows (each as kept) when it isn't there (a load, or new growth rules: the old rules' copy dropped). */
  private farmState(): Farm {
    const raw = this.meta(FARM_META);
    if (raw) {
      try {
        const f = farmFromJson(JSON.parse(raw));
        if (f) return f;
      } catch { /* folded again */ }
    }
    const f = this.farmFold();
    this.io.sql.exec("DELETE FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'");
    this.setMeta(FARM_META, JSON.stringify(farmJson(f)));
    return f;
  }

  /** The field folded from its rows, each as kept (farmState's start, and shopcheck's). */
  private farmFold(): Farm {
    const f = emptyFarm();
    for (const r of this.io.sql.exec<{ person: string; data: string }>("SELECT person, data FROM events WHERE type = 'farm' ORDER BY at, seq").toArray()) {
      const x = this.rowRec(r.data, 'farm');
      const d = x ? farmOf(x) : null;
      if (d && isWho(r.person)) farmStep(f, r.person, d);
    }
    return f;
  }

  /** A farm batch of `me`'s judged against the field and their pocket (their running shop ledger: tallies and the
   *  field's goods less sold, with the starts bought), the waterings the island days hold and the wet days: the field
   *  after it, the row as kept and `me`'s field net before it (farmNote's), or null when no op stands. */
  private farmKept(me: Who, d: Rec): { f: Farm; data: FarmData; before: ReadonlyMap<string, number> } | null {
    const f = this.farmState(), st = this.shopState(me);
    const before = new Map(f.net[me]);
    const days = new Map<string, Set<string> | true>();
    const watered = (p: string, date: string): boolean => {
      let w = days.get(date);
      if (w === undefined) days.set(date, (w = this.wateredOn(date)));
      return w === true || w.has(p);
    };
    const data = farmStep(f, me, farmOf(d)!, { watered, pocket: (k) => (st.caught.get(k) ?? 0) - (st.l.sold.get(k) ?? 0) });
    return data ? { f, data, before } : null;
  }

  /** What was watered on `date`: everything (a wet day), else the plots in anyone's island day of it. */
  private wateredOn(date: string): Set<string> | true {
    if (this.slotRow(`wet|${date}`)) return true;
    const out = new Set<string>();
    for (const who of ['A', 'B', 'G']) {
      const r = this.slotRow(`island|${who}|${date}`);
      const x = r ? this.rowRec(r.data, 'island') : null;
      if (x && Array.isArray(x.watered)) for (const id of x.watered) if (typeof id === 'string') out.add(id);
    }
    return out;
  }

  /** A farm row kept: the field after it into meta, and what it put in or took out of `me`'s pocket into their running
   *  shop ledger (when it has one: else its next fold reads the field). `before`: `me`'s field net before the row
   *  (farmKept's: meta FARM_META parsed once a row). */
  private farmNote(me: Who, f: Farm, before: ReadonlyMap<string, number>): void {
    this.setMeta(FARM_META, JSON.stringify(farmJson(f)));
    const st = this.ledgerKept(me);
    if (!st) return;
    const was = st.l.shells;
    for (const [k, n] of f.net[me] ?? []) {
      const delta = n - (before.get(k) ?? 0);
      if (!delta) continue;
      st.caught.set(k, (st.caught.get(k) ?? 0) + delta);
      // (a debt of a sold kind again, as a tally's: the fold reads the field's net with the tallies)
      if (st.l.sold.has(k)) reowe(st.l, k, st.caught, st.back);
    }
    this.keepLedger(me, st, was);
  }

  /**
   * The wet days (contract/wet.ts), from the room's weather cron (index.ts): `real`, the Tokyo days its timeline had a
   * wet hour of. The island's weather mode decides: `real` keeps those of yesterday and today, `game` its seeded wet
   * days of yesterday and today. Each a `wet` row of the record's own (slot `wet|<date>`), once; the dates kept.
   */
  wetTick(real: readonly string[]): string[] {
    const today = localDateAt(this.io.now()), days = [prevDay(today), today];
    const r = this.slotRow('pref|island|weatherMode');
    const game = r ? this.rowRec(r.data, 'pref')?.value === 'game' : false;
    const wet = days.filter((d) => (game ? gameWet(d) : real.includes(d)) && !this.slotRow(`wet|${d}`));
    if (!wet.length) return [];
    let last = '';
    this.io.tx(() => {
      for (const d of wet) {
        last = this.nextAt();
        // (the record's own row: its person a placeholder, every phone reads it alike)
        this.put(`wet-${d}`, last, 'A', 'wet', JSON.stringify({ date: d }), `wet|${d}`, null);
      }
    });
    this.io.notify({ what: 'event', who: 'A', at: last, rev: this.rev() });
    return wet;
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

  /** A layout reset's rows: the objects' and the chunks' ops it voids are dropped (their ids stay known): by their
   *  slots' range and their `at`, no row parsed here (a row that isn't JSON is left). */
  private dropVoided(at: number): void {
    this.io.sql.exec(
      `DELETE FROM events WHERE type = 'decor' AND ((slot >= 'decor|o|' AND slot < 'decor|o}') OR (slot >= 'decor|c|' AND slot < 'decor|c}'))
       AND (CASE WHEN json_valid(data) THEN json_extract(data, '$.at') END) <= ?`, at
    );
  }

  // ---------------------------------------------------------------- import

  /**
   * Take rows that already have their `at` (a dump's, restored by the admin `load`), by
   * the same rules as the record's own writes: an event id once, a slot's latest (by `at`) kept, a decor op by the
   * merge's rules, a board post's, a packing list's and the wedding board's row as the record had it (unless its slot's
   * row beats it: a restore is faithful), then what a phone's op would have dropped with them (pruneLoaded); rows the
   * model can't read (an old high-five's) are skipped. Idempotent: an import again adds nothing.
   */
  import(rows: ImportRows): ImportResult {
    // in `at` order across the tables, so a batch is late only where it is older than what the record had
    const all = [
      ...(rows.metrics ?? []).map((r) => ({ tab: 'metrics' as const, r })),
      ...(rows.events ?? []).map((r) => ({ tab: 'events' as const, r })),
      ...(rows.uploads ?? []).map((r) => ({ tab: 'uploads' as const, r })),
      ...(rows.held ?? []).map((r) => ({ tab: 'held' as const, r }))
    ].map((x, i) => ({ ...x, i, at: Array.isArray(x.r) ? String(x.r[0]) : '' }))
      .sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.i - y.i));
    return this.io.tx(() => {
      const out: ImportResult = { metrics: 0, events: 0, uploads: 0, skipped: 0, ...(rows.held ? { held: 0 } : {}) };
      const arrived = this.io.now();
      // (a load into an empty record: its wallets seeded from the loaded rows, shopForget)
      const empty = this.io.sql.exec('SELECT 1 AS x FROM events LIMIT 1').toArray().length === 0;
      this.refused = { prefKey: 0, profileLocked: 0 };
      for (const { tab, r } of all) {
        const v = !Array.isArray(r) ? 'skipped' : tab === 'metrics' ? this.importMetric(r, arrived) : tab === 'events' ? this.importEvent(r, arrived) : tab === 'held' ? this.importHeld(r) : this.importUpload(r);
        if (v === 'added') out[tab] = (out[tab] ?? 0) + 1;
        else if (v === 'skipped') out.skipped++;
      }
      const { prefKey, profileLocked } = this.refused;
      if (prefKey + profileLocked) {
        out.refused = { prefKey, profileLocked };
        console.warn('store', 'load refused', `pref key ${prefKey}`, `profile locked ${profileLocked}`);
      }
      // (rows the running shop ledgers and the caps' counts never saw: folded again at the next op)
      if (out.events) {
        this.pruneLoaded();
        this.shopForget(empty);
        this.io.sql.exec("DELETE FROM meta WHERE k = 'decor_live'");
      }
      return out;
    });
  }

  private importMetric(r: unknown[], arrived: number): 'added' | 'had' | 'skipped' {
    const [at, person, date, metric, value] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person) || typeof date !== 'string' || !isMetricKey(metric) || typeof value !== 'number' || !Number.isFinite(value)) return 'skipped';
    const sql = this.io.sql;
    if (sql.exec('SELECT 1 AS x FROM metrics WHERE person = ? AND date = ? AND metric = ? AND at = ?', person, date, metric, at).toArray().length) return 'had';
    this.addMetric(at, person, date, metric, value, this.seeAt(at) ? arrived : null);
    return 'added';
  }

  /** The current import's refusals (importEvent), counted for its result and its log line. */
  private refused = { prefKey: 0, profileLocked: 0 };

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
    // A pref of a key the model no longer reads (a dump's from before it went: bmiStd) is never taken back, and the
    // locked profile (keep) covers a load too: a sex or birth row comes in only to a slot that holds none.
    if (type === 'pref' && !PREF_KEYS.includes(d.key as string)) {
      this.refused.prefKey++;
      return 'skipped';
    }
    if (type === 'pref' && PROFILE_PREF_KEYS.includes(d.key as string)) {
      const slot = eventSlot(type, person, subject, d, Date.parse(at));
      if (!slot || this.slotRow(slot)) {
        this.refused.profileLocked++;
        return 'skipped';
      }
    }
    // A board post's, a packing list's and the wedding board's rows are taken as the record had them (a dump holds each
    // slot's latest row only: an edited post's first posting, an item's creation, a tick's task may be long gone, so
    // the rules for a phone's op would drop them), kept unless the row its slot holds beats it. What the guest could
    // never write (a trip note, the wedding board) is never taken from it.
    if (type === 'board') {
      const op = boardOpOf(d);
      if (!op) return 'skipped';
      const h = this.slotRow(`board|${op.id}`);
      const hx = h && isWho(h.person) ? this.rowRec(h.data, 'board') : null;
      const held = hx ? boardOpOf(hx) : null;
      if (held && !boardBeats({ ...op, who: person }, { ...held, who: h!.person as Who })) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
        return 'had';
      }
    }
    if (isPackType(type) || isWedType(type)) {
      if (person === 'G' && !guestMayWrite(type, d)) return 'skipped';
      const v = isPackType(type)
        ? this.loadBeats(packSlot(type, person, d), 'pack', new PackBook(), packRowOf, packRowOf(type, d, person))
        : this.loadBeats(wedSlot(type, d), 'wedding', new WedBook(), wedRowOf, wedRowOf(type, d, person));
      if (v === 'had') sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
      if (v !== 'beats') return v;
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
    const wasDecor = type === 'decor' && slot ? sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null : null;
    if (slot && type !== 'decor' && type !== 'board' && !isFoodType(type) && !isPackType(type) && !isWedType(type)) {
      const held = sql.exec<{ at: string }>('SELECT at FROM events WHERE slot = ?', slot).toArray()[0];
      if (held && held.at >= at) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // a later one of the slot is there already
        return 'had';
      }
      if (type === 'tally' || type === 'tally_back') json = this.tallyKept(person, d, type); // with the larger counts of the row it replaces
      if (type === 'island') json = this.islandKept(person, d);
    }
    this.put(id, at, person, type, json, slot, this.seeAt(at) ? arrived : null);
    if (type === 'decor') this.decorNote(person, d, wasDecor); // (the caps right within the load's batch)
    return 'added';
  }

  /** A packing or wedding row a load brings against the row its slot holds, by the contract's merge (PackBook,
   *  WedBook): `beats` it (or there's none), `had` (the held one beats it) or `skipped` (unreadable). */
  private loadBeats<R>(slot: string | null, kind: string, book: { rows: Map<string, R>; put(r: R): void; merge(r: R): unknown }, rowOf: (type: string, d: Rec, who: Who) => R | null, row: R | null): 'beats' | 'had' | 'skipped' {
    if (!row || !slot) return 'skipped';
    const h = this.slotRow(slot);
    const hx = h && isWho(h.person) ? this.rowRec(h.data, kind) : null;
    const held = hx ? rowOf(h!.type, hx, h!.person as Who) : null;
    if (held) book.put(held);
    book.merge(row);
    return book.rows.get(slot) === row ? 'beats' : 'had';
  }

  /** What a phone's op would have dropped with a row a load took as it was (the live path's drops, after the whole
   *  batch, so the order its rows came in doesn't matter): a purged wedding task's tick, a removed packing item's
   *  ticks. (A removal's own row is never dropped, 2026-11-08: a phone that cached the post before it would show it for
   *  good, its delta saying nothing of it.) */
  private pruneLoaded(): void {
    const sql = this.io.sql;
    const gone = (type: string): Rec[] =>
      sql.exec<{ data: string }>('SELECT data FROM events WHERE type = ?', type).toArray()
        .map((r) => this.rowRec(r.data, type)).filter((x): x is Rec => x !== null && x.rm === true);
    for (const t of gone('wtask')) sql.exec('DELETE FROM events WHERE slot = ?', `wdone|${String(t.id)}`);
    for (const p of gone('pack')) sql.exec('DELETE FROM events WHERE slot GLOB ?', `pack_chk|${String(p.trip)}|${String(p.id)}|*`);
  }

  private importHeld(r: unknown[]): 'added' | 'skipped' {
    const [at, person, date, metric, value, last, n, promoted] = r;
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person) || typeof date !== 'string' || !isMetricKey(metric) || typeof value !== 'number' || !Number.isFinite(value)) return 'skipped';
    const lastAt = typeof last === 'string' && ISO_AT.test(last) ? last : at;
    this.hold(person, date, metric, value, at, Number.isInteger(n) && (n as number) > 0 ? (n as number) : 1, typeof promoted === 'string' && ISO_AT.test(promoted) ? promoted : null, lastAt);
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

  /** Every row, as `load` takes them (the backup, docs/ops/runbook.md#6-backups): the load of a dump is the record. */
  dump(): { rows: DumpRows } {
    return { rows: { ...this.rowsSince(''), uploads: this.uploadRows(), ...this.heldDump() } };
  }

  /**
   * The dump as `record.ts dump` writes it (`{ok, rev, rows}`, its pages put together), as text a page of rows at a
   * time (the backup, archive.ts: packed as it comes, so neither the rows nor the text are ever whole in memory). The
   * pages run in (at, seq) order, so a row written between two of them (its `at` after every row handed out) is in a
   * later page or not at all; a new epoch under it (a restore) throws (`epoch`: the run is tried again).
   */
  *dumpText(page = DUMP_TEXT_PAGE): Generator<string> {
    const rev = this.rev();
    const sql = this.io.sql;
    // (the audit by seq, as uploadRows: a load's rows may come in after newer ones)
    function* table<T extends Record<string, Bind>>(tab: string, cols: string, row: (r: T) => unknown[], bySeq = false): Generator<string> {
      let at = '', seq = -1, sep = '';
      for (;;) {
        const rs = (bySeq
          ? sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE seq > ? ORDER BY seq LIMIT ?`, seq, page)
          : sql.exec<T & { seq: number; at: string }>(`SELECT seq, ${cols} FROM ${tab} WHERE at >= ? AND (at > ? OR seq > ?) ORDER BY at, seq LIMIT ?`, at, at, seq, page)).toArray();
        if (!rs.length) return;
        yield sep + rs.map((r) => JSON.stringify(row(r))).join(',');
        sep = ',';
        ({ at, seq } = rs[rs.length - 1]);
        if (rs.length < page) return;
      }
    }
    yield `{"ok":true,"rev":${JSON.stringify(rev)},"rows":{"metrics":[`;
    yield* table<MetricCols>('metrics', METRIC_COLS, metricRow);
    yield '],"events":[';
    yield* table<EventCols>('events', EVENT_COLS, eventRow);
    yield '],"uploads":[';
    yield* table<{ at: string; person: string; status: string; bytes: number; notes: string }>('uploads', 'at, person, status, bytes, notes', (r) => [r.at, r.person, r.status, r.bytes, r.notes], true);
    yield `],"held":${JSON.stringify(this.heldDump().held ?? [])}}}\n`;
    if (this.rev() !== rev) throw Object.assign(new Error('a new epoch under the dump'), { name: 'epoch' });
  }

  /** The held values as the dump carries them (only when there are some: a dump from before them reads the same). */
  private heldDump(): { held?: unknown[][] } {
    const h = this.heldRows();
    return h.length ? { held: h.map((x) => [x.at, x.person, x.date, x.metric, x.value, x.last, x.n, x.promoted]) } : {};
  }

  /** The admin's `dump {limit?, after?, all?}`: a page of the dump (`limit` rows, SNAPSHOT_PAGE_MAX by default: the
   *  metrics and events as rowsPage pages them, the audit and the held values on the first page, `next` the `after` of
   *  the next); `all: true`, every row at once (dump). */
  dumpPage(o: Rec): { ok: true; rows: DumpRows; next?: string } | Fail {
    // paged by default (SNAPSHOT_PAGE_MAX rows): a whole year at once is past what one reply should carry; `all: true`
    // the whole at once (record.ts always pages)
    if (o.all === true) return { ok: true, ...this.dump() };
    const after = o.after === undefined ? null : cursorOf(o.after);
    const limit = o.limit === undefined ? SNAPSHOT_PAGE_MAX : o.limit;
    if (after === undefined || !isPageSize(limit)) return fail('bad_request');
    const p = this.rowsPage('', after, limit);
    return { ok: true, rows: { ...p.rows, uploads: after ? [] : this.uploadRows(), ...(after ? {} : this.heldDump()) }, ...(p.next ? { next: p.next } : {}) };
  }

  private uploadRows(): unknown[][] {
    return this.io.sql.exec<{ at: string; person: string; status: string; bytes: number; notes: string }>('SELECT at, person, status, bytes, notes FROM uploads ORDER BY seq').toArray()
      .map((r) => [r.at, r.person, r.status, r.bytes, r.notes]);
  }

  // ---------------------------------------------------------------- compaction

  /** The admin's `compact {confirm, max?, rev?}`: deletes Health history rows (the locked weeks' superseded values),
   *  so only with `confirm: 'delete-health-history'` (the user's rule, 2026-11-05: every Health row is kept until they
   *  decide; a dump first). Without it, refused and nothing read. `rev: true`: a new epoch after it. */
  compactOp(o: Rec): Record<string, unknown> {
    if (o.confirm !== COMPACT_CONFIRM) return { ok: false, error: 'bad_request', detail: `compact deletes Health history rows: pass confirm: '${COMPACT_CONFIRM}' (dump first)` };
    const max = typeof o.max === 'number' && Number.isInteger(o.max) && o.max > 0 ? o.max : undefined;
    const r = this.compact(max);
    return { ok: true, ...r, ...(o.rev === true ? { rev: this.bumpRev() } : {}) };
  }

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
          // (the day's latest values from the rows kept: compactKeep keeps them, this keeps metrics_latest true anyway)
          if (gone.length) this.relatest(date);
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

/** A person's running shop ledger (store.ts shopState): their tallies' totals less the give-backs, the give-backs, the
 *  ledger of their shop rows (contract/shop.ts) whose `shells` are THE wallet (never below 0, never folded again once
 *  kept), and the wallet's changes (`n`, counted) and the last one's time (`t`). */
interface ShopState { caught: Map<string, number>; back: Map<string, number>; l: Ledger; n: number; t: string; u: number }
type Pocket = Pick<ShopState, 'caught' | 'back' | 'l'>;
/** A wallet: `h` かいがら, `n` changes, `t` the last one's time, `u` what the floor took in all (walletCheck's). */
interface Wallet { h: number; n: number; t: string; u: number }
type WalletDrift = { who: Who; stored: number; fold: number; floor: number };

/** A ledger of a pocket's part and a wallet: the wallet's `h` its かいがら (a copy: the pocket's own ledger untouched). */
const withWallet = (p: Pocket, w: Wallet): ShopState => ({ ...p, l: { ...p.l, shells: w.h }, n: w.n, t: w.t, u: w.u });

/** A wallet seeded from the fold: its かいがら never below 0, what that took counted as the floor's. */
const seedOf = (fold: Pocket, t: string): Wallet => ({ h: Math.max(0, fold.l.shells), n: 0, t, u: Math.max(0, -fold.l.shells) });

/** The pocket's part of a ledger as meta keeps it (each map as its entries without the zeros, sorted): a running one
 *  and a fold compare as text. */
function pocketParts(st: Pocket): { c: [string, number][]; b: [string, number][]; s: [string, number][]; v: [string, number][]; o: [string, number][]; w: string[]; g: string[] } {
  const m = (x: ReadonlyMap<string, number>) => [...x].filter(([, n]) => n !== 0).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return { c: m(st.caught), b: m(st.back), s: m(st.l.sold), v: m(st.l.soldV), o: m(st.l.owed), w: st.l.owned, g: [...st.l.games].sort() };
}

/** A ledger as meta keeps it: the pocket's part, the wallet `h`, its changes `n` and time `t`. */
function shopStateJson(st: ShopState): string {
  const { c, b, s, v, o, w, g } = pocketParts(st);
  return JSON.stringify({ c, b, s, v, o, h: st.l.shells, w, g, n: st.n, t: st.t, ...(st.u ? { u: st.u } : {}) });
}

/** A ledger from meta in its two parts. The pocket's: null when today's rules can't read it (kept before 英語すごろく's
 *  rewards, without `g`; before an old goal fruit counted as its goal's, contract/pocket.ts pocketKey; or let go by a
 *  load, shopForget). The wallet's: null when there's none to keep (a ledger from before the wallet whose pocket can't
 *  be read either: those relays folded such a one again, its かいがら with it, so that fold is what they served). */
function shopStateOf(raw: string): { pocket: Pocket | null; wallet: Wallet | null; legacy: boolean } {
  let x: unknown;
  try {
    x = JSON.parse(raw);
  } catch {
    return { pocket: null, wallet: null, legacy: true };
  }
  if (!isRec(x)) return { pocket: null, wallet: null, legacy: true };
  const maps = [x.c, x.b, x.s, x.v, x.o] as ([string, number][] | undefined)[];
  const ok = Array.isArray(x.c) && Array.isArray(x.w) && Array.isArray(x.g) && typeof x.h === 'number' && !maps.some((m) => m?.some(([k]) => pocketKey(k) !== k));
  const pocket = ok
    ? { caught: new Map(maps[0]), back: new Map(maps[1]), l: { sold: new Map(maps[2]), soldV: new Map(maps[3]), owed: new Map(maps[4]), shells: x.h as number, owned: x.w as string[], games: new Set(x.g as string[]) } }
    : null;
  // (a readable one a relay before the wallet kept: its `h` as that relay served it, never below 0, what that took
  // the floor's; `legacy`, so its change count starts again in a new epoch: shopState)
  const legacy = typeof x.n !== 'number';
  const wallet = typeof x.h === 'number' && Number.isFinite(x.h) && (!legacy || ok)
    ? { h: Math.max(0, Math.round(x.h)), n: legacy ? 0 : (x.n as number), t: typeof x.t === 'string' ? x.t : '', u: typeof x.u === 'number' ? x.u : Math.max(0, -Math.round(x.h)) }
    : null;
  return { pocket, wallet, legacy };
}

/** Where a running ledger and its fold differ (shopcheck's detail), or null when they don't: `differs`, the fields that
 *  do (`h` the wallet against the fold's かいがら; `c` caught, `b` given back, `s` sold, `v` what they fetched, `o` owed:
 *  each key `[stored, fold]`; `w` the pieces, `g` the games: what only one side holds). */
function ledgerDiff(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  const differs: string[] = [];
  if (a.h !== b.h) differs.push('h'), (out.h = [a.h, b.h]);
  for (const k of ['c', 'b', 's', 'v', 'o']) {
    const x = new Map(Array.isArray(a[k]) ? (a[k] as [string, number][]) : []), y = new Map(Array.isArray(b[k]) ? (b[k] as [string, number][]) : []);
    const d: Record<string, [number, number]> = {};
    for (const key of new Set([...x.keys(), ...y.keys()])) if ((x.get(key) ?? 0) !== (y.get(key) ?? 0)) d[key] = [x.get(key) ?? 0, y.get(key) ?? 0];
    if (Object.keys(d).length) differs.push(k), (out[k] = d);
  }
  for (const k of ['w', 'g']) {
    const x = Array.isArray(a[k]) ? (a[k] as string[]) : [], y = Array.isArray(b[k]) ? (b[k] as string[]) : [];
    const only = { stored: x.filter((i) => !y.includes(i)), fold: y.filter((i) => !x.includes(i)) };
    if (only.stored.length || only.fold.length || x.join() !== y.join()) differs.push(k), (out[k] = only);
  }
  return differs.length ? { differs, ...out } : null;
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
/** Rows a page of the backup's dump text (dumpText). */
const DUMP_TEXT_PAGE = 2000;
const METRIC_COLS = 'at, person, date, metric, value';
const EVENT_COLS = 'at, person, id, type, data';
const metricRow = (r: MetricCols): MetricRow => [r.at, r.person, r.date, r.metric, r.value];
const eventRow = (r: EventCols): EventRow => [r.at, r.person, r.id, r.type, r.data];
/** `at`, then `seq`. */
const byAt = (x: { at: string; seq: number }, y: { at: string; seq: number }): number => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.seq - y.seq);

/** The wallets a batch of `me`'s may move (an op's ack carries them): theirs for a ledger's event of theirs (a tally,
 *  a give-back, the shop's, the field's), each recipient's for a reward. */
function walletsTouched(me: Who, events: readonly unknown[]): Set<Who> {
  const out = new Set<Who>();
  for (const e of events) {
    if (!isRec(e) || typeof e.type !== 'string') continue;
    if (e.type === 'sg_reward') {
      if (isRec(e.data) && Array.isArray(e.data.to)) for (const w of e.data.to) if (isWho(w)) out.add(w);
    } else if (movesWallet(e.type)) out.add(me);
  }
  return out;
}

/** An event the island doesn't draw (contract/live-protocol.ts CALM_EVENTS): its change's notice is `calm`. */
const calmType = (t: unknown): boolean => (CALM_EVENTS as readonly unknown[]).includes(t);
