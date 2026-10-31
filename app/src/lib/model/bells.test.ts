// The ベル economy on read: earnings land in the wallet as they happen (+1 a goal, ふたりでぜんぶ +2), the Sunday harvest
// recaps the week, buys of the two rewards replay against the wallet (never below zero), voids, locks, the economy's
// first week, the Move goal in force per day and the きろく ledger.
import { describe, expect, it } from 'vitest';
import type { EventRow, MetricRow, SnapshotRows } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { weekDays } from '#lib/time/dates.ts';
import { firstWeek, reduce } from './state.ts';
import { buildWeekView } from './week.ts';
import { bellsLedger, economyWeeks, walletAt, weekBells } from './bells.ts';
import { dayDetail } from './history.ts';

const WK = '2026-11-16'; // Sunday 19:30 = 11-22 10:30Z; lock = Wednesday 11-25 04:00 JST
const D = weekDays(WK);
const jst = (date: string, hm: string) => new Date(`${date}T${hm}:00+09:00`).toISOString();
const ms = (date: string, hm: string) => Date.parse(jst(date, hm));

let n = 0;
const ev = (at: string, person: PersonId, type: EventRow[3], data: object): EventRow => [at, person, `e${++n}`, type, JSON.stringify(data)];
const metric = (at: string, person: PersonId, date: string, m: MetricRow[3], v: number): MetricRow => [at, person, date, m, v];
const rowsOf = (add: Partial<SnapshotRows> = {}): SnapshotRows => ({ metrics: add.metrics ?? [], events: add.events ?? [] });
const plus = (a: SnapshotRows, b: Partial<SnapshotRows>): SnapshotRows => ({
  metrics: [...a.metrics, ...(b.metrics ?? [])], events: [...a.events, ...(b.events ?? [])]
});
/** A day meeting all four goals, none at 1.5× (the Move goal defaults to 600 / 400: 700 / 550 kcal). */
const allFour = (at: string, p: PersonId, d: string): MetricRow[] => [
  metric(at, p, d, 'steps', 9000), metric(at, p, d, 'exercise_min', 60), metric(at, p, d, 'move_kcal', p === 'A' ? 700 : 550), metric(at, p, d, 'stand_min', 130)
];

/** Every goal on every day of WK, for both: 4 + 4 + 2 = 10 a day, 70 the week. */
function perfectWeek(people: PersonId[] = ['A', 'B']): SnapshotRows {
  const r = rowsOf();
  for (const p of people) for (const d of D) r.metrics.push(...allFour(jst(d, '22:00'), p, d));
  return r;
}
const spend = (at: string, p: PersonId, spendId: string, item = 'snack', bells = item === 'snack' ? 8 : 15) =>
  ev(at, p, 'spend', { spendId, item, bells });

const SUN_BEFORE = ms(D[6], '19:29');
const SUN_AFTER = ms(D[6], '19:31');
const MON = '2026-11-23';
const MON_AFTER = ms(MON, '12:00');
const LOCKED = ms('2026-11-26', '12:00');

describe('daily earnings land as they happen', () => {
  it('today: +1 per goal on the person and its fruits; the wallet has both people and ふたりでぜんぶ', () => {
    const now = ms(D[2], '23:00'); // Wednesday night
    const v = buildWeekView(reduce(perfectWeek()), 'A', now);
    expect(v.people.A.today).toEqual({ bells: 4, rings: { pear: 1, peach: 1, cherry: 1, apple: 1 } });
    expect(v.people.A.weekBells).toBe(3 * 4); // only days up to today count, even with later-dated rows
    expect(v.together).toEqual({ met: true, left: 0 });
    expect(v.wallet).toEqual({ balance: 3 * 10, today: 10 });
    const rings = v.people.A.rings;
    expect(Object.keys(rings)).toEqual(['pear', 'peach', 'cherry', 'apple']);
    expect(rings).toEqual({
      pear: { today: 700, goal: 600, met: true, stretched: false }, peach: { today: 60, goal: 60, met: true, stretched: false },
      cherry: { today: 130, goal: 120, met: true, stretched: false }, apple: { today: 9000, goal: 8000, met: true, stretched: false }
    });
    expect(v.people.B.rings.pear).toEqual({ today: 550, goal: 400, met: true, stretched: false });
  });

  it('a partial day: what each goal is at, and how many goals both still have for ふたりでぜんぶ', () => {
    const at = jst(D[0], '12:00');
    const r = rowsOf({ metrics: [metric(at, 'B', D[0], 'steps', 8200), metric(at, 'B', D[0], 'exercise_min', 20), ...allFour(at, 'A', D[0])] });
    const v = buildWeekView(reduce(r), 'A', ms(D[0], '13:00'));
    expect(v.people.B.today).toEqual({ bells: 1, rings: { pear: 0, peach: 0, cherry: 0, apple: 1 } });
    expect(v.people.B.rings.peach).toEqual({ today: 20, goal: 60, met: false, stretched: false });
    expect(v.together).toEqual({ met: false, left: 3 });
    expect(v.wallet).toEqual({ balance: 5, today: 5 });
  });

  it('nothing yet today: all eight goals left', () => {
    const v = buildWeekView(reduce(perfectWeek()), 'A', ms('2026-11-23', '08:00'));
    expect(v.together).toEqual({ met: false, left: 8 });
    expect(v.wallet.today).toBe(0);
  });
});

