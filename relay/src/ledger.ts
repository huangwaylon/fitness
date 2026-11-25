// The stored ledger (docs/backend.md#the-ledger, app contract/ledger.ts): each person's parts (`hp` the かいがら and
// the pocket, `w` the pieces bought, `g` the games paid, `z` the ずかん totals) as rows of `ledger`, one per person and
// part, each with its change count `seq` and the record's time of its last change `at`; and `ledger_log`, a row per
// op applied (its id, type, data and the かいがら before and after: the daily chain check's), kept LOG_KEEP_DAYS. The
// record (store.ts) reads a person's parts, steps them by the contract's rules and writes the parts that moved, in the
// op's transaction. The field (contract/farm.ts: each plot's plant) is one more row, `F|field`, the same way: judged
// and stepped by each farm row, served as a reply's `field`. Free of the Workers runtime (test/ledger.test.ts).
import { emptyLedger, LEDGER_PARTS, partInto, partJson, type FieldWire, type Ledger, type LedgerPart, type Ledgers } from '../../app/src/lib/contract/ledger.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';
import { fieldFromJson, fieldJson, type Farm } from '../../app/src/lib/contract/farm.ts';
import type { Sql } from './store.ts';

export const LEDGER_TABLES = [
  'CREATE TABLE IF NOT EXISTS ledger (who TEXT NOT NULL, part TEXT NOT NULL, seq INTEGER NOT NULL, at TEXT NOT NULL, v TEXT NOT NULL, PRIMARY KEY (who, part)) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS ledger_log (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, who TEXT NOT NULL, id TEXT NOT NULL, type TEXT NOT NULL, d TEXT NOT NULL, h0 INTEGER NOT NULL, h1 INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS ledger_log_at ON ledger_log (at)'
];

/** The log keeps an op this long (past TALLY_PAST_DAYS: an op that late is the oldest the record takes). */
const LOG_KEEP_DAYS = 60;

export const WHO = ['A', 'B', 'G'] as const;

/** A ledger row as the wire and the dump carry it: `[who, part, seq, at, v]` (`v` the part's JSON text). */
export type LedgerRow = [string, string, number, string, string];

const isPart = (p: unknown): p is LedgerPart => (LEDGER_PARTS as readonly unknown[]).includes(p);
/** The field's row: its `who` and `part`. */
const FIELD = ['F', 'field'] as const;

export class LedgerStore {
  /** The parts written since the caller last cleared it (`who|part`: a request's, its ack's `ledgers`). */
  readonly written = new Set<string>();

  constructor(private readonly sql: Sql) {}

  /** The parts as a reply carries them: `keys` (`who|part`), or every one changed after `since` ('' = all). */
  wire(keys?: ReadonlySet<string>, since = ''): Ledgers {
    const out: Ledgers = {};
    for (const [who, part, seq, at, v] of this.rows(since)) {
      if ((keys && !keys.has(`${who}|${part}`)) || !isPart(part)) continue;
      ((out[who as Who] ??= {}) as Record<string, unknown>)[part] = { seq, at, v: JSON.parse(v) as unknown };
    }
    return out;
  }

  /** `who`'s ledger (only `parts` read, the others left empty), or null when none is kept (not seeded yet: its `hp`
   *  is the mark). A part that can't be read is empty (the daily check shows it). */
  read(who: Who, parts: readonly LedgerPart[] = LEDGER_PARTS): Ledger | null {
    const want = parts.includes('hp') ? parts : ['hp', ...parts];
    const rows = this.sql.exec<{ part: string; v: string }>(`SELECT part, v FROM ledger WHERE who = ? AND part IN (${want.map(() => '?').join(', ')})`, who, ...want).toArray();
    if (!rows.some((r) => r.part === 'hp')) return null;
    const l = emptyLedger();
    for (const r of rows) {
      if (!isPart(r.part)) continue;
      try {
        partInto(l, r.part, JSON.parse(r.v));
      } catch { /* empty */ }
    }
    return l;
  }

  /** The field as kept (its pockets' changes empty: the ledgers hold the pockets), or null when none is (not seeded, or
   *  an older relay's shape). */
  field(): Farm | null {
    const r = this.sql.exec<{ v: string }>('SELECT v FROM ledger WHERE who = ? AND part = ?', ...FIELD).toArray()[0];
    if (!r) return null;
    try {
      return fieldFromJson(JSON.parse(r.v));
    } catch {
      return null;
    }
  }

  /** The field written (its plots), its `seq` one more (never back to 1: a phone keeps the highest), at `at`. */
  setField(f: Farm, at: string): void {
    this.sql.exec(
      'INSERT INTO ledger (who, part, seq, at, v) VALUES (?, ?, 1, ?, ?) ON CONFLICT (who, part) DO UPDATE SET seq = seq + 1, at = excluded.at, v = excluded.v',
      ...FIELD, at, JSON.stringify(fieldJson(f))
    );
    this.written.add(FIELD.join('|'));
  }

  /** Whether a field row is kept, of any shape. */
  hasField(): boolean {
    return this.sql.exec('SELECT 1 AS x FROM ledger WHERE who = ? AND part = ?', ...FIELD).toArray().length > 0;
  }

  /** The field as a reply carries it: when written this request (`written`), or changed after `since`; else none. */
  fieldWire(opts: { written?: ReadonlySet<string>; since?: string }): FieldWire | undefined {
    if (opts.written && !opts.written.has(FIELD.join('|'))) return undefined;
    const r = this.sql.exec<{ seq: number; at: string; v: string }>('SELECT seq, at, v FROM ledger WHERE who = ? AND part = ? AND at > ?', ...FIELD, opts.since ?? '').toArray()[0];
    return r ? { seq: r.seq, at: r.at, v: JSON.parse(r.v) as unknown } : undefined;
  }

