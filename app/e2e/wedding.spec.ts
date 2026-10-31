// The wedding countdown (docs/design.md "Wedding countdown"): on the milestone days before 2027-10-08 Reese and Cyrus
// visit the centre stage with a heart float and count down; on the day, confetti, the wedding pose and fireworks at
// night; every June Sunday NH's wedding arch stands behind the centre stage. Nothing over a control; no ベル.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button')).map((e) => e.className));
  }, sel);
async function tapOn(page: Page, sel: string) {
  const r = (await page.locator(sel).first().boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`100 days to go: Reese and Cyrus on the centre stage under their heart float, counting down (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('?demo&date=2027-06-30T12:00&critter=none');
    await expect(ribbon(page)).toBeVisible();
    const bells = await ribbon(page).getAttribute('aria-label');
    const pair = page.locator('[data-visitor="reese"]');
    await expect(pair.locator('.art')).toBeVisible();
    await expect(pair).toHaveAttribute('data-stage', 'true');
    await expect(pair.locator('[data-heart-float]')).toBeVisible();
    expect(await under(page, '[data-visitor="reese"] .art')).toEqual([]);
    await tapOn(page, '[data-visitor="reese"] .art');
    const box = page.locator('[data-fx="talk"].placed');
    await expect(box.locator('.who')).toHaveText('リサ', { timeout: 4000 });
    await expect(page.locator('[data-fx="talk"] .sr')).toContainText('けっこんしき まで あと 100日！');
    await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
  });

test('no countdown the day before; the arch on a June Sunday, clear of every control', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('?demo&date=2027-06-29T12:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.locator('[data-visitor="reese"]')).toHaveCount(0);
  await expect(page.locator('[data-arch]')).toHaveCount(0);
  await page.goto('?demo&date=2027-06-27T12:00&critter=none');
  await expect(page.locator('[data-arch] .official')).toBeVisible();
  expect(await under(page, '[data-arch] .official')).toEqual([]);
});

test('the wedding day: confetti and hearts on the villagers, Reese’s congratulations, fireworks at night', async ({ page }) => {
  await page.goto('?demo&date=2027-10-08T20:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('.fxa.confetti').first()).toBeAttached({ timeout: 4000 });
  await expect(page.locator('.fxa.hearts').first()).toBeAttached();
  await expect(page.locator('.sky .burst')).toBeAttached();
  await tapOn(page, '[data-visitor="reese"] .art');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ごけっこん おめでとう', { timeout: 4000 });
  // the confetti once a day on this phone; the hearts every time
  await page.reload();
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('.fxa.hearts').first()).toBeAttached({ timeout: 4000 });
  await expect(page.locator('.fxa.confetti')).toHaveCount(0);
});
