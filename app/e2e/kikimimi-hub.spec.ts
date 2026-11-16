// ききみみ's hub and its one stack (docs/kikimimi.md "Navigation", "The hub", "あそぶ", "Mode detail"): the sheet opens on the hub (しずえ,
// today's card, the three tiles, ⚙); あそぶ lists the playable modes by situation; a mode's page has its settings and
// はじめる (solo only: no さそう); ‹ pops one page, a backdrop tap or Esc too, ✕ closes from any page. Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/ux/. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, toMode } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&kikimimi=fast';
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
  // two tiles (あそぶ, きろく), each with its line; ⚙ in ‹'s place; no menu cards, week card or しずえ
  await expect(sheet(page).locator('[data-kiki-tile]')).toHaveCount(2);
  await expect(page.locator('dialog[open] [data-kiki-gear]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-card], [data-kiki-week-card], [data-kiki-check-card]')).toHaveCount(0);
  await snap(page, 'hub');

  // あそぶ: the modes by situation, only the playable ones (おさらい: the demo's A has played)
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await expect(title(page)).toHaveText('遊ぶ');
  await expect(sheet(page).locator('[data-kiki-group="quick"] [data-kiki-mode-tile]')).toHaveText([/ひとこと クイズ/, /スピード はしご/, /おさらい/, /ことば タイル/, /すうじ ラッシュ/, /音の へんしん/]);
  await expect(sheet(page).locator('[data-kiki-group="scene"] [data-kiki-mode-tile]')).toHaveText([/アナウンス/, /ようじ でんわ/, /たちぎき/]);
  await snap(page, 'asobu');

  // ひとこと クイズ's page: the ばしょ row (はまべ's two steps), こたえる じかん, はじめる
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
  await expect(sheet(page).locator('[data-kiki-invite-all]')).toHaveCount(0);
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
  // にほんごやく みない; no めあて, みみ チェック or おとを 1だいに まとめる
  await sheet(page).locator('[data-ja="never"]').click();
  await expect(sheet(page)).toHaveAttribute('data-kiki-ja', 'never');
  await expect(sheet(page).locator('[data-goal], [data-kiki-set-check], [data-kiki-set-same]')).toHaveCount(0);
  await snap(page, 'settings');

  // ✕ from a page closes the sheet; the next opening is the hub again
  await page.locator('dialog[open] .navbar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
});
