// The record (src/store.ts) on node:sqlite: auth, ingest's latest-wins, events and their slots, `since` deltas, the
// import of rows that already have their `at`, and the notices after writes.
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LATE_MARGIN_MS, PAGES_PER_MINUTE, RATE_PER_MINUTE, STORE_BUILD, StoreCore } from '../src/store.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
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

  it('a snapshot’s later pages have their own budget: a cold fetch of a big record never spends the writes’', () => {
    // 2026-11-05 relay review O9: each page counted against the 120 a minute
    for (let i = 0; i < 300; i++) expect(a('snapshot', { page: 10, after: '2026-11-02T03:00:00.000Z|e|1' }).ok).toBe(true);
    expect(a('whoami').ok).toBe(true);
    for (let i = 0; i < RATE_PER_MINUTE - 1; i++) a('whoami');
    expect(a('whoami')).toEqual({ ok: false, error: 'busy' });
    expect(a('snapshot', { page: 10, after: '2026-11-02T03:00:00.000Z|e|1' }).ok).toBe(true); // the pages' own still
    expect(a('snapshot', { page: 10 })).toEqual({ ok: false, error: 'busy' }); // a first page is a request like any
    for (let i = 301; i < PAGES_PER_MINUTE; i++) a('snapshot', { page: 10, after: '2026-11-02T03:00:00.000Z|e|1' });
    expect(a('snapshot', { page: 10, after: '2026-11-02T03:00:00.000Z|e|1' })).toEqual({ ok: false, error: 'busy' });
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

  it('a date repeated in the lists (a time-zone change) keeps one value a day and metric, never losing the run', () => {
    // health A2 (sync #2): a repeat broke UNIQUE(person, date, metric, at): unavailable, nothing kept, no audit row
    const r = a('ingest', { dates: 'Nov 1, 2026 at 11:00 PM\nNov 1, 2026 at 1:00 AM\nOct 31, 2026 at 9:00 AM', calories: '300\n420\n250', weight: '68.4\n68.1\n0', steps: '9000\n8000\n7000' });
    expect(r).toMatchObject({ ok: true, metrics: 5, warnings: [expect.stringMatching(/^dates: 1 repeat a date/)] });
    const m = (a('snapshot').rows.metrics as unknown[][]).map((x) => [x[2], x[3], x[4]]);
    expect(m).toEqual(expect.arrayContaining([['2026-11-01', 'move_kcal', 420], ['2026-11-01', 'weight', 68.1], ['2026-11-01', 'steps', 9000], ['2026-10-31', 'move_kcal', 250], ['2026-10-31', 'steps', 7000]]));
    expect(m).toHaveLength(5);
    expect(a('uploads').rows[0]).toMatchObject({ status: 'ok', notes: expect.stringMatching(/^dates: 1 repeat/) });
  });

  it('a run whose write fails leaves an error audit row (written after the rollback)', () => {
    (store as unknown as { addMetric: () => void }).addMetric = () => { throw new Error('boom'); };
    expect(a('ingest', body)).toEqual({ ok: false, error: 'unavailable' });
    expect(a('uploads').rows).toEqual([expect.objectContaining({ status: 'error', notes: expect.stringMatching(/^not saved: Error \|/) })]);
    expect(a('snapshot').rows.metrics).toEqual([]);
  });

  it('tells the room whether the guest may hear of it: an ingest that brought activity rows, never one of からだ rows alone', () => {
    const told: [Notice, boolean | undefined][] = [];
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => now, notify: (n, g) => void told.push([n, g]) });
    a('ingest', { dates: 'Sep 29, 2026 at 7:55 AM', weight: '68.4' });
    tick();
    a('ingest', { dates: 'Sep 29, 2026 at 7:55 AM', weight: '68.4', steps: '9106' });
    expect(told.map(([n, g]) => [n.what, g])).toEqual([['ingest', false], ['ingest', true]]);
  });

  it('tells the room after rows were added, never for a run that changed nothing', () => {
    a('ingest', body);
    expect(notices).toEqual([{ what: 'ingest', who: 'A', at: '2026-11-02T03:00:00.000Z', rev: 'e1' }]);
    a('ingest', body);
    expect(notices).toHaveLength(1);
  });
});

