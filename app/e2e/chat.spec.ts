// Villager taps (docs/design.md "Villager taps"): a tap on my villager squishes it, nothing more (no Talk balloon, no
// sheet, no picker: the phrases open from the say button, e2e/say.spec.ts); a tap on the partner is a high-five (no
// card, no balloon: e2e/demo.spec.ts). No ベル.
import { expect, test } from './fixtures.ts';
import { quiet } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';


test('a tap on my villager: its squish, no balloon of its own, no picker, no sheet, no ベル', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a transient pose or effect (a squish, a sparkle) over before a software-GL frame shows it' } }, async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  const bells = await hudBells(page).getAttribute('aria-label');
  await quiet(page); // the opening beats are over
  for (let i = 0; i < 3; i++) {
    await page.locator('.vil').first().click();
    await expect(page.locator('[data-actor="mine"] .body[data-act="squish"]')).toBeAttached();
    await page.waitForTimeout(400);
    await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator('[data-say-picker]')).toHaveCount(0);
  }
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});
