// English Study (docs/english.md): the sheet's home, a clip's lesson over YouTube's embed (stood in for: e2e/youtube.ts,
// nothing leaves the preview), never locked: 質問へ and ‹ 前へ / 次へ › always work; a miss replays the segment with the
// cue and a quiet 答えを見る, a second miss 「答えはこれ」, never a mark on the pick; まとめ writes the clip's row (✓ in
// the library, 今週 1/3日, これまで 1本); ⚑ 報告 on the clip and a question, listed in ⚙'s 報告した内容; the player's
// offline and unavailable states, 字幕 オフ / 英語 / 日本語 and 場面のあらすじ; セリフ (the transcript) follows the playhead, a line
// tapped plays from there; a lesson left resumes where it was. The logic tier.
import { expect, PINNED_DATE, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { fakeYoutube, ytCommands } from './youtube.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { planOf } from '../src/lib/english/plan.ts';
import { deckOf, metaOf } from '../src/lib/english/catalog.ts';
import { shownOf } from '../src/lib/english/collections.ts';
import { hideAndShow } from './memory.ts';
import { momentsOf, splitUse } from '../src/lib/english/phrases.ts';
import waitressScenes from '../src/lib/english/scenes/lm2MpPpkGL8.json' with { type: 'json' };
import waitressEn from '../src/lib/english/transcripts/lm2MpPpkGL8.en.json' with { type: 'json' };
import waitressJa from '../src/lib/english/transcripts/lm2MpPpkGL8.ja.json' with { type: 'json' };

/** The clips as offered (the shared plan). */
const PLAN = planOf(CLIPS);
/** The clip these tests study, today's whatever the plan's order (plan-order.ts is re-planned as content changes):
 *  every clip before it skipped (別の動画にする's own record, prefs.ts) on the pinned day, for each player. */
const AHEAD = PLAN.slice(0, PLAN.findIndex((c) => c.id === waitress.id)).map((c) => c.id);
/** The plan's clip after waitress (the next unfinished, unskipped one). */
const AFTER = PLAN[AHEAD.length + 1];

/** The card at place `i` of the lesson, and its question (this play's draw: by its id). */
const cardAt = (p: Page, i: number) => p.locator(`dialog[open] [data-en-lesson] [data-en-q="${i}"]`);
async function questionAt(p: Page, i: number) {
  const id = await cardAt(p, i).getAttribute('data-en-qid');
  return waitress.questions.find((q) => q.id === id)!;
}

/** The player's commands from the `from`th on (addEventListener and the captions' unloadModule aside). */
const since = async (p: Page, from: number) => (await ytCommands(p)).slice(from).filter((c) => !['addEventListener', 'unloadModule'].includes(c[0]));
/** The commands from the `from`th on, after the first `func` (a pause from a move just before may land first:
 *  postMessage is async, slower on a throttled runner). */
const from = async (p: Page, n: number, func: string) => {
  const c = await since(p, n);
  const i = c.findIndex((x) => x[0] === func);
  return i < 0 ? [] : c.slice(i);
};

test.use({ viewport: { width: 393, height: 852 } });

const sheet = (p: Page) => p.locator('dialog[open] [data-english]');
const lesson = (p: Page) => sheet(p).locator('[data-en-lesson]');
const at = (p: Page) => lesson(p).getAttribute('data-en-at');

async function open(page: Page, q = '') {
  await page.addInitScript(([ids, on]) => {
    const k = 'island.english.skip';
    if (localStorage.getItem(k) !== null) return; // a skip made in the test (or a second open) kept
    const day = Object.fromEntries(ids.map((id) => [id, on]));
    localStorage.setItem(k, JSON.stringify({ A: day, B: day, G: day }));
  }, [AHEAD, PINNED_DATE.slice(0, 10)] as const);
  await page.goto(`?demo${q}`);
  await islandUp(page);
  await fromMenu(page, 'english');
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('English Study');
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
  // the thumbnail (YouTube's still, no referrer), the play's size; the library card's next clips and すべて見る
  const thumb = sheet(page).locator('[data-en-today] [data-en-thumb] img');
  await expect(thumb).toHaveAttribute('src', 'https://i.ytimg.com/vi/lm2MpPpkGL8/hqdefault.jpg');
  await expect(thumb).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(sheet(page).locator('[data-en-today]')).toContainText('Friends · ゆっくり · 職場 · 6問');
  await expect(sheet(page).locator('[data-en-lib] [data-en-clip]')).toHaveCount(3);
  await expect(sheet(page).locator('[data-en-lib] [data-en-clip="waitress"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-en-all]')).toHaveText(new RegExp(`すべて見る（${CLIPS.length}本）`));
  await start(page);
  // the embed: privacy-enhanced, the JS API for our origin, inline, its own referrer policy
  const frame = lesson(page).locator('[data-yt-frame]');
  await expect(frame).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/lm2MpPpkGL8\?enablejsapi=1&playsinline=1&.*origin=http/);
  await expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  // edge to edge, 16:9: the frame's size is what picks YouTube's quality (it can't be set)
  const box = (await frame.boundingBox())!;
  expect([box.x, Math.round(box.width), Math.round(box.height)]).toEqual([0, 393, Math.round((393 * 9) / 16)]);
  expect((await ytCommands(page)).some((c) => c[0] === 'setPlaybackQuality')).toBe(false);
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
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => c[0])).toEqual(['seekTo', 'playVideo']);
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'playing');
  // ‹ home (the lesson's place kept: 続きから)
  await lesson(page).locator('[data-en-to-q]').click();
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(sheet(page).locator('[data-en-start]')).toHaveText('続きから');
  await sheet(page).locator('[data-en-start]').click();
  expect(await at(page)).toBe('0');
});

test('a miss: the segment again with the cue, one retry, then 答えはこれ; never a mark on a pick; ◎ first, ○ second; a segment pauses at its end', async ({ page }) => {
  await fakeYoutube(page, { rate: 8 });
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  const card = lesson(page).locator('[data-en-q="0"]');
  // q1 (this draw's: its answer, segment and line from the bank, which content edits change): a miss
  const q0 = await questionAt(page, 0);
  const [miss1, miss2] = q0.choices!.flatMap((_, k) => (k === q0.a ? [] : [k]));
  // the stem as written, its *key words* underlined, never the stars
  await expect(card.locator('.stem')).toHaveText(q0.stem.replaceAll('*', ''));
  // question 1 says what to do (its question is English) till the first pick
  await expect(card.locator('[data-en-howto]')).toHaveText('聞いてから選びましょう。何回聞いてもOK');
  const n0 = (await ytCommands(page)).length;
  await card.locator(`[data-choice="${miss1}"]`).click();
  await expect(card.locator('[data-en-howto]')).toHaveCount(0);
  await expect(card.locator('[data-en-nudge]')).toContainText('もう一度聞いてみましょう。');
  await expect(card.locator('[data-en-nudge]')).toContainText(q0.cue);
  // brought up only as far as it takes: the question and its choices stay on screen for the retry
  await expect(card.locator('[data-en-nudge]')).toBeInViewport();
  await expect(card.locator('.stem')).toBeInViewport();
  await expect(card.locator('[data-choice]').first()).toBeInViewport();
  await expect(card).toHaveAttribute('data-result', 'open');
  await expect(card.locator('[data-ans]')).toHaveCount(0);
  // the segment replayed by itself: from its start, paused at its end
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => c[0])).toEqual(['seekTo', 'playVideo', 'pauseVideo']);
  const cmds = await from(page, n0, 'seekTo');
  expect(cmds.find((c) => c[0] === 'seekTo')?.[1]).toEqual([q0.seg[0], true]);
  // (and a little past it: player.svelte.ts SEG_TAIL, 0.4 s)
  expect(cmds.find((c) => c[0] === 'pauseVideo')![2]).toBeGreaterThanOrEqual(q0.seg[1] + 0.3);
  // a second miss: the answer, ○ on it, the notes; the picks never marked, nothing coral
  await card.locator(`[data-choice="${miss2}"]`).click();
  await expect(card).toHaveAttribute('data-result', 'shown');
  await expect(card.locator('[data-en-reveal]')).toContainText('答えはこれ');
  await expect(card.locator('[data-ans]')).toHaveAttribute('data-choice', String(q0.a));
  // 意味 and 使えるフレーズ open; くわしく (言っていること, 迷いやすい点) opened by itself after a miss
  await expect(card.locator('[data-en-reveal] .phrase')).toBeVisible();
  await expect(card.locator('[data-en-more]')).toHaveAttribute('open', '');
  await expect(card.locator('[data-en-said]')).toBeVisible();
  await expect(card.locator('[data-en-reveal]')).toContainText('言っていること');
  await expect(card.locator('[data-en-reveal] u')).toHaveText(/\*(.+?)\*/.exec(q0.line!)![1]);
  await expect(card.locator('[data-en-nudge]')).toHaveCount(0);
  expect(await card.evaluate((el) => /不正解|間違|×|ざんねん/.test(el.textContent ?? ''))).toBe(false);
  // the next three choice items: right first ◎; a miss then right ○; a miss then 答えを見る
  const plan = ['first', 'second', 'shown'];
  for (let i = 1; plan.length; i++) {
    await lesson(page).locator('[data-en-next]').click();
    const x = await questionAt(page, i);
    if (!x.choices) continue;
    const wrong = x.choices.findIndex((_, k) => k !== x.a);
    const how = plan.shift()!;
    if (how !== 'first') await cardAt(page, i).locator(`[data-choice="${wrong}"]`).click();
    if (how === 'shown') await cardAt(page, i).locator('[data-en-show]').click();
    else await cardAt(page, i).locator(`[data-choice="${x.a}"]`).click();
    await expect(cardAt(page, i)).toHaveAttribute('data-result', how);
    if (how !== 'shown') await expect(cardAt(page, i).locator('[data-en-reveal]')).toContainText(how === 'first' ? '◎ 聞き取れました' : '○ 聞き取れました');
    // くわしく: closed on a first try (a tap opens it), open after a miss
    const said = cardAt(page, i).locator('[data-en-said]');
    if (how === 'first') {
      await expect(said).toBeHidden();
      await cardAt(page, i).locator('[data-en-more] summary').click();
    }
    await expect(said).toBeVisible();
  }
});

