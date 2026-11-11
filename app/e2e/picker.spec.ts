// すがた's むらびと tab (docs/players.md "The tabs"): the stage and the tabs stay put and the search field is held at
// the top of the panel while the roster's heads scroll under it, on a small phone too, and with the on-screen keyboard
// up (iOS: --kb; Android: a shorter screen): the stage is a 76 px strip then. A pick swaps the stage; nothing is sent
// until the level is left.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { ROSTER } from '../src/lib/villagers/roster.ts';

const sheet = (page: Page) => page.locator('dialog[open]');

async function openPicker(page: Page) {
  await page.goto('?demo');
  await fromMenu(page, 'settings');
  await sheet(page).locator('[data-push=look]').click();
  await sheet(page).locator('[data-look-tab=villager]').click();
  await expect(sheet(page).getByRole('radio')).toHaveCount(Object.keys(ROSTER).length);
  // the level's slide-in done (it moves the head sideways)
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
}

/** The panel: the grid's scroller. */
const grid = (page: Page) => sheet(page).locator('.look .panel');

test('the search is pinned: scrolling the grid to the end keeps it (and the tabs) in place, the stage compact, and the last head clears the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openPicker(page);
  const search = sheet(page).getByRole('searchbox');
  const tabs = sheet(page).locator('[role=tablist]');
  await grid(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect.poll(() => grid(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(5000);
  await expect(sheet(page).locator('[data-look-stage=compact]')).toBeVisible();
  await page.waitForTimeout(500); // the stage's ease
  await expect(search).toBeInViewport({ ratio: 1 });
  await expect(tabs).toBeInViewport({ ratio: 1 });
  // the search sits right under the tabs, the grid gets most of the screen
  const s = (await search.boundingBox())!, t = (await tabs.boundingBox())!;
  expect(s.y).toBeGreaterThanOrEqual(t.y + t.height);
  expect(s.y - (t.y + t.height)).toBeLessThan(24);
  const g = (await grid(page).boundingBox())!;
  expect(g.height).toBeGreaterThan(667 * 0.45);
  // the panel body itself never scrolled
  expect(await sheet(page).locator('.panel-body').evaluate((el) => el.scrollTop)).toBe(0);
  const last = sheet(page).getByRole('radio').last();
  await expect(last).toBeInViewport({ ratio: 1 });
  // the search still works from down here, and its first result is in view
  await search.fill('しずえ');
  await expect(sheet(page).getByRole('radio')).toHaveCount(1);
  await expect(sheet(page).getByRole('radio', { name: 'しずえ' })).toBeInViewport({ ratio: 1 });
});

test('with the keyboard up the stage is a strip and the search stays whole: iOS (--kb, the screen unchanged) and Android (a shorter screen)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openPicker(page);
  const search = sheet(page).getByRole('searchbox');
  await search.focus();
  await expect(sheet(page).locator('[data-look-stage=strip]')).toBeVisible();
  // iOS: the keyboard covers the bottom 300px; the last head can still scroll above it
  await sheet(page).evaluate((d) => d.style.setProperty('--kb', '300px'));
  await expect.poll(async () => {
    await grid(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
    const last = (await sheet(page).getByRole('radio').last().boundingBox())!;
    return last.y + last.height;
  }).toBeLessThanOrEqual(667 - 300);
  await expect(search).toBeInViewport({ ratio: 1 });
  // Android: the screen itself shrinks
  await sheet(page).evaluate((d) => d.style.removeProperty('--kb'));
  await page.setViewportSize({ width: 375, height: 380 });
  await page.waitForTimeout(400); // keyboardInset's scroll-into-view
  await expect(search).toBeInViewport({ ratio: 1 });
  await expect(sheet(page).locator('.titlebar .back')).toBeInViewport({ ratio: 1 });
  const s = (await search.boundingBox())!;
  const g = (await grid(page).boundingBox())!;
  // the search heads the panel; under it, room for the heads
  expect(s.y).toBeGreaterThanOrEqual(g.y);
  expect(g.y + g.height - (s.y + s.height)).toBeGreaterThan(60);
});

test('iPhone 15 with the search typed in: the stage is a strip and the first row of heads is above the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await openPicker(page);
  const search = sheet(page).getByRole('searchbox');
  await search.focus();
  await sheet(page).evaluate((d) => d.style.setProperty('--kb', '336px'));
  await search.fill('ジュ');
  await page.waitForTimeout(400);
  const first = (await sheet(page).getByRole('radio').first().boundingBox())!;
  expect(first.y + first.height).toBeLessThanOrEqual(852 - 336);
  const st = (await sheet(page).locator('[data-look-stage]').boundingBox())!;
  expect(st.height).toBeLessThanOrEqual(80);
});

test('heads load as they near the view: opening fetches about a screenful, not the roster', async ({ page }) => {
  await openPicker(page);
  await page.waitForTimeout(500);
  const loaded = await sheet(page).locator('.rv img[src]').count();
  expect(loaded).toBeGreaterThan(10); // the stage and the tabs above: about three rows show
  expect(loaded).toBeLessThan(120);
  await grid(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect(sheet(page).getByRole('radio').last().locator('img')).toHaveAttribute('src', /-icon\.webp$/);
});

// (its chip was once called .chip, and theme.css's shared choice chip's 0 12px padding squeezed every icon to 27x48)
test('every head is square, the icon at 86% of its round chip (as <Avatar>)', async ({ page }) => {
  await openPicker(page);
  const heads = await sheet(page).locator('.rv img').evaluateAll((imgs) => imgs.map((img) => {
    const b = img.getBoundingClientRect(), r = img.closest('.rv')!.getBoundingClientRect();
    return { w: b.width, h: b.height, s: r.width };
  }));
  expect(heads.length).toBeGreaterThan(20);
  for (const { w, h, s } of heads) {
    expect(Math.abs(w / h - 1)).toBeLessThan(0.05);
    expect(w / s).toBeCloseTo(0.86, 1);
  }
});
