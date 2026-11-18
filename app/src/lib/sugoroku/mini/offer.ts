// What a みんなで！ landing offers (docs/sugoroku.md "みんなで！"): the registry's games that have a screen (OFFERED: a game
// whose logic is in before its UI is never offered). Part of the rules: a game added here changes what a landing deals,
// so it goes with a wire.ts RULES bump. And the e2e's `?sgMini=<id>` (dev/test only: online.svelte.ts reads the hook):
// the game's first landing, whatever stone, a みんなで！ with that game the first option.
import { MINI_IDS, miniOptions, type MiniId } from './registry.ts';

/** The mini-games with a screen (components/mini/). */
export const OFFERED: readonly MiniId[] = ['market', 'spell', 'together', 'sort'];
const POOL = MINI_IDS.filter((id) => OFFERED.includes(id));

let forced: MiniId | null = null;
/** The test hook's game (null: none). */
export const forceMini = (id: MiniId | null): void => void (forced = id && POOL.includes(id) ? id : null);
/** Whether a landing is the test hook's (none played yet in the game). */
export const forcedHere = (played: readonly unknown[] | undefined): boolean => forced !== null && !played?.length;

/** The lander's two options (registry.ts miniOptions over the games offered; the hook's first). */
export function offer(played: readonly MiniId[], r: () => number): [MiniId, MiniId] {
  const o = miniOptions(played, r, POOL);
  if (!forced) return o;
  return [forced, o[0] === forced ? o[1] : o[0]];
}