describe('the economy starts with the data', () => {
  it('its first week is the first one with an activity row stamped by its lock; none before any data', () => {
    expect(firstWeek(reduce(rowsOf()))).toBeNull();
    expect(economyWeeks(reduce(rowsOf()), MON_AFTER)).toEqual([]);
    expect(buildWeekView(reduce(rowsOf()), 'A', SUN_AFTER).harvest).toBeNull();
    const s = reduce(perfectWeek());
    expect(firstWeek(s)).toBe(WK);
    expect(economyWeeks(s, MON_AFTER)).toEqual([WK, MON]);
  });

  it('a baseline of old days (stamped long after their weeks locked) never earns and never moves the start', () => {
    const old = rowsOf({ metrics: allFour(jst(MON, '09:00'), 'A', '2026-10-01') });
    const s = reduce(plus(perfectWeek(), old));
    expect(firstWeek(s)).toBe(WK);
    expect(walletAt(s, MON_AFTER).wallet.earned).toBe(70);
    expect(firstWeek(reduce(old))).toBeNull(); // only a baseline: nothing could earn yet
    expect(walletAt(reduce(old), MON_AFTER).wallet.earned).toBe(0);
  });
});

describe('the Sunday harvest recaps the week', () => {
  it('each person’s ベル, the ふたりでぜんぶ days and the total; nothing more lands', () => {
    const s = reduce(perfectWeek());
    const before = buildWeekView(s, 'A', SUN_BEFORE);
    expect(before.harvest).toBeNull();
    expect(before.wallet.balance).toBe(70);
    const after = buildWeekView(s, 'A', SUN_AFTER);
    expect(after.harvest).toEqual({ weekKey: WK, bells: { A: 28, B: 28, together: 14 }, togetherDays: 7, totalBells: 70, confirmedBy: [] });
    expect(after.wallet.balance).toBe(70);
    expect(after.host).toMatchObject({ key: 'host.harvest_ready', params: { bells: 70 } });
  });

  it('a missed goal costs its +1 and that day’s ふたりでぜんぶ', () => {
    const r = perfectWeek();
    r.metrics = r.metrics.filter((m) => !(m[1] === 'B' && m[3] === 'stand_min' && m[2] >= D[5])); // B: no Stand Sat, Sun
    const h = buildWeekView(reduce(r), 'B', SUN_AFTER).harvest!;
    expect(h).toMatchObject({ bells: { A: 28, B: 26, together: 10 }, togetherDays: 5, totalBells: 64 });
  });

  it('a harvest tap doesn’t change the money; both taps close it', () => {
    const r = perfectWeek();
    const tapped = plus(r, { events: [ev(jst(D[6], '19:40'), 'A', 'harvest', { week: WK }), ev(jst(D[6], '19:41'), 'B', 'harvest', { week: WK })] });
    const now = ms(D[6], '20:00');
    const a = buildWeekView(reduce(r), 'A', now);
    const b = buildWeekView(reduce(tapped), 'A', now);
    expect(a.harvest?.confirmedBy).toEqual([]);
    expect(b.harvest).toBeNull();
    expect(b.wallet).toEqual(a.wallet);
  });
});

