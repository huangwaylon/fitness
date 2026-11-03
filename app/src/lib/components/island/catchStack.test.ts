import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FADE_MS, STACK_MAX, clearCards, dropCard, pushCard, pushed, stack, stackShown, type CatchCard } from './catchStack.svelte.ts';

const card = (n: number, o: Partial<CatchCard> = {}): CatchCard => ({ n, x: 0, y: 0, art: 'critters/sea-bass', parts: ['x'], ...o });
const shown = () => stack.cards.filter((c) => !c.leaving).map((c) => c.parts[0]);

describe('the catch stack', () => {
  let off = () => {};
  beforeEach(() => void (off = stackShown()));
  afterEach(() => {
    off();
    clearCards();
    vi.useRealTimers();
  });

  it('adds the newest at the bottom (the end) and pushes the oldest showing one out past the cap', () => {
    let cards: CatchCard[] = [];
    for (let n = 1; n <= STACK_MAX; n++) {
      const r = pushed(cards, card(n));
      expect(r.out).toEqual([]);
      cards = r.cards;
    }
    const r = pushed(cards, card(4));
    expect(r.cards.map((c) => c.n)).toEqual([1, 2, 3, 4]);
    expect(r.out.map((c) => c.n)).toEqual([1]);
    // one already leaving isn't counted
    expect(pushed([card(1, { leaving: true }), card(2), card(3)], card(4)).out).toEqual([]);
  });

  it('a catch is only its plate: its icon from where it happened, whose it is; nothing over anyone’s head, the catcher bounces', async () => {
    const { showCatch } = await import('./catchCard.ts');
    const { actors } = await import('../motion/director.svelte.ts');
    showCatch(120, 340, 'critters/wasp', 'x');
    showCatch(40, 0, 'critters/sea-bass', 'y', false, 'partner');
    expect(stack.cards.map(({ x, y, art, who }) => ({ x, y, art, who }))).toEqual([
      { x: 120, y: 340, art: 'critters/wasp', who: undefined },
      { x: 40, y: 0, art: 'critters/sea-bass', who: 'partner' }
    ]);
    // (whoever got it squishes, as on a tap: catchCard.ts)
    expect(actors.mine.motion).toBe('squish');
    expect(actors.partner.motion).toBe('squish');
  });

  it('a fourth fades the oldest out early; a done plate fades, then leaves on its own', () => {
    vi.useFakeTimers();
    for (let i = 0; i < STACK_MAX + 1; i++) pushCard({ x: 0, y: 0, art: 'a', parts: [String(i)] });
    expect(shown()).toEqual(['1', '2', '3']);
    expect(stack.cards[0]).toMatchObject({ parts: ['0'], leaving: true });
    expect(new Set(stack.cards.map((c) => c.n)).size).toBe(STACK_MAX + 1);
    vi.advanceTimersByTime(FADE_MS);
    expect(stack.cards.map((c) => c.parts[0])).toEqual(['1', '2', '3']);
    dropCard(stack.cards[1].n);
    dropCard(stack.cards[1].n); // a second tap while it fades: nothing more
    expect(shown()).toEqual(['1', '3']);
    vi.advanceTimersByTime(FADE_MS);
    expect(stack.cards.map((c) => c.parts[0])).toEqual(['1', '3']);
    dropCard(-1);
    expect(stack.cards).toHaveLength(2);
    clearCards();
    expect(stack.cards).toEqual([]);
  });

  it('a plate with nobody to show it (its names loaded after the island went) is dropped, never shown stale later', () => {
    off();
    pushCard({ x: 0, y: 0, art: 'a', parts: ['late'] });
    expect(stack.cards).toEqual([]);
    off = stackShown();
    pushCard({ x: 0, y: 0, art: 'a', parts: ['now'] });
    expect(shown()).toEqual(['now']);
  });
});
