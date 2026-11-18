// A game started from だれが遊ぶ？ (Setup), the tab's (SugorokuMenu) and the results' もう一度遊ぶ (SugorokuPlay): the
// table's seats, and a passed-round game's board of another family than the last game's; the speech test's page.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { now } from '#lib/time/clock.ts';
import { hook } from '#lib/world/devHooks.ts';
import type { Who } from '#lib/types.ts';
import { familyOfKey, layoutKey } from './family.ts';
import { newGame, type Game, type Length, type Level, type Seat } from './game.ts';
import { nameOf } from './online.svelte.ts';
import { RULES } from './wire.ts';

/** Who can play: the three of us, each as their own character (the island's look), me first. */
export const peopleFor = (me: Who): Who[] => (me === 'B' ? ['B', 'A', 'G'] : me === 'G' ? ['G', 'A', 'B'] : ['A', 'B', 'G']);

/** The seats picked, in order, each at its level (普通 till changed). */
export const seatsFor = (ws: readonly Who[], levels: Partial<Record<Who, Level>>): Seat[] => ws.map((who) => ({ who, name: nameOf(who), level: levels[who] ?? 2 }));

/** A passed-round game: its board's family not `last`'s (two games in a row look different; `?sgSeed=` the e2e's,
 *  pinned). */
export function newLocal(seats: readonly Seat[], length: Length, last: Game | null): Game {
  const seed = hook('sgSeed') || `${now()}:${seats.map((x) => x.who).join(',')}`, was = familyOfKey(last?.layout);
  let lay = seed;
  for (let k = 1; k < 20 && was && familyOfKey(layoutKey(lay)) === was; k++) lay = `${seed}~${k}`;
  return newGame(seats, seed, length, layoutKey(lay), RULES);
}

/** The speech test's page (docs/speech-test.md), the page's own query kept (?demo, the e2e's hooks). */
export const toSpeech = (): Promise<void> => goto(`${resolve('/speech')}${location.search}`);
