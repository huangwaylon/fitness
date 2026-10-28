// Presence events from the gym Arrive/Leave Shortcuts, and the 「筋トレとして記録する?」 prompt.
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { PersonId, Workout } from '#lib/types.ts';
import { STRENGTH } from '#lib/config/rules.ts';
import type { Db } from '#lib/server/db/index.ts';
import { place, presenceEvent, visitConfirmation, workout } from '#lib/server/db/schema.ts';
import { HttpError } from '#lib/server/http.ts';
import { now } from '#lib/server/clock.ts';
import { notify } from '#lib/server/push.ts';

export const VISIT_PROMPT_DELAY_MIN = 10;

export function recordPresence(db: Db, person: PersonId, input: { place: string; event: 'arrive' | 'leave'; at?: string }): { id: number; duplicate: boolean } {
  const p = db.select().from(place).where(eq(place.key, input.place)).get();
  if (!p || p.person !== person) throw new HttpError(404, 'unknown_place');
  const at = input.at ? new Date(input.at) : now();
  if (Number.isNaN(at.getTime())) throw new HttpError(400, 'invalid_at');
  if (Math.abs(at.getTime() - now().getTime()) > 48 * 3600_000) throw new HttpError(400, 'at_out_of_range');
  // Shortcuts sometimes fire twice: drop a repeat of the same event within 2 minutes.
  const recent = db.select().from(presenceEvent)
    .where(and(eq(presenceEvent.person, person), eq(presenceEvent.placeKey, p.key), eq(presenceEvent.event, input.event),
      gte(presenceEvent.at, new Date(at.getTime() - 120_000).toISOString()), lte(presenceEvent.at, new Date(at.getTime() + 120_000).toISOString())))
    .get();
  if (recent) return { id: recent.id, duplicate: true };
  const row = db.insert(presenceEvent).values({ person, placeKey: p.key, event: input.event, at: at.toISOString() }).returning({ id: presenceEvent.id }).get();
  return { id: row.id, duplicate: false };
}

/** A workout counts as strength for overlap purposes (auto types, or an ask-type answered yes). */
export function isStrengthWorkout(w: Pick<Workout, 'type' | 'durationMin' | 'includesStrength'>): boolean {
  if ((STRENGTH.autoTypes as readonly string[]).includes(w.type)) return w.durationMin >= STRENGTH.minWorkoutMin;
  if ((STRENGTH.askTypes as readonly string[]).includes(w.type)) return w.includesStrength === true;
  return false;
}

export function overlapsStrengthWorkout(db: Db, person: PersonId, fromIso: string, toIso: string): boolean {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  const rows = db.select().from(workout).where(eq(workout.person, person)).all();
  return rows.some((w) => isStrengthWorkout(w) && Date.parse(w.startAt) < to && Date.parse(w.endAt) > from);
}

/** The arrive event that a leave closes (latest arrive at the same place with no leave in between). */
export function arriveForLeave(db: Db, leaveId: number): { arrive: typeof presenceEvent.$inferSelect; leave: typeof presenceEvent.$inferSelect } | null {
  const leave = db.select().from(presenceEvent).where(eq(presenceEvent.id, leaveId)).get();
  if (!leave || leave.event !== 'leave') return null;
  const prev = db.select().from(presenceEvent)
    .where(and(eq(presenceEvent.person, leave.person), eq(presenceEvent.placeKey, leave.placeKey), lte(presenceEvent.at, leave.at)))
    .orderBy(desc(presenceEvent.at), desc(presenceEvent.id)).limit(2).all()
    .filter((e) => e.id !== leave.id);
  const arrive = prev[0];
  if (!arrive || arrive.event !== 'arrive') return null;
  if (Date.parse(leave.at) - Date.parse(arrive.at) > 6 * 3600_000) return null; // forgotten leave, not a visit
  return { arrive, leave };
}

/** Does this leave close a visit that needs the person's confirmation? */
export function visitNeedsPrompt(db: Db, leaveId: number): { arriveId: number; person: PersonId } | null {
  const pair = arriveForLeave(db, leaveId);
  if (!pair) return null;
  const { arrive, leave } = pair;
  const dwellMin = (Date.parse(leave.at) - Date.parse(arrive.at)) / 60_000;
  if (dwellMin < STRENGTH.minVisitMin) return null;
  const p = db.select().from(place).where(eq(place.key, arrive.placeKey)).get();
  if (!p || p.autoStrength) return null;
  if (db.select().from(visitConfirmation).where(eq(visitConfirmation.arriveEventId, arrive.id)).get()) return null;
  if (overlapsStrengthWorkout(db, arrive.person, arrive.at, leave.at)) return null;
  return { arriveId: arrive.id, person: arrive.person };
}

/** Scheduler: prompt for leaves 10 min–6 h old (gives the Watch workout time to sync first). */
export async function promptRecentVisits(db: Db): Promise<number> {
  const t = now().getTime();
  const leaves = db.select().from(presenceEvent)
    .where(and(eq(presenceEvent.event, 'leave'), gte(presenceEvent.at, new Date(t - 6 * 3600_000).toISOString()),
      lte(presenceEvent.at, new Date(t - VISIT_PROMPT_DELAY_MIN * 60_000).toISOString())))
    .all();
  let sent = 0;
  for (const l of leaves) {
    const need = visitNeedsPrompt(db, l.id);
    if (need && (await notify(db, need.person, 'visit', { url: '/?confirm=visit', tag: `visit-${need.arriveId}`, data: { arriveId: need.arriveId } }))) sent++;
  }
  return sent;
}
