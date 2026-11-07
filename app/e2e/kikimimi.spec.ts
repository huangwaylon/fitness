// ききみみ クイズ (docs/kikimimi.md): the English listening game from the menu's 「えいご ききとり」. Solo from the lobby to
// the results and its review list; two players over the demo's relay (`?demo` and `?demo&as=B`, two tabs of one
// browser: sync/live-local.ts plays the room) from B's invite banner to both phones' results, in co-op (the team's tally, never who missed) and in たいせん (the ranking); and the
// 「やめますか？」 path (mid-game a backdrop tap or Esc keeps the sheet; ✕ asks first). The reveal is untimed: solo taps
// つぎへ, B taps よみおわった and A's つぎへ counts it. `?kikimimi=fast` shortens the answer window (session.ts
// FAST_WINDOWS: 8 s, a tab behind is throttled) on every phone. The logic tier: no clip has to sound (a
// headless browser's audio is a null sink), the schedule is the relay clock's.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, toMode, toTile } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';

type Kiki = { view(): { phase: string; i: number; n: number; amHost: boolean; players: { who: string; score: number }[] }; right(): number; deck(ids: string[]): void; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
const phase = (p: Page) => sheet(p).getAttribute('data-phase');
/** A screenshot (KIKI_SHOTS=1) once しずえ's line has typed out (ui/Bubble's data-typing). */
async function snap(p: Page, path: string, fullPage = false) {
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path, fullPage });
}

