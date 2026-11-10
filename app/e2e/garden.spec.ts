// The garden in the editor (docs/island-layout.md "Fences and the garden"): a run of fence and a patch of tomatoes put
// down by dragging across the plan go out as layout ops at once; the phone's island draws them, the fence's pieces
// joined (its ends end pieces, its middle straights, turned along the run) and the crops as sprouts on their soil; and my
// villager's walk across the fence goes round its end, never through it (layout/nav.ts: a fence takes its tile).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { camTo, islandUp, quiet, tapWorld } from './island.ts';

const DATE = '2026-11-04T12:00';
type E = { tileScreen(c: number, r: number): [number, number]; layout(): { objects: Map<string, { k: string; x: number; z: number }> } };
type Wd = { put(x: number, z: number): void; mine(): [number, number] };

/** Press on a tile of the plan, drag through `via` (tiles), lift on the last. */
async function dragTiles(page: Page, tiles: [number, number][]) {
  const at = (t: [number, number]) => page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), t);
  const [a] = [await at(tiles[0])];
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (const t of tiles.slice(1)) {
    const b = await at(t);
    await page.mouse.move(b[0], b[1], { steps: 4 });
  }
  await page.mouse.up();
}
const kinds = (page: Page, k: string) => page.evaluate((k) => [...(window as unknown as { __editor: E }).__editor.layout().objects.values()].filter((o) => o.k === k).map((o) => [o.x, o.z]), k);

/** The fence: tile column 6, rows 11–15 on まえ's lawn (world x 90–120, z 240–390); the tomatoes at 7–8 × 19–20. */
const FENCE: [number, number][] = [[6, 11], [6, 13], [6, 15]];
const BOX = { x0: 90, x1: 120, z0: 240, z1: 390 };

/** The phone (B) up, and the editor open beside it in the same demo (A): a run of country fence put down by a drag. */
async function withFence(context: BrowserContext): Promise<{ phone: Page; ed: Page }> {
  const phone = await context.newPage();
  await phone.goto(`?demo&as=B&date=${DATE}`);
  await islandUp(phone);
  await phone.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  const ed = await context.newPage();
  await ed.setViewportSize({ width: 1440, height: 900 });
  await ed.goto(`editor/?demo&preview=0&date=${DATE}`);
  await ed.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  // a run of country fence: pressed on one tile and dragged along four more, one action
  await ed.locator('[data-kind="fence-country"]').click();
  await expect(ed.locator('.hint').first()).toBeVisible();
  await dragTiles(ed, FENCE);
  await expect.poll(() => kinds(ed, 'fence-country')).toHaveLength(5);
  expect((await kinds(ed, 'fence-country')).map(([, z]) => z).sort()).toEqual([11, 12, 13, 14, 15]);
  return { phone, ed };
}

test('a fence run and a tomato patch put down in the editor: drawn on the island, the fence joined', async ({ context }) => {
  const { phone, ed } = await withFence(context);
  // a 2 × 2 patch of tomatoes (across, then along: every tile beside the last)
  await ed.locator('[data-kind="crop-tomato"]').click();
  await dragTiles(ed, [[7, 19], [8, 19], [8, 20], [7, 20]]);
  await expect.poll(() => kinds(ed, 'crop-tomato')).toHaveLength(4);
  // one ⌘Z takes the whole patch back, ⌘⇧Z brings it again
  await ed.keyboard.press('Meta+z');
  await expect.poll(() => kinds(ed, 'crop-tomato')).toHaveLength(0);
  await ed.keyboard.press('Meta+Shift+z');
  await expect.poll(() => kinds(ed, 'crop-tomato')).toHaveLength(4);
  await ed.close();

  // the phone has them (the layout ops over the relay), drawn from the garden's models
  await phone.bringToFront();
  const layout = <R,>(fn: string) => phone.evaluate(`window.__layout.${fn}`) as Promise<R>;
  await expect.poll(() => layout<number>("count('fence-country')")).toBe(5);
  await expect.poll(() => layout<number>("count('crop-tomato')")).toBe(4);
  const models = async (k: string) => {
    const ids = await layout<string[]>(`ids('${k}')`);
    return phone.evaluate((ids) => ids.map((id) => (window as unknown as { __world3d: { where(id: string): { model: string } | null } }).__world3d.where(id)?.model ?? null), ids);
  };
  // the fence's ends are NH's end piece, its three middles the straight: joined into one run
  await expect.poll(async () => (await models('fence-country')).sort(), { timeout: 20_000 }).toEqual([
    'garden/fence-country-b', 'garden/fence-country-b', 'garden/fence-country-c', 'garden/fence-country-c', 'garden/fence-country-c'
  ]);
  // the tomatoes are sprouts today (planted today: stage 0), each on its soil
  await expect.poll(async () => (await models('crop-tomato')).sort()).toEqual(Array(4).fill('garden/crop-tomato-0'));
});

test('my villager’s walk across a fence run goes round its end, never through it', async ({ context }) => {
  const { phone, ed } = await withFence(context);
  await ed.close();
  await phone.bringToFront();
  await expect.poll(() => phone.evaluate("window.__layout.count('fence-country')")).toBe(5);
  // my villager west of the fence, a tap east of it
  await quiet(phone);
  await camTo(phone, 300);
  const from: [number, number] = [45, 315], to: [number, number] = [165, 315];
  await phone.evaluate(([x, z]) => (window as unknown as { __world: Wd }).__world.put(x, z), from);
  await tapWorld(phone, ...to, { mouse: true });
  const seen: [number, number][] = [];
  await expect.poll(async () => {
    const p = await phone.evaluate(() => (window as unknown as { __world: Wd }).__world.mine());
    seen.push(p);
    return Math.hypot(p[0] - to[0], p[1] - to[1]);
  }, { timeout: 20_000, intervals: [100] }).toBeLessThan(20);
  for (const [x, z] of seen) expect(x > BOX.x0 + 2 && x < BOX.x1 - 2 && z > BOX.z0 + 2 && z < BOX.z1 - 2, `at ${x}, ${z}: on the fence`).toBe(false);
  // round an end: out past row 11's or row 15's edge
  expect(Math.max(...seen.map(([, z]) => Math.abs(z - 315)))).toBeGreaterThan(60);
});
