// Theme on <html>: data-tod (dawn | day | dusk | night, from the clock), data-theme (night iff tod is night),
// data-season and data-foliage. Time of day alone drives the chrome (v5 §5): the phone's dark mode is ignored.
// Rules: client/season.ts. `?theme=night|day`, `?season=…` and `?date=` (motion/clock.ts) preview for this load
// only; they are never persisted, so a later plain load is back to the real date and time.
import { now } from '#lib/components/motion/clock.ts';
import { deriveTheme, previewParams, themeColor, type Foliage, type Season, type ThemeInput, type TimeOfDay } from './season.ts';

export type { Foliage, Season, TimeOfDay };

export const theme = $state<{ night: boolean; season: Season; tod: TimeOfDay; foliage: Foliage }>({
  night: false,
  season: 'spring',
  tod: 'day',
  foliage: 'green'
});

let preview: ThemeInput = {};

function apply() {
  Object.assign(theme, deriveTheme(now(), preview));
  const root = document.documentElement;
  root.dataset.theme = theme.night ? 'night' : 'day';
  root.dataset.season = theme.season;
  root.dataset.foliage = theme.foliage;
  root.dataset.tod = theme.tod;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor(theme));
}

/** Start the clock; returns a cleanup function. */
export function startTheme(): () => void {
  preview = previewParams(location.search);
  // Older builds saved previews in sessionStorage; drop any leftovers.
  for (const k of ['theme', 'season', 'if-date']) sessionStorage.removeItem(k);
  apply();
  const id = setInterval(apply, 60_000);
  return () => clearInterval(id);
}
