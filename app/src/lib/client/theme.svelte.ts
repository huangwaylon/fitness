// Theme on <html>: data-theme (chrome night: clock 19:00–06:00 or OS dark mode), data-season,
// data-foliage and data-tod (the scene sky, which always follows the clock). Rules: client/season.ts.
// `?theme=night|day`, `?season=…` and `?date=` (motion/clock.ts) preview for this load only; they are
// never persisted, so a later plain load is back to the real date and time.
import { now } from '#lib/components/motion/clock.ts';
import { deriveTheme, previewParams, type Foliage, type Season, type ThemeInput, type TimeOfDay } from './season.ts';

export type { Foliage, Season, TimeOfDay };

export const theme = $state<{ night: boolean; season: Season; tod: TimeOfDay; foliage: Foliage }>({
  night: false,
  season: 'spring',
  tod: 'day',
  foliage: 'green'
});

let preview: ThemeInput = {};

function apply() {
  const systemDark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  Object.assign(theme, deriveTheme(now(), { ...preview, systemDark }));
  const root = document.documentElement;
  root.dataset.theme = theme.night ? 'night' : 'day';
  root.dataset.season = theme.season;
  root.dataset.foliage = theme.foliage;
  root.dataset.tod = theme.tod;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.night ? '#1F2A44' : '#FFF8E7');
}

/** Start the clock; returns a cleanup function. */
export function startTheme(): () => void {
  preview = previewParams(location.search);
  // Older builds saved previews in sessionStorage; drop any leftovers.
  for (const k of ['theme', 'season', 'if-date']) sessionStorage.removeItem(k);
  apply();
  const id = setInterval(apply, 60_000);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', apply);
  return () => {
    clearInterval(id);
    mq.removeEventListener('change', apply);
  };
}
