// The boot watchdog, inline in index.html before any module (scripts/headers.ts: its hash in the CSP's script-src). A
// launch can boot a newer build's page from the network (service-worker/caches.ts raceShell) whose new entry chunks no
// cache holds: the network gone just after it (a subway, a lift), or a 5xx, and Kit's bootstrap import rejected with
// nothing to catch it, a blank app till it was killed (review 11-14 #2). So, on a page the worker says is the
// network's (Server-Timing `shell` net: a cached shell has every chunk of its own, and a slow start there, a busy
// phone or CI, is left alone): the app not started (+layout.ts calls
// `__islandStarted`) when a module fails to load, or BOOT_WATCH_MS after the start, it reloads once at `?shell=cache`,
// which the worker answers with this version's cached shell, every chunk its own (no race). Once a session
// (sessionStorage), so a shell that fails as well stays put rather than looping; a launch that starts clears it.
// Plain ES5 in one function (its source is the script, its hash computed from it): nothing from outside.

/** The app not started this long after the page's start: reloaded onto the cached shell (ms; app.ready's p90 is ~1.6 s). */
export const BOOT_WATCH_MS = 8000;

/* eslint-disable no-var */
export function bootWatch(w: Window & { __islandUp?: boolean; __islandStarted?: () => void }, ms: number): void {
  var key = 'island.bootWatch';
  var nav = w.performance && w.performance.getEntriesByType ? (w.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined) : undefined;
  var net = false;
  var st = (nav && nav.serverTiming) || [];
  for (var i = 0; i < st.length; i++) if (st[i].name === 'shell' && st[i].description === 'net') net = true;
  w.__islandStarted = function () {
    w.__islandUp = true;
    try {
      w.sessionStorage.removeItem(key);
    } catch (e) {
      /* no storage */
    }
  };
  if (!net) return;
  var rescue = function () {
    if (w.__islandUp) return;
    try {
      if (w.sessionStorage.getItem(key)) return;
      w.sessionStorage.setItem(key, '1');
    } catch (e) {
      return;
    }
    var h = String(w.location.href).split('#')[0];
    w.location.replace(h + (h.indexOf('?') < 0 ? '?' : '&') + 'shell=cache');
  };
  var t = w.setTimeout(rescue, ms);
  w.addEventListener('unhandledrejection', function (e: PromiseRejectionEvent) {
    var m = e.reason && e.reason.message ? String(e.reason.message) : '';
    if (!w.__islandUp && /dynamically imported module|importing a module script|module script failed/i.test(m)) rescue();
  });
  var started = w.__islandStarted;
  w.__islandStarted = function () {
    w.clearTimeout(t);
    started();
  };
}

/** The script's source, as index.html carries it. */
export const BOOT_WATCH_JS = `(${bootWatch.toString().replace(/\s+/g, ' ')})(window,${BOOT_WATCH_MS})`;
