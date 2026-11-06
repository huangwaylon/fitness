// ききみみ's unit stamps (docs/curriculum-units.md §3, §4, §10; U3): each unit's lesson dots, its stamp, the partner's
// and the 30-day solo recheck, folded from the `listen` rows (progress.ts gamesOf: mine whole, the partner's as
// summaries), never stored. A stamp is contract/listen.ts stampsUnit's: a チェック (l 3) with ≥ 5 of my answers right on
// the first listen, or a co-op one whose team got ≥ 5 (tm); retakeable, it never locks and is never taken away. Quick
// play never moves a unit's dots (only rows with `u` and `l` do). Pure.
import type { LocalDate } from '../types.ts';
import { CHECK_LESSON } from '../contract/listen.ts';
import { dayNum, type Game, type OtherGame } from './progress.ts';
import { LESSONS, LESSON_QS, type Lesson } from './stages.ts';

/** A stamped unit comes back once, about this many days after its stamp, as a 6-question solo recheck (§3, §10). */
export const RECHECK_DAYS = 30;

export interface UnitState {
  /** The lessons played to the end (a row of the lesson with a whole game's answers): the unit's dots. */
  done: Lesson[];
  /** The day it was first stamped (mine), else null. */
  stamped: LocalDate | null;
  /** My own tally next to the stamp (§10): the stamping row's first-listen rights of its questions, and the team's
   *  (tm) when it was a co-op pass; unstamped, my best チェック's. Null before any チェック. */
  tally: { first: number; of: number; tm?: number } | null;
  /** The partner's summary says they stamped it (§4: the `stamped` bit, never their answers). */
  partner: boolean;
  /** Both of us have it: the double stamp. */
  double: boolean;
  /** The 30-day recheck: when it's due, and whether it's done (a solo チェック played on or after that day). */
  recheck: { due: LocalDate; done: boolean } | null;
}

const dayOf = (n: number): LocalDate => new Date(n * 86_400_000).toISOString().slice(0, 10);

const blank = (): UnitState => ({ done: [], stamped: null, tally: null, partner: false, double: false, recheck: null });

/**
 * Every unit I or my partner touched: from my games (in the order played; each lesson's row, `u` and `l`), the dots
 * and my stamp (its first stamping row's day and tally), and from the others' summaries the partner's stamp (a
 * member's: the guest is no one's partner, its stamp no double). The recheck is due RECHECK_DAYS after my stamp, done by a solo チェック
 * on or after it (it never takes the stamp away).
 */
export function unitsOf(mine: readonly Game[], others: readonly OtherGame[]): Map<string, UnitState> {
  const out = new Map<string, UnitState>();
  const of = (u: string) => out.get(u) ?? out.set(u, blank()).get(u)!;
  const checks = new Map<string, Game[]>();
  for (const g of mine) {
    if (g.u === undefined || g.l === undefined || !g.unit) continue;
    const s = of(g.u);
    const lesson = LESSONS[g.l - 1];
    if (lesson && g.unit.of >= LESSON_QS && !s.done.includes(lesson)) s.done.push(lesson);
    if (g.l !== CHECK_LESSON) continue;
    (checks.get(g.u) ?? checks.set(g.u, []).get(g.u)!).push(g);
    const tally = { first: g.unit.first, of: g.unit.of, ...(g.tm !== undefined && { tm: g.tm }) };
    if (g.unit.stamped && !s.stamped) (s.stamped = g.d), (s.tally = tally);
    else if (!s.stamped && (!s.tally || tally.first > s.tally.first)) s.tally = tally;
  }
  for (const o of others) if (o.who !== 'G' && o.stamped && o.u) of(o.u).partner = true;
  for (const [u, s] of out) {
    s.done.sort((a, b) => LESSONS.indexOf(a) - LESSONS.indexOf(b));
    s.double = !!s.stamped && s.partner;
    if (!s.stamped) continue;
    const due = dayNum(s.stamped) + RECHECK_DAYS;
    s.recheck = { due: dayOf(due), done: (checks.get(u) ?? []).some((g) => g.n === 1 && dayNum(g.d) >= due) };
  }
  return out;
}

/** The units whose recheck is due on `today` (stamped ≥ 30 days ago, not rechecked yet): hub card 1's おさらい (§10). */
export const rechecksDue = (units: ReadonlyMap<string, UnitState>, today: LocalDate): string[] =>
  [...units].filter(([, s]) => s.recheck && !s.recheck.done && s.recheck.due <= today).map(([u]) => u);
