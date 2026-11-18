// 英語すごろく's みんなで！ (docs/sugoroku.md "みんなで！"): each of the four games on one phone passed round (its pick of two,
// the cover between seats 「スマホをBに渡してね」 [見る], the 3-2-1, the play, the result with each seat's part and the
// team's stars, 次へ to the next turn), and two of them on two phones (two tabs on the demo's local relay: every seat
// at once, each phone its own hand; one phone gone mid-game and back: the same result). Hermetic: the seeds pinned
// (`?sgSeed=`, `?sgId=`), the game forced on the first landing (`?sgMini=`) and its clocks short (`?sgMiniMs=`), the
// words found from the rack shown and the lists (no guess). Taps, so it runs in WebKit too. SG_SHOTS=<dir> also saves
// each passed-round game's pick, play and result (SG_SHOTS_AT=375x667 another size, SG_SHOTS_NIGHT=1 at 22:00).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import seeds from '../src/lib/sugoroku/seeds.json' with { type: 'json' };
import linesJson from '../src/lib/sugoroku/sentences.json' with { type: 'json' };

const [VW, VH] = (process.env.SG_SHOTS_AT ?? '393x852').split('x').map(Number);
test.use({ viewport: { width: VW, height: VH }, hasTouch: true });

const WORDS = readFileSync(join(import.meta.dirname, '../src/lib/sugoroku/words.txt'), 'utf8').split('\n').filter(Boolean);
const LINES = linesJson as unknown as [string, string, number][];
const sheet = (p: Page) => p.locator('[data-sugoroku]');
const stage = (p: Page) => sheet(p).locator('[data-sg-mini-stage]');
const SHOTS = process.env.SG_SHOTS ?? '', NIGHT = process.env.SG_SHOTS_NIGHT ? '&date=2026-11-18T22:00' : '';
async function shot(p: Page, name: string) {
  if (!SHOTS) return;
  await p.screenshot({ path: join(SHOTS, `${test.info().project.name}-${name}-${p.viewportSize()!.width}x${p.viewportSize()!.height}${NIGHT ? '-night' : '-day'}.png`) });
}

/** A word from the lists the rack spells (6–7 letters first: the rack's own), none of `not`. */
function wordOf(rack: string, not: readonly string[]): string {
  const can = (w: string) => { const left = [...rack]; return [...w].every((l) => { const k = left.indexOf(l); return k >= 0 && !!left.splice(k, 1); }); };
  const all = [...(seeds as { w: string[] }).w.filter((w) => w.length >= 6), ...WORDS.filter((w) => w.length >= 4)];
  return all.find((w) => !not.includes(w) && can(w))!;
}
async function marketWord(p: Page, not: readonly string[] = []): Promise<string> {
  const s = sheet(p), w = wordOf((await s.locator('[data-sg-mk-rack]').getAttribute('data-sg-mk-rack'))!, not);
  for (const l of w) await s.locator(`[data-sg-mk-tile="${l}"]:not([disabled])`).first().tap();
  await s.locator('[data-sg-mk-play]').tap();
  await expect(s.locator(`[data-sg-mk-found="${w}"]`)).toHaveCount(1);
  return w;
}
/** The speller's word, its letters (or its spelling) tapped. */
async function spellIt(p: Page) {
  const s = sheet(p), w = (await s.locator('[data-sg-spell-item]').getAttribute('data-sg-spell-item'))!;
  if (await s.locator('[data-sg-choice]').count()) return void (await s.locator(`[data-sg-choice="${w}"]`).tap());
  const spelt = s.locator('[data-sg-spelt]');
  for (let k = (await spelt.getAttribute('data-sg-spelt'))!.length; k < w.length; k++) await s.locator(`[data-sg-letter="${w[k]}"]:not([disabled])`).first().tap();
  return w;
}
/** みんなで一文's line in order, its cards tapped (this phone's; `all` passed round, every seat's). */
async function placeLine(p: Page) {
  const s = sheet(p), ja = (await s.locator('.ja').first().textContent())!.trim();
  const cards = (await s.locator('[data-sg-to-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-sg-to-card')!))).sort().join(' ');
  const en = LINES.find(([e, j]) => j === ja && [...e.split(' ')].sort().join(' ') === cards)![0];
  for (const w of en.split(' ')) await s.locator(`[data-sg-to-card="${w}"]:not([disabled])`).first().tap();
}

