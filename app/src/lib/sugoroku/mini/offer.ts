// What a みんなで！ landing offers (docs/sugoroku.md "みんなで！"): two of the registry's games (a game added there changes
// what a landing deals, so it goes with a wire.ts RULES bump). And the e2e's `?sgMini=<id>[,<id>…]` (dev/test only:
// online.svelte.ts reads the hook): the game's first landings, whatever stone, each a みんなで！ with the list's next game
// the first option.
import { isMiniId, miniOptions, type MiniId } from './registry.ts';

let forced: readonly MiniId[] = [];
/** The test hook's games, in order (a comma list; none or one not a game: none). */
export function forceMini(ids: string | null): void {
  const list = (ids ?? '').split(',').filter(Boolean);
  forced = list.length && list.every(isMiniId) ? list : [];
}
/** Whether a landing is the test hook's (fewer played yet in the game than it lists). */
export const forcedHere = (played: readonly unknown[] | undefined): boolean => (played?.length ?? 0) < forced.length;

/** The lander's two options (registry.ts miniOptions; the hook's next first). */
export function offer(played: readonly MiniId[], r: () => number): [MiniId, MiniId] {
  const o = miniOptions(played, r), f = forced[played.length];
  if (!f) return o;
  return [f, o[0] === f ? o[1] : o[0]];
}
