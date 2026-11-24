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
import { addDays, localDateAt, prevDay } from '../../app/src/lib/contract/tokyo.ts';
import { decorAccept, decorOpOf, type DecorEntry } from '../../app/src/lib/contract/decor.ts';
import { isTentPiece, tentAccept, tentOpOf, type TentEntry } from '../../app/src/lib/contract/tent.ts';
import { isRoomScope, isStanding, layoutAccept, layoutOpOf, scopeMayWrite, type LayoutEntry } from '../../app/src/lib/contract/layout.ts';
import { TodoBook, todoClean, todoLists, todoRowOf, todoSlot, type TodoListView, type TodoVerdict } from '../../app/src/lib/contract/todo.ts';
import { HikeBook, hikeClean, hikeRowOf, hikeSlot, hikeTrkAccept, type HikeVerdict } from '../../app/src/lib/contract/hike.ts';
import { HIKE_TRK_CHARS } from '../../app/src/lib/contract/hikeTrack.ts';
import { boardAccept, boardBeats, boardOpOf, cleanText, type BoardEntry } from '../../app/src/lib/contract/board.ts';
import { isPackType, packClean, PackBook, packRowOf, packSlot, PACK_TYPES, type PackVerdict } from '../../app/src/lib/contract/pack.ts';
import { isWedType, WedBook, wedClean, wedNeeds, wedRowOf, wedSlot, WNOTE_DATA_CHARS, type WedVerdict } from '../../app/src/lib/contract/wedding.ts';
import { foodAccept, foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp, repeatAccept, repeatNext, sharedAccept, type RepeatOpBy } from '../../app/src/lib/contract/food.ts';
import { CALM_EVENTS, type Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { inbodyOf } from '../../app/src/lib/contract/bodyEst.ts';
import { PLACES_OPS, verifyAdmin } from './sign.ts';
import { errName } from './log.ts';
import { isLogId, scrubMsg } from '../../app/src/lib/contract/log.ts';
import { roleOfKey, type Keys } from './auth.ts';
import { guestMayWrite, rowsFor } from '../../app/src/lib/contract/guest.ts';
import { saveName } from '../../app/src/lib/contract/roomSave.ts';
import { isExpiringRemoval, lateOp, tombCut } from '../../app/src/lib/contract/tomb.ts';
import { adjustOf, caughtOf, isShopEvent, rewardOf, shopLedger, shopRowOf, SHOP_EVENTS, type LedgerEvent, type Ledger, type ShopRow, type TallyDay } from '../../app/src/lib/contract/shop.ts';
import { emptyFarm, FARM, farmFromJson, farmJson, farmOf, farmStep, farmWaterOf, type Farm, type FarmData } from '../../app/src/lib/contract/farm.ts';
import { gameWet } from '../../app/src/lib/contract/wet.ts';
import { backCovered, isTally, mergeTally } from '../../app/src/lib/contract/tally.ts';
import { isIslandDay, mergeIslandDay } from '../../app/src/lib/contract/island.ts';
import type { PersonId, Who } from '../../app/src/lib/contract/api.ts';
import { ShareCore, SHARE_TABLES } from './share.ts';
import { addDetCols, dropOsmCols, PlacesCore, PLACES_TABLES } from './places.ts';
import { LedgerStore, LEDGER_TABLES, WHO, type FieldWire } from './ledger.ts';
import { emptyLedger, ledgerRefusal, ledgerStep, pocketMoves, pruneGames, tallyStep, type Ledger as Stored, type LedgerPart, type Ledgers } from '../../app/src/lib/contract/ledger.ts';
import { isPocketKey } from '../../app/src/lib/contract/shop.ts';
import { isShareAction, isShareKind } from '../../app/src/lib/contract/share.ts';
/** A share's kind as the log names it. */
const shareLogKind = (k: unknown): 'trip' | 'trips' | 'other' => (isShareKind(k) ? k : 'other');
import { nightlyAges, PRUNE_BATCH, runNightly, type NightlyDeps } from './nightly.ts';
import { IMG_TABLE, imgCheck, imgGc, imgGet, imgId, imgLoad, imgPut, imgRows, unb64, type ImgErr } from './img.ts';

type Rec = Record<string, unknown>;
type Bind = string | number | null | ArrayBuffer | Uint8Array;

/** The SQL the store needs: Durable Objects' `ctx.storage.sql` (and node:sqlite in the tests). */
export interface Sql {
  exec<T extends Record<string, Bind> = Record<string, Bind>>(query: string, ...bindings: Bind[]): { toArray(): T[] };
}

/** A statement that deletes, changes or drops Apple Health's rows (the `metrics` table itself: never pruned or
 *  compacted, the user's standing rule); keepMetrics refuses it. test/metrics-kept.test.ts checks the source too. */
export const METRICS_TOUCH = /\b(?:DELETE\s+FROM|DROP\s+TABLE(?:\s+IF\s+EXISTS)?|UPDATE(?:\s+OR\s+\w+)?|(?:INSERT\s+OR\s+)?REPLACE\s+INTO|ALTER\s+TABLE|TRUNCATE(?:\s+TABLE)?)\s+["`]?metrics\b/i;

/** `sql` that throws on a METRICS_TOUCH statement (before it runs). */
export function keepMetrics(sql: Sql): Sql {
  return {
    exec: (q, ...b) => {
      if (METRICS_TOUCH.test(q)) throw new Error('metrics are never deleted or changed');
      return sql.exec(q, ...b);
    }
  } as Sql;
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
  /** The stored ledger's events to the log (ledgerReady's `ledger.seed`, ledgerCheck's `ledger.drift`). */
  log?(e: 'ledger.seed' | 'ledger.drift' | 'share', d: Record<string, string | number | boolean>): void;
  /** A `todo` row was kept (やること's reminders: the object re-arms its alarm, pusher.ts). */
  onTodo?(): void;
}

export const RATE_PER_MINUTE = 120;
/** A snapshot's later pages (`after`) per key per minute: their own budget, so a cold fetch of a big record (a page
 *  each SNAPSHOT_PAGE rows) never spends the writes' (O9). */
export const PAGES_PER_MINUTE = 600;
const MAX_EVENT_DATA_CHARS = 20_000;
/** The shop's and the field's event types whose rows the stored ledger made history (ledgerRetire, ledgerPrune), and how long the daily
 *  prune keeps a new one (a phone's ack shows it till its snapshot holds it). */
const RETIRED = ['sell', 'buy', 'buy_starts', 'sg_reward', 'shop_adjust', 'farm'];
const RETIRED_KEEP_DAYS = 2;
/** A day's tally and give-back kept this long (past TALLY_PAST_DAYS, the oldest a phone may send again: the resend's
 *  growth is reckoned against the held day). */
const TALLY_KEEP_DAYS = 36;
/** What the admin's `ledger_retire` must say to run. */
const RETIRE_CONFIRM = 'retire-ledger-rows';
/** The wallets' `seq` from the stored ledger (walletsFor): its `hp` count past this, above any running ledger's. */
const WALLET_SEQ_FROM = 1_000_000;
const UPLOADS_SHOWN = 20;
/** The running field's meta key, named by the growth rules its plots' `from` were reckoned under (contract/farm.ts
 *  FARM): a rule change finds no copy and folds the rows again, once (review 11/14: a 3-day copy refused 1-day harvests). */
const FARM_META = `farm|g${FARM.growDays}r${FARM.regrowDays}`;
/** The ingest audit keeps this long (ms): each ingest lets older rows go. */
const UPLOADS_KEEP_MS = 60 * 86_400_000;
/** The newest `at` of a removal let go (tombPrune), and the mark on a snapshot's `rev` for a `since` before it; the
 *  `at` its look through the removals has reached (its cursor). */
const TOMB_META = 'tomb_cut', TOMB_REV = '~t', TOMB_SCAN = 'tomb_scan';
/** A late row is returned to a poll whose `since` is at most this much after its arrival (the servers' clocks). */
export const LATE_MARGIN_MS = 10_000;
/** The admin ops taken once per signature (a replay within the window would restore, start an epoch or purge again). */
const ADMIN_ONCE = ['restore', 'rev', 'logpurge'];
/** How long their signatures are remembered: past the signature's own window (±5 minutes) on both sides. */
const ADMIN_SEEN_MS = 10 * 60_000;
const SEQ_MAX = 9e15;
const utf8 = new TextEncoder();

/** The meal log's events, each one's latest op per id kept by its owner's rule (contract/food.ts foodAccept; a recipe's
 *  and a custom food's by anyone, under its creator's name: sharedAccept). */
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
  'CREATE INDEX IF NOT EXISTS uploads_person ON uploads (person, seq)'
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
  },
  // 6 (2026-11-20): the custom foods' pictures (img.ts: `food_custom` `img`), a row each, its bytes a BLOB
  (sql) => void sql.exec(IMG_TABLE),
  // 7 (2026-11-20): 共有リンク (share.ts): the links, their visits, the day's visitor hashes
  (sql) => {
    for (const q of SHARE_TABLES) sql.exec(q);
  },
  // 8 (2026-11-22): 行きたい場所 (places.ts): the shared Maps list, its categories and OpenStreetMap's hours
  (sql) => {
    for (const q of PLACES_TABLES) sql.exec(q);
  },
  // 9 (2026-11-23): 行きたい場所: the uncategorised by an index (places_uncat) (and OpenStreetMap's matches looked up
  // again: gone with its columns, step 12)
  (sql) => {
    for (const q of PLACES_TABLES) sql.exec(q);
  },
  // 10 (2026-11-24): the stored ledger (ledger.ts): each person's かいがら, pocket, pieces, games and ずかん totals, kept
  // in place, and the log of the ops applied (docs/backend.md#the-ledger); seeded at each person's first op (ledgerReady)
  (sql) => {
    for (const q of LEDGER_TABLES) sql.exec(q);
  },
  // 11 (2026-11-24): 行きたい場所: Google's details on each place (places.ts DET_COLS: the daily scrape's, admin
  // places_details), the vendored files' successor
  (sql) => addDetCols(sql),
  // 12 (2026-11-24): 行きたい場所: OpenStreetMap's columns dropped (places.ts dropOsmCols)
  (sql) => dropOsmCols(sql),
  // 13 (2026-11-24): 行きたい場所: each card's openings (places.ts place_opens: the details queue's order)
  (sql) => {
    for (const q of PLACES_TABLES) sql.exec(q);
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
  /** 共有リンク's links and visits (share.ts dumpRows). */
  share?: unknown[][];
  share_visit?: unknown[][];
  /** 行きたい場所's rows (places.ts dumpRows). */
  places?: unknown[][];
  /** The stored ledger's rows and its log (ledger.ts). */
  ledger?: unknown[][];
  ledger_log?: unknown[][];
}

export interface ImportResult {
  metrics: number; events: number; uploads: number; skipped: number; held?: number; share?: number; share_visit?: number; places?: number;
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

  /** 共有リンク (share.ts): the members' actions, the visitor's read, the sweep. */
  readonly share: ShareCore;
  /** 行きたい場所 (places.ts): the list's rows, the ticks' writes, `GET /places`. */
  readonly places: PlacesCore;
  /** The stored ledger (ledger.ts): each person's parts, the ops' log. */
  readonly ledger: LedgerStore;

  constructor(private io: StoreIO) {
    io = this.io = { ...io, sql: keepMetrics(io.sql) };
    for (const s of SCHEMA) io.sql.exec(s);
    this.migrate();
    this.ledger = new LedgerStore(io.sql);
    this.places = new PlacesCore({ sql: io.sql, tx: io.tx, now: io.now, meta: (k) => this.meta(k), setMeta: (k, v) => this.setMeta(k, v) });
    this.share = new ShareCore({
      sql: io.sql, tx: io.tx, now: io.now, meta: (k) => this.meta(k), setMeta: (k, v) => this.setMeta(k, v),
      // (a `trips` link's snapshot: the packing query alone, its four event types; built again when they change)
      source: { pack: (trip) => this.packBook(trip) },
      version: () => {
        // (a slot's row replaced in place keeps its seq: its `at`, the record's clock, moves on)
        const r = io.sql.exec<{ n: number; s: number | null; at: string | null }>(`SELECT count(*) AS n, max(seq) AS s, max(at) AS at FROM events WHERE type IN (${PACK_TYPES.map(() => '?').join(', ')})`, ...PACK_TYPES).toArray()[0];
        return `${Number(r?.n ?? 0)}|${Number(r?.s ?? 0)}|${r?.at ?? ''}`;
      }
    });
    // another relay's copy of the field (a rollback to other rules, or to before FARM_META) means rows this copy lacks:
    // both go, and the first farm op folds them again (review 11/14 r3: a dig kept by the older relay, harvested again)
    // (the stored field too, while the farm rows are kept to fold: never once the ledger is the record's alone)
    if (io.sql.exec("SELECT 1 FROM meta WHERE (k = 'farm' OR k LIKE 'farm|%') AND k != ? LIMIT 1", FARM_META).toArray().length) {
      io.sql.exec("DELETE FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'");
      if (!io.sql.exec("SELECT 1 FROM meta WHERE k = 'ledger_only'").toArray().length) this.ledger.dropField();
    }
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
  async signedOp(text: string, t: string | null, sig: string | null): Promise<{ op: Rec; by: 'admin' | 'places' } | { status: number; body: string }> {
    const by = await verifyAdmin(this.io.keys, t, sig, text, this.io.now());
    if (!by) return { status: 401, body: 'unauthorized' };
    let o: unknown;
    try {
      o = JSON.parse(text);
    } catch {
      return { status: 400, body: 'bad request' };
    }
    if (!isRec(o) || typeof o.op !== 'string') return { status: 400, body: 'bad request' };
    // PLACES_KEY's signature: its few ops only, each signature once
    if (by === 'places' && !PLACES_OPS.includes(o.op)) return { status: 403, body: 'forbidden' };
    if ((by === 'places' || ADMIN_ONCE.includes(o.op)) && sig && !this.firstSeen(sig)) return { status: 409, body: 'replayed' };
    return { op: o, by };
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
    if (!isRec(rows) || !(['metrics', 'events', 'uploads', 'held', 'share', 'share_visit', 'places', 'ledger', 'ledger_log'] as const).every((k) => rows[k] === undefined || Array.isArray(rows[k]))) return { ok: false, error: 'bad_request' };
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
    // the guest (docs/backend.md#the-guest): no Health data in, no audit to read (the uploads hold the members' bodies)
    if (me === 'G' && (body.action === 'ingest' || body.action === 'uploads')) return fail('forbidden');
    if (isShareAction(body.action)) return this.shareAct(me, body.action, body);
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

  /** A share action (share.ts), its make or change logged (`share`: never the token or the id). */
  private shareAct(me: Who, action: Parameters<ShareCore['api']>[1], body: Rec): Reply {
    const t0 = this.io.now();
    const r = this.share.api(me, action, body);
    if (action === 'share_make' || action === 'share_set') {
      this.io.log?.('share', { op: action === 'share_make' ? 'make' : 'set', kind: shareLogKind((r.row as { kind?: string } | undefined)?.kind ?? body.kind), ok: r.ok, ...(r.ok ? {} : { why: r.detail === 'cap' ? 'cap' : 'bad' }), ms: this.io.now() - t0 });
    }
    return r;
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
    // every row but, for the guest, the body data (contract/guest.ts rowsFor)
    // (and the かいがら: the relay's wallets, the phones' number since 2026-11-18, walletsFor; with a first fetch or
    // rows only, as a wallet moves only with a row kept, so a poll with nothing new still reads nothing; read before
    // the head's rev, as an older relay's ledger read starts a new epoch: shopState)
    const wallets = (rows: SnapshotRows) => (!since || rows.metrics.length || rows.events.length ? { wallets: this.walletsFor(me) } : {});
    // (the stored ledgers' parts changed after `since`, all on a first fetch, ledger.ts: on a paged fetch's last page,
    // read with its rows, so a part is never older than a row the fetch brought; always there, if empty: a reply
    // without it is an older relay's, and the phones fold the rows again)
    const ledgers = (): Rec => {
      // (and the stored field, when it changed since: ledger.ts fieldWire)
      const field = this.ledger.fieldWire({ since });
      return { ledgers: this.ledger.wire(undefined, since), ...(field ? { field } : {}) };
    };
    const head = () => ({ ok: true, me, now: new Date(this.io.now()).toISOString(), rev: this.rev() });
    // a cache from before a removal let go (tombPrune) may still hold its item: another `rev`, so the phone fetches
    // everything (an older build too: it starts over on any rev but its cache's)
    const cut = this.meta(TOMB_META);
    if (since && cut && since < cut) return { ...head(), rev: `${this.rev()}${TOMB_REV}`, rows: { metrics: [], events: [] } };
    if (!page) {
      const rows = this.rowsSince(since), w = wallets(rows);
      return { ...head(), rows: rowsFor(me, rows), ...w, ...ledgers() };
    }
    const p = this.rowsPage(since, page.after, page.limit), w = wallets(p.rows);
    return { ...head(), rows: rowsFor(me, p.rows), ...(p.next ? { next: p.next } : {}), ...w, ...(p.next ? {} : ledgers()) };
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
    this.ledger.written.clear();
    const r = this.keep(me, body);
    if (r.ok && r.at) this.io.notify({ what: 'event', who: me, at: r.at, rev: this.rev(), ...(this.sid ? { sid: this.sid } : {}), ...(calmType(body.type) ? { calm: true } : {}) });
    const { at: _at, ...reply } = r;
    const touched = walletsTouched(me, [body]);
    return { ...reply, ...(touched.size ? { wallets: this.walletsFor(me, touched) } : {}), ...this.ledgersMoved(touched) };
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
    this.ledger.written.clear();
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
    return { ok: true, results, ...(touched.size ? { wallets: this.walletsFor(me, touched) } : {}), ...this.ledgersMoved(touched) };
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
      // やること's titles and items: one clean line each (contract/todo.ts todoClean)
      : body.type === 'todo' ? todoClean(sent)
      // トレイル's hikes: the name and area one clean line, the notes clean (contract/hike.ts hikeClean)
      : body.type === 'hike' ? hikeClean(sent)
      // a saved room's name: one clean line (contract/roomSave.ts saveName)
      : body.type === 'room_save' && typeof sent.name === 'string' ? { ...sent, name: saveName(sent.name) } : sent;
    // the profile is locked (2026-11-15): no one sets or clears a sex or a birth date; a change
    // takes a code change (docs/backend.md `pref`). An older app drops it as any `forbidden`.
    if (body.type === 'pref' && PROFILE_PREF_KEYS.includes(data.key as string)) return fail('forbidden', 'profile locked');
    // the guest writes what a member does, but a からだ goal (contract/guest.ts)
    if (me === 'G' && !guestMayWrite(body.type, data)) return fail('forbidden');
    // a scoped decor op: a home's look and room its owner's, the outdoors anyone's (contract/layout.ts)
    if (body.type === 'decor' && !scopeMayWrite(me, data)) return fail('forbidden');
    const json = JSON.stringify(data);
    // (the wedding note its own cap: a document, contract/wedding.ts; a hike's track its own: contract/hikeTrack.ts)
    if (json.length > (body.type === 'wnote' ? WNOTE_DATA_CHARS : body.type === 'hike_trk' ? HIKE_TRK_CHARS : MAX_EVENT_DATA_CHARS)) return fail('too_large');
    const subject = eventSubject(body.type, data, me);
    if (!subject || !validEvent(body.type, data, this.io.now())) return fail('bad_request');
    // each person sets only their own goals (the user, 2026-11-24): a goal naming another (`person`) is refused
    if (subject !== me) return fail('forbidden', 'not your goal');
    const type = body.type;
    return tx((): Reply & { at?: string } => {
      if (this.known(id)) return { ok: true, duplicate: true };
      if (type === 'spend_void') {
        const v = this.voidTarget(data.spendId as string);
        // a void names a buy in the record; a second void of it (the other phone got there first) changes nothing
        if (v === 'missing') return fail('bad_request', 'no such spend');
        if (v === 'voided') return { ok: true, duplicate: true };
      }
      // an op on an empty slot whose item is older than a removal's keep: it may have been removed, its row let go
      // (contract/tomb.ts lateOp; tombPrune), so acknowledged and dropped
      if (lateOp(type, data, this.io.now())) {
        const sl = eventSlot(type, me, subject, data, this.io.now());
        if (sl && !this.slotRow(sl)) return this.stale(id);
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
        // (the stored ledger's judgement, ledger.ts: the running one only kept beside it)
        const why = this.ledgerTarget(me, type, data);
        if (why) return fail('bad_request', why === 'owned' ? 'owned' : `${why} short`);
      }
      // 英語すごろく's reward: kept while it pays one of its recipients (contract/shop.ts: a game pays each once)
      const rewardTo = type === 'sg_reward' ? rewardOf(data)?.to ?? [] : [];
      if (type === 'sg_reward' && rewardTo.every((who) => this.ledgerTarget(who, type, data))) return fail('bad_request', 'reward paid');
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
      // (who the row is kept under: the sender, but a recipe's or a custom food's creator for an edit by anyone)
      let by = me;
      let bookDrop: string[] = [];
      // a hike's track: only for a hike held standing, only once (contract/hike.ts hikeTrkAccept)
      if (type === 'hike_trk' && this.hikeTrkTarget(data) === 'stale') return this.stale(id);
      if (isPackType(type) || isWedType(type) || type === 'todo' || type === 'hike') {
        // a trip's packing list (each person only their own ticks; the trip's cap: contract/pack.ts PackBook) or the
        // wedding board (a subtask only under a task held, the cap: contract/wedding.ts WedBook): an op beaten by the one held is acknowledged;
        // kept as the rules keep it (a note saved over one it wasn't edited from carries that one); やること's lists
        // (anyone's: a list's removal drops its items, the cap: contract/todo.ts TodoBook); トレイル's hikes (anyone's: a
        // removal drops its track, the cap: contract/hike.ts HikeBook)
        const kind = isPackType(type) ? 'pack' : isWedType(type) ? 'wedding' : type === 'todo' ? 'todo' : 'hike';
        const v = kind === 'pack' ? this.packTarget(me, type, data) : kind === 'wedding' ? this.wedTarget(me, type, data) : kind === 'todo' ? this.todoTarget(me, data) : this.hikeTarget(me, data);
        if (v.v !== 'append') {
          if (v.v !== 'stale') return fail('bad_request', `${kind} ${v.v}`);
          return this.stale(id);
        }
        bookDrop = v.drop;
        kept = JSON.stringify(v.row.op);
      }
      if (isFoodType(type)) {
        // only its owner changes an entry or a repeat; a recipe or a custom food anyone, kept under its creator's name,
        // removed by its creator alone (sharedAccept); an op beaten by the one held is acknowledged (contract/food.ts
        // foodAccept); a repeat's skipped days are never lost (repeatAccept)
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
        kept = JSON.stringify(v.op);
        by = v.who;
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
      // the field's waterings that count, kept on their plots before the island days go (farmWaterNote): an island
      // day's, and a plant's or a harvest's after one that day
      if (type === 'island') this.islandWaterNote(kept);
      if (farm) this.farmWaterNote(farm.f, farm.data.ops.flatMap((op) => (op.o === 'dig' ? [] : [op.p])));
      const at = this.nextAt();
      if (drop) this.io.sql.exec('DELETE FROM events WHERE slot = ?', `board|${drop}`);
      for (const sl of bookDrop) this.io.sql.exec('DELETE FROM events WHERE slot = ?', sl);
      if (type === 'decor' && data.sc === 'r' && typeof data.at === 'number') this.dropVoided(data.at);
      const slot = eventSlot(type, me, subject, data, Date.parse(at));
      const wasDecor = type === 'decor' && slot ? this.io.sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null : null;
      // the stored ledger (ledgerNote): a tally's or a give-back's growth is the kept row less the one it replaces
      const was = (type === 'tally' || type === 'tally_back') && slot ? this.slotTally(slot) : null;
      // (each ledger it moves seeded first, before this row is in: ledgerReady)
      const ledgers = type === 'tally' || type === 'tally_back' || type === 'farm' || isShopEvent(type) ? [me] : rewardTo;
      for (const who of ledgers) this.ledgerReady(who);
      this.put(id, at, by, type, kept, slot, null);
      if (farm) this.farmNote(farm.f, at);
      if (type === 'tally' || type === 'tally_back' || type === 'farm' || type === 'sg_reward' || isShopEvent(type)) this.ledgerNote(me, id, at, type, kept, was, rewardTo, farm);
      if (type === 'decor') this.decorNote(me, data, wasDecor);
      if (type === 'todo') this.io.onTodo?.();
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

  /** A `todo` op against every list and item the record holds (contract/todo.ts TodoBook accept: at most TODO_MAX
   *  standing, so the whole book is small). */
  private todoTarget(me: Who, d: Rec): TodoVerdict {
    const row = todoRowOf('todo', d, me);
    return row ? this.todoBook().accept(row) : { v: 'stale' };
  }
  /** The lists as the record holds them (やること's reminders: pusher.ts). */
  todoLists(): TodoListView[] {
    return todoLists(this.todoBook());
  }
  private todoBook(): TodoBook {
    const b = new TodoBook();
    for (const r of this.io.sql.exec<{ person: string; data: string }>("SELECT person, data FROM events WHERE type = 'todo'").toArray()) {
      const x = this.rowRec(r.data, 'todo');
      const row = x && isWho(r.person) ? todoRowOf('todo', x, r.person) : null;
      if (row) b.put(row);
    }
    return b;
  }

  /** A `hike` op against every hike the record holds (contract/hike.ts HikeBook accept: at most HIKE_MAX standing, so
   *  the whole book is small; their tracks are rows of their own, never read here). */
  private hikeTarget(me: Who, d: Rec): HikeVerdict {
    const row = hikeRowOf('hike', d, me);
    if (!row) return { v: 'stale' };
    const b = new HikeBook();
    for (const r of this.io.sql.exec<{ person: string; data: string }>("SELECT person, data FROM events WHERE type = 'hike'").toArray()) {
      const x = this.rowRec(r.data, 'hike');
      const held = x && isWho(r.person) ? hikeRowOf('hike', x, r.person) : null;
      if (held) b.put(held);
    }
    return b.accept(row);
  }
  /** A `hike_trk` against its hike's row and any track held (contract/hike.ts hikeTrkAccept). */
  private hikeTrkTarget(d: Rec): 'append' | 'stale' {
    const h = this.slotRow(`hike|${String(d.id)}`);
    const hx = h && isWho(h.person) ? this.rowRec(h.data, 'hike') : null;
    const had = this.io.sql.exec('SELECT 1 AS x FROM events WHERE slot = ?', `hike_trk|${String(d.id)}`).toArray().length > 0;
    return hikeTrkAccept(hx ? hikeRowOf('hike', hx, h!.person as Who) : null, had);
  }

  /** A slot's row (its sender, type and data), or null. */
  private slotRow(slot: string): { person: string; type: string; data: string } | null {
    return this.io.sql.exec<{ person: string; type: string; data: string }>('SELECT person, type, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null;
  }

  /** A meal, a repeat, a recipe or a custom food op against the entry's (the repeat's, the recipe's) latest op the record holds (its
   *  slot's row, with who sent it): `forbidden`, `stale` (nothing to keep), or the op its slot then keeps (a repeat's
   *  with every op's skipped days: contract/food.ts repeatAccept) and who it is kept under (the sender; a recipe's or a
   *  custom food's creator, whoever edited it: sharedAccept). */
  private foodTarget(type: FoodType, me: Who, d: Rec): 'forbidden' | 'stale' | { op: Rec; who: Who } {
    const parse = FOOD_PARSE[type];
    const held = this.foodHeld(type, String(d.id));
    const e = { ...parse(d)!, who: me };
    if (type === 'food_repeat') {
      const { v, keep } = repeatAccept(held as RepeatOpBy | null, e as RepeatOpBy);
      if (v === 'forbidden') return v;
      if (!keep) return 'stale';
      const { who: _who, ...op } = keep;
      return { op, who: me };
    }
    const shared = type === 'food_recipe' || type === 'food_custom';
    const v = (shared ? sharedAccept : foodAccept)(held, e);
    return v === 'append' ? { op: parse(d)!, who: shared && held ? held.who : me } : v;
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

  /** A tally slot's counts as held (none: empty). */
  private slotTally(slot: string): Record<string, number> {
    const held = this.io.sql.exec<{ data: string }>('SELECT data FROM events WHERE slot = ?', slot).toArray()[0];
    const h = held ? this.rowRec(held.data, 'tally') : null;
    return h && isTally(h) ? h.counts : {};
  }

  /** The field's running copy let go (a load or an import brought rows past it: folded again at the next read). The
   *  stored ledgers stay as they are (a load never moves one: ledger.ts; a load into an empty record seeds them again). */
  private shopForget(): void {
    this.io.sql.exec("DELETE FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'");
  }

  /** The wallets a phone is told (a reply's `wallets`, an older build's number): `who`'s of them (all by default),
   *  each the stored ledger's かいがら and its `hp` count past WALLET_SEQ_FROM (above the running ledger's count a phone
   *  heard before 2026-11-24: it keeps each person's highest); everyone's to anyone, the guest's phone too. */
  private walletsFor(_me: Who, who: Iterable<Who> = ['A', 'B', 'G']): Partial<Record<Who, { h: number; seq: number }>> {
    const out: Partial<Record<Who, { h: number; seq: number }>> = {};
    for (const w of who) {
      // (one not seeded yet: its rows' fold, read only; a read never writes)
      const r = this.io.sql.exec<{ seq: number; v: string }>("SELECT seq, v FROM ledger WHERE who = ? AND part = 'hp'", w).toArray()[0];
      out[w] = { h: r ? (JSON.parse(r.v) as { h: number }).h : Math.max(0, this.shopFold(w).l.shells), seq: WALLET_SEQ_FROM + (r?.seq ?? 0) };
    }
    return out;
  }

  /** The admin's `shopcheck {fix?}`: the stored field against the fold of the farm rows, while they're kept (`fix`: the
   *  fold's taken); the ledgers' check is `ledgercheck`. */
  shopCheck(o: Rec = {}): Record<string, unknown> {
    const kept = this.ledger.field();
    if (!kept) return { ok: true, farm: 'none' };
    if (this.ledgerOnly()) return { ok: true, farm: 'kept' };
    const fold = this.farmFold();
    const farm = plotsJson(kept) === plotsJson(fold) ? 'same' : 'differs';
    if (o.fix === true && farm === 'differs') this.farmNote(fold, this.nextAt());
    return { ok: true, farm };
  }

  /** The admin's `wallet`: each person's stored かいがら (`h`, its `hp` count `seq`, the last change `at`) and the fold
   *  of their rows beside it (`fold`, while the rows are kept). */
  wallets(): Record<string, unknown> {
    const out: Record<string, unknown> = { ok: true };
    for (const r of this.ledger.rows()) if (r[1] === 'hp') out[r[0]] = { h: (JSON.parse(r[4]) as { h: number }).h, seq: r[2], at: r[3], ...(this.ledgerOnly() ? {} : { fold: this.shopFold(r[0] as Who).l.shells }) };
    return out;
  }

  /** The admin's `adjust {id, who, v, note}`: a `shop_adjust` row of `who`'s (contract/shop.ts adjustOf: `v` かいがら
   *  added, either sign; the phones fetch it as any new row) and its step into their stored ledger (never below 0).
   *  `id` the caller's (a retry is acknowledged as `duplicate`). The only way one comes in besides a dump's `load`: a
   *  phone's is refused (contract/record.ts validEventData). Undone by another, of `−v`. */
  adjust(o: Rec): Record<string, unknown> {
    const { id, who } = o;
    const data = { v: o.v, note: o.note };
    if (!isId(id) || !isWho(who) || !adjustOf(data)) return { ok: false, error: 'bad_request' };
    const r = this.io.tx((): Record<string, unknown> => {
      if (this.known(id)) return { ok: true, duplicate: true };
      this.ledgerReady(who);
      const before = this.ledger.read(who, ['hp'])!.h;
      const at = this.nextAt(), json = JSON.stringify(data);
      this.put(id, at, who, 'shop_adjust', json, null, null);
      this.ledgerNote(who, id, at, 'shop_adjust', json, null, [], null);
      return { ok: true, id, at, before, after: this.ledger.read(who, ['hp'])!.h };
    });
    // (an `ingest`: never skipped as a phone's own event; the guest hears of it too, its かいがら among them)
    if (typeof r.at === 'string') this.io.notify({ what: 'ingest', who, at: r.at, rev: this.rev() }, true);
    return r;
  }

  /** The admin's `walletset {id, who, h, note}`: `who`'s stored かいがら made `h`, logged (`note` its reason, in the
   *  log's data); nothing written when they are `h` already (`same`). The phones hear of it as any change. */
  walletSet(o: Rec): Record<string, unknown> {
    const { id, who, h, note } = o;
    if (!isId(id) || !isWho(who) || typeof h !== 'number' || !Number.isInteger(h) || h < 0 || !adjustOf({ v: 1, note })) return { ok: false, error: 'bad_request' };
    const r = this.io.tx((): Record<string, unknown> => {
      if (this.known(id)) return { ok: true, duplicate: true };
      this.ledgerReady(who);
      const before = this.ledger.read(who, ['hp'])!.h;
      if (before === h) return { ok: true, same: true, h };
      this.io.sql.exec('INSERT INTO ids (id) VALUES (?)', id);
      const at = this.ledgerSet(who, id, 'walletset', h, note as string);
      return { ok: true, at, before, after: h };
    });
    if (typeof r.at === 'string') this.io.notify({ what: 'ingest', who: who as Who, at: r.at, rev: this.rev() }, true);
    return r;
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

  // ---------------------------------------------------------------- the stored ledger (ledger.ts)

  /** `who`'s stored ledger as their rows say it (shopFold): the かいがら (never below 0), the pocket (their tallies' and the field's goods less sold, of a pocket's kind), the pieces (each its first
   *  buy's time), the games (each its day), the ずかん totals (their tallies less their give-backs). The seed's, and the
   *  daily check's other side. */
  private ledgerFold(who: Who): Stored {
    // (the field folded from its rows too, never its running copy: farmFold)
    const st = this.shopFold(who, this.farmFold()), sql = this.io.sql;
    const l = emptyLedger();
    l.h = Math.max(0, st.l.shells);
    for (const k of new Set([...st.caught.keys(), ...st.l.sold.keys()])) {
      const n = (st.caught.get(k) ?? 0) - (st.l.sold.get(k) ?? 0);
      if (n > 0 && isPocketKey(k)) l.p.set(k, n);
    }
    const bought = new Map<string, number>();
    for (const r of sql.exec<{ at: string; data: string }>("SELECT at, data FROM events WHERE type = 'buy' AND person = ? ORDER BY at, seq", who).toArray()) {
      const x = this.rowRec(r.data, 'shop'), row = x ? shopRowOf('buy', x) : null;
      if (row?.type === 'buy' && !bought.has(row.data.item)) bought.set(row.data.item, Date.parse(r.at));
    }
    l.w = st.l.owned.map((c) => [c, bought.get(c) ?? 0]);
    const days = new Map<string, string>();
    for (const r of sql.exec<{ data: string }>("SELECT data FROM events WHERE type = 'sg_reward'").toArray()) {
      const x = this.rowRec(r.data, 'shop'), d = x ? rewardOf(x) : null;
      if (d?.to.includes(who) && !days.has(d.g)) days.set(d.g, d.d);
    }
    for (const g of st.l.games) l.g.set(g, days.get(g) ?? localDateAt(this.io.now()));
    for (const r of sql.exec<{ type: string; data: string }>("SELECT type, data FROM events WHERE type IN ('tally', 'tally_back') AND person = ?", who).toArray()) {
      const t = this.rowRec(r.data, 'tally');
      if (!t || !isTally(t)) continue;
      for (const k in t.counts) l.z.set(k, (l.z.get(k) ?? 0) + (r.type === 'tally_back' ? -t.counts[k] : t.counts[k]));
    }
    for (const [k, n] of l.z) if (n <= 0) l.z.delete(k);
    return l;
  }

  /** `who`'s stored ledger, seeded from the running one (ledgerFold, `ledger.seed`) when there's none yet: before an op
   *  of theirs goes in (its row not in the rows yet), so the op steps it as it steps the running one. */
  private ledgerReady(who: Who): void {
    if (this.ledger.has(who)) return;
    const l = this.ledgerFold(who);
    this.ledger.seed(who, l, this.nextAt());
    this.io.log?.('ledger.seed', { who, h: l.h, p: l.p.size, w: l.w.length, z: l.z.size });
  }

  /** A kept row into the stored ledgers it moves (made ready before it went: ledgerReady), each step logged: a tally's
   *  or a give-back's growth over the row it replaced (`was`), the shop's rows and a correction (the sender's), a
   *  reward (each recipient it paid), the field's goods (`farm`: the sender's field net before and after). A shop row
   *  the stored ledger refuses where the running one kept it: a drift, logged (the daily check shows it). */
  private ledgerNote(me: Who, id: string, at: string, type: string, kept: string, was: Record<string, number> | null, rewardTo: readonly Who[], farm: { f: Farm; before: ReadonlyMap<string, number> } | null): void {
    const t = Date.parse(at), d = this.rowRec(kept, 'shop');
    // (only the parts an op may move are read: a sale's `hp`, a buy's and `w`, a reward's and `g`, a tally's and `z`)
    const parts: LedgerPart[] = type === 'buy' ? ['hp', 'w'] : type === 'sg_reward' ? ['hp', 'g'] : type === 'tally' || type === 'tally_back' ? ['hp', 'z'] : ['hp'];
    const step = (who: Who, fn: (l: Stored, moved: Set<LedgerPart>) => void) => {
      const l = this.ledger.read(who, parts);
      if (!l) return;
      const h0 = l.h, moved = new Set<LedgerPart>();
      fn(l, moved);
      if (!moved.size) return;
      this.ledger.write(who, l, moved, at);
      this.ledger.log(at, who, id, type, kept, h0, l.h);
    };
    if (!d) return;
    if (type === 'tally' || type === 'tally_back') {
      if (isTally(d)) step(me, (l, m) => tallyStep(l, d.counts, was, type === 'tally_back', m));
    } else if (type === 'farm') {
      if (!farm) return;
      const net = farm.f.net[me] ?? new Map<string, number>();
      const moves = [...new Set([...net.keys(), ...farm.before.keys()])].map((k) => [k, (net.get(k) ?? 0) - (farm.before.get(k) ?? 0)] as const);
      step(me, (l, m) => pocketMoves(l, moves, m));
    } else if (isShopEvent(type) || type === 'shop_adjust') {
      const row = shopRowOf(type, d);
      if (row) step(me, (l, m) => {
        const why = ledgerStep(l, row, t, m);
        if (why) this.io.log?.('ledger.drift', { who: me, part: 'refused', stored: l.h, fold: 0, keys: 0 });
      });
    } else if (type === 'sg_reward') {
      const row = shopRowOf('sg_reward', d), today = localDateAt(this.io.now());
      if (row) for (const who of rewardTo) step(who, (l, m) => {
        if (pruneGames(l, today)) m.add('g');
        ledgerStep(l, row, t, m);
      });
    }
  }

  /** `who`'s stored かいがら made `h` by an admin op (walletset, unadjust), logged. */
  private ledgerSet(who: Who, id: string, type: string, h: number, note: string): string {
    this.ledgerReady(who);
    const l = this.ledger.read(who, ['hp'])!;
    const at = this.nextAt(), h0 = l.h;
    l.h = h;
    this.ledger.write(who, l, ['hp'], at);
    this.ledger.log(at, who, id, type, JSON.stringify({ h, note }), h0, h);
    return at;
  }

  /** Whether the record keeps no shop rows to fold (meta `ledger_only`: the stored ledger alone since the admin's
   *  `ledger_retire`), so nothing is checked against a fold. */
  private ledgerOnly(): boolean {
    return this.meta('ledger_only') !== null;
  }

  /** Why the stored ledger refuses a sell, a buy, starts or a reward of `who`'s (contract/ledger.ts ledgerRefusal), or
   *  null: `pocket`, `wallet`, `owned`, `paid`. Seeded first (ledgerReady). */
  private ledgerTarget(who: Who, type: LedgerEvent, d: Rec): 'pocket' | 'wallet' | 'owned' | 'paid' | null {
    this.ledgerReady(who);
    const row = shopRowOf(type, d);
    if (!row) return 'pocket';
    return ledgerRefusal(this.ledger.read(who, type === 'buy' ? ['hp', 'w'] : type === 'sg_reward' ? ['hp', 'g'] : ['hp'])!, row);
  }

  /** The stored ledgers' parts this request wrote and the `hp` of each person its events may have moved, kept or
   *  refused (`touched`: a refused buy's ack says the かいがら as they are, as the wallets do), each its state now (an
   *  ack's `ledgers`), or nothing. */
  private ledgersMoved(touched: ReadonlySet<Who> = new Set()): { ledgers?: Ledgers; field?: FieldWire } {
    const keys = new Set(this.ledger.written);
    for (const w of touched) if (this.ledger.has(w)) keys.add(`${w}|hp`);
    const field = this.ledger.fieldWire({ written: this.ledger.written });
    return { ...(keys.size ? { ledgers: this.ledger.wire(keys) } : {}), ...(field ? { field } : {}) };
  }

  /**
   * The daily check of the stored ledgers (the 03:00 cron's and the admin's `ledgercheck`): each person's log's chain
   * (each op's かいがら before its last one's after, the last one's after the stored value) and, while the rows are kept
   * (ledgerOnly), its pocket, pieces, games and totals against their fold (ledgerFold); one not seeded yet seeded first
   * (ledgerReady). Each part that differs a `ledger.drift` (its keys apart: `keys`); never fixed by itself. The log's
   * rows past LOG_KEEP_DAYS let go.
   */
  ledgerCheck(): { ok: true; drift: { who: Who; part: string; stored: number; fold: number; keys: string[] }[]; pruned: number } {
    const drift: { who: Who; part: string; stored: number; fold: number; keys: string[] }[] = [];
    const sum = (m: ReadonlyMap<string, number>) => [...m.values()].reduce((a, n) => a + n, 0);
    const mapDiff = (a: ReadonlyMap<string, number>, b: ReadonlyMap<string, number>) => [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k)).sort();
    for (const who of WHO) {
      // (one not seeded yet: seeded now, as their next op would)
      if (!this.ledger.has(who)) this.io.tx(() => this.ledgerReady(who));
      const l = this.ledger.read(who);
      if (!l) continue;
      if (!this.ledger.chain(who, l.h).ok) drift.push({ who, part: 'chain', stored: l.h, fold: 0, keys: [] });
      // (the rows' fold, while they're kept: the pocket, the pieces, the games, the totals; never the かいがら, which a
      // floor at 0, a walletset or a give-back after a sale may leave apart from the rows' sum by the rules)
      if (this.ledgerOnly()) continue;
      const f = this.ledgerFold(who);
      const p = mapDiff(l.p, f.p), z = mapDiff(l.z, f.z);
      if (p.length) drift.push({ who, part: 'p', stored: sum(l.p), fold: sum(f.p), keys: p });
      if (z.length) drift.push({ who, part: 'z', stored: sum(l.z), fold: sum(f.z), keys: z });
      const w = l.w.map(([c]) => c), fw = f.w.map(([c]) => c);
      if (w.join() !== fw.join()) drift.push({ who, part: 'w', stored: w.length, fold: fw.length, keys: [...w.filter((c) => !fw.includes(c)), ...fw.filter((c) => !w.includes(c))] });
      const g = [...l.g.keys()].sort(), fg = [...f.g.keys()].sort();
      if (g.join() !== fg.join()) drift.push({ who, part: 'g', stored: g.length, fold: fg.length, keys: [...g.filter((x) => !fg.includes(x)), ...fg.filter((x) => !g.includes(x))] });
    }
    // (the stored field against the fold of the farm rows, while kept: its plots, plot by plot)
    if (!this.ledgerOnly()) {
      const kept = this.farmState().plots, fold = this.farmFold().plots;
      const keys = [...new Set([...kept.keys(), ...fold.keys()])].filter((p) => JSON.stringify(kept.get(p)) !== JSON.stringify(fold.get(p))).sort();
      if (keys.length) drift.push({ who: 'A', part: 'field', stored: kept.size, fold: fold.size, keys });
    }
    for (const d of drift) this.io.log?.('ledger.drift', { who: d.who, part: d.part, stored: d.stored, fold: d.fold, keys: d.keys.length });
    return { ok: true, drift, pruned: this.ledger.prune(this.io.now()) };
  }

  /**
   * The admin's `ledger_retire {confirm: 'retire-ledger-rows', dry?}`: the shop's history let go, the stored ledger the
   * record's alone (meta `ledger_only`): every `sell`, `buy`, `buy_starts`, `sg_reward` and `shop_adjust` row deleted
   * (their ids stay known: a late retry is a duplicate), and the day tallies and give-backs older than TALLY_KEEP_DAYS
   * (none may be sent again: contract/record.ts TALLY_PAST_DAYS), then a new epoch (the phones refetch). Only with every
   * person seeded and no drift (ledgerCheck); `dry`: the counts only. Since then the daily prune keeps the shop's rows
   * RETIRED_KEEP_DAYS (ledgerPrune). Never a metric, a ベル row, a farm row (the field's fold) or anything else.
   */
  ledgerRetire(o: Rec): Record<string, unknown> {
    if (o.confirm !== RETIRE_CONFIRM) return { ok: false, error: 'bad_request', detail: `it deletes the shop's rows: pass confirm: '${RETIRE_CONFIRM}' (dump first)` };
    const check = this.ledgerCheck();
    if (check.drift.length) return { ok: false, error: 'bad_request', detail: 'drift', drift: check.drift };
    const { more: _more, ...counts } = this.ledgerPrune(o.dry === true, 0, Infinity);
    if (o.dry === true) return { ok: true, dry: true, ...counts };
    this.setMeta('ledger_only', new Date(this.io.now()).toISOString());
    return { ok: true, ...counts, rev: this.bumpRev() };
  }

  /** The shop's rows older than `keepDays` and the day tallies and give-backs older than TALLY_KEEP_DAYS deleted, `max`
   *  rows at most (`more`: some left; `dry`: counted only), once the record keeps the stored ledger alone (ledger_only;
   *  or `keepDays` 0: ledgerRetire's own, all at once). The nightly prune's (nightly.ts). */
  ledgerPrune(dry = false, keepDays = RETIRED_KEEP_DAYS, max = PRUNE_BATCH): { shop: number; tallies: number; more: boolean } {
    if (keepDays && !this.ledgerOnly()) return { shop: 0, tallies: 0, more: false };
    const cut = new Date(this.io.now() - keepDays * 86_400_000).toISOString(), oldest = addDays(localDateAt(this.io.now()), -TALLY_KEEP_DAYS);
    const shopWhere = `type IN (${RETIRED.map(() => '?').join(', ')}) AND at < ?`;
    const tallyWhere = "type IN ('tally', 'tally_back') AND substr(slot, -10) < ?";
    return this.io.tx(() => {
      if (dry) {
        const n = (where: string, ...b: Bind[]) => this.io.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM events WHERE ${where}`, ...b).toArray()[0]?.n ?? 0;
        return { shop: n(shopWhere, ...RETIRED, cut), tallies: n(tallyWhere, oldest), more: false };
      }
      const shop = this.dropBatch(shopWhere, [...RETIRED, cut], max);
      const tallies = shop.more ? { n: 0, more: true } : this.dropBatch(tallyWhere, [oldest], max - shop.n);
      return { shop: shop.n, tallies: tallies.n, more: shop.more || tallies.more };
    });
  }

  /** At most `max` of the `events` rows `where` matches deleted (their seqs read first: a bounded write), and whether
   *  more are left. */
  private dropBatch(where: string, b: Bind[], max: number): { n: number; more: boolean } {
    if (max <= 0) return { n: 0, more: !!this.io.sql.exec(`SELECT 1 FROM events WHERE ${where} LIMIT 1`, ...b).toArray().length };
    const seqs = this.io.sql.exec<{ seq: number }>(`SELECT seq FROM events WHERE ${where} LIMIT ?`, ...b, Number.isFinite(max) ? max + 1 : -1).toArray().map((r) => Number(r.seq));
    const take = seqs.slice(0, max);
    if (take.length) this.io.sql.exec('DELETE FROM events WHERE seq IN (SELECT value FROM json_each(?))', JSON.stringify(take));
    return { n: take.length, more: seqs.length > take.length };
  }

  /** The admin's `ledger`: each person's stored ledger, part by part (`seq`, `at`, the value), and `ledgerlog {who,
   *  limit?}`: the ops applied to one, newest first. */
  ledgerRead(o: Rec = {}): Record<string, unknown> {
    if (o.log !== undefined) {
      if (!isWho(o.log)) return { ok: false, error: 'bad_request' };
      return { ok: true, log: this.ledger.logOf(o.log, typeof o.limit === 'number' ? Math.min(500, Math.max(1, Math.floor(o.limit))) : 50) };
    }
    const out: Record<string, unknown> = { ok: true };
    for (const r of this.ledger.rows()) ((out[r[0]] ??= {}) as Record<string, unknown>)[r[1]] = { seq: r[2], at: r[3], v: JSON.parse(r[4]) as unknown };
    return out;
  }

  /** `who`'s shop folded from every row of theirs (the running ledger's start, and its admin re-check). The fold reads
   *  their day tallies (one row a day: ≤ 366 a year) and their shop rows, in the object, never the Worker. Its
   *  `shells` are the rows' sum, unfloored (the wallet's, shopState, never below 0). */
  private shopFold(me: Who, field: Farm = this.farmFold()): Pocket {
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

  /** The field (contract/farm.ts) as the record keeps it: the stored field (ledger.ts `F|field`), stepped by each farm
   *  row (farmNote), its pockets' changes empty (the ledgers hold the pockets: a step's are its own). Seeded once, when
   *  there is none: from the running copy (meta FARM_META, an older relay's), else folded from the rows (a load into an
   *  empty record, new growth rules, a rollback's copy found at the start). */
  private farmState(): Farm {
    const kept = this.ledger.field();
    if (kept) return kept;
    let f: Farm | null = null;
    const raw = this.meta(FARM_META);
    if (raw) {
      try { f = farmFromJson(JSON.parse(raw)); } catch { /* folded */ }
    }
    f ??= this.farmFold();
    f = { plots: f.plots, net: {} };
    this.farmNote(f, this.nextAt());
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
    const f = this.farmState();
    // (the sender's pocket as the stored ledger holds it)
    this.ledgerReady(me);
    const l = this.ledger.read(me, ['hp'])!;
    const before = new Map(f.net[me]);
    const days = new Map<string, Set<string> | true>();
    const watered = (p: string, date: string): boolean => {
      let w = days.get(date);
      if (w === undefined) days.set(date, (w = this.wateredOn(date)));
      return w === true || w.has(p) || this.waterOf(p) === date;
    };
    const data = farmStep(f, me, farmOf(d)!, { watered, pocket: (k) => l.p.get(k) ?? 0 });
    return data ? { f, data, before } : null;
  }

  /** What was watered on `date`: everything (a wet day), else the plots in anyone's island day of it (a plot's
   *  farm_water aside: waterOf). */
  private wateredOn(date: string): Set<string> | true {
    return this.slotRow(`wet|${date}`) ? true : this.islandWatered(date);
  }

  /** The plots in anyone's island day of `date` (the record keeps yesterday's and today's: islandPrune). */
  private islandWatered(date: string): Set<string> {
    const out = new Set<string>();
    for (const who of ['A', 'B', 'G']) {
      const r = this.slotRow(`island|${who}|${date}`);
      const x = r ? this.rowRec(r.data, 'island') : null;
      if (x && Array.isArray(x.watered)) for (const id of x.watered) if (typeof id === 'string' && id.startsWith('fd:')) out.add(id);
    }
    return out;
  }

  /** The day plot `p`'s farm_water row says it was watered (contract/farm.ts farmWaterOf), or null. */
  private waterOf(p: string): string | null {
    const r = this.slotRow(`farm_water|${p}`);
    const x = r ? this.rowRec(r.data, 'farm') : null;
    return (x && farmWaterOf(x)?.date) ?? null;
  }

  /**
   * Each plant of `ps` on field `f` watered the day before it ripens (the island days the record holds, or `row`: the
   * island day being kept) kept as a `farm_water` of the record's own (its plot's slot; a wet day needs none: its row
   * stays), so its yield outlives the island days: what was written. In the caller's transaction.
   */
  private farmWaterNote(f: Farm, ps: Iterable<string>, row?: { date: string; watered: readonly string[] }): number {
    let n = 0;
    const days = new Map<string, Set<string>>();
    for (const p of ps) {
      const pl = f.plots.get(p);
      if (!pl) continue;
      const day = addDays(pl.from, -1);
      if (this.waterOf(p) === day) continue;
      let w = days.get(day);
      if (!w) days.set(day, (w = this.islandWatered(day)));
      if (!w.has(p) && !(row?.date === day && row.watered.includes(p))) continue;
      const at = this.nextAt();
      // (the record's own row, as a wet day's: its person a placeholder)
      this.put(`fw-${Date.parse(at)}-${p}`, at, 'A', 'farm_water', JSON.stringify({ p, date: day }), `farm_water|${p}`, null);
      n++;
    }
    return n;
  }

  /** An island day being kept (its JSON): the field's plots it waters, farmWaterNote. */
  private islandWaterNote(json: string): void {
    const d = this.rowRec(json, 'island');
    if (!d || !isIslandDay(d)) return;
    const ps = d.watered.filter((id) => id.startsWith('fd:'));
    if (ps.length) this.farmWaterNote(this.farmState(), ps, d);
  }

  /**
   * The daily prune of removals (nightly.ts tombprune; the admin's `tomb_prune`): each removal row that expires
   * (contract/tomb.ts isExpiringRemoval) stored more than TOMB_KEEP_DAYS ago deleted, its id kept (a retry is a
   * duplicate; a late op, lateOp), the newest such `at` in meta TOMB_META (a snapshot `since` before it refetches
   * everything). A cursor (TOMB_SCAN: the `at` looked through up to), so a run reads only the rows stored since (by
   * events_at), `max` removals a run (the rest the next tick's). Never another row. `dry`: counted only, with their ids.
   */
  tombPrune(dry = false, max = PRUNE_BATCH): { old: number; deleted: number; more: boolean; types: Record<string, number>; ids?: string[] } {
    const cut = new Date(tombCut(this.io.now())).toISOString(), from = this.meta(TOMB_SCAN) ?? this.meta(TOMB_META) ?? '';
    return this.io.tx(() => {
      const got = this.io.sql.exec<{ id: string; at: string; type: string; data: string }>(
        "SELECT id, at, type, data FROM events WHERE at >= ? AND at < ? AND json_valid(data) AND json_extract(data, '$.rm') = 1 ORDER BY at LIMIT ?", from, cut, dry ? -1 : max + 1
      ).toArray();
      const more = !dry && got.length > max, seen = more ? got.slice(0, max) : got;
      const rows = seen.filter((r) => {
        const x = this.rowRec(r.data, r.type);
        return x !== null && isExpiringRemoval(r.type, x);
      });
      const types: Record<string, number> = {};
      for (const r of rows) types[r.type] = (types[r.type] ?? 0) + 1;
      if (dry) return { old: rows.length, deleted: 0, more: false, types, ids: rows.map((r) => r.id) };
      let newest = this.meta(TOMB_META) ?? '';
      for (const r of rows) {
        this.io.sql.exec('DELETE FROM events WHERE id = ?', r.id);
        if (r.at > newest) newest = r.at;
      }
      if (rows.length) this.setMeta(TOMB_META, newest);
      // (a batch left over: from its last row's `at` the next run; else every removal before the cut looked through)
      const to = more ? seen[seen.length - 1].at : cut;
      if (to > from) this.setMeta(TOMB_SCAN, to);
      return { old: rows.length, deleted: rows.length, more, types };
    });
  }

  /**
   * The daily prune (index.ts at 03:00 Tokyo, the admin's `island_prune`): each plant's watering that counts kept
   * first (farmWaterNote over the whole field: a backfill, idempotent), then the `island` rows of days before
   * yesterday deleted, `max` at most (`more`: some left; contract/island.ts: nothing reads them, the record refuses
   * them). Never another type's row. `dry`: the backfill only; `old` the rows that would go.
   */
  islandPrune(dry = false, max = PRUNE_BATCH): { stamped: number; old: number; deleted: number; more: boolean } {
    const before = prevDay(localDateAt(this.io.now()));
    // (the slot's unique index: the `island|` range, never a scan of the table)
    const where = "slot >= 'island|' AND slot < 'island}' AND type = 'island' AND substr(slot, -10) < ?";
    const r = this.io.tx(() => {
      const f = this.farmState();
      const stamped = this.farmWaterNote(f, [...f.plots.keys()]);
      if (dry) return { stamped, old: this.io.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM events WHERE ${where}`, before).toArray()[0]?.n ?? 0, deleted: 0, more: false };
      const d = this.dropBatch(where, [before], max);
      return { stamped, old: d.n, deleted: d.n, more: d.more };
    });
    if (r.stamped) this.io.notify({ what: 'event', who: 'A', at: new Date(this.lastAt).toISOString(), rev: this.rev() });
    return r;
  }

  /** The nightly jobs not done today (nightly.ts runNightly: the 03:00 cron's, then the ticks' catch-up, `late`). */
  nightly(late: boolean, backedUp: boolean, hooks: Pick<NightlyDeps, 'fail' | 'done'>): ReturnType<typeof runNightly> {
    return runNightly({
      now: this.io.now, backedUp, stamps: () => this.nightlyStamps(), setMeta: (k, v) => this.setMeta(k, v), ...hooks,
      jobs: {
        ledgercheck: () => ({ n: this.ledgerCheck().drift.length }),
        sharesweep: () => this.share.sweep(),
        islandprune: () => {
          const r = this.islandPrune();
          return { n: r.deleted, more: r.more };
        },
        ledgerprune: () => {
          const r = this.ledgerPrune();
          return { n: r.shop + r.tallies, more: r.more };
        },
        tombprune: () => {
          const r = this.tombPrune();
          return { n: r.deleted, more: r.more };
        }
      }
    }, late);
  }

  /** `/health/log`'s nightly ages (nightly.ts nightlyAges). */
  nightlyStatus(): ReturnType<typeof nightlyAges> {
    return nightlyAges(this.nightlyStamps(), this.io.now());
  }

  /** The nightly jobs' meta rows: one range of meta's key. */
  private nightlyStamps(): Map<string, string> {
    return new Map(this.io.sql.exec<{ k: string; v: string }>("SELECT k, v FROM meta WHERE k >= 'nightly|' AND k < 'nightly}'").toArray().map((r) => [r.k, r.v]));
  }

  /** A farm row kept (its `at`): the field after it stored (its pocket changes: the stored ledger's, ledgerNote), and
   *  into meta FARM_META too, an older relay's copy (a rollback's). */
  private farmNote(f: Farm, at: string): void {
    this.ledger.setField(f, at);
    this.setMeta(FARM_META, JSON.stringify(farmJson({ plots: f.plots, net: {} })));
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
      if (rows.share || rows.share_visit) {
        const sh = this.share.load(rows);
        out.share = sh.share;
        out.share_visit = sh.share_visit;
        out.skipped += sh.skipped;
      }
      if (rows.ledger) this.ledger.load(rows.ledger, rows.ledger_log);
      if (rows.places) {
        const pl = this.places.load(rows.places);
        out.places = pl.places;
        out.skipped += pl.skipped;
      }
      // (rows the running shop ledgers and the caps' counts never saw: folded again at the next op)
      if (out.events) {
        this.pruneLoaded();
        this.shopForget();
        if (empty && !rows.ledger) this.ledger.clear();
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
    // the rules for a phone's op would drop them), kept unless the row its slot holds beats it.
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
    if (isPackType(type) || isWedType(type) || type === 'todo' || type === 'hike') {
      const v = isPackType(type)
        ? this.loadBeats(packSlot(type, person, d), 'pack', new PackBook(), packRowOf, packRowOf(type, d, person))
        : isWedType(type) ? this.loadBeats(wedSlot(type, d), 'wedding', new WedBook(), wedRowOf, wedRowOf(type, d, person))
        : type === 'todo' ? this.loadBeats(todoSlot(d), 'todo', new TodoBook(), todoRowOf, todoRowOf(type, d, person))
        : this.loadBeats(hikeSlot(d), 'hike', new HikeBook(), hikeRowOf, hikeRowOf(type, d, person));
      if (v === 'had') sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
      if (v !== 'beats') return v;
    }
    let json = raw || '{}';
    let by = person;
    if (isFoodType(type)) {
      if (!FOOD_PARSE[type](d)) return 'skipped';
      const v = this.foodTarget(type, person, d);
      if (typeof v === 'string') {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
        return 'had';
      }
      if (type === 'food_repeat') json = JSON.stringify(v.op); // with the skipped days of the one it replaces
      by = v.who; // (a recipe's or a custom food's edit: under its creator's name)
    }
    if (type === 'decor' && (decorOpOf(d) || tentOpOf(d) || layoutOpOf(d)) && this.decorTarget(person, d) !== 'append') {
      sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // beaten (or past the cap): only its id is kept
      return 'had';
    }
    const slot = eventSlot(type, person, subject, d, Date.parse(at));
    const wasDecor = type === 'decor' && slot ? sql.exec<{ person: string; data: string }>('SELECT person, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null : null;
    if (slot && type !== 'decor' && type !== 'board' && !isFoodType(type) && !isPackType(type) && !isWedType(type) && type !== 'todo' && type !== 'hike') {
      const held = sql.exec<{ at: string }>('SELECT at FROM events WHERE slot = ?', slot).toArray()[0];
      if (held && held.at >= at) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // a later one of the slot is there already
        return 'had';
      }
      if (type === 'tally' || type === 'tally_back') json = this.tallyKept(person, d, type); // with the larger counts of the row it replaces
      if (type === 'island') json = this.islandKept(person, d);
    }
    this.put(id, at, by, type, json, slot, this.seeAt(at) ? arrived : null);
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
   *  ticks, a removed to-do list's items, a removed hike's track. (A removal's own row is never dropped, 2026-11-08: a phone that cached the post before it would show it for
   *  good, its delta saying nothing of it.) */
  private pruneLoaded(): void {
    const sql = this.io.sql;
    const gone = (type: string): Rec[] =>
      sql.exec<{ data: string }>('SELECT data FROM events WHERE type = ?', type).toArray()
        .map((r) => this.rowRec(r.data, type)).filter((x): x is Rec => x !== null && x.rm === true);
    for (const t of gone('wtask')) sql.exec('DELETE FROM events WHERE slot = ?', `wdone|${String(t.id)}`);
    for (const p of gone('pack')) sql.exec('DELETE FROM events WHERE slot GLOB ?', `pack_chk|${String(p.trip)}|${String(p.id)}|*`);
    // (a removed list's items)
    const lists = new Set(gone('todo').map((x) => String(x.id)));
    if (lists.size) for (const r of sql.exec<{ slot: string; data: string }>("SELECT slot, data FROM events WHERE type = 'todo'").toArray()) {
      const x = this.rowRec(r.data, 'todo');
      if (x && typeof x.list === 'string' && lists.has(x.list)) sql.exec('DELETE FROM events WHERE slot = ?', r.slot);
    }
    for (const h of gone('hike')) sql.exec('DELETE FROM events WHERE slot = ?', `hike_trk|${String(h.id)}`);
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

  // ---------------------------------------------------------------- pictures (img.ts)

  /** `POST /img`'s upload (the Worker checked its key, size, magic and the day's cap): kept by imgPut's rules. */
  imgPut(who: Who, id: string, b: Uint8Array): Promise<{ ok: true; dup?: true } | { ok: false; error: ImgErr }> {
    return imgPut(this.io.sql, who, id, b, new Date(this.io.now()).toISOString());
  }

  /** `GET /img/<id>`'s bytes, or null. */
  imgGet(id: string): { type: string; bytes: Uint8Array } | null {
    return imgGet(this.io.sql, id);
  }

  /** The 03:00 sweep (img.ts imgGc), in one transaction. */
  imgGc(): { imgDel: number; imgLive: number; imgDangling: number } {
    return this.io.tx(() => imgGc(this.io.sql, this.io.now()));
  }

  /** The admin's `imgdump {after?}`: IMG_DUMP_PAGE pictures (`next` the `after` of the next page). */
  imgDump(o: Rec): Record<string, unknown> {
    const after = typeof o.after === 'string' ? o.after : '';
    const img = imgRows(this.io.sql, after, IMG_DUMP_PAGE);
    return { ok: true, rev: this.rev(), img, ...(img.length === IMG_DUMP_PAGE ? { next: String(img[img.length - 1][2]) } : {}) };
  }

  /** The admin's `imgload {img}`: a dump's pictures (each checked as an upload is: img.ts imgLoad). */
  async imgLoad(o: Rec): Promise<Record<string, unknown>> {
    if (!Array.isArray(o.img)) return { ok: false, error: 'bad_request' };
    const out = { added: 0, had: 0, skipped: 0 };
    for (const r of o.img as unknown[]) out[Array.isArray(r) ? await imgLoad(this.io.sql, r, isWho) : 'skipped']++;
    return { ok: true, ...out, counts: this.counts() };
  }

  /**
   * The admin's `img-set {who, custom, data, ig?, dry?}`: a picture (`data`, base64: checked as an upload is, counted
   * against `who`'s cap) set on custom food `custom` as `who` would (anyone edits one since 2026-11-20: its latest op's
   * values, a new `at`, `img`, `ig` when an illustration; kept under its creator's name, sharedAccept); `dry`: what it
   * would do, nothing written.
   */
  async imgSet(o: Rec): Promise<Record<string, unknown>> {
    const { who, custom, data } = o;
    if (!isWho(who) || typeof custom !== 'string' || typeof data !== 'string' || (o.ig !== undefined && o.ig !== true)) return fail('bad_request');
    let b: Uint8Array;
    try { b = unb64(data); } catch { return fail('bad_request', 'base64'); }
    const c = imgCheck(b);
    if ('err' in c) return fail('bad_request', c.err);
    const img = await imgId(b);
    const held = this.foodHeld('food_custom', custom);
    if (!held || held.rm) return fail('bad_request', 'no such custom food');
    const { who: creator, ...was } = held;
    const { ig: _ig, ...rest } = was as Rec;
    const op = foodCustomOp({ ...rest, at: Math.max(this.io.now(), (was.at as number) + 1), img, ...(o.ig ? { ig: true } : {}) });
    if (!op) return fail('bad_request', 'op');
    if (o.dry === true) return { ok: true, dry: true, bytes: b.length, type: c.type, op: { ...op, img: '…' } };
    const put = await this.imgPut(who, img, b);
    if (!put.ok) return fail('bad_request', put.error);
    const at = this.io.tx(() => {
      const at = this.nextAt();
      this.put(`imgset-${custom}-${op.at}`, at, creator, 'food_custom', JSON.stringify(op), `food_custom|${custom}`, null);
      return at;
    });
    this.io.notify({ what: 'event', who, at, rev: this.rev(), calm: true });
    return { ok: true, at, bytes: b.length, type: c.type, dup: put.dup === true };
  }

  /** Row counts per table (the import's check, the runbook). */
  counts(): Record<string, number> {
    const n = (t: string) => Number(this.io.sql.exec<{ n: number }>(`SELECT count(*) AS n FROM ${t}`).toArray()[0]?.n ?? 0);
    return { metrics: n('metrics'), events: n('events'), ids: n('ids'), uploads: n('uploads'), img: n('food_img'), share: n('share'), share_visit: n('share_visit'), places: n('places') };
  }

  /** Every row, as `load` takes them (the backup, docs/ops/runbook.md#6-backups): the load of a dump is the record. */
  dump(): { rows: DumpRows } {
    return { rows: { ...this.rowsSince(''), uploads: this.uploadRows(), ...this.heldDump(), ...this.share.dumpRows(), places: this.places.dumpRows(), ledger: this.ledger.rows(), ledger_log: this.ledger.logRows() } };
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
    const sh = this.share.dumpRows();
    yield `],"held":${JSON.stringify(this.heldDump().held ?? [])},"share":${JSON.stringify(sh.share)},"share_visit":${JSON.stringify(sh.share_visit)},"places":[`;
    // (~3,400 places, ~1.5 MB: a page of rows at a time)
    const pl = this.places.dumpRows();
    for (let i = 0; i < pl.length; i += page) yield (i ? ',' : '') + pl.slice(i, i + page).map((r) => JSON.stringify(r)).join(',');
    yield '],"img":[';
    // (the pictures a few at a time: ~87 kB each as base64)
    for (let after = '', sep = ''; ;) {
      const rs = imgRows(sql, after, IMG_DUMP_PAGE);
      if (rs.length) yield sep + rs.map((r) => JSON.stringify(r)).join(',');
      sep = ',';
      if (rs.length < IMG_DUMP_PAGE) break;
      after = String(rs[rs.length - 1][2]);
    }
    yield `],"ledger":${JSON.stringify(this.ledger.rows())},"ledger_log":${JSON.stringify(this.ledger.logRows())}}}\n`;
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
    return { ok: true, rows: { ...p.rows, uploads: after ? [] : this.uploadRows(), ...(after ? { share: [], share_visit: [], places: [], ledger: [], ledger_log: [] } : { ...this.heldDump(), ...this.share.dumpRows(), places: this.places.dumpRows(), ledger: this.ledger.rows(), ledger_log: this.ledger.logRows() }) }, ...(p.next ? { next: p.next } : {}) };
  }

  private uploadRows(): unknown[][] {
    return this.io.sql.exec<{ at: string; person: string; status: string; bytes: number; notes: string }>('SELECT at, person, status, bytes, notes FROM uploads ORDER BY seq').toArray()
      .map((r) => [r.at, r.person, r.status, r.bytes, r.notes]);
  }
}

/** The field's plots as text, in plot order (a stored field and a fold compare so). */
const plotsJson = (f: Farm): string => JSON.stringify([...f.plots].sort(([a], [b]) => (a < b ? -1 : 1)));

/** A person's shop folded from their rows (store.ts shopFold): their tallies' totals less the give-backs, the
 *  give-backs, the ledger of their shop rows (contract/shop.ts). */
type Pocket = { caught: Map<string, number>; back: Map<string, number>; l: Ledger };

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
/** Pictures a page of the dump text, and of the admin's `imgdump`. */
const IMG_DUMP_PAGE = 20;
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
