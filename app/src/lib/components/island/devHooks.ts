// The island's dev hooks (docs/design.md "Dev params"): URL params that force a visitor, the weather, a critter… for
// testing and the e2e. They work in dev builds or with `?demo` only, so a live phone never sees them. Read on each call
// (cheap), so a navigation that drops the query string drops the hooks with it. The seasonal ones (`?event=`,
// `?weather=`, `?fireworks`, `?shower`, `?season=`, `?theme=`) are the preview's: ui-state/preview.svelte.ts.
import { hooksOn as on } from '#lib/ui-state/preview.ts';
import { ISLAND_SEED } from './daySeed.ts';

const query = (): URLSearchParams => new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

/** Whether the hooks apply: a dev build, or `?demo`. */
export const hooksOn = (q: URLSearchParams = query()): boolean => on(q);

/** The island's ambient life, by the hook that turns each off: the critters' visits (sea fish and bubbles, fresh-water
 *  shadows, bugs), the day's visitor (an event's still comes: visitors.ts), the balloon present, the idle beats of the
 *  villagers, しずえ and a visitor (looks, hops, tree shakes, strolls, outings: idleLife.svelte.ts) and an ordinary
 *  night's shooting stars. The villagers stay, where they are, and dozing at night; the opening beats and the events
 *  too. */
const AMBIENT: Readonly<Record<string, string>> = { critter: 'none', visitor: 'events', balloon: 'none', idle: 'none', stars: 'none' };

/** The e2e's ambient life off (`localStorage['e2e.ambient'] = 'off'`: e2e/fixtures.ts, every test unless
 *  `test.use({ ambient: 'on' })`; docs/ops/testing.md "Hermetic"): each of AMBIENT's hooks reads its off value when
 *  the URL doesn't set it. With the hooks on only, as the URL's; a live phone never sets it. */
function ambientOff(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('e2e.ambient') === 'off';
  } catch {
    return false;
  }
}

/** A hook's value (`''` for a bare `?flag`), or null when it isn't set or the hooks are off. */
export function hook(name: string): string | null {
  const q = query();
  if (!hooksOn(q)) return null;
  const v = q.get(name);
  return v === null && Object.hasOwn(AMBIENT, name) && ambientOff() ? AMBIENT[name] : v;
}

/** Whether a hook is set (`?flag` or `?flag=…`). */
export const hookFlag = (name: string): boolean => hook(name) !== null;

/** A hook's value when it is one of `allowed`, else null. */
export function hookOneOf<T extends string>(name: string, allowed: readonly T[]): T | null {
  const v = hook(name);
  return v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

/** The island's seed: `?seed=` with the hooks on, else ISLAND_SEED. */
export const islandSeed = (): string => hook('seed') || ISLAND_SEED;
