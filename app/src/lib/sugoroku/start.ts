// A game started from だれが遊ぶ？ (Setup), the tab's (SugorokuMenu) and the results' もう一度遊ぶ (SugorokuPlay): the
// table's seats, and a passed-round game's board of another family than the last game's; the speech test's page.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { now } from '#lib/time/clock.ts';
import { hook } from '#lib/world/devHooks.ts';
import type { Who } from '#lib/types.ts';
import { familyOfKey, layoutKey } from './family.ts';
import { newGame, type Game, type Length, type Level, type Seat } from './game.ts';
import { nameOf, startOnline } from './online.svelte.ts';
import { RULES, firstSeat, seatsOf } from './wire.ts';

/** Who can play: the three of us, each as their own character (the island's look), me first. */
export const peopleFor = (me: Who): Who[] => (me === 'B' ? ['B', 'A', 'G'] : me === 'G' ? ['G', 'A', 'B'] : ['A', 'B', 'G']);

/** The seats picked, in order, each at its level (普通 till changed). */
export const seatsFor = (ws: readonly Who[], levels: Partial<Record<Who, Level>>): Seat[] => ws.map((who) => ({ who, name: nameOf(who), level: levels[who] ?? 2 }));

/** A passed-round game: its board's family not `last`'s (two games in a row look different), who goes first drawn
 *  from its seed (wire.ts firstSeat; `?sgSeed=` the e2e's, pinned). */
export function newLocal(seats: readonly Seat[], length: Length, last: Game | null): Game {
  const pinned = hook('sgSeed'), seed = pinned || `${now()}:${seats.map((x) => x.who).join(',')}`, was = familyOfKey(last?.layout);
  let lay = seed;
  for (let k = 1; k < 20 && was && familyOfKey(layoutKey(lay)) === was; k++) lay = `${seed}~${k}`;
  return newGame(firstSeat(seats, seed, pinned ? (hook('sgFirst') ?? '0') : null), seed, length, layoutKey(lay), RULES);
}

/** The e2e's new game on the game's own screen (`?sgNew=<seats>`, e.g. A2B2, test mode only: devHooks), the island
 *  never booted: passed round, a game to play when none is saved; online, a start sent when none is held (`?sgId` its
 *  id). */
export function hookStart(screen: 'local' | 'online', held: boolean): Game | null {
  const seats = hook('sgNew');
  if (!seats || held) return null;
  if (screen === 'online') {
    startOnline(seats, 'n');
    return null;
  }
  return newLocal(seatsOf(seats).map((x) => ({ who: x.who, name: nameOf(x.who), level: x.level })), 'normal', null);
}

/** The speech test's page (docs/speech-test.md), the page's own query kept (?demo, the e2e's hooks). */
export const toSpeech = (): Promise<void> => goto(`${resolve('/speech')}${location.search}`);
