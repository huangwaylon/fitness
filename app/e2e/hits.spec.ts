// Tap targets (docs/design.md "Taps"): every tappable thing on the island answers a tap on its visible middle and on its
// base, not just its top (the user: "only tapping the top of the trees works; the base of the tree is unresponsive",
// "the tap boxes of items seem very small and typically skewed towards the top"). Each kind is tapped at both points
// and answers there; nothing walks.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, quiet, type W3 } from './island.ts';
import type { BoxKind } from '../src/lib/components/island/probe.ts';

test.use({ viewport: { width: 393, height: 852 } });

const world = <T,>(page: Page, fn: string, ...a: number[]) =>
  page.evaluate(([f, a]) => ((window as unknown as { __world: Record<string, (...x: number[]) => unknown> }).__world[f as string](...(a as number[]))) as T, [fn, a] as const);
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues!.splice(0));

async function open(page: Page, q = '') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await islandUp(page);
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
/** The same off `__world3d.drawn(kind, id)` (what a scenery thing draws, not its tap area). */
const drawnOf = async (page: Page, kind: BoxKind, id: string) => {
  const d = (await page.evaluate(([k, id]) => (window as unknown as { __world3d: W3 }).__world3d.drawn(k, id), [kind, id] as const))!;
  const b = d.top + d.height;
  return { x: d.left + d.width / 2, mid: d.top + d.height / 2, base: b - Math.min(6, d.height * 0.12), w: d.width, h: d.height };
};

test('trees answer at their leaves and their base: a goal tree’s popup, an oak’s rustle', async ({ page }) => {
  await open(page);
  const home = await world<[number, number]>(page, 'mine');
  // the goal tree (its tap area, the canopy's and the trunk's: the tree's height): up its canopy, then just above the
  // foot of its trunk
  const g = await page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.box('goal', 'A')!), gx = g.left + g.width / 2;
  for (const y of [g.top + g.height * 0.3, g.top + g.height - Math.min(6, g.height * 0.12)]) {
    await page.mouse.click(gx, y);
    await expect(page.locator('.detail')).toBeVisible();
    await page.waitForTimeout(1300); // not a quick run
    await page.mouse.click(gx, y);
    await expect(page.locator('.detail')).toHaveCount(0);
    await page.waitForTimeout(1300);
  }
  // an oak of the scenery, up the lawn: the leaves' middle and the trunk's foot each rustle it
  await world(page, 'go', 380);
  await page.waitForTimeout(500);
  const leaves = await drawnOf(page, 'tree', 'oak-m1');
  const trunk = await drawnOf(page, 'trunk', 'oak-m1');
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
      const w = (window as unknown as { __world3d: W3 }).__world3d;
      const i = els.findIndex((el) => {
        const r = el.getBoundingClientRect();
        if (!el.checkVisibility({ visibilityProperty: true }) || r.top < 200 || r.bottom > innerHeight - 80 || r.left < 30 || r.right > innerWidth - 30) return false;
        // nothing else stands in front of its middle or its base (a villager on an outing, a flower): no tap area there
        const own = (y: number) => !w.pick(r.left + r.width / 2, y);
        return own(r.top + r.height / 2) && own(r.bottom - Math.min(6, r.height * 0.12));
      });
      return i < 0 ? null : `${sel} >> nth=${i}`;
    }, sel);
  /** The first scenery `kind` drawn on screen so (`drawn`), a tap at its middle and its base its own (`pick`). */
  const shown = (kind: 'bush' | 'flower') =>
    page.evaluate((kind) => {
      const w = (window as unknown as { __world3d: W3 }).__world3d;
      return w.scenery().filter((p) => p.kind === kind).map((p) => p.id).find((id) => {
        const r = w.drawn(kind, id);
        if (!r || r.top < 200 || r.top + r.height > innerHeight - 80 || r.left < 30 || r.left + r.width > innerWidth - 30) return false;
        const own = (y: number) => { const p = w.pick(r.left + r.width / 2, y); return !p || [p, ...p.also].some((t) => t.kind === kind && t.id === id); };
        return own(r.top + r.height / 2) && own(r.top + r.height - Math.min(6, r.height * 0.12));
      }) ?? null;
    }, kind);
  const at = async (b: { x: number; mid: number; base: number }, cue: string, what: string) => {
    for (const y of [b.mid, b.base]) {
      await cues(page);
      await page.mouse.click(b.x, y);
      await expect.poll(() => page.evaluate((c) => (window as { __cues?: string[] }).__cues!.includes(c), cue), { message: `${what} at ${y === b.mid ? 'its middle' : 'its base'}` }).toBe(true);
      await page.waitForTimeout(700);
    }
  };
  for (const [kind, cue] of [['bush', 'scene-bush'], ['flower', 'scene-water']] as const) {
    const id = await shown(kind);
    expect(id, kind).not.toBeNull();
    await at(await drawnOf(page, kind, id!), cue, `${kind} ${id}`);
  }
  const rock = await onScreen('[data-care="rock"]');
  expect(rock, 'the rock').not.toBeNull();
  await at(await drawn(page, rock!), 'scene-clonk', 'the rock');
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
