// The editor's 川の道 (docs/island-layout.md "The river tool", editor/RiverTool.svelte, layout/riverPath.ts): on a
// desktop window with a mouse, R opens it over the plan; a knot dragged a tile at a time (the end pulled to the coast,
// the start to the spring's pond), a click on a segment's "+" adds one, Delete or a right-click takes one away, ⌘Z / ⇧⌘Z
// step its history, a red check holds ✓; ✓ saves the new river as tiles (one action), the other phone has it at once,
// and the editor reopened after a reload derives the same river from the tiles.
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

const Q = 'editor/?demo&preview=0&date=2026-11-04T12:00';
type Knot = { c: number; r: number; pin?: 'fall' };
type R = {
  knots(): Knot[];
  issues(): { kind: string; level: string; ja: string }[];
  ready(): boolean;
  knotScreen(k: number): [number, number] | null;
  plusScreen(k: number): [number, number] | null;
  tileScreen(c: number, r: number): [number, number];
};
const rv = <T,>(page: Page, fn: (r: R) => T) => page.evaluate(`(${fn.toString()})(window.__river)`) as Promise<T>;
const knots = (page: Page) => rv(page, (r) => r.knots());
const ends = async (page: Page) => {
  const k = await knots(page);
  return [k[0], k.at(-1)].map((q) => [q!.c, q!.r]);
};

async function open(page: Page) {
  await page.goto(Q);
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await page.keyboard.press('r');
  await expect(page.locator('[data-river-tool]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __river?: unknown }).__river);
}
/** A mouse drag from one screen point to another, in eight steps. */
async function drag(page: Page, a: readonly [number, number], b: readonly [number, number]) {
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 8, a[1] + ((b[1] - a[1]) * i) / 8);
  await page.mouse.up();
}
const knotAt = async (page: Page, k: number) => (await page.evaluate((k) => (window as unknown as { __river: R }).__river.knotScreen(k), k))!;
const tileAt = (page: Page, c: number, r: number) => page.evaluate(([c, r]) => (window as unknown as { __river: R }).__river.tileScreen(c, r), [c, r] as const);
const plusAt = async (page: Page, k: number) => (await page.evaluate((k) => (window as unknown as { __river: R }).__river.plusScreen(k), k))!;

// the default river's knots: its spring, its fall's two tiles, down column 15, the staircase west, the mouth
const DEFAULT: Knot[] = [{ c: 15, r: 54 }, { c: 15, r: 53, pin: 'fall' }, { c: 15, r: 52, pin: 'fall' }, { c: 15, r: 27 }, { c: 14, r: 27 }, { c: 12, r: 24 }, { c: 2, r: 24 }];

test('knots: hover, insert with "+", delete with Delete and a right-click, ⌘Z / ⇧⌘Z; the end snaps to the sea; red holds ✓', async ({ page }) => {
  await open(page);
  expect(await knots(page)).toEqual(DEFAULT);
  const save = page.locator('[data-river-save]');
  await expect(save).toBeDisabled();
  await expect.poll(() => rv(page, (r) => r.ready())).toBe(true);
  await expect(page.locator('[data-river-chip]')).toHaveText('OK');
  const plan = page.locator('[data-river-plan]');

  // hover: a knot is grabbed, a "+" adds
  const k5 = await knotAt(page, 5);
  await page.mouse.move(k5[0], k5[1]);
  await expect(plan).toHaveCSS('cursor', 'grab');
  const p5 = await plusAt(page, 5);
  await page.mouse.move(p5[0], p5[1]);
  await expect(plan).toHaveCSS('cursor', 'copy');

  // a click on the last segment's "+": a knot there (the river unchanged: on its own line)
  await page.mouse.click(p5[0], p5[1]);
  await expect.poll(async () => (await knots(page)).length).toBe(8);
  expect((await knots(page))[6]).toEqual({ c: 7, r: 24 });
  await page.keyboard.press('Meta+z');
  await expect.poll(async () => (await knots(page)).length).toBe(7);
  await page.keyboard.press('Meta+Shift+z');
  await expect.poll(async () => (await knots(page)).length).toBe(8);
  // clicked (selected): Delete takes it away
  const k6 = await knotAt(page, 6);
  await page.mouse.click(k6[0], k6[1]);
  await page.keyboard.press('Delete');
  await expect.poll(async () => (await knots(page)).length).toBe(7);
  // a right-click on the staircase's knot takes it away; ⌘Z brings it back
  const k4 = await knotAt(page, 4);
  await page.mouse.click(k4[0], k4[1], { button: 'right' });
  await expect.poll(async () => (await knots(page)).length).toBe(6);
  await page.locator('[data-river-undo]').click();
  await expect.poll(() => knots(page)).toEqual(DEFAULT);

  // the end dragged inland by the north-west beach: pulled to the coast tile by the sea
  await drag(page, await knotAt(page, 6), await tileAt(page, 4, 20));
  await expect.poll(() => ends(page)).toEqual([[15, 54], [2, 20]]);
  // that way runs under K.K.'s stool: red, ✓ held
  await expect.poll(() => rv(page, (r) => r.issues().filter((i) => i.level === 'red').map((i) => i.kind))).toContain('blocked');
  await expect(page.locator('[data-river-chip]')).toHaveClass(/red/);
  await expect(save).toBeDisabled();
  await page.keyboard.press('Meta+z');
  await expect.poll(() => knots(page)).toEqual(DEFAULT);

  // the start dragged below the spring: pulled to a tile by its pond
  await drag(page, await knotAt(page, 0), await tileAt(page, 14, 57));
  await expect.poll(() => ends(page)).toEqual([[14, 56], [2, 24]]);
  // Esc: the tool shut, nothing saved
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-river-tool]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __layout: { kind(c: number, r: number): string } }).__layout.kind(5, 24))).toBe('river');
});

