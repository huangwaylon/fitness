// The catch plates showing now (docs/design.md "Scene interactions"): one stack at the bottom centre of the screen
// for every catch and find (mine, the partner's, the guest's), the newest at the bottom; the older ones slide up, and
// each goes on its own timer (Plate.svelte) or on a tap: it fades out (FADE_MS, `leaving`), then leaves the stack. At
// most STACK_MAX show: a newer one fades the oldest out early. CatchStack.svelte draws it; catchCard.ts fills it.

export type CatchWho = 'mine' | 'partner' | 'third';
export interface CatchCard { n: number; x: number; y: number; art: string; parts: string[]; who?: CatchWho; leaving?: boolean }

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

/** A new plate at the bottom (its own number). */
export function pushCard(card: Omit<CatchCard, 'n'>) {
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
