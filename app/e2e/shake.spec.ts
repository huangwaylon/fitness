// Shaking a tree (docs/design.md "Shaking a tree"): one tap still opens the popup; a quick run of taps shakes the tree.
// A shake may drop a branch (a tap picks it up) or, rarely, a wasp nest: its wasps charge the villager on that side; a
// tap on them in time nets one (NH's catch line), else they sting (a puffy eye). `?shake=nest|branch` forces the next
// shake's drop. Nothing changes ベル.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function open(page: Page, q = '') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(2600); // the opening beats are over
}
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
async function shake(page: Page) {
  const c = (await page.locator('button.canopy').first().boundingBox())!;
  for (let i = 0; i < 3; i++) {
    await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
    await page.waitForTimeout(120);
  }
}

test('one tap opens the popup and drops nothing; two close it; the third quick tap shakes the tree', async ({ page }) => {
  await open(page, '&shake=nest');
  const c = (await page.locator('button.canopy').first().boundingBox())!;
  await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
  await expect(page.locator('.detail')).toBeVisible();
  await page.waitForTimeout(1300); // a run has to be quick: this starts over
  await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('[data-nest]')).toHaveCount(0);
  await shake(page);
  await expect(page.locator('.detail')).toHaveCount(0); // the shake closes it
  await expect(page.locator('[data-nest]')).toHaveCount(1);
  expect(await cues(page)).toContain('tree-shake');
});

test('a nest falls; its wasps charge my villager; a tap in time nets one: NH’s line, no sting, no ベル', async ({ page }) => {
  await open(page, '&shake=nest');
  const bells = await ribbon(page).getAttribute('aria-label');
  await shake(page);
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
  await expect(page.locator('[data-puffy]')).toHaveCount(0);
  await expect(page.locator('[data-nest]')).toHaveCount(0); // the nest goes once the wasps are out
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('tree-nest')))!)).toHaveProperty('A');
});

test('too late: the wasps sting the villager on that side (a fright and a puffy eye) and fly off', async ({ page }) => {
  await open(page, '&shake=nest');
  await shake(page);
  await expect(page.locator('button[data-swarm]')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('[data-puffy]')).toHaveCount(1, { timeout: 2500 });
  expect(await cues(page)).toContain('scene-sting');
  // the left tree's wasps go for the villager on the left
  const p = (await page.locator('[data-puffy]').boundingBox())!;
  expect(p.x + p.width / 2).toBeLessThan(195);
  await expect(page.locator('button[data-swarm]')).toHaveCount(0, { timeout: 2000 });
});

test('a shaken branch lies beside the trunk until a tap picks it up', async ({ page }) => {
  await open(page, '&shake=branch');
  await shake(page);
  const twig = page.locator('button[data-branch]');
  await expect(twig).toHaveCount(1);
  await expect(twig).toHaveAttribute('aria-label', '木のえだを ひろう');
  await page.waitForTimeout(700);
  await twig.click();
  await expect(twig).toHaveCount(0);
  expect(await cues(page)).toContain('scene-twig');
  await expect(page.locator('.detail')).toHaveCount(0);
});
