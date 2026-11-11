// What the memory specs measure (leaks-sheets.spec; docs/ops/testing.md "Memory"): after three forced GCs (Chromium's
// CDP, hence @chromium), the JS heap, the ArrayBuffers (decoded models and images, outside the JS heap) and the DOM
// nodes; with `watch` before the goto, the WebGL contexts alive (WeakRefs) and the window's and document's listeners.
import type { Page } from './fixtures.ts';

export type Probe = { heap: number; ab: number; nodes: number; gl: number; ls: number };

/** Before the goto: count the WebGL contexts made (alive while something holds their canvas) and the window's and
 *  document's listeners, net. */
export const watch = (page: Page) => page.addInitScript(() => {
  const gls: WeakRef<object>[] = [];
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...a: unknown[]) {
    const c = (get as (...x: unknown[]) => RenderingContext | null).apply(this, a);
    if (c && String(a[0]).startsWith('webgl') && !gls.some((r) => r.deref() === c)) gls.push(new WeakRef(c));
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
  (window as unknown as { __mem: () => { gl: number; ls: number } }).__mem = () => ({ gl: gls.filter((r) => r.deref()).length, ls: n });
});

/** The page's memory now, GC'd (MB; gl and ls -1 without `watch`). */
export async function measure(page: Page): Promise<Probe> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const hu = (await cdp.send('Runtime.getHeapUsage')) as { usedSize: number; backingStorageSize?: number };
  await cdp.detach();
  // (a WeakRef's target goes only after the task that last read it: read in a fresh one)
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 0)));
  const w = await page.evaluate(() => (window as unknown as { __mem?: () => { gl: number; ls: number } }).__mem?.() ?? { gl: -1, ls: -1 });
  const mb = (n = 0) => Math.round(n / 1e4) / 100;
  return { heap: mb(hu.usedSize), ab: mb(hu.backingStorageSize), nodes: metrics.find((m) => m.name === 'Nodes')?.value ?? 0, ...w };
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
