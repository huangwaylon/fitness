// みみ チェック, the placement check, as a GameDef (docs/curriculum.md §10; docs/kikimimi-framework.md §7 #11;
// docs/kikimimi-ux.md §6.12): about 12 items drawn from the levels' voiced items across the places and sub-skills,
// adaptive (GameDef.next: each round picked from the answers so far), solo, nothing on the wire.
//
// The walk: it starts at かわ (B1+), goes up a band after 2 right in a row and down after 1 wrong, and stops after two
// reversals (at least CHECK_MIN items) or at CHECK_MAX. The skills take turns (CHECK_SEQ: すうじ, つながる おと, へんじ,
// にた おと, one gist). The result is the placed band (the reversals' mean, rounded down: a place where the answers
// still came) as a starting stage, and a band per skill (its answers' bands, a miss a band lower) for とくい / これから.
// It's written on the `listen` row as `gm` 'check', `lv` the placed level and `u` the profile (one digit a skill).
// Pure.
import { mulberry32 } from '#lib/random.ts';
import { levelRank } from '../../bank.ts';
import type { ListenRow } from '../../../contract/listen.ts';
import { placeOfLv, type Place } from '../../catalog.ts';
import type { GameDef } from '../../round/types.ts';
import { quizDeck, quizOpts, type QuizOpts } from '../quiz/def.ts';
import type { QuizRound } from '../quiz/kinds.ts';

/** The bands, easiest first: each one's quiz level (はまべ 1, はまべ 2, かわ, もり, やま, ほし). */
export const BANDS: readonly number[] = [1, 2, 3, 4, 6, 7];
/** Where the walk starts: かわ (B1+, the learners' level: curriculum §10). */
export const START_BAND = 2;
/** The check's length: at least this many items, at most that many. */
export const CHECK_MIN = 8;
export const CHECK_MAX = 12;

/** The sub-skills the check samples (its profile's order): すうじ, つながる おと, へんじ・ほんね, にた おと (L/R, vowels,
 *  consonants), だいたいの ないよう (a dialogue's gist; a picture's key word below もり). */
export const CHECK_SKILLS = ['num', 'reduce', 'reply', 'pair', 'gist'] as const;
export type CheckSkill = (typeof CHECK_SKILLS)[number];
/** Which skill each item samples, in turn: the long gist once, the others two or three times. */
export const CHECK_SEQ: readonly CheckSkill[] = ['num', 'reduce', 'reply', 'pair', 'gist', 'num', 'reply', 'pair', 'reduce', 'num', 'pair', 'reply'];

/** A level's band (levelRank's scale: アナウンス's 5 as もり). */
const bandOfLv = (lv: number): number => Math.max(0, Math.min(BANDS.length - 1, levelRank(lv) - 1));

/** Where the walk is after these answers: the band of the next item, the bands each answer was at, the reversals
 *  (the band where the walk turned), and whether it stops here. */
export interface Walk {
  band: number;
  at: number[];
  reversals: number[];
  stop: boolean;
}

export function walkOf(oks: readonly boolean[]): Walk {
  let band = START_BAND, streak = 0, dir = 0;
  const at: number[] = [], reversals: number[] = [];
  const move = (d: number) => {
    if (dir !== 0 && d !== dir) reversals.push(band);
    dir = d;
    band += d;
  };
  for (const ok of oks) {
    at.push(band);
    if (!ok) {
      streak = 0;
      if (band > 0) move(-1);
    } else if (++streak >= 2) {
      streak = 0;
      if (band < BANDS.length - 1) move(1);
    }
  }
  const stop = oks.length >= CHECK_MAX || (reversals.length >= 2 && oks.length >= CHECK_MIN);
  return { band, at, reversals, stop };
}

/** The placed band: the reversals' mean rounded down (none: where the walk got to). */
export function placedBand(oks: readonly boolean[]): number {
  const w = walkOf(oks);
  return w.reversals.length ? Math.floor(w.reversals.reduce((s, b) => s + b, 0) / w.reversals.length) : w.band;
}

/** An item the check can draw: its numeric id (the open's `ids`), level and skill. */
export interface CheckItem {
  n: number;
  lv: number;
  skill: CheckSkill;
}

/** The next item's numeric id (null: the check is over) from the answers so far (each its item's numeric id and
 *  whether it was right): the walk's band and the turn's skill, a fresh item of both picked by the seed; a band with
 *  none of that skill (or not loaded yet: `has`) borrows the nearest band's, the lower first. */
