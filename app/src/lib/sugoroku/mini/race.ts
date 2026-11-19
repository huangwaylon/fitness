// The count race of the two stream games (なかま分け sort.ts, 数字キャッチ numbers.ts): one play a seat at the end, its
// count (`n`, capped at the stream's length): the first counts; over once every seat dealt in has sent one; each
// seat's stars by its count at its level's pace (stars.ts raceStars), a seat that sent none: お休み.
import type { Who } from '#lib/types.ts';
import { raceStars } from './stars.ts';
import type { Hand, MiniGame, Result } from './types.ts';

export interface RaceState {
  seats: readonly Hand[];
  /** Each seat's count, once sent. */
  counts: Partial<Record<Who, number>>;
}

export function countRace<S extends RaceState>(cap: number): Omit<MiniGame<S>, 'deal'> {
  return {
    play(s, who, p) {
      if (p.n === undefined || !s.seats.some((x) => x.who === who) || s.counts[who] !== undefined) return s;
      return { ...s, counts: { ...s.counts, [who]: Math.min(p.n, cap) } };
    },
    done: (s) => s.seats.every((x) => s.counts[x.who] !== undefined),
    close(s): Result {
      const stars: Partial<Record<Who, number>> = {};
      for (const x of s.seats) {
        const n = s.counts[x.who];
        if (n !== undefined && raceStars(n, x.level) > 0) stars[x.who] = raceStars(n, x.level);
      }
      return { stars, made: [] };
    }
  };
}
