// おやすみ ものがたり (docs/kikimimi-ux.md §6.8): at 21:30 the hub's きまぐれ card is the bedtime story and plays it at
// once in the night frame (no ‹, no score); ⏸ / ▶, the sleep timer, the words shown, ⏭ to the last segment, and the
// chapter's end: its end card, the next chapter unlocked in the list. By day, after a chapter finished the night
// before, the morning card asks what happens next; the guess is revealed at the next chapter's end. Screenshots
// (KIKI_SHOTS=1) into /tmp/kikimimi-shots/story/. The logic tier (Playwright's Chromium is muted).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/story';
const frame = (p: Page) => sheet(p).locator('[data-kiki-page="story-frame"]');

async function open(page: Page, at: string) {
  await page.goto(`?demo&date=${at}&critter=none&visitor=none&kikimimi=fast`);
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
  await expect(frame(p).locator('[data-kiki-story-end]')).toBeVisible({ timeout: 20_000 });
}

test('21:30: the night card plays the story; ⏸ / ▶, the timer, the words; its end unlocks the next chapter', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page, '2026-11-04T21:30');
  const whim = sheet(page).locator('[data-kiki-card="whim"]');
  await expect(whim).toContainText('おやすみ ものがたり');
  await expect(whim).toContainText('ジャスミンの きっさてん・第1話');
  await snap(page, 'hub-night');

  await whim.locator('[data-kiki-card-go]').click();
  await expect(frame(page)).toBeVisible();
  await expect(sheet(page)).toHaveAttribute('data-kiki-at', 'story-frame');
  await expect(sheet(page)).toHaveAttribute('data-kiki-night', '');
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('おやすみ ものがたり');
  await expect(page.locator('dialog[open] .navbar .back')).toHaveCount(0); // a game page: no ‹
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
  // ‹ to the hub; the session's minutes kept as a story row (no answers)
  await page.locator('dialog[open] .navbar .back').click();
  await atHub(page);
});

test('the morning after: the hub asks what happens next; the guess is revealed at the next chapter’s end', async ({ page }) => {
  test.setTimeout(60_000);
  // ジョニーの たび's chapter 1 heard last night
  await page.addInitScript(() => {
    if (!localStorage.getItem('island.kikiStory'))
      localStorage.setItem('island.kikiStory', JSON.stringify({ who: 'A', s: { 'st-johnny': { done: { 1: '2026-11-03' }, last: 1 } } }));
  });
  await open(page, '2026-11-04T12:00');
  const card = sheet(page).locator('[data-kiki-predict]');
  await expect(card).toContainText('昨日の続き、どうなると思う？');
  await expect(card.locator('[data-kiki-predict-pick]')).toHaveCount(3);
  await snap(page, 'hub-morning');
  await card.locator('[data-kiki-predict-pick="0"]').click();
  await expect(sheet(page).locator('[data-kiki-predict-thanks]')).toBeVisible();

  // あそぶ › おやすみ ものがたり › chapter 2 of ジョニーの たび, to its end: the guess revealed
  await sheet(page).locator('[data-kiki-tile="asobu"]').click();
  await sheet(page).locator('[data-kiki-mode-tile="story"]').click();
  await sheet(page).locator('[data-kiki-chapter="st-johnny-2"]').click();
  await expect(frame(page).locator('[data-kiki-story-title]')).toHaveText('Snowed In in Vermont');
  await toEnd(page);
  await expect(frame(page).locator('[data-kiki-story-reveal="right"]')).toContainText('昨日の予想、当たり！');
  await snap(page, 'end-reveal');
});
