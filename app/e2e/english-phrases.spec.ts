// English Study's フレーズ tab and library (docs/english.md "The page"): the deck's cards, one embed a set, a deck
// file that fails, フレーズの復習 on home, the library 20 at a time and 場面で選ぶ. Helpers: e2e/english.ts.
import { expect, test, type Page } from './fixtures.ts';
import { fakeYoutube, ytCommands } from './youtube.ts';
import { PLAN, cardAt, from, sheet, lesson, open, start, tabOf, deckCard, back, shownCard } from './english.ts';
import { waitress } from '../src/lib/english/clips/waitress.ts';
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { shownOf } from '../src/lib/english/collections.ts';
import { metaOf } from '../src/lib/english/catalog.ts';
import { splitUse } from '../src/lib/english/phrases.ts';

test.use({ viewport: { width: 393, height: 852 } });

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

test.describe('393×659', () => {
  test.use({ viewport: { width: 393, height: 659 }, hasTouch: true });
  test('フレーズ at 393×659: once turned, ☆ 復習に入れる and 次へ come up above the tab bar (the player pushed them under it)', async ({ page }) => {
    await fakeYoutube(page);
    await open(page);
    await tabOf(page, 'phrases').tap();
    await deckCard(page).locator('[data-en-deck-show]').tap();
    await expect(deckCard(page)).toHaveAttribute('data-face', 'back');
    const bar = (await sheet(page).locator('[role="tablist"]').boundingBox())!;
    for (const b of ['[data-en-deck-save]', '[data-en-deck-next]'])
      await expect.poll(async () => { const r = (await deckCard(page).locator(b).boundingBox())!; return r.y + r.height <= bar.y; }, { message: b }).toBe(true);
  });
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
const ytVideo = (p: Page) => p.frames().find((f) => f.url().startsWith('https://www.youtube-nocookie.com/'))?.evaluate(() => (window as unknown as { __yt?: { videoId: string } }).__yt?.videoId);

test('フレーズ: a deck file that doesn’t load: 読み込めなかったよ with もう一度, then its card', async ({ page }) => {
  await fakeYoutube(page);
  let fail = true;
  await page.route(/\/english\/p\/\d+\.\w+\.json$/, (r) => (fail ? r.fulfill({ status: 503, body: '' }) : r.fallback()));
  await open(page);
  await tabOf(page, 'phrases').tap();
  const err = sheet(page).locator('[data-en-deck-failed]');
  await expect(err).toContainText('フレーズを読み込めなかったよ');
  await expect(err).toHaveClass(/load-error/);
  await expect(deckCard(page)).toHaveCount(0);
  fail = false;
  await err.getByRole('button', { name: 'もう一度' }).tap();
  await expect(deckCard(page)).toBeVisible();
});

test('フレーズ: a deck file gone after a deploy (404 twice online, version.json naming a newer build): the page reloads into it once', async ({ page }) => {
  await fakeYoutube(page);
  await page.route(/\/english\/p\/\d+\.\w+\.json$/, (r) => r.fulfill({ status: 404, body: '' }));
  await page.route('**/_app/version.json', (r) => r.fulfill({ contentType: 'application/json', body: '{"version":"next"}' }));
  await open(page);
  await tabOf(page, 'phrases').tap();
  const err = sheet(page).locator('[data-en-deck-failed]');
  await expect(err).toBeVisible();
  const reloaded = page.waitForEvent('load');
  await err.getByRole('button', { name: 'もう一度' }).tap();
  await reloaded;
});

// (the launch review 11-21: two failed loads on a weak signal reloaded the whole app under the player while online)
test('フレーズ: a deck file that fails twice with this build still the deployed one: no reload, the error stays', async ({ page }) => {
  await fakeYoutube(page);
  await page.route(/\/english\/p\/\d+\.\w+\.json$/, (r) => r.fulfill({ status: 503, body: '' }));
  await open(page);
  await tabOf(page, 'phrases').tap();
  const err = sheet(page).locator('[data-en-deck-failed]');
  await expect(err).toBeVisible();
  const navs: string[] = [];
  page.on('framenavigated', (f) => f === page.mainFrame() && navs.push(f.url()));
  const asked = page.waitForResponse('**/_app/version.json');
  await err.getByRole('button', { name: 'もう一度' }).tap();
  await asked;
  // (its answer read, the reload's decision made in the next tasks)
  await page.evaluate(() => new Promise((ok) => setTimeout(ok)));
  await expect(err).toBeVisible();
  expect(navs).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem('island.reloadAt'))).toBeNull();
});

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

test('フレーズ: the same card face down after a lesson; ☆ 復習に入れる saves it apart from its schedule, home’s review has a saved one the next day; 5 a set, never two of one clip, then 5枚見たよ with もう5枚 / ホームへ', async ({ page }) => {
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
  await expect(star).toHaveText('復習に入れたよ');
  expect(await mine()).toEqual({ s: {}, k: { [`waitress/${q.id}`]: '2026-11-03', [first.k]: '2026-11-04' } });
  await star.click();
  await expect(star).toHaveText('復習に入れる');
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
  await expect(end).toContainText('5枚見たよ · これまで 5フレーズ');
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
