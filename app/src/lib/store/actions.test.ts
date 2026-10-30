// The wallet actions (ADR 0022): buy from the shared menu (only what the wallet covers), undo, edit the menu.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { WeekView } from '#lib/types.ts';
import { week } from './week.svelte.ts';
import { buy, buyTrip, saveMenu, setMenu, setMoveGoal, undoSpend } from './actions.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const view = (balance: number) => ({
  wallet: { balance, earned: balance, spent: 0, today: 0, week: 0 },
  menu: [{ id: 'ice', section: 'daily', label: 'アイス', bells: 500 }, { id: 'spa', section: 'trip', label: 'スパ', bells: 15000 }]
}) as unknown as WeekView;

beforeEach(() => {
  vi.useFakeTimers({ now: Date.parse('2026-11-18T12:00:00.000Z') });
  configureStorage({ local: new Mem() });
  configureTransport({ fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
});

describe('wallet actions', () => {
  it('buy sends {spendId, item, label, bells} (no pot) only when the wallet covers the price, for either section', () => {
    week.view = view(499);
    expect(buy('ice')).toEqual({ ok: false });
    expect(buy('nope')).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    week.view = view(14999);
    expect(buy('ice').ok).toBe(true);
    expect(buyTrip('spa')).toEqual({ ok: false }); // the deprecated alias buys from the same wallet
    const [e] = queued();
    expect(e.type).toBe('spend');
    expect(e.data).toEqual({ spendId: expect.any(String), item: 'ice', label: 'アイス', bells: 500 });
  });

  it('undoSpend sends spend_void', () => {
    expect(undoSpend('s1').ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['spend_void', { spendId: 's1' }]]);
  });

  it('saveMenu sends the whole menu as one `menu` pref, refuses an invalid one', () => {
    expect(saveMenu([{ id: 'a b', section: 'daily', label: 'x', bells: 1 }])).toEqual({ ok: false });
    expect(saveMenu([{ id: 'camp', section: 'trip', label: ' キャンプ ', bells: 29999.6 }]).ok).toBe(true);
    const [e] = queued();
    expect(e.type).toBe('pref');
    expect(e.data).toEqual({ key: 'menu', value: JSON.stringify([{ id: 'camp', section: 'trip', label: 'キャンプ', bells: 30000 }]) });
  });

  it('setMenu (deprecated) replaces one section of the current menu', () => {
    week.view = view(0);
    expect(setMenu('treat', [{ id: 'taiyaki', label: 'たいやき', bells: 800 }]).ok).toBe(true);
    expect(JSON.parse(String(queued()[0].data.value))).toEqual([
      { id: 'taiyaki', section: 'daily', label: 'たいやき', bells: 800 }, { id: 'spa', section: 'trip', label: 'スパ', bells: 15000 }
    ]);
  });

  it('setMoveGoal sends pref moveGoal as a rounded integer within 100–2,000 kcal, refuses the rest', () => {
    for (const bad of [99, 2001, NaN, Infinity]) expect(setMoveGoal(bad)).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    expect(setMoveGoal(549.6).ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['pref', { key: 'moveGoal', value: 550 }]]);
  });
});
