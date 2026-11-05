// ききみみ クイズ's スピード はしご (docs/kikimimi.md "スピード はしご"): the lobby's mode choice, a solo game of two
// ladders (each rung's own question, the ladder over the stage, a rung's reveal keeping the line hidden and silent till the
// top, the climb stopping at a miss or a replay, the results' climbs and the review's speeds), きろく's speed; and two
// players over the demo's relay (`?demo` and `?demo&as=B`): the host's mode reaches B's invite and lobby, both climb, the
// same points on each phone. The logic tier: no clip has to sound (`?kikimimi=fast`: a short reveal). Screenshots to
// /tmp/kikimimi-shots/inc7/ with KIKI_SHOTS=1.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/inc7' : null;

type Kiki = { view(): { phase: string; i: number; ladder: boolean; players: { who: string; score: number }[] }; right(): number; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
async function shot(p: Page, name: string, full = false) {
  if (!SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
}

async function open(ctx: BrowserContext | Page, as: 'A' | 'B' = 'A'): Promise<Page> {
  const page = 'newPage' in ctx ? await ctx.newPage() : ctx;
  await page.goto(`?demo&${Q}${as === 'A' ? '' : `&as=${as}`}`);
  await expect(hudMenu(page)).toBeVisible();
  return page;
}

/** Answer the current rung: the right choice, or (`wrong`) another; `replay` first (🔁: no climb). */
async function answer(page: Page, o: { wrong?: boolean; replay?: boolean } = {}) {
  await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 20_000 });
  if (o.replay) await sheet(page).locator('[data-kiki-replay]').click();
  const right = await kiki(page, (k) => k.right());
  const k = o.wrong ? (right + 1) % 3 : right;
  await sheet(page).locator(`[data-choice="${k}"]`).click();
  await expect(sheet(page).locator(`[data-choice="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
}

test('solo: the mode in the lobby, two ladders climbed (a miss and a replay stop a climb), the line only at the top, the results and きろく', async ({ page }) => {
  test.setTimeout(180_000); // (8 rungs of 4-9 s lines, two tabs: past test.slow()'s 90 s under a full parallel run)
  await open(page);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  // the mode: クイズ by default; スピード はしご puts its speeds and rule where the level was, and no にがて れんしゅう
  await expect(sheet(page).locator('[data-kiki-mode="quiz"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-kiki-mode="ladder"]').click();
  await expect(sheet(page).locator('[data-kiki-mode="ladder"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).locator('[data-kiki-ladder-about]')).toBeVisible();
  await expect(sheet(page).locator('[data-level]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kiki-practice]')).toHaveCount(0);
  await expect.poll(() => kiki(page, (k) => k.items().every((id) => id.startsWith('sp-')))).toBe(true);
  await shot(page, 'lobby');
  await sheet(page).locator('[data-kiki-start]').click();
  // ladder 1: rungs 1-2 climbed, a miss on 3 (stopped), 4 right but held; ladder 2: rung 1, a replay on 2 (no climb), 3-4 held
  const plan: { wrong?: boolean; replay?: boolean }[] = [{}, {}, { wrong: true }, {}, {}, { replay: true }, {}, {}];
  const climb = ['up', 'up', 'stop', 'held', 'up', 'held', 'held', 'held'];
  for (let i = 0; i < 8; i++) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
    const rung = (i % 4) + 1;
    await expect(sheet(page).locator('[data-kiki-rung]')).toHaveAttribute('data-kiki-rung', String(rung));
    // rungs 1-3 ask in Japanese; the top shows the line with its chunk blanked
    await expect(sheet(page).locator(`[data-kiki-q="${i}"]`)).toHaveAttribute('data-type', rung === 4 ? 'word' : /gist|num/);
    await expect(sheet(page).locator('.line')).toHaveCount(rung === 4 ? 1 : 0);
    if (i === 1) await shot(page, 'rung-play');
    await answer(page, plan[i]);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await expect(sheet(page).locator('[data-kiki-climb]')).toHaveAttribute('data-kiki-climb', climb[i]);
    await expect(sheet(page).locator('[data-kiki-bonus]')).toHaveCount(0);
    if (rung < 4) {
      // below the top: no line, no Japanese, no replay (the next rung is the next listen)
      await expect(sheet(page).locator('[data-kiki-en]')).toHaveCount(0);
      await expect(sheet(page).locator('[data-kiki-later]')).toBeVisible();
      await expect(sheet(page).locator('[data-kiki-replay]')).toHaveCount(0);
      if (i === 1) await shot(page, 'rung-reveal');
      if (i === 2) await shot(page, 'rung-stop');
    } else {
      await expect(sheet(page).locator('[data-kiki-en]')).toBeVisible();
      await expect(sheet(page).locator('[data-kiki-height]')).toHaveAttribute('data-kiki-height', i === 3 ? '2' : '1');
      await expect(sheet(page).locator('[data-kiki-note]')).toBeVisible();
      if (i === 3) await shot(page, 'top-reveal');
    }
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  // 3 rungs climbed: 300, a flat 100 a rung
  await expect.poll(() => kiki(page, (k) => k.view().players[0].score)).toBe(300);
  await expect(sheet(page).locator('[data-kiki-climbs]')).toHaveAttribute('data-kiki-climbs', '2,1');
  await expect(sheet(page).locator('[data-kiki-climb-row="0"] b')).toHaveText('1.0× まで');
  await expect(sheet(page).locator('[data-review-ladder]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-review-ladder] [data-kiki-hear]')).toHaveCount(8);
  await expect(sheet(page).locator('[data-review="2"] [data-kiki-picked]')).toContainText('えらんだ');
  await shot(page, 'results', true);
  // もういっかい keeps the mode; きろく shows the speed
  await sheet(page).locator('[data-kiki-again]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await expect(sheet(page).locator('[data-kiki-mode="ladder"]')).toHaveAttribute('aria-checked', 'true');
  await sheet(page).locator('[data-kiki-tab="record"]').click();
  await expect(sheet(page).locator('[data-kiki-speed]')).toBeVisible();
  await expect(sheet(page).locator('[data-kiki-speed] [data-rung]')).toHaveCount(4);
  await expect(sheet(page).locator('[data-kiki-speed] [data-rung="1"]')).toHaveAttribute('data-m', '100');
  await expect(sheet(page).locator('[data-kiki-speed] [data-rung="3"]')).toHaveAttribute('data-m', '0');
  await shot(page, 'progress-speed');
});

test('two players: the host’s mode reaches B’s invite and lobby; both climb, co-op’s tally and the same points on each phone', async ({ browser }) => {
  test.setTimeout(180_000); // (8 rungs of 4-9 s lines, two tabs: past test.slow()'s 90 s under a full parallel run)
  const ctx = await browser.newContext();
  const a = await open(ctx, 'A');
  const b = await open(ctx, 'B');
  await a.bringToFront();
  await fromMenu(a, 'kikimimi');
  await sheet(a).locator('[data-kiki-mode="ladder"]').click();
  await sheet(a).locator('[data-kiki-invite-all]').click();
  const banner = b.locator('.banner', { hasText: 'ききとりクイズに さそっています' });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await b.bringToFront();
  await banner.getByRole('button', { name: 'さんか' }).click();
  await expect(sheet(b)).toHaveAttribute('data-phase', 'lobby');
  // B sees the host's mode (not its own to change)
  await expect(sheet(b).locator('[data-kiki-mode="ladder"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(b).locator('[data-kiki-mode="quiz"]')).toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() => kiki(b, (k) => k.view().ladder)).toBe(true);
  await a.bringToFront();
  await expect(sheet(a).locator('[data-player="B"]')).toHaveAttribute('data-state', 'here');
  await sheet(a).locator('[data-kiki-start]').click();
  await expect(sheet(b)).not.toHaveAttribute('data-phase', 'lobby', { timeout: 10_000 });
  // A climbs both ladders; B misses rung 2 of ladder 2
  for (let i = 0; i < 8; i++) {
    for (const [p, who] of [[a, 'A'], [b, 'B']] as const) {
      await p.bringToFront();
      await expect.poll(() => kiki(p, (k) => k.view().i), { timeout: 20_000 }).toBe(i);
      await answer(p, { wrong: who === 'B' && i === 5 });
    }
    await expect(sheet(a)).toHaveAttribute('data-phase', 'reveal');
    if (i === 5 && SHOTS) await shot(a, 'two-reveal');
  }
  for (const p of [a, b]) {
    await p.bringToFront();
    await expect(sheet(p)).toHaveAttribute('data-phase', 'results', { timeout: 20_000 });
    // A 8 rungs, B 4 + 1; co-op: the team got every question
    await expect.poll(() => kiki(p, (k) => k.view().players.map((x) => [x.who, x.score]))).toEqual([['A', 800], ['B', 500]]);
    await expect(sheet(p).locator('[data-kiki-team] b')).toHaveText('ふたりで 8/8');
    await expect(sheet(p).locator('[data-kiki-climbs]')).toHaveAttribute('data-kiki-climbs', p === a ? '4,4' : '4,1');
    if (p === b) await shot(p, 'two-results-B', true);
  }
  await ctx.close();
});
