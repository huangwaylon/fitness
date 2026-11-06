// The layout editor (docs/island-layout.md "The editor"): the members' desktop editor at /editor/. A move in the
// editor goes out as a layout op at once and a phone (the demo's other tab, as two phones over the relay) holds the
// new layout live; a stroke paints tiles and undo takes it back; the guest is shown the door. The plan is a canvas,
// so the spec finds things through window.__editor (where a tile or a world point is on screen). The 3D preview is off
// (`preview=0`): CI's headless Chromium draws WebGL in software, a frame every few seconds, and it starves the page.
import { expect, test, type Page } from './fixtures.ts';
import { hudMenu } from './hud.ts';

test.use({ viewport: { width: 1440, height: 900 } });

type E = {
  tileScreen(c: number, r: number): [number, number];
  screenOf(x: number, z: number): [number, number];
  layout(): { objects: Map<string, { x: number; z: number; f: number }>; codes: Uint8Array; kind(c: number, r: number): string };
  issues(): { level: string; code: string }[];
};
const DATE = '2026-11-04T12:00';

async function openEditor(page: Page, q = '') {
  await page.goto(`editor/?demo&preview=0&date=${DATE}${q}`);
  await expect(page.locator('[data-editor]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
}
async function dragTile(page: Page, from: [number, number], to: [number, number]) {
  const a = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), from);
  const b = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), to);
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1] + ((b[1] - a[1]) * i) / 6);
  await page.mouse.up();
}
const objAt = (page: Page, id: string) =>
  page.evaluate((id) => {
    const o = (window as unknown as { __editor: E }).__editor.layout().objects.get(id);
    return o ? [o.x, o.z] : null;
  }, id);

test('a move in the editor reaches a phone live (the layout op over the relay), and stays', async ({ context }) => {
  const editor = await context.newPage(), phone = await context.newPage();
  await phone.goto(`?demo&as=B&date=${DATE}&critter=none`);
  await expect(hudMenu(phone)).toBeVisible();
  await phone.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  await openEditor(editor);
  await editor.bringToFront();
  // the tape deck (a 1 × 1 piece by the villagers): drag it two tiles across and one back
  const from = (await objAt(editor, 'tape-deck'))!;
  await dragTile(editor, from as [number, number], [from[0] + 2, from[1] + 1]);
  await expect.poll(() => objAt(editor, 'tape-deck')).toEqual([from[0] + 2, from[1] + 1]);
  // the phone (the other player's tab) has it where the editor put it: its middle on the new tile
  const want = [-90 + (from[0] + 2) * 30 + 15, -90 + (from[1] + 1) * 30 + 15];
  await expect.poll(() => phone.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] | null } }).__layout.pos('tape-deck'))).toEqual(want);
  // kept: the editor opened again has it there
  await editor.reload();
  await editor.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await expect.poll(() => objAt(editor, 'tape-deck')).toEqual([from[0] + 2, from[1] + 1]);
});

test('paint a stroke of sand, take it back with ⌘Z; R turns a bench; Delete never takes a goal tree', async ({ page }) => {
  await openEditor(page);
  const kind = (c: number, r: number) => page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.layout().kind(c, r), [c, r] as const);
  expect(await kind(5, 14)).toBe('grass');
  await page.getByRole('button', { name: 'ぬる' }).click();
  await page.locator('[data-brush="sand"]').click();
  await dragTile(page, [5, 14], [7, 14]);
  await expect.poll(() => kind(6, 14)).toBe('sand');
  expect(await kind(5, 14)).toBe('sand');
  await page.keyboard.press('Meta+z');
  await expect.poll(() => kind(6, 14)).toBe('grass');
  await page.keyboard.press('Meta+Shift+z');
  await expect.poll(() => kind(6, 14)).toBe('sand');
  // a bench: select it, R turns it a quarter
  await page.getByRole('button', { name: 'えらぶ' }).click();
  const bench = (await objAt(page, 'bench-mae'))!;
  const [bx, by] = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), bench as [number, number]);
  await page.mouse.click(bx, by);
  await expect(page.locator('[data-inspect]')).toContainText('ベンチ');
  await page.keyboard.press('r');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.get('bench-mae')!.f)).toBe(1);
  // a goal tree is never deleted
  const tree = (await objAt(page, 'goal-A'))!;
  const [tx, ty] = await page.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), tree as [number, number]);
  await page.mouse.click(tx, ty);
  await page.keyboard.press('Delete');
  await expect(page.getByRole('status')).toContainText('けせません');
  expect(await objAt(page, 'goal-A')).not.toBeNull();
});

