// Scenery taps (docs/design/scene-interactions.md): the bushes, flowers, grass, sea, sun and clouds answer a tap with a
// short flourish, and nothing else: no sheet, no navigation, no ベル. The trees, the villagers and the jar still work.
import { expect, test, type Page } from '@playwright/test';

/** The demo usually opens on しずえ's question: answer it until the check-in shows. */
async function answerPending(page: Page) {
  const checkin = page.locator('.below > .btn');
  const yes = page.getByRole('button', { name: 'はい', exact: true });
  await expect(checkin.or(yes).first()).toBeVisible();
  for (let i = 0; i < 5 && !(await checkin.isVisible()); i++) {
    if (await yes.isVisible()) await yes.click();
    await page.waitForTimeout(300);
  }
  await expect(checkin).toBeVisible();
}

/** Stage units (390 × 360, scene.ts) → page px. */
const stagePoint = (page: Page, ux: number, uy: number) =>
  page.locator('.if-scene .stage').evaluate((st, [x, y]) => {
    const r = st.getBoundingClientRect();
    return { x: r.left + (x * r.width) / 390, y: r.top + (y * r.width) / 390 };
  }, [ux, uy]);

/** The open sea just under the horizon (the scene's --horizon-y, which can sit above the stage's own). */
const openSea = (page: Page) =>
  page.locator('.if-scene .stage').evaluate((st) => {
    const cs = getComputedStyle(st);
    const r = st.getBoundingClientRect();
    return { x: r.left + r.width * 0.7, y: r.top + parseFloat(cs.getPropertyValue('--if-hy')) - parseFloat(cs.getPropertyValue('--if-st')) + 14 };
  });

const centre = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });

test('scenery taps play a flourish and change nothing; trees, villagers and the jar still work', async ({ page }) => {
  await page.goto('?demo');
  await answerPending(page);
  const ribbon = page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
  const jar = page.locator('.if-scene .jar');
  const bells = await ribbon.getAttribute('aria-label');
  const pot = await jar.getAttribute('aria-label');
  const url = page.url();

  const taps: [string, () => Promise<{ x: number; y: number }>, string][] = [
    ['bush', () => stagePoint(page, 195, 58), 'bush'],
    ['flower', () => stagePoint(page, 63, 283), 'flower'],
    ['grass', () => stagePoint(page, 195, 228), 'grass'],
    ['sea', () => openSea(page), 'splash'],
    ['sun', () => centre(page, '.if-scene .orb'), 'sun']
  ];
  for (const [name, at, fx] of taps) {
    const { x, y } = await at();
    await page.mouse.click(x, y);
    await expect(page.locator(`[data-fx="${fx}"]`), name).toHaveCount(1);
    await expect(page.locator('dialog[open]'), name).toHaveCount(0);
  }
  // a flourish is gone within ~1 s, and nothing else moved
  await expect(page.locator('[data-fx]')).toHaveCount(0, { timeout: 2500 });
  expect(page.url()).toBe(url);
  await expect(ribbon).toHaveAttribute('aria-label', bells!);
  await expect(jar).toHaveAttribute('aria-label', pot!);

  // the trees: a canopy tap opens its popup; a tap on the scenery then only closes it (no flourish)
  await page.locator('button.canopy').first().click();
  await expect(page.locator('.detail')).toHaveCount(1);
  const g = await stagePoint(page, 195, 228);
  await page.mouse.click(g.x, g.y);
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('[data-fx]')).toHaveCount(0);

  // my villager opens 今夜のチェック
  await page.locator('.if-scene button.vil').first().click();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);

  // the jar is still the doorway to ふたりの壺
  await jar.click();
  await expect(page).toHaveURL(/\/jar/);
});
