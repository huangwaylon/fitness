// The island's launch, timed (the log's `perf.boot`, once a page load): when its first frame
// was drawn, when the models were in (place() resolved), when the island first stood whole on screen (`shown`: a frame
// with nothing held back: no model loading, no program linking, no texture still to upload), the longest display frame
// meanwhile and the engine's longest frame, and how the launch was served (the service worker, the network). Real
// iPhones' numbers, not the Simulator's. No three.js here (Island3D and the engine feed it).
import { log } from '#lib/sync/log.ts';

/** After `shown`, the frames are watched this much longer (the follow-up frames: the shadows, the flourishes' warm-up). */
const SETTLE_MS = 1000;
/** A watch not over by then is let go, unreported (it asks for a frame each display frame while it runs). */
const WATCH_MAX_MS = 30_000;

export interface BootReport {
  /** ms since the navigation's start: the island's mount (after the ground's fields), its first frame, the models in,
   *  the island whole on screen. */
  mount: number;
  first: number;
  loaded: number;
  shown: number;
  /** The longest display frame (rAF interval, ms) from the first frame to SETTLE_MS after `shown`. */
  long: number;
  /** The engine's longest frame (its own work, the GL calls and their waits, ms) over the same span. */
  draw: number;
  /** The engine's longest frame from the models in to the island whole: the "island appears" frame. */
  appear: number;
  /** The frames from the models in to the island whole (1: all at once). */
  steps: number;
  /** The GPU programs at the watch's end. */
  progs: number;
  /** How long the mount waited for the ground's fields (ms), and where they came from. */
  fieldsMs: number;
  fields: 'cache' | 'worker' | 'main';
  /** The service worker at the launch: controlling the page, not (yet), or none in this browser. */
  sw: 'ctl' | 'none' | 'no';
  /** Every model came without the network (a cache: the service worker's, the browser's); `net`: how many did not. */
  warm: boolean;
  net: number;
}

/** The service worker as the page was launched. */
export function swState(nav: Navigator | undefined = globalThis.navigator): BootReport['sw'] {
  const sw = nav?.serviceWorker;
  return !sw ? 'no' : sw.controller ? 'ctl' : 'none';
}

/** The island's models fetched over the network (a transfer size: not from a cache), and how many were fetched. */
export function modelFetches(entries: readonly { name: string; transferSize?: number }[]): { n: number; net: number } {
  let n = 0, net = 0;
  for (const e of entries) {
    if (!/\/room\/world3d\/.*\.glb/.test(e.name)) continue;
    n++;
    if ((e.transferSize ?? 0) > 0) net++;
  }
  return { n, net };
}

type Clocked = Omit<BootReport, 'progs' | 'fieldsMs' | 'fields' | 'sw' | 'warm' | 'net'>;

/** The launch's clock: the engine's frames (`frame`), the page's display frames (`tick`), the marks. `done` once
 *  SETTLE_MS past `shown`; spoiled (never done) by the page hidden or the island paused meanwhile: its frames say
 *  nothing then. */
export function createBootClock(settleMs = SETTLE_MS) {
  const c: Clocked = { mount: 0, first: 0, loaded: 0, shown: 0, long: 0, draw: 0, appear: 0, steps: 0 };
  let lastTick = 0, done = false, spoiled = false;
  const r = (x: number) => Math.round(x);
  return {
    mount(t: number) {
      c.mount ||= r(t);
    },
    loaded(t: number) {
      c.loaded ||= r(t);
    },
    /** An engine frame drawn, `t0` → `t1`; `settled`: nothing held back in it. */
    frame(t0: number, t1: number, settled: boolean) {
      if (done || spoiled) return;
      c.first ||= r(t1);
      c.draw = Math.max(c.draw, r(t1 - t0));
      if (c.loaded && !c.shown && t0 >= c.loaded) {
        c.appear = Math.max(c.appear, r(t1 - t0));
        c.steps++;
        if (settled) c.shown = r(t1);
      }
    },
    /** A display frame (rAF), or the launch interrupted (`spoil`: the page hidden, the island paused). */
    tick(t: number, spoil = false) {
      if (done) return;
      if (spoil) spoiled = true;
      if (spoiled) return;
      if (lastTick && c.first) c.long = Math.max(c.long, r(t - lastTick));
      lastTick = t;
      if (c.shown && t - c.shown >= settleMs) done = true;
    },
    done: () => done,
    spoiled: () => spoiled,
    marks: (): Clocked => ({ ...c })
  };
}
export type BootClock = ReturnType<typeof createBootClock>;

/** A launch watched already (one a page load: back from a room, the island's mount is no launch), and a return. */
let launched = false, returned = false;
let report: BootReport | null = null;
/** The launch's report once its watch is over (the perf scripts read it: window.__world3d.boot), else null. */
export const bootReport = (): BootReport | null => report;

/**
 * The launch's watch, from the island's mount: its clock for the engine's frames and the marks, the display frames
 * counted here; at the end, the report logged (`perf.boot`) and kept. `extra()` at the end: the programs, the fields'
 * wait and source. Nothing logged when the page was hidden or the island paused meanwhile, or the watch ran past
 * WATCH_MAX_MS. A later mount (`back`: from a room, another screen) is watched the same way once a page load, its marks
 * from the mount (`perf.back`: the return's worst frame); null after that.
 */
export function watchBoot(extra: () => Pick<BootReport, 'progs' | 'fieldsMs' | 'fields'>, paused: () => boolean): { clock: BootClock; stop(): void; back: boolean } | null {
  if (returned || typeof requestAnimationFrame === 'undefined') return null;
  const back = launched;
  if (back) returned = true;
  launched = true;
  const clock = createBootClock(), sw = swState();
  let raf = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVis);
  };
  const onVis = () => {
    if (!document.hidden) return;
    clock.tick(performance.now(), true);
    stop();
  };
  const loop = (t: number) => {
    // (a sheet over the island before it stood whole: no engine frame comes, so no `shown`; the watch ends there, or
    // it would ask for a frame under the sheet each display frame, e2e/sheet-idle)
    clock.tick(t, paused());
    if (clock.spoiled() || t > WATCH_MAX_MS) return stop();
    if (!clock.done()) return void (raf = requestAnimationFrame(loop));
    stop();
    if (back) {
      const { mount, first, loaded, shown, long, draw, appear, steps } = clock.marks();
      log('perf.back', { first: first - mount, loaded: loaded - mount, shown: shown - mount, long, draw, appear, steps, progs: extra().progs });
      return;
    }
    const { n, net } = modelFetches(performance.getEntriesByType?.('resource') ?? []);
    report = { ...clock.marks(), ...extra(), sw, warm: n > 0 && net === 0, net };
    log('perf.boot', { ...report });
  };
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(loop);
  return { clock, stop, back };
}
