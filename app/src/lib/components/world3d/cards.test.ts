// The cards' art (cards.ts): what holds the launch's `shown` (pending) is a card still waiting on its art, never one
// gone or one whose art failed; an art asked for ahead (prefetchArt) is the one the next island's cards take.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Scene } from 'three';

/** The images asked for, each loaded or failed when told. */
const imgs: FakeImage[] = [];
class FakeImage {
  src = '';
  crossOrigin = '';
  fetchPriority = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    imgs.push(this);
  }
}
const gradient = { addColorStop: () => {} };
const canvas = { width: 0, height: 0, getContext: () => ({ createRadialGradient: () => gradient, fillRect: () => {}, fillStyle: '' }) };

beforeEach(() => {
  imgs.length = 0;
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('document', { createElement: () => canvas });
});
afterEach(() => vi.unstubAllGlobals());

const spec = (url: string) => ({ url, aspect: 0.6, h: 30, x: 0, z: 0 });
const settle = () => new Promise((ok) => setTimeout(ok));

describe('cards', () => {
  it('pending: the cards still waiting on their art; not one gone, nor one whose art failed', async () => {
    const { createCards } = await import('./cards.ts');
    const cards = createCards(new Scene(), () => {});
    cards.set('a', spec('/art/villagers/goldie.webp'));
    cards.set('b', spec('/art/villagers/anchovy.webp'));
    cards.set('c', spec('/art/villagers/judy.webp'));
    expect(cards.pending()).toBe(3);
    // (a's model came first: its card goes, its art still loading)
    cards.set('a', null);
    expect(cards.pending()).toBe(2);
    imgs.find((i) => i.src.includes('anchovy'))!.onload!();
    imgs.find((i) => i.src.includes('judy'))!.onerror!();
    await settle();
    expect(cards.pending()).toBe(0);
    expect(imgs.every((i) => i.fetchPriority === 'high')).toBe(true);
    cards.dispose();
  });

  it('an art asked for ahead is taken by the next cards: one request, and not pending till a card asks for it', async () => {
    const { createCards, prefetchArt } = await import('./cards.ts');
    prefetchArt(['/art/villagers/goldie.webp', '/art/villagers/goldie.webp']);
    expect(imgs).toHaveLength(1);
    const cards = createCards(new Scene(), () => {});
    expect(cards.pending()).toBe(0);
    cards.set('a', spec('/art/villagers/goldie.webp'));
    expect(imgs).toHaveLength(1);
    expect(cards.pending()).toBe(1);
    imgs[0].onload!();
    await settle();
    expect(cards.pending()).toBe(0);
    // (taken: the cards after these ask again)
    const next = createCards(new Scene(), () => {});
    next.set('a', spec('/art/villagers/goldie.webp'));
    expect(imgs).toHaveLength(2);
    cards.dispose();
    next.dispose();
  });
});
