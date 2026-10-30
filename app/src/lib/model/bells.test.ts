// ADR 0019 on read (what earns: ADR 0021): earnings land in the two pots as they happen, the weekly bonus at the
// Sunday harvest, spends replay against the pots (never below zero), voids, the shared menus, locks, the Move goal in
// force per day and the きろく ledger.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows, WorkoutRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { weekDays } from '#lib/scoring/index.ts';
import { reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, potsAt, weekBells } from './bells.ts';
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
const spend = (at: string, p: PersonId, spendId: string, pot: 'treat' | 'trip', bells: number, label = 'アイス', item = 'ice') =>
  ev(at, p, 'spend', { spendId, pot, item, label, bells });

const SUN_BEFORE = ms(D[6], '19:29');
const SUN_AFTER = ms(D[6], '19:31');
const MON_AFTER = ms('2026-11-23', '12:00');
const LOCKED = ms('2026-11-26', '12:00');

describe('daily earnings land as they happen', () => {
  it('today’s ベル show on the person, the fruits and the pots', () => {
    const now = ms(D[2], '23:00'); // Wednesday night
    const v = buildWeekView(reduce(perfectWeek()), 'A', now);
    expect(v.people.A.today).toEqual({
      bells: 1140, rings: { peach: 180, pear: 180, cherry: 180, apple: 200, coconut: 400 },
      parts: { peach: 180, coconut: 400, apple: 200, pear: 180 } // deprecated: 🍐 = Move
    });
    expect(v.people.A.weekBells).toBe(3 * 1140); // only days up to today count, even with later-dated rows
    expect(v.pots.todayBells).toBe(2280);
    expect(v.pots.weekBells).toBe(6 * 1140);
    expect(v.pots.treat).toEqual({ earned: 1368, spent: 0, balance: 1368, today: 456, week: 1368 }); // 20% of 6 × 1,140
    expect(v.pots.trip).toMatchObject({ earned: 6 * 1140 - 1368, today: 2280 - 456, week: 6 * 1140 - 1368 });
    const rings = v.people.A.rings;
    expect(rings.peach).toEqual({ today: 60, goal: 60, met: true, todayBells: 180, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 });
    expect(rings.pear).toEqual({ today: 700, goal: 600, met: true, todayBells: 180, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 });
    expect(rings.cherry).toEqual({ today: 200, goal: 180, met: true, todayBells: 180, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 });
    expect(rings.apple).toMatchObject({ today: 9000, goal: 8000, met: true, todayBells: 200, weekGoalDays: 4, weekBells: 600 });
    expect(rings.coconut).toMatchObject({ today: 1, goal: 1, met: true, todayBells: 400, weekDays: 7, weekGoalDays: 3 });
    expect(v.people.A.moveGoal).toBe(600);
    expect(v.people.B.moveGoal).toBe(400);
    expect(v.people.B.rings.pear).toMatchObject({ today: 700, goal: 400, met: true, todayBells: 180 });
    expect(v.pending).toEqual([]);
    // Deprecated `fruits`, filled from the rings (🍐 = Move).
    expect(v.people.A.fruits.peach).toMatchObject({ todayActual: 60, todayGoal: 60, todayMet: true, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 });
    expect(v.people.A.fruits.pear).toMatchObject({ todayActual: 700, todayGoal: 600, todayMet: true });
  });

  it('a partial day: progress below the goals', () => {
    const r = rowsOf({ metrics: [metric(jst(D[0], '12:00'), 'B', D[0], 'steps', 5000), metric(jst(D[0], '12:00'), 'B', D[0], 'exercise_min', 20)] });
    const v = buildWeekView(reduce(r), 'A', ms(D[0], '13:00'));
    expect(v.people.B.today).toMatchObject({ bells: 60, rings: { peach: 60, pear: 0, cherry: 0, apple: 0, coconut: 0 } });
    expect(v.people.B.rings.apple).toMatchObject({ today: 5000, met: false, weekDays: 0, badge: false });
    expect(v.people.B.rings.peach).toMatchObject({ today: 20, goal: 60, met: false, todayBells: 60 });
    expect(v.people.A.today.bells).toBe(0);
    expect(v.pots.trip).toEqual({ earned: 48, spent: 0, balance: 48, today: 48, week: 48 });
    expect(v.pots.treat).toMatchObject({ earned: 12, today: 12, week: 12 });
  });

  it('per-pot flow: each pot’s share of today and this week, split on totals, so it never drifts from the balances', () => {
    // Monday 123 ベル (A: 41 min), Tuesday 9 (B: 3 min): 132 splits 26 / 106, Monday's 123 alone 24 / 99.
    const r = rowsOf({ metrics: [metric(jst(D[0], '22:00'), 'A', D[0], 'exercise_min', 41), metric(jst(D[1], '09:00'), 'B', D[1], 'exercise_min', 3)] });
    const v = buildWeekView(reduce(r), 'A', ms(D[1], '12:00'));
    expect(v.pots).toMatchObject({ todayBells: 9, weekBells: 132 });
    expect(v.pots.treat).toMatchObject({ earned: 26, today: 2, week: 26 }); // floor(132 × 0.2) − floor(123 × 0.2) = 26 − 24
    expect(v.pots.trip).toMatchObject({ earned: 106, today: 7, week: 106 });
  });

  it('days before the economy’s first week (2026-10-26) never earn', () => {
    const r = rowsOf({ metrics: [metric(jst('2026-10-25', '22:00'), 'A', '2026-10-25', 'steps', 20000), metric(jst('2026-10-26', '22:00'), 'A', '2026-10-26', 'steps', 8000)] });
    const p = potsAt(reduce(r), ms('2026-10-27', '12:00'));
    expect(p.earned).toBe(200);
    expect(p.weeks.map((w) => w.weekKey)).toEqual(['2026-10-26']);
  });
});

