// Theme on <html>: data-tod (dawn | day | dusk | night, from the clock), data-theme (night iff tod is night),
// data-season and data-foliage. Time of day alone drives the chrome: the phone's dark mode is ignored.
// Rules: ui-state/season.ts. The seasonal preview (ui-state/preview.svelte.ts: せってい's きせつ, `?season=`, `?theme=`)
// shows another season or time of day; `?date=` (time/clock.ts) moves the clock itself.
import { untrack } from 'svelte';
import { minuteNow } from '#lib/time/clock.ts';
import { deriveTheme, themeColor, type Season, type ThemeInput, type ThemeState } from './season.ts';
import { scenePreview } from './preview.svelte.ts';

export type { Season };

export const theme = $state<ThemeState>({
  night: false,
  season: 'spring',
  tod: 'day',
  foliage: 'green'
});

function apply(at: Date, preview: ThemeInput) {
  Object.assign(theme, deriveTheme(at, preview));
  const root = document.documentElement;
  root.dataset.theme = theme.night ? 'night' : 'day';
  root.dataset.season = theme.season;
  root.dataset.foliage = theme.foliage;
  root.dataset.tod = theme.tod;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor(theme));
}

/** Follow the clock (at each new minute) and the preview; returns a cleanup function. */
export function startTheme(): () => void {
  apply(minuteNow(), scenePreview()); // before the first paint
  return $effect.root(() => {
    $effect(() => {
      const at = minuteNow(), preview = scenePreview();
      untrack(() => apply(at, preview));
    });
  });
}
