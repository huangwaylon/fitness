// 体重のペース (docs/design.md "Kenkou", decisions.md "Weight pace: a forecast on request"): whether a member's weight is
// heading for their goal weight, read from weeks of weigh-ins, never a day. The user's ask (2026-11-21): motivation to
// lose weight, "am I on track". Pure, memoised per State, person and day; never ベル (deps.test.ts), never the guest's
// (no からだ rows reach it: contract/guest.ts).
//
// - The trend: the last PACE.window days' weigh-ins (today's in them), a Theil–Sen line (the median of the pairwise
//   slopes: a spike moves it little) evaluated today: the current weight W and the rate r (kg a week). It needs
//   PACE.minWeighIns spanning PACE.minSpan days; no weigh-in for PACE.stale days: no verdict. Pairs under PACE.pairMin
//   days apart are left out of the median (a day's 0.1 kg rounding is ±0.7 kg a week: daily pairs snapped it to 0).
// - The state, against the goal G and its ±1.5 % band (contract/goals.ts goalMet): inside it キープ (|r| < PACE.keep) or
//   a drift; outside, the rate toward G: 速め (losing faster than PACE.fast of W a week, never in the first PACE.fastAfter
//   days of the goal or the weigh-ins), 順調 (≥ PACE.on), 離れ (away ≥ PACE.away), else 横ばい. The raw state is read
//   for today and PACE.holdBack days back; the latest one that held on two days in a row shows (heldIndex), with that
//   day's whole verdict (W, r, the ETA and the projection from that day's line). Every line is drawn on the rate as the
//   card prints it (rateShown: one decimal), so −0.2 shown toward the goal is 順調, never 横ばい.
// - The ETA (順調, 速め; once the window spans PACE.etaSpan days): the day W reaches the edge of G's band (where キープ
//   starts) at the rate shown, within PACE.etaWeeks; a later day's ETA replaces the one shown only PACE.etaKeep days or
//   more away (steadyEta). The projection, on the 体重 card (順調, 速め): from the line's last point along the Theil–Sen
//   line to min(PACE.ahead, half the window's span) days past today (or the band's edge), labelled in weeks.
// - The calculation (計算, the ⓘ only): the last PACE.calcDays days' (resting energy + Move − intake) over the complete
//   days (朝昼夜 all logged: model/food.ts wholeDayKcal; two meals overstate a deficit for someone who doesn't log
//   breakfast; the Watch worn; intake ≥ max(PACE.minIntake, PACE.minIntakeBmr
//   × BMR)), at least PACE.minDays of them, ÷ PACE.kcalPerKg. Move holds the workouts; Apple's basal isn't imported.
// - The line on the 体重 card: at each weigh-in a local linear fit over the weigh-ins within PACE.smoothDays either side
//   (tricube weights by days): no lag, through the middle of the dots, one-sided at the ends yet still on a steady trend,
//   so it ends near the Theil–Sen weight (an EWMA ran ~0.6 kg above a 0.4 kg/wk loss). Not on it: a least-squares fit
//   follows a spike the median ignores, so the projection starts from the line's end (no step) and aims at the forecast.
// - The progress: from the line's value on the goal's start (`pref goalWeightFrom`, a record fact: the record keeps only
//   a goal's latest row; until it's written, the current goal's own day) to G; the line's first point before it.
// - The streak: finished Mon–Sun weeks in a row whose line moved toward G by PACE.streakStep (inside the band: stayed
//   in it); a week without a weigh-in neither counts nor breaks it.
import type { LocalDate, PersonId, Who } from '#lib/types.ts';
import { isPersonId } from '#lib/contract/api.ts';
import { GOALS, goalMet } from '#lib/contract/goals.ts';
import { addDays, daysBetween, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import type { State } from './state.ts';
import { weighIns, type WeighIn } from './weight.ts';
import { activityOn } from './health.ts';
import { wholeDayKcal } from './food.ts';
import { bmrOn, PAL } from './profile.ts';

export const PACE = {
  /** kcal a kg of body weight (fat with its water: the usual 7,200). */
  kcalPerKg: 7200,
  /** The trend's days back from today, and what it needs: weigh-ins, and days from the first to the last. */
  window: 28, minWeighIns: 8, minSpan: 14,
  /** Theil–Sen's least days between a pair. */
  pairMin: 7,
  /** Days back the state is read for its two-day hold. */
  holdBack: 7,
  /** Days without a weigh-in that end the verdict. */
  stale: 14,
  /** The line's half-window (days either side of a weigh-in). */
  smoothDays: 21,
  /** The calculation: days back from yesterday, complete days needed, a complete day's least intake (kcal, × BMR). */
  calcDays: 7, minDays: 4, minIntake: 800, minIntakeBmr: 0.6,
  /** The states' lines (kg a week; `fast` a share of W a week, `fastAfter` days). */
  on: 0.2, away: 0.15, keep: 0.15, fast: 0.01, fastAfter: 21,
  /** The ETA's horizon (weeks), the window's span it needs and the days an ETA shown is kept within (days); the
   *  projection's horizon (days, at most half the window's span); the streak's least shown and its step (kg). */
  etaWeeks: 52, etaSpan: 21, etaKeep: 14, ahead: 28, streakMin: 2, streakStep: 0.05,
  /** The calculation and the trend disagree past this (kg a week): the ⓘ says why they may. */
  gap: 0.3
} as const;

/** The projection: its ends, and its end's weeks past today (「{n}週後の目安」). */
export interface Ahead { from: WeighIn; to: WeighIn; weeks: number }

/** 順調, 速め, 横ばい, 離れ; inside the band キープ or a drift (`drift` says which way). */
export type PaceState = 'on' | 'fast' | 'flat' | 'away' | 'keep' | 'drift';

export interface Pace {
  /** The goal weight (null: none set). */
  goal: number | null;
  /** The last weigh-in's day (null: none yet), and whether it is PACE.stale days old. */
  last: LocalDate | null;
  stale: boolean;
  /** Today's trend weight (W: the Theil–Sen line, else the line's last) and the rate (kg a week; null: too few). */
  kg: number | null;
  rate: number | null;
  /** What the rate still wants (null with one). */
  need: PaceNeed | null;
  /** The calculation: kg a week (null under PACE.minDays complete days) and the complete days. */
  calc: { rate: number | null; days: number };
  /** The verdict (null: none: no goal, too few weigh-ins, stale); `drift` its way. */
  state: PaceState | null;
  drift: 'up' | 'down' | null;
  /** When the band's edge (`edge`) is reached at r (順調, 速め): its day, `far` past PACE.etaWeeks; else null. */
  eta: LocalDate | 'far' | null;
  /** The edge of G's ±1.5 % band on W's side (where キープ starts; the ETA's aim); null without a goal or a weight. */
  edge: number | null;
  /** From the start (the line on the goal's first day) to G: W − start, |G − W|, the share done (0–1); null inside the band. */
  progress: { start: number; done: number; left: number; share: number } | null;
  /** Finished weeks in a row toward G. */
  streak: number;
  /** The 体重 card's projection (順調, 速め): from the line's last point to the Theil–Sen weight `weeks` (rounded) on
   *  (or the band's edge); else null. */
  ahead: Ahead | null;
}

const median = (xs: number[]): number => {
  const v = [...xs].sort((a, b) => a - b), m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/** The card's state in a word (its `data-pace`, the log's act:health.pace.<state>): the verdict, else stale or none. */
export const paceKind = (p: Pace): PaceState | 'stale' | 'none' => p.state ?? (p.stale ? 'stale' : 'none');

/** The rate as the card prints it: one decimal, half away from zero (−0.15 → −0.2). */
export const rateShown = (r: number): number => (Math.sign(r) * Math.round(Math.abs(r) * 10)) / 10;

/** The line through the weigh-ins (ascending): at each, a weighted least-squares line over the weigh-ins within
 *  PACE.smoothDays days of it (tricube weights by days apart), evaluated there; alone in its window: its own weight. */
export function smoothLine(ws: readonly WeighIn[]): WeighIn[] {
  const h = PACE.smoothDays + 1, xs = ws.map((w) => daysBetween(ws[0]?.date ?? '2000-01-01', w.date));
  const out: WeighIn[] = [];
  for (let i = 0, lo = 0; i < ws.length; i++) {
    while (xs[i] - xs[lo] > PACE.smoothDays) lo++;
    let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let j = lo; j < ws.length && xs[j] - xs[i] <= PACE.smoothDays; j++) {
      const d = xs[j] - xs[i], u = Math.abs(d) / h, v = 1 - u * u * u, w = v * v * v;
      sw += w, sx += w * d, sy += w * ws[j].kg, sxx += w * d * d, sxy += w * d * ws[j].kg;
    }
    // the fit at d = 0: its intercept (a single day: the weighted mean)
    const den = sw * sxx - sx * sx;
    out.push({ date: ws[i].date, kg: den > 1e-9 ? (sy * sxx - sx * sxy) / den : sy / sw });
  }
  return out;
}

/** The Theil–Sen line through the weigh-ins, evaluated on `day`: its weight there and its slope (kg a week). */
export function theilSen(ws: readonly WeighIn[], day: LocalDate): { kg: number; rate: number } {
  const xs = ws.map((w) => daysBetween(day, w.date)), slopes: number[] = [];
  for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) if (Math.abs(xs[j] - xs[i]) >= PACE.pairMin) slopes.push((ws[j].kg - ws[i].kg) / (xs[j] - xs[i]));
  const b = slopes.length ? median(slopes) : 0;
  return { kg: median(ws.map((w, i) => w.kg - b * xs[i])), rate: b * 7 };
}

