// A mini-game's stars (docs/sugoroku.md "みんなで！"): a team game's, so each seat's are its own share of what the
// table made (never ranked, never negative), capped at CAP_PER_SEAT a seat present, and a race's count weighed by the
// seat's level (a beginner's 4 counts as a stronger player's 7).
import type { Who } from '#lib/types.ts';
import type { Hand } from './types.ts';

/** The most stars a mini-game gives, a seat present (about one ことば turn's each, so the team's goal stays reachable,
 *  not given). */
export const CAP_PER_SEAT = 12;

/** The stars as whole non-negative numbers, their sum at most CAP_PER_SEAT × the seats: over it, each seat's cut to
 *  its share (the remainders to the largest, ties by seat order). */
export function capStars(raw: Partial<Record<Who, number>>, seats: readonly Hand[]): Partial<Record<Who, number>> {
  const cap = CAP_PER_SEAT * seats.length;
  const ok = seats.map(({ who }) => [who, Math.max(0, Math.floor(raw[who] ?? 0))] as const).filter(([, n]) => n > 0);
  const sum = ok.reduce((s, [, n]) => s + n, 0);
  if (sum <= cap) return Object.fromEntries(ok);
  const exact = ok.map(([w, n]) => [w, (n * cap) / sum] as const);
  const out = new Map(exact.map(([w, x]) => [w, Math.floor(x)]));
  let left = cap - [...out.values()].reduce((s, n) => s + n, 0);
  for (const [w] of [...exact].sort((a, b) => (b[1] % 1) - (a[1] % 1))) if (left-- > 0) out.set(w, out.get(w)! + 1);
  return Object.fromEntries([...out].filter(([, n]) => n > 0));
}

/** A race's count for the seat's level: what a level's seat does in the time for full marks' worth (PACE), and its
 *  stars, RACE_MAX at most. */
const PACE: Readonly<Record<1 | 2 | 3, number>> = { 1: 8, 2: 10, 3: 12 };
const RACE_MAX = 6;
export const raceStars = (count: number, level: 1 | 2 | 3): number => Math.min(RACE_MAX, Math.round((4 * Math.max(0, count)) / PACE[level]));
