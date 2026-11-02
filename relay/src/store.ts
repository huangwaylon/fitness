// The record (docs/backend.md#the-record): metrics, events and the ingest audit in the store Durable Object's SQLite,
// free of the Workers runtime so it is unit-testable (test/store.test.ts runs it on node:sqlite). The same API as the
// Apps Script web app had (`{key, action, ...}` → `{ok, ...}`), so the app and the Shortcut only change the URL.
//
// - `at` is the record's clock: strictly increasing (max(now, last + 1 ms)), shared by the rows of one ingest.
// - An event id is accepted once, forever (`ids`: a replaced event's id still dedupes a late retry).
// - A slot (app model/record.ts eventSlot) holds one event: a later one of the same slot replaces it, so a tally or an
//   island day is one row per person and day, a cosmetic pref one per person, a goal one per person and Tokyo day,
//   a decoration one per item.
// - `since` is answered from the `at` index. A row that arrived out of `at` order (only while Apps Script mirrored
//   its writes here: two requests' copies racing) is marked `late` with its arrival time, and a poll also returns
//   the late rows that arrived after `since` (less a margin for the two servers' clocks), so no phone misses one.
import { parseShortcut } from './parse.ts';
import { auditNotes, auditRow } from './audit.ts';
import { eventSlot, validEventData } from '../../app/src/lib/model/record.ts';
import {
  eventSubject, EVENT_TYPES, isId, isMetricKey, isPersonId, isRec, isWho,
  type ApiError, type EventRow, type Fail, type MetricRow, type SnapshotRows
} from '../../app/src/lib/contract/api.ts';
import { decorAccept, decorOpOf, type DecorEntry } from '../../app/src/lib/contract/decor.ts';
import { tentAccept, tentOpOf, type TentEntry } from '../../app/src/lib/contract/tent.ts';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { notifySecret, notifySig, verifyNotify } from './notify.ts';
import { keyOwner, type Keys } from './auth.ts';
import { guestMayWrite, guestRows } from '../../app/src/lib/contract/guest.ts';
import type { PersonId, Who } from '../../app/src/lib/types.ts';

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
}