  /** Whether `who` has a ledger kept. */
  has(who: Who): boolean {
    return this.sql.exec("SELECT 1 AS x FROM ledger WHERE who = ? AND part = 'hp'", who).toArray().length > 0;
  }

  /** The parts of `l` that `moved` written as `who`'s, each its `seq` one more, at `at`. */
  write(who: Who, l: Ledger, moved: Iterable<LedgerPart>, at: string): void {
    for (const part of moved) {
      this.sql.exec(
        'INSERT INTO ledger (who, part, seq, at, v) VALUES (?, ?, 1, ?, ?) ON CONFLICT (who, part) DO UPDATE SET seq = seq + 1, at = excluded.at, v = excluded.v',
        who, part, at, JSON.stringify(partJson(l, part))
      );
      this.written.add(`${who}|${part}`);
    }
  }

  /** `who`'s ledger kept whole (a seed): every part, at `at`. */
  seed(who: Who, l: Ledger, at: string): void {
    this.write(who, l, LEDGER_PARTS, at);
  }

  /** An op applied to `who`'s ledger, for the log: its id, type, its data as kept, the かいがら before and after. */
  log(at: string, who: Who, id: string, type: string, d: string, h0: number, h1: number): void {
    this.sql.exec('INSERT INTO ledger_log (at, who, id, type, d, h0, h1) VALUES (?, ?, ?, ?, ?, ?, ?)', at, who, id, type, d, h0, h1);
  }

  /** The log's rows older than LOG_KEEP_DAYS before `now` let go; how many. */
  prune(now: number): number {
    const cut = new Date(now - LOG_KEEP_DAYS * 86_400_000).toISOString();
    const n = this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM ledger_log WHERE at < ?', cut).toArray()[0]?.n ?? 0;
    if (n) this.sql.exec('DELETE FROM ledger_log WHERE at < ?', cut);
    return n;
  }

  /** `who`'s log, newest first (at most `limit`). */
  logOf(who: Who, limit = 50): { at: string; id: string; type: string; d: string; h0: number; h1: number }[] {
    return this.sql.exec<{ at: string; id: string; type: string; d: string; h0: number; h1: number }>(
      'SELECT at, id, type, d, h0, h1 FROM ledger_log WHERE who = ? ORDER BY seq DESC LIMIT ?', who, limit
    ).toArray();
  }

  /** Whether `who`'s log chains (each op's かいがら before its last one's after) and ends at `h`; the first break. */
  chain(who: Who, h: number): { ok: boolean; at?: string } {
    let last: number | null = null;
    for (const r of this.sql.exec<{ at: string; h0: number; h1: number }>('SELECT at, h0, h1 FROM ledger_log WHERE who = ? ORDER BY seq', who).toArray()) {
      if (last !== null && r.h0 !== last) return { ok: false, at: r.at };
      last = r.h1;
    }
    return last === null || last === h ? { ok: true } : { ok: false, at: 'end' };
  }

  /** Every row (the dump's), or those changed after `since` (a snapshot's). */
  rows(since = ''): LedgerRow[] {
    return this.sql.exec<{ who: string; part: string; seq: number; at: string; v: string }>('SELECT who, part, seq, at, v FROM ledger WHERE at > ? ORDER BY who, part', since)
      .toArray().map((r) => [r.who, r.part, r.seq, r.at, r.v]);
  }

  /** The log's rows as the dump carries them: `[at, who, id, type, d, h0, h1]`. */
  logRows(): unknown[][] {
    return this.sql.exec<{ at: string; who: string; id: string; type: string; d: string; h0: number; h1: number }>('SELECT at, who, id, type, d, h0, h1 FROM ledger_log ORDER BY seq')
      .toArray().map((r) => [r.at, r.who, r.id, r.type, r.d, r.h0, r.h1]);
  }

  /** A dump's rows into the record as they were (a dump's ledger is the record's): each row replaces its slot. */
  load(rows: readonly unknown[][] = [], log: readonly unknown[][] = []): number {
    let n = 0;
    for (const r of rows) {
      const [who, part, seq, at, v] = r;
      if (!Number.isInteger(seq) || typeof at !== 'string' || typeof v !== 'string') continue;
      let x: unknown;
      try { x = JSON.parse(v); } catch { continue; }
      const field = who === FIELD[0] && part === FIELD[1];
      if (!field && (!(WHO as readonly unknown[]).includes(who) || !isPart(part) || !partInto(emptyLedger(), part, x))) continue;
      if (field && !fieldFromJson(x)) continue;
      this.sql.exec('INSERT OR REPLACE INTO ledger (who, part, seq, at, v) VALUES (?, ?, ?, ?, ?)', who as string, part as string, seq as number, at, v);
      n++;
    }
    for (const r of log) {
      const [at, who, id, type, d, h0, h1] = r;
      if (typeof at !== 'string' || typeof who !== 'string' || typeof id !== 'string' || typeof type !== 'string' || typeof d !== 'string' || !Number.isInteger(h0) || !Number.isInteger(h1)) continue;
      this.sql.exec('INSERT INTO ledger_log (at, who, id, type, d, h0, h1) VALUES (?, ?, ?, ?, ?, ?, ?)', at, who, id, type, d, h0 as number, h1 as number);
    }
    return n;
  }

  /** Every ledger let go (a load into an empty record: seeded again from the loaded rows). */
  clear(): void {
    this.sql.exec('DELETE FROM ledger');
  }
}
