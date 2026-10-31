// Villager chats (docs/design.md "Villager chats"): a tap on my villager hops (as before) and says a line in its NH
// personality in a speech balloon, clear of every control; a tap on the partner still opens their card. No ベル.
import { expect, test, type Page } from '@playwright/test';
import ja from '../src/lib/i18n/ja.json' with { type: 'json' };

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const lines = new Set(Object.entries(ja as Record<string, string>).filter(([k]) => k.startsWith('chat.')).map(([, v]) => v.replace(/\{n\}/, '')));

/** The controls under a box's corners and middle (none, for an overlay that keeps clear). */
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 3, b.top + 3], [b.right - 3, b.top + 3], [b.left + 3, b.bottom - 3], [b.right - 3, b.bottom - 3], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button, .ribbon-wrap') && !e.closest('[data-fx="talk"]')).map((e) => e.className));
  }, sel);

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`a tap on my villager says a line in a speech balloon, clear of every control (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('?demo&date=2026-11-04T12:00');
    await expect(ribbon(page)).toBeVisible();
    const bells = await ribbon(page).getAttribute('aria-label');
    await page.locator('.vil').first().click();
    const say = page.locator('[data-fx="talk"].placed');
    await expect(say).toBeVisible();
    await expect(say.locator('.who')).toHaveText('ウェイ');
    const text = (await say.locator('.sr').textContent())!;
    expect([...lines].some((l) => text.includes(l.trim().slice(0, 6)))).toBe(true);
    expect(await under(page, '[data-fx="talk"]')).toEqual([]);
    // another tap: another line (never the same twice in a row)
    await page.waitForTimeout(300);
    await page.locator('.vil').first().click();
    await expect(say.locator('.sr')).not.toHaveText(text);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
  });

test('a tap on the partner still opens their card (no balloon)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(ribbon(page)).toBeVisible();
  await page.locator('.vil').nth(1).click();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
});