test('まとめ: the scenes to hear again, the clip’s row: ✓ in the library, 今週 1/3日, これまで 1本; a dictation counts the words heard', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  await cardAt(page, 0).locator(`[data-choice="${(await questionAt(page, 0)).a}"]`).click();
  // on to まとめ, the others unanswered; a dictation drawn: some words, then all
  let n = 1, dict = false;
  for (; ; n++) {
    await lesson(page).locator('[data-en-next]').click();
    if (await lesson(page).locator('[data-en-end]').count()) break;
    const x = await questionAt(page, n);
    if (!x.answer) continue;
    dict = true;
    const c = cardAt(page, n), all = x.answer.split(' ').length;
    // no word heard: never a 0, the answer shown
    await c.locator('[data-en-dict]').fill('zzz');
    await c.locator('[data-en-dict-go]').click();
    await expect(c.locator('[data-en-reveal] .rhead')).toHaveText('答えはこれ');
    await c.locator('[data-en-dict]').fill(x.answer.split(' ').slice(1).join(' '));
    await c.locator('[data-en-dict-go]').click();
    await expect(c.locator('[data-en-reveal]')).toContainText(`${all - 1}/${all} 語 聞き取れました`);
    // the words apart, as typed
    expect((await c.locator('[data-en-reveal] .words').textContent())!.trim().split(/\s+/)).toHaveLength(all);
    await c.locator('[data-en-dict]').fill(x.answer.toUpperCase() + '.');
    await c.locator('[data-en-dict-go]').click();
    await expect(c.locator('[data-en-reveal]')).toContainText(`${all}/${all} 語 聞き取れました`);
  }
  expect(await at(page)).toBe(String(n));
  // every scene not heard in full the first time (the unanswered too): all but the first and a full dictation
  await expect(lesson(page).locator('[data-en-again]')).toHaveCount(n - 1 - (dict ? 1 : 0));
  await expect(lesson(page).locator('[data-en-end]')).toContainText('この動画は完了です');
  // an again row says the line heard there (its stars dropped), not the phrase to use
  const lines = waitress.questions.flatMap((x) => (x.line ? [x.line.replaceAll('*', '')] : []));
  expect(lines).toContain((await lesson(page).locator('[data-en-again] .ph').first().textContent())!.trim());
  await lesson(page).locator('[data-en-done]').click();
  // the main card goes on to the plan's next clip (the finished one isn't offered again today, not even as a row)
  await expect(sheet(page).locator('[data-en-today]')).toHaveAttribute('data-en-today', AFTER.id);
  await expect(sheet(page).locator('[data-en-today] [data-en-start]')).toHaveText('始める');
  await expect(sheet(page).locator('[data-en-lib] [data-en-clip="waitress"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-en-week]')).toHaveAttribute('data-en-week', '1');
  await expect(sheet(page).locator('[data-en-week-n]')).toHaveText('1/3日');
  await expect(sheet(page).locator('[data-en-clips]')).toHaveText('これまで 1本');
  await expect(sheet(page).locator('[data-en-today]')).toContainText('次の動画 · 今日の分は完了');
  // the library: ✓ on its row, last
  await sheet(page).locator('[data-en-all]').click();
  // (もっと見る till the whole library shows: it grows as banks land)
  for (let i = 0; i * 20 < PLAN.length - 20; i++) await sheet(page).locator('[data-en-more]').click();
  await expect(sheet(page).locator('[data-en-more]')).toHaveCount(0);
  const row = sheet(page).locator('[data-en-list] [data-en-clip="waitress"]');
  await expect(row).toHaveAttribute('data-done', 'true');
  await expect(sheet(page).locator('[data-en-list] [data-en-clip]').last()).toHaveAttribute('data-en-clip', 'waitress');
});

test('⚑ 報告 on a question and on the clip, a kind and a note or neither; 報告した内容 lists them', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  // the clip's: ツール's row (none on the watch card)
  await expect(lesson(page).locator('[data-en-flag]')).toHaveCount(0);
  await lesson(page).locator('[data-en-tools]').click();
  await page.locator('dialog[open] [data-en-tools-sheet] [data-en-flag="clip"]').click();
  const fs = page.locator('dialog[open] [data-en-flag-sheet="clip"]');
  await expect(fs).toContainText('この動画全体');
  await expect(fs.locator('[data-en-kind="other"]')).toHaveAttribute('aria-checked', 'true');
  await fs.locator('[data-en-flag-send]').click();
  await expect(page.locator('dialog[open] [data-en-flag-thanks]')).toBeVisible();
  await page.locator('dialog[open] [data-en-flag-thanks] + .btn').click();
  await lesson(page).locator('[data-en-to-q]').click();
  // the question's: a quiet link at the card's foot, under its choices, a full hit
  const qf = lesson(page).locator('[data-en-flag="0"]');
  await expect(qf).toHaveAttribute('aria-label', 'この質問を報告');
  const [fb, lastChoice] = [(await qf.boundingBox())!, (await cardAt(page, 0).locator('[data-choice]').last().boundingBox())!];
  expect(fb.y).toBeGreaterThan(lastChoice.y + lastChoice.height - 1);
  expect(fb.height).toBeGreaterThanOrEqual(44);
  await qf.click();
  const fq = page.locator('dialog[open] [data-en-flag-sheet="0"]');
  const q0 = await questionAt(page, 0);
  await expect(fq).toContainText(`質問 1：${q0.stem}`);
  await fq.locator('[data-en-kind="answer"]').click();
  await fq.locator('[data-en-flag-note]').fill('salary の前が聞こえない');
  await fq.locator('[data-en-flag-send]').click();
  await page.locator('dialog[open] [data-en-flag-thanks] + .btn').click();
  // ⚙ → 報告した内容: newest first, both 確認待ち
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await sheet(page).locator('[data-en-gear]').click();
  const rows = sheet(page).locator('[data-en-flag-row]');
  await expect(rows).toHaveCount(2);
  // (the question as the flag saw it: no bank needed)
  await expect(rows.nth(0)).toContainText(`答え · Rachel Is a Bad Waitress · 質問：${q0.stem}`);
  await expect(rows.nth(0)).toContainText('「salary の前が聞こえない」');
  await expect(rows.nth(1)).toContainText('その他 · Rachel Is a Bad Waitress · 動画');
  await expect(rows.nth(0)).toHaveAttribute('data-en-flag-row', 'open');
});

