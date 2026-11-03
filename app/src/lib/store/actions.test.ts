// The wallet actions: buy one of the two rewards (only what the wallet covers), undo; the goals; the meal log.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { WeekView } from '#lib/types.ts';
import { week } from './week.svelte.ts';
import { buy, setGoalBodyFat, setGoalWeight, setMoveGoal, setStepsGoal, undoSpend } from './actions.ts';
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

  it('setMoveGoal sends pref moveGoal as a rounded integer within 100–2,000 kcal, refuses the rest', () => {
    for (const bad of [99, 2001, NaN, Infinity]) expect(setMoveGoal('A', bad)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    expect(setMoveGoal('B', 549.6).ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['pref', { person: 'B', key: 'moveGoal', value: 550 }]]);
  });

  it('setStepsGoal sends pref stepsGoal for either person: a whole 500 in 1,000–30,000, refuses the rest', () => {
    for (const bad of [500, 30500, 8250, 8000.5, NaN, Infinity]) expect(setStepsGoal('A', bad)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    expect(setStepsGoal('B', 10000).ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['pref', { person: 'B', key: 'stepsGoal', value: 10000 }]]);
  });
});

describe('the goals name whose goal', () => {
  it('setGoalWeight carries an explicit person, mine or the partner’s, rounded to one decimal; null clears it', () => {
    expect(setGoalWeight('B', 58.04).ok).toBe(true);
    expect(setGoalWeight('A', null).ok).toBe(true);
    expect(setGoalWeight('A', 19).ok).toBe(false);
    expect(queued().map((e) => [e.type, e.data])).toEqual([
      ['pref', { person: 'B', key: 'goalWeight', value: 58 }],
      ['pref', { person: 'A', key: 'goalWeight', value: null }]
    ]);
    // a goal is sent at once (no undo window)
    expect(queued().every((e) => e.nextAt === e.queuedAt)).toBe(true);
  });
  it('setGoalBodyFat: the same, in % within 3–60', () => {
    expect(setGoalBodyFat('B', 18.04).ok).toBe(true);
    expect(setGoalBodyFat('A', null).ok).toBe(true);
    for (const bad of [2.9, 60.1, NaN]) expect(setGoalBodyFat('A', bad).ok).toBe(false);
    expect(queued().map((e) => [e.type, e.data])).toEqual([
      ['pref', { person: 'B', key: 'goalBodyFat', value: 18 }],
      ['pref', { person: 'A', key: 'goalBodyFat', value: null }]
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

  it('setKcalGoal: a whole 50 in 1,000–5,000 or null; a member for either member, the guest its own', async () => {
    const { setKcalGoal } = await import('./actions.ts');
    await model();
    for (const bad of [950, 1825, 5050, NaN]) expect(setKcalGoal('A', bad).ok).toBe(false);
    expect(setKcalGoal('G', 2000).ok).toBe(false);
    expect(setKcalGoal('B', 1800).ok).toBe(true);
    expect(setKcalGoal('A', null).ok).toBe(true);
    week.model = { ...week.model!, me: 'G' };
    expect(setKcalGoal('A', 2000).ok).toBe(false);
    expect(setKcalGoal('G', 2200).ok).toBe(true);
    expect(queued().filter((e) => e.type === 'pref').map((e) => e.data)).toEqual([
      { person: 'B', key: 'kcalGoal', value: 1800 },
      { person: 'A', key: 'kcalGoal', value: null },
      { key: 'kcalGoal', value: 2200 }
    ]);
  });
});
