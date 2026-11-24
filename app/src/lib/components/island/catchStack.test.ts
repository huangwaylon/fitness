import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FADE_MS, OUT_MS, STACK_MAX, clearCards, dropCard, pushCard, pushed, showing, stack, stackShown, type CatchCard } from './catchStack.svelte.ts';

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
    const r = pushed(cards, card(STACK_MAX + 1));
    expect(r.cards.map((c) => c.n)).toEqual([...Array(STACK_MAX + 1).keys()].map((i) => i + 1));
    expect(r.out.map((c) => c.n)).toEqual([1]);
    // one already leaving isn't counted
    expect(pushed([card(1, { leaving: true })], card(2), 1).out).toEqual([]);
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

  it('one shows: a newer one sends the older off quickly (OUT_MS); a done plate fades, then leaves on its own', () => {
    vi.useFakeTimers();
    expect(STACK_MAX).toBe(1);
    pushCard({ x: 0, y: 0, art: 'a', parts: ['0'] });
    pushCard({ x: 0, y: 0, art: 'a', parts: ['1'] });
    pushCard({ x: 0, y: 0, art: 'a', parts: ['2'] });
    expect(shown()).toEqual(['2']);
    expect(stack.cards.filter((c) => c.leaving).every((c) => c.quick)).toBe(true);
    vi.advanceTimersByTime(OUT_MS);
    expect(stack.cards.map((c) => c.parts[0])).toEqual(['2']);
    dropCard(stack.cards[0].n);
    dropCard(stack.cards[0].n); // a second tap while it fades: nothing more
    expect(shown()).toEqual([]);
    expect(stack.cards[0].quick).toBe(false);
    vi.advanceTimersByTime(FADE_MS);
    expect(stack.cards).toEqual([]);
    pushCard({ x: 0, y: 0, art: 'a', parts: ['3'] });
    dropCard(-1);
    expect(stack.cards).toHaveLength(1);
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

  it('a key’s plate while it shows takes the next of its key in place (its line, a hop); leaving, or another key: a new plate', () => {
    vi.useFakeTimers();
    const tomato = (line: string) => ({ x: 0, y: 0, art: 'finds/tomato', parts: [line], key: 'harvest:tomato' });
    pushCard(tomato('×3'));
    pushCard(tomato('×6'));
    pushCard(tomato('×9'));
    expect(stack.cards.map(({ parts, hop }) => [parts[0], hop])).toEqual([['×9', 2]]);
    expect(showing('harvest:tomato')).toBe(true);
    // another key, or a catch with no key, never joins: it sends the tomato off (leaving), so the next tomato is new
    pushCard({ x: 0, y: 0, art: 'finds/carrot', parts: ['carrot ×1'], key: 'harvest:carrot' });
    expect(shown()).toEqual(['carrot ×1']);
    expect(showing('harvest:tomato')).toBe(false);
    pushCard(tomato('×2'));
    expect(shown()).toEqual(['×2']);
    expect(stack.cards.filter((c) => c.key === 'harvest:tomato').map((c) => [c.parts[0], !!c.leaving])).toEqual([['×9', true], ['×2', false]]);
  });
});
