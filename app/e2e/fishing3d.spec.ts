// Fishing on the 3D island (?island=3d; docs/design.md "Fishing"): the whole flow in every kind of water, the sea by
// day, the river and the pond at night. A tap by the shadow casts in place; my 3D villager takes out NH's rod and faces
// the float, the line from the rod's tip; the fish nibbles and bites (the float under, the 「！」); a tap reels it in
// and the catch plate names it; the rod goes away. Where the 3D island draws the shadow and the float is where their
// tap areas are (the DOM's nodes, placed through the same camera): a tap on what's drawn is a tap on it.
import { expect, test, type Page } from '@playwright/test';
import { CAMS } from '../src/lib/components/island/world.ts';

test.use({ viewport: { width: 393, height: 852 } });

type W3 = { loaded(): boolean; client(x: number, z: number, lift?: number): [number, number]; where(id: string): { x: number; y: number; z: number; hidden: boolean } | null };
type V3 = { state(slot: string): string | null; tool(slot: string): string | null; tip(slot: string): number[] | null };
const v3 = <R,>(page: Page, fn: (v: V3) => R) => page.evaluate(`(${fn.toString()})(window.__villagers3)`) as Promise<R>;
const SHOTS = process.env.SHOTS;

/** A DOM node's middle and, through the 3D camera, where the island draws the model of the same id (client px). */
const drawnAt = (page: Page, sel: string, prefix: string) => page.evaluate(([sel, prefix]) => {
  const w = (window as unknown as { __world3d: W3 }).__world3d, el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  for (let n = 0; n < 200; n++) {
    const id = prefix.endsWith('-') ? `${prefix}${n}` : prefix, p = w.where(id);
    if (p && !p.hidden) {
      const [cx, cy] = w.client(p.x, -p.z, p.y);
      return { dom: [r.left + r.width / 2, r.top + r.height / 2], model: [cx, cy] };
    }
    if (!prefix.endsWith('-')) break;
  }
  return null;
}, [sel, prefix] as const);
const apart = (a: { dom: number[]; model: number[] } | null) => (a ? Math.hypot(a.dom[0] - a.model[0], a.dom[1] - a.model[1]) : Infinity);

for (const [water, q, cam, sel] of [
  ['sea', '&critter=fish&date=2026-11-04T12:00', null, '[data-critter="fish"]'],
  ['river', '&critter=river&date=2026-11-04T21:00', CAMS.oku, '[data-critter="pond"][data-water="river"]'],
  ['pond', '&critter=pond&date=2026-11-04T21:00', CAMS.oku, '[data-critter="pond"][data-water="pond"]']
] as const) {
  test(`3D fishing in the ${water}: cast, the rod and its line, the bite, the catch`, async ({ page }) => {
    test.setTimeout(90_000);
    // TODO(3D engine): on CI's software GL my villager never takes out the rod (state 'idle', no tool, line 61's poll)
    // though it passes under SwiftShader locally: fixme'd on CI so main deploys while the cause is found
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
    await page.goto(`?demo&visitor=none&island=3d${q}`);
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    if (cam !== null) await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), cam);
    await expect(page.locator(sel)).toBeAttached({ timeout: 10_000 });
    // my villager in 3D (its model in: under CI's software GL that takes a while), else it's a card and holds no rod
    await expect.poll(() => v3(page, (v) => v.state('mine')), { timeout: 30_000 }).not.toBeNull();
    // the shadow drawn where its tap area is (it swims: a few px of lag between the two at most)
    await expect.poll(async () => apart(await drawnAt(page, sel, `fish-${water}-`)), { timeout: 8000 }).toBeLessThan(16);
    // my villager by the water (behind it: never over the shadow on screen), within a line's reach (across the island, the line runs from the bank: no rod in hand)
    {
      const p = await page.evaluate((pre) => { const w = (window as unknown as { __world3d: W3 }).__world3d; for (let n = 0; n < 200; n++) { const q = w.where(`${pre}${n}`); if (q) return [q.x, -q.z]; } return null; }, `fish-${water}-`);
      await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z < 0 ? 20 : z + 45), p!);
      await page.waitForTimeout(300);
    }
    const f = (await drawnAt(page, sel, `fish-${water}-`))!;
    // a tap by the shadow, where it's drawn: the cast, in place
    await page.mouse.click(f.model[0] + 6, f.model[1]);
    await expect(page.locator('[data-bobber]')).toBeAttached({ timeout: 3000 });
    await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
    // NH's rod in my villager's hand, fishing
    await expect.poll(() => v3(page, (v) => [v.tool('mine'), v.state('mine')]), { timeout: 15_000 }).toEqual(['tools/rod', 'fish']);
    expect(await v3(page, (v) => v.tip('mine')?.every(Number.isFinite))).toBe(true);
    await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 4000 });
    // the float on the water where its node is
    await expect.poll(async () => apart(await drawnAt(page, '[data-bobber]', 'bobber')), { timeout: 4000 }).toBeLessThan(16);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/fish3d-${water}-wait.png` });
    await expect(page.locator('[data-bobber="bite"]')).toBeAttached({ timeout: 12_000 });
    await expect(page.locator('[data-bite]')).toHaveText('！');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/fish3d-${water}-bite.png` });
    // the reel: a tap anywhere
    await page.mouse.click(196, 420);
    await expect(page.locator('[data-fx="catch"]')).toContainText('釣', { timeout: 4000 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/fish3d-${water}-catch.png` });
    expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues ?? [])).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
    // the rod put away once the reel's over
    await expect.poll(() => v3(page, (v) => v.tool('mine')), { timeout: 6000 }).toBeNull();
  });
}
