// Apple Health's rows are never pruned or compacted (the user's standing rule): no statement in the relay's code
// deletes, changes or drops the `metrics` table (store.ts METRICS_TOUCH), and the record refuses one at run time
// (keepMetrics).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { keepMetrics, METRICS_TOUCH, StoreCore } from '../src/store.ts';
import { memSql } from './sqlite.ts';

const ts = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? ts(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : []));

describe('metrics are never deleted', () => {
  it('no statement in relay/src or relay/scripts touches the metrics table', () => {
    const hits = [...ts(`${import.meta.dirname}/../src`), ...ts(`${import.meta.dirname}/../scripts`)]
      .flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => [f, i + 1, l] as const))
      .filter(([, , l]) => METRICS_TOUCH.test(l) && !l.includes('METRICS_TOUCH ='))
      .map(([f, n]) => `${f.split('/relay/').pop()}:${n}`);
    expect(hits).toEqual([]);
  });

  it('the pattern catches the forms, never the side tables', () => {
    for (const q of ['DELETE FROM metrics WHERE at < ?', 'delete  from metrics', 'UPDATE metrics SET value = 0', 'UPDATE OR IGNORE metrics SET', 'DROP TABLE IF EXISTS metrics', 'INSERT OR REPLACE INTO metrics (x) VALUES (1)', 'REPLACE INTO "metrics"', 'ALTER TABLE metrics DROP COLUMN v']) expect(METRICS_TOUCH.test(q), q).toBe(true);
    for (const q of ['DELETE FROM metrics_held WHERE 1', 'INSERT OR REPLACE INTO metrics_latest (a) VALUES (1)', 'UPDATE metrics_held SET promoted = 1', 'SELECT * FROM metrics', 'INSERT INTO metrics (a) VALUES (1)']) expect(METRICS_TOUCH.test(q), q).toBe(false);
  });

  it('the record refuses one at run time', () => {
    const db = memSql();
    const core = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A: 'a'.repeat(64), KEY_B: 'b'.repeat(64) }, now: () => Date.parse('2026-11-24T00:00:00Z'), notify: () => {} });
    expect(core.counts()).toMatchObject({ metrics: 0 });
    expect(() => keepMetrics(db.sql).exec('DELETE FROM metrics')).toThrow(/never/);
  });
});
