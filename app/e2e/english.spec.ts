// English Study (docs/english.md): the sheet's home, a clip's lesson over YouTube's embed (stood in for: e2e/youtube.ts,
// nothing leaves the preview), never locked: 質問へ and ‹ 前へ / 次へ › always work; a miss replays the segment with the
// cue and a quiet 答えを見る, a second miss 「答えはこれ」, never a mark on the pick; まとめ writes the clip's row (✓ in
// the library, 今週 1/3日, これまで 1本); ⚑ 報告 on the clip and a question, listed in ⚙'s 報告した内容; the player's
// offline and unavailable states, 字幕 オフ / 英語 / 日本語 and 場面のあらすじ; セリフ (the transcript) follows the playhead, a line
// tapped plays from there; a lesson left resumes where it was. The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { fakeYoutube, ytCommands } from './youtube.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { planOf } from '../src/lib/english/plan.ts';
import { metaOf } from '../src/lib/english/catalog.ts';
import { shownOf } from '../src/lib/english/collections.ts';
import { hideAndShow } from './memory.ts';
import { momentsOf } from '../src/lib/english/phrases.ts';
import waitressScenes from '../src/lib/english/scenes/lm2MpPpkGL8.json' with { type: 'json' };
import waitressEn from '../src/lib/english/transcripts/lm2MpPpkGL8.en.json' with { type: 'json' };
import waitressJa from '../src/lib/english/transcripts/lm2MpPpkGL8.ja.json' with { type: 'json' };

/** The clips as offered (the shared plan). */
const PLAN = planOf(CLIPS);

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
  // edge to edge, 16:9: the frame's size is what picks YouTube's quality (it can't be set); its changes listened to
  const box = (await frame.boundingBox())!;
  expect([box.x, Math.round(box.width), Math.round(box.height)]).toEqual([0, 393, Math.round((393 * 9) / 16)]);
  await expect.poll(async () => (await ytCommands(page)).some((c) => c[0] === 'addEventListener' && JSON.stringify(c[1]) === '["onPlaybackQualityChange"]')).toBe(true);
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
  await expect(card.locator('[data-en-nudge]')).toContainText((await questionAt(page, 0)).cue);
  // brought up only as far as it takes: the question and its choices stay on screen for the retry
  await expect(card.locator('[data-en-nudge]')).toBeInViewport();
  await expect(card.locator('.stem')).toBeInViewport();
  await expect(card.locator('[data-choice]').first()).toBeInViewport();
  await expect(card).toHaveAttribute('data-result', 'open');
  await expect(card.locator('[data-ans]')).toHaveCount(0);
  // the segment replayed by itself: from 0, paused at 10 s
  await expect.poll(async () => (await from(page, n0, 'seekTo')).map((c) => c[0])).toEqual(['seekTo', 'playVideo', 'pauseVideo']);
  const cmds = await from(page, n0, 'seekTo');
  expect(cmds.find((c) => c[0] === 'seekTo')?.[1]).toEqual([0, true]);
  expect(cmds.find((c) => c[0] === 'pauseVideo')![2]).toBeGreaterThanOrEqual(10);
  // a second miss: the answer, ○ on it, the notes; the picks never marked, nothing coral
  await card.locator('[data-choice="2"]').click();
  await expect(card).toHaveAttribute('data-result', 'shown');
  await expect(card.locator('[data-en-reveal]')).toContainText('答えはこれ');
  await expect(card.locator('[data-ans]')).toHaveAttribute('data-choice', '1');
  // 意味 and 使えるフレーズ open; くわしく (言っていること, 迷いやすい点) opened by itself after a miss
  await expect(card.locator('[data-en-reveal] .phrase')).toBeVisible();
  await expect(card.locator('[data-en-more]')).toHaveAttribute('open', '');
  await expect(card.locator('[data-en-said]')).toBeVisible();
  await expect(card.locator('[data-en-reveal]')).toContainText('言っていること');
  await expect(card.locator('[data-en-reveal] u')).toHaveText('hundred dollar advance');
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
  await lesson(page).locator('[data-en-done]').click();
  // the main card goes on to the plan's next clip (the finished one isn't offered again today, not even as a row)
  await expect(sheet(page).locator('[data-en-today]')).toHaveAttribute('data-en-today', PLAN[1].id);
  await expect(sheet(page).locator('[data-en-today] [data-en-start]')).toHaveText('▶ 始める');
  await expect(sheet(page).locator('[data-en-lib] [data-en-clip="waitress"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-en-week]')).toHaveAttribute('data-en-week', '1');
  await expect(sheet(page).locator('[data-en-week-n]')).toHaveText('1/3日');
  await expect(sheet(page).locator('[data-en-clips]')).toHaveText('これまで 1本');
  await expect(sheet(page).locator('[data-en-today]')).toContainText('次の動画 · 今日の分は完了 ✓');
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
  await expect(rows.nth(0)).toContainText(`答え · Rachel Is a Bad Waitress · ${q0.stem}`);
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