describe('a restore under way', () => {
  it('answers every request unavailable (the phones retry), acknowledging nothing the bookmark would drop', () => {
    // 2026-11-05 relay review O4: writes in the ~200 ms between the bookmark and the restart were acked, then lost
    store.freeze();
    expect(a('event', { id: 'r1', type: 'pref', data: { key: 'locale', value: 'en' } })).toEqual({ ok: false, error: 'unavailable', detail: 'restoring' });
    expect(a('ingest', { dates: 'Sep 29, 2026', steps: '9106' })).toMatchObject({ ok: false, error: 'unavailable' });
    expect(a('snapshot')).toMatchObject({ ok: false, error: 'unavailable' });
    expect(store.counts()).toMatchObject({ metrics: 0, events: 0, uploads: 0 });
    store.thaw(); // (the bookmark refused: on as before)
    expect(a('event', { id: 'r1', type: 'pref', data: { key: 'locale', value: 'en' } })).toMatchObject({ ok: true });
  });
});

describe('a new epoch', () => {
  it('tells the phones: a `changed` with the new rev (each refetches everything)', () => {
    // 2026-11-05 review: `rev` (and a restore's) told nobody: a phone open on the island kept its cache till its next poll
    a('event', { id: 'p1', type: 'pref', data: { key: 'locale', value: 'en' } });
    notices = [];
    expect(store.bumpRev()).toBe('e2');
    expect(notices).toEqual([{ what: 'ingest', who: 'A', at: '2026-11-02T03:00:00.000Z', rev: 'e2' }]);
    // an empty record: the time now
    db = memSql();
    store = make();
    notices = [];
    store.bumpRev();
    expect(notices).toEqual([{ what: 'ingest', who: 'A', at: new Date(now).toISOString(), rev: 'e2' }]);
  });
});

describe('ingest: a past day never drops to 0', () => {
  it('a 0 for a past Tokyo day whose latest is above 0 is ignored; today, a first 0 and a lower value are kept', () => {
    // 2026-11-05 review: one bad Shortcut run (Health locked: Fill Missing's 0 for every day) rewrote the history
    const steps = (rows: [string, string][]) => ({ dates: rows.map((r) => r[0]).join('\n'), steps: rows.map((r) => r[1]).join('\n') });
    expect(a('ingest', steps([['Oct 30, 2026', '8000'], ['Oct 31, 2026', '0'], ['Nov 2, 2026', '500']]))).toEqual({ ok: true, metrics: 3 });
    tick();
    expect(a('ingest', steps([['Oct 30, 2026', '0'], ['Oct 31, 2026', '0'], ['Nov 2, 2026', '0']]))).toEqual({ ok: true, metrics: 1 });
    tick();
    expect(a('ingest', steps([['Oct 30, 2026', '7900'], ['Nov 1, 2026', '0']]))).toEqual({ ok: true, metrics: 2 });
    const latest = new Map<string, number>();
    for (const r of a('snapshot').rows.metrics as [string, string, string, string, number][]) latest.set(r[2], r[4]);
    expect(Object.fromEntries(latest)).toEqual({ '2026-10-30': 7900, '2026-10-31': 0, '2026-11-01': 0, '2026-11-02': 0 });
    expect(a('uploads').rows[1].notes).toMatch(/^1 past zeros held \|/);
  });

  it('a past day’s 0 is never thrown away: held apart (never served), listed and promoted by the admin', () => {
    // 2026-11-05 relay review R3 (the user's rule: keep all Health data): a legitimate correction to 0 was discarded
    const steps = (rows: [string, string][]) => ({ dates: rows.map((r) => r[0]).join('\n'), steps: rows.map((r) => r[1]).join('\n') });
    a('ingest', steps([['Oct 30, 2026', '8000']]));
    tick();
    expect(a('ingest', steps([['Oct 30, 2026', '0']]))).toEqual({ ok: true, metrics: 0 });
    tick();
    a('ingest', steps([['Oct 30, 2026', '0']])); // again: the same held row, seen twice
    expect(a('snapshot').rows.metrics.map((r: unknown[]) => r[4])).toEqual([8000]);
    const held = store.heldRows();
    expect(held).toEqual([{ person: 'A', date: '2026-10-30', metric: 'steps', value: 0, at: '2026-11-02T03:00:01.000Z', last: '2026-11-02T03:00:02.000Z', n: 2, promoted: null }]);
    // promoted: a row of the day like any (the latest now), the held row kept with its mark
    tick();
    expect(store.promoteHeld({ person: 'A', date: '2026-10-30', metric: 'steps' })).toMatchObject({ ok: true, at: '2026-11-02T03:00:03.000Z' });
    expect(a('snapshot').rows.metrics.map((r: unknown[]) => r[4])).toEqual([8000, 0]);
    expect(store.heldRows()[0].promoted).toBe('2026-11-02T03:00:03.000Z');
    expect(store.promoteHeld({ person: 'A', date: '2026-10-31', metric: 'steps' })).toEqual({ ok: false, error: 'bad_request', detail: 'nothing held' });
    // the dump carries them (a load of it is the record), and a load takes them back
    const dump = store.dump();
    expect(dump.rows.held).toEqual([['2026-11-02T03:00:01.000Z', 'A', '2026-10-30', 'steps', 0, '2026-11-02T03:00:02.000Z', 2, '2026-11-02T03:00:03.000Z']]);
    db = memSql();
    store = make();
    store.load({ rows: dump.rows });
    expect(store.heldRows()).toEqual(held.map((h) => ({ ...h, promoted: '2026-11-02T03:00:03.000Z' })));
  });
});

