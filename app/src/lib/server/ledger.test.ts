import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Db } from '#lib/server/db/index.ts';
import { dailyMetric, ledgerEntry, weekLock } from '#lib/server/db/schema.ts';
import { setNow } from '#lib/server/clock.ts';
import { settleWeek } from '#lib/server/ledger.ts';
import { runSettlement } from '#lib/server/jobs.ts';
import { computePayout } from '#lib/server/week.ts';
import { freshDb, seedWeek } from '#lib/server/test-utils.ts';

const WK = '2026-11-02';
let db: Db;
const entries = () => db.select().from(ledgerEntry).orderBy(ledgerEntry.id).all();
const total = () => entries().reduce((s, e) => s + e.amountYen, 0);

beforeEach(() => {
  db = freshDb();
  seedWeek(db, 'A', WK, { steps: 5000, exerciseMin: 10, ticksPerDay: 1 });
  seedWeek(db, 'B', WK, { steps: 7000, exerciseMin: 15, ticksPerDay: 2 });
});

describe('settlement', () => {
  it('provisional twice → one set of earn entries matching the payout', () => {
    settleWeek(db, WK, 'provisional');
    const first = entries();
    settleWeek(db, WK, 'provisional');
    expect(entries()).toEqual(first);
    const { payout } = computePayout(db, WK);
    expect(first.find((e) => e.idemKey === `earn:jar:A:${WK}`)?.amountYen).toBe(payout.A.fruitYen);
    expect(first.find((e) => e.idemKey === `earn:jar:B:${WK}`)?.amountYen).toBe(payout.B.fruitYen);
    expect(first.find((e) => e.idemKey === `earn:jar:team:${WK}`)?.amountYen).toBe(payout.teamYen);
    expect(first.every((e) => e.kind === 'earn' && Number.isInteger(e.amountYen) && e.amountYen > 0)).toBe(true);
  });

  it('final tops up only increases, then locks; locked week is untouched', () => {
    settleWeek(db, WK, 'provisional');
    const provisional = total();
    // Late data raises A's score.
    seedWeek(db, 'A', WK, { steps: 9000, exerciseMin: 40, ticksPerDay: 3 });
    const r = settleWeek(db, WK, 'final');
    const topups = entries().filter((e) => e.kind === 'topup');
    expect(topups.length).toBeGreaterThan(0);
    expect(topups.every((e) => e.amountYen > 0)).toBe(true);
    const { payout } = computePayout(db, WK);
    const jarA = entries().filter((e) => e.layer === 'A').reduce((s, e) => s + e.amountYen, 0);
    expect(jarA).toBe(payout.A.fruitYen);
    expect(topups.find((e) => e.layer === 'A')!.idemKey).toBe(`topup:jar:A:${WK}:${payout.A.fruitYen}`);
    expect(total()).toBeGreaterThan(provisional);
    expect(r.lines.length).toBe(5);
    expect(db.select().from(weekLock).where(eq(weekLock.weekKey, WK)).get()?.lockedAt).toBeTruthy();

    const before = entries();
    seedWeek(db, 'B', WK, { steps: 12000, exerciseMin: 60, ticksPerDay: 3 });
    expect(settleWeek(db, WK, 'final').skipped).toBe('locked');
    expect(settleWeek(db, WK, 'provisional').skipped).toBe('locked');
    expect(entries()).toEqual(before);
  });

  it('no clawback when data drops after provisional', () => {
    settleWeek(db, WK, 'provisional');
    const before = total();
    db.delete(dailyMetric).run();
    settleWeek(db, WK, 'final');
    expect(total()).toBe(before);
    expect(entries().some((e) => e.amountYen < 0)).toBe(false);
  });

  it('scheduler: provisional at Sun 19:30 JST, final at Wed 04:00 JST, catch-up is idempotent', () => {
    expect(runSettlement(db, new Date('2026-11-08T10:29:00Z'))).toEqual([]); // Sun 19:29 JST
    const p = runSettlement(db, new Date('2026-11-08T10:30:00Z'));
    expect(p.map((r) => [r.weekKey, r.mode])).toEqual([[WK, 'provisional']]);
    expect(runSettlement(db, new Date('2026-11-08T10:31:00Z'))).toEqual([]);
    expect(runSettlement(db, new Date('2026-11-10T18:59:00Z'))).toEqual([]); // Wed 03:59 JST
    const f = runSettlement(db, new Date('2026-11-10T19:00:00Z'));
    expect(f.map((r) => [r.weekKey, r.mode])).toEqual([[WK, 'final']]);
    // Booting days later: nothing left to do for that week.
    expect(runSettlement(db, new Date('2026-11-13T00:00:00Z')).filter((r) => r.weekKey === WK)).toEqual([]);
  });

  it('a missed provisional is paid in full as earn by the final pass', () => {
    const r = runSettlement(db, new Date('2026-11-12T00:00:00Z'));
    expect(r.map((x) => x.mode)).toEqual(['final']);
    expect(entries().every((e) => e.kind === 'earn')).toBe(true);
    expect(entries().length).toBeGreaterThan(0);
    setNow(null);
  });
});
