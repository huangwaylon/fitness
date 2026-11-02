// The island on its editable layout (docs/island-layout.md "What the 3D integration must change"; island/site.svelte.ts):
// with the 3D island and `?layout`, the gameplay reads the long layout: the doors, the homes, the walk, the waters.
import { expect, test, type Page } from '@playwright/test';
import { is3d, tapOn } from './island';

type Site = { on: boolean; doors: Record<string, [number, number]>; homes: { A: [number, number]; B: [number, number] }; stage: [number, number]; named: Record<string, [number, number]> };
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
  await page.goto('./?demo&island=3d&visitor=none&critter=none');
  expect(await is3d(page)).toBe(true);
  const s = await site(page);
  expect(s.on).toBe(false);
  expect(s.doors.campsite[1]).toBeLessThan(1000);
  expect(s.doors['home-B']).toBeUndefined();
});

test('うめ’s home: a tap walks up to its door and goes in to its room', async ({ page }) => {
  // TODO: until the engine draws buildGround(site.layout) (a tap's ground point is the old 3D ground's: CI's taps miss)
  test.fixme(true, 'until the engine draws buildGround(site.layout)');
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

test('a tap on the ground walks there on the layout’s walk', async ({ page }) => {
  // TODO: until the engine draws buildGround(site.layout) (a tap's ground point is the old 3D ground's: CI's taps miss)
  test.fixme(true, 'until the engine draws buildGround(site.layout)');
  await page.goto(ISLAND);
  expect(await is3d(page)).toBe(true);
  // the lawn east of the path (where world.ts's old 3D ground, still drawn under ?layout, is as flat as the layout's:
  // a tap's ground point is the drawn ground's)
  await world(page, 'put(250, 380)');
  await world(page, 'go(300)');
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  const [x, y] = await page.evaluate('window.__world3d.client(300, 470)') as [number, number];
  await page.mouse.click(x, y);
  await expect.poll(async () => {
    const [mx, mz] = await world<[number, number]>(page, 'mine()');
    return Math.hypot(mx - 300, mz - 470);
  }, { timeout: 10_000 }).toBeLessThan(20);
});

type Ground = { surface: string; fresh: string };
const ground = (page: Page, x: number, z: number) => world<Ground>(page, `ground(${x}, ${z})`);

test('the fish swim in the layout’s own waters: the sea, the pond, the river, its mouth, the clifftop', async ({ page }) => {
  // TODO: CI's software GL loads the 3D island five times over too slowly; split per water without the 3D wait
  test.fixme(true, 'CI: too slow in software GL');
  for (const water of ['sea', 'pond', 'river', 'mouth', 'clifftop'] as const) {
    await page.goto(`${ISLAND.replace('&critter=none', '')}&critter=${water === 'sea' ? 'fish' : water}`);
    expect(await is3d(page)).toBe(true);
    const node = page.locator(`[data-shadow-of="${water}"]`);
    await expect(node, water).toBeAttached({ timeout: 10_000 });
    const [x, z] = await node.evaluate((el) => [Number((el as HTMLElement).dataset.ax), Number((el as HTMLElement).dataset.az)]);
    const g = await ground(page, x, z);
    if (water === 'sea') expect(g.surface, `${water} at ${x}, ${z}`).toBe('sea');
    else {
      // (the mouth's shadows swim out into the sea at its end)
      expect(water === 'mouth' ? ['water', 'sea'] : ['water'], `${water} at ${x}, ${z}`).toContain(g.surface);
      expect(g.fresh, `${water} at ${x}, ${z}`).toBe(water);
    }
  }
});

test('a pond fish on the long layout: cast beside it, the bite, a tap catches it', async ({ page }) => {
  // (a tap finds its ground point on the 3D ground: world.ts's old one, its cliff where the layout's pond is, until the
  // engine draws buildGround(site.layout) under site.on)
  test.fixme(true, 'needs the layout’s 3D ground (engine: buildGround under site.on)');
  await page.goto(`${ISLAND.replace('&critter=none', '')}&critter=carp`);
  expect(await is3d(page)).toBe(true);
  const node = page.locator('[data-shadow-of="pond"]');
  await expect(node).toBeAttached();
  const z = await node.evaluate((el) => Number((el as HTMLElement).dataset.az));
  await world(page, `go(${z - 140})`);
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  const f = await page.locator('[data-critter="pond"]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
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
  const DATE = '2026-11-04T12:00';
  const phone = await context.newPage(), editor = await context.newPage();
  await editor.setViewportSize({ width: 1440, height: 900 });
  await phone.goto(`${ISLAND}&as=B`);
  expect(await is3d(phone)).toBe(true);
  const before = (await site(phone)).doors['home-B'];
  await world(phone, `go(${before[1] - 120})`);
  await expect.poll(() => phone.evaluate('window.__world3d.camStill()')).toBe(true);
  const doorY = () => phone.locator('[data-building="home-B"] .door').evaluate((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
  const y0 = await doorY();
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
  // the phone: its door a tile further back, the walk's named door with it, the tap area there
  await expect.poll(async () => (await site(phone)).doors['home-B'][1]).toBe(before[1] + 30);
  const s = await site(phone);
  expect(s.named['door-home-B']).toEqual(s.doors['home-B']);
  // its tap area a tile further up the screen (the camera where it was)
  await phone.bringToFront();
  await expect.poll(doorY).toBeLessThan(y0 - 8);
});

