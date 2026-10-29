import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { doPost, MAX_BODY_CHARS, RATE_PER_MINUTE } from './main.ts';
import { install, makeGas, type Gas } from './fakes.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);

let gas: Gas;
beforeEach(() => {
  gas = makeGas();
  install(gas);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-29T03:00:00.000Z'));
});
afterEach(() => vi.useRealTimers());

const raw = (contents: unknown) => JSON.parse((doPost(contents as never) as unknown as { text: string }).text);
const post = (body: unknown) => raw({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } });
const a = (action: string, extra: object = {}) => post({ key: KEY_A, action, ...extra });
const b = (action: string, extra: object = {}) => post({ key: KEY_B, action, ...extra });
const tick = (ms = 1000) => vi.setSystemTime(Date.now() + ms);
const data = (tab: string) => gas.sheets.get(tab)?.data() ?? [];

// The user's real Shortcut body (sheets-architecture.md §5): the old dictionary plus key + action.
const REAL = {
  dates: 'Sep 28, 2026 at 7:11 AM\nSep 29, 2026 at 7:55 AM\nSep 29, 2026 at 8:00 PM',
  steps: '855\n9106\n100',
  exercise_minutes: '0\n23\n7',
  calories: '0\n248.2\n10'
};

describe('auth', () => {
  it('rejects a missing, wrong, short or non-string key with the same reply', () => {
    for (const key of [undefined, '', null, 42, KEY_A.slice(0, 63), `${KEY_A}x`, 'c'.repeat(64)]) {
      expect(post({ key, action: 'whoami' }), String(key)).toEqual({ ok: false, error: 'unauthorized' });
    }
  });

  it('identifies each person by key', () => {
    expect(a('whoami')).toEqual({ ok: true, me: 'A' });
    expect(b('whoami')).toEqual({ ok: true, me: 'B' });
  });

  it('whoami creates every tab with its header', () => {
    a('whoami');
    expect([...gas.sheets.keys()].sort()).toEqual(['events', 'metrics', 'presence', 'uploads', 'workouts']);
    expect(gas.sheets.get('metrics')!.rows[0]).toEqual(['at', 'person', 'date', 'metric', 'value']);
    expect(gas.sheets.get('metrics')!.frozen).toBe(1);
  });

  it('an unset or short key property never matches', () => {
    gas = makeGas({ keyA: null, keyB: 'short' });
    install(gas);
    expect(post({ key: null, action: 'whoami' }).error).toBe('unauthorized');
    expect(post({ key: 'short', action: 'whoami' }).error).toBe('unauthorized');
    expect(post({ action: 'whoami' }).error).toBe('unauthorized');
  });

  it('ignores the query string entirely (never reads e.parameter)', () => {
    const trap = (body: object) => {
      const e = { postData: { contents: JSON.stringify(body) } };
      Object.defineProperty(e, 'parameter', { get() { throw new Error('doPost read e.parameter'); } });
      Object.defineProperty(e, 'parameters', { get() { throw new Error('doPost read e.parameters'); } });
      return e;
    };
    expect(raw(trap({ key: KEY_A, action: 'whoami' }))).toEqual({ ok: true, me: 'A' });
    expect(raw(trap({ action: 'whoami' }))).toEqual({ ok: false, error: 'unauthorized' });
  });
});

describe('never throws', () => {
  it('answers garbage with JSON', () => {
    const cases: unknown[] = [undefined, null, {}, { postData: {} }, { postData: { contents: '' } }, { postData: { contents: 5 } }];
    for (const c of cases) expect(raw(c), JSON.stringify(c)).toEqual({ ok: false, error: 'bad_request' });
    for (const s of ['{not json', 'null', '"str"', '[1,2]', '42']) expect(post(s), s).toEqual({ ok: false, error: 'bad_request' });
  });

  it('unknown or missing action is bad_request', () => {
    expect(a('drop_tables')).toEqual({ ok: false, error: 'bad_request' });
    expect(post({ key: KEY_A })).toEqual({ ok: false, error: 'bad_request' });
  });

  it('a failing spreadsheet service becomes unavailable, and the lock is released', () => {
    gas.state.spreadsheetThrows = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(a('snapshot')).toEqual({ ok: false, error: 'unavailable' });
    expect(gas.state.lockHeld).toBe(false);
  });

  it('bodies over 1 MB are too_large, before the key is looked at', () => {
    expect(post({ key: KEY_A, action: 'whoami', pad: 'x'.repeat(MAX_BODY_CHARS) })).toEqual({ ok: false, error: 'too_large' });
    expect(post({ key: 'wrong', pad: 'x'.repeat(MAX_BODY_CHARS) })).toEqual({ ok: false, error: 'too_large' });
  });

  it('bad action fields are bad_request', () => {
    expect(a('presence', { place: '', event: 'arrive' }).error).toBe('bad_request');
    expect(a('presence', { place: 'gym', event: 'dance' }).error).toBe('bad_request');
    expect(a('presence', { place: 'gym', event: 'arrive', at: 'whenever' }).error).toBe('bad_request');
    expect(a('event', { id: 'e1', type: 'nope', data: {} }).error).toBe('bad_request');
    expect(a('event', { id: '', type: 'highfive', data: {} }).error).toBe('bad_request');
    expect(a('event', { id: 'e1', type: 'highfive', data: [1] }).error).toBe('bad_request');
    expect(a('event', { id: 'e1', type: 'pref', data: { value: 'x'.repeat(30_000) } }).error).toBe('too_large');
    expect(a('snapshot', { since: 5 }).error).toBe('bad_request');
  });
});

