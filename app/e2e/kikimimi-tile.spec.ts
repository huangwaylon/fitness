// ことば タイル (docs/kikimimi-engine.md "ことば タイル"): the mode shows once a tile file is `listened` (かわ's s1-tile-a and s1-tile-b,
// shipped listened), on あそぶ's さくっと shelf and its page at かわ; a solo game (the clip first with no tiles, then tap the
// tiles into their slots, tap a placed one back, できた), one sentence wrong, the reveal's spoken shape, Japanese and 解説,
// the results' review and my row (gm tile, the wrong slots as the pick); then two phones in co-op over the demo's
// relay: each fills its own half of one sentence, the reveal shows the team's, the results count the sentences built
// whole. Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/tile/, by day and at night. The logic tier (Playwright's
// Chromium is muted).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Locator, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToPhase, runToQuestion, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/tile';
const DAY = 'date=2026-11-07T10:00&kikimimi=fast';
const NIGHT = 'date=2026-11-07T21:30&kikimimi=fast';

const LEVELS = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels');
/** かわ's (stage 2) listened tile files, as this build ships them (s1-tile-a, -b and, since A2, -c). */
const FILES = Object.entries((JSON.parse(readFileSync(join(LEVELS, 'index.json'), 'utf8')) as { listen: Record<string, [string, number, string]> }).listen)
  .filter(([, [gm, stage, status]]) => gm === 'tile' && stage === 2 && status === 'listened').map(([u]) => u);
/** Those files as compiled: each sentence's words by the clip it plays. */
const WORDS = new Map(FILES.flatMap((u) => (JSON.parse(readFileSync(join(LEVELS, 'parts', `${u}.json`), 'utf8')) as {
  listen: { items: { id: string; clip: string; tiles: string[]; decoys: string[] }[] };
}).listen.items.map((it) => [it.clip, it] as const)));

