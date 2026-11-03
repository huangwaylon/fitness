// The island on its editable layout (docs/island-layout.md "What the 3D integration must change"; island/site.svelte.ts):
// with the 3D island and `?layout`, the gameplay reads the long layout: the doors, the homes, the walk, the waters.
import { expect, test, type Page } from '@playwright/test';
import { is3d, openNear, tapOn } from './island';

type Site = { on: boolean; doors: Record<string, [number, number]>; homes: { A: [number, number]; B: [number, number] }; stage: [number, number]; named: Record<string, [number, number]>; grass: [number, number][] };
const site = (page: Page) => page.evaluate(() => (window as unknown as { __world: { site(): Site } }).__world.site());
const world = <R,>(page: Page, fn: string) => page.evaluate(`window.__world.${fn}`) as Promise<R>;
const ISLAND = './?demo&island=3d&layout&visitor=none&critter=none&date=2026-11-04T12:00';

test('the long layout: its doors, homes, centre stage and named spots', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const s = await site(page);
  expect(s.on).toBe(true);
  // the campsite's door is ウェイ's home's on the layout (z 1404 and on), うめ's and the guest's homes in the middle
  expect(s.doors.campsite[1]).toBeGreaterThan(1350);
  expect(s.doors['home-B'][1]).toBeGreaterThan(700);
  expect(s.doors['home-G'][1]).toBeGreaterThan(700);
  expect(s.stage[1]).toBeGreaterThan(1200);
  for (const n of ['homeA', 'homeB', 'centreStage', 'pondside', 'door-campsite', 'seatPondL', 'stoolW', 'pullup', 'riverEast', 'mouth']) expect(s.named[n], n).toBeTruthy();
});

test('without ?layout the 3D island keeps world.ts’s island', async ({ page }) => {
  // (nor the e2e's own switch: E2E_LAYOUT)
  await page.addInitScript(() => localStorage.removeItem('island.layout'));
  await page.goto('./?demo&island=3d&visitor=none&critter=none');
  expect(await is3d(page)).toBe(true);
  const s = await site(page);
  expect(s.on).toBe(false);
  expect(s.doors.campsite[1]).toBeLessThan(1000);
  expect(s.doors['home-B']).toBeUndefined();
});

test('うめ’s home: a tap walks up to its door and goes in to its room', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  const door = (await site(page)).doors['home-B'];
  await world(page, `go(${door[1] - 120})`);
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  await tapOn(page, page.locator('[data-building="home-B"] .door'));
  // my villager walks up to the door, then in
  await expect(page).toHaveURL(/\/tent\/?\?.*home=B/, { timeout: 15_000 });
  await expect(page.locator('[data-room-home="B"]')).toBeVisible();
});

test('a tap on the ground walks there on the layout’s walk (the long middle)', async ({ page }) => {
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  // open ground in the middle a tap there walks to (clear of the day's spots and of every tap area on this screen),
  // my villager put down on more of it a way off
  await world(page, 'go(860)');
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  const to = await openNear(page, 150, 960, 45, true), from = await openNear(page, to[0] + 110, to[1] - 40);
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
    await page.goto(`${ISLAND.replace('&critter=none', '')}&critter=${water === 'sea' ? 'fish' : water}`);
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
  await page.goto(`${ISLAND.replace('&critter=none', '')}&critter=carp`);
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
  await page.mouse.click(f.x + 6, f.y);
  await expect(page.locator('[data-bobber]')).toBeAttached();
  await expect(page.locator('[data-bite]')).toHaveText('！', { timeout: 10_000 });
  await page.waitForTimeout(400); // (the bite's beat: a tap before it is a miss)
  await page.mouse.click(196, 420);
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

test('a visitor on the long layout: K.K. at the layout’s centre stage by the campsite, and a tap talks to him', async ({ page }) => {
  await page.goto('./?demo&island=3d&layout&critter=none&date=2026-10-24T19:00'); // a Saturday evening: K.K.
  expect(await is3d(page)).toBe(true);
  const { stage, doors } = await site(page);
  expect(Math.hypot(stage[0] - doors.campsite[0], stage[1] - doors.campsite[1])).toBeLessThan(200);
  await world(page, `go(${stage[1] - 120})`);
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  const art = page.locator('[data-visitor="kk-slider"] .art');
  await expect(art).toBeAttached();
  // his feet (the node's origin) on centre stage
  await expect.poll(() => page.evaluate(([x, z]) => {
    const r = document.querySelector('[data-visitor="kk-slider"]')!.getBoundingClientRect();
    const [px, py] = (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z);
    return Math.hypot(r.left - px, r.top - py);
  }, stage)).toBeLessThan(4);
  // (a visitor is the scene's tap, not a DOM target: a tap on his middle)
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