describe('ingest', () => {
  it("the user's real payload: rows appended with server time, audit row, nothing stored twice", () => {
    expect(a('ingest', REAL)).toEqual({ ok: true, metrics: 4, workouts: 0 });
    const at = '2026-10-29T03:00:00.000Z';
    expect(data('metrics')).toEqual([
      [at, 'A', '2026-09-28', 'steps', 855], [at, 'A', '2026-09-29', 'steps', 9206],
      [at, 'A', '2026-09-28', 'exercise_min', 0], [at, 'A', '2026-09-29', 'exercise_min', 30]
    ]);
    expect(data('uploads')).toEqual([[at, 'A', 'ok', JSON.stringify({ key: KEY_A, action: 'ingest', ...REAL }).length, '']]);
    tick();
    expect(a('ingest', REAL)).toEqual({ ok: true, metrics: 0, workouts: 0 });
    expect(data('metrics')).toHaveLength(4);
    expect(data('uploads')).toHaveLength(2);
  });

  it('appends only higher values; lower ones never overwrite (append-only)', () => {
    a('ingest', { days: [{ date: '2026-10-27', steps: 9000, exerciseMin: 40 }] });
    tick();
    expect(a('ingest', { days: [{ date: '2026-10-27', steps: 1200, exerciseMin: 5 }] })).toMatchObject({ metrics: 0 });
    tick();
    expect(a('ingest', { days: [{ date: '2026-10-27', steps: 9500, exerciseMin: 40 }] })).toMatchObject({ metrics: 1 });
    expect(data('metrics').map((r) => [r[3], r[4]])).toEqual([['steps', 9000], ['exercise_min', 40], ['steps', 9500]]);
  });

  it('dates stay text in the sheet (cells are plain-text formatted)', () => {
    a('ingest', REAL);
    expect(typeof data('metrics')[0][2]).toBe('string');
  });

  it('people are independent', () => {
    a('ingest', REAL);
    expect(b('ingest', REAL)).toMatchObject({ metrics: 4 });
    expect(data('metrics').filter((r) => r[1] === 'B')).toHaveLength(4);
  });

  it('workouts are deduped by id, also across language and time zone', () => {
    const body = {
      workouts: {
        types: ['伝統的な筋力トレーニング', 'カバディ'],
        starts: ['2026-11-02T08:30:10+09:00', '2026-11-03T18:00:00+09:00'],
        ends: ['2026-11-02T09:22:10+09:00', '2026-11-03T18:30:00+09:00'],
        avgHrs: ['118', '']
      }
    };
    expect(a('ingest', body)).toEqual({ ok: true, metrics: 0, workouts: 2, unknownTypes: ['カバディ'] });
    const [w] = data('workouts');
    expect(w.slice(1)).toEqual(['A', w[2], '2026-11-02', 'Traditional Strength Training', '2026-11-02T08:30:10+09:00', '2026-11-02T09:22:10+09:00', 52, 118]);
    expect(data('workouts')[1][8]).toBe('');
    tick();
    expect(a('ingest', { workouts: [{ type: 'Traditional Strength Training', start: '2026-11-01 23:30:40 +0000', end: '2026-11-02 00:22:10 +0000' }] }))
      .toMatchObject({ workouts: 0 });
    expect(data('workouts')).toHaveLength(2);
    expect(data('uploads').at(0)![4]).toBe('unknown workout types: カバディ');
  });

  it('a bad shape is bad_request with a hint, and audited as an error', () => {
    const r = a('ingest', { steps: '12\n3' });
    expect(r).toMatchObject({ ok: false, error: 'bad_request' });
    expect(r.detail).toMatch(/steps has values but no start dates/);
    expect(data('uploads')[0].slice(1, 3)).toEqual(['A', 'error']);
    expect(data('metrics')).toEqual([]);
  });

  it('partial uploads say how many items were skipped', () => {
    expect(a('ingest', { steps: { values: [1, 'x'], starts: ['2026-10-28', '2026-10-28'] } })).toEqual({ ok: true, metrics: 1, workouts: 0, skipped: 1 });
    expect(data('uploads')[0].slice(2)).toEqual(['partial', expect.any(Number), '1 items skipped']);
  });

  it('grows the sheet past its initial 1000 rows', () => {
    const days = Array.from({ length: 700 }, (_, i) => ({ date: new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10), steps: 1000, exerciseMin: 10 }));
    expect(a('ingest', { days })).toMatchObject({ ok: true, metrics: 1400 });
    expect(data('metrics')).toHaveLength(1400);
  });
});