test('the player offline: a note in its place, the embed once back online; today’s bank fetched ahead, so its questions work', async ({ page, context }) => {
  await fakeYoutube(page);
  const ahead = page.waitForResponse(/\/english\/c\/waitress\.\w+\.json$/);
  await open(page);
  expect((await ahead).ok()).toBe(true);
  await context.setOffline(true);
  await sheet(page).locator('[data-en-start]').click();
  await expect(lesson(page).locator('[data-yt-offline]')).toContainText('オフライン');
  await expect(lesson(page).locator('[data-yt-frame]')).toHaveCount(0);
  // the questions work offline all the same
  await lesson(page).locator('[data-en-to-q]').click();
  await lesson(page).locator(`[data-en-q="0"] [data-choice="${(await questionAt(page, 0)).a}"]`).click();
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

test('the controls: play / pause on from where it stopped, −5 秒, the scrubber, 0.75× only when offered; a question’s part from its card only', async ({ page }) => {
  await fakeYoutube(page, { rate: 4 });
  await open(page);
  await start(page);
  const c = lesson(page).locator('[data-yt-controls]');
  const order = () => c.locator('button, input').evaluateAll((els) => els.map((e) => Object.keys((e as HTMLElement).dataset).find((k) => k.startsWith('yt'))));
  // ▶ | the scrubber | 字幕, then −5秒 0.75× under them, each a full 44 pt; no ⋯
  await expect.poll(order).toEqual(['ytToggle', 'ytScrub', 'ytCc', 'ytBack5', 'ytRate']);
  await expect(c.locator('[data-yt-cc]')).toHaveAttribute('aria-label', '字幕 オフ（タップで英語）');
  for (const b of await c.locator('button').all()) {
    const box = (await b.boundingBox())!;
    expect(Math.min(box.width, box.height), await b.textContent() ?? '').toBeGreaterThanOrEqual(44);
  }
  const n0 = (await ytCommands(page)).length;
  await c.locator('[data-yt-toggle="play"]').click();
  await expect(c.locator('[data-yt-toggle="pause"]')).toBeVisible();
  await expect(c.locator('[data-yt-clock]')).toHaveText(/^\d:\d\d \/ \d:\d\d$/);
  await c.locator('[data-yt-toggle="pause"]').click();
  await c.locator('[data-yt-toggle="play"]').click();
  await expect.poll(async () => (await from(page, n0, 'playVideo')).map((x) => x[0])).toEqual(['playVideo', 'pauseVideo', 'playVideo']);
  // −5 秒 and the scrubber seek, never locked
  const n1 = (await ytCommands(page)).length;
  await c.locator('[data-yt-scrub]').fill('40');
  await expect.poll(async () => (await since(page, n1)).at(-1)).toEqual(['seekTo', [40, true], expect.any(Number)]);
  await c.locator('[data-yt-back5]').click();
  await expect.poll(async () => { const x = (await since(page, n1)).at(-1)!; return [x[0], (x[1] as number[])[0] < 40]; }).toEqual(['seekTo', true]);
  // 0.75×: offered here
  await c.locator('[data-yt-rate]').click();
  await expect.poll(async () => (await since(page, n1)).at(-1)?.slice(0, 2)).toEqual(['setPlaybackRate', [0.75]]);
  await expect(c.locator('[data-yt-rate]')).toHaveAttribute('aria-pressed', 'true');
  // on a question: one row (▶ | the scrubber | 字幕), its part from the card's この部分を聞く; the speed in ツール
  await lesson(page).locator('[data-en-to-q]').click();
  expect(await order()).toEqual(['ytToggle', 'ytScrub', 'ytCc']);
  expect(Math.round((await c.boundingBox())!.height)).toBe(44);
  await lesson(page).locator('[data-en-tools]').click();
  const rate = page.locator('dialog[open] [data-en-tools-sheet] [data-en-rate]');
  await expect(rate).toHaveText(['1×', '0.75×']);
  await expect(rate.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await rate.nth(0).click();
  await expect.poll(async () => (await since(page, n1)).at(-1)?.slice(0, 2)).toEqual(['setPlaybackRate', [1]]);
  await page.locator('dialog[open]:has([data-en-tools-sheet]) .navbar .close').last().click();
  await expect(c.locator('[data-yt-seg]')).toHaveCount(0);
  const start0 = (await questionAt(page, 0)).seg[0];
  const n2 = (await ytCommands(page)).length;
  await lesson(page).locator('[data-en-hear]').click();
  // (the move to the card's pause may land just before: the segment's seek and play follow, whatever came first)
  await expect.poll(async () => {
    const c2 = (await since(page, n2)).map((x) => JSON.stringify(x.slice(0, 2)));
    const i = c2.indexOf(JSON.stringify(['seekTo', [start0, true]]));
    return i >= 0 && c2[i + 1] === JSON.stringify(['playVideo', []]);
  }).toBe(true);
});

test('no speed control when the frame offers only 1×', async ({ page }) => {
  await fakeYoutube(page, { rates: [1] });
  await open(page);
  await start(page);
  await expect(lesson(page).locator('[data-yt-scrub]')).toBeEnabled();
  await expect(lesson(page).locator('[data-yt-rate]')).toHaveCount(0);
  await lesson(page).locator('[data-en-tools]').click();
  await expect(page.locator('dialog[open] [data-en-tools-sheet]')).toBeVisible();
  await expect(page.locator('dialog[open] [data-en-rate]')).toHaveCount(0);
});

/** A question card's choices and ⚑ inside the scroller's view (the foot's top), unscrolled. */
async function aboveFold(page: Page) {
  await expect(lesson(page).locator('[data-en-q] [data-en-flag]')).toBeVisible();
  return lesson(page).evaluate((el) => {
    const body = el.querySelector('.body')!, view = body.getBoundingClientRect(), card = el.querySelector('[data-en-q]')!;
    const inView = (e: Element) => { const r = e.getBoundingClientRect(); return r.top >= view.top && r.bottom <= view.bottom; };
    return { scrolled: body.scrollTop, choices: [...card.querySelectorAll('[data-choice]')].map(inView), flag: inView(card.querySelector('[data-en-flag]')!) };
  });
}

test('a question card at 393×852: every choice and ⚑ 報告 above the fold; the 聞いてから hint on question 1 only', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').tap();
  for (const i of [0, 1]) {
    await expect(lesson(page)).toHaveAttribute('data-en-at', String(i));
    await expect(lesson(page).locator('[data-en-howto]')).toHaveCount(i ? 0 : 1);
    const f = await aboveFold(page);
    if (!i) expect(f.choices.length).toBeGreaterThanOrEqual(3); // (the next may be a dictation: its field, no choices)
    expect(f).toEqual({ scrolled: 0, choices: f.choices.map(() => true), flag: true });
    await lesson(page).locator('[data-en-next]').tap();
  }
});

test.describe('375×667', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test('a question card at 375×667: the first two choices without scrolling (question 1, its hint and all)', async ({ page }) => {
    await fakeYoutube(page);
    await open(page);
    await start(page);
    await lesson(page).locator('[data-en-to-q]').tap();
    await expect(lesson(page).locator('[data-en-howto]')).toBeVisible();
    const f = await aboveFold(page);
    expect([f.scrolled, ...f.choices.slice(0, 2)]).toEqual([0, true, true]);
  });
});

test('no captions on the video, and an answer’s notes come into view (they sit under the choices, below an iPhone’s fold)', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  // captions unloaded at ready (a viewer's own caption setting would turn them on), and again once it plays
  const unloads = async () => (await ytCommands(page)).filter((c) => c[0] === 'unloadModule').map((c) => JSON.stringify(c[1]));
  await expect.poll(unloads).toEqual(expect.arrayContaining(['["captions"]', '["cc"]']));
  const n0 = (await unloads()).length;
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'playing');
  await expect.poll(async () => (await unloads()).length).toBeGreaterThan(n0);
  // the first question, answered right: its notes scrolled into view
  await lesson(page).locator('[data-en-to-q]').click();
  const q = await questionAt(page, 0);
  await cardAt(page, 0).locator(`[data-choice="${q.a}"]`).click();
  // brought up with the answered choice on top: the ○ row and the reveal's head both on screen
  await expect(cardAt(page, 0).locator('[data-ans]')).toBeInViewport();
  await expect(cardAt(page, 0).locator('[data-en-reveal]')).toBeInViewport();
  await expect(cardAt(page, 0).locator('[data-en-reveal] .rhead')).toBeInViewport();
});

test('字幕: オフ → 英語 → 日本語 at any point, each kept through each play, off again in the next lesson', async ({ page }) => {
  await fakeYoutube(page, { rate: 8 });
  await open(page);
  await start(page);
  const funcs = async (n = 0) => (await ytCommands(page)).slice(n).map((c) => `${c[0]} ${JSON.stringify(c[1])}`);
  const cc = lesson(page).locator('[data-yt-cc]');
  await expect(cc).toHaveText('字幕 オフ');
  await expect(cc).toHaveAttribute('aria-pressed', 'false');
  // off: unloaded at ready and at a play, never loaded
  await expect.poll(() => funcs()).toEqual(expect.arrayContaining(['unloadModule ["captions"]', 'unloadModule ["cc"]']));
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'playing');
  expect((await funcs()).filter((f) => /^(loadModule|setOption)/.test(f))).toEqual([]);
  // 英語, mid-play: loaded with the English track at once, again at the next play, never unloaded
  const n0 = (await ytCommands(page)).length;
  await cc.click();
  await expect(cc).toHaveText('字幕 英語');
  await expect(cc).toHaveAttribute('aria-pressed', 'true');
  // (大, the default size, each time they load)
  await expect.poll(() => funcs(n0)).toEqual(['loadModule ["captions"]', 'setOption ["captions","track",{"languageCode":"en"}]', 'setOption ["captions","fontSize",1]']);
  await lesson(page).locator('[data-en-to-q]').click();
  await lesson(page).locator('[data-en-hear]').click();
  await expect.poll(async () => (await funcs(n0)).filter((f) => f.startsWith('loadModule')).length).toBeGreaterThan(1);
  expect((await funcs(n0)).filter((f) => f.startsWith('unloadModule'))).toEqual([]);
  // 日本語: YouTube's translation of the English (the frame reports no tracks), again at the next play
  const n1 = (await ytCommands(page)).length;
  await cc.click();
  await expect(cc).toHaveText('字幕 日本語');
  await expect(cc).toHaveAttribute('aria-pressed', 'true');
  const tr = 'setOption ["captions","track",{"languageCode":"en","translationLanguage":{"languageCode":"ja"}}]';
  await expect.poll(() => funcs(n1)).toEqual(['loadModule ["captions"]', tr, 'setOption ["captions","fontSize",1]']);
  await lesson(page).locator('[data-yt-toggle="pause"]').click();
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'paused');
  await lesson(page).locator('[data-en-hear]').click();
  await expect.poll(async () => (await funcs(n1)).filter((f) => f === tr).length).toBeGreaterThan(1);
  expect((await funcs(n1)).filter((f) => f.startsWith('unloadModule') || f.includes('"languageCode":"en"}]'))).toEqual([]);
  // オフ again: unloaded
  const n2 = (await ytCommands(page)).length;
  await cc.click();
  await expect(cc).toHaveText('字幕 オフ');
  await expect(cc).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => funcs(n2)).toEqual(['unloadModule ["captions"]', 'unloadModule ["cc"]']);
  // on, then the lesson left: the next opening starts off
  await cc.click();
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await start(page);
  await expect(lesson(page).locator('[data-yt-cc]')).toHaveAttribute('data-yt-cc', 'off');
  await expect.poll(() => funcs()).toEqual(expect.arrayContaining(['unloadModule ["captions"]']));
  expect((await funcs()).filter((f) => f.startsWith('loadModule'))).toEqual([]);
});

