// Scene clock: the device time, or `?date=YYYY-MM-DDTHH:mm` (testing seasonal events, night naps).
// The preview lasts for this page load only (kept across in-app navigation, never persisted).
import { prefersReducedMotion } from 'svelte/motion';
import { createSubscriber } from 'svelte/reactivity';

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

/** Local `YYYY-MM-DD` of the scene clock. */
export function dayKey(d = now()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
