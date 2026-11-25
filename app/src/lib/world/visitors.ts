// Visitors (docs/design.md "Visitors"), after NH: at most one on the island at any time (the user, 2026-11-25; K.K.
// lives on his stool and isn't one: kkSlider.ts). Daisy Mae comes on Sunday mornings (05:00–12:00); Monday to
// Saturday one visitor of `ROTATION` a day: NH's weekday visitors and its other special characters with a role
// (visitorRoles.ts: shops, gifts, Katrina's fortune, Wendell's fish, the cheers), each once in a cycle before any comes
// again (a seeded order per cycle, by the date: every phone agrees). Their hours: Gulliver and the beach ones washed
// up on the beach (06:00–18:00), Wisp at night (20:00–04:00, never on a Saturday: K.K.'s), the rest on the plaza
// (06:00–22:00). Saturday evening (18:00–24:00) is K.K.'s show: nobody else then. The events' come first, instead of
// the day's (eventVisitor): an event's host (events.ts: Jack on Halloween night, asking for candy, Franklin on Turkey
// Day, asking for a fish, Jingle on Toy Day, Zipper on Bunny Day's first and last days), Reese and Cyrus on the
// wedding countdown's milestones (wedding.ts: one visitor, `reese`, drawn as the pair), Celeste on a meteor shower's
// night (meteor.ts, 20:00–04:00) and Pavé dancing on Festivale. Every visitor is NH's own 3D model
// (villager3d/villagers.json): one with none never comes.
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
import { fromEaster } from '#lib/time/holidays.ts';
import { ROLES, SPECIALS, type SpecialId } from './visitorRoles.ts';
import type { Layout } from '#lib/layout/model.ts';

export type VisitorId = 'daisy-mae' | 'wisp' | 'gulliver' | 'kicks' | 'label' | 'saharah' | 'leif' | 'redd' | 'cj' | 'flick'
  | 'jack' | 'celeste' | 'franklin' | 'jingle' | 'zipper' | 'reese' | SpecialId;
export const VISITORS: readonly VisitorId[] = ['daisy-mae', 'wisp', 'gulliver', 'kicks', 'label', 'saharah', 'leif', 'redd', 'cj',
  'flick', 'jack', 'celeste', 'franklin', 'jingle', 'zipper', 'reese', ...SPECIALS, 'pave'];
/** Each event's host (NH), in the visitor slot from its main part's hour. */
export const HOSTS: Partial<Record<EventId, VisitorId>> = { halloween: 'jack', 'turkey-day': 'franklin', 'toy-day': 'jingle', 'bunny-day': 'zipper' };
/** The rotation: one a day Monday to Saturday, NH's weekday visitors and the special characters (visitorRoles.ts). */
export const ROTATION: readonly VisitorId[] = ['gulliver', 'wisp', 'kicks', 'label', 'saharah', 'leif', 'redd', 'cj', 'flick', ...SPECIALS];
/** Lines each visitor has (chat.sp.<id>.0 …). */
export const VISITOR_LINES = 4;

/** Monday-to-Saturday days from Monday 2026-01-05 to `date` (null: a Sunday, Daisy Mae's). */
function workdayNo(date: string): number | null {
  const d = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-01-05T00:00:00Z')) / 86_400_000);
  const wd = ((d % 7) + 7) % 7; // 0 Monday … 6 Sunday
  return wd === 6 ? null : Math.floor(d / 7) * 6 + wd;
}
/** A cycle's seeded order of the rotation, before the fixes (cycleOf). */
const drawOf = (cycle: number, seed: string): VisitorId[] => shuffle([...ROTATION], dayRand(`cycle-${cycle}`, 'visitors', seed));
/** Wisp off a Saturday (his night is K.K.'s): to the day before, or the one after at a cycle's start. */
function wispOff(order: VisitorId[], cycle: number): VisitorId[] {
  const n = ROTATION.length, p = order.indexOf('wisp');
  if ((cycle * n + p) % 6 === 5) {
    const q = p > 0 ? p - 1 : p + 1;
    [order[p], order[q]] = [order[q], order[p]];
  }
  return order;
}
/** Whether a cycle's order has Wisp on a Saturday. */
const wispSat = (order: readonly VisitorId[], cycle: number): boolean => (cycle * ROTATION.length + order.indexOf('wisp')) % 6 === 5;
/** Across two cycles' seam the same visitor is more than this many days (Monday to Saturday) apart: a week at least. */
export const SEAM_GAP = 6;
/** A cycle's order: each once (seeded by the cycle), Wisp never on a Saturday, and none of the last cycle's last few in
 *  its first few (SEAM_GAP: swapped with one from its middle). The seam's swaps touch neither cycle's last SEAM_GAP, so a
 *  cycle's tail is its draw's with Wisp's fix alone: a cycle needs only the one before's draw. */
function cycleOf(cycle: number, seed: string): VisitorId[] {
  const n = ROTATION.length, order = wispOff(drawOf(cycle, seed), cycle), prev = wispOff(drawOf(cycle - 1, seed), cycle - 1);
  for (let p = 0; p < SEAM_GAP; p++) {
    const near = prev.slice(n - SEAM_GAP + p);
    if (!near.includes(order[p])) continue;
    for (let j = SEAM_GAP; j < n - SEAM_GAP; j++) {
      if (near.includes(order[j])) continue;
      [order[p], order[j]] = [order[j], order[p]];
      if (!wispSat(order, cycle)) break;
      [order[p], order[j]] = [order[j], order[p]];
    }
  }
  return order;
}
const cycles = new Map<string, VisitorId[]>();

