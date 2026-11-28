// English Study's lesson (docs/english.md), the gate's English: the sheet's home, a clip's lesson over YouTube's embed
// (stood in for: e2e/youtube.ts), never locked; a miss, まとめ and the progress it writes, its end (ふりかえる, おわる), これまでの記録, ⚑ 報告, the cards' fit, a
// question's Japanese, a bank that doesn't load, 別の動画にする, home's これまでの記録 row. Helpers: e2e/english.ts.
import { expect, test, type Locator, type Page } from './fixtures.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { fakeYoutube, ytCommands } from './youtube.ts';
import { hideAndShow } from './memory.ts';
import { PLAN, AFTER, cardAt, questionAt, from, sheet, lesson, at, open, start, toSheet } from './english.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import { CLIPS } from '../src/lib/english/clips/index.ts';

test.use({ viewport: { width: 393, height: 852 } });

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

for (const how of ['click', 'tap'] as const) {
  test(`✕ in a lesson, then English Study again (${how}): home each time, no error page, no player made for the lesson left`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    let embeds = 0;
    page.on('request', (r) => r.url().startsWith('https://www.youtube-nocookie.com/embed/') && embeds++);
    await fakeYoutube(page);
    await open(page);
    for (let i = 0; i < 3; i++) {
      await sheet(page).locator('[data-en-start]')[how]();
      await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
      if (i === 0) await lesson(page).locator('[data-en-to-q]')[how](); // a place to keep (the leaving save: 続きから)
      await page.locator('dialog[open] [data-en-lesson] .navbar .close')[how]();
      await expect(sheet(page)).toHaveCount(0);
      const before = embeds;
      await fromMenu(page, 'english', how);
      await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
      await expect(sheet(page).locator('[data-en-start]')).toHaveText('続きから');
      await expect(page.locator('[data-en-lesson], [data-yt-frame]')).toHaveCount(0);
      expect(embeds, 'no embed asked for on the reopen').toBe(before);
    }
    expect(errors).toEqual([]);
  });
}

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
  await expect(card.locator('[data-en-howto]')).toHaveText('聞いてから選ぼう。何回聞いてもOK');
  const n0 = (await ytCommands(page)).length;
  await card.locator(`[data-choice="${miss1}"]`).click();
  await expect(card.locator('[data-en-howto]')).toHaveCount(0);
  await expect(card.locator('[data-en-nudge]')).toContainText('もう一度聞いてみよう。');
  await expect(card.locator('[data-en-nudge]')).toContainText(q0.cue);
  // brought up only as far as it takes: the question and its choices stay on screen for the retry
  await expect(card.locator('[data-en-nudge]')).toBeInViewport();
  await expect(card.locator('.stem')).toBeInViewport();
  await expect(card.locator('[data-choice]').first()).toBeInViewport();
  await expect(card).toHaveAttribute('data-result', 'open');
  await expect(card.locator('[data-ans]')).toHaveCount(0);
  // the choice tried dimmed (never red or ×), still a choice
  await expect(card.locator(`[data-choice="${miss1}"]`)).toHaveClass(/\btried\b/);
  await expect(card.locator('.choice.tried')).toHaveCount(1);
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
  // 意味 and 使えるフレーズ open; くわしく (言っていること, 迷いやすい点) one tap away, a miss too
  await expect(card.locator('[data-en-reveal] .phrase')).toBeVisible();
  await expect(card.locator('[data-en-more]')).not.toHaveAttribute('open', '');
  await card.locator('[data-en-more] summary').click();
  await expect(card.locator('[data-en-said]')).toBeVisible();
  await expect(card.locator('[data-en-reveal]')).toContainText('言っていること');
  await expect(card.locator('[data-en-reveal] u')).toHaveText([...q0.line!.matchAll(/\*(.+?)\*/g)].map((m) => m[1]));
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
    if (how !== 'shown') await expect(cardAt(page, i).locator('[data-en-reveal]')).toContainText(how === 'first' ? '◎ 聞き取れた！' : '○ 聞き取れた！');
    // くわしく: closed whatever the pick, a tap opens it
    const said = cardAt(page, i).locator('[data-en-said]');
    await expect(said).toBeHidden();
    await cardAt(page, i).locator('[data-en-more] summary').click();
    await expect(said).toBeVisible();
  }
});

