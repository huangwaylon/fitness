// The tent (docs/design.md "The tent"): the campsite's door opens its inside, NH's largest room in 3D, as a screen of
// its own: the room's code and three.js come only then (the island never loads them); my villager walks where the
// floor is tapped; the doormat and ‹ 島へ go back out, to the island as it was.
import { expect, test, type Page } from '@playwright/test';
import { camTo, campDoor, geo, is3d, tapOn } from './island.ts';

/** The edit tray open, and the room re-centred above it (a tap's px only holds once the camera is at rest). */
async function openEdit(p: Page) {
  await p.locator('[data-tent-edit-open]').click();
  await settled(p);
}
/** The camera at rest, framed for the bar as it is now (taking a piece from the tray, placing one change the bar, and
 *  the room re-centres under it). */
const settled = (p: Page) => p.waitForFunction(() => (window as unknown as { __tent: { still(): boolean } }).__tent.still());

/** Where a villager stands just out of the tent (buildings.ts outOfTent): ±12 of the door, 30 in front. */
const OUT = (door: readonly [number, number], who: 'A' | 'B') => [door[0] + (who === 'A' ? -12 : 12), door[1] - 30] as const;
/** The camera at おく, the campsite's end (world.ts CAMS as the page has them), held there and the island at rest
 *  (camTo: a camera put there before the scene's own fit was overridden by it on a loaded runner, the door off screen). */
const oku = async (page: Page) => camTo(page, (await geo(page)).CAMS.oku);

/** A tap on the tent where it is the tent's (a villager may stand in front of its door). */
async function tapTent(p: Page) {
  await tapOn(p, p.locator('[data-building="campsite"] .door'));
}

test.use({ viewport: { width: 390, height: 844 } });

type T = { stats(): { frames: number; calls: number; tris: number; dpr: number; queued: boolean }; still(): boolean; mine(): [number, number]; walking(w: string): boolean; px(x: number, z: number, y?: number): [number, number]; loading(): number };
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';

/** My villager a few steps from the campsite's door, off it (back out, it stands at the door, and a tap there would be
 *  its; from home the walk up is ~6 s, over 10 under CI's software GL with three workers drawing). */
const nearDoor = (page: Page, door: readonly [number, number]) =>
  page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), [door[0] + 70, door[1] - 40] as const);

/** Into the tent from the island: the camera up to the campsite, my villager near its door, the door tapped. */
async function enter(page: Page) {
  await page.goto(Q);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await oku(page);
  await nearDoor(page, campDoor(await geo(page)));
  await page.waitForTimeout(300);
  await tapTent(page);
  // (my villager walks up to the door first)
  await expect(page).toHaveURL(/\/tent\?/, { timeout: 10_000 });
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  // the door's iris has opened
  await expect(page.locator('html')).not.toHaveAttribute('data-door', /./, { timeout: 4000 });
}

test('the tent opens through the door and goes back out to the island as it was', { tag: '@smoke' }, async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.url().endsWith('.js')) scripts.push((await r.text().catch(() => '')).includes('WebGLRenderer') ? 'three' : 'other');
  });
  await page.goto(Q);
  await is3d(page);
  await oku(page);
  const door = campDoor(await geo(page));
  await nearDoor(page, door);
  await page.waitForTimeout(300);
  const cam = await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam());
  await tapTent(page);
  // (my villager walks up to the door first)
  await expect(page).toHaveURL(/\/tent\?/, { timeout: 10_000 });
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  expect(scripts).toContain('three');
  await expect(page.locator('html')).not.toHaveAttribute('data-door', /./, { timeout: 4000 });
  // the device pixel ratio is capped (the iPhone 13 profile is 3)
  expect((await tent(page, (t) => t.stats())).dpr).toBeLessThanOrEqual(2);
  // out by the doormat (the front edge's middle)
  const [x, y] = await tent(page, (t) => t.px(0, 36.5));
  await page.mouse.click(x, y);
  await expect(page).toHaveURL(/\/fitness\/\?/);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  // (the camera where it was: the island puts its scroll back as it lays out, just after its hook is up)
  await expect.poll(async () => Math.abs((await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam())) - cam), { timeout: 2000 }).toBeLessThan(2);
  // my villager just outside the tent's door
  await expect.poll(async () => {
    const [mx, mz] = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
    return Math.hypot(mx - OUT(door, 'A')[0], mz - OUT(door, 'A')[1]);
  }).toBeLessThan(2);
  await expect(page.locator('[data-tent]')).toHaveCount(0);
});

