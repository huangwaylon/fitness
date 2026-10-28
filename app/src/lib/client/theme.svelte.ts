// Night palette 19:00–06:00 (device clock; the couple lives in Tokyo) or system dark mode.
// `?theme=night|day` and `?season=spring|summer|autumn|winter` override for testing.
// Also sets data-season (by month, Japan) and data-tod (dawn/day/dusk/night, sky only) on <html>;
// see lib/styles/tokens.css.
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export const theme = $state<{ night: boolean; season: Season; tod: TimeOfDay }>({
  night: false,
  season: 'spring',
  tod: 'day'
});

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
let seasonOverride: Season | null = null;

function seasonFor(d: Date): Season {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function todFor(d: Date, night: boolean): TimeOfDay {
  if (night) return 'night';
  const h = d.getHours();
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 16 && h < 19) return 'dusk';
  return 'day';
}

let override: 'night' | 'day' | null = null;

function compute(): boolean {
  if (override) return override === 'night';
  const h = new Date().getHours();
  const clockNight = h >= 19 || h < 6;
  const systemDark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  return clockNight || systemDark;
}

function apply() {
  const now = new Date();
  theme.night = compute();
  theme.season = seasonOverride ?? seasonFor(now);
  theme.tod = todFor(now, theme.night);
  const root = document.documentElement;
  root.dataset.theme = theme.night ? 'night' : 'day';
  root.dataset.season = theme.season;
  root.dataset.tod = theme.tod;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.night ? '#1F2A44' : '#FFF8E7');
}

/** Start the clock; returns a cleanup function. */
export function startTheme(): () => void {
  const p = new URLSearchParams(location.search).get('theme');
  if (p === 'night' || p === 'day') {
    override = p;
    sessionStorage.setItem('theme', p);
  } else {
    const s = sessionStorage.getItem('theme');
    override = s === 'night' || s === 'day' ? s : null;
  }
  const sp = new URLSearchParams(location.search).get('season') as Season | null;
  if (sp && SEASONS.includes(sp)) {
    seasonOverride = sp;
    sessionStorage.setItem('season', sp);
  } else {
    const ss = sessionStorage.getItem('season') as Season | null;
    seasonOverride = ss && SEASONS.includes(ss) ? ss : null;
  }
  apply();
  const id = setInterval(apply, 60_000);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', apply);
  return () => {
    clearInterval(id);
    mq.removeEventListener('change', apply);
  };
}
