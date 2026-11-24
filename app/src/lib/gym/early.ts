// `/gym`'s two reads begun by its HTML (docs/bots.md): gym.html's head runs `gymEarly` inline, before
// any module (scripts/headers.ts: its hash in the CSP's script-src), so /status and /gym/config are on their way while
// the page's ~100 chunks load (they began only once those had run: ~0.5 s fast, ~2.4 s on a slow 4G line). The link's
// key as linkKey.ts reads it (the hash, else this tab's copy; kept there too, so the boot watchdog's reload, which drops
// the hash, still has it); no key, nothing asked. The first fetchStatus / fetchConfig takes its answer (`takeEarly`:
// once, the same Worker and key; never the main app's, whose HTML has no such script); any other read fetches.
// The key leaves `__gymEarly` as its read is taken; nothing here logs.
import { KEY_RE, TAB } from './linkKey.ts';

/** The gym Worker's origin (status.ts GYM_URL: VITE_GYM_URL overrides it; scripts/headers.ts does the same). */
export const GYM_ORIGIN = 'https://gym-bot.island-fund-relay.workers.dev';

interface Early { u: string; k?: string; s?: Promise<Response>; c?: Promise<Response> }
type EarlyWindow = Window & { __gymEarly?: Early };

/* eslint-disable no-var */
/** The inline script (its source is the script: plain ES5, block comments only, nothing from outside). */
export function gymEarly(w: EarlyWindow, url: string, tab: string, re: RegExp): void {
  var k: string | null = null;
  try {
    var h = w.location.hash.replace(/^#/, '').toLowerCase();
    k = re.test(h) ? h : w.sessionStorage.getItem(tab);
    if (k && re.test(k)) w.sessionStorage.setItem(tab, k);
  } catch (e) {
    /* no storage: the hash's only */
  }
  if (!k || !re.test(k) || !w.fetch) return;
  var by = function (ms: number): RequestInit {
    return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(ms) } : {};
  };
  var c = by(15000);
  c.headers = { Authorization: 'Bearer ' + k };
  c.cache = 'no-store';
  var s = w.fetch(url + '/status', by(20000));
  var g = w.fetch(url + '/gym/config', c);
  /* a page that never takes them (its chunks failed): no unhandled rejection */
  var none = function () {};
  s.catch(none);
  g.catch(none);
  w.__gymEarly = { u: url, k: k, s: s, c: g };
}
/* eslint-enable no-var */

/** The script's source, as gym.html carries it. */
export const gymEarlyJs = (url: string): string => `(${gymEarly.toString().replace(/\s+/g, ' ')})(window,${JSON.stringify(url)},${JSON.stringify(TAB)},${KEY_RE})`;

/** The read gym.html began for `which` (`s` /status, `c` /gym/config with `key`) from `url`, once, or null; it rejects as
 *  `signal` aborts (its reason: a fetch's AbortError or TimeoutError). */
export function takeEarly(which: 's' | 'c', url: string, signal?: AbortSignal, key?: string | null): Promise<Response> | null {
  const w = globalThis as unknown as EarlyWindow;
  const e = w.__gymEarly;
  const p = e?.[which];
  if (!e || !p || e.u !== url || (which === 'c' && e.k !== key)) return null;
  delete e[which];
  if (which === 'c') delete e.k;
  if (!e.s && !e.c) delete w.__gymEarly;
  if (!signal) return p;
  if (signal.aborted) return Promise.reject(signal.reason as Error);
  return new Promise((resolve, reject) => {
    const off = () => reject(signal.reason as Error);
    signal.addEventListener('abort', off, { once: true });
    p.then(resolve, reject).finally(() => signal.removeEventListener('abort', off));
  });
}
