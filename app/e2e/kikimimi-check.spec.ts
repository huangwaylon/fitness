// ききみみ's first run and みみ チェック (docs/kikimimi-ux.md §6.12; curriculum §10): the guest (no games yet) opens the
// sheet on the welcome (しずえ's hello, the sound check), goes on into みみ チェック and answers it as a listener at もり
// (every item right but やま's and ほし's): the walk climbs from かわ, turns at やま and stops after its reversals, and
// the result says 「もりから はじめましょう！」 with its とくい / これから; the hub has no check card then, ひとこと クイズ's
// page opens at もり as おまかせ (a tap overrides it, 「おまかせに もどす」 brings it back), and せってい shows the place
// with 「みみ チェックを もういちど」. あとで instead: the hub with the check card, and the welcome never again. Screenshots
// (KIKI_SHOTS=1) into /tmp/kikimimi-shots/check/. The logic tier (Playwright's Chromium is muted: nothing is heard).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, toMode } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 }, kikiFirstRun: true });
const SHOTS = '/tmp/kikimimi-shots/check';
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';

type Kiki = { view(): { phase: string; i: number; n: number; gm: string | null }; right(): number; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

/** A screenshot (KIKI_SHOTS=1) once the sheet's animations are done (`settle` false: an answer's timer bar runs on). */
async function snap(p: Page, name: string, settle = true) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  if (settle) await expect.poll(() => p.evaluate(() => document.getAnimations().filter((x) => {
    const e = x.effect as KeyframeEffect | null;
    return x.playState === 'running' && e?.getTiming().iterations !== Infinity && !!(e?.target as Element | null)?.closest('dialog');
  }).length)).toBe(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}
/** The guest's phone on the demo: no ききみみ games yet. */
async function guest(page: Page) {
  await page.goto(`?demo&as=G&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
}
/** やま's and ほし's items (levels 6 and 7): the ones a listener at もり misses. */
const HARD = /^d?(ya|yb|vy|ho)-/;

test('the first run: welcome, the sound check, みみ チェック to its result; then おまかせ at the placed stage', async ({ page }) => {
  test.slow();
  await guest(page);
  await expect(sheet(page)).toHaveAttribute('data-kiki-at', 'welcome');
  await expect(sheet(page).locator('[data-kiki-step="1"]')).toBeVisible();
  await expect(page.locator('dialog[open] [data-kiki-gear]')).toHaveCount(0);
  await snap(page, 'welcome');
  await sheet(page).locator('[data-kiki-welcome-go]').click();
  await expect(sheet(page).locator('[data-kiki-step="2"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-test]')).toBeVisible(); // (never tapped: nothing plays)
  await snap(page, 'sound');
  await sheet(page).locator('[data-kiki-check-go]').click();

  // みみ チェック: from かわ, a round at a time, as a listener at もり; no points at a reveal
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('みみ チェック');
  const heard: string[] = [];
  for (let i = 0; i < 12; i++) {
    await expect(sheet(page)).toHaveAttribute('data-phase', /answer|results/, { timeout: 40_000 });
    if ((await sheet(page).getAttribute('data-phase')) === 'results') break;
    expect(await kiki(page, (k) => k.view().i)).toBe(i);
    const id = await kiki(page, (k) => k.items()[k.view().i]);
    heard.push(id);
    if (i === 0) {
      expect(id).toMatch(/^(p3|w3|n3|r3)-/); // (かわ's: level 3)
      await snap(page, 'check-q', false);
    }
    const right = await kiki(page, (k) => k.right());
    const k = HARD.test(id) ? (right + 1) % (await sheet(page).locator('[data-choice]').count()) : right;
    await sheet(page).locator(`[data-choice="${k}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-verdict] b')).toHaveCount(0);
    if (i === 1) await snap(page, 'check-reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // it climbed to やま and back (a reversal each way), and stopped between 8 and 12
  expect(heard.some((id) => HARD.test(id))).toBe(true);
  expect(heard.length).toBeGreaterThanOrEqual(8);
  expect(heard.length).toBeLessThanOrEqual(12);
  const placed = sheet(page).locator('[data-kiki-page="placed"]');
  await expect(placed).toHaveAttribute('data-kiki-placed', 'mori');
  await expect(sheet(page).locator('[data-kiki-placed-say]')).toHaveText('もりから はじめましょう！');
  await expect(placed.locator('li.on')).toHaveAttribute('data-stage', 'mori');
  await expect(placed).toContainText('この けっかは あなただけに みえます。');
  await snap(page, 'placed');
  // its row: the game 'check', the placed level, a digit a skill
  const row = await page.evaluate(() => (window as unknown as { __kiki: { recorded(): { gm?: string; lv: number; u?: string; r: unknown[] } | null } }).__kiki.recorded());
  expect(row).toMatchObject({ gm: 'check', lv: 4 });
  expect(row!.u).toMatch(/^[0-5x]{5}$/);
  expect(row!.r).toHaveLength(heard.length);

  // ききみみへ: the hub, no check card; ひとこと クイズ at もり as おまかせ
  await sheet(page).locator('[data-kiki-placed-done]').click();
  await atHub(page);
  await expect(sheet(page).locator('[data-kiki-check-card]')).toHaveCount(0);
  await toMode(page, 'quiz');
  await expect(sheet(page).locator('[data-stage="mori"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-omakase]')).toHaveText('おまかせ');
  await expect.poll(() => kiki(page, (k) => (k.view() as unknown as { lv: number }).lv)).toBe(4);
  await snap(page, 'mode-omakase');
  // a tap overrides it (kept for the mode); おまかせに もどす brings it back
  await sheet(page).locator('[data-stage="kawa"]').click();
  await expect(sheet(page).locator('[data-stage="kawa"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-omakase-reset]')).toHaveText('おまかせに もどす');
  await snap(page, 'mode-override');
  await page.locator('dialog[open] .navbar .back').click();
  await sheet(page).locator('[data-kiki-mode-tile="quiz"]').click();
  await expect(sheet(page).locator('[data-stage="kawa"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-kiki-omakase-reset]').click();
  await expect(sheet(page).locator('[data-stage="mori"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-omakase]')).toBeVisible();

  // せってい: where the check placed me, and みみ チェックを もういちど
  await page.locator('dialog[open] .navbar .back').click();
  await page.keyboard.press('Escape');
  await atHub(page);
  await page.locator('dialog[open] [data-kiki-gear]').click();
  await expect(sheet(page).locator('[data-kiki-set-placed]')).toHaveText('いまの ばしょ：もり ★★★');
  await snap(page, 'settings');
  await sheet(page).locator('[data-kiki-set-check]').click();
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('みみ チェック');
  await expect(sheet(page)).toHaveAttribute('data-phase', /countdown|lead|play|answer/);
});

test('あとで: the hub keeps a card for the check, and the welcome doesn’t come again', async ({ page }) => {
  await guest(page);
  await expect(sheet(page)).toHaveAttribute('data-kiki-at', 'welcome');
  await sheet(page).locator('[data-kiki-later]').click();
  await atHub(page);
  const card = sheet(page).locator('[data-kiki-check-card]');
  await expect(card).toBeVisible();
  await snap(page, 'hub-later');
  // before a check, おまかせ is はまべ 2
  await toMode(page, 'quiz');
  await expect(sheet(page).locator('[data-level="2"]')).toHaveAttribute('aria-checked', 'true');
  await page.locator('dialog[open] .navbar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  // the card starts it
  await sheet(page).locator('[data-kiki-check-start]').click();
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('みみ チェック');
});
