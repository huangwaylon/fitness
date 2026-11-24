// Beach finds (docs/design.md "Beach finds"): shells on the sand, fossil dig spots, the message bottle, star fragments
// the morning after a wish, mushrooms in November. A tap picks one up with NH's caption; the first of each shell, fossil
// and fragment is a ずかん `find` (mushrooms are cosmetic). None of it changes ベル, opens a sheet or navigates. The day
// items derive from ?date= (deterministic); ?find= forces a bottle, this morning's fragments or the rare mushroom.
import { expect, test, type Page } from './fixtures.ts';
import { cues } from './cues.ts';
import { daySpots, findCount, findsOut, fossilOnScreen, fxSince, is3d, islandUp, mid, pageNow, quiet, settled, step, type W3 } from './island.ts';
import { fromMenu, hudBells, hudMenu } from './hud.ts';
import { LIVE_V } from '../src/lib/contract/live-protocol.ts';

test.use({ viewport: { width: 390, height: 844 } });


async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await islandUp(page);
  return { bells: await hudBells(page).getAttribute('aria-label'), url: page.url() };
}
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(hudBells(page)).toHaveAttribute('aria-label', before.bells!);
}
/** Where the first find of `kind` lies (its foot, client px), once one is out. */
async function at(page: Page, kind: string) {
  await expect.poll(() => findCount(page, kind)).toBeGreaterThan(0);
  const [x, y] = (await findsOut(page, kind))[0].foot;
  return { x, y };
}
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? [])
    .filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
/** What's under a point: a control (button) or nothing. */
const control = (page: Page, p: { x: number; y: number }) =>
  page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);

test('shells lie on the front beach (the newest three); a tap picks one up, and it stays picked after a reload', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const shells = () => findCount(page, 'shell');
  await expect.poll(shells).toBe(3);
  const id = (await findsOut(page, 'shell'))[0].id;
  const p = await at(page, 'shell');
  expect(await control(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/を ひろった！/);
  await expect.poll(shells).toBe(2);
  expect(await cues(page)).toContain('scene-shell');
  expect(await finds(page)).toEqual([{ kind: 'shell', id }]);
  await unchanged(page, before);
  await page.reload();
  await islandUp(page);
  await expect.poll(shells).toBe(2);
});

test('a fossil dig spot: a tap digs it up (「かせきを ほりだした！」 and its name); it stays gone, nothing turns up after it', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  // (four a day, the day's: beach.test's digSpots)
  const digs = async () => (await daySpots(page)).digs.length;
  await expect.poll(digs).toBe(4);
  await expect.poll(() => findCount(page, 'fossil')).toBeGreaterThan(0);
  const p = await fossilOnScreen(page);
  const shown = () => findCount(page, 'fossil'), m = await shown();
  expect(await control(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/かせきを ほりだした！ .+だ！/);
  // the one dug gone for the day, no other in its place (the others where they were)
  await expect.poll(shown).toBe(m - 1);
  await expect.poll(digs).toBe(3);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-dig', 'scene-catch']));
  expect((await finds(page))[0]).toMatchObject({ kind: 'fossil' });
  await unchanged(page, before);
});

test('a dig spot never flickers behind the bulletin board: none drawn as the camera comes in that goes once it settles', async ({ page }) => {
  // (2026-11-10's lay behind the board on the default island: the board's art, a button, covered it once the camera
  // settled, so it hid then and showed again whenever the camera moved: the user's flicker, 2026-11-06. The day's
  // spots keep off the ground behind the board now: layout/clear.ts tapCovered)
  await open(page, '&date=2026-11-10T12:00');
  expect(await is3d(page)).toBe(true);
  // (the opening beats over: a greeting's balloon over a spot takes it off while it shows)
  await quiet(page);
  type G = { __world3d: { go(z: number, k?: number): void } };
  for (const k of [1, 2.2, 3.2]) {
    await page.evaluate((k) => (window as unknown as G).__world3d.go(900, k), k);
    await settled(page);
    // the camera to the board at once, the dig spots drawn in view sampled each frame till it has settled
    await page.evaluate((k) => (window as unknown as G).__world3d.go(60, k), k);
    const moving = await page.evaluate(() => new Promise<string[]>((done) => {
      const seen = new Set<string>();
      let n = 0;
      const frame = () => {
        for (const f of (window as unknown as { __world3d: W3 }).__world3d.finds())
          if (f.kind === 'fossil' && f.shown && f.foot[1] > 0 && f.foot[1] < innerHeight) seen.add(f.uid);
        if (++n < 20) requestAnimationFrame(frame);
        else done([...seen]);
      };
      requestAnimationFrame(frame);
    }));
    await settled(page);
    await page.waitForTimeout(300);
    const still = (await findsOut(page, 'fossil')).map((f) => f.uid);
    for (const uid of moving) expect(still, `zoom ${k}: ${uid} drawn as the camera came in, gone once it settled`).toContain(uid);
  }
});

