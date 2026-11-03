// Saying something (docs/design.md "Villager taps"): only my own words, no presets. Shared by say.spec.ts,
// say-rooms.spec.ts and sync-harness.spec.ts.
import { expect, type Page } from '@playwright/test';

/** Open the picker and write `text` (straight on the field when nothing's kept yet, else through じぶんで かく…), Enter
 *  sends; the picker is closed when this returns. */
export async function sayOwn(page: Page, text: string) {
  await page.getByRole('button', { name: 'ひとこと いう' }).click();
  const picker = page.getByRole('dialog', { name: 'なにを いう？' });
  await expect(picker).toBeVisible();
  const field = picker.locator('[data-say-field]');
  if (!(await field.count())) await picker.getByRole('button', { name: 'じぶんで かく…' }).click();
  await expect(field).toBeFocused();
  await field.fill(text);
  await field.press('Enter');
  await expect(picker).toHaveCount(0);
}
