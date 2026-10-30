import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupLegacyData, doPost, KEY_CACHE_SECONDS, MAX_BODY_CHARS, onEdit, RATE_PER_MINUTE, resync } from './main.ts';
import { buildWeekView } from '../src/lib/model/week.ts';
import { historyWeeks } from '../src/lib/model/history.ts';
import { reduce } from '../src/lib/model/state.ts';
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
// The Shortcut's body (the `uploads` log, 2026-10-30): daily totals, one line per day; calories = Move kcal (ADR 0021).
const REAL = {
  dates: 'Sep 28, 2026 at 7:11 AM\nSep 29, 2026 at 7:55 AM',
  steps: '855\n9106',
  exercise_minutes: '0\n23',
  calories: '0\n248.2'
};
const day = (date: string, steps: number, ex: number) => ({ dates: date, steps: String(steps), exercise_minutes: String(ex) });

describe('auth', () => {
  it('rejects a missing, wrong, short or non-string key with the same reply', () => {
    for (const key of [undefined, '', null, 42, KEY_A.slice(0, 63), `${KEY_A}x`, 'c'.repeat(64)]) {
      expect(post({ key, action: 'whoami' }), String(key)).toEqual({ ok: false, error: 'unauthorized' });
    }
  });

  it('identifies each person by key', () => {
    expect(a('whoami')).toEqual({ ok: true, me: 'A', build: 'dev' });
    expect(b('whoami')).toEqual({ ok: true, me: 'B', build: 'dev' });
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
    expect(raw(trap({ key: KEY_A, action: 'whoami' }))).toEqual({ ok: true, me: 'A', build: 'dev' });
    expect(raw(trap({ action: 'whoami' }))).toEqual({ ok: false, error: 'unauthorized' });
  });
});

describe('keys (round 9)', () => {
  it('a non-hex key is refused before any Properties read', () => {
    for (const key of ['wrong', `${KEY_A}x`, 'g'.repeat(64), 'a'.repeat(31), 'a'.repeat(129)]) {
      expect(post({ key, action: 'whoami' })).toEqual({ ok: false, error: 'unauthorized' });
    }
    expect(gas.state.propReads).toBe(0);
  });

  it('the keys are cached, so repeated anonymous guesses cost no Properties reads', () => {
    post({ key: 'c'.repeat(64), action: 'whoami' });
    const reads = gas.state.propReads;
    for (let i = 0; i < 5; i++) expect(post({ key: 'c'.repeat(64), action: 'whoami' }).error).toBe('unauthorized');
    expect(gas.state.propReads).toBe(reads);
  });

  it(`a rotated key stops working within ${KEY_CACHE_SECONDS} s`, () => {
    expect(a('whoami').ok).toBe(true);
    gas.props.set('KEY_A', 'd'.repeat(64));
    expect(a('whoami').ok).toBe(true); // still cached
    tick(KEY_CACHE_SECONDS * 1000 + 1);
    expect(a('whoami')).toEqual({ ok: false, error: 'unauthorized' });
    expect(post({ key: 'd'.repeat(64), action: 'whoami' })).toMatchObject({ ok: true, me: 'A' });
  });

  it('a locked request reads and writes Properties once each', () => {
    a('whoami');
    const [r, w] = [gas.state.propReads, gas.state.propWrites];
    a('event', { id: 'e1', type: 'highfive' });
    expect([gas.state.propReads - r, gas.state.propWrites - w]).toEqual([1, 1]);
  });
});

describe('health', () => {
  it('keyless {"action":"health"} answers the build without touching Properties or the sheet', () => {
    expect(post({ action: 'health' })).toEqual({ ok: true, build: 'dev' });
    expect(gas.state.propReads).toBe(0);
    expect(gas.sheets.size).toBe(0);
    expect(post({})).toEqual({ ok: false, error: 'unauthorized' });
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
    expect(a('snapshot', { since: 'yesterday' }).error).toBe('bad_request'); // would compare as text and hide every row
  });
});