test('the dig spots stay drawn after a sheet that was up when the partner’s world news came closes (the user’s spots gone, 2026-11-16)', async ({ page }) => {
  // (each world event re-derived the spots, and they were re-measured against every control on the page, the open
  // sheet's included: every spot under the sheet hid, and stayed hidden once it closed)
  const D = '2026-11-04';
  await open(page, `&date=${D}T12:00&weather=clear`);
  await quiet(page);
  await settled(page);
  const spots = async () => (await findsOut(page, 'fossil')).map((f) => f.uid).sort();
  const drawn = await spots();
  expect(drawn.length).toBeGreaterThan(0);
  await fromMenu(page, 'bells');
  // うめ's phone waters a flower, as the demo's relay brings it (sync/live-local.ts: another tab's BroadcastChannel)
  const id = 'fl:e2e-news';
  await page.evaluate(([id, v, t0]) => {
    const bc = new BroadcastChannel('island-demo-relay'), t = t0 + Date.now() - performance.timeOrigin;
    bc.postMessage({ k: 'm', m: { v, kind: 'world', op: 'watered', id, who: 'B', t } });
    setTimeout(() => bc.close(), 1000);
  }, [id, LIVE_V, Date.parse(`${D}T12:00:00+09:00`)] as const);
  await expect.poll(() => page.evaluate((id) => Object.keys(localStorage).some((k) => localStorage.getItem(k)?.includes(id)), id)).toBe(true);
  // three frames on under the sheet (Finds measures two frames on)
  await page.evaluate(() => ((window as { __f?: number }).__f = 0));
  await page.waitForFunction(() => ++(window as { __f?: number }).__f! > 3, null, { polling: 'raf' });
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  if ((await hudMenu(page).getAttribute('aria-expanded')) === 'true') await hudMenu(page).click();
  await settled(page);
  await expect.poll(spots).toEqual(drawn);
});

test('a message bottle at the water’s edge: a tap reads its note', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00&find=bottle');
  const p = await at(page, 'bottle');
  const t0 = await pageNow(page);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/メッセージボトル！ 『.+』/);
  await expect.poll(() => findCount(page, 'bottle')).toBe(0);
  // (it lifted off the sand and went with a sparkle: the 3D island's)
  await expect.poll(() => fxSince(page, 'sparkle', t0)).toBeGreaterThan(0);
  expect(await cues(page)).toContain('scene-bottle');
  expect(await finds(page)).toEqual([]); // a bottle isn't a ずかん find
  await unchanged(page, before);
});

