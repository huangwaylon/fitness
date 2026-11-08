// The island on its editable layout (docs/island-layout.md "How the 3D island reads it"; island/site.svelte.ts):
// the gameplay reads the long layout: the doors, the homes, the walk, the waters.
import { expect, test, type Page } from './fixtures.ts';
import { geo, is3d, openNear, quiet, reelOnBite, settled, tapOn } from './island';

type Site = { on: boolean; doors: Record<string, [number, number]>; homes: { A: [number, number]; B: [number, number] }; stage: [number, number]; named: Record<string, [number, number]>; grass: [number, number][] };
const site = (page: Page) => page.evaluate(() => (window as unknown as { __world: { site(): Site } }).__world.site());
const world = <R,>(page: Page, fn: string) => page.evaluate(`window.__world.${fn}`) as Promise<R>;
const ISLAND = './?demo&date=2026-11-04T12:00';

test('the long layout: its doors, homes, centre stage and named spots', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const s = await site(page);
  // the campsite's door is ウェイ's home's on the layout (z 1404 and on), うめ's and the guest's homes in the middle
  expect(s.doors.campsite[1]).toBeGreaterThan(1350);
  expect(s.doors['home-B'][1]).toBeGreaterThan(700);
  expect(s.doors['home-G'][1]).toBeGreaterThan(700);
  // centre stage: the plaza on the front lawn, behind the villagers' spots (layout/spots.ts stageOf)
  expect(s.stage[1]).toBeGreaterThan(s.homes.A[1]);
  expect(s.stage[1]).toBeLessThan(700);
  for (const n of ['homeA', 'homeB', 'centreStage', 'pondside', 'door-campsite', 'seatPondL', 'stoolW', 'pullup', 'riverEast', 'mouth']) expect(s.named[n], n).toBeTruthy();
});

test('うめ’s home: a tap walks up to its door and goes in to its room', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const door = (await site(page)).doors['home-B'];
  await world(page, `go(${door[1] - 120})`);
  // (at rest: its camera still and its nodes placed for it; the DOM door's box stays where the last camera had it for
  // a beat after the camera stops, and a tap found on that box landed off the door once it was placed)
  await settled(page);
  await tapOn(page, page.locator('[data-building="home-B"] .door'));
  // my villager walks up to the door, then in
  await expect(page).toHaveURL(/\/tent\/?\?.*home=B/, { timeout: 15_000 });
  await expect(page.locator('[data-room-home="B"]')).toBeVisible();
});

test('a tap on the ground walks there on the layout’s walk (the long middle)', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  await quiet(page); // (the opening beats over: a reaction would stop the walk short)
  // open ground in the middle a tap there walks to (clear of the day's spots and of every tap area on this screen: the
  // lawn between うめ's home and the shop, a tap by a building's foot knocks at its door), my villager put down on more
  // of it a way off
  await world(page, 'go(860)');
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  const to = await openNear(page, 75, 870, 45, true), from = await openNear(page, to[0] + 110, to[1] - 40);
  await world(page, `put(${from[0]}, ${from[1]})`);
  const [x, y] = await page.evaluate(`window.__world3d.client(${to[0]}, ${to[1]})`) as [number, number];
  await page.mouse.click(x, y);
  await expect.poll(async () => {
    const [mx, mz] = await world<[number, number]>(page, 'mine()');
    return Math.hypot(mx - to[0], mz - to[1]);
  }, { timeout: 10_000 }).toBeLessThan(20);
});

type Ground = { surface: string; fresh: string };
const ground = (page: Page, x: number, z: number) => world<Ground>(page, `ground(${x}, ${z})`);

for (const water of ['sea', 'pond', 'river', 'mouth', 'clifftop'] as const)
  test(`the fish swim in the layout’s own waters: ${water}`, async ({ page }) => {
    // (no wait on the 3D island: the shadow is the DOM's and its water the layout's; CI's software GL is slow to load)
    test.slow();
    await page.goto(`${ISLAND.replace('', '')}&critter=${water === 'sea' ? 'fish' : water}`);
    await page.waitForFunction(() => (window as unknown as { __world?: { site?(): { on: boolean } } }).__world?.site?.().on);
    const node = page.locator(`[data-shadow-of="${water}"]`);
    await expect(node, water).toBeAttached({ timeout: 30_000 });
    const [x, z] = await node.evaluate((el) => [Number((el as HTMLElement).dataset.ax), Number((el as HTMLElement).dataset.az)]);
    const g = await ground(page, x, z);
    if (water === 'sea') expect(g.surface, `${water} at ${x}, ${z}`).toBe('sea');
    else {
      // (the mouth's shadows swim out into the sea at its end)
      expect(water === 'mouth' ? ['water', 'sea'] : ['water'], `${water} at ${x}, ${z}`).toContain(g.surface);
      expect(g.fresh, `${water} at ${x}, ${z}`).toBe(water);
    }
  });

