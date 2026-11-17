// 英語すごろく (docs/sugoroku.md): the leaf menu's すごろく pill opens it; a new game for the two members; turns play
// through (spin, then the space's ことば with ヒント and 決定, ぶん tapped in any order till 答えはこれ, イベント's OK); the game
// resumes from 続きから after a reload; 終了 shows the results with the words made. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const sheet = (p: Page) => p.locator('dialog[open] [data-sugoroku]');

/** Play the current turn to its end, whatever the space. */
async function playTurn(p: Page) {
  const s = sheet(p);
  await s.locator('[data-sg-spin]').click();
  const play = s.locator('[data-sg-phase]');
  await expect(play).not.toHaveAttribute('data-sg-phase', 'spin', { timeout: 10_000 });
  await expect(s.locator('[data-sg-die]')).toHaveCount(0, { timeout: 10_000 });
  const phase = await play.getAttribute('data-sg-phase');
  if (phase === 'word') {
    await s.locator('[data-sg-hint]').click();
    await expect(s.locator('[data-sg-slots]')).not.toHaveAttribute('data-sg-slots', '');
    await s.locator('[data-sg-play]').click();
    await expect(s.locator('[data-sg-made]')).toBeVisible();
    await s.locator('[data-sg-next]').click();
  } else if (phase === 'sentence') {
    for (let round = 0; round < 2 && !(await s.locator('[data-sg-answer]').count()); round++) {
      const n = await s.locator('[data-sg-wt]').count();
      for (let i = 0; i < n && !(await s.locator('[data-sg-answer]').count()); i++) await s.locator('[data-sg-wt]:not([disabled])').first().click();
    }
    await expect(s.locator('[data-sg-answer]')).toBeVisible();
    await s.locator('[data-sg-next]').click();
  } else await s.locator('[data-sg-next]').click();
}

test('a game for two: turns, resume after a reload, the results', async ({ page }) => {
  await page.goto('?demo');
  await islandUp(page);
  await fromMenu(page, 'sugoroku');
  await expect(sheet(page)).toHaveAttribute('data-level', 'menu');
  await expect(sheet(page).locator('[data-sg-resume]')).toHaveCount(0);
  await sheet(page).locator('[data-sg-new]').click();
  // the members picked by default, in order
  await expect(sheet(page).locator('[data-sg-seat][aria-pressed="true"]')).toHaveCount(2);
  await sheet(page).locator('[data-sg-start]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'play');
  await expect(sheet(page).locator('[data-sg-space]')).toHaveCount(24);
  await expect(sheet(page).locator('[data-sg-token]')).toHaveCount(2);

  await playTurn(page);
  await expect(sheet(page).locator('[data-sg-turn]')).toHaveAttribute('data-sg-turn', '1');
  await playTurn(page);
  const stars = await sheet(page).locator('[data-sg-score] b').allTextContents();
  expect(stars.map(Number).some((n) => n > 0)).toBe(true);

  // a reload: 続きから where it was
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'sugoroku');
  await sheet(page).locator('[data-sg-resume]').click();
  await expect(sheet(page).locator('[data-sg-score] b')).toHaveText(stars);
  await playTurn(page);

  // 終了 (asked once more), the results: a winner and the words made
  await sheet(page).locator('[data-sg-end]').click();
  await sheet(page).locator('[data-sg-end-yes]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'results');
  await expect(sheet(page).locator('[data-sg-rank]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-sg-results] [role="listitem"]').first()).toBeVisible();
  // the finished game isn't offered again
  await page.keyboard.press('Escape');
  await fromMenu(page, 'sugoroku');
  await expect(sheet(page).locator('[data-sg-resume]')).toHaveCount(0);
});
