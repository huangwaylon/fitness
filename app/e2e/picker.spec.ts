// The むらびと picker: its head (my villager, the name and search fields) stays put while the 440 heads scroll under
// it, on a small phone too, and with the on-screen keyboard up (iOS: --kb; Android: a shorter screen).
import { expect, test, type Page } from '@playwright/test';

const sheet = (page: Page) => page.locator('dialog[open]');

async function openPicker(page: Page) {
  await page.goto('?demo');
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await sheet(page).locator('.tab[data-tab=settings]').click();
  await sheet(page).locator('[data-push=villager]').click();
  await expect(sheet(page).getByRole('radio')).toHaveCount(440);
  // the level's slide-in done (it moves the head sideways)
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
}

/** The grid's own scroller and the search field's box. */
const grid = (page: Page) => sheet(page).locator('.picker .scroll');

test('the head is pinned: scrolling the grid to the end moves neither the search nor the render, and the last head clears the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openPicker(page);
  const search = sheet(page).getByRole('searchbox');
  const before = await search.boundingBox();
  // the grid gets most of the screen
  const g = (await grid(page).boundingBox())!;
  expect(g.height).toBeGreaterThan(667 * 0.6);
  await grid(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect.poll(() => grid(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(5000);
  expect(await search.boundingBox()).toEqual(before);
  await expect(sheet(page).locator('.pv')).toBeInViewport();
  // the panel body itself never scrolled
  expect(await sheet(page).locator('.panel-body').evaluate((el) => el.scrollTop)).toBe(0);
  const last = sheet(page).getByRole('radio').last();
  await expect(last).toBeInViewport({ ratio: 1 });
  // the search still works from down here, and its first result is in view
  await search.fill('しずえ');
  await expect(sheet(page).getByRole('radio')).toHaveCount(1);
  await expect(sheet(page).getByRole('radio', { name: 'しずえ' })).toBeInViewport({ ratio: 1 });
});

test('with the keyboard up the head stays whole: iOS (--kb, the screen unchanged) and Android (a shorter screen)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openPicker(page);
  const search = sheet(page).getByRole('searchbox');
  await search.focus();
  // iOS: the keyboard covers the bottom 300px; the last head can still scroll above it
  await sheet(page).evaluate((d) => d.style.setProperty('--kb', '300px'));
  await grid(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  const last = (await sheet(page).getByRole('radio').last().boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(667 - 300);
  await expect(search).toBeInViewport({ ratio: 1 });
  // Android: the screen itself shrinks
  await sheet(page).evaluate((d) => d.style.removeProperty('--kb'));
  await page.setViewportSize({ width: 375, height: 380 });
  await page.waitForTimeout(400); // keyboardInset's scroll-into-view
  await expect(search).toBeInViewport({ ratio: 1 });
  await expect(sheet(page).locator('.titlebar .back')).toBeInViewport({ ratio: 1 });
  const s = (await search.boundingBox())!;
  const g = (await grid(page).boundingBox())!;
  expect(g.y).toBeGreaterThanOrEqual(s.y + s.height);
  expect(g.height).toBeGreaterThan(60);
});

test('heads load as they near the view: opening fetches about a screenful, not the roster', async ({ page }) => {
  await openPicker(page);
  await page.waitForTimeout(500);
  const loaded = await sheet(page).locator('.rv img[src]').count();
  expect(loaded).toBeGreaterThan(20);
  expect(loaded).toBeLessThan(120);
  await grid(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect(sheet(page).getByRole('radio').last().locator('img')).toHaveAttribute('src', /-icon\.webp$/);
});