/** What the store answers to `health` and `whoami` (`build`): bumped with the store's code. */
export const STORE_BUILD = 'relay-1';
export const MAX_BODY_CHARS = 1_000_000;
export const RATE_PER_MINUTE = 120;
const MAX_EVENT_DATA_CHARS = 20_000;
const UPLOADS_SHOWN = 20;
/** At most this many events in one `events` request (a queue that grew offline goes in a few). */
export const EVENTS_MAX = 50;
/** A late row is returned to a poll whose `since` is at most this much after its arrival (the servers' clocks). */
export const LATE_MARGIN_MS = 10_000;
const KEY_RE = /^[0-9a-fA-F]{32,128}$/;
const utf8 = new TextEncoder();
const ISO_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

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
  // every event id ever accepted, also of events a later one replaced
  'CREATE TABLE IF NOT EXISTS ids (id TEXT PRIMARY KEY) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS uploads (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, person TEXT NOT NULL, status TEXT NOT NULL, bytes INTEGER NOT NULL, notes TEXT NOT NULL, UNIQUE (at, person))',
  'CREATE INDEX IF NOT EXISTS uploads_person ON uploads (person, seq)'
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

  /** Start a new epoch: every phone drops its cache and fetches everything on its next snapshot. */
  bumpRev(): string {
    const n = Number(/^e(\d+)$/.exec(this.rev())?.[1] ?? 0) + 1;
    this.setMeta('rev', `e${n}`);
    return `e${n}`;
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
    try {
      return this.route(body, bytes);
    } catch (e) {
      console.error('store', e);
      return fail('unavailable');
    }
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
    return isRec(o) && typeof o.op === 'string' ? { op: o } : { status: 400, body: 'bad request' };
  }

  /** The admin `load {rows}`: rows that already have their `at` (a dump's), by the record's rules. */
  load(o: Rec): Record<string, unknown> {
    const rows = o.rows;
    if (!isRec(rows) || !(['metrics', 'events', 'uploads'] as const).every((k) => rows[k] === undefined || Array.isArray(rows[k]))) return { ok: false, error: 'bad_request' };
    return { ok: true, ...this.import(rows as ImportRows), counts: this.counts() };
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
    // the guest's: the activity and the events, never a からだ row or a からだ goal (contract/guest.ts)
    const rows = this.rowsSince(since);
    return { ok: true, me, now: new Date(this.io.now()).toISOString(), rev: this.rev(), rows: me === 'G' ? guestRows(rows) : rows };
  }

  /** Every row after `since` ('' = all), in `at` order: the `at` index, and the late rows that came in after it. */
  rowsSince(since: string): SnapshotRows {
    const sql = this.io.sql;
    const late = since ? Date.parse(since) - LATE_MARGIN_MS : 0;
    const pick = <T extends Record<string, Bind>>(tab: 'metrics' | 'events', cols: string): T[] => {
      const rows = sql.exec<T & { seq: number }>(`SELECT seq, ${cols} FROM ${tab} WHERE at > ? ORDER BY at, seq`, since).toArray();
      if (!since) return rows;
      const extra = sql.exec<T & { seq: number }>(`SELECT seq, ${cols} FROM ${tab} WHERE late > ? AND at <= ?`, late, since).toArray();
      if (!extra.length) return rows;
      return [...rows, ...extra].sort((x, y) => (String(x.at) < String(y.at) ? -1 : String(x.at) > String(y.at) ? 1 : x.seq - y.seq));
    };
    return {
      metrics: pick<{ at: string; person: PersonId; date: string; metric: MetricRow[3]; value: number }>('metrics', 'at, person, date, metric, value')
        .map((r) => [r.at, r.person, r.date, r.metric, r.value]),
      events: pick<{ at: string; person: Who; id: string; type: EventRow[3]; data: string }>('events', 'at, person, id, type, data')
        .map((r) => [r.at, r.person, r.id, r.type, r.data])
    };
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
      this.io.tx(() => this.addUpload(auditRow(this.nextAt(), me, 'error', bytes, msg, body)));
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
      let n = 0;
      for (const m of parsed.metrics) {
        const k = `${m.date}|${m.metric}`;
        if (latest.get(k) === m.value) continue;
        latest.set(k, m.value);
        this.io.sql.exec('INSERT INTO metrics (at, person, date, metric, value) VALUES (?, ?, ?, ?, ?)', at, me, m.date, m.metric, m.value);
        n++;
      }
      this.addUpload(auditRow(at, me, parsed.skipped ? 'partial' : 'ok', bytes, auditNotes(parsed), body));
      return n ? { n, at } : { n, at: null };
    });
    if (added.at) this.io.notify({ what: 'ingest', who: me, at: added.at, rev: this.rev() });
    return {
      ok: true, metrics: added.n,
      ...(parsed.skipped ? { skipped: parsed.skipped } : {}),
      ...(parsed.warnings.length ? { warnings: parsed.warnings } : {})
    };
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
   * the lot.
   */
  private events(me: Who, body: Rec): Reply {
    const list = body.events;
    if (!Array.isArray(list) || !list.length || list.length > EVENTS_MAX) return fail('bad_request');
    let last: string | null = null;
    const results = list.map((e) => {
      const r = isRec(e) ? this.keep(me, e) : fail('bad_request');
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
    // High-fives go over the room only (2026-11-02): one still queued on a phone from before is acknowledged, not kept
    if (body.type === 'highfive') return me === 'G' ? fail('forbidden') : { ok: true };
    if (typeof body.type !== 'string' || !(EVENT_TYPES as readonly string[]).includes(body.type)) return fail('bad_request');
    const data = body.data === undefined ? {} : body.data;
    if (!isRec(data)) return fail('bad_request');
    // the guest writes only its finds, tallies, the tent's decor and its own cosmetic prefs (contract/guest.ts)
    if (me === 'G' && !guestMayWrite(body.type, data)) return fail('forbidden');
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
        if (v === 'full') return fail('bad_request', data.sc === 't' ? 'tent full' : 'decor full');
        if (v === 'stale') {
          this.io.sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
          return { ok: true, duplicate: true };
        }
      }
      const at = this.nextAt();
      this.put(id, at, me, type, json, eventSlot(type, me, subject, data, Date.parse(at)), null);
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
      let d: unknown;
      try { d = JSON.parse(r.data); } catch { continue; }
      if (!isRec(d) || d.spendId !== spendId) continue;
      if (r.type === 'spend_void') return 'voided';
      found = true;
    }
    return found ? 'ok' : 'missing';
  }

  /** A decor op against the record's (each item's latest op): `stale`, `full` or `append` (contract/decor.ts decorAccept). */
  private decorTarget(me: Who, d: Rec): 'append' | 'stale' | 'full' {
    const tent = d.sc === 't';
    const parse = (x: Rec) => (tent ? tentOpOf(x) : decorOpOf(x));
    const e = { ...parse(d)!, who: me };
    const held: (DecorEntry | TentEntry)[] = [];
    for (const r of this.io.sql.exec<{ person: string; data: string }>("SELECT person, data FROM events WHERE type = 'decor'").toArray()) {
      let x: unknown;
      try { x = JSON.parse(r.data); } catch { continue; }
      const op = isRec(x) && isWho(r.person) ? parse(x) : null;
      if (op) held.push({ ...op, who: r.person } as DecorEntry | TentEntry);
    }
    return tent ? tentAccept(held as TentEntry[], e as TentEntry) : decorAccept(held as DecorEntry[], e as DecorEntry);
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
    if (typeof at !== 'string' || !ISO_AT.test(at) || !isPersonId(person) || !isId(id) || typeof type !== 'string' || typeof raw !== 'string') return 'skipped';
    if (!(EVENT_TYPES as readonly string[]).includes(type)) return 'skipped';
    if (this.known(id)) return 'had';
    let d: unknown;
    try { d = JSON.parse(raw || '{}'); } catch { d = null; }
    const subject = isRec(d) ? eventSubject(type, d, person) : null;
    if (!isRec(d) || !subject) return 'skipped';
    const sql = this.io.sql;
    if (type === 'decor' && (decorOpOf(d) || tentOpOf(d)) && this.decorTarget(person, d) !== 'append') {
      sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // beaten (or past the cap): only its id is kept
      return 'had';
    }
    const slot = eventSlot(type, person, subject, d, Date.parse(at));
    if (slot && type !== 'decor') {
      const held = sql.exec<{ at: string }>('SELECT at FROM events WHERE slot = ?', slot).toArray()[0];
      if (held && held.at >= at) {
        sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id); // a later one of the slot is there already
        return 'had';
      }
    }
    this.put(id, at, person, type, raw || '{}', slot, this.seeAt(at) ? arrived : null);
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

  /** Every row, as `load` takes them (a backup, and what the sheet's export writes): the load of a dump is the record. */
  dump(): { rows: Required<ImportRows> } {
    const all = this.rowsSince('');
    const uploads = this.io.sql.exec<{ at: string; person: string; status: string; bytes: number; notes: string }>('SELECT at, person, status, bytes, notes FROM uploads ORDER BY seq').toArray()
      .map((r) => [r.at, r.person, r.status, r.bytes, r.notes]);
    return { rows: { metrics: all.metrics, events: all.events, uploads } };
  }

  /**
   * The sheet's export (docs/backend.md#the-record "Export"): when the record changed since the last one (or `force`),
   * the body to POST to the Apps Script web app: `{action: 'export', t, sig, data}`, `data` every row as JSON text
   * (ASCII: anything past it escaped), `sig` = HMAC-SHA256(notify secret, "<t>.<data>") (Apps Script reads no
   * headers). Null when there's nothing new. `exported(upto)` once the sheet took it.
   */
  async exportBody(force: boolean): Promise<{ body: string; upto: number } | null> {
    const upto = this.lastAt;
    if (!force && upto <= Number(this.meta('exported_upto') ?? 0)) return null;
    const secret = await notifySecret(this.io.keys);
    if (!secret) return null;
    const data = JSON.stringify({ ...this.dump(), rev: this.rev(), upto: upto ? new Date(upto).toISOString() : null, at: new Date(this.io.now()).toISOString() })
      .replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
    const t = String(this.io.now());
    return { body: JSON.stringify({ action: 'export', t, sig: await notifySig(secret, t, data), data }), upto };
  }

  exported(upto: number): void {
    this.setMeta('exported_upto', String(upto));
  }
}
