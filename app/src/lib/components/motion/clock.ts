// Scene clock: the device time, or `?date=YYYY-MM-DDTHH:mm` (testing seasonal events, night naps).
// The preview lasts for this page load only (kept across in-app navigation, never persisted).
import { MediaQuery } from 'svelte/reactivity';

let offset: number | null = null;

function init(): number {
  if (offset !== null) return offset;
  offset = 0;
  if (typeof location === 'undefined') return offset;
  const q = new URLSearchParams(location.search).get('date');
  if (q) {
    const ms = Date.parse(q);
    if (!Number.isNaN(ms)) offset = ms - Date.now();
  }
  return offset;
}

export function now(): Date {
  return new Date(Date.now() + init());
}

/** True when the date was forced with `?date=`. */
export function forcedDate(): boolean {
  return init() !== 0;
}

/** Shared, reactive `prefers-reduced-motion` (follows the setting when the user toggles it). */
const rmq = new MediaQuery('(prefers-reduced-motion: reduce)', false);

export function reducedMotion(): boolean {
  return rmq.current;
}

/** Local `YYYY-MM-DD` of the scene clock. */
export function dayKey(d = now()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