test('place from the palette; the check shows a tree in the river; reset to the default (behind a confirm)', async ({ page }) => {
  await openEditor(page);
  await page.locator('[data-kind="oak"]').click();
  // on the river (the stream down the middle's east side) it can't go
  const [rx, ry] = await page.evaluate(() => (window as unknown as { __editor: E }).__editor.tileScreen(15, 30));
  await page.mouse.move(rx, ry);
  await page.mouse.click(rx, ry);
  await expect(page.getByRole('status')).toContainText('おけません');
  // on the lawn it goes
  const before = await page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.size);
  const [gx, gy] = await page.evaluate(() => (window as unknown as { __editor: E }).__editor.tileScreen(12, 20));
  await page.mouse.move(gx, gy);
  await page.mouse.click(gx, gy);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.size)).toBe(before + 1);
  await page.keyboard.press('Escape');
  await page.locator('[data-reset]').click();
  await page.locator('[data-confirm-reset]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.size)).toBe(before);
});

test('the museum: on the palette (greyed while it stands, one to an island), picked up and moved, R turns it, never deleted', async ({ page }) => {
  await openEditor(page);
  await expect(page.locator('[data-kind="museum"]')).toBeDisabled();
  // (the whole island in view: the museum's at its back)
  await page.keyboard.press('0');
  const from = (await objAt(page, 'museum'))! as [number, number];
  // a drag from a tile inside it moves it by as many tiles (forward: room on the grid to turn it there)
  await dragTile(page, [from[0] + 3, from[1] + 1], [from[0] + 2, from[1] - 4]);
  await expect.poll(() => objAt(page, 'museum')).toEqual([from[0] - 1, from[1] - 5]);
  const f = () => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.get('museum')?.f);
  await page.keyboard.press('r');
  await expect.poll(f).toBe(1);
  await page.keyboard.press('Delete');
  await expect(page.getByRole('status')).toContainText('けせません');
  expect(await objAt(page, 'museum')).not.toBeNull();
});

test('the shop: on the palette (greyed while it stands, one to an island), picked up and moved, R turns it, never deleted', async ({ page }) => {
  await openEditor(page);
  await expect(page.locator('[data-kind="shop"]')).toBeDisabled();
  await page.keyboard.press('0');
  const from = (await objAt(page, 'shop'))! as [number, number];
  // a drag from a tile inside it moves it by as many tiles (one row back)
  await dragTile(page, [from[0] + 3, from[1] + 1], [from[0] + 3, from[1] + 2]);
  await expect.poll(() => objAt(page, 'shop')).toEqual([from[0], from[1] + 1]);
  const f = () => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.get('shop')?.f);
  await page.keyboard.press('r');
  await expect.poll(f).toBe(1);
  await page.keyboard.press('Delete');
  await expect(page.getByRole('status')).toContainText('けせません');
  expect(await objAt(page, 'shop')).not.toBeNull();
});

type PhoneLayout = { kind(c: number, r: number): string; pos(id: string): [number, number] | null };
const phoneKind = (page: Page, c: number, r: number) => page.evaluate(([c, r]) => (window as unknown as { __layout: PhoneLayout }).__layout.kind(c, r), [c, r] as const);
const farEnd = (page: Page) => page.evaluate(() => (window as unknown as { __world3d: { limits(): { max: number } } }).__world3d.limits().max);
const readout = (page: Page) => page.locator('[data-size-readout]');

