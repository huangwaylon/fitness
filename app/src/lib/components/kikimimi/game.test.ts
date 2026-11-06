// ききみみ's game on a phone (game.svelte.ts) and the levels' chunks (pool.ts): what's heard, and my own taps, wait in
// order for the chunk the deck they touch needs; the deck is then the one every other phone builds.
import { describe, expect, it } from 'vitest';
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

/** Till what waits for a chunk has run. */
const settle = () => new Promise((r) => setTimeout(r, 50));

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
    await settle();
    expect(loaded(6)).toBe(true);
    expect(g.view.invite).toMatchObject({ g: 'efgh', lv: 6 });
    g.join('efgh');
    expect(g.items.map((it) => it.id)).toEqual(deck(1000, 6).map((it) => it.id));
    g.dispose();
  });

  it('my own lobby moved to a level not loaded: it moves once the chunk is in; a tap after it waits behind it', async () => {
    const g = new QuizGame({ live: null, me: 'A' });
    g.open(1);
    await settle();
    expect(g.view.phase).toBe('lobby');
    expect(loaded(7)).toBe(false);
    g.configure({ lv: 7 });
    g.configure({ timer: 60 });
    expect(g.view.lv).toBe(1);
    await settle();
    expect(g.view).toMatchObject({ lv: 7, timer: 60 });
    expect(g.items.every((it) => it.lv === 7)).toBe(true);
    g.dispose();
  });
});
