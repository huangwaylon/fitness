// The record's primitives (store.ts): its clock, meta, revision, the rows' writes and reads every part shares.
import type { ApiError, Fail, Who } from '../../app/src/lib/contract/api.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import type { Keys } from './auth.ts';
import { keepMetrics, MIGRATIONS, SCHEMA, type Bind, type Sql } from './storeSchema.ts';

export type Rec = Record<string, unknown>;
/** A store reply. */
export type Reply = Rec & { ok: boolean };
export const fail = (error: ApiError, detail?: string): Fail => (detail ? { ok: false, error, detail } : { ok: false, error });

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
  /** The stored ledger's events to the log (ledgerReady's `ledger.seed`, ledgerCheck's `ledger.drift`, farmKept's `farm.refused`). */
  log?(e: 'ledger.seed' | 'ledger.drift' | 'farm.refused' | 'share', d: Record<string, string | number | boolean>): void;
  /** A `todo` row was kept (やること's reminders: the object re-arms its alarm, pusher.ts). */
  onTodo?(): void;
}

/** A value an ingest held back (metrics_held): first held at `at`, last seen at `last`, `n` times; `promoted` when the
 *  admin made it a row of `metrics` (null: never). */
export interface HeldRow { person: string; date: string; metric: string; value: number; at: string; last: string; n: number; promoted: string | null }

/** The record's shared state and writes (store.ts StoreCore holds one; its parts, storeBooks/storeShop/storeDump, share it). */
export class StoreBase {
  /** The record's clock (meta `last_at`): the last `at` handed out. */
  lastAt: number;
  /** The places a corrupt row was skipped this request (each told once). */
  readonly told = new Set<string>();
  readonly io: StoreIO;

  constructor(io: StoreIO) {
    this.io = { ...io, sql: keepMetrics(io.sql) };
    for (const s of SCHEMA) this.io.sql.exec(s);
    this.migrate();
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
  noteLatest(person: string, date: string, metric: string, at: string, seq: number, value: number): void {
    this.io.sql.exec(
      `INSERT INTO metrics_latest (person, date, metric, at, seq, value) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (person, date, metric) DO UPDATE SET at = excluded.at, seq = excluded.seq, value = excluded.value
       WHERE excluded.at > metrics_latest.at OR (excluded.at = metrics_latest.at AND excluded.seq > metrics_latest.seq)`,
      person, date, metric, at, seq, value
    );
  }

  /** Append a metrics row and keep the day's latest (the one way rows go into `metrics`). */
  addMetric(at: string, person: string, date: string, metric: string, value: number, late: number | null): void {
    const r = this.io.sql.exec<{ seq: number }>('INSERT INTO metrics (at, person, date, metric, value, late) VALUES (?, ?, ?, ?, ?, ?) RETURNING seq', at, person, date, metric, value, late).toArray()[0];
    this.noteLatest(person, date, metric, at, Number(r.seq), value);
  }

  meta(k: string): string | null {
    return this.io.sql.exec<{ v: string }>('SELECT v FROM meta WHERE k = ?', k).toArray()[0]?.v ?? null;
  }
  setMeta(k: string, v: string): void {
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
  tellAll(): void {
    this.io.notify({ what: 'ingest', who: 'A', at: this.newestAt() ?? new Date(this.io.now()).toISOString(), rev: this.rev() });
  }

  /** The next `at`: strictly after every one handed out before. */
  nextAt(): string {
    this.lastAt = Math.max(this.io.now(), this.lastAt + 1);
    this.setMeta('last_at', String(this.lastAt));
    return new Date(this.lastAt).toISOString();
  }

  /** Take `at` (an import's) into the clock, so later ones stay after it; true when it is out of order (late). */
  seeAt(at: string): boolean {
    const ms = Date.parse(at);
    if (ms > this.lastAt) {
      this.lastAt = ms;
      this.setMeta('last_at', String(ms));
      return false;
    }
    return ms < this.lastAt;
  }

  /** A stored row's data as an object, or null when it isn't one: a corrupt row, skipped by the fold `where` and told
   *  to the log (never silently: the record's own writes are always JSON objects, so one that isn't is a bug or
   *  damage). */
  rowRec(data: string, where: string): Rec | null {
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

  /** A held value (metrics_held) seen at `at` (`n` times; a load's row brings its own `last`, `n` and mark). */
  hold(person: string, date: string, metric: string, value: number, at: string, n: number, promoted: string | null, last = at): void {
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

  addUpload(r: readonly unknown[]): void {
    this.io.sql.exec('INSERT OR IGNORE INTO uploads (at, person, status, bytes, notes) VALUES (?, ?, ?, ?, ?)', ...(r as Bind[]));
  }

  /** An op beaten by the one held (a board's, a book's, a food's, a decoration's): only its id kept, acknowledged. */
  stale(id: string): Reply {
    this.io.sql.exec('INSERT OR IGNORE INTO ids (id) VALUES (?)', id);
    return { ok: true, duplicate: true };
  }

  known(id: string): boolean {
    return this.io.sql.exec('SELECT 1 AS x FROM ids WHERE id = ?', id).toArray().length > 0;
  }

  /** Append an event (its slot's earlier event replaced). */
  put(id: string, at: string, who: Who, type: string, json: string, slot: string | null, late: number | null): void {
    const sql = this.io.sql;
    if (slot) sql.exec('DELETE FROM events WHERE slot = ?', slot);
    sql.exec('INSERT INTO ids (id) VALUES (?)', id);
    sql.exec('INSERT INTO events (id, at, person, type, data, slot, late) VALUES (?, ?, ?, ?, ?, ?, ?)', id, at, who, type, json, slot, late);
  }

  /** A slot's row (its sender, type and data), or null. */
  slotRow(slot: string): { person: string; type: string; data: string } | null {
    return this.io.sql.exec<{ person: string; type: string; data: string }>('SELECT person, type, data FROM events WHERE slot = ?', slot).toArray()[0] ?? null;
  }

  /** At most `max` of the `events` rows `where` matches deleted (their seqs read first: a bounded write), and whether
   *  more are left. */
  dropBatch(where: string, b: Bind[], max: number): { n: number; more: boolean } {
    if (max <= 0) return { n: 0, more: !!this.io.sql.exec(`SELECT 1 FROM events WHERE ${where} LIMIT 1`, ...b).toArray().length };
    const seqs = this.io.sql.exec<{ seq: number }>(`SELECT seq FROM events WHERE ${where} LIMIT ?`, ...b, Number.isFinite(max) ? max + 1 : -1).toArray().map((r) => Number(r.seq));
    const take = seqs.slice(0, max);
    if (take.length) this.io.sql.exec('DELETE FROM events WHERE seq IN (SELECT value FROM json_each(?))', JSON.stringify(take));
    return { n: take.length, more: seqs.length > take.length };
  }

  /** The newest `at` in the record (for a notice after an import), or null. */
  newestAt(): string | null {
    return this.lastAt ? new Date(this.lastAt).toISOString() : null;
  }

  uploadRows(): unknown[][] {
    return this.io.sql.exec<{ at: string; person: string; status: string; bytes: number; notes: string }>('SELECT at, person, status, bytes, notes FROM uploads ORDER BY seq').toArray()
      .map((r) => [r.at, r.person, r.status, r.bytes, r.notes]);
  }
}
