// A failed load's next chance (the network gone a moment, a phone waking): the next `online`, the page coming back
// to the front, or a backoff (the `n`-th failure: 2 s × 2ⁿ, at most a minute), whichever comes first. The lazy
// components (lazyComponent.svelte.ts), the food data (food/load.ts, through components/food/foodUi.ts) and the
// island's small chunks try again then.
// (Safari keeps a failed dynamic import for the page's life: a lazy chunk's retry then fails again, and reload.ts
// reloads the page once the site is reachable, which a retry after `online` is the moment for.)

export function nextChance(n: number, base = 2000, max = 60_000): Promise<void> {
  return new Promise((ok) => {
    const doc = globalThis.document;
    const done = () => {
      clearTimeout(timer);
      globalThis.removeEventListener?.('online', done);
      doc?.removeEventListener('visibilitychange', front);
      ok();
    };
    const front = () => doc?.visibilityState === 'visible' && done();
    const timer = setTimeout(done, Math.min(max, base * 2 ** n));
    globalThis.addEventListener?.('online', done);
    doc?.addEventListener('visibilitychange', front);
  });
}
