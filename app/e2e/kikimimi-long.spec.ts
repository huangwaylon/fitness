// まるごと 聞く (docs/kikimimi.md "まるごと 聞く"): the mode on あそぶ's じっくり shelf, its page at ほし with the place's ten
// pieces (the piece of the day the first not heard: lg-dinner-news); a solo game: the piece whole (its stage, nothing to
// answer), then its questions (gist, implication, attitude, next step) one tap each, one wrong; a reveal's line that
// answers it; the results: the review, the transcript with each question's line marked, a dictation near my miss typed
// right, my row (gm long). Picking a real recording on the page plays it (its stage 本物の録音); せってい's 音声の出典 lists
// the five real recordings' credits. The logic tier: Playwright's Chromium is muted, the piece's 2-4 minutes on the page's
// clock, stepped through (kikimimi-nav.ts runUntil). Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/long/.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToPhase, runToQuestion, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/long';
const DAY = 'date=2026-11-07T10:00&kikimimi=fast';

type Piece = { id: string; lines: { en: string }[]; questions: { choices: string[]; answer: number; line: number }[]; dict: { line: number; words: string }[]; credit?: unknown };
const LEVELS = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels');
/** Every listened long file's pieces (each place's: the page lists the picked place's). */
const LONGS = Object.entries((JSON.parse(readFileSync(join(LEVELS, 'index.json'), 'utf8')) as { listen: Record<string, [string, number, string]> }).listen)
  .filter(([, [gm, , st]]) => gm === 'long' && st === 'listened').map(([u]) => u);
const PIECES = LONGS.flatMap((u) => (JSON.parse(readFileSync(join(LEVELS, 'parts', `${u}.json`), 'utf8')) as { listen: { items: Piece[] } }).listen.items);
const BY_ID = new Map(PIECES.map((p) => [p.id, p]));