export function checkNext(seed: number, done: readonly { n: number; ok: boolean }[], pool: readonly CheckItem[], has: (lv: number) => boolean = () => true): number | null {
  const w = walkOf(done.map((d) => d.ok));
  if (w.stop) return null;
  const skill = CHECK_SEQ[done.length % CHECK_SEQ.length];
  const used = new Set(done.map((d) => d.n));
  const r = mulberry32((seed ^ Math.imul(done.length + 1, 0x9e3779b1)) >>> 0);
  for (let off = 0; off < BANDS.length * 2; off++) {
    const b = w.band + (off % 2 ? -(off + 1) / 2 : off / 2);
    if (b < 0 || b >= BANDS.length || !has(BANDS[b])) continue;
    const fit = pool.filter((x) => x.lv === BANDS[b] && x.skill === skill && !used.has(x.n));
    if (fit.length) return fit[Math.floor(r() * fit.length)].n;
  }
  const any = pool.filter((x) => !used.has(x.n) && has(x.lv));
  return any.length ? any[Math.floor(r() * any.length)].n : null;
}

/** A check's result: the starting stage (its level and place), each skill's band (null: not sampled), the strongest
 *  and weakest skill (null when they don't differ). */
export interface Placement {
  lv: number;
  place: Place;
  skills: Record<CheckSkill, number | null>;
  strong: CheckSkill | null;
  weak: CheckSkill | null;
}

/** A check's answers (each its item's level and skill, in order) as its placement. */
export function placementOf(answers: readonly { lv: number; skill: CheckSkill; ok: boolean }[]): Placement {
  const band = placedBand(answers.map((a) => a.ok));
  const skills = Object.fromEntries(CHECK_SKILLS.map((s) => {
    const xs = answers.filter((a) => a.skill === s);
    return [s, xs.length ? Math.max(0, Math.floor(xs.reduce((sum, a) => sum + bandOfLv(a.lv) - (a.ok ? 0 : 1), 0) / xs.length)) : null];
  })) as Record<CheckSkill, number | null>;
  return { lv: BANDS[band], place: placeOfLv(BANDS[band]) ?? 'hama', skills, ...strongWeak(skills, answers) };
}

/** The strongest and weakest of the sampled skills: by band, then the share right; the same at both ends: none. */
function strongWeak(skills: Record<CheckSkill, number | null>, answers: readonly { skill: CheckSkill; ok: boolean }[]): Pick<Placement, 'strong' | 'weak'> {
  const rate = (s: CheckSkill) => {
    const xs = answers.filter((a) => a.skill === s);
    return xs.filter((a) => a.ok).length / xs.length;
  };
  const ranked = CHECK_SKILLS.filter((s) => skills[s] !== null).map((s) => ({ s, b: skills[s]!, r: rate(s) })).sort((x, y) => y.b - x.b || y.r - x.r);
  const top = ranked[0], low = ranked.at(-1);
  if (!top || !low || (top.b === low.b && top.r === low.r)) return { strong: null, weak: null };
  return { strong: top.s, weak: low.s };
}

/** A placement's profile on the row's `u`: a digit per skill (its band), `x` for one not sampled. */
export const profileCode = (skills: Record<CheckSkill, number | null>): string => CHECK_SKILLS.map((s) => (skills[s] === null ? 'x' : String(skills[s]))).join('');
export function profileOf(u: string | undefined): Record<CheckSkill, number | null> | null {
  if (!u || u.length !== CHECK_SKILLS.length || !/^[0-5x]+$/.test(u)) return null;
  return Object.fromEntries(CHECK_SKILLS.map((s, k) => [s, u[k] === 'x' ? null : Number(u[k])])) as Record<CheckSkill, number | null>;
}

/** What a check's `listen` row carries beyond the answers: the game, the profile as its `u`, the placed level. */
export const checkRow = (p: Placement): Pick<ListenRow, 'gm' | 'u' | 'lv'> => ({ gm: 'check', u: profileCode(p.skills), lv: p.lv });

/** My latest placement from my games (a `check` row: its level and profile), null before any. */
export function lastPlacement(games: readonly { gm?: string; u?: string; lv: number; at: number }[]): { lv: number; skills: Record<CheckSkill, number | null> } | null {
  let best: (typeof games)[number] | null = null;
  for (const g of games) if (g.gm === 'check' && profileOf(g.u) && BANDS.includes(g.lv) && (!best || g.at >= best.at)) best = g;
  return best ? { lv: best.lv, skills: profileOf(best.u)! } : null;
}

/** Where a check's rounds come from: its seed and the ids dealt so far (the UI's decks), the next id from the answers
 *  (checkNext over the loaded levels' pool). */
export interface CheckSource {
  rounds(seed: number, ids: readonly number[]): readonly QuizRound[];
  next(seed: number, done: readonly { id: string; ok: boolean }[]): number | null;
}

/** The check: solo only; its options the quiz's (`[lv, timer]`: the starting level, 30 s), its deck the ids so far. */
export function checkGame(src: CheckSource): GameDef<QuizOpts> {
  return {
    id: 'check',
    modes: { solo: true, coop: false, vs: false, same: false },
    opts: quizOpts,
    deck: (seed, o, ctx) => quizDeck(() => src.rounds(seed, ctx.ids ?? []), o, ctx.w, undefined, CHECK_MAX),
    next: (seed, _o, done) => src.next(seed, done)
  };
}