test('字幕 日本語: a Japanese track the frame lists is asked for, and taken at once from the next play', async ({ page }) => {
  await fakeYoutube(page, { rate: 8, tracks: ['en', 'ja'] });
  await open(page);
  await start(page);
  const funcs = async (n = 0) => (await ytCommands(page)).slice(n).map((c) => `${c[0]} ${JSON.stringify(c[1])}`);
  const cc = lesson(page).locator('[data-yt-cc]');
  await cc.click();
  await cc.click();
  await expect(cc).toHaveAttribute('data-yt-cc', 'ja');
  const ja = 'setOption ["captions","track",{"languageCode":"ja"}]';
  await expect.poll(async () => (await funcs()).includes(ja)).toBe(true);
  const n0 = (await ytCommands(page)).length;
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect.poll(() => funcs(n0)).toEqual(expect.arrayContaining(['loadModule ["captions"]', ja]));
  expect((await funcs(n0)).filter((f) => f.includes('translationLanguage'))).toEqual([]);
});

test('字幕の大きさ (ツール): 大 by default, sent each time captions load and when changed, kept on this phone; the sheet’s choice is the chip’s', async ({ page }) => {
  await fakeYoutube(page, { rate: 8 });
  await open(page);
  await start(page);
  const funcs = async (n = 0) => (await ytCommands(page)).slice(n).map((c) => `${c[0]} ${JSON.stringify(c[1])}`);
  const size = (n: number) => `setOption ["captions","fontSize",${n}]`;
  const sh = page.locator('dialog[open] [data-en-tools-sheet]');
  await lesson(page).locator('[data-en-tools]').click();
  // the size chips a full 44 × 44 (polled: the sheet may still be rising)
  // (the kit's Segmented: 36 drawn in a 44 hit)
  await expect.poll(() => sh.locator('[data-en-cc-size]').evaluateAll((els) => Math.min(...els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height))))).toBeGreaterThanOrEqual(36);
  await expect(sh.locator('[data-en-cc-mode="off"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sh.locator('[data-en-cc-size="1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sh.locator('[data-en-cc-size]')).toHaveText(['小', '中', '大', '特大']);
  // captions off: a size is kept, nothing sent
  const n0 = (await ytCommands(page)).length;
  await sh.locator('[data-en-cc-size="2"]').click();
  await expect(sh.locator('[data-en-cc-size="2"]')).toHaveAttribute('aria-pressed', 'true');
  expect((await funcs(n0)).filter((f) => f.includes('fontSize'))).toEqual([]);
  // 英語 from the sheet: loaded with it; another size: sent at once
  await sh.locator('[data-en-cc-mode="en"]').click();
  await expect(lesson(page).locator('[data-yt-cc]')).toHaveAttribute('data-yt-cc', 'en');
  await expect.poll(() => funcs(n0)).toEqual(['loadModule ["captions"]', 'setOption ["captions","track",{"languageCode":"en"}]', size(2)]);
  const n1 = (await ytCommands(page)).length;
  await sh.locator('[data-en-cc-size="-1"]').click();
  await expect.poll(() => funcs(n1)).toEqual([size(-1)]);
  await page.keyboard.press('Escape');
  await expect(sh).toHaveCount(0);
  // this phone's: the next lesson loads its captions at 小
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await start(page);
  const n2 = (await ytCommands(page)).length;
  await lesson(page).locator('[data-yt-cc]').click();
  await expect.poll(() => funcs(n2)).toEqual(['loadModule ["captions"]', 'setOption ["captions","track",{"languageCode":"en"}]', size(-1)]);
});

test('場面のあらすじ: one place, directly under the video, following the playhead, its list seeks; 字幕 never moves it; hidden on a question card, back at まとめ; ツール’s あらすじ hides it on this phone; a clip without scenes shows none', async ({ page }) => {
  await fakeYoutube(page, { rate: 8 });
  await open(page);
  await start(page);
  const { scenes, beats } = waitressScenes;
  const strip = lesson(page).locator('[data-en-scene]');
  await expect(strip).toHaveAttribute('data-en-scene', '0');
  await expect(strip.locator('.ja')).toHaveText(beats[0].ja);
  // directly under the video, a full hit
  const top = async () => Math.round((await strip.boundingBox())!.y);
  const frame = (await lesson(page).locator('[data-yt-frame]').boundingBox())!;
  expect(await top()).toBe(Math.round(frame.y + frame.height));
  const y0 = await top();
  expect((await strip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // the list: every scene, its time then its line, the one on now marked; one tapped plays from there
  await strip.click();
  const rows = page.locator('dialog[open] [data-en-scenes] [data-en-scene-row]');
  await expect(rows).toHaveCount(scenes.length);
  await expect(rows.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(rows.nth(3)).toHaveText(new RegExp(`0:${String(scenes[3].t[0]).padStart(2, '0')}\\s*${scenes[3].ja}`));
  const n0 = (await ytCommands(page)).length;
  await rows.nth(3).click();
  await expect(page.locator('dialog[open] [data-en-scenes]')).toHaveCount(0);
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => JSON.stringify(c.slice(0, 2)))).toEqual([JSON.stringify(['seekTo', [scenes[3].t[0], true]]), JSON.stringify(['playVideo', []])]);
  await expect(strip).toHaveAttribute('data-en-scene', '3');
  // 英語, then 日本語, mid-play: the line stays where it is (no reflow); the clip plays on (no seek, no new play)
  const n1 = (await ytCommands(page)).length;
  const cc = lesson(page).locator('[data-yt-cc]');
  const card = lesson(page).locator('[data-en-watch]');
  const cardY = Math.round((await card.boundingBox())!.y);
  await cc.click();
  await expect(cc).toHaveAttribute('data-yt-cc', 'en');
  expect(await top()).toBe(y0);
  await cc.click();
  await expect(cc).toHaveAttribute('data-yt-cc', 'ja');
  expect(await top()).toBe(y0);
  expect(Math.round((await card.boundingBox())!.y)).toBe(cardY);
  expect((await since(page, n1)).filter((c) => c[0] === 'seekTo' || c[0] === 'playVideo')).toEqual([]);
  // playing on (8×): the next scene
  await expect(strip).toHaveAttribute('data-en-scene', '4');
  // a question card: no line (a gist line would answer it); ツール's list still opens; まとめ: back
  await lesson(page).locator('[data-en-to-q]').click();
  await expect(cardAt(page, 0)).toBeVisible();
  await expect(strip).toHaveCount(0);
  await lesson(page).locator('[data-en-tools]').click();
  await page.locator('dialog[open] [data-en-tools-sheet] [data-en-tools-scenes]').click();
  await expect(rows).toHaveCount(scenes.length);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open] [data-en-scenes]')).toHaveCount(0);
  while (!(await lesson(page).locator('[data-en-end]').count())) await lesson(page).locator('[data-en-next]').click();
  await expect(strip).toBeVisible();
  // あらすじ off (ツール): gone, and still off in the next lesson (this phone's)
  const sw = page.locator('dialog[open] [data-en-tools-sheet] [data-en-scenes-toggle]');
  await lesson(page).locator('[data-en-tools]').click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(strip).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await start(page);
  await expect(lesson(page).locator('[data-en-scene]')).toHaveCount(0);
  await lesson(page).locator('[data-en-tools]').click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await page.keyboard.press('Escape');
  await expect(lesson(page).locator('[data-en-scene]')).toBeVisible();
  // a bank without scenes: neither the strip, the switch nor the list's row (today's clip is the plan's next now)
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  let served = false;
  await page.route('**/english/c/*.json', async (r) => {
    const { scenes: _, beats: __, ...bank } = (await (await r.fetch()).json()) as Record<string, unknown>;
    await r.fulfill({ json: bank });
    served = true;
  });
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'english');
  await start(page);
  await expect.poll(() => served).toBe(true);
  await expect(lesson(page).locator('[data-en-scene]')).toHaveCount(0);
  await lesson(page).locator('[data-en-tools]').click();
  await expect(page.locator('dialog[open] [data-en-tools-sheet]')).toBeVisible();
  await expect(sw).toHaveCount(0);
  await expect(page.locator('dialog[open] [data-en-tools-scenes]')).toHaveCount(0);
});

