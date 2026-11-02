// The layout editor (docs/island-layout.md "The editor"): the members' desktop editor at /editor/. A move in the
// editor goes out as a layout op at once and a phone (the demo's other tab, as two phones over the relay) holds the
// new layout live; a stroke paints tiles and undo takes it back; the guest is shown the door. The plan is a canvas,
// so the spec finds things through window.__editor (where a tile or a world point is on screen).
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

type E = {
  tileScreen(c: number, r: number): [number, number];
  screenOf(x: number, z: number): [number, number];
  layout(): { objects: Map<string, { x: number; z: number; f: number }>; codes: Uint8Array; kind(c: number, r: number): string };
  issues(): { level: string; code: string }[];
};
const DATE = '2026-11-04T12:00';

async function openEditor(page: Page, q = '') {
  await page.goto(`editor/?demo&date=${DATE}${q}`);
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
  await expect(phone.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
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
  const [gx, gy] = await page.evaluate(() => (window as unknown as { __editor: E }).__editor.tileScreen(12, 30));
  await page.mouse.move(gx, gy);
  await page.mouse.click(gx, gy);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.size)).toBe(before + 1);
  await page.keyboard.press('Escape');
  await page.locator('[data-reset]').click();
  await page.locator('[data-confirm-reset]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.size)).toBe(before);
});

test('the guest is shown the door: the editor is the members’ only', async ({ page }) => {
  await page.goto(`editor/?demo&as=G&date=${DATE}`);
  await expect(page.locator('[data-members-only]')).toBeVisible();
  await expect(page.locator('[data-members-only]')).toContainText('おきゃくさんは そとの へんこうが できません');
  await expect(page.locator('[data-editor]')).toHaveCount(0);
});
