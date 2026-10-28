// Presence events from the gym Arrive/Leave Shortcuts. Visits are derived at read time (scoring/visits.ts); the
// 「筋トレとして記録する?」 question is in-app only (week.ts pendingConfirmations), never a push.
import { and, eq, gte, lte } from 'drizzle-orm';
import type { PersonId } from '#lib/types.ts';
import type { Db } from '#lib/server/db/index.ts';
import { place, presenceEvent } from '#lib/server/db/schema.ts';
import { HttpError } from '#lib/server/http.ts';
import { now } from '#lib/server/clock.ts';

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
