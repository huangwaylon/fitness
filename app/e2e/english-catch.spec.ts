// 聞き取りチャレンジ and 聞けたセリフ (docs/english.md "Catch the line", "聞けたセリフ"), in WebKit with taps: at まとめ the
// clip's caption-checked line, heard with no text, its tiles tapped in order (one out of order: it hops back, the next is
// placed for them and the line plays again at 0.75×), then the line at full speed with the words lit and its Japanese;
// on the shelf as caught. Three days on, home brings it back first: caught first try at full speed, 聞けた, and the
// shelf's count and its card (before → now, ▶ its segment). The embed stood in for (e2e/youtube.ts); the pinned day
// 2026-11-04.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from './fixtures.ts';
import { fakeYoutube } from './youtube.ts';
import { from, lesson, open, sheet, start } from './english.ts';
import { ytCommands } from './youtube.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import { captionWords, catchLinesOf } from '../src/lib/english/catch-build.ts';

test.use({ viewport: { width: 393, height: 852 } });

/** waitress's lines as the build makes them (one: "does anybody need coffee"). */
const LINES = catchLinesOf(waitress, captionWords(JSON.parse(readFileSync(new URL(`../../english-captions/${waitress.video}.en.json3`, import.meta.url), 'utf8'))));
const LINE = LINES[0];
const shelf = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem('island.english.caught') ?? '{}').A);
const shot = (p: Page, name: string) => (process.env.CATCH_SHOTS ? p.screenshot({ path: `${process.env.CATCH_SHOTS}/${name}.png` }) : null);

test('聞き取りチャレンジ at まとめ: no text first, a tile out of order hops back and the next is placed (0.75×), then the words lit at full speed; on the shelf as caught', async ({ page }) => {
  expect(LINES).toHaveLength(1);
  await fakeYoutube(page, { dur: 300 });
  await open(page);
  await start(page);
  await lesson(page).locator('[data-en-to-q]').tap();
  while (!(await lesson(page).locator('[data-en-end]').count())) await lesson(page).locator('[data-en-next]').tap();
  const card = lesson(page).locator(`[data-en-catch="${LINE.q}"]`);
  await expect(card).toHaveAttribute('data-state', 'ready');
  await expect(card.locator('[data-tile]')).toHaveCount(0); // heard before read
  await shot(page, 'catch-ready');
  const n0 = (await ytCommands(page)).length;
  await card.locator('[data-en-catch-play]').tap();
  await expect.poll(async () => (await from(page, n0, 'seekTo'))[0]?.[1]).toEqual([LINE.seg[0], true]);
  await expect(card.locator('[data-tile]')).toHaveCount(LINE.tiles.length + LINE.x.length);
  // the first chunk, then a distractor: it hops back, the second chunk is placed for them, the line again at 0.75×
  await card.locator(`[data-tile="${LINE.tiles[0]}"]`).tap();
  await expect(card.locator('[data-slot="0"]')).toHaveText(LINE.tiles[0]);
  const n1 = (await ytCommands(page)).length;
  await card.locator(`[data-tile="${LINE.x[0]}"]`).tap();
  await expect(card.locator('[data-slot="1"]')).toHaveText(LINE.tiles[1]);
  await expect(card.locator('[data-slot="1"]')).toHaveClass(/given/);
  await expect(card.locator('[data-en-catch-help]')).toBeVisible();
  await expect.poll(async () => (await ytCommands(page)).slice(n1).map((c) => c[0])).toEqual(expect.arrayContaining(['setPlaybackRate', 'seekTo', 'playVideo']));
  expect((await ytCommands(page)).slice(n1).find((c) => c[0] === 'setPlaybackRate')?.[1]).toEqual([0.75]);
  await expect(card).not.toContainText(/incorrect|不正解|間違い|×/);
  await shot(page, 'catch-build');
  // the rest in order: done, the reward at full speed, its Japanese
  const n2 = (await ytCommands(page)).length;
  for (const t of LINE.tiles.slice(2)) await card.locator(`[data-tile="${t}"]`).tap();
  await expect(card).toHaveAttribute('data-state', 'done');
  await expect(card.locator('[data-en-catch-done]')).toHaveAttribute('data-en-catch-done', 'helped');
  await expect(card.locator('[data-en-catch-ja]')).toContainText(LINE.ja);
  expect((await ytCommands(page)).slice(n2).find((c) => c[0] === 'setPlaybackRate')?.[1]).toEqual([1]);
  // the karaoke: every chunk lit by the end of the replay
  await expect(card.locator('.slot.lit')).toHaveCount(LINE.tiles.length, { timeout: 8000 });
  await expect(card.locator('[data-en-catch-saved]')).toBeVisible();
  await shot(page, 'catch-done');
  expect(await shelf(page)).toEqual({ lines: { [`waitress/${LINE.q}`]: { video: waitress.video, title: 'Rachel Is a Bad Waitress', line: JSON.parse(JSON.stringify(LINE)), first: { d: '2026-11-04', slow: 1, h: 1 }, step: 0 } } });
  // まとめ's card stays below, and the shelf opens from here: the line, not yet 聞けた
  await expect(lesson(page).locator('[data-en-end]')).toBeVisible();
  await card.locator('[data-en-catch-shelf]').tap();
  await expect(sheet(page).locator('[data-en-shelf-heard]')).toHaveAttribute('data-en-shelf-heard', '0');
  await expect(sheet(page).locator(`[data-en-shelf-card="waitress/${LINE.q}"] [data-en-shelf-arc]`)).toHaveText(/11\/4 ×0\.75・ヒント1\s*11\/7にまた/);
});

