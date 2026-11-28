// The shared money on the relay (docs/finance.md; the contract app/src/lib/contract/finance.ts): members only, never the
// guest's (contract/guest.ts membersOnly; the Worker's gate, storeRoute.ts finGate). The `fin_*` rows are ordinary
// `events` rows (a slot per id, the latest kept: store.ts keep); this file keeps what the record adds for them:
// - `fin_log`, append-only, a row per op kept (the op's id, who, the slot's data before and after), written in the op's
//   transaction, never pruned, in the dump and the nightly backup (storeDump.ts);
// - the snapshot of the money's rows alone (`snapshot {kinds: 'fin'}`, the /money app), paged as the whole one is;
// - one-time pairing codes (`paircode` a member mints, `pairredeem` a new device redeems for that member's key), kept
//   only as a keyed hash, 5 minutes, once;
// - the nightly check (`fincheck`): the live entries' count and the all-time balance from the slots against fin_log's
//   replay; a drift is logged as an error and raised by /health/log's `finDrift` (health.yml's alert);
// - the history (`finlog`, a member's read of fin_log: the desktop page), paged by seq;
// - the admin's import (`fin_import`, record.ts fin-import): rows marked `imp: 1`, idempotent by id.
// Counts only in the log (never an amount, a description or a category). Free of the Workers runtime (test/finance.test.ts).
import { FIN_TYPES, finClean, finConfigOf, finEntryOf, finNet, finSlot, finTemplateOf, isFinType, type FinEntry, type FinType } from '../../app/src/lib/contract/finance.ts';
import type { EventRow, PersonId, Who } from '../../app/src/lib/contract/api.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { eventRow, LATE_MARGIN_MS, EVENT_COLS, type Cursor, type EventCols } from './storeRows.ts';
import { fail, type Rec, type Reply, type StoreBase } from './storeBase.ts';

export const FIN_TABLES = [
  // (`who`: the sender, or `imp` for the admin's import; `before` null for a slot's first op)
  'CREATE TABLE IF NOT EXISTS fin_log (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, who TEXT NOT NULL, type TEXT NOT NULL, id TEXT NOT NULL, before TEXT, after TEXT NOT NULL)',
  // (one row's history, `finlog {id}`: a row of its own an op, on fin_log, never on `events`)
  'CREATE INDEX IF NOT EXISTS fin_log_id ON fin_log (id, seq)',
  // the pairing codes: a keyed hash of each (pairHash), whose it is, when it expires (ms); a few rows, never dumped
  'CREATE TABLE IF NOT EXISTS fin_pair (h TEXT PRIMARY KEY, who TEXT NOT NULL, exp INTEGER NOT NULL) WITHOUT ROWID'
];

/** A pairing code lives this long (ms), and a member holds this many live at most. */
export const PAIR_TTL_MS = 5 * 60_000;
const PAIR_LIVE_MAX = 3;
/** Redeems a minute, everyone's together (a redeem has no key to count by): 40 bits of code past this rate is never guessed. */
export const PAIR_TRIES_PER_MINUTE = 10;
/** The code's letters (no 0 O 1 I: read aloud or typed from another screen), 32 so a byte's low five bits pick one evenly. */
const PAIR_ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const PAIR_LEN = 8;
/** An import request's rows at most (record.ts sends FIN_IMPORT_CHUNK). */
export const FIN_IMPORT_MAX = 500;
/** A `finlog` page's rows by default, at most. */
const FINLOG_PAGE = 100;
const FINLOG_PAGE_MAX = 500;
/** The meta row of the last nightly check: `{at, n, drift}`. */
const CHECK_META = 'fin_check';
/** The rows of the money's types (a fixed list, bound as parameters). */
const TYPES_IN = `type IN (${FIN_TYPES.map(() => '?').join(', ')})`;
const SEQ_MAX = 9e15;

/** A code as typed: upper case, its separators gone. */
const codeNorm = (v: string): string => v.toUpperCase().replace(/[^0-9A-Z]/g, '');

/** A fin_log row as the dump carries it: `[seq, at, who, type, id, before, after]`. */
type FinLogRow = [number, string, string, string, string, string | null, string];

export class FinCore {
  /** The redeems of the current minute (in memory: an eviction only forgives a minute). */
  private tries = { minute: 0, n: 0 };

  constructor(private readonly b: StoreBase) {}

  // ---------------------------------------------------------------- the log

  /** An op kept (store.ts keep, the import): its row of fin_log, in the op's transaction. */
  note(at: string, who: Who | 'imp', type: FinType, id: string, before: string | null, after: string): void {
    this.b.io.sql.exec('INSERT INTO fin_log (at, who, type, id, before, after) VALUES (?, ?, ?, ?, ?, ?)', at, who, type, id, before, after);
  }