/** The island, English Study's すごろく tab, a new game passed round for the two (or online) with `q`'s hooks. */
async function newGame(p: Page, q: string, mode: 'local' | 'online' = 'local') {
  await p.goto(`?demo&${q}${NIGHT}`);
  await islandUp(p);
  await fromMenu(p, 'english', 'tap');
  await p.locator('dialog[open] [data-en-tab="game"]').tap();
  await sheet(p).locator('[data-sg-new]').tap();
  if (mode === 'online') await sheet(p).locator('[data-sg-mode="online"]').tap();
  await sheet(p).locator('[data-sg-start]').tap();
  await expect(sheet(p)).toHaveAttribute('data-level', 'play');
}
/** The first roll: the forced みんなで！, its two options; `id` picked. */
async function landAndPick(p: Page, id: string, roll = true) {
  const s = sheet(p);
  if (roll) await s.locator('[data-sg-spin]').tap();
  await expect(s.locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'mini', { timeout: 15_000 });
  await expect(s.locator('[data-sg-mini-opt]')).toHaveCount(2);
  await expect(s.locator('[data-sg-mini-opt]').first()).toHaveAttribute('data-sg-mini-opt', id);
  await shot(p, `${id}-1-pick`);
  await s.locator(`[data-sg-mini-opt="${id}"]`).tap();
}
/** Passed round: the cover for `name`'s seat, then 見る. */
async function look(p: Page, who: 'A' | 'B') {
  await expect(sheet(p).locator('[data-sg-mini-cover]')).toHaveAttribute('data-sg-mini-cover', who);
  await expect(sheet(p).locator('[data-sg-mini-cover]')).toContainText('渡してね');
  await sheet(p).locator('[data-sg-mini-look]').tap();
}
const playing = (p: Page) => expect(stage(p)).toHaveAttribute('data-sg-mini-stage', 'play', { timeout: 8_000 });
/** The result: its game, the team's stars (and each seat's), 次へ to B's turn. */
async function result(p: Page, id: string, next = true): Promise<string> {
  const r = sheet(p).locator('[data-sg-mini-result]');
  await expect(r).toHaveAttribute('data-sg-mini-result', id, { timeout: 15_000 });
  await expect(r.locator('[data-sg-mini-seat]')).toHaveCount(2);
  await expect(r).not.toContainText('位');
  await shot(p, `${id}-3-result`);
  const team = (await r.getAttribute('data-sg-mini-team'))!;
  if (next) {
    await r.locator('[data-sg-mini-next]').tap();
    await expect(sheet(p).locator('[data-sg-mini-result]')).toHaveCount(0);
  }
  return team;
}

test.describe('みんなで！ passed round', () => {
  test('ことばの市場: A’s 20 s, the cover, B’s; a word found already 「もう出てるよ」; the result, 次へ', async ({ page }) => {
    await newGame(page, 'sgSeed=e2e-mk&sgMini=market&sgMiniMs=2500');
    await landAndPick(page, 'market');
    await look(page, 'A');
    await expect(sheet(page).locator('[data-sg-mini-count]')).toBeVisible();
    await playing(page);
    const w = await marketWord(page);
    await shot(page, 'market-2-play');
    await look(page, 'B');
    await playing(page);
    // A's word again: not taken, said softly
    for (const l of w) await sheet(page).locator(`[data-sg-mk-tile="${l}"]:not([disabled])`).first().tap();
    await sheet(page).locator('[data-sg-mk-play]').tap();
    await expect(sheet(page).locator('[data-sg-nudge]')).toHaveText('もう出てるよ');
    expect(Number(await result(page, 'market', false))).toBeGreaterThan(0);
    // (B found none: お休み, never a 0)
    await expect(sheet(page).locator('[data-sg-mini-seat="B"]')).toContainText('お休み');
    await sheet(page).locator('[data-sg-mini-next]').tap();
    await expect(sheet(page).locator('[data-sg-phase]')).toHaveAttribute('data-sg-phase', 'spin');
  });

  test('伝えて当てて: the speller spells behind the cover, the finder picks; three rounds, the roles turning', async ({ page }) => {
    await newGame(page, 'sgSeed=e2e-sp&sgMini=spell&sgMiniMs=12000');
    await landAndPick(page, 'spell');
    for (const [r, [giver, picker]] of ([['A', 'B'], ['B', 'A'], ['A', 'B']] as const).entries()) {
      // (the finder going on as the next speller: no cover between)
      if (r === 0) await look(page, giver);
      await expect(sheet(page).locator('[data-sg-spell-role]')).toHaveAttribute('data-sg-spell-role', 'giver');
      const w = await spellIt(page);
      if (r === 0) await shot(page, 'spell-2-play');
      await look(page, picker);
      await expect(sheet(page).locator('[data-sg-spell-word]')).toHaveAttribute('data-sg-spell-word', w!);
      await sheet(page).locator(`[data-sg-cell="${w}"]`).tap();
    }
    expect(Number(await result(page, 'spell'))).toBe(12);
  });

  test('みんなで一文: one phone, every hand in its seat’s colour; two lines put together, the Japanese with them', async ({ page }) => {
    await newGame(page, 'sgSeed=e2e-to&sgMini=together&sgMiniMs=20000');
    await landAndPick(page, 'together');
    await playing(page);
    await expect(sheet(page).locator('[data-sg-to-hand]')).toHaveCount(2);
    await shot(page, 'together-2-play');
    await placeLine(page);
    await expect(sheet(page).locator('[data-sg-to-line]')).toHaveText('2/2文目');
    await placeLine(page);
    expect(Number(await result(page, 'together'))).toBeGreaterThan(0);
  });

  test('なかま分け: each seat sorts its own stream on its turn; a miss shows the right bin; the counts in, the result', async ({ page }) => {
    await newGame(page, 'sgSeed=e2e-so&sgMini=sort&sgMiniMs=3000');
    await landAndPick(page, 'sort');
    for (const who of ['A', 'B'] as const) {
      await look(page, who);
      await playing(page);
      for (let k = 0; k < 4; k++) await sheet(page).locator('[data-sg-bin]').nth(k % 2).tap();
      if (who === 'A') await shot(page, 'sort-2-play');
    }
    await result(page, 'sort');
  });
});

