// The record (docs/backend.md#the-record): metrics, events and the ingest audit in the store Durable Object's SQLite,
// free of the Workers runtime so it is unit-testable (test/store.test.ts runs it on node:sqlite). The same API as the
// Apps Script web app had (`{key, action, ...}` → `{ok, ...}`), so the app and the Shortcut only change the URL.
//
// - `at` is the record's clock: strictly increasing (max(now, last + 1 ms)), shared by the rows of one ingest.
// - An event id is accepted once, forever (`ids`: a replaced event's id still dedupes a late retry).
// - A slot (app model/record.ts eventSlot) holds one event: a later one of the same slot replaces it, so a tally or an
//   island day is one row per person and day, a cosmetic pref one per person, a goal one per person and Tokyo day,
//   a decoration one per item, a board post, a meal entry, a repeat, a recipe and a custom food one per id (each
//   one's latest op).
// - A `sell` or a `buy` (the shop, contract/shop.ts) is kept only when the sender's own rows cover it: their tallies'
//   catches less their sells (the pocket), their sells' かいがら less their buys (shopLedger), a piece bought once.
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
import { isRoomScope, isVoid, layoutAccept, layoutOpOf, scopeMayWrite, type LayoutEntry } from '../../app/src/lib/contract/layout.ts';
import { BOARD_MAX, boardAccept, boardOpOf, cleanText, type BoardEntry } from '../../app/src/lib/contract/board.ts';
import { foodAccept, foodCustomOp, foodOp, foodRecipeOp, foodRepeatOp, repeatAccept, repeatNext, type RepeatOpBy } from '../../app/src/lib/contract/food.ts';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { notifySecret, notifySig, verifyNotify } from './notify.ts';
import { keyOwner, type Keys } from './auth.ts';
import { guestMayWrite, guestRows } from '../../app/src/lib/contract/guest.ts';
import { buyOf, sellOf, shopLedger, shopRefusal, type ShopRow } from '../../app/src/lib/contract/shop.ts';
import { isTally } from '../../app/src/lib/contract/tally.ts';
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
const EVENTS_MAX = 50;
/** A late row is returned to a poll whose `since` is at most this much after its arrival (the servers' clocks). */
export const LATE_MARGIN_MS = 10_000;
const KEY_RE = /^[0-9a-fA-F]{32,128}$/;
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
  // every event id ever accepted, also of events a later one replaced
  'CREATE TABLE IF NOT EXISTS ids (id TEXT PRIMARY KEY) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS uploads (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, person TEXT NOT NULL, status TEXT NOT NULL, bytes INTEGER NOT NULL, notes TEXT NOT NULL, UNIQUE (at, person))',
  'CREATE INDEX IF NOT EXISTS uploads_person ON uploads (person, seq)',
  // the phones' anonymous health of the app (no person, no data of theirs): an error's message and stack top, a
  // session's frames and load time (docs/ops/runbook.md "Telemetry"); the newest TELEMETRY_KEEP kept
  'CREATE TABLE IF NOT EXISTS telemetry (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL)'
];
/** The telemetry rows kept (the newest), and how many a day it takes at most (the Free plan's writes). */
export const TELEMETRY_KEEP = 500, TELEMETRY_PER_DAY = 200;
/** A telemetry record's fields: numbers (rounded, bounded) and short strings; nothing else is kept. */
const TELE_NUM = ['loadMs', 'p50', 'p95', 'fps', 'idleFps', 'drawFps', 'longFrames', 'dpr', 'w', 'h'] as const;
const TELE_STR: Record<string, number> = { build: 40, os: 40, view: 20, msg: 200, stack: 300, src: 120, mode: 20 };

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
      case 'telemetry': return this.telemetry(body);
      default: return fail('bad_request');
    }
  }

  // ---------------------------------------------------------------- telemetry

  /** A phone's anonymous record (`kind` session | error): only its known fields, bounded; who sent it isn't kept. */
  private telemetry(body: Rec): Reply {
    const kind = body.kind;
    if (kind !== 'session' && kind !== 'error') return fail('bad_request');
    const data = isRec(body.data) ? body.data : {};
    const out: Record<string, number | string | boolean> = {};
    for (const k of TELE_NUM) {
      const v = data[k];
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.round(Math.max(-1e6, Math.min(1e6, v)) * 10) / 10;
    }
    for (const [k, n] of Object.entries(TELE_STR)) {
      const v = data[k];
      if (typeof v === 'string' && v) out[k] = v.slice(0, n);
    }
    if (typeof data.standalone === 'boolean') out.standalone = data.standalone;
    const now = new Date(this.io.now()), day = now.toISOString().slice(0, 10);
    const today = Number(this.io.sql.exec<{ n: number }>('SELECT count(*) AS n FROM telemetry WHERE at >= ?', day).toArray()[0]?.n ?? 0);
    if (today >= TELEMETRY_PER_DAY) return { ok: true, kept: false };
    this.io.sql.exec('INSERT INTO telemetry (at, kind, data) VALUES (?, ?, ?)', now.toISOString(), kind, JSON.stringify(out));
    this.io.sql.exec('DELETE FROM telemetry WHERE seq <= (SELECT max(seq) FROM telemetry) - ?', TELEMETRY_KEEP);
    return { ok: true, kept: true };
  }

  /** The admin `telemetry {n}`: the newest `n` records (100), newest first. */
  telemetryRows(n = 100): { at: string; kind: string; data: Record<string, unknown> }[] {
    return this.io.sql.exec<{ at: string; kind: string; data: string }>('SELECT at, kind, data FROM telemetry ORDER BY seq DESC LIMIT ?', Math.max(1, Math.min(TELEMETRY_KEEP, n)))
      .toArray().map((r) => ({ at: r.at, kind: r.kind, data: JSON.parse(r.data) as Record<string, unknown> }));
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
      let d: unknown;
      try { d = JSON.parse(r.data); } catch { continue; }
      if (!isRec(d) || d.spendId !== spendId) continue;
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
      let x: unknown;
      try { x = JSON.parse(r.data); } catch { continue; }
      const op = isRec(x) ? boardOpOf(x) : null;
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
    let x: unknown;
    try { x = JSON.parse(r.data); } catch { x = null; }
    const op = FOOD_PARSE[type](x);
    return op ? { ...op, who: r.person } : null;
  }

  /** Why a sell or a buy of `me`'s isn't covered by their rows (contract/shop.ts shopRefusal), or null. The fold reads
   *  their day tallies (one row a day: ≤ 366 a year) and their shop rows, in the object, never the Worker. */
  private shopTarget(me: Who, type: 'sell' | 'buy', d: Rec): 'pocket' | 'wallet' | 'owned' | null {
    const parse = (raw: string): Rec | null => {
      try {
        const x: unknown = JSON.parse(raw);
        return isRec(x) ? x : null;
      } catch {
        return null;
      }
    };
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
      let x: unknown;
      try { x = JSON.parse(r.data); } catch { continue; }
      if (isRec(x) && isWho(r.person)) out.push({ seq: r.seq, person: r.person, d: x });
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
