// The wallet actions: buy one of the two rewards (only what the wallet covers), undo; the goals; the meal log, its
// repeats, recipes and custom foods.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { WeekView } from '#lib/types.ts';
import { week } from './week.svelte.ts';
import { buy, setGoal, undoSpend } from './actions.ts';
import type { ShopItemId } from '#lib/types.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const view = (balance: number) => ({ wallet: { balance, today: 0 } }) as unknown as WeekView;

beforeEach(() => {
  vi.useFakeTimers({ now: Date.parse('2026-11-18T12:00:00.000Z') });
  configureStorage({ local: new Mem() });
  configureTransport({ fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
});

describe('wallet actions', () => {
  it('buy sends {spendId, item, bells} at the reward’s price, only when the wallet covers it', () => {
    week.view = view(39);
    expect(buy('snack')).toEqual({ ok: false });
    expect(buy('nope' as ShopItemId)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    week.view = view(69);
    expect(buy('snack')).toMatchObject({ ok: true, bells: 40 });
    expect(buy('dinner')).toEqual({ ok: false });
    week.view = view(70);
    expect(buy('dinner')).toMatchObject({ ok: true, bells: 70 });
    expect(queued().map((e) => [e.type, e.data])).toEqual([
      ['spend', { spendId: expect.any(String), item: 'snack', bells: 40 }],
      ['spend', { spendId: expect.any(String), item: 'dinner', bells: 70 }]
    ]);
  });

  it('undoSpend sends spend_void', () => {
    expect(undoSpend('s1').ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['spend_void', { spendId: 's1' }]]);
  });

  it('setGoal move sends pref moveGoal as a rounded integer within 100–2,000 kcal, refuses the rest', () => {
    for (const bad of [99, 2001, NaN, Infinity]) expect(setGoal('move', 'A', bad)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    expect(setGoal('move', 'B', 549.6).ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['pref', { person: 'B', key: 'moveGoal', value: 550 }]]);
  });

  it('setGoal steps sends pref stepsGoal for either person: a whole 500 in 1,000–30,000, refuses the rest', () => {
    for (const bad of [500, 30500, 8250, 8000.5, NaN, Infinity]) expect(setGoal('steps', 'A', bad)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    expect(setGoal('steps', 'B', 10000).ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['pref', { person: 'B', key: 'stepsGoal', value: 10000 }]]);
  });
});

describe('the goals name whose goal', () => {
  it('setGoal weight carries an explicit person, mine or the partner’s, rounded to one decimal; null clears it', () => {
    expect(setGoal('weight', 'B', 58.04).ok).toBe(true);
    expect(setGoal('weight', 'A', null).ok).toBe(true);
    expect(setGoal('weight', 'A', 19).ok).toBe(false);
    expect(queued().map((e) => [e.type, e.data])).toEqual([
      ['pref', { person: 'B', key: 'goalWeight', value: 58 }],
      ['pref', { person: 'A', key: 'goalWeight', value: null }]
    ]);
    // a goal is sent at once (no undo window)
    expect(queued().every((e) => e.nextAt === e.queuedAt)).toBe(true);
  });
  it('setGoal body_fat_pct: the same, in % within 3–60', () => {
    expect(setGoal('body_fat_pct', 'B', 18.04).ok).toBe(true);
    expect(setGoal('body_fat_pct', 'A', null).ok).toBe(true);
    for (const bad of [2.9, 60.1, NaN]) expect(setGoal('body_fat_pct', 'A', bad).ok).toBe(false);
    expect(queued().map((e) => [e.type, e.data])).toEqual([
      ['pref', { person: 'B', key: 'goalBodyFat', value: 18 }],
      ['pref', { person: 'A', key: 'goalBodyFat', value: null }]
    ]);
  });
  it('the new goals: Exercise / Stand per day (never cleared), BMI / lean mass the latest; never the guest’s', () => {
    expect([setGoal('exercise', 'A', 45).ok, setGoal('exercise', 'A', null).ok, setGoal('stand', 'B', 125).ok, setGoal('bmi', 'B', 22.04).ok, setGoal('lean_kg', 'A', null).ok, setGoal('bmi', 'G', 22).ok])
      .toEqual([true, false, false, true, true, false]);
    expect(queued().map((e) => e.data)).toEqual([
      { person: 'A', key: 'exerciseGoal', value: 45 }, { person: 'B', key: 'goalBmi', value: 22 }, { person: 'A', key: 'goalLean', value: null }
    ]);
  });
});

describe('the island’s finds (the ずかん)', () => {
  const NOW = Date.parse('2026-11-18T12:00:00.000Z');
  const model = async (events: [string, 'A' | 'B', string, string, string][] = []) => {
    const { reduce } = await import('#lib/model/state.ts');
    week.model = { state: reduce({ metrics: [], events: events as never }), me: 'A', now: NOW } as unknown as typeof week.model;
  };

  it('recordFind sends {kind, id} the first time either of us finds it, and nothing once the model has it', async () => {
    const { recordFind } = await import('./actions.ts');
    await model();
    expect(recordFind('fish', 'tuna')).toBe(true);
    expect(queued().filter((e) => e.type === 'find').map((e) => e.data)).toEqual([{ kind: 'fish', id: 'tuna' }]);
    await model([['2026-11-18T01:00:00.000Z', 'B', 'x', 'find', '{"kind":"bug","id":"snail"}']]);
    expect(recordFind('bug', 'snail')).toBe(false); // うめ found it already
    expect(queued().filter((e) => e.type === 'find')).toHaveLength(1);
  });

  it('every catch counts in today’s tally: one held tally a minute, the newest replacing the one still held', async () => {
    const { recordFind } = await import('./actions.ts');
    // my tally of today already on the sheet (another phone, or before a reload): it carries on from there
    await model([['2026-11-18T01:00:00.000Z', 'A', 't0', 'tally', '{"date":"2026-11-18","counts":{"fish:dab":2}}']]);
    recordFind('fish', 'dab');
    vi.advanceTimersByTime(20_000);
    // the model (live: the queue on top of the rows) shows the held tally as today's latest
    const tallyOf = () => queued().filter((e) => e.type === 'tally');
    await model([
      ['2026-11-18T01:00:00.000Z', 'A', 't0', 'tally', '{"date":"2026-11-18","counts":{"fish:dab":2}}'],
      ['2026-11-18T12:00:00.000Z', 'A', tallyOf()[0].id, 'tally', JSON.stringify(tallyOf()[0].data)]
    ]);
    recordFind('bug', 'moth');
    expect(tallyOf().map((e) => e.data)).toEqual([{ date: '2026-11-18', counts: { 'fish:dab': 3, 'bug:moth': 1 } }]);
    // held until the first catch's minute is up, not a new minute from the second
    expect(tallyOf()[0].nextAt).toBe(NOW + 60_000);
  });
});

describe('the meal log', () => {
  const NOW = Date.parse('2026-11-18T12:00:00.000Z');
  const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, u: '1杯' };
  /** The model as the store composes it: the rows, with this phone's queued events on top. */
  const model = async (me: 'A' | 'G' = 'A') => {
    const { reduce } = await import('#lib/model/state.ts');
    const events = queued().map((e, i) => [new Date(NOW + i).toISOString(), me, e.id, e.type, JSON.stringify(e.data)]);
    week.model = { state: reduce({ metrics: [], events: events as never }), me, now: NOW } as unknown as typeof week.model;
  };
  const food = () => queued().filter((e) => e.type === 'food').map((e) => e.data as Record<string, unknown>);

  it('logFood sends a new entry’s whole state, its id `f` + [0-9a-z], the grams to one decimal', async () => {
    const { logFood } = await import('./actions.ts');
    await model();
    expect(logFood({ d: '2026-11-18', m: 'l', g: 150.04, f: RICE }).ok).toBe(true);
    expect(food()).toEqual([{ id: expect.stringMatching(/^f[0-9a-z]{6,24}$/), at: expect.any(Number), d: '2026-11-18', m: 'l', g: 150, f: RICE }]);
    // not a meal: nothing sent
    expect(logFood({ d: '2026-11-18', m: 'l', g: 0, f: RICE }).ok).toBe(false);
    expect(logFood({ d: '2026-11-18', m: 'l', g: 100, f: { ...RICE, n: ' ' } }).ok).toBe(false);
    expect(food()).toHaveLength(1);
  });

  it('editFood sends the entry’s whole state with the change (u: null drops the label), after the one it follows', async () => {
    const { editFood, logFood } = await import('./actions.ts');
    await model();
    logFood({ d: '2026-11-18', m: 'l', g: 150, f: RICE });
    const [{ id, at }] = food();
    await model();
    expect(editFood(id as string, { g: 200, m: 'd' }).ok).toBe(true);
    await model();
    expect(editFood(id as string, { u: null }).ok).toBe(true);
    const { u: _u, ...noLabel } = RICE;
    expect(food().slice(1)).toEqual([
      { id, at: expect.any(Number), d: '2026-11-18', m: 'd', g: 200, f: RICE },
      { id, at: expect.any(Number), d: '2026-11-18', m: 'd', g: 200, f: noLabel }
    ]);
    expect(food()[1].at as number).toBeGreaterThan(at as number);
    expect(food()[2].at as number).toBeGreaterThan(food()[1].at as number);
    expect(editFood('fnope0000', { g: 1 }).ok).toBe(false);
  });

  it('removeFood removes one of mine; someone else’s isn’t mine to change', async () => {
    const { editFood, logFood, removeFood } = await import('./actions.ts');
    await model();
    logFood({ d: '2026-11-18', m: 'b', g: 80, f: RICE });
    const [{ id }] = food();
    // the same rows on the guest's phone: not its entry
    const { reduce } = await import('#lib/model/state.ts');
    const rows = queued().map((e, i) => [new Date(NOW + i).toISOString(), 'A', e.id, e.type, JSON.stringify(e.data)]);
    week.model = { state: reduce({ metrics: [], events: rows as never }), me: 'G', now: NOW } as unknown as typeof week.model;
    expect(removeFood(id as string).ok).toBe(false);
    expect(editFood(id as string, { g: 1 }).ok).toBe(false);
    await model();
    expect(removeFood(id as string).ok).toBe(true);
    expect(food()[1]).toEqual({ id, at: expect.any(Number), rm: true });
  });

  it('setGoal (food): each in its range and step or null; a member for either member, the guest its own', async () => {
    await model();
    for (const bad of [950, 1825, 5050, NaN]) expect(setGoal('k', 'A', bad).ok).toBe(false);
    expect([setGoal('p', 'A', 122).ok, setGoal('s', 'A', 7.3).ok, setGoal('c', 'A', 900).ok]).toEqual([false, false, false]);
    expect(setGoal('k', 'G', 2000).ok).toBe(false);
    expect(setGoal('k', 'B', 1800).ok).toBe(true);
    expect(setGoal('k', 'A', null).ok).toBe(true);
    expect(setGoal('s', 'A', 7.5).ok).toBe(true);
    week.model = { ...week.model!, me: 'G' };
    expect(setGoal('k', 'A', 2000).ok).toBe(false);
    expect(setGoal('k', 'G', 2200).ok).toBe(true);
    expect(setGoal('p', 'G', 90).ok).toBe(true);
    expect(queued().filter((e) => e.type === 'pref').map((e) => e.data)).toEqual([
      { person: 'B', key: 'kcalGoal', value: 1800 },
      { person: 'A', key: 'kcalGoal', value: null },
      { person: 'A', key: 'saltGoal', value: 7.5 },
      { key: 'kcalGoal', value: 2200 },
      { key: 'proteinGoal', value: 90 }
    ]);
  });
});

describe('recurring meals (いつもの)', () => {
  // 2026-11-18 21:00 in Tokyo, a Wednesday
  const NOW = Date.parse('2026-11-18T12:00:00.000Z');
  const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };
  const NATTO = { id: 'mext:04046', n: '納豆', k: 190, p: 16.5, fa: 10, c: 12.1, s: null };
  const model = async () => {
    const { reduce } = await import('#lib/model/state.ts');
    const events = queued().map((e, i) => [new Date(NOW + i).toISOString(), 'A', e.id, e.type, JSON.stringify(e.data)]);
    week.model = { state: reduce({ metrics: [], events: events as never }), me: 'A', now: NOW } as unknown as typeof week.model;
  };
  const day = async (d: string) => {
    const { foodDay } = await import('#lib/model/food.ts');
    return foodDay(week.model!.state, 'A', d).entries.map((e) => [e.m, e.f.n, e.g, e.rep ?? null]);
  };
  const reps = () => queued().filter((e) => e.type === 'food_repeat').map((e) => e.data as Record<string, unknown>);
  /** A breakfast of rice and natto logged on `d`, and the model with it. */
  const breakfast = async (d: string) => {
    const { logFood } = await import('./actions.ts');
    logFood({ d, m: 'b', g: 150, f: RICE });
    logFood({ d, m: 'b', g: 45, f: NATTO });
    logFood({ d, m: 'l', g: 200, f: RICE });
    await model();
  };

  it('startRepeat: the meal’s entries become the repeat from that day, the day unchanged, the next days filled', async () => {
    const { startRepeat } = await import('./actions.ts');
    await breakfast('2026-11-18');
    const before = await day('2026-11-18');
    const r = startRepeat({ meal: 'b', date: '2026-11-18', w: 127 });
    expect(r).toMatchObject({ ok: true, id: expect.stringMatching(/^r[0-9a-z]{6,24}$/) });
    expect(reps()).toEqual([{ id: r.id, at: expect.any(Number), m: 'b', it: [{ g: 150, f: RICE }, { g: 45, f: NATTO }], w: 127, from: '2026-11-18' }]);
    await model();
    expect((await day('2026-11-18')).map((e) => e.slice(0, 3))).toEqual(before.map((e) => e.slice(0, 3)));
    expect(await day('2026-11-18')).toEqual([['b', 'ごはん', 150, r.id], ['b', '納豆', 45, r.id], ['l', 'ごはん', 200, null]]);
    expect(await day('2026-11-25')).toEqual([['b', 'ごはん', 150, r.id], ['b', '納豆', 45, r.id]]);
    expect(await day('2026-11-17')).toEqual([]);
    // one per meal; an empty meal is no repeat
    expect(startRepeat({ meal: 'b', date: '2026-11-19', w: 127 }).ok).toBe(false);
    expect(startRepeat({ meal: 'd', date: '2026-11-18', w: 127 }).ok).toBe(false);
  });

  it('startRepeat on weekdays the day isn’t one of keeps that day’s entries as they are', async () => {
    const { startRepeat } = await import('./actions.ts');
    await breakfast('2026-11-18');
    expect(startRepeat({ meal: 'b', date: '2026-11-18', w: 96 }).ok).toBe(true); // 週末: not a Wednesday
    await model();
    expect((await day('2026-11-18')).map((e) => e[3])).toEqual([null, null, null]);
    expect((await day('2026-11-21')).map((e) => e[1])).toEqual(['ごはん', '納豆']);
  });

  it('detachDay: that day skipped, its items real entries (virtual id → real id), the other days unchanged', async () => {
    const { detachDay, editFood, startRepeat } = await import('./actions.ts');
    await breakfast('2026-11-18');
    const { id } = startRepeat({ meal: 'b', date: '2026-11-18', w: 127 });
    await model();
    const map = detachDay(id!, '2026-11-19')!;
    expect(Object.keys(map)).toEqual([`${id}:0`, `${id}:1`]);
    expect(reps().at(-1)).toMatchObject({ id, sk: ['2026-11-19'] });
    await model();
    expect(await day('2026-11-19')).toEqual([['b', 'ごはん', 150, null], ['b', '納豆', 45, null]]);
    expect(editFood(map[`${id}:1`], { g: 90 }).ok).toBe(true);
    await model();
    expect(await day('2026-11-19')).toEqual([['b', 'ごはん', 150, null], ['b', '納豆', 90, null]]);
    expect((await day('2026-11-20')).map((e) => e[3])).toEqual([id, id]);
    // a day it doesn't fill (skipped now, before it), a day after tomorrow, not mine
    for (const d of ['2026-11-19', '2026-11-17', '2026-11-21']) expect(detachDay(id!, d)).toBeNull();
    expect(detachDay('rnope0000', '2026-11-18')).toBeNull();
  });

  it('updateRepeat: ends today, a new one from tomorrow with the shown meal’s items or new weekdays, the skips carried', async () => {
    const { detachDay, logFood, startRepeat, updateRepeat } = await import('./actions.ts');
    await breakfast('2026-11-17');
    const { id } = startRepeat({ meal: 'b', date: '2026-11-17', w: 127 });
    await model();
    detachDay(id!, '2026-11-19');
    logFood({ d: '2026-11-18', m: 'b', g: 200, f: { ...RICE, id: 'x', n: 'トースト' } }); // today's breakfast had more
    await model();
    const r = updateRepeat(id!, { itemsFromDate: '2026-11-18', w: 31 });
    expect(r).toMatchObject({ ok: true });
    const [next, old] = reps().slice(-2);
    expect(old).toMatchObject({ id, to: '2026-11-18', nx: r.id }); // sent after the new one, naming it
    expect(old.sk).toBeUndefined(); // the 19th is the new one's to skip
    expect(next).toMatchObject({ id: r.id, from: '2026-11-19', w: 31, sk: ['2026-11-19'] });
    await model();
    expect((await day('2026-11-17')).map((e) => e[1])).toEqual(['ごはん', '納豆', 'ごはん']); // history as it was
    expect((await day('2026-11-18')).map((e) => [e[1], e[3]])).toEqual([['ごはん', id], ['納豆', id], ['トースト', null]]);
    expect((await day('2026-11-19')).map((e) => [e[1], e[3]])).toEqual([['ごはん', null], ['納豆', null]]); // detached, not doubled
    expect((await day('2026-11-20')).map((e) => [e[1], e[3]])).toEqual([['ごはん', r.id], ['納豆', r.id], ['トースト', r.id]]);
    expect(await day('2026-11-21')).toEqual([]); // a Saturday, now 平日 only
    expect(updateRepeat(id!, { w: 127 }).ok).toBe(false); // ended
  });

  it('updateRepeat is both or neither: the new one refused by the record, the old one’s end is too and it goes on', async () => {
    const { startRepeat, updateRepeat } = await import('./actions.ts');
    const { validEventData } = await import('#lib/model/record.ts');
    const { repeatNext } = await import('#lib/contract/food.ts');
    const { reduce } = await import('#lib/model/state.ts');
    const { repeats } = await import('#lib/model/food.ts');
    await breakfast('2026-11-17');
    const { id } = startRepeat({ meal: 'b', date: '2026-11-17', w: 127 });
    await model();
    // the phone's clock past Tokyo midnight (the 19th), the record's still on the 18th: the new one's first day (the
    // 20th) is after the record's tomorrow
    vi.setSystemTime(Date.parse('2026-11-18T15:30:00.000Z'));
    expect(updateRepeat(id!, { w: 31 }).ok).toBe(true);
    // the queue sends in order, a refused event dropped and the rest going on (sync/queue.ts flush); the record by its
    // rules (model/record.ts), an end naming a repeat it doesn't hold refused (relay/src/store.ts)
    const kept: string[][] = [], held = new Set<string>(), refused: Record<string, unknown>[] = [];
    for (const e of queued()) {
      const d = e.data, nx = repeatNext(d);
      if (!validEventData(e.type, d, NOW) || (nx !== undefined && !held.has(nx))) refused.push(d);
      else {
        if (e.type === 'food_repeat') held.add(String(d.id));
        kept.push([new Date(NOW + kept.length).toISOString(), 'A', e.id, e.type, JSON.stringify(d)]);
      }
    }
    expect(refused).toMatchObject([{ from: '2026-11-20', w: 31 }, { id, to: '2026-11-19', nx: expect.any(String) }]);
    expect(repeats(reduce({ metrics: [], events: kept as never }), 'A').map((x) => [x.id, x.to, x.w])).toEqual([[id, undefined, 127]]);
  });

  it('stopRepeat: ends today (past days kept, tomorrow on nothing); one that starts tomorrow is removed', async () => {
    const { startRepeat, stopRepeat, updateRepeat } = await import('./actions.ts');
    await breakfast('2026-11-16');
    const { id } = startRepeat({ meal: 'b', date: '2026-11-16', w: 127 });
    await model();
    expect(stopRepeat(id!).ok).toBe(true);
    expect(reps().at(-1)).toMatchObject({ id, to: '2026-11-18' });
    await model();
    expect((await day('2026-11-18')).map((e) => e[3])).toEqual([id, id]);
    expect(await day('2026-11-19')).toEqual([]);
    expect(stopRepeat(id!).ok).toBe(false);
    // a repeat from tomorrow (the lunch's, changed today) stopped is gone
    const { id: lunch } = startRepeat({ meal: 'l', date: '2026-11-16', w: 127 });
    await model();
    const { id: next } = updateRepeat(lunch!, { w: 1 });
    await model();
    expect(stopRepeat(next!).ok).toBe(true);
    expect(reps().at(-1)).toEqual({ id: next, at: expect.any(Number), rm: true });
    await model();
    const { repeats } = await import('#lib/model/food.ts');
    expect(repeats(week.model!.state, 'A').map((r) => [r.id, r.to])).toEqual([[id, '2026-11-18'], [lunch, '2026-11-18']]);
  });
});