describe('the weekly bonus lands at the Sunday 19:30 harvest', () => {
  it('+400 per badge each, +200 duo per shared badge; counted whether or not 受け取る is tapped', () => {
    const s = reduce(perfectWeek());
    const before = buildWeekView(s, 'A', SUN_BEFORE);
    expect(before.harvest?.weekKey).toBe('2026-11-09'); // last week's (empty) harvest, never tapped
    expect(before.pots.weekBells).toBe(14 * 1140);
    const after = buildWeekView(s, 'A', SUN_AFTER);
    expect(after.harvest).toMatchObject({ weekKey: WK, bonus: { A: 2000, B: 2000, duo: 1000 }, totalBells: 14 * 1140 + 5000, confirmedBy: [] });
    const five = { peach: true, pear: true, cherry: true, apple: true, coconut: true };
    expect(after.harvest!.ringBadges).toEqual({ A: five, B: five });
    expect(after.harvest!.badges.A).toEqual({ peach: true, coconut: true, apple: true, pear: true }); // deprecated
    expect(after.pots.weekBells).toBe(14 * 1140 + 5000);
    expect(after.pots.treat.earned + after.pots.trip.earned).toBe(14 * 1140 + 5000);
    expect(after.pots.treat.week + after.pots.trip.week).toBe(after.pots.weekBells);
    expect(after.pots.treat.today + after.pots.trip.today).toBe(after.pots.todayBells);
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
    expect(b.pots).toEqual(a.pots);
  });
});

