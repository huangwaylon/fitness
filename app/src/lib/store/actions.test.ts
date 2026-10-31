// The wallet actions: buy one of the two rewards (only what the wallet covers), undo; the goals.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { WeekView } from '#lib/types.ts';
import { week } from './week.svelte.ts';
import { buy, setGoalWeight, setMoveGoal, undoSpend } from './actions.ts';
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
    week.view = view(5);
    expect(buy('snack')).toEqual({ ok: false });
    expect(buy('nope' as ShopItemId)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    week.view = view(14);
    expect(buy('snack')).toMatchObject({ ok: true, bells: 8 });
    expect(buy('dinner')).toEqual({ ok: false });
    week.view = view(15);
    expect(buy('dinner')).toMatchObject({ ok: true, bells: 15 });
    expect(queued().map((e) => [e.type, e.data])).toEqual([
      ['spend', { spendId: expect.any(String), item: 'snack', bells: 8 }],
      ['spend', { spendId: expect.any(String), item: 'dinner', bells: 15 }]
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
});

describe('the island’s finds (the ずかん)', () => {
  it('recordFind sends {kind, id} the first time either of us finds it, and nothing once the model has it', async () => {
    const { reduce } = await import('#lib/model/state.ts');
    const { recordFind } = await import('./actions.ts');
    week.model = { state: reduce({ metrics: [], events: [] }) } as unknown as typeof week.model;
    expect(recordFind('fish', 'tuna')).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['find', { kind: 'fish', id: 'tuna' }]]);
    week.model = { state: reduce({ metrics: [], events: [['2026-11-18T01:00:00.000Z', 'B', 'x', 'find', '{"kind":"bug","id":"snail"}']] }) } as unknown as typeof week.model;
    expect(recordFind('bug', 'snail')).toBe(false); // うめ found it already
    expect(queued()).toHaveLength(1);
  });
});
