// Where someone is and which way they face, the same on both phones (sync-fix 4, the two-phone probe's findings:
// e2e/zz-sync-probe.spec.ts). Walking into a room where the partner already is: their room says where they are at once
// (rooms/roomLife.ts heardRoom; walking in keeps one socket, so no presence `came` and no relay replay), the newcomer
// draws nobody at a made-up spot, and the walk it's told ends facing as on its walker's phone (roomRelay.ts replayWalk).
// A piece put down turns nobody (no intent says so). Back after a long hide the island keeps everyone's facing
// (avatar.ts snapHome). Two paired phones (the live app: its one socket, as on the users' phones) on the tests' own
// relay room (e2e/liveRoom.ts). WebKit taps, Chromium clicks.
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { geo, islandUp, lawnTap, quiet, tapOn } from './island.ts';
import { roomUp } from './rooms.ts';
import { newIsland, setVisible } from './liveRoom.ts';

type Island = ReturnType<typeof newIsland>;
type Who = 'A' | 'B';
/** One person as a phone shows them: where, walking, facing (the 3D model's yaw, null till it's in). */
type Seen = { x: number; z: number; walking: boolean; yaw: number | null } | null;

/** A paired phone on `island`: its island open, or `room` (the tent's URL straight: its own socket). */
async function phone(browser: Browser, island: Island, who: Who, room = false): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => (localStorage.setItem('e2e.render', 'none'), localStorage.setItem('e2e', '1')));
  await island.pair(context, who);
  const page = await context.newPage();
  await page.goto(room ? 'tent' : '');
  if (room) await loaded(page);
  else await islandUp(page, { timeout: 20_000 });
  await expect.poll(() => island.sockets(who), { timeout: 15_000 }).toBe(1);
  return page;
}
/** The tent's room drawn, its pieces and models in. */
const loaded = async (p: Page) => (await roomUp(p, 'tent', { timeout: 20_000 }), await p.waitForFunction(() => (window as unknown as { __tent: W }).__tent.loading() === 0, null, { timeout: 20_000 }));
test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

type W = Record<string, (...a: any[]) => any>;
const inPage = <R,>(p: Page, root: string, fn: (t: W, a: any) => R, a?: unknown) => p.evaluate(`(${fn.toString()})(window.${root}, ${JSON.stringify(a ?? null)})`) as Promise<R>;

/** `who` as this phone's room shows them. */
const inRoom = (p: Page, who: Who) => inPage<Seen>(p, '__tent', (t, w) => {
  const at = t.who(w), v = t.v3(w);
  return at ? { x: at.at[0], z: at.at[1], walking: !!at.walking, yaw: v ? v.yaw : null } : null;
}, who);
/** `who` as this phone's island shows them (its slots: mine, the partner's). */
const onIsland = (p: Page, who: Who) => p.evaluate((who) => {
  const W = window as unknown as Record<string, W>;
  for (const slot of ['mine', 'partner']) {
    const a = W.__world3d.actor(slot);
    if (a?.who !== who) continue;
    const [x, z] = W.__world.feet(slot);
    return { x, z, walking: !!a.walking, yaw: W.__villagers3.yaw(slot) as number | null };
  }
  return null;
}, who) as Promise<Seen>;
/** Two views of one person agree: within 1 u, standing, facing within 0.35 rad (both models in). */
const agree = (a: Seen, b: Seen) =>
  !!a && !!b && !a.walking && !b.walking && Math.hypot(a.x - b.x, a.z - b.z) <= 1 && a.yaw !== null && b.yaw !== null && Math.abs(Math.atan2(Math.sin(a.yaw - b.yaw), Math.cos(a.yaw - b.yaw))) <= 0.35;

/** Into a building from the island (its door tapped, the camera there first), its room loaded. */
async function goIn(p: Page, building: string) {
  await p.bringToFront();
  const bd = (await geo(p)).BUILDINGS.find((x) => x.id === building)!;
  await inPage(p, '__world', (w, z) => w.go(z), bd.z - 150);
  await tapOn(p, 'building', building);
  await expect(p).toHaveURL(/\/tent/, { timeout: 15_000 });
  await loaded(p);
}
/** Two views of `read`'s person kept agreeing for `ms` (sampled every 250 ms): a turn on one phone alone shows. */
async function keepAgreeing(a: Page, b: Page, read: (p: Page) => Promise<Seen>, ms = 1500, also?: (x: Seen) => boolean) {
  const bad: string[] = [], t0 = Date.now();
  await expect.poll(async () => {
    const [x, y] = await Promise.all([read(a), read(b)]);
    if (!agree(x, y) || (also && !also(x))) bad.push(JSON.stringify([x, y]));
    return Date.now() - t0;
  }, { timeout: ms + 5000, intervals: [250] }).toBeGreaterThan(ms);
  expect(bad).toEqual([]);
}
/** One's view settled (two reads apart the same: arrived, done turning) and the same on both phones. */
async function settled(a: Page, b: Page, read: (p: Page) => Promise<Seen>) {
  let last: Seen = null;
  await expect.poll(async () => {
    const [x, y] = await Promise.all([read(a), read(b)]);
    const still = agree(x, y) && agree(x, last) && x!.yaw === last!.yaw;
    last = x;
    return still;
  }, { timeout: 10_000, intervals: [300] }).toBe(true);
  return last;
}

