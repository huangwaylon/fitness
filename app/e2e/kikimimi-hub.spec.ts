// ききみみ's hub and its one stack (docs/kikimimi-ux.md §5, §6.1, §6.2, §6.4, §6.5): the sheet opens on the hub (しずえ,
// today's card, the four tiles, ⚙); あそぶ lists the playable modes by situation; a mode's page has its settings and
// さそう / はじめる; ‹ pops one page, a backdrop tap or Esc too, ✕ closes from any page; さそう pushes みんなで with my
// lobby shared, and ‹ from it cancels it (the invite gone from B's island). B's さんか lands on みんなで over the hub, and
// ‹ leaves A's lobby for B's own hub. Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/ux/. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, toMode } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = '/tmp/kikimimi-shots/ux';

async function open(page: Page, as: 'A' | 'B' = 'A') {
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
}
/** A screenshot (KIKI_SHOTS=1) once しずえ's line has typed out and the page's chunk is in. */
async function snap(p: Page, name: string) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  // (the sheet's grow-in done: no finite animation left running inside the dialog)
  await expect.poll(() => p.evaluate(() => document.getAnimations().filter((x) => {
    const e = x.effect as KeyframeEffect | null;
    return x.playState === 'running' && e?.getTiming().iterations !== Infinity && !!(e?.target as Element | null)?.closest('dialog');
  }).length)).toBe(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}
const title = (p: Page) => p.locator('dialog[open] .navbar h2');