test('the controls: play / pause on from where it stopped, −5 秒, the scrubber, 0.75× only when offered; a question’s part from its card only', async ({ page }) => {
  await fakeYoutube(page, { rate: 4 });
  await open(page);
  await start(page);
  const c = lesson(page).locator('[data-yt-controls]');
  // ▶ −5秒 0.75× then 字幕 at the end, each a full 44 pt; no ⋯
  await expect(c.locator('button')).toHaveCount(4);
  const order = await c.locator('button').evaluateAll((els) => els.map((e) => Object.keys((e as HTMLElement).dataset).find((k) => k.startsWith('yt'))));
  expect(order).toEqual(['ytToggle', 'ytBack5', 'ytRate', 'ytCc']);
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
  // on a question: its part from the card's この部分を聞く, none in the controls
  await lesson(page).locator('[data-en-to-q]').click();
  await expect(c.locator('[data-yt-seg]')).toHaveCount(0);
  const n2 = (await ytCommands(page)).length;
  await lesson(page).locator('[data-en-hear]').click();
  // (the move to the card's pause may land just before: the segment's seek and play follow, whatever came first)
  await expect.poll(async () => {
    const c2 = (await since(page, n2)).map((x) => JSON.stringify(x.slice(0, 2)));
    const i = c2.indexOf(JSON.stringify(['seekTo', [0, true]]));
    return i >= 0 && c2[i + 1] === JSON.stringify(['playVideo', []]);
  }).toBe(true);
});

test('no speed control when the frame offers only 1×', async ({ page }) => {
  await fakeYoutube(page, { rates: [1] });
  await open(page);
  await start(page);
  await expect(lesson(page).locator('[data-yt-scrub]')).toBeEnabled();
  await expect(lesson(page).locator('[data-yt-rate]')).toHaveCount(0);
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
  await expect.poll(() => sh.locator('[data-en-cc-size]').evaluateAll((els) => Math.min(...els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height))))).toBeGreaterThanOrEqual(44);
  await expect(sh.locator('[data-en-cc-mode="off"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sh.locator('[data-en-cc-size="1"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sh.locator('[data-en-cc-size]')).toHaveText(['小', '中', '大', '特大']);
  // captions off: a size is kept, nothing sent
  const n0 = (await ytCommands(page)).length;
  await sh.locator('[data-en-cc-size="2"]').click();
  await expect(sh.locator('[data-en-cc-size="2"]')).toHaveAttribute('aria-checked', 'true');
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

test('この動画のフレーズ: from ツール (which says it holds the answers) and from まとめ, the bank’s lines in time order, ▶ plays the moment, ‹ back to where it was', async ({ page }) => {
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
  await expect(page.locator('dialog[open] [data-en-lesson] .navbar h2')).toHaveText('この動画のフレーズ');
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
  // ‹ the watch card; then from まとめ, ‹ back to it
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
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
  // ‹ the watch card
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
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

test('別の動画にする: the next clip, and the one passed over stays skipped (today’s card after a reload); ⚙ むずかしめ kept on this phone', async ({ page }) => {
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

test('the library: すべて 20 at a time with もっと見る, a show or a situation chip, a lesson opened there goes back to it; a play left part-way first, 途中', async ({ page }) => {
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

test('collections on すべて (those with 4+ clips), each a level: its note, its clips in order, a lesson there goes back to it, ‹ the library', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  const cols = shownOf(PLAN.map(metaOf));
  expect(cols.length).toBeGreaterThan(0);
  await sheet(page).locator('[data-en-all]').click();
  const lib = sheet(page).locator('[data-en-library]');
  await expect(lib.locator('[data-en-colrow]')).toHaveCount(cols.length);
  const work = cols.find((x) => x.c.id === 'work')!;
  const row = lib.locator('[data-en-colrow="work"]');
  await expect(row).toHaveText(new RegExp(`職場の会話\\s*${work.clips.length}本`));
  await expect(row.locator('.count')).toHaveText(`${work.clips.length}本`); // none finished: no 0本完了
  // a chip's view has none
  await lib.locator('[data-en-chip="Friends"]').click();
  await expect(lib.locator('[data-en-cols]')).toHaveCount(0);
  await lib.locator('[data-en-chip=""]').click();
  await row.click();
  await expect(lib).toHaveAttribute('data-en-col', 'work');
  await expect(lib.locator('.navbar h2')).toHaveText('職場の会話');
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
