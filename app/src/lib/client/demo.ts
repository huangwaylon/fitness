// Demo (fixture) mode has no rows to recompute from, so an action's optimistic edit also moves the fruit and the
// score here, the way lib/model would (round 5 U3: はい / a tick must visibly change the island at once).
import type { FruitKey, PersonWeekView } from '#lib/types.ts';
import { FRUITS } from '#lib/config/rules.ts';

/** Add `delta` to one of my fruits' counted amount and re-derive its milli, % and my score. */
export function bumpFruit(p: PersonWeekView, key: FruitKey, delta: number): void {
  const f = p.fruits[key];
  if (f.actual === undefined || f.target === undefined || f.target <= 0 || delta === 0) return;
  f.actual = Math.max(0, f.actual + delta);
  f.milli = Math.round(f.maxMilli * Math.min(1, f.actual / f.target));
  f.pct = f.maxMilli > 0 ? Math.floor((f.milli * 100) / f.maxMilli) : 0;
  p.score = Math.floor(FRUITS.reduce((sum, k) => sum + p.fruits[k].milli, 0) / 1000);
}
