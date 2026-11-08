// すうじ ラッシュ (docs/kikimimi-engine.md "すうじ ラッシュ"): the mode shows once a rush file is `listened` (s1-rush and s2-rush, shipped
// listened since audio batch A3), on あそぶ's さくっと shelf; a solo queue of 8 (the counter, the line, the ticket's chips
// waiting for the order's end, one tap), one ticket wrong (the customer says it again, the combo starts over, the run
// goes on), the results' served count, best combo, review and my row (gm rush, the picks as authored); then two phones
// in co-op over the demo's relay: two registers, the customers alternating, each phone passing the other's; the team
// serves them all. The orders play their voiced length (A3), silent: Playwright's Chromium is muted. Screenshots
// (KIKI_SHOTS=1) into /tmp/kikimimi-shots/rush/, by day and at night.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToQuestion, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/rush';
const DAY = 'date=2026-11-07T10:00&kikimimi=fast';
const NIGHT = 'date=2026-11-07T21:30&kikimimi=fast';

/** The rush files as compiled: each customer's right chip. */
const PARTS = ['s1-rush', 's2-rush'].map((u) => JSON.parse(readFileSync(join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels', 'parts', `${u}.json`), 'utf8')) as {
  listen: { items: { id: string; options: string[]; answer: number }[] };
});
const RIGHT = new Map(PARTS.flatMap((p) => p.listen.items.map((it) => [it.id, it.options[it.answer]] as const)));

type Kiki = { view(): { phase: string; i: number; gm: string | null; roles: Record<string, number> }; items(): string[]; recorded(): { gm?: string; r: [string, number, number, number][] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

/** A phone on the context's clock (installed once, before its first page: both tabs step together; the orders'
 *  voiced lines stepped through: kikimimi-nav.ts runUntil). */
async function phone(ctx: BrowserContext, q: string, as: 'A' | 'B' = 'A'): Promise<Page> {
  if (!ctx.pages().length) await ctx.clock.install();
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** From the hub: あそぶ › すうじ ラッシュ's page, its answer times. */
async function toRush(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await sheet(p).locator('[data-kiki-mode-tile="rush"]').click();
  await expect(sheet(p).locator('[data-kiki-mode-page="rush"]')).toBeVisible();
  // its own 8 s or なし (no 20 / 30 / 60 s)
  await expect(sheet(p).locator('[data-kiki-timer] [data-timer]')).toHaveCount(2);
  await expect(sheet(p).locator('[data-timer="8"]')).toHaveAttribute('aria-checked', 'true');
}

/** Customer i's ticket, once its chips open: the right chip (or `wrong`, another), tapped. */
async function serve(p: Page, i: number, wrong = false) {
  await runToQuestion(p, i);
  const chips = sheet(p).locator('[data-kiki-rush-ticket] [data-choice]');
  await runToSee(p, sheet(p).locator('[data-kiki-rush-ticket] [data-choice][aria-disabled="false"]'));
  const ids = await kiki(p, (k) => k.items());
  const want = RIGHT.get(ids[i])!;
  const texts = await chips.evaluateAll((bs) => bs.map((b) => b.querySelector('.tx')!.textContent!.trim()));
  const k = wrong ? texts.findIndex((x) => x !== want) : texts.indexOf(want);
  expect(k).toBeGreaterThanOrEqual(0);
  await chips.nth(k).click();
  await expect(sheet(p)).toHaveAttribute('data-phase', 'reveal');
}

test('solo: the mode once listened, a queue of 8 with one ticket wrong (the run goes on), the results and my row', async ({ context }) => {
  const page = await phone(context, DAY);
  await toRush(page);
  await snap(page, 'mode');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('rush');
  // the order plays: the counter, the line, the ticket waiting
  await runToSee(page, sheet(page).locator('[data-kiki-rush-at]'));
  await expect(sheet(page).locator('.line .dot')).toHaveCount(8);
  await expect(sheet(page).locator('[data-kiki-ctx]')).toBeVisible();
  await snap(page, 'listen');
  for (let i = 0; i < 8; i++) {
    if (i === 0) {
      await runToSee(page, sheet(page).locator('[data-kiki-rush-ticket] [data-choice][aria-disabled="false"]'));
      await snap(page, 'ticket');
    }
    await serve(page, i, i === 3);
    await expect(sheet(page).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', i === 3 ? 'wrong' : 'right');
    await expect(sheet(page).locator('[data-kiki-why]')).toBeVisible();
    await expect(sheet(page).locator('[data-kiki-en]')).toBeVisible();
    if (i === 2) {
      await expect(sheet(page).locator('[data-kiki-rush-combo]')).toHaveAttribute('data-kiki-rush-combo', '3');
      await snap(page, 'reveal-combo', true);
    }
    if (i === 3) {
      // a miss: the customer says it again, the combo starts over, the line goes on
      await expect(sheet(page).locator('[data-kiki-rush-again]')).toBeVisible();
      await expect(sheet(page).locator('[data-kiki-rush-combo]')).toHaveAttribute('data-kiki-rush-combo', '0');
      await expect(sheet(page).locator('.line .dot[data-state="missed"]')).toHaveCount(1);
      await snap(page, 'reveal-miss', true);
    }
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('7 / 8 問正解');
  await expect(sheet(page).locator('[data-kiki-rush-served]')).toHaveAttribute('data-kiki-rush-served', '7');
  await expect(sheet(page).locator('[data-kiki-rush-best]')).toHaveAttribute('data-kiki-rush-best', '4');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-rush-picked]')).toBeVisible();
  await snap(page, 'results', true);
  const row = await kiki(page, (k) => k.recorded());
  expect(row?.gm).toBe('rush');
  expect(row!.r.map(([, ok]) => ok)).toEqual([1, 1, 1, 0, 1, 1, 1, 1]);
  expect(row!.r.map(([id]) => id)).toEqual(await kiki(page, (k) => k.items()));
  expect(row!.r[3][2]).toBeGreaterThanOrEqual(0);
});

test('night: the counter and the ticket in the night palette', async ({ context }) => {
  test.skip(!process.env.KIKI_SHOTS, 'screenshots only');
  const page = await phone(context, NIGHT);
  await toRush(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-rush-ticket] [data-choice][aria-disabled="false"]'));
  await snap(page, 'night-ticket');
  await serve(page, 0, true);
  await snap(page, 'night-reveal', true);
});

test('co-op on two phones: two registers, the customers alternating, the other phone passing; the team serves the line', async ({ browser }) => {
  test.setTimeout(60_000); // two phones, eight customers (the orders stepped through)
  const ctx = await browser.newContext();
  const a = await phone(ctx, DAY, 'A'), b = await phone(ctx, DAY, 'B');
  await a.bringToFront();
  await toRush(a);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect.poll(() => kiki(b, (k) => k && k.view().gm), { timeout: 15_000 }).toBe('rush');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）', { timeout: 10_000 });
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  expect(await kiki(a, (k) => k.items())).toEqual(await kiki(b, (k) => k.items()));
  expect(await kiki(a, (k) => k.view().roles)).toEqual({ A: 0, B: 1 });

  for (let i = 0; i < 8; i++) {
    const [reg, other] = i % 2 ? [b, a] : [a, b];
    // the other register: its phone passes once the answers open
    await other.bringToFront();
    await runToQuestion(other, i);
    await expect(sheet(other).locator('[data-kiki-rush-register]')).toHaveAttribute('data-kiki-rush-register', 'theirs');
    await expect(sheet(other).locator('[data-kiki-rush-ticket] [data-choice]').first()).toHaveAttribute('aria-disabled', 'true');
    await runToQuestion(other, i, 'answer');
    if (i === 1) await snap(a, 'coop-watch');
    await reg.bringToFront();
    await expect(sheet(reg).locator('[data-kiki-rush-register]')).toHaveAttribute('data-kiki-rush-register', 'mine');
    await serve(reg, i);
    await expect(sheet(reg).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', 'right');
    await other.bringToFront();
    await expect(sheet(other)).toHaveAttribute('data-phase', 'reveal', { timeout: 10_000 });
    await expect(sheet(other).locator('[data-kiki-verdict]')).toHaveAttribute('data-kiki-verdict', 'right');
    if (i === 1) {
      await expect(sheet(a).locator('[data-kiki-rush-partner]')).toBeVisible();
      await snap(a, 'coop-reveal', true);
    }
    await b.bringToFront();
    await sheet(b).locator('[data-kiki-ready]').click();
    await a.bringToFront();
    await sheet(a).locator('[data-kiki-next]').click();
  }
  await expect(sheet(a)).toHaveAttribute('data-phase', 'results', { timeout: 10_000 });
  await expect(sheet(a).locator('[data-kiki-team]')).toHaveAttribute('data-kiki-team', '8');
  await expect(sheet(a).locator('[data-kiki-tally]')).toHaveText('自分は 4 / 4');
  await expect(sheet(a).locator('[data-kiki-rush-best]')).toHaveAttribute('data-kiki-rush-best', '8');
  await snap(a, 'coop-results', true);
  const row = await kiki(a, (k) => k.recorded());
  expect(row!.r.map(([id]) => id)).toEqual((await kiki(a, (k) => k.items())).filter((_, i) => i % 2 === 0));
  await ctx.close();
});