test('a question card shows no 場面のあらすじ line, whatever the playhead; ツール holds it one tap away', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  await expect(lesson(page).locator('[data-en-scene]')).toBeVisible();
  await lesson(page).locator('[data-en-to-q]').click();
  for (let i = 0; i < 2; i++) {
    await expect(cardAt(page, i)).toBeVisible();
    await expect(lesson(page).locator('[data-en-scene]')).toHaveCount(0);
    expect(await cardAt(page, i).evaluate((el) => el.textContent ?? '')).not.toContain(waitressScenes.beats[0].ja);
    await cardAt(page, i).locator('[data-en-hear]').click();
    await expect(lesson(page).locator('[data-en-scene]')).toHaveCount(0);
    await lesson(page).locator('[data-en-next]').click();
  }
});

test('場面のあらすじ’s beats: the strip shows the beat on now with its category; the list groups them under their scenes, filters by category, and a beat tapped plays from there', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  const { scenes, beats } = waitressScenes;
  const strip = lesson(page).locator('[data-en-scene]');
  await expect(strip).toHaveAttribute('data-en-beat', '0');
  await expect(strip.locator('[data-en-beat-k]')).toHaveText('説明');
  await expect(strip.locator('.ja')).toHaveText(beats[0].ja);
  await strip.click();
  const list = page.locator('dialog[open] [data-en-scenes]');
  // すべて and the categories present, in the set's order; every scene a header, its beats under it
  const filters = list.locator('[data-en-beat-filter]');
  await expect(filters).toHaveText(['すべて', '頼む・誘う', '断る', '説明', '気持ち', '皮肉', '言い合い', '動作']);
  await expect(filters.first()).toHaveAttribute('aria-checked', 'true');
  await expect(list.locator('[data-en-scene-row]')).toHaveCount(scenes.length);
  const rows = list.locator('[data-en-beat-row]');
  await expect(rows).toHaveCount(beats.length);
  const ids = (sel: string) => list.locator(sel).evaluateAll((els) => els.map((e) => e.getAttribute('data-en-beat-row')));
  const inScene = (i: number) => beats.flatMap((b, j) => (b.t[0] >= scenes[i].t[0] && b.t[1] <= scenes[i].t[1] ? [String(j)] : []));
  for (const i of scenes.keys()) expect(await ids(`[data-en-scene-group="${i}"] [data-en-beat-row]`), `scene ${i}'s beats`).toEqual(inScene(i));
  await expect(rows.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(rows.nth(1)).toHaveText(new RegExp(`0:0${beats[1].t[0]}\\s*頼む・誘う\\s*${beats[1].ja}`));
  expect(Math.round((await rows.nth(1).boundingBox())!.height)).toBeGreaterThanOrEqual(44);
  expect(Math.round((await filters.nth(1).boundingBox())!.height)).toBeGreaterThanOrEqual(44);
  // 説明: only its beats, under their scenes; the others' headers go
  await list.locator('[data-en-beat-filter="explain"]').click();
  await expect(list.locator('[data-en-beat-filter="explain"]')).toHaveAttribute('aria-checked', 'true');
  await expect(filters.first()).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => ids('[data-en-beat-row]')).toEqual(beats.flatMap((b, j) => (b.k === 'explain' ? [String(j)] : [])));
  await expect(list.locator('[data-en-scene-row]')).toHaveCount(2);
  // 皮肉: its one beat; tapped, the sheet closes and the clip plays from it, the strip on that beat
  await list.locator('[data-en-beat-filter="irony"]').click();
  const irony = beats.findIndex((b) => b.k === 'irony');
  await expect(rows).toHaveCount(1);
  await expect(list.locator('[data-en-scene-group]')).toHaveAttribute('data-en-scene-group', '4');
  const n0 = (await ytCommands(page)).length;
  await rows.first().click();
  await expect(list).toHaveCount(0);
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => JSON.stringify(c.slice(0, 2)))).toEqual([JSON.stringify(['seekTo', [beats[irony].t[0], true]]), JSON.stringify(['playVideo', []])]);
  await expect(strip).toHaveAttribute('data-en-beat', String(irony));
  await expect(strip.locator('[data-en-beat-k]')).toHaveText('皮肉');
  await expect(strip.locator('.ja')).toHaveText(beats[irony].ja);
  // the same list from ツール's row, its filter there too
  await lesson(page).locator('[data-en-tools]').click();
  await page.locator('dialog[open] [data-en-tools-sheet] [data-en-tools-scenes]').click();
  await expect(list.locator('[data-en-beat-filter]').first()).toBeVisible();
  await expect(list.locator(`[data-en-beat-row="${irony}"]`)).toHaveAttribute('aria-current', 'true');
});

test('ツール’s rows are a level below it: ‹ back to ツール, ✕ to the lesson; opened elsewhere (the strip, a question’s ⚑), ✕ only', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  const tools = page.locator('dialog[open] [data-en-tools-sheet]');
  const top = (sel: string) => page.locator(`dialog[open]:has(${sel}) .navbar`).last();
  // 場面のあらすじ's list: ‹ ツール
  await lesson(page).locator('[data-en-tools]').click();
  await tools.locator('[data-en-tools-scenes]').click();
  await expect(page.locator('dialog[open] [data-en-scenes]')).toBeVisible();
  await top('[data-en-scenes]').locator('.back').click();
  await expect(page.locator('dialog[open] [data-en-scenes]')).toHaveCount(0);
  await expect(tools).toBeVisible();
  // ⚑ この動画を報告: ‹ ツール; ✕ the lesson
  await tools.locator('[data-en-flag="clip"]').click();
  await expect(page.locator('dialog[open] [data-en-flag-sheet="clip"]')).toBeVisible();
  await top('[data-en-flag-sheet]').locator('.back').click();
  await expect(tools).toBeVisible();
  await tools.locator('[data-en-flag="clip"]').click();
  await top('[data-en-flag-sheet]').locator('.close').click();
  await expect(page.locator('dialog[open] [data-en-flag-sheet]')).toHaveCount(0);
  await expect(tools).toHaveCount(0);
  // the strip's list and a question's ⚑: their own sheets, no ‹
  await sheet(page).locator('[data-en-scene]').click();
  await expect(top('[data-en-scenes]').locator('.back')).toHaveCount(0);
  await expect(top('[data-en-scenes]').locator('.close')).toBeVisible();
  await page.keyboard.press('Escape');
  await lesson(page).locator('[data-en-to-q]').click();
  await lesson(page).locator('[data-en-flag="0"]').click();
  await expect(top('[data-en-flag-sheet]').locator('.back')).toHaveCount(0);
  await page.keyboard.press('Escape');
  // the lesson's ‹: home, where it was opened
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
});

