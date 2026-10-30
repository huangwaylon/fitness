// ADR 0019 on read (what earns: ADR 0021; one wallet: ADR 0022): earnings land in the wallet as they happen, the
// weekly bonus at the Sunday harvest, buys replay against it (never below zero), voids, the shared menus, locks, the Move goal in
// force per day and the きろく ledger.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows, WorkoutRow } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, treatPrice, walletAt, weekBells } from './bells.ts';
import { dayDetail, historyWeeks, weekDetail } from './history.ts';

const WK = '2026-11-16'; // a v2 week (RULES from 2026-11-02). Sunday 19:30 = 11-22 10:30Z; lock = Wednesday 11-25 04:00 JST
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

/** Every daily maximum on every day of WK, for both: 1,240 a day each (v2), all five badges. */
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
    expect(v.people.A.today).toEqual({ bells: 1240, rings: { peach: 240, pear: 180, cherry: 120, apple: 200, coconut: 500 } });
    expect(v.people.A.weekBells).toBe(3 * 1240); // only days up to today count, even with later-dated rows
    expect(v.wallet).toEqual({ earned: 6 * 1240, spent: 0, balance: 6 * 1240, today: 2480, week: 6 * 1240 }); // no split
    const rings = v.people.A.rings;
    expect(rings.peach).toEqual({ today: 60, goal: 60, met: true, todayBells: 240, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 240 , milestone: 4, nextAt: null, nextBells: null, nextGain: null });
    expect(rings.pear).toEqual({ today: 700, goal: 600, met: true, todayBells: 180, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 180 , milestone: 4, nextAt: null, nextBells: null, nextGain: null });
    expect(rings.cherry).toEqual({ today: 200, goal: 120, met: true, todayBells: 120, weekDays: 7, weekGoalDays: 5, badge: true, weekBells: 3 * 120 , milestone: 4, nextAt: null, nextBells: null, nextGain: null });
    expect(rings.apple).toMatchObject({ today: 9000, goal: 8000, met: true, todayBells: 200, weekGoalDays: 4, weekBells: 600 });
    expect(rings.coconut).toMatchObject({ today: 1, goal: 1, met: true, todayBells: 500, weekDays: 7, weekGoalDays: 3 });
    expect(v.people.A.moveGoal).toBe(600);
    expect(v.people.B.moveGoal).toBe(400);
    expect(v.people.B.rings.pear).toMatchObject({ today: 700, goal: 400, met: true, todayBells: 180 });
  });

  it('a partial day: progress below the goals', () => {
    const r = rowsOf({ metrics: [metric(jst(D[0], '12:00'), 'B', D[0], 'steps', 5000), metric(jst(D[0], '12:00'), 'B', D[0], 'exercise_min', 20)] });
    const v = buildWeekView(reduce(r), 'A', ms(D[0], '13:00'));
    // The v2 milestone curve: 5,000 steps is past 4,000 (60), 20 min past 15 (25).
    expect(v.people.B.today).toMatchObject({ bells: 85, rings: { peach: 25, pear: 0, cherry: 0, apple: 60, coconut: 0 } });
    expect(v.people.B.rings.apple).toMatchObject({ today: 5000, met: false, weekDays: 0, badge: false, milestone: 2, nextAt: 6000, nextBells: 110, nextGain: 50 });
    expect(v.people.B.rings.peach).toMatchObject({ today: 20, goal: 60, met: false, todayBells: 25, milestone: 1, nextAt: 30, nextBells: 70, nextGain: 45 });
    expect(v.people.B.rings.coconut).not.toHaveProperty('milestone');
    expect(v.people.A.today.bells).toBe(0);
    expect(v.wallet).toEqual({ earned: 85, spent: 0, balance: 85, today: 85, week: 85 });
  });

  it('the wallet’s today and week flows: today’s and this week’s earnings of both people', () => {
    // Monday 70 ベル (A: 41 min, past the 30-min milestone), Tuesday 25 (B: 16 min).
    const r = rowsOf({ metrics: [metric(jst(D[0], '22:00'), 'A', D[0], 'exercise_min', 41), metric(jst(D[1], '09:00'), 'B', D[1], 'exercise_min', 16)] });
    const v = buildWeekView(reduce(r), 'A', ms(D[1], '12:00'));
    expect(v.wallet).toEqual({ earned: 95, spent: 0, balance: 95, today: 25, week: 95 });
  });

  it('days before the economy’s first week (2026-10-26) never earn', () => {
    const r = rowsOf({ metrics: [metric(jst('2026-10-25', '22:00'), 'A', '2026-10-25', 'steps', 20000), metric(jst('2026-10-26', '22:00'), 'A', '2026-10-26', 'steps', 8000)] });
    const p = potsAt(reduce(r), ms('2026-10-27', '12:00'));
    expect(p.wallet.earned).toBe(200);
    expect(p.weeks.map((w) => w.weekKey)).toEqual(['2026-10-26']);
  });
});

