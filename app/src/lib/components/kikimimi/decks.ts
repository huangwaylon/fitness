// ききみみ's decks on this phone (game.svelte.ts): the items of each game heard of, by its game, seed, options and unit
// (round/decks.ts gameKey: the session's deck and the UI's are the same items), dealt from the loaded content: a
// quiz's level (deck.ts), スピード はしご's ladders, a unit's lesson (lesson.ts, over its chunk); and a deck settled on
// this phone (にがて れんしゅう's, the misses again, a solo game's freshest) standing in for its lobby's own. A deck is
// built only once its chunk is in (game.svelte.ts). Here too the games the session knows (`GAMES`), over these decks.
import { deck } from '#lib/kikimimi/deck.ts';
import { ladderDeck } from '#lib/kikimimi/ladder.ts';
import { lessonDeck } from '#lib/kikimimi/lesson.ts';
import { itemDur } from '#lib/kikimimi/clips.ts';
import { ladders, unitPart, type Unit } from '#lib/kikimimi/pool.ts';
import type { Item, Level } from '#lib/kikimimi/bank.ts';
import { Decks, gameKey } from '#lib/kikimimi/round/decks.ts';
import { registry } from '#lib/kikimimi/round/registry.ts';
import type { GameId } from '#lib/kikimimi/round/types.ts';
import { quizGame, quizOpts, type QuizSource } from '#lib/kikimimi/games/quiz/def.ts';
import { ladderGame } from '#lib/kikimimi/games/ladder/def.ts';
import { lessonGame, lessonOpts } from '#lib/kikimimi/games/lesson/def.ts';
import { roundOf, type QuizRound } from '#lib/kikimimi/games/quiz/kinds.ts';

/** A game's deck as the view names it: its game, seed, options (as on the wire) and unit. */
export interface DeckOf {
  gm: GameId | null;
  seed: number;
  o: readonly number[];
  u?: string;
}

/** The last decks built (others' lobbies build theirs here as their `open`s come), the game I'm in held, a deck of
 *  mine standing in for its lobby's. */
const decks = new Decks<Item[]>(2);

/** A game's items, dealt from the loaded content. */
function deal(d: DeckOf): Item[] {
  if (d.gm === 'ladder') return ladderDeck(d.seed, ladders());
  if (d.gm === 'lesson') {
    const o = lessonOpts.decode(d.o), part = d.u ? unitPart(d.u) : undefined;
    return o && part ? lessonDeck(part, o.lesson, d.seed, o.tier) : [];
  }
  const o = quizOpts.decode(d.o);
  return d.gm === 'quiz' && o ? deck(d.seed, o.lv) : [];
}

const keyOf = (d: DeckOf): string => gameKey(d.gm ?? '', d.seed, d.o, d.u);

/** A game's items (outside a game: none). */
export const itemsOf = (d: DeckOf): Item[] => (d.gm ? decks.of(keyOf(d), () => deal(d)) : []);

/** A deck of mine for a lobby kept alone (srs.ts practiceDeck, the misses, a solo game's freshest, a test's): its key
 *  stands for it, as a shared deck's would (nothing goes on the wire). */
export const usePractice = (d: DeckOf, items: Item[]): void => decks.practice(keyOf(d), items);

/** The game I'm in (null: none): its deck held till another is. */
export const pinDeck = (d: DeckOf | null): void => decks.pin(d?.gm ? keyOf(d) : null, () => deal(d!));

/** The chunks a game's deck needs: its level's, the ladders', or its unit's. */
export function chunksOf(gm: GameId, o: readonly number[], u?: string): Unit[] {
  if (gm === 'ladder') return ['ladder'];
  if (gm === 'lesson') return u ? [u as Unit] : [];
  const q = quizOpts.decode(o);
  return q ? [q.lv as Level] : [];
}

/** A deck's items as its rounds, each with its clip's length as played (clips.json: a dialogue's lines and the gaps;
 *  2 s while unknown). Kept per deck: the session reads them at every call. */
const ROUNDS = new WeakMap<readonly Item[], readonly QuizRound[]>();
function roundsOf(items: readonly Item[]): readonly QuizRound[] {
  let rs = ROUNDS.get(items);
  if (!rs) {
    rs = items.map((it) => {
      const s = itemDur(it);
      return roundOf(it, s === undefined ? undefined : Math.round(s * 1000));
    });
    ROUNDS.set(items, rs);
  }
  return rs;
}

const source: QuizSource = { rounds: (gm, seed, o, u) => roundsOf(itemsOf({ gm, seed, o, u })) };

/** The games this phone plays: the quiz, スピード はしご and a unit's lesson, over these decks. */
export const GAMES = registry([quizGame(source), ladderGame(source), lessonGame(source)]);
