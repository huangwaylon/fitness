// A room's entry timed (the log's `perf.room`, once a visit: the tent, a home, the shop, the museum), from its screen's
// mount: its first frame (the engine's `ready`: it holds for the villagers' models), its models all in, its longest
// display frame till a second after the first. Measure only (review 11-20 P5: the tent ~0.55 s every visit in WebKit,
// unmeasured on the phones): nothing is logged for a visit left, hidden or failed before it's over. Not `nav` (the
// route's chunk and the door's close before the mount): keeping the navigation's start costs the first load bytes.
import { log } from '#lib/sync/log.ts';

type Room = 'tent' | 'home' | 'shop' | 'museum';
/** The frames watched this long after the first (ms), and the models waited for at most this long after the mount. */
const SETTLE_MS = 1000, MODELS_MAX_MS = 10_000, POLL_MS = 250;
/** The visits this page load, by room. */
const visits: Partial<Record<Room, number>> = {};

export function roomTiming(room: Room): { engine(e: { ready: Promise<void> }, loading: () => number): void; stop(): void } {
  const t0 = performance.now(), n = (visits[room] = (visits[room] ?? 0) + 1);
  let first = 0, models = -1, long = 0, prev = 0, raf = 0, poll: ReturnType<typeof setInterval> | undefined, over = false, settled = false;
  let loadingNow = () => 1;
  const stop = () => {
    over = true;
    cancelAnimationFrame(raf);
    clearInterval(poll);
    document.removeEventListener('visibilitychange', hide);
  };
  const hide = () => void (document.hidden && stop());
  const done = () => {
    if (over || !settled || (models < 0 && performance.now() - t0 < MODELS_MAX_MS)) return;
    stop();
    log('perf.room', { room, first: Math.round(first), models: models < 0 ? -1 : Math.round(models), long: Math.round(long), n });
  };
  // (the display frames from the first drawn: before it, the door's black and the room's build)
  const frame = (t: number) => {
    if (over) return;
    if (prev) long = Math.max(long, t - prev);
    prev = t;
    if (models < 0 && !loadingNow()) models = t - t0;
    if (t - t0 - first < SETTLE_MS) return void (raf = requestAnimationFrame(frame));
    settled = true;
    done();
  };
  document.addEventListener('visibilitychange', hide);
  return {
    engine(e, loading) {
      loadingNow = loading;
      void e.ready.then(() => {
        if (over) return;
        first = performance.now() - t0;
        raf = requestAnimationFrame(frame);
      });
      const check = () => {
        if (models < 0 && !loading()) models = performance.now() - t0;
        if (models >= 0 || performance.now() - t0 >= MODELS_MAX_MS) clearInterval(poll);
        done();
      };
      poll = setInterval(check, POLL_MS);
    },
    stop
  };
}