test('a tap on the floor walks my villager there; ‹ 島へ goes back out; nothing is drawn while nothing moves', { tag: '@smoke' }, async ({ page }) => {
  await enter(page);
  await page.waitForFunction(() => !(window as unknown as { __tent: { walking(w: string): boolean } }).__tent.walking('A'));
  const [x, y] = await tent(page, (t) => t.px(25, -20));
  await page.mouse.click(x, y);
  await page.waitForTimeout(200);
  expect(await tent(page, (t) => t.walking('A'))).toBe(true);
  await page.waitForFunction(() => !(window as unknown as { __tent: { walking(w: string): boolean } }).__tent.walking('A'), null, { timeout: 5000 });
  const [mx, mz] = await tent(page, (t) => t.mine());
  expect(Math.hypot(mx - 25, mz + 20)).toBeLessThan(1.5);
  // still: no frames (once the room is all in and at rest: on a slow GPU, CI's software GL, its models may still be
  // loading and popping in when the walk ends)
  await page.waitForFunction(() => {
    const t = (window as unknown as { __tent: T }).__tent;
    return !t.loading() && t.still() && !t.walking('A') && !t.stats().queued;
  });
  const f0 = (await tent(page, (t) => t.stats())).frames;
  await page.waitForTimeout(600); // (proving nothing runs for a while)
  // (but a 3D villager's blink: its face shut, then open, a frame each: tent/engine.ts's blinks)
  expect((await tent(page, (t) => t.stats())).frames).toBeLessThanOrEqual(f0 + 2);
  // a drag turns the camera round the room (it walks nobody); the home button brings NH's view back
  const [cx, cy] = await tent(page, (t) => t.px(-20, 10));
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 120, cy + 20, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => (window as unknown as { __tent: { isDefault(): boolean } }).__tent.isDefault())).toBe(false);
  expect(await tent(page, (t) => t.walking('A'))).toBe(false);
  await page.locator('[data-tent-reset]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tent: { isDefault(): boolean } }).__tent.isDefault())).toBe(true);
  await expect(page.locator('[data-tent-reset]')).toHaveCount(0);
  await page.getByRole('button', { name: '島へ' }).click();
  await expect(page).toHaveURL(/\/fitness\/\?/);
});

