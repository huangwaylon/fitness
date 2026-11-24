// English Study's player (docs/english.md "The player"): its offline and unavailable states, the controls, 字幕 オフ /
// 英語 / 日本語 and their size, 場面のあらすじ and its beats, ツール's levels, セリフ and この動画のセリフと解説. Helpers:
// e2e/english.ts.
import { expect, test } from './fixtures.ts';
import { fakeYoutube, ytCommands } from './youtube.ts';
import { cardAt, questionAt, since, from, sheet, lesson, open, start, toSheet } from './english.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import waitressScenes from '../src/lib/english/scenes/lm2MpPpkGL8.json' with { type: 'json' };
import waitressEn from '../src/lib/english/transcripts/lm2MpPpkGL8.en.json' with { type: 'json' };
import waitressJa from '../src/lib/english/transcripts/lm2MpPpkGL8.ja.json' with { type: 'json' };
import { momentsOf } from '../src/lib/english/phrases.ts';

test.use({ viewport: { width: 393, height: 852 } });

test('the player offline: a note in its place, the embed once back online; today’s bank fetched ahead, so its questions work', async ({ page, context }) => {
  await fakeYoutube(page);
  const ahead = page.waitForResponse(/\/english\/c\/waitress\.\w+\.json$/);
  await open(page);
  expect((await ahead).ok()).toBe(true);
  await context.setOffline(true);
  await sheet(page).locator('[data-en-start]').click();
  await expect(lesson(page).locator('[data-yt-offline]')).toContainText('オフライン');
  await expect(lesson(page).locator('[data-yt-frame]')).toHaveCount(0);
  await expect(lesson(page).locator('[data-en-scene]')).toHaveCount(0);
  // the watch card offers what works offline: フレーズ
  await expect(lesson(page).locator('[data-en-offline-lesson]')).toContainText('フレーズの復習はオフラインでもできるよ');
  await expect(lesson(page).locator('[data-en-offline-phrases]')).toBeVisible();
  // the questions work offline all the same
  await lesson(page).locator('[data-en-to-q]').click();
  await lesson(page).locator(`[data-en-q="0"] [data-choice="${(await questionAt(page, 0)).a}"]`).click();
  await expect(lesson(page).locator('[data-en-q="0"]')).toHaveAttribute('data-result', 'first');
  await context.setOffline(false);
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
});

test('offline, the watch card’s フレーズを練習する opens the フレーズ tab', async ({ page, context }) => {
  await fakeYoutube(page);
  const ahead = page.waitForResponse(/\/english\/c\/waitress\.\w+\.json$/);
  await open(page);
  await ahead;
  await context.setOffline(true);
  await sheet(page).locator('[data-en-start]').click();
  await lesson(page).locator('[data-en-offline-phrases]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'phrases');
});

test('a video that can’t be embedded: the note, YouTube’s link, もう一度読み込む', async ({ page }) => {
  await fakeYoutube(page, { error: 150 });
  await open(page);
  await sheet(page).locator('[data-en-start]').click();
  const note = lesson(page).locator('[data-yt-unavailable]');
  await expect(note).toHaveAttribute('data-yt-unavailable', '150');
  await expect(note.locator('a')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=lm2MpPpkGL8');
  await expect(note.locator('[data-yt-retry]')).toBeVisible();
  // no 場面のあらすじ line to seek a player that can't play (the clip has scenes: shown once it plays, the test above)
  await expect(lesson(page).locator('[data-en-scene]')).toHaveCount(0);
});

test('a play that doesn’t start (iOS wants a tap on the video): the hint; none once one has played', async ({ page }) => {
  await fakeYoutube(page, { noPlay: true });
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect(lesson(page).locator('[data-yt-stuck]')).toContainText('動画を一度タップしてね');
});

test('the controls: play / pause on from where it stopped, −5 秒, the scrubber, 0.75× only when offered; a question’s part from its card only', async ({ page }) => {
  await fakeYoutube(page, { rate: 4 });
  await open(page);
  await start(page);
  const c = lesson(page).locator('[data-yt-controls]');
  const order = () => c.locator('button, input').evaluateAll((els) => els.map((e) => Object.keys((e as HTMLElement).dataset).find((k) => k.startsWith('yt'))));
  // ▶ | the scrubber | 字幕, then −5秒 0.75× under them, each a full 44 pt; no ⋯
  await expect.poll(order).toEqual(['ytToggle', 'ytScrub', 'ytCc', 'ytBack5', 'ytRate']);
  await expect(c.locator('[data-yt-cc]')).toHaveAttribute('aria-label', '字幕：オフ（タップで英語）');
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
  // −5 秒 and the scrubber seek, never locked (paused first: playing, −5 秒 counts from wherever the playhead got to by the tap)
  await c.locator('[data-yt-toggle="pause"]').click();
  await expect(c.locator('[data-yt-toggle="play"]')).toBeVisible();
  const n1 = (await ytCommands(page)).length;
  await c.locator('[data-yt-scrub]').fill('40');
  await expect.poll(async () => (await since(page, n1)).at(-1)).toEqual(['seekTo', [40, true], expect.any(Number)]);
  await c.locator('[data-yt-back5]').click();
  await expect.poll(async () => (await since(page, n1)).at(-1)?.slice(0, 2)).toEqual(['seekTo', [35, true]]);
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
  await expect(cc).toHaveText('字幕：オフ');
  await expect(cc).toHaveAttribute('aria-pressed', 'false');
  // off: unloaded at ready and at a play, never loaded
  await expect.poll(() => funcs()).toEqual(expect.arrayContaining(['unloadModule ["captions"]', 'unloadModule ["cc"]']));
  await lesson(page).locator('[data-en-watch-all]').click();
  await expect(lesson(page).locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'playing');
  expect((await funcs()).filter((f) => /^(loadModule|setOption)/.test(f))).toEqual([]);
  // 英語, mid-play: loaded with the English track at once, again at the next play, never unloaded
  const n0 = (await ytCommands(page)).length;
  await cc.click();
  await expect(cc).toHaveText('字幕：英語');
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
  await expect(cc).toHaveText('字幕：日本語');
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
  await expect(cc).toHaveText('字幕：オフ');
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
  await toSheet(page);
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
  await expect(row).toContainText('質問の答えと解説が入っているよ');
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
  await toSheet(page);
  await start(page);
  await expect.poll(() => served).toBe(true);
  await lesson(page).locator('[data-en-tools]').click();
  await expect(page.locator('dialog[open] [data-en-tools-sheet] [data-en-phrases-open]')).toBeVisible();
  await expect(page.locator('dialog[open] [data-en-tools-sheet] [data-en-transcript-open]')).toHaveCount(0);
});
