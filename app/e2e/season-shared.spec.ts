// 設定 → 季節 is the whole island's (docs/design.md "Seasonal look"; `pref seasonLook`, `pref weatherMode`): what one
// phone forces (the guest's too) shows on every phone at once, and anyone's 自動に戻す sets it back everywhere. Two
// paired phones on the relay's real room and record in the test's process (e2e/liveRoom.ts), the clock pinned
// (2026-11-04 12:00 Tokyo: autumn, day), read by state (<html>'s data-season / data-tod / data-foliage, the scene's sky).
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { newIsland } from './liveRoom.ts';
import { fromMenu } from './hud.ts';

type Island = ReturnType<typeof newIsland>;

async function phone(browser: Browser, island: Island, who: 'A' | 'G') {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.pair(context, who);
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page, { timeout: 20_000 });
  await expect.poll(() => island.sockets(who), { timeout: 10_000 }).toBe(1);
  return page;
}

/** 設定's 季節, unfolded. */
async function season(page: Page) {
  await fromMenu(page, 'settings');
  const tg = page.locator('dialog[open] [data-preview-toggle]');
  await tg.scrollIntoViewIfNeeded();
  if ((await tg.getAttribute('aria-expanded')) !== 'true') await tg.click();
  await expect(tg).toHaveAttribute('aria-expanded', 'true');
}

const html = (p: Page) => p.locator('html');

test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

test("the guest forces winter, snow and night: the member's phone shows it at once; the member's 自動に戻す is the real day on both", async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const a = await phone(browser, island, 'A');
  const g = await phone(browser, island, 'G');
  for (const p of [a, g]) {
    await expect(html(p)).toHaveAttribute('data-season', 'autumn');
    await expect(html(p)).toHaveAttribute('data-tod', 'day');
  }

  await season(g);
  for (const w of ['season:winter', 'weather:snow', 'tod:night']) {
    const b = g.locator(`[data-preview="${w}"]`);
    await b.scrollIntoViewIfNeeded();
    await b.click();
    await expect(b).toHaveAttribute('aria-checked', 'true');
  }
  await expect(g.locator('[data-preview-summary]')).toHaveText('冬 · 雪 · 夜');

  // the member's phone, untouched: the island's look, live
  await expect(html(a)).toHaveAttribute('data-season', 'winter');
  await expect(html(a)).toHaveAttribute('data-foliage', 'snow');
  await expect(html(a)).toHaveAttribute('data-tod', 'night');
  await expect(a.locator('.if-scene')).toHaveAttribute('data-sky', 'snow');
  await season(a);
  await expect(a.locator('[data-preview-summary]')).toHaveText('冬 · 雪 · 夜');
  await expect(a.locator('[data-preview="tod:night"]')).toHaveAttribute('aria-checked', 'true');

  await a.locator('[data-preview-reset]').click();
  await expect(a.locator('[data-preview-summary]')).toHaveText('自動');
  await expect(a.locator('[data-preview-reset]')).toHaveCount(0);
  for (const p of [a, g]) {
    await expect(html(p)).toHaveAttribute('data-season', 'autumn');
    await expect(html(p)).toHaveAttribute('data-tod', 'day');
  }
  await expect(g.locator('[data-preview-summary]')).toHaveText('自動');
  await expect(g.locator('[data-preview="season:auto"]')).toHaveAttribute('aria-checked', 'true');
});
