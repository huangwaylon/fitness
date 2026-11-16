// ききみみ クイズ (docs/kikimimi.md): the English listening game from the menu's 英語. Solo from the lobby to
// the results and its review list; two players over the demo's relay (`?demo` and `?demo&as=B`, two tabs of one
// browser: sync/live-local.ts plays the room) from B's invite banner to both phones' results, in co-op (the team's tally, never who missed) and in たいせん (the ranking); and the
// way out of a game (‹, Esc, ✕: asking first once something's answered; ‹ lands on the page the game came from). The reveal is untimed: solo taps
// つぎへ, B taps よみおわった and A's つぎへ counts it. `?kikimimi=fast` shortens the answer window (session.ts
// FAST_WINDOWS: 8 s, a tab behind is throttled) on every phone. The logic tier: no clip has to sound (a
// headless browser's audio is a null sink), the schedule is the relay clock's, on the page's clock: stepped through
// (kikimimi-nav.ts runUntil).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, runToPhase, runToQuestion, toMode } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&kikimimi=fast';

type Kiki = { view(): { phase: string; i: number; n: number; amHost: boolean; players: { who: string; score: number }[] }; right(): number; deck(ids: string[]): void; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
const phase = (p: Page) => sheet(p).getAttribute('data-phase');
/** A screenshot (KIKI_SHOTS=1) once しずえ's line has typed out (ui/Bubble's data-typing). */
async function snap(p: Page, path: string, fullPage = false) {
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path, fullPage });
}

