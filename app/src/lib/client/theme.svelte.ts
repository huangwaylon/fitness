// Night palette 19:00–06:00 (device clock; the couple lives in Tokyo) or system dark mode.
// `?theme=night|day` overrides for testing.
export const theme = $state<{ night: boolean }>({ night: false });

let override: 'night' | 'day' | null = null;

function compute(): boolean {
  if (override) return override === 'night';
  const h = new Date().getHours();
  const clockNight = h >= 19 || h < 6;
  const systemDark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  return clockNight || systemDark;
}

function apply() {
  theme.night = compute();
  const root = document.documentElement;
  root.dataset.theme = theme.night ? 'night' : 'day';
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
  apply();
  const id = setInterval(apply, 60_000);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', apply);
  return () => {
    clearInterval(id);
    mq.removeEventListener('change', apply);
  };
}