test('この動画のセリフと解説: from ツール (which says it holds the answers) and from まとめ, the bank’s lines in time order, ▶ plays the moment, ‹ back to where it was', async ({ page }) => {
  await fakeYoutube(page, { rate: 8 });
  await open(page);
  await start(page);
  const moments = momentsOf(waitress);
  const page2 = lesson(page).locator('[data-en-phrases]');
  await lesson(page).locator('[data-en-tools]').click();
  const row = page.locator('dialog[open] [data-en-tools-sheet] [data-en-phrases-open]');
  await expect(row).toContainText('質問の答えと解説を含みます');
  await row.click();
  await expect(page.locator('dialog[open] [data-en-tools-sheet]')).toHaveCount(0);
  await expect(page.locator('dialog[open] [data-en-lesson] .navbar h2')).toHaveText('この動画のセリフと解説');
  const cards = page2.locator('[data-en-moment]');
  await expect(cards).toHaveCount(moments.length);
  const froms = (await cards.evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-en-moment')))));
  expect(froms).toEqual(moments.map((m) => m.from));
  expect(froms).toEqual([...froms].sort((a, b) => a - b));
  // a card: its time, the line (key words underlined, English), 言っていること, 意味, the phrase
  const m0 = moments[0], q0 = m0.qs[0];
  await expect(cards.first().locator('[data-en-moment-play]')).toHaveText(`${Math.floor(m0.from / 60)}:${String(Math.floor(m0.from % 60)).padStart(2, '0')}`);
  await expect(cards.first().locator(`[data-en-phrase="${q0.id}"] .line`)).toHaveAttribute('lang', 'en');
  await expect(cards.first().locator(`[data-en-phrase="${q0.id}"] .line u`).first()).toHaveText(q0.line!.match(/\*([^*]+)\*/)![1]);
  await expect(cards.first()).toContainText(`言っていること${q0.said}`);
  await expect(cards.first()).toContainText(`意味${q0.mean}`);
  await expect(cards.first()).toContainText(q0.use);
  expect((await cards.first().locator('[data-en-moment-play]').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  // ▶: the moment, paused at its end
  const n0 = (await ytCommands(page)).length;
  await cards.nth(1).locator('[data-en-moment-play]').click();
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => c[0])).toEqual(['seekTo', 'playVideo', 'pauseVideo']);
  const cmds = await from(page, n0, 'seekTo');
  expect(cmds[0][1]).toEqual([moments[1].from, true]);
  expect(cmds.at(-1)![2]).toBeGreaterThanOrEqual(moments[1].to);
  // ‹ back to ツール (one level), ✕ the watch card; then from まとめ, ‹ back to it
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(page.locator('dialog[open] [data-en-tools-sheet]')).toBeVisible();
  await page.locator('dialog[open]:has([data-en-tools-sheet]) .navbar .close').last().click();
  await expect(page.locator('dialog[open] [data-en-tools-sheet]')).toHaveCount(0);
  await expect(lesson(page).locator('[data-en-watch]')).toBeVisible();
  await lesson(page).locator('[data-en-to-q]').click();
  while (!(await lesson(page).locator('[data-en-end]').count())) await lesson(page).locator('[data-en-next]').click();
  await lesson(page).locator('[data-en-end-phrases]').click();
  await expect(cards).toHaveCount(moments.length);
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(lesson(page).locator('[data-en-end]')).toBeVisible();
});

test('セリフ: from ツール when the bank has lines, every line in time order with its Japanese, the playhead’s line marked and a tap seeks; no row when the bank has none', async ({ page }) => {
  await fakeYoutube(page, { rate: 8 });
  await open(page);
  await start(page);
  const lines = waitressEn.lines;
  const clockOf = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  await lesson(page).locator('[data-en-tools]').click();
  await page.locator('dialog[open] [data-en-tools-sheet] [data-en-transcript-open]').click();
  await expect(page.locator('dialog[open] [data-en-lesson] .navbar h2')).toHaveText('セリフ');
  const lvl = lesson(page).locator('[data-en-transcript]');
  const rows = lvl.locator('[data-en-line]');
  await expect(rows).toHaveCount(lines.length);
  // a row: its time, the English (lang en), its Japanese under it; the playhead's line marked
  await expect(lvl).toHaveAttribute('data-en-at', '0');
  await expect(rows.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(rows.nth(2).locator('.t')).toHaveText(clockOf(lines[2].t[0]));
  await expect(rows.nth(2).locator('.en')).toHaveText(lines[2].en);
  await expect(rows.nth(2).locator('.en')).toHaveAttribute('lang', 'en');
  await expect(rows.nth(2).locator('.ja')).toHaveText(waitressJa.lines[2].ja);
  // a line tapped: from its start, playing on
  const n0 = (await ytCommands(page)).length;
  await rows.nth(4).click();
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => JSON.stringify(c.slice(0, 2)))).toEqual([JSON.stringify(['seekTo', [lines[4].t[0], true]]), JSON.stringify(['playVideo', []])]);
  await expect(lvl).toHaveAttribute('data-en-at', '4');
  await expect(rows.nth(4)).toHaveAttribute('aria-current', 'true');
  // playing on (8×): the mark follows the playhead
  await expect.poll(() => lvl.getAttribute('data-en-at')).not.toBe('4');
  // ‹ back to ツール (it was opened there), its ✕ the watch card
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await page.locator('dialog[open] [data-en-tools-sheet]').waitFor();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open] [data-en-tools-sheet]')).toHaveCount(0);
  await expect(lesson(page).locator('[data-en-watch]')).toBeVisible();
  // a bank without lines: no セリフ (フレーズ stays)
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  let served = false;
  await page.route('**/english/c/waitress.*.json', async (r) => {
    const { lines: _, ...bank } = (await (await r.fetch()).json()) as Record<string, unknown>;
    await r.fulfill({ json: bank });
    served = true;
  });
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'english');
  await start(page);
  await expect.poll(() => served).toBe(true);
  await lesson(page).locator('[data-en-tools]').click();
  await expect(page.locator('dialog[open] [data-en-tools-sheet] [data-en-phrases-open]')).toBeVisible();
  await expect(page.locator('dialog[open] [data-en-tools-sheet] [data-en-transcript-open]')).toHaveCount(0);
});

test('a question’s Japanese, when written: the stem’s under it; the choices’ on 訳 before answering (never a form item’s), always at the reveal', async ({ page }) => {
  await fakeYoutube(page);
  // the bank with every question's Japanese (no bank has them yet): 訳<the choice's authored index>
  await page.route('**/english/c/waitress.*.json', async (r) => {
    const bank = (await (await r.fetch()).json()) as { questions: { choices?: string[] }[] };
    for (const q of bank.questions) Object.assign(q, { ja: '質問の日本語', ...(q.choices && { choicesJa: q.choices.map((_, k) => `訳${k}`) }) });
    await r.fulfill({ json: bank });
  });
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  const card = cardAt(page, 0); // a gist, first
  await expect(card.locator('[data-en-stem-ja]')).toHaveText('質問の日本語');
  await expect(card.locator('[data-en-choice-ja]')).toHaveCount(0);
  await card.locator('[data-en-tr]').click();
  // each under its own choice, the shuffle kept
  for (const c of await card.locator('[data-choice]').all()) await expect(c.locator('[data-en-choice-ja]')).toHaveText(`訳${await c.getAttribute('data-choice')}`);
  await card.locator('[data-en-tr]').click();
  await expect(card.locator('[data-en-choice-ja]')).toHaveCount(0);
  await card.locator(`[data-choice="${(await questionAt(page, 0)).a}"]`).click();
  await expect(card.locator('[data-en-tr]')).toHaveCount(0);
  await expect(card.locator('[data-en-choice-ja]')).toHaveCount(await card.locator('[data-choice]').count());
  // a form item: no 訳 before answering
  for (let i = 1; ; i++) {
    await lesson(page).locator('[data-en-next]').click();
    if (!(await cardAt(page, i).count())) break;
    const q = await questionAt(page, i);
    if (q.choices) await expect(cardAt(page, i).locator('[data-en-tr]')).toHaveCount(['marker', 'phrase', 'sound'].includes(q.skill) ? 0 : 1);
  }
});

test('a lesson plays on the silent switch: iOS audio session “playback” while it’s open, paused when the page is hidden, the island’s “ambient” again after', async ({ page }) => {
  // WebKit's navigator.audioSession, stood in for (Playwright's WebKit has none): the types the page sets, in order
  await page.addInitScript(() => {
    const seen: string[] = [];
    let type = 'auto';
    Object.defineProperty(navigator, 'audioSession', { configurable: true, value: { get type() { return type; }, set type(t: string) { type = t; seen.push(t); } } });
    (globalThis as unknown as { __sessions: string[] }).__sessions = seen;
  });
  await fakeYoutube(page);
  await open(page);
  await start(page);
  const sessions = () => page.evaluate(() => (globalThis as unknown as { __sessions: string[] }).__sessions.slice());
  await expect.poll(async () => (await sessions()).at(-1)).toBe('playback');
  // put away while it plays: paused (the 'playback' session would play on in the lock screen)
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'playing');
  const n = (await ytCommands(page)).length;
  await hideAndShow(page);
  await expect.poll(async () => (await ytCommands(page)).slice(n).some((c) => c[0] === 'pauseVideo')).toBe(true);
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
  await expect.poll(async () => (await sessions()).at(-1)).toBe('ambient');
});

test('a bank that doesn’t load: the player and the watch card all the same, 質問を読み込めませんでした with もう一度, then its questions', async ({ page }) => {
  await fakeYoutube(page);
  let fail = true;
  await page.route(/\/english\/c\/[\w-]+\.\w+\.json$/, (r) => (fail ? r.fulfill({ status: 503, body: '' }) : r.fallback()));
  await open(page);
  await start(page);
  await expect(lesson(page).locator('[data-en-watch]')).toBeVisible();
  await lesson(page).locator('[data-en-to-q]').click();
  const bank = lesson(page).locator('[data-en-bank]');
  await expect(bank).toHaveAttribute('data-en-bank', 'failed');
  await expect(bank).toContainText('質問を読み込めませんでした');
  await expect(lesson(page).locator('[data-en-next]')).toHaveCount(0);
  fail = false;
  await bank.locator('[data-en-bank-retry]').click();
  await expect(cardAt(page, 0)).toHaveAttribute('data-result', 'open');
});

test('別の動画にする: the next clip, and the one passed over stays skipped (today’s card after a reload); ⚙ 難しめ kept on this phone', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  const today = sheet(page).locator('[data-en-today]');
  await expect(today).toHaveAttribute('data-en-today', 'waitress');
  await sheet(page).locator('[data-en-other]').click();
  const next = await today.getAttribute('data-en-today');
  expect(next).not.toBe('waitress');
  await sheet(page).locator('[data-en-gear]').click();
  const hard = sheet(page).locator('[data-en-hard]');
  await expect(hard).toHaveAttribute('aria-checked', 'false');
  await hard.click();
  await expect(hard).toHaveAttribute('aria-checked', 'true');
  await open(page);
  await expect(sheet(page).locator('[data-en-today]')).toHaveAttribute('data-en-today', next!);
  await sheet(page).locator('[data-en-gear]').click();
  await expect(sheet(page).locator('[data-en-hard]')).toHaveAttribute('aria-checked', 'true');
});

