// The demo runs the real model on generated rows: it must show a believable, consistent history.
import { beforeEach, describe, expect, it } from 'vitest';
import { composeModel } from '../view.ts';
import { demoCache } from './rows.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { provisionalMs, reduce } from '#lib/model/state.ts';
import { bellsLedger, economyWeeks, walletAt, weekBells, weekSum } from '#lib/model/bells.ts';
import { dayDetail } from '#lib/model/history.ts';
import { addDays } from '#lib/time/dates.ts';
import { shopPrice } from '#lib/contract/rules.ts';
import { isActivityMetric } from '#lib/contract/api.ts';
import { customs, foodDay, recipes, setGoal } from '#lib/model/food.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { packFold, packList, tripNoteOf } from '#lib/contract/pack.ts';
import { wedConfig, wedFold, wedNote, wedTasks } from '#lib/contract/wedding.ts';
import { overallProgress, withProgress } from '#lib/wedding/progress.ts';

describe.each(['2026-10-29T08:00:00.000Z', '2026-11-02T01:00:00.000Z', '2026-11-08T11:00:00.000Z', '2026-12-20T13:00:00.000Z'])('demo at %s', (iso) => {
  const now = Date.parse(iso);
  let cache: ReturnType<typeof demoCache>;
  let s: ReturnType<typeof reduce>;
  beforeEach(() => {
    cache = demoCache(now);
    s = reduce(cache.rows);
  });

  it('has 9 weeks of history for both people, with ベル and some ふたりでぜんぶ days', () => {
    const weeks = economyWeeks(s, now);
    expect(weeks).toHaveLength(9);
    const past = weeks.filter((wk) => provisionalMs(wk) <= now);
    expect(past.length).toBeGreaterThanOrEqual(8);
    const sums = past.map((wk) => weekSum(weekBells(s, wk, now), addDays(wk, 6)));
    for (const w of sums) {
      expect(w.A).toBeGreaterThan(8);
      expect(w.B).toBeGreaterThan(8);
      expect(w.total).toBeLessThanOrEqual(70);
    }
    expect(sums.some((w) => w.togetherDays > 0)).toBe(true);
  });

  it('four fruits only, and only the synced tabs', () => {
    expect(Object.keys(cache.rows).sort()).toEqual(['events', 'metrics']);
    const d = dayDetail(s, economyWeeks(s, now)[0], now);
    expect(Object.keys(d.people.A.met)).toEqual(['pear', 'peach', 'cherry', 'apple']);
  });

  it('the buys were all accepted (one voided); the wallets add up', () => {
    const ledger = bellsLedger(s, now);
    const sent = cache.rows.events.filter((e) => e[3] === 'spend').map((e) => JSON.parse(e[4]).spendId);
    expect(ledger.spends.map((x) => x.spendId).sort()).toEqual([...sent].sort());
    expect(ledger.spends.filter((x) => x.voided).map((x) => x.spendId)).toEqual(sent.includes('demo-snack-void') ? ['demo-snack-void'] : []);
    const m = composeModel(cache, [], now);
    const view = buildWeekView(m.state, m.me, m.now);
    // everything earned less the live buys: both wallets
    const left = ledger.earned - ledger.spends.reduce((n, x) => (x.voided ? n : n + x.bells), 0);
    expect(walletAt(s, now).total).toBe(left);
    // both of us buy
    expect(new Set(ledger.spends.map((x) => x.by))).toEqual(new Set(['A', 'B']));
    // the demo can always buy either reward, from either wallet
    for (const p of ['A', 'B'] as const) expect(view.wallet.people[p].balance).toBeGreaterThanOrEqual(shopPrice('dinner', now)!);
    if (process.env.DEMO_DEBUG) console.log(iso, view.wallet, view.people.A.today, view.together);
  });

  it('Move and Stand every day; うめ’s Move goal applies from its day', () => {
    expect(cache.rows.events.filter((e) => !['spend', 'spend_void', 'harvest', 'pref', 'food', 'food_repeat', 'food_recipe', 'food_custom', 'listen', 'pack', 'pack_chk', 'trip_note', 'wtask', 'wdone', 'wconf', 'wnote'].includes(e[3]))).toEqual([]);
    const metrics = new Set(cache.rows.metrics.map((m) => m[3]));
    expect([...metrics].sort()).toEqual(['bmi', 'body_fat_pct', 'exercise_min', 'lean_kg', 'move_kcal', 'stand_min', 'steps', 'weight']);
    const settled = economyWeeks(s, now).filter((wk) => provisionalMs(wk) <= now);
    const goals = new Set(settled.flatMap((wk) => [0, 1, 2, 3, 4, 5, 6].map((i) => dayDetail(s, addDays(wk, i), now).people.B.move.goal)));
    expect([...goals].sort()).toEqual([400, 450]);
  });

  it('the last days’ meals for both, every one taken, and a kcal goal each; the guest sees them too', () => {
    const sent = cache.rows.events.filter((e) => e[3] === 'food').length;
    const yesterday = addDays(localDateAt(now), -1);
    const days = (['A', 'B'] as const).map((p) => foodDay(s, p, yesterday));
    for (const d of days) {
      expect(d.entries.length).toBeGreaterThanOrEqual(4);
      expect(d.kcal).toBeGreaterThan(900);
      expect(d.kcal).toBeLessThan(3000);
    }
    const all = [0, 1, 2, 3].flatMap((k) => (['A', 'B'] as const).flatMap((p) => foodDay(s, p, addDays(localDateAt(now), -k)).entries));
    expect(all.filter((e) => !e.rep)).toHaveLength(sent);
    // A's breakfast is いつもの from two days back: each of those days', today's too, is the repeat's (not logged too)
    const breakfast = (k: number) => foodDay(s, 'A', addDays(localDateAt(now), -k)).entries.filter((e) => e.m === 'b');
    for (const k of [0, 1, 2]) expect(breakfast(k).map((e) => [e.rep, e.f.n])).toEqual([['rdemoab', 'ごはん（精白米）'], ['rdemoab', '納豆（たれ・からし付き）']]);
    expect(breakfast(3).every((e) => !e.rep)).toBe(true);
    expect([setGoal(s, 'A', 'k'), setGoal(s, 'B', 'k')]).toEqual([2200, 1700]);
    expect(foodDay(reduce(demoCache(now, 'G').rows), 'A', yesterday)).toEqual(days[0]);
  });

  it('A’s recipe 「おうちカレー」 4人前, a plausible serving, seen by the guest too', () => {
    const [r] = recipes(s);
    expect([r.who, r.n, r.sv, r.it.length]).toEqual(['A', 'おうちカレー', 4, 6]);
    expect(r.per.kcal).toBeGreaterThan(500);
    expect(r.per.kcal).toBeLessThan(900);
    expect(recipes(reduce(demoCache(now, 'G').rows))).toEqual(recipes(s));
    // A's serving of it, two days ago: logged from it (its id), seen by the guest too
    const d = addDays(localDateAt(now), -2);
    const e = foodDay(s, 'A', d).entries.find((x) => x.f.id === `recipe:${r.id}`);
    expect([e?.m, e?.f.n, e?.f.u]).toEqual(['l', 'おうちカレー', '1人前']);
    expect(foodDay(reduce(demoCache(now, 'G').rows), 'A', d).entries.map((x) => x.id)).toContain(e!.id);
  });

  it('NZ’s packing list as two phones left it: うめ’s ticks and item, A’s tick, a made-up note each trip; the guest’s too', () => {
    const seed = { cats: [{ id: 'nz-0', name: { ja: '書類' }, icon: 'file', items: [{ id: 'nz-0-0', text: { ja: 'パスポート' } }, { id: 'nz-0-1', text: { ja: 'NZeTA' } }] }] };
    for (const rows of [s.pack, reduce(demoCache(now, 'G').rows).pack]) {
      const b = packFold(rows);
      expect(packList('nz', seed, b)[0].items.map((i) => [i.id, i.ticks.join('')])).toEqual([['nz-0-0', 'AB'], ['nz-0-1', 'B'], ['_demob001', 'B']]);
      for (const trip of ['okinawa', 'seattle', 'nz']) expect(tripNoteOf(trip, b)).toMatchObject({ flightRef: 'DEMO01' });
    }
  });

  it('けっこんしき: a made-up board, every row taken (settings, tasks with a checklist, ticks, one deleted, one from the old Sheet, the notes); the guest’s the same', () => {
    for (const rows of [s.wedding, reduce(demoCache(now, 'G').rows).wedding]) {
      const b = wedFold(rows);
      expect(rows).toHaveLength(cache.rows.events.filter((e) => ['wtask', 'wdone', 'wconf', 'wnote'].includes(e[3])).length);
      expect(wedConfig(b)).toMatchObject({ p1: 'たろう', p2: 'はなこ', venue: '架空チャペル', time: '11:00' });
      const plan = withProgress(wedTasks(b), localDateAt(now));
      expect(plan).toHaveLength(8);
      expect(plan.flatMap((t) => t.subtasks)).toHaveLength(6);
      expect(overallProgress(plan)).toMatchObject({ total: 8, done: 2, overdue: 1, soon: 1 });
      expect(plan.filter((t) => t.doneAt).map((t) => [t.id, t.doneBy]).sort()).toEqual([['wdemo01', ''], ['wdemo09', 'A']]);
      expect(wedTasks(b).filter((t) => t.deletedAt)).toHaveLength(1);
      expect(wedNote(b)?.md).toContain('# メモ');
    }
  });

  it('a custom food each: A’s with no weight (a nominal 100 g), B’s by weight; seen by the guest too', () => {
    expect(customs(s).map((c) => [c.who, c.n, c.u, c.g, c.k])).toEqual([['B', '手作りおにぎり（鮭）', '1個', 110, 180], ['A', '社食の日替わり定食', '1個', undefined, 650]]);
    expect(customs(reduce(demoCache(now, 'G').rows))).toEqual(customs(s));
  });
});

describe('?demo&weeks=60: a longer history for けんこう', () => {
  const now = Date.parse('2026-10-31T03:00:00.000Z');
  const cache = demoCache(now, 'A', 60);
  const s = reduce(cache.rows);
  it('has 61 weeks of activity, and weight across them', () => {
    const weeks = economyWeeks(s, now);
    expect(weeks).toHaveLength(61);
    const weighed = cache.rows.metrics.filter((m) => m[3] === 'weight').map((m) => String(m[2])).sort();
    expect(weighed[0] <= weeks[0]).toBe(true);
  });
  it('now and then a day whose Watch rows never arrived: steps only', () => {
    const days = new Map<string, Record<string, number>>();
    for (const [, p, d, m, v] of cache.rows.metrics) if (p === 'A' && isActivityMetric(m)) days.set(String(d), { ...days.get(String(d)), [m]: Number(v) });
    const bare = [...days.values()].filter((x) => x.steps > 0 && !('move_kcal' in x) && !('exercise_min' in x) && !('stand_min' in x));
    expect(bare.length).toBeGreaterThan(3);
    expect(bare.length).toBeLessThan(days.size / 10);
  });
});