type Piece = { id: string; item: string; x: number; z: number; f: number };
type E = { tile(x: number, z: number): [number, number]; pieces(): Piece[]; edit(): { sel: (Piece & { fresh: boolean }) | null; why: string | null } | null; surfaces(): { wall: string | null; floor: string | null } };
const te = <R,>(page: Page, fn: (t: E) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const tile = (page: Page, x: number, z: number) => page.evaluate(([x, z]) => (window as unknown as { __tent: E }).__tent.tile(x, z), [x, z] as const);

test('edit: place a piece from the tray, turn it, drag it, put it away; the wallpaper; red where it can’t go; kept across a reload', async ({ page }) => {
  // (a long one: the room loaded more than once, on CI's software GL ~25 s of a 30 s budget)
  test.setTimeout(60_000);
  await enter(page);
  await page.evaluate(() => localStorage.removeItem('island-demo.tent'));
  await openEdit(page);
  await expect(page.locator('[data-tent-count]')).toHaveText('0/40');
  // the camping cot (2 × 1) as a ghost, tapped over to the back row, turned a quarter, placed
  await page.locator('[data-tent-item="f4081"]').click();
  expect((await te(page, (t) => t.edit()))?.sel).toMatchObject({ item: 'f4081', fresh: true, f: 0 });
  await settled(page);
  // (a 2 × 1 piece's middle on the line between tiles 1 and 2: tiles 1–2 of row 1)
  let [x, y] = await tent(page, (t) => t.px(-20, -25));
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel)).toMatchObject({ x: 1, z: 1 });
  // ↻ turns it a quarter clockwise (seen from above: facing 0 → 3); so does a tap on it, the next quarter
  await page.locator('[data-act="turn"]').click();
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.f)).toBe(3);
  const g = await te(page, (t) => t.edit()!.sel!);
  [x, y] = await tile(page, g.x, g.z);
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.f)).toBe(2);
  // and a drag doesn't turn it (back to facing 3 with ↻ ×3)
  for (let i = 0; i < 3; i++) await page.locator('[data-act="turn"]').click();
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.f)).toBe(3);
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces())).toEqual([expect.objectContaining({ item: 'f4081', f: 3 })]);
  const placed = (await te(page, (t) => t.pieces()))[0];
  await expect(page.locator('[data-tent-count]')).toHaveText('1/40');
  await settled(page);
  // a finger on it drags it, a tile at a time, and ✓ puts it there
  [x, y] = await tile(page, placed.x, placed.z);
  const [x2, y2] = await tile(page, 6, 1);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move((x + x2) / 2, (y + y2) / 2, { steps: 4 });
  await page.mouse.move(x2, y2, { steps: 4 });
  await page.mouse.up();
  const held = (await te(page, (t) => t.edit()?.sel))!;
  expect(held.id).toBe(placed.id);
  expect(held.x).toBeGreaterThanOrEqual(5);
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces()[0].x)).toBe(held.x);
  // the doorway stays clear: a tap there leaves the stool where it was, the bar says why
  await page.locator('[data-tent-item="f4038"]').click();
  const stool = (await te(page, (t) => t.edit()!.sel!));
  await settled(page);
  [x, y] = await tile(page, 3, 7);
  await page.mouse.click(x, y);
  await expect(page.locator('[data-note="door"]')).toBeVisible();
  expect(await te(page, (t) => t.edit()!.sel!)).toMatchObject({ x: stool.x, z: stool.z });
  await expect(page.locator('[data-act="place"]')).not.toHaveAttribute('aria-disabled', 'true');
  // dragged there: red, the bar says why, ✓ greyed
  [x, y] = await tile(page, stool.x, stool.z);
  const [dx, dy] = await tile(page, 3, 7);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(dx, dy, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-why="door"]')).toBeVisible();
  await expect(page.locator('[data-act="place"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-act="cancel"]').click();
  // a wallpaper is on the walls at once
  await page.locator('[data-tab="wall"]').click();
  const wall = await page.locator('[data-tent-item]').nth(3).getAttribute('data-tent-item');
  await page.locator(`[data-tent-item="${wall}"]`).click();
  await expect.poll(() => te(page, (t) => t.surfaces().wall)).toBe(wall);
  await page.locator('[data-tent-done]').click();
  // kept: the room is the same after a reload
  await page.reload();
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect.poll(() => te(page, (t) => t.pieces().map((p) => p.item))).toEqual(['f4081']);
  expect(await te(page, (t) => t.surfaces().wall)).toBe(wall);
  // put away: picked up, 🗑, gone (とりけす on the banner)
  await openEdit(page);
  const p = (await te(page, (t) => t.pieces()))[0];
  [x, y] = await tile(page, p.x, p.z);
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.id)).toBe(p.id);
  await page.locator('[data-act="remove"]').click();
  await expect.poll(() => te(page, (t) => t.pieces())).toEqual([]);
  await expect(page.getByRole('button', { name: 'とりけす' })).toBeVisible();
});

test('みつけた: what either of us found in a balloon that NH has a model of, newest first, placeable like the rest', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T11:00:00+09:00');
    const ev = (i: number, id: string, person: 'A' | 'B') => ({ id: `seed-${i}`, type: 'find', data: { kind: 'item', id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person });
    // the froggy chair has no model here: it isn't offered
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: [ev(0, 'exercise-bike', 'A'), ev(1, 'froggy-chair', 'B'), ev(2, 'treadmill', 'B')] }));
    localStorage.removeItem('island-demo.tent');
  });
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await openEdit(page);
  await page.locator('[data-tab="finds"]').click();
  await expect(page.locator('[data-tent-item]')).toHaveCount(2);
  expect(await page.locator('[data-tent-item]').evaluateAll((els) => els.map((e) => e.getAttribute('data-tent-item')))).toEqual(['f290', 'f287']);
  await expect(page.locator('[data-tent-item="f287"]')).toHaveAccessibleName('エクササイズバイク');
  await page.locator('[data-tent-item="f287"]').click();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces().map((p) => p.item))).toEqual(['f287']);
});

type Placed = { id: string; x: number; z: number; f: number; y: number };
const placedOf = (page: Page) => page.evaluate(() => (window as unknown as { __tent: { placed(): Placed[] } }).__tent.placed());

