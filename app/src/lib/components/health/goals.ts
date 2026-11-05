// The goals as the screens show and set them (docs/design.md "Goals in place"): one editor spec per goal of the
// registry (contract/goals.ts GOALS: its key, direction, range and grid), its value in words with its direction
// (「目標 8,000歩 以上」), what was typed read back, and the one setter with its banner. けんこう's cards and ごはん's
// (the summary, グラフ) all read these, so every goal looks, reads and is set the same way.
import type { Who } from '#lib/types.ts';
import { GOAL_IDS, GOALS, isGoalValue, type GoalDir, type GoalId } from '#lib/contract/goals.ts';
import { RULES } from '#lib/config/rules.ts';
import { METRIC_FRUIT, type Metric } from '#lib/model/health.ts';
import { formatNum, t } from '#lib/i18n/index.ts';
import { setGoal } from '#lib/store/actions.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';

export interface GoalSpec {
  id: GoalId;
  dir: GoalDir;
  /** The editor's title: 「歩数の目標（1日）」. */
  head: () => string;
  /** The field's unit, beside it (none for BMI). */
  unit: () => string;
  /** One decimal (kg, %, salt) or whole numbers. */
  decimals: 0 | 1;
  /** What the editor offers (kcal from 1,200: under the record's 1,000, the usual unsupervised floor). */
  min: number;
  max: number;
  /** What −/＋ add (and the grid they snap to). */
  step: number;
  /** What was typed → the goal, or null when the record would refuse it. */
  parse: (text: string) => number | null;
  /** The range in words, under the field (coral once a けってい was refused). */
  hint: () => string;
  /** A line beside the title: 「きょうから」 for the goals a day keeps. */
  note?: () => string;
  /** 目標をなくす, once one is set. */
  clearable: boolean;
  /** Where −/＋ start when none is set (a card may pass the period's average instead). */
  start: number;
}

/** What the editor's −/＋ add, by goal: rounder than the record's grid where that is 1 or 0.1. */
const NUDGE: Record<GoalId, number> = { steps: 500, move: 10, exercise: 5, stand: 10, weight: 0.5, body_fat_pct: 0.5, bmi: 0.5, lean_kg: 0.5, k: 50, p: 5, fa: 5, c: 5, s: 0.5 };
/** Where −/＋ start with none set: about a usual day's (the body ones start from the period's average, the card's). */
const START: Record<GoalId, number> = { steps: 8000, move: 500, exercise: 60, stand: 120, weight: 60, body_fat_pct: 20, bmi: 22, lean_kg: 50, k: 2000, p: 100, fa: 60, c: 250, s: 7.5 };
/** The lowest kcal goal ごはん offers (the coach: 1,200 is the usual unsupervised floor; the record takes 1,000). */
const KCAL_GOAL_MIN = 1200;

/** Whole numbers, or one decimal on a grid under 1 (kg, %, BMI, salt). */
const decimalsOf = (id: GoalId): 0 | 1 => (GOALS[id].step < 1 || NUDGE[id] < 1 ? 1 : 0);

/** A number with the goal's unit: `8,000歩`, `620 kcal`, `45分`, `66.0 kg`, `19.5%`, `22.0`, `110 g`. `decimals`:
 *  the goal's own (its grid's) unless given (a day's grams: one). Activity values are rounded down, as the tree's. */
export function valueText(id: GoalId, v: number, decimals: 0 | 1 = decimalsOf(id)): string {
  const n = decimals ? v.toFixed(1) : formatNum(GOALS[id].group === 'activity' ? Math.floor(v) : Math.round(v));
  return `${n}${t(`goal.u.${id}`)}`;
}

/** Which way, in words: 以上 / 以下 / 前後 (at least / at most / about). */
const dirText = (id: GoalId): string => t(`goal.dir.${GOALS[id].dir}`);

/** A goal with its direction, as its chip, its chart line and ごはん's tiles read it: 「目標 8,000歩 以上」, 「目標 7.0 g 以下」,
 *  「目標 2,200 kcal 前後」; 「目標 まだ」 without one. No-break spaces in it: a narrow tile wraps it only after 目標. */
export const goalLabel = (id: GoalId, v: number | null): string =>
  v === null ? t('goal.none') : t('goal.ofDir', { g: valueText(id, v).replace(' ', '\u00a0'), d: dirText(id) });