test('フレーズの復習: yesterday’s phrases above today’s clip, the Japanese and the clip’s line on a tap, its segment played; 覚えた / もう一度 only space them; 今日はスキップ for today', async ({ page }) => {
  await fakeYoutube(page);
  // yesterday's finished play of waitress, two choice questions with phrases met (the pinned day is 2026-11-04)
  const qs = waitress.questions.filter((q) => !q.retired && q.line && q.use && q.a !== undefined).slice(0, 2); // choice items: the seeded answers are [id, 1, a, 0]
  await page.addInitScript((r) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-03T20:00:00+09:00');
    const data = { d: '2026-11-03', g: 'tvseed1', gm: 'tv', u: 'waitress', lv: 7, n: 1, ms: 60000, f: 1, r };
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: [{ id: 'seed-listen', type: 'listen', data, queuedAt: at, tries: 0, nextAt: 0, ackedAt: at, person: 'A' }] }));
  }, qs.map((q) => [q.id, 1, q.a, 0]));
  await open(page);
  const card = sheet(page).locator('[data-en-pr]');
  // never shown before, met the same day: in key order
  const order = qs.toSorted((a, b) => (a.id < b.id ? -1 : 1));
  await expect(card).toHaveAttribute('data-en-pr', `waitress/${order[0].id}`);
  await expect(card).toContainText('1/2');
  await expect(card.locator('.en')).toHaveText(splitUse(order[0].use).en);
  await expect(sheet(page).locator('[data-en-today] [data-en-start]')).toBeVisible();
  await card.locator('[data-en-pr-show]').click();
  await expect(card.locator('[data-en-pr-ja]')).toHaveText(splitUse(order[0].use).ja);
  await expect(card.locator('.line')).toHaveText(order[0].line!.replace(/\*/g, ''));
  await expect(card.locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
  const n0 = (await ytCommands(page)).length;
  await card.locator('[data-en-pr-hear]').click();
  await expect.poll(async () => (await from(page, n0, 'seekTo'))[0]?.[1]).toEqual([order[0].seg[0], true]);
  expect(await card.evaluate((el) => /不正解|間違|×|%|ざんねん/.test(el.textContent ?? ''))).toBe(false);
  await card.locator('[data-en-pr-kept]').click();
  await expect(card).toHaveAttribute('data-en-pr', `waitress/${order[1].id}`);
  await card.locator('[data-en-pr-skip]').click();
  await expect(card).toHaveCount(0);
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('island.english.phrases') ?? '{}').A);
  expect(kept).toEqual({ s: { [`waitress/${order[0].id}`]: ['2026-11-04', 1] }, day: ['2026-11-04', 3] });
  // skipped for today: none after a reload
  await open(page);
  await expect(sheet(page).locator('[data-en-today]')).toBeVisible();
  await expect(sheet(page).locator('[data-en-pr]')).toHaveCount(0);
});

/** フレーズ's deck as the build makes it (catalog.ts deckOf), by card key. */
const DECK = new Map(deckOf(PLAN).map((e) => [`${e[0]}/${e[1]}`, e]));
/** Today's clip and the next two in the plan: no card of theirs on the tab. */
const HELD = PLAN.slice(AHEAD.length, AHEAD.length + 3).map((c) => c.id);
const tabOf = (p: Page, id: string) => sheet(p).locator(`[data-en-tab="${id}"]`);
const deckCard = (p: Page) => sheet(p).locator('[data-en-deck]');
const back = (p: Page) => sheet(p).locator('.navbar .back').click();
/** The card shown: its key and its deck entry. */
async function shownCard(p: Page) {
  const k = (await deckCard(p).getAttribute('data-en-deck'))!;
  const e = DECK.get(k);
  expect(e, k).toBeTruthy();
  expect(HELD).not.toContain(e![0]);
  return { k, e: e! };
}

test('フレーズ: the tab bar on ホーム and フレーズ only; a card face down, 意味を見る → its Japanese, the clip’s line and the player (one frame at most), ▶ plays its segment and pauses; 次へ the next face down, the frame kept hidden', async ({ page }) => {
  await fakeYoutube(page, { rate: 8, dur: 3000 });
  await open(page);
  await expect(tabOf(page, 'home')).toHaveAttribute('aria-selected', 'true');
  const bar = (await sheet(page).locator('[role="tablist"]').boundingBox())!;
  expect([bar.x, Math.round(bar.width), Math.round(bar.y + bar.height)]).toEqual([0, 393, 852]);
  // the pushed levels have none: ⚙, the library, a lesson
  await sheet(page).locator('[data-en-gear]').click();
  await expect(sheet(page).locator('[data-en-tab]')).toHaveCount(0);
  await back(page);
  await sheet(page).locator('[data-en-all]').click();
  await expect(sheet(page).locator('[data-en-library]')).toBeVisible();
  await expect(sheet(page).locator('[data-en-tab]')).toHaveCount(0);
  await back(page);
  await start(page);
  await expect(sheet(page).locator('[data-en-tab]')).toHaveCount(0);
  await back(page);
  await tabOf(page, 'phrases').click();
  await expect(tabOf(page, 'phrases')).toHaveAttribute('aria-selected', 'true');
  // the front: the phrase (its key words underlined), 1/5, no frame yet
  const card = deckCard(page);
  await expect(card).toHaveAttribute('data-face', 'front');
  const { k, e } = await shownCard(page);
  await expect(card.locator('[data-en-deck-en]')).toHaveText(splitUse(e[4]).en);
  await expect(card.locator('[data-en-deck-en] u').first()).toBeVisible();
  await expect(card).toContainText('1/5');
  await expect(card.locator('[data-en-thumb] img')).toHaveAttribute('src', `https://i.ytimg.com/vi/${PLAN.find((c) => c.id === e[0])!.video}/mqdefault.jpg`);
  await expect(page.locator('[data-yt-frame]')).toHaveCount(0);
  // the back: the Japanese, the line (key words underlined), the player
  await card.locator('[data-en-deck-show]').click();
  await expect(card.locator('[data-en-deck-ja]')).toHaveText(splitUse(e[4]).ja);
  await expect(card.locator('[data-en-deck-line]')).toHaveText(e[5].replace(/\*/g, ''));
  await expect(card.locator('[data-en-deck-line] u').first()).toHaveText(e[5].match(/\*([^*]+)\*/)![1]);
  await expect(card.locator('[data-en-deck-mean]')).toHaveText(e[6]);
  await expect(page.locator('[data-yt-frame]')).toHaveCount(1);
  await expect(card.locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
  const n0 = (await ytCommands(page)).length;
  await card.locator('[data-en-deck-hear]').click();
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => c[0])).toEqual(['seekTo', 'playVideo', 'pauseVideo']);
  const cmds = await from(page, n0, 'seekTo');
  expect(cmds[0][1]).toEqual([e[2], true]);
  expect(cmds.find((c) => c[0] === 'pauseVideo')![2]).toBeGreaterThanOrEqual(e[3]);
  expect(await card.evaluate((el) => /不正解|間違|×|%|ざんねん/.test(el.textContent ?? ''))).toBe(false);
  // 次へ: the next card, face down, the frame kept (hidden: the next clip cued into it)
  await card.locator('[data-en-deck-next]').click();
  await expect(card).not.toHaveAttribute('data-en-deck', k);
  await expect(card).toHaveAttribute('data-face', 'front');
  await expect(card).toContainText('2/5');
  await expect(page.locator('[data-yt-frame]')).toHaveCount(1);
  await expect(page.locator('[data-yt-frame]')).toBeHidden();
});

/** Live window 'message' listeners and the player's 100 / 250 ms intervals (YtPlayer's: one each a player). */
const probe = () => {
  const w = window as unknown as { __msg: number; __iv: Set<number> };
  w.__msg = 0;
  w.__iv = new Set();
  const add = window.addEventListener.bind(window), rem = window.removeEventListener.bind(window);
  window.addEventListener = ((t: string, f: EventListener, o?: AddEventListenerOptions) => (t === 'message' && w.__msg++, add(t, f, o))) as typeof window.addEventListener;
  window.removeEventListener = ((t: string, f: EventListener, o?: EventListenerOptions) => (t === 'message' && w.__msg--, rem(t, f, o))) as typeof window.removeEventListener;
  const si = window.setInterval.bind(window), ci = window.clearInterval.bind(window);
  window.setInterval = ((f: TimerHandler, ms?: number, ...a: unknown[]) => { const id = si(f, ms, ...a); if (ms === 100 || ms === 250) w.__iv.add(id); return id; }) as typeof window.setInterval;
  window.clearInterval = ((id?: number) => (id !== undefined && w.__iv.delete(id), ci(id))) as typeof window.clearInterval;
};
const live = (p: Page) => p.evaluate(() => { const w = window as unknown as { __msg: number; __iv: Set<number> }; return [w.__msg, w.__iv.size]; });
const ytVideo = (p: Page) => p.frames().find((f) => f.url().startsWith('https://www.youtube-nocookie.com/'))?.evaluate(() => (window as unknown as { __yt: { videoId: string } }).__yt.videoId);

