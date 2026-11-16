// English Study (docs/english.md): the sheet's home, a clip's lesson over YouTube's embed (stood in for: e2e/youtube.ts,
// nothing leaves the preview), never locked: 質問へ and ‹ 前へ / 次へ › always work; a miss replays the segment with the
// cue and a quiet 答えを見る, a second miss 「答えはこれ」, never a mark on the pick; まとめ writes the clip's row (✓ in
// the library, 今週 1/3日, これまで 1本); ⚑ 報告 on the clip and a question, listed in ⚙'s 報告した内容; the player's
// offline and unavailable states; a lesson left resumes where it was. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fakeYoutube, ytCommands } from './youtube.ts';

/** The player's commands from the `from`th on (addEventListener aside). */
const since = async (p: Page, from: number) => (await ytCommands(p)).slice(from).filter((c) => c[0] !== 'addEventListener');

test.use({ viewport: { width: 393, height: 852 } });

const sheet = (p: Page) => p.locator('dialog[open] [data-english]');
const lesson = (p: Page) => sheet(p).locator('[data-en-lesson]');
const at = (p: Page) => lesson(p).getAttribute('data-en-at');

async function open(page: Page, q = '') {
  await page.goto(`?demo${q}`);
  await islandUp(page);
  await page.evaluate(() => (window as unknown as { __english: { open(): void } }).__english.open());
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
}
/** The day's clip, from its card. */
async function start(page: Page) {
  await sheet(page).locator('[data-en-start]').click();
  await expect(lesson(page)).toBeVisible();
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
}

test('home: today’s clip, the week, the library; the lesson never locks: 質問へ at once, 次へ unanswered, ‹ back to the watch card', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await expect(sheet(page).locator('[data-en-today]')).toContainText('Rachel Is a Bad Waitress');
  await expect(sheet(page).locator('[data-en-week]')).toHaveAttribute('data-en-week', '0');
  await expect(sheet(page).locator('[data-en-week-n]')).toHaveCount(0); // never 0日
  await expect(sheet(page).locator('[data-en-clip]')).toHaveCount(1);
  await start(page);
  // the embed: privacy-enhanced, the JS API for our origin, inline, its own referrer policy
  const frame = lesson(page).locator('[data-yt-frame]');
  await expect(frame).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/lm2MpPpkGL8\?enablejsapi=1&playsinline=1&.*origin=http/);
  await expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  await expect(lesson(page).locator('[data-en-watch]')).toBeVisible();
  await expect(lesson(page).locator('[data-en-to-q]')).toBeEnabled();
  await lesson(page).locator('[data-en-to-q]').click();
  expect(await at(page)).toBe('0');
  await lesson(page).locator('[data-en-next]').click();
  await lesson(page).locator('[data-en-next]').click();
  expect(await at(page)).toBe('2');
  await expect(lesson(page).locator('[data-en-q="2"]')).toHaveAttribute('data-result', 'open');
  await lesson(page).locator('[data-en-prev]').click();
  await lesson(page).locator('[data-en-prev]').click();
  await lesson(page).locator('[data-en-prev]').click();
  await expect(lesson(page).locator('[data-en-watch]')).toBeVisible();
  // ▶ 全部見る plays from the start, no stop
  const n0 = (await ytCommands(page)).length;
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect.poll(async () => (await since(page, n0)).map((c) => c[0])).toEqual(['seekTo', 'playVideo']);
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'playing');
  // ‹ home (the lesson's place kept: 続きから)
  await lesson(page).locator('[data-en-to-q]').click();
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(sheet(page).locator('[data-en-start]')).toHaveText('▶ 続きから');
  await sheet(page).locator('[data-en-start]').click();
  expect(await at(page)).toBe('0');
});