describe('locks: earnings change until the Wednesday 04:00 lock, then they are fixed', () => {
  const base = rowsOf({ metrics: [metric(jst(D[0], '22:00'), 'A', D[0], 'steps', 1000)] });
  const late = (at: string, steps = 9000) => plus(base, { metrics: [metric(at, 'A', D[0], 'steps', steps)] });

  it('a late sync before the lock counts, also after the lock', () => {
    const r = late(jst('2026-11-24', '10:00')); // Tuesday after the week: still open
    expect(walletAt(reduce(base), MON_AFTER).wallet.earned).toBe(0);
    expect(walletAt(reduce(r), MON_AFTER).wallet.earned).toBe(1);
    expect(walletAt(reduce(r), LOCKED).wallet.earned).toBe(1);
  });

  it('a sync stamped after the lock never changes the week (one stamped exactly at it still counts)', () => {
    expect(walletAt(reduce(late(jst('2026-11-25', '04:00'))), LOCKED).wallet.earned).toBe(1);
    const r = late(new Date(ms('2026-11-25', '04:00') + 1).toISOString());
    expect(walletAt(reduce(r), LOCKED).wallet.earned).toBe(0);
    expect(weekBells(reduce(r), WK, LOCKED).A.days[0].steps).toBe(1000);
    expect(dayDetail(reduce(r), D[0], LOCKED).people.A.bells).toBe(0);
  });

  it('a locked week is the same from a fresh State of the same rows (cache) and with a revision', () => {
    const r = perfectWeek();
    const a = weekBells(reduce(r), WK, LOCKED);
    const b = weekBells(reduce(r, 'rev1'), WK, LOCKED);
    const c = weekBells(reduce(r, 'rev1'), WK, LOCKED + 3600_000);
    expect(b).toEqual(a);
    expect(c).toBe(b); // reused across States of one revision
  });
});

