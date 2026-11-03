// Beach finds (docs/design.md "Beach finds"): shells on the sand, fossil dig spots, the message bottle, star fragments
// the morning after a wish, mushrooms in November. A tap picks one up with NH's caption; the first of each shell, fossil
// and fragment is a ずかん `find` (mushrooms are cosmetic). None of it changes ベル, opens a sheet or navigates. The day
// items derive from ?date= (deterministic); ?find= forces a bottle, this morning's fragments or the rare mushroom.
import { expect, test, type Page } from '@playwright/test';
import { fossilOnScreen } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });

const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(hudJar(page)).toBeVisible();
  return { bells: await hudJar(page).getAttribute('aria-label'), url: page.url() };
}
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(hudJar(page)).toHaveAttribute('aria-label', before.bells!);
}
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? [])
    .filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
/** What's under a point: a control (button) or nothing. */
const control = (page: Page, p: { x: number; y: number }) =>
  page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);

test('shells lie on the front beach (the newest three); a tap picks one up, and it stays picked after a reload', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const shells = page.locator('[data-find="shell"]');
  await expect(shells).toHaveCount(3);
  const id = await shells.first().getAttribute('data-id');
  const p = await at(page, '[data-find="shell"]');
  expect(await control(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/を ひろった！/);
  await expect(shells).toHaveCount(2);
  expect(await cues(page)).toContain('scene-shell');
  expect(await finds(page)).toEqual([{ kind: 'shell', id }]);
  await unchanged(page, before);
  await page.reload();
  await expect(hudJar(page)).toBeVisible();
  await expect(shells).toHaveCount(2);
});

test('a fossil dig spot: a tap digs it up (「化石を ほりだした！」 and its name); the next one waits a little', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const spots = page.locator('[data-digs]');
  await expect(page.locator('[data-find="fossil"]').first()).toBeAttached();
  // (the island's, wherever they are: on the layout they lie all over the long island, a few out of view)
  const n = Number(await spots.getAttribute('data-digs'));
  expect(n).toBeGreaterThanOrEqual(2);
  expect(n).toBeLessThanOrEqual(4);
  const p = await fossilOnScreen(page);
  const shown = page.locator('[data-find="fossil"]'), m = await shown.count();
  expect(await control(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/化石を ほりだした！ .+だ！/);
  // the one dug gone, the next one waiting a little (the others where they were)
  await expect(shown).toHaveCount(m - 1);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-dig', 'scene-catch']));
  expect((await finds(page))[0]).toMatchObject({ kind: 'fossil' });
  await unchanged(page, before);
});

test('a message bottle at the water’s edge: a tap reads its note', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00&find=bottle');
  const p = await at(page, '[data-find="bottle"]');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/メッセージボトル！ 『.+』/);
  await expect(page.locator('[data-find="bottle"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-bottle');
  expect(await finds(page)).toEqual([]); // a bottle isn't a ずかん find
  await unchanged(page, before);
});

test('wishes on shooting stars bring star fragments the next morning; a tap picks one up (the wish itself: sky.spec)', async ({ page }) => {
  await page.addInitScript(() => localStorage.getItem('scene-wish') || localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-05': 3 })));
  await page.goto('?demo&date=2026-11-05T08:00');
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(3);
  const frags = page.locator('[data-find="fragment"]');
  await expect(frags.first()).toBeAttached();
  const before = { bells: await hudJar(page).getAttribute('aria-label'), url: page.url() };
  const id = await frags.first().getAttribute('data-id');
  const p = await at(page, '[data-find="fragment"]');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/かけらを ひろった！/);
  expect(await finds(page)).toEqual([{ kind: 'fragment', id }]);
  await unchanged(page, before);
});

test('mushroom season: November mushrooms beside the trees, clear of every control; a tap picks one up (cosmetic)', async ({ page }) => {
  const before = await open(page, '&date=2026-11-01T10:00');
  const mush = page.locator('[data-find="mushroom"]');
  await expect(mush.first()).toBeAttached();
  const n = await mush.count();
  expect(n).toBeGreaterThanOrEqual(1);
  expect(n).toBeLessThanOrEqual(2);
  // beside a trunk, under no control
  for (let i = 0; i < n; i++) {
    const box = (await mush.nth(i).locator('.official').first().boundingBox())!;
    for (const [dx, dy] of [[0.5, 0.5], [0.15, 0.85], [0.85, 0.85], [0.5, 0.15]])
      expect(await control(page, { x: box.x + box.width * dx, y: box.y + box.height * dy })).toBe('');
  }
  const p = await at(page, '[data-find="mushroom"] .official');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/(まるい|ほそい|ひらたい|りっぱな)キノコを ひろった！/);
  await expect(mush).toHaveCount(n - 1);
  expect(await cues(page)).toContain('scene-mushroom');
  expect(await finds(page)).toEqual([]); // no ずかん kind for mushrooms: cosmetic
  await unchanged(page, before);
  await page.reload();
  await expect(hudJar(page)).toBeVisible();
  await expect(mush).toHaveCount(n - 1);
});

test('no mushrooms out of season (September); the rare mushroom comes out of a November dig spot', async ({ page }) => {
  await open(page, '&date=2026-09-10T10:00');
  await expect(page.locator('[data-find="fossil"]').first()).toBeAttached();
  await expect(page.locator('[data-find="mushroom"]')).toHaveCount(0);
  const before = await open(page, '&date=2026-11-04T12:00&find=rare-mushroom');
  const p = await fossilOnScreen(page);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText('めずらしいキノコを ほりだした！');
  expect(await finds(page)).toEqual([]);
  await unchanged(page, before);
});
