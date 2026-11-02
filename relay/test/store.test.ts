// The record (src/store.ts) on node:sqlite: auth, ingest's latest-wins, events and their slots, `since` deltas, the
// import of rows that already have their `at`, and the notices after writes.
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LATE_MARGIN_MS, RATE_PER_MINUTE, STORE_BUILD, StoreCore } from '../src/store.ts';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const T0 = Date.parse('2026-11-02T03:00:00.000Z'); // 12:00 Tokyo

let now: number;
let notices: Notice[];
let db: ReturnType<typeof memSql>;
let store: StoreCore;
const make = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => now, notify: (n) => notices.push(n) });

beforeEach(() => {
  now = T0;
  notices = [];
  db = memSql();
  store = make();
});

const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
const a = (action: string, extra: object = {}) => call(KEY_A, action, extra);
const b = (action: string, extra: object = {}) => call(KEY_B, action, extra);
const tick = (ms = 1000) => (now += ms);
const events = () => (a('snapshot').rows.events as unknown[][]).map((r) => [r[1], r[2], r[3], JSON.parse(String(r[4]))]);

describe('auth and limits', () => {
  it('keyless health answers the build; a wrong, short or missing key is unauthorized', () => {
    expect(store.handle({ action: 'health' }, 0)).toEqual({ ok: true, build: STORE_BUILD });
    for (const key of [undefined, '', 42, 'c'.repeat(64), KEY_A.slice(0, 31), `${KEY_A}x`]) {
      expect(store.handle({ key, action: 'whoami' }, 0), String(key)).toEqual({ ok: false, error: 'unauthorized' });
    }
    expect(a('whoami')).toEqual({ ok: true, me: 'A', build: STORE_BUILD });
    expect(b('whoami')).toEqual({ ok: true, me: 'B', build: STORE_BUILD });
    expect(a('drop')).toEqual({ ok: false, error: 'bad_request' });
    expect(store.handle(null, 0)).toEqual({ ok: false, error: 'bad_request' });
  });

  it(`${RATE_PER_MINUTE} requests per key per minute`, () => {
    for (let i = 0; i < RATE_PER_MINUTE; i++) a('whoami');
    expect(a('whoami')).toEqual({ ok: false, error: 'busy' });
    expect(b('whoami').ok).toBe(true);
    tick(60_000);
    expect(a('whoami').ok).toBe(true);
  });
});

