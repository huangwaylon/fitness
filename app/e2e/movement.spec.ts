// Walking (docs/design.md "Walking"): my villager walks to what I tap and does it there (tool in hand), holds up a catch,
// stays a moment and wanders home; the partner's wanders between points of interest with footsteps under it. Neither
// ends up over a control, mine stays a thumb-sized button while it walks, and a sheet stops them where they are.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function open(page: Page, q = '') {
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(800); // the opening beats
}
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
      if (actor.contains(b)) return [];
      const r = b.getBoundingClientRect();
      const hit = r.width && me.x0 < r.right && r.left < me.x1 && me.y0 < r.bottom && r.top < me.y1;
      return hit ? [b.className.split(' ')[0]] : [];
    });
  }, id);

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`a tap on a weed: my villager walks there, then pulls it; it never stands over a control (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await open(page);
    const home = await feet(page);
    const weeds = page.locator('[data-care="weed"]');
    const n = await weeds.count();
    const p = await centre(page, '[data-care="weed"]', 1);
    await page.mouse.click(p.x, p.y - 4);
    // under way: walking, the weed still there, the villager still a ≥ 44px button
    await expect(page.locator('[data-actor="mine"].walking')).toBeAttached();
    await expect(weeds).toHaveCount(n);
    const btn = await page.locator('[data-actor="mine"] .vil').boundingBox();
    expect(Math.min(btn!.width, btn!.height)).toBeGreaterThanOrEqual(44);
    // there: pulled, standing beside it, over no control
    await expect(weeds).toHaveCount(n - 1, { timeout: 2000 });
    await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
    const there = await feet(page);
    expect(Math.hypot(there.x - home.x, there.y - home.y)).toBeGreaterThan(20);
    expect(Math.hypot(there.x - p.x, there.y - p.y)).toBeLessThan(60);
    expect(await overlaps(page)).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`weed-${w}.png`) });
    // a moment later it wanders home
    await expect.poll(async () => { const f = await feet(page); return Math.round(Math.hypot(f.x - home.x, f.y - home.y)); }, { timeout: 12_000 }).toBeLessThan(2);
  });

test('a second tap re-targets the walk from where the villager is', async ({ page }) => {
  await open(page);
  const a = await centre(page, '[data-care="weed"]', 1), b = await centre(page, '[data-care="weed"]', 0);
  await page.mouse.click(a.x, a.y - 4);
  await page.waitForTimeout(150);
  await page.mouse.click(b.x, b.y - 4);
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0, { timeout: 2000 });
  const f = await feet(page);
  expect(Math.hypot(f.x - b.x, f.y - b.y)).toBeLessThan(60);
  expect(await overlaps(page)).toEqual([]);
});

test('a netted bug holds still until the swing (net in hand when my villager walks over); the catch is held up while the plate reads', async ({ page }) => {
  await open(page, '&critter=common-butterfly');
  const bug = page.locator('[data-critter="common-butterfly"]');
  await expect(bug).toBeAttached();
  await page.waitForTimeout(1600); // it has flown in
  // note every tool that comes out (it's in hand for the swing only)
  await page.evaluate(() => {
    const w = window as { __tools?: string[] };
    w.__tools = [];
    new MutationObserver(() => document.querySelectorAll<HTMLElement>('[data-tool]').forEach((t) => w.__tools!.push(t.dataset.tool!))).observe(document.body, { subtree: true, childList: true });
  });
  const p = await centre(page, '[data-critter="common-butterfly"]');
  await page.mouse.click(p.x, p.y);
  // held still where it was until the swing lands (the walk is ≥ 150 ms)
  const still = await page.evaluate(() => {
    const el = document.querySelector('[data-critter="common-butterfly"]')!;
    const at = () => JSON.stringify(el.getBoundingClientRect());
    const a = at();
    return new Promise<boolean>((done) => setTimeout(() => done(!el.isConnected || at() === a), 100));
  });
  expect(still).toBe(true);
  // the net: in my villager's hand when it could walk there (a bug in my bed), else swung where the bug is as before
  const swing = await page.locator('[data-net]').getAttribute('data-net', { timeout: 2000 });
  const tools = await page.evaluate(() => (window as { __tools?: string[] }).__tools);
  if (swing === 'held') expect(tools).toContain('net');
  else expect(tools).not.toContain('net');
  const held = page.locator('[data-actor="mine"] [data-holding="critters/common-butterfly"]');
  await expect(held).toBeVisible({ timeout: 3000 });
  await expect(page.locator('.catch-plate')).toBeVisible();
  // the plate keeps clear of the held-up catch and the villager
  const plate = (await page.locator('.catch-plate').boundingBox())!, item = (await held.boundingBox())!;
  expect(plate.y + plate.height <= item.y || item.y + item.height <= plate.y || plate.x + plate.width <= item.x || item.x + item.width <= plate.x).toBe(true);
  await page.screenshot({ path: test.info().outputPath('holdup.png') });
});

test('a sheet stops the walk where it is', async ({ page }) => {
  await open(page);
  const p = await centre(page, '[data-care="weed"]', 1);
  await page.mouse.click(p.x, p.y - 4);
  await page.waitForTimeout(120);
  await ribbon(page).click();
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
    await expect(ribbon(page)).toBeVisible();
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
  await expect(page.locator('[data-actor="partner"].walking')).toBeAttached({ timeout: 6000 });
  await ribbon(page).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  const n = await footsteps(page);
  const a = await feet(page, 'partner');
  await page.waitForTimeout(1500);
  expect(await feet(page, 'partner')).toEqual(a);
  expect(await footsteps(page)).toBe(n);
});

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`a visitor: my villager walks over to talk and stands beside them, never in front (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('?demo&date=2026-11-04T12:00&visitor=jingle&critter=none');
    await expect(ribbon(page)).toBeVisible();
    await page.waitForTimeout(800);
    const v = await centre(page, '[data-visitor="jingle"] .art');
    await page.mouse.click(v.x, v.y);
    await expect(page.locator('[data-fx="talk"].placed')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
    // their middle is still theirs: no villager of mine under it
    const onTop = await page.evaluate(({ x, y }) => document.elementsFromPoint(x, y).some((e) => e.closest('[data-actor="mine"]')), v);
    expect(onTop).toBe(false);
    expect(await overlaps(page)).toEqual([]);
  });
