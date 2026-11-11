// What the memory specs measure (leaks.spec, leaks-sheets.spec; docs/ops/testing.md "Memory"): after three forced GCs
// (Chromium's CDP, hence @chromium), the JS heap, the ArrayBuffers (decoded models and images, outside the JS heap),
// Blink's own (decoded images) and the DOM nodes; with `watch` before the goto, the WebGL contexts alive (WeakRefs:
// alive only while something still holds their canvas; the trip map's apart), the window's and document's listeners
// and the fonts loaded.
import type { Page } from './fixtures.ts';

/** `gl` the WebGL contexts alive (`map` the trip map's: a `maplibregl-canvas`'s), `ls` the window's and document's
 *  listeners, `fonts` document.fonts (each -1 without `watch`); `heap`, `ab` (ArrayBuffers) and `emb` (Blink's) MB. */
export type Probe = { gl: number; map: number; ls: number; fonts: number; nodes: number; ab: number; heap: number; emb: number };
type Watched = Pick<Probe, 'gl' | 'map' | 'ls' | 'fonts'>;

/** Before the goto: count the WebGL contexts made and the window's and document's listeners, net (one per listener,
 *  type and phase); window.__mem() reads them. */
export const watch = (page: Page) => page.addInitScript(() => {
  const gls: WeakRef<object>[] = [], maps: WeakRef<object>[] = [];
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...a: unknown[]) {
    const c = (get as (...x: unknown[]) => RenderingContext | null).apply(this, a);
    if (c && String(a[0]).startsWith('webgl') && !gls.some((r) => r.deref() === c)) {
      gls.push(new WeakRef(c));
      // (MapLibre names its canvas before it asks for the context)
      if (this.classList.contains('maplibregl-canvas')) maps.push(new WeakRef(c));
    }
    return c;
  } as typeof get;
  const on = new WeakMap<object, Set<string>>();
  let n = 0;
  const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
  const key = (t: EventTarget, type: string, o: unknown) => `${t === window ? 'w' : 'd'}:${type}:${typeof o === 'boolean' ? o : !!(o as { capture?: boolean } | undefined)?.capture}`;
  EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, f: unknown, o?: unknown) {
    if (f && (this === window || this === document)) {
      const s = on.get(f as object) ?? new Set<string>(), k = key(this, type, o);
      if (!s.has(k)) (s.add(k), on.set(f as object, s), n++);
    }
    return add.call(this, type, f as EventListener, o as AddEventListenerOptions);
  };
  EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, f: unknown, o?: unknown) {
    const s = f && (this === window || this === document) ? on.get(f as object) : null;
    if (s?.delete(key(this, type, o))) n--;
    return rem.call(this, type, f as EventListener, o as EventListenerOptions);
  };
  (window as unknown as { __mem: () => Watched }).__mem = () => ({ gl: gls.filter((r) => r.deref()).length, map: maps.filter((r) => r.deref()).length, ls: n, fonts: document.fonts.size });
});

/** What `watch` counts now, no GC (-1s without it). */
export const watched = (page: Page): Promise<Watched> =>
  page.evaluate(() => (window as unknown as { __mem?: () => Watched }).__mem?.() ?? { gl: -1, map: -1, ls: -1, fonts: -1 });

/** The page's memory now, GC'd. */
export async function measure(page: Page): Promise<Probe> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  // (the DOM nodes alive, in the document or detached and still held)
  const { metrics } = await cdp.send('Performance.getMetrics');
  // (the ArrayBuffers' bytes: JSHeapUsedSize leaves them out, and on the island they're most of the page's memory)
  const hu = (await cdp.send('Runtime.getHeapUsage')) as { usedSize: number; backingStorageSize?: number; embedderHeapUsedSize?: number };
  await cdp.detach();
  // (a WeakRef's target is collected only after the task that last read it: read in a fresh one, 50 ms on: at 0 ms
  // after CDP's GC Chromium sometimes still has it)
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 50)));
  const mb = (n = 0) => Math.round(n / 1e4) / 100;
  return { ...(await watched(page)), nodes: metrics.find((m) => m.name === 'Nodes')?.value ?? 0, ab: mb(hu.backingStorageSize), heap: mb(hu.usedSize), emb: mb(hu.embedderHeapUsedSize) };
}

/** The page hidden (an iOS app switch: visibilitychange only, never pagehide), then shown again. */
export const hideAndShow = (page: Page) => page.evaluate(() => {
  const vis = (s?: string) => {
    if (s) Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    else delete (document as { visibilityState?: string }).visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  };
  vis('hidden');
  vis();
});
