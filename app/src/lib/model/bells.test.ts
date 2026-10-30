// ADR 0019 on read (what earns: ADR 0021; one wallet: ADR 0022): earnings land in the wallet as they happen, the
// weekly bonus at the Sunday harvest, buys replay against it (never below zero), voids, the shared menus, locks, the Move goal in
// force per day and the きろく ledger.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows, WorkoutRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { weekDays } from '#lib/scoring/index.ts';
import { reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, walletAt, weekBells } from './bells.ts';
import { dayDetail, historyWeeks, weekDetail } from './history.ts';

const WK = '2026-11-16'; // Sunday 19:30 = 11-22 10:30Z; lock = Wednesday 11-25 04:00 JST
const D = weekDays(WK);
const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
const ms = (date: string, hm: string) => Date.parse(jst(date, hm));

let n = 0;
const ev = (at: string, person: PersonId, type: EventRow[3], data: object): EventRow => [at, person, `e${++n}`, type, JSON.stringify(data)];
const metric = (at: string, person: PersonId, date: string, m: MetricRow[3], v: number): MetricRow => [at, person, date, m, v];
const pilates = (person: PersonId, date: string): WorkoutRow =>
  [jst(date, '22:00'), person, `${person}-${date}`, date, 'Pilates', jst(date, '18:00'), jst(date, '18:40'), 40, 110];
const rowsOf = (add: Partial<SnapshotRows> = {}): SnapshotRows => ({
  metrics: add.metrics ?? [], workouts: add.workouts ?? [], presence: add.presence ?? [], events: add.events ?? []
});
const plus = (a: SnapshotRows, b: Partial<SnapshotRows>): SnapshotRows => ({
  metrics: [...a.metrics, ...(b.metrics ?? [])], workouts: [...a.workouts, ...(b.workouts ?? [])],
  presence: [...a.presence, ...(b.presence ?? [])], events: [...a.events, ...(b.events ?? [])]
});

/** Every daily maximum on every day of WK, for both: 1,140 a day each, all five badges. */
function perfectWeek(people: PersonId[] = ['A', 'B']): SnapshotRows {
  const r = rowsOf();
  for (const p of people) {
    for (const d of D) {
      const at = jst(d, '22:00');
      r.metrics.push(
        metric(at, p, d, 'steps', 9000), metric(at, p, d, 'exercise_min', 60), metric(at, p, d, 'move_kcal', 700), metric(at, p, d, 'stand_min', 200)
      );
      r.workouts.push(pilates(p, d));
    }
  }
  return r;
}
const spend = (at: string, p: PersonId, spendId: string, bells: number, label = 'アイス', item = 'ice') =>
  ev(at, p, 'spend', { spendId, item, label, bells });
const potsAt = walletAt;

const SUN_BEFORE = ms(D[6], '19:29');
const SUN_AFTER = ms(D[6], '19:31');
const MON_AFTER = ms('2026-11-23', '12:00');
const LOCKED = ms('2026-11-26', '12:00');