describe('the ingest audit', () => {
  it('keeps 60 days: an ingest lets older audit rows go', () => {
    // 2026-11-05 review: the `uploads` table was never pruned (~50 rows a day, each up to ~2.3 KB)
    const body = { dates: 'Oct 1, 2026', steps: '4000' };
    a('ingest', body);
    tick(30 * 86_400_000);
    b('ingest', body);
    expect(store.counts().uploads).toBe(2);
    tick(30 * 86_400_000 + 1000);
    a('ingest', { ...body, steps: '4100' });
    expect(store.counts().uploads).toBe(2); // the first one, 60 days and a second old, went
    expect(a('uploads').rows).toHaveLength(1);
    expect(b('uploads').rows).toHaveLength(1);
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

  it('checks shapes as the sheet did; a highfive (the room’s only, since 2026-11-02) is no event', () => {
    expect(a('event', ev('h1', 'highfive', {}))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('x1', 'nope', {}))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('x2', 'spend', { spendId: 's', item: 'snack', bells: 1 }))).toEqual({ ok: false, error: 'bad_request' });
    // the old prices (おやつ 8, 外食 15: a phone still on the old app) are refused
    expect(a('event', ev('x2o', 'spend', { spendId: 's', item: 'snack', bells: 8 }))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('x2p', 'spend', { spendId: 's', item: 'dinner', bells: 15 }))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('x3', 'find', { kind: 'shell', id: 'cowrie', person: 'B' }))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', { id: 'x4', type: 'pref', data: { value: 'x'.repeat(30_000), key: 'villagerName' } })).toEqual({ ok: false, error: 'too_large' });
    expect(a('event', ev('x5', 'tally', { date: '2026-11-04', counts: { 'bug:moth': 1 } }))).toEqual({ ok: false, error: 'bad_request' }); // after tomorrow
    expect(events()).toEqual([]);
    expect(notices).toEqual([]);
  });

  it('spend_void must name a buy; a second void is a duplicate', () => {
    expect(a('event', ev('v0', 'spend_void', { spendId: 'sp1' }))).toEqual({ ok: false, error: 'bad_request', detail: 'no such spend' });
    expect(a('event', ev('s1', 'spend', { spendId: 'sp1', item: 'dinner', bells: 70 }))).toEqual({ ok: true });
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

  it('an island day replacing one merges only what grows: wishes, watering, the spot; the claims are the new row’s (health A8)', () => {
    const row = (id: string, o: object) => ev(id, 'island', { date: '2026-11-02', taken: [], puts: [], shakes: [], watered: [], wishes: {}, ...o });
    a('event', row('i1', { taken: ['catch:a', 'catch:b'], watered: ['fl:1:2'], wishes: { '2026-11-03': 3 }, at: [10, 20] }));
    a('event', row('i2', { taken: ['catch:a'], watered: ['fl:3:4'], wishes: { '2026-11-03': 1 } })); // a stale send
    const kept = events().filter((r) => r[1] === 'i2').map((r) => r[3])[0];
    expect(kept).toEqual({ date: '2026-11-02', taken: ['catch:a'], puts: [], shakes: [], watered: ['fl:1:2', 'fl:3:4'], wishes: { '2026-11-03': 3 }, at: [10, 20] });
    expect(events().filter((r) => r[2] === 'island')).toHaveLength(1);
  });

  it('a cosmetic pref keeps its latest per person; a goal its last per person and Tokyo day; one the model ignores replaces nothing', () => {
    a('event', ev('n1', 'pref', { key: 'villagerName', value: 'ウェイ' }));
    a('event', ev('n2', 'pref', { key: 'villagerName', value: '   ' })); // ignored by the model: kept, replaces nothing
    a('event', ev('n3', 'pref', { key: 'villagerName', value: 'うぇい' }));
    b('event', ev('n4', 'pref', { key: 'villagerName', value: 'うめ' }));
    a('event', ev('w1', 'pref', { key: 'goalWeight', value: 60, person: 'B' }));
    b('event', ev('w2', 'pref', { key: 'goalWeight', value: null }));
    a('event', ev('f1', 'pref', { key: 'goalBodyFat', value: 20, person: 'B' }));
    b('event', ev('f2', 'pref', { key: 'goalBodyFat', value: 21.5 })); // B's own: replaces f1, latest only like the weight goal
    a('event', ev('f3', 'pref', { key: 'goalBodyFat', value: 25 }));
    a('event', ev('f4', 'pref', { key: 'goalBodyFat', value: 61 })); // past 60 %: ignored by the model, replaces nothing
    a('event', ev('i1', 'pref', { key: 'goalBmi', value: 22 }));
    b('event', ev('i2', 'pref', { key: 'goalBmi', value: 23.5, person: 'A' })); // replaces i1
    a('event', ev('l1', 'pref', { key: 'goalLean', value: 9 })); // under 10 kg: replaces nothing
    a('event', ev('e1', 'pref', { key: 'exerciseGoal', value: 30 }));
    a('event', ev('e2', 'pref', { key: 'exerciseGoal', value: 40 })); // the same day: replaces e1
    a('event', ev('s1', 'pref', { key: 'standGoal', value: 125 })); // off its grid of 10: replaces nothing
    a('event', ev('g1', 'pref', { key: 'moveGoal', value: 400 }));
    a('event', ev('g2', 'pref', { key: 'moveGoal', value: 450 }));
    b('event', ev('g3', 'pref', { key: 'moveGoal', value: 500, person: 'A' })); // the same goal, set by the partner
    now = Date.parse('2026-11-02T15:00:00.000Z'); // 00:00 Tokyo, the next day
    a('event', ev('g4', 'pref', { key: 'moveGoal', value: 550 }));
    a('event', ev('k1', 'pref', { key: 'stepsGoal', value: 9000 }));
    a('event', ev('e3', 'pref', { key: 'exerciseGoal', value: 50 })); // the next day: its own
    expect(events().map((r) => r[1])).toEqual(['n2', 'n3', 'n4', 'w2', 'f2', 'f3', 'f4', 'i2', 'l1', 'e2', 's1', 'g3', 'g4', 'k1', 'e3']);
  });

  it("a goal a day keeps is the phone's Tokyo day's (`day`), within a day of the record's", () => {
    now = Date.parse('2026-11-02T14:59:59.000Z'); // 23:59:59 Tokyo
    a('event', ev('d1', 'pref', { key: 'moveGoal', value: 400 }));
    now = Date.parse('2026-11-02T15:00:02.000Z'); // 00:00:02 the next day: set at 23:59:59 on the phone
    expect(a('event', ev('d2', 'pref', { key: 'moveGoal', value: 450, day: '2026-11-02' }))).toEqual({ ok: true }); // replaces d1
    expect(a('event', ev('d3', 'pref', { key: 'moveGoal', value: 500, day: '2026-11-03' }))).toEqual({ ok: true });
    // two days off (a goal queued offline): the record's day, as an older phone's
    expect(a('event', ev('d4', 'pref', { key: 'moveGoal', value: 550, day: '2026-10-31' }))).toEqual({ ok: true }); // replaces d3
    // a day that isn't one, or on a goal that keeps only its latest: refused
    expect(a('event', ev('d5', 'pref', { key: 'moveGoal', value: 550, day: '11/02' }))).toMatchObject({ ok: false, error: 'bad_request' });
    expect(a('event', ev('d6', 'pref', { key: 'goalWeight', value: 60, day: '2026-11-03' }))).toMatchObject({ ok: false, error: 'bad_request' });
    expect(events().map((r) => r[1])).toEqual(['d2', 'd4']);
  });

  it("the island's weather mode: one row for the island, the last a member set", () => {
    expect(a('event', ev('m1', 'pref', { key: 'weatherMode', value: 'game' }))).toEqual({ ok: true });
    expect(b('event', ev('m2', 'pref', { key: 'weatherMode', value: 'real' }))).toEqual({ ok: true });
    expect(a('event', ev('m3', 'pref', { key: 'weatherMode', value: 'cloudy' })).ok).toBe(true); // ignored by the model: kept, replaces nothing
    expect(events().map((r) => r[1])).toEqual(['m2', 'm3']);
  });

  it("the island's look: one row for the island, the last anyone set (null: 自動); a malformed one refused", () => {
    expect(a('event', ev('l1', 'pref', { key: 'seasonLook', value: { event: 'halloween', season: null, weather: 'snow', tod: 'night' } }))).toEqual({ ok: true });
    expect(b('event', ev('l2', 'pref', { key: 'seasonLook', value: { season: 'winter' } }))).toEqual({ ok: true });
    expect(events().map((r) => r[1])).toEqual(['l2']);
    expect(a('event', ev('l3', 'pref', { key: 'seasonLook', value: null }))).toEqual({ ok: true });
    expect(events().map((r) => [r[1], (r[3] as { value: unknown }).value])).toEqual([['l3', null]]);
    for (const [i, value] of [{ colour: 'red' }, { season: 'Winter!' }, { tod: 3 }, 'winter', ['night']].entries())
      expect(a('event', ev(`bad${i}`, 'pref', { key: 'seasonLook', value })), JSON.stringify(value)).toMatchObject({ ok: false, error: 'bad_request' });
    expect(events().map((r) => r[1])).toEqual(['l3']);
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

  it('a room keeps 60 pieces, each room its own (the 61st refused: tent full; the wallpaper never counts)', () => {
    const P = T0 - 60_000;
    const set = (sc: string, i: number) => ev(`r-${sc}-${i}`, 'decor', { sc, id: `d${sc}${String(i).padStart(5, '0')}`, at: P + i, item: 'f4041', x: i % 8, z: (i >> 3) % 8, f: 0, p: P });
    const got: unknown[] = [];
    for (let i = 0; i < 60; i++) got.push(a('event', set('t', i)).ok);
    got.push(a('event', set('t', 60)));
    got.push(a('event', ev('r-wall', 'decor', { sc: 't', id: 'dtentwall', at: P + 70, item: 'w4840', x: 0, z: 0, f: 0, p: P })).ok);
    got.push(b('event', set('u', 0)).ok);
    expect(got).toEqual([...Array(60).fill(true), { ok: false, error: 'bad_request', detail: 'tent full' }, true, true]);
  });

  it('a room light’s switch is its own row beside its piece’s: a move after it never undoes it, nor it the move', () => {
    const P = T0 - 60_000;
    const lamp = (at: number, x: number) => ev(`l-${at}`, 'decor', { sc: 'u', id: 'dlamp001', at, item: 'f1432', x, z: 0, f: 0, p: P });
    const sw = (at: number, lt: number) => ev(`s-${at}`, 'decor', { sc: 'u', id: 'dlamp001', at, lt });
    expect(b('event', lamp(P, 1)).ok).toBe(true);
    expect(b('event', sw(P + 10, 0))).toEqual({ ok: true });
    expect(b('event', lamp(P + 20, 5)).ok).toBe(true); // moved by a phone that never saw the switch
    expect(b('event', sw(P + 5, 1))).toEqual({ ok: true, duplicate: true }); // an older switch
    expect(b('event', ev('s-none', 'decor', { sc: 'u', id: 'dnone001', at: P + 30, lt: 1 }))).toEqual({ ok: true, duplicate: true }); // no such piece
    expect(b('event', ev('s-bad', 'decor', { sc: 'u', id: 'dlamp001', at: P + 30, lt: 1, x: 3 })).ok).toBe(false);
    expect(events().filter((r) => r[2] === 'decor').map((r) => r[3])).toEqual([
      { sc: 'u', id: 'dlamp001', at: P + 10, lt: 0 }, { sc: 'u', id: 'dlamp001', at: P + 20, item: 'f1432', x: 5, z: 0, f: 0, p: P }
    ]);
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
    a('event', { id: 's1', type: 'spend', data: { spendId: 'sp1', item: 'snack', bells: 40 } });
    notices = [];
    tick();
    const r = a('events', { events: [
      { id: 'v1', type: 'spend_void', data: { spendId: 'sp1' } },
      { id: 's1', type: 'spend', data: { spendId: 'sp1', item: 'snack', bells: 40 } },
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
      { id: 'h1', ok: false, error: 'bad_request' },
      { id: 'v2', ok: true, duplicate: true },
      { id: null, ok: false, error: 'bad_request' },
      { id: 'p1', ok: true, at: '2026-11-02T03:00:01.001Z' }
    ] });
    expect(notices).toEqual([{ what: 'event', who: 'A', at: '2026-11-02T03:00:01.001Z', rev: 'e1' }]);
    expect(events().map((e) => e[1])).toEqual(['s1', 'v1', 'p1']);
  });

  it('one event that throws is `unavailable` alone: the others are kept, one notice for what committed', () => {
    // 2026-11-05 review: a throw in one event's write threw the whole batch (`unavailable`), after its earlier events
    // had committed, and told no phone
    const inner = db.sql;
    const sql = { exec: (q: string, ...b: (string | number | null)[]) => {
      if (q.startsWith('INSERT INTO events') && b.includes('boom1')) throw new RangeError('disk I/O');
      return inner.exec(q, ...b);
    } } as typeof inner;
    store = new StoreCore({ sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => now, notify: (n) => notices.push(n) });
    const pref = (id: string, value: string) => ({ id, type: 'pref', data: { key: 'locale', value } });
    const r = a('events', { events: [pref('p1', 'en'), { ...pref('boom1', 'ja') }, { id: 'v9', type: 'pref', data: { key: 'villagerName', value: 'うめ' } }] });
    expect(r).toEqual({ ok: true, results: [
      { id: 'p1', ok: true, at: '2026-11-02T03:00:00.000Z' },
      { id: 'boom1', ok: false, error: 'unavailable' },
      { id: 'v9', ok: true, at: expect.any(String) }
    ] });
    expect(store.lastError()).toBe('RangeError');
    expect(notices).toEqual([{ what: 'event', who: 'A', at: r.results[2].at, rev: 'e1' }]);
    expect(events().map((e) => e[1])).toEqual(['p1', 'v9']);
    // nothing of it was kept: its id is free for the phone's retry
    store = make();
    expect(a('event', pref('boom1', 'ja'))).toEqual({ ok: true });
  });

  it('an empty, oversized or missing list is bad_request', () => {
    for (const events of [undefined, [], 'x', Array.from({ length: 51 }, (_, i) => ({ id: `p${i}`, type: 'pref', data: { key: 'locale', value: 'en' } }))]) {
      expect(a('events', { events })).toEqual({ ok: false, error: 'bad_request' });
    }
  });
});

describe('snapshot', () => {
  it('the dump (the backup): every row, as `load` takes them, text as it came', () => {
    a('event', { id: 'n1', type: 'pref', data: { key: 'villagerName', value: 'うめ' } });
    const d = store.dump();
    expect(d.rows).toMatchObject({ metrics: [], uploads: [] });
    expect(d.rows.events.map((r) => [r[0], r[1], r[2], r[3]])).toEqual([['2026-11-02T03:00:00.000Z', 'A', 'n1', 'pref']]);
    expect(JSON.parse(String(d.rows.events[0][4])).value).toBe('うめ');
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

describe('telemetry', () => {
  it('is gone (the log has it since 2026-11-05): a request is a bad one, and the old table is dropped', () => {
    db.db.exec('CREATE TABLE telemetry (seq INTEGER PRIMARY KEY, at TEXT NOT NULL, kind TEXT NOT NULL, data TEXT NOT NULL)');
    store = make();
    expect(a('telemetry', { kind: 'error', data: { msg: 'x' } })).toEqual({ ok: false, error: 'bad_request' });
    expect(store.handle({ action: 'telemetry', kind: 'error' }, 10)).toEqual({ ok: false, error: 'unauthorized' });
    expect(db.db.prepare("SELECT name FROM sqlite_master WHERE name = 'telemetry'").all()).toEqual([]);
  });
});