type Kiki = { view(): { phase: string; i: number; n: number; gm: string | null; roles: Record<string, number> }; items(): string[]; recorded(): { gm?: string; r: [string, number, number, number][] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

/** A phone on the context's clock (installed once, before its first page: both tabs step together; the clips
 *  stepped through: kikimimi-nav.ts runUntil). */
async function phone(ctx: BrowserContext, q: string, as: 'A' | 'B' = 'A'): Promise<Page> {
  if (!ctx.pages().length) await ctx.clock.install();
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** From the hub: あそぶ › ことば タイル's page. */
async function toTile(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await sheet(p).locator('[data-kiki-mode-tile="tile"]').click();
  await expect(sheet(p).locator('[data-kiki-mode-page="tile"]')).toBeVisible();
  // (かわ: the place these files are at; はまべ, the demo's おまかせ, has its own since 2026-11-13)
  await sheet(p).locator('[data-kiki-places] [data-stage="kawa"]').click();
}

/** The current sentence's words (by the clip it plays). */
async function sentence(p: Page): Promise<string[]> {
  const [i, ids] = await Promise.all([kiki(p, (k) => k.view().i), kiki(p, (k) => k.items())]);
  return WORDS.get(ids[i])!.tiles;
}
/** My slots filled from the board in order (each word's first tile not yet placed); `wrong`: my last slot a decoy. */
async function build(p: Page, wrong = false) {
  await runToSee(p, sheet(p).locator('[data-kiki-tile-pool]'));
  const words = await sentence(p);
  const mine = await sheet(p).locator('button[data-slot]').evaluateAll((bs) => bs.map((b) => [Number(b.getAttribute('data-slot')), b.hasAttribute('data-filled')] as const));
  const open = mine.filter(([, f]) => !f).map(([j]) => j);
  for (const [n, j] of open.entries()) {
    const decoy = wrong && n === open.length - 1;
    const tile = decoy
      ? sheet(p).locator('[data-tile]:not([data-used])').filter({ hasNotText: new RegExp(`^(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`) }).first()
      : sheet(p).locator(`[data-tile][data-word="${words[j].replace(/"/g, '\\"')}"]:not([data-used])`).first();
    await tile.click();
  }
  await expect(sheet(p).locator('button[data-slot]:not([data-filled])')).toHaveCount(0);
}

test('solo: the mode once listened, the clip before the tiles, tap to place and take back, できた; the reveal and the results; my row', async ({ context }) => {
  const page = await phone(context, DAY);
  await toTile(page);
  await snap(page, 'mode');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('tile');
  // the clip first, with no tiles
  await runToSee(page, sheet(page).locator('[data-kiki-tile-wait]'));
  await expect(sheet(page).locator('[data-kiki-tile-pool]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-ctx]')).toBeVisible();
  await snap(page, 'listen');
  // round 1: a tile placed, taken back, then the sentence built; できた
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  await expect(sheet(page).locator('[data-kiki-tile-done]')).toHaveAttribute('aria-disabled', 'true');
  const empty = sheet(page).locator('button[data-slot]:not([data-filled])').first();
  const j = Number(await empty.getAttribute('data-slot'));
  await sheet(page).locator('[data-tile]:not([data-used])').first().click();
  await expect(sheet(page).locator(`button[data-slot="${j}"]`)).toHaveAttribute('data-filled', 'true');
  await snap(page, 'build');
  await sheet(page).locator(`button[data-slot="${j}"]`).click();
  await expect(sheet(page).locator(`button[data-slot="${j}"]`)).not.toHaveAttribute('data-filled');
  await build(page);
  await expect(sheet(page).locator('[data-kiki-tile-done]')).toHaveAttribute('aria-disabled', 'false');
  await snap(page, 'built');
  await sheet(page).locator('[data-kiki-tile-done]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-en]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-why]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-tile-sentence] [data-mark="wrong"]')).toHaveCount(0);
  await snap(page, 'reveal-right');
  await sheet(page).locator('[data-kiki-next]').click();
  // the rest: round 2 with a decoy in my last slot
  for (let i = 1; i < 6; i++) {
    await runToQuestion(page, i);
    await build(page, i === 1);
    await sheet(page).locator('[data-kiki-tile-done]').click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator(`[data-kiki-verdict="${i === 1 ? 'wrong' : 'right'}"]`)).toBeVisible();
    if (i === 1) {
      await expect(sheet(page).locator('[data-kiki-tile-sentence] [data-mark="wrong"]')).toHaveCount(1);
      await snap(page, 'reveal-wrong');
    }
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('5 / 6 問正解');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-tile-heard]')).toBeVisible();
  await snap(page, 'results', true);
  // my row: the game, each sentence by its tile, the decoy's slot in the pick
  const row = await kiki(page, (k) => k.recorded());
  expect(row?.gm).toBe('tile');
  expect(row!.r).toHaveLength(6);
  expect(row!.r.map(([, ok]) => ok)).toEqual([1, 0, 1, 1, 1, 1]);
  const ids = await kiki(page, (k) => k.items());
  expect(row!.r.map(([id]) => id)).toEqual(ids.map((c) => WORDS.get(c)!.id));
  const missed = row!.r[1];
  expect(missed[2]).toBe(1 << (WORDS.get(ids[1])!.tiles.length - 1));
});

test('one action in the foot: できた there, then 次へ in its place, sunk for 1.2 s after the reveal (a second tap never skips it)', async ({ context }) => {
  const page = await phone(context, `${DAY}&arm`);
  await toTile(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await build(page);
  const done = sheet(page).locator('.level-acts [data-kiki-tile-done]');
  await expect(done).toHaveAttribute('aria-disabled', 'false');
  // (the clock held, so the 1.2 s pass only when stepped)
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 200));
  await done.click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  const next = sheet(page).locator('.level-acts [data-kiki-next]');
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await next.click({ force: true }); // (the double tap: swallowed)
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await page.clock.runFor(1300);
  await expect(next).toHaveAttribute('aria-disabled', 'false');
  await next.click();
  await expect(sheet(page)).not.toHaveAttribute('data-phase', 'reveal');
  expect(await kiki(page, (k) => k.view().i)).toBe(1);
});

/** A drag with the finger (the mouse: pointer events) from one element's middle to another's, in steps. */
async function dragTo(p: Page, from: Locator, to: Locator) {
  await from.hover(); // (stable: the round laid out)
  const [a, b] = [await from.boundingBox(), await to.boundingBox()];
  await p.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await p.mouse.down();
  await p.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, { steps: 8 });
  await p.mouse.up();
}