  /** Every row of fin_log, oldest first (the dump). */
  dumpRows(): FinLogRow[] {
    return this.b.io.sql.exec<{ seq: number; at: string; who: string; type: string; id: string; before: string | null; after: string }>('SELECT seq, at, who, type, id, before, after FROM fin_log ORDER BY seq')
      .toArray().map((r) => [Number(r.seq), r.at, r.who, r.type, r.id, r.before ?? null, r.after]);
  }

  /**
   * `finlog {id?, type?, after?, desc?, limit?}` (a member's: the desktop's history): fin_log's rows `[seq, at, who,
   * type, id, before, after]` by `seq` (`desc`: newest first) past the cursor `after` (a reply's `next`), `limit`
   * (FINLOG_PAGE by default, at most FINLOG_PAGE_MAX) a page; `id` (and `type`): one row's history (by fin_log_id).
   * Reads a page and one row at most.
   */
  history(body: Rec): Reply {
    const { id, type, after, desc, limit = FINLOG_PAGE } = body;
    if ((id !== undefined && (typeof id !== 'string' || !id || id.length > 64)) || (type !== undefined && !isFinType(type)) || (after !== undefined && !(Number.isInteger(after) && (after as number) >= 0))
      || (desc !== undefined && typeof desc !== 'boolean') || !(Number.isInteger(limit) && (limit as number) >= 1 && (limit as number) <= FINLOG_PAGE_MAX)) return fail('bad_request');
    const n = limit as number;
    const where = [...(id !== undefined ? ['id = ?'] : []), ...(type !== undefined ? ['type = ?'] : []), ...(after !== undefined ? [`seq ${desc ? '<' : '>'} ?`] : [])];
    const got = this.b.io.sql.exec<{ seq: number; at: string; who: string; type: string; id: string; before: string | null; after: string }>(
      `SELECT seq, at, who, type, id, before, after FROM fin_log${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY seq ${desc ? 'DESC' : 'ASC'} LIMIT ?`,
      ...([...(id !== undefined ? [id] : []), ...(type !== undefined ? [type] : []), ...(after !== undefined ? [after] : []), n + 1] as (string | number)[])
    ).toArray();
    const rows: FinLogRow[] = got.slice(0, n).map((r) => [Number(r.seq), r.at, r.who, r.type, r.id, r.before ?? null, r.after]);
    return { ok: true, rows, ...(got.length > n ? { next: rows[rows.length - 1][0] } : {}) };
  }

  /** A dump's fin_log rows (the admin's `load`), by their `seq`: what the log has is kept, so a load again adds nothing. */
  load(rows: readonly unknown[]): { fin_log: number; skipped: number } {
    let n = 0, skipped = 0;
    for (const r of rows) {
      const [seq, at, who, type, id, before, after] = Array.isArray(r) ? r : [];
      if (!Number.isInteger(seq) || typeof at !== 'string' || typeof who !== 'string' || !isFinType(type) || typeof id !== 'string' || (before !== null && typeof before !== 'string') || typeof after !== 'string') {
        skipped++;
        continue;
      }
      const got = this.b.io.sql.exec<{ seq: number }>('INSERT OR IGNORE INTO fin_log (seq, at, who, type, id, before, after) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING seq', seq as number, at, who, type, id, before as string | null, after).toArray();
      n += got.length;
    }
    return { fin_log: n, skipped };
  }

  // ---------------------------------------------------------------- the snapshot of the money alone

