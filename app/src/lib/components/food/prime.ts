// ごはん's opening made ready ahead (the review of 2026-11-24: its first opening of a launch took ~380 ms on a phone, most
// of it its pictures: the index's fetch and parse, the products' part, each sheet's fetch, all through the service
// worker after the tap). At a quiet moment after the launch (island/sheetChunks.ts, with けんこう's chunk) and on each
// return to the app: the day's foods' pictures looked up and
// their sheets' bytes fetched (dbHold.svelte.ts primeFoodPics), so the opening draws them at once. Nothing is held but
// the cells seen and the sheets' bytes cells.ts keeps anyway; the index is let go of again.
import { untrack } from 'svelte';
import { week } from '#lib/store/week.svelte.ts';
import { customs, foodDay, recipes } from '#lib/model/food.ts';
import type { State } from '#lib/model/state.ts';
import type { LocalDate, Who } from '#lib/types.ts';
import { quiet } from '#lib/quiet.ts';
import { primeFoodPics } from './dbHold.svelte.ts';
import { setCustomPics } from './customPics.svelte.ts';
import { recipeIdOf } from './foodUi.ts';

/** Whose days the opening may show first: this phone's person's (the default), the others' (whose pick, a tree's). */
const WHO: readonly Who[] = ['A', 'B', 'G'];

/** The foods `date` draws pictures of, everyone's: each entry's, and a recipe's ingredients (its plate). Pure. */
export function dayFoodIds(s: State, date: LocalDate): string[] {
  const byId = new Map(recipes(s).map((r) => [r.id, r]));
  const ids = new Set<string>();
  for (const w of WHO) {
    for (const e of foodDay(s, w, date).entries) {
      ids.add(e.f.id);
      const rid = recipeIdOf(e.f.id);
      for (const x of (rid && byId.get(rid)?.it) || []) ids.add(x.f.id);
    }
  }
  return [...ids];
}

/** A quiet moment: an idle callback, or (Safari has none) just after a frame. */
const idle = (f: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 3000 }) : requestAnimationFrame(() => setTimeout(f, 0)));
/** Tries while the record isn't in yet (a launch's first sync), a few seconds apart. */
const TRIES = 5, RETRY_MS = 3000;
let started = false;

function prime(tries = TRIES): void {
  idle(() => {
    const m = untrack(() => week.model), today = untrack(() => week.view?.today);
    if (!m || !today) return void (tries > 1 && setTimeout(() => prime(tries - 1), RETRY_MS));
    setCustomPics(customs(m.state));
    void quiet(primeFoodPics(dayFoodIds(m.state, today)), 'food.prime');
  });
}

/** Once a page's life (sheetChunks' prefetch): now, and again each time the app is shown (the day may have moved on, or
 *  the partner logged). */
export function primeFood(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  prime();
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && prime());
}
