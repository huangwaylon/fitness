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
  // (1 here; 2 before a lazy chunk's CSS link stopped holding the first island; before the picker's fix, 5 after one
  // round and 11 after three)
  expect(first.gl, 'WebGL contexts alive after one round').toBeLessThanOrEqual(2);
  expect(after.gl, 'WebGL contexts alive after three').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
});

// The museum (docs/design.md "The museum", "First person"): in first person and out, the eye button on and off, a
// bench sat on and left. In the museum only its own context is alive, the island it came from gone (before the fixes
// one more: the island's hooks, its sleep clock and a lazy chunk's CSS link held a whole island, its DOM and context).
test('the museum in first person and out, the eye button, a bench: no context or listener left, the island gone inside', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(120_000);
  /** A function of the museum's hooks (MuseumRoom.svelte hooks()), its value. */
  const mu = <T>(fn: string) => page.evaluate(`(${fn})(window.__museum)`) as Promise<T>;
  await watch(page);
  await page.goto(Q);
  await islandUp(page);
  const back = async () => (await nav(page, `/fitness/${Q}`), await islandUp(page));
  const inside: number[] = [];
  // the eye button: on (at the eyes) or off (the room's camera)
  const eye = async (on: boolean) => {
    await page.locator('[data-fpv]').click();
    await expect.poll(() => mu<boolean>(`m => (f => !!f && f.on === ${on} && f.inside === ${on} && !f.busy)(m.fpv())`), { timeout: 15_000 }).toBe(true);
  };
  const round = async () => {
    await nav(page, `/fitness/museum${Q}`);
    await framed(page, '__museum');
    await eye(true);
    await back();
    // in again: in first person from the first frame (kept on this phone), then off
    await nav(page, `/fitness/museum${Q}`);
    await framed(page, '__museum');
    await expect.poll(() => mu<boolean>('m => !!m.fpv()?.inside && !m.fpv().busy'), { timeout: 15_000 }).toBe(true);
    await eye(false);
    // a bench: a tap sits my villager on it, a tap on the floor gets it up
    await page.evaluate('window.__museum.put(150, 10)');
    await expect.poll(() => mu<boolean>('m => m.still()'), { timeout: 10_000 }).toBe(true);
    const [bx, by] = await mu<[number, number]>('m => m.benchPx("dmbench1", 0)');
    await page.mouse.click(bx, by);
    await expect.poll(() => mu<boolean>('m => !!m.seat() && m.still()'), { timeout: 15_000 }).toBe(true);
    const [fx, fy] = await mu<[number, number]>('m => m.px(150, 15)');
    await page.mouse.click(fx, fy);
    await expect.poll(() => mu<boolean>('m => !m.seat() && m.still()'), { timeout: 15_000 }).toBe(true);
    inside.push((await measure(page)).gl);
    await back();
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  expect(inside, 'WebGL contexts alive in the museum (its own only)').toEqual([1, 1, 1]);
  expect(after.gl, 'WebGL contexts alive after three').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
});
