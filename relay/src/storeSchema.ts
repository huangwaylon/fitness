// The record's tables (store.ts): the SQL it needs, the guard that keeps Apple Health's rows, the schema and its
// ordered migrations.
import { isPersonId } from '../../app/src/lib/contract/api.ts';
import { inbodyOf } from '../../app/src/lib/contract/bodyEst.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { IMG_TABLE } from './img.ts';
import { LEDGER_TABLES } from './ledger.ts';
import { addDetCols, dropOsmCols, PLACES_TABLES } from './places.ts';
import { SHARE_TABLES } from './share.ts';

type Rec = Record<string, unknown>;
export type Bind = string | number | null | ArrayBuffer | Uint8Array;

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

export const SCHEMA = [
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
export const MIGRATIONS: readonly ((sql: Sql) => void)[] = [
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
