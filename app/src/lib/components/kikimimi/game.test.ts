// ききみみ's game on a phone (game.svelte.ts) and the levels' chunks (pool.ts): what's heard, and my own taps, wait in
// order for the chunk the deck they touch needs; the deck is then the one every other phone builds.
import { describe, expect, it, vi } from 'vitest';
import type { Relayed } from '#lib/contract/live-protocol.ts';
import type { LiveStatus } from '#lib/sync/live.ts';
import { deck } from '#lib/kikimimi/deck.ts';
import { loaded } from '#lib/kikimimi/pool.ts';
import { QuizGame } from './game.svelte.ts';

const T0 = 1_800_000_000_000;

function fakeLive() {
  const subs: ((m: Relayed) => void)[] = [];
  const out: unknown[] = [];
  const st: LiveStatus = { connected: true, me: 'A', peer: true, here: ['B'] };
  return {
    out,
    hear: (m: Record<string, unknown>) => subs.forEach((f) => f({ kind: 'quiz', v: 3, who: 'B', t: T0, ...m } as Relayed)),
    live: {
      send: (m: unknown) => out.push(m) > 0,
      on: (f: (m: Relayed) => void) => (subs.push(f), () => {}),
      onStatus: (f: (s: LiveStatus) => void) => (f(st), () => {}),
      serverNow: () => T0
    }
  };
}


describe('ききみみ game: a deck waits for its level’s chunk', () => {
  it('a heard open for a level not loaded: the invite once its chunk is in, its deck the seed’s', async () => {
    const f = fakeLive();
    const g = new QuizGame({ live: f.live as never, me: 'A' });
    expect(loaded(6)).toBe(false);
    f.hear({ g: 'abcd', op: 'open', seed: 12344, lv: 6, same: false });
    expect(g.view.invite).toBeFalsy(); // (not before the deck can be built)
    // what's heard after it waits behind it, in order
    f.hear({ g: 'abcd', op: 'end' });
    f.hear({ g: 'efgh', op: 'open', seed: 1000, lv: 6, same: false });
    // (polled: what waits for the chunk runs once its import is in)
    await vi.waitFor(() => expect(g.view.invite).toMatchObject({ g: 'efgh', lv: 6 }));
    expect(loaded(6)).toBe(true);
    g.join('efgh');
    expect(g.items.map((it) => it.id)).toEqual(deck(1000, 6).map((it) => it.id));
    g.dispose();
  });

  it('my own lobby moved to a level not loaded: it moves once the chunk is in; a tap after it waits behind it', async () => {
    const g = new QuizGame({ live: null, me: 'A' });
    g.open(1);
    await vi.waitFor(() => expect(g.view.phase).toBe('lobby'));
    expect(loaded(7)).toBe(false);
    g.configure({ lv: 7 });
    g.configure({ timer: 60 });
    expect(g.view.lv).toBe(1);
    await vi.waitFor(() => expect(g.view).toMatchObject({ lv: 7, timer: 60 }));
    expect(g.items.every((it) => it.lv === 7)).toBe(true);
    g.dispose();
  });
});

describe('ききみみ game: its wake-ups', () => {
  it('none while the page is hidden, one when it’s back; a lobby’s wake-up with nothing new keeps its view', async () => {
    const doc = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal('document', doc);
    vi.useFakeTimers();
    try {
      const g = new QuizGame({ live: null, me: 'A' });
      g.open(1);
      await vi.advanceTimersByTimeAsync(50);
      const v = g.view, t = g.now;
      await vi.advanceTimersByTimeAsync(3100);
      expect([g.view === v, g.now > t]).toEqual([true, true]); // (woken, the same view)
      doc.hidden = true;
      await vi.advanceTimersByTimeAsync(3100); // (the wake-up already set)
      const hidden = g.now;
      await vi.advanceTimersByTimeAsync(15_000);
      expect(g.now).toBe(hidden);
      doc.hidden = false;
      doc.dispatchEvent(new Event('visibilitychange'));
      expect(g.now).toBeGreaterThan(hidden);
      g.dispose();
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
});