describe('buys: one of the two rewards, at its price, covered by the wallet; either of us can undo', () => {
  const r = perfectWeek(); // 70 in the wallet by Monday

  it('a buy takes from the one wallet: おやつ 8, 外食 15', () => {
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1'), spend(jst(MON, '10:01'), 'B', 's2', 'dinner')] }));
    expect(walletAt(s, MON_AFTER).wallet).toEqual({ earned: 70, spent: 23, balance: 47 });
    expect(walletAt(s, MON_AFTER).spends.map((x) => [x.spendId, x.by, x.item, x.bells])).toEqual([['s1', 'A', 'snack', 8], ['s2', 'B', 'dinner', 15]]);
  });

  it('a buy above the balance is ignored on read, never shown, and the balance never goes negative', () => {
    const s = reduce(plus(r, { events: [
      ...['a', 'b', 'c', 'd'].map((id, i) => spend(jst(MON, `10:0${i}`), 'A', id, 'dinner')), // 60 of 70
      spend(jst(MON, '10:05'), 'B', 'e', 'dinner'), // 10 left: refused
      spend(jst(MON, '10:06'), 'B', 'f'), // おやつ still fits
      spend(jst(MON, '10:07'), 'A', 'g') // 2 left: refused
    ] }));
    const p = walletAt(s, MON_AFTER);
    expect(p.wallet).toEqual({ earned: 70, spent: 68, balance: 2 });
    expect(p.spends.map((x) => x.spendId)).toEqual(['a', 'b', 'c', 'd', 'f']);
  });

  it('a buy is judged at its own time: earnings that came later don’t rescue it', () => {
    const s = reduce(plus(r, { events: [spend(jst(D[0], '23:00'), 'A', 'early', 'dinner')] })); // Monday: 10 earned
    expect(walletAt(s, MON_AFTER).spends).toEqual([]);
    const ok = reduce(plus(r, { events: [spend(jst(D[1], '23:00'), 'A', 'ok', 'dinner')] })); // Tuesday: 20
    expect(walletAt(ok, MON_AFTER).wallet.spent).toBe(15);
  });

  it('a spend_void by either of us gives it back; an early, a second or one naming no buy is ignored', () => {
    const buy = spend(jst(MON, '10:00'), 'A', 's1', 'dinner');
    const wallet = (events: EventRow[]) => walletAt(reduce(plus(r, { events: [buy, ...events] })), MON_AFTER);
    expect(wallet([]).wallet.balance).toBe(55);
    const voided = wallet([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 's1' })]);
    expect(voided.wallet).toEqual({ earned: 70, spent: 0, balance: 70 });
    expect(voided.spends[0]).toMatchObject({ spendId: 's1', voided: true, voidedAt: ms(MON, '10:05') });
    // the partner's undo counts too: one shared wallet
    expect(wallet([ev(jst(MON, '10:05'), 'B', 'spend_void', { spendId: 's1' })]).wallet).toEqual({ earned: 70, spent: 0, balance: 70 });
    expect(wallet([ev(jst(MON, '09:59'), 'A', 'spend_void', { spendId: 's1' })]).wallet.spent).toBe(15);
    expect(wallet([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 'nope' })]).wallet.spent).toBe(15);
    // a void of something that isn't a buy (a high-five's id) is no void
    const hf = ev(jst(MON, '10:01'), 'B', 'highfive', {});
    expect(wallet([hf, ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: hf[2] })]).wallet.spent).toBe(15);
    // a second void (either of us) never returns the ベル twice
    const twice = wallet([ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 's1' }), ev(jst(MON, '10:06'), 'B', 'spend_void', { spendId: 's1' })]);
    expect(twice.wallet).toEqual({ earned: 70, spent: 0, balance: 70 });
    expect(twice.spends).toHaveLength(1);
    // undoing a buy that the wallet didn't cover (never shown) gives nothing back
    const big = spend(jst(MON, '10:15'), 'B', 'big', 'dinner');
    const many = ['x1', 'x2', 'x3'].map((id, i) => spend(jst(MON, `10:1${i}`), 'A', id, 'dinner'));
    expect(wallet([...many, big, ev(jst(MON, '10:20'), 'A', 'spend_void', { spendId: 'big' })]).wallet.balance).toBe(10);
  });

  it('a void frees the wallet for later buys, in server order', () => {
    const s = reduce(plus(r, { events: [
      ...['a', 'b', 'c', 'd'].map((id, i) => spend(jst(MON, `10:0${i}`), 'A', id, 'dinner')),
      spend(jst(MON, '10:04'), 'B', 'e', 'dinner'), // refused: 10 left
      ev(jst(MON, '10:05'), 'A', 'spend_void', { spendId: 'a' }),
      spend(jst(MON, '10:06'), 'B', 'f', 'dinner')
    ] }));
    const p = walletAt(s, MON_AFTER);
    expect(p.spends.map((x) => [x.spendId, x.voided])).toEqual([['a', true], ['b', false], ['c', false], ['d', false], ['f', false]]);
    expect(p.wallet.balance).toBe(10);
  });

  it('buys are never locked: a void long after still counts', () => {
    const later = '2026-12-10';
    const s = reduce(plus(r, { events: [spend(jst(MON, '10:00'), 'A', 's1', 'dinner'), ev(jst(later, '10:00'), 'A', 'spend_void', { spendId: 's1' })] }));
    expect(walletAt(s, ms(later, '12:00')).wallet.spent).toBe(0);
  });

  it('anything but a reward at exactly its price is ignored', () => {
    const at = jst(MON, '10:00');
    const s = reduce(plus(r, { events: [
      ev(at, 'A', 'spend', { spendId: 7, item: 'snack', bells: 8 }),
      ev(at, 'A', 'spend', { spendId: 'x1', item: 'snack', bells: 5 }),
      ev(at, 'A', 'spend', { spendId: 'x2', item: 'snack', bells: 15 }),
      ev(at, 'A', 'spend', { spendId: 'x3', item: 'dinner', bells: 8 }),
      ev(at, 'A', 'spend', { spendId: 'x4', item: 'cafe', bells: 8 }),
      ev(at, 'A', 'spend', { spendId: 'x5', bells: 8 }),
      ev(at, 'A', 'spend', { spendId: 'x6', item: 'snack', bells: '8' }),
      ev(at, 'A', 'spend', { spendId: 'x7', item: 'snack', bells: 6 }), // the old prices
      ev(at, 'A', 'spend', { spendId: 'x8', item: 'dinner', bells: 20 }),
      ev(at, 'A', 'spend', { spendId: 'ok', item: 'snack', bells: 8 }),
      ev(at, 'A', 'spend', { spendId: 'ok', item: 'dinner', bells: 15 }) // duplicate id
    ] }));
    const p = walletAt(s, MON_AFTER);
    expect(p.spends.map((x) => x.spendId)).toEqual(['ok']);
    expect(p.wallet.spent).toBe(8);
  });
});