describe('daily earnings land as they happen', () => {
  it('today’s ベル show on the person, the fruits and the wallet', () => {
    const now = ms(D[2], '23:00'); // Wednesday night
    const v = buildWeekView(reduce(perfectWeek()), 'A', now);
    expect(v.people.A.today).toEqual({ bells: 1140, rings: { peach: 180, pear: 180, cherry: 180, apple: 200, coconut: 400 } });
    expect(v.people.A.weekBells).toBe(3 * 1140); // only days up to today count, even with later-dated rows
    expect(v.wallet).toEqual({ earned: 6 * 1140, spent: 0, balance: 6 * 1140, today: 2280, week: 6 * 1140 }); // no split
    const rings = v.people.A.rings;
    expect(rings.peach).toEqual({ today: 60, goal: 60, met: true, todayBells: 180, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 });
    expect(rings.pear).toEqual({ today: 700, goal: 600, met: true, todayBells: 180, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 });
    expect(rings.cherry).toEqual({ today: 200, goal: 180, met: true, todayBells: 180, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 });
    expect(rings.apple).toMatchObject({ today: 9000, goal: 8000, met: true, todayBells: 200, weekGoalDays: 4, weekBells: 600 });
    expect(rings.coconut).toMatchObject({ today: 1, goal: 1, met: true, todayBells: 400, weekDays: 7, weekGoalDays: 3 });
    expect(v.people.A.moveGoal).toBe(600);
    expect(v.people.B.moveGoal).toBe(400);
    expect(v.people.B.rings.pear).toMatchObject({ today: 700, goal: 400, met: true, todayBells: 180 });
  });

  it('a partial day: progress below the goals', () => {
    const r = rowsOf({ metrics: [metric(jst(D[0], '12:00'), 'B', D[0], 'steps', 5000), metric(jst(D[0], '12:00'), 'B', D[0], 'exercise_min', 20)] });
    const v = buildWeekView(reduce(r), 'A', ms(D[0], '13:00'));
    expect(v.people.B.today).toMatchObject({ bells: 60, rings: { peach: 60, pear: 0, cherry: 0, apple: 0, coconut: 0 } });
    expect(v.people.B.rings.apple).toMatchObject({ today: 5000, met: false, weekDays: 0, badge: false });
    expect(v.people.B.rings.peach).toMatchObject({ today: 20, goal: 60, met: false, todayBells: 60 });
    expect(v.people.A.today.bells).toBe(0);
    expect(v.wallet).toEqual({ earned: 60, spent: 0, balance: 60, today: 60, week: 60 });
  });

  it('the wallet’s today and week flows: today’s and this week’s earnings of both people', () => {
    // Monday 123 ベル (A: 41 min), Tuesday 9 (B: 3 min).
    const r = rowsOf({ metrics: [metric(jst(D[0], '22:00'), 'A', D[0], 'exercise_min', 41), metric(jst(D[1], '09:00'), 'B', D[1], 'exercise_min', 3)] });
    const v = buildWeekView(reduce(r), 'A', ms(D[1], '12:00'));
    expect(v.wallet).toEqual({ earned: 132, spent: 0, balance: 132, today: 9, week: 132 });
  });

  it('days before the economy’s first week (2026-10-26) never earn', () => {
    const r = rowsOf({ metrics: [metric(jst('2026-10-25', '22:00'), 'A', '2026-10-25', 'steps', 20000), metric(jst('2026-10-26', '22:00'), 'A', '2026-10-26', 'steps', 8000)] });
    const p = potsAt(reduce(r), ms('2026-10-27', '12:00'));
    expect(p.wallet.earned).toBe(200);
    expect(p.weeks.map((w) => w.weekKey)).toEqual(['2026-10-26']);
  });
});