describe('my recipes (マイレシピ)', () => {
  const NOW = Date.parse('2026-11-18T12:00:00.000Z');
  const RICE = { id: 'mext:01088', n: 'ごはん', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0 };
  const CURRY = { id: 'mext:17051', n: 'カレールウ', k: 474, p: 6.5, fa: 34.1, c: 44.7, s: 10.6 };
  const IT = [{ g: 600, f: RICE }, { g: 100.04, f: CURRY }];
  /** The queued events as `who` sent them, on `me`'s phone. */
  const model = async (me: 'A' | 'B' | 'G' = 'A', who: 'A' | 'B' | 'G' = me) => {
    const { reduce } = await import('#lib/model/state.ts');
    const events = queued().map((e, i) => [new Date(NOW + i).toISOString(), who, e.id, e.type, JSON.stringify(e.data)]);
    week.model = { state: reduce({ metrics: [], events: events as never }), me, now: NOW } as unknown as typeof week.model;
  };
  const sent = (type: string) => queued().filter((e) => e.type === type).map((e) => e.data as Record<string, unknown>);

  it('saveRecipe sends a new recipe’s whole state (id `c` + [0-9a-z], grams to one decimal); refuses a malformed one', async () => {
    const { saveRecipe } = await import('./actions.ts');
    await model();
    const r = saveRecipe({ n: 'おうちカレー', sv: 4, it: IT });
    expect(r).toMatchObject({ ok: true, id: expect.stringMatching(/^c[0-9a-z]{6,24}$/) });
    expect(sent('food_recipe')).toEqual([{ id: r.id, at: expect.any(Number), n: 'おうちカレー', sv: 4, it: [{ g: 600, f: RICE }, { g: 100, f: CURRY }] }]);
    for (const bad of [{ n: ' ', sv: 4, it: IT }, { n: 'x', sv: 0, it: IT }, { n: 'x', sv: 21, it: IT }, { n: 'x', sv: 1, it: [] }]) expect(saveRecipe(bad).ok).toBe(false);
    expect(sent('food_recipe')).toHaveLength(1);
  });

  it('edits and removes my own only; another’s is copied to mine as a new recipe', async () => {
    const { removeRecipe, saveRecipe } = await import('./actions.ts');
    await model();
    const { id } = saveRecipe({ n: 'おうちカレー', sv: 4, it: IT });
    await model();
    expect(saveRecipe({ id, n: 'おうちカレー', sv: 2, it: IT }).ok).toBe(true);
    expect(sent('food_recipe')[1]).toMatchObject({ id, sv: 2 });
    expect(sent('food_recipe')[1].at as number).toBeGreaterThan(sent('food_recipe')[0].at as number);
    // on B's phone, A's recipe: not B's to change, B's to copy
    await model('B', 'A');
    expect(saveRecipe({ id, n: 'x', sv: 1, it: IT }).ok).toBe(false);
    expect(removeRecipe(id!).ok).toBe(false);
    expect(saveRecipe({ id: 'cnope0000', n: 'x', sv: 1, it: IT }).ok).toBe(false);
    const copy = saveRecipe({ n: 'おうちカレー', sv: 4, it: IT });
    expect(copy.ok && copy.id !== id).toBe(true);
    await model();
    expect(removeRecipe(id!).ok).toBe(true);
    expect(sent('food_recipe').at(-1)).toEqual({ id, at: expect.any(Number), rm: true });
  });

  it('logRecipe logs anyone’s recipe as an entry of mine: the recipe per 100 g, the grams eaten; an edit later changes no meal', async () => {
    const { logRecipe, saveRecipe } = await import('./actions.ts');
    const { recipePortion } = await import('#lib/contract/food.ts');
    const { foodDay, recipes } = await import('#lib/model/food.ts');
    await model();
    const { id } = saveRecipe({ n: 'おうちカレー', sv: 4, it: IT });
    await model('G', 'A'); // the guest's phone
    const r = recipes(week.model!.state)[0];
    const { label, g } = recipePortion(r);
    expect(logRecipe({ recipeId: id!, d: '2026-11-18', m: 'd', g, u: label }).ok).toBe(true);
    expect(logRecipe({ recipeId: 'cnope0000', d: '2026-11-18', m: 'd', g }).ok).toBe(false);
    expect(sent('food').at(-1)).toEqual({
      id: expect.stringMatching(/^f/), at: expect.any(Number), d: '2026-11-18', m: 'd', g: 175,
      f: { id: `recipe:${id}`, n: 'おうちカレー', k: 201.4, p: 3.07, fa: 5.13, c: 38.19, s: 1.51, u: '1人前' }
    });
    // A then halves the pot: the meal logged stays as it was (every queued op read as A's from here)
    await model();
    expect(saveRecipe({ id, n: 'おうちカレー', sv: 4, it: [{ g: 300, f: RICE }] }).ok).toBe(true);
    await model();
    expect(foodDay(week.model!.state, 'A', '2026-11-18')).toMatchObject({ kcal: 352 }); // 201.4 × 1.75
  });
});

