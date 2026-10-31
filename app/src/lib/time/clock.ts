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

type Doc = Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'>;

/**
 * The timer behind `minuteNow`: `update` as the scene clock's minute changes, but not while the page is hidden (a
 * background tab still fires timers, and nothing is on screen to change): a missed minute updates once on return.
 * Returns the cleanup.
 */
export function minuteTimer(update: () => void, doc: Doc | undefined = globalThis.document): () => void {
  let id: ReturnType<typeof setTimeout>;
  let missed = false;
  const arm = () => {
    const d = now();
    id = setTimeout(() => {
      if (doc?.hidden) missed = true;
      else update();
      arm();
    }, 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20);
  };
  const onVisible = () => {
    if (doc?.hidden || !missed) return;
    missed = false;
    update();
  };
  doc?.addEventListener('visibilitychange', onVisible);
  arm();
  return () => {
    clearTimeout(id);
    doc?.removeEventListener('visibilitychange', onVisible);
  };
}

/** One timer for every clock on screen, while anything reads it. */
const minuteTick = createSubscriber((update) => minuteTimer(update));

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
