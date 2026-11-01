// The rolling-log spike (/roll, src/routes/roll): one depth order for everything (a villager behind a tree is hidden by
// it, just in front of it covers the trunk while the canopy covers their head, the museum likewise), taps land on
// transformed sprites right up at the horizon, the camera follows the native scroller, and nothing runs when still.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type Roll = { setWalker(x: number, z: number): void; idle(): boolean; cam(): number; horizon(): number };
const roll = (page: Page) => page.waitForFunction(() => (window as unknown as { __roll?: Roll }).__roll);

async function open(page: Page, cam: number) {
  await page.goto(`roll?demo&still&cam=${cam}`);
  await roll(page);
  await page.waitForTimeout(300);
}
/** Put the walker at (x, z) and say who is on top at a point of it (fy: 0 its head … 1 its feet). */
async function topAt(page: Page, x: number, z: number, fy: number) {
  await page.evaluate(([x, z]) => (window as unknown as { __roll: Roll }).__roll.setWalker(x, z), [x, z]);
  await page.waitForTimeout(120);
  const r = (await page.locator('[data-walker] .hit').boundingBox())!;
  return page.evaluate(([px, py]) => {
    const e = document.elementFromPoint(px, py)?.closest<HTMLElement>('[data-id]');
    return e ? `${e.dataset.id}:${e.dataset.part}` : null;
  }, [r.x + r.width / 2, r.y + r.height * fy]);
}

test('a villager behind a tree is hidden by it; just in front, it covers the trunk and the canopy covers its head', async ({ page }) => {
  await open(page, 1820);
  expect(await topAt(page, 66, 1850, 0.5)).toMatch(/^back-a:/);
  expect(await topAt(page, 66, 1802, 0.9)).toBe('raymond:body');
  expect(await topAt(page, 66, 1802, 0.12)).toBe('back-a:canopy');
  expect(await topAt(page, 66, 1760, 0.12)).toBe('raymond:body');
  // the other tree, from the other side
  expect(await topAt(page, 324, 1850, 0.5)).toMatch(/^back-b:/);
  expect(await topAt(page, 324, 1802, 0.9)).toBe('raymond:body');
});

test('behind the museum it is hidden, in front of it it covers it', async ({ page }) => {
  await open(page, 1820);
  expect(await topAt(page, 195, 1960, 0.7)).toBe('museum:body');
  expect(await topAt(page, 195, 1880, 0.4)).toBe('raymond:body');
});

test('walking re-sorts continuously: its z-index follows its feet', async ({ page }) => {
  await open(page, 1820);
  await page.evaluate(() => (window as unknown as { __roll: Roll & { walk(on: boolean): void } }).__roll.walk(true));
  const zs = new Set<string>();
  for (let i = 0; i < 6; i++) {
    zs.add(await page.locator('[data-walker]').evaluate((e) => (e as HTMLElement).style.zIndex));
    await page.waitForTimeout(250);
  }
  expect(zs.size).toBeGreaterThan(3);
});

test('a tap on a sprite near the horizon lands on it (hit-testing follows the transforms)', async ({ page }) => {
  await open(page, 300);
  const hz = await page.evaluate(() => (window as unknown as { __roll: Roll }).__roll.horizon());
  // the visible sprite whose feet are nearest the horizon, still mostly opaque
  const target = await page.evaluate((hz) => {
    let best: { id: string; x: number; y: number; d: number } | null = null;
    for (const s of document.querySelectorAll<HTMLElement>('.spr[data-z]')) {
      if (s.style.display === 'none' || Number(s.style.opacity || 1) < 0.4) continue;
      const hit = s.querySelector<HTMLElement>('.hit')!;
      const r = hit.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height * 0.3;
      if (document.elementFromPoint(x, y)?.closest('.hit') !== hit) continue;
      const d = Math.abs(r.bottom - hz);
      if (!best || d < best.d) best = { id: hit.dataset.id!, x, y, d };
    }
    return best;
  }, hz);
  expect(target).not.toBeNull();
  expect(target!.d).toBeLessThan(60);
  await page.touchscreen.tap(target!.x, target!.y);
  await expect(page.locator('[data-taps]')).toContainText(target!.id);
});

test('the camera follows the scroller, and nothing runs once it stops', async ({ page }) => {
  await open(page, 300);
  expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= innerHeight)).toBe(true);
  const before = await page.locator('.spr[data-z]').first().evaluate((e) => (e as HTMLElement).style.transform);
  await page.locator('[data-roll-scroller]').evaluate((e) => e.scrollBy(0, -500));
  await page.waitForTimeout(400);
  const cam = await page.evaluate(() => (window as unknown as { __roll: Roll }).__roll.cam());
  expect(cam).toBeGreaterThan(700);
  expect(await page.locator('.spr[data-z]').first().evaluate((e) => (e as HTMLElement).style.transform)).not.toBe(before);
  expect(await page.evaluate(() => (window as unknown as { __roll: Roll }).__roll.idle())).toBe(true);
});
