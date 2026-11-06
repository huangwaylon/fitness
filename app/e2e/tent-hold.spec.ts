// The tent's edit mode holds one thing at a time (docs/design.md "The tent", "Holding"; NH's decorating): while I hold
// a piece, a tap on another one doesn't take it (what I hold shakes its head, and the first few times the bar says
// 「いまの かぐを おいてね」), a drag from another one turns the camera, a tap on the floor puts what I hold there, a long
// press on another one puts what I hold down and takes that one, and a tap off the room puts it down.
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });

const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';
type Piece = { id: string; item: string; x: number; z: number; f: number };
type T = {
  tile(x: number, z: number): [number, number];
  wallPx(wall: number, u: number, y: number): [number, number];
  pieces(): Piece[];
  edit(): { sel: (Piece & { fresh: boolean }) | null; why: string | null; note: string | null } | null;
  still(): boolean;
  isDefault(): boolean;
  fill(codes: string[]): number;
  hit(cx: number, cy: number): { kind: string; id?: string } | null;
};
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const tile = (page: Page, x: number, z: number) => page.evaluate(([x, z]) => (window as unknown as { __tent: T }).__tent.tile(x, z), [x, z] as const);
const sel = (page: Page) => te(page, (t) => t.edit()?.sel ?? null);

/** In the tent's edit mode with the rattan low table (2 × 1) and the log stool standing, both drawn. */
async function room(page: Page) {
  await page.addInitScript(() => localStorage.getItem('hold-t') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('hold-t', '1')));
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await te(page, (t) => t.fill(['f4054', 'f4038']));
  await page.locator('[data-tent-edit-open]').click();
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.still());
  const ps = await te(page, (t) => t.pieces());
  const table = ps.find((p) => p.item === 'f4054')!, stool = ps.find((p) => p.item === 'f4038')!;
  // (their models in: a tap on one is on it)
  for (const p of [table, stool]) {
    const at = await tile(page, p.x, p.z);
    await expect.poll(() => page.evaluate(([a, b]) => (window as unknown as { __tent: T }).__tent.hit(a, b), at)).toEqual({ kind: 'piece', id: p.id });
  }
  return { table, stool };
}

test('holding a piece, a tap on another doesn’t take it: a head-shake and 「いまの かぐを おいてね」 (the first few times); a tap on the floor moves it', async ({ page }) => {
  const { table, stool } = await room(page);
  // nothing held: a tap takes the stool
  let [x, y] = await tile(page, stool.x, stool.z);
  await page.mouse.click(x, y);
  await expect.poll(() => sel(page)).toMatchObject({ id: stool.id });
  // a tap on the table: still the stool, the bar says so
  [x, y] = await tile(page, table.x + 1, table.z);
  await page.mouse.click(x, y);
  await expect(page.locator('[data-note="hold"]')).toHaveText('いまの かぐを おいてね');
  expect(await sel(page)).toMatchObject({ id: stool.id, x: stool.x, z: stool.z });
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/hold-hint.png` });
  // the hint the first three times only (this phone's), then only the head-shake
  for (let i = 0; i < 2; i++) {
    await expect(page.locator('[data-note="hold"]')).toHaveCount(0, { timeout: 4000 });
    await page.mouse.click(x, y);
    await expect(page.locator('[data-note="hold"]')).toBeVisible();
  }
  await expect(page.locator('[data-note="hold"]')).toHaveCount(0, { timeout: 4000 });
  await page.mouse.click(x, y);
  // (proving the hint stays away a while)
  await page.waitForTimeout(400);
  await expect(page.locator('[data-note="hold"]')).toHaveCount(0);
  expect(await sel(page)).toMatchObject({ id: stool.id });
  // a tap on the floor: the stool goes there (still held)
  [x, y] = await tile(page, 6, 5);
  await page.mouse.click(x, y);
  await expect.poll(() => sel(page)).toMatchObject({ id: stool.id, x: 6, z: 5 });
  // a drag from the table turns the camera: neither piece is taken or moved
  [x, y] = await tile(page, table.x, table.z);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y + 10, { steps: 8 });
  await page.mouse.up();
  expect(await te(page, (t) => t.isDefault())).toBe(false);
  expect(await sel(page)).toMatchObject({ id: stool.id, x: 6, z: 5 });
  expect((await te(page, (t) => t.pieces())).find((p) => p.id === table.id)).toMatchObject({ x: table.x, z: table.z });
});

test('a long press on another piece puts what I hold down and takes that one; a tap off the room puts it down', async ({ page }) => {
  const { table, stool } = await room(page);
  let [x, y] = await tile(page, stool.x, stool.z);
  await page.mouse.click(x, y);
  await expect.poll(() => sel(page)).toMatchObject({ id: stool.id });
  [x, y] = await tile(page, 6, 5);
  await page.mouse.click(x, y);
  await expect.poll(() => sel(page)).toMatchObject({ id: stool.id, x: 6, z: 5 });
  // a long press on the table: the stool is put down where it is, the table taken up (the finger drags it on)
  [x, y] = await tile(page, table.x + 1, table.z);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect.poll(() => sel(page)).toMatchObject({ id: table.id });
  await page.mouse.up();
  await expect.poll(async () => (await te(page, (t) => t.pieces())).find((p) => p.id === stool.id)).toMatchObject({ x: 6, z: 5 });
  // let go, no turn: it was a press, not a tap
  expect(await sel(page)).toMatchObject({ id: table.id, f: 0 });
  // a tap off the room (high on the back wall): the table is put down where it is
  [x, y] = await te(page, (t) => t.wallPx(0, 10, 36));
  await page.mouse.click(x, y);
  await expect.poll(() => sel(page)).toBeNull();
  expect((await te(page, (t) => t.pieces())).find((p) => p.id === table.id)).toMatchObject({ x: table.x, z: table.z });
});