test('a pond fish on the long layout: cast beside it, the bite, a tap catches it', async ({ page }) => {
  await page.goto(`${ISLAND.replace('', '')}&critter=carp`);
  expect(await is3d(page)).toBe(true);
  const node = page.locator('[data-shadow-of="pond"]');
  await expect(node).toBeAttached();
  const [x, z] = await node.evaluate((el) => [Number((el as HTMLElement).dataset.ax), Number((el as HTMLElement).dataset.az)]);
  // my villager on the pond's back bank (within a line's reach), the camera on the pond
  await world(page, `put(${x}, ${z + 45})`);
  await world(page, `go(${z - 140})`);
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  // the shadow drawn on the layout's pond (its model, where its tap area is): a tap beside it
  const where = () => page.evaluate(() => {
    const w = (window as unknown as { __world3d: { where(id: string): { x: number; y: number; z: number; hidden: boolean } | null; client(x: number, z: number, y?: number): [number, number] } }).__world3d;
    for (let n = 0; n < 200; n++) {
      const p = w.where(`fish-pond-${n}`);
      if (p && !p.hidden) {
        const [x, y] = w.client(p.x, -p.z, p.y);
        return y > 0 && y < innerHeight ? { x, y } : null;
      }
    }
    return null;
  });
  await expect.poll(where).not.toBeNull();
  await page.waitForTimeout(600); // (pond.spec's: the shadow settles into its swim)
  const f = (await where())!;
  // beside it, on its water: never a bank's flower or anything else a tap would be (the shadow by the edge: +6px was a
  // cosmos on the bank now and then)
  const [tx, ty] = await page.evaluate(({ x, y }) => {
    const h = window as unknown as { __world3d: { ground(cx: number, cy: number): { x: number; z: number } | null }; __world: { ground(x: number, z: number): { surface: string } } };
    for (const [dx, dy] of [[6, 0], [-6, 0], [0, 6], [0, -6], [10, 0], [-10, 0], [0, 10], [0, -10], [6, 6], [-6, 6], [6, -6], [-6, -6]]) {
      const g = h.__world3d.ground(x + dx, y + dy), el = document.elementFromPoint(x + dx, y + dy);
      if (g && h.__world.ground(g.x, g.z).surface === 'water' && !el?.closest('button, a, [data-flower], [data-tree], [data-bush], [data-care], [data-find], [data-decor], [data-sit], [data-fixture]')) return [x + dx, y + dy];
    }
    return [x + 6, y];
  }, f);
  await page.mouse.click(tx, ty);
  await expect(page.locator('[data-bobber]')).toBeAttached();
  // the reel the moment it bites (a tap before it scares it off: e2e/island.ts reelOnBite)
  await reelOnBite(page, 196, 420);
  await expect(page.locator('[data-fx="catch"]')).toBeAttached({ timeout: 5000 });
});

test('the day’s weeds and fossils lie on the layout’s open grass, all over the long island', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const s = await world<{ lawn: [number, number][]; dig: [number, number][] }>(page, 'spots()');
  expect(s.dig.length).toBeGreaterThanOrEqual(4);
  for (const [x, z] of [...s.lawn, ...s.dig]) expect((await ground(page, x, z)).surface, `${x}, ${z}`).toBe('grass');
  // the middle and おく hold some (world.ts's own spots end at z 1000)
  expect([...s.lawn, ...s.dig].some(([, z]) => z > 1050)).toBe(true);
});

