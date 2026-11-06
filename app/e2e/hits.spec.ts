// Tap targets (docs/design.md "Taps"): every tappable thing on the island answers a tap on its visible middle and on its
// base, not just its top (the user: "only tapping the top of the trees works; the base of the tree is unresponsive",
// "the tap boxes of items seem very small and typically skewed towards the top"). Each kind is tapped at both points
// and answers there; nothing walks.
import { expect, test, type Page } from './fixtures.ts';
import { quiet } from './island.ts';
import { hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });

const world = <T,>(page: Page, fn: string, ...a: number[]) =>
  page.evaluate(([f, a]) => ((window as unknown as { __world: Record<string, (...x: number[]) => unknown> }).__world[f as string](...(a as number[]))) as T, [fn, a] as const);
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues!.splice(0));

async function open(page: Page, q = '') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T12:00&critter=none${q}`);
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await quiet(page); // the opening beats are over
}
/** The box of what an element draws (its img / svg; a node's anchor is a 0 × 0 point). */
const drawn = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const e of [el, ...el.querySelectorAll('img, svg')]) {
      const x = e.getBoundingClientRect();
      if (!x.width || !x.height || (e === el && el.querySelector('img, svg'))) continue;
      l = Math.min(l, x.left), t = Math.min(t, x.top), r = Math.max(r, x.right), b = Math.max(b, x.bottom);
    }
    return { x: (l + r) / 2, mid: (t + b) / 2, base: b - Math.min(6, (b - t) * 0.12), w: r - l, h: b - t };
  });

test('trees answer at their leaves and their base: a goal tree’s popup, an oak’s rustle', async ({ page }) => {
  await open(page);
  const home = await world<[number, number]>(page, 'mine');
  // the goal tree: its art's middle (the canopy), then just above the foot of its trunk
  const g = await drawn(page, '[data-tree-node="A"] .tree');
  for (const y of [g.mid - g.h * 0.2, g.base]) {
    await page.mouse.click(g.x, y);
    await expect(page.locator('.detail')).toBeVisible();
    await page.waitForTimeout(1300); // not a quick run
    await page.mouse.click(g.x, y);
    await expect(page.locator('.detail')).toHaveCount(0);
    await page.waitForTimeout(1300);
  }
  // an oak of the scenery, up the lawn: the leaves' middle and the trunk's foot each rustle it
  await world(page, 'go', 380);
  await page.waitForTimeout(500);
  const leaves = await drawn(page, '[data-scenery-id="oak-m1"][data-part="canopy"] .art');
  const trunk = await drawn(page, '[data-scenery-id="oak-m1"][data-part="trunk"] .art');
  for (const [x, y] of [[leaves.x, leaves.mid - leaves.h * 0.15], [trunk.x, trunk.base]]) {
    await cues(page);
    await page.mouse.click(x, y);
    await expect.poll(() => page.evaluate(() => (window as { __cues?: string[] }).__cues!.includes('tree-shake'))).toBe(true);
    await page.waitForTimeout(1300);
  }
  expect(await world<[number, number]>(page, 'mine')).toEqual(home); // no walk
});

test('a bush, a flower, the rock and a weed answer at their middle and their base', async ({ page }) => {
  await open(page, '&rock=clonk'); // (no bug out from under the rock, to be netted by the next tap)
  await world(page, 'go', 380);
  await page.waitForTimeout(500);
  const home = await world<[number, number]>(page, 'mine');
  /** The first of `sel` drawn on screen clear of the HUD and the screen's foot. */
  const onScreen = (sel: string) =>
    page.locator(sel).evaluateAll((els, sel) => {
      const i = els.findIndex((el) => {
        const r = el.getBoundingClientRect();
        if (!el.checkVisibility({ visibilityProperty: true }) || r.top < 200 || r.bottom > innerHeight - 80 || r.left < 30 || r.right > innerWidth - 30) return false;
        // nothing else stands in front of its middle or its base (a villager on an outing, another flower)
        const own = (y: number) => { const e = document.elementFromPoint(r.left + r.width / 2, y); return !e || el.contains(e) || !e.closest('button, [data-tree], [data-bush], [data-flower]'); };
        return own(r.top + r.height / 2) && own(r.bottom - Math.min(6, r.height * 0.12));
      });
      return i < 0 ? null : `${sel} >> nth=${i}`;
    }, sel);
  for (const [sel, cue] of [['.stage [data-bush]', 'scene-bush'], ['.stage [data-flower]', 'scene-water'], ['[data-care="rock"]', 'scene-clonk']] as const) {
    const s = await onScreen(sel);
    expect(s, sel).not.toBeNull();
    const b = await drawn(page, s!);
    for (const y of [b.mid, b.base]) {
      await cues(page);
      await page.mouse.click(b.x, y);
      await expect.poll(() => page.evaluate((c) => (window as { __cues?: string[] }).__cues!.includes(c), cue), { message: `${sel} at ${y === b.mid ? 'its middle' : 'its base'}` }).toBe(true);
      await page.waitForTimeout(700);
    }
  }
  // a weed: pulled from a tap at its base
  const weeds = page.locator('[data-care="weed"]');
  const n = await weeds.count();
  const s = await onScreen('[data-care="weed"]');
  if (s) {
    const b = await drawn(page, s);
    await page.mouse.click(b.x, b.base);
    await expect(weeds).toHaveCount(n - 1);
  }
  expect(await world<[number, number]>(page, 'mine')).toEqual(home);
});

test('a shell is a thumb’s size: a tap just beside its drawn edge picks it up', async ({ page }) => {
  await open(page);
  const shells = page.locator('[data-find="shell"]');
  await expect(shells.first()).toBeAttached();
  const n = await shells.count();
  const b = await drawn(page, '[data-find="shell"]');
  await page.mouse.click(b.x, b.mid + Math.max(b.h / 2, 18)); // below its middle, at the edge of a 44px target
  await expect(shells).toHaveCount(n - 1);
});

test('?hit draws every tap target over the island', async ({ page }) => {
  await open(page, '&hit');
  await expect(page.locator('[data-hit-overlay] i').first()).toBeAttached();
  for (const kind of ['tree', 'bush', 'flower', 'rock', 'shell']) await expect(page.locator(`[data-hit-overlay] [data-hit-kind="${kind}"]`).first()).toBeAttached();
  // each at least 44px
  const small = await page.locator('[data-hit-overlay] i.own').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().width < 43.5 || e.getBoundingClientRect().height < 43.5).length);
  expect(small).toBe(0);
});