test('a miss: the segment again with the cue, one retry, then 答えはこれ; never a mark on a pick; ◎ first, ○ second; a segment pauses at its end', async ({ page }) => {
  await fakeYoutube(page, { rate: 8 });
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  const card = lesson(page).locator('[data-en-q="0"]');
  // q1 (the answer is the 2nd): a miss
  const n0 = (await ytCommands(page)).length;
  await card.locator('[data-choice="0"]').click();
  await expect(card.locator('[data-en-nudge]')).toContainText('もう一度聞いてみましょう。');
  await expect(card.locator('[data-en-nudge]')).toContainText('「salary」の前の言葉に注目して');
  await expect(card).toHaveAttribute('data-result', 'open');
  await expect(card.locator('[data-ans]')).toHaveCount(0);
  // the segment replayed by itself: from 0, paused at 10 s
  await expect.poll(async () => (await since(page, n0)).map((c) => c[0])).toEqual(['seekTo', 'playVideo', 'pauseVideo']);
  const cmds = await since(page, n0);
  expect(cmds.find((c) => c[0] === 'seekTo')?.[1]).toEqual([0, true]);
  expect(cmds.find((c) => c[0] === 'pauseVideo')![2]).toBeGreaterThanOrEqual(10);
  // a second miss: the answer, ○ on it, the notes; the picks never marked, nothing coral
  await card.locator('[data-choice="2"]').click();
  await expect(card).toHaveAttribute('data-result', 'shown');
  await expect(card.locator('[data-en-reveal]')).toContainText('答えはこれ');
  await expect(card.locator('[data-ans]')).toHaveAttribute('data-choice', '1');
  await expect(card.locator('[data-en-reveal]')).toContainText('言っていること');
  await expect(card.locator('[data-en-reveal] u')).toHaveText('hundred dollar advance');
  await expect(card.locator('[data-en-nudge]')).toHaveCount(0);
  expect(await card.evaluate((el) => /不正解|間違|×|ざんねん/.test(el.textContent ?? ''))).toBe(false);
  // q2: right first ◎
  await lesson(page).locator('[data-en-next]').click();
  await lesson(page).locator('[data-en-q="1"] [data-choice="1"]').click();
  await expect(lesson(page).locator('[data-en-q="1"] [data-en-reveal]')).toContainText('◎ 聞き取れました');
  // q3: a miss, then right: ○
  await lesson(page).locator('[data-en-next]').click();
  await lesson(page).locator('[data-en-q="2"] [data-choice="0"]').click();
  await lesson(page).locator('[data-en-q="2"] [data-choice="1"]').click();
  await expect(lesson(page).locator('[data-en-q="2"] [data-en-reveal]')).toContainText('○ 聞き取れました');
  // q4: a miss, then 答えを見る
  await lesson(page).locator('[data-en-next]').click();
  await lesson(page).locator('[data-en-q="3"] [data-choice="0"]').click();
  await lesson(page).locator('[data-en-q="3"] [data-en-show]').click();
  await expect(lesson(page).locator('[data-en-q="3"]')).toHaveAttribute('data-result', 'shown');
});

test('まとめ: the scenes to hear again, the clip’s row: ✓ in the library, 今週 1/3日, これまで 1本; a dictation counts the words heard', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  await lesson(page).locator('[data-en-q="0"] [data-choice="1"]').click();
  // to the dictation (q7), unanswered on the way
  for (let i = 0; i < 6; i++) await lesson(page).locator('[data-en-next]').click();
  const dict = lesson(page).locator('[data-en-q="6"]');
  await dict.locator('[data-en-dict]').fill('I’m doing well');
  await dict.locator('[data-en-dict-go]').click();
  await expect(dict.locator('[data-en-reveal]')).toContainText('2/3 語 聞き取れました');
  await dict.locator('[data-en-dict]').fill("I'm doing better.");
  await dict.locator('[data-en-dict-go]').click();
  await expect(dict.locator('[data-en-reveal]')).toContainText('3/3 語 聞き取れました');
  await lesson(page).locator('[data-en-next]').click();
  await lesson(page).locator('[data-en-next]').click();
  await expect(lesson(page).locator('[data-en-end]')).toBeVisible();
  // every scene not heard in full the first time (the unanswered too): all but q1 and the dictation
  await expect(lesson(page).locator('[data-en-again]')).toHaveCount(6);
  await lesson(page).locator('[data-en-done]').click();
  await expect(sheet(page).locator('[data-en-clip="waitress"]')).toHaveAttribute('data-done', 'true');
  await expect(sheet(page).locator('[data-en-week]')).toHaveAttribute('data-en-week', '1');
  await expect(sheet(page).locator('[data-en-week-n]')).toHaveText('1/3日');
  await expect(sheet(page).locator('[data-en-clips]')).toHaveText('これまで 1本');
  await expect(sheet(page).locator('[data-en-today]')).toContainText('今日の動画 完了 ✓');
});

