// よみきき サンド (docs/curriculum-wave2.md §2.0): listen blind → read → listen blind again → 聞き取れた / まだ, from a
// solo reveal and from a review row. まだ is a mark on this phone only (island.kikiMada); 聞き取れた keeps nothing. The
// logic tier: a headless browser's audio is a null sink, the clip's length the relay clock's.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { runToPhase, runToSee, toMode } from './kikimimi-nav.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = 'date=2026-11-04T12:00&kikimimi=fast';
const SHOTS = '/tmp/kikimimi-shots/sandwich';

type Kiki = { view(): { i: number }; right(): number; items(): string[] };
const kiki = <R,>(p: Page, fn: (k: Kiki) => R) => p.evaluate(`(${fn.toString()})(window.__kiki)`) as Promise<R>;
const sheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');
const sand = (p: Page) => p.locator('dialog[open] [data-kiki-sand]');
const marks = (p: Page) => p.evaluate(() => JSON.parse(localStorage.getItem('island.kikiMada') ?? '{}') as Record<string, [string, string][]>);
const shot = async (p: Page, name: string) => {
  if (!process.env.KIKI_SHOTS) return;
  // (the sheet's slide in over)
  const s = sand(p);
  if (await s.count()) await s.evaluate((el) => Promise.all(el.closest('dialog')!.getAnimations().map((a) => a.finished)));
  await p.screenshot({ path: `${SHOTS}/${name}.png` });
};

/** Through the sandwich: blind (no words, 読む waits for the clip), the words, blind again, then the rating. */
async function through(p: Page, rate: 'got' | 'mada', name: string) {
  await expect(sand(p)).toHaveAttribute('data-kiki-sand', 'hear');
  await expect(sand(p).locator('[data-kiki-sand-text]')).toHaveCount(0);
  await expect(sand(p).locator('[data-kiki-sand-play]')).toBeVisible();
  await shot(p, `${name}-1-blind`);
  const read = p.locator('dialog[open] [data-kiki-sand-next="read"]');
  await runToSee(p, p.locator('dialog[open] [data-kiki-sand-next="read"][aria-disabled="false"]'));
  await read.click();
  await expect(sand(p)).toHaveAttribute('data-kiki-sand', 'read');
  await expect(sand(p).locator('[data-kiki-sand-text]')).toBeVisible();
  await expect(sand(p).locator('[data-kiki-sand-text] [lang="en"]').first()).toBeVisible();
  await shot(p, `${name}-2-read`);
  await p.locator('dialog[open] [data-kiki-sand-next="again"]').click();
  await expect(sand(p)).toHaveAttribute('data-kiki-sand', 'again');
  await expect(sand(p).locator('[data-kiki-sand-text]')).toHaveCount(0);
  await runToSee(p, p.locator('dialog[open] [data-kiki-sand-rate="open"]'));
  await shot(p, `${name}-3-rate`);
  await p.locator(`dialog[open] [data-kiki-sand-${rate}]`).click();
  await expect(sand(p)).toHaveCount(0);
}

test('サンド: from a solo reveal and a review row; まだ marks the item on this phone', async ({ page }) => {
  await page.clock.install(); // (the clips stepped through: kikimimi-nav.ts runUntil)
  await page.goto(`?demo&${Q}`);
  await islandUp(page);
  await fromMenu(page, 'kikimimi');
  await toMode(page, 'quiz');
  await sheet(page).locator('[data-level="1"]').click();
  await sheet(page).locator('[data-kiki-start]').click();
  // question 1's reveal (solo): 「読んでから もう一度」 under the verdict
  await runToPhase(page, 'answer');
  const first = await kiki(page, (k) => k.items()[0]);
  await sheet(page).locator(`[data-choice="${await kiki(page, (k) => k.right())}"]`).click();
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  const open = sheet(page).locator(`[data-kiki-verdict] [data-kiki-sand-open="${first}"]`);
  await expect(open).toHaveText('📖 読んでから もう一度');
  await shot(page, 'reveal');
  await open.click();
  await through(page, 'mada', 'reveal');
  // まだ: a mark for A today, nothing else; the reveal waits as it was
  expect((await marks(page)).A).toEqual([[first, '2026-11-04']]);
  await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
  // the rest of the game, then a review row's サンド: 聞き取れた keeps nothing
  for (let i = 0; i < 8; i++) {
    if (i > 0) {
      await runToPhase(page, 'answer');
      await sheet(page).locator(`[data-choice="${await kiki(page, (k) => k.right())}"]`).click();
      await expect(sheet(page)).toHaveAttribute('data-phase', 'reveal');
    }
    await sheet(page).locator('[data-kiki-next]').click();
  }
  await expect(sheet(page)).toHaveAttribute('data-phase', 'results');
  await sheet(page).locator('[data-kiki-row="1"]').click();
  const second = await kiki(page, (k) => k.items()[1]);
  const row = sheet(page).locator(`[data-kiki-detail="1"] [data-kiki-sand-open="${second}"]`);
  await expect(row).toBeVisible();
  await shot(page, 'results-row');
  await row.click();
  await through(page, 'got', 'row');
  expect((await marks(page)).A).toEqual([[first, '2026-11-04']]);
});