/** What the goal is of, for its banner and labels: 歩数, 体脂肪率, たんぱく質. */
export function goalName(id: GoalId): string {
  const g = GOALS[id].group;
  if (g === 'activity') return t(`fruit.${METRIC_FRUIT[id as Metric]}`);
  if (g === 'food') return t(id === 'k' ? 'food.kcal' : `food.${id}`);
  return id === 'weight' ? t('goal.weight') : t(`health.body.${id}`);
}

/** Full-width digits, point and comma typed on a Japanese keyboard (「６５０」, 「１２．５」) as ASCII. */
const halfWidth = (text: string): string => text.replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

/**
 * What was typed as the goal of `id` → the goal, or null when the record would refuse it: `8000`, `10,500`, `68,4`
 * (a decimal comma), full-width `６８．４`, a trailing unit (歩, kcal, kg, g, %, 分); one decimal at most kept for the
 * decimal ones (68.45 → 68.5), none for the whole ones (600.5 is refused); in the editor's range and on the record's grid.
 */
export function parseGoal(id: GoalId, text: string): number | null {
  const raw = halfWidth(text.trim()).replace(/\s*(歩|steps?|kcal|kg|g|グラム|%|％|分|min)$/i, '');
  const s = /^\d{1,3}(,\d{3})+$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
  if (!/^\d{1,5}(\.\d+)?$/.test(s)) return null;
  const v = decimalsOf(id) ? Math.round(Number(s) * 10) / 10 : Number(s);
  return isGoalValue(id, v) && v >= SPECS[id].min ? v : null;
}

function spec(id: GoalId): GoalSpec {
  const g = GOALS[id];
  const min = id === 'k' ? KCAL_GOAL_MIN : g.min;
  const decimals = decimalsOf(id);
  const num = (v: number) => (decimals && !Number.isInteger(v) ? String(v) : formatNum(v));
  const fixed = id === 'exercise' ? RULES.goals.exerciseMin : id === 'stand' ? RULES.goals.standMin : null;
  return {
    id, dir: g.dir, decimals, min, max: g.max, step: NUDGE[id], clearable: g.clearable, start: START[id],
    head: () => t(`goal.head.${id}`),
    unit: () => t(`goal.u.${id}`).trim(),
    parse: (text) => parseGoal(id, text),
    hint: () => t('goal.range', { min: num(min), max: num(g.max), step: num(NUDGE[id]), u: t(`goal.u.${id}`) }),
    // a goal a day keeps: from today on (the past keeps its own); Exercise and Stand: the ベル still go by the fixed ones
    note: fixed !== null ? () => t('goal.note.fixed', { g: valueText(id, fixed) }) : g.history === 'daily' ? () => t('goal.note.today')
      : id === 'p' || id === 'k' || id === 's' ? () => t(`food.goalNote.${id}`) : undefined
  };
}
const SPECS = {} as Record<GoalId, GoalSpec>;
for (const id of GOAL_IDS) SPECS[id] = spec(id);
/** Every goal's editor spec. */
export const GOAL_SPECS: Readonly<Record<GoalId, GoalSpec>> = SPECS;

/** A goal as the field shows it: `8,000`, `65.0`. */
export const goalField = (s: Pick<GoalSpec, 'decimals'>, v: number): string => (s.decimals ? v.toFixed(1) : formatNum(v));

/** −/＋ from `from` (what the field holds, else the goal, else the spec's start): one step, onto the step's grid, kept
 *  within the range. */
export function nudge(s: Pick<GoalSpec, 'min' | 'max' | 'step'>, from: number, dir: -1 | 1): number {
  const k = Math.round(from / s.step + 1e-9);
  const on = Math.abs(k * s.step - from) < 1e-6;
  const next = (on ? k + dir : dir > 0 ? Math.ceil(from / s.step) : Math.floor(from / s.step)) * s.step;
  return Math.round(Math.min(s.max, Math.max(s.min, next)) * 10) / 10;
}

/** Sets `who`'s goal of `id` (GoalEdit's onsave; null clears it) and says so: low on ごはん, where its confirmations sit. */
export function saveGoal(id: GoalId, who: Who, v: number | null): void {
  if (!setGoal(id, who, v).ok) return;
  const low = GOALS[id].group === 'food';
  toasts.show(v === null ? t('goal.cleared') : t('goal.saved', { what: goalName(id) }), low ? 2200 : 2500, { low, reaction: 'pleased' });
}
