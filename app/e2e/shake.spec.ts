// Shaking a tree (docs/design.md "Shaking a tree"): one tap still opens the popup; a quick run of taps shakes the tree.
// A shake may drop a branch (a tap picks it up), a bagworm or a spider dangling on its thread (a tap nets it) or, rarely,
// a wasp nest: its wasps charge the villager on that side; a tap on them in time nets one (NH's catch line), else they
// sting (a fright, a sweat drop and NH's swollen eye on the villager's own eye). `?shake=nest|branch|bagworm|spider`
// forces the next shake's drop (`wood`: a piece of wood, into my pocket for the shop). Nothing changes ベル.
import { expect, test, type Page } from './fixtures.ts';
import { canopyAt, is3d, islandUp, quiet, shakeTree as shake } from './island.ts';
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
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
test('one tap opens the popup and drops nothing; two close it; the third quick tap shakes the tree', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  let c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.locator('.detail')).toBeVisible();
  await page.waitForTimeout(1300); // a run has to be quick: this starts over
  c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('[data-nest]')).toHaveCount(0);
  await shake(page, { onClock: true });
  await expect(page.locator('.detail')).toHaveCount(0); // the shake closes it
  await expect(page.locator('[data-nest]')).toHaveCount(1);
  expect(await cues(page)).toContain('tree-shake');
});

test('a nest falls; its wasps charge my villager; a tap in time nets one: NH’s line, no sting, no ベル', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  const bells = await hudBells(page).getAttribute('aria-label');
  await shake(page, { onClock: true });
  await expect(page.locator('[data-nest]')).toHaveCount(1);
  const swarm = page.locator('button[data-swarm]');
  await expect(swarm).toBeVisible({ timeout: 2000 });
  await expect(swarm).toHaveAttribute('data-sfx', 'self');
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-nest', 'scene-buzz']));
  const b = (await swarm.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('[data-fx="catch"]')).toContainText('ハチを つかまえた！', { timeout: 3000 });
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await expect(swarm).toHaveCount(0);
  await page.waitForTimeout(1800);
  await expect(page.locator('[data-stung]')).toHaveCount(0);
  await expect(page.locator('[data-nest]')).toHaveCount(0); // the nest goes once the wasps are out
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  // the shared day keeps the nest (one per tree an hour, on both phones): my tree's
  const day = JSON.parse((await page.evaluate(() => localStorage.getItem('island-demo.world.A')))!) as { events: { kind: string; tree?: string; drop?: string }[] };
  expect(day.events).toContainEqual(expect.objectContaining({ kind: 'shake', tree: 'goal-A', drop: 'nest' }));
});

test('too late: the wasps sting the villager on that side (a fright, a sweat drop, the swollen eye) and fly off', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  await shake(page, { onClock: true });
  await expect(page.locator('button[data-swarm]')).toBeVisible({ timeout: 2000 });
  // the left tree's wasps go for the villager on the left, at its face where it stands
  await expect(page.locator('[data-actor="mine"][data-stung]')).toHaveCount(1, { timeout: 2500 });
  // (both boxes at one moment: the swarm flies off after the sting, and read a round trip apart it had moved on)
  const [v, w] = await page.evaluate(() => ['[data-actor="mine"] .vil', 'button[data-swarm]'].map((s) => document.querySelector(s)!.getBoundingClientRect().toJSON() as DOMRect));
  expect(Math.abs(w.x + w.width / 2 - (v.x + v.width / 2))).toBeLessThan(v.width);
  expect(await cues(page)).toContain('scene-sting');
  await expect(page.locator('button[data-swarm]')).toHaveCount(0, { timeout: 2000 });
  // NH's swollen eye (the 3D villager's own: the next test), and it stays after the fright
  await expect(page.locator('[data-actor="mine"] [data-swollen]')).toHaveCount(1);
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-actor="mine"] [data-stung]')).toHaveCount(0);
  await expect(page.locator('[data-actor="partner"] [data-swollen]')).toHaveCount(0);
});

test('stung on the 3D island: the swollen eye is the 3D villager’s own (its lump on its head), no 2D lump over its head', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=nest');
  await is3d(page);
  const v3 = (fn: string) => page.evaluate(`(${fn})(window.__villagers3)`);
  // my villager in 3D (its model in)
  await expect.poll(() => v3('(v) => v.state("mine")'), { timeout: 30_000 }).not.toBeNull();
  await shake(page, { onClock: true });
  await expect(page.locator('[data-actor="mine"][data-stung]')).toHaveCount(1, { timeout: 4000 });
  await expect.poll(() => v3('(v) => v.stung("mine")'), { timeout: 3000 }).toBe(true);
  // the 2D render's lump never shows over the 3D villager
  const lump2d = () => page.locator('[data-actor="mine"] [data-swollen]').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
  await expect.poll(lump2d).toEqual(['0']);
  // still swollen once the fright and the sweat drop are over (the minute's), the 2D lump still hidden
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-actor="mine"] [data-stung]')).toHaveCount(0);
  expect(await v3('(v) => v.stung("mine")')).toBe(true);
  expect(await lump2d()).toEqual(['0']);
  await expect.poll(() => v3('(v) => v.stung("partner")')).toBe(false);
});

