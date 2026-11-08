// ききみみ's ずかん (docs/kikimimi-ux.md §6.10, §7.6, §7.7): from the hub's tile, its four sections over this phone's
// seeded games (a unit's three lessons on three days, its チェック passed, a weekend's gold trophy, a bedtime chapter
// heard to the end) and the demo's: ことば's caught phrases and their entry, the filters; こえ's cards (a sample asked
// for: Playwright's Chromium is muted, the logic tier); なかま's level-up heart and a villager's greeting; スタンプ's can-do
// stamp, いっぱつ, the trophy and the chapter. Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/zukan/.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { kikiSheet as sheet, toTile } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/zukan';
const Q = 'date=2026-11-07T12:00&kikimimi=fast';

const ok = (...ids: string[]) => ids.map((id) => [id, 1, 0, 0]);
/** よていを かえる (fr-replan) over three days, its チェック all right on the first listen; once more the next day; a
 *  weekend's gold. */
const ROWS = [
  ['2026-11-03', 'zk01', 1, ok('dk-dinner-move', 'dk-dinner-place', 'kr-running-late', 'km-another-time', 'kn-new-time', 'mw-rain-check')],
  ['2026-11-04', 'zk02', 2, ok('kr-cant-make-it', 'km-push-back', 'dk-really-cancel', 'kr-does-work', 'kn-date-move', 'r4-come-up')],
  ['2026-11-05', 'zk03', 3, ok('dk-movie-switch', 'km-start-without', 'kr-came-up', 'km-east-exit', 'kr-rain-check-cold', 'kn-push-time')],
  ['2026-11-06', 'zk04', 4, ok('kw-gonna', 'kw-make-it', 'kw-come-up', 'kw-still-on', 'kw-push', 'kw-running')],
  ['2026-11-06', 'zk05', 1, ok('dk-dinner-move', 'dk-dinner-place', 'd4-friend-cancels', 'kr-running-late', 'km-another-time', 'kn-new-time')]
] as const;