describe('ingest', () => {
  it("the Shortcut's body: rows appended with server time, audit row with the body's shape, nothing stored twice", () => {
    expect(a('ingest', REAL)).toEqual({ ok: true, metrics: 6, workouts: 0 });
    const at = '2026-10-29T03:00:00.000Z';
    expect(data('metrics')).toEqual([
      [at, 'A', '2026-09-28', 'steps', 855], [at, 'A', '2026-09-29', 'steps', 9106],
      [at, 'A', '2026-09-28', 'exercise_min', 0], [at, 'A', '2026-09-29', 'exercise_min', 23],
      [at, 'A', '2026-09-28', 'move_kcal', 0], [at, 'A', '2026-09-29', 'move_kcal', 248]
    ]);
    expect(data('uploads')).toEqual([[at, 'A', 'ok', JSON.stringify({ key: KEY_A, action: 'ingest', ...REAL }).length, ' | action:text[1] "ingest"; dates:text[2] "Sep 28, 2026 at 7:11 AM"; steps:text[2] "855"; exercise_minutes:text[2] "0"; calories:text[2] "0"']]);
    expect(String(data('uploads')[0][4])).not.toContain(KEY_A); // the shape never logs the key
    tick();
    expect(a('ingest', REAL)).toEqual({ ok: true, metrics: 0, workouts: 0 });
    expect(data('metrics')).toHaveLength(6);
    expect(data('uploads')).toHaveLength(2);
  });

  it('appends only higher steps and minutes; lower ones never overwrite (append-only)', () => {
    a('ingest', day('Oct 27, 2026', 9000, 40));
    tick();
    expect(a('ingest', day('Oct 27, 2026', 1200, 5))).toMatchObject({ metrics: 0 });
    tick();
    expect(a('ingest', day('Oct 27, 2026', 9500, 40))).toMatchObject({ metrics: 1 });
    expect(data('metrics').map((r) => [r[3], r[4]])).toEqual([['steps', 9000], ['exercise_min', 40], ['steps', 9500]]);
  });

  it('Move kcal and Stand minutes (ADR 0021) are daily totals, appended only when higher, like steps', () => {
    const ms = (kcal: string, stand: string) => ({ dates: 'Oct 27, 2026', calories: kcal, stand_minutes: stand });
    expect(a('ingest', ms('250.4', '58'))).toMatchObject({ metrics: 2 });
    tick();
    expect(a('ingest', ms('120', '30'))).toMatchObject({ metrics: 0 });
    tick();
    expect(a('ingest', ms('480', '58'))).toMatchObject({ metrics: 1 });
    tick();
    expect(a('ingest', ms('12000', '1500'))).toMatchObject({ metrics: 0, skipped: 2 }); // above 10,000 kcal / 1,440 min
    expect(data('metrics').map((r) => [r[3], r[4]])).toEqual([['move_kcal', 250], ['stand_min', 58], ['move_kcal', 480]]);
    const audit = data('uploads').at(-1)!;
    expect(audit[2]).toBe('partial');
    expect(String(audit[4])).toContain('calories: 12000 on 2026-10-27 is above 10000; skipped');
  });

  it('weight: any changed value is appended (a weight goes down too); the same value never twice; 0 is no weigh-in', () => {
    const wb = (kg: string) => ({ dates: 'Oct 27, 2026 at 7:00 AM', weight: kg });
    expect(a('ingest', wb('0'))).toMatchObject({ metrics: 0 });
    expect(a('ingest', wb('68.4'))).toMatchObject({ metrics: 1 });
    tick();
    expect(a('ingest', wb('68.4'))).toMatchObject({ metrics: 0 });
    tick();
    expect(a('ingest', wb('68.1'))).toMatchObject({ metrics: 1 }); // lower: still appended (unlike steps)
    tick();
    expect(a('ingest', wb('68.4'))).toMatchObject({ metrics: 1 }); // back up: the last row (not the max) is compared
    expect(data('metrics').map((r) => [r[2], r[3], r[4]])).toEqual([
      ['2026-10-27', 'weight', 68.4], ['2026-10-27', 'weight', 68.1], ['2026-10-27', 'weight', 68.4]
    ]);
  });

  it('dates stay text in the sheet (cells are plain-text formatted)', () => {
    a('ingest', REAL);
    expect(typeof data('metrics')[0][2]).toBe('string');
  });

  it('people are independent', () => {
    a('ingest', REAL);
    expect(b('ingest', REAL)).toMatchObject({ metrics: 6 });
    expect(data('metrics').filter((r) => r[1] === 'B')).toHaveLength(6);
  });

  it('workouts are deduped by id, also across phone languages', () => {
    const body = (types: string) => ({
      workouts: {
        types,
        starts: 'Nov 2, 2026 at 8:30 AM\nNov 3, 2026 at 6:00 PM',
        ends: 'Nov 2, 2026 at 9:22 AM\nNov 3, 2026 at 6:30 PM',
        avgHrs: '118\n0'
      }
    });
    expect(a('ingest', body('伝統的な筋力トレーニング\nカバディ'))).toEqual({ ok: true, metrics: 0, workouts: 2, unknownTypes: ['カバディ'] });
    const [w] = data('workouts');
    expect(w.slice(1)).toEqual(['A', w[2], '2026-11-02', 'Traditional Strength Training', '2026-11-02T08:30:00+09:00', '2026-11-02T09:22:00+09:00', 52, 118]);
    tick();
    expect(a('ingest', body('Traditional Strength Training\nカバディ'))).toMatchObject({ workouts: 0 });
    expect(data('workouts')).toHaveLength(2);
    expect(String(data('uploads').at(0)![4]).split(' | ')[0]).toBe('unknown workout types: カバディ');
  });

  it('a bad shape is bad_request with a hint, and audited as an error', () => {
    const r = a('ingest', { dates: 'Oct 27, 2026', steps: 12 });
    expect(r).toMatchObject({ ok: false, error: 'bad_request' });
    expect(r.detail).toMatch(/steps: expected Text/);
    expect(data('uploads')[0].slice(1, 3)).toEqual(['A', 'error']);
    expect(data('metrics')).toEqual([]);
  });

  it('a mismatched list is reported in the reply and the audit row, and the other lists are saved', () => {
    const r = a('ingest', { dates: 'Oct 27, 2026\nOct 28, 2026', steps: '100\n200', exercise_minutes: '1' });
    expect(r).toEqual({ ok: true, metrics: 2, workouts: 0, warnings: ['exercise_minutes: 1 lines but 2 dates; exercise_minutes not saved'] });
    expect(data('uploads').at(-1)!.slice(2)).toEqual(['ok', expect.any(Number), expect.stringMatching(/^exercise_minutes: 1 lines but 2 dates; exercise_minutes not saved \| /)]);
  });

  it('reads only the metrics rows written since the day before the body\'s earliest date (a tail), in doubling chunks', () => {
    a('whoami');
    const sh = gas.sheets.get('metrics')!;
    sh.maxRows = 5000;
    sh.rows.push(['2026-09-01T00:00:00.000Z', 'A', '2026-09-01', 'steps', 7000]);
    for (let i = 0; i < 3000; i++) sh.rows.push(['2026-09-02T00:00:00.000Z', 'B', '2026-09-02', 'steps', i]);
    for (let i = 0; i < 300; i++) sh.rows.push(['2026-10-28T00:00:00.000Z', 'B', '2026-10-28', 'steps', i]);
    const reads: number[] = [];
    const getRange = sh.getRange.bind(sh);
    sh.getRange = (row: number, col: number, n?: number, c?: number) => { if ((n ?? 1) > 1) reads.push(n!); return getRange(row, col, n, c); };
    expect(a('ingest', { dates: 'Oct 28, 2026', steps: '10' })).toMatchObject({ metrics: 1 });
    expect(reads).toEqual([256, 512]); // the 512-row chunk starts before Oct 27: done
    reads.length = 0;
    expect(a('ingest', { dates: 'Sep 1, 2026', steps: '6000' })).toMatchObject({ metrics: 0 }); // reaches the Sep 1 row: still higher-only
    expect(reads.reduce((x, y) => x + y)).toBe(3302);
  });

  it('uploads: the caller reads their own audit rows, newest first, with the body shape', () => {
    a('ingest', REAL);
    tick();
    a('ingest', { dates: 'x', steps: '1' });
    const r = a('uploads', {}) as { ok: true; rows: { status: string; notes: string }[] };
    expect(r.rows.map((x) => x.status)).toEqual(['partial', 'ok']);
    expect(r.rows[1].notes).toMatch(/dates:text\[2\] "Sep 28, 2026 at 7:11 AM"; steps:text\[2\]/);
    expect((b('uploads', {}) as { rows: unknown[] }).rows).toEqual([]);
  });

  it('uploads reads back from the end until it has 20 of the caller\'s rows', () => {
    a('whoami');
    const sh = gas.sheets.get('uploads')!;
    for (let i = 0; i < 300; i++) sh.rows.push([`2026-10-01T00:00:00.${String(i).padStart(3, '0')}Z`, 'A', 'ok', 1, `a${i}`]);
    for (let i = 0; i < 600; i++) sh.rows.push(['2026-10-02T00:00:00.000Z', 'B', 'ok', 1, 'b']);
    const r = a('uploads') as { rows: { notes: string }[] };
    expect(r.rows.map((x) => x.notes)).toEqual(Array.from({ length: 20 }, (_, i) => `a${299 - i}`));
  });

  it('partial uploads say how many lines were skipped', () => {
    expect(a('ingest', { dates: 'Oct 28, 2026\nOct 29, 2026', steps: '1\nx' })).toEqual({ ok: true, metrics: 1, workouts: 0, skipped: 1 });
    expect(data('uploads')[0].slice(2)).toEqual(['partial', expect.any(Number), expect.stringMatching(/^1 items skipped \| /)]);
  });

  it('grows the sheet past its initial 1000 rows', () => {
    const dates = Array.from({ length: 700 }, (_, i) => new Date(Date.UTC(2024, 0, 1 + i)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }));
    expect(a('ingest', { dates: dates.join('\n'), steps: dates.map(() => '1000').join('\n'), exercise_minutes: dates.map(() => '10').join('\n') })).toMatchObject({ ok: true, metrics: 1400 });
    expect(data('metrics')).toHaveLength(1400);
  });
});