/** What the trend still wants: weigh-ins (`n` more), or days for them to span PACE.minSpan. */
type PaceNeed = { n: number; unit: 'weighIns' | 'days' };

/** A trend: W and r on its day, and the days its weigh-ins span. */
type Fit = { kg: number; rate: number; span: number };

/** The trend on `day` from the weigh-ins up to it: the window's line, or what it still wants. */
function trendOn(ws: readonly WeighIn[], day: LocalDate): Fit | { need: PaceNeed } {
  const from = addDays(day, -PACE.window + 1), win = ws.filter((w) => w.date >= from && w.date <= day);
  if (win.length < PACE.minWeighIns) return { need: { n: PACE.minWeighIns - win.length, unit: 'weighIns' } };
  const span = daysBetween(win[0].date, win.at(-1)!.date);
  return span < PACE.minSpan ? { need: { n: PACE.minSpan - span, unit: 'days' } } : { ...theilSen(win, day), span };
}

/** Of the raw states for today and the days back (`states[k]`: k days ago), the latest that held on two days in a row
 *  (its index); none held: today's (0). */
export function heldIndex(states: readonly (PaceState | null)[]): number {
  for (let k = 0; k + 1 < states.length; k++) if (states[k] && states[k] === states[k + 1]) return k;
  return 0;
}

