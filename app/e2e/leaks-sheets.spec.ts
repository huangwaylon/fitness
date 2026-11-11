// Memory let go of by the sheets (docs/ops/testing.md "Memory"; leaks.spec.ts has the scenes): what a sheet loads is
// let go of with it, and a kept sheet (ui-state/keptSheets.ts) goes when the page is hidden (an iOS app switch fires
// only visibilitychange, never pagehide). The JS heap after a forced GC (Chromium's CDP, hence @chromium).
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00&as=B&critter=none&visitor=none';

const islandUp = (page: Page) => page.waitForFunction(() => !!(window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });

/** The JS heap after three forced GCs (MB). */
async function heap(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  const { usedSize } = (await cdp.send('Runtime.getHeapUsage')) as { usedSize: number };
  await cdp.detach();
  return Math.round(usedSize / 1e4) / 100;
}

/** The page hidden (an iOS app switch: visibilitychange only), then shown again. */
const hideAndShow = (page: Page) => page.evaluate(() => {
  const vis = (s?: string) => {
    if (s) Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    else delete (document as { visibilityState?: string }).visibilityState;
    document.dispatchEvent(new Event('visibilitychange'));
  };
  vis('hidden');
  vis();
});

// ごはん's catalog (components/food/foodUi.ts holdFoodDb): a search (the catalog and the lazy products, ~15 MB), the
// sheet closed, the page hidden: the kept sheet let go, and the catalog and the pictures' index with it. Before
// (review 11/10 r2): the sheet kept through an app switch and the catalog for the page's life (23.1 → 37.0 MB after
// the hide); with the sheet let go, HealthSheet's bound ‹ and lead still held ごはん and its catalog (+15.2 MB).
test('ごはん searched, closed, the page hidden: the kept sheet and the food catalog let go of', { tag: '@chromium' }, async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  const kenkou = page.getByRole('button', { name: 'けんこう', exact: true });
  const food = page.locator('dialog [data-food-sheet]');
  // (the baseline: 健康 opened and closed, let go by a hide)
  await kenkou.click();
  await expect(page.locator('dialog[open] [data-kenkou-tab=health]')).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await hideAndShow(page);
  const base = await heap(page);
  await kenkou.click();
  await page.locator('dialog[open] [data-kenkou-tab=food]').click();
  await page.locator('dialog[open] [data-add=s]').click();
  await page.locator('dialog[open] [data-food-q]').fill('サラダチキン');
  await expect.poll(() => page.locator('dialog[open] [data-food-results] [data-brand]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  const searched = await heap(page);
  while (await page.locator('dialog[open]').count()) await page.keyboard.press('Escape');
  await expect(food, 'kept after the close').toHaveCount(1);
  await hideAndShow(page);
  await expect(food, 'let go on the hide').toHaveCount(0);
  const after = await heap(page);
  test.info().annotations.push({ type: 'memory', description: `JS heap ${base} → ${searched} (searching) → ${after} MB` });
  expect(searched - base, 'the catalog in while searching (MB): else this measures nothing').toBeGreaterThan(5);
  expect(after - base, 'JS heap after the hide over the baseline (MB)').toBeLessThan(2.5);
});