describe('the weekly bonus lands at the Sunday 19:30 harvest', () => {
  it('+400 per badge each, +200 duo per shared badge; counted whether or not 受け取る is tapped', () => {
    const s = reduce(perfectWeek());
    const before = buildWeekView(s, 'A', SUN_BEFORE);
    expect(before.harvest?.weekKey).toBe('2026-11-09'); // last week's (empty) harvest, never tapped
    expect(before.wallet.week).toBe(14 * 1140);
    const after = buildWeekView(s, 'A', SUN_AFTER);
    expect(after.harvest).toMatchObject({ weekKey: WK, bonus: { A: 2000, B: 2000, duo: 1000 }, totalBells: 14 * 1140 + 5000, confirmedBy: [] });
    const five = { peach: true, pear: true, cherry: true, apple: true, coconut: true };
    expect(after.harvest!.ringBadges).toEqual({ A: five, B: five });
    expect(after.wallet).toMatchObject({ week: 14 * 1140 + 5000, earned: 14 * 1140 + 5000, balance: 14 * 1140 + 5000 });
    expect(after.host).toMatchObject({ key: 'host.harvest_ready', params: { bells: 14 * 1140 + 5000 } });
  });

  it('a missed badge costs only its share of the duo bonus', () => {
    const r = perfectWeek();
    r.metrics = r.metrics.filter((m) => !(m[1] === 'B' && m[3] === 'stand_min' && m[2] >= D[2])); // B: 2 stand days
    const h = buildWeekView(reduce(r), 'B', SUN_AFTER).harvest!;
    expect(h.bonus).toEqual({ A: 2000, B: 1600, duo: 800 });
    expect(h.ringBadges.B).toEqual({ peach: true, pear: true, cherry: false, apple: true, coconut: true });
  });

  it('a harvest tap doesn’t change the money', () => {
    const r = perfectWeek();
    const tapped = plus(r, { events: [ev(jst(D[6], '19:40'), 'A', 'harvest', { week: WK }), ev(jst(D[6], '19:41'), 'B', 'harvest', { week: WK })] });
    const now = ms(D[6], '20:00');
    const a = buildWeekView(reduce(r), 'A', now);
    const b = buildWeekView(reduce(tapped), 'A', now);
    expect(b.harvest).toBeNull();
    expect(b.wallet).toEqual(a.wallet);
  });
});

describe('locks: earnings change until the Wednesday 04:00 lock, then they are fixed', () => {
  const base = rowsOf({ metrics: [metric(jst(D[0], '22:00'), 'A', D[0], 'steps', 5000)] });
  const late = (at: string, steps = 9000) => plus(base, { metrics: [metric(at, 'A', D[0], 'steps', steps)] });

  it('a late sync before the lock counts, also after the lock', () => {
    const r = late(jst('2026-11-24', '10:00')); // Tuesday after the week: still open
    expect(potsAt(reduce(base), MON_AFTER).wallet.earned).toBe(0);
    expect(potsAt(reduce(r), MON_AFTER).wallet.earned).toBe(200); // the step day (steps no longer turn into minutes)
    expect(potsAt(reduce(r), LOCKED).wallet.earned).toBe(200);
  });

  it('a sync stamped after the lock never changes the week (one stamped exactly at it still counts)', () => {
    expect(potsAt(reduce(late(jst('2026-11-25', '04:00'))), LOCKED).wallet.earned).toBe(200);
    const r = late(new Date(ms('2026-11-25', '04:00') + 1).toISOString());
    expect(potsAt(reduce(r), LOCKED).wallet.earned).toBe(0);
    expect(weekBells(reduce(r), WK, LOCKED).A.days[0].steps).toBe(5000);
    expect(historyWeeks(reduce(r), LOCKED).find((w) => w.weekKey === WK)!.bells).toBe(0);
  });

  it('an edit (metric_set) in the open week moves the earnings, even down', () => {
    const r = plus(perfectWeek(['A']), { events: [ev(jst(D[3], '08:00'), 'A', 'metric_set', { date: D[0], metric: 'steps', value: 1000 })] });
    const w = weekBells(reduce(r), WK, MON_AFTER);
    expect(w.A.days[0].rings.apple).toBe(0);
    expect(w.A.days[0].bells).toBe(940);
  });

  it('a locked week is the same from a fresh State of the same rows (cache) and with a revision', () => {
    const r = perfectWeek();
    const a = weekBells(reduce(r), WK, LOCKED);
    const b = weekBells(reduce(r, null, 'rev1'), WK, LOCKED);
    const c = weekBells(reduce(r, null, 'rev1'), WK, LOCKED + 3600_000);
    expect(b).toEqual(a);
    expect(c).toBe(b); // reused across States of one revision
  });
});