/** The ETA shown from each day's (oldest first; null: none that day): one stays until a day's is PACE.etaKeep days or
 *  more from it (or 'far' turns to a day, or back); a day without one ends it. */
export function steadyEta(days: readonly (LocalDate | 'far' | null)[]): LocalDate | 'far' | null {
  let shown: LocalDate | 'far' | null = null;
  for (const d of days) {
    if (d === null || shown === null || (d === 'far') !== (shown === 'far')) shown = d;
    else if (d !== 'far' && Math.abs(daysBetween(shown as LocalDate, d)) >= PACE.etaKeep) shown = d;
  }
  return shown;
}

/** The edge of G's band on W's side (contract/goals.ts goalMet's ±band). */
const edgeOf = (kg: number, goal: number): number => goal * (1 + (goal < kg ? 1 : -1) * (GOALS.weight.band ?? 0));

/** The period line under the progress (PaceCard), from the line (never the raw weigh-ins), as of `today`: 1週 this
 *  week's mean against last week's; 1か月, 3か月, 1年 the change over it (`d`), or, the line covering under half of it,
 *  since the first weigh-in (`since`, its weeks; null when the progress already says it: `done` the same). */
export type PeriodLine = { kind: 'week' | 'month' | 'quarter' | 'year'; d: number } | { kind: 'since'; d: number; weeks: number };
const PERIOD_DAYS = { month: 30, quarter: 91, year: 365 } as const;
export function periodLine(line: readonly WeighIn[], period: 'week' | keyof typeof PERIOD_DAYS, today: LocalDate, done: number | null = null): PeriodLine | null {
  const last = line.at(-1);
  if (!last) return null;
  if (period === 'week') {
    const mean = (a: LocalDate, b: LocalDate) => {
      const xs = line.filter((w) => w.date > a && w.date <= b);
      return xs.length ? xs.reduce((s, w) => s + w.kg, 0) / xs.length : null;
    };
    const now = mean(addDays(today, -7), today), before = mean(addDays(today, -14), addDays(today, -7));
    return now === null || before === null ? null : { kind: 'week', d: now - before };
  }
  const days = PERIOD_DAYS[period], start = lineAt(line, addDays(today, -days));
  if (start !== undefined) return { kind: period, d: last.kg - start };
  const covered = daysBetween(line[0].date, last.date), d = last.kg - line[0].kg;
  if (covered * 2 >= days) return { kind: period, d };
  if (covered < 7 || (done !== null && Math.abs(done - d) < 0.05)) return null;
  return { kind: 'since', d, weeks: Math.round(covered / 7) };
}