test('まとめ: the scenes to hear again, the clip’s row: ✓ in the library, 今週 1/3日, これまで 1本; a dictation counts the words heard', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  await cardAt(page, 0).locator(`[data-choice="${(await questionAt(page, 0)).a}"]`).click();
  // on to まとめ, the others missed (答えはこれ); a dictation drawn: some words, then all
  let n = 1, dict = false;
  for (; ; n++) {
    await lesson(page).locator('[data-en-next]').click();
    if (await lesson(page).locator('[data-en-end]').count()) break;
    const x = await questionAt(page, n);
    if (!x.answer) {
      await miss(cardAt(page, n), x);
      continue;
    }
    dict = true;
    const c = cardAt(page, n), all = x.answer.split(' ').length;
    // no word heard: never a 0, the answer shown
    await c.locator('[data-en-dict]').fill('zzz');
    await c.locator('[data-en-dict-go]').click();
    await expect(c.locator('[data-en-reveal] .rhead')).toHaveText('答えはこれ');
    // (Return answers too, and the field lets go)
    await c.locator('[data-en-dict]').fill(x.answer.split(' ').slice(1).join(' '));
    await c.locator('[data-en-dict]').press('Enter');
    await expect(c.locator('[data-en-dict]')).not.toBeFocused();
    await expect(c.locator('[data-en-reveal]')).toContainText(`${all - 1}/${all}語を聞き取れたよ`);
    // the words apart, as typed
    expect((await c.locator('[data-en-reveal] .words').textContent())!.trim().split(/\s+/)).toHaveLength(all);
    await c.locator('[data-en-dict]').fill(x.answer.toUpperCase() + '.');
    await c.locator('[data-en-dict-go]').click();
    await expect(c.locator('[data-en-reveal]')).toContainText(`${all}/${all}語を聞き取れたよ`);
  }
  expect(await at(page)).toBe(String(n));
  // every scene answered and not heard in full the first time: all but the first and a full dictation
  await expect(lesson(page).locator('[data-en-again]')).toHaveCount(n - 1 - (dict ? 1 : 0));
  await expect(lesson(page).locator('[data-en-end]')).toContainText('この動画は完了だよ');
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
  // (もっと見る till the whole library shows, 20 rows a press: dispatched, as a click scrolled each press's 20 rows in
  // and their lazy thumbnails loaded, ~4.5 s of the test for ~400 clips)
  const more = sheet(page).locator('[data-en-more]'), rows = sheet(page).locator('[data-en-list] [data-en-clip]');
  for (let n = 20; n < PLAN.length; n += 20) {
    await expect(rows).toHaveCount(n);
    await more.dispatchEvent('click');
  }
  await expect(rows).toHaveCount(PLAN.length);
  await expect(more).toHaveCount(0);
  await expect(sheet(page).locator('[data-en-list] [data-en-clip="waitress"]')).toHaveAttribute('data-done', 'true');
  await expect(rows.last()).toHaveAttribute('data-en-clip', 'waitress');
});

/** The demo record's `listen` rows, as sent. */
const listens = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'listen').map((e: { data: unknown }) => e.data));

