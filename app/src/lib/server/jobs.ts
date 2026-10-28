// In-process scheduler. Every minute: settle due weeks (state-based, so missed runs catch up on boot and
// double-firing is harmless), 20:00 check-in reminder, payday push, gym-visit prompts.
import { and, eq } from 'drizzle-orm';
import type { PersonId, WeekKey } from '#lib/types.ts';
import { JOBS, MONEY, SEASONS } from '#lib/config/rules.ts';
import { addDays, nowInZone, weekKeyOf } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import { checkin, cozyDay, transfer, weekLock } from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';
import { settleWeek, type SettleResult } from '#lib/server/ledger.ts';
import { notify } from '#lib/server/push.ts';
import { promptRecentVisits } from '#lib/server/presence.ts';
import { finalAt, monthEarnings, prevMonth, provisionalAt } from '#lib/server/week.ts';

const LOOKBACK_WEEKS = 8;
const PAYDAY_HOUR = 12;

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
    if (t >= finalAt(wk)) results.push(settleWeek(db, wk, 'final'));
    else if (t >= provisionalAt(wk) && !lock?.provisionalAt) results.push(settleWeek(db, wk, 'provisional'));
  }
  return results;
}

export async function runReminders(db: Db, t: Date = now()): Promise<void> {
  const z = nowInZone(t);
  const minutes = z.hour * 60 + z.minute;
  const day = Number(z.date.slice(8, 10));
  for (const person of ['A', 'B'] as PersonId[]) {
    if (day === MONEY.paydayDayOfMonth && z.hour >= PAYDAY_HOUR && z.hour < 21) {
      const month = prevMonth(z.date);
      const done = db.select().from(transfer).where(eq(transfer.month, month)).get();
      if (!done && monthEarnings(db, month) > 0) await notify(db, person, 'payday', { url: '/jar' });
    }
    const start = JOBS.checkinReminder.hour * 60 + JOBS.checkinReminder.minute;
    if (minutes >= start && minutes < start + 120) {
      const ticked = db.select().from(checkin).where(and(eq(checkin.person, person), eq(checkin.localDate, z.date))).get();
      const cozy = db.select().from(cozyDay).where(and(eq(cozyDay.person, person), eq(cozyDay.localDate, z.date))).get();
      if (!ticked && !cozy) await notify(db, person, 'checkin', { url: '/?checkin=1' });
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
    await promptRecentVisits(db);
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