async function open(ctx: BrowserContext | Page, as: 'A' | 'B' = 'A'): Promise<Page> {
  const page = 'newPage' in ctx ? await ctx.newPage() : ctx;
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** The menu's えいご ききとり: the game's sheet. */
const play = (page: Page) => fromMenu(page, 'kikimimi');
/** Answer the current question: the right choice, or (`wrong`) another; waits for the answer window first. */
async function answer(page: Page, wrong = false) {
  // (a dialogue's lines play first: 10-20 s of real clips)
  await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 40_000 });
  const right = await kiki(page, (k) => k.right());
  const k = wrong ? (right + 1) % (await sheet(page).locator('[data-choice]').count()) : right;
  await sheet(page).locator(`[data-choice="${k}"]`).click();
  await expect(sheet(page).locator(`[data-choice="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
}

test('solo: the lobby, eight questions answered, the reveal, the results and the review list', async ({ page }) => {
  test.slow();
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
  await expect(sheet(page).locator('[data-kiki-players]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-invite-all]')).toBeVisible();
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
  for (let i = 0; i < 8; i++) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(i);
    // levels 1-3: the plain stage, never a scene card
    await expect(sheet(page).locator('[data-kiki-card]')).toHaveCount(0);
    await answer(page, i === 3);
    // alone, everyone's in: the reveal at once, the English shown
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-en]')).toBeVisible();
    await expect(sheet(page).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', i === 3 ? 'wrong' : 'right');
    await expect(sheet(page).locator('[data-mark="right"]')).toHaveCount(1);
    // the first listen's いっぱつ stamp (a badge, no points; none on a miss)
    await expect(sheet(page).locator('[data-kiki-bonus]')).toHaveCount(i === 3 ? 0 : 1);
    if (i !== 3) await expect(sheet(page).locator('[data-kiki-bonus]')).toHaveText('一発！');
    // the reveal waits (no timer) till my つぎへ
    if (i === 0) {
      await page.waitForTimeout(2500);
      await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    }
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // 7 right: 7 × 100 (いっぱつ adds nothing)
  await expect.poll(() => kiki(page, (k) => k.view().players[0].score)).toBe(700);
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('7 / 8 問正解');
  await expect(sheet(page).locator('[data-kiki-firsts]')).toHaveText('一発 7問');
  // with a miss, the review opens on the missed one, open: its English, my pick, ▶︎
  await expect(sheet(page).locator('[data-kiki-missed]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-review="3"]')).toHaveAttribute('data-ok', 'false');
  await expect(sheet(page).locator('[data-review="3"] [data-kiki-review-en]')).toBeVisible();
  await expect(sheet(page).locator('[data-review="3"] [data-kiki-picked]')).toContainText('あなたの答え');
  await expect(sheet(page).locator('[data-kiki-hear="3"]')).toBeVisible();
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
  // おわる: back to the hub; ✕ closes, the island back
  await sheet(page).locator('[data-kiki-done]').click();
  await atHub(page);
  await page.locator('dialog[open] .navbar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('.if-scene')).not.toHaveAttribute('data-covered', 'true');
});

test('mid-game, Esc and the backdrop keep the sheet; ✕ asks 「やめますか？」: its ✕ goes on, やめる closes it', async ({ page }) => {
  await open(page);
  await play(page);
  await toMode(page, 'quiz');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => phase(page)).toMatch(/countdown|lead|play/);
  const ask = page.getByRole('dialog', { name: 'ここでやめますか？' });
  await page.keyboard.press('Escape');
  await expect(ask).toBeVisible();
  await ask.locator('.navbar .close').click();
  await expect(ask).toHaveCount(0);
  await expect(sheet(page)).toBeVisible();
  // the backdrop: the sheet is the screen's whole height, so its ::backdrop has no room; ✕ then
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
  test.slow();
  await open(page);
  await play(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  // (level 4's dialogues wait for their clips: the test hook starts my lobby on them, as にがて れんしゅう would; no clip
  // sounds here, but the schedule runs on the lines' real lengths)
  await kiki(page, (k) => k.deck(['d4-oat-latte', 'd4-train-cancelled']));
  await expect.poll(() => kiki(page, (k) => k.items())).toEqual(['d4-oat-latte', 'd4-train-cancelled']);
  const shots = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/inc34' : null;
  for (const [i, lines, next] of [[0, 3, true], [1, 4, false]] as const) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 40_000 }).toBe(i);
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
    if (next) await expect(tr.locator('[data-kiki-next-line] .en')).toHaveText("No problem, I'm not in a rush.");
    await expect(sheet(page).locator('[data-kiki-note]')).toBeVisible();
    if (shots) await snap(page, `${shots}/dialogue-reveal-${next ? 'next' : 'gist'}.png`);
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // the missed one (1) open with its transcript; the other folded till tapped
  await expect(sheet(page).locator('[data-review] [data-kiki-transcript]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-review="1"] .ans')).toContainText("He'll take a bus from outside the station.");
  await sheet(page).locator('[data-kiki-missed]').click();
  await sheet(page).locator('[data-kiki-row="0"]').click();
  await expect(sheet(page).locator('[data-review] [data-kiki-transcript]')).toHaveCount(2);
  if (shots) await snap(page, `${shots}/dialogue-results.png`, true);
});

/** A and B in A's shared lobby (B from the banner's さんか); `vs`: A turns たいせん on before starting. */
async function together(ctx: BrowserContext, vs = false): Promise<[Page, Page]> {
  const a = await open(ctx, 'A');
  const b = await open(ctx, 'B');
  // (each tab hears the other's hello: the room's presence)
  await expect.poll(() => a.evaluate(() => document.querySelector('.if-scene') !== null)).toBe(true);
  await a.bringToFront();
  await play(a);
  await expect(sheet(a)).toHaveAttribute('data-phase', 'lobby');
  await toTile(a, 'together');
  // nobody's invited till さそう
  await expect(b.locator('.banner', { hasText: 'ききみみに さそっています' })).toHaveCount(0);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  await expect(sheet(a).locator('[data-kiki-players]')).toBeVisible();
  // co-op is the default: たいせん off
  await expect(sheet(a).locator('[data-kiki-vs]')).toHaveAttribute('data-kiki-vs', 'coop');
  // B: the invite banner, 「ウェイが ききみみに さそっています」 [さんか]
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  // and the menu's leaf marks it (a dot) while it's live
  await expect(b.locator('[data-hud-invited]')).toBeVisible();
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'lobby');
  // B waits for A; A sees B joined
  await expect(sheet(b).locator('.wait')).toContainText('始めるのを待っています');
  await expect(sheet(b).locator('[data-kiki-start]')).toHaveCount(0);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'here'); // joined: neutral, not an answer's ✓
  // こたえる じかん: the host's なし reaches B (the seed's bits 1-2), then back to 30
  await sheet(a).locator('[data-timer="0"]').click();
  await b.bringToFront();
  await expect(sheet(b).locator('[data-kiki-timer]')).toHaveAttribute('data-kiki-timer', '0');
  await expect(sheet(b).locator('[data-timer="0"]')).toHaveAttribute('aria-checked', 'true');
  if (process.env.KIKI_SHOTS) await snap(b, '/tmp/kikimimi-shots/timers/lobby-guest.png');
  await a.bringToFront();
  await sheet(a).locator('[data-timer="30"]').click();
  if (vs) {
    await sheet(a).locator('[data-kiki-vs-pick="vs"]').click();
    await expect(sheet(a).locator('[data-kiki-vs]')).toHaveAttribute('data-kiki-vs', 'vs');
    // the host's setting reaches B (a new open: the seed's low bit)
    await b.bringToFront();
    await expect(sheet(b).locator('[data-kiki-vs-flag]')).toHaveAttribute('data-kiki-vs-flag', 'true');
    await a.bringToFront();
  }
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）');
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  return [a, b];
}

/** The 8 questions, A and B answering (`miss(who, i)`: that one picks a wrong choice); `each` after each reveal. */
async function rounds(a: Page, b: Page, miss: (who: 'A' | 'B', i: number) => boolean, each: (i: number) => Promise<void>) {
  for (let i = 0; i < 8; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
      await answer(p, miss(who, i));
    }
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    await each(i);
    // the reveal waits: B's よみおわった (its chip's 📖 on A's), A's つぎへ counting it
    await b.bringToFront();
    await expect(sheet(b)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(b).locator('[data-kiki-next]')).toHaveCount(0);
    await sheet(b).locator('[data-kiki-ready]').click();
    await expect(sheet(b).locator('[data-kiki-ready]')).toHaveAttribute('aria-pressed', 'true');
    await a.bringToFront();
    await expect(sheet(a).locator('[data-kiki-next]')).toHaveText('次へ（読み終わった 1/1）');
    await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-ready', 'true');
    if (i === 0 && process.env.KIKI_SHOTS) {
      await snap(a, '/tmp/kikimimi-shots/timers/reveal-host.png');
      await b.bringToFront();
      await snap(b, '/tmp/kikimimi-shots/timers/reveal-guest-ready.png');
      await a.bringToFront();
    }
    await sheet(a).locator('[data-kiki-next]').click();
  }
}

test('two players, co-op (the default): A’s lobby invites B, they play together, the team’s tally on both phones and never who missed', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const [a, b] = await together(ctx);
  // A misses 3, B the odd ones: 3 is nobody's (7/8); both right on 0, 2, 4, 6 (そろって 4)
  const miss = (who: 'A' | 'B', i: number) => (who === 'A' ? i === 3 : i % 2 === 1);
  await rounds(a, b, miss, async (i) => {
    // both in: the reveal on both; B's chip stays neutral (co-op: no one's right or wrong shown, no points), and how many got it
    await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'answered');
    await expect(sheet(a).locator('[data-player="B"] .note')).toHaveCount(0);
    await expect(sheet(a).locator('[data-kiki-team-now]')).toHaveAttribute('data-kiki-team-now', String(2 - Number(miss('A', i)) - Number(miss('B', i))));
  });
  for (const p of [a, b]) {
    await p.bringToFront();
    await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
    await expect(sheet(p).locator('[data-kiki-team] b')).toHaveText('ふたりで 7 / 8');
    await expect(sheet(p).locator('[data-kiki-team-all]')).toHaveText('そろって正解 4問');
    // no ranking, and each phone's own tally only
    await expect(sheet(p).locator('[data-rank]')).toHaveCount(0);
    await expect(sheet(p).locator('[data-kiki-tally]')).toHaveText(p === a ? '自分は 7 / 8' : '自分は 4 / 8');
    if (process.env.KIKI_SHOTS) await snap(p, `/tmp/kikimimi-shots/inc34/coop-results-${p === a ? 'A' : 'B'}.png`);
  }
  await ctx.close();
});

test('two players, たいせん: the host’s toggle reaches B, the reveal shows each one’s mark, the results rank them, the same on each phone', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const [a, b] = await together(ctx, true);
  await rounds(a, b, (who, i) => who === 'B' && i % 2 === 1, async (i) => {
    // たいせん: each other's ✓ turned into a reaction
    await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', i % 2 === 1 ? 'wrong' : 'right');
    await expect(sheet(a).locator('[data-kiki-team-now]')).toHaveCount(0);
  });
  // the results on both, A first (8 × 100 against 4 × 100), the same on each phone
  for (const p of [a, b]) {
    await p.bringToFront();
    await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
    await expect.poll(() => kiki(p, (k) => k.view().players.map((x) => [x.who, x.score]))).toEqual([['A', 800], ['B', 400]]);
    await expect(sheet(p).locator('[data-rank="1"] [data-player="A"]')).toBeVisible();
    await expect(sheet(p).locator('[data-kiki-team]')).toHaveCount(0);
  }
  await ctx.close();
});
