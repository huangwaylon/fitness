// Shaking a tree (docs/design.md "Shaking a tree"): one tap still opens the popup; a quick run of taps shakes the tree.
// A shake may drop a branch (a tap picks it up), a bagworm or a spider dangling on its thread (a tap nets it) or, rarely,
// a wasp nest: its wasps charge the villager on that side; a tap on them in time nets one (NH's catch line), else they
// sting (a fright and a sweat drop). `?shake=nest|branch|bagworm|spider` forces the next shake's drop. Nothing changes ベル.
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
/** A point of the left tree's canopy the finger reaches (its middle, else the nearest part the popup leaves open). */
const canopyAt = (page: Page) =>
  page.locator('button.canopy').first().evaluate((el) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    for (let d = 0; d < b.height / 2; d += 4)
      for (const [dx, dy] of [[0, d], [0, -d], [d, 0], [-d, 0], [d, d], [-d, d]])
        if (document.elementFromPoint(cx + dx, cy + dy)?.closest('button.canopy') === el) return { x: cx + dx, y: cy + dy };
    return { x: cx, y: cy };
  });
async function shake(page: Page) {
  for (let i = 0; i < 3; i++) {
    const c = await canopyAt(page);
    await page.mouse.click(c.x, c.y);
    await page.waitForTimeout(120);
  }
}

test('one tap opens the popup and drops nothing; two close it; the third quick tap shakes the tree', async ({ page }) => {
  await open(page, '&shake=nest');
  let c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.locator('.detail')).toBeVisible();
  await page.waitForTimeout(1300); // a run has to be quick: this starts over
  c = await canopyAt(page);
  await page.mouse.click(c.x, c.y);
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
  await expect(page.locator('[data-stung]')).toHaveCount(0);
  await expect(page.locator('[data-nest]')).toHaveCount(0); // the nest goes once the wasps are out
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
  // the shared day keeps the nest (one per tree an hour, on both phones): my tree's
  const day = JSON.parse((await page.evaluate(() => localStorage.getItem('island-demo.world.A')))!) as { events: { kind: string; tree?: string; drop?: string }[] };
  expect(day.events).toContainEqual(expect.objectContaining({ kind: 'shake', tree: 'goal-A', drop: 'nest' }));
});

test('too late: the wasps sting the villager on that side (a fright and a sweat drop) and fly off', async ({ page }) => {
  await open(page, '&shake=nest');
  await shake(page);
  await expect(page.locator('button[data-swarm]')).toBeVisible({ timeout: 2000 });
  // the left tree's wasps go for the villager on the left, at its face where it stands
  await expect(page.locator('[data-actor="mine"][data-stung]')).toHaveCount(1, { timeout: 2500 });
  const v = (await page.locator('[data-actor="mine"] .vil').boundingBox())!, w = (await page.locator('button[data-swarm]').boundingBox())!;
  expect(Math.abs(w.x + w.width / 2 - (v.x + v.width / 2))).toBeLessThan(v.width);
  expect(await cues(page)).toContain('scene-sting');
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

test('a shake drops a bagworm on its thread beside the trunk; a tap nets it (NH’s line, a ずかん find, no ベル)', async ({ page }) => {
  await open(page, '&shake=bagworm');
  const bells = await ribbon(page).getAttribute('aria-label');
  await shake(page);
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
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
});

test('at night a spider can dangle instead; left alone it climbs back up into the tree', async ({ page }) => {
  test.setTimeout(40_000);
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-11-04T22:00&shake=spider');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(2600);
  await shake(page);
  await expect(page.locator('[data-dangle="spider"]')).toBeAttached();
  await page.waitForTimeout(11_500);
  await expect(page.locator('[data-dangle]')).toHaveCount(0);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
});
