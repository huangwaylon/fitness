// 英語すごろく's invitation (docs/sugoroku.md "Online"): A starts a game for A and B on their own phones; B's phone
// shows the lasting banner on the island and over English Study's ホーム, 参加 goes straight into the game's screen;
// ✕ hides it for good (a reload too) and すごろく's tab still offers the game. Two phones: two tabs on the demo's local
// relay. WebKit with taps.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const banner = (p: Page) => p.locator('[data-sg-invite]');
const sheet = (p: Page) => p.locator('[data-sugoroku]');

/** Two phones on the island, A's (the page) and B's; A starts an online game for the two of them. */
async function started(page: Page, how: 'click' | 'tap'): Promise<Page> {
  const b = await page.context().newPage();
  await page.goto('?demo');
  await b.goto('?demo&as=B');
  await islandUp(page);
  await islandUp(b);
  await page.bringToFront();
  await fromMenu(page, 'english', how);
  await page.locator('dialog[open] [data-en-tab="game"]')[how]();
  await sheet(page).locator('[data-sg-new]')[how]();
  await sheet(page).locator('[data-sg-mode="online"]')[how]();
  await sheet(page).locator('[data-sg-start]')[how]();
  await expect(sheet(page).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '0');
  // (my own start: no invitation on A's phone)
  await expect(banner(page)).toHaveCount(0);
  await b.bringToFront();
  return b;
}

test('B sees the invitation on the island and in English Study, 参加 goes straight into the game', async ({ page }, info) => {
  const how = info.project.name === 'webkit' ? 'tap' : 'click';
  const b = await started(page, how);
  await expect(banner(b)).toBeVisible();
  await expect(banner(b)).toContainText('英語すごろくを始めました');
  // it stays over English Study's ホーム (inside its dialog)
  await fromMenu(b, 'english', how);
  await expect(b.locator('dialog[open] [data-english]')).toHaveAttribute('data-level', 'home');
  await expect(b.locator('dialog[open] [data-sg-invite]')).toBeVisible();
  await b.locator('[data-sg-invite-join]')[how]();
  await expect(b).toHaveURL(/\/sugoroku\?.*m=online/);
  await expect(sheet(b)).toHaveAttribute('data-level', 'play');
  await expect(sheet(b).locator('[data-sg-waiting]')).toBeVisible();
  await expect(banner(b)).toHaveCount(0);
});

test('✕ hides the invitation for good (a reload too); すごろく’s tab still offers the game', async ({ page }, info) => {
  const how = info.project.name === 'webkit' ? 'tap' : 'click';
  const b = await started(page, how);
  await expect(banner(b)).toBeVisible();
  await b.locator('[data-sg-invite-close]')[how]();
  await expect(banner(b)).toHaveCount(0);
  await b.reload();
  await islandUp(b);
  await fromMenu(b, 'english', how);
  await b.locator('dialog[open] [data-en-tab="game"]')[how]();
  const card = sheet(b).locator('[data-sg-online-card]');
  await expect(card).toBeVisible();
  await expect(banner(b)).toHaveCount(0);
  await card.locator('[data-sg-resume-online]')[how]();
  await expect(b).toHaveURL(/\/sugoroku\?.*m=online/);
  await expect(sheet(b)).toHaveAttribute('data-level', 'play');
});
