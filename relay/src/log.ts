// The log (docs/ops/observability.md): the phones' events (`POST /log`) and the relay's own (each `/api` request, the
// room, the cron, the admin ops) in the `IslandLog` Durable Object's SQLite, apart from the record (a restore of the
// record never rolls the log back; the dump never carries it). Free of the Workers runtime, so it is unit-testable
// (test/log.test.ts on node:sqlite).
//
// - Only what contract/log.ts's registry names is kept, each field of its kind (cleanData): whatever a phone sends.
// - The key gives the role (A, B, G) and is never kept. No IP, no user agent (a phone sends `os`, a word).
// - One table, `log`, keyed by its receipt time (`id` = ms × 1000 + a counter, strictly increasing): a time range is a
//   range of the primary key, so there is no index to write (each index row counts as a row written on the Free plan).
// - Caps per UTC day and bucket (`caps`, one row each, written once per write): the phones 1,000 events a role and 200
//   errors, the relay 4,000 and 500, and 8,000 in all (the hard guard on the account's 100k rows written a day).
// - A batch id is taken once (`batches`, two days): a phone re-sends a batch it never saw acked.
// - Retention: 30 days (`prune`, the object's daily alarm, 5,000 rows a chunk).
import { keyOwner, type Keys } from './auth.ts';
import type { Sql } from './store.ts';
import {
  cleanData, isLogEvent, isLogId, isToken, levelOf, LOG_BATCH_MAX, LOG_EVENTS, LOG_V,
  type LogData, type LogEventName, type LogLevel
} from '../../app/src/lib/contract/log.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';

export interface LogIO {
  sql: Sql;
  tx<R>(fn: () => R): R;
  keys: Keys;
  now(): number;
}

/** A relay event (src `r`): its name, level, payload, and whom it concerns. */
export interface RelayEvent {
  e: LogEventName;
  l: LogLevel;
  d?: Record<string, unknown>;
  role?: Who | null;
  rid?: string | null;
  sid?: string | null;
}

export const LOG_KEEP_DAYS = 30;
const DAY = 86_400_000;
/** The caps per UTC day: a bucket's events, then dropped (and `log.cap` once). */
export const LOG_CAPS = { client: 1_000, clientErrors: 200, relay: 4_000, relayErrors: 500, all: 8_000 } as const;
const PRUNE_CHUNK = 5_000, PRUNE_CHUNKS = 4;
/** A query's rows at most. */
const QUERY_MAX = 1_000;
const KEY_RE = /^[0-9a-fA-F]{32,128}$/;
const WORD = /^[\w.-]{1,40}$/;

const SCHEMA = [
  // id: the receipt time's key (ms × 1000 + a counter); ct the phone's clock (ms, within a day of ours, else null)
  'CREATE TABLE IF NOT EXISTS log (id INTEGER PRIMARY KEY, ct INTEGER, lvl INTEGER NOT NULL, ev TEXT NOT NULL, src TEXT NOT NULL, role TEXT, sid TEXT, rid TEXT, q INTEGER, build TEXT, os TEXT, d TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS batches (b TEXT PRIMARY KEY, ts INTEGER NOT NULL) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS caps (day TEXT NOT NULL, bucket TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (day, bucket)) WITHOUT ROWID'
];

/** A stored event as a query returns it. */
export interface LogRow {
  id: number;
  ts: number;
  ct: number | null;
  lvl: LogLevel;
  ev: string;
  src: 'c' | 'r';
  role: string | null;
  sid: string | null;
  rid: string | null;
  q: number | null;
  build: string | null;
  os: string | null;
  d: LogData;
}

export interface LogQuery {
  /** ms: from (default a day ago), to (default now). */
  since?: number;
  until?: number;
  /** Paging: rows after this id (ascending) or before it (`desc`). */
  after?: number;
  before?: number;
  desc?: boolean;
  /** The lowest level. */
  lvl?: number;
  /** An event name, or a prefix ending in `.` / `*` (`api.`, `js.*`). */
  ev?: string;
  role?: string;
  sid?: string;
  rid?: string;
  src?: string;
  build?: string;
  limit?: number;
}

type Bucket = string;
type Bind = string | number | null;

export class LogCore {
  private last = 0;
  private day = '';
  private caps = new Map<Bucket, number>();

  constructor(private io: LogIO) {
    for (const s of SCHEMA) io.sql.exec(s);
    this.last = Number(io.sql.exec<{ m: number | null }>('SELECT max(id) AS m FROM log').toArray()[0]?.m ?? 0);
  }

  private nextId(): number {
    this.last = Math.max(this.io.now() * 1000, this.last + 1);
    return this.last;
  }