/** A's and B's phones (two tabs), the game online for the two: A starts it, B joins from the invitation. */
async function table(ctx: BrowserContext, id: string, q: string) {
  const a = await ctx.newPage(), b = await ctx.newPage();
  await newGame(a, `sgId=${id}&${q}`, 'online');
  await b.goto(`?demo&as=B&${q}`);
  await islandUp(b);
  await b.getByRole('button', { name: '参加' }).tap();
  await expect(sheet(b)).toHaveAttribute('data-level', 'play');
  // (B's here on A's phone before the pick: only seats present are dealt in)
  await a.locator('[data-sg-spin]').tap();
  await expect(sheet(a).locator('[data-sg-mini-here]')).toHaveAttribute('data-sg-mini-here', 'AB', { timeout: 15_000 });
  await landAndPick(a, q.match(/sgMini=(\w+)/)![1], false);
  return { a, b };
}

test.describe('みんなで！ online', () => {
  test('ことばの市場 on two phones at once: each one’s words on both; B gone mid-game and back: the same result', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const { a, b } = await table(ctx, 'e2emarket1', 'sgMini=market&sgMiniMs=6000');
    await playing(a);
    await playing(b);
    const wa = await marketWord(a);
    const wb = await marketWord(b, [wa]);
    for (const p of [a, b]) for (const w of [wa, wb]) await expect(sheet(p).locator(`[data-sg-mk-found="${w}"]`)).toHaveCount(1);
    // B's tab closed and opened again: the game as it is, its finds kept
    await b.close();
    const b2 = await ctx.newPage();
    await b2.goto('sugoroku?m=online&demo&as=B&sgMini=market&sgMiniMs=6000');
    const [ta, tb] = [await result(a, 'market', false), await result(b2, 'market', false)];
    expect(ta).toBe(tb);
    await expect(sheet(a).locator('[data-sg-mini-seat="B"]')).not.toContainText('お休み');
    await ctx.close();
  });

  test('伝えて当てて on two phones: the speller’s letters grow on the finder’s, the finder picks, the roles turn', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true });
    const { a, b } = await table(ctx, 'e2espell01', 'sgMini=spell&sgMiniMs=15000');
    for (const [giver, picker] of [[a, b], [b, a], [a, b]] as const) {
      await expect(sheet(giver).locator('[data-sg-spell-role]')).toHaveAttribute('data-sg-spell-role', 'giver', { timeout: 8_000 });
      await expect(sheet(picker).locator('[data-sg-spell-role]')).toHaveAttribute('data-sg-spell-role', 'picker');
      // (ふつう: the first letter given, on the finder's phone as it grows)
      const first = (await sheet(giver).locator('[data-sg-spell-item]').getAttribute('data-sg-spell-item'))![0];
      await expect(sheet(picker).locator('[data-sg-spell-word]')).toHaveText(new RegExp(`^${first} _`));
      const w = await spellIt(giver);
      await expect(sheet(picker).locator('[data-sg-spell-word]')).toHaveAttribute('data-sg-spell-word', w!);
      await sheet(picker).locator(`[data-sg-cell="${w}"]`).tap();
    }
    const [ta, tb] = [await result(a, 'spell', false), await result(b, 'spell', false)];
    expect([ta, tb]).toEqual(['12', '12']);
    await ctx.close();
  });
});