test('the editor moves うめ’s home: the phone’s door, walk and tap area follow it live', async ({ context }) => {
  // (no wait on the 3D island: the phone's layout and walk are the DOM's; CI's software GL is slow to load)
  test.slow();
  const DATE = '2026-11-04T12:00';
  const phone = await context.newPage(), editor = await context.newPage();
  await editor.setViewportSize({ width: 1440, height: 900 });
  await phone.goto(`${ISLAND}&as=B`);
  await phone.waitForFunction(() => (window as unknown as { __world?: { site?(): { on: boolean } } }).__world?.site?.().on);
  const before = (await site(phone)).doors['home-B'];
  // its tap area (the door's node, projected on the layout's ground) before the move
  expect(await is3d(phone)).toBe(true);
  await phone.bringToFront();
  await world(phone, `go(${before[1] - 120})`);
  await expect.poll(() => phone.evaluate('window.__world3d.camStill()')).toBe(true);
  // how far the door's tap area stands from where the camera draws the door (px): its node's foot against the door's
  // point on the layout's ground
  const off = () => phone.evaluate(() => {
    const w = window as unknown as { __world: { site(): Site }; __world3d: { client(x: number, z: number): [number, number] } };
    const [x, z] = w.__world.site().doors['home-B'], [sx, sy] = w.__world3d.client(x, z + 16);
    const r = document.querySelector('[data-building="home-B"] .door')!.getBoundingClientRect();
    return Math.hypot(r.left + r.width / 2 - sx, r.bottom - sy);
  });
  await expect.poll(off).toBeLessThan(30);
  await editor.goto(`editor/?demo&preview=0&date=${DATE}`);
  await editor.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await editor.bringToFront();
  type E = { tileScreen(c: number, r: number): [number, number]; layout(): { objects: Map<string, { x: number; z: number }> } };
  const from = await editor.evaluate(() => { const o = (window as unknown as { __editor: E }).__editor.layout().objects.get('home-B')!; return [o.x, o.z]; });
  const a = await editor.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), from);
  const b = await editor.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), [from[0], from[1] + 1]);
  await editor.mouse.move(a[0], a[1]);
  await editor.mouse.down();
  for (let i = 1; i <= 6; i++) await editor.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1] + ((b[1] - a[1]) * i) / 6);
  await editor.mouse.up();
  // the phone: its door a tile further back, the walk's named door with it
  await expect.poll(async () => (await site(phone)).doors['home-B'][1]).toBe(before[1] + 30);
  const s = await site(phone);
  expect(s.named['door-home-B']).toEqual(s.doors['home-B']);
  // its tap area where the house now is
  await phone.bringToFront();
  await expect.poll(off).toBeLessThan(30);
});

test('K.K. on the long layout: on his stool (the layout’s piece) on the front lawn, and a tap talks to him', async ({ page }) => {
  await page.goto('./?demo&date=2026-10-24T19:00'); // a Saturday evening: his show
  expect(await is3d(page)).toBe(true);
  const stage = await page.evaluate(() => (window as unknown as { __layout: { pos(id: string): [number, number] } }).__layout.pos('kk-slider'));
  await world(page, `go(${stage[1] - 120})`);
  await settled(page); // (its nodes placed for the camera at rest: their boxes are read)
  const art = page.locator('[data-kk] .art');
  await expect(art).toBeAttached();
  // his feet (the node's origin) on his stool
  await expect.poll(() => page.evaluate(([x, z]) => {
    const r = document.querySelector('[data-kk]')!.getBoundingClientRect();
    const [px, py] = (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z);
    return Math.hypot(r.left - px, r.top - py);
  }, stage)).toBeLessThan(4);
  // (he's the scene's tap, as a visitor is, not a DOM target: a tap on his middle)
  const r = (await art.boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('とたけけ');
});

for (const seat of ['seatMaeL', 'seatPondR', 'stoolW', 'stoolE'] as const)
  test(`the layout’s seats: my villager put on ${seat} sits there`, async ({ page }) => {
    await page.goto(ISLAND);
    expect(await is3d(page)).toBe(true);
    const at = (await site(page)).named[seat];
    await world(page, `put(${at[0]}, ${at[1]})`);
    await expect(page.locator('[data-actor="mine"]')).toHaveAttribute('data-seat', seat);
    // the 3D villager on the piece's own seat (its model in: under software GL that takes a while)
    await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3?: { state(s: string): string | null } }).__villagers3?.state('mine') ?? null), { timeout: 30_000 }).toBe('sit');
  });