describe('the きろく ledger and the day', () => {
  const r = plus(perfectWeek(), { events: [spend(jst(MON, '10:00'), 'B', 's1')] });
  r.metrics = r.metrics.filter((m) => !(m[1] === 'A' && m[2] === D[1] && m[3] === 'steps')); // A misses 🍎 on Tuesday

  it('per-day rows for both people (their goals, ふたりでぜんぶ) and spends, newest first', () => {
    const l = bellsLedger(reduce(r), MON_AFTER);
    expect(l.earned).toBe(70 - 1 - 2);
    expect(l.days.map((d) => d.date)).toEqual([MON, ...[...D].reverse()]);
    const tue = l.days.find((d) => d.date === D[1])!;
    expect(tue).toMatchObject({ weekKey: WK, bells: 7, together: false });
    expect(tue.people.A).toEqual({ date: D[1], bells: 3, met: { pear: true, peach: true, cherry: true, apple: false }, stretch: 0 });
    expect(l.days.find((d) => d.date === D[0])).toMatchObject({ bells: 10, together: true });
    expect(l.spends.map((x) => [x.spendId, x.item, x.bells])).toEqual([['s1', 'snack', 8]]);
  });

  it('a day: each person’s values, goals met and ベル, and ふたりでぜんぶ; a future day earns nothing', () => {
    const d = dayDetail(reduce(r), D[1], MON_AFTER);
    expect(d.together).toBe(false);
    expect(d.people.A).toEqual({
      bells: 3, met: { pear: true, peach: true, cherry: true, apple: false }, stretched: { pear: false, peach: false, cherry: false, apple: false }, stretch: 0,
      rings: { pear: 1, peach: 1, cherry: 1, apple: 0 }, steps: null, exerciseMin: 60, move: { value: 700, goal: 600 }, standMin: 130
    });
    expect(dayDetail(reduce(r), D[0], MON_AFTER).together).toBe(true);
    const future = dayDetail(reduce(r), D[6], ms(D[2], '12:00'));
    expect(future.people.A.bells).toBe(0);
    expect(future.together).toBe(false);
  });
});

describe('the Move goal in force: per person, from the day it is set, never re-pricing earlier days', () => {
  // A: 450 kcal every day: under the default 600, over a goal of 400.
  const kcal = rowsOf({ metrics: D.map((d) => metric(jst(d, '22:00'), 'A', d, 'move_kcal', 450)) });
  const goal = (at: string, p: PersonId, value: number) => ev(at, p, 'pref', { key: 'moveGoal', value });
  const pears = (r: SnapshotRows, now: number) => weekBells(reduce(r), WK, now).A.days.map((d) => [d.bells, d.moveGoal]);

  it('the default goal: ウェイ 600, うめ 400', () => {
    expect(pears(kcal, MON_AFTER)).toEqual(D.map(() => [0, 600]));
  });

  it('a change applies from the day it is made (Tokyo date) to every later day', () => {
    const r = plus(kcal, { events: [goal(jst(D[2], '07:00'), 'A', 400)] });
    expect(pears(r, MON_AFTER)).toEqual([[0, 600], [0, 600], [1, 400], [1, 400], [1, 400], [1, 400], [1, 400]]);
    expect(buildWeekView(reduce(r), 'A', ms(D[1], '23:00')).people.A.moveGoal).toBe(600); // Tuesday: still the old goal
    expect(buildWeekView(reduce(r), 'A', ms(D[2], '12:00')).people.A.rings.pear).toEqual({ today: 450, goal: 400, met: true, stretched: false });
    expect(buildWeekView(reduce(r), 'B', ms(D[2], '12:00')).people.B.moveGoal).toBe(400); // B's own default
  });

  it('a later change wins from its day; one made at 23:59 still counts for that whole day; out of range is ignored', () => {
    const r = plus(kcal, { events: [goal(jst(D[1], '23:59'), 'A', 450), goal(jst(D[4], '00:00'), 'A', 900), goal(jst(D[5], '00:00'), 'A', 50)] });
    expect(pears(r, MON_AFTER)).toEqual([[0, 600], [1, 450], [1, 450], [1, 450], [0, 900], [0, 900], [0, 900]]);
  });

  it('a change after the week never re-prices it; one partner’s goal never moves the other’s', () => {
    const r = plus(kcal, { events: [goal(jst(MON, '08:00'), 'A', 400), goal(jst(D[0], '08:00'), 'B', 1000)] });
    expect(pears(r, MON_AFTER)).toEqual(D.map(() => [0, 600]));
  });
});

