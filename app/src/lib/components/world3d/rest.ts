// The island at rest for the log (`perf.rest`, docs/ops/observability.md), counted all the time: every second the
// island was up, in front and untouched for REST_MS already (the engine's own rest: its 12 fps), its frames drawn, the
// shadow map's passes, the pacers' display frames asked for and the frames drawn at the full rate (and what asked for
// them) are added up; at each hide (and as the island goes) with MIN_S or more of it, one event: the seconds, their
// rates a second, the full rate's share and top three reasons, and the scene as it stands (draw calls and triangles a
// frame, the pixel ratio, the camera's z, the shadow map's size, the point lights and their mask). It used to wait for
// 15 s untouched and sample 10 s once a load: the phones never rest that long (time since the last touch at a hide:
// p90 15 s, max 19.8 s), so it fired twice in a week. A 1 s timer, no frames of its own (a rAF loop would be the
// wake-ups it counts), none while hidden. No three.js.
import { log } from '#lib/sync/log.ts';
import { LOG_FULL_WHY } from '#lib/contract/log.ts';
import { wakes } from './pace.ts';

/** The engine's rest (engine.ts REST_MS: no finger for this long, its ambience at 12 fps). */
export const REST_MS = 2000;
/** A second at a time; a hide with less than MIN_S of rest logs nothing. */
const TICK_MS = 1000, MIN_S = 3;

interface Stats {
  frames: number;
  shadows: number;
  input: number;
  sceneCalls: number;
  sceneTris: number;
  dpr: number;
  camZ: number;
  shadowSize: number;
  full: number;
  fullWhy: Readonly<Record<string, number>>;
  fxWhy: Readonly<Record<string, number>>;
  slots: number;
  pointMask: boolean;
}
interface RestSource {
  stats(): Stats;
  /** Up and in front: loaded, the page shown, the island not paused under a sheet. */
  ok(): boolean;
}

/** What it runs on (the page's; a test's own clock and hides). */
export interface RestClock {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
  /** `fn(hidden)` at each hide and show, before the log's own hide sends its batch; the stop. */
  onHide(fn: (hidden: boolean) => void): () => void;
}
const PAGE: RestClock = {
  now: () => performance.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  onHide(fn) {
    // (on the window, capturing: ahead of sync/log.ts's own, which sends the batch as the page hides)
    const vis = () => fn(document.hidden), gone = () => fn(true);
    addEventListener('visibilitychange', vis, true);
    addEventListener('pagehide', gone, true);
    return () => (removeEventListener('visibilitychange', vis, true), removeEventListener('pagehide', gone, true));
  }
};

/** Count the island's rest from now; the stop (the island going: what's counted is logged). */
export function watchRest(o: RestSource, clock: RestClock = PAGE): () => void {
  let timer: unknown = 0, prev: (Stats & { t: number; w: number }) | null = null;
  let ms = 0, frames = 0, shadows = 0, wk = 0, full = 0, why: Record<string, number> = {}, fx: Record<string, number> = {};
  const tick = () => {
    const s = o.stats(), t = clock.now(), w = wakes.n;
    // the second just gone was at rest: untouched since REST_MS before it began, and up and in front throughout
    if (prev && o.ok() && s.input === prev.input && prev.t - s.input >= REST_MS) {
      ms += t - prev.t;
      frames += s.frames - prev.frames;
      shadows += s.shadows - prev.shadows;
      wk += w - prev.w;
      full += s.full - prev.full;
      add(why, s.fullWhy, prev.fullWhy);
      add(fx, s.fxWhy, prev.fxWhy);
    }
    prev = o.ok() ? { ...s, fullWhy: { ...s.fullWhy }, fxWhy: { ...s.fxWhy }, t, w } : null;
    timer = clock.setTimeout(tick, TICK_MS);
  };
  const flush = () => {
    const s = ms / 1000;
    if (s >= MIN_S) {
      const st = o.stats(), per = (n: number) => Math.round((n / s) * 10) / 10;
      const pct = (n: number) => Math.round((n / Math.max(1, frames)) * 100);
      log('perf.rest', { s: Math.round(s), fps: per(frames), shadows: per(shadows), wakes: per(wk), calls: st.sceneCalls, tris: st.sceneTris, dpr: st.dpr, camZ: Math.round(st.camZ), sm: st.shadowSize, full: pct(full), ...top(why, pct), ...topFx(fx, pct), pts: st.slots, pm: st.pointMask });
    }
    ms = frames = shadows = wk = full = 0;
    why = {};
    fx = {};
  };
  const pause = () => {
    clock.clearTimeout(timer);
    prev = null;
  };
  const offHide = clock.onHide((hidden) => {
    pause();
    if (hidden) flush();
    else tick();
  });
  tick();
  return () => {
    offHide();
    pause();
    flush();
  };
}

/** A count's growth over the second into its sum. */
const add = (sum: Record<string, number>, now: Readonly<Record<string, number>>, was: Readonly<Record<string, number>>) => {
  for (const [k, v] of Object.entries(now)) if (v > (was[k] ?? 0)) sum[k] = (sum[k] ?? 0) + v - (was[k] ?? 0);
};

/** The flourish's kind that asked for the most of `fx`'s full-rate frames (`fx1`) and its share of the frames (`fw1`). */
function topFx(counts: Readonly<Record<string, number>>, pct: (n: number) => number): Record<string, string | number> {
  const [k, v] = Object.entries(counts).sort((x, y) => y[1] - x[1])[0] ?? [];
  return k ? { fx1: k, fw1: pct(v) } : {};
}

const WHY: readonly string[] = LOG_FULL_WHY;
/** The three names that asked for the most full-rate frames (`why1`…, an unknown one `other`), and each's share
 *  (`w1`…). */
function top(counts: Readonly<Record<string, number>>, pct: (n: number) => number): Record<string, string | number> {
  const n = new Map<string, number>();
  for (const [k, d] of Object.entries(counts)) {
    const name = WHY.includes(k) ? k : 'other';
    n.set(name, (n.get(name) ?? 0) + d);
  }
  const out: Record<string, string | number> = {};
  [...n].sort((x, y) => y[1] - x[1]).slice(0, 3).forEach(([k, v], i) => ((out[`why${i + 1}`] = k), (out[`w${i + 1}`] = pct(v))));
  return out;
}