/** A phone on its page's clock (a context's installed before its first page: both tabs step together). */
async function open(ctx: BrowserContext | Page, as: 'A' | 'B' = 'A'): Promise<Page> {
  if (!('newPage' in ctx) || !ctx.pages().length) await ctx.clock.install();
  const page = 'newPage' in ctx ? await ctx.newPage() : ctx;
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** The menu's 英語: the game's sheet. */
const play = (page: Page) => fromMenu(page, 'kikimimi');
/** Answer the current question: the right choice, or (`wrong`) another; waits for the answer window first. */
async function answer(page: Page, wrong = false) {
  // (a dialogue's lines play first: 10-20 s of the page's clock)
  await runToPhase(page, 'answer');
  const right = await kiki(page, (k) => k.right());
  const k = wrong ? (right + 1) % (await sheet(page).locator('[data-choice]').count()) : right;
  await sheet(page).locator(`[data-choice="${k}"]`).click();
  await expect(sheet(page).locator(`[data-choice="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
}

/** The reveal's marked choices (○, ×) all above the sticky 次へ. */
const clearOfNext = (page: Page) => sheet(page).evaluate((s) => {
  const top = s.querySelector('[data-kiki-next]')!.getBoundingClientRect().top;
  return [...s.querySelectorAll('[data-mark]')].every((m) => m.getBoundingClientRect().bottom <= top);
});

test('solo: the lobby, eight questions answered, the reveal, the results and the review list', async ({ page }) => {
  await open(page);
  await play(page);
  // my own lobby at once (no one's invite waiting), on this phone alone: the hub; ひとこと クイズ's page from あそぶ
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await toMode(page, 'quiz');
  // おまかせ before any data and any みみ チェック: はまべ 2; a tap picks はまべ 1 over it
  await expect(sheet(page).locator('[data-level="2"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-omakase]')).toBeVisible();
  await sheet(page).locator('[data-level="1"]').click();
  await expect(sheet(page).locator('[data-level="1"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-omakase-reset]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-invite-all]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-start]')).toHaveText('始める');
  // こたえる じかん: 30 s by default; 60 kept on this phone for the next lobby
  await expect(sheet(page).locator('[data-timer="30"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-timer="60"]').click();
  await expect(sheet(page).locator('[data-timer="60"]')).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('island.kikimimiTimer'))).toBe('60');
  if (process.env.KIKI_SHOTS) await snap(page, '/tmp/kikimimi-shots/timers/lobby-solo.png');
  // the island is idle under it (as under けんこう, ごはん)
  await expect(page.locator('.if-scene')).toHaveAttribute('data-covered', 'true');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  // each question: the choices dimmed while the clip plays, one final tap in the answer window, the reveal
  let pics = 0;
  for (let i = 0; i < 8; i++) {
    await runToQuestion(page, i);
    // levels 1-3: the plain stage, never a scene card
    await expect(sheet(page).locator('[data-kiki-card]')).toHaveCount(0);
    await answer(page, i === 3);
    // alone, everyone's in: the reveal at once, the English shown
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-en]')).toBeVisible();
    await expect(sheet(page).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', i === 3 ? 'wrong' : 'right');
    await expect(sheet(page).locator('[data-mark="right"]')).toHaveCount(1);
    // the marked choices never under the sticky 次へ
    await expect.poll(() => clearOfNext(page)).toBe(true);
    // a picture round's reveal: only the right picture and my pick (as a dialogue's), its English still in view
    if (await sheet(page).locator('.choices.pics').count()) {
      pics++;
      await expect(sheet(page).locator('[data-choice]')).toHaveCount(i === 3 ? 2 : 1);
      await expect(sheet(page).locator('[data-kiki-en]')).toBeInViewport({ ratio: 1 });
    }
    // the first listen's いっぱつ stamp (a badge, no points; none on a miss)
    await expect(sheet(page).locator('[data-kiki-bonus]')).toHaveCount(i === 3 ? 0 : 1);
    if (i !== 3) await expect(sheet(page).locator('[data-kiki-bonus]')).toHaveText('1回目で正解！');
    // the reveal waits (no timer) till my つぎへ
    if (i === 0) {
      await page.clock.runFor(2500);
      await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    }
    await sheet(page).locator('[data-kiki-next]').click();
  }
  expect(pics, 'はまべ 1 deals a picture round').toBeGreaterThan(0);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // 7 right: 7 × 100 (いっぱつ adds nothing)
  await expect.poll(() => kiki(page, (k) => k.view().players[0].score)).toBe(700);
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('7 / 8 問正解');
  await expect(sheet(page).locator('[data-kiki-firsts]')).toHaveText('1回目で正解 7問');
  // with a miss, the review opens on the missed one, open: its English, my pick, ▶︎
  await expect(sheet(page).locator('[data-kiki-missed]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-review="3"]')).toHaveAttribute('data-ok', 'false');
  await expect(sheet(page).locator('[data-review="3"] [data-kiki-review-en]')).toBeVisible();
  await expect(sheet(page).locator('[data-review="3"] [data-kiki-picked]')).toContainText('あなたの答え');
  await expect(sheet(page).locator('[data-kiki-hear="3"]')).toBeVisible();
  // its ▶︎ plays through the 3 s refreshes after it (review 5: each one stopped it): no source stopped by the app
  await page.evaluate(() => {
    const W = window as unknown as { __stops: number; __starts: number }, P = AudioBufferSourceNode.prototype, start = P.start, stop = P.stop;
    W.__starts = W.__stops = 0;
    P.start = function (...a) { W.__starts++; return start.apply(this, a); };
    P.stop = function (...a) { W.__stops++; return stop.apply(this, a); };
  });
  await sheet(page).locator('[data-kiki-hear="3"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __starts: number }).__starts)).toBeGreaterThan(0);
  await page.clock.runFor(7000);
  expect(await page.evaluate(() => (window as unknown as { __stops: number }).__stops)).toBe(0);
  // a row folds and opens
  await sheet(page).locator('[data-kiki-row="3"]').click();
  await expect(sheet(page).locator('[data-kiki-detail="3"]')).toHaveCount(0);
  await sheet(page).locator('[data-kiki-row="3"]').click();
  await expect(sheet(page).locator('[data-kiki-detail="3"]')).toBeVisible();
  if (process.env.KIKI_SHOTS) await snap(page, '/tmp/kikimimi-shots/timers/solo-results-missed.png', true);
  await sheet(page).locator('[data-kiki-missed]').click();
  await expect(sheet(page).locator('[data-review]')).toHaveCount(8);
  if (process.env.KIKI_SHOTS) await snap(page, '/tmp/kikimimi-shots/timers/solo-results-all.png', true);
  // まちがえた もんだいを もういちど: that one again, solo, untimed reveal, and its results
  const missed = (await kiki(page, (k) => k.items()))[3];
  await sheet(page).locator('[data-kiki-retry]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  expect(await kiki(page, (k) => k.items())).toEqual([missed]);
  await answer(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await sheet(page).locator('[data-kiki-next]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('1 / 1 問正解');
  await expect(sheet(page).locator('[data-kiki-retry]')).toHaveCount(0);
  // 終わる: back to the page the game was started from (the mode's, a fresh lobby); ‹ ‹ the hub; ✕ closes, the island back
  await sheet(page).locator('[data-kiki-done]').click();
  await expect(sheet(page).locator('[data-kiki-mode-page="quiz"]')).toBeVisible();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await page.locator('dialog[open] .navbar .back').click();
  await page.locator('dialog[open] .navbar .back').click();
  await atHub(page);
  await page.locator('dialog[open] .navbar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('.if-scene')).not.toHaveAttribute('data-covered', 'true');
});

test('leaving a game: ‹ before my first answer leaves at once for the mode’s page; after it Esc (= ‹) asks: ‹ やめる lands on the page, ✕ やめる closes', async ({ page }) => {
  await open(page);
  await play(page);
  await toMode(page, 'quiz');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => phase(page)).toMatch(/countdown|lead|play/);
  const ask = page.getByRole('dialog', { name: 'ここでやめますか？' });
  // nothing to lose yet (solo, no answer): ‹ leaves at once, back on the mode's page
  await page.locator('dialog[open] .navbar .back').click();
  await expect(ask).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-mode-page="quiz"]')).toBeVisible();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  // one answered: Esc asks (its ✕ goes on); やめる lands on the mode's page
  await sheet(page).locator('[data-kiki-start]').click();
  await answer(page);
  await page.keyboard.press('Escape');
  await expect(ask).toBeVisible();
  await expect(ask.locator('[data-kiki-ask-others]')).toHaveCount(0);
  await ask.locator('.navbar .close').click();
  await expect(ask).toHaveCount(0);
  await expect(sheet(page)).toHaveAttribute('data-phase', /reveal|lead|play|answer/);
  await page.keyboard.press('Escape');
  await ask.locator('[data-action="kiki-quit"]').click();
  await expect(sheet(page).locator('[data-kiki-mode-page="quiz"]')).toBeVisible();
  // ✕ mid-game asks too, and its やめる closes the sheet
  await sheet(page).locator('[data-kiki-start]').click();
  await answer(page);
  await page.locator('dialog[open] .titlebar button').last().click();
  await expect(ask).toBeVisible();
  await ask.locator('[data-action="kiki-quit"]').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // the hub, unstarted: ✕ closes at once
  await play(page);
  await atHub(page);
  await page.locator('dialog[open] .titlebar button').last().click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('dialogues (gist, next): both speakers while it plays, the two-sided transcript at the reveal (a next’s answer as the next line), the review’s transcripts', async ({ page }) => {
  await open(page);
  await play(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  // (level 4's dialogues wait for their clips: the test hook starts my lobby on them, as にがて れんしゅう would; no clip
  // sounds here, but the schedule runs on the lines' real lengths)
  await kiki(page, (k) => k.deck(['d4-oat-latte', 'd4-train-cancelled']));
  await expect.poll(() => kiki(page, (k) => k.items())).toEqual(['d4-oat-latte', 'd4-train-cancelled']);
  const shots = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/inc34' : null;
  for (const [i, lines, next] of [[0, 3, true], [1, 4, false]] as const) {
    await runToQuestion(page, i);
    await expect(sheet(page).locator(`[data-kiki-q="${i}"]`)).toHaveAttribute('data-type', next ? 'next' : 'gist');
    // while it plays: both speakers standing in its scene (level 4's scene card, kikimimi-scenes.spec), no text
    await expect(sheet(page).locator('[data-kiki-card] [data-vill]')).toHaveCount(2);
    await expect(sheet(page).locator('[data-kiki-transcript]')).toHaveCount(0);
    await expect(sheet(page).locator('.ask')).toHaveText(next ? 'つぎの ひとことは？' : '男性は このあと どうする？');
    if (shots && i === 1) await snap(page, `${shots}/dialogue-play.png`);
    await answer(page, i === 1);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    const tr = sheet(page).locator(`[data-kiki-transcript="${next ? 'd4-oat-latte' : 'd4-train-cancelled'}"]`);
    await expect(tr.locator('[data-line]')).toHaveCount(lines);
    // the second speaker's lines on the right; the focus marked in its line
    await expect(tr.locator('[data-line="1"]')).toHaveClass(/right/);
    await expect(tr.locator('[data-line]:has(.focus)')).toHaveCount(1);
    await expect(tr.locator('[data-kiki-next-line]')).toHaveCount(next ? 1 : 0);
    if (next) await expect(tr.locator('[data-kiki-next-line] .en')).toHaveText("No problem, I've got a minute.");
    await expect(sheet(page).locator('[data-kiki-note]')).toBeVisible();
    if (shots) await snap(page, `${shots}/dialogue-reveal-${next ? 'next' : 'gist'}.png`);
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // the missed one (1) open with its transcript; the other folded till tapped
  await expect(sheet(page).locator('[data-review] [data-kiki-transcript]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-review="1"] .ans')).toContainText("He'll take the shuttle bus out front.");
  await sheet(page).locator('[data-kiki-missed]').click();
  await sheet(page).locator('[data-kiki-row="0"]').click();
  await expect(sheet(page).locator('[data-review] [data-kiki-transcript]')).toHaveCount(2);
  if (shots) await snap(page, `${shots}/dialogue-results.png`, true);
});