test('聞けたセリフ: back on home three days on, first thing; caught first try at full speed, 聞けた and counted; the shelf’s card before → now, ▶ its segment', async ({ page }) => {
  await fakeYoutube(page, { dur: 300 });
  const k = `waitress/${LINE.q}`;
  await page.addInitScript(([k, e]) => {
    if (localStorage.getItem('island.english.caught') === null) localStorage.setItem('island.english.caught', JSON.stringify({ A: { lines: { [k]: e } } }));
  }, [k, { video: waitress.video, title: 'Rachel Is a Bad Waitress', line: LINE, first: { d: '2026-11-01', slow: 1, h: 1 }, step: 0 }] as const);
  await open(page);
  const back = sheet(page).locator(`[data-en-back-line="${k}"]`);
  await expect(back).toBeVisible();
  // above today's clip
  expect((await back.boundingBox())!.y).toBeLessThan((await sheet(page).locator('[data-en-today]').boundingBox())!.y);
  await expect(sheet(page).locator('[data-en-shelf-n]')).toHaveText('0');
  await shot(page, 'back-intro');
  await back.locator('[data-en-back-start]').tap();
  await expect(back.locator('[data-yt-state]')).toHaveAttribute('data-yt-state', 'ready');
  const card = back.locator('[data-en-catch]');
  await card.locator('[data-en-catch-play]').tap();
  await expect(card.locator('[data-tile]')).toHaveCount(LINE.tiles.length + LINE.x.length);
  await shot(page, 'back-build');
  for (const t of LINE.tiles) await card.locator(`[data-tile="${t}"]`).tap();
  await expect(card.locator('[data-en-catch-done]')).toHaveAttribute('data-en-catch-done', 'clean');
  await expect(back.locator('[data-en-back-result]')).toHaveAttribute('data-en-back-result', 'heard');
  await expect(back.locator('[data-en-back-result]')).toContainText('1本');
  await shot(page, 'back-heard');
  expect((await shelf(page)).lines[k]).toMatchObject({ last: { d: '2026-11-04' }, step: 1, heard: '2026-11-04' });
  expect((await shelf(page)).day).toEqual(['2026-11-04', 1]);
  // the shelf: 1 heard, its card from then to now, ▶ plays its segment
  await back.locator('[data-en-back-shelf]').tap();
  await expect(sheet(page).locator('[data-en-shelf-heard]')).toHaveAttribute('data-en-shelf-heard', '1');
  const c = sheet(page).locator(`[data-en-shelf-card="${k}"]`);
  await expect(c.locator('[data-en-shelf-tag]')).toHaveText('聞けた');
  await expect(c.locator('[data-en-shelf-arc]')).toHaveText(/11\/1 ×0\.75・ヒント1\s*11\/4 そのまま一回で/);
  await c.locator('[data-en-shelf-play]').tap();
  await expect(sheet(page).locator('[data-en-shelf] [data-yt-state]')).toHaveAttribute('data-yt-state', /ready|playing|paused/);
  await expect.poll(async () => (await ytCommands(page)).some((x) => x[0] === 'seekTo' && (x[1] as number[])[0] === LINE.seg[0])).toBe(true);
  await shot(page, 'shelf');
  // done for today: home again has no return
  await sheet(page).locator('.navbar .back').tap();
  await expect(sheet(page).locator('[data-en-home]')).toBeVisible();
  await expect(sheet(page).locator('[data-en-back-line]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-en-shelf-n]')).toHaveText('1');
});
