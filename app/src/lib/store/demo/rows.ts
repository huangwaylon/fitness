// `?demo`: believable sheet rows for both people (ウェイ = A = me, うめ = B), generated around the real clock and fed
// through the same model as the live app, so the island, the wallet and きろく agree and every tap really recomputes.
// Activity rows start 8 weeks before this one (`?demo&weeks=N`: N; the economy's first week follows the data), with a
// day now and then without the Watch (steps only; `?demo&health=zero`: its Move, Exercise and Stand sent as 0, as the
// live Shortcut does when Health has no samples), so けんこう has a 記録なし day either way, and the last days' meals
// (ごはん) with a kcal goal each, and a recipe of A's (マイレシピ). Deterministic per date
// (a seeded RNG), so a reload shows the same history.
import type { PersonId, ShopItemId, Who } from '#lib/types.ts';
import { rowsFor } from '#lib/contract/guest.ts';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import { addDays, jstMs, localDateAt, weekKeyOf } from '#lib/time/dates.ts';
import { provisionalMs } from '#lib/model/state.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';
import { maxAt } from '#lib/model/snapshot.ts';
import { mulberry32 } from '#lib/random.ts';
import { shopPrice } from '#lib/config/rules.ts';
import { WEEKDAYS, type FoodSnap, type Meal } from '#lib/contract/food.ts';

const DEMO_WEEKS_BACK = 8;
/** About one day in 25 only steps reach the sheet (no Move, Exercise or Stand row: 記録なし in けんこう, no fruit). */
const NO_WATCH = 0.04;
/** About 1 in 5 met goals reach 1.5× (がんばり), so the cap shows up now and then. */
const STRETCH_ODDS = 0.2;

/** A PRNG seeded by a string. */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return mulberry32(h);
}

