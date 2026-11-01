// The island's dev hooks (docs/design.md "Dev params"): URL params that force a visitor, the weather, a critter… for
// testing and the e2e. They work in dev builds or with `?demo` only, so a live phone never sees them. Read on each call
// (cheap), so a navigation that drops the query string drops the hooks with it.
import { ISLAND_SEED } from './daySeed.ts';

const query = (): URLSearchParams => new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

/** Whether the hooks apply: a dev build, or `?demo`. */
export const hooksOn = (q: URLSearchParams = query()): boolean => import.meta.env.DEV || q.has('demo');

/** A hook's value (`''` for a bare `?flag`), or null when it isn't set or the hooks are off. */
export function hook(name: string): string | null {
  const q = query();
  return hooksOn(q) ? q.get(name) : null;
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
