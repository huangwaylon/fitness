// ききみみ's decks on this phone (game.svelte.ts): the items of each game heard of, by its game, seed, options and unit
// (round/decks.ts gameKey: the session's deck and the UI's are the same items), each dealt by its game's lane from the
// loaded content (round/registry.ts: the chunks it needs, how it deals); and a deck settled on this phone (にがて
// れんしゅう's, the misses again, a solo game's freshest) standing in for its lobby's own. A deck is built only once its
// chunks are in (game.svelte.ts). Here too the games the session knows (`GAMES`): each lane's GameDef over these decks.
import type { Item } from '#lib/kikimimi/bank.ts';
import { gameCvOf, type Unit } from '#lib/kikimimi/pool.ts';
import { Decks, gameKey } from '#lib/kikimimi/round/decks.ts';
import { LANES, type DeckOf, type Phone } from '#lib/kikimimi/round/registry.ts';
import type { Defs } from '#lib/kikimimi/round/session.ts';
import type { GameDef, GameId } from '#lib/kikimimi/round/types.ts';

/** The last decks built (others' lobbies build theirs here as their `open`s come), the game I'm in held, a deck of
 *  mine standing in for its lobby's. */
const decks = new Decks<Item[]>(2);

/** A game's items, dealt by its lane from the loaded content (a game whose lane isn't in: none). */
const deal = (d: DeckOf): Item[] => LANES.of(d.gm)?.deal(d) ?? [];

const keyOf = (d: DeckOf): string => gameKey(d.gm ?? '', d.seed, d.o, d.u) + (LANES.of(d.gm)?.byIds ? `#${(d.ids ?? []).join('.')}` : '');

/** A game's items (outside a game: none). */
export const itemsOf = (d: DeckOf): Item[] => (d.gm ? decks.of(keyOf(d), () => deal(d)) : []);

/** A deck of mine for a lobby kept alone (srs.ts practiceDeck, the misses, a solo game's freshest, a test's): its key
 *  stands for it, as a shared deck's would (nothing goes on the wire). */
export const usePractice = (d: DeckOf, items: Item[]): void => decks.practice(keyOf(d), items);

/** The game I'm in (null: none): its deck held till another is. */
export const pinDeck = (d: DeckOf | null): void => decks.pin(d?.gm ? keyOf(d) : null, () => deal(d!));

/** The chunks a game's deck needs (its lane's: its level's, the ladders', its unit's, its ids' levels). */
export const chunksOf = (gm: GameId, o: readonly number[], u?: string, ids?: readonly number[]): Unit[] => LANES.of(gm)?.chunks({ o, u, ids }) ?? [];

const phone: Phone = { items: itemsOf, cv: gameCvOf };
const DEFS = new Map<GameId, GameDef<unknown>>();

/** The games this phone plays: each loaded lane's GameDef over these decks (a lazy game's once its lane is in). */
export const GAMES: Defs = (gm) => {
  let d = DEFS.get(gm);
  if (!d) {
    const lane = LANES.of(gm);
    if (!lane) return undefined;
    DEFS.set(gm, (d = lane.def(phone)));
  }
  return d;
};
