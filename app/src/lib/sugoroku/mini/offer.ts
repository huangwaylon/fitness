// What a みんなで！ landing offers (docs/sugoroku.md "みんなで！"): the registry's games that have a screen, by the game's
// rules (a game added here changes what a landing deals, so it goes with a wire.ts RULES bump, and a game on older
// rules offers what it did). And the e2e's `?sgMini=<id>` (dev/test only: online.svelte.ts reads the hook): the game's
// first landing, whatever stone, a みんなで！ with that game the first option.
import { MINI_IDS, miniOptions, type MiniId } from './registry.ts';

/** RULES '2' and '3': the ★ four. */
const FIRST: readonly MiniId[] = ['market', 'spell', 'together', 'sort'];
/** The mini-games with a screen (components/mini/): RULES '4' on, every one. */
export const OFFERED: readonly MiniId[] = [...FIRST, 'chain', 'numbers', 'shopping', 'reply'];
/** A game's pool by its rules (none: before '3'), in the registry's order. */
const poolOf = (rules: string | undefined): readonly MiniId[] => MINI_IDS.filter((id) => (Number(rules ?? 0) >= 4 ? OFFERED : FIRST).includes(id));

let forced: MiniId | null = null;
/** The test hook's game (null: none). */
export const forceMini = (id: MiniId | null): void => void (forced = id && OFFERED.includes(id) ? id : null);
/** Whether a landing is the test hook's (none played yet in the game). */
export const forcedHere = (played: readonly unknown[] | undefined): boolean => forced !== null && !played?.length;

/** The lander's two options (registry.ts miniOptions over the games the rules offer; the hook's first, when they do). */
export function offer(played: readonly MiniId[], r: () => number, rules?: string): [MiniId, MiniId] {
  const pool = poolOf(rules), o = miniOptions(played, r, pool);
  if (!forced || !pool.includes(forced)) return o;
  return [forced, o[0] === forced ? o[1] : o[0]];
}
