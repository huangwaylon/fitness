// The pot actions (ADR 0019): buy from the shared menus (only what the pot covers), undo, edit a menu.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { WeekView } from '#lib/types.ts';
import { week } from './week.svelte.ts';
import { buyTreat, buyTrip, setMenu, undoSpend } from './actions.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const view = (treat: number, trip: number) => ({
  pots: { treat: { balance: treat, earned: treat, spent: 0 }, trip: { balance: trip, earned: trip, spent: 0 }, todayBells: 0, weekBells: 0 },
  menus: { treat: [{ id: 'ice', label: 'アイス', bells: 500 }], trip: [{ id: 'onsen', label: '温泉', bells: 50000 }] }
}) as unknown as WeekView;

beforeEach(() => {
  vi.useFakeTimers({ now: Date.parse('2026-11-18T12:00:00.000Z') });
  configureStorage({ local: new Mem() });
  configureTransport({ fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  setKey('ab'.repeat(32), 'A');
});

describe('pot actions', () => {
  it('buy sends {spendId, pot, item, label, bells} only when the pot covers the price', () => {
    week.view = view(499, 50000);
    expect(buyTreat('ice')).toEqual({ ok: false });
    expect(buyTreat('nope')).toEqual({ ok: false });
    expect(queued()).toEqual([]);
    week.view = view(500, 49999);
    expect(buyTreat('ice').ok).toBe(true);
    expect(buyTrip('onsen')).toEqual({ ok: false });
    const [e] = queued();
    expect(e.type).toBe('spend');
    expect(e.data).toMatchObject({ pot: 'treat', item: 'ice', label: 'アイス', bells: 500 });
    expect(typeof e.data.spendId).toBe('string');
  });

  it('undoSpend sends spend_void', () => {
    expect(undoSpend('s1').ok).toBe(true);
    expect(queued().map((e) => [e.type, e.data])).toEqual([['spend_void', { spendId: 's1' }]]);
  });

  it('setMenu sends a valid menu as JSON, refuses an invalid one', () => {
    expect(setMenu('trip', [{ id: 'a b', label: 'x', bells: 1 }])).toEqual({ ok: false });
    expect(setMenu('trip', [{ id: 'camp', label: ' キャンプ ', bells: 29999.6 }]).ok).toBe(true);
    const [e] = queued();
    expect(e.type).toBe('pref');
    expect(e.data).toEqual({ key: 'tripMenu', value: JSON.stringify([{ id: 'camp', label: 'キャンプ', bells: 30000 }]) });
  });
});