type Act = (card: Locator, q: (typeof waitress.questions)[number]) => Promise<void>;
/** A question missed: two wrong picks (答えはこれ), a dictation's words all wrong. */
const miss: Act = async (card, q) => {
  if (q.choices) for (const k of q.choices.flatMap((_, k) => (k === q.a ? [] : [k])).slice(0, 2)) await card.locator(`[data-choice="${k}"]`).click();
  else {
    // (the typing in before 答える: a card just mounted may still clear its field)
    const field = card.locator('[data-en-dict]');
    await expect(async () => {
      await field.fill('zzz');
      await expect(field).toHaveValue('zzz');
    }).toPass();
    await card.locator('[data-en-dict-go]').click();
  }
  await expect(card).not.toHaveAttribute('data-result', 'open');
};
/** Today's lesson to its last question: question 1 settled by `first` (its card given), the rest by `rest`, else left
 *  unanswered. Its length. */
async function toLast(page: Page, first: Act, rest?: Act): Promise<number> {
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  await first(cardAt(page, 0), await questionAt(page, 0));
  const n = Number(/\/(\d+)/.exec((await cardAt(page, 0).locator('.meta').first().textContent())!)![1]);
  for (let i = 1; i < n; i++) {
    await lesson(page).locator('[data-en-next]').click();
    await expect(lesson(page)).toHaveAttribute('data-en-at', String(i));
    if (rest) await rest(cardAt(page, i), await questionAt(page, i));
  }
  await expect(lesson(page).locator('[data-en-next]')).toHaveText(/まとめへ/);
  return n;
}

test('the lesson’s end: a fast double tap on まとめへ stays in the lesson (ふりかえる takes the second tap); while the foot is ふりかえる, おわる in the card', async ({ page, browserName }) => {
  await fakeYoutube(page);
  await open(page);
  const n = await toLast(page, (card, q) => card.locator(`[data-choice="${q.a}"]`).click(), miss);
  // まとめへ twice, fast, where the finger is: never out of the lesson (its slot is ふりかえる now: the second tap starts it)
  const b = (await lesson(page).locator('[data-en-next]').boundingBox())!;
  const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
  if (browserName === 'webkit') {
    await page.touchscreen.tap(x, y);
    await page.touchscreen.tap(x, y);
    await expect(lesson(page).locator('[data-en-rv="0"]')).toBeVisible();
  } else await page.mouse.dblclick(x, y);
  await expect(lesson(page)).toHaveAttribute('data-en-at', String(n));
  expect((await listens(page)).filter((r: { f?: number }) => r.f === 1)).toHaveLength(1);
  // (a review started by the second tap: its 前へ on the first step is まとめ again, unreviewed)
  if (await lesson(page).locator('[data-en-rv]').count()) await lesson(page).locator('[data-en-prev]').click();
  const end = lesson(page).locator('[data-en-end]');
  await expect(end).toBeVisible();
  // まとめ: the foot's ふりかえる (N場面), おわる in the card below everything, not in the foot
  const again = lesson(page).locator('[data-en-again]');
  const ids = () => again.evaluateAll((els) => els.map((e) => e.getAttribute('data-en-again')));
  const before = await ids();
  expect(before).toHaveLength(n - 1);
  await expect(end.locator('[data-en-again-note]')).toHaveText(`もう一度聞きたい場面が${n - 1}つあるよ。答えと意味を一緒に見よう`);
  await expect(lesson(page).locator('.foot [data-en-review]')).toHaveText(`ふりかえる（${n - 1}場面）`);
  await expect(end.locator('[data-en-unanswered]')).toHaveCount(0);
  // each scene's time as the player's clock, m:ss
  await expect(again.first().locator('.at')).toHaveText(/^\d+:\d\d〜\d+:\d\d$/);
  await expect(lesson(page).locator('.foot [data-en-prev]')).toBeVisible();
  await expect(lesson(page).locator('.foot [data-en-done]')).toHaveCount(0);
  await expect(end.locator(':scope > :last-child')).toHaveAttribute('data-en-done', '');
});