test('a shaken branch lies beside the trunk until a tap picks it up', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=branch');
  await shake(page, { onClock: true });
  const twig = page.locator('button[data-branch]');
  await expect(twig).toHaveCount(1);
  await expect(twig).toHaveAttribute('aria-label', '木のえだを ひろう');
  await page.waitForTimeout(700);
  await twig.click();
  await expect(twig).toHaveCount(0);
  expect(await cues(page)).toContain('scene-twig');
  await expect(page.locator('.detail')).toHaveCount(0);
});

test('no piles: while its branch lies under it, a tree’s shakes only rustle it (no wood, no bug, no nest, no second branch)', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=branch');
  await shake(page, { onClock: true });
  const twig = page.locator('button[data-branch]');
  await expect(twig).toHaveCount(1);
  for (let i = 0; i < 4; i++) {
    await page.clock.runFor(1300); // (a new run of taps)
    await shake(page, { onClock: true });
  }
  await page.clock.runFor(900); // (what would fall has fallen)
  await expect(twig).toHaveCount(1);
  await expect(page.locator('button[data-wood], [data-dangle], [data-nest], [data-swarm]')).toHaveCount(0);
});

test('a shake knocks out a piece of wood; picked up, it is in my pocket’s しげん at the shop and sells for かいがら', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=wood');
  await shake(page, { onClock: true });
  const wood = page.locator('button[data-wood]');
  await expect(wood).toHaveCount(1);
  await expect(wood).toHaveAttribute('aria-label', 'もくざいを ひろう');
  const what = (await wood.getAttribute('data-wood'))!;
  await page.waitForTimeout(700);
  await wood.click();
  await expect(wood).toHaveCount(0);
  await expect(page.locator('.detail')).toHaveCount(0);
  await page.goto('shop?demo&date=2026-11-04T12:00');
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
  await expect(page.locator('[data-dangle="bagworm"]')).toBeAttached();
  const btn = page.locator('button[data-dangler="bagworm"]');
  await expect(btn).toHaveAttribute('data-sfx', 'self');
  await expect(btn).toHaveAttribute('aria-label', 'むしを つかまえる');
  await page.waitForTimeout(700); // down its thread
  // its tap target is its own: clear of the canopy and the fruit row
  const b = (await btn.boundingBox())!;
  const under = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('data-dangler'), { x: b.x + b.width / 2, y: b.y + b.height / 2 });
  expect(under).toBe('bagworm');
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('[data-fx="catch"]')).toContainText('ミノムシを つかまえた！', { timeout: 3000 });
  await expect(page.locator('[data-dangle]')).toHaveCount(0);
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
  await expect(page.locator('[data-dangle="spider"]')).toBeAttached();
  await page.clock.fastForward(11_500); // left alone (the page's clock, run on at once: its timers, not its every frame)
  await expect(page.locator('[data-dangle]')).toHaveCount(0);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
});

/** A point low on a tap area (its base, `fy` of the way down) the finger reaches: nothing in front of it there. */
const baseOf = (page: Page, sel: string, fy = 0.85) =>
  page.locator(sel).first().evaluate((el, fy) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2;
    for (let y = b.top + b.height * fy; y > b.top; y -= 3)
      for (const dx of [0, -6, 6, -12, 12])
        if (document.elementFromPoint(cx + dx, y) === el) return { x: cx + dx, y, w: b.width };
    return null;
  }, fy);

/** A point low on the goal tree's trunk (`fy` of the way down) the finger reaches: the trunk's own button or the fruit
 *  row lying over its base (off a fallen fruit, the row's tap counts toward a shake as the trunk's does). */
const trunkOf = (page: Page, who: string, fy = 0.85) =>
  page.locator(`[data-tree-node="${who}"] .trunk-btn`).evaluate((el, [who, fy]) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2;
    const row = document.querySelector(`[data-tree-row="${who}"]`);
    for (let y = b.top + b.height * (fy as number); y > b.top; y -= 3)
      for (const dx of [0, -6, 6, -12, 12]) {
        const at = document.elementFromPoint(cx + dx, y);
        if (at === el || at === row) return { x: cx + dx, y, w: b.width };
      }
    return null;
  }, [who, fy] as const);

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
  await expect(page.locator('button[data-branch]')).toHaveCount(1, { timeout: 3000 });
});

test('a plain tree’s trunk and base shake it on three quick taps (≥ 44px wide); one only rustles', async ({ page }) => {
  await open(page, '&shake=branch');
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(380));
  await page.waitForTimeout(500);
  const sel = '[data-tree="oak-m1"][data-tree-part="trunk"]';
  const p = (await baseOf(page, sel))!;
  expect(p).not.toBeNull();
  expect(p.w).toBeGreaterThanOrEqual(44);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(1400);
  await expect(page.locator('button[data-branch]')).toHaveCount(0);
  const home = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('button[data-branch="oak-m1"]')).toHaveCount(1, { timeout: 3000 });
  // a tap on the tree is no walk
  expect(await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine())).toEqual(home);
  await expect(page.locator('.tap-ring')).toHaveCount(0);
});
