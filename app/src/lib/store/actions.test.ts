// The wallet actions: buy from the shared menu (only what the wallet covers), undo, edit the menu.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { WeekView } from '#lib/types.ts';
import { week } from './week.svelte.ts';
import { addWorkout, buy, excludeWorkout, saveMenu, setGoalWeight, setMetric, setMoveGoal, setWeight, undoSpend } from './actions.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const view = (balance: number) => ({
  wallet: { balance, earned: balance, spent: 0, today: 0, week: 0 },
  menu: [
    { id: 'ice', label: 'アイス', bells: 500, basePrice: 500, price: 500, boughtThisWeek: 0, escalates: false },
    { id: 'trip', label: '旅のごほうび', bells: 12000, basePrice: 12000, price: 12000, boughtThisWeek: 0, escalates: false },
    { id: 'snack', label: 'おやつ', bells: 1200, basePrice: 1200, price: 2700, boughtThisWeek: 2, escalates: true }
  ]
}) as unknown as WeekView;

beforeEach(() => {
  vi.useFakeTimers({ now: Date.parse('2026-11-18T12:00:00.000Z') });
  configureStorage({ local: new Mem() });
  configureTransport({ fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
});

describe('wallet actions', () => {
  it('buy sends {spendId, item, label, bells} only when the wallet covers the price', () => {
    week.view = view(499);
    expect(buy('ice')).toEqual({ ok: false });
    expect(buy('nope')).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    week.view = view(11999);
    expect(buy('ice').ok).toBe(true);
    expect(buy('trip')).toEqual({ ok: false });
    const [e] = queued();
    expect(e.type).toBe('spend');
    expect(e.data).toEqual({ spendId: expect.any(String), item: 'ice', label: 'アイス', bells: 500 });
  });

  it('buy sends an escalating treat’s current price (this week’s), not its base, and checks the wallet against it', () => {
    week.view = view(2699);
    expect(buy('snack')).toEqual({ ok: false });
    week.view = view(2700);
    expect(buy('snack')).toMatchObject({ ok: true, bells: 2700 });
    expect(queued()[0].data).toEqual({ spendId: expect.any(String), item: 'snack', label: 'おやつ', bells: 2700 });
  });

  it('undoSpend sends spend_void', () => {
    expect(undoSpend('s1').ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['spend_void', { spendId: 's1' }]]);
  });

  it('saveMenu sends the whole menu as one `menu` pref (one list, no sections), refuses an invalid one', () => {
    expect(saveMenu([{ id: 'a b', label: 'x', bells: 1 }])).toEqual({ ok: false });
    expect(saveMenu([{ id: 'camp', label: ' キャンプ ', bells: 29999.6 }]).ok).toBe(true);
    const [e] = queued();
    expect(e.type).toBe('pref');
    expect(e.data).toEqual({ key: 'menu', value: JSON.stringify([{ id: 'camp', label: 'キャンプ', bells: 30000 }]) });
  });

  it('setMoveGoal sends pref moveGoal as a rounded integer within 100–2,000 kcal, refuses the rest', () => {
    for (const bad of [99, 2001, NaN, Infinity]) expect(setMoveGoal('A', bad)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    expect(setMoveGoal('B', 549.6).ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['pref', { person: 'B', key: 'moveGoal', value: 550 }]]);
  });
});

describe('きろく edits name whose data', () => {
  it('every edit carries an explicit person, mine or the partner’s', () => {
    const date = '2026-11-17';
    expect(setMetric('B', date, 'steps', 4000.4).ok).toBe(true);
    expect(setMetric('A', '2026-11-18', 'exercise_min', 45).ok).toBe(true);
    expect(excludeWorkout('B', 'm:1', date, true).ok).toBe(true);
    expect(addWorkout('B', date, 'Yoga', 30).ok).toBe(true);
    expect(setWeight('B', date, 61.24).ok).toBe(true);
    expect(setGoalWeight('B', 58).ok).toBe(true);
    expect(setGoalWeight('A', null).ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([
      ['metric_set', { person: 'B', date, metric: 'steps', value: 4000 }],
      ['metric_set', { person: 'A', date: '2026-11-18', metric: 'exercise_min', value: 45 }],
      ['workout_edit', { person: 'B', id: 'm:1', excluded: true }],
      ['workout_add', { person: 'B', id: expect.stringMatching(/^m:[\w-]+$/), date, type: 'Yoga', durationMin: 30 }],
      ['metric_set', { person: 'B', date, metric: 'weight', value: 61.2 }],
      ['pref', { person: 'B', key: 'goalWeight', value: 58 }],
      ['pref', { person: 'A', key: 'goalWeight', value: null }]
    ]);
    // the activity edits are held for the undo banner and must land before the week's lock
    const edit = queued()[2];
    expect(edit.nextAt).toBeGreaterThan(edit.queuedAt);
    expect(edit.lockAt).toBe(Date.parse('2026-11-25T04:00:00+09:00'));
  });
});
