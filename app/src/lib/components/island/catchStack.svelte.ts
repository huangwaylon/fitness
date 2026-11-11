// The catch plates showing now (docs/design.md "Scene interactions"): one stack at the bottom centre of the screen
// for every catch and find (mine, the partner's, the guest's), the newest at the bottom; the older ones slide up, and
// each goes on its own timer (Plate.svelte) or on a tap: it fades out (FADE_MS, `leaving`), then leaves the stack. At
// most STACK_MAX show: a newer one fades the oldest out early. One with a `key` (a crop's harvest) joins its showing
// plate of that key instead: its line replaced, it hops (Plate's `hop`). CatchStack.svelte draws it; catchCard.ts fills it.

export type CatchWho = 'mine' | 'partner' | 'third';
export interface CatchCard {
  n: number; x: number; y: number; art: string; parts: string[]; who?: CatchWho; leaving?: boolean;
  /** Plates of a key are one while it shows (harvestPlate.ts `harvest:<crop>`); `hop`: how many joined it. */
  key?: string; hop?: number;
}

/** How many plates show at once. */
export const STACK_MAX = 3;
/** A plate's fade out (ms; reduced motion: a quick one). */
export const FADE_MS = 320;
const fadeMs = () => (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 120 : FADE_MS);

export const stack = $state<{ cards: CatchCard[] }>({ cards: [] });
let seq = 0;
const gone = new Set<ReturnType<typeof setTimeout>>();

/** The stack with `card` added at the bottom, and the showing cards it pushes out (the oldest first): past `max`
 *  showing (the leaving ones not counted). Pure. */
export function pushed(cards: readonly CatchCard[], card: CatchCard, max = STACK_MAX): { cards: CatchCard[]; out: CatchCard[] } {
  const all = [...cards, card], showing = all.filter((c) => !c.leaving);
  return { cards: all, out: showing.slice(0, Math.max(0, showing.length - max)) };
}

/** The stack with `card`'s line on the showing plate of its key (one more hop), or null: none of its key shows. Pure. */
function merged(cards: readonly CatchCard[], card: Omit<CatchCard, 'n'>): CatchCard[] | null {
  const i = card.key ? cards.findIndex((c) => c.key === card.key && !c.leaving) : -1;
  return i < 0 ? null : cards.map((c, j) => (j === i ? { ...c, art: card.art, parts: card.parts, hop: (c.hop ?? 0) + 1 } : c));
}

/** A plate of `key` shows (not leaving). */
export const showing = (key: string): boolean => stack.cards.some((c) => c.key === key && !c.leaving);

/** Fade `out` away, then take them off the stack. */
function leave(out: readonly CatchCard[]) {
  if (!out.length) return;
  const ns = new Set(out.map((c) => c.n));
  stack.cards = stack.cards.map((c) => (ns.has(c.n) ? { ...c, leaving: true } : c));
  const id = setTimeout(() => {
    gone.delete(id);
    stack.cards = stack.cards.filter((c) => !ns.has(c.n));
  }, fadeMs());
  gone.add(id);
}

/** How many CatchStacks are up: none (the island left), a plate has nobody to show it or run its timer. */
let shownBy = 0;
/** A CatchStack is up (till the returned call). */
export function stackShown(): () => void {
  shownBy++;
  let on = true;
  return () => void (on && ((on = false), shownBy--));
}

/** A new plate at the bottom (its own number), or its key's showing one updated; dropped while no stack is up (a
 *  catch's names loaded after the island went: never shown stale on the next visit). */
export function pushCard(card: Omit<CatchCard, 'n'>) {
  if (!shownBy) return;
  const m = merged(stack.cards, card);
  if (m) return void (stack.cards = m);
  const r = pushed(stack.cards, { ...card, n: ++seq });
  stack.cards = r.cards;
  leave(r.out);
}

/** Plate `n` is done (its timer, a tap). */
export const dropCard = (n: number) => leave(stack.cards.filter((c) => c.n === n && !c.leaving));

/** Every plate gone at once (the island left). */
export function clearCards() {
  for (const id of gone) clearTimeout(id);
  gone.clear();
  stack.cards = [];
}
