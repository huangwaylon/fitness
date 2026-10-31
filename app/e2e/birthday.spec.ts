// Birthdays (docs/design.md "Birthdays"): on one of ours (config: ウェイ Oct 6, うめ Mar 4) NH's birthday hats on both
// villagers, the cake by the centre stage (a tap: its music box, the candles out for the day), confetti the first
// time the island opens, しずえ's line; an NH villager's own birthday puts the hat on that villager and a line in its
// chats. Nothing over a control; no ベル.
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
  test(`うめ's birthday: hats, the cake clear of every control, confetti and しずえ's wishes (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
    await page.goto('?demo&date=2027-03-04T12:00&critter=none');
    await expect(ribbon(page)).toBeVisible();
    const bells = await ribbon(page).getAttribute('aria-label');
    await expect(page.locator('.vil [data-hat]')).toHaveCount(2);
    await expect(page.locator('[data-cake="lit"] .official')).toBeVisible();
    expect(await under(page, '[data-cake] .official')).toEqual([]);
    await expect(page.locator('.fxa.confetti').first()).toBeAttached({ timeout: 4000 });
    await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
    // the cake: a music box, and the candles out for the day
    await tapOn(page, '[data-cake] .official');
    await expect(page.locator('[data-cake="out"]')).toBeAttached();
    expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('birthday-cake');
    await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
    await page.reload();
    await expect(ribbon(page)).toBeVisible();
    await expect(page.locator('[data-cake="out"]')).toBeAttached({ timeout: 4000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('.fxa.confetti')).toHaveCount(0); // once a day
  });

test('ウェイ’s birthday too; none the day after; an NH villager’s own birthday: its hat and its line', async ({ page }) => {
  await page.goto('?demo&date=2026-10-06T12:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('.vil [data-hat]')).toHaveCount(2);
  await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
  await page.goto('?demo&date=2026-10-07T12:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('.vil [data-hat]')).toHaveCount(0);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
  await expect(page.locator('.news')).toHaveCount(0);
  // Goldie (my villager in the demo) was born on Dec 27
  await page.goto('?demo&date=2026-12-27T12:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('.vil [data-hat]')).toHaveCount(1);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
  await page.locator('.vil').first().click();
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('たんじょうび', { timeout: 4000 });
});
