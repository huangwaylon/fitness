// Visitors (docs/design.md "Visitors"), after NH, where a special visitor comes nearly every day: K.K. Slider plays on
// Saturday nights (18:00–24:00), Daisy Mae comes on Sunday mornings (05:00–12:00), and Monday to Saturday one of NH's
// weekday visitors (`ROTATION`: each at most once a week, now and then a quiet day): Gulliver washed up on the beach
// (06:00–18:00), Wisp at night (20:00–04:00), the others in the plaza (06:00–22:00: Kicks, Label, Saharah, Leif, Redd,
// C.J., Flick). Pure and seeded by the date (daySeed.ts dayRand, the week's by its Monday): both phones see the same
// visitor. A tap gives a line (no trading, no ベル); K.K. plays a short song if the music is on. On Halloween night
// (events.ts: Oct 31 17:00–24:00) Jack comes instead of anyone else and asks for candy (a choice: a treat, or his
// trick). On a meteor shower's night (meteor.ts, at most once a week) Celeste comes to watch it, 20:00–04:00. NH's
// holiday hosts take the slot on their day (events.ts): Franklin on Turkey Day (he asks for a fish), Jingle on Toy Day,
// Pavé at Festivale, Zipper on the first and last days of Bunny Day. On the wedding countdown's milestone days
// (wedding.ts) Reese and Cyrus come together (one visitor, `reese`, drawn as the pair).
import { pickOne, shuffle } from '#lib/random.ts';
import { dayKey, jst } from '#lib/time/clock.ts';
import { addDays } from '#lib/time/dates.ts';
import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
import { ISLAND_SEED, dayRand } from './daySeed.ts';
import { hook, hookOneOf, islandSeed } from './devHooks.ts';
import { eventAt, type EventId, type EventNow } from './events.ts';
import { showerAt } from './meteor.ts';
import { coupleAt } from './wedding.ts';
import { washedUp } from '#lib/layout/spots.ts';
import type { Layout } from '#lib/layout/model.ts';

export type VisitorId = 'kk-slider' | 'daisy-mae' | 'wisp' | 'gulliver' | 'kicks' | 'label' | 'saharah' | 'leif' | 'redd' | 'cj' | 'flick'
  | 'jack' | 'celeste' | 'franklin' | 'jingle' | 'pave' | 'zipper' | 'reese';
export const VISITORS: readonly VisitorId[] = ['kk-slider', 'daisy-mae', 'wisp', 'gulliver', 'kicks', 'label', 'saharah', 'leif', 'redd', 'cj',
  'flick', 'jack', 'celeste', 'franklin', 'jingle', 'pave', 'zipper', 'reese'];
/** Each event's host (NH), in the visitor slot from its main part's hour. */
export const HOSTS: Partial<Record<EventId, VisitorId>> = { halloween: 'jack', 'turkey-day': 'franklin', 'toy-day': 'jingle', festivale: 'pave', 'bunny-day': 'zipper' };
/** NH's weekday visitors: one a day Monday to Saturday, each at most once a week. */
export const ROTATION: readonly VisitorId[] = ['gulliver', 'wisp', 'kicks', 'label', 'saharah', 'leif', 'redd', 'cj', 'flick'];
/** Quiet days in a week's draw (with ROTATION's nine): about one Monday-to-Saturday day in ten has no visitor. */
const QUIET = 1;
/** Lines each visitor has (chat.sp.<id>.0 …). */
export const VISITOR_LINES = 4;

/** The rotation's visitor of a day (null: Sunday, Daisy Mae's, or a quiet day): the week's draw (seeded by its
 *  Monday) of ROTATION and the quiet days, one a day from Monday. */
export function dayVisitor(date: string, weekday: number, seed = ISLAND_SEED): VisitorId | null {
  if (weekday === 0) return null;
  const week: (VisitorId | null)[] = [...ROTATION, ...Array<null>(QUIET).fill(null)];
  return shuffle(week, dayRand(addDays(date, 1 - weekday), 'visitors', seed))[weekday - 1];
}

/** Who visits at this Tokyo moment. `prevDate`: the day before (Wisp's night runs past midnight). `ev`: the event now
 *  (Halloween night brings Jack, even on a Saturday: the event comes first, as in NH). `shower`: a meteor shower is on
 *  (Celeste comes to watch it, before K.K. or Wisp: she's the rarest). */
export function visitorAt(date: string, prevDate: string, hour: number, weekday: number, seed = ISLAND_SEED,
  ev: EventNow | null = eventAt(date, hour), shower = showerAt(date, prevDate, hour, seed)): VisitorId | null {
  const host = ev?.night ? HOSTS[ev.id] : undefined;
  if (host) return host;
  if (coupleAt(date, hour)) return 'reese';
  if (shower) return 'celeste';
  if (weekday === 6 && hour >= 18) return 'kk-slider';
  if (weekday === 0 && hour >= 5 && hour < 12) return 'daisy-mae';
  // Wisp's night: from 20:00 on his day to 04:00 the next morning (none on a Saturday: K.K.'s night)
  if (hour < 4) return weekday !== 0 && dayVisitor(prevDate, weekday - 1, seed) === 'wisp' ? 'wisp' : null;
  const v = dayVisitor(date, weekday, seed);
  if (v === 'wisp') return hour >= 20 ? 'wisp' : null;
  if (v === 'gulliver') return hour >= 6 && hour < 18 ? 'gulliver' : null;
  return v && hour >= 6 && hour < 22 ? v : null;
}

/** Who visits at a scene-clock moment, the dev hooks (`?visitor=`, `?seed=`) and the seasonal preview included (an
 *  event's host, Celeste on a shower, Reese and Cyrus on the wedding). */
export function visitorNow(clock: Date): VisitorId | null {
  // (`?visitor=none`: nobody, the specs' pinned scene)
  if (hook('visitor') === 'none') return null;
  const want = hookOneOf('visitor', VISITORS);
  if (want) return want;
  const shown = scenePreview().event;
  if (shown === 'wedding') return 'reese';
  const date = dayKey(clock), prev = addDays(date, -1), seed = islandSeed();
  const { hour, weekday } = jst(clock);
  return visitorAt(date, prev, hour, weekday, seed, eventAt(date, hour, shown), showerAt(date, prev, hour, seed, shown === 'shower'));
}

/** A visitor's line on a tap (an i18n key): one of theirs, never the last one again. */
export function visitorLine(id: VisitorId, r: () => number, last?: string): string {
  const keys = Array.from({ length: VISITOR_LINES }, (_, i) => `chat.sp.${id}.${i}`).filter((k) => k !== last);
  return pickOne(keys, r);
}

/** How long Jack's trick (a goofy face on my villager) lasts. */
export const TRICK_MS = 60_000;

/** Where Gulliver lies washed up today (spots.ts washedUp: the layout's sand, by the date), or the old island's spot. */
export const beachedAt = (layout: Layout | null, date: string, seed: string): readonly [number, number] => (layout && washedUp(layout, date, seed)) || [96, 30];

