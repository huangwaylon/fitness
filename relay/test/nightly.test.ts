// The record's nightly jobs (src/nightly.ts, store.ts nightly): each job's day stamped in meta; the ticks' catch-up
// runs only those not done today; a prune's batch left over continues on the next tick; a failing job is retried and
// never stops the others; the day's line once, when the last finishes; `/health/log`'s ages.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { isCatchup, PRUNE_BATCH } from '../src/nightly.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
// 03:00 Tokyo, 2026-11-05
const T0 = Date.parse('2026-11-04T18:00:00.000Z');
const H = 3_600_000;

describe('the nightly jobs', () => {
  let now: number;
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  let fails: [string, string][];
  let lines: Record<string, number | boolean>[];
  beforeEach(() => {
    now = T0;
    db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => now, notify: () => {} });
    fails = [];
    lines = [];
  });
  const run = (late = false) => store.nightly(late, { fail: (j, e) => fails.push([j, (e as Error).name]), done: (d) => lines.push(d) });
  const islandRows = () => db.sql.exec<{ n: number }>("SELECT COUNT(*) AS n FROM events WHERE type = 'island'").toArray()[0].n;
  /** `n` old island days (a person's a day from 2019), the backlog a first prune finds. */
  function backlog(n: number) {
    db.tx(() => {
      for (let i = 0; i < n; i++) {
        const d = new Date(Date.UTC(2019, 0, 1) + i * 86_400_000).toISOString().slice(0, 10), who = 'AB'[i % 2];
        db.sql.exec("INSERT INTO events (id, at, person, type, data, slot) VALUES (?, ?, ?, 'island', '{}', ?)", `i${i}`, `${d}T00:00:00.000Z`, who, `island|${who}|${d}`);
      }
    });
  }

  it('runs each job once a day; a prune’s backlog a batch a run, finished by the ticks’ catch-up; the day’s line once', () => {
    backlog(PRUNE_BATCH + 500);
    expect(run()).toEqual({ ran: ['ledgercheck', 'sharesweep', 'islandprune', 'ledgerprune', 'tombprune'], failed: [], left: ['islandprune'] });
    expect(islandRows()).toBe(500);
    expect(lines).toEqual([]);
    now = T0 + 75 * 60_000; // 04:15
    expect(run(true)).toEqual({ ran: ['islandprune'], failed: [], left: [] });
    expect(islandRows()).toBe(0);
    expect(lines).toEqual([{ drift: 0, swept: 0, island: PRUNE_BATCH + 500, ledger: 0, tomb: 0, late: true, ms: 0 }]);
    // done today: the next ticks run nothing
    now += 30 * 60_000;
    expect(run(true)).toEqual({ ran: [], failed: [], left: [] });
    expect(lines).toHaveLength(1);
    // the next day's 03:00 runs them all again, its counts its own
    now = T0 + 24 * H;
    expect(run().left).toEqual([]);
    expect(lines[1]).toMatchObject({ island: 0, late: false });
    expect(fails).toEqual([]);
  });

  it('a job that throws is said, never stamped and never stops the others; the catch-up runs it alone', () => {
    const sweep = store.share.sweep.bind(store.share);
    store.share.sweep = () => {
      throw new RangeError('cpu');
    };
    expect(run()).toMatchObject({ failed: ['sharesweep'], left: ['sharesweep'] });
    expect(fails).toEqual([['sharesweep', 'RangeError']]);
    expect(lines).toEqual([]);
    store.share.sweep = sweep;
    now = T0 + 2 * H;
    expect(run(true)).toEqual({ ran: ['sharesweep'], failed: [], left: [] });
    expect(lines).toEqual([expect.objectContaining({ late: true })]);
  });

  it('a missed 03:00: the first tick from 04:15 runs them all', () => {
    run();
    now = T0 + 24 * H + 75 * 60_000;
    expect(run(true).ran).toHaveLength(5);
  });

  it('the ages for /health/log: hours since each finished, the oldest as nightlyH; -1 for one never done', () => {
    expect(store.nightlyStatus()).toEqual({ nightlyH: -1, nightly: { ledgercheck: -1, sharesweep: -1, islandprune: -1, ledgerprune: -1, tombprune: -1 } });
    run();
    now = T0 + 26.5 * H;
    expect(store.nightlyStatus()).toEqual({ nightlyH: 26.5, nightly: { ledgercheck: 26.5, sharesweep: 26.5, islandprune: 26.5, ledgerprune: 26.5, tombprune: 26.5 } });
    // a stamp unreadable is none
    db.sql.exec("UPDATE meta SET v = 'x' WHERE k = 'nightly|tombprune'");
    expect(store.nightlyStatus()).toMatchObject({ nightlyH: -1, nightly: { tombprune: -1 } });
  });

  it('the catch-up’s window: Tokyo 04:15 to midnight', () => {
    const at = (hm: string) => Date.parse(`2026-11-05T${hm}:00.000+09:00`);
    expect(['00:00', '03:00', '03:45', '04:14'].map((t) => isCatchup(at(t)))).toEqual([false, false, false, false]);
    expect(['04:15', '12:45', '23:45'].map((t) => isCatchup(at(t)))).toEqual([true, true, true]);
  });
});
