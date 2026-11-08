// ききみみ クイズ's きろく (docs/kikimimi.md "Progress & feedback"): after a solo game the results give my feedback
// (しずえ's line, what tripped me), the lobby's きろく tab shows the game with the demo's earlier ones (the stage, the
// sub-skills' bars, the trend, this week, the couple summary, the recommendations), and a recommendation's start or
// 「にがて れんしゅう」 begins a solo game of my weak spots. The logic tier (no clip has to sound). Screenshots to
// /tmp/kikimimi-shots/progress/ with KIKI_SHOTS=1.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { kikiSheet, runToQuestion, toMode, toTile } from './kikimimi-nav.ts';

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
    await runToQuestion(page, i, 'answer');
    const right = await kiki(page, (k) => k.right());
    const n = await sheet(page).locator('[data-choice]').count();
    await sheet(page).locator(`[data-choice="${wrong.includes(i) ? (right + 1) % n : right}"]`).click();
    await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
}

test('after a solo game: my feedback, the hub’s menu, きろく, and the menu’s おさらい starts my weak spots', async ({ page }) => {
  await page.clock.install(); // (the games' plays stepped through: kikimimi-nav.ts runUntil)
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await toMode(page, 'quiz');
  await sheet(page).locator('[data-kiki-start]').click();
  await playGame(page, [1, 4]);
  // the results: しずえ's line from my きろく and what tripped me (two misses)
  const fb = sheet(page).locator('[data-kiki-feedback]');
  await expect(fb).toBeVisible();
  await expect(fb.locator('.fb-line')).not.toBeEmpty();
  await expect(sheet(page).locator('[data-trip]').first()).toBeVisible();
  await shot(page, '1-results-feedback');

  // もういっかい → the mode's page again; ‹ ‹ to the hub, きろく
  await sheet(page).locator('[data-kiki-again]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await expect(sheet(page).locator('[data-kiki-mode-page="quiz"]')).toBeVisible();
  await page.locator('dialog[open] .navbar .back').click();
  await page.locator('dialog[open] .navbar .back').click();
  // the hub's menu (which card a game ticks: today.test; here the row's day is the relay clock's, not the pinned one)
  await expect(sheet(page).locator('[data-kiki-menu]')).toBeVisible();
  await shot(page, '1b-hub-menu');
  await toTile(page, 'record');
  const prog = sheet(page).locator('[data-kiki-progress]');
  await expect(prog).toBeVisible();
  await expect(prog.locator('[data-kiki-stage]')).toHaveAttribute('data-kiki-stage', /^(hama|kawa|mori|yama)$/);
  await expect(prog.locator('[data-skill]')).toHaveCount(8);
  await expect(prog.locator('[data-skill="lr"]')).not.toHaveAttribute('data-m', '');
  // this week: the demo's Monday-to-Wednesday games and today's
  await expect(prog.locator('[data-kiki-week]')).not.toHaveAttribute('data-kiki-week', '0');
  await expect(prog.locator('[data-kiki-trend] svg')).toBeVisible();
  // the couple summary: games with B this week, never a level
  await expect(prog.locator('[data-kiki-together]')).toBeVisible();
  await shot(page, '2-kiroku');
  await prog.locator('details.more summary').click();
  await shot(page, '3-kiroku-details');

  // the menu's おさらい (the demo's misses are due): a solo game of my weak spots (8 questions, not the lobby's deck)
  const shared = await kiki(page, (k) => k.items());
  await page.locator('dialog[open] .navbar .back').click();
  await sheet(page).locator('[data-kiki-card-go="review"]').click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  const items = await kiki(page, (k) => k.items());
  expect(items).toHaveLength(8);
  expect(items).not.toEqual(shared);
});

test('おさらい (あそぶ) plays a deck of my weak spots and records it', async ({ page }) => {
  await page.clock.install(); // (the games' plays stepped through: kikimimi-nav.ts runUntil)
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await expect(sheet(page)).toHaveAttribute('data-phase', 'lobby');
  await toMode(page, 'review');
  await shot(page, '0-review');
  await kikiSheet(page).locator('[data-kiki-start]').click();
  // (the deck in once it starts: practiceFor loads the picks' levels first, so read at once the lobby's own deck was
  // still there, level 1's, none of the misses: 3 runs in 4 since the levels load one at a time, 54b7f0c6)
  await expect(sheet(page)).toHaveAttribute('data-phase', 'countdown');
  const items = await kiki(page, (k) => k.items());
  expect(new Set(items).size).toBe(8);
  // the demo's misses come back (w1-right, w1-fly … were missed yesterday: due today)
  expect(items.some((id) => ['w1-right', 'w1-fly', 'w2-read', 'w2-cloud', 'w2-flight', 'w3-gotta', 'w3-shouldve', 'r3-coffee', 'r3-show', 'n2-tourney-1'].includes(id))).toBe(true);
  await playGame(page, [0]);
  await expect(sheet(page).locator('[data-kiki-feedback]')).toBeVisible();
});
