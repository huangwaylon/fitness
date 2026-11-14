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
  /** Those steps by what held each back (programs linking, models loading, cards loading: the first of these): how
   *  many, and the wall ms from each to the next step; the steps' own frame ms, all told. */
  sLink: number;
  msLink: number;
  sModels: number;
  msModels: number;
  sCards: number;
  msCards: number;
  stepMs: number;
  /** The GPU programs at the watch's end. */
  progs: number;
  /** How long the mount waited for the ground's fields (ms), and where they came from. */
  fieldsMs: number;
  fields: 'cache' | 'worker' | 'main';
  /** The service worker at the launch: controlling the page, not (yet), or none in this browser. */
  sw: 'ctl' | 'none' | 'no';
  /** No model's resource timing has a transfer size; `net`: how many have one. Only what went past the worker: one
   *  it answers reads 0 even when it fetched it (swNet below). */
  warm: boolean;
  net: number;
  /** The models that came in after `loaded` up to `shown`, and the last of them (its name: what the island waited
   *  for). */
  late?: number;
  lastM?: string;
  /** That last one's fetch end (its file's resource timing: none for a room piece's) and its arrival in the scene (ms
   *  since the navigation's start): a gap is the parse, the textures, the queue, not the network. */
  lateF?: number;
  lateA?: number;
  /** The KTX2 textures transcoded by the report (ktx2.ts ktx2Stats.made: not read back from the texture cache). */
  tx?: number;
  /** ms since the navigation's start when the record's model was first composed (week.svelte.ts dataAt; 0: not by
   *  the report): the farm's plots, the finds and the garden's crops are placed only from it. */
  data?: number;
  /** The launch's first placing: the garden's models known (`late`: placed only by a later pass, its models after
   *  `loaded`; `none`: the island has none), the record's fields in (`late`: their plants a later pass's). */
  garden?: 'first' | 'late' | 'none';
  farm?: 'first' | 'late';
  /** Where the launch's page came from (service-worker/caches.ts ShellFrom: `net` a newer build's page from the
   *  network within the worker's race, `same` the cache confirmed by it, `skip` the cache with no race, `cache` the
   *  cache, the network late or offline), and the race's ms from the navigation's fetch event (caches.ts Raced); none:
   *  not the worker's (a first visit, no worker). */
  shell?: 'net' | 'same' | 'skip' | 'cache';
  raceMs?: number;
  /** ms from the worker's fetch event to the page's clock start (its Server-Timing `t0`; on WebKit the clock starts
   *  once the worker answers, so its race and lookups are before every mark here; negative: inside the page's clock,
   *  as on Chromium); the worker started for this navigation (`swCold`: its own start is before even that). */
  pre?: number;
  swCold?: boolean;
  /** The worker's own network fetches from its fetch event to the report, of them room files, and their KB
   *  (service-worker/caches.ts netLog: the page's transfer sizes read 0 for everything the worker answers, `net` above
   *  only counts what went past it). */
  swNet?: number;
  swRoom?: number;
  swKB?: number;
}

/** A file's fetch end (ms since the navigation's start: its first resource timing), or undefined. */
const fetchEnd = (url: string): number | undefined => (globalThis.performance?.getEntriesByName?.(url, 'resource')[0] as PerformanceResourceTiming | undefined)?.responseEnd || undefined;

/** Of the models in (things.ts arrivals: name, time, file), those after `loaded` up to `shown`, and the last's name (at
 *  most 40 characters, the log's token), its arrival and its file's fetch end. */
export function lateModels(ins: readonly (readonly [string, number, string?])[], loaded: number, shown: number, end = fetchEnd): Pick<BootReport, 'late' | 'lastM' | 'lateF' | 'lateA'> {
  let late = 0, last: (typeof ins)[number] | undefined;
  for (const m of ins) if (m[1] > loaded && m[1] <= shown) (late++, (last = m));
  if (!last) return { late };
  const f = last[2] ? end(last[2]) : undefined;
  return { late, lastM: last[0].slice(0, 40), lateA: Math.round(last[1]), ...(f ? { lateF: Math.round(f) } : {}) };
}

const SHELLS = ['net', 'same', 'skip', 'cache'] as const;
/** Where the launch's page came from and the race's ms, and the page's clock start (`origin`: ms since the epoch) less
 *  the worker's fetch event (the worker's Server-Timing `shell` and `t0`: service-worker/caches.ts marked); {} when the
 *  worker didn't say. */
