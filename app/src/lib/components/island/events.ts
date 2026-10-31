// NH's dated events on the island (docs/design.md "Halloween"): a date rule per event, on the Tokyo calendar, with the
// hour its evening part starts. Pure. Only Halloween so far (NH: Oct 31, decorations all day, Jack 17:00–24:00); another
// event is one more rule here and whatever it shows reads `eventAt`. `?event=<id>` (dev or ?demo) forces one on, its
// evening part included.

export type EventId = 'halloween';

interface Rule {
  /** Its day, 'MM-DD' (Tokyo). */
  day: string;
  /** The hour (Tokyo) its evening part starts; it runs to midnight. */
  night: number;
}
const RULES: Record<EventId, Rule> = { halloween: { day: '10-31', night: 17 } };
const IDS = Object.keys(RULES) as EventId[];

export interface EventNow {
  id: EventId;
  /** Its evening part (Halloween: Jack, the lit jack-o'-lanterns, the villagers' lines). */
  night: boolean;
}

/** The event on a Tokyo date (YYYY-MM-DD) at a Tokyo hour, or null. `force`: an event id to have on (the dev hook). */
export function eventAt(date: string, hour: number, force?: string | null): EventNow | null {
  if (force && IDS.includes(force as EventId)) return { id: force as EventId, night: true };
  const id = IDS.find((k) => date.slice(5) === RULES[k].day);
  return id ? { id, night: hour >= RULES[id].night } : null;
}

/** The forced event of `?event=<id>` (dev or ?demo), or null. */
export function forcedEvent(): string | null {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search);
  return import.meta.env.DEV || q.has('demo') ? q.get('event') : null;
}
