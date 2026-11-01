// Event music (docs/design.md#event-music): on NH's event days its own track replaces the hourly one, by Tokyo date
// and hour like the hours (hourly.ts). Pure. The wasps' chase and sting (sound.svelte.ts waspMusic) and K.K.'s songs
// (kk.ts) cut in over whatever plays and hand back to it.
import { dayKey, jst } from '#lib/time/clock.ts';
import { nthWeekday } from '#lib/time/dates.ts';

/** The tracks under static/audio/manifest.json `events.<id>`. */
export type EventMusicId = 'halloween' | 'turkey-day' | 'happy-new-year' | 'new-year-0am' | 'new-year-2am' | 'new-years-day' | 'bee-chase' | 'bee-stung';
export const EVENT_MUSIC_IDS: readonly EventMusicId[] = ['halloween', 'turkey-day', 'happy-new-year', 'new-year-0am', 'new-year-2am', 'new-years-day', 'bee-chase', 'bee-stung'];

/** An event's track for the moment: `id` loops in place of the hour's; `intro` is a one-shot heard first when the
 *  event has only just begun (the midnight jingle). */
export interface EventMusic {
  id: EventMusicId;
  intro?: EventMusicId;
}

/** Within this long of midnight on Jan 1, Happy New Year! plays before the fireworks music (NH plays it as the
 *  countdown hits zero; opening the app later doesn't replay it). */
const INTRO_WINDOW_MIN = 2;

/** The event music at a Tokyo moment (NH, Nookipedia):
 *  - Halloween, Oct 31 17:00–24:00 (the trick-or-treat hours);
 *  - Turkey Day, the 4th Thursday of November 09:00–24:00 (the feast's hours);
 *  - New Year: at midnight Happy New Year!, then the fireworks music 00:00–02:00, its calmer version 02:00–05:00, and
 *    New Year's Day for NH's whole day (it runs 05:00 to 05:00): Jan 1 05:00 → Jan 2 05:00.
 *  Dec 31's countdown tracks (23:00–24:00) aren't in the files: the 23:00 hour plays. */
export function eventMusicAt(d: Date): EventMusic | null {
  const { year, month, day, hour, minute } = jst(d);
  if (month === 10 && day === 31 && hour >= 17) return { id: 'halloween' };
  if (dayKey(d) === nthWeekday(year, 11, 4, 4) && hour >= 9) return { id: 'turkey-day' };
  if (month === 1 && day === 1) {
    if (hour < 2) return hour === 0 && minute < INTRO_WINDOW_MIN ? { id: 'new-year-0am', intro: 'happy-new-year' } : { id: 'new-year-0am' };
    if (hour < 5) return { id: 'new-year-2am' };
    return { id: 'new-years-day' };
  }
  if (month === 1 && day === 2 && hour < 5) return { id: 'new-years-day' };
  return null;
}
