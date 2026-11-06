// The quiz's lane (round/registry.ts): a level's 8 questions (deck.ts) from its level's chunk, the host's seed the one
// whose deck overlaps my last games least, and a game I start alone its own deck (the items not heard lately first).
// Here too the quiz family's source over the phone's decks (スピード はしご's and a lesson's lanes share it).
import { deck } from '../../deck.ts';
import { itemDur } from '../../clips.ts';
import type { Item, Level } from '../../bank.ts';
import type { Unit } from '../../pool.ts';
import { agesOf, freshSeed, seedWith } from '../../recent.ts';
import type { DeckOf, Lane, Phone } from '../../round/registry.ts';
import { quizGame, quizOpts, type QuizOpts, type QuizSource } from './def.ts';
import { roundOf, type QuizRound } from './kinds.ts';

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

/** The quiz family's source over the phone's decks: a deck's rounds, and its cv by the deck's first chunk. */
export const quizSource = (phone: Phone, chunks: Lane['chunks']): QuizSource => ({
  rounds: (gm, seed, o, u) => roundsOf(phone.items({ gm, seed, o, u })),
  cv: (gm, o, u) => {
    const c = chunks({ o, u })[0];
    return c === undefined ? undefined : phone.cv(gm, c);
  }
});

const levelOf = (o: readonly number[]): Level | undefined => quizOpts.decode(o)?.lv as Level | undefined;
const chunks = ({ o }: Omit<DeckOf, 'gm' | 'seed'>): Unit[] => {
  const lv = levelOf(o);
  return lv ? [lv] : [];
};

export const quizLane: Lane<QuizOpts> = {
  id: 'quiz',
  def: (phone) => quizGame(quizSource(phone, chunks)),
  chunks,
  deal: (d) => {
    const lv = levelOf(d.o);
    return lv ? deck(d.seed, lv) : [];
  },
  seed: ({ o, flags, random }, recent) => {
    const lv = levelOf(o);
    return lv ? freshSeed({ random, flags, recent, ids: (s) => deck(s, lv).map((it) => it.id) }) : seedWith(random, flags);
  },
  solo: (d, recent) => {
    const lv = levelOf(d.o);
    return lv ? deck(d.seed, lv, undefined, agesOf(recent)) : [];
  }
};