/** The demo's foods, per 100 g as the food data has them (app/static/food: MEXT, dishes; fibre since 2026-11-05). */
const FOODS: Record<string, FoodSnap> = {
  rice: { id: 'mext:01088', n: 'ごはん（精白米）', k: 156, p: 2.5, fa: 0.3, c: 37.1, s: 0, fi: 1.5, u: '茶碗1杯' },
  natto: { id: 'dishes:natto', n: '納豆（たれ・からし付き）', k: 163, p: 14.5, fa: 8.6, c: 11.3, s: 0.9, fi: 8.1, u: '1人前' },
  toast: { id: 'mext:01026', n: '食パン', k: 248, p: 8.9, fa: 4.1, c: 46.4, s: 1.2, fi: 4.2, u: '6枚切1枚' },
  yogurt: { id: 'mext:13025', n: 'ヨーグルト（無糖）', k: 56, p: 3.6, fa: 3, c: 4.9, s: 0.1, fi: 0, u: '1食' },
  banana: { id: 'mext:07107', n: 'バナナ', k: 93, p: 1.1, fa: 0.2, c: 22.5, s: 0, fi: 1.1, u: '1本' },
  egg: { id: 'mext:12005', n: 'ゆで卵', k: 134, p: 12.5, fa: 10.4, c: 0.3, s: 0.3, fi: 0, u: '1個（M）' },
  onigiri: { id: 'dishes:onigiri-shake', n: 'おにぎり（鮭）', k: 161, p: 5.3, fa: 1.5, c: 33.2, s: 0.5, fi: 1.9, u: '1人前' },
  curry: { id: 'dishes:curry-chicken', n: 'カレーライス（チキン）', k: 143, p: 4, fa: 4.5, c: 23, s: 0.8, fi: 1.4, u: '1人前' },
  salmon: { id: 'dishes:teishoku-yakizake', n: '焼き鮭定食', k: 84, p: 4.6, fa: 1.8, c: 13.4, s: 0.7, fi: 1.4, u: '1人前' },
  shogayaki: { id: 'dishes:teishoku-shogayaki', n: '生姜焼き定食', k: 110, p: 4.5, fa: 4.2, c: 13.9, s: 0.7, fi: 1.2, u: '1人前' },
  udon: { id: 'mext:01039', n: 'うどん（ゆで）', k: 95, p: 2.6, fa: 0.4, c: 21.6, s: 0.3, fi: 1.3, u: '1玉' },
  karaage: { id: 'dishes:karaage', n: '鶏の唐揚げ', k: 256, p: 20, fa: 14.9, c: 11.9, s: 2, fi: 1, u: '1個' }
};
/** A's recipe: 「おうちカレー」 4人前, its ingredients per 100 g as the food data has them (MEXT). */
const CURRY_RECIPE = {
  id: 'cdemoa1', n: 'おうちカレー', sv: 4,
  it: [
    { g: 300, f: { id: 'mext:11221', n: '若どり もも 皮つき 生', k: 190, p: 16.6, fa: 14.2, c: 0, s: 0.2, fi: 0 } },
    { g: 400, f: { id: 'mext:06153', n: 'たまねぎ 生', k: 33, p: 1, fa: 0.1, c: 8.4, s: 0, fi: 1.5 } },
    { g: 150, f: { id: 'mext:06212', n: 'にんじん 皮つき 生', k: 35, p: 0.7, fa: 0.2, c: 9.3, s: 0.1, fi: 2.8 } },
    { g: 300, f: { id: 'mext:02017', n: 'じゃがいも 生', k: 59, p: 1.8, fa: 0.1, c: 17.3, s: 0, fi: 8.9 } },
    { g: 80, f: { id: 'mext:17051', n: 'カレールウ', k: 474, p: 6.5, fa: 34.1, c: 44.7, s: 10.6, fi: 6.4 } },
    { g: 600, f: FOODS.rice }
  ]
};
/** A day's meals each (Tokyo hour, meal, food, grams), cycling over the days: ウェイ eats more than うめ. */
const MEALS_DEMO: Record<PersonId, [h: number, m: Meal, food: string, g: number][][]> = {
  A: [
    [[7, 'b', 'rice', 150], [7, 'b', 'natto', 54], [12, 'l', 'curry', 510], [19, 'd', 'shogayaki', 741], [21, 's', 'banana', 100]],
    [[8, 'b', 'toast', 60], [8, 'b', 'egg', 50], [12, 'l', 'onigiri', 114], [12, 'l', 'onigiri', 114], [19, 'd', 'salmon', 584]],
    [[7, 'b', 'rice', 150], [7, 'b', 'egg', 50], [12, 'l', 'udon', 240], [12, 'l', 'karaage', 110], [20, 'd', 'curry', 510]]
  ],
  B: [
    [[8, 'b', 'yogurt', 100], [8, 'b', 'banana', 100], [12, 'l', 'onigiri', 114], [19, 'd', 'salmon', 584]],
    [[8, 'b', 'toast', 60], [8, 'b', 'yogurt', 100], [13, 'l', 'udon', 240], [15, 's', 'banana', 70], [19, 'd', 'shogayaki', 741]],
    [[7, 'b', 'rice', 100], [7, 'b', 'natto', 54], [12, 'l', 'curry', 510], [19, 'd', 'rice', 150], [19, 'd', 'karaage', 110]]
  ]
};
/** How many days back (today too) the demo has meals. */
const MEAL_DAYS = 4;
/** A's breakfast repeat starts this many days back. */
const REPEAT_FROM = 2;

const iso = (ms: number) => new Date(ms).toISOString();
const at = (date: string, h: number, m = 0) => jstMs(date, h, m);

