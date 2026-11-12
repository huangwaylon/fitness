// ようじ でんわ (docs/kikimimi-engine.md "ようじ でんわ"): the mode shows once a call file is `listened` (s1-call, shipped listened),
// on あそぶ's まちで・でんわで shelf and its page at かわ; a solo game (the call on the phone with the memo under it, a chip picked
// while it plays and changed, メモできた once it ends; round 2 the rest of the memo from memory), one round wrong, the
// reveal's right chips, the basket, 解説 and the transcript, the results' errands, review and my row (gm call, the wrong
// rows as the pick); then two phones in co-op over the demo's relay: each fills its own rows of one memo, the reveal
// shows the team's, the results count the rounds done whole. The calls play their voiced length (A1), silent:
// Playwright's Chromium is muted; on the page's clock, stepped through (kikimimi-nav.ts runUntil). Screenshots (KIKI_SHOTS=1) into /tmp/kikimimi-shots/call/, by day and at night.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { atHub, kikiSheet as sheet, runToQuestion, runToSee } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = '/tmp/kikimimi-shots/call';
const DAY = 'date=2026-11-07T10:00&kikimimi=fast';
const NIGHT = 'date=2026-11-07T21:30&kikimimi=fast';

const LEVELS = join(import.meta.dirname, '..', 'src', 'lib', 'kikimimi', 'levels');
/** かわ's (stage 2) listened call files, as this build ships them (s1-call and, since A2, s1-call-b). */
const FILES = Object.entries((JSON.parse(readFileSync(join(LEVELS, 'index.json'), 'utf8')) as { listen: Record<string, [string, number, string]> }).listen)
  .filter(([, [gm, stage, status]]) => gm === 'call' && stage === 2 && status === 'listened').map(([u]) => u);
type Part = { listen: { items: { id: string; memo: { slots: { options: string[]; answer: number }[] }[] }[] } };
/** Those files as compiled: each memo row's right chip, by call and row. */
const RIGHT = new Map(FILES.flatMap((u) => (JSON.parse(readFileSync(join(LEVELS, 'parts', `${u}.json`), 'utf8')) as Part).listen.items)
  .map((it) => [it.id, it.memo.flatMap((m) => m.slots).map((s) => s.options[s.answer])]));

type Kiki = { view(): { phase: string; i: number; gm: string | null; roles: Record<string, number> }; items(): string[]; recorded(): { gm?: string; r: [string, number, number, number][] } | null };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;

