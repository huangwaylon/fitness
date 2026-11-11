// The island at rest, sampled once a page load for the log (`perf.rest`, docs/ops/observability.md): after REST_MS
// with no finger on it (its models in, the page in front, nothing over it), SAMPLE_MS of what it costs: the frames drawn,
// the shadow map's passes and the pacers' display frames asked for, a second, and at the end the scene's draw calls and
// triangles a frame (the last without a shadow redraw), its pixel ratio, where the camera is (its z) and the shadow
// map's size (the `?shadow=` A/B); the share of the frames drawn at the full rate and its top three reasons (what kept
// the island above REST_FPS: a villager's gesture, a critter's fade); the point lights and their mask (the phones' A/B:
// `?points=`, `?pointmask=1`). Two timers, no frames of its own (a rAF loop would be the wake-ups it counts). No
// three.js.
import { log } from '#lib/sync/log.ts';
import { LOG_FULL_WHY } from '#lib/contract/log.ts';
import { wakes } from './pace.ts';

/** (15 s, not a minute: a minute untouched almost never came on a phone in a hand, 2 samples in 6 days) */
export const REST_MS = 15_000, SAMPLE_MS = 10_000;
/** Not up or in front when due (loading, hidden, under a sheet): looked at again this much later. */
const AGAIN_MS = 15_000;
let sampled = false;

interface RestSource {
  stats(): { frames: number; shadows: number; input: number; sceneCalls: number; sceneTris: number; dpr: number; camZ: number; shadowSize: number; full: number; fullWhy: Readonly<Record<string, number>>; slots: number; pointMask: boolean };
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
      const drawn = Math.max(1, b.frames - a.frames), pct = (n: number) => Math.round((n / drawn) * 100);
      log('perf.rest', { fps: per(b.frames - a.frames), shadows: per(b.shadows - a.shadows), wakes: per(wakes.n - w0), calls: b.sceneCalls, tris: b.sceneTris, dpr: b.dpr, camZ: Math.round(b.camZ), sm: b.shadowSize, full: pct(b.full - a.full), ...top(a.fullWhy, b.fullWhy, pct), pts: b.slots, pm: b.pointMask });
    }, SAMPLE_MS);
  };
  wait();
  return () => clock.clearTimeout(timer);
}

const WHY: readonly string[] = LOG_FULL_WHY;
/** The three names that asked for the most full-rate frames between two counts (`why1`…, an unknown one `other`), and
 *  each's share (`w1`…). */
function top(a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>, pct: (n: number) => number): Record<string, string | number> {
  const n = new Map<string, number>();
  for (const [k, v] of Object.entries(b)) {
    const d = v - (a[k] ?? 0), name = WHY.includes(k) ? k : 'other';
    if (d > 0) n.set(name, (n.get(name) ?? 0) + d);
  }
  const out: Record<string, string | number> = {};
  [...n].sort((x, y) => y[1] - x[1]).slice(0, 3).forEach(([k, v], i) => ((out[`why${i + 1}`] = k), (out[`w${i + 1}`] = pct(v))));
  return out;
}
