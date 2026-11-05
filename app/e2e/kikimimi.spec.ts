// ききみみ クイズ (docs/kikimimi.md): the English listening game from せってい's 「えいご ききとり」. Solo from the lobby to
// the results and its review list; two players over the demo's relay (`?demo` and `?demo&as=B`, two tabs of one
// browser: sync/live-local.ts plays the room) from B's invite banner to both phones' results, scored alike; and the
// 「やめる？」 path (mid-game a backdrop tap or Esc keeps the sheet; ✕ asks first). `?kikimimi=fast` shortens the
// answer and reveal windows (session.ts FAST_WINDOWS) on every phone. The logic tier: no clip has to sound (a
// headless browser's audio is a null sink), the schedule is the relay clock's.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';

type Kiki = { view(): { phase: string; i: number; n: number; amHost: boolean; players: { who: string; score: number }[] }; right(): number };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
const phase = (p: Page) => sheet(p).getAttribute('data-phase');

async function open(ctx: BrowserContext | Page, as: 'A' | 'B' = 'A'): Promise<Page> {
  const page = 'newPage' in ctx ? await ctx.newPage() : ctx;
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}`);
  await expect(hudMenu(page)).toBeVisible();
  return page;
}
/** せってい → えいご ききとり [あそぶ]: the game's sheet. */
async function play(page: Page) {
  await fromMenu(page, 'settings');
  await page.locator('[data-kikimimi-start]').click();
  await expect(sheet(page)).toBeVisible();
}
/** Answer the current question: the right choice, or (`wrong`) another; waits for the answer window first. */
async function answer(page: Page, wrong = false) {
  await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 15_000 });
  const right = await kiki(page, (k) => k.right());
  const k = wrong ? (right + 1) % (await sheet(page).locator('[data-choice]').count()) : right;
  await sheet(page).locator(`[data-choice="${k}"]`).click();
  await expect(sheet(page).locator(`[data-choice="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
}

test('solo: the lobby, eight questions answered, the reveal, the results and the review list', async ({ page }) => {
  test.slow();
  await open(page);
  await play(page);
  // my own lobby at once (no one's invite waiting): level, おなじへや, me, the sound check, はじめる
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await expect(sheet(page).locator('[data-level="1"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-level="2"]').click();
  await expect(sheet(page).locator('[data-level="2"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-player="A"]')).toBeVisible();
  await sheet(page).locator('[data-kiki-test]').click();
  // the island is idle under it (as under けんこう, ごはん)
  await expect(page.locator('.if-scene')).toHaveAttribute('data-covered', 'true');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  // each question: the choices dimmed while the clip plays, one final tap in the answer window, the reveal
  for (let i = 0; i < 8; i++) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(i);
    await answer(page, i === 3);
    // alone, everyone's in: the reveal at once, the English shown
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-en]')).toBeVisible();
    await expect(sheet(page).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', i === 3 ? 'wrong' : 'right');
    await expect(sheet(page).locator('[data-mark="right"]')).toHaveCount(1);
    // the host's つぎへ cuts the reveal short
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // 7 right on the first listen: 7 × 130
  await expect.poll(() => kiki(page, (k) => k.view().players[0].score)).toBe(910);
  await expect(sheet(page).locator('[data-review]')).toHaveCount(8);
  await sheet(page).locator('[data-kiki-missed]').click();
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-review="3"]')).toHaveAttribute('data-ok', 'false');
  // おわる: closed, the island back
  await sheet(page).locator('[data-kiki-done]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('.if-scene')).not.toHaveAttribute('data-covered', 'true');
});

test('mid-game, Esc and the backdrop keep the sheet; ✕ asks 「やめる？」: つづける goes on, やめる closes it', async ({ page }) => {
  await open(page);
  await play(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => phase(page)).toMatch(/countdown|lead|play/);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-kiki-quit]')).toBeVisible();
  await page.locator('[data-kiki-stay]').click();
  await expect(page.locator('[data-kiki-quit]')).toHaveCount(0);
  await expect(sheet(page)).toBeVisible();
  // the backdrop: the sheet is the screen's whole height, so its ::backdrop has no room; ✕ then
  await page.locator('dialog[open] .titlebar button').last().click();
  await expect(page.locator('[data-kiki-quit]')).toBeVisible();
  await page.locator('[data-kiki-quit-yes]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // the lobby, unstarted: ✕ closes at once
  await play(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await page.locator('dialog[open] .titlebar button').last().click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('two players: A’s lobby invites B (the banner’s さんか), they play together, both phones score alike', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await open(ctx, 'A');
  const b = await open(ctx, 'B');
  // (each tab hears the other's hello: the room's presence)
  await expect.poll(() => a.evaluate(() => document.querySelector('.if-scene') !== null)).toBe(true);
  await a.bringToFront();
  await play(a);
  await expect(sheet(a)).toHaveAttribute('data-phase', 'lobby');
  // B: the invite banner, 「ウェイが ききとりクイズに さそっています」 [さんか]
  const banner = b.locator('.banner', { hasText: 'ききとりクイズに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'lobby');
  // B waits for A; A sees B joined
  await expect(sheet(b).locator('.wait')).toContainText('はじめるのを まっています');
  await expect(sheet(b).locator('[data-kiki-start]')).toHaveCount(0);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'answered');
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  for (let i = 0; i < 8; i++) {
    for (const [p, wrong] of [[a, false], [b, i % 2 === 1]] as const) {
      await p.bringToFront();
      await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
      await answer(p, wrong);
    }
    // both in: the reveal on both, each other's ✓ turned into a reaction
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', i % 2 === 1 ? 'wrong' : 'right');
  }
  // the results on both, A first (8 × 130 against 4 × 130), the same on each phone
  for (const p of [a, b]) {
    await p.bringToFront();
    await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
    await expect.poll(() => kiki(p, (k) => k.view().players.map((x) => [x.who, x.score]))).toEqual([['A', 1040], ['B', 520]]);
    await expect(sheet(p).locator('[data-rank="1"] [data-player="A"]')).toBeVisible();
  }
  await ctx.close();
});