async function seeded(page: Page) {
  await page.addInitScript((rows) => {
    if (localStorage.getItem('island.kikimimiGames')) return;
    const kept = rows.map(([d, g, l, r], k) => ({ at: Date.UTC(2026, 10, 3 + k, 3), row: { d, g, lv: 3, n: 1, ms: 160_000, u: 'fr-replan', l, r } }));
    kept.push({ at: Date.UTC(2026, 10, 7, 2), row: { d: '2026-11-07', g: 'zk06', gm: 'taikai', u: 'gold', lv: 2, n: 1, ms: 200_000, r: [['w2-cats', 1, 0, 0], ['w2-live', 1, 0, 0]] } as never });
    localStorage.setItem('island.kikimimiGames', JSON.stringify({ who: 'A', rows: kept }));
    localStorage.setItem('island.kikiStory', JSON.stringify({ who: 'A', s: { 'st-johnny': { done: { 1: '2026-11-03' }, at: { ch: 2, seg: 2 }, last: 1 } } }));
  }, ROWS as unknown as [string, string, number, number[][]][]);
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
}

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect.poll(() => p.evaluate(() => document.getAnimations().filter((x) => {
    const e = x.effect as KeyframeEffect | null;
    return x.playState === 'running' && e?.getTiming().iterations !== Infinity && !!(e?.target as Element | null)?.closest('dialog');
  }).length)).toBe(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

test('from the hub: ことば, こえ, なかま and スタンプ over the seeded games', async ({ page }) => {
  test.slow();
  await seeded(page);
  await fromMenu(page, 'kikimimi');
  await toTile(page, 'zukan');
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('図鑑');
  const z = sheet(page).locator('[data-kiki-page="zukan"]');

  // ことば: fr-replan's five phrases right on the first listen in 3 clips on ≥ 2 days (still on: 2 clips), NEW the first time
  const words = z.locator('[data-kiki-zukan="all"]');
  await expect(words.locator('[data-kiki-phrase="ph-rain-check"]')).toHaveAttribute('data-caught', 'true');
  const sec = words.locator('[data-kiki-zukan-sec="tomodachi"]');
  await expect(sec.locator('[data-kiki-phrase][data-caught]')).toHaveCount(5);
  // (of all the section's phrases: the draft units' too under ?demo, so the count follows the content)
  await expect(sec.locator('.shead small')).toHaveText(`5 / ${await sec.locator('[data-kiki-phrase]').count()}`);
  await expect(sec.locator('[data-kiki-new]')).toHaveCount(5);
  await expect(sec.locator('[data-kiki-phrase="ph-still-on"]')).not.toHaveAttribute('data-caught');
  // the bedtime serial's: chapter 1 heard to the end, its phrases caught (no ★)
  await expect(words.locator('[data-kiki-zukan-sec="story-st-johnny"] [data-kiki-phrase][data-caught]').first()).toBeVisible();
  await snap(page, 'words');
  await words.locator('[data-kiki-phrase="ph-rain-check"]').click();
  const entry = words.locator('[data-kiki-phrase-entry="ph-rain-check"]');
  await expect(entry).toContainText('rain check');
  await expect(entry.locator('[data-kiki-phrase-hear]')).toBeVisible();
  await entry.locator('[data-kiki-phrase-hear]').click();
  await expect(z.locator('[data-kiki-phrase-hear]')).toBeVisible();
  await entry.scrollIntoViewIfNeeded();
  await snap(page, 'words-entry');
  // まだ: none of the caught; 捕まえた: only them
  await words.locator('[data-kiki-zukan-filter="notyet"]').click();
  await expect(words.locator('[data-kiki-phrase="ph-rain-check"]')).toHaveCount(0);
  await expect(words.locator('[data-kiki-phrase="ph-still-on"]')).toBeVisible();
  await words.locator('[data-kiki-zukan-filter="caught"]').click();
  await expect(words.locator('[data-kiki-phrase]:not([data-caught])')).toHaveCount(0);

  // こえ: 18 voices; maple's (us-f3) heard; a sample asked for (muted)
  await z.locator('[data-kiki-zukan-tab="voices"]').click();
  await expect(z.locator('[data-kiki-voice]')).toHaveCount(18);
  const f3 = z.locator('[data-kiki-voice="us-f3"]');
  expect(Number(await f3.getAttribute('data-heard'))).toBeGreaterThan(0);
  await f3.click();
  await expect(f3).toHaveAttribute('data-sample', /\S/);
  await expect(z.locator('[data-kiki-voice-users="us-f3"]')).toBeVisible();
  await snap(page, 'voices');

  // なかま: maple at level 1 (12 points), its heart once, the greeting in the card and the gift
  await z.locator('[data-kiki-zukan-tab="friends"]').click();
  await expect(z.locator('[data-kiki-levelup="maple"]')).toHaveAttribute('data-to', '1');
  const maple = z.locator('[data-kiki-friend="maple"]');
  await expect(maple).toHaveAttribute('data-level', '1');
  await expect(maple.locator('.greet')).toBeVisible();
  await snap(page, 'friends');
  await maple.click();
  await expect(z.locator('[data-kiki-gifts="maple"]')).toBeVisible();
  await snap(page, 'friends-gift');
  // ‹ and back in: the heart said once
  await page.locator('dialog[open] .navbar .back').click();
  await toTile(page, 'zukan');
  await z.locator('[data-kiki-zukan-tab="friends"]').click();
  await expect(z.locator('[data-kiki-friend="maple"]')).toBeVisible();
  await expect(z.locator('[data-kiki-levelup]')).toHaveCount(0);

  // スタンプ: fr-replan's can-do stamp, the いっぱつ count, the gold trophy, johnny's chapter 1
  await z.locator('[data-kiki-zukan-tab="stamps"]').click();
  await expect(z.locator('[data-kiki-cando-stamp="fr-replan"]')).toHaveAttribute('data-stamped', '1');
  await expect(z.locator('[data-kiki-cando]')).toHaveAttribute('data-kiki-cando', '1');
  expect(Number(await z.locator('[data-kiki-ippatsu]').getAttribute('data-kiki-ippatsu'))).toBeGreaterThanOrEqual(32);
  await expect(z.locator('[data-kiki-badge="10"]')).toHaveAttribute('data-got', 'true');
  await expect(z.locator('[data-kiki-shelf="gold"]')).toContainText('11/6の週末');
  await expect(z.locator('[data-kiki-chapter-stamp="st-johnny-1"]')).toBeVisible();
  await snap(page, 'stamps');
  await z.locator('[data-kiki-chapters]').scrollIntoViewIfNeeded();
  await snap(page, 'stamps-more');
});