describe('presence and events', () => {
  it('presence rows carry the event time, defaulting to now', () => {
    expect(a('presence', { place: 'gym', event: 'arrive', at: '2026-10-29 11:05' })).toEqual({ ok: true });
    tick();
    expect(b('presence', { place: 'studio', event: 'leave' })).toEqual({ ok: true });
    expect(data('presence')).toEqual([
      ['2026-10-29T03:00:00.000Z', 'A', 'gym', 'arrive', '2026-10-29T02:05:00.000Z'],
      ['2026-10-29T03:00:01.000Z', 'B', 'studio', 'leave', '2026-10-29T03:00:01.000Z']
    ]);
  });

  it('events: a duplicate id is acknowledged and ignored, so retries are safe', () => {
    const ev = { id: 'A-1730170000-1', type: 'checkin', data: { date: '2026-10-29', habit: 'veg', done: true } };
    expect(a('event', ev)).toEqual({ ok: true });
    expect(a('event', ev)).toEqual({ ok: true, duplicate: true });
    expect(b('event', { ...ev, id: 'B-1' })).toEqual({ ok: true });
    expect(a('event', { id: 'A-2', type: 'highfive' })).toEqual({ ok: true });
    expect(data('events').map((r) => [r[1], r[2], r[3], r[4]])).toEqual([
      ['A', 'A-1730170000-1', 'checkin', JSON.stringify(ev.data)], ['B', 'B-1', 'checkin', JSON.stringify(ev.data)], ['A', 'A-2', 'highfive', '{}']
    ]);
  });
});