  /**
   * The money's rows after `since` ('' = all), a page at a time as storeRows.ts rowsPage pages the whole (`after` the
   * last page's `next`, `limit` null: all at once), the late rows on the first page of a poll. A full fetch reads them
   * by `events_type_person` (the money's rows only, sorted), a poll by `events_at` (the rows since): no index of its own.
   */
  rows(since: string, after: Cursor | null, limit: number | null): { events: EventRow[]; next: string | null } {
    const sql = this.b.io.sql;
    const c = after ?? { at: since, t: 'e' as const, seq: SEQ_MAX };
    const by = since ? 'events_at' : 'events_type_person';
    const got = sql.exec<EventCols & { seq: number }>(
      `SELECT seq, ${EVENT_COLS} FROM events INDEXED BY ${by} WHERE ${TYPES_IN} AND at >= ? AND (at > ? OR seq > ?) ORDER BY at, seq LIMIT ?`,
      ...FIN_TYPES, c.at, c.at, c.seq, limit === null ? -1 : limit + 1
    ).toArray();
    const more = limit !== null && got.length > limit;
    const page = more ? got.slice(0, limit) : got;
    const last = page[page.length - 1];
    if (!after && since) {
      const late = sql.exec<EventCols & { seq: number }>(`SELECT seq, ${EVENT_COLS} FROM events WHERE late > ? AND at <= ? AND ${TYPES_IN}`, Date.parse(since) - LATE_MARGIN_MS, since, ...FIN_TYPES).toArray();
      if (late.length) page.push(...late), page.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : x.seq - y.seq));
    }
    return { events: page.map(eventRow), next: more && last ? `${last.at}|e|${last.seq}` : null };
  }

  // ---------------------------------------------------------------- pairing

  /** A code's hash as kept: keyed with the members' keys, so a copy of the table (never dumped) can't be searched. */
  private pairHash(code: string): string {
    const k = this.b.io.keys;
    return sha256Hex(`pair|${k.KEY_A}|${k.KEY_B}|${codeNorm(code)}`);
  }

  /** `paircode` (a member: never the guest, store.ts route): a new code for `who`, PAIR_TTL_MS, once; the expired let go. */
  mint(who: PersonId): Reply {
    const now = this.b.io.now();
    const r = this.b.io.tx((): Reply => {
      this.b.io.sql.exec('DELETE FROM fin_pair WHERE exp <= ?', now);
      const live = Number(this.b.io.sql.exec<{ n: number }>('SELECT count(*) AS n FROM fin_pair WHERE who = ?', who).toArray()[0]?.n ?? 0);
      if (live >= PAIR_LIVE_MAX) return fail('busy', 'too many codes');
      const bytes = crypto.getRandomValues(new Uint8Array(PAIR_LEN));
      const raw = Array.from(bytes, (x) => PAIR_ABC[x & 31]).join('');
      const exp = now + PAIR_TTL_MS;
      this.b.io.sql.exec('INSERT OR REPLACE INTO fin_pair (h, who, exp) VALUES (?, ?, ?)', this.pairHash(raw), who, exp);
      return { ok: true, code: `${raw.slice(0, 4)}-${raw.slice(4)}`, exp };
    });
    this.b.io.log?.('fin.pair', { op: 'mint', ok: r.ok, ...(r.ok ? {} : { why: 'many' }) });
    return r;
  }

  /** `pairredeem {code}` (no key: a new device's): the code's member and key, the code gone; PAIR_TRIES_PER_MINUTE in all. */
  redeem(body: Rec): Reply {
    const minute = Math.floor(this.b.io.now() / 60_000);
    if (this.tries.minute !== minute) this.tries = { minute, n: 0 };
    if (++this.tries.n > PAIR_TRIES_PER_MINUTE) {
      this.b.io.log?.('fin.pair', { op: 'redeem', ok: false, why: 'busy' });
      return fail('busy');
    }
    if (typeof body.code !== 'string' || body.code.length > 32 || codeNorm(body.code).length !== PAIR_LEN) return fail('bad_request');
    const h = this.pairHash(body.code), now = this.b.io.now();
    const who = this.b.io.tx(() => this.b.io.sql.exec<{ who: string; exp: number }>('DELETE FROM fin_pair WHERE h = ? RETURNING who, exp', h).toArray()
      .find((r) => Number(r.exp) > now)?.who);
    const key = who === 'A' ? this.b.io.keys.KEY_A : who === 'B' ? this.b.io.keys.KEY_B : undefined;
    this.b.io.log?.('fin.pair', { op: 'redeem', ok: !!key, ...(key ? {} : { why: 'code' }) });
    return key ? { ok: true, me: who as PersonId, key } : fail('forbidden', 'code');
  }

  // ---------------------------------------------------------------- the nightly check

  /**
   * The live entries (no `del`) and the all-time balance (contract/finance.ts finNet, from A's side) as the slots hold
   * them, against the replay of fin_log (each entry's last `after`): `drift` when the count or the balance differs.
   * Two reads of the money's rows (the slots by events_type_person, the log whole), once a night. Its outcome in meta
   * (finDrift: /health/log) and the log (`fin.check`, an error on a drift).
   */
  check(): { n: number; logN: number; net: number; logNet: number; drift: boolean; bad: number } {
    const t0 = this.b.io.now();
    let bad = 0;
    const entry = (json: string | null): FinEntry | null => {
      if (json === null) return null;
      const x = this.b.rowRec(json, 'fin');
      const e = x ? finEntryOf(x, { imp: true }) : null;
      if (!e) bad++;
      return e;
    };
    const slots: FinEntry[] = [];
    for (const r of this.b.io.sql.exec<{ data: string }>("SELECT data FROM events WHERE type = 'fin_e'").toArray()) {
      const e = entry(r.data);
      if (e) slots.push(e);
    }
    const replay = new Map<string, string>();
    for (const r of this.b.io.sql.exec<{ id: string; after: string }>("SELECT id, after FROM fin_log WHERE type = 'fin_e' ORDER BY seq").toArray()) replay.set(r.id, r.after);
    const logged = [...replay.values()].map(entry).filter((e): e is FinEntry => e !== null);
    const live = (l: FinEntry[]) => l.filter((e) => e.del === undefined).length;
    const out = { n: live(slots), logN: live(logged), net: finNet(slots), logNet: finNet(logged), bad };
    const drift = out.n !== out.logN || out.net !== out.logNet || slots.length !== replay.size;
    this.b.setMeta(CHECK_META, JSON.stringify({ at: this.b.io.now(), n: out.n, drift }));
    this.b.io.log?.('fin.check', { n: out.n, drift, logN: out.logN, ms: this.b.io.now() - t0 });
    return { ...out, drift };
  }

  /** Whether the last nightly check drifted (1) or not (0): /health/log's `finDrift`. */
  lastDrift(): number {
    try {
      return (JSON.parse(this.b.meta(CHECK_META) ?? '{}') as { drift?: boolean }).drift ? 1 : 0;
    } catch {
      return 0;
    }
  }

  // ---------------------------------------------------------------- the import

  /**
   * The admin's `fin_import {rows: [{type, data}], dry?}` (record.ts fin-import; docs/finance.md "Import"): each row a
   * contract payload of a `fin_*` type, cleaned and checked as a phone's op is (an entry marked `imp: 1`, which no phone
   * may send), kept under event id `fin-imp-<type>-<id>` with its fin_log row (`who` imp). Idempotent: a row whose id
   * the record has, or whose slot holds a row already (a phone's since), is a duplicate, never written over. One
   * transaction; `dry`: counted, nothing written. Counts only (the per-person balance is the tool's, from the file).
   */
  importRows(o: Rec): Reply {
    const rows = o.rows, dry = o.dry === true;
    if (!Array.isArray(rows) || rows.length > FIN_IMPORT_MAX) return fail('bad_request');
    const t0 = this.b.io.now();
    let last = '';
    const out = this.b.io.tx(() => {
      const c = { added: 0, dup: 0, bad: 0 };
      const seen = new Set<string>();
      for (const r of rows as unknown[]) {
        const type = isRec(r) ? r.type : undefined;
        if (!isRec(r) || !isFinType(type) || !isRec(r.data)) {
          c.bad++;
          continue;
        }
        const d: Rec = { ...finClean(type, r.data), ...(type === 'fin_e' ? { imp: 1 } : {}) };
        const ok = type === 'fin_e' ? finEntryOf(d, { imp: true }) : type === 'fin_t' ? finTemplateOf(d) : finConfigOf(d);
        const slot = ok ? finSlot(type, d) : null;
        if (!ok || !slot) {
          c.bad++;
          continue;
        }
        const id = `fin-imp-${slot}`;
        if (seen.has(slot) || this.b.known(id) || this.b.slotRow(slot)) {
          c.dup++;
          continue;
        }
        seen.add(slot);
        c.added++;
        if (dry) continue;
        const json = JSON.stringify(d), at = (last = this.b.nextAt());
        this.b.put(id, at, type === 'fin_c' ? 'A' : (d.payer as PersonId), type, json, slot, null);
        this.note(at, 'imp', type, String(d.id), null, json);
      }
      return c;
    });
    this.b.io.log?.('fin.import', { dry, ...out, ms: this.b.io.now() - t0 });
    // (the members' phones fetch them; never the guest, who sees none: room.ts guestNotice)
    if (last) this.b.io.notify({ what: 'event', who: 'A', at: last, rev: this.b.rev() }, false);
    return { ok: true, dry, ...out };
  }
}

// ---------------------------------------------------------------- SHA-256 (the record's calls are synchronous)

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
const ror = (x: number, n: number): number => (x >>> n) | (x << (32 - n));

/** SHA-256 of a string's UTF-8, as hex (WebCrypto's digest is async; the record answers synchronously). */
export function sha256Hex(s: string): string {
  const m = new TextEncoder().encode(s);
  const n = ((m.length + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(n);
  buf.set(m);
  buf[m.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(n - 8, Math.floor(m.length / 0x20000000));
  dv.setUint32(n - 4, (m.length << 3) >>> 0);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2];
      w[i] = w[i - 16] + (ror(x, 7) ^ ror(x, 18) ^ (x >>> 3)) + w[i - 7] + (ror(y, 17) ^ ror(y, 19) ^ (y >>> 10));
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, '0')).join('');
}
