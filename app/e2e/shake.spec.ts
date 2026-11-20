// Shaking a tree (docs/design.md "Shaking a tree"): one tap still opens the popup; a quick run of taps shakes the tree.
// A shake may drop a branch (a tap picks it up), a bagworm or a spider dangling on its thread (a tap nets it) or, rarely,
// a wasp nest: its wasps charge the villager on that side; a tap on them in time nets one (NH's catch line), else they
// sting (a fright, a sweat drop and NH's swollen eye on the villager's own eye). `?shake=nest|branch|bagworm|spider`
// forces the next shake's drop (`wood`: a piece of wood, into my pocket for the shop). Nothing changes ベル.
import { expect, test, type Page } from './fixtures.ts';
import { canopyAt, dropsOut, fxSince, is3d, islandUp, mid, pageNow, quiet, shakesOut, shakeTree as shake, tapBox, tapOn, villager, type W3 } from './island.ts';
import { hudBells } from './hud.ts';

test.use({ viewport: { width: 390, height: 844 } });

async function open(page: Page, q = '') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  // the page's own clock, running, for the shake's three taps on it (shakeTree onClock: on a slow runner's wall clock
  // they spread past SHAKE_WINDOW_MS, and no nest fell)
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+09:00') });
  await page.clock.resume();
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await islandUp(page, { timeout: 15_000 }); // (its first paint: now and then over 5 s under CI's load)
  await is3d(page); // (the 3D island up and its canopies where they'll stay: a while in software GL)
  await quiet(page); // the opening beats are over
}
/** Whether any villager shows a sting's fright. */
const stungAny = async (page: Page) => (await Promise.all(['mine', 'partner', 'third'].map((s) => villager(page, s)))).some((a) => !!a?.stung);
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
/** How many of a shake's leavings of a kind are out (`__world3d.shakes`). */
const nests = async (page: Page) => (await shakesOut(page)).nests.length;
const swarms = async (page: Page) => (await shakesOut(page)).swarms.length;
const dangles = async (page: Page, bug?: string) => (await shakesOut(page)).dangles.filter((d) => !bug || d.bug === bug).length;
const drops = async (page: Page, what: string, id?: string) => (await dropsOut(page, what)).filter((d) => !id || d.id === id).length;
test('one tap opens the popup and drops nothing; two close it; the third quick tap shakes the tree', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  let c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.locator('.detail')).toBeVisible();
  await page.waitForTimeout(1300); // a run has to be quick: this starts over
  c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.locator('.detail')).toHaveCount(0);
  expect(await nests(page)).toBe(0);
  await shake(page, { onClock: true });
  await expect(page.locator('.detail')).toHaveCount(0); // the shake closes it
  await expect.poll(() => nests(page)).toBe(1);
  expect(await cues(page)).toContain('tree-shake');
});

test('a nest falls; its wasps charge my villager; a tap in time nets one: NH’s line, no sting, no ベル', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  const bells = await hudBells(page).getAttribute('aria-label');
  await shake(page, { onClock: true });
  await expect.poll(() => nests(page)).toBe(1);
  // (polled every 100 ms: they come out 1.2 s after the nest and sting 1.5 s later)
  await expect.poll(async () => (await shakesOut(page)).swarms.map((s) => s.side), { timeout: 3000, intervals: [100] }).toEqual(['mine']);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-nest', 'scene-buzz']));
  // (its box's middle at the tap: the swarm flies)
  const t0 = await pageNow(page);
  await tapBox(page, 'swarm', 'mine', { clear: null, mouse: true });
  await expect(page.locator('[data-fx="catch"]')).toContainText('ハチを つかまえた！', { timeout: 3000 });
  // (the net's swing at them, the 3D island's)
  expect(await fxSince(page, 'swing', t0, 'net')).toBe(1);
  // the net's and the catch's own cues (no other tap sound: the scene plays them)
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await expect.poll(() => swarms(page)).toBe(0);
  await page.waitForTimeout(1800);
  await expect.poll(() => stungAny(page)).toBe(false);
  await expect.poll(() => nests(page)).toBe(0); // the nest goes once the wasps are out
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  // the shared day keeps the nest (one per tree an hour, on both phones): my tree's
  const day = JSON.parse((await page.evaluate(() => localStorage.getItem('island-demo.world.A')))!) as { events: { kind: string; tree?: string; drop?: string }[] };
  expect(day.events).toContainEqual(expect.objectContaining({ kind: 'shake', tree: 'goal-A', drop: 'nest' }));
});

