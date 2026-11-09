// けんこう's goals with no Health data yet (design.md "Kenkou"), in the gate set: a new couple's popup has every card
// with its goal, saying there's nothing yet, and a goal set from it sticks. The rest of the popup: health.spec.ts.
import { expect, test, type Page } from './fixtures.ts';

const sheet = (page: Page) => page.locator('dialog[open]');

async function openHealth(page: Page, query: string) {
  await page.clock.install({ time: new Date('2026-10-31T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto(query);
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
}

test('no Health data yet (a new couple): every card is there with its goal, saying so; the goals set from it', async ({ page }) => {
  await openHealth(page, '?demo&health=none');
  const cards = sheet(page).locator('.health section.card');
  await expect(cards.locator('h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
  await expect(cards.locator('[data-health-empty]')).toHaveCount(4);
  await expect(cards.locator('[data-health-empty]').first()).toHaveText('まだ記録がありません');
  await expect(sheet(page).locator('.health svg[role=img]')).toHaveCount(0); // no empty charts
  const steps = sheet(page).locator('button[data-goal=steps-goal]');
  await expect(steps).toHaveText(/8,000歩\s以上/);
  await steps.click();
  await sheet(page).locator('#goal-steps-goal [data-goal-step="1"]').click();
  await sheet(page).locator('#goal-steps-goal button[type=submit]').click();
  await expect(steps).toHaveText(/8,500歩\s以上/);
  await sheet(page).locator('[data-group=body]').click();
  await expect(cards.locator('[data-health-empty]')).toHaveCount(4);
  await expect(sheet(page).locator('button[data-goal=weight-goal]')).toHaveText(/66\.0\skg\s前後/); // the demo's goal, kept without a weigh-in
  await expect(sheet(page).locator('button[data-goal=body_fat_pct-goal]')).toBeVisible();
});
