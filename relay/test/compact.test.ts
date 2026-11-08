// The record's compaction (src/store.ts compact: the phones' rule, contract/compact.ts) and its paged snapshot and dump
// (rowsPage), over a synthetic year of both phones' Shortcut runs and the meal log; the year's numbers printed (docs/backend.md
// "Snapshot size").
import { beforeEach, describe, expect, it } from 'vitest';
import { COMPACT_CONFIRM, COMPACT_MAX, isCompactTick, StoreCore } from '../src/store.ts';
import { compactKeep, weekLockMs } from '../../app/src/lib/contract/compact.ts';
import { SNAPSHOT_PAGE_MAX, type EventRow, type MetricRow } from '../../app/src/lib/contract/api.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const DAY = 86_400_000;

let now: number;
let db: ReturnType<typeof memSql>;
let store: StoreCore;
const make = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
const a = (action: string, extra: object = {}) => call(KEY_A, action, extra);

const jst = (date: string, h: number, m: number) => Date.parse(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+09:00`);
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/**
 * `days` of the record from `first`: both phones' Shortcut runs every waking hour (each changed value of today, and
 * now and then yesterday's late steps), A's weight each morning, and the meal log (3 people × ~10 entries a day, a
 * fifth edited once: the record keeps each entry's latest op) and a tally a person a day. In `at` order, as `load`
 * takes them.
 */
function year(first: string, days: number): { metrics: MetricRow[]; events: EventRow[] } {
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const metrics: MetricRow[] = [], events: EventRow[] = [];
  let ms = 0, n = 0;
  const at = (t: number) => new Date((ms = Math.max(t, ms + 1))).toISOString();
  const last: Record<string, number> = {};
  for (let d = 0; d < days; d++) {
    const date = addDays(first, d);
    const total = { A: 4000 + Math.floor(rand() * 9000), B: 3000 + Math.floor(rand() * 8000) };
    for (let h = 7; h <= 22; h++) {
      for (const p of ['A', 'B'] as const) {
        const t = at(jst(date, h, p === 'A' ? 5 : 35));
        if (h === 7 && last[p] && rand() < 0.7) metrics.push([t, p, addDays(date, -1), 'steps', last[p] + 50 + Math.floor(rand() * 400)]);
        if (h === 7 && p === 'A') metrics.push([t, p, date, 'weight', 70 + Math.round(rand() * 20) / 10]);
        const steps = Math.round((total[p] * (h - 6)) / 16);
        metrics.push([t, p, date, 'steps', steps], [t, p, date, 'move_kcal', Math.round(25 * (h - 6))], [t, p, date, 'stand_min', Math.round(9 * (h - 6))]);
        if (rand() < 0.3) metrics.push([t, p, date, 'exercise_min', 5 * (h - 6)]);
        if (h === 22) last[p] = steps;
      }
      for (const who of ['A', 'B', 'G'] as const) {
        if (h > 18 || rand() < 0.3) continue;
        const t = jst(date, h, 50);
        const op = { id: `f${(++n).toString(36).padStart(6, '0')}`, at: t, d: date, m: h < 10 ? 'b' : h < 14 ? 'l' : 'd', g: 150, f: { id: 'mext:01088', n: 'こめ　［水稲めし］　精白米　うるち米', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1杯' } };
        events.push([at(t), who, `e${n}`, 'food', JSON.stringify(op)]);
        if (rand() < 0.2) events.push([at(t + 60_000), who, `e${n}x`, 'food', JSON.stringify({ ...op, at: t + 60_000, g: 220 })]);
      }
    }
    for (const who of ['A', 'B'] as const) events.push([at(jst(date, 23, 0)), who, `t${d}${who}`, 'tally', JSON.stringify({ date, counts: { 'fish:koi': 1 + d % 5, 'bug:ant': 2 } })]);
  }
  return { metrics, events };
}

const bytes = (x: unknown) => new TextEncoder().encode(JSON.stringify(x)).length;
/** Every page of a snapshot (`page` rows each), as the phone fetches them: the rows together, the pages, rows read. */
function fetchAll(key: string, page: number, since?: string): { metrics: unknown[][]; events: unknown[][]; pages: number; bytes: number; reads: number } {
  const out = { metrics: [] as unknown[][], events: [] as unknown[][], pages: 0, bytes: 0, reads: 0 };
  let after: string | undefined;
  const r0 = db.reads();
  do {
    now += 600; // (the rate limit: 120 a minute)
    const r = call(key, 'snapshot', { page, ...(since ? { since } : {}), ...(after ? { after } : {}) });
    expect(r.ok).toBe(true);
    out.metrics.push(...r.rows.metrics);
    out.events.push(...r.rows.events);
    out.pages++;
    out.bytes += bytes(r);
    after = r.next;
  } while (after);
  out.reads = db.reads() - r0;
  return out;
}

beforeEach(() => {
  now = Date.parse('2026-11-02T03:00:00.000Z');
  db = memSql();
  store = make();
});

describe('the paged snapshot', () => {
  const load = () => {
    const y = year('2026-08-01', 40);
    store.import(y);
    return y;
  };

  it('pages together are the whole snapshot, in order, each at most `page` rows; without `page` it is one reply as before', () => {
    load();
    const whole = a('snapshot');
    expect(whole.next).toBeUndefined();
    for (const page of [97, 500, 5000]) {
      const p = fetchAll(KEY_A, page);
      expect(p.metrics).toEqual(whole.rows.metrics);
      expect(p.events).toEqual(whole.rows.events);
      expect(p.pages).toBe(Math.ceil((whole.rows.metrics.length + whole.rows.events.length) / page) || 1);
    }
  });

  it('a page cut inside one ingest (rows sharing an `at`) and between the tables loses and repeats nothing', () => {
    a('ingest', { dates: 'Oct 1, 2026\nOct 2, 2026\nOct 3, 2026', steps: '1\n2\n3', exercise_minutes: '4\n5\n6' });
    a('event', { id: 'e1', type: 'harvest', data: { week: '2026-10-26' } });
    now += 1;
    a('ingest', { dates: 'Oct 4, 2026', steps: '7' });
    const whole = a('snapshot').rows;
    for (let page = 1; page <= 9; page++) {
      const p = fetchAll(KEY_A, page);
      expect([p.metrics, p.events], String(page)).toEqual([whole.metrics, whole.events]);
    }
  });

  it('a row written between two pages comes in a later page; `since` pages the same way', () => {
    load();
    const first = a('snapshot', { page: 1000 });
    now += 60_000;
    a('event', { id: 'late1', type: 'harvest', data: { week: '2026-10-26' } });
    let after = first.next, got: unknown[][] = [];
    while (after) {
      const r = a('snapshot', { page: 1000, after });
      got = [...got, ...r.rows.events];
      after = r.next;
    }
    expect(got.at(-1)?.[2]).toBe('late1');
    const since = String(first.rows.events.at(-1)?.[0] ?? first.rows.metrics.at(-1)?.[0]);
    const p = fetchAll(KEY_A, 700, since);
    expect([p.metrics, p.events]).toEqual([a('snapshot', { since }).rows.metrics, a('snapshot', { since }).rows.events]);
  });

  it('a bad page size or cursor is bad_request; the guest’s pages leave out its rows as the whole one does', () => {
    load();
    for (const page of [0, -1, 1.5, 10_001, '10']) expect(a('snapshot', { page })).toEqual({ ok: false, error: 'bad_request' });
    for (const after of ['x', '2026-11-02T03:00:00.000Z|m', '2026-11-02T03:00:00.000Z|q|1', 5]) expect(a('snapshot', { page: 10, after })).toEqual({ ok: false, error: 'bad_request' });
    expect(a('snapshot', { after: '2026-11-02T03:00:00.000Z|m|1' })).toEqual({ ok: false, error: 'bad_request' });
    const g = fetchAll(KEY_C, 900);
    const whole = call(KEY_C, 'snapshot').rows;
    expect([g.metrics, g.events]).toEqual([whole.metrics, whole.events]);
    expect(whole.metrics.every((r: unknown[]) => r[3] !== 'weight')).toBe(true);
  });

  it('the paged dump is the dump, the audit on its first page', () => {
    load();
    a('ingest', { dates: 'Oct 1, 2026', steps: '5' });
    const whole = store.dump().rows;
    const rows = { metrics: [] as unknown[][], events: [] as unknown[][], uploads: [] as unknown[][] };
    let after: string | undefined, pages = 0;
    do {
      const r = store.dumpPage({ limit: 1500, ...(after ? { after } : {}) });
      if (!r.ok) throw new Error('refused');
      for (const k of ['metrics', 'events', 'uploads'] as const) rows[k].push(...r.rows[k]);
      after = r.next;
      pages++;
    } while (after);
    expect(rows).toEqual(whole);
    expect(pages).toBeGreaterThan(2);
    expect(store.dumpPage({ limit: 0 })).toEqual({ ok: false, error: 'bad_request' });
    // paged by default (O7): at most SNAPSHOT_PAGE_MAX rows a reply, `all` the whole at once
    const first = store.dumpPage({}) as { rows: { metrics: unknown[]; events: unknown[] }; next?: string };
    expect(first.rows.metrics.length + first.rows.events.length).toBe(Math.min(SNAPSHOT_PAGE_MAX, store.counts().metrics + store.counts().events));
    expect(store.dumpPage({ all: true })).toEqual({ ok: true, ...store.dump() });
    expect(store.dumpPage({ after: 'x', limit: 5 })).toEqual({ ok: false, error: 'bad_request' });
  });
});

describe('the record’s compaction', () => {
  it('by hand only with its confirm: it deletes Health history rows (the user’s rule: keep them all)', () => {
    // 2026-11-05 relay review R4: the admin `compact` deleted metric rows on a bare {op: 'compact'}
    const y = year('2026-08-01', 70);
    store.import(y);
    const before = store.counts();
    for (const o of [{}, { max: 10 }, { confirm: true }, { confirm: 'yes' }]) {
      expect(store.compactOp(o), JSON.stringify(o)).toMatchObject({ ok: false, error: 'bad_request', detail: expect.stringContaining('delete-health-history') });
    }
    expect(store.counts()).toEqual(before);
    expect(store.compactOp({ confirm: COMPACT_CONFIRM, max: 10 }).deleted).toBeGreaterThan(0);
  });

  it('drops exactly what the phones’ rule drops, keeps every event and id, and is a fixed point', () => {
    const y = year('2026-08-01', 70);
    store.import(y);
    const before = store.counts();
    const r = store.compact(Infinity);
    expect(r.more).toBe(false);
    const after = store.counts();
    const keep = compactKeep(y.metrics, now)!;
    expect(a('snapshot').rows.metrics).toEqual(y.metrics.filter((_, i) => keep.has(i)));
    expect(after).toEqual({ ...before, metrics: keep.size });
    expect(r.deleted).toBe(before.metrics - keep.size);
    expect(store.compact(Infinity)).toMatchObject({ deleted: 0, more: false });
  });

  it('stops at `max` a run and goes on from there; new rows of a locked day and a week that locks later are compacted by the next runs', () => {
    store.import(year('2026-08-01', 70));
    const total = store.counts().metrics;
    const r1 = store.compact(500);
    expect(r1.more).toBe(true);
    expect(r1.deleted).toBeGreaterThanOrEqual(500);
    expect(r1.deleted).toBeLessThan(500 + 400);
    let r = r1, deleted = r1.deleted;
    while (r.more) deleted += (r = store.compact(500)).deleted;
    const settled = store.counts().metrics;
    expect(total - settled).toBe(deleted);
    // a Shortcut run brings a locked day's value again (a late recount): the next run keeps its latest only
    a('ingest', { dates: 'Sep 1, 2026', steps: '12345' });
    now += 1000;
    a('ingest', { dates: 'Sep 1, 2026', steps: '12346' });
    expect(store.compact().deleted).toBe(1);
    // the open week's rows wait for its lock (Wednesday 04:00 after the week)
    const open = '2026-11-02';
    for (let i = 0; i < 5; i++) {
      now += 3600_000;
      a('ingest', { dates: 'Nov 2, 2026', steps: String(100 * (i + 1)) });
    }
    expect(store.compact().deleted).toBe(0);
    now = weekLockMs(open) + 60_000;
    expect(store.compact().deleted).toBe(4);
  });

  it('a phone’s latest value and the ingest’s past-zero rule are unchanged by it', () => {
    a('ingest', { dates: 'Sep 1, 2026', steps: '100' });
    now += 1000;
    a('ingest', { dates: 'Sep 1, 2026', steps: '900' });
    store.compact();
    expect(a('snapshot').rows.metrics.map((r: unknown[]) => r[4])).toEqual([900]);
    now += 1000;
    expect(a('ingest', { dates: 'Sep 1, 2026', steps: '0' })).toMatchObject({ ok: true, metrics: 0 });
  });

  it('a year: rows, bytes and rows read of a cold fetch before and after (docs/backend.md "Snapshot size")', () => {
    now = Date.parse('2027-11-03T03:00:00.000Z');
    store.import(year('2026-11-02', 365));
    const before = fetchAll(KEY_A, 4000), whole0 = db.reads();
    const one = a('snapshot');
    const oneReads = db.reads() - whole0, oneBytes = bytes(one);
    let runs = 0, r;
    do {
      r = store.compact();
      runs++;
    } while (r.more);
    const after = fetchAll(KEY_A, 4000), w1 = db.reads();
    const oneAfter = a('snapshot');
    const res = {
      before: { metrics: before.metrics.length, events: before.events.length, bytes: oneBytes, reads: oneReads, pages: before.pages },
      after: { metrics: after.metrics.length, events: after.events.length, bytes: bytes(oneAfter), reads: db.reads() - w1, pages: after.pages },
      runs, max: COMPACT_MAX
    };
    console.log('a synthetic year', JSON.stringify(res));
    expect(res.after.metrics).toBeLessThan(res.before.metrics * 0.2);
    expect(runs).toBeLessThanOrEqual(Math.ceil((res.before.metrics - res.after.metrics) / COMPACT_MAX) + 1);
    // (a year's rows through SQLite: ~2 s here, over 5 s on a CI runner)
  }, 30_000);

  it('runs on the cron’s 04:15 Tokyo tick only', () => {
    expect(isCompactTick(Date.parse('2026-11-04T19:15:00.000Z'))).toBe(true);
    expect(isCompactTick(Date.parse('2026-11-04T19:30:00.000Z'))).toBe(false);
    expect(isCompactTick(Date.parse('2026-11-04T04:15:00.000Z'))).toBe(false);
  });
});

describe('the user’s hold on compaction (2026-11-05: keep every Health row)', () => {
  it('nothing turns the cron’s compaction on: no COMPACT_CRON in wrangler.toml, production’s or the test env’s, nor in a deploy', async () => {
    // health A9 (2026-11-08): the code stays, gated; only the user lifts the hold (docs/ops/runbook.md §13)
    const { readFileSync, readdirSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = join(import.meta.dirname, '..', '..');
    const set = /^\s*COMPACT_CRON\s*=/m;
    expect(readFileSync(join(root, 'relay', 'wrangler.toml'), 'utf8')).not.toMatch(set);
    const pkg = readFileSync(join(root, 'relay', 'package.json'), 'utf8');
    expect(pkg).not.toMatch(/COMPACT_CRON/);
    const flows = join(root, '.github', 'workflows');
    let names: string[] = [];
    try { names = readdirSync(flows); } catch { /* the relay's CI checks out relay/ and app/src only */ }
    for (const f of names) expect(readFileSync(join(flows, f), 'utf8'), f).not.toMatch(/COMPACT_CRON/);
  });
});