type WashSample = { t: number; x: number; z: number; fade: number; model: number[]; dom: number[] | null } | null;
test('a bottle the waves bring washes up from the waterline to its spot, fading in, its tap area with it; a tap reads it as ever', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a wait sized for the game at full speed (an animation, a spawn, a sync within its seconds); software GL slows the game itself' } }, async ({ page }) => {
  test.setTimeout(45_000);
  // (it comes 1.5 s after the island opens: ?find=washed; then it waits for the next wave there, up to its 5 s cycle.)
  // On the page's clock, paused, a frame at a time: its model loads only as it comes (the network's time), and on the
  // real clock a busy runner's came after the wash-in was over, nothing of it seen. Held while the model loads.
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+09:00') });
  await page.clock.pauseAt(new Date('2026-11-04T12:00:01+09:00'));
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-11-04T12:00&find=washed');
  // (the 3D island up, not only the HUD: its mount waits for the ground's fields, whose worker starts on a page timer
  // when the cache is slow to answer, fieldsPrime.ts CACHE_MS: on this paused clock only as it's stepped)
  await expect.poll(async () => (await step(page, 100), (await hudMenu(page).isVisible()) && (await page.evaluate(() => !!(window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded()))), { timeout: 20_000 }).toBe(true);
  const before = { bells: await hudBells(page).getAttribute('aria-label'), url: page.url() };
  const sample = () => page.evaluate(() => {
    type W = { where(id: string): { x: number; z: number; fade: number } | null; client(x: number, z: number, lift?: number): number[] } & Pick<W3, 'finds'>;
    const w = (window as unknown as { __world3d: W }).__world3d, p = w.where('find-b-demo');
    const f = w.finds().find((f) => f.kind === 'bottle');
    return { el: !!f, p: p && { t: performance.now(), x: p.x, z: -p.z, fade: p.fade, model: w.client(p.x, -p.z, 0), dom: f ? f.foot : null } };
  });
  const s: WashSample[] = [];
  for (let i = 0; i < 1200; i++) {
    const { el, p } = await sample();
    s.push(p);
    const shown = s.filter((q) => !!q);
    if (shown.length > 10 && shown.slice(-10).every((q) => q!.fade === 1)) break;
    // (the bottle's there and its model isn't: a moment of ours for the load, none of the page's)
    if (el && !p) await page.waitForTimeout(50);
    await step(page, 16);
  }
  const shown = s.filter((p): p is NonNullable<WashSample> => !!p);
  expect(shown.length).toBeGreaterThan(10);
  const first = shown[0], last = shown.at(-1)!;
  // it lies at its spot in the end, whole; it came from nothing out past the waterline (the bottle lies at the water's
  // edge: the front sea's side, nearer the camera, smaller z), straight up the beach
  expect(last.fade).toBe(1);
  expect(first.fade).toBe(0);
  expect(shown.find((p) => p.fade > 0)!.fade).toBeLessThan(0.2);
  expect(last.z - first.z).toBeGreaterThan(5);
  expect(Math.abs(last.x - first.x)).toBeLessThan(4);
  // the fade ramps over frames, and it moves only up the beach, smoothly
  expect(shown.filter((p) => p.fade > 0.05 && p.fade < 0.95).length).toBeGreaterThanOrEqual(3);
  for (let i = 1; i < shown.length; i++) {
    expect(shown[i].z).toBeGreaterThanOrEqual(shown[i - 1].z - 0.01);
    expect(shown[i].fade).toBeGreaterThanOrEqual(shown[i - 1].fade - 1e-6);
  }
  // its tap area goes with the model (the node at its foot where the model's foot is drawn)
  for (const p of shown) if (p.dom && p.fade > 0) expect(Math.hypot(p.dom[0] - p.model[0], p.dom[1] - p.model[1])).toBeLessThan(6);
  // taken as ever
  const q = await at(page, 'bottle');
  await page.mouse.click(q.x, q.y);
  await step(page, 1000);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/メッセージボトル！ 『.+』/);
  await expect.poll(() => findCount(page, 'bottle')).toBe(0);
  await unchanged(page, before);
});

