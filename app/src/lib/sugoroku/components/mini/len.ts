// みんなで！'s lengths on the sheet (docs/sugoroku.md "みんなで！"): a game's, a hot seat's turn, a 伝えて当てて round, a
// quiet seat's wait; `?sgMiniMs=<ms>` (dev/test only: devHooks) is every one of them, so an e2e plays a game in seconds.
import { hook } from '#lib/world/devHooks.ts';
import { GRACE_MS, miniTimes, type MiniTimes } from '../../mini/clock.ts';

/** A 伝えて当てて round's step (the speller's, then the finders'): its timer moves it on (mini/spell.ts). */
export const ROUND_MS = 20_000;
/** みんなで一文: a seat whose word is next and that hasn't played this long has its cards made everyone's. */
export const QUIET_MS = 15_000;
/** やさしい's ヒント in ことばの市場: one each this long. */
export const HINT_MS = 15_000;

/** `base`, or the test hook's length. */
export function lenOf(base: number): number {
  const t = Number(hook('sgMiniMs'));
  return Number.isFinite(t) && t >= 500 && t <= 120_000 ? t : base;
}

/** A game's times from its open (mini/clock.ts miniTimes: the 3-2-1, its length, the close's grace); with the test hook
 *  a 1 s countdown. */
export function timesOf(opened: number, ms: number): MiniTimes {
  if (!hook('sgMiniMs')) return miniTimes(opened, ms);
  const start = opened + 1000;
  return { start, end: start + ms, close: start + ms + GRACE_MS };
}
