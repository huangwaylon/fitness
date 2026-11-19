// Tap targets (docs/design.md "Taps"): every tappable thing on the island answers a tap on its visible middle and on its
// base, not just its top (the user: "only tapping the top of the trees works; the base of the tree is unresponsive",
// "the tap boxes of items seem very small and typically skewed towards the top"). Each kind is tapped at both points
// and answers there; nothing walks.
import { expect, test, type Page } from './fixtures.ts';
import { careOut, findCount, findsOut, islandUp, quiet, type W3 } from './island.ts';
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
/** A drawn box's middle, its base (a few px up from its foot) and size. */
const spans = (d: { left: number; top: number; width: number; height: number }) => {
  const b = d.top + d.height;
  return { x: d.left + d.width / 2, mid: d.top + d.height / 2, base: b - Math.min(6, d.height * 0.12), w: d.width, h: d.height };
};
/** What a scenery thing draws (`__world3d.drawn(kind, id)`, not its tap area). */
const drawnOf = async (page: Page, kind: BoxKind, id: string) =>
  spans((await page.evaluate(([k, id]) => (window as unknown as { __world3d: W3 }).__world3d.drawn(k, id), [kind, id] as const))!);

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
  /** The first care thing of `kind` (rock, weed) drawn on screen clear of the HUD and the screen's foot, nothing else's
   *  tap area at its foot (a villager on an outing, a flower): its art's box. */
  const onScreen = (kind: string) =>
    page.evaluate((kind) => {
      const w = (window as unknown as { __world3d: W3 }).__world3d;
      return w.care().find((c) => {
        const [x, y] = c.foot;
        return c.kind === kind && c.shown && y >= 200 && y <= innerHeight - 80 && x >= 30 && x <= innerWidth - 30 && !w.pick(x, y);
      })?.box ?? null;
    }, kind);
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
  const rock = await onScreen('rock');
  expect(rock, 'the rock').not.toBeNull();
  await at(spans(rock!), 'scene-clonk', 'the rock');
  // a weed: pulled from a tap at its base
  const weeds = async () => (await careOut(page, 'weed')).length;
  const n = await weeds();
  const s = await onScreen('weed');
  if (s) {
    const b = spans(s);
    await page.mouse.click(b.x, b.base);
    await expect.poll(weeds).toBe(n - 1);
  }
  expect(await world<[number, number]>(page, 'mine')).toEqual(home);
});

test('a shell is a thumb’s size: a tap just beside its drawn edge picks it up', async ({ page }) => {
  await open(page);
  const shells = () => findCount(page, 'shell');
  await expect.poll(shells).toBeGreaterThan(0);
  const n = await shells();
  const b = spans((await findsOut(page, 'shell'))[0].box);
  await page.mouse.click(b.x, b.mid + Math.max(b.h / 2, 18)); // below its middle, at the edge of a 44px target
  await expect.poll(shells).toBe(n - 1);
});

test('?hit draws every tap target over the island', async ({ page }) => {
  await open(page, '&hit');
  await expect(page.locator('[data-hit-overlay] i').first()).toBeAttached();
  for (const kind of ['tree', 'bush', 'flower', 'rock', 'shell']) await expect(page.locator(`[data-hit-overlay] [data-hit-kind="${kind}"]`).first()).toBeAttached();
  // each at least 44px
  const small = await page.locator('[data-hit-overlay] i.own').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().width < 43.5 || e.getBoundingClientRect().height < 43.5).length);
  expect(small).toBe(0);
});
