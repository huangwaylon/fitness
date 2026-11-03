// Walking (docs/design.md "Walking"): only a tap on empty ground walks my villager; a tap on something to do acts in
// place (my villager turns to it, the tool shows at the target) and a catch is its plate, my villager where it stood; the partner's
// wanders between points of interest with footsteps under it. Neither ends up over a control, mine stays a
// thumb-sized button while it walks, and a sheet stops them where they are.
import { expect, test, type Page } from '@playwright/test';
import { openNear, plateOnly, quiet } from './island.ts';

const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });
async function open(page: Page, q = '') {
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await expect(hudJar(page)).toBeVisible();
  await quiet(page); // the opening beats are over
}
/** A world point on screen (client px). */
const at = (page: Page, x: number, z: number) =>
  page.evaluate(([x, z]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z), [x, z] as const);
/** My villager's feet (client px), from its actor's live transform. */
const feet = (page: Page, id = 'mine') =>
  page.locator(`[data-actor="${id}"]`).evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    const s = el.parentElement!.getBoundingClientRect();
    return { x: s.left + m.m41, y: s.top + m.m42 };
  });
const centre = (page: Page, sel: string, n = 0) =>
  page.locator(sel).nth(n).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
/** Controls the standing figure (≈ 0.45 × 0.92 of its height above the feet) overlaps: none, ever. */
const overlaps = (page: Page, id = 'mine') =>
  page.evaluate((id) => {
    const actor = document.querySelector<HTMLElement>(`[data-actor="${id}"]`)!;
    const fig = actor.querySelector('.villager')!.getBoundingClientRect();
    const m = new DOMMatrixReadOnly(getComputedStyle(actor).transform), s = actor.parentElement!.getBoundingClientRect();
    const x = s.left + m.m41, y = s.top + m.m42, h = fig.height;
    const me = { x0: x - h * 0.225, x1: x + h * 0.225, y0: y - h * 0.92, y1: y };
    return [...document.querySelectorAll('button')].flatMap((b) => {
      // (a world node out of view keeps its last box: not on screen, not a control there)
      if (actor.contains(b) || !b.checkVisibility({ visibilityProperty: true })) return [];
      const r = b.getBoundingClientRect();
      const hit = r.width && me.x0 < r.right && r.left < me.x1 && me.y0 < r.bottom && r.top < me.y1;
      return hit ? [b.className.split(' ')[0]] : [];
    });
  }, id);

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`a tap on a weed pulls it where it is: my villager stays put (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await open(page);
    const weeds = page.locator('[data-care="weed"]');
    // the lawn runs on up to the campsite: the camera half way up it, then the weed nearest the screen's middle
    await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(300));
    // (the camera there and the island at rest: the weeds where they're drawn)
    await expect.poll(() => page.evaluate(() => {
      const w = window as unknown as { __world: { idle(): boolean }; __world3d?: { camStill(): boolean } };
      const w2 = window as unknown as { __world: { cam(): number } };
      return Math.abs(w2.__world.cam() - 300) < 1 && (w.__world3d ? w.__world3d.camStill() : w.__world.idle());
    })).toBe(true);
    const p = await page.locator('[data-care="weed"]').evaluateAll((els) => els.filter((el) => el.checkVisibility({ visibilityProperty: true })).map((el) => [el, el.getBoundingClientRect()] as const)
      .map(([el, r]) => ({ uid: (el as HTMLElement).dataset.uid, x: r.left + r.width / 2, y: r.top + r.height / 2 })).filter((q) => q.y > 150 && q.y < innerHeight - 30)
      // (nothing else's tap area over it: a flower, a tree, a dig spot beside it)
      .filter((q) => !document.elementFromPoint(q.x, q.y - 4)?.closest('button, [data-flower], [data-tree], [data-bush], [data-fixture], [data-find], [data-visitor], [data-actor]'))
      .sort((a, b) => Math.abs(a.y - innerHeight * 0.5) - Math.abs(b.y - innerHeight * 0.5))[0]);
    const mine = () => page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
    const at0 = await mine();
    await page.mouse.click(p.x, p.y - 4);
    // pulled at once (that one: another may come into view as the island settles), nobody walked
    await expect(weeds.and(page.locator(`[data-uid="${p.uid}"]`))).toHaveCount(0, { timeout: 3000 });
    await page.waitForTimeout(400);
    await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
    // (where it stands on the island: the camera may still ease a px or two on the long island)
    const at1 = await mine();
    expect(Math.hypot(at1[0] - at0[0], at1[1] - at0[1])).toBeLessThan(1);
    await page.screenshot({ path: test.info().outputPath(`weed-${w}.png`) });
  });

test('a tap on the ground walks there, never over a control, a thumb-sized button on the way; a second tap re-targets the walk from where the villager is', async ({ page }) => {
  await open(page);
  const home = await feet(page);
  // (open ground there a tap walks to, nothing over it on this screen)
  const pa = await openNear(page, 210, 290, 45, true), pb = await openNear(page, 175, 185, 45, true);
  const a = await at(page, ...pa), b = await at(page, ...pb);
  await page.mouse.click(a[0], a[1]);
  await expect(page.locator('[data-actor="mine"].walking')).toBeAttached();
  const btn = await page.locator('[data-actor="mine"] .vil').boundingBox();
  expect(Math.min(btn!.width, btn!.height)).toBeGreaterThanOrEqual(44);
  await page.waitForTimeout(150);
  await page.mouse.click(b[0], b[1]);
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0, { timeout: 4000 });
  const f = await feet(page);
  expect(Math.hypot(f.x - home.x, f.y - home.y)).toBeGreaterThan(20);
  expect(Math.hypot(f.x - b[0], f.y - b[1])).toBeLessThan(12);
  expect(await overlaps(page)).toEqual([]);
});

test('a netted bug holds still under the net, swung where it is (no walk); the catch is its plate, flown in from the bug, nothing over the head', async ({ page }) => {
  await open(page, '&critter=common-butterfly');
  const bug = page.locator('[data-critter="common-butterfly"]');
  await expect(bug).toBeAttached();
  await page.waitForTimeout(1600); // it has flown in
  const home = await feet(page);
  const p = await centre(page, '[data-critter="common-butterfly"]');
  await page.mouse.click(p.x, p.y);
  // held still where it was under the net
  const still = await page.evaluate(() => {
    const el = document.querySelector('[data-critter="common-butterfly"]')!;
    const at = () => JSON.stringify(el.getBoundingClientRect());
    const a = at();
    return new Promise<boolean>((done) => setTimeout(() => done(!el.isConnected || at() === a), 100));
  });
  expect(still).toBe(true);
  // the net floats and swings where the bug is; my villager stays where it stood
  await expect(page.locator('[data-net="float"]')).toBeAttached({ timeout: 2000 });
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
  // the plate in the bottom stack, its icon flown in from where the bug was; nothing over my villager's head
  const from = await plateOnly(page, 'critters/common-butterfly');
  expect(Math.hypot(from.x - p.x, from.y - p.y)).toBeLessThan(60);
  const f = await feet(page);
  expect(Math.hypot(f.x - home.x, f.y - home.y)).toBeLessThan(1); // where it stood
  await page.screenshot({ path: test.info().outputPath('catch.png') });
});

test('a sheet stops the walk where it is', async ({ page }) => {
  await open(page);
  const p = await at(page, 210, 290);
  await page.mouse.click(p[0], p[1]);
  await page.waitForTimeout(120);
  await hudJar(page).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  const a = await feet(page);
  await page.waitForTimeout(700);
  expect(await feet(page)).toEqual(a);
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
});

const footsteps = (page: Page) =>
  page.evaluate(() => ((window as { __cues?: string[] }).__cues ?? []).filter((c) => c.startsWith('footstep-')).length);

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`the partner wanders off to a point of interest and back, footsteps under it, never over a control (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
    await page.goto('?demo&date=2026-11-04T12:00&wander');
    // (the island up first: under CI's load the page takes more than 5 s; ?wander's outing starts 3.2 s after it)
    await expect(hudJar(page)).toBeVisible({ timeout: 15_000 });
    const home = await feet(page, 'partner');
    expect(await footsteps(page)).toBe(0);
    await expect(page.locator('[data-actor="partner"].walking')).toBeAttached({ timeout: 6000 });
    await expect.poll(() => footsteps(page)).toBeGreaterThan(0);
    await expect(page.locator('[data-actor="partner"].walking')).toHaveCount(0, { timeout: 8000 });
    const there = await feet(page, 'partner');
    expect(Math.hypot(there.x - home.x, there.y - home.y)).toBeGreaterThan(20);
    expect(await overlaps(page, 'partner')).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`wander-${w}.png`) });
    // an outing ends at home
    await expect.poll(async () => {
      const f = await feet(page, 'partner');
      return Math.round(Math.hypot(f.x - home.x, f.y - home.y));
    }, { timeout: 30_000 }).toBeLessThan(2);
  });

test('under a sheet the walkers stop and no footstep sounds', async ({ page }) => {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-11-04T12:00&wander');
  // (the island up first, as above: the 6 s for ?wander's outing count from there, not from the page's load)
  await expect(hudJar(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-actor="partner"].walking')).toBeAttached({ timeout: 6000 });
  await hudJar(page).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  const n = await footsteps(page);
  const a = await feet(page, 'partner');
  await page.waitForTimeout(1500);
  expect(await feet(page, 'partner')).toEqual(a);
  expect(await footsteps(page)).toBe(n);
});

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`a visitor: a tap and they speak, my villager turning to them where it stands (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('?demo&date=2026-11-04T12:00&visitor=jingle&critter=none');
    await expect(hudJar(page)).toBeVisible();
    await page.waitForTimeout(800);
    // a host stands on centre stage, the campsite's clearing (おく)
    await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(642));
    await page.waitForTimeout(400);
    const home = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
    const v = await centre(page, '[data-visitor="jingle"] .art');
    await page.mouse.click(v.x, v.y);
    await expect(page.locator('[data-fx="talk"].placed')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine())).toEqual(home);
  });
