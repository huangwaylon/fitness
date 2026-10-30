// Scene clock: the device time, or `?date=YYYY-MM-DDTHH:mm` (Tokyo time; testing seasonal events, night naps).
// The preview lasts for this page load only (kept across in-app navigation, never persisted).
// Every wall-clock reading (sky, season, naps, the host's greeting, the phone clock) goes through jst(): the model's
// days and cutoffs are Tokyo's, so the island agrees with them on a phone set to another zone.
import { localDateAt, parseInstant, ZONE_OFFSET_MS } from './dates.ts';
import { prefersReducedMotion } from 'svelte/motion';
import { createSubscriber } from 'svelte/reactivity';

let offset: number | null = null;

function init(): number {
  if (offset !== null) return offset;
  offset = 0;
  if (typeof location === 'undefined') return offset;
  const q = new URLSearchParams(location.search).get('date');
  if (q) {
    try {
      offset = parseInstant(q) - Date.now();
    } catch {
      /* not a date: the device time */
    }
  }
  return offset;
}

export function now(): Date {
  return new Date(Date.now() + init());
}

/** One timer for every clock on screen: it fires as the scene clock's minute changes, while anything reads it. */
const minuteTick = createSubscriber((update) => {
  let id: ReturnType<typeof setTimeout>;
  const arm = () => {
    const d = now();
    id = setTimeout(() => {
      update();
      arm();
    }, 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20);
  };
  arm();
  return () => clearTimeout(id);
});

/** The scene clock, reactive: an effect or template that reads it re-runs at each new minute (HUD, しまフォン, the
 *  island's naps, the theme, the store's recompute). */
export function minuteNow(): Date {
  minuteTick();
  return now();
}

/** Shared, reactive `prefers-reduced-motion` (follows the setting when the user toggles it). */
export function reducedMotion(): boolean {
  return prefersReducedMotion.current;
}

/** Tokyo wall-clock fields of an instant (month 1–12, weekday 0 = Sunday). */
interface Jst {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}
export function jst(d: Date = now()): Jst {
  const t = new Date(d.getTime() + ZONE_OFFSET_MS);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate(), hour: t.getUTCHours(), minute: t.getUTCMinutes(), weekday: t.getUTCDay() };
}

/** Tokyo `YYYY-MM-DD` of the scene clock. */
export const dayKey = (d = now()): string => localDateAt(d.getTime());
