// しずえの しゅうまつ たいかい (docs/kikimimi-ux.md §7.1; curriculum §7.1): on a Saturday evening (the scene clock pinned
// inside its Fri 18:00 – Mon 05:00 window) the hub's banner opens the tournament's lobby; a solo run through the seven
// rounds and the wager (a bet of 80, missed: the confident-miss reveal) to the trophy, its review list, the banner and
// きろく's shelf showing it; and two phones in co-op over the demo's relay (`?demo`, `?demo&as=B`): B's misses (seeded on
// its phone) offered as it joins, A's lobby counting them and its deck picked again with them, both phones dealing the
// same rounds, the team's meter, the same trophy on both. Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/taikai/.
// The logic tier (Playwright's Chromium is muted).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/taikai';
/** Saturday 2026-11-07 20:00 Tokyo: the weekend of Friday 2026-11-06. */
const Q = 'date=2026-11-07T20:00&critter=none&visitor=none&kikimimi=fast';

type Kiki = { view(): { phase: string; i: number; n: number; gm: string | null; ids: number[] }; right(): number; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

/** A screenshot (KIKI_SHOTS=1) once しずえ's line has typed out and the sheet's animations are done (`settle` false: an
 *  answer window's timer bar runs on). */
async function snap(p: Page, name: string, fullPage = false, settle = true) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  if (settle) await expect.poll(() => p.evaluate(() => document.getAnimations().filter((x) => {
    const e = x.effect as KeyframeEffect | null;
    return x.playState === 'running' && e?.getTiming().iterations !== Infinity && !!(e?.target as Element | null)?.closest('dialog');
  }).length)).toBe(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}
async function phone(ctx: BrowserContext | Page, as: 'A' | 'B' = 'A'): Promise<Page> {
  const page = 'newPage' in ctx ? await ctx.newPage() : ctx;
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** The hub's banner: the tournament's lobby, its deck picked (8 ids). */
async function toTaikai(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await expect(sheet(p).locator('[data-kiki-taikai="open"]')).toBeVisible();
  await sheet(p).locator('[data-kiki-taikai]').click();
  await expect(sheet(p)).toHaveAttribute('data-kiki-at', 'taikai');
  await expect(sheet(p).locator('[data-kiki-taikai-lobby]')).toHaveAttribute('data-kiki-ids', '8');
}
/** One round: the right choice or (`wrong`) another; the wager's bet first. */
async function round(p: Page, i: number, wrong: boolean, bet?: number) {
  await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
  if (bet) {
    await expect(sheet(p).locator('[data-kiki-wager]')).toBeVisible();
    await sheet(p).locator(`[data-kiki-bet="${bet}"]`).click();
    await expect(sheet(p).locator(`[data-kiki-bet="${bet}"]`)).toHaveAttribute('aria-checked', 'true');
  }
  await expect(sheet(p)).toHaveAttribute('data-phase', 'answer', { timeout: 40_000 });
  const right = await kiki(p, (k) => k.right());
  const k = wrong ? (right + 1) % (await sheet(p).locator('[data-choice]').count()) : right;
  await sheet(p).locator(`[data-choice="${k}"]`).click();
  await expect(sheet(p).locator(`[data-choice="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
}

test('solo: the Saturday banner, the lobby, seven rounds and the wager (a confident miss) to the trophy; the banner and きろく keep it', async ({ page }) => {
  test.slow();
  await phone(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  const banner = sheet(page).locator('[data-kiki-taikai]');
  await expect(banner).toContainText('しずえの しゅうまつ たいかい');
  await expect(banner).toContainText('げつようの あさ 5じまで');
  await snap(page, 'hub-banner');
  await page.locator('dialog[open] .navbar .close').click();
  await toTaikai(page);
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('しずえの しゅうまつ たいかい');
  await expect(sheet(page).locator('[data-kiki-offer="A"]')).toContainText(/まちがい (\dこ|なし)/); // (the demo's games this week)
  await expect(sheet(page).locator('[data-kiki-vs]')).toHaveAttribute('data-kiki-vs', 'coop');
  await snap(page, 'lobby-solo');
  // ‹ back to the hub (a quiz lobby again), and in again
  await page.locator('dialog[open] .navbar .back').click();
  await atHub(page);
  expect(await kiki(page, (k) => k.view().gm)).toBe('quiz');
  await sheet(page).locator('[data-kiki-taikai]').click();
  await expect(sheet(page).locator('[data-kiki-taikai-lobby]')).toHaveAttribute('data-kiki-ids', '8');

  await sheet(page).locator('[data-kiki-taikai-solo]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  for (let i = 0; i < 7; i++) {
    await round(page, i, i === 2);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-taikai-bar]')).toContainText(`だい ${i + 1}もん / 7`);
    await expect(sheet(page).locator('[data-kiki-team-right]')).toHaveAttribute('data-kiki-team-right', String(i < 2 ? i + 1 : i));
    if (i === 3) await snap(page, 'round-reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  // the wager: the choices wait for a bet; 80 of the round's 100 chips, missed
  await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 20_000 }).toBe(7);
  await expect(sheet(page).locator('[data-kiki-taikai-bar]')).toContainText('かけの もんだい');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 40_000 });
  await expect(sheet(page).locator('[data-choice="0"]')).toHaveAttribute('aria-disabled', 'true');
  await sheet(page).locator('[data-kiki-bet="80"]').click();
  await snap(page, 'wager-bet', false, false);
  await round(page, 7, true, 80);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  const reveal = sheet(page).locator('[data-kiki-wager-reveal="confident-miss"]');
  await expect(reveal).toContainText('おしい！ これは わすれませんね');
  await expect(reveal.locator('[data-kiki-chips]')).toHaveAttribute('data-kiki-chips', '20');
  await snap(page, 'wager-confident-miss');
  await sheet(page).locator('[data-kiki-next]').click();

  // the trophy for 6 of 8, しずえ's line on it; the review list opens on the two missed
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  const trophy = sheet(page).locator('[data-kiki-trophy]');
  await expect(trophy).toBeVisible();
  const cup = (await trophy.getAttribute('data-kiki-trophy'))!;
  expect(['bronze', 'silver', 'gold']).toContain(cup);
  await expect(trophy).toHaveAttribute('data-kiki-taikai-score', '6');
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('6 / 8 もん せいかい');
  await expect(trophy.locator('[data-kiki-wager-result]')).toHaveAttribute('data-kiki-wager-result', '20');
  await expect(sheet(page).locator('[data-kiki-missed]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(2);
  await snap(page, 'results', true);
  // おわる: the hub's banner shows this weekend's trophy; きろく's shelf has it
  await sheet(page).locator('[data-kiki-done]').click();
  await atHub(page);
  await expect(sheet(page).locator(`[data-kiki-taikai="${cup}"]`)).toBeVisible();
  await snap(page, 'hub-banner-won');
  await sheet(page).locator('[data-kiki-tile="record"]').click();
  await expect(sheet(page).locator('[data-kiki-trophies="1"]')).toBeVisible();
  await expect(sheet(page).locator(`[data-kiki-shelf="${cup}"]`)).toContainText('11/6の しゅうまつ');
  await sheet(page).locator('[data-kiki-trophies]').scrollIntoViewIfNeeded();
  await snap(page, 'record-shelf');
});

test('co-op on two phones: B’s misses offered as it joins, A’s deck picked again with them, the same rounds on both, the team’s trophy on both', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  // B's misses this week (its phone's own rows: one context's storage, so only B's)
  await ctx.addInitScript(() => {
    if (localStorage.getItem('island.kikimimiGames')) return;
    const row = { d: '2026-11-05', g: 'bbmiss01', lv: 2, n: 1, ms: 120_000, r: [['w2-cats', 0, 1, 0], ['w2-live', 0, 2, 0], ['w2-seat', 0, 1, 1]] };
    localStorage.setItem('island.kikimimiGames', JSON.stringify({ who: 'B', rows: [{ at: Date.UTC(2026, 10, 5, 3), row }] }));
  });
  const a = await phone(ctx, 'A'), b = await phone(ctx, 'B');
  await a.bringToFront();
  await toTaikai(a);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  // B: the tournament's lobby, waiting for A, its own three misses offered
  await expect(sheet(b).locator('[data-kiki-taikai-lobby]')).toBeVisible();
  await expect(sheet(b).locator('[data-kiki-offer="B"]')).toHaveAttribute('data-kiki-offer-n', '3');
  await expect(sheet(b).locator('.wait')).toContainText('はじめるのを まっています');
  await snap(b, 'lobby-joined');
  // A: B in with 3 misses; the deck picked again with them; B deals the same
  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-offer="B"]')).toHaveAttribute('data-kiki-offer-n', '3', { timeout: 10_000 });
  await expect.poll(() => kiki(a, (k) => k.items())).toEqual(expect.arrayContaining(['w2-cats', 'w2-live', 'w2-seat']));
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('はじめる（2にん）');
  await snap(a, 'lobby-host');
  const deck = await kiki(a, (k) => k.items());
  expect(deck).toHaveLength(8);
  await b.bringToFront();
  await expect.poll(() => kiki(b, (k) => k.items())).toEqual(deck);
  await a.bringToFront();
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });

  // A misses 1 and 4, B misses 4 and 5: the team gets all but 4 (and the wager, both right)
  for (let i = 0; i < 8; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await round(p, i, who === 'A' ? i === 1 || i === 4 : i === 4 || i === 5, i === 7 ? (who === 'A' ? 30 : 100) : undefined);
    }
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(a).locator('[data-kiki-team-right]')).toHaveAttribute('data-kiki-team-right', String(i < 4 ? i + 1 : i));
    if (i === 5) await snap(a, 'coop-reveal');
    if (i === 7) {
      await expect(sheet(a).locator('[data-kiki-wager-reveal="right"]')).toBeVisible();
      await b.bringToFront();
      await expect(sheet(b).locator('[data-kiki-wager-reveal="confident-right"]')).toContainText('じしん どおり');
      await snap(b, 'coop-wager-confident-right');
    }
    await b.bringToFront();
    await sheet(b).locator('[data-kiki-ready]').click();
    await a.bringToFront();
    await sheet(a).locator('[data-kiki-next]').click();
  }
  await expect(sheet(a)).toHaveAttribute('data-phase', 'results');
  const cup = await sheet(a).locator('[data-kiki-trophy]').getAttribute('data-kiki-trophy');
  await expect(sheet(a).locator('[data-kiki-trophy]')).toHaveAttribute('data-kiki-taikai-score', '7');
  await expect(sheet(a).locator('[data-kiki-team]')).toHaveAttribute('data-kiki-team', '7');
  await snap(a, 'coop-results', true);
  await b.bringToFront();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(b).locator('[data-kiki-trophy]')).toHaveAttribute('data-kiki-trophy', cup!);
  await ctx.close();
});