describe('edit events (history-and-editing.md §4.1)', () => {
  const edits = [
    { type: 'metric_set', data: { date: '2026-10-28', metric: 'steps', value: 9800 } },
    { type: 'metric_set', data: { date: '2026-10-28', metric: 'exercise_min', value: 0 } },
    { type: 'workout_edit', data: { id: 'Yoga@2026-10-28T09:00:00.000Z', strength: false } },
    { type: 'workout_edit', data: { id: 'w1', strength: null, excluded: true } },
    { type: 'workout_add', data: { id: 'm:3f1c', date: '2026-10-28', type: 'Pilates', durationMin: 40 } },
    { type: 'spend_void', data: { spendId: 'sp-1' } },
    { type: 'transfer_undo', data: { month: '2026-09' } },
    { type: 'checkin', data: { date: '2026-10-26', habit: 'veg_two_meals', done: true, edit: true } }
  ];

  it('each new type appends with the server `at`, the sender as person and the data as JSON', () => {
    edits.forEach((e, i) => {
      expect(a('event', { id: `e${i}`, ...e }), e.type).toEqual({ ok: true });
      tick();
    });
    const rows = data('events');
    expect(rows.map((r) => [r[1], r[3], r[4]])).toEqual(edits.map((e) => ['A', e.type, JSON.stringify(e.data)]));
    expect(rows.map((r) => r[0])).toEqual(edits.map((_, i) => new Date(Date.parse('2026-10-29T03:00:00.000Z') + i * 1000).toISOString()));
  });

  it('an unknown type is bad_request', () => {
    expect(a('event', { id: 'x1', type: 'metric_delete', data: {} })).toEqual({ ok: false, error: 'bad_request' });
    expect(data('events')).toEqual([]);
  });

  it('metric_set with a non-integer or out-of-range value (or a bad date/metric) is refused', () => {
    const bad = [
      { date: '2026-10-28', metric: 'steps', value: 100_001 },
      { date: '2026-10-28', metric: 'steps', value: -1 },
      { date: '2026-10-28', metric: 'steps', value: 12.5 },
      { date: '2026-10-28', metric: 'steps', value: '9800' },
      { date: '2026-10-28', metric: 'exercise_min', value: 1441 },
      { date: '2026-10-28', metric: 'calories', value: 10 },
      { date: '10/28', metric: 'steps', value: 10 },
      { metric: 'steps', value: 10 }
    ];
    bad.forEach((d, i) => expect(a('event', { id: `b${i}`, type: 'metric_set', data: d }), JSON.stringify(d)).toEqual({ ok: false, error: 'bad_request' }));
    expect(a('event', { id: 'ok-max', type: 'metric_set', data: { date: '2026-10-28', metric: 'steps', value: 100_000 } })).toEqual({ ok: true });
    expect(a('event', { id: 'ok-min', type: 'metric_set', data: { date: '2026-10-28', metric: 'exercise_min', value: 1440 } })).toEqual({ ok: true });
    expect(data('events')).toHaveLength(2);
  });

  it('other edit shapes are checked too', () => {
    const bad = [
      { type: 'workout_edit', data: { id: 'w1' } },
      { type: 'workout_edit', data: { id: 'w1', strength: 'yes' } },
      { type: 'workout_add', data: { id: 'w-no-prefix', date: '2026-10-28', type: 'Yoga', durationMin: 30 } },
      { type: 'workout_add', data: { id: 'm:1', date: '2026-10-28', type: 'Yoga', durationMin: 601 } },
      { type: 'workout_add', data: { id: 'm:1', date: '2026-10-28', type: 'Yoga', durationMin: 0 } },
      { type: 'workout_add', data: { id: 'm:2', date: '2026-10-28', type: 'Underwater Basket Weaving', durationMin: 30 } }, // L7
      { type: 'share', data: { key: 'steps', value: false } }, // L3: no longer an event type
      { type: 'spend_void', data: {} },
      { type: 'transfer_undo', data: { month: '2026-13' } }
    ];
    bad.forEach((e, i) => expect(a('event', { id: `c${i}`, ...e }), JSON.stringify(e)).toEqual({ ok: false, error: 'bad_request' }));
    expect(data('events')).toEqual([]);
  });

  it('a duplicate edit id is acknowledged and ignored', () => {
    const ev = { id: 'm-1', type: 'metric_set', data: { date: '2026-10-28', metric: 'steps', value: 9800 } };
    expect(a('event', ev)).toEqual({ ok: true });
    tick();
    expect(a('event', { ...ev, data: { ...ev.data, value: 1 } })).toEqual({ ok: true, duplicate: true });
    expect(data('events')).toHaveLength(1);
    expect(JSON.parse(String(data('events')[0][4])).value).toBe(9800);
  });

  it('a lowering metric_set does not stop later ingests from appending only above the sheet max', () => {
    a('ingest', { dates: '2026-10-28', steps: '12410', exercise_minutes: '30' });
    tick();
    a('event', { id: 'm-2', type: 'metric_set', data: { date: '2026-10-28', metric: 'steps', value: 9800 } });
    tick();
    // A stale re-send of the wrong value appends nothing, so it cannot revive it.
    expect(a('ingest', { dates: '2026-10-28', steps: '12410', exercise_minutes: '30' })).toMatchObject({ ok: true, metrics: 0 });
  });
});

