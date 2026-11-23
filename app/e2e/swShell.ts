// What a launch learnt of the deployed build (service-worker/caches.ts checkShell), for the specs of the worker's
// navigations (sw-update, sw-liefi).
import type { Page } from './fixtures.ts';

/** The worker's background check of this page's navigation, asked as the page's report asks it (service-worker/index.ts
 *  `net` with the Server-Timing `t0`; world3d/boot.ts swFetches): `new`, `same`, `skip` or `cache` (still on its way
 *  past 300 ms, or given up); the Server-Timing `shell` with no t0. */
export const shellOf = (page: Page) => page.evaluate(() => new Promise<string | null>((done) => {
  const st = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.serverTiming ?? [];
  const t0 = st.find((t) => t.name === 't0')?.duration, sw = navigator.serviceWorker.controller;
  if (!t0 || !sw) return done(st.find((t) => t.name === 'shell')?.description ?? null);
  const ch = new MessageChannel();
  ch.port1.onmessage = (e: MessageEvent) => done((e.data as { shell?: string } | null)?.shell ?? null);
  sw.postMessage({ k: 'net', since: 0, t0 }, [ch.port2]);
}));
