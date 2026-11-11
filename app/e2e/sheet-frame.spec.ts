// The full-height sheets' frame (ui/Sheet.svelte: top, pop, full): the screen's height, edge to edge, its corners square,
// so no island shows in a rounded corner over Safari's bottom bar (farm/shop r5: けんこう, 設定, ずかん, ききみみ and the
// panel were rounded at the bottom).
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, openKenkou } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const frame = (page: Page) =>
  page.locator('dialog[open]').evaluate((d) => {
    const r = d.getBoundingClientRect(), s = getComputedStyle(d);
    return { top: r.top, bottom: r.bottom - innerHeight, left: r.left, right: r.right - innerWidth,
      radii: [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius].join(' ') };
  });

test('every full-height sheet fills the screen, its corners square', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  const open = {
    health: () => openKenkou(page, 'health'),
    bells: () => fromMenu(page, 'bells'),
    settings: () => fromMenu(page, 'settings'),
    zukan: () => fromMenu(page, 'zukan'),
    kikimimi: () => fromMenu(page, 'kikimimi'),
    travel: () => fromMenu(page, 'travel')
  };
  for (const [name, go] of Object.entries(open)) {
    await go();
    expect(await frame(page), name).toEqual({ top: 0, bottom: 0, left: 0, right: 0, radii: '0px 0px 0px 0px' });
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
});