describe('the weekly bonus lands at the Sunday 19:30 harvest', () => {
  it('+340 per badge each (v2), +200 duo per shared badge; counted whether or not 受け取る is tapped', () => {
    const s = reduce(perfectWeek());
    const before = buildWeekView(s, 'A', SUN_BEFORE);
    expect(before.harvest?.weekKey).toBe('2026-11-09'); // last week's (empty) harvest, never tapped
    expect(before.wallet.week).toBe(14 * 1240);
    const after = buildWeekView(s, 'A', SUN_AFTER);
    expect(after.harvest).toMatchObject({ weekKey: WK, bonus: { A: 1700, B: 1700, duo: 1000 }, totalBells: 14 * 1240 + 4400, confirmedBy: [] });
    const five = { peach: true, pear: true, cherry: true, apple: true, coconut: true };
    expect(after.harvest!.ringBadges).toEqual({ A: five, B: five });
    expect(after.wallet).toMatchObject({ week: 14 * 1240 + 4400, earned: 14 * 1240 + 4400, balance: 14 * 1240 + 4400 });
    expect(after.host).toMatchObject({ key: 'host.harvest_ready', params: { bells: 14 * 1240 + 4400 } });
  });

  it('a missed badge costs only its share of the duo bonus', () => {
    const r = perfectWeek();
    r.metrics = r.metrics.filter((m) => !(m[1] === 'B' && m[3] === 'stand_min' && m[2] >= D[2])); // B: 2 stand days
    const h = buildWeekView(reduce(r), 'B', SUN_AFTER).harvest!;
    expect(h.bonus).toEqual({ A: 1700, B: 1360, duo: 800 });
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
  const base = rowsOf({ metrics: [metric(jst(D[0], '22:00'), 'A', D[0], 'steps', 1000)] }); // below the first milestone
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
    expect(weekBells(reduce(r), WK, LOCKED).A.days[0].steps).toBe(1000);
    expect(historyWeeks(reduce(r), LOCKED).find((w) => w.weekKey === WK)!.bells).toBe(0);
  });

  it('an edit (metric_set) in the open week moves the earnings, even down', () => {
    const r = plus(perfectWeek(['A']), { events: [ev(jst(D[3], '08:00'), 'A', 'metric_set', { date: D[0], metric: 'steps', value: 1000 })] });
    const w = weekBells(reduce(r), WK, MON_AFTER);
    expect(w.A.days[0].rings.apple).toBe(0);
    expect(w.A.days[0].bells).toBe(1040);
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
  // A perfect v2 week for both: 14 × 1,240 + 4,400 = 21,760 in the wallet by Monday.
  const r = perfectWeek();
  const MON = '2026-11-23';

  it('a buy takes from the one wallet', () => {
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1', 2500, 'カフェデート', 'cafe'), spend(jst(MON, '10:01'), 'B', 's2', 15000, 'スパ', 'spa')] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.wallet).toEqual({ earned: 21760, spent: 17500, balance: 4260 });
  });

  it('a buy above the balance is ignored on read, never shown, and the balance never goes negative', () => {
    const s = reduce(plus(r, { events: [
      spend(jst(MON, '10:00'), 'A', 'big', 21761), // 1 more than the wallet
      spend(jst(MON, '10:01'), 'B', 'ok', 21760),
      spend(jst(MON, '10:02'), 'A', 'more', 1) // the wallet is empty now
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.wallet).toEqual({ earned: 21760, spent: 21760, balance: 0 });
    expect(p.spends.map((x) => x.spendId)).toEqual(['ok']);
  });

  it('a buy is judged at its own time: earnings that came later don’t rescue it', () => {
    const early = spend(jst(D[0], '23:00'), 'A', 'early', 2481); // Monday: 2 × 1,240
    const s = reduce(plus(r, { events: [early] }));
    expect(potsAt(s, MON_AFTER).spends).toEqual([]);
    const ok = spend(jst(D[0], '23:00'), 'A', 'ok', 2480);
    expect(potsAt(reduce(plus(r, { events: [ok] })), MON_AFTER).wallet.spent).toBe(2480);
  });

  it('the buyer’s spend_void gives it back; the partner’s, an early or a second one, is ignored', () => {
    const buy = spend(jst(MON, '10:00'), 'A', 's1', 500);
    const wallet = (events: EventRow[]) => potsAt(reduce(plus(r, { events: [buy, ...events] })), MON_AFTER);
    expect(wallet([]).wallet.balance).toBe(21260);
    const voided = wallet([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 's1' })]);
    expect(voided.wallet).toEqual({ earned: 21760, spent: 0, balance: 21760 });
    expect(voided.spends[0]).toMatchObject({ spendId: 's1', voided: true, voidedAt: ms(MON, '10:05') });
    expect(wallet([ev(jst(MON, '10:05'), 'B', 'spend_void', { spendId: 's1' })]).wallet.spent).toBe(500);
    expect(wallet([ev(jst(MON, '09:59'), 'A', 'spend_void', { spendId: 's1' })]).wallet.spent).toBe(500);
    expect(wallet([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 'nope' })]).wallet.spent).toBe(500);
  });

  it('a void frees the wallet for later buys, in server order', () => {
    const s = reduce(plus(r, { events: [
      spend(jst(MON, '10:00'), 'A', 'a', 20000),
      spend(jst(MON, '10:01'), 'B', 'b', 20000), // refused: only 1,760 left
      ev(jst(MON, '10:02'), 'A', 'spend_void', { spendId: 'a' }),
      spend(jst(MON, '10:03'), 'B', 'c', 20000)
    ] }));
    const p = potsAt(s, MON_AFTER);
    expect(p.spends.map((x) => [x.spendId, x.voided])).toEqual([['a', true], ['c', false]]);
    expect(p.wallet.balance).toBe(1760);
  });

  it('buys are never locked: a void long after still counts', () => {
    const later = '2026-12-10';
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1', 13000), ev(jst(later, '10:00'), 'A', 'spend_void', { spendId: 's1' })] }));
    expect(potsAt(s, ms(later, '12:00')).wallet.spent).toBe(0);
  });

  it('malformed buys are ignored', () => {
    const at = jst(MON, '10:00');
    const s = reduce(plus(r, { events: [
      ev(at, 'A', 'spend', { spendId: 7, item: 'ice', label: 'アイス', bells: 500 }),
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

describe('escalating food treats: ×1.5 per repeat of an item in a Tokyo week, both people (ADR 0022 amendment)', () => {
  // A perfect v2 week for both (WK): 21,760 in the wallet from Monday 2026-11-23; buys in the week of 11-23 (Mon–Sun).
  const r = perfectWeek();
  const MON = '2026-11-23';
  const snack = (at: string, p: PersonId, id: string, bells: number, label = 'おやつ') => spend(at, p, id, bells, label, 'snack');
  const state = (events: EventRow[]) => reduce(plus(r, { events }));
  const accepted = (events: EventRow[], now = MON_AFTER + 86_400_000 * 6) =>
    walletAt(state(events), now).spends.filter((x) => !x.voided).map((x) => [x.spendId, x.bells]);
  const item = (events: EventRow[], id: string, now = ms('2026-11-25', '12:00')) => buildWeekView(state(events), 'A', now).menu.find((x) => x.id === id)!;

  it('treatPrice: base × 1.5^n, rounded to the nearest 50 (an exact half rounds down), never below the base; n = 0 is the base', () => {
    const seq = (base: number) => [0, 1, 2, 3, 4].map((n) => treatPrice(base, n));
    expect(seq(1200)).toEqual([1200, 1800, 2700, 4050, 6050]); // 6,075: a half, down
    expect(seq(2500)).toEqual([2500, 3750, 5600, 8450, 12650]); // 5,625 → 5,600 (half, down); 8,437.5 → 8,450; 12,656.25 → 12,650
    expect(seq(6000)).toEqual([6000, 9000, 13500, 20250, 30350]); // 30,375: a half, down
    expect(treatPrice(1250, 1)).toBe(1850); // 1,875: a half, down
    expect(treatPrice(1234, 0)).toBe(1234); // the base exactly, even off the 50s
    expect(treatPrice(1234, 1)).toBe(1850); // 1,851
    expect(treatPrice(1290, 1)).toBe(1950); // 1,935: past the half, up
    expect(treatPrice(10, 1)).toBe(10); // 15 would round to 0: never below the base
    expect(treatPrice(10_000_000, 80)).toBeGreaterThan(10_000_000); // exact BigInt maths, no overflow: unbuyable
  });

  it('the defaults: おやつ・カフェ・外ごはん escalate, ほしいもの and 旅のごほうび are flat; each carries its base, price and count', () => {
    const v = buildWeekView(state([]), 'A', MON_AFTER).menu;
    expect(v.map((x) => [x.id, x.escalates, x.basePrice, x.price, x.boughtThisWeek])).toEqual([
      ['snack', true, 1200, 1200, 0], ['cafe', true, 2500, 2500, 0], ['dinner', true, 6000, 6000, 0],
      ['want', false, 8000, 8000, 0], ['trip', false, 12000, 12000, 0]
    ]);
  });

  it('both people count together, in server order: 1,200 → 1,800 → 2,700 → 4,050', () => {
    const ev3 = [snack(jst(MON, '10:00'), 'A', 's1', 1200), snack(jst(MON, '11:00'), 'B', 's2', 1800), snack(jst(MON, '12:00'), 'A', 's3', 2700)];
    expect(accepted(ev3)).toEqual([['s1', 1200], ['s2', 1800], ['s3', 2700]]);
    expect(item(ev3, 'snack')).toMatchObject({ bells: 1200, basePrice: 1200, price: 4050, boughtThisWeek: 3, escalates: true });
    expect(item(ev3, 'cafe')).toMatchObject({ price: 2500, boughtThisWeek: 0 }); // per item id
  });

  it('two phones buying at once: the server’s first is accepted, the second (same price) no longer matches and is ignored', () => {
    const evs = [snack(jst(MON, '10:00'), 'A', 'a', 1200), snack(new Date(ms(MON, '10:00') + 1000).toISOString(), 'B', 'b', 1200)];
    expect(accepted(evs)).toEqual([['a', 1200]]);
    expect(walletAt(state(evs), MON_AFTER).spends.map((x) => x.spendId)).toEqual(['a']); // never listed
    expect(item(evs, 'snack')).toMatchObject({ price: 1800, boughtThisWeek: 1 });
  });

  it('a week resets on Monday 00:00 JST', () => {
    const SUN = '2026-11-29';
    const evs = [snack(jst(SUN, '23:00'), 'A', 's1', 1200), snack(jst(SUN, '23:59'), 'B', 's2', 1800), snack(jst('2026-11-30', '00:00'), 'A', 's3', 1200)];
    expect(accepted(evs)).toEqual([['s1', 1200], ['s2', 1800], ['s3', 1200]]);
    expect(item(evs.slice(0, 2), 'snack', ms(SUN, '23:59') + 30_000)).toMatchObject({ price: 2700, boughtThisWeek: 2 });
    expect(item(evs.slice(0, 2), 'snack', ms('2026-11-30', '00:00'))).toMatchObject({ price: 1200, boughtThisWeek: 0 });
    expect(item(evs, 'snack', ms('2026-11-30', '12:00'))).toMatchObject({ price: 1800, boughtThisWeek: 1 });
  });

  it('a void frees its buy: the price steps back down; buys before the void keep their price, buys after it recompute', () => {
    const buys = [snack(jst(MON, '10:00'), 'A', 's1', 1200), snack(jst(MON, '11:00'), 'B', 's2', 1800)];
    expect(item(buys, 'snack')).toMatchObject({ price: 2700, boughtThisWeek: 2 });
    const undone = [...buys, ev(jst(MON, '11:05'), 'B', 'spend_void', { spendId: 's2' })];
    expect(item(undone, 'snack')).toMatchObject({ price: 1800, boughtThisWeek: 1 });
    // A void of the first: the second (1,800) stays; the next costs 1,800 again.
    const first = [...buys, ev(jst(MON, '11:10'), 'A', 'spend_void', { spendId: 's1' }), snack(jst(MON, '12:00'), 'A', 's3', 1800)];
    expect(accepted(first)).toEqual([['s2', 1800], ['s3', 1800]]);
    expect(item(first, 'snack')).toMatchObject({ price: 2700, boughtThisWeek: 2 });
    // The partner's void is ignored: no step down.
    expect(item([...buys, ev(jst(MON, '11:05'), 'A', 'spend_void', { spendId: 's2' })], 'snack')).toMatchObject({ price: 2700 });
  });

  it('a spend at the wrong price, or one the wallet can’t cover, is ignored and doesn’t count', () => {
    expect(accepted([snack(jst(MON, '10:00'), 'A', 'low', 1000), snack(jst(MON, '10:01'), 'A', 'high', 1800)])).toEqual([]);
    expect(accepted([snack(jst(MON, '10:00'), 'A', 's1', 1200), snack(jst(MON, '10:01'), 'A', 'stale', 1200)])).toEqual([['s1', 1200]]);
    // 21,760 − 20,000 − 1,200 = 560 left: the 1,800 おやつ isn't covered, so the next is still 1,800.
    const poor = [spend(jst(MON, '09:00'), 'A', 'big', 20000, '���しいもの', 'want'), snack(jst(MON, '10:00'), 'A', 's1', 1200), snack(jst(MON, '10:01'), 'B', 's2', 1800)];
    expect(accepted(poor)).toEqual([['big', 20000], ['s1', 1200]]);
    expect(item(poor, 'snack')).toMatchObject({ price: 1800, boughtThisWeek: 1 });
    // An escalating id that isn't on the menu at the time (removed) has no price: ignored.
    const removed = ev(jst(MON, '08:00'), 'A', 'pref', { key: 'menu', value: JSON.stringify([{ id: 'want', label: 'ほしいもの', bells: 8000 }]) });
    expect(accepted([removed, snack(jst(MON, '10:00'), 'A', 's1', 1200)])).toEqual([]);
  });

  it('flat and user-added items never escalate, but are counted', () => {
    const custom = ev(jst(MON, '08:00'), 'A', 'pref', { key: 'menu', value: JSON.stringify([
      { id: 'want', label: 'ほしいもの', bells: 3000 }, { id: 'taiyaki', label: 'たいやき', bells: 800 }
    ]) });
    const evs = [
      custom,
      spend(jst(MON, '10:00'), 'A', 'w1', 3000, 'ほしいもの', 'want'), spend(jst(MON, '10:01'), 'B', 'w2', 3000, 'ほしいもの', 'want'),
      spend(jst(MON, '10:02'), 'A', 't1', 800, 'たいやき', 'taiyaki'), spend(jst(MON, '10:03'), 'B', 't2', 800, 'たいやき', 'taiyaki')
    ];
    expect(accepted(evs)).toEqual([['w1', 3000], ['w2', 3000], ['t1', 800], ['t2', 800]]);
    expect(item(evs, 'want')).toMatchObject({ price: 3000, boughtThisWeek: 2, escalates: false });
    expect(item(evs, 'taiyaki')).toMatchObject({ price: 800, boughtThisWeek: 2, escalates: false });
  });

  it('a renamed or repriced escalating item keeps escalating (by id), from the menu price at each buy', () => {
    const rename = (at: string, bells: number) =>
      ev(at, 'B', 'pref', { key: 'menu', value: JSON.stringify([{ id: 'snack', label: 'アイス', bells }]) });
    const evs = [rename(jst(MON, '08:00'), 1000), snack(jst(MON, '10:00'), 'A', 's1', 1000, 'アイス'), snack(jst(MON, '11:00'), 'B', 's2', 1500, 'アイス')];
    expect(accepted(evs)).toEqual([['s1', 1000], ['s2', 1500]]);
    expect(item(evs, 'snack')).toMatchObject({ label: 'アイス', basePrice: 1000, price: 2250, boughtThisWeek: 2, escalates: true });
    // Repriced mid-week: the next buy is the new base × 1.5² (2,000 × 2.25 = 4,500).
    expect(item([...evs, rename(jst(MON, '12:00'), 2000)], 'snack')).toMatchObject({ basePrice: 2000, price: 4500 });
  });

  it('before ESCALATION.enforceFrom (2026-10-31 00:00 JST) any price is accepted, and those buys still count', () => {
    const days = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29']; // 4 × 2 × 740 = 5,920 (v1, no gym)
    const metrics = days.flatMap((d) => (['A', 'B'] as PersonId[]).flatMap((p) => [
      metric(jst(d, '22:00'), p, d, 'steps', 9000), metric(jst(d, '22:00'), p, d, 'exercise_min', 60),
      metric(jst(d, '22:00'), p, d, 'move_kcal', 700), metric(jst(d, '22:00'), p, d, 'stand_min', 200)
    ]));
    const evs = [
      snack(jst('2026-10-29', '10:00'), 'A', 'old1', 1200), snack(jst('2026-10-29', '11:00'), 'B', 'old2', 1200), // the old flat price
      snack(jst('2026-10-31', '10:00'), 'A', 'stale', 1200), snack(jst('2026-10-31', '10:01'), 'A', 'new', 2700)
    ];
    const s = reduce(rowsOf({ metrics, events: evs }));
    expect(walletAt(s, ms('2026-10-31', '12:00')).spends.map((x) => [x.spendId, x.bells])).toEqual([['old1', 1200], ['old2', 1200], ['new', 2700]]);
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
    expect(l.earned).toBe(21760);
    expect(l.wallet).toEqual({ earned: 21760, spent: 500, balance: 21260 });
    expect(l.days[0]).toMatchObject({ date: '2026-11-23', weekKey: '2026-11-23', bells: 0, locked: false });
    const sun = l.days.find((d) => d.date === D[6])!;
    expect(sun).toMatchObject({ weekKey: WK, bells: 2480, locked: false, people: { A: { date: D[6], bells: 1240 }, B: { bells: 1240 } } });
    expect(sun.people.A.rings).toEqual({ peach: 240, pear: 180, cherry: 120, apple: 200, coconut: 500 });
    expect(l.days.at(-1)!.date).toBe('2026-10-26');
    expect(l.days).toHaveLength(29); // 10-26 → 11-23
    expect(l.bonuses.map((b) => [b.weekKey, b.bells])).toEqual([[WK, 4400], ['2026-11-09', 0], ['2026-11-02', 0], ['2026-10-26', 0]]);
    expect(l.bonuses[0]).toMatchObject({
      at: SUN_BEFORE + 60_000, bonus: { A: 1700, B: 1700, duo: 1000 }, ringBadges: { A: { cherry: true }, B: { pear: true } }
    });
    expect(l.spends.map((x) => [x.spendId, x.by, x.item, x.label, x.bells, x.voided])).toEqual([
      ['s2', 'B', 'spa', 'スパ', 15000, true], ['s1', 'A', 'ice', 'アイス', 500, false]
    ]);
    expect(bellsLedger(reduce(r), LOCKED).days.find((d) => d.date === D[0])!.locked).toBe(true);
  });

  it('week list, week detail and day detail carry the ベル', () => {
    const s = reduce(r);
    const w = historyWeeks(s, SUN_BEFORE).find((x) => x.weekKey === WK)!;
    expect(w.bells).toBe(14 * 1240); // no bonus before the harvest
    const five = { peach: true, pear: true, cherry: true, apple: true, coconut: true };
    expect(w.people.A).toMatchObject({ bells: 7 * 1240, ringBadges: five });
    expect(historyWeeks(s, MON_AFTER).find((x) => x.weekKey === WK)!.bells).toBe(21760);
    const d = weekDetail(s, WK, MON_AFTER);
    expect(d).toMatchObject({ bells: 21760, bonus: { A: 1700, B: 1700, duo: 1000 } });
    expect(d.people.B).toMatchObject({ dailyBells: 8680, bonus: 1700, ringBadges: five });
    expect(d.people.A.ringWeek).toEqual({ peach: { days: 7, goal: 5 }, pear: { days: 7, goal: 5 }, cherry: { days: 7, goal: 5 }, apple: { days: 7, goal: 4 }, coconut: { days: 7, goal: 3 } });
    expect(w.people.B.ringWeek).toEqual(d.people.B.ringWeek);
    expect(d.people.A.days[0]).toMatchObject({
      bells: 1240, rings: { peach: 240, pear: 180, cherry: 120, apple: 200, coconut: 500 },
      exerciseMin: 60, moveKcal: 700, moveGoal: 600, standMin: 200, steps: 9000, gym: true, met: five
    });
    expect(d.people.B.days[0]).toMatchObject({ moveGoal: 400 });
    const mid = weekDetail(s, WK, ms(D[1], '12:00'));
    expect(mid.people.A.days.map((x) => x.bells)).toEqual([1240, 1240, 0, 0, 0, 0, 0]); // future days: 0
    expect(dayDetail(s, D[3], MON_AFTER).people.A).toMatchObject({
      bells: 1240, rings: { coconut: 500 }, met: five, exercise: { value: 60, watch: 60, source: 'watch', edited: false },
      move: { value: 700, goal: 600, edited: false }, stand: { value: 200, edited: false }
    });
  });
});

describe('the Move goal in force (ADR 0021 §5): per person, from the day it is set, never re-pricing earlier days', () => {
  // A: 450 kcal every day. Default goal 600 → 75%, 98 a day (v2 milestones); a goal of 400 set on Wednesday morning pays 180 from Wednesday.
  const kcal = rowsOf({ metrics: D.map((d) => metric(jst(d, '22:00'), 'A', d, 'move_kcal', 450)) });
  const goal = (at: string, p: PersonId, value: number) => ev(at, p, 'pref', { key: 'moveGoal', value });
  const pears = (r: SnapshotRows, now: number) => weekBells(reduce(r), WK, now).A.days.map((d) => [d.rings.pear, d.moveGoal]);

  it('the default goal: ウェイ 600, うめ 400', () => {
    expect(pears(kcal, MON_AFTER)).toEqual(D.map(() => [98, 600]));
  });

  it('a change applies from the day it is made (Tokyo date) to every later day', () => {
    const r = plus(kcal, { events: [goal(jst(D[2], '07:00'), 'A', 400)] });
    expect(pears(r, MON_AFTER)).toEqual([[98, 600], [98, 600], [180, 400], [180, 400], [180, 400], [180, 400], [180, 400]]);
    expect(buildWeekView(reduce(r), 'A', ms(D[1], '23:00')).people.A.moveGoal).toBe(600); // Tuesday: still the old goal
    expect(buildWeekView(reduce(r), 'A', ms(D[2], '12:00')).people.A.rings.pear).toMatchObject({ today: 450, goal: 400, met: true, todayBells: 180 });
    expect(buildWeekView(reduce(r), 'B', ms(D[2], '12:00')).people.B.moveGoal).toBe(400); // B's own default
  });

  it('a later change wins from its day; one made at 23:59 still counts for that whole day', () => {
    const r = plus(kcal, { events: [goal(jst(D[1], '23:59'), 'A', 450), goal(jst(D[4], '00:00'), 'A', 900)] });
    expect(pears(r, MON_AFTER).map(([, g]) => g)).toEqual([600, 450, 450, 450, 900, 900, 900]);
    expect(pears(r, MON_AFTER).map(([b]) => b)).toEqual([98, 180, 180, 180, 53, 53, 53]);
    // The next milestone follows the goal in force: 450 of 900 kcal is 50%, the next step 675 kcal pays 98 (+45).
    expect(buildWeekView(reduce(r), 'A', ms(D[4], '23:00')).people.A.rings.pear)
      .toMatchObject({ today: 450, goal: 900, todayBells: 53, milestone: 2, nextAt: 675, nextBells: 98, nextGain: 45 });
  });

  it('a change after the week never re-prices it; one partner’s goal never moves the other’s', () => {
    const r = plus(kcal, { events: [goal(jst('2026-11-23', '08:00'), 'A', 400), goal(jst(D[0], '08:00'), 'B', 1000)] });
    expect(pears(r, MON_AFTER)).toEqual(D.map(() => [98, 600]));
  });
});