  /** Today's (UTC) counts, read once a day (or after the object started). */
  private today(): string {
    const day = new Date(this.io.now()).toISOString().slice(0, 10);
    if (day !== this.day) {
      this.day = day;
      this.caps = new Map(this.io.sql.exec<{ bucket: string; n: number }>('SELECT bucket, n FROM caps WHERE day = ?', day).toArray().map((r) => [r.bucket, Number(r.n)]));
    }
    return day;
  }

  /** When the day's caps reset (the next UTC midnight). */
  private nextDay(): number {
    return (Math.floor(this.io.now() / DAY) + 1) * DAY;
  }

  private limitOf(b: Bucket): number {
    if (b === 'all') return LOG_CAPS.all;
    if (b.startsWith('c:')) return b.endsWith(':e') ? LOG_CAPS.clientErrors : LOG_CAPS.client;
    return b.endsWith(':e') ? LOG_CAPS.relayErrors : LOG_CAPS.relay;
  }

  /** Whether one more event fits in its bucket (and in all), counting it if so. */
  private take(b: Bucket, touched: Set<Bucket>): boolean {
    const n = this.caps.get(b) ?? 0, all = this.caps.get('all') ?? 0;
    if (n >= this.limitOf(b) || all >= LOG_CAPS.all) return false;
    this.caps.set(b, n + 1);
    this.caps.set('all', all + 1);
    touched.add(b).add('all');
    return true;
  }

  private full(b: Bucket): boolean {
    return (this.caps.get(b) ?? 0) >= this.limitOf(b) || (this.caps.get('all') ?? 0) >= LOG_CAPS.all;
  }

  /** The touched buckets' counts, written (one row each); a bucket that just filled logs `log.cap` once. */
  private saveCaps(day: string, touched: Set<Bucket>, insert: (r: Bind[]) => void): void {
    for (const b of touched) {
      this.io.sql.exec('INSERT INTO caps (day, bucket, n) VALUES (?, ?, ?) ON CONFLICT (day, bucket) DO UPDATE SET n = excluded.n', day, b, this.caps.get(b) ?? 0);
    }
    for (const b of touched) {
      if (!this.full(b) || this.caps.has(`capped:${b}`)) continue;
      this.caps.set(`capped:${b}`, 1);
      this.io.sql.exec('INSERT OR IGNORE INTO caps (day, bucket, n) VALUES (?, ?, 1)', day, `capped:${b}`);
      insert([this.nextId(), null, 2, 'log.cap', 'r', null, null, null, null, null, null, JSON.stringify({ bucket: b.replace(/[^\w.:-]/g, '') })]);
    }
  }