test('drag alongside tap: onto a slot (not the next one), onto a filled one (inserted), a move, a reorder, back to the pool; the next slot outlined', async ({ context }) => {
  const page = await phone(context, DAY);
  await toTile(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  const words = await sentence(page);
  const tile = (w: string) => sheet(page).locator(`[data-tile][data-word="${w.replace(/"/g, '\\"')}"]`).first();
  // my slots (easy's given word, if any, is fixed: not a button, never moved)
  const m = await sheet(page).locator('button[data-slot]').evaluateAll((bs) => bs.map((b) => Number(b.getAttribute('data-slot'))));
  const slot = (k: number) => sheet(page).locator(`button[data-slot="${m[k]}"]`);
  const word = (k: number) => words[m[k]];
  await expect(sheet(page).locator('button[data-given]')).toHaveCount(0);
  await expect(slot(0)).toHaveAttribute('data-next', 'true');
  // my 2nd word onto my 2nd slot: there, my 1st still the next
  await dragTo(page, tile(word(1)), slot(1));
  await expect(slot(1)).toHaveText(word(1));
  await expect(slot(0)).not.toHaveAttribute('data-filled');
  await expect(slot(0)).toHaveAttribute('data-next', 'true');
  await expect(sheet(page).locator('[data-kiki-tile-lift]')).toHaveCount(0);
  // my 1st onto my 2nd slot (filled): inserted (the 2nd shifting on, or back to the pool when no slot after is empty)
  await dragTo(page, tile(word(0)), slot(1));
  await expect(slot(1)).toHaveText(word(0));
  if (m.length > 2) await expect(slot(2)).toHaveText(word(1));
  else await expect(tile(word(1))).not.toHaveAttribute('data-used');
  // a move onto an empty slot, then a reorder onto a filled one (the two swap places) and back
  await dragTo(page, slot(1), slot(0));
  await expect(slot(0)).toHaveText(word(0));
  await expect(slot(1)).not.toHaveAttribute('data-filled');
  if (m.length > 2) await dragTo(page, slot(2), slot(1));
  else await tile(word(1)).click();
  await expect(slot(1)).toHaveText(word(1));
  await dragTo(page, slot(0), slot(1));
  await expect(slot(0)).toHaveText(word(1));
  await expect(slot(1)).toHaveText(word(0));
  await dragTo(page, slot(1), slot(0));
  await expect(slot(0)).toHaveText(word(0));
  // my 2nd back to the pool: its tile there again
  await dragTo(page, slot(1), sheet(page).locator('[data-kiki-tile-pool]'));
  await expect(slot(1)).not.toHaveAttribute('data-filled');
  await expect(tile(word(1))).not.toHaveAttribute('data-used');
  // the rest by tap; できた: right
  await build(page);
  await sheet(page).locator('[data-kiki-tile-done]').click();
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
});

test('前の問題: from round 2 a chip opens the round before’s review on this phone; the game goes on under it; its ▶︎ waits for the clip', async ({ context }) => {
  const page = await phone(context, DAY);
  await toTile(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  await expect(sheet(page).locator('[data-kiki-prev]')).toHaveCount(0);
  await build(page, true);
  await sheet(page).locator('[data-kiki-tile-done]').click();
  await sheet(page).locator('[data-kiki-next]').click();
  // round 2, its clip playing: the card has round 1's row opened (wrong, what I put), ▶︎ off while the clip plays
  await runToQuestion(page, 1, 'play');
  await sheet(page).locator('[data-kiki-prev]').click();
  const card = page.locator('[data-kiki-prev-card="0"]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-review="0"]')).toHaveAttribute('data-ok', 'false');
  await expect(card.locator('[data-kiki-review-en]')).toBeVisible();
  await expect(card.locator('[data-kiki-tile-heard]')).toBeVisible();
  await expect(card.locator('[data-kiki-hear="0"]')).toHaveAttribute('aria-disabled', 'true');
  // the game goes on: the answer window, the timer on the card, ▶︎ on (a review's play, not round 2's replay)
  await runToQuestion(page, 1, 'answer');
  await expect(card.locator('.timer')).toHaveCount(await sheet(page).locator('.q > .timer').count());
  await expect(card.locator('[data-kiki-hear="0"]')).toHaveAttribute('aria-disabled', 'false');
  await card.locator('[data-kiki-hear="0"]').click();
  expect(await page.evaluate(() => (window as unknown as { __kiki: { view(): { answers: unknown[] } } }).__kiki.view().answers[1] ?? null)).toBeNull();
  await page.locator('dialog[open]:has([data-kiki-prev-card]) .navbar .close').last().click();
  await expect(card).toHaveCount(0);
  await build(page);
  await sheet(page).locator('[data-kiki-tile-done]').click();
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
});

test('全部戻す offers 取り消す; time up sends what’s placed: the reveal shows my words and what was missing', async ({ context }) => {
  const page = await phone(context, DAY);
  await toTile(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToQuestion(page, 0, 'answer');
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  const words = await sentence(page);
  const j = Number(await sheet(page).locator('button[data-slot]').first().getAttribute('data-slot'));
  await sheet(page).locator(`[data-tile][data-word="${words[j].replace(/"/g, '\\"')}"]`).first().click();
  await expect(sheet(page).locator(`button[data-slot="${j}"]`)).toHaveText(words[j]);
  // 全部戻す, then 取り消す puts it back
  const clear = sheet(page).locator('[data-kiki-tile-clear]');
  await clear.click();
  await expect(sheet(page).locator(`button[data-slot="${j}"]`)).not.toHaveAttribute('data-filled');
  await expect(clear).toHaveAttribute('data-undo', 'true');
  await expect(clear).toHaveText('取り消す');
  await clear.click();
  await expect(sheet(page).locator(`button[data-slot="${j}"]`)).toHaveText(words[j]);
  await expect(clear).toHaveText('全部戻す');
  // the window runs out: sent as it is, wrong, my word kept and the rest shown missing
  await runToPhase(page, 'reveal');
  await expect(sheet(page).locator('[data-kiki-verdict="wrong"]')).toBeVisible();
  await expect(sheet(page).locator(`[data-kiki-tile-sentence] [data-slot="${j}"]`)).toHaveAttribute('data-mark', 'right');
  await expect(sheet(page).locator('[data-kiki-tile-sentence] .put').first()).toHaveText('—');
});

test('night: the board in the night palette', async ({ context }) => {
  test.skip(!process.env.KIKI_SHOTS, 'screenshots only');
  const page = await phone(context, NIGHT);
  await toTile(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-tile-pool]'));
  await build(page, true);
  await snap(page, 'night-built');
  await sheet(page).locator('[data-kiki-tile-done]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await snap(page, 'night-reveal');
});

test('co-op on two phones: each fills its own half of one sentence; the reveal shows the team’s; the results count the sentences built whole', async ({ browser }) => {
  test.setTimeout(60_000); // two phones (the clips stepped through)
  const ctx = await browser.newContext();
  const a = await phone(ctx, DAY, 'A'), b = await phone(ctx, DAY, 'B');
  await a.bringToFront();
  await toTile(a);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect.poll(() => kiki(b, (k) => k && k.view().gm), { timeout: 15_000 }).toBe('tile');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）', { timeout: 10_000 });
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  expect(await kiki(a, (k) => k.items())).toEqual(await kiki(b, (k) => k.items()));

  // B's half wrong in round 3: the team builds 5 of 6
  for (let i = 0; i < 6; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await runToQuestion(p, i);
      if (i === 0) {
        const roles = await kiki(p, (k) => k.view().roles);
        expect(roles).toEqual({ A: 0, B: 1 });
        await runToSee(p, sheet(p).locator('[data-kiki-tile-pool]'));
        const theirs = sheet(p).locator('[data-kiki-tile-sentence] .theirs');
        await expect(theirs.first()).toBeVisible();
        if (who === 'B') await snap(p, 'coop-build');
      }
      await build(p, who === 'B' && i === 2);
      await sheet(p).locator('[data-kiki-tile-done]').click();
    }
    await a.bringToFront();
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(a).locator('[data-kiki-tile-team]')).toHaveAttribute('data-kiki-tile-team', i === 2 ? '1' : '0');
    await expect(sheet(a).locator('[data-kiki-tile-sentence] [data-mark="wrong"]')).toHaveCount(i === 2 ? 1 : 0);
    if (i === 2) await snap(a, 'coop-reveal');
    await b.bringToFront();
    await sheet(b).locator('[data-kiki-ready]').click();
    await a.bringToFront();
    await sheet(a).locator('[data-kiki-next]').click();
  }
  await expect(sheet(a)).toHaveAttribute('data-phase', 'results');
  await expect(sheet(a).locator('[data-kiki-team]')).toHaveAttribute('data-kiki-team', '5');
  await expect(sheet(a).locator('[data-kiki-tally]')).toHaveText('自分は 6 / 6');
  await snap(a, 'coop-results', true);
  await b.bringToFront();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(b).locator('[data-kiki-team]')).toHaveAttribute('data-kiki-team', '5');
  await expect(sheet(b).locator('[data-kiki-tally]')).toHaveText('自分は 5 / 6');
  await ctx.close();
});