describe('locks: earnings change until the Wednesday 04:00 lock, then they are fixed', () => {
  const base = rowsOf({ metrics: [metric(jst(D[0], '22:00'), 'A', D[0], 'steps', 5000)] });
  const late = (at: string, steps = 9000) => plus(base, { metrics: [metric(at, 'A', D[0], 'steps', steps)] });

  it('a late sync before the lock counts, also after the lock', () => {
    const r = late(jst('2026-11-24', '10:00')); // Tuesday after the week: still open
    expect(potsAt(reduce(base), MON_AFTER).earned).toBe(0);
    expect(potsAt(reduce(r), MON_AFTER).earned).toBe(200); // the step day (steps no longer turn into minutes)
    expect(potsAt(reduce(r), LOCKED).earned).toBe(200);
  });

  it('a sync stamped after the lock never changes the week (one stamped exactly at it still counts)', () => {
    expect(potsAt(reduce(late(jst('2026-11-25', '04:00'))), LOCKED).earned).toBe(200);
    const r = late(new Date(ms('2026-11-25', '04:00') + 1).toISOString());
    expect(potsAt(reduce(r), LOCKED).earned).toBe(0);
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

describe('spends: the pot must cover it, the buyer can undo it', () => {
  // A perfect week for both: 14 × 1,140 + 5,000 = 20,960 → おやつ 4,192 / 旅 16,768 by Monday.
  const r = perfectWeek();
  const MON = '2026-11-23';

  it('a spend takes from its pot; the other pot is untouched', () => {
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1', 'treat', 1500, 'カフェデート', 'cafe')] }));
    const p = potsAt(s, MON_AFTER).pots;
    expect(p.treat).toEqual({ earned: 4192, spent: 1500, balance: 2692 });
    expect(p.trip).toEqual({ earned: 16768, spent: 0, balance: 16768 });
  });

  it('a spend above the balance is ignored on read, never shown, and the balance never goes negative', () => {
    const s = reduce(plus(r, { events: [
      spend(jst(MON, '10:00'), 'A', 'big', 'treat', 4193), // 1 more than the pot
      spend(jst(MON, '10:01'), 'B', 'ok', 'treat', 4192),
      spend(jst(MON, '10:02'), 'A', 'more', 'treat', 1) // the pot is empty now
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.pots.treat).toEqual({ earned: 4192, spent: 4192, balance: 0 });
    expect(p.spends.map((x) => x.spendId)).toEqual(['ok']);
  });

  it('a spend is judged at its own time: earnings that came later don’t rescue it', () => {
    const early = spend(jst(D[0], '23:00'), 'A', 'early', 'trip', 2000); // Monday: 2 × 1,140 → trip 1,824
    const s = reduce(plus(r, { events: [early] }));
    expect(potsAt(s, MON_AFTER).spends).toEqual([]);
    expect(potsAt(s, MON_AFTER).pots.trip.spent).toBe(0);
    const ok = spend(jst(D[0], '23:00'), 'A', 'ok', 'trip', 1824);
    expect(potsAt(reduce(plus(r, { events: [ok] })), MON_AFTER).pots.trip.spent).toBe(1824);
  });

  it('the buyer’s spend_void gives it back; the partner’s, an early or a second one, is ignored', () => {
    const buy = spend(jst(MON, '10:00'), 'A', 's1', 'treat', 500);
    const pot = (events: EventRow[]) => potsAt(reduce(plus(r, { events: [buy, ...events] })), MON_AFTER);
    expect(pot([]).pots.treat.balance).toBe(3692);
    const voided = pot([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 's1' })]);
    expect(voided.pots.treat).toEqual({ earned: 4192, spent: 0, balance: 4192 });
    expect(voided.spends[0]).toMatchObject({ spendId: 's1', voided: true, voidedAt: ms(MON, '10:05') });
    expect(pot([ev(jst(MON, '10:05'), 'B', 'spend_void', { spendId: 's1' })]).pots.treat.spent).toBe(500);
    expect(pot([ev(jst(MON, '09:59'), 'A', 'spend_void', { spendId: 's1' })]).pots.treat.spent).toBe(500);
    expect(pot([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 'nope' })]).pots.treat.spent).toBe(500);
  });

  it('a void frees the pot for later spends, in server order', () => {
    const s = reduce(plus(r, { events: [
      spend(jst(MON, '10:00'), 'A', 'a', 'treat', 4000),
      spend(jst(MON, '10:01'), 'B', 'b', 'treat', 4000), // refused: only 192 left
      ev(jst(MON, '10:02'), 'A', 'spend_void', { spendId: 'a' }),
      spend(jst(MON, '10:03'), 'B', 'c', 'treat', 4000)
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.spends.map((x) => [x.spendId, x.voided])).toEqual([['a', true], ['c', false]]);
    expect(p.pots.treat.balance).toBe(192);
  });

  it('spends are never locked: a void long after still counts', () => {
    const later = '2026-12-10';
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1', 'trip', 13000), ev(jst(later, '10:00'), 'A', 'spend_void', { spendId: 's1' })] }));
    expect(potsAt(s, ms(later, '12:00')).pots.trip.spent).toBe(0);
  });

  it('old yen spends, approvals and malformed ベル spends are ignored', () => {
    const at = jst(MON, '10:00');
    const s = reduce(plus(r, { events: [
      ev(at, 'A', 'spend', { spendId: 'y1', label: 'カフェ', amountYen: 2000 }),
      ev(at, 'B', 'approve' as EventRow[3], { spendId: 'y1' }), // a removed type: its rows are ignored
      ev(at, 'A', 'spend', { spendId: 'x1', pot: 'jar', item: 'ice', label: 'アイス', bells: 500 }),
      ev(at, 'A', 'spend', { spendId: 'x2', pot: 'treat', item: 'ice', label: 'アイス', bells: 1.5 }),
      ev(at, 'A', 'spend', { spendId: 'x3', pot: 'treat', item: 'ice', label: 'アイス', bells: -5 }),
      ev(at, 'A', 'spend', { spendId: 'x4', pot: 'treat', item: 'ice', label: 'x'.repeat(61), bells: 5 }),
      ev(at, 'A', 'spend', { spendId: 'x5', pot: 'treat', label: 'アイス', bells: 5 }),
      ev(at, 'A', 'spend', { spendId: 'x6', pot: 'treat', item: 'ice', label: 'アイス', bells: 10_000_001 }),
      ev(at, 'A', 'spend', { spendId: 'ok', pot: 'treat', item: 'ice', label: 'アイス', bells: 5 }),
      ev(at, 'A', 'spend', { spendId: 'ok', pot: 'treat', item: 'ice', label: 'アイス', bells: 5 }) // duplicate id
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.spends.map((x) => x.spendId)).toEqual(['ok']);
    expect(p.pots.treat.spent).toBe(5);
  });
});

describe('menus: shared, editable, the latest pref by either person wins', () => {
  const pref = (at: string, p: PersonId, key: string, value: unknown) => ev(at, p, 'pref', { key, value });
  const menus = (events: EventRow[], locale: 'ja' | 'en' = 'ja') => {
    const rows = rowsOf({ events: locale === 'en' ? [pref(jst(D[0], '08:00'), 'A', 'locale', 'en'), ...events] : events });
    return buildWeekView(reduce(rows), 'A', ms(D[1], '12:00')).menus;
  };

  it('defaults, in the viewer’s language', () => {
    expect(menus([]).treat).toEqual([
      { id: 'snack', label: 'おやつ', bells: 800 }, { id: 'ice', label: 'アイス', bells: 1000 },
      { id: 'cafe', label: 'カフェデート', bells: 2000 }, { id: 'dessert', label: 'デザート・パフェ', bells: 2000 },
      { id: 'dinner', label: '外ごはん', bells: 5000 }
    ]);
    expect(menus([]).trip.map((x) => [x.id, x.bells])).toEqual([['daytrip', 10000], ['weekend', 28000], ['onsen', 36000], ['abroad', 130000]]);
    expect(menus([], 'en').trip[0]).toEqual({ id: 'daytrip', label: 'Day trip', bells: 10000 });
  });

  it('last writer wins across both people, per menu', () => {
    const a = [{ id: 'ice', label: 'アイス', bells: 600 }];
    const b = [{ id: 'parfait', label: 'パフェ', bells: 800 }];
    expect(menus([pref(jst(D[0], '09:00'), 'A', 'treatMenu', JSON.stringify(a)), pref(jst(D[0], '10:00'), 'B', 'treatMenu', JSON.stringify(b))]).treat).toEqual(b);
    expect(menus([pref(jst(D[0], '10:00'), 'B', 'treatMenu', JSON.stringify(b)), pref(jst(D[0], '11:00'), 'A', 'treatMenu', JSON.stringify(a))]).treat).toEqual(a);
    const m = menus([pref(jst(D[0], '10:00'), 'B', 'tripMenu', JSON.stringify([{ id: 'camp', label: 'キャンプ', bells: 30000 }]))]);
    expect(m.trip).toEqual([{ id: 'camp', label: 'キャンプ', bells: 30000 }]);
    expect(m.treat[0].id).toBe('snack'); // the other menu keeps its defaults
  });

  it('accepts the array itself or its JSON; an empty menu is valid; labels are trimmed', () => {
    expect(menus([pref(jst(D[0], '09:00'), 'A', 'treatMenu', [{ id: 'a', label: ' 飴 ', bells: 50 }])]).treat).toEqual([{ id: 'a', label: '飴', bells: 50 }]);
    expect(menus([pref(jst(D[0], '09:00'), 'A', 'treatMenu', '[]')]).treat).toEqual([]);
  });

  it('an invalid menu is ignored as a whole (the previous one stays)', () => {
    const good = pref(jst(D[0], '09:00'), 'A', 'treatMenu', JSON.stringify([{ id: 'a', label: '飴', bells: 50 }]));
    const bad = (value: unknown) => menus([good, pref(jst(D[0], '10:00'), 'B', 'treatMenu', value)]).treat;
    const item = { id: 'b', label: 'ケーキ', bells: 700 };
    for (const v of [
      'not json', '{}', JSON.stringify([{ ...item, bells: 0 }]), JSON.stringify([{ ...item, bells: 2.5 }]),
      JSON.stringify([{ ...item, label: '  ' }]), JSON.stringify([{ ...item, id: 'has space' }]), JSON.stringify([item, item]),
      JSON.stringify(Array.from({ length: 31 }, (_, i) => ({ ...item, id: `i${i}` }))), JSON.stringify([{ ...item, bells: 10_000_001 }])
    ]) expect(bad(v), v.slice(0, 40)).toEqual([{ id: 'a', label: '飴', bells: 50 }]);
  });
});

describe('the きろく ledger and history fields', () => {
  const r = plus(perfectWeek(), { events: [
    spend(jst('2026-11-23', '10:00'), 'A', 's1', 'treat', 500),
    spend(jst('2026-11-23', '11:00'), 'B', 's2', 'trip', 16600, '日帰り', 'daytrip'),
    ev(jst('2026-11-23', '11:05'), 'B', 'spend_void', { spendId: 's2' })
  ] });

  it('per-day rows for both people, bonus rows and spends, newest first', () => {
    const l = bellsLedger(reduce(r), MON_AFTER);
    expect(l.earned).toBe(20960);
    expect(l.pots.treat).toEqual({ earned: 4192, spent: 500, balance: 3692 });
    expect(l.pots.trip).toEqual({ earned: 16768, spent: 0, balance: 16768 });
    expect(l.days[0]).toMatchObject({ date: '2026-11-23', weekKey: '2026-11-23', bells: 0, locked: false });
    const sun = l.days.find((d) => d.date === D[6])!;
    expect(sun).toMatchObject({ weekKey: WK, bells: 2280, locked: false, people: { A: { date: D[6], bells: 1140 }, B: { bells: 1140 } } });
    expect(sun.people.A.rings).toEqual({ peach: 180, pear: 180, cherry: 180, apple: 200, coconut: 400 });
    expect(l.days.at(-1)!.date).toBe('2026-10-26');
    expect(l.days).toHaveLength(29); // 10-26 → 11-23
    expect(l.bonuses.map((b) => [b.weekKey, b.bells])).toEqual([[WK, 5000], ['2026-11-09', 0], ['2026-11-02', 0], ['2026-10-26', 0]]);
    expect(l.bonuses[0]).toMatchObject({
      at: SUN_BEFORE + 60_000, bonus: { A: 2000, B: 2000, duo: 1000 }, ringBadges: { A: { cherry: true }, B: { pear: true } }, badges: { A: { pear: true } }
    });
    expect(l.spends.map((x) => [x.spendId, x.by, x.pot, x.label, x.bells, x.voided])).toEqual([
      ['s2', 'B', 'trip', '日帰り', 16600, true], ['s1', 'A', 'treat', 'アイス', 500, false]
    ]);
    expect(bellsLedger(reduce(r), LOCKED).days.find((d) => d.date === D[0])!.locked).toBe(true);
  });

  it('week list, week detail and day detail carry the ベル', () => {
    const s = reduce(r);
    const w = historyWeeks(s, SUN_BEFORE).find((x) => x.weekKey === WK)!;
    expect(w.bells).toBe(14 * 1140); // no bonus before the harvest
    const five = { peach: true, pear: true, cherry: true, apple: true, coconut: true };
    expect(w.people.A).toMatchObject({ bells: 7 * 1140, ringBadges: five, badges: { peach: true, apple: true, coconut: true, pear: true } });
    expect(historyWeeks(s, MON_AFTER).find((x) => x.weekKey === WK)!.bells).toBe(20960);
    const d = weekDetail(s, WK, MON_AFTER);
    expect(d).toMatchObject({ bells: 20960, bonus: { A: 2000, B: 2000, duo: 1000 } });
    expect(d.people.B).toMatchObject({ dailyBells: 7980, bonus: 2000, ringBadges: five });
    expect(d.people.A.days[0]).toMatchObject({
      bells: 1140, rings: { peach: 180, pear: 180, cherry: 180, apple: 200, coconut: 400 }, parts: { peach: 180, apple: 200, coconut: 400, pear: 180 },
      exerciseMin: 60, moveKcal: 700, moveGoal: 600, standMin: 200, steps: 9000, gym: true, met: five, ticks: 0
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

  it('old check-in rows earn nothing: the pots are the same with or without them', () => {
    const ticks = D.flatMap((d) => ['protein_each_meal', 'no_sweets', 'veg_two_meals'].map((habit) => ev(jst(d, '21:00'), 'A', 'checkin', { date: d, habit, done: true })));
    expect(potsAt(reduce(plus(perfectWeek(), { events: ticks })), MON_AFTER).earned).toBe(potsAt(reduce(perfectWeek()), MON_AFTER).earned);
  });
});
