// The phones' health of the app, sparsely and anonymously (docs/ops/runbook.md "Telemetry"): a JS error (its message
// and the top of its stack: at most three a session, each once) and once a session a sample of how it runs (the cold
// load's time to the island, the display's frames over a few seconds: p50 / p95 frame time and fps, the 3D island's
// own drawn rate), each a small record to the relay (`telemetry`: who sent it isn't kept, nor anything of theirs). Not
// in the demo or unpaired (no key), not under automation (the e2e). A failure to send is dropped silently.
import { post } from './transport.ts';
import { getKey } from './storage.ts';

type Data = Record<string, number | string | boolean>;
/** The build: this module's own hashed chunk's name (a new build, a new name). */
const version = import.meta.url.split('/').pop()?.split('?')[0] ?? '';
/** The 3D island's own drawn rate now (world3d/Island3D sets it while it's up). */
let drawn: (() => number) | null = null;
export const setDrawnFps = (fn: (() => number) | null): void => void (drawn = fn);

/** The device in a word: iOS's version (the phones), else the platform. */
function osOf(): string {
  const ua = navigator.userAgent, ios = ua.match(/OS (\d+)[_.](\d+)/);
  return /iPhone|iPad/.test(ua) && ios ? `iOS ${ios[1]}.${ios[2]}` : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : 'other';
}
const base = (): Data => ({
  build: version, os: osOf(), standalone: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
  w: innerWidth, h: innerHeight, dpr: devicePixelRatio
});
const send = (kind: 'session' | 'error', data: Data) => void post('telemetry', { kind, data: { ...base(), ...data } }, { timeoutMs: 8000 }).catch(() => {});

/** The display's frames over `ms` (rAF: the page's real cadence, the 3D island's draws inside it). */
function frames(ms: number): Promise<{ p50: number; p95: number; fps: number; longFrames: number }> {
  return new Promise((done) => {
    const t: number[] = [], end = performance.now() + ms;
    const f = (now: number) => {
      t.push(now);
      if (now < end) return void requestAnimationFrame(f);
      const g = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b), q = (p: number) => g[Math.min(g.length - 1, Math.floor(p * g.length))] ?? 0;
      done({ p50: q(0.5), p95: q(0.95), fps: (t.length - 1) / (ms / 1000), longFrames: g.filter((x) => x > 50).length });
    };
    requestAnimationFrame(f);
  });
}

/** Start: the error listener, and the session's sample once the island is up (`ready()` true) and has settled. */
export function startTelemetry(ready: () => boolean, demo: boolean): () => void {
  if (typeof window === 'undefined' || demo || navigator.webdriver || !getKey()) return () => {};
  const seen = new Set<string>();
  const onError = (msg: string, stack?: string, src?: string) => {
    if (seen.size >= 3 || seen.has(msg)) return;
    seen.add(msg);
    send('error', { msg, stack: (stack ?? '').split('\n').slice(0, 3).join('\n'), src: src ?? '' });
  };
  const err = (e: ErrorEvent) => onError(String(e.message), e.error instanceof Error ? e.error.stack : undefined, `${e.filename?.split('/').pop() ?? ''}:${e.lineno}`);
  const rej = (e: PromiseRejectionEvent) => onError(`rejection: ${e.reason instanceof Error ? e.reason.message : String(e.reason)}`, e.reason instanceof Error ? e.reason.stack : undefined);
  addEventListener('error', err);
  addEventListener('unhandledrejection', rej);
  let stop = false;
  // once a session: when the island is up, 10 s on (settled), visible, the frames over 5 s
  const loadStart = 0; // (the navigation's start: performance.now() counts from it)
  let loadMs = -1;
  const poll = setInterval(() => {
    if (stop || loadMs >= 0 || !ready()) return;
    loadMs = performance.now() - loadStart;
    clearInterval(poll);
    setTimeout(async () => {
      if (stop || document.hidden) return;
      const f = await frames(5000);
      if (stop || document.hidden) return;
      send('session', { loadMs, ...f, idleFps: f.fps, drawFps: drawn?.() ?? -1, mode: drawn ? '3d' : '2d' });
    }, 10_000);
  }, 500);
  return () => {
    stop = true;
    clearInterval(poll);
    removeEventListener('error', err);
    removeEventListener('unhandledrejection', rej);
  };
}