test('the hub, あそぶ, a mode’s page, きろく and せってい: ‹ pops one, Esc pops, ✕ closes from any page', async ({ page }) => {
  await open(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await expect(title(page)).toHaveText('ききみみ');
  // the four tiles, each with its live line; ⚙ in ‹'s place
  await expect(sheet(page).locator('[data-kiki-tile]')).toHaveCount(4);
  await expect(sheet(page).locator('[data-kiki-tile="together"] small')).toHaveText('ひとりでもOK');
  await expect(page.locator('dialog[open] [data-kiki-gear]')).toBeVisible();
  // today's menu: おさらい (the demo's misses due), きょうの いっぽ (the path's current unit), きまぐれ; one green button
  await expect(sheet(page).locator('[data-kiki-card]')).toHaveCount(3);
  await expect(sheet(page).locator('[data-kiki-card="review"]')).toContainText('選びました');
  await expect(sheet(page).locator('[data-kiki-card-go]:not(.paper)')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-ok-line]')).toHaveText('1つで今日はOK。残りはおまけです');
  await snap(page, 'hub');

  // あそぶ: the modes by situation, only the playable ones (おさらい: the demo's A has played)
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await expect(title(page)).toHaveText('遊ぶ');
  await expect(sheet(page).locator('[data-kiki-group="quick"] [data-kiki-mode-tile]')).toHaveText([/ひとこと クイズ/, /スピード はしご/, /おさらい/, /ことば タイル/]);
  await expect(sheet(page).locator('[data-kiki-group="scene"] [data-kiki-mode-tile]')).toHaveText([/アナウンス/, /ようじ でんわ/, /たちぎき/]);
  await snap(page, 'asobu');

  // ひとこと クイズ's page: the ばしょ row (はまべ's two steps), こたえる じかん, さそう / はじめる
  await sheet(page).locator('[data-kiki-mode-tile="quiz"]').click();
  await expect(title(page)).toHaveText('ひとこと クイズ');
  await expect(sheet(page).locator('[data-stage="hama"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-stage="kawa"]').click();
  await expect(sheet(page).locator('[data-stage="kawa"]')).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __kiki: { view(): { lv: number } } }).__kiki.view().lv)).toBe(3);
  await expect(sheet(page).locator('[data-level="1"]')).toHaveCount(0);
  await sheet(page).locator('[data-stage="hama"]').click();
  await expect(sheet(page).locator('[data-level="1"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-start]')).toHaveText('始める');
  await expect(sheet(page).locator('[data-kiki-invite-all]')).toHaveText('誘う');
  await snap(page, 'mode-quiz');

  // ‹ back to あそぶ, Esc back to the hub
  await page.locator('dialog[open] .navbar .back').click();
  await expect(title(page)).toHaveText('遊ぶ');
  await page.keyboard.press('Escape');
  await atHub(page);

  // スピード はしご's page and アナウンス's (the quiz's level 5)
  await toMode(page, 'ladder');
  await expect(sheet(page).locator('[data-kiki-ladder-about]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __kiki: { view(): { ladder: boolean } } }).__kiki.view().ladder)).toBe(true);
  await snap(page, 'mode-ladder');
  await page.locator('dialog[open] .navbar .back').click();
  await sheet(page).locator('[data-kiki-mode-tile="announce"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __kiki: { view(): { lv: number; ladder: boolean } } }).__kiki.view())).toMatchObject({ lv: 5, ladder: false });
  await snap(page, 'mode-announce');
  // (a second Esc with no tap between is the browser's to close: Chromium's close watcher)
  await page.keyboard.press('Escape');
  await expect(title(page)).toHaveText('遊ぶ');
  await page.locator('dialog[open] .navbar .back').click();
  await atHub(page);

  // きろく (the demo's games), せってい (the sound check)
  await sheet(page).locator('[data-kiki-tile="record"]').click();
  await expect(title(page)).toHaveText('記録');
  await snap(page, 'record');
  await page.locator('dialog[open] .navbar .back').click();
  await atHub(page);
  await page.locator('dialog[open] [data-kiki-gear]').click();
  await expect(title(page)).toHaveText('設定');
  await expect(sheet(page).locator('[data-kiki-test]')).toBeVisible();
  // こんしゅうの めあて 3 by default, 5 kept; にほんごやく みない; おとを 1だいに まとめる on for my lobby
  await expect(sheet(page).locator('[data-goal="3"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-goal="5"]').click();
  expect(await page.evaluate(() => localStorage.getItem('island.kikiWeekGoal'))).toBe('5');
  await sheet(page).locator('[data-ja="never"]').click();
  await expect(sheet(page)).toHaveAttribute('data-kiki-ja', 'never');
  await sheet(page).locator('[data-kiki-set-same]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __kiki: { view(): { same: boolean } } }).__kiki.view().same)).toBe(true);
  await snap(page, 'settings');
  // the hub's week card: the days against 5, the couple quest's minutes together (one bar, no names)
  await page.locator('dialog[open] .navbar .back').click();
  const card = sheet(page).locator('[data-kiki-week-card]');
  await expect(card).toHaveAttribute('data-kiki-week-goal', '5');
  await expect(card.locator('[data-kiki-day]')).toHaveCount(7);
  await expect(card.locator('[data-kiki-quest]')).toContainText('ふたりで');
  await expect(card).not.toContainText('うめ');
  await card.scrollIntoViewIfNeeded();
  await snap(page, 'hub-week');
  await page.locator('dialog[open] [data-kiki-gear]').click();

  // ✕ from a page closes the sheet; the next opening is the hub again
  await page.locator('dialog[open] .navbar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
});

test('a menu card plays at once (きまぐれ: its mode); ✕ asks first, やめる closes', async ({ page }) => {
  test.slow();
  await open(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await sheet(page).locator('[data-kiki-card-go="whim"]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  // ✕ asks 「ここでやめますか？」; やめる leaves the game
  await page.locator('dialog[open] .navbar .close').click();
  await expect(page.getByRole('dialog', { name: 'ここでやめますか？' })).toBeVisible();
  await page.locator('dialog[open] [data-action="kiki-quit"]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('みんなで: さそう shares my lobby; B’s さんか lands on みんなで; ‹ leaves it (B) and cancels it (A)', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, 'B');
  await a.bringToFront();
  await fromMenu(a, 'kikimimi');
  await atHub(a);
  await a.locator('dialog[open] [data-kiki-tile="together"]').click();
  await expect(title(a)).toHaveText('みんなで');
  await expect(sheet(a).locator('[data-kiki-vs]')).toHaveAttribute('data-kiki-vs', 'coop');
  await snap(a, 'lobby-alone');
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect(sheet(b)).toHaveAttribute('data-kiki-at', 'lobby');
  await expect(title(b)).toHaveText('みんなで');
  await expect(sheet(b).locator('.wait')).toContainText('始めるのを待っています');
  await snap(b, 'lobby-joined');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'here');
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）');
  await snap(a, 'lobby-shared');
  // ✕ with B in my lobby asks first; the question's ✕ keeps it
  await a.locator('dialog[open] .navbar .close').click();
  const ask = a.getByRole('dialog', { name: '部屋を閉じますか？' });
  await expect(ask).toContainText('みんなの部屋がなくなります');
  await ask.locator('.navbar .close').click();
  await expect(ask).toHaveCount(0);
  // B's ‹: A's lobby left, B's own hub
  await b.bringToFront();
  await b.locator('dialog[open] .navbar .back').click();
  await atHub(b);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'away');
  // A's ‹: the lobby cancelled, kept alone again at the hub
  await a.locator('dialog[open] .navbar .back').click();
  await atHub(a);
  await expect.poll(() => a.evaluate(() => (window as unknown as { __kiki: { view(): { local: boolean } } }).__kiki.view().local)).toBe(true);
  await ctx.close();
});