/** The rotation's visitor of a day (null: Sunday, Daisy Mae's): the cycle's next, each once in a cycle before any
 *  comes again, by the date and the island's seed (every phone agrees). */
export function dayVisitor(date: string, seed = ISLAND_SEED): VisitorId | null {
  const no = workdayNo(date);
  if (no === null) return null;
  const n = ROTATION.length, cycle = Math.floor(no / n), key = `${seed}|${cycle}`;
  let order = cycles.get(key);
  if (!order) {
    if (cycles.size > 8) cycles.clear();
    cycles.set(key, (order = cycleOf(cycle, seed)));
  }
  return order[((no % n) + n) % n];
}
/** The hours a rotation visitor is here on their day ([from, to), past 24: into the next morning). */
export function hoursOf(id: VisitorId): readonly [number, number] {
  if (id === 'wisp') return [20, 28];
  return onBeach(id) ? [6, 18] : [6, 22];
}
/** NH's Festivale (the Monday 48 days before Easter): Pavé dances on the plaza all day. */
export const festivale = (date: string): boolean => fromEaster(date) === -48;

/** An event's visitor at this Tokyo moment, or null: the event's host (Halloween night brings Jack, even on a Saturday:
 *  the event comes first, as in NH), Reese and Cyrus on the wedding, Celeste on a meteor shower (even at K.K.'s show,
 *  before Wisp: she's the rarest). */
function eventVisitor(date: string, hour: number, ev: EventNow | null, shower: boolean): VisitorId | null {
  const host = ev?.night ? HOSTS[ev.id] : undefined;
  return host ?? (coupleAt(date, hour) ? 'reese' : shower ? 'celeste' : festivale(date) && hour >= 6 && hour < 22 ? 'pave' : null);
}

/** Who visits at this Tokyo moment. `prevDate`: the day before (Wisp's night runs past midnight). `ev`: the event now;
 *  `shower`: a meteor shower is on (eventVisitor: theirs come first). */
export function visitorAt(date: string, prevDate: string, hour: number, weekday: number, seed = ISLAND_SEED,
  ev: EventNow | null = eventAt(date, hour), shower = showerAt(date, prevDate, hour, seed)): VisitorId | null {
  const host = eventVisitor(date, hour, ev, shower);
  if (host) return host;
  // Saturday evening is K.K.'s show on his stool (kkSlider.ts): the plaza's his
  if (weekday === 6 && hour >= 18) return null;
  if (weekday === 0) return hour >= 5 && hour < 12 ? 'daisy-mae' : null;
  // (past midnight: the day before's visitor whose hours run on, Wisp)
  const prev = dayVisitor(prevDate, seed);
  if (prev && hour + 24 < hoursOf(prev)[1]) return prev;
  const v = dayVisitor(date, seed);
  if (!v) return null;
  const [from, to] = hoursOf(v);
  return hour >= from && hour < to ? v : null;
}

/** Who visits at a scene-clock moment, the dev hooks (`?visitor=`, `?seed=`) and the seasonal preview included (an
 *  event's host, Celeste on a shower, Reese and Cyrus on the wedding). */
export function visitorNow(clock: Date): VisitorId | null {
  // (`?visitor=none`: nobody, the specs' pinned scene; `?visitor=events`: an event's visitor only, never the day's: the
  // e2e's ambient life off, devHooks.ts)
  const h = hook('visitor');
  if (h === 'none') return null;
  const want = hookOneOf('visitor', VISITORS);
  if (want) return want;
  const shown = scenePreview().event;
  if (shown === 'wedding') return 'reese';
  const date = dayKey(clock), prev = addDays(date, -1), seed = islandSeed();
  const { hour, weekday } = jst(clock);
  const ev = eventAt(date, hour, shown), shower = showerAt(date, prev, hour, seed, shown === 'shower');
  return h === 'events' ? eventVisitor(date, hour, ev, shower) : visitorAt(date, prev, hour, weekday, seed, ev, shower);
}

/** A visitor's line on a tap (an i18n key): one of theirs, never the last one again. */
export function visitorLine(id: VisitorId, r: () => number, last?: string): string {
  const keys = Array.from({ length: VISITOR_LINES }, (_, i) => `chat.sp.${id}.${i}`).filter((k) => k !== last);
  return pickOne(keys, r);
}

/** How long Jack's trick (a goofy face on my villager) lasts. */
export const TRICK_MS = 60_000;

/** Washed up on Gulliver's beach (him, Gullivarrr and Wendell). */
export const onBeach = (id: VisitorId): boolean => id === 'gulliver' || !!(ROLES as Partial<Record<VisitorId, { beach?: true }>>)[id]?.beach;

/** Where Gulliver lies washed up today (spots.ts washedUp: the layout's sand, by the date), or the old island's spot. */
export const beachedAt = (layout: Layout | null, date: string, seed: string): readonly [number, number] => (layout && washedUp(layout, date, seed)) || [96, 30];

