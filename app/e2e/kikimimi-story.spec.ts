// おやすみ ものがたり (docs/kikimimi.md "おやすみ ものがたり"): あそぶ › 寝る前に › a chapter plays in the night frame (no
// score); ⏸ / ▶, the sleep timer, the words shown, ⏭ to the last segment, and the chapter's end: its end card, the next
// chapter unlocked in the list. Screenshots
// (KIKI_SHOTS=1) into /tmp/kikimimi-shots/story/. The logic tier (Playwright's Chromium is muted).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/story';
const frame = (p: Page) => sheet(p).locator('[data-kiki-page="story-frame"]');

async function open(page: Page, at: string) {
  await page.clock.install(); // (a segment's play stepped through: kikimimi-nav.ts runUntil)
  await page.goto(`?demo&date=${at}&kikimimi=fast`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
}
async function snap(p: Page, name: string) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await expect.poll(() => p.evaluate(() => document.getAnimations().filter((x) => {
    const e = x.effect as KeyframeEffect | null;
    return x.playState === 'running' && e?.getTiming().iterations !== Infinity && !!(e?.target as Element | null)?.closest('dialog');
  }).length)).toBe(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
}
/** ⏭ to the chapter's last segment, then its end card once it has played. */
async function toEnd(p: Page) {
  const fwd = frame(p).locator('[data-kiki-story-forward]');
  while ((await fwd.getAttribute('aria-disabled')) !== 'true') await fwd.click();
  await runToSee(p, frame(p).locator('[data-kiki-story-end]'));
}

test('21:30: 寝る前に plays the story; ⏸ / ▶, the timer, the words; its end unlocks the next chapter', async ({ page }) => {
  await open(page, '2026-11-04T21:30');
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await sheet(page).locator('[data-kiki-mode-tile="story"]').click();
  await sheet(page).locator('[data-kiki-chapter="st-cafe-1"]').click();
  await expect(frame(page)).toBeVisible();
  await expect(sheet(page)).toHaveAttribute('data-kiki-at', 'story-frame');
  await expect(sheet(page)).toHaveAttribute('data-kiki-night', '');
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('おやすみ ものがたり');
  await expect(page.locator('dialog[open] .navbar .back')).toHaveCount(1); // ‹: to 寝る前に, the place kept
  await expect(frame(page).locator('[data-kiki-story-title]')).toHaveText('The Empty Shop by the Pier');
  await expect(frame(page)).toHaveAttribute('data-kiki-story-playing', 'true');
  // no score, no questions
  await expect(frame(page)).toContainText('点数はありません');
  await snap(page, 'frame');

  // ⏸ and ▶
  const play = frame(page).locator('[data-kiki-story-play]');
  await play.click();
  await expect(frame(page)).not.toHaveAttribute('data-kiki-story-playing', 'true');
  await expect(play).toHaveAttribute('aria-label', '聞く');
  await play.click();
  await expect(frame(page)).toHaveAttribute('data-kiki-story-playing', 'true');

  // the sleep timer: 10 ぷん of listening, then ぜんぶ (to the chapter's end)
  await expect(frame(page).locator('[data-kiki-story-timer="0"]')).toHaveAttribute('aria-checked', 'true');
  await frame(page).locator('[data-kiki-story-timer="10"]').click();
  await expect(frame(page).locator('[data-kiki-story-timer="10"]')).toHaveAttribute('aria-checked', 'true');
  await expect(frame(page).locator('[data-kiki-story-left]')).toContainText(/残り (10:00|9:5\d)/);
  await snap(page, 'frame-timer');
  await frame(page).locator('[data-kiki-story-timer="0"]').click();
  await expect(frame(page).locator('[data-kiki-story-left]')).toHaveCount(0);

  // the words, hidden by default; the summary under くわしく
  await expect(frame(page).locator('[data-kiki-story-text]')).toHaveCount(0);
  await frame(page).locator('[data-kiki-story-text-toggle]').click();
  await expect(frame(page).locator('[data-kiki-story-text]')).toBeVisible();
  await frame(page).locator('[data-kiki-story-more] summary').click();
  await expect(frame(page).locator('[data-kiki-story-more] .ja-sum')).toBeVisible();
  await snap(page, 'frame-text');

  // ⏭ to the last segment; played out, the end card: the next chapter open
  await toEnd(page);
  await expect(frame(page).locator('[data-kiki-story-end]')).toContainText('次のお話が開きました');
  await snap(page, 'end');

  // もくじ: chapter 1 heard, 2 open (the next), 3 locked
  await frame(page).locator('[data-kiki-story-list]').click();
  const list = sheet(page).locator('[data-kiki-page="story"]');
  await expect(list).toBeVisible();
  await expect(list.locator('[data-kiki-chapter="st-cafe-1"]')).toHaveAttribute('data-kiki-done', 'true');
  await expect(list.locator('[data-kiki-chapter="st-cafe-2"]')).not.toHaveAttribute('data-kiki-locked', 'true');
  await expect(list.locator('[data-kiki-chapter="st-cafe-2"]')).toHaveAttribute('aria-disabled', 'false');
  await expect(list.locator('[data-kiki-chapter="st-cafe-3"]')).toHaveAttribute('data-kiki-locked', 'true');
  await snap(page, 'list');
  // ‹ to あそぶ, then the hub
  await page.locator('dialog[open] .navbar .back').click();
  await page.locator('dialog[open] .navbar .back').click();
  await atHub(page);
});
