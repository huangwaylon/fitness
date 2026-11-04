// The island's seasonal preview (docs/design.md "Seasonal preview"): what the scene shows instead of the real day, from
// one place. Two inputs, one resolution: the dev params (`?event=`, `?fireworks`, `?shower`, `?weather=` with the
// hooks on; `?season=`, `?theme=` everywhere; this load only) and せってい's きせつ (this phone only, for the Tokyo day it
// was set on). A dev param wins over the setting, the setting over what its event implies (Halloween: an autumn
// night). Only the look follows it: the scene clock (`?date=` moves it), the day's keys and whatever the island yields
// (critters, finds, eggs, ベル) stay the real day's. Pure.
import { foliageFor, seasonFor, SEASONS, type Foliage, type Season, type TimeOfDay } from './season.ts';

/** The events the preview can bring on: NH's dated ones (island/events.ts EventId), ours and the sky's. */
export const PREVIEW_EVENTS = ['festivale', 'birthday-B', 'bunny-day', 'cherry', 'fireworks', 'birthday-A', 'wedding', 'halloween', 'maple', 'turkey-day', 'toy-day', 'shower'] as const;
type PreviewEvent = (typeof PREVIEW_EVENTS)[number];
/** The setting's weathers (the dev param has island/weather.ts FORCED's whole list). */
export const PREVIEW_WEATHER = ['clear', 'rain', 'snow'] as const;
export const TODS: readonly TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

export interface Choice {
  event: PreviewEvent | null;
  season: Season | null;
  /** A sky (island/weather.ts Forced); the setting's are PREVIEW_WEATHER. */
  weather: string | null;
  tod: TimeOfDay | null;
}
/** The setting as kept on this phone: the Tokyo day it was set on (it lapses after it). */
export interface Saved extends Choice {
  day: string;
}
/** The scene's preview: null fields are the real day's. */
export interface Scene extends Choice {
  foliage: Foliage | null;
  /** The month the scene's hedges and bushes are (null: the clock's). */
  month: number | null;
  /** The setting is in effect (the indicator and せってい's もどす). */
  on: boolean;
}

/** The look of each event's day (MM-DD: its season, foliage and hedges) and its hour (night: the evening's events). */
const EVENT_DAY: Record<PreviewEvent, { md?: string; tod?: TimeOfDay; weather?: string }> = {
  festivale: { md: '02-15' },
  'birthday-B': { md: '03-04' },
  'bunny-day': { md: '04-04' },
  cherry: { md: '04-05' },
  fireworks: { md: '08-09', tod: 'night', weather: 'clear' },
  'birthday-A': { md: '10-06' },
  wedding: { md: '10-08', tod: 'night' },
  halloween: { md: '10-31', tod: 'night' },
  maple: { md: '11-20' },
  'turkey-day': { md: '11-26' },
  'toy-day': { md: '12-24' },
  shower: { tod: 'night', weather: 'clear' }
};
/** A picked season shows its signature look (spring's blossom, autumn's leaves) and a month of it. */
const SEASON_LOOK: Record<Season, { foliage: Foliage; month: number }> = {
  spring: { foliage: 'blossom', month: 4 },
  summer: { foliage: 'green', month: 7 },
  autumn: { foliage: 'fall', month: 11 },
  winter: { foliage: 'snow', month: 1 }
};

const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | null => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : null);

/** The scene's preview: `dev` (the URL's) over `saved` (when it is today's) over the event's own day. */
export function resolvePreview(dev: Partial<Choice>, saved: Saved | null, today: string): Scene {
  const set = saved?.day === today ? saved : null;
  const pick = <K extends keyof Choice>(k: K): Choice[K] | null => dev[k] ?? set?.[k] ?? null;
  const event = pick('event');
  const day = event ? EVENT_DAY[event] : null;
  const season = pick('season');
  // the look: a picked season's signature, else the event's day's (a Date at Tokyo noon that MM-DD), else the real one
  const at = day?.md ? new Date(`2026-${day.md}T03:00:00Z`) : null;
  const look = season ? { season, ...SEASON_LOOK[season] } : at ? { season: seasonFor(at), foliage: foliageFor(at), month: at.getUTCMonth() + 1 } : null;
  return {
    event,
    season: look?.season ?? null,
    foliage: look?.foliage ?? null,
    month: look?.month ?? null,
    tod: pick('tod') ?? day?.tod ?? null,
    weather: pick('weather') ?? day?.weather ?? null,
    on: !!set && (set.event ?? set.season ?? set.weather ?? set.tod) !== null
  };
}

/** The setting as read back from storage (anything else: none). */
export function savedFrom(raw: unknown): Saved | null {
  const o = raw as Partial<Record<keyof Saved, unknown>> | null;
  if (!o || typeof o !== 'object' || typeof o.day !== 'string') return null;
  return { day: o.day, event: oneOf(o.event, PREVIEW_EVENTS), season: oneOf(o.season, SEASONS), weather: oneOf(o.weather, PREVIEW_WEATHER), tod: oneOf(o.tod, TODS) };
}

/** Whether the dev hooks apply (island/devHooks.ts): a dev build, or `?demo`. */
export const hooksOn = (q: URLSearchParams): boolean => import.meta.env.DEV || q.has('demo');

/** The dev params' part (the hooks on, for all but `?season=` and `?theme=`). */
export function devChoice(search: string): Partial<Choice> {
  const q = new URLSearchParams(search), hooks = hooksOn(q);
  const event = hooks ? (oneOf(q.get('event'), PREVIEW_EVENTS) ?? (q.has('fireworks') ? 'fireworks' : q.has('shower') ? 'shower' : null)) : null;
  return { event, season: oneOf(q.get('season'), SEASONS), tod: oneOf(q.get('theme'), TODS), weather: hooks ? q.get('weather') : null };
}