test('ふりかえる steps the scenes to hear again, nothing recorded, back to まとめ as it was; the foot’s おわる leaves', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  const n = await toLast(page, (card, q) => card.locator(`[data-choice="${q.a}"]`).click(), miss);
  await lesson(page).locator('[data-en-next]').click();
  const end = lesson(page).locator('[data-en-end]');
  await expect(end).toBeVisible();
  const again = lesson(page).locator('[data-en-again]');
  const ids = () => again.evaluateAll((els) => els.map((e) => e.getAttribute('data-en-again')));
  const before = await ids();
  expect(before).toHaveLength(n - 1);
  const rows = await listens(page);
  // ふりかえり: each scene on the question card, its own picks (a miss, then right: ○), nothing recorded
  await lesson(page).locator('[data-en-review]').click();
  for (let k = 0; k < before.length; k++) {
    const card = lesson(page).locator(`[data-en-rv="${k}"]`);
    await expect(card).toBeVisible();
    await expect(card.locator('.meta').first()).toContainText(`ふりかえり ${k + 1}/${before.length}`);
    const id = (await card.getAttribute('data-en-qid'))!;
    const item = waitress.questions.find((w) => w.id === id)!;
    if (item.choices) {
      await expect(card.locator('[data-en-rv-note]')).toHaveText('もう一度選んでみよう。記録は変わらないよ');
      await card.locator(`[data-choice="${item.choices.findIndex((_, i) => i !== item.a)}"]`).click();
      await card.locator(`[data-choice="${item.a}"]`).click();
      await expect(card).toHaveAttribute('data-result', 'second');
    } else {
      // (the typing in before Return: a card just mounted may still clear its field)
      const field = card.locator('[data-en-dict]');
      await expect(async () => {
        await field.fill(item.answer!);
        await expect(field).toHaveValue(item.answer!);
      }).toPass();
      await field.press('Enter');
      await expect(card).toHaveAttribute('data-result', 'dict');
    }
    await expect(card.locator('[data-en-reveal]')).toBeVisible();
    expect(await card.evaluate((el) => /不正解|間違|×|ざんねん/.test(el.textContent ?? ''))).toBe(false);
    const next = lesson(page).locator('[data-en-rv-next]');
    await expect(next).toHaveText(k === before.length - 1 ? /まとめに戻る/ : /次へ/);
    await next.click();
  }
  // back at まとめ: the same list, the record as it was; ふりかえった ✓, the foot's おわる (通して見る a row in the card)
  await expect(end).toBeVisible();
  expect(await ids()).toEqual(before);
  expect(await listens(page)).toEqual(rows);
  expect(await lesson(page).getAttribute('data-en-at')).toBe(String(n));
  await expect(end.locator('[data-en-reviewed]')).toHaveText('ふりかえった ✓');
  const done = lesson(page).locator('.foot [data-en-done]');
  await expect(done).toHaveText('おわる');
  await expect(end.locator('[data-en-rewatch]')).toHaveText('もう一度、通して見る');
  await expect(lesson(page).locator('.foot [data-en-rewatch]')).toHaveCount(0);
  await expect(end.locator('[data-en-done]')).toHaveCount(0);
  // おわる leaves (once its slot's carried-over tap window is past)
  await expect(done).toHaveAttribute('data-en-armed', '');
  await done.click();
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
});

test('every scene ◎: まとめ’s foot おわる (no ふりかえる), 通して見る in the card', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  for (let i = 0; ; i++) {
    if (await lesson(page).locator('[data-en-end]').count()) break;
    const q = await questionAt(page, i);
    if (q.choices) await cardAt(page, i).locator(`[data-choice="${q.a}"]`).click();
    else {
      await cardAt(page, i).locator('[data-en-dict]').fill(q.answer!);
      await cardAt(page, i).locator('[data-en-dict-go]').click();
    }
    await expect(cardAt(page, i)).not.toHaveAttribute('data-result', 'open');
    await lesson(page).locator('[data-en-next]').click();
    await expect(lesson(page)).toHaveAttribute('data-en-at', String(i + 1));
  }
  await expect(lesson(page).locator('[data-en-all-first]')).toBeVisible();
  await expect(lesson(page).locator('[data-en-review]')).toHaveCount(0);
  await expect(lesson(page).locator('[data-en-end] [data-en-rewatch]')).toBeVisible();
  await expect(lesson(page).locator('[data-en-done]')).toHaveCount(1);
  const done = lesson(page).locator('.foot [data-en-done]');
  await expect(done).toHaveAttribute('data-en-armed', '');
  await done.click();
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
});