describe('presence and events', () => {
  it('presence rows carry the event time, defaulting to now; an arrival is the only event (leave is refused)', () => {
    expect(a('presence', { place: 'gym', event: 'arrive', at: '2026-10-29T11:05:00+09:00' })).toEqual({ ok: true });
    tick();
    expect(b('presence', { place: 'studio', event: 'arrive' })).toEqual({ ok: true });
    expect(b('presence', { place: 'studio', event: 'leave' })).toEqual({ ok: false, error: 'bad_request' });
    expect(data('presence')).toEqual([
      ['2026-10-29T03:00:00.000Z', 'A', 'gym', 'arrive', '2026-10-29T02:05:00.000Z'],
      ['2026-10-29T03:00:01.000Z', 'B', 'studio', 'arrive', '2026-10-29T03:00:01.000Z']
    ]);
  });

  it('events: a duplicate id is acknowledged and ignored, so retries are safe', () => {
    const ev = { id: 'A-1730170000-1', type: 'pref', data: { key: 'moveGoal', value: 500 } };
    expect(a('event', ev)).toEqual({ ok: true });
    expect(a('event', ev)).toEqual({ ok: true, duplicate: true });
    expect(b('event', { ...ev, id: 'B-1' })).toEqual({ ok: true });
    expect(a('event', { id: 'A-2', type: 'highfive' })).toEqual({ ok: true });
    expect(data('events').map((r) => [r[1], r[2], r[3], r[4]])).toEqual([
      ['A', 'A-1730170000-1', 'pref', JSON.stringify(ev.data)], ['B', 'B-1', 'pref', JSON.stringify(ev.data)], ['A', 'A-2', 'highfive', '{}']
    ]);
  });

  it('spend, pref and harvest shapes are checked; types and shapes of past designs are refused', () => {
    const ok = [
      { type: 'spend', data: { spendId: 's1', item: 'ice', label: 'アイス', bells: 1000 } },
      { type: 'spend', data: { spendId: 7, item: 'spa', label: 'スパ', bells: 15000 } },
      ...['locale', 'villagerName', 'villager', 'goalWeight', 'moveGoal', 'menu'].map((key) => ({ type: 'pref', data: { key, value: null } })),
      { type: 'harvest', data: { week: '2026-10-26' } }
    ];
    ok.forEach((e, i) => expect(a('event', { id: `ok${i}`, ...e }), JSON.stringify(e)).toEqual({ ok: true }));
    const bad = [
      { type: 'checkin', data: { date: '2026-10-29', habit: 'veg', done: true } },
      { type: 'confirm', data: { kind: 'workout', id: 'w1', yes: true } },
      { type: 'spend', data: { spendId: 'y1', label: 'カフェ', amountYen: 2000 } }, // the yen economy's spend
      { type: 'spend', data: { spendId: 's2', pot: 'treat', item: 'ice', label: 'アイス', bells: 1 } }, // the two pots' spend
      { type: 'spend', data: { spendId: 's3', item: 'ice', label: 'アイス', bells: 1.5 } },
      { type: 'spend', data: { spendId: 's4', item: 'ice', label: '  ', bells: 1 } },
      { type: 'spend', data: { spendId: 's5', label: 'アイス', bells: 1 } },
      { type: 'spend', data: { spendId: 's6', item: 'ice', label: 'アイス', bells: 10_000_001 } },
      { type: 'pref', data: { key: 'treatMenu', value: '[]' } },
      { type: 'pref', data: { key: 'tripMenu', value: '[]' } },
      { type: 'pref', data: { key: 'share', value: true } },
      { type: 'pref', data: { key: 'locale' } },
      { type: 'harvest', data: { week: 'soon' } }
    ];
    bad.forEach((e, i) => expect(a('event', { id: `bad${i}`, ...e }), JSON.stringify(e)).toEqual({ ok: false, error: 'bad_request' }));
    expect(data('events')).toHaveLength(ok.length);
  });
});

