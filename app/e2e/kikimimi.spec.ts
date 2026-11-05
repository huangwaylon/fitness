// ききみみ クイズ (docs/kikimimi.md): the English listening game from the menu's 「えいご ききとり」. Solo from the lobby to
// the results and its review list; two players over the demo's relay (`?demo` and `?demo&as=B`, two tabs of one
// browser: sync/live-local.ts plays the room) from B's invite banner to both phones' results, in co-op (the team's tally, never who missed) and in たいせん (the ranking); and the
// 「やめる？」 path (mid-game a backdrop tap or Esc keeps the sheet; ✕ asks first). `?kikimimi=fast` shortens the
// reveal (session.ts FAST_WINDOWS; the answer window stays 8 s: a tab behind is throttled) on every phone. The logic tier: no clip has to sound (a
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
/** The menu's えいご ききとり: the game's sheet. */
const play = (page: Page) => fromMenu(page, 'kikimimi');
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
  // my own lobby at once (no one's invite waiting), on this phone alone: level, the sound check, ひとりで はじめる
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await expect(sheet(page).locator('[data-level="1"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-level="2"]').click();
  await expect(sheet(page).locator('[data-level="2"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-players]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-invite-all]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-start]')).toHaveText('ひとりで はじめる');
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
    // the first listen's +30 apart from the +100 (none on a miss)
    await expect(sheet(page).locator('[data-kiki-bonus]')).toHaveCount(i === 3 ? 0 : 1);
    // the host's つぎへ cuts the reveal short
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // 7 right on the first listen: 7 × 130
  await expect.poll(() => kiki(page, (k) => k.view().players[0].score)).toBe(910);
  await expect(sheet(page).locator('[data-review]')).toHaveCount(8);
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('8もん中 7もん せいかい');
  await sheet(page).locator('[data-kiki-missed]').click();
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-review="3"]')).toHaveAttribute('data-ok', 'false');
  await expect(sheet(page).locator('[data-review="3"] [data-kiki-picked]')).toContainText('えらんだ');
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

/** A and B in A's shared lobby (B from the banner's さんか); `vs`: A turns たいせん on before starting. */
async function together(ctx: BrowserContext, vs = false): Promise<[Page, Page]> {
  const a = await open(ctx, 'A');
  const b = await open(ctx, 'B');
  // (each tab hears the other's hello: the room's presence)
  await expect.poll(() => a.evaluate(() => document.querySelector('.if-scene') !== null)).toBe(true);
  await a.bringToFront();
  await play(a);
  await expect(sheet(a)).toHaveAttribute('data-phase', 'lobby');
  // nobody's invited till みんなを さそう
  await expect(b.locator('.banner', { hasText: 'ききとりクイズに さそっています' })).toHaveCount(0);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  await expect(sheet(a).locator('[data-kiki-players]')).toBeVisible();
  // co-op is the default: たいせん off
  await expect(sheet(a).locator('[data-kiki-vs]')).toHaveAttribute('aria-checked', 'false');
  // B: the invite banner, 「ウェイが ききとりクイズに さそっています」 [さんか]
  const banner = b.locator('.banner', { hasText: 'ききとりクイズに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  // and the menu's leaf marks it (a dot) while it's live
  await expect(b.locator('[data-hud-invited]')).toBeVisible();
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'lobby');
  // B waits for A; A sees B joined
  await expect(sheet(b).locator('.wait')).toContainText('はじめるのを まっています');
  await expect(sheet(b).locator('[data-kiki-start]')).toHaveCount(0);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'answered');
  if (vs) {
    await sheet(a).locator('[data-kiki-vs]').click();
    await expect(sheet(a).locator('[data-kiki-vs]')).toHaveAttribute('aria-checked', 'true');
    // the host's setting reaches B (a new open: the seed's low bit)
    await b.bringToFront();
    await expect(sheet(b).locator('[data-kiki-vs-flag]')).toHaveAttribute('data-kiki-vs-flag', 'true');
    await a.bringToFront();
  }
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('はじめる（2にん）');
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  return [a, b];
}

/** The 8 questions, A and B answering (`miss(who, i)`: that one picks a wrong choice); `each` after each reveal. */
async function rounds(a: Page, b: Page, miss: (who: 'A' | 'B', i: number) => boolean, each: (i: number) => Promise<void>) {
  for (let i = 0; i < 8; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
      await answer(p, miss(who, i));
    }
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    await each(i);
  }
}

test('two players, co-op (the default): A’s lobby invites B, they play together, the team’s tally on both phones and never who missed', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const [a, b] = await together(ctx);
  // A misses 3, B the odd ones: 3 is nobody's (7/8); both right on 0, 2, 4, 6 (そろって 4)
  const miss = (who: 'A' | 'B', i: number) => (who === 'A' ? i === 3 : i % 2 === 1);
  await rounds(a, b, miss, async (i) => {
    // both in: the reveal on both; B's chip stays neutral (co-op: no one's right or wrong shown, no points), and how many got it
    await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'answered');
    await expect(sheet(a).locator('[data-player="B"] .note')).toHaveCount(0);
    await expect(sheet(a).locator('[data-kiki-team-now]')).toHaveAttribute('data-kiki-team-now', String(2 - Number(miss('A', i)) - Number(miss('B', i))));
  });
  for (const p of [a, b]) {
    await p.bringToFront();
    await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
    await expect(sheet(p).locator('[data-kiki-team] b')).toHaveText('ふたりで 7/8');
    await expect(sheet(p).locator('[data-kiki-team-all]')).toHaveText('そろって せいかい 4もん');
    // no ranking, and each phone's own tally only
    await expect(sheet(p).locator('[data-rank]')).toHaveCount(0);
    await expect(sheet(p).locator('[data-kiki-tally]')).toHaveText(p === a ? 'じぶんは 8もん中 7もん' : 'じぶんは 8もん中 4もん');
    if (process.env.KIKI_SHOTS) await p.screenshot({ path: `/tmp/kikimimi-shots/inc34/coop-results-${p === a ? 'A' : 'B'}.png` });
  }
  await ctx.close();
});

test('two players, たいせん: the host’s toggle reaches B, the reveal shows each one’s mark, the results rank them, the same on each phone', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const [a, b] = await together(ctx, true);
  await rounds(a, b, (who, i) => who === 'B' && i % 2 === 1, async (i) => {
    // たいせん: each other's ✓ turned into a reaction
    await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', i % 2 === 1 ? 'wrong' : 'right');
    await expect(sheet(a).locator('[data-kiki-team-now]')).toHaveCount(0);
  });
  // the results on both, A first (8 × 130 against 4 × 130), the same on each phone
  for (const p of [a, b]) {
    await p.bringToFront();
    await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
    await expect.poll(() => kiki(p, (k) => k.view().players.map((x) => [x.who, x.score]))).toEqual([['A', 1040], ['B', 520]]);
    await expect(sheet(p).locator('[data-rank="1"] [data-player="A"]')).toBeVisible();
    await expect(sheet(p).locator('[data-kiki-team]')).toHaveCount(0);
  }
  await ctx.close();
});