for (const via of ['まとめへ', 'まとめに戻る'] as const)
  test(`おわる in ${via}’s slot: a fast double tap there never leaves the lesson; a tap once it settles goes home`, async ({ page, browserName }) => {
    await fakeYoutube(page);
    await open(page);
    // まとめへ: question 1 right, the rest unanswered (nothing to look back on: おわる at once); まとめに戻る: question 1
    // missed (ふりかえる（1場面）, its one step)
    const n = await toLast(page, via === 'まとめへ' ? (card, q) => card.locator(`[data-choice="${q.a}"]`).click() : miss);
    if (via === 'まとめに戻る') {
      await lesson(page).locator('[data-en-next]').click();
      await lesson(page).locator('.foot [data-en-review]').click();
      await expect(lesson(page).locator('[data-en-rv-next]')).toHaveText(/まとめに戻る/);
    }
    // twice, fast, where the finger is (a real touch on WebKit): the second lands on おわる and is turned away
    const b = (await lesson(page).locator(via === 'まとめへ' ? '[data-en-next]' : '[data-en-rv-next]').boundingBox())!;
    const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
    if (browserName === 'webkit') {
      await page.touchscreen.tap(x, y);
      await page.touchscreen.tap(x, y);
    } else await page.mouse.dblclick(x, y);
    const done = lesson(page).locator('.foot [data-en-done]');
    await expect(done).toHaveText('おわる');
    // (in the very slot the finger was on)
    const d = (await done.boundingBox())!;
    expect(x > d.x && x < d.x + d.width && y > d.y && y < d.y + d.height).toBe(true);
    // past the window, still at まとめ: no tap was left to leave with
    await expect(done).toHaveAttribute('data-en-armed', '');
    await expect(lesson(page).locator('[data-en-end]')).toBeVisible();
    await expect(lesson(page)).toHaveAttribute('data-en-at', String(n));
    await expect(sheet(page).locator('[data-en-home]')).toHaveCount(0);
    // a tap on purpose: home, as the ‹ goes
    if (browserName === 'webkit') await done.tap();
    else await done.click();
    await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
  });

