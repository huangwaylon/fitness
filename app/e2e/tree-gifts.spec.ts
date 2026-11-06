// The trees' presents (docs/design.md "Shaking a tree"; island/treeGifts.ts): each Tokyo day two of the oaks and cedars
// hold a present (NH's furniture from the trees, wrapped as a balloon's); the first shake of one drops it, a tap opens
// it into that tree's furniture of the day (the plate's 「○○を てにいれた！」), counted in the ずかん's カタログ and placeable
// in the tent (みつけた). Shared: the other phone sees it fall and, once opened, gone.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from './fixtures.ts';
import { camTo, geo, type Geo, plateOnly, quiet } from './island.ts';
import { fromMenu, hudBells, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const DATE = '2026-11-04';
const Q = `?demo&date=${DATE}T12:00&critter=none&visitor=none`;
/** The day's first holding tree (the same on every phone: the page's island's, its trees the layout's on it), set by
 *  open(). */
let TREE = '', TREE_Z = 0, G: Geo;
/** The tent's code of a ずかん furniture id (tent/items.json). */
const ROOM = JSON.parse(readFileSync(new URL('../src/lib/components/tent/items.json', import.meta.url), 'utf8')) as { items: Record<string, { cat?: string }> };
const codeOf = (id: string) => Object.entries(ROOM.items).find(([, m]) => m.cat === id)?.[0];

async function open(page: Page, q = '') {
  await page.goto(Q + q);
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await quiet(page); // the opening beats are over
  G = await geo(page);
  TREE = G.GIFT_TREES[0];
  TREE_Z = G.SCENERY.find((s) => s.id === TREE)!.z;
  await camTo(page, TREE_Z - 114);
}
/** A point on a tree's leaves the finger reaches (its tap area's middle, else the nearest part nothing covers). */
const leaves = (page: Page, id: string) =>
  page.locator(`[data-tree="${id}"]:not([data-tree-part])`).evaluate((el) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    for (let d = 0; d < b.height / 2; d += 3)
      for (const [dx, dy] of [[0, d], [0, -d], [d, 0], [-d, 0]])
        if (document.elementFromPoint(cx + dx, cy + dy)?.closest('[data-tree]') === el) return { x: cx + dx, y: cy + dy };
    return { x: cx, y: cy };
  });
async function shake(page: Page, id: string) {
  for (let i = 0; i < 3; i++) {
    const p = await leaves(page, id);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(140);
  }
}
/** A tap on the tree's present where it lies (its art's middle). */
async function tapGift(page: Page) {
  const b = (await page.locator(`[data-tree-gift="${TREE}"] .official`).boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
/** What the present held, from the shared day's pick (`present:item:<id>`). */
const opened = (page: Page, who: 'A' | 'B' = 'A') =>
  page.evaluate(([tree, who]) => {
    const day = JSON.parse(localStorage.getItem(`island-demo.world.${who}`) ?? '{"events":[]}') as { events: { kind: string; id?: string; what?: string }[] };
    return day.events.find((e) => e.kind === 'pick' && e.id === `tf:${tree}`)?.what?.split(':')[2] ?? null;
  }, [TREE, who] as const);

test('a holding tree’s shake drops its present; opened, it’s the day’s furniture: in the ずかん’s カタログ and the tent’s みつけた', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => localStorage.removeItem('island-demo.tent'));
  await open(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  // another tree (not one of the day's) drops no present
  const other = G.SCENERY.find((s) => (s.kind === 'oak' || s.kind === 'cedar') && !G.GIFT_TREES.includes(s.id) && Math.abs(s.z - TREE_Z) < 120)!;
  await shake(page, other.id);
  await page.waitForTimeout(900);
  await expect(page.locator('[data-tree-gift]')).toHaveCount(0);
  await page.waitForTimeout(1300); // a new run of taps
  await shake(page, TREE);
  const gift = page.locator(`[data-tree-gift="${TREE}"]`);
  await expect(gift).toHaveCount(1, { timeout: 3000 });
  await expect(gift).not.toHaveClass(/fall/, { timeout: 3000 });
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/tree-gifts-fallen-393.png` });
  // shaken again, it drops no second one
  await page.waitForTimeout(1300);
  await shake(page, TREE);
  await page.waitForTimeout(900);
  await expect(page.locator('[data-tree-gift]')).toHaveCount(1);
  await tapGift(page);
  await expect(page.locator('[data-fx="catch"]')).toContainText('てにいれた！', { timeout: 5000 });
  // only its plate, the furniture's icon on it: nothing over my villager's head
  await plateOnly(page, /\/finds\/items\//);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/tree-gifts-opened-393.png` });
  await expect(gift).toHaveCount(0);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!); // never ベル
  const id = (await opened(page))!;
  expect(id).toBeTruthy();
  const code = codeOf(id);
  expect(code, id).toBeTruthy();
  // a reload finds it gone (the shared day), and the tree a tree again
  await page.reload();
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-tree-gift]')).toHaveCount(0);
  // the ずかん's カタログ has it, found by A
  await fromMenu(page, 'zukan');
  await page.locator('[data-zukan="item"]').click();
  const tile = page.locator(`button.tile[data-entry="${id}"]`);
  await expect(tile).toHaveCount(1, { timeout: 10_000 });
  await expect(tile).not.toHaveClass(/unknown/);
  await tile.click();
  await expect(page.locator(`[data-zukan-detail="${id}"]`)).toContainText('ウェイ');
  // the tent's みつけた offers it, and it's placed like the rest
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await page.locator('[data-tent-edit-open]').click();
  await page.waitForFunction(() => (window as unknown as { __tent: { still(): boolean } }).__tent.still());
  await page.locator('[data-tab="finds"]').click();
  await page.locator(`[data-tent-item="${code}"]`).click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tent: { pieces(): { item: string }[] } }).__tent.pieces().map((p) => p.item))).toContain(code);
});

test('two phones: the present falls on both; opened on one, it’s gone on the other, which can’t drop it again', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  await a.bringToFront();
  await shake(a, TREE);
  await expect(a.locator(`[data-tree-gift="${TREE}"]`)).toHaveCount(1, { timeout: 3000 });
  await expect(b.locator(`[data-tree-gift="${TREE}"]`)).toHaveCount(1, { timeout: 5000 });
  // B opens it (first wins): what A's tree held, the same on both
  await b.bringToFront();
  await expect(b.locator(`[data-tree-gift="${TREE}"]`)).not.toHaveClass(/fall/, { timeout: 3000 });
  await tapGift(b);
  await expect(b.locator('[data-fx="catch"]')).toContainText('てにいれた！', { timeout: 5000 });
  await expect(a.locator(`[data-tree-gift="${TREE}"]`)).toHaveCount(0, { timeout: 5000 });
  const got = await opened(b, 'B');
  expect(got).toBeTruthy();
  await plateOnly(b, `finds/items/${got}`);
  // A's shake of it now drops no present
  await a.bringToFront();
  await a.waitForTimeout(1300);
  await shake(a, TREE);
  await a.waitForTimeout(1000);
  await expect(a.locator('[data-tree-gift]')).toHaveCount(0);
  // the same island on both
  const st = (p: Page) => p.evaluate(() => (window as unknown as { __world: { state(): { day: string } } }).__world.state().day);
  await expect.poll(async () => (await st(a)) === (await st(b)), { timeout: 5000 }).toBe(true);
  await ctx.close();
});