test('フレーズ: one embed a set — 5 cards, one frame throughout, each next clip cued into it, ▶ its segment on a later card; leaving the tab leaves no listener or timer', async ({ page }) => {
  await fakeYoutube(page, { rate: 8, dur: 3000 });
  await page.addInitScript(probe);
  const embeds: string[] = [];
  page.on('request', (r) => void (r.url().startsWith('https://www.youtube-nocookie.com/embed/') && embeds.push(r.url())));
  await open(page);
  const base = await live(page);
  await tabOf(page, 'phrases').tap();
  const card = deckCard(page), frame = page.locator('[data-yt-frame]');
  for (let i = 1; i <= 5; i++) {
    await expect(card).toContainText(`${i}/5`);
    await expect(frame).toHaveCount(i === 1 ? 0 : 1);
    const { e } = await shownCard(page);
    await card.locator('[data-en-deck-show]').tap();
    await expect(frame).toHaveCount(1);
    await expect(frame).toBeVisible();
    // the frame holds this card's clip (the first loaded, the rest cued), ready for ▶
    await expect.poll(() => ytVideo(page)).toBe(PLAN.find((c) => c.id === e[0])!.video);
    await expect(card.locator('[data-en-deck-hear]')).toBeEnabled();
    if (i === 3) {
      const n0 = (await ytCommands(page)).length;
      await card.locator('[data-en-deck-hear]').tap();
      await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => c[0])).toEqual(['seekTo', 'playVideo', 'pauseVideo']);
      expect((await from(page, n0, 'seekTo'))[0][1]).toEqual([e[2], true]);
    }
    await card.locator('[data-en-deck-next]').tap();
  }
  await expect(sheet(page).locator('[data-en-deck-end]')).toBeVisible();
  expect(embeds).toHaveLength(1);
  await expect(frame).toHaveCount(0);
  await tabOf(page, 'home').tap();
  await expect.poll(() => live(page)).toEqual(base);
});

test('フレーズ: the same card face down after a lesson; ☆ 復習に入れる saves it apart from its schedule, home’s review has a saved one the next day; 5 a set, never two of one clip, then 5枚見ました with もう5枚 / ホームへ', async ({ page }) => {
  await fakeYoutube(page, { dur: 3000 });
  // a phrase saved yesterday, never met: due today on home; one whose question is gone since: out of the list
  const q = waitress.questions.find((x) => !x.retired && x.use && x.line)!;
  await page.addInitScript((k) => {
    if (localStorage.getItem('island.english.phrases') === null) localStorage.setItem('island.english.phrases', JSON.stringify({ A: { s: {}, k: { [k]: '2026-11-03', 'waitress/zzgone': '2026-11-03' } } }));
  }, `waitress/${q.id}`);
  await open(page);
  await expect(sheet(page).locator('[data-en-pr]')).toHaveAttribute('data-en-pr', `waitress/${q.id}`);
  await tabOf(page, 'phrases').click();
  const card = deckCard(page);
  const first = await shownCard(page);
  await card.locator('[data-en-deck-show]').click();
  await expect(card).toHaveAttribute('data-face', 'back');
  // home, a lesson, back: the same card, face down
  await tabOf(page, 'home').click();
  await start(page);
  await back(page);
  await tabOf(page, 'phrases').click();
  await expect(card).toHaveAttribute('data-en-deck', first.k);
  await expect(card).toHaveAttribute('data-face', 'front');
  await expect(page.locator('[data-yt-frame]')).toHaveCount(0);
  // ☆: saved (today), tapped again: out; its schedule (`s`) never touched
  await card.locator('[data-en-deck-show]').click();
  const star = card.locator('[data-en-deck-save]');
  const mine = () => page.evaluate(() => JSON.parse(localStorage.getItem('island.english.phrases') ?? '{}').A);
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await expect(star).toHaveText('★ 復習に入れました');
  expect(await mine()).toEqual({ s: {}, k: { [`waitress/${q.id}`]: '2026-11-03', [first.k]: '2026-11-04' } });
  await star.click();
  await expect(star).toHaveText('☆ 復習に入れる');
  expect((await mine()).k).toEqual({ [`waitress/${q.id}`]: '2026-11-03' });
  // the set: 5 cards, no two of one clip
  const keys = [first.k];
  await card.locator('[data-en-deck-next]').click();
  for (let i = 2; i <= 5; i++) {
    await expect(card).toContainText(`${i}/5`);
    keys.push((await shownCard(page)).k);
    await card.locator('[data-en-deck-show]').click();
    await card.locator('[data-en-deck-next]').click();
  }
  expect(new Set(keys.map((x) => x.split('/')[0])).size).toBe(5);
  const end = sheet(page).locator('[data-en-deck-end]');
  await expect(end).toContainText('5枚見ました · これまで 5フレーズ');
  // kept on this phone: the end again after a reload; ホームへ, then もう5枚 a new card
  await open(page);
  await tabOf(page, 'phrases').click();
  await expect(end).toBeVisible();
  await end.locator('[data-en-deck-home]').click();
  await expect(tabOf(page, 'home')).toHaveAttribute('aria-selected', 'true');
  await tabOf(page, 'phrases').click();
  await end.locator('[data-en-deck-more]').click();
  await expect(card).toContainText('1/5');
  expect(keys).not.toContain((await shownCard(page)).k);
});

test('the library: すべて 20 at a time with もっと見る, one chip row of the shows only, a lesson opened there goes back to it; a play left part-way first, 途中', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  // a play left part-way on another clip than today's
  const other = PLAN[3];
  await sheet(page).locator('[data-en-all]').click();
  const lib = sheet(page).locator('[data-en-library]');
  await expect(lib.locator('.navbar h2')).toHaveText('ライブラリ');
  const rows = lib.locator('[data-en-list] [data-en-clip]');
  await expect(rows).toHaveCount(Math.min(20, CLIPS.length));
  await expect(rows.first().locator('[data-en-thumb] img')).toHaveAttribute('src', `https://i.ytimg.com/vi/${PLAN[0].video}/mqdefault.jpg`);
  if (CLIPS.length > 20) {
    await expect(lib.locator('[data-en-more]')).toHaveText(`もっと見る（あと${CLIPS.length - 20}本）`);
    await lib.locator('[data-en-more]').click();
    await expect(rows).toHaveCount(Math.min(40, CLIPS.length));
  }
  // one row of chips: すべて and the shows (the situations are 場面で選ぶ's tiles, never chips too)
  expect(await lib.locator('[data-en-chip]').evaluateAll((els) => els.map((e) => e.getAttribute('data-en-chip')))).toEqual(['', ...new Set(PLAN.map((c) => metaOf(c).show))]);
  const parks = CLIPS.filter((c) => c.show === 'Parks and Recreation');
  await lib.locator('[data-en-chip="Parks"]').click();
  await expect(lib.locator('[data-en-chip="Parks"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(rows).toHaveCount(Math.min(20, parks.length));
  await expect(lib.locator('.sec-label')).toContainText(`Parks${parks.length}本`);
  await lib.locator('[data-en-chip=""]').click();
  await lib.locator(`[data-en-clip="${other.id}"]`).click();
  await expect(lesson(page)).toHaveAttribute('data-en-lesson', other.id);
  await lesson(page).locator('[data-en-to-q]').click();
  await expect(cardAt(page, 0)).toBeVisible();
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(lib).toBeVisible();
  await expect(rows.first()).toHaveAttribute('data-en-clip', other.id);
  await expect(rows.first().locator('[data-en-part]')).toHaveText('途中');
  await expect(rows.first()).toContainText(/1\/\d+問/);
  // home's card: the part-way one first
  await lib.locator('.navbar .back').click();
  await expect(sheet(page).locator('[data-en-lib] [data-en-clip]').first()).toHaveAttribute('data-en-clip', other.id);
});

test('場面で選ぶ on すべて (situations with 4+ clips, each once), each a level: its note, its clips in order, a lesson there goes back to it, ‹ the library', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  const cols = shownOf(PLAN.map(metaOf));
  expect(cols.length).toBeGreaterThan(0);
  await sheet(page).locator('[data-en-all]').click();
  const lib = sheet(page).locator('[data-en-library]');
  await expect(lib.locator('[data-en-colrow]')).toHaveCount(cols.length);
  const work = cols.find((x) => x.c.id === 'work')!;
  const row = lib.locator('[data-en-colrow="work"]');
  await expect(lib.locator('[data-en-cols]')).toBeVisible();
  await expect(row).toHaveText(new RegExp(`職場\\s*${work.clips.length}本`));
  expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(row.locator('.count')).toHaveText(`${work.clips.length}本`); // none finished: no 0本完了
  // a chip's view has none
  await lib.locator('[data-en-chip="Friends"]').click();
  await expect(lib.locator('[data-en-cols]')).toHaveCount(0);
  await lib.locator('[data-en-chip=""]').click();
  await row.click();
  await expect(lib).toHaveAttribute('data-en-col', 'work');
  await expect(lib.locator('.navbar h2')).toHaveText('職場');
  await expect(lib.locator('[data-en-col-note]')).toHaveText('上司と同僚の会話');
  await expect(lib.locator('[data-en-chip]')).toHaveCount(0);
  const rows = lib.locator('[data-en-list] [data-en-clip]');
  // (its first 20: a collection pages like the library, and fills as banks land)
  await expect(rows).toHaveCount(Math.min(20, work.clips.length));
  expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-en-clip')))).toEqual(work.clips.slice(0, 20).map((m) => m.id));
  await rows.nth(1).click();
  await expect(lesson(page)).toHaveAttribute('data-en-lesson', work.clips[1].id);
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(lib).toHaveAttribute('data-en-col', 'work');
  await lib.locator('.navbar .back').click();
  await expect(lib).not.toHaveAttribute('data-en-col', /./);
  await expect(lib.locator('.navbar h2')).toHaveText('ライブラリ');
});