describe('がんばり: +1 per goal at 1.5×, at most +2 a person a day, in the wallet, the ribbon and きろく', () => {
  /** A's day: every goal met, these metrics raised to (at least) 1.5×. */
  const big = (at: string, d: string, over: Partial<Record<MetricRow[3], number>>): MetricRow[] =>
    allFour(at, 'A', d).map((m) => (over[m[3]] !== undefined ? metric(at, 'A', d, m[3], over[m[3]]!) : m));

  it('today: the stretched fruits, +2 on their rings, the day and the wallet; ふたりでぜんぶ unchanged', () => {
    const r = perfectWeek();
    r.metrics.push(...big(jst(D[2], '22:30'), D[2], { steps: 12000, move_kcal: 900 }));
    const v = buildWeekView(reduce(r), 'A', ms(D[2], '23:00'));
    expect(v.people.A.today).toEqual({ bells: 6, rings: { pear: 2, peach: 1, cherry: 1, apple: 2 } });
    expect(v.people.A.rings.apple).toEqual({ today: 12000, goal: 8000, met: true, stretched: true });
    expect(v.people.A.rings.peach.stretched).toBe(false);
    expect(v.together).toEqual({ met: true, left: 0 });
    expect(v.wallet.today).toBe(6 + 4 + 2); // the ribbon: both people's ベル with がんばり, + ふたりでぜんぶ
    expect(v.wallet.balance).toBe(3 * 10 + 2);
    expect(v.people.A.weekBells).toBe(3 * 4 + 2);
  });

  it('three or four stretched: all reached, +2 paid (the first fruits in ring order)', () => {
    const r = perfectWeek();
    r.metrics.push(...big(jst(D[0], '22:30'), D[0], { steps: 15000, exercise_min: 95, stand_min: 200 }));
    const v = buildWeekView(reduce(r), 'A', ms(D[0], '23:00'));
    expect(['pear', 'peach', 'cherry', 'apple'].map((f) => v.people.A.rings[f as 'pear'].stretched)).toEqual([false, true, true, true]);
    expect(v.people.A.today).toEqual({ bells: 6, rings: { pear: 1, peach: 2, cherry: 2, apple: 1 } });
  });

  it('the ledger and the day show each person\'s がんばり; the totals include it', () => {
    const r = perfectWeek();
    r.metrics.push(...big(jst(D[1], '22:30'), D[1], { steps: 12000, move_kcal: 1000, exercise_min: 90 }));
    const l = bellsLedger(reduce(r), MON_AFTER);
    const tue = l.days.find((d) => d.date === D[1])!;
    expect([tue.people.A.stretch, tue.people.B.stretch, tue.people.A.bells, tue.bells]).toEqual([2, 0, 6, 12]);
    expect(l.earned).toBe(70 + 2);
    const dd = dayDetail(reduce(r), D[1], MON_AFTER).people.A;
    expect(dd).toMatchObject({ bells: 6, stretch: 2, stretched: { pear: true, peach: true, cherry: false, apple: true }, rings: { pear: 2, peach: 2, cherry: 1, apple: 1 } });
  });

  it('a locked week\'s がんばり reads its values as of the lock: a later, higher sync never adds it', () => {
    const early = plus(perfectWeek(), { metrics: big(jst(D[3], '22:30'), D[3], { steps: 12500 }) });
    // Friday at 1.5×, stamped Wednesday 19:00 JST: after the week locked at 04:00
    const late = plus(early, { metrics: big('2026-11-25T10:00:00.000Z', D[4], { steps: 13000, move_kcal: 950 }) });
    expect(walletAt(reduce(early), LOCKED).wallet.earned).toBe(71);
    expect(walletAt(reduce(late), LOCKED).wallet.earned).toBe(71);
    expect(weekBells(reduce(late), WK, LOCKED).A.days.map((d) => d.stretch)).toEqual([0, 0, 0, 1, 0, 0, 0]);
  });

  it('a stretch synced before the lock counts', () => {
    const r = plus(perfectWeek(), { metrics: big('2026-11-24T10:00:00.000Z', D[4], { steps: 13000, move_kcal: 950 }) });
    expect(weekBells(reduce(r), WK, LOCKED).A.days[4].stretch).toBe(2);
    expect(walletAt(reduce(r), LOCKED).wallet.earned).toBe(72);
  });
});
