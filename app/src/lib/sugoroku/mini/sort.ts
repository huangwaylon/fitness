// ★4 なかま分け — Sort Rush (docs/sugoroku.md "みんなで！"): two bins (food | animals), 30 s, each phone its own stream of
// pictures with their words (むずかしい: the word only) to sort; each seat's count adds to the team's (the live total:
// `sgv` frames, the sheet's). The count race (race.ts): one play a seat at the end, stars by the level's pace. A miss
// shows the right bin (never a lost point).
import { seeded, shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { PICTURES, tierOf } from '../pictures.ts';
import { PAIRS, type SetId } from './categories.ts';
import { countRace, type RaceState } from './race.ts';
import type { Deal, Hand, MiniGame } from './types.ts';

/** A seat's stream's length (more than anyone sorts in 30 s); its tiers by level. */
export const SORT_STREAM = 40;
const SORT_TIERS: Readonly<Record<1 | 2 | 3, readonly number[]>> = { 1: [1], 2: [1, 2], 3: [2, 3] };

export interface SortState extends RaceState {
  seed: string;
  seats: Hand[];
  /** Each seat's bins (the same for the seats of one band: やさしい・ふつう far, むずかしい close). */
  pairs: Partial<Record<Who, readonly [SetId, SetId]>>;
}

const bandOf = (level: number): 'far' | 'close' => (level >= 3 ? 'close' : 'far');

/** A seat's pictures to sort, in order (PICTURES' indices): the pair's sets at the seat's tiers, shuffled, again
 *  when they run out. Every phone the same for the seat. */
export function sortStream(s: SortState, who: Who): number[] {
  const seat = s.seats.find((x) => x.who === who), pair = s.pairs[who];
  if (!seat || !pair) return [];
  const r = seeded(`${s.seed}:sort:${who}`), tiers = SORT_TIERS[seat.level];
  let pool = PICTURES.map((p, i) => ({ p, i })).filter(({ p }) => pair.includes(p.set as SetId) && tiers.includes(tierOf(p))).map(({ i }) => i);
  if (pool.length < 8) pool = PICTURES.map((p, i) => ({ p, i })).filter(({ p }) => pair.includes(p.set as SetId)).map(({ i }) => i);
  const out: number[] = [];
  while (out.length < SORT_STREAM && pool.length) out.push(...shuffle([...pool], r));
  return out.slice(0, SORT_STREAM);
}
/** The bin a picture goes in (0 or 1; -1 neither). */
export const binOf = (pair: readonly [SetId, SetId], item: number): number => pair.indexOf(PICTURES[item]?.set as SetId);

export const sort: MiniGame<SortState> = {
  deal(d: Deal): SortState {
    const pairs: SortState['pairs'] = {};
    for (const s of d.seats) {
      const list = PAIRS[bandOf(s.level)], r = seeded(`${d.seed}:pair:${bandOf(s.level)}`);
      const [a, b] = list[Math.floor(r() * list.length)];
      pairs[s.who] = r() < 0.5 ? [a, b] : [b, a];
    }
    return { seed: d.seed, seats: [...d.seats], pairs, counts: {} };
  },
  ...countRace<SortState>(SORT_STREAM)
};
