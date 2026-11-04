// Memory leaks across the scenes (docs/ops/testing.md "Memory"): the PWA stays open for days, so going in and out of
// the rooms and the home picker must leave nothing behind. Each WebGL context made is watched (a WeakRef: alive only
// while something still holds its canvas), and the window's and document's listeners counted, after a forced GC
// (Chromium's CDP, hence @chromium). Before the fixes: one more context a home picker opened (three's dispose listeners
// on the cached home models held the picker's renderer), one more an /editor visit (and a document keydown listener).
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none&as=B';

type Probe = { gl: number; ls: number };
async function watch(page: Page) {
  await page.addInitScript(() => {
    const gls: WeakRef<object>[] = [];
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...a: unknown[]) {
      const c = (get as (...x: unknown[]) => RenderingContext | null).apply(this, a);
      if (c && String(a[0]).startsWith('webgl') && !gls.some((r) => r.deref() === c)) gls.push(new WeakRef(c));
      return c;
    } as typeof get;
    // the window's and document's listeners, net (one per listener, type and phase)
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
      const s = f && (this === window || this === document) ? on.get(f as object) : null, k = key(this, type, o);
      if (s?.delete(k)) n--;
      return rem.call(this, type, f as EventListener, o as EventListenerOptions);
    };
    (window as unknown as { __leaks: () => Probe }).__leaks = () => ({ gl: gls.filter((r) => r.deref()).length, ls: n });
  });
}
async function measure(page: Page): Promise<Probe> {
  const cdp = await page.context().newCDPSession(page);
  for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  await cdp.detach();
  // (a WeakRef's target is collected only after the task that last read it: read in a fresh one)
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 50)));
  return page.evaluate(() => (window as unknown as { __leaks: () => Probe }).__leaks());
}

/** The app's own navigation (a link's click: SvelteKit's router), as a door does. */
const nav = (page: Page, path: string) => page.evaluate((h) => {
  const a = document.createElement('a');
  a.href = h;
  document.body.append(a);
  a.click();
  a.remove();
}, path);
const islandUp = (page: Page) => page.waitForFunction(() => !!(window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
const framed = (page: Page, hook: '__tent' | '__museum') =>
  page.waitForFunction((h) => ((window as unknown as Record<string, { stats(): { frames: number } } | undefined>)[h]?.stats()?.frames ?? 0) > 1, hook, { timeout: 30_000 });

test('the rooms and the home picker, in and out: no WebGL context or window listener left behind', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(120_000);
  await watch(page);
  await page.goto(Q);
  await islandUp(page);
  const back = async () => (await nav(page, `/fitness/${Q}`), await islandUp(page));
  const trips = async () => {
    await nav(page, `/fitness/shop${Q}`);
    await expect(page.locator('[data-shop]')).toBeVisible();
    await back();
    await nav(page, `/fitness/museum${Q}`);
    await framed(page, '__museum');
    await back();
    // うめ's house, as うめ: いえを かえる opened, two homes previewed, closed
    await nav(page, `/fitness/tent${Q}&home=B`);
    await framed(page, '__tent');
    for (let i = 0; i < 2; i++) {
      await page.locator('[data-home-look]').click();
      const models = page.locator('[data-home-picker] [data-model]');
      await expect(models.first()).toBeVisible();
      for (const k of [1, 0]) await models.nth(k).click();
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-home-picker]')).toHaveCount(0);
    }
    await back();
  };
  await trips();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await trips();
  const after = await measure(page);
  // the island's own context (and at most one an earlier island's, held a while by the page): never one a trip
  // (2 here: the island's and one earlier island's; before the picker's fix, 5 after one round and 11 after three)
  expect(first.gl, 'WebGL contexts alive after one round').toBeLessThanOrEqual(3);
  expect(after.gl, 'WebGL contexts alive after three').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
});
