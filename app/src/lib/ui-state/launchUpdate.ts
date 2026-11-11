// A cold open into a waiting deploy. The service worker serves its own build's cached shell at once, so a launch
// after a deploy booted the old build whole, and then the new one: Kit noticed the deploy only as the app came back
// to the front (the layout's reload, seconds in), or the player swiped the app away to relaunch it. Two boots of the
// island each time (~1.8 s of a phone's CPU and GPU, its programs and models twice). So a launch the worker served
// asks for _app/version.json at once (Kit's updated.check(), which the layout's reload follows too), and the island
// waits for the answer, ASK_MS at most from the ask; when it names a newer build, for the new worker, HOLD_MS at
// most: in by then, the page reloads into it before any of the island is built. Not (offline, a slow install, a slow
// answer), the island boots the build it has, and the layout reloads once the worker is in, as before.
import { newWorker, safeReload } from './reload.ts';

/** The island waits for version.json's answer this long at most from the ask (ms). */
export const ASK_MS = 600;
/** And for a newer build's worker this long at most (ms). */
export const HOLD_MS = 3000;

interface Deps {
  /** Kit's updated.check(): true once a newer build is deployed; false offline, on an error, or the same build. */
  check: () => Promise<boolean>;
  worker?: () => Promise<boolean>;
  reload?: () => boolean;
  now?: () => number;
}

/** The launch's ask (null: none, the page not the worker's), its start and when it was answered. */
let launch: { p: Promise<void>; at: number; answered: number } | null = null;
/** True while the launch holds for a newer build (the layout's own reload waits: the launch's reloads). */
let holding = false;
export const launchHolding = (): boolean => holding;

const after = (ms: number) => new Promise<false>((ok) => setTimeout(ok, ms, false));

/** Starts the launch's ask (+layout.ts: a launch on the island the service worker served, online). Once. */
export function askAtLaunch({ check, worker = newWorker, reload = () => safeReload(Date.now(), 'launch'), now = () => performance.now() }: Deps): void {
  if (launch) return;
  const l = (launch = { p: Promise.resolve(), at: now(), answered: 0 });
  const asked = check().then((newer) => ((l.answered = now()), newer), () => ((l.answered = now()), false));
  l.p = (async () => {
    if (!(await Promise.race([asked, after(ASK_MS)]))) return;
    holding = true;
    try {
      if ((await Promise.race([worker(), after(HOLD_MS)])) && reload()) await new Promise<never>(() => {});
    } finally {
      holding = false;
    }
  })();
}

/** What the island's mount waits for besides its fields: the launch's ask held (resolves at once with none). Never
 *  resolves when the page is reloading into a newer build. */
export const launchHold = (): Promise<void> => launch?.p ?? Promise.resolve();

/** The ask's answer, ms after its start (perf.boot `ask`), or undefined: not asked, or not answered yet. */
export const askMs = (): number | undefined => (launch?.answered ? Math.round(launch.answered - launch.at) : undefined);

/** Tests: forget the launch. */
export function resetLaunch(): void {
  launch = null;
  holding = false;
}