async function snap(p: Page, name: string, fullPage = false) {
  if (!process.env.KIKI_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
}

/** A phone on the context's clock (installed once, before its first page: both tabs step together). */
async function phone(ctx: BrowserContext, q: string, as: 'A' | 'B' = 'A'): Promise<Page> {
  if (!ctx.pages().length) await ctx.clock.install();
  const page = await ctx.newPage();
  await page.goto(`?demo&${q}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  return page;
}
/** From the hub: あそぶ › ようじ でんわ's page. */
async function toCall(p: Page) {
  await fromMenu(p, 'kikimimi');
  await atHub(p);
  await sheet(p).locator('[data-kiki-tile="asobu"]').click();
  await sheet(p).locator('[data-kiki-mode-tile="call"]').click();
  await expect(sheet(p).locator('[data-kiki-mode-page="call"]')).toBeVisible();
  // (かわ: the place these files are at; はまべ, the demo's おまかせ, has its own since 2026-11-13)
  await sheet(p).locator('[data-kiki-places] [data-stage="kawa"]').click();
}

/** The current round's call (its id: round 2's is the call's with `-memo`). */
async function callNow(p: Page): Promise<string> {
  const [i, ids] = await Promise.all([kiki(p, (k) => k.view().i), kiki(p, (k) => k.items())]);
  return ids[i].replace(/-memo$/, '');
}
/** My rows filled with their right chips (`wrong`: my last row another chip). */
async function fill(p: Page, wrong = false) {
  await runToSee(p, sheet(p).locator('[data-kiki-memo] [data-own]'));
  const right = RIGHT.get(await callNow(p))!;
  const rows = sheet(p).locator('[data-kiki-memo] [data-own]');
  const n = await rows.count();
  for (let j = 0; j < n; j++) {
    const row = rows.nth(j), want = right[Number(await row.getAttribute('data-n'))];
    const texts = await row.locator('[data-chip]').evaluateAll((bs) => bs.map((b) => b.textContent!.trim()));
    const k = wrong && j === n - 1 ? texts.findIndex((x) => x !== want) : texts.indexOf(want);
    const chip = row.locator(`[data-chip="${k}"]`);
    if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  }
}
async function send(p: Page) {
  // (it waits for the call's end)
  await runToSee(p, sheet(p).locator('[data-kiki-call-done][aria-disabled="false"]'));
  await sheet(p).locator('[data-kiki-call-done]').click();
}

test('solo: the mode once listened, the call with its memo, a chip changed, メモできた; round 2 from memory (no 前の問題 then); the reveal and the results; my row', async ({ context }) => {
  const page = await phone(context, DAY);
  await toCall(page);
  await snap(page, 'mode');
  await sheet(page).locator('[data-kiki-start]').click();
  await expect.poll(() => kiki(page, (k) => k.view().gm)).toBe('call');
  // round 1: the call on the phone, the situation, the memo under it; a chip picked while it plays, then changed
  await runToSee(page, sheet(page).locator('[data-kiki-frame="phone"]'));
  await expect(sheet(page).locator('[data-kiki-ctx]')).toBeVisible();
  await runToSee(page, sheet(page).locator('[data-kiki-call-after]'));
  const first = sheet(page).locator('[data-kiki-memo] [data-own]').first();
  await first.locator('[data-chip="0"]').click();
  await expect(first.locator('[data-chip="0"]')).toHaveAttribute('aria-pressed', 'true');
  await first.locator('[data-chip="1"]').click();
  await expect(first.locator('[data-chip="0"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(first.locator('[data-chip="1"]')).toHaveAttribute('aria-pressed', 'true');
  await snap(page, 'listen');
  // the send waits for the call's end
  await fill(page);
  await runToSee(page, sheet(page).locator('[data-kiki-call-done]'));
  await expect(sheet(page).locator('[data-kiki-call-ended="0"]')).toBeVisible();
  await snap(page, 'memo');
  await send(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-basket] [data-state="soon"]').first()).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-memo] [data-mark="wrong"]')).toHaveCount(0);
  await snap(page, 'reveal-1');
  await sheet(page).locator('[data-kiki-next]').click();

  // round 2: no call, the rest from memory; my last row wrong
  await runToQuestion(page, 1);
  await expect(sheet(page).locator('[data-kiki-call-ended="1"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-frame="phone"]')).toHaveCount(0);
  // no 前の問題 while the same call is remembered (its text would give the memo away); a new call's round has it
  await expect(sheet(page).locator('[data-kiki-prev]')).toHaveCount(0);
  await fill(page, true);
  await snap(page, 'memo-2');
  await send(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await expect(sheet(page).locator('[data-kiki-verdict="wrong"]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-memo] [data-row][data-mark="wrong"]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-basket] [data-state="missed"]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-basket] [data-state="soon"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-why]')).toBeVisible();
  await sheet(page).locator('[data-kiki-call-log-btn]').click();
  await expect(sheet(page).locator('[data-kiki-call-log] [data-kiki-repair]').first()).toBeVisible();
  await snap(page, 'reveal-2', true);
  await sheet(page).locator('[data-kiki-next]').click();

  // the rest right
  for (let i = 2; i < 6; i++) {
    await runToQuestion(page, i);
    await expect(sheet(page).locator('[data-kiki-prev]')).toHaveCount(i % 2 ? 0 : 1);
    await fill(page);
    await send(page);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-verdict="right"]')).toBeVisible();
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  await expect(sheet(page).locator('[data-kiki-tally]')).toHaveText('5 / 6 問正解');
  await expect(sheet(page).locator('[data-kiki-call-errands]')).toHaveAttribute('data-kiki-call-errands', '2');
  await expect(sheet(page).locator('[data-review]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-kiki-call-heard]')).toBeVisible();
  await snap(page, 'results', true);
  // my row: the game, each round by its call, the wrong row in the pick
  const row = await kiki(page, (k) => k.recorded());
  expect(row?.gm).toBe('call');
  expect(row!.r.map(([, ok]) => ok)).toEqual([1, 0, 1, 1, 1, 1]);
  const ids = await kiki(page, (k) => k.items());
  expect(row!.r.map(([id]) => id)).toEqual(ids.map((c) => c.replace(/-memo$/, '')));
  expect(row!.r[1][2]).toBeGreaterThan(0);
});

test('night: the phone and the memo in the night palette', async ({ context }) => {
  test.skip(!process.env.KIKI_SHOTS, 'screenshots only');
  const page = await phone(context, NIGHT);
  await toCall(page);
  await sheet(page).locator('[data-kiki-start]').click();
  await runToSee(page, sheet(page).locator('[data-kiki-call-after]'));
  await fill(page);
  await snap(page, 'night-listen');
  await send(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await snap(page, 'night-reveal');
  await sheet(page).locator('[data-kiki-next]').click();
  await fill(page, true);
  await send(page);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  await sheet(page).locator('[data-kiki-call-log-btn]').click();
  await snap(page, 'night-reveal-2', true);
});

test('co-op on two phones: each fills its own rows of one memo; the reveal shows the team’s; the results count the rounds done whole', async ({ browser }) => {
  test.setTimeout(60_000); // two phones, six rounds each: ~25 s here under load, the plays stepped through
  const ctx = await browser.newContext();
  const a = await phone(ctx, DAY, 'A'), b = await phone(ctx, DAY, 'B');
  await a.bringToFront();
  await toCall(a);
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききみみに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect.poll(() => kiki(b, (k) => k && k.view().gm), { timeout: 15_000 }).toBe('call');
  await a.bringToFront();
  await expect(sheet(a).locator('[data-kiki-start]')).toHaveText('始める（2人）', { timeout: 10_000 });
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  expect(await kiki(a, (k) => k.items())).toEqual(await kiki(b, (k) => k.items()));

  // B's rows wrong in round 3: the team does 5 of 6 whole
  for (let i = 0; i < 6; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await runToQuestion(p, i);
      if (i === 0) {
        expect(await kiki(p, (k) => k.view().roles)).toEqual({ A: 0, B: 1 });
        // my rows filled by me, the partner's dashed (a round of one row: both's)
        const rows = sheet(p).locator('[data-kiki-memo] [data-row]');
        await runToSee(p, rows);
        const [all, own] = [await rows.count(), await sheet(p).locator('[data-kiki-memo] [data-own]').count()];
        expect(own).toBe(all === 1 ? 1 : Math.ceil(all / 2) - (who === 'B' && all % 2 ? 1 : 0));
        await expect(sheet(p).locator('[data-kiki-memo] .theirs')).toHaveCount(all - own);
        if (who === 'B') await snap(p, 'coop-memo');
      }
      await fill(p, who === 'B' && i === 2);
      await send(p);
    }
    await a.bringToFront();
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(a).locator('[data-kiki-call-team]')).toHaveAttribute('data-kiki-call-team', i === 2 ? '1' : '0');
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
