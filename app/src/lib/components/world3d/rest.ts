// The island at rest, sampled once a page load for the log (`perf.rest`, docs/ops/observability.md): after REST_MS
// with no finger on it (its models in, the page in front, nothing over it), SAMPLE_MS of what it costs: the frames drawn,
// the shadow map's passes and the pacers' display frames asked for, a second, and at the end the scene's draw calls and
// triangles a frame (the last without a shadow redraw), its pixel ratio and where the camera is (its z). Two timers, no frames of its own (a rAF loop
// would be the wake-ups it counts). No three.js.
import { log } from '#lib/sync/log.ts';
import { wakes } from './pace.ts';

export const REST_MS = 60_000, SAMPLE_MS = 10_000;
/** Not up or in front when due (loading, hidden, under a sheet): looked at again this much later. */
const AGAIN_MS = 15_000;
let sampled = false;

export interface RestSource {
  stats(): { frames: number; shadows: number; input: number; sceneCalls: number; sceneTris: number; dpr: number; camZ: number };
  /** Up and in front: loaded, the page shown, the island not paused under a sheet. */
  ok(): boolean;
}

/** What it runs on (the page's; a test's own clock). */
export interface RestClock {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}
const PAGE: RestClock = { now: () => performance.now(), setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>) };

/** Watch for the rest (once a page load); the stop (the island going). */
export function watchRest(o: RestSource, clock: RestClock = PAGE): () => void {
  if (sampled) return () => {};
  let timer: unknown = 0;
  const at = (fn: () => void, ms: number) => void (timer = clock.setTimeout(fn, Math.max(0, ms)));
  const wait = () => at(start, o.stats().input + REST_MS - clock.now());
  const start = () => {
    const a = o.stats(), t0 = clock.now();
    if (t0 - a.input < REST_MS) return wait();
    if (!o.ok()) return at(start, AGAIN_MS);
    const w0 = wakes.n;
    at(() => {
      const b = o.stats(), s = (clock.now() - t0) / 1000;
      if (b.input !== a.input) return wait();
      if (!o.ok()) return at(start, AGAIN_MS);
      sampled = true;
      const per = (n: number) => Math.round((n / s) * 10) / 10;
      log('perf.rest', { fps: per(b.frames - a.frames), shadows: per(b.shadows - a.shadows), wakes: per(wakes.n - w0), calls: b.sceneCalls, tris: b.sceneTris, dpr: b.dpr, camZ: Math.round(b.camZ) });
    }, SAMPLE_MS);
  };
  wait();
  return () => clock.clearTimeout(timer);
}