test('✓ saves the river to the east coast: one burst, the partner has it, the bridge moved; reloaded, the same river', async ({ context }) => {
  const partner = await context.newPage();
  await partner.goto('?demo&as=B&date=2026-11-04T12:00');
  await partner.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  const page = await context.newPage();
  await open(page);
  const kind = (p: Page, c: number, r: number) => p.evaluate(([c, r]) => (window as unknown as { __layout: { kind(c: number, r: number): string } }).__layout.kind(c, r), [c, r] as const);

  // the staircase's two knots away, the end to the beach at (16, 20), and a knot from the last "+" to (15, 20)
  for (const k of [5, 4]) {
    const at = await knotAt(page, k);
    await page.mouse.click(at[0], at[1], { button: 'right' });
  }
  await expect.poll(async () => (await knots(page)).length).toBe(5);
  await drag(page, await knotAt(page, 4), await tileAt(page, 16, 20));
  await drag(page, await plusAt(page, 3), await tileAt(page, 15, 20));
  await expect.poll(() => knots(page)).toEqual([...DEFAULT.slice(0, 4), { c: 15, r: 20 }, { c: 16, r: 20 }]);
  await expect.poll(() => rv(page, (r) => r.ready())).toBe(true);
  expect(await rv(page, (r) => r.issues().filter((i) => i.level === 'red'))).toEqual([]);
  const save = page.locator('[data-river-save]');
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.locator('[data-river-tool]')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('川を変えました（橋を1つ動かしました）');
  expect(await kind(page, 16, 20)).toBe('river');

  // the partner's island: the new river, the old reach land, the bridge across the new water
  await expect.poll(() => kind(partner, 16, 20), { timeout: 10_000 }).toBe('river');
  expect(await kind(partner, 5, 24)).toBe('grass');
  expect(await kind(partner, 9, 24)).toBe('dirt');
  expect(await partner.evaluate(() => (window as unknown as { __layout: { obj(id: string): { x: number; z: number; f: number } } }).__layout.obj('bridge'))).toMatchObject({ x: 14, z: 24, f: 1 });
  // its ground rebuilt from the fields' worker and swapped in (Island3D's layout listener: no long task on the phone)
  await expect.poll(() => partner.evaluate(() => (window as unknown as { __world3d: { groundRev(): number } }).__world3d.groundRev()), { timeout: 10_000 }).toBeGreaterThan(0);

  // reloaded: the tool reads the same river from the tiles
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await expect.poll(() => kind(page, 16, 20)).toBe('river');
  await page.keyboard.press('r');
  await page.waitForFunction(() => (window as unknown as { __river?: unknown }).__river);
  await expect.poll(() => ends(page)).toEqual([[15, 54], [16, 20]]);
  await expect.poll(() => rv(page, (r) => r.ready())).toBe(true);
  await expect(page.locator('[data-river-chip]')).toHaveText('OK');
  await expect(page.locator('[data-river-save]')).toBeDisabled();
});