/** The state of a trend (W, r) against G, on r as shown (rateShown); `fastOk`: past the first PACE.fastAfter days. */
export function stateOf(kg: number, raw: number, goal: number, fastOk: boolean): PaceState {
  const rate = rateShown(raw);
  if (goalMet('weight', kg, goal)) return Math.abs(rate) < PACE.keep ? 'keep' : 'drift';
  const toward = goal < kg ? -rate : rate;
  if (goal < kg && fastOk && toward > PACE.fast * kg) return 'fast';
  if (toward >= PACE.on) return 'on';
  return toward <= -PACE.away ? 'away' : 'flat';
}

/** The line's value on `day` (its last point by then), or undefined before it starts. */
function lineAt(line: readonly WeighIn[], day: LocalDate): number | undefined {
  let v: number | undefined;
  for (const w of line) {
    if (w.date > day) break;
    v = w.kg;
  }
  return v;
}

/** Finished Mon–Sun weeks in a row, back from last week, whose line moved toward G (PACE.streakStep), or stayed in the
 *  band from inside it; a week without a weigh-in is passed over. */
export function streakOf(line: readonly WeighIn[], goal: number, today: LocalDate): number {
  if (!line.length) return 0;
  let n = 0;
  for (let wk = addDays(weekKeyOf(today), -7); wk >= weekKeyOf(line[0].date); wk = addDays(wk, -7)) {
    const end = addDays(wk, 6);
    if (!line.some((w) => w.date >= wk && w.date <= end)) continue;
    const a = lineAt(line, addDays(wk, -1)), b = lineAt(line, end)!;
    if (a === undefined) break;
    const ok = goalMet('weight', a, goal) ? goalMet('weight', b, goal) : (b - a) * Math.sign(goal - a) >= PACE.streakStep;
    if (!ok) break;
    n++;
  }
  return n;
}

/** The calculation over the PACE.calcDays before today (PACE's header): kg a week, and the complete days. */
function calcOf(s: State, p: PersonId, t: number, today: LocalDate): Pace['calc'] {
  const bmr = bmrOn(s, p, t);
  if (bmr === null) return { rate: null, days: 0 };
  const food = wholeDayKcal(s, p, addDays(today, -PACE.calcDays), addDays(today, -1)), least = Math.max(PACE.minIntake, PACE.minIntakeBmr * bmr);
  let sum = 0, days = 0;
  for (let i = 1; i <= PACE.calcDays; i++) {
    const d = addDays(today, -i), k = food.get(d), move = activityOn(s, p, d, t).move;
    if (k === undefined || move === null || k < least) continue;
    sum += Math.min(PAL.max * bmr, Math.max(PAL.min * bmr, bmr + move)) - k;
    days++;
  }
  return { rate: days >= PACE.minDays ? -sum / days / PACE.kcalPerKg * 7 : null, days };
}

interface PaceData { line: WeighIn[]; pace: Pace }
const memo = new WeakMap<State, Map<string, PaceData>>();