test('a bottle waiting out in the shallows for its wave (not yet seen) takes no tap till its wave brings it in', async ({ page }) => {
  test.setTimeout(45_000);
  // On the page's clock: the bottle comes 1.5 s after the island opens (?find=washed) and waits for its wave there (up
  // to its 5 s cycle), its model loading as it comes (the network's time, not the page's). On the real clock a busy
  // runner's model came after the wave, and the bottle was never seen waiting (the test ran out). Here the page's time
  // moves a frame at a time, held while the model loads, so it's found waiting and tapped then, the clock still.
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+09:00') });
  await page.clock.pauseAt(new Date('2026-11-04T12:00:01+09:00'));
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-11-04T12:00&find=washed');
  type T = { __world3d?: { where(id: string): { fade: number } | null } & Pick<W3, 'finds'> };
  const state = () => page.evaluate(() => {
    const w = (window as unknown as T).__world3d, b = w?.finds().find((f) => f.kind === 'bottle'), f = w?.where('find-b-demo');
    return { at: b ? { x: b.foot[0], y: b.foot[1] } : null, fade: f ? f.fade : null };
  });
  let s = await state();
  for (let i = 0; i < 800 && !(s.at && s.fade === 0); i++) {
    await step(page, 16);
    // (the bottle's there and its model isn't: a moment of ours for the load, none of the page's)
    if (s.at && s.fade === null) await page.waitForTimeout(50);
    s = await state();
  }
  expect(s.fade, 'the bottle seen waiting for its wave').toBe(0);
  await page.mouse.click(s.at!.x, s.at!.y);
  await step(page, 400);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await findCount(page, 'bottle')).toBe(1);
  expect(await cues(page)).not.toContain('scene-bottle');
});

test('what lies on the beach as the island opens just lies there: no wash-in', async ({ page }) => {
  await open(page, '&date=2026-11-04T12:00&find=bottle');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d?: { where(id: string): { fade: number } | null } }).__world3d?.where('find-b-demo')?.fade ?? null), { timeout: 20_000 }).toBe(1);
});

test('wishes on shooting stars bring star fragments the next morning; a tap picks one up (the wish itself: sky.spec)', async ({ page }) => {
  await page.addInitScript(() => localStorage.getItem('scene-wish') || localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-05': 3 })));
  await page.goto('?demo&date=2026-11-05T08:00');
  await islandUp(page);
  await expect.poll(() => findCount(page, 'fragment')).toBe(3);
  const before = { bells: await hudBells(page).getAttribute('aria-label'), url: page.url() };
  const id = (await findsOut(page, 'fragment'))[0].id;
  // NH's beach glimmer: one glints now and then (every 3–5 s, the 3D island's)
  await expect.poll(() => fxSince(page, 'glint'), { timeout: 8000 }).toBeGreaterThan(0);
  const p = await at(page, 'fragment');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/かけらを ひろった！/);
  expect(await finds(page)).toEqual([{ kind: 'fragment', id }]);
  await unchanged(page, before);
});

test('mushroom season: November mushrooms beside the trees, clear of every control; a tap picks one up (cosmetic)', async ({ page }) => {
  const before = await open(page, '&date=2026-11-01T10:00');
  const mush = () => findCount(page, 'mushroom');
  await expect.poll(mush).toBeGreaterThan(0);
  const n = await mush();
  expect(n).toBeGreaterThanOrEqual(1);
  expect(n).toBeLessThanOrEqual(2);
  // beside a trunk, under no control (its art)
  for (const { box } of await findsOut(page, 'mushroom'))
    for (const [dx, dy] of [[0.5, 0.5], [0.15, 0.85], [0.85, 0.85], [0.5, 0.15]])
      expect(await control(page, { x: box.left + box.width * dx, y: box.top + box.height * dy })).toBe('');
  const p = mid((await findsOut(page, 'mushroom'))[0].box);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/(まるい|ほそい|ひらたい|りっぱな)キノコを ひろった！/);
  await expect.poll(mush).toBe(n - 1);
  expect(await cues(page)).toContain('scene-mushroom');
  expect(await finds(page)).toEqual([]); // no ずかん kind for mushrooms: cosmetic
  await unchanged(page, before);
  await page.reload();
  await islandUp(page);
  await expect.poll(mush).toBe(n - 1);
});

// (none out of season, September or January: mushrooms.test's edges)
test('the rare mushroom comes out of a November dig spot', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00&find=rare-mushroom');
  const p = await fossilOnScreen(page);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText('めずらしいキノコを ほりだした！');
  expect(await finds(page)).toEqual([]);
  await unchanged(page, before);
});