type Kiki = { view(): { phase: string; i: number; gm: string | null }; items(): string[]; recorded(): { gm?: string; r: [string, number, number, number][] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

async function phone(ctx: BrowserContext, q: string): Promise<Page> {
  await ctx.clock.install();
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}`);
  await islandUp(page);
  return page;
}
/** From the hub: あそぶ › じっくり › まるごと 聞く's page. */
async function toLong(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await sheet(p).locator('[data-kiki-group="long"] [data-kiki-mode-tile="long"]').click();
  await expect(sheet(p).locator('[data-kiki-mode-page="long"]')).toBeVisible();
  // (ほし: its ten pieces, the real recordings among them)
  await sheet(p).locator('[data-kiki-places] [data-stage="hoshi"]').click();
}

/** Question i (`<piece>-q<i+1>`), once its choices open: the right one (or `wrong`, another), tapped. */
async function answer(p: Page, piece: Piece, i: number, wrong = false) {
  await runToQuestion(p, i, 'answer');
  await runToSee(p, sheet(p).locator('.choices [data-choice][aria-disabled="false"]'));
  const q = piece.questions[i], want = q.choices[q.answer];
  const chips = sheet(p).locator('.choices [data-choice]');
  const texts = await chips.evaluateAll((bs) => bs.map((b) => b.querySelector('.tx')!.textContent!.trim()));
  const k = wrong ? texts.findIndex((x) => x !== want) : texts.indexOf(want);
  expect(k).toBeGreaterThanOrEqual(0);
  await chips.nth(k).click();
}

test('solo: the piece of the day whole, its questions, a reveal’s line, the transcript, a dictation near my miss, my row', async ({ context }) => {
  const page = await phone(context, DAY);
  await toLong(page);
  // the place's ten pieces, the first not heard today's
  const list = sheet(page).locator('[data-kiki-long-pieces] [data-kiki-long-piece]');
  await expect(list).toHaveCount(10);
  await expect(sheet(page).locator('[data-kiki-long-piece="lg-dinner-news"]')).toHaveAttribute('aria-pressed', 'true');
  await snap(page, 'mode', true);
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('long');
  const ids = await kiki(page, (k) => k.items());
  const piece = BY_ID.get('lg-dinner-news')!;
  expect(ids).toEqual(piece.questions.map((_, k) => `lg-dinner-news-q${k + 1}`));
  // the piece plays: its stage, the situation, nothing to answer
  await runToSee(page, sheet(page).locator('[data-kiki-long-wait]'));
  await expect(sheet(page).locator('[data-kiki-long-kind="drama"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-ctx]')).toBeVisible();
  await expect(sheet(page).locator('.choices [data-choice]')).toHaveCount(0);
  await snap(page, 'listen');
  // each question: the gist right, the second wrong, the rest right; a reveal's answering line
  for (let i = 0; i < ids.length; i++) {
    await answer(page, piece, i, i === 1);
    await runToPhase(page, 'reveal');
    await expect(sheet(page).locator(`[data-kiki-verdict="${i === 1 ? 'wrong' : 'right'}"]`)).toBeVisible();
    await expect(sheet(page).locator(`[data-kiki-long-evidence="${piece.questions[i].line}"]`)).toContainText(piece.lines[piece.questions[i].line].en);
    if (i === 1) await snap(page, 'reveal', true);
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(page).locator('[data-kiki-tally]')).toContainText(`${ids.length - 1} / ${ids.length}`);
  // the transcript: every line, each question marked on its line, the missed one as missed
  const script = sheet(page).locator('[data-kiki-long-script="lg-dinner-news"]');
  await expect(script.locator('[data-line]')).toHaveCount(piece.lines.length);
  await expect(script.locator('[data-kiki-long-q]')).toHaveCount(ids.length);
  await expect(script.locator('[data-kiki-long-q="2"]')).toHaveClass(/miss/);
  // the dictation near my miss: typed right
  const dict = sheet(page).locator('[data-kiki-long-dict="0"]');
  await expect(dict).toBeVisible();
  const line = Number(await dict.locator('[data-kiki-long-dict-line]').getAttribute('data-kiki-long-dict-line'));
  const d = piece.dict.find((x) => x.line === line)!;
  expect(Math.abs(line - piece.questions[1].line)).toBeLessThanOrEqual(Math.min(...piece.dict.map((x) => Math.abs(x.line - piece.questions[1].line))));
  if (await sheet(page).locator('[data-kiki-long-board]').count()) await sheet(page).locator('[data-kiki-long-swap]').click();
  await sheet(page).locator('[data-kiki-long-typed]').fill(d.words.toLowerCase());
  await sheet(page).locator('[data-kiki-long-send]').click();
  await expect(sheet(page).locator('[data-kiki-long-dict-verdict="right"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-long-dict-done]')).toBeVisible();
  await snap(page, 'results', true);
  const row = await kiki(page, (k) => k.recorded());
  expect(row?.gm).toBe('long');
  expect(row!.r.map(([id, ok]) => [id, ok])).toEqual(ids.map((id, i) => [id, i === 1 ? 0 : 1]));
});

test('a real recording picked on the page plays it; せってい lists the real recordings’ credits', async ({ context }) => {
  const page = await phone(context, DAY);
  await toLong(page);
  await sheet(page).locator('[data-kiki-long-piece="rl-band-trip"]').click();
  await expect(sheet(page).locator('[data-kiki-long-piece="rl-band-trip"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-kiki-long-today-back]')).toBeVisible();
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.items()[0])).toBe('rl-band-trip-q1');
  await runToSee(page, sheet(page).locator('[data-kiki-long-wait]'));
  await expect(sheet(page).locator('[data-kiki-long-kind="real"]')).toBeVisible();
  await snap(page, 'real-listen');
  // せってい's 音声の出典: each real piece's credit line and licence
  await page.goto(`?demo&${DAY}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await atHub(page);
  await page.locator('dialog[open] [data-kiki-gear]').click();
  await sheet(page).locator('[data-kiki-set-credits]').click();
  const credits = sheet(page).locator('[data-kiki-credits] [data-kiki-credit]');
  await expect(credits).toHaveCount(PIECES.filter((p) => p.credit).length);
  await expect(sheet(page).locator('[data-kiki-credit="rl-road-trip"]')).toContainText('CC BY-SA 4.0');
  await expect(sheet(page).locator('[data-kiki-credit="rl-desert-island"]')).toContainText('Public domain');
  await snap(page, 'credits', true);
});