describe('ingest', () => {
  const body = { dates: 'Sep 28, 2026 at 7:11 AM\nSep 29, 2026 at 7:55 AM', steps: '855\n9106', exercise_minutes: '0\n23', calories: '0\n248.2' };

  it('appends each value that differs from its day’s latest row, never the same one twice, and audits each run', () => {
    expect(a('ingest', body)).toEqual({ ok: true, metrics: 6 });
    tick();
    expect(a('ingest', body)).toEqual({ ok: true, metrics: 0 });
    tick();
    expect(a('ingest', { ...body, steps: '855\n9000' })).toEqual({ ok: true, metrics: 1 }); // lower: a re-sync corrects it
    tick();
    expect(b('ingest', body)).toEqual({ ok: true, metrics: 6 }); // the other person's own rows
    const m = a('snapshot').rows.metrics as unknown[][];
    expect(m.filter((r) => r[1] === 'A' && r[3] === 'steps').map((r) => [r[2], r[4]])).toEqual([['2026-09-28', 855], ['2026-09-29', 9106], ['2026-09-29', 9000]]);
    expect(m[0]).toEqual(['2026-11-02T03:00:00.000Z', 'A', '2026-09-28', 'steps', 855]);
    const up = a('uploads').rows;
    expect(up).toHaveLength(3);
    expect(up[0]).toMatchObject({ at: '2026-11-02T03:00:02.000Z', status: 'ok', bytes: 100 });
    expect(up[0].notes).toMatch(/^ \| action:text\[1\] "ingest"; dates:text\[2\]/);
    expect(up[0].notes).not.toContain(KEY_A);
  });

  it('a body without any field is bad_request, audited as an error; skipped lines and warnings are reported', () => {
    expect(a('ingest', { nothing: 'here' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(a('uploads').rows[0]).toMatchObject({ status: 'error' });
    expect(a('ingest', { dates: 'Oct 1, 2026\nOct 2, 2026', steps: '100\nlots', exercise_minutes: '1' })).toMatchObject({ ok: true, metrics: 1, skipped: 1, warnings: [expect.any(String)] });
    expect(a('uploads').rows[0]).toMatchObject({ status: 'partial' });
  });

  it('tells the room after rows were added, never for a run that changed nothing', () => {
    a('ingest', body);
    expect(notices).toEqual([{ what: 'ingest', who: 'A', at: '2026-11-02T03:00:00.000Z', rev: 'e1' }]);
    a('ingest', body);
    expect(notices).toHaveLength(1);
  });
});

describe('events', () => {
  const ev = (id: string, type: string, data: object) => ({ id, type, data });

  it('an id is accepted once: a retry is a duplicate, also of an event a later one replaced', () => {
    expect(a('event', ev('p1', 'pref', { key: 'moveGoal', value: 500 }))).toEqual({ ok: true });
    expect(a('event', ev('p1', 'pref', { key: 'moveGoal', value: 600 }))).toEqual({ ok: true, duplicate: true });
    a('event', ev('t1', 'tally', { date: '2026-11-02', counts: { 'fish:dab': 1 } }));
    tick();
    a('event', ev('t2', 'tally', { date: '2026-11-02', counts: { 'fish:dab': 2 } }));
    expect(a('event', ev('t1', 'tally', { date: '2026-11-02', counts: { 'fish:dab': 1 } }))).toEqual({ ok: true, duplicate: true });
    expect(events().map((r) => r[1])).toEqual(['p1', 't2']);
  });

  it('checks shapes as the sheet did; a highfive is acknowledged and kept nowhere', () => {
    expect(a('event', ev('h1', 'highfive', {}))).toEqual({ ok: true });
    expect(a('event', ev('x1', 'nope', {}))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('x2', 'spend', { spendId: 's', item: 'snack', bells: 1 }))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('x3', 'find', { kind: 'shell', id: 'cowrie', person: 'B' }))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', { id: 'x4', type: 'pref', data: { value: 'x'.repeat(30_000), key: 'villagerName' } })).toEqual({ ok: false, error: 'too_large' });
    expect(a('event', ev('x5', 'tally', { date: '2026-11-04', counts: { 'bug:moth': 1 } }))).toEqual({ ok: false, error: 'bad_request' }); // after tomorrow
    expect(events()).toEqual([]);
    expect(notices).toEqual([]);
  });

  it('spend_void must name a buy; a second void is a duplicate', () => {
    expect(a('event', ev('v0', 'spend_void', { spendId: 'sp1' }))).toEqual({ ok: false, error: 'bad_request', detail: 'no such spend' });
    expect(a('event', ev('s1', 'spend', { spendId: 'sp1', item: 'dinner', bells: 15 }))).toEqual({ ok: true });
    expect(a('event', ev('p1', 'pref', { key: 'villagerName', value: 'sp2' }))).toEqual({ ok: true });
    expect(a('event', ev('v1', 'spend_void', { spendId: 'sp2' }))).toMatchObject({ ok: false, detail: 'no such spend' });
    expect(b('event', ev('v2', 'spend_void', { spendId: 'sp1' }))).toEqual({ ok: true });
    expect(a('event', ev('v3', 'spend_void', { spendId: 'sp1' }))).toEqual({ ok: true, duplicate: true });
    expect(events().map((r) => r[1])).toEqual(['s1', 'p1', 'v2']);
  });

  it('a tally and an island day are one row per person and day', () => {
    const day = (id: string, date: string) => ev(id, 'island', { date, taken: [id], puts: [], shakes: [], watered: [], wishes: {} });
    a('event', ev('a1', 'tally', { date: '2026-11-01', counts: { 'fish:dab': 1 } }));
    a('event', ev('a2', 'tally', { date: '2026-11-02', counts: { 'fish:dab': 1 } }));
    b('event', ev('b1', 'tally', { date: '2026-11-02', counts: { 'bug:moth': 3 } }));
    a('event', day('i1', '2026-11-02'));
    a('event', ev('a3', 'tally', { date: '2026-11-02', counts: { 'fish:dab': 4 } }));
    a('event', day('i2', '2026-11-02'));
    b('event', day('i3', '2026-11-02'));
    expect(events().map((r) => [r[0], r[1]])).toEqual([['A', 'a1'], ['B', 'b1'], ['A', 'a3'], ['A', 'i2'], ['B', 'i3']]);
  });

  it('a cosmetic pref keeps its latest per person; a goal its last per person and Tokyo day; one the model ignores replaces nothing', () => {
    a('event', ev('n1', 'pref', { key: 'villagerName', value: 'ウェイ' }));
    a('event', ev('n2', 'pref', { key: 'villagerName', value: '   ' })); // ignored by the model: kept, replaces nothing
    a('event', ev('n3', 'pref', { key: 'villagerName', value: 'うぇい' }));
    b('event', ev('n4', 'pref', { key: 'villagerName', value: 'うめ' }));
    a('event', ev('w1', 'pref', { key: 'goalWeight', value: 60, person: 'B' }));
    b('event', ev('w2', 'pref', { key: 'goalWeight', value: null }));
    a('event', ev('g1', 'pref', { key: 'moveGoal', value: 400 }));
    a('event', ev('g2', 'pref', { key: 'moveGoal', value: 450 }));
    b('event', ev('g3', 'pref', { key: 'moveGoal', value: 500, person: 'A' })); // the same goal, set by the partner
    now = Date.parse('2026-11-02T15:00:00.000Z'); // 00:00 Tokyo, the next day
    a('event', ev('g4', 'pref', { key: 'moveGoal', value: 550 }));
    a('event', ev('k1', 'pref', { key: 'stepsGoal', value: 9000 }));
    expect(events().map((r) => r[1])).toEqual(['n2', 'n3', 'n4', 'w2', 'g3', 'g4', 'k1']);
  });

  it('decor keeps each item’s latest op: a beaten op is a duplicate, a removal final, a new item past the cap refused', () => {
    const P = T0 - 60_000;
    const set = (id: string, at: number, x = 10) => ev(`e-${id}-${at}`, 'decor', { id, at, item: 'birdbath', x, z: 10, f: 0, p: P });
    expect(a('event', set('d000001', P + 1))).toEqual({ ok: true });
    expect(b('event', set('d000001', P + 5, 20))).toEqual({ ok: true });
    expect(a('event', set('d000001', P + 3, 30))).toEqual({ ok: true, duplicate: true }); // older than the one kept
    expect(a('event', ev('rm1', 'decor', { id: 'd000001', at: P + 6, rm: true }))).toEqual({ ok: true });
    expect(a('event', set('d000001', P + 9))).toEqual({ ok: true, duplicate: true });
    for (let i = 2; i <= 30; i++) expect(a('event', set(`d${String(i).padStart(6, '0')}`, P + i)).ok).toBe(true);
    expect(a('event', set('d000031', P + 40))).toEqual({ ok: true }); // the removed one doesn't count
    expect(a('event', set('d000032', P + 41))).toEqual({ ok: false, error: 'bad_request', detail: 'decor full' });
    const decor = events().filter((r) => r[2] === 'decor');
    expect(decor).toHaveLength(31);
    expect(decor[0][3]).toEqual({ id: 'd000001', at: P + 6, rm: true });
  });

  it('tells the room after an event was kept, never for a duplicate or a refusal', () => {
    a('event', ev('p1', 'pref', { key: 'locale', value: 'en' }));
    a('event', ev('p1', 'pref', { key: 'locale', value: 'en' }));
    a('event', ev('p2', 'pref', { key: 'nope', value: 1 }));
    expect(notices).toEqual([{ what: 'event', who: 'A', at: '2026-11-02T03:00:00.000Z', rev: 'e1' }]);
  });
});

describe('events (a batch)', () => {
  it('keeps them in order, each as `event` would, with each stored row’s `at`; one notice for the lot', () => {
    a('event', { id: 's1', type: 'spend', data: { spendId: 'sp1', item: 'snack', bells: 8 } });
    notices = [];
    tick();
    const r = a('events', { events: [
      { id: 'v1', type: 'spend_void', data: { spendId: 'sp1' } },
      { id: 's1', type: 'spend', data: { spendId: 'sp1', item: 'snack', bells: 8 } },
      { id: 'x1', type: 'spend', data: { spendId: 'sp2', item: 'snack', bells: 1 } },
      { id: 'h1', type: 'highfive', data: {} },
      { id: 'v2', type: 'spend_void', data: { spendId: 'sp1' } },
      'garbage',
      { id: 'p1', type: 'pref', data: { key: 'locale', value: 'en' } }
    ] });
    expect(r).toEqual({ ok: true, results: [
      { id: 'v1', ok: true, at: '2026-11-02T03:00:01.000Z' },
      { id: 's1', ok: true, duplicate: true },
      { id: 'x1', ok: false, error: 'bad_request' },
      { id: 'h1', ok: true },
      { id: 'v2', ok: true, duplicate: true },
      { id: null, ok: false, error: 'bad_request' },
      { id: 'p1', ok: true, at: '2026-11-02T03:00:01.001Z' }
    ] });
    expect(notices).toEqual([{ what: 'event', who: 'A', at: '2026-11-02T03:00:01.001Z', rev: 'e1' }]);
    expect(events().map((e) => e[1])).toEqual(['s1', 'v1', 'p1']);
  });

  it('an empty, oversized or missing list is bad_request', () => {
    for (const events of [undefined, [], 'x', Array.from({ length: 51 }, (_, i) => ({ id: `p${i}`, type: 'pref', data: { key: 'locale', value: 'en' } }))]) {
      expect(a('events', { events })).toEqual({ ok: false, error: 'bad_request' });
    }
  });
});

describe('snapshot', () => {
  it('the export: every row, signed for Apps Script, ASCII; again only after a change, or forced', async () => {
    expect(await store.exportBody(false)).toBeNull();
    a('event', { id: 'n1', type: 'pref', data: { key: 'villagerName', value: 'うめ' } });
    const x = (await store.exportBody(false))!;
    const body = JSON.parse(x.body);
    expect(body).toMatchObject({ action: 'export', t: String(now) });
    expect(/^[\x20-\x7e]*$/.test(body.data)).toBe(true);
    const secret = createHmac('sha256', `${KEY_A}:${KEY_B}`).update('island-relay-notify/1').digest('hex');
    expect(body.sig).toBe(createHmac('sha256', secret).update(`${body.t}.${body.data}`).digest('hex'));
    const data = JSON.parse(body.data);
    expect(data).toMatchObject({ rev: 'e1', upto: '2026-11-02T03:00:00.000Z', rows: { metrics: [], uploads: [] } });
    expect(JSON.parse(data.rows.events[0][4]).value).toBe('うめ');
    store.exported(x.upto);
    expect(await store.exportBody(false)).toBeNull();
    expect(await store.exportBody(true)).not.toBeNull();
  });

  it('every row of both people, then only the rows after `since`; `at` strictly increases', () => {
    a('ingest', { dates: 'Oct 1, 2026', steps: '5000' });
    a('event', { id: 'e1', type: 'harvest', data: { week: '2026-10-26' } });
    b('event', { id: 'e2', type: 'harvest', data: { week: '2026-10-26' } });
    const full = b('snapshot');
    expect(full).toMatchObject({ ok: true, me: 'B', now: '2026-11-02T03:00:00.000Z', rev: 'e1' });
    expect(full.rows.metrics).toEqual([['2026-11-02T03:00:00.000Z', 'A', '2026-10-01', 'steps', 5000]]);
    expect(full.rows.events.map((r: unknown[]) => r[0])).toEqual(['2026-11-02T03:00:00.001Z', '2026-11-02T03:00:00.002Z']);
    expect(a('snapshot', { since: '2026-11-02T03:00:00.001Z' }).rows).toEqual({ metrics: [], events: [full.rows.events[1]] });
    expect(a('snapshot', { since: '2026-11-02T03:00:00.002Z' }).rows).toEqual({ metrics: [], events: [] });
    expect(a('snapshot', { since: 'yesterday' })).toEqual({ ok: false, error: 'bad_request' });
    expect(a('snapshot', { since: 5 })).toEqual({ ok: false, error: 'bad_request' });
  });

  it('a poll with nothing new reads no rows', () => {
    a('ingest', { dates: 'Oct 1, 2026', steps: '5000' });
    const r0 = db.reads();
    expect(a('snapshot', { since: '2026-11-02T03:00:00.000Z' }).rows).toEqual({ metrics: [], events: [] });
    expect(db.reads() - r0).toBe(1); // the revision
  });
});

describe('import (rows that already have their `at`)', () => {
  const rows = {
    metrics: [
      ['2026-11-01T01:00:00.000Z', 'A', '2026-11-01', 'steps', 4000],
      ['2026-11-01T02:00:00.000Z', 'A', '2026-11-01', 'steps', 6000],
      ['2026-11-01T02:00:00.000Z', 'B', '2026-11-01', 'weight', 52.3]
    ],
    events: [
      ['2026-11-01T01:30:00.000Z', 'A', 'h1', 'highfive', '{}'],
      ['2026-11-01T01:31:00.000Z', 'A', 'n1', 'pref', '{"key":"villager","value":"ankha"}'],
      ['2026-11-01T01:32:00.000Z', 'A', 'n2', 'pref', '{"key":"villager","value":"bob"}'],
      ['2026-11-01T01:33:00.000Z', 'B', 'f1', 'find', '{"kind":"fish","id":"dab"}'],
      ['2026-11-01T01:34:00.000Z', 'B', 'f2', 'find', '{"kind":"fish","id":"dab"}'],
      ['2026-11-01T01:35:00.000Z', 'C', 'x1', 'find', '{"kind":"fish","id":"dab"}']
    ],
    uploads: [['2026-11-01T02:00:00.000Z', 'A', 'ok', 2264, ' | dates:text[32]']]
  };

  it('keeps their `at`, drops high-fives and superseded cosmetic prefs, and is idempotent', () => {
    expect(store.import(rows)).toEqual({ metrics: 3, events: 4, uploads: 1, skipped: 2 }); // n1, then n2 in its slot
    expect(store.import(rows)).toEqual({ metrics: 0, events: 0, uploads: 1, skipped: 2 });
    const snap = a('snapshot');
    expect(snap.rows.metrics).toEqual(rows.metrics);
    expect(snap.rows.events.map((r: unknown[]) => r[2])).toEqual(['n2', 'f1', 'f2']);
    expect(snap.rows.events[0]).toEqual(rows.events[2]);
    expect(store.counts()).toEqual({ metrics: 3, events: 3, ids: 4, uploads: 1 });
    // the clock continues after the newest imported `at`
    now = Date.parse('2026-11-01T00:00:00.000Z');
    a('event', { id: 'e1', type: 'harvest', data: { week: '2026-10-26' } });
    expect(a('snapshot', { since: '2026-11-01T02:00:00.000Z' }).rows.events[0][0]).toBe('2026-11-01T02:00:00.001Z');
  });

  it('a slot keeps its latest by `at`, whatever order the copies arrive in', () => {
    store.import({ events: [['2026-11-01T01:32:00.000Z', 'A', 'n2', 'pref', '{"key":"villager","value":"bob"}']] });
    store.import({ events: [['2026-11-01T01:31:00.000Z', 'A', 'n1', 'pref', '{"key":"villager","value":"ankha"}']] });
    expect(events().map((r) => r[1])).toEqual(['n2']);
  });

  it('a row that arrives out of order reaches a phone that polled past it', () => {
    now = Date.parse('2026-11-01T03:00:00.000Z');
    store.import({ events: [['2026-11-01T02:00:00.000Z', 'B', 'f2', 'find', '{"kind":"fish","id":"dab"}']] });
    const since = '2026-11-01T02:00:00.000Z'; // the phone has f2
    expect(a('snapshot', { since }).rows.events).toEqual([]);
    now += 2000;
    store.import({ events: [['2026-11-01T01:59:59.000Z', 'A', 'f1', 'find', '{"kind":"bug","id":"moth"}']] }); // its copy came second
    expect(a('snapshot', { since }).rows.events.map((r: unknown[]) => r[2])).toEqual(['f1']);
    expect(a('snapshot', { since: new Date(now + LATE_MARGIN_MS + 1).toISOString() }).rows.events).toEqual([]);
  });

  it('survives a restart: the clock and the revision are in the record', () => {
    store.import(rows);
    store.bumpRev();
    store = make();
    expect(a('snapshot').rev).toBe('e2');
    now = 0;
    a('event', { id: 'e1', type: 'harvest', data: { week: '2026-10-26' } });
    expect(a('snapshot').rows.events.at(-1)[0]).toBe('2026-11-01T02:00:00.001Z');
  });
});