function build(s: State, p: PersonId, t: number, today: LocalDate): PaceData {
  const ws = weighIns(s, p, t), line = smoothLine(ws), goal = s.prefs[p].goalWeight ?? null, last = ws.at(-1)?.date ?? null;
  const stale = last !== null && daysBetween(last, today) >= PACE.stale;
  // the start: the record's goalWeightFrom, until it's written the current goal's own day
  const goalFrom = s.prefs[p].goalWeightFrom ?? s.prefs[p].goalWeightSet ?? null;
  const fastOk = (d: LocalDate) => [goalFrom, ws[0]?.date].every((f) => !f || daysBetween(f, d) >= PACE.fastAfter);
  const now = trendOn(ws, today);
  // each day's raw verdict, today's and PACE.holdBack days back (trendOn reads only the weigh-ins up to its day)
  const days = goal !== null && 'kg' in now && !stale
    ? Array.from({ length: PACE.holdBack + 1 }, (_, k) => {
      const day = addDays(today, -k), tr = k ? trendOn(ws, day) : now, fit = 'kg' in tr ? tr : null;
      return { day, fit, state: fit && stateOf(fit.kg, fit.rate, goal, fastOk(day)) };
    })
    : [];
  const k = heldIndex(days.map((d) => d.state)), shown = days[k] ?? null;
  const fit = shown?.fit ?? ('kg' in now ? now : null), state = shown?.state ?? null, asOf = shown?.day ?? today;
  const kg = fit?.kg ?? line.at(-1)?.kg ?? null;
  const edge = goal !== null && kg !== null ? edgeOf(kg, goal) : null;
  // the ETA: each day's at the rate shown (順調, 速め, the window spanning PACE.etaSpan), the oldest kept till one moves
  const etaOn = (d: (typeof days)[number]): LocalDate | 'far' | null => {
    if (!d.fit || (d.state !== 'on' && d.state !== 'fast') || d.fit.span < PACE.etaSpan) return null;
    const r = rateShown(d.fit.rate), weeks = r ? (edgeOf(d.fit.kg, goal!) - d.fit.kg) / r : -1;
    return weeks < 0 ? null : weeks > PACE.etaWeeks ? 'far' : addDays(d.day, Math.round(weeks * 7));
  };
  const going = state === 'on' || state === 'fast';
  const eta = going ? steadyEta(days.slice(k).reverse().map(etaOn)) : null;
  // the projection: along the shown day's line to min(PACE.ahead, half its span) days past today, or the band's edge
  let ahead: Ahead | null = null;
  if (going && fit && edge !== null && line.length) {
    const at = (d: LocalDate) => fit.kg + (fit.rate * daysBetween(asOf, d)) / 7;
    let end = addDays(today, Math.min(PACE.ahead, Math.floor(fit.span / 2))), endKg = at(end);
    if ((endKg - edge) * (kg! - edge) < 0) (end = addDays(asOf, Math.round(((edge - fit.kg) / fit.rate) * 7))), (endKg = edge);
    if (end > today) ahead = { from: line.at(-1)!, to: { date: end, kg: endKg }, weeks: Math.max(1, Math.round(daysBetween(today, end) / 7)) };
  }
  let progress: Pace['progress'] = null;
  // (inside the band, by the state shown when there is one)
  if (goal !== null && kg !== null && (state ? state !== 'keep' && state !== 'drift' : !goalMet('weight', kg, goal))) {
    const start = (goalFrom ? lineAt(line, goalFrom) : undefined) ?? line[0].kg;
    progress = { start, done: kg - start, left: Math.abs(goal - kg), share: start === goal ? 1 : Math.min(1, Math.max(0, (start - kg) / (start - goal))) };
  }
  return {
    line,
    pace: {
      goal, last, stale, kg, rate: fit?.rate ?? null, need: 'need' in now ? now.need : null, calc: calcOf(s, p, t, today),
      state, drift: state === 'drift' ? (fit!.rate > 0 ? 'up' : 'down') : null, eta, edge,
      progress, streak: goal === null ? 0 : streakOf(line, goal, today), ahead
    }
  };
}

function data(s: State, p: PersonId, t: number): PaceData {
  const today = localDateAt(t), key = `${p}|${today}`;
  let byKey = memo.get(s);
  if (!byKey) memo.set(s, (byKey = new Map()));
  let hit = byKey.get(key);
  if (!hit) byKey.set(key, (hit = build(s, p, t, today)));
  return hit;
}

/** A member's pace as of `t` (memoised per State, person and day); null for the guest (no からだ data). */
export const paceOf = (s: State, who: Who, t: number): Pace | null => (isPersonId(who) ? data(s, who, t).pace : null);

/** The 体重 card's line: smoothLine's at each weigh-in, ascending. */
export const weightLine = (s: State, p: PersonId, t: number): readonly WeighIn[] => data(s, p, t).line;