test('しまの おおきさ: the back two rows out reaches a phone live (its camera’s far end further back); ⌘Z takes it back', async ({ context }) => {
  const editor = await context.newPage(), phone = await context.newPage();
  await phone.goto(`?demo&as=B&date=${DATE}&critter=none`);
  await expect(hudMenu(phone)).toBeVisible();
  await phone.waitForFunction(() => (window as unknown as { __layout?: unknown; __world3d?: { loaded(): boolean } }).__layout && (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded());
  const far0 = await farEnd(phone);
  await openEditor(editor);
  await editor.bringToFront();
  await expect(readout(editor)).toHaveText('15 × 57');
  // the island can't grow at the front (the sea kept round it), it can at the back
  await expect(editor.locator('[data-resize="front"][data-by="1"]')).toBeDisabled();
  const grow = editor.locator('[data-resize="back"][data-by="1"]');
  // hovered: the new coast's ghost on the plan
  await grow.hover();
  await editor.keyboard.press('0');
  if (process.env.SHOTS) await editor.screenshot({ path: `${process.env.SHOTS}/editor-grow-ghost.png` });
  await grow.click();
  await grow.click();
  await expect(readout(editor)).toHaveText('15 × 59');
  // the phone has the new rows (the clifftop's beach two rows on), and its camera goes further back
  await expect.poll(() => phoneKind(phone, 9, 60)).toBe('sand');
  expect(await phoneKind(phone, 9, 59)).toBe('grass');
  await phone.bringToFront();
  await expect.poll(() => farEnd(phone)).toBeGreaterThan(far0 + 40);
  if (process.env.SHOTS) {
    await phone.evaluate(() => (window as unknown as { __world3d: { go(z: number): void } }).__world3d.go(99999));
    await phone.waitForTimeout(1500);
    await phone.screenshot({ path: `${process.env.SHOTS}/phone-grown-back.png` });
  }
  // ⌘Z twice: the island as it was, on the phone too
  await editor.bringToFront();
  await editor.keyboard.press('Meta+z');
  await editor.keyboard.press('Meta+z');
  await expect(readout(editor)).toHaveText('15 × 57');
  await expect.poll(() => phoneKind(phone, 9, 59)).toBe('sea');
  await phone.bringToFront();
  await expect.poll(() => farEnd(phone)).toBeLessThan(far0 + 1);
});

test('しまの おおきさ: a pull blocked by a home lists what’s in the way (a click selects it); うごかす moves the pieces in, one ⌘Z', async ({ page }) => {
  await openEditor(page);
  await page.keyboard.press('0');
  // うめ's home a tile west, onto the beach's column: the west pulled in a tile takes its tiles
  const home = (await objAt(page, 'home-B'))! as [number, number];
  await dragTile(page, [home[0], home[1] + 1], [home[0] - 1, home[1] + 1]);
  await expect.poll(() => objAt(page, 'home-B')).toEqual([home[0] - 1, home[1]]);
  await page.locator('[data-resize="left"][data-by="-1"]').click();
  const list = page.locator('[data-resize-blocked]');
  await expect(list).toBeVisible();
  await expect(readout(page)).toHaveText('15 × 57');
  await expect(list.locator('[data-blocker="home-B"]')).toContainText('★');
  // a click selects it (the inspector shows the home)
  await list.locator('[data-blocker="home-B"]').click();
  await expect(page.locator('[data-inspect]')).toContainText('home-B');
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/editor-blocked-home.png` });
  // the shop (7 wide) has nowhere near to go: うごかす leaves it all as it was, the shop marked
  await page.locator('[data-resize-move]').click();
  await expect(list.locator('[data-blocker="shop"]')).toContainText('うごかせない');
  await expect(readout(page)).toHaveText('15 × 57');
  await list.getByRole('button', { name: 'やめる' }).click();
  await expect(list).toHaveCount(0);
  await page.keyboard.press('Meta+z');
  await expect.poll(() => objAt(page, 'home-B')).toEqual(home);
  // the front pulled in: the sandcastle (summer's, never deleted) in the way, moved in by うごかす; one ⌘Z undoes both
  const castle = (await objAt(page, 'sandcastle'))!;
  await page.locator('[data-resize="front"][data-by="-1"]').click();
  await expect(list.locator('[data-blocker="sandcastle"]')).toBeVisible();
  await page.locator('[data-resize-move]').click();
  await expect(readout(page)).toHaveText('15 × 56');
  await expect(list).toHaveCount(0);
  expect(await objAt(page, 'sandcastle')).not.toEqual(castle);
  await page.keyboard.press('Meta+z');
  await expect(readout(page)).toHaveText('15 × 57');
  await expect.poll(() => objAt(page, 'sandcastle')).toEqual(castle);
});

test('the guest is shown the door: the editor is the members’ only', async ({ page }) => {
  await page.goto(`editor/?demo&as=G&date=${DATE}`);
  await expect(page.locator('[data-members-only]')).toBeVisible();
  await expect(page.locator('[data-members-only]')).toContainText('おきゃくさんは そとの へんこうが できません');
  await expect(page.locator('[data-editor]')).toHaveCount(0);
});
