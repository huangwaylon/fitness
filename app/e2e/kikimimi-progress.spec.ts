// ききみみ クイズ's きろく (docs/kikimimi.md "Progress & feedback"): after a solo game the results give my feedback
// (しずえ's line, what tripped me), the lobby's きろく tab shows the game with the demo's earlier ones (the stage, the
// sub-skills' bars, the trend, this week, the couple summary, the recommendations), and a recommendation's start or
// 「にがて れんしゅう」 begins a solo game of my weak spots. The logic tier (no clip has to sound). Screenshots to
// /tmp/kikimimi-shots/progress/ with KIKI_SHOTS=1.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&critter=none&visitor=none&kikimimi=fast';
const SHOTS = process.env.KIKI_SHOTS ? '/tmp/kikimimi-shots/progress' : null;

type Kiki = { view(): { phase: string; i: number }; right(): number; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
const shot = async (p: Page, name: string) => {
  if (!SHOTS) return;
  // (しずえ's line typed out: ui/Bubble's data-typing)
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.locator('dialog[open]').screenshot({ path: `${SHOTS}/${name}.png` });
};

async function playGame(page: Page, wrong: readonly number[]) {
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  for (let i = 0; i < 8; i++) {
    await expect.poll(() => kiki(page, (k) => k.view().i), { timeout: 15_000 }).toBe(i);
    await expect(sheet(page)).toHaveAttribute('data-phase', 'answer', { timeout: 15_000 });
    const right = await kiki(page, (k) => k.right());
    const n = await sheet(page).locator('[data-choice]').count();
    await sheet(page).locator(`[data-choice="${wrong.includes(i) ? (right + 1) % n : right}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
}

test('after a solo game: my feedback, then きろく with it, and a recommendation starts にがて れんしゅう', async ({ page }) => {
  test.slow();
  await page.goto(`?demo&${Q}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await sheet(page).locator('[data-kiki-start]').click();
  await playGame(page, [1, 4]);
  // the results: しずえ's line from my きろく and what tripped me (two misses)
  const fb = sheet(page).locator('[data-kiki-feedback]');
  await expect(fb).toBeVisible();
  await expect(fb.locator('.fb-line')).not.toBeEmpty();
  await expect(sheet(page).locator('[data-trip]').first()).toBeVisible();
  await shot(page, '1-results-feedback');

  // もういっかい → the lobby again; きろく
  await sheet(page).locator('[data-kiki-again]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await sheet(page).locator('[data-kiki-tab="record"]').click();
  const prog = sheet(page).locator('[data-kiki-progress]');
  await expect(prog).toBeVisible();
  await expect(prog.locator('[data-kiki-stage]')).toHaveAttribute('data-kiki-stage', /^s[0-3]$/);
  await expect(prog.locator('[data-skill]')).toHaveCount(8);
  await expect(prog.locator('[data-skill="lr"]')).not.toHaveAttribute('data-m', '');
  // this week: the demo's Monday-to-Wednesday games and today's
  await expect(prog.locator('[data-kiki-week]')).not.toHaveAttribute('data-kiki-week', '0');
  await expect(prog.locator('[data-kiki-trend] svg')).toBeVisible();
  // the couple summary: games with B this week, never a level
  await expect(prog.locator('[data-kiki-together]')).toBeVisible();
  await expect(prog.locator('[data-rec]').first()).toBeVisible();
  await shot(page, '2-kiroku');
  await prog.locator('details.more summary').click();
  await shot(page, '3-kiroku-details');

  // a recommendation's start: a solo game of my weak spots (8 questions, not the shared deck)
  const shared = await kiki(page, (k) => k.items());
  await prog.locator('[data-kiki-rec-start]').first().click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  const items = await kiki(page, (k) => k.items());
  expect(items).toHaveLength(8);
  expect(items).not.toEqual(shared);
});

test('the lobby’s にがて れんしゅう plays a deck of my weak spots and records it', async ({ page }) => {
  test.slow();
  await page.goto(`?demo&${Q}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await shot(page, '0-lobby');
  await sheet(page).locator('[data-kiki-practice]').click();
  const items = await kiki(page, (k) => k.items());
  expect(new Set(items).size).toBe(8);
  // the demo's misses come back (w1-right, w1-fly … were missed yesterday: due today)
  expect(items.some((id) => ['w1-right', 'w1-fly', 'w2-read', 'w2-cloud', 'w2-flight', 'w3-gotta', 'w3-shouldve', 'r3-coffee', 'r3-show', 'n2-tourney-1'].includes(id))).toBe(true);
  await playGame(page, [0]);
  await expect(sheet(page).locator('[data-kiki-feedback]')).toBeVisible();
});
