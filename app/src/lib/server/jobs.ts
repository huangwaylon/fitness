// In-process scheduler. Every minute: settle due weeks (state-based, so missed runs catch up on boot and
// double-firing is harmless), then at most one push per person per day (harvest → check-in → payday).
import { and, eq } from 'drizzle-orm';
import type { PersonId, WeekKey } from '#lib/types.ts';
import { HOLIDAY, JOBS, MONEY, SEASONS } from '#lib/config/rules.ts';
import { inMonthDayRange } from '#lib/scoring/dates.ts';
import { addDays, nowInZone, weekKeyOf } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import { checkin, cozyDay, harvestConfirm, transfer, weekLock } from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';
import { settleWeek, type SettleResult } from '#lib/server/ledger.ts';
import { notify } from '#lib/server/push.ts';
import { finalAt, harvestWeekKey, monthEarnings, prevMonth, provisionalAt } from '#lib/server/week.ts';

const LOOKBACK_WEEKS = 8;

/** First settled week: the first full Mon–Sun week of season 1 (or SETTLE_FROM_WEEK). */
export function firstWeek(): WeekKey {
  if (process.env.SETTLE_FROM_WEEK) return weekKeyOf(process.env.SETTLE_FROM_WEEK);
  const from = SEASONS[0].from;
  const wk = weekKeyOf(from);
  return wk < from ? addDays(wk, 7) : wk;
}

/** Weeks to consider: the last few, never before the first full season week. */
export function candidateWeeks(t: Date = now()): WeekKey[] {
  const first = firstWeek();
  const cur = weekKeyOf(nowInZone(t).date);
  const out: WeekKey[] = [];
  for (let i = LOOKBACK_WEEKS; i >= 0; i--) {
    const wk = addDays(cur, -7 * i);
    if (wk >= first) out.push(wk);
  }
  return out;
}

export function runSettlement(db: Db, t: Date = now()): SettleResult[] {
  const results: SettleResult[] = [];
  for (const wk of candidateWeeks(t)) {
    const lock = db.select().from(weekLock).where(eq(weekLock.weekKey, wk)).get();
    if (lock?.lockedAt) continue;
    if (t >= finalAt(wk)) {
      // Mac was off through Wednesday: still record the provisional pass so the harvest opens.
      if (!lock?.provisionalAt) results.push(settleWeek(db, wk, 'provisional'));
      results.push(settleWeek(db, wk, 'final'));
    }
    else if (t >= provisionalAt(wk) && !lock?.provisionalAt) results.push(settleWeek(db, wk, 'provisional'));
  }
  return results;
}

/**
 * At most one push per person per day (PROPOSAL §3.8), decided by priority (review round 3, M1/M2):
 * Sunday harvest (from 19:30) → evening check-in (20:00) → payday (25th, evening). Gym-visit questions are
 * in-app only (the pending card on Island), and nothing is sent 22:00–07:00 (see notify()).
 */
export async function runReminders(db: Db, t: Date = now()): Promise<void> {
  const z = nowInZone(t);
  const minutes = z.hour * 60 + z.minute;
  const day = Number(z.date.slice(8, 10));
  const harvestWk = harvestWeekKey(db, t);
  const start = JOBS.checkinReminder.hour * 60 + JOBS.checkinReminder.minute;
  for (const person of ['A', 'B'] as PersonId[]) {
    if (harvestWk) {
      const confirmed = db.select().from(harvestConfirm)
        .where(and(eq(harvestConfirm.weekKey, harvestWk), eq(harvestConfirm.person, person))).get();
      if (!confirmed && (await notify(db, person, 'harvest', { url: '/' }))) continue;
    }
    if (minutes < start) continue;
    const pearOff = inMonthDayRange(z.date, HOLIDAY.pearOff.from, HOLIDAY.pearOff.to);
    const ticked = db.select().from(checkin).where(and(eq(checkin.person, person), eq(checkin.localDate, z.date))).get();
    const cozy = db.select().from(cozyDay).where(and(eq(cozyDay.person, person), eq(cozyDay.localDate, z.date))).get();
    if (!pearOff && !ticked && !cozy) {
      await notify(db, person, 'checkin', { url: '/?checkin=1' });
      continue;
    }
    if (day === MONEY.paydayDayOfMonth) {
      const month = prevMonth(z.date);
      const done = db.select().from(transfer).where(eq(transfer.month, month)).get();
      if (!done && monthEarnings(db, month) > 0) await notify(db, person, 'payday', { url: '/jar' });
    }
  }
}

export async function tick(db: Db, t: Date = now()): Promise<void> {
  try {
    runSettlement(db, t);
  } catch (e) {
    console.error('[jobs] settlement failed', e instanceof Error ? e.message : e);
  }
  try {
    await runReminders(db, t);
  } catch (e) {
    console.error('[jobs] notifications failed', e instanceof Error ? e.message : e);
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startScheduler(getDb: () => Db): void {
  if (timer) return;
  const run = () => void tick(getDb());
  run(); // catch up missed runs on boot
  timer = setInterval(run, 60_000);
  timer.unref?.();
}

export function stopScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
