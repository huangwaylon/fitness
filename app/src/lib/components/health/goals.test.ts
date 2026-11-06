import { describe, expect, it } from 'vitest';
import { GOAL_IDS, GOALS } from '#lib/contract/goals.ts';
import { deltaText } from './fmt.ts';
import { GOAL_SPECS as S, goalField, goalLabel, nudge, parseGoal, valueText } from './goals.ts';

/** No-break spaces (a unit stays with its number) as plain ones. */
const sp = (s: string) => s.replace(/\u00a0/g, ' ');

describe('the goals as shown', () => {
  it('every goal has an editor: its direction, a range within the record’s, a start inside it', () => {
    const bad: string[] = [];
    for (const id of GOAL_IDS) {
      const s = S[id];
      if (s.dir !== GOALS[id].dir || s.min < GOALS[id].min || s.max !== GOALS[id].max || !(s.start >= s.min && s.start <= s.max)) bad.push(id);
      if (s.parse(goalField(s, s.start)) !== s.start) bad.push(`${id}: start doesn't read back`);
      if (!s.head() || !s.hint()) bad.push(`${id}: words`);
    }
    expect(bad).toEqual([]);
  });
  it('labels a goal with its direction, in its unit', () => {
    expect([goalLabel('steps', 8000), goalLabel('move', 600), goalLabel('exercise', 45), goalLabel('stand', 120), goalLabel('weight', 66),
      goalLabel('body_fat_pct', 19.5), goalLabel('bmi', 22), goalLabel('lean_kg', 52), goalLabel('k', 2200), goalLabel('p', 110),
      goalLabel('s', 7), goalLabel('fa', null)].map(sp)).toEqual([
      '目標 8,000歩 以上', '目標 600 kcal 以上', '目標 45分 以上', '目標 120分 以上', '目標 66.0 kg 前後',
      '目標 19.5% 以下', '目標 22.0 前後', '目標 52.0 kg 以上', '目標 2,200 kcal 前後', '目標 110 g 以上',
      '目標 7.0 g 以下', '目標なし'
    ].map(sp));
    expect([valueText('steps', 9214.8), valueText('p', 84.46, 1), deltaText('weight', -0.34), deltaText('body_fat_pct', 0.2), deltaText('bmi', 0.04), deltaText('lean_kg', null)].map(sp))
      .toEqual(['9,214歩', '84.5 g', '−0.3 kg', '+0.2%', '±0.0', '–']);
  });
});

describe('parseGoal (what was typed)', () => {
  it('reads each goal’s field: full-width digits, commas, a trailing unit; refuses what the record would', () => {
    const ok: [Parameters<typeof parseGoal>[0], string, number][] = [
      ['weight', '68.4', 68.4], ['weight', ' 68,4 ', 68.4], ['weight', '６８．４', 68.4], ['weight', '68.45kg', 68.5], ['weight', '72', 72],
      ['body_fat_pct', '２２．５％', 22.5], ['body_fat_pct', '18.45%', 18.5], ['body_fat_pct', '3', 3], ['body_fat_pct', '60', 60],
      ['move', ' 1,200 kcal', 1200], ['move', '６００', 600], ['steps', ' 10,500 歩', 10500], ['steps', '12000 steps', 12000], ['steps', '８０００', 8000],
      ['exercise', '30分', 30], ['stand', '150', 150], ['bmi', '22.4', 22.4], ['lean_kg', '52,5', 52.5],
      ['k', '2,000', 2000], ['k', '１８００', 1800], ['k', '1850 kcal', 1850], ['k', '1200', 1200], ['p', '120', 120], ['s', '7.5', 7.5], ['s', '7,5 g', 7.5]
    ];
    const no: [Parameters<typeof parseGoal>[0], string][] = [
      ['weight', ''], ['weight', '19'], ['weight', '301'], ['weight', 'abc'], ['weight', '68..4'], ['weight', '-70'], ['weight', '1e2'],
      ['body_fat_pct', '2.9'], ['body_fat_pct', '60.1'], ['move', '99'], ['move', '2001'], ['move', '600.5'], ['steps', '500'], ['steps', '8250'],
      ['steps', '8000.5'], ['exercise', '33'], ['stand', '125'], ['bmi', '14'], ['k', '1000'], ['k', '1150'], ['k', '1825'], ['k', '5050'],
      ['p', '122'], ['p', '5'], ['s', '7.3'], ['s', '21'], ['c', 'abc'], ['fa', '']
    ];
    const bad = [...ok.filter(([id, s, v]) => parseGoal(id, s) !== v).map(([id, s]) => `${id} ${s}`), ...no.filter(([id, s]) => parseGoal(id, s) !== null).map(([id, s]) => `!${id} ${s}`)];
    expect(bad).toEqual([]);
  });
});

describe('nudge (GoalEdit −/＋)', () => {
  it('steps one step, from a value off the grid onto it, within the range', () => {
    expect([nudge(S.steps, 8000, 1), nudge(S.steps, 8000, -1), nudge(S.move, 537, 1), nudge(S.move, 537, -1), nudge(S.steps, 30000, 1), nudge(S.steps, 1000, -1),
      nudge(S.weight, 65, -1), nudge(S.weight, 62.37, 1), nudge(S.body_fat_pct, 19.5, 1), nudge(S.k, 1200, -1), nudge(S.s, 7, 1)])
      .toEqual([8500, 7500, 540, 530, 30000, 1000, 64.5, 62.5, 20, 1200, 7.5]);
  });
});