describe('edit events (history-and-editing.md §4.1)', () => {
  const edits = [
    { type: 'metric_set', data: { date: '2026-10-28', metric: 'steps', value: 9800 } },
    { type: 'metric_set', data: { date: '2026-10-28', metric: 'exercise_min', value: 0 } },
    { type: 'workout_edit', data: { id: 'Yoga@2026-10-28T09:00:00.000Z', strength: false } },
    { type: 'workout_edit', data: { id: 'w1', strength: null, excluded: true } },
    { type: 'workout_add', data: { id: 'm:3f1c', date: '2026-10-28', type: 'Pilates', durationMin: 40 } },
    { type: 'spend_void', data: { spendId: 'sp-1' } }
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
      { date: '2026-10-28', metric: 'move_kcal', value: 10_001 },
      { date: '2026-10-28', metric: 'stand_min', value: 1441 },
      { date: '10/28', metric: 'steps', value: 10 },
      { metric: 'steps', value: 10 }
    ];
    bad.forEach((d, i) => expect(a('event', { id: `b${i}`, type: 'metric_set', data: d }), JSON.stringify(d)).toEqual({ ok: false, error: 'bad_request' }));
    expect(a('event', { id: 'ok-max', type: 'metric_set', data: { date: '2026-10-28', metric: 'steps', value: 100_000 } })).toEqual({ ok: true });
    expect(a('event', { id: 'ok-min', type: 'metric_set', data: { date: '2026-10-28', metric: 'exercise_min', value: 1440 } })).toEqual({ ok: true });
    expect(data('events')).toHaveLength(2);
  });

  it('metric_set weight: 20–300 kg with at most one decimal (decimals for weight only)', () => {
    const bad = [19.9, 300.1, 68.45, '68.4', null, Number.NaN];
    bad.forEach((value, i) => expect(a('event', { id: `w${i}`, type: 'metric_set', data: { date: '2026-10-28', metric: 'weight', value } }), String(value))
      .toEqual({ ok: false, error: 'bad_request' }));
    for (const [i, value] of [68.4, 20, 300, 71].entries()) {
      expect(a('event', { id: `wok${i}`, type: 'metric_set', data: { date: '2026-10-28', metric: 'weight', value } })).toEqual({ ok: true });
    }
    expect(a('event', { id: 'st-dec', type: 'metric_set', data: { date: '2026-10-28', metric: 'exercise_min', value: 30.5 } })).toEqual({ ok: false, error: 'bad_request' });
    expect(data('events')).toHaveLength(4);
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
      // the yen economy's types are gone: refused like any unknown type
      { type: 'approve', data: { spendId: 7 } },
      { type: 'transfer', data: { month: '2026-10' } },
      { type: 'transfer_undo', data: { month: '2026-09' } }
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
    a('ingest', { workouts: { types: 'Yoga', starts: 'Oct 29, 2026 at 7:00 AM', ends: 'Oct 29, 2026 at 7:30 AM' } });

    const full = b('snapshot');
    expect(full).toMatchObject({ ok: true, me: 'B', now: expect.any(String) });
    expect(full.rows.metrics).toHaveLength(6);
    expect(full.rows.metrics[0]).toEqual(['2026-10-29T03:00:00.000Z', 'A', '2026-09-28', 'steps', 855]);
    expect(full.rows.presence).toEqual([['2026-10-29T03:00:01.000Z', 'B', 'studio', 'arrive', '2026-10-29T03:00:00.000Z']]);
    expect(full.rows.events).toEqual([[expect.any(String), 'A', 'e1', 'highfive', '{}']]);
    expect(full.rows.workouts[0].slice(1, 9)).toEqual(['A', expect.stringMatching(/^w:[0-9a-f]{16}$/), '2026-10-29', 'Yoga', '2026-10-29T07:00:00+09:00', '2026-10-29T07:30:00+09:00', 30, null]);
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
    expect(a('ingest', { dates: 'Sep 1, 2026', steps: '6000' })).toMatchObject({ metrics: 0 });
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

describe('rev: resync after hand changes (sheets-architecture.md §2.1)', () => {
  const rev = () => a('snapshot').rev as string;

  it('is stable across the app\'s own writes', () => {
    const r0 = rev();
    expect(r0).toMatch(/^[0-9a-z]+$/);
    a('ingest', REAL);
    b('event', { id: 'e1', type: 'highfive' });
    b('presence', { place: 'gym', event: 'arrive' });
    a('ingest', { workouts: { types: 'Yoga', starts: 'Oct 29, 2026 at 7:00 AM', ends: 'Oct 29, 2026 at 7:30 AM' } });
    expect(rev()).toBe(r0);
  });

  it('changes when rows are deleted or pasted by hand, also when the next request is a write', () => {
    a('ingest', REAL);
    const r0 = rev();
    gas.sheets.get('metrics')!.rows.pop(); // a deleted row
    const r1 = rev();
    expect(r1).not.toBe(r0);
    expect(rev()).toBe(r1);
    gas.sheets.get('events')!.rows.push(['2026-01-01T00:00:00.000Z', 'A', 'old', 'highfive', '{}']); // pasted, `at` below since
    a('event', { id: 'e2', type: 'highfive' });
    expect(rev()).not.toBe(r1);
  });

  it('changes on a hand edit (onEdit) of a synced tab and on resync(); not for uploads', () => {
    a('whoami');
    const r0 = rev();
    onEdit({ range: gas.sheets.get('uploads')!.getRange(2, 1) as never });
    expect(rev()).toBe(r0);
    onEdit({ range: gas.sheets.get('metrics')!.getRange(2, 5) as never });
    const r1 = rev();
    expect(r1).not.toBe(r0);
    resync();
    expect(rev()).not.toBe(r1);
    expect(() => onEdit(undefined)).not.toThrow();
  });

  it('a request that fails after appending still records its rows, so they are not taken for a hand edit', () => {
    a('whoami');
    const r0 = rev();
    const up = gas.sheets.get('uploads')!;
    const getRange = up.getRange.bind(up);
    up.getRange = () => { throw new Error('Service Spreadsheets timed out'); };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(a('ingest', REAL)).toEqual({ ok: false, error: 'unavailable' });
    up.getRange = getRange;
    expect(data('metrics')).toHaveLength(6); // written before the failure
    expect(rev()).toBe(r0);
    expect(gas.props.get('LAST_AT')).toBe(data('metrics')[0][0]);
  });

  it('a concurrent onEdit bump is not overwritten by a locked request', () => {
    const r0 = rev();
    resync();
    const bumped = gas.props.get('REV');
    a('event', { id: 'e3', type: 'highfive' });
    expect(gas.props.get('REV')).toBe(bumped);
    expect(rev()).not.toBe(r0);
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
    expect(a('ingest', REAL)).toMatchObject({ ok: true, metrics: 6 });
    expect(gas.state.lockHeld).toBe(false);
  });

  it('replies are JSON-typed', () => {
    const out = doPost({ postData: { contents: JSON.stringify({ key: KEY_A, action: 'whoami' }) } }) as unknown as { mime: string };
    expect(out.mime).toBe('application/json');
  });
});

describe('cleanupLegacyData (one-off after ADR 0021; remove with the function)', () => {
  const at = (iso: string) => new Date(iso).toISOString();
  /** Rows of past designs, written straight into the tabs as an old deployment left them. */
  function seed() {
    vi.setSystemTime(new Date('2026-11-04T03:00:00.000Z'));
    a('ingest', { dates: 'Nov 2, 2026\nNov 3, 2026', steps: '5000\n4000', exercise_minutes: '20\n10', calories: '300\n200' });
    tick(3600_000);
    a('ingest', { dates: 'Nov 2, 2026\nNov 3, 2026', steps: '9000\n8200', exercise_minutes: '45\n10', calories: '640\n250', weight: '68.4\n0' });
    tick(3600_000);
    a('ingest', { dates: 'Nov 2, 2026', weight: '68.1' });
    tick();
    a('event', { id: 'set1', type: 'metric_set', data: { date: '2026-11-02', metric: 'steps', value: 7000 } });
    tick();
    a('presence', { place: 'anytime', event: 'arrive', at: '2026-11-03T19:00:00+09:00' });
    tick();
    a('event', { id: 'hf', type: 'highfive' });
    tick();
    a('event', { id: 'buy', type: 'spend', data: { spendId: 's1', item: 'ice', label: 'アイス', bells: 1 } });
    tick();
    a('event', { id: 'undo', type: 'spend_void', data: { spendId: 's1' } });
    tick();
    a('event', { id: 'goal', type: 'pref', data: { key: 'moveGoal', value: 500 } });
    const t = at('2026-11-04T06:00:00Z');
    const ev = (id: string, type: string, d: object) => [t, 'A', id, type, JSON.stringify(d)];
    gas.sheets.get('events')!.rows.push(
      ev('old1', 'checkin', { date: '2026-11-02', habit: 'veg', done: true }),
      ev('old2', 'confirm', { kind: 'workout', id: 'w1', yes: true }),
      ev('old3', 'approve', { spendId: 7 }),
      ev('old4', 'transfer', { month: '2026-10' }),
      ev('old5', 'transfer_undo', { month: '2026-10' }),
      ev('old6', 'spend', { spendId: 7, label: 'Dinner', amountYen: 5000 }),
      ev('old7', 'pref', { key: 'share', value: true }),
      ev('old10', 'pref', { key: 'treatMenu', value: '[]' }),
      ev('old11', 'spend', { spendId: 'p1', pot: 'trip', item: 'daytrip', label: '日帰り', bells: 10000 }),
      ev('old8', 'share', { metric: 'steps', on: true }),
      [t, 'B', 'old9', 'highfive', '{oops']
    );
    gas.sheets.get('presence')!.rows.push([t, 'A', 'anytime', 'leave', t]);
    const early = at('2026-11-04T03:30:00Z'); // junk older than the last sync (the snapshot reads 'n/a' as 0)
    gas.sheets.get('metrics')!.rows.push([early, 'A', '2026-11-02', 'floors', 3], [early, 'A', '2026-11-02', 'steps', 'n/a']);
    const up = gas.sheets.get('uploads')!;
    for (let i = 0; i < 60; i++) up.rows.push([t, 'A', 'ok', 100 + i, `run ${i}`]);
  }

  it('deletes the rows of past designs, compacts metrics to what the model reads, keeps 50 uploads, bumps REV', () => {
    seed();
    const before = b('snapshot');
    const rev = gas.props.get('REV');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const out = cleanupLegacyData();
    expect(out).toEqual({
      events: { before: 16, after: 3 }, presence: { before: 2, after: 1 }, metrics: { before: 15, after: 7 }, uploads: { before: 63, after: 50 },
      rev: expect.any(String)
    });
    expect(log).toHaveBeenCalledWith(`cleanupLegacyData: ${JSON.stringify(out)}`);
    log.mockRestore();
    expect(out.rev).not.toBe(rev);
    expect(gas.props.get('REV')).toBe(out.rev);
    // Every buy and its undo go too (the wallet starts clean from earnings, ADR 0022).
    expect(data('events').map((r) => r[3])).toEqual(['metric_set', 'highfive', 'pref']);
    expect(data('presence').map((r) => r[3])).toEqual(['arrive']);
    // Per person/date/metric: the highest row (with its own `at`), the highest just before and at the metric_set; the
    // latest weight. Lower syncs and unknown or unreadable rows go.
    const T1 = '2026-11-04T03:00:00.000Z', T2 = '2026-11-04T04:00:00.000Z', T3 = '2026-11-04T05:00:00.000Z';
    expect(data('metrics')).toEqual([
      [T1, 'A', '2026-11-03', 'exercise_min', 10], // the first sync was already that day's highest
      [T2, 'A', '2026-11-02', 'steps', 9000], [T2, 'A', '2026-11-03', 'steps', 8200], [T2, 'A', '2026-11-02', 'exercise_min', 45],
      [T2, 'A', '2026-11-02', 'move_kcal', 640], [T2, 'A', '2026-11-03', 'move_kcal', 250],
      [T3, 'A', '2026-11-02', 'weight', 68.1]
    ]);
    expect(data('uploads').at(-1)![4]).toBe('run 59');
    expect(gas.sheets.get('events')!.rows[0]).toEqual(['at', 'person', 'id', 'type', 'data']); // the header stays
    expect(JSON.parse(gas.props.get('ROWS')!)).toMatchObject({ events: 4, presence: 2, metrics: 8 });
    // Every view is the same as before (the model ignored those rows anyway).
    const after = b('snapshot');
    const now = Date.parse('2026-11-04T12:00:00Z');
    for (const me of ['A', 'B'] as const) expect(buildWeekView(reduce(after.rows), me, now)).toEqual(buildWeekView(reduce(before.rows), me, now));
    expect(historyWeeks(reduce(after.rows), now)).toEqual(historyWeeks(reduce(before.rows), now));
    // The bookkeeping is consistent: the next write appends after the kept rows without another REV bump.
    tick();
    expect(a('event', { id: 'hf2', type: 'highfive' })).toEqual({ ok: true });
    expect(data('events')).toHaveLength(4);
    expect(gas.props.get('REV')).toBe(out.rev);
  });

  it('a second run changes nothing but REV; busy when the lock is held', () => {
    seed();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    cleanupLegacyData();
    const again = cleanupLegacyData();
    expect(again).toMatchObject({ events: { before: 3, after: 3 }, presence: { before: 1, after: 1 }, metrics: { before: 7, after: 7 }, uploads: { before: 50, after: 50 } });
    gas.state.lockAvailable = false;
    expect(() => cleanupLegacyData()).toThrow(/busy/);
    vi.restoreAllMocks();
  });
});