test('the guest comes ashore and walks up to its own house (home-G)', async ({ page }) => {
  test.slow();
  await page.goto(`${ISLAND}&as=G`);
  expect(await is3d(page)).toBe(true);
  const door = (await site(page)).doors['home-G'];
  // its spot: by its door (buildings.ts guestSpot), a walk up the island from the beach
  await expect.poll(async () => {
    const [x, z] = await world<[number, number]>(page, 'mine()');
    return Math.hypot(x - door[0], z - door[1]);
  }, { timeout: 40_000 }).toBeLessThan(60);
});

test('the layout’s water flows: the river, the waterfall and the pond move from frame to frame when nothing else does', { tag: '@render' }, async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const g = await page.evaluate(() => (window as unknown as { __world: { geo(): { RIVER: [number, number, number][]; POND: { x: number; z: number }; CLIFF: { z0: number } } } }).__world.geo());
  // a point on each: the river's crossing reach (beside the bridge), the falls over the cliff, the pond's middle
  const cross = g.RIVER.filter(([, z]) => Math.abs(z - g.RIVER.at(-3)![1]) < 20).at(2)!;
  const fall = g.RIVER.find(([, z]) => Math.abs(z - g.CLIFF.z0) < 20)!;
  for (const [name, x, z] of [['river', cross[0], cross[1]], ['falls', fall[0], fall[1]], ['pond', g.POND.x, g.POND.z]] as const) {
    await page.evaluate(([x, z]) => (window as unknown as { __world3d: { go(z: number, k: number, x: number): void } }).__world3d.go(z - 60, 2.4, x), [x, z]);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { camStill(): boolean } }).__world3d.camStill())).toBe(true);
    await page.waitForTimeout(800);
    const [cx, cy] = await page.evaluate(([x, z]) => (window as unknown as { __world3d: { client(x: number, z: number): [number, number] } }).__world3d.client(x, z), [x, z]);
    const clip = { x: Math.round(cx - 8), y: Math.round(cy - 4), width: 16, height: 8 };
    const a = await page.screenshot({ clip });
    await page.waitForTimeout(500);
    expect(a.equals(await page.screenshot({ clip })), `${name} flows`).toBe(false);
  }
});

test('a pond put down in the editor: on the phone at once, drawn there, its water a fresh water', async ({ context }) => {
  test.slow();
  const phone = await context.newPage(), editor = await context.newPage();
  await editor.setViewportSize({ width: 1440, height: 900 });
  await phone.goto(`${ISLAND}&as=B`);
  expect(await is3d(phone)).toBe(true);
  await editor.goto('editor/?demo&preview=0&date=2026-11-04T12:00');
  await editor.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await editor.bringToFront();
  type E = { tileScreen(c: number, r: number): [number, number]; layout(): { objects: Map<string, { k: string }> } };
  const ponds = () => editor.evaluate(() => [...(window as unknown as { __editor: E }).__editor.layout().objects.values()].filter((o) => o.k === 'pond').length);
  await editor.locator('[data-kind="pond"]').click();
  // the first spot of open lawn it goes on (the front lawn's)
  for (const [c, r] of [[12, 21], [4, 13], [12, 15], [4, 20], [11, 36]] as const) {
    const [x, y] = await editor.evaluate(([c, r]) => (window as unknown as { __editor: E }).__editor.tileScreen(c, r), [c, r] as const);
    await editor.mouse.move(x, y);
    await editor.mouse.click(x, y);
    if (await ponds()) break;
  }
  expect(await ponds()).toBe(1);
  // the phone: the pond in its layout, drawn (its water, bed and stones), its water a fresh water
  await expect.poll(() => phone.evaluate(() => (window as unknown as { __layout: { count(k: string): number } }).__layout.count('pond')), { timeout: 5000 }).toBe(1);
  const g = await geo(phone);
  expect(g.PONDS).toHaveLength(1);
  const o = g.PONDS[0];
  expect(await world<{ surface: string; fresh: string }>(phone, `ground(${o.x}, ${o.z})`)).toEqual({ surface: 'water', fresh: 'pond' });
  await expect.poll(() => phone.evaluate(() => (window as unknown as { __world3d: { placedGroups(): string[] } }).__world3d.placedGroups().some((id) => id.startsWith('pond:')))).toBe(true);
});