test('⚑ 報告 on a question and on the clip, a kind and a note or neither; 報告した内容 lists them', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-flag="clip"]').click();
  const fs = page.locator('dialog[open] [data-en-flag-sheet="clip"]');
  await expect(fs).toContainText('このクリップ全体');
  await expect(fs.locator('[data-en-kind="other"]')).toHaveAttribute('aria-checked', 'true');
  await fs.locator('[data-en-flag-send]').click();
  await expect(page.locator('dialog[open] [data-en-flag-thanks]')).toBeVisible();
  await page.locator('dialog[open] [data-en-flag-thanks] + .btn').click();
  await lesson(page).locator('[data-en-to-q]').click();
  await lesson(page).locator('[data-en-flag="0"]').click();
  const fq = page.locator('dialog[open] [data-en-flag-sheet="0"]');
  await expect(fq).toContainText('質問 1：What is Rachel asking Terry for?');
  await fq.locator('[data-en-kind="answer"]').click();
  await fq.locator('[data-en-flag-note]').fill('salary の前が聞こえない');
  await fq.locator('[data-en-flag-send]').click();
  await page.locator('dialog[open] [data-en-flag-thanks] + .btn').click();
  // ⚙ → 報告した内容: newest first, both 確認待ち
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await sheet(page).locator('[data-en-gear]').click();
  const rows = sheet(page).locator('[data-en-flag-row]');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('答え · Rachel Is a Bad Waitress · 質問 1');
  await expect(rows.nth(0)).toContainText('「salary の前が聞こえない」');
  await expect(rows.nth(1)).toContainText('その他 · Rachel Is a Bad Waitress · クリップ');
  await expect(rows.nth(0)).toHaveAttribute('data-en-flag-row', 'open');
});

test('the player offline: a note in its place, the embed once back online; unavailable: a note and a link to YouTube', async ({ page, context }) => {
  await fakeYoutube(page);
  await open(page);
  await context.setOffline(true);
  await sheet(page).locator('[data-en-start]').click();
  await expect(lesson(page).locator('[data-yt-offline]')).toContainText('オフライン');
  await expect(lesson(page).locator('[data-yt-frame]')).toHaveCount(0);
  // the questions work offline all the same
  await lesson(page).locator('[data-en-to-q]').click();
  await lesson(page).locator('[data-en-q="0"] [data-choice="1"]').click();
  await expect(lesson(page).locator('[data-en-q="0"]')).toHaveAttribute('data-result', 'first');
  await context.setOffline(false);
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
});

test('a video that can’t be embedded: the note, YouTube’s link, もう一度読み込む', async ({ page }) => {
  await fakeYoutube(page, { error: 150 });
  await open(page);
  await sheet(page).locator('[data-en-start]').click();
  const note = lesson(page).locator('[data-yt-unavailable]');
  await expect(note).toHaveAttribute('data-yt-unavailable', '150');
  await expect(note.locator('a')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=lm2MpPpkGL8');
  await expect(note.locator('[data-yt-retry]')).toBeVisible();
});

test('a play that doesn’t start (iOS wants a tap on the video): the hint; none once one has played', async ({ page }) => {
  await fakeYoutube(page, { noPlay: true });
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect(lesson(page).locator('[data-yt-stuck]')).toContainText('動画を一度タップしてください');
});
