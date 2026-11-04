// NH's dated events on the island (docs/design.md "Halloween", "Holiday hosts"): a date rule per event, on the Tokyo
// calendar, with the hour its main part starts (Halloween's evening; a host's arrival). Pure. Every rule verified on
// Nookipedia: Halloween Oct 31 (Jack 17:00–24:00); Turkey Day the fourth Thursday of November (Franklin 09:00–24:00);
// Toy Day Dec 24 (Jingle, all day in NH); Bunny Day on Easter Sunday, its celebrations the seven days before (Zipper on the first and the last day, eggs all week).
// Another event is one more rule here, and whatever it shows reads `eventAt`. The seasonal preview (`?event=<id>`, dev
// or ?demo, and せってい's きせつ: ui-state/preview.svelte.ts) shows one on, its main part included; what the island
// yields on it (Bunny Day's eggs in place of a find) follows the real day's, or the dev param only.
import { dayKey, jst, now } from '#lib/time/clock.ts';
import { daysBetween, easter, nthWeekday } from '#lib/time/dates.ts';
import { hook } from './devHooks.ts';

export type EventId = 'halloween' | 'turkey-day' | 'toy-day' | 'bunny-day' | 'bunny-week';

interface Rule {
  /** Whether a Tokyo date (YYYY-MM-DD) is its day. */
  on: (date: string) => boolean;
  /** The hour (Tokyo) its main part starts (the evening, the host's arrival); it runs to midnight. */
  night: number;
}

/** A fixed day every year, 'MM-DD'. */
const fixedDay = (md: string) => (date: string): boolean => date.slice(5) === md;

const yearOf = (date: string): number => Number(date.slice(0, 4));
/** Days from that year's Easter Sunday (negative: before). */
const fromEaster = (date: string): number => daysBetween(easter(yearOf(date)), date);

/** Turkey Day: the fourth Thursday of November. */
export const turkeyDay = (year: number): string => nthWeekday(year, 11, 4, 4);

// the order is the priority when two fall on one day (Bunny Day's Zipper days before its week)
const RULES: Record<EventId, Rule> = {
  halloween: { on: fixedDay('10-31'), night: 17 },
  'turkey-day': { on: (d) => d === turkeyDay(yearOf(d)), night: 9 },
  'toy-day': { on: fixedDay('12-24'), night: 5 },
  'bunny-day': { on: (d) => fromEaster(d) === 0 || fromEaster(d) === -7, night: 5 },
  'bunny-week': { on: (d) => fromEaster(d) > -7 && fromEaster(d) < 0, night: 24 }
};
const IDS = Object.keys(RULES) as EventId[];

export interface EventNow {
  id: EventId;
  /** Its main part (Halloween: Jack, the lit jack-o'-lanterns, the villagers' lines; a host's day: the host). */
  night: boolean;
}

/** The event on a Tokyo date (YYYY-MM-DD) at a Tokyo hour, or null. `force`: an event id to have on (the dev hook). */
export function eventAt(date: string, hour: number, force?: string | null): EventNow | null {
  if (force && IDS.includes(force as EventId)) return { id: force as EventId, night: RULES[force as EventId].night < 24 };
  const id = IDS.find((k) => RULES[k].on(date));
  return id ? { id, night: hour >= RULES[id].night } : null;
}

/** Bunny Day's celebrations (its week and its two Zipper days): eggs turn up. */
export const eggTime = (ev: EventNow | null): boolean => ev?.id === 'bunny-day' || ev?.id === 'bunny-week';

/** The event at a scene-clock moment for what the island yields (eggs): the real day's, or `?event=<id>`'s (the scene
 *  shows the preview's: eventAt with scenePreview().event). */
export const eventNow = (d: Date = now()): EventNow | null => eventAt(dayKey(d), jst(d).hour, hook('event'));