export function shellFrom(nav: readonly PerformanceEntry[] = globalThis.performance?.getEntriesByType?.('navigation') ?? [], origin = globalThis.performance?.timeOrigin ?? 0): Pick<BootReport, 'shell' | 'raceMs' | 'pre' | 'swCold'> {
  const st = (nav[0] as PerformanceNavigationTiming | undefined)?.serverTiming;
  const t = st?.find((x) => x.name === 'shell'), t0 = st?.find((x) => x.name === 't0');
  const d = SHELLS.find((s) => s === t?.description);
  if (!d) return {};
  return { shell: d, raceMs: Math.round(t?.duration ?? 0), ...(t0?.duration ? { pre: Math.round(origin - t0.duration), swCold: t0.description === '1' } : {}) };
}

/** The worker's network fetches since `since` (ms since the epoch), asked of it (service-worker/index.ts `net`); {}
 *  with no worker or no answer within a second (an older worker's). */
export function swFetches(since: number, sw: ServiceWorker | null | undefined = globalThis.navigator?.serviceWorker?.controller): Promise<Pick<BootReport, 'swNet' | 'swRoom' | 'swKB'>> {
  if (!sw) return Promise.resolve({});
  return new Promise((done) => {
    const ch = new MessageChannel(), timer = setTimeout(() => (ch.port1.close(), done({})), 1000);
    ch.port1.onmessage = (e: MessageEvent) => (clearTimeout(timer), ch.port1.close(), done(e.data ?? {}));
    sw.postMessage({ k: 'net', since }, [ch.port2]);
  });
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

type Clocked = Omit<BootReport, 'progs' | 'fieldsMs' | 'fields' | 'sw' | 'warm' | 'net' | 'late' | 'lastM' | 'data' | 'garden' | 'farm'>;

/** The launch's clock: the engine's frames (`frame`), the page's display frames (`tick`), the marks. `done` once
 *  SETTLE_MS past `shown`; spoiled (never done) by the page hidden or the island paused meanwhile: its frames say
 *  nothing then. */
/** What held a frame back from the island whole (engine.ts onDrawn), or null: nothing. */
export type BootWait = 'link' | 'models' | 'cards' | null;
const WAIT = { link: ['sLink', 'msLink'], models: ['sModels', 'msModels'], cards: ['sCards', 'msCards'] } as const;

export function createBootClock(settleMs = SETTLE_MS) {
  const c: Clocked = { mount: 0, first: 0, loaded: 0, shown: 0, long: 0, draw: 0, appear: 0, steps: 0, sLink: 0, msLink: 0, sModels: 0, msModels: 0, sCards: 0, msCards: 0, stepMs: 0 };
  let lastTick = 0, done = false, spoiled = false;
  /** The last step's start and what held it. */
  let prevAt = 0, prev: BootWait = null;
  const r = (x: number) => Math.round(x);
  return {
    mount(t: number) {
      c.mount ||= r(t);
    },
    loaded(t: number) {
      c.loaded ||= r(t);
    },
    /** An engine frame drawn, `t0` → `t1`; `wait`: what held some of it back (null: nothing, the island whole). */
    frame(t0: number, t1: number, wait: BootWait) {
      if (done || spoiled) return;
      c.first ||= r(t1);
      c.draw = Math.max(c.draw, r(t1 - t0));
      if (c.loaded && !c.shown && t0 >= c.loaded) {
        c.appear = Math.max(c.appear, r(t1 - t0));
        c.steps++;
        c.stepMs = r(c.stepMs + t1 - t0);
        if (prev) c[WAIT[prev][1]] += r(t0 - prevAt);
        if (wait) c[WAIT[wait][0]]++;
        [prev, prevAt] = [wait, t0];
        if (!wait) c.shown = r(t1);
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
export function watchBoot(extra: (m: Clocked) => Pick<BootReport, 'progs' | 'fieldsMs' | 'fields' | 'late' | 'lastM' | 'lateF' | 'lateA' | 'tx' | 'data' | 'garden' | 'farm'>, paused: () => boolean): { clock: BootClock; stop(): void; back: boolean } | null {
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
      const { mount, first, loaded, shown, long, appear, steps } = clock.marks();
      log('perf.back', { first: first - mount, loaded: loaded - mount, shown: shown - mount, long, appear, steps, progs: extra(clock.marks()).progs });
      return;
    }
    const { n, net } = modelFetches(performance.getEntriesByType?.('resource') ?? []);
    const shell = shellFrom(), base = { ...clock.marks(), ...extra(clock.marks()), sw, warm: n > 0 && net === 0, net, ...shell };
    // (since the worker's fetch event: on WebKit before the page's clock)
    void swFetches(performance.timeOrigin - Math.max(0, shell.pre ?? 0)).then((swn) => {
      report = { ...base, ...swn };
      log('perf.boot', { ...report });
    });
  };
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(loop);
  return { clock, stop, back };
}