test('walking into the tent where the partner stands: B\'s phone shows A where A is, facing as on A\'s phone, within 2 s (never the made-up spot)', async ({ browser }) => {
  const island = newIsland();
  const a = await phone(browser, island, 'A', true), b = await phone(browser, island, 'B');
  await settled(a, a, (p) => inRoom(p, 'A'));
  // B walks in from the island (one socket: no `came` on A's phone, no relay replay): A's room answers the arrival
  await goIn(b, 'campsite');
  await expect.poll(async () => agree(await inRoom(a, 'A'), await inRoom(b, 'A')), { timeout: 2000, intervals: [100] }).toBe(true);
  // and B on both phones, once B's own walk in is over
  await settled(a, b, (p) => inRoom(p, 'B'));
});

test('walking in while the partner runs on the treadmill: the same spot and the seat\'s own facing on both phones', async ({ browser }) => {
  const island = newIsland();
  const a = await phone(browser, island, 'A', true);
  expect(await inPage(a, '__tent', (t) => t.fill(['f290']))).toBe(1);
  await loaded(a);
  const id = await inPage<string>(a, '__tent', (t) => t.pieces()[0].id);
  expect(await inPage(a, '__tent', (t, id) => t.sit(id), id)).toBe(true);
  await expect.poll(() => inPage(a, '__tent', (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(id);
  const b = await phone(browser, island, 'B');
  await goIn(b, 'campsite');
  // (A posed before its model was in on B's phone: the seat's facing, not the camera's side)
  await expect.poll(async () => agree(await inRoom(a, 'A'), await inRoom(b, 'A')), { timeout: 5000 }).toBe(true);
  await keepAgreeing(a, b, (p) => inRoom(p, 'A'));
});

test('a piece put down turns nobody: B facing away from it stays so on both phones', async ({ browser }) => {
  const island = newIsland();
  const a = await phone(browser, island, 'A', true), b = await phone(browser, island, 'B', true);
  // B over by the right wall (walking right: facing right), then a chair put down on B's left
  await settled(a, b, (p) => inRoom(p, 'B'));
  await inPage(b, '__tent', (t) => t.walkTo(33, 10));
  await settled(a, b, (p) => inRoom(p, 'B'));
  expect(await inPage(b, '__tent', (t) => t.fill(['f4039']))).toBe(1);
  await expect.poll(() => inPage(a, '__tent', (t) => t.pieces().length)).toBe(1);
  await keepAgreeing(a, b, (p) => inRoom(p, 'B'));
});

test('back on the island after a long hide: everyone where they rest, facing as before on both phones (never turned to the camera on one)', async ({ browser }) => {
  const island = newIsland();
  const a = await phone(browser, island, 'A'), b = await phone(browser, island, 'B');
  await quiet(a);
  // B walks off left across the lawn (ends facing left: a tap-walk has no facing of its own), A walks right
  for (const [p, x, z] of [[b, 120, 420], [a, 320, 470]] as const) {
    await p.bringToFront();
    await inPage(p, '__world', (w, z) => w.go(z), z - 150);
    const t = await lawnTap(p, x, z);
    await p.mouse.click(t.x, t.y);
  }
  const before = { A: await settled(a, b, (p) => onIsland(p, 'A')), B: await settled(a, b, (p) => onIsland(p, 'B')) };
  // A's app away past SNAP_HOME_MS (30 s: its device clock moved on as it comes back, no wait), then back
  await a.bringToFront();
  await setVisible(a, false);
  await a.evaluate(() => {
    const real = Date.now;
    Date.now = () => real() + 40_000;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
    Date.now = real;
  });
  for (const w of ['A', 'B'] as const) await keepAgreeing(a, b, (p) => onIsland(p, w), 1500, (x) => agree(x, before[w]));
});
