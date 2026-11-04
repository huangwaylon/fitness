// The goals GoalEdit sets, one spec each (docs/design.md "Kenkou", "Gohan"): its title, the field's unit and keypad,
// the range −/＋ step through and the parse that checks what was typed (the record's own rules), the range in words,
// whether it may be cleared and the value −/＋ start from when none is set.
import { WEIGHT_KG } from '#lib/contract/api.ts';
import { GOALS as DEFS } from '#lib/contract/goals.ts';
const BODY_FAT_GOAL = DEFS.body_fat_pct;
const MOVE_GOAL = DEFS.move;
const STEPS_GOAL = { ...DEFS.steps, fallback: 8000 };
import { formatNum, t } from '#lib/i18n/index.ts';
import { parseKcalInput, parseKgInput, parsePctInput, parseStepsInput } from '../kiroku/fmt.ts';

export interface GoalSpec {
  /** The editor's title: 「歩数の目標（1日）」. */
  head: () => string;
  /** The field's unit, beside it. */
  unit: () => string;
  /** One decimal (kg, %) or whole numbers. */
  decimals: 0 | 1;
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
  /** Where −/＋ start when none is set. */
  start: number;
}

export type GoalKind = 'steps' | 'move' | 'weight' | 'fat';

export const GOALS: Record<GoalKind, GoalSpec> = {
  steps: {
    head: () => t('goal.head.steps'), unit: () => t('goal.stepsUnit'), decimals: 0, min: STEPS_GOAL.min, max: STEPS_GOAL.max, step: STEPS_GOAL.step,
    parse: parseStepsInput, note: () => t('goal.moveNote'), clearable: false, start: STEPS_GOAL.fallback,
    hint: () => t('goal.stepsRange', { min: formatNum(STEPS_GOAL.min), max: formatNum(STEPS_GOAL.max), step: STEPS_GOAL.step })
  },
  move: {
    head: () => t('goal.head.move'), unit: () => 'kcal', decimals: 0, min: MOVE_GOAL.min, max: MOVE_GOAL.max, step: 10,
    parse: parseKcalInput, note: () => t('goal.moveNote'), clearable: false, start: 500,
    hint: () => t('goal.moveRange', { min: MOVE_GOAL.min, max: formatNum(MOVE_GOAL.max) })
  },
  weight: {
    head: () => t('weight.goalWeight'), unit: () => 'kg', decimals: 1, min: WEIGHT_KG.min, max: WEIGHT_KG.max, step: 0.5,
    parse: parseKgInput, hint: () => t('weight.range'), clearable: true, start: 60
  },
  fat: {
    head: () => t('weight.goalBodyFat'), unit: () => '%', decimals: 1, min: BODY_FAT_GOAL.min, max: BODY_FAT_GOAL.max, step: 0.5,
    parse: parsePctInput, hint: () => t('weight.fatRange', { min: BODY_FAT_GOAL.min, max: BODY_FAT_GOAL.max }), clearable: true, start: 20
  }
};

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