describe('buys: the wallet must cover them, the buyer can undo them (ADR 0022)', () => {
  // A perfect week for both: 14 × 1,140 + 5,000 = 20,960 in the wallet by Monday.
  const r = perfectWeek();
  const MON = '2026-11-23';

  it('a buy takes from the one wallet', () => {
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1', 2500, 'カフェデート', 'cafe'), spend(jst(MON, '10:01'), 'B', 's2', 15000, 'スパ', 'spa')] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.wallet).toEqual({ earned: 20960, spent: 17500, balance: 3460 });
  });

  it('a buy above the balance is ignored on read, never shown, and the balance never goes negative', () => {
    const s = reduce(plus(r, { events: [
      spend(jst(MON, '10:00'), 'A', 'big', 20961), // 1 more than the wallet
      spend(jst(MON, '10:01'), 'B', 'ok', 20960),
      spend(jst(MON, '10:02'), 'A', 'more', 1) // the wallet is empty now
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.wallet).toEqual({ earned: 20960, spent: 20960, balance: 0 });
    expect(p.spends.map((x) => x.spendId)).toEqual(['ok']);
  });

  it('a buy is judged at its own time: earnings that came later don’t rescue it', () => {
    const early = spend(jst(D[0], '23:00'), 'A', 'early', 2281); // Monday: 2 × 1,140
    const s = reduce(plus(r, { events: [early] }));
    expect(potsAt(s, MON_AFTER).spends).toEqual([]);
    const ok = spend(jst(D[0], '23:00'), 'A', 'ok', 2280);
    expect(potsAt(reduce(plus(r, { events: [ok] })), MON_AFTER).wallet.spent).toBe(2280);
  });

  it('the buyer’s spend_void gives it back; the partner’s, an early or a second one, is ignored', () => {
    const buy = spend(jst(MON, '10:00'), 'A', 's1', 500);
    const wallet = (events: EventRow[]) => potsAt(reduce(plus(r, { events: [buy, ...events] })), MON_AFTER);
    expect(wallet([]).wallet.balance).toBe(20460);
    const voided = wallet([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 's1' })]);
    expect(voided.wallet).toEqual({ earned: 20960, spent: 0, balance: 20960 });
    expect(voided.spends[0]).toMatchObject({ spendId: 's1', voided: true, voidedAt: ms(MON, '10:05') });
    expect(wallet([ev(jst(MON, '10:05'), 'B', 'spend_void', { spendId: 's1' })]).wallet.spent).toBe(500);
    expect(wallet([ev(jst(MON, '09:59'), 'A', 'spend_void', { spendId: 's1' })]).wallet.spent).toBe(500);
    expect(wallet([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 'nope' })]).wallet.spent).toBe(500);
  });

  it('a void frees the wallet for later buys, in server order', () => {
    const s = reduce(plus(r, { events: [
      spend(jst(MON, '10:00'), 'A', 'a', 20000),
      spend(jst(MON, '10:01'), 'B', 'b', 20000), // refused: only 960 left
      ev(jst(MON, '10:02'), 'A', 'spend_void', { spendId: 'a' }),
      spend(jst(MON, '10:03'), 'B', 'c', 20000)
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.spends.map((x) => [x.spendId, x.voided])).toEqual([['a', true], ['c', false]]);
    expect(p.wallet.balance).toBe(960);
  });

  it('buys are never locked: a void long after still counts', () => {
    const later = '2026-12-10';
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1', 13000), ev(jst(later, '10:00'), 'A', 'spend_void', { spendId: 's1' })] }));
    expect(potsAt(s, ms(later, '12:00')).wallet.spent).toBe(0);
  });

  it('malformed buys and the two pots’ spends (with a pot) are ignored', () => {
    const at = jst(MON, '10:00');
    const s = reduce(plus(r, { events: [
      ev(at, 'A', 'spend', { spendId: 'p1', pot: 'treat', item: 'ice', label: 'アイス', bells: 500 }),
      ev(at, 'A', 'spend', { spendId: 'x2', item: 'ice', label: 'アイス', bells: 1.5 }),
      ev(at, 'A', 'spend', { spendId: 'x3', item: 'ice', label: 'アイス', bells: -5 }),
      ev(at, 'A', 'spend', { spendId: 'x4', item: 'ice', label: 'x'.repeat(61), bells: 5 }),
      ev(at, 'A', 'spend', { spendId: 'x5', label: 'アイス', bells: 5 }),
      ev(at, 'A', 'spend', { spendId: 'x6', item: 'ice', label: 'アイス', bells: 10_000_001 }),
      ev(at, 'A', 'spend', { spendId: 'ok', item: 'ice', label: 'アイス', bells: 5 }),
      ev(at, 'A', 'spend', { spendId: 'ok', item: 'ice', label: 'アイス', bells: 5 }) // duplicate id
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.spends.map((x) => x.spendId)).toEqual(['ok']);
    expect(p.wallet.spent).toBe(5);
  });
});

describe('the menu: one list, shared and editable; the latest pref by either person wins', () => {
  const pref = (at: string, p: PersonId, key: string, value: unknown) => ev(at, p, 'pref', { key, value });
  const menu = (events: EventRow[], locale: 'ja' | 'en' = 'ja') => {
    const rows = rowsOf({ events: locale === 'en' ? [pref(jst(D[0], '08:00'), 'A', 'locale', 'en'), ...events] : events });
    return buildWeekView(reduce(rows), 'A', ms(D[1], '12:00')).menu.map(({ id, label, bells }) => ({ id, label, bells }));
  };

  it('five grouped defaults, in the viewer’s language', () => {
    expect(menu([])).toEqual([
      { id: 'snack', label: 'おやつ', bells: 1200 }, { id: 'cafe', label: 'カフェ・デザート', bells: 2500 }, { id: 'dinner', label: '外ごはん', bells: 6000 },
      { id: 'want', label: 'ほしいもの', bells: 8000 }, { id: 'trip', label: '旅のごほうび', bells: 12000 }
    ]);
    expect(menu([], 'en').map((x) => x.label)).toEqual(['Snack', 'Café & dessert', 'Eating out', 'Something we want', 'Trip treat']);
  });

  it('last writer wins across both people', () => {
    const a = [{ id: 'ice', label: 'アイス', bells: 600 }];
    const b = [{ id: 'parfait', label: 'パフェ', bells: 800 }, { id: 'camp', label: 'キャンプ', bells: 9000 }];
    expect(menu([pref(jst(D[0], '09:00'), 'A', 'menu', JSON.stringify(a)), pref(jst(D[0], '10:00'), 'B', 'menu', JSON.stringify(b))])).toEqual(b);
    expect(menu([pref(jst(D[0], '10:00'), 'B', 'menu', JSON.stringify(b)), pref(jst(D[0], '11:00'), 'A', 'menu', JSON.stringify(a))])).toEqual(a);
  });

  it('accepts the array itself or its JSON; an empty menu is valid; labels are trimmed; other keys are dropped', () => {
    expect(menu([pref(jst(D[0], '09:00'), 'A', 'menu', [{ id: 'a', section: 'trip', label: ' 飴 ', bells: 50 }])])).toEqual([{ id: 'a', label: '飴', bells: 50 }]);
    expect(menu([pref(jst(D[0], '09:00'), 'A', 'menu', '[]')])).toEqual([]);
  });

  it('an invalid menu is ignored as a whole (the previous one stays); the two pots’ menus are ignored', () => {
    const good = pref(jst(D[0], '09:00'), 'A', 'menu', JSON.stringify([{ id: 'a', label: '飴', bells: 50 }]));
    const bad = (value: unknown, key = 'menu') => menu([good, pref(jst(D[0], '10:00'), 'B', key, value)]);
    const item = { id: 'b', label: 'ケーキ', bells: 700 };
    for (const v of [
      'not json', '{}', JSON.stringify([{ ...item, bells: 0 }]), JSON.stringify([{ ...item, bells: 2.5 }]),
      JSON.stringify([{ ...item, label: '  ' }]), JSON.stringify([{ ...item, id: 'has space' }]), JSON.stringify([item, item]),
      JSON.stringify(Array.from({ length: 31 }, (_, i) => ({ ...item, id: `i${i}` }))), JSON.stringify([{ ...item, bells: 10_000_001 }])
    ]) expect(bad(v), v.slice(0, 40)).toEqual([{ id: 'a', label: '飴', bells: 50 }]);
    expect(bad(JSON.stringify([item]), 'treatMenu')).toEqual([{ id: 'a', label: '飴', bells: 50 }]);
  });
});

describe('the きろく ledger and history fields', () => {
  const r = plus(perfectWeek(), { events: [
    spend(jst('2026-11-23', '10:00'), 'A', 's1', 500),
    spend(jst('2026-11-23', '11:00'), 'B', 's2', 15000, 'スパ', 'spa'),
    ev(jst('2026-11-23', '11:05'), 'B', 'spend_void', { spendId: 's2' })
  ] });

  it('per-day rows for both people, bonus rows and spends, newest first', () => {
    const l = bellsLedger(reduce(r), MON_AFTER);
    expect(l.earned).toBe(20960);
    expect(l.wallet).toEqual({ earned: 20960, spent: 500, balance: 20460 });
    expect(l.days[0]).toMatchObject({ date: '2026-11-23', weekKey: '2026-11-23', bells: 0, locked: false });
    const sun = l.days.find((d) => d.date === D[6])!;
    expect(sun).toMatchObject({ weekKey: WK, bells: 2280, locked: false, people: { A: { date: D[6], bells: 1140 }, B: { bells: 1140 } } });
    expect(sun.people.A.rings).toEqual({ peach: 180, pear: 180, cherry: 180, apple: 200, coconut: 400 });
    expect(l.days.at(-1)!.date).toBe('2026-10-26');
    expect(l.days).toHaveLength(29); // 10-26 → 11-23
    expect(l.bonuses.map((b) => [b.weekKey, b.bells])).toEqual([[WK, 5000], ['2026-11-09', 0], ['2026-11-02', 0], ['2026-10-26', 0]]);
    expect(l.bonuses[0]).toMatchObject({
      at: SUN_BEFORE + 60_000, bonus: { A: 2000, B: 2000, duo: 1000 }, ringBadges: { A: { cherry: true }, B: { pear: true } }
    });
    expect(l.spends.map((x) => [x.spendId, x.by, x.item, x.label, x.bells, x.voided])).toEqual([
      ['s2', 'B', 'spa', 'スパ', 15000, true], ['s1', 'A', 'ice', 'アイス', 500, false]
    ]);
    expect(bellsLedger(reduce(r), LOCKED).days.find((d) => d.date === D[0])!.locked).toBe(true);
  });

  it('week list, week detail and day detail carry the ベル', () => {
    const s = reduce(r);
    const w = historyWeeks(s, SUN_BEFORE).find((x) => x.weekKey === WK)!;
    expect(w.bells).toBe(14 * 1140); // no bonus before the harvest
    const five = { peach: true, pear: true, cherry: true, apple: true, coconut: true };
    expect(w.people.A).toMatchObject({ bells: 7 * 1140, ringBadges: five });
    expect(historyWeeks(s, MON_AFTER).find((x) => x.weekKey === WK)!.bells).toBe(20960);
    const d = weekDetail(s, WK, MON_AFTER);
    expect(d).toMatchObject({ bells: 20960, bonus: { A: 2000, B: 2000, duo: 1000 } });
    expect(d.people.B).toMatchObject({ dailyBells: 7980, bonus: 2000, ringBadges: five });
    expect(d.people.A.ringWeek).toEqual({ peach: { days: 7, goal: 5 }, pear: { days: 7, goal: 5 }, cherry: { days: 7, goal: 5 }, apple: { days: 7, goal: 4 }, coconut: { days: 7, goal: 3 } });
    expect(w.people.B.ringWeek).toEqual(d.people.B.ringWeek);
    expect(d.people.A.days[0]).toMatchObject({
      bells: 1140, rings: { peach: 180, pear: 180, cherry: 180, apple: 200, coconut: 400 },
      exerciseMin: 60, moveKcal: 700, moveGoal: 600, standMin: 200, steps: 9000, gym: true, met: five
    });
    expect(d.people.B.days[0]).toMatchObject({ moveGoal: 400 });
    const mid = weekDetail(s, WK, ms(D[1], '12:00'));
    expect(mid.people.A.days.map((x) => x.bells)).toEqual([1140, 1140, 0, 0, 0, 0, 0]); // future days: 0
    expect(dayDetail(s, D[3], MON_AFTER).people.A).toMatchObject({
      bells: 1140, rings: { coconut: 400 }, met: five, exercise: { value: 60, watch: 60, source: 'watch', edited: false },
      move: { value: 700, goal: 600, edited: false }, stand: { value: 200, edited: false }
    });
  });
});

describe('the Move goal in force (ADR 0021 §5): per person, from the day it is set, never re-pricing earlier days', () => {
  // A: 450 kcal every day. Default goal 600 → 135 a day; a goal of 400 set on Wednesday morning pays 180 from Wednesday.
  const kcal = rowsOf({ metrics: D.map((d) => metric(jst(d, '22:00'), 'A', d, 'move_kcal', 450)) });
  const goal = (at: string, p: PersonId, value: number) => ev(at, p, 'pref', { key: 'moveGoal', value });
  const pears = (r: SnapshotRows, now: number) => weekBells(reduce(r), WK, now).A.days.map((d) => [d.rings.pear, d.moveGoal]);

  it('the default goal: ウェイ 600, うめ 400', () => {
    expect(pears(kcal, MON_AFTER)).toEqual(D.map(() => [135, 600]));
  });

  it('a change applies from the day it is made (Tokyo date) to every later day', () => {
    const r = plus(kcal, { events: [goal(jst(D[2], '07:00'), 'A', 400)] });
    expect(pears(r, MON_AFTER)).toEqual([[135, 600], [135, 600], [180, 400], [180, 400], [180, 400], [180, 400], [180, 400]]);
    expect(buildWeekView(reduce(r), 'A', ms(D[1], '23:00')).people.A.moveGoal).toBe(600); // Tuesday: still the old goal
    expect(buildWeekView(reduce(r), 'A', ms(D[2], '12:00')).people.A.rings.pear).toMatchObject({ today: 450, goal: 400, met: true, todayBells: 180 });
    expect(buildWeekView(reduce(r), 'B', ms(D[2], '12:00')).people.B.moveGoal).toBe(400); // B's own default
  });

  it('a later change wins from its day; one made at 23:59 still counts for that whole day', () => {
    const r = plus(kcal, { events: [goal(jst(D[1], '23:59'), 'A', 450), goal(jst(D[4], '00:00'), 'A', 900)] });
    expect(pears(r, MON_AFTER).map(([, g]) => g)).toEqual([600, 450, 450, 450, 900, 900, 900]);
    expect(pears(r, MON_AFTER).map(([b]) => b)).toEqual([135, 180, 180, 180, 90, 90, 90]);
  });

  it('a change after the week never re-prices it; one partner’s goal never moves the other’s', () => {
    const r = plus(kcal, { events: [goal(jst('2026-11-23', '08:00'), 'A', 400), goal(jst(D[0], '08:00'), 'B', 1000)] });
    expect(pears(r, MON_AFTER)).toEqual(D.map(() => [135, 600]));
  });
});