test('the menu’s 英語 pill: a leaf dot while today’s study is to do, none once a まとめ is reached today', async ({ page }) => {
  await fakeYoutube(page);
  await page.goto('?demo');
  await unfoldMenu(page);
  await expect(page.locator('[data-hud-english] [data-hud-english-dot]')).toBeVisible();
  await open(page);
  await toLast(page, (card, q) => card.locator(`[data-choice="${q.a}"]`).click());
  await lesson(page).locator('[data-en-next]').click();
  const done = lesson(page).locator('.foot [data-en-done]');
  await expect(done).toHaveAttribute('data-en-armed', '');
  await done.click();
  await page.locator('dialog[open] [data-en-home] .navbar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await unfoldMenu(page);
  await expect(page.locator('[data-hud-english]')).toBeVisible();
  await expect(page.locator('[data-hud-english-dot]')).toHaveCount(0);
});

test('home’s これまでの記録 row under 今週, always (empty: History says so); the guest’s phone lists the guest’s own plays', async ({ page }) => {
  await fakeYoutube(page);
  await open(page, '&as=G');
  const entry = sheet(page).locator('[data-en-hist-entry]');
  await expect(entry).toHaveText(/これまでの記録\s*見た動画と、もう一度聞きたい場面/);
  expect(await entry.evaluate((el) => el.parentElement?.previousElementSibling?.hasAttribute('data-en-week'))).toBe(true);
  const hist = sheet(page).locator('[data-en-history]');
  await entry.click();
  await expect(hist).toContainText('まだ記録がないよ');
  await page.locator('dialog[open] [data-en-history] .navbar .back').click();
  // the guest's play, then its row
  await toLast(page, (card, q) => card.locator(`[data-choice="${q.a}"]`).click());
  await lesson(page).locator('[data-en-next]').click();
  const done = lesson(page).locator('.foot [data-en-done]');
  await expect(done).toHaveAttribute('data-en-armed', '');
  await done.click();
  await entry.click();
  await expect(hist.locator('[data-en-play]')).toHaveCount(1);
  await expect(hist.locator('[data-en-play]')).toHaveAttribute('data-en-play-clip', 'waitress');
  // a member's phone on the same record: not the guest's play
  await page.goto('?demo');
  await toSheet(page);
  await sheet(page).locator('[data-en-hist-entry]').click();
  await expect(hist).toContainText('まだ記録がないよ');
  await expect(hist.locator('[data-en-play]')).toHaveCount(0);
});

test('これまでの記録: まとめ’s count of scenes to hear again is the record’s (the unanswered on their own line); the play just done (its day, もう一度聞きたい場面), its page (its day the title, 答えはこれ, never the pick), もう一度 and back', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  // question 1 missed twice (答えはこれ), the rest unanswered (not recorded)
  let q0!: (typeof waitress.questions)[number];
  const n = await toLast(page, async (card, q) => {
    q0 = q;
    const [m1, m2] = q.choices!.flatMap((_, k) => (k === q.a ? [] : [k]));
    await card.locator(`[data-choice="${m1}"]`).click();
    await card.locator(`[data-choice="${m2}"]`).click();
    await expect(card).toHaveAttribute('data-result', 'shown');
  });
  await lesson(page).locator('[data-en-next]').click();
  // まとめ: the one missed scene (the record's 1), the unanswered apart, no 全部 ◎
  const end = lesson(page).locator('[data-en-end]');
  await expect(end.locator('[data-en-again]')).toHaveCount(1);
  await expect(end.locator('[data-en-again-note]')).toHaveText('もう一度聞きたい場面が1つあるよ。答えと意味を一緒に見よう');
  await expect(end.locator('[data-en-unanswered]')).toHaveText(`まだ答えていない質問が${n - 1}つあるよ`);
  await expect(end.locator('[data-en-all-first]')).toHaveCount(0);
  await expect(lesson(page).locator('.foot [data-en-review]')).toHaveText('ふりかえる（1場面）');
  await lesson(page).locator('[data-en-done]').click();
  // 今週's これまで 1本 ›
  await sheet(page).locator('[data-en-clips]').click();
  const hist = sheet(page).locator('[data-en-history]');
  await expect(hist).toBeVisible();
  await expect(hist.locator('[data-en-hist-sum]')).toContainText('これまで 1本');
  await expect(hist.locator('[data-en-hist-sum]')).toContainText('学習した日 1日');
  const row = hist.locator('[data-en-play]');
  await expect(row).toHaveCount(1);
  await expect(row).toHaveAttribute('data-en-play-clip', 'waitress');
  await expect(row).toContainText('11月4日（水）· 約');
  await expect(row).toContainText('Rachel Is a Bad Waitress');
  await expect(row.locator('[data-en-hist-miss]')).toHaveText('もう一度聞きたい場面 1');
  expect(await hist.evaluate((el) => /%|×|間違|不正解/.test(el.textContent ?? ''))).toBe(false);
  // its page: its day the title, もう一度聞きたい場面 first, the answer (never the pick), the line, 意味, the phrase
  await row.click();
  const pg = sheet(page).locator('[data-en-hist-play]');
  await expect(pg).toBeVisible();
  await expect(pg.locator('.navbar h2')).toHaveText('11月4日（水）');
  await expect(pg.locator('[data-en-hist-chip="miss"]')).toHaveText(/もう一度聞きたい場面\s*1/);
  await expect(pg.locator('[data-en-hist-chip="miss"]')).toHaveAttribute('aria-pressed', 'true');
  const item = pg.locator('[data-en-hist-q]');
  await expect(item).toHaveCount(1);
  await expect(item).toHaveAttribute('data-en-hist-q', q0.id);
  await expect(item.locator('[data-en-hist-ans]')).toHaveText(`答えはこれ${q0.choices![q0.a!]}`);
  await expect(item).toContainText(q0.mean);
  // もう一度（新しい質問）: the lesson, its ‹ back to this page, then the list, then home
  await pg.locator('[data-en-hist-again]').click();
  await expect(lesson(page)).toBeVisible();
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(pg).toBeVisible();
  await page.locator('dialog[open] [data-en-hist-play] .navbar .back').click();
  await expect(hist).toBeVisible();
  await page.locator('dialog[open] [data-en-history] .navbar .back').click();
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
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

test('a question’s Japanese, when written: hidden till 訳を見る (then on every card of the lesson, never a form item’s choices before answering), always at the reveal; a look is never a miss', async ({ page, browserName }) => {
  const press = (l: Locator) => (browserName === 'webkit' ? l.tap() : l.click());
  await fakeYoutube(page);
  // every question's Japanese, known text: 訳<the choice's authored index>
  await page.route('**/english/c/waitress.*.json', async (r) => {
    const bank = (await (await r.fetch()).json()) as { questions: { choices?: string[] }[] };
    for (const q of bank.questions) Object.assign(q, { ja: '質問の日本語', ...(q.choices && { choicesJa: q.choices.map((_, k) => `訳${k}`) }) });
    await r.fulfill({ json: bank });
  });
  await open(page);
  await start(page);
  await press(lesson(page).locator('[data-en-to-q]'));
  const card = cardAt(page, 0); // the opening item (a listening one)
  const show = card.locator('[data-en-ja-show]');
  // hidden: not in the page at all (so VoiceOver never reads it), one labelled control, 44 tall
  await expect(card.locator('[data-en-stem-ja]')).toHaveCount(0);
  await expect(card.locator('[data-en-choice-ja]')).toHaveCount(0);
  await expect(show).toHaveText('訳を見る');
  await expect(show).toHaveAccessibleName('質問と選択肢の日本語訳を見る');
  expect((await show.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await press(show);
  await expect(show).toHaveCount(0);
  await expect(card.locator('[data-en-stem-ja]')).toHaveText('質問の日本語');
  await expect(card.locator('[data-en-stem-ja]')).toBeFocused();
  // each under its own choice, the shuffle kept
  for (const c of await card.locator('[data-choice]').all()) await expect(c.locator('[data-en-choice-ja]')).toHaveText(`訳${await c.getAttribute('data-choice')}`);
  // the right pick after a look: ◎ first, as without
  const q0 = await questionAt(page, 0);
  await press(card.locator(`[data-choice="${q0.a}"]`));
  await expect(card).toHaveAttribute('data-result', 'first');
  await expect(card.locator('[data-en-choice-ja]')).toHaveCount(await card.locator('[data-choice]').count());
  // the next questions show it too; a form item's choices' only at the reveal
  const ids = [q0.id];
  const right: [string, number, number, number][] = [[q0.id, 1, q0.a!, 0]];
  for (let i = 1; ; i++) {
    await press(lesson(page).locator('[data-en-next]'));
    if (!(await cardAt(page, i).count())) break;
    const c = cardAt(page, i), q = await questionAt(page, i);
    ids.push(q.id);
    // shown once, shown on every card after (this lesson): the stem's; a form item's choices never before answering
    await expect(c.locator('[data-en-ja-show]')).toHaveCount(0);
    if (q.ja) await expect(c.locator('[data-en-stem-ja]')).toBeVisible();
    if (q.choices && ['marker', 'phrase', 'sound'].includes(q.skill)) await expect(c.locator('[data-en-choice-ja]')).toHaveCount(0);
    // a meaning item's choices: the Japanese the choice, its English under it only once answered
    if (q.choices && ['gist', 'infer', 'pragma', 'attitude', 'who', 'humor'].includes(q.skill)) {
      for (const b of await c.locator('[data-choice]').all()) await expect(b.locator('.prl')).toHaveText(`訳${await b.getAttribute('data-choice')}`);
      await expect(c.locator('[data-en-choice-en]')).toHaveCount(0);
      await press(c.locator(`[data-choice="${q.a}"]`));
      right.push([q.id, 1, q.a!, 0]);
      await expect(c.locator('[data-en-choice-en]')).toHaveCount(q.choices.length);
      await expect(c.locator(`[data-choice="${q.a}"] [data-en-choice-en]`)).toHaveText(q.choices[q.a!]);
    }
  }
  await expect(lesson(page).locator('[data-en-end]')).toBeVisible();
  // まとめ's payoff: this week's dot just earned
  await expect(lesson(page).locator('[data-en-end-week]')).toHaveAttribute('data-en-end-week', '1');
  await expect(lesson(page).locator('[data-en-end-week]')).toHaveText('今週 1/3日');
  // the listen row: question 1 and the meaning items first-time right, nothing else recorded (the unanswered aren't)
  await expect(lesson(page).locator('.foot [data-en-done]')).toHaveAttribute('data-en-armed', '');
  await press(lesson(page).locator('[data-en-done]'));
  await expect.poll(async () => {
    const ev = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'listen').map((e: { data: { r: unknown } }) => e.data.r));
    return ev.at(-1);
  }).toEqual(right);
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

test('a bank that doesn’t load: the player and the watch card all the same, 質問を読み込めなかったよ with もう一度, then its questions', async ({ page }) => {
  await fakeYoutube(page);
  let fail = true;
  await page.route(/\/english\/c\/[\w-]+\.\w+\.json$/, (r) => (fail ? r.fulfill({ status: 503, body: '' }) : r.fallback()));
  await open(page);
  await start(page);
  await expect(lesson(page).locator('[data-en-watch]')).toBeVisible();
  await lesson(page).locator('[data-en-to-q]').click();
  const bank = lesson(page).locator('[data-en-bank]');
  await expect(bank).toHaveAttribute('data-en-bank', 'failed');
  await expect(bank).toContainText('質問を読み込めなかったよ');
  await expect(bank).toHaveClass(/load-error/);
  await expect(lesson(page).locator('[data-en-next]')).toHaveCount(0);
  // never a finished clip without its questions (質問へ's at 0 isn't まとめ): ‹ home, the week and today's clip as they were
  await page.locator('dialog[open] [data-en-lesson] .navbar .back').click();
  await expect(sheet(page).locator('[data-en-week]')).toHaveAttribute('data-en-week', '0');
  await expect(sheet(page).locator('[data-en-today]')).toHaveAttribute('data-en-today', waitress.id);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').click();
  await expect(bank).toHaveAttribute('data-en-bank', 'failed');
  fail = false;
  await bank.getByRole('button', { name: 'もう一度' }).click();
  await expect(cardAt(page, 0)).toHaveAttribute('data-result', 'open');
});

test('別の動画にする: the next clip, and the one passed over stays skipped (today’s card after a reload); ⚙ 難しめ kept on this phone', async ({ page }) => {
  await fakeYoutube(page);
  await open(page);
  const today = sheet(page).locator('[data-en-today]');
  await expect(today).toHaveAttribute('data-en-today', 'waitress');
  await sheet(page).locator('[data-en-other]').click();
  // (the card's change waited on, not read at once: a busy runner read waitress still)
  await expect(today).not.toHaveAttribute('data-en-today', 'waitress');
  const next = await today.getAttribute('data-en-today');
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
