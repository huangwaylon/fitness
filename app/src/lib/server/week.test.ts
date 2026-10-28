import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '#lib/server/db/index.ts';
import { setNow } from '#lib/server/clock.ts';
import { getWeekView, monthEarnings } from '#lib/server/week.ts';
import { ledgerEntry } from '#lib/server/db/schema.ts';
import { setVisibility } from '#lib/server/actions.ts';
import { settleWeek } from '#lib/server/ledger.ts';
import { confirmHarvest } from '#lib/server/actions.ts';
import { freshDb, seedWeek } from '#lib/server/test-utils.ts';

const WK = '2026-11-16'; // a normal scored week (Nov 2 and 9 are calibration weeks)
let db: Db;

beforeEach(() => {
  db = freshDb();
  seedWeek(db, 'A', WK, { steps: 8000, exerciseMin: 30, ticksPerDay: 2, days: 3 });
  seedWeek(db, 'B', WK, { steps: 7000, exerciseMin: 20, ticksPerDay: 3, days: 3 });
  setNow('2026-11-18T12:00:00Z'); // Wed 21:00 JST
});

describe('WeekView privacy', () => {
  it('own card is full; partner card has no habits and no raw numbers by default', () => {
    const v = getWeekView(db, 'A');
    expect(v.me).toBe('A');
    expect(v.weekKey).toBe(WK);
    expect(v.people.A.habits?.keys).toHaveLength(3);
    expect(v.people.A.fruits.apple.actual).toBeTypeOf('number');
    expect(v.people.B.habits).toBeUndefined();
    expect(Object.keys(v.people.B).sort()).toEqual(['fruits', 'lastSyncAt', 'person', 'score', 'villager', 'villagerName']);
    for (const f of Object.values(v.people.B.fruits)) {
      expect(Object.keys(f).sort()).toEqual(['maxMilli', 'milli', 'pct']);
    }
    const partnerJson = JSON.stringify(v.people.B);
    for (const h of ['eat_lunch', 'snack_swap', 'veg_two_meals']) expect(partnerJson).not.toContain(h);
    expect(v.people.B.score).toBeGreaterThan(0);
  });

  it('raw numbers appear only for metrics the partner opted into', () => {
    setVisibility(db, 'B', { metric: 'apple', shareRaw: true });
    const v = getWeekView(db, 'A');
    expect(v.people.B.fruits.apple.actual).toBeTypeOf('number');
    expect(v.people.B.fruits.apple.target).toBeTypeOf('number');
    expect(v.people.B.fruits.peach.actual).toBeUndefined();
    expect(v.people.B.habits).toBeUndefined();
    // and B's own view of A is unaffected
    expect(getWeekView(db, 'B').people.A.fruits.apple.actual).toBeUndefined();
  });

  it('harvest appears after Sunday provisional and closes when both confirm', () => {
    setNow('2026-11-22T10:31:00Z'); // Sun 19:31 JST
    expect(getWeekView(db, 'A').harvest).toBeNull();
    settleWeek(db, WK, 'provisional');
    const v = getWeekView(db, 'A');
    expect(v.harvest?.weekKey).toBe(WK);
    expect(v.juniper.key).toBe('juniper.harvest_ready');
    expect(v.jar.totalYen).toBe(v.harvest!.payout.A.fruitYen + v.harvest!.payout.B.fruitYen + v.harvest!.payout.teamYen);
    confirmHarvest(db, 'A');
    expect(getWeekView(db, 'A').juniper.key).toBe('juniper.harvest_waiting');
    expect(confirmHarvest(db, 'B').closed).toBe(true);
    expect(getWeekView(db, 'B').harvest).toBeNull();
    setNow(null);
  });
});

describe('monthEarnings', () => {
  it('counts jar earn/top-up rows by the month of the week\'s Sunday', () => {
    const add = (weekKey: string, kind: 'earn' | 'topup' | 'spend', amountYen: number, bucket: 'jar' | 'purse' = 'jar') =>
      db.insert(ledgerEntry).values({ bucket, layer: bucket === 'jar' ? 'A' : null, kind, weekKey, amountYen, idemKey: `${kind}:${bucket}:${weekKey}:${amountYen}` }).run();
    add('2026-10-26', 'earn', 100); // Sunday Nov 1 → November
    add('2026-11-23', 'earn', 200); // Sunday Nov 29 → November
    add('2026-11-23', 'topup', 30);
    add('2026-11-30', 'earn', 400); // Sunday Dec 6 → December
    add('2026-10-19', 'earn', 800); // Sunday Oct 25 → October
    add('2026-11-16', 'spend', -50, 'purse');
    expect(monthEarnings(db, '2026-11')).toBe(330);
    expect(monthEarnings(db, '2026-10')).toBe(800);
    expect(monthEarnings(db, '2026-12')).toBe(400);
    expect(monthEarnings(db, '2027-01')).toBe(0);
  });
});