describe('snapshot', () => {
  it('returns every row of both people as compact arrays, then only rows after `since`', () => {
    a('ingest', REAL);
    tick();
    b('presence', { place: 'studio', event: 'arrive', at: '2026-10-29T12:00:00+09:00' });
    tick();
    a('event', { id: 'e1', type: 'highfive', data: {} });
    a('ingest', { workouts: [{ type: 'Yoga', start: '2026-10-29T07:00:00+09:00', end: '2026-10-29T07:30:00+09:00' }] });

    const full = b('snapshot');
    expect(full).toMatchObject({ ok: true, me: 'B', now: expect.any(String) });
    expect(full.rows.metrics).toHaveLength(4);
    expect(full.rows.metrics[0]).toEqual(['2026-10-29T03:00:00.000Z', 'A', '2026-09-28', 'steps', 855]);
    expect(full.rows.presence).toEqual([['2026-10-29T03:00:01.000Z', 'B', 'studio', 'arrive', '2026-10-29T03:00:00.000Z']]);
    expect(full.rows.events).toEqual([[expect.any(String), 'A', 'e1', 'highfive', '{}']]);
    expect(full.rows.workouts[0].slice(1, 9)).toEqual(['A', expect.stringMatching(/^w:[0-9a-f]{24}$/), '2026-10-29', 'Yoga', '2026-10-29T07:00:00+09:00', '2026-10-29T07:30:00+09:00', 30, null]);
    expect(full.rows).not.toHaveProperty('uploads');

    const since = full.rows.presence[0][0];
    const inc = a('snapshot', { since });
    expect(inc.rows.metrics).toEqual([]);
    expect(inc.rows.presence).toEqual([]);
    expect(inc.rows.events).toHaveLength(1);
    expect(inc.rows.workouts).toHaveLength(1);
  });

  it('every request gets a strictly later `at`, even within the same millisecond', () => {
    a('event', { id: 'x1', type: 'highfive' });
    a('event', { id: 'x2', type: 'highfive' });
    const [r1, r2] = data('events');
    expect(String(r2[0]) > String(r1[0])).toBe(true);
    expect(a('snapshot', { since: r1[0] }).rows.events.map((r: unknown[]) => r[2])).toEqual(['x2']);
  });

  it('copes with hand-pasted rows that Sheets turned into Dates and numbers into text', () => {
    a('whoami');
    const sh = gas.sheets.get('metrics')!;
    sh.rows.push([new Date('2026-09-01T00:00:00.000Z'), 'A', new Date('2026-09-01T00:00:00+09:00'), 'steps', '7000']);
    expect(a('snapshot').rows.metrics).toEqual([['2026-09-01T00:00:00.000Z', 'A', '2026-09-01', 'steps', 7000]]);
    // …and the higher-only index reads them too.
    expect(a('ingest', { days: [{ date: '2026-09-01', steps: 6000 }] })).toMatchObject({ metrics: 0 });
  });

  it('a hand-pasted `at` without milliseconds or UTC is normalised, so `since` compares it correctly', () => {
    a('whoami');
    gas.sheets.get('metrics')!.rows.push(['2026-10-29 12:00:00', 'A', '2026-10-29', 'steps', 7000], ['2026-10-29T12:00:01+09:00', 'A', '2026-10-30', 'steps', 1]);
    const ats = (since: string) => a('snapshot', { since }).rows.metrics.map((r: unknown[]) => r[0]);
    expect(ats('2026-10-29T02:59:59.999Z')).toEqual(['2026-10-29T03:00:00.000Z', '2026-10-29T03:00:01.000Z']);
    expect(ats('2026-10-29T03:00:00.000Z')).toEqual(['2026-10-29T03:00:01.000Z']);
    expect(ats('2026-10-29T12:00:00+09:00')).toEqual(['2026-10-29T03:00:01.000Z']);
  });
});

describe('limits', () => {
  it(`rate limit: ${RATE_PER_MINUTE} requests per key per minute`, () => {
    for (let i = 0; i < RATE_PER_MINUTE; i++) expect(a('whoami').ok).toBe(true);
    expect(a('whoami')).toEqual({ ok: false, error: 'busy' });
    expect(b('whoami').ok).toBe(true); // the other key has its own budget
    vi.setSystemTime(Date.now() + 60_000);
    expect(a('whoami').ok).toBe(true);
  });

  it('busy when the script lock cannot be taken; nothing is written', () => {
    gas.state.lockAvailable = false;
    expect(a('ingest', REAL)).toEqual({ ok: false, error: 'busy' });
    expect(a('event', { id: 'e', type: 'highfive' })).toEqual({ ok: false, error: 'busy' });
    expect(a('snapshot')).toEqual({ ok: false, error: 'busy' });
    expect(data('metrics')).toEqual([]);
    gas.state.lockAvailable = true;
    expect(a('ingest', REAL)).toMatchObject({ ok: true, metrics: 4 });
    expect(gas.state.lockHeld).toBe(false);
  });

  it('replies are JSON-typed', () => {
    const out = doPost({ postData: { contents: JSON.stringify({ key: KEY_A, action: 'whoami' }) } }) as unknown as { mime: string };
    expect(out.mime).toBe('application/json');
  });
});