test('on a table: a small thing stands on its top, rides along when the table moves, and the table won’t go away under it', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('island-demo.tent'));
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await openEdit(page);
  // the rattan low table (2 × 1) on tiles 1–2 of row 1
  await page.locator('[data-tent-item="f4054"]').click();
  await settled(page);
  let [x, y] = await tent(page, (t) => t.px(-20, -25));
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel)).toMatchObject({ x: 1, z: 1 });
  await page.locator('[data-act="place"]').click();
  const table = (await te(page, (t) => t.pieces()))[0];
  // the rattan table lamp (small) over the table's right tile: on it
  await page.locator('[data-tent-item="f4050"]').click();
  await settled(page);
  [x, y] = await tile(page, 2, 1);
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => (t.edit()?.sel as { on?: string } | null)?.on)).toBe(table.id);
  await page.locator('[data-act="place"]').click();
  await expect.poll(async () => (await te(page, (t) => t.pieces())).find((p) => p.item === 'f4050')).toMatchObject({ on: table.id, x: 1, z: 0 });
  const lamp = (await te(page, (t) => t.pieces())).find((p) => p.item === 'f4050')!;
  let at = (await placedOf(page)).find((p) => p.id === lamp.id)!;
  expect([at.x, at.z]).toEqual([2, 1]);
  expect(at.y).toBeGreaterThan(2);
  await settled(page);
  // the table dragged to tiles 5–6: the lamp goes with it (slot 1: tile 6)
  [x, y] = await tile(page, 1, 1);
  const [x2, y2] = await tile(page, 5, 1);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.id)).toBe(table.id);
  await page.locator('[data-act="place"]').click();
  await expect.poll(async () => (await placedOf(page)).find((p) => p.id === lamp.id)).toMatchObject({ x: 6, z: 1 });
  await settled(page);
  // put away with the lamp on it: no (NH's way), the bar says so
  [x, y] = await tile(page, 5, 1);
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel?.id)).toBe(table.id);
  await page.locator('[data-act="remove"]').click();
  await expect(page.getByText('うえの ものを さきに しまってね')).toBeVisible();
  expect((await te(page, (t) => t.pieces())).length).toBe(2);
  // nor does the lamp block the floor: a walk goes round the table, not round a lamp
  at = (await placedOf(page)).find((p) => p.id === lamp.id)!;
  expect(at.y).toBeGreaterThan(2);
});

