// The record's schema (src/store.ts MIGRATIONS, meta `schema_v`) and the tables the migrations add: metrics_latest
// (each day's latest value, an ingest's comparison: never the history).
import { beforeEach, describe, expect, it } from 'vitest';
import { SCHEMA_V, StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const T0 = Date.parse('2026-11-02T03:00:00.000Z'); // 12:00 Tokyo

let now: number;
let db: ReturnType<typeof memSql>;
let store: StoreCore;
const make = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => now, notify: () => {} });
const a = (action: string, extra: object = {}) => store.handle({ key: KEY_A, action, ...extra }, 100) as Record<string, any>;
const q = <T,>(sql: string, ...b: (string | number)[]) => db.db.prepare(sql).all(...b) as T[];

beforeEach(() => {
  now = T0;
  db = memSql();
  store = make();
});

/** A Shortcut body of `days` days to 2026-11-02 (its 32 days, as the phones send), steps `base + i`. */
function body(days: number, base: number) {
  const dates: string[] = [], steps: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(T0 - i * 86_400_000);
    dates.push(`${d.toLocaleString('en-US', { month: 'short', timeZone: 'Asia/Tokyo' })} ${d.getUTCDate()}, 2026 at 7:00 AM`);
    steps.push(String(base + i));
  }
  return { dates: dates.join('\n'), steps: steps.join('\n') };
}

describe('the migrations', () => {
  it('run once each, in order, and say so (schema_v)', () => {
    expect(store.schemaV()).toBe(SCHEMA_V);
    expect(q<{ v: string }>("SELECT v FROM meta WHERE k = 'schema_v'")[0].v).toBe(String(SCHEMA_V));
    expect(q<{ name: string }>("SELECT name FROM sqlite_master WHERE name = 'events_type_person'")).toHaveLength(1);
    make(); // a restart: nothing again
    expect(store.schemaV()).toBe(SCHEMA_V);
  });

  it('a record from before them is brought up: each day’s latest from its history, and an ingest goes on as before', () => {
    a('ingest', body(3, 1000));
    now += 60_000;
    a('ingest', body(3, 2000));
    // the record as it was before: no metrics_latest, no schema_v
    db.db.exec("DROP TABLE metrics_latest; DROP INDEX events_type_person; DELETE FROM meta WHERE k = 'schema_v'");
    store = make();
    expect(store.schemaV()).toBe(SCHEMA_V);
    expect(q<{ date: string; value: number }>("SELECT date, value FROM metrics_latest WHERE metric = 'steps' ORDER BY date")).toEqual([
      { date: '2026-10-31', value: 2002 }, { date: '2026-11-01', value: 2001 }, { date: '2026-11-02', value: 2000 }
    ]);
    now += 60_000;
    expect(a('ingest', body(3, 2000)).metrics).toBe(0); // the same values: nothing appended
    expect(a('ingest', body(3, 3000)).metrics).toBe(3);
  });
});

describe('an ingest’s comparison (O8)', () => {
  it('reads each day’s latest row, never the history: a 32-day body over a month of hourly runs', () => {
    // 2026-11-05 relay review O8: each run reread the 32 days' every row (~24 runs a day × 32 days)
    for (let h = 0; h < 30 * 24; h += 1) {
      now = T0 + h * 3600_000 - 30 * 86_400_000;
      a('ingest', body(32, 5000 + h));
    }
    now = T0;
    const before = db.reads();
    a('ingest', body(32, 99_000));
    // 32 latest rows read (and the few reads of meta, uploads), not the ~32 × 720 rows of history
    expect(db.reads() - before).toBeLessThan(100);
    expect(q<{ n: number }>('SELECT count(*) AS n FROM metrics')[0].n).toBeGreaterThan(20_000); // the history kept
  });
});