describe('my foods (マイ食品)', () => {
  const NOW = Date.parse('2026-11-18T12:00:00.000Z');
  const model = async (me: 'A' | 'B' | 'G' = 'A', who: 'A' | 'B' | 'G' = me) => {
    const { reduce } = await import('#lib/model/state.ts');
    const events = queued().map((e, i) => [new Date(NOW + i).toISOString(), who, e.id, e.type, JSON.stringify(e.data)]);
    week.model = { state: reduce({ metrics: [], events: events as never }), me, now: NOW } as unknown as typeof week.model;
  };
  const sent = (type: string) => queued().filter((e) => e.type === type).map((e) => e.data as Record<string, unknown>);
  const BENTO = { n: '会社の弁当', u: '1個', k: 650 };

  it('saveCustom sends a new one’s whole state (id `m` + [0-9a-z], grams to one decimal, unknowns null); refuses a malformed one', async () => {
    const { saveCustom } = await import('./actions.ts');
    await model();
    const r = saveCustom({ ...BENTO, g: null, p: 20 });
    expect(r).toMatchObject({ ok: true, id: expect.stringMatching(/^m[0-9a-z]{6,24}$/) });
    expect(sent('food_custom')).toEqual([{ id: r.id, at: expect.any(Number), n: '会社の弁当', u: '1個', k: 650, p: 20, fa: null, c: null, s: null }]);
    expect(saveCustom({ n: 'おにぎり', u: '1個', g: 110.04, k: 180 }).ok).toBe(true);
    expect(sent('food_custom')[1]).toMatchObject({ g: 110 });
    for (const bad of [{ ...BENTO, n: ' ' }, { ...BENTO, u: '' }, { ...BENTO, k: 5001 }, { ...BENTO, g: 50, k: 500 }, { ...BENTO, p: -1 }]) expect(saveCustom(bad).ok).toBe(false);
    expect(sent('food_custom')).toHaveLength(2);
  });

  it('edits and removes my own only; another’s is copied to mine as a new one', async () => {
    const { removeCustom, saveCustom } = await import('./actions.ts');
    await model();
    const { id } = saveCustom(BENTO);
    await model();
    expect(saveCustom({ id, ...BENTO, k: 700 }).ok).toBe(true);
    expect(sent('food_custom')[1]).toMatchObject({ id, k: 700 });
    expect(sent('food_custom')[1].at as number).toBeGreaterThan(sent('food_custom')[0].at as number);
    await model('B', 'A');
    expect(saveCustom({ id, ...BENTO, k: 1 }).ok).toBe(false);
    expect(removeCustom(id!).ok).toBe(false);
    expect(saveCustom({ id: 'mnope0000', ...BENTO }).ok).toBe(false);
    const copy = saveCustom(BENTO);
    expect(copy.ok && copy.id !== id).toBe(true);
    await model();
    expect(removeCustom(id!).ok).toBe(true);
    expect(sent('food_custom').at(-1)).toEqual({ id, at: expect.any(Number), rm: true });
  });

  it('logCustom logs anyone’s as an entry of mine (a serving with no weight a nominal 100 g); an edit later changes no meal', async () => {
    const { logCustom, saveCustom } = await import('./actions.ts');
    const { foodDay } = await import('#lib/model/food.ts');
    await model();
    const { id } = saveCustom({ ...BENTO, k: 1200 });
    await model('G', 'A'); // the guest's phone
    expect(logCustom({ customId: id!, d: '2026-11-18', m: 'l', g: 150 }).ok).toBe(true);
    expect(logCustom({ customId: 'mnope0000', d: '2026-11-18', m: 'l', g: 100 }).ok).toBe(false);
    expect(sent('food').at(-1)).toEqual({
      id: expect.stringMatching(/^f/), at: expect.any(Number), d: '2026-11-18', m: 'l', g: 150,
      f: { id: `custom:${id}`, n: '会社の弁当', k: 1200, p: null, fa: null, c: null, s: null, u: '1個', sv: true }
    });
    await model();
    expect(saveCustom({ id, ...BENTO, k: 100 }).ok).toBe(true);
    await model();
    expect(foodDay(week.model!.state, 'A', '2026-11-18')).toMatchObject({ kcal: 1800 });
  });
});