type Use = { seat(): { id: string; n: number; lie: boolean } | null; lights(): { room: boolean; pieces: { id: string; on: boolean }[] }; fill(codes: string[]): number };
const use = <R,>(page: Page, fn: (t: Use & E & T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

test('sit, lie and switch: a tap on a chair walks my villager up and sits it, on a cot it lies, on the floor it gets up; a lamp and the room’s light switch, kept', async ({ page }) => {
  await page.addInitScript(() => localStorage.getItem('tent-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('tent-seeded', '1')));
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  // the log chair, the camping cot and the lantern, on free spots in the room's middle
  expect(await use(page, (t) => t.fill(['f4039', 'f4081', 'f1432']))).toBe(3);
  await page.waitForFunction(() => (window as unknown as { __tent: { loading(): number } }).__tent.loading() === 0);
  const ps = await use(page, (t) => t.pieces());
  const id = (item: string) => ps.find((p) => p.item === item)!.id;
  const tapPiece = async (item: string) => {
    const p = ps.find((q) => q.item === item)!;
    const [x, y] = await tile(page, p.x, p.z);
    await page.mouse.click(x, y);
  };
  // my villager in 3D (NH's model, VILLAGER_H 16 tall): the box its skinned meshes fill, settled into each pose (never
  // left half way through a crossfade: the user's "split" villager), never strewn about by its bones
  type B = { state: string; box: [number[], number[]] } | null;
  const body = () => page.evaluate(() => (window as unknown as { __tent: { v3(w: string): B } }).__tent.v3('A'));
  const size = (b: B) => (b ? [b.box[1][0] - b.box[0][0], b.box[1][1] - b.box[0][1], b.box[1][2] - b.box[0][2]] : [0, 0, 0]);
  const settled = async (state: string, ok: (s: number[]) => boolean) => {
    await expect.poll(async () => {
      const b = await body();
      return b?.state === state && ok(size(b)) && b.box[0].every((v) => v > -20) && b.box[1].every((v) => v < 26);
    }, { timeout: 8000 }).toBe(true);
  };
  await expect.poll(body, { timeout: 15_000 }).not.toBeNull();
  await settled('idle', ([, h]) => h > 13 && h < 19);
  await tapPiece('f4039');
  await expect.poll(() => use(page, (t) => t.seat()), { timeout: 6000 }).toMatchObject({ id: id('f4039'), lie: false });
  await settled('sit', ([, h]) => h > 9 && h < 17);
  await tapPiece('f4081');
  await expect.poll(() => use(page, (t) => t.seat()), { timeout: 6000 }).toMatchObject({ id: id('f4081'), lie: true });
  // lying: long along the cot, low over it
  await settled('lie', ([w, h, d]) => h < 10 && Math.max(w, d) > 11);
  const [fx, fy] = await tent(page, (t) => t.px(-30, 30));
  await page.mouse.click(fx, fy);
  await expect.poll(() => use(page, (t) => t.seat())).toBeNull();
  await settled('idle', ([, h]) => h > 13 && h < 19);
  // the lantern: on as it came, off with a tap; the room's light switch
  expect((await use(page, (t) => t.lights())).pieces).toEqual([{ id: id('f1432'), on: true }]);
  await tapPiece('f1432');
  await expect.poll(async () => (await use(page, (t) => t.lights())).pieces[0].on).toBe(false);
  await page.locator('[data-tent-lights]').click();
  await expect(page.locator('[data-tent-lights]')).toHaveAttribute('data-tent-lights', 'off');
  // kept
  await page.reload();
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect.poll(() => use(page, (t) => t.lights())).toEqual({ room: false, pieces: [{ id: id('f1432'), on: false }] });
});

test('on the walls: a clock from かべかけ hangs on the back wall; a tap on the left wall takes it there; it stays', async ({ page }) => {
  await page.addInitScript(() => localStorage.getItem('tent-w') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('tent-w', '1')));
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await openEdit(page);
  await page.locator('[data-tab="walled"]').click();
  await page.locator('[data-tent-item="f4037"]').click();
  await expect.poll(() => te(page, (t) => t.edit()?.sel)).toMatchObject({ item: 'f4037', f: 0 });
  await expect(page.locator('[data-act="turn"]')).toHaveCount(0);
  await settled(page);
  const [x, y] = await page.evaluate(() => (window as unknown as { __tent: { wallPx(w: number, u: number, y: number): [number, number] } }).__tent.wallPx(1, 40, 22));
  await page.mouse.click(x, y);
  await expect.poll(() => te(page, (t) => t.edit()?.sel)).toMatchObject({ f: 1 });
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => te(page, (t) => t.pieces())).toEqual([expect.objectContaining({ item: 'f4037', f: 1 })]);
  await page.reload();
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await expect.poll(() => te(page, (t) => t.pieces())).toEqual([expect.objectContaining({ item: 'f4037', f: 1 })]);
});

test('the HHA: the first time in after a day’s decorating, ハニワくん’s letter rates the room (its points and its ハニワ); once a day; its button shows it again', async ({ page }) => {
  // (a long one: the room loaded more than once, on CI's software GL ~25 s of a 30 s budget)
  test.setTimeout(60_000);
  type H = { total: number; badge: string | null; note: { k: string; v?: string } };
  const hha = () => page.evaluate(() => (window as unknown as { __tent: { hha(): Promise<H> } }).__tent.hha());
  const out = async () => {
    await page.getByRole('button', { name: '島へ' }).click();
    await expect(page).toHaveURL(/\/fitness\/\?/);
  };
  const letter = page.locator('[data-tent-letter]');
  // nothing decorated yet: no letter
  await enter(page);
  await page.waitForTimeout(2000);
  await expect(letter).toHaveCount(0);
  // a log room
  await page.evaluate(() => (window as unknown as { __tent: { fill(c: string[]): number } }).__tent.fill(['f4041', 'f4040', 'f4039', 'f4038', 'f4042', 'f4044', 'f4036', 'f1432', 'f9563']));
  const want = await hha();
  expect(want.badge).not.toBeNull();
  expect(want.note).toEqual({ k: 'series', v: 'log' });
  await out();
  // back in through the door: the letter
  await enter(page);
  await expect(letter).toBeVisible({ timeout: 5000 });
  await expect(letter).toHaveAttribute('data-tent-letter', String(want.total));
  await expect(letter).toHaveAttribute('data-badge', want.badge!);
  await expect(letter.locator('[data-hha-total]')).toContainText(want.total.toLocaleString('ja-JP'));
  await expect(letter.locator('[data-hha-note="series"]')).toContainText('まるた');
  await expect(letter.locator('[data-hha-part="series"]')).toBeVisible();
  await letter.locator('[data-hha-close]').click();
  await expect(letter).toHaveCount(0);
  // once a day: in again, no letter; the ハニワ button shows it
  await out();
  await enter(page);
  await page.waitForTimeout(2000);
  await expect(letter).toHaveCount(0);
  await page.locator('[data-tent-hha]').click();
  await expect(letter).toHaveAttribute('data-tent-letter', String(want.total));
});