  private insert(r: Bind[]): void {
    this.io.sql.exec('INSERT INTO log (id, ct, lvl, ev, src, role, sid, rid, q, build, os, d) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ...r);
  }

  /** The key's owner, or null (a malformed or unknown key). */
  roleOf(key: unknown): Who | null {
    return typeof key === 'string' && KEY_RE.test(key) ? keyOwner(key, this.io.keys) : null;
  }

  /**
   * A phone's batch (`POST /log`, contract/log.ts LogBatch) → its reply: `{ok, kept, dropped}` (or `dup` for a batch
   * taken before; `closed`: when its role's bucket is full, the ms it opens again). Never throws.
   */
  ingestText(text: string): Record<string, unknown> {
    let body: Record<string, unknown>;
    try {
      const x: unknown = JSON.parse(text);
      if (!x || typeof x !== 'object' || Array.isArray(x)) return { ok: false, error: 'bad_request' };
      body = x as Record<string, unknown>;
    } catch {
      return { ok: false, error: 'bad_request' };
    }
    const role = this.roleOf(body.key);
    if (!role) return { ok: false, error: 'unauthorized' };
    if (body.v !== LOG_V || !isLogId(body.b) || !isLogId(body.s) || !Array.isArray(body.es) || body.es.length > LOG_BATCH_MAX) return { ok: false, error: 'bad_request' };
    const b = body.b, sid = body.s;
    const build = typeof body.build === 'string' && WORD.test(body.build) ? body.build : null;
    const os = typeof body.os === 'string' && WORD.test(body.os) ? body.os : null;
    const now = this.io.now();
    return this.io.tx(() => {
      if (this.io.sql.exec('SELECT 1 AS x FROM batches WHERE b = ?', b).toArray().length) return { ok: true, dup: true, kept: 0, dropped: 0 };
      const day = this.today();
      const touched = new Set<Bucket>();
      let kept = 0, dropped = 0;
      for (const x of body.es as unknown[]) {
        const ev = x && typeof x === 'object' ? (x as Record<string, unknown>) : null;
        if (!ev || !isLogEvent(ev.e) || LOG_EVENTS[ev.e].src !== 'c') { dropped++; continue; }
        const l = levelOf(ev.l);
        if (!this.take(`c:${role}:${l === 3 ? 'e' : 'i'}`, touched)) { dropped++; continue; }
        const ct = typeof ev.t === 'number' && Math.abs(ev.t - now) <= DAY ? Math.round(ev.t) : null;
        const q = typeof ev.q === 'number' && Number.isInteger(ev.q) && ev.q >= 0 && ev.q < 1e9 ? ev.q : null;
        this.insert([this.nextId(), ct, l, ev.e, 'c', role, sid, isLogId(ev.r) ? ev.r : null, q, build, os, JSON.stringify(cleanData(ev.e, ev.d))]);
        kept++;
      }
      this.io.sql.exec('INSERT INTO batches (b, ts) VALUES (?, ?)', b, now);
      this.saveCaps(day, touched, (r) => this.insert(r));
      const closed = this.full(`c:${role}:i`) ? this.nextDay() : undefined;
      return { ok: true, kept, dropped, ...(closed ? { closed } : {}) };
    });
  }

  /** The relay's own events. `closed`: the relay's bucket is full until then (the Worker stops sending `req` till then). */
  add(evs: RelayEvent[]): { ok: true; kept: number; closed?: number } {
    return this.io.tx(() => {
      const day = this.today();
      const touched = new Set<Bucket>();
      let kept = 0;
      for (const ev of evs) {
        if (!isLogEvent(ev.e) || LOG_EVENTS[ev.e].src !== 'r') continue;
        const l = levelOf(ev.l);
        if (!this.take(`r:${l === 3 ? 'e' : 'i'}`, touched)) continue;
        const role = ev.role === 'A' || ev.role === 'B' || ev.role === 'G' ? ev.role : null;
        this.insert([this.nextId(), null, l, ev.e, 'r', role, isLogId(ev.sid) ? ev.sid : null, isLogId(ev.rid) ? ev.rid : null, null, null, null, JSON.stringify(cleanData(ev.e, ev.d))]);
        kept++;
      }
      this.saveCaps(day, touched, (r) => this.insert(r));
      const closed = this.full('r:i') ? this.nextDay() : undefined;
      return { ok: true as const, kept, ...(closed ? { closed } : {}) };
    });
  }

  /** One of today's `limit` uses of `bucket` (`stt:A`: a role's `/stt` calls, sttRoute.ts): counted and true, or false
   *  once spent. The `caps` table's day pattern; no event, so not in `all`. */
  spend(bucket: string, limit: number): boolean {
    return this.io.tx(() => {
      const day = this.today();
      const n = this.caps.get(bucket) ?? 0;
      if (n >= limit) return false;
      this.caps.set(bucket, n + 1);
      this.io.sql.exec('INSERT INTO caps (day, bucket, n) VALUES (?, ?, ?) ON CONFLICT (day, bucket) DO UPDATE SET n = excluded.n', day, bucket, n + 1);
      return true;
    });
  }

  /** Events by the filters, oldest first (or newest first: `desc`), at most `limit` (≤ QUERY_MAX); `next`: the cursor. */
  query(q: LogQuery): { rows: LogRow[]; next: number | null } {
    const now = this.io.now();
    // (until: a burst of over 1,000 events in one ms runs its ids into the next ms)
    const since = typeof q.since === 'number' ? q.since : now - DAY, until = typeof q.until === 'number' ? q.until : now + DAY;
    const where: string[] = ['id >= ?', 'id < ?'];
    const b: Bind[] = [since * 1000, until * 1000];
    if (typeof q.after === 'number') where.push('id > ?'), b.push(q.after);
    if (typeof q.before === 'number') where.push('id < ?'), b.push(q.before);
    if (typeof q.lvl === 'number') where.push('lvl >= ?'), b.push(q.lvl);
    if (typeof q.ev === 'string' && q.ev) {
      if (/[.*]$/.test(q.ev)) where.push('substr(ev, 1, ?) = ?'), b.push(q.ev.replace(/\*$/, '').length, q.ev.replace(/\*$/, ''));
      else where.push('ev = ?'), b.push(q.ev);
    }
    for (const k of ['role', 'sid', 'rid', 'src', 'build'] as const) if (typeof q[k] === 'string' && q[k]) where.push(`${k} = ?`), b.push(q[k]!);
    const limit = Math.max(1, Math.min(QUERY_MAX, Math.floor(Number(q.limit) || 200)));
    const rows = this.io.sql.exec<Record<string, Bind>>(`SELECT * FROM log WHERE ${where.join(' AND ')} ORDER BY id ${q.desc ? 'DESC' : 'ASC'} LIMIT ?`, ...b, limit + 1).toArray();
    const more = rows.length > limit;
    const out = rows.slice(0, limit).map((r): LogRow => ({
      id: Number(r.id), ts: Math.floor(Number(r.id) / 1000), ct: r.ct === null ? null : Number(r.ct), lvl: levelOf(Number(r.lvl)), ev: String(r.ev),
      src: r.src === 'r' ? 'r' : 'c', role: (r.role as string | null) ?? null, sid: (r.sid as string | null) ?? null, rid: (r.rid as string | null) ?? null,
      q: r.q === null ? null : Number(r.q), build: (r.build as string | null) ?? null, os: (r.os as string | null) ?? null, d: JSON.parse(String(r.d)) as LogData
    }));
    return { rows: out, next: more ? out[out.length - 1].id : null };
  }

  /**
   * The log's health (the signed `/health/log`, the alert): the last hour's and 6 hours' errors and warnings, the
   * relay's `unavailable` answers, today's caps (and which filled), the phones' events in 24 h, the oldest event's age.
   */
  stats(): Record<string, number | boolean | string[]> {
    const now = this.io.now();
    this.today();
    const count = (sinceMs: number, cond: string) => Number(this.io.sql.exec<{ n: number }>(`SELECT count(*) AS n FROM log WHERE id >= ? AND ${cond}`, sinceMs * 1000).toArray()[0]?.n ?? 0);
    const oldest = Number(this.io.sql.exec<{ m: number | null }>('SELECT min(id) AS m FROM log').toArray()[0]?.m ?? 0);
    const capped = [...this.caps.keys()].filter((k) => k.startsWith('capped:')).map((k) => k.slice(7));
    return {
      ok: true,
      e1h: count(now - 3_600_000, 'lvl = 3'),
      e6h: count(now - 6 * 3_600_000, "lvl = 3 AND d NOT LIKE '%\"leaving\":true%'"),
      w6h: count(now - 6 * 3_600_000, 'lvl = 2'),
      unavailable6h: count(now - 6 * 3_600_000, "ev = 'req' AND d LIKE '%\"st\":\"unavailable\"%'"),
      phones24h: count(now - DAY, "src = 'c'"),
      today: this.caps.get('all') ?? 0,
      budgetPct: Math.round(((this.caps.get('all') ?? 0) / LOG_CAPS.all) * 100),
      capped,
      oldestDays: oldest ? Math.round(((now - oldest / 1000) / DAY) * 10) / 10 : 0
    };
  }

  /** Retention: events older than LOG_KEEP_DAYS (a chunk at a time), batch ids and caps older than two days. */
  prune(): { deleted: number; more: boolean } {
    const now = this.io.now();
    const cut = (now - LOG_KEEP_DAYS * DAY) * 1000;
    let deleted = 0, more = false;
    for (let i = 0; i < PRUNE_CHUNKS; i++) {
      const edge = this.io.sql.exec<{ id: number }>('SELECT id FROM log WHERE id < ? ORDER BY id LIMIT 1 OFFSET ?', cut, PRUNE_CHUNK - 1).toArray()[0]?.id;
      const n = Number(this.io.sql.exec<{ n: number }>('SELECT count(*) AS n FROM log WHERE id <= ?', edge ?? cut - 1).toArray()[0]?.n ?? 0);
      this.io.sql.exec('DELETE FROM log WHERE id <= ?', edge ?? cut - 1);
      deleted += n;
      more = edge !== undefined && i === PRUNE_CHUNKS - 1;
      if (edge === undefined) break;
    }
    this.io.sql.exec('DELETE FROM batches WHERE ts < ?', now - 2 * DAY);
    this.io.sql.exec('DELETE FROM caps WHERE day < ?', new Date(now - 2 * DAY).toISOString().slice(0, 10));
    return { deleted, more };
  }

  /** The signed `logpurge {before?, role?}`: events before a time (ms; default now) and of a role (default all). */
  purge(o: { before?: unknown; role?: unknown }): { ok: true; deleted: number } {
    const before = (typeof o.before === 'number' ? o.before : this.io.now() + 1) * 1000;
    const role = o.role === 'A' || o.role === 'B' || o.role === 'G' ? o.role : null;
    const cond = role ? 'id < ? AND role = ?' : 'id < ?';
    const args: Bind[] = role ? [before, role] : [before];
    const n = Number(this.io.sql.exec<{ n: number }>(`SELECT count(*) AS n FROM log WHERE ${cond}`, ...args).toArray()[0]?.n ?? 0);
    this.io.sql.exec(`DELETE FROM log WHERE ${cond}`, ...args);
    return { ok: true, deleted: n };
  }
}

/** A word for a thrown thing: its class (`TypeError`), never its message. */
export const errName = (e: unknown): string => {
  const n = e instanceof Error ? e.name : typeof e;
  return isToken(n) ? n : 'Error';
};