test('too late: the wasps sting the villager on that side (a fright, a sweat drop, the swollen eye) and fly off', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  await shake(page, { onClock: true });
  await expect.poll(() => swarms(page), { timeout: 3000, intervals: [100] }).toBe(1);
  // the left tree's wasps go for the villager on the left, at its face where it stands
  // (its closest to the villager on the way, in villager widths: both boxes read at one moment, as the swarm flies off
  // after the sting, and a loaded runner's poll could first see the sting after it had)
  let closest = Infinity;
  await expect.poll(async () => {
    const r = await page.evaluate(() => {
      const w3 = (window as unknown as { __world3d: W3 }).__world3d, v = w3.box('villager', 'mine'), side = w3.shakes().swarms[0]?.side;
      const w = side ? w3.box('swarm', side) : null;
      return { stung: !!w3.actor('mine')?.stung, d: v && w ? Math.abs(w.left + w.width / 2 - (v.left + v.width / 2)) / v.width : Infinity };
    });
    closest = Math.min(closest, r.d);
    return r.stung;
  }, { timeout: 2500, intervals: [50] }).toBe(true);
  expect(closest).toBeLessThan(1);
  expect(await cues(page)).toContain('scene-sting');
  await expect.poll(() => swarms(page), { timeout: 2000 }).toBe(0);
  // NH's swollen eye (the 3D villager's own: the next test), and it stays after the fright
  await expect.poll(async () => (await villager(page))?.swollen).toBe(true);
  await page.waitForTimeout(3000);
  await expect.poll(async () => (await villager(page))?.stung).toBeNull();
  expect((await villager(page))?.swollen).toBe(true);
  expect((await villager(page, 'partner'))?.swollen).toBe(false);
});

test('stung on the 3D island: the swollen eye is the 3D villager’s own (its lump on its head), no 2D lump over its head', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  await is3d(page);
  const v3 = (fn: string) => page.evaluate(`(${fn})(window.__villagers3)`);
  // my villager in 3D (its model in)
  await expect.poll(() => v3('(v) => v.state("mine")'), { timeout: 30_000 }).not.toBeNull();
  await shake(page, { onClock: true });
  await expect.poll(async () => !!(await villager(page))?.stung, { timeout: 4000 }).toBe(true);
  await expect.poll(() => v3('(v) => v.stung("mine")'), { timeout: 3000 }).toBe(true);
  // still swollen once the fright and the sweat drop are over (the minute's)
  await page.waitForTimeout(3000);
  await expect.poll(async () => (await villager(page))?.stung).toBeNull();
  expect(await v3('(v) => v.stung("mine")')).toBe(true);
  await expect.poll(() => v3('(v) => v.stung("partner")')).toBe(false);
});

test('a shaken branch lies beside the trunk until a tap picks it up', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=branch');
  await shake(page, { onClock: true });
  await expect.poll(() => drops(page, 'branch')).toBe(1);
  const [{ id }] = await dropsOut(page, 'branch');
  await page.waitForTimeout(700);
  await tapOn(page, 'drop', id);
  await expect.poll(() => drops(page, 'branch')).toBe(0);
  expect(await cues(page)).toContain('scene-twig');
  await expect(page.locator('.detail')).toHaveCount(0);
});

test('no piles: while its branch lies under it, a tree’s shakes only rustle it (no wood, no bug, no nest, no second branch)', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=branch');
  await shake(page, { onClock: true });
  await expect.poll(() => drops(page, 'branch')).toBe(1);
  for (let i = 0; i < 4; i++) {
    await page.clock.runFor(1300); // (a new run of taps)
    await shake(page, { onClock: true });
  }
  await page.clock.runFor(900); // (what would fall has fallen)
  const left = await shakesOut(page);
  expect(left.drops.map((d) => d.what)).toEqual(['branch']);
  expect([left.nests, left.swarms, left.dangles]).toEqual([[], [], []]);
});

