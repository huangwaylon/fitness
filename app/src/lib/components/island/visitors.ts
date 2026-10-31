// Visitors (docs/design.md "Visitors"), after NH: K.K. Slider plays on Saturday nights (18:00–24:00), Daisy Mae comes
// on Sunday mornings (05:00–12:00), Wisp floats by on some nights (20:00–04:00) and Gulliver washes up on the beach on
// some days (06:00–18:00). Pure and seeded by the date (beach.ts dayRand): both phones see the same visitor. A tap
// gives a line (no trading, no ベル); K.K. plays a short song if the music is on. On Halloween night (events.ts: Oct 31
// 17:00–24:00) Jack comes instead of anyone else and asks for candy (a choice: a treat, or his trick). On a meteor
// shower's night (meteor.ts, at most once a week) Celeste comes to watch it, 20:00–04:00.
import { ISLAND_SEED, dayRand } from './beach.ts';
import { eventAt, type EventNow } from './events.ts';
import { showerAt } from './meteor.ts';

export type VisitorId = 'kk-slider' | 'daisy-mae' | 'wisp' | 'gulliver' | 'jack' | 'celeste';
export const VISITORS: readonly VisitorId[] = ['kk-slider', 'daisy-mae', 'wisp', 'gulliver', 'jack', 'celeste'];
/** How often Wisp's night and Gulliver's day come (NH: now and then). */
export const VISIT_ODDS = 0.25;
/** Lines each visitor has (chat.sp.<id>.0 …). */
export const VISITOR_LINES = 4;

/** Who visits at this Tokyo moment. `prevDate`: the day before (Wisp's night runs past midnight). `ev`: the event now
 *  (Halloween night brings Jack, even on a Saturday: the event comes first, as in NH). `shower`: a meteor shower is on
 *  (Celeste comes to watch it, before K.K. or Wisp: she's the rarest). */
export function visitorAt(date: string, prevDate: string, hour: number, weekday: number, seed = ISLAND_SEED,
  ev: EventNow | null = eventAt(date, hour), shower = showerAt(date, prevDate, hour, seed)): VisitorId | null {
  if (ev?.id === 'halloween' && ev.night) return 'jack';
  if (shower) return 'celeste';
  if (weekday === 6 && hour >= 18) return 'kk-slider';
  if (weekday === 0 && hour >= 5 && hour < 12) return 'daisy-mae';
  if (hour >= 20 || hour < 4) return dayRand(hour < 4 ? prevDate : date, 'wisp', seed)() < VISIT_ODDS ? 'wisp' : null;
  if (hour >= 6 && hour < 18) return dayRand(date, 'gulliver', seed)() < VISIT_ODDS ? 'gulliver' : null;
  return null;
}

/** A visitor's line on a tap (an i18n key): one of theirs, never the last one again. */
export function visitorLine(id: VisitorId, r: () => number, last?: string): string {
  const keys = Array.from({ length: VISITOR_LINES }, (_, i) => `chat.sp.${id}.${i}`).filter((k) => k !== last);
  return keys[Math.floor(r() * keys.length)];
}

/** How long Jack's trick (a goofy face on my villager) lasts. */
export const TRICK_MS = 60_000;
