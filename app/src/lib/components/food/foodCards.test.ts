// ごはん's summary cards, rendered (svelte/server): the day card's not-counted note and 「≥」 with why (一部不明 /
// わかった分だけ), and グラフ's average card's salt and fibre lines (the goal, the coverage, the saltiest food).
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import '#lib/i18n/food.ts';
import FoodSummary from './FoodSummary.svelte';
import FoodAverage from './FoodAverage.svelte';
import type { FoodDay, FoodAverage as Avg } from '#lib/model/food.ts';
import type { FoodEntry, FoodGoalOf, FoodSnap } from '#lib/contract/food.ts';

const OATS: FoodSnap = { id: 'mext:01006', n: 'オートミール', k: 350, p: 13.7, fa: 5.7, c: 69.1, s: 0, fi: 9.4 };
const BAR: FoodSnap = { id: 'off:4900000000000', n: 'バー', k: 400, p: 10, fa: 20, c: 50, s: null };
const entry = (f: FoodSnap, over: Partial<FoodEntry> = {}): FoodEntry => ({ id: `e${f.id}`, who: 'A', at: 0, d: '2026-11-03', m: 'b', g: 100, f, ...over });
const dayOf = (entries: FoodEntry[]): FoodDay => ({ entries, kcal: 500, p: 10, fa: 5, c: 60, s: 1, fi: 5 });
const goals: Record<FoodGoalOf, number | null> = { k: 2000, p: 110, fa: 60, c: 250, s: 7.5, fi: 20 };
const day = (entries: FoodEntry[], mine = true, when: 'past' | 'today' | 'next' = 'past') =>
  render(FoodSummary, { props: { day: dayOf(entries), who: 'A', goals, when, onsavegoal: mine ? () => {} : null } }).body;

describe('FoodSummary', () => {
  it('a past day not counted: a soft note in the goal bar’s place (いつものだけ, or under two meals); none today, on tomorrow’s preview or once two meals are logged', () => {
    const rep = [entry(OATS, { rep: 'rabcdef1' })];
    expect(day(rep)).toMatch(/data-food-rep-only="rep"[^>]*>いつものだけなので平均に入りません</);
    expect(day(rep)).not.toContain('data-food-chip'); // no 少なめ: the day isn't whole
    expect(day(rep, false)).toMatch(/data-food-rep-only="rep"[^>]*>いつものだけなので平均に入りません</); // the same words for anyone's
    expect(day(rep, true, 'today')).not.toContain('data-food-rep-only'); // still going
    expect(day(rep, true, 'next')).not.toContain('data-food-rep-only');
    expect(day([...rep, entry(OATS, { m: 's' })])).toMatch(/data-food-rep-only="few"[^>]*>朝・昼・夜の2食から平均に入ります</); // a snack doesn't make it
    expect(day([...rep, entry(OATS, { m: 'l' }), entry(OATS, { m: 'd' })])).not.toContain('data-food-rep-only');
  });

  it('「≥」 with why: 一部不明 when most of the kcal know it, わかった分だけ under 70 %; fibre too', () => {
    const most = day([entry(BAR), ...Array.from({ length: 3 }, (_, i) => entry(OATS, { id: `o${i}` }))]); // salt and fibre 1050 of 1450 kcal
    expect(most).toMatch(/data-nutrient="s"[\s\S]*?data-partial="most"[^>]*>一部不明/);
    expect(most).toMatch(/data-nutrient="fi"[\s\S]*?data-partial="most"[^>]*>一部不明/);
    const few = day([entry(BAR), entry(BAR, { id: 'b2' }), entry(OATS)]); // 350 of 1150 kcal
    expect(few).toMatch(/data-nutrient="s"[\s\S]*?data-partial="few"[^>]*>わかった分だけ/);
    expect(few).toMatch(/data-line="s"[\s\S]*?title="わかった分だけ"/);
    expect(few).not.toMatch(/data-nutrient="p"[^]*?data-partial[^]*?data-nutrient="fa"/);
  });
});

const avg = (over: Partial<Avg> = {}, g = goals) => render(FoodAverage, {
  props: {
    avg: {
      from: '2026-11-13', to: '2026-11-19', days: 7, kcal: 1245, p: 64.5, fa: 40.9, c: 167.9, s: 7.7, fi: 7.6,
      known: { p: 'all', fa: 'all', c: 'all', s: 'most', fi: 'few' }, salty: { n: '坦々鍋用スープ', times: 2, s: 10.2 }, ...over
    },
    goals: g
  }
}).body;

describe('FoodAverage', () => {
  it('salt: the daily average with its coverage and goal, then the saltiest food; fibre わかった分だけ', () => {
    const b = avg();
    expect(b).toMatch(/data-avg-nutrient="s"[^>]*data-known="most"[\s\S]*?≥7\.7 g[\s\S]*?data-avg-note[^>]*>一部不明 · 目標\s7\.5\sg\s以下</);
    expect(b).toMatch(/data-avg-salty[^>]*>塩分が多いのは 坦々鍋用スープ <span class="nw[^"]*">· 2回</);
    expect(b).toMatch(/data-avg-nutrient="fi"[\s\S]*?≥7\.6 g[\s\S]*?data-avg-note[^>]*>わかった分だけ · 目標\s20\sg\s以上</);
  });

  it('all known: no 「≥」, the goal alone; no goal, no note; no salt known, no saltiest; fibre unknown 「–」', () => {
    const b = avg({ known: { p: 'all', fa: 'all', c: 'all', s: 'all', fi: 'all' }, salty: null, fi: null }, { ...goals, s: null, fi: null });
    expect(b).not.toContain('≥');
    expect(b).not.toContain('data-avg-note');
    expect(b).not.toContain('data-avg-salty');
    expect(b).toMatch(/data-avg-nutrient="fi"[\s\S]*?>–</);
  });
});
