// Event music (docs/design.md#event-music): on NH's event days its own track replaces the hourly one, by Tokyo date
// and time like the hours (hourly.ts). Pure, one table over the island's dated days (time/holidays.ts). The wasps'
// chase and sting (sound.svelte.ts waspMusic) and Franklin's cooking (eventJingle) cut in over whatever plays and hand
// back to it; K.K.'s songs, the stretch and the birthday song play on the island's shared stage (stage.svelte.ts).
import { dayKey, jst } from '#lib/time/clock.ts';
import { FIREWORKS_SHOW, HOLIDAYS, weddingDate } from '#lib/time/holidays.ts';
import type { Weather } from './hourly.ts';

/** The tracks under static/audio/manifest.json `events.<id>`. */
export const EVENT_MUSIC_IDS = [
  'halloween', 'turkey-day', 'happy-new-year', 'new-year-0am', 'new-year-2am', 'new-years-day', 'bee-chase', 'bee-stung',
  'bunny-day', 'toy-day', 'toy-day-snow', 'festivale', 'fireworks-show', 'wedding', 'wedding-party',
  'countdown-2300', 'countdown-2330', 'countdown-2350', 'countdown-2355',
  // cut-ins: the stretch's loop and the birthday song (the island's stage: `ev-<id>`), Franklin's one-shots
  'aerobics', 'turkey-cooking-start', 'turkey-cooking-done', 'happy-birthday'
] as const;
export type EventMusicId = (typeof EVENT_MUSIC_IDS)[number];
/** The tracks that cut in over the island's music (sound.svelte.ts eventJingle; the wasps' through waspMusic) rather
 *  than replace the hour's. */
export type CutInId = Extract<EventMusicId, 'bee-chase' | 'bee-stung' | 'aerobics' | 'turkey-cooking-start' | 'turkey-cooking-done' | 'happy-birthday'>;

/** An event's track for the moment: `id` loops in place of the hour's; `intro` is a one-shot heard first when the
 *  event has only just begun (the midnight jingle); `alt`: the track to play when `id` has no file (a weather's
 *  arrangement falls back to the plain one, the wedding's two to each other). */
interface EventMusic {
  id: EventMusicId;
  intro?: EventMusicId;
  alt?: EventMusicId;
}

/** Within this long of midnight on Jan 1, Happy New Year! plays before the fireworks music (NH plays it as the
 *  countdown hits zero; opening the app later doesn't replay it). */
const INTRO_WINDOW_MIN = 2;

const at = (h: number, m = 0): number => h * 60 + m;
const END = at(24);

interface Row {
  id: EventMusicId;
  /** Its Tokyo date. */
  on: (date: string, weekday: number) => boolean;
  /** Minutes of the Tokyo day it plays, [from, to). */
  from: number;
  to?: number;
  /** In snow, this arrangement (NH's Toy Day: the northern islands' snowy one). */
  snow?: EventMusicId;
  alt?: EventMusicId;
}

const holiday = (k: keyof typeof HOLIDAYS) => HOLIDAYS[k].on;
const md = (m: string) => (date: string): boolean => date.slice(5) === m;
const wedding = (date: string): boolean => date === weddingDate();

/** NH's event music (Nookipedia), the first row on the moment wins:
 *  - Halloween Oct 31 17:00–24:00; Turkey Day 09:00–24:00; Toy Day, Bunny Day, Festivale all day (NH's day, 05:00–24:00);
 *  - Dec 31: the countdown's four tracks, 23:00 / 23:30 / 23:50 / 23:55; at midnight Happy New Year! (the intro),
 *    then the fireworks 00:00–02:00, their calmer version 02:00–05:00, and New Year's Day 05:00 → Jan 2 05:00;
 *  - the Fireworks Show, August Sundays 19:00–24:00 (fireworks.ts's schedule);
 *  - our wedding day (wedding.ts): the wedding's music from 06:00 (Reese and Cyrus arrive), its party from 19:00 (the
 *    fireworks). June's Wedding Season arch has no music (NH plays it on Harv's island only). */
const TABLE: readonly Row[] = [
  { id: 'new-year-0am', on: md('01-01'), from: 0, to: at(2) },
  { id: 'new-year-2am', on: md('01-01'), from: at(2), to: at(5) },
  { id: 'new-years-day', on: md('01-01'), from: at(5) },
  { id: 'new-years-day', on: md('01-02'), from: 0, to: at(5) },
  { id: 'countdown-2300', on: holiday('countdown'), from: at(23), to: at(23, 30) },
  { id: 'countdown-2330', on: holiday('countdown'), from: at(23, 30), to: at(23, 50) },
  { id: 'countdown-2350', on: holiday('countdown'), from: at(23, 50), to: at(23, 55) },
  { id: 'countdown-2355', on: holiday('countdown'), from: at(23, 55) },
  { id: 'halloween', on: holiday('halloween'), from: at(HOLIDAYS.halloween.from) },
  { id: 'turkey-day', on: holiday('turkey-day'), from: at(HOLIDAYS['turkey-day'].from) },
  { id: 'toy-day', snow: 'toy-day-snow', on: holiday('toy-day'), from: at(HOLIDAYS['toy-day'].from) },
  { id: 'bunny-day', on: holiday('bunny-day'), from: at(HOLIDAYS['bunny-day'].from) },
  { id: 'festivale', on: holiday('festivale'), from: at(HOLIDAYS.festivale.from) },
  { id: 'wedding', alt: 'wedding-party', on: wedding, from: at(6), to: at(19) },
  { id: 'wedding-party', alt: 'wedding', on: wedding, from: at(19) },
  { id: 'fireworks-show', on: (d, wd) => Number(d.slice(5, 7)) === FIREWORKS_SHOW.month && wd === FIREWORKS_SHOW.weekday, from: at(FIREWORKS_SHOW.from) }
];

/** The minutes of the day where some row starts or ends (the music's boundaries besides the hours). The intro's
 *  window isn't one: a midnight jingle playing at 00:02 plays to its end. */
const EDGES = [...new Set(TABLE.flatMap((r) => [r.from, r.to ?? END]))].sort((a, b) => a - b);

/** The event music at a Tokyo moment, in `weather` (the island's: Toy Day's snowy arrangement), or null. */
export function eventMusicAt(d: Date, weather: Weather = 'sunny'): EventMusic | null {
  const { hour, minute, weekday } = jst(d);
  const date = dayKey(d), m = at(hour, minute);
  const row = TABLE.find((r) => m >= r.from && m < (r.to ?? END) && r.on(date, weekday));
  if (!row) return null;
  const out: EventMusic = { id: row.id };
  if (row.snow && weather === 'snow') Object.assign(out, { id: row.snow, alt: row.id });
  else if (row.alt) out.alt = row.alt;
  if (row.id === 'new-year-0am' && m < INTRO_WINDOW_MIN) out.intro = 'happy-new-year';
  return out;
}

/** Ms until the next minute the event music may change that isn't on the hour (the countdown's 23:30, 23:50, 23:55),
 *  or null when the hour comes first. One timer per boundary, never a poll. */
export function msToNextEdge(d: Date): number | null {
  const { hour, minute } = jst(d);
  const m = at(hour, minute);
  const next = EDGES.find((e) => e > m && e % 60 !== 0 && e < at(hour + 1));
  if (next === undefined) return null;
  const msIntoMinute = ((d.getTime() % 60_000) + 60_000) % 60_000;
  return (next - m) * 60_000 - msIntoMinute;
}
