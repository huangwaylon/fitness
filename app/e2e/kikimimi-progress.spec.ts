// ききみみ クイズ's きろく (docs/kikimimi.md "Progress & feedback"): after a solo game the results give my feedback
// (しずえ's line, what tripped me), the lobby's きろく tab shows the game with the demo's earlier ones (the stage, the
// sub-skills' bars, the trend, this week, the couple summary, the recommendations), and a recommendation's start or
// 「にがて れんしゅう」 begins a solo game of my weak spots. The logic tier (no clip has to sound). Screenshots to
// /tmp/kikimimi-shots/progress/ with KIKI_SHOTS=1.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { kikiSheet, runToQuestion, toMode } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&kikimimi=fast';
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

test('おさらい (あそぶ) plays a deck of my weak spots and records it; 1 of 8 right gets no praise, the retry as next step', async ({ page }) => {
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
  await playGame(page, [0, 1, 2, 3, 4, 5, 6]);
  // under half right: しずえ points at the misses again (no 「いい ちょうし」, no set to go on to), the retry the leaf button
  const fb = sheet(page).locator('[data-kiki-feedback]');
  await expect(fb).toHaveAttribute('data-kiki-feedback', 'tough');
  await expect(fb.locator('.fb-line')).toHaveText('むずかしかったね！ まちがえた ところを もう いちど きいて みましょう');
  await expect(sheet(page).locator('[data-kiki-retry]')).toHaveClass(/\bgreen\b/);
  await shot(page, '4-results-tough');
});
