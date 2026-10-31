// The ずかん (docs/design.md "Zukan"): in きろく, every fish, bug, fossil and shell; the found ones with their icon, name
// and first find (shared between us), silhouettes and ？？？ for the rest.
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { BUGS } from '../src/lib/components/island/critters.ts';

test.use({ viewport: { width: 390, height: 844 } });
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

test('a netted butterfly appears in the ずかん with who found it and when; the rest are silhouettes', async ({ page }) => {
  await page.goto('?demo&date=2026-07-04T12:00&critter=common-butterfly');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(2200);
  const b = (await page.locator('[data-critter="common-butterfly"]').boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('[data-fx="catch"]')).toBeAttached();
  await ribbon(page).click();
  const row = page.locator('[data-zukan="bug"]');
  await expect(row).toContainText(`1 / ${Object.keys(BUGS).length}`);
  await expect(page.locator('[data-zukan="fish"]')).toContainText('0 / 33');
  await expect(page.locator('[data-zukan="fossil"]')).toContainText('0 / 32');
  await expect(page.locator('[data-zukan="shell"]')).toContainText('0 / 7');
  await row.click();
  await expect(page.locator('.tile.unknown')).toHaveCount(Object.keys(BUGS).length - 1);
  await page.locator('button.tile[data-entry="common-butterfly"]').click();
  const detail = page.locator('[data-zukan-detail="common-butterfly"]');
  await expect(detail).toContainText('モンシロチョウ');
  await expect(detail).toContainText('7/4 ウェイが 見つけた');
  await expect(detail.locator('.line')).toHaveText(CATCH_LINES['common-butterfly'][0].replace(/\s+/g, ' '));
  // the silhouettes' icons load lazily
  expect(await page.locator('.tile.unknown img').first().getAttribute('loading')).toBe('lazy');
});