test('a shake knocks out a piece of wood; picked up, it is in my pocket’s しげん at the shop and sells for かいがら', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=wood');
  await shake(page, { onClock: true });
  await expect.poll(() => drops(page, 'wood')).toBe(1);
  const [{ id, item: what }] = await dropsOut(page, 'wood');
  await page.waitForTimeout(700);
  await tapOn(page, 'drop', id);
  await expect.poll(() => drops(page, 'wood')).toBe(0);
  await expect(page.locator('.detail')).toHaveCount(0);
  await page.goto('shop?demo&date=2026-11-04T12:00');
  // the counter's うる list over the 3D shop
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="sell"]').click();
  const tile = page.locator(`[data-shop-sec="material"] + ul [data-shop-catch="goods:${what}"]`);
  await expect(tile).toHaveAttribute('data-n', '1');
  const shells = () => page.locator('[data-shop]').getAttribute('data-shells').then(Number);
  const before = await shells();
  await tile.click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(shells).toBe(before + 3); // NH's 60 Bells ÷ 20
  await expect(tile).toHaveCount(0);
});

test('a shake drops a bagworm on its thread beside the trunk; a tap nets it (NH’s line, a ずかん find, no ベル)', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=bagworm');
  const bells = await hudBells(page).getAttribute('aria-label');
  await shake(page, { onClock: true });
  await expect.poll(() => dangles(page, 'bagworm')).toBe(1);
  await page.waitForTimeout(700); // down its thread
  // its tap target is its own: clear of the canopy and the fruit row (a tap at its middle nets it)
  const b = mid((await page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.box('drop', 'bagworm')))!);
  expect(await page.evaluate(({ x, y }) => (window as unknown as { __world3d: W3 }).__world3d.pick(x, y), b)).toMatchObject({ kind: 'drop', id: 'bagworm' });
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText('ミノムシを つかまえた！', { timeout: 3000 });
  await expect.poll(() => dangles(page)).toBe(0);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('at night a spider can dangle instead; left alone it climbs back up into the tree', async ({ page }) => {
  test.setTimeout(40_000);
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.clock.install({ time: new Date('2026-11-04T22:00:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo&date=2026-11-04T22:00&shake=spider');
  await islandUp(page);
  await is3d(page);
  await page.waitForTimeout(2600);
  await shake(page, { onClock: true });
  await expect.poll(() => dangles(page, 'spider')).toBe(1);
  await page.clock.fastForward(11_500); // left alone (the page's clock, run on at once: its timers, not its every frame)
  await expect.poll(() => dangles(page)).toBe(0);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
});

/** A point low on a tree's trunk (`box('trunk', id)`, `fy` of the way down) the finger reaches: a tap there is the
 *  tree's (`pick`: a goal tree's, or the fruit row lying over its base: off a fallen fruit, the row's tap counts toward
 *  a shake as the trunk's does; a plain tree's), nothing in front of it. */
const trunkOf = (page: Page, id: string, fy = 0.85) =>
  page.evaluate(([id, fy]) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box('trunk', id)!, cx = b.left + b.width / 2;
    for (let y = b.top + b.height * fy; y > b.top; y -= 3)
      for (const dx of [0, -6, 6, -12, 12]) {
        const p = w.pick(cx + dx, y);
        if (p?.id === id && ['goal', 'row', 'tree'].includes(p.kind)) return { x: cx + dx, y, w: b.width };
      }
    return null;
  }, [id, fy] as const);

test('a goal tree’s trunk and base answer a tap as its leaves do: the popup opens, a quick run shakes it', async ({ page }) => {
  await open(page, '&shake=branch');
  const p = (await trunkOf(page, 'A'))!;
  expect(p).not.toBeNull();
  expect(p.w).toBeGreaterThanOrEqual(44);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('.detail')).toBeVisible();
  await page.waitForTimeout(1300);
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect.poll(() => drops(page, 'branch'), { timeout: 3000 }).toBe(1);
});

test('a plain tree’s trunk and base shake it on three quick taps (≥ 44px wide); one only rustles', async ({ page }) => {
  await open(page, '&shake=branch');
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(380));
  await page.waitForTimeout(500);
  const p = (await trunkOf(page, 'oak-m1'))!;
  expect(p).not.toBeNull();
  expect(p.w).toBeGreaterThanOrEqual(44);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(1400);
  expect(await drops(page, 'branch')).toBe(0);
  const home = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
  const t0 = await pageNow(page);
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(120);
  }
  await expect.poll(() => drops(page, 'branch', 'oak-m1'), { timeout: 3000 }).toBe(1);
  // a tap on the tree is no walk
  expect(await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine())).toEqual(home);
  expect(await fxSince(page, 'ring', t0)).toBe(0);
});