/** The demo's rows as of `now` (only rows the server would have stamped by then). */
function demoRows(now: number, weeksBack: number, zeros = false): SnapshotRows {
  const today = localDateAt(now);
  const cur = weekKeyOf(today);
  const first = addDays(cur, -7 * weeksBack);
  const metrics: MetricRow[] = [];
  const events: EventRow[] = [];
  let n = 0;
  const ev = (t: number, p: PersonId, type: EventRow[3], data: object) => {
    if (t < now) events.push([iso(t), p, `demo-${++n}`, type, JSON.stringify(data)]);
  };

  for (let d = first; d <= today; d = addDays(d, 1)) {
    const isToday = d === today;
    const night = at(d, 22, 30);
    // Today only has a midday sync, scaled to the hour.
    const partial = isToday ? Math.max(0, Math.min(1, (now - at(d, 6)) / (16 * 3600_000))) : 1;
    const syncAt = isToday ? Math.min(now - 40 * 60_000, night) : night;
    // A typical week: about 2 in 5 days both of us do everything (ふたりでぜんぶ); otherwise each goal is a coin toss,
    // so each goal is met on ~5 of 7 days. The Move goals are the defaults (ウェイ 600, うめ 400; うめ 450 later).
    const good = rng(`day|${d}`)() < 0.4;
    for (const p of ['A', 'B'] as PersonId[]) {
      const r = rng(`${p}|${d}`);
      /** Around a goal: met (5–35% over; about 1 in 5 met goals at 1.5–1.75×, がんばり) or not (50–95% of it). The
       *  stretch has its own RNG, so the rest of the history doesn't move with it. */
      const sr = rng(`${p}|stretch|${d}`);
      const over = () => {
        const x = 1.05 + r() * 0.3;
        return sr() < STRETCH_ODDS ? 1.5 + sr() * 0.25 : x;
      };
      const around = (goal: number) => Math.round(goal * (good || r() < 0.5 ? over() : 0.5 + r() * 0.45) * partial);
      const steps = around(8000), mins = around(60), kcal = around(p === 'A' ? 600 : 450), stand = around(120);
      const watch = isToday || rng(`${p}|watch|${d}`)() >= NO_WATCH;
      if (syncAt > at(d, 6) && syncAt < now) {
        metrics.push([iso(syncAt), p, d, 'steps', Math.max(300, steps)]);
        if (watch) {
          metrics.push(
            [iso(syncAt), p, d, 'exercise_min', Math.max(0, mins)], [iso(syncAt), p, d, 'move_kcal', Math.max(30, kcal)],
            [iso(syncAt), p, d, 'stand_min', Math.max(5, stand)]
          );
        } else if (zeros) metrics.push([iso(syncAt), p, d, 'exercise_min', 0], [iso(syncAt), p, d, 'move_kcal', 0], [iso(syncAt), p, d, 'stand_min', 0]);
      }
    }
  }

  // Harvests: both tap 受け取る on Sunday evening.
  for (let wk = first; provisionalMs(wk) <= now; wk = addDays(wk, 7)) {
    const p0 = provisionalMs(wk);
    ev(Math.max(p0 + 1000, Math.min(p0 + 25 * 60_000, now - 2000)), 'B', 'harvest', { week: wk });
    ev(Math.max(p0 + 2000, Math.min(p0 + 40 * 60_000, now - 1000)), 'A', 'harvest', { week: wk });
  }

  const w = (k: number) => addDays(cur, -7 * k);
  // うめ raises her Move goal to 450 kcal (3 weeks ago, from that Wednesday on: earlier days keep 400).
  ev(at(addDays(w(3), 2), 7, 30), 'B', 'pref', { key: 'moveGoal', value: 450 });

  // The wallet, as a typical week (~50 ベル) affords it: in each three weeks an おやつ, a 外食 and a week of saving
  // (110 of ~150), so the jar keeps growing; and one buy taken back by its buyer. Over the whole history
  // (`?demo&weeks=20`: more than ten buys, for the jar's もっと見る).
  const buy = (t: number, p: PersonId, spendId: string, item: ShopItemId) => ev(t, p, 'spend', { spendId, item, bells: shopPrice(item) });
  for (let k = weeksBack - 1; k >= 1; k--) {
    if (k % 3 === 1) buy(at(addDays(w(k), 2), 15, 20), k % 2 ? 'A' : 'B', `demo-snack-${k}`, 'snack');
    if (k % 3 === 0) buy(at(addDays(w(k), 6), 12, 30), k % 2 ? 'A' : 'B', `demo-dinner-${k}`, 'dinner');
  }
  buy(at(addDays(w(4), 3), 19, 30), 'A', 'demo-snack-void', 'snack');
  ev(at(addDays(w(4), 3), 19, 34), 'A', 'spend_void', { spendId: 'demo-snack-void' });
  if (today > cur) buy(at(addDays(cur, 0), 18, 30), 'A', 'demo-snack-now', 'snack');

  // Body weight (and the scale's body fat, BMI and lean body mass): 12 weeks of morning weigh-ins (or the whole longer history), gently down with day-to-day water noise
  // and a slow seasonal swing, a few days skipped, synced after breakfast; and a goal each. Weight never earns, so none
  // of this moves a ベル.
  const WEIGHT_DEMO: Record<PersonId, { start: number; perWeek: number; noise: number; skip: number; goal: number; fat: number; fatPerWeek: number; height: number }> = {
    A: { start: 72.6, perWeek: -0.35, noise: 0.9, skip: 0.15, goal: 66, fat: 22.4, fatPerWeek: -0.15, height: 1.74 },
    B: { start: 58.4, perWeek: -0.2, noise: 0.7, skip: 0.25, goal: 55.5, fat: 28.1, fatPerWeek: -0.1, height: 1.58 }
  };
  const wWeeks = Math.max(12, weeksBack);
  const wStart = addDays(cur, -7 * wWeeks);
  for (let d = wStart, i = 0; d <= today; d = addDays(d, 1), i++) {
    for (const p of ['A', 'B'] as PersonId[]) {
      const c = WEIGHT_DEMO[p];
      const r = rng(`${p}|weight|${d}`);
      if (r() < c.skip) continue;
      // the same overall loss as 12 weeks at perWeek, spread over a longer history
      const kg = c.start + (c.perWeek * 12 * i) / (7 * wWeeks) + 0.6 * Math.sin(i / 58) + (r() + r() + r() - 1.5) * c.noise;
      const syncAt = at(d, 8, 10 + Math.floor(r() * 30));
      if (syncAt >= now) continue;
      metrics.push([iso(syncAt), p, d, 'weight', Math.round(kg * 10) / 10]);
      // the smart scale writes body fat, BMI and lean body mass with the weigh-in (body fat slowly down, noisy)
      const fat = c.fat + (c.fatPerWeek * 12 * i) / (7 * wWeeks) + (r() + r() - 1) * 0.8;
      metrics.push(
        [iso(syncAt), p, d, 'body_fat_pct', Math.round(fat * 10) / 10],
        [iso(syncAt), p, d, 'bmi', Math.round((kg / c.height ** 2) * 10) / 10],
        [iso(syncAt), p, d, 'lean_kg', Math.round(kg * (1 - fat / 100) * 10) / 10]
      );
    }
  }
  ev(at(wStart, 21, 0), 'A', 'pref', { key: 'goalWeight', value: WEIGHT_DEMO.A.goal });
  ev(at(addDays(wStart, 2), 21, 0), 'B', 'pref', { key: 'goalWeight', value: WEIGHT_DEMO.B.goal });
  // B's body fat goal too (A's is left unset: the demo shows both a chart with one and one without)
  ev(at(addDays(wStart, 2), 21, 1), 'B', 'pref', { key: 'goalBodyFat', value: 26 });
  // made-up profiles (せってい → プロフィール): the defaults' and the BMI card's category's inputs
  ev(at(wStart, 21, 2), 'A', 'pref', { key: 'sex', value: 'm' });
  ev(at(wStart, 21, 3), 'A', 'pref', { key: 'birth', value: '1991-05-12' });
  ev(at(wStart, 21, 4), 'A', 'pref', { key: 'bmiStd', value: 'asia' });
  ev(at(addDays(wStart, 2), 21, 2), 'B', 'pref', { key: 'sex', value: 'f' });
  ev(at(addDays(wStart, 2), 21, 3), 'B', 'pref', { key: 'birth', value: '1994-08-20' });

  // The meal log: the last days' meals, each logged a few minutes after it was eaten (only what is past by now), and a
  // kcal goal each. A meal never earns, so none of this moves a ベル. A's breakfast is いつもの (a repeat, 毎日) from
  // REPEAT_FROM days back: those days' breakfasts are its, not logged.
  const repeatFrom = addDays(today, -REPEAT_FROM);
  const t0 = at(repeatFrom, 7, 5);
  ev(t0, 'A', 'food_repeat', { id: 'rdemoab', at: t0, m: 'b', it: [{ g: 150, f: FOODS.rice }, { g: 54, f: FOODS.natto }], w: WEEKDAYS.all, from: repeatFrom });
  for (let k = MEAL_DAYS - 1; k >= 0; k--) {
    const d = addDays(today, -k);
    for (const p of ['A', 'B'] as PersonId[]) {
      MEALS_DEMO[p][k % MEALS_DEMO[p].length].forEach(([h, m, food, g], i) => {
        if (p === 'A' && m === 'b' && d >= repeatFrom) return;
        const t = at(d, h, 10 + i * 3 + (p === 'B' ? 1 : 0));
        ev(t, p, 'food', { id: `fdemo${d.replace(/-/g, '')}${p.toLowerCase()}${i}`, at: t, d, m, g, f: FOODS[food] });
      });
    }
  }
  ev(at(addDays(today, -MEAL_DAYS), 21, 5), 'A', 'pref', { key: 'kcalGoal', value: 2200 });
  // A's recipe, everyone's to log (マイレシピ)
  const tr = at(addDays(today, -MEAL_DAYS), 20, 30);
  ev(tr, 'A', 'food_recipe', { ...CURRY_RECIPE, at: tr });
  // a custom food each, everyone's to log (マイ食品): A's canteen set meal, its weight unknown (a serving logs as a nominal 100 g),
  // and B's onigiri by weight
  const tc = at(addDays(today, -MEAL_DAYS), 20, 40);
  ev(tc, 'A', 'food_custom', { id: 'mdemoa1', at: tc, n: '社食の日替わり定食', u: '1個', k: 650, p: 22, fa: 18, c: 95, s: 3 });
  ev(tc + 60_000, 'B', 'food_custom', { id: 'mdemob1', at: tc + 60_000, n: '手作りおにぎり（鮭）', u: '1個', g: 110, k: 180, p: 5, fa: 1, c: 38, s: 1 });
  ev(at(addDays(today, -MEAL_DAYS), 21, 6), 'B', 'pref', { key: 'kcalGoal', value: 1700 });

  const byAt = <T extends readonly unknown[]>(rows: T[]) => rows.sort((x, y) => String(x[0]).localeCompare(String(y[0])));
  return { metrics: byAt(metrics), events: byAt(events) };
}

/** The demo's Health rows: `some` (the no-watch days steps only), `zero` (their watch metrics 0), `none` (no rows). */
type DemoHealth = 'some' | 'zero' | 'none';

/** A snapshot cache for the demo store (me = A, or B with `?demo&as=B`; no Health rows with `?demo&health=none`, the
 *  no-watch days as 0/0/0 with `?demo&health=zero`). */
export function demoCache(now: number, me: Who = 'A', weeks = DEMO_WEEKS_BACK, health: DemoHealth = 'some'): SnapshotCache {
  const made = demoRows(now, Math.max(1, Math.min(260, Math.round(weeks))), health === 'zero');
  const all = health !== 'none' ? made : { ...made, metrics: [] };
  // what the record would send this key (contract/guest.ts rowsFor): the guest's (`?demo&as=G`) without the からだ rows
  const rows = rowsFor(me, all);
  return { v: 1, me, rows, since: maxAt(rows), skewMs: 0, fetchedAt: now, demo: true };
}
