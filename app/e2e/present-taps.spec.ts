// What lies on the ground and opens or picks up at a tap (docs/design.md "Tap targets", "Balloon", "Shaking a tree";
// docs/backend.md "Shared world"): a balloon's present, a tree's and a piece of wood, each tapped where it's drawn (a
// real touch: exactTaps.ts sends its click to the finger's point), beside a tree, a building and the water, all collected.
// And the live bug (2026-11-05, the move to https://island-fund.pages.dev: a new origin, empty storage): a phone that
// lost its own record of the day gets my claims back in the relay's replay; what I had opened lay there again on my
// phone and a tap did nothing (my claim was the day's already: it can't be made twice). Now a claim, mine too, is gone.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, geo, type Geo, islandUp, openNear, quiet } from './island.ts';
import { layoutOpOf, mergeLayout, type LayoutEntry } from '../src/lib/contract/layout.ts';
import { defaultLayout, layoutOf } from '../src/lib/layout/model.ts';
import { navOf, type LayoutNav } from '../src/lib/layout/nav.ts';
import { onBuilding } from '../src/lib/layout/clear.ts';
import { tileAt } from '../src/lib/layout/grid.ts';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });

const DATE = '2026-11-05';
// (no critters: a roaming bug's lanes (0ea2f7494) now and then hovered over a present as the finger came down, and its
// tap was the bug's: "pbunder opened" red in the full tier, 1 in ~10 runs)
const Q = `?demo&date=${DATE}T12:00&critter=none`;
/** The demo's clock: an hour before the page's (the seeded day's changes), and the Tokyo day's number. */
const T = Date.parse(`${DATE}T11:00:00+09:00`);
const DAY = Math.floor((T + 9 * 3600_000) / 86_400_000);

type Ev = { kind: 'put' | 'pick'; id: string; what: string; at: [number, number]; who: 'A' | 'B'; t: number };
/** The day as A's phone folded it (`island-demo.world.A`) and the demo's room holds it (`island-demo.relay`), with
 *  this phone's own scene record (`scene-day`) gone: as a phone whose storage was lost, the relay's replay back in. */
async function seed(page: Page, events: Ev[]) {
  await page.evaluate(([events, day]) => {
    localStorage.setItem('island-demo.world.A', JSON.stringify({ day, events }));
    localStorage.setItem('island-demo.relay', JSON.stringify({ day, log: events.map((e) => ({ ...e, v: 3 })) }));
    localStorage.removeItem('scene-day');
  }, [events, DAY] as const);
  await page.reload();
  await islandUp(page);
  await quiet(page);
}
async function open(page: Page): Promise<Geo> {
  await page.goto(Q);
  await islandUp(page);
  await quiet(page);
  return geo(page);
}
/** Whether `id` was claimed by A in the shared day (the phone's fold of it). */
const pickedBy = (page: Page, id: string) =>
  page.evaluate((id) => {
    const d = JSON.parse(localStorage.getItem('island-demo.world.A') ?? '{"events":[]}') as { events: Ev[] };
    return d.events.filter((e) => e.kind === 'pick' && e.id === id).map((e) => `${e.who}:${e.what.split(':')[0]}`);
  }, id);
/** Where a present is drawn: its 3D model's middle (`gift-<uid>`, through the camera's projection), else its art's.
 *  (`client`'s lift is above the ground there: `where`'s y is that ground's height, 43 on the museum's tier, and with it
 *  added the finger came down 43 u over the box, 0.5 px above its tap area: "pbunder opened" red in the full tier) */
async function giftPoint(page: Page, uid: string): Promise<[number, number]> {
  const at = () => page.evaluate((uid) => {
    const w = (window as unknown as { __world3d?: { where(id: string): { x: number; y: number; z: number; hidden: boolean } | null; client(x: number, z: number, lift?: number): [number, number] } }).__world3d;
    const p = w?.where(`gift-${uid}`);
    if (p && !p.hidden) return w!.client(p.x, -p.z, 12);
    const r = document.querySelector(`[data-find="present"][data-uid="${uid}"] .official`)?.getBoundingClientRect();
    return r && r.width ? [r.left + r.width / 2, r.top + r.height / 2] as [number, number] : null;
  }, uid);
  await expect.poll(at, { message: `the present ${uid}, drawn` }).not.toBeNull();
  return (await at())!;
}
/** A finger's tap on a present where it's drawn: opened (A's claim in the day, gone from the island, its plate). */
async function tapGift(page: Page, uid: string, z: number) {
  await camTo(page, z - 114);
  const gift = page.locator(`[data-find="present"][data-uid="${uid}"]`);
  await expect(gift).toHaveCount(1);
  const [x, y] = await giftPoint(page, uid);
  await page.touchscreen.tap(x, y);
  await expect.poll(() => pickedBy(page, uid), { message: `${uid} opened` }).toEqual(['A:present']);
  await expect(gift).toHaveCount(0);
  await expect(page.locator('[data-catch-stack] [data-fx="catch"]').last()).toBeVisible();
}

test('presents and wood are collected where they’re drawn: a tree’s present and wood under its canopy, a present before a building, one at the water’s edge', async ({ page }) => {
  test.setTimeout(60_000);
  const G = await open(page);
  const tree = G.SCENERY.find((s) => s.id === G.GIFT_TREES[0])!;
  const shop = G.BUILDINGS.find((b) => b.id === 'shop') ?? G.BUILDINGS[0];
  const pond = G.PONDS[0] ?? G.POND;
  const nearTree: [number, number] = [Math.round(tree.x), Math.round(tree.z - 20)];
  const woodAt: [number, number] = [Math.round(tree.x + 14), Math.round(tree.z - 12)];
  const beforeShop: [number, number] = [Math.round(shop.x + 12), Math.round(shop.z - 24)];
  const byWater: [number, number] = [Math.round(pond.x), Math.round(pond.z - pond.rz - 10)];
  await seed(page, [
    { kind: 'put', id: `tf:${tree.id}`, what: 'present', at: nearTree, who: 'B', t: T },
    { kind: 'put', id: `wd:${tree.id}:0`, what: 'wood', at: woodAt, who: 'B', t: T + 10 },
    { kind: 'put', id: 'pbshop', what: 'present', at: beforeShop, who: 'B', t: T + 20 },
    { kind: 'put', id: 'pbpond', what: 'present', at: byWater, who: 'B', t: T + 30 }
  ]);
  await tapGift(page, `tf:${tree.id}`, nearTree[1]);
  // the wood beside it: a button of its own, under the finger
  await camTo(page, woodAt[1] - 114);
  const wood = page.locator(`[data-wood-id="wd:${tree.id}:0"]`);
  await expect(wood).toHaveCount(1);
  const b = (await wood.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await expect.poll(() => pickedBy(page, `wd:${tree.id}:0`)).toEqual(['A:wood']);
  await expect(wood).toHaveCount(0);
  await tapGift(page, 'pbshop', beforeShop[1]);
  await tapGift(page, 'pbpond', byWater[1]);
});

test('a phone that lost its own record of the day: what I opened (the relay’s replay) lies nowhere; what nobody opened still opens at a tap', async ({ page }) => {
  test.setTimeout(60_000);
  const G = await open(page);
  const tree = G.SCENERY.find((s) => s.id === G.GIFT_TREES[0])!;
  const z = Math.round(tree.z - 20);
  // (on open ground: the lawn, not a building's steps)
  const mine = await openNear(page, tree.x - 90, z, 20), left = await openNear(page, tree.x + 90, z, 20);
  const giftAt: [number, number] = [Math.round(tree.x), z];
  await seed(page, [
    // opened by me on another origin's phone: a balloon's, a tree's and a piece of wood
    { kind: 'put', id: 'paold', what: 'present', at: mine, who: 'A', t: T },
    { kind: 'pick', id: 'paold', what: 'present:item:sword', at: mine, who: 'A', t: T + 50 },
    { kind: 'put', id: `tf:${tree.id}`, what: 'present', at: giftAt, who: 'A', t: T + 100 },
    { kind: 'pick', id: `tf:${tree.id}`, what: 'present:item:typewriter', at: giftAt, who: 'A', t: T + 150 },
    { kind: 'put', id: `wd:${tree.id}:0`, what: 'softwood', at: [Math.round(tree.x + 14), Math.round(tree.z - 12)], who: 'A', t: T + 200 },
    { kind: 'pick', id: `wd:${tree.id}:0`, what: 'softwood', at: [Math.round(tree.x + 14), Math.round(tree.z - 12)], who: 'A', t: T + 250 },
    // the partner's, opened by them; and one nobody has opened yet
    { kind: 'put', id: 'pbtheirs', what: 'present', at: left, who: 'B', t: T + 300 },
    { kind: 'pick', id: 'pbtheirs', what: 'present:item:simple-chair', at: left, who: 'B', t: T + 350 },
    { kind: 'put', id: 'pafresh', what: 'present', at: left, who: 'A', t: T + 400 }
  ]);
  await camTo(page, z - 114);
  await expect(page.locator('[data-find="present"]')).toHaveCount(1);
  await expect(page.locator('[data-find="present"][data-uid="pafresh"]')).toHaveCount(1);
  await expect(page.locator('[data-wood-id]')).toHaveCount(0);
  await tapGift(page, 'pafresh', left[1]);
  await expect(page.locator('[data-find="present"]')).toHaveCount(0);
});

// What lay on a building's ground (2026-11-05: "drawn but can't be tapped"): a tree's present and wood behind the shop
// (the default island's cedar there dropped them on the strip its model hides), a present on the museum's steps (its
// footprint: the building's tap area took the tap), and a building placed in the もようがえ over a present lying on
// the lawn. Each is drawn at the free spot off the building (layout/clear.ts offBuildings, its put as it was) and a
// finger collects it there.
const DEFAULT_NAV = navOf(defaultLayout());
/** Where the island draws a present or a piece of wood (its 3D model's foot, world x, z), or null without WebGL. */
const modelAt = (page: Page, id: string) =>
  page.evaluate((id) => {
    const p = (window as unknown as { __world3d?: { where(id: string): { x: number; z: number } | null } }).__world3d?.where(id);
    return p ? [p.x, -p.z] as [number, number] : null;
  }, id);
/** Where `id` is drawn, off every building's ground (`put`: where it was put, without WebGL: no model). Its model
 *  waited for (CI: not in yet at the first read, the put's spot came back and the camera stopped 58 u short). */
async function offTheBuildings(page: Page, id: string, g: LayoutNav, put: readonly [number, number]): Promise<readonly [number, number]> {
  if (!(await page.locator('.if-scene[data-r3]').count())) return put;
  await expect.poll(() => modelAt(page, id), { message: `${id}'s model in` }).not.toBeNull();
  const at = (await modelAt(page, id))!;
  expect(onBuilding(g, at[0], at[1], 0), `${id} drawn at ${at}`).toBe(false);
  return at;
}
/** A finger's tap on a piece of wood, where it's drawn: picked up by A, gone. */
async function tapWood(page: Page, id: string, z: number) {
  await camTo(page, z - 114);
  const wood = page.locator(`[data-wood-id="${id}"]`);
  await expect(wood).toHaveCount(1);
  const b = (await wood.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await expect.poll(() => pickedBy(page, id)).toEqual(['A:wood']);
  await expect(wood).toHaveCount(0);
}

test('what lay on a building’s ground (behind the shop, on the museum’s steps) is drawn off it and collected by touch', async ({ page }) => {
  test.setTimeout(90_000);
  const G = await open(page);
  const shop = DEFAULT_NAV.doors.shop.box, museum = DEFAULT_NAV.doors.museum.box;
  // the cedar behind the shop, and where the old rule dropped its present and wood (in front of its trunk: behind the shop)
  const tree = G.SCENERY.find((s) => s.kind === 'cedar' && s.x > shop.x0 && s.x < shop.x1 && s.z > shop.y1 && s.z < shop.y1 + 90)!;
  expect(tree, 'a cedar just behind the shop').toBeTruthy();
  const out = tree.x < 195 ? -1 : 1;
  const gift: [number, number] = [Math.round(tree.x - out * 16), Math.round(tree.z - 20)], wood: [number, number] = [Math.round(tree.x), Math.round(tree.z - 40)];
  const steps: [number, number] = [Math.round((museum.x0 + museum.x1) / 2 + 30), museum.y0 + 12];
  for (const p of [gift, wood, steps]) expect(onBuilding(DEFAULT_NAV, p[0], p[1], 0)).toBe(true);
  await seed(page, [
    { kind: 'put', id: `tf:${tree.id}`, what: 'present', at: gift, who: 'B', t: T },
    { kind: 'put', id: `wd:${tree.id}:0`, what: 'wood', at: wood, who: 'B', t: T + 10 },
    { kind: 'put', id: 'pbsteps', what: 'present', at: steps, who: 'B', t: T + 20 }
  ]);
  await camTo(page, gift[1] - 114);
  const giftDrawn = await offTheBuildings(page, `gift-tf:${tree.id}`, DEFAULT_NAV, gift);
  const woodDrawn = await offTheBuildings(page, `drop-wd:${tree.id}:0`, DEFAULT_NAV, wood);
  // (both moved off the same strip lie side by side: the wood first, a button in front)
  await tapWood(page, `wd:${tree.id}:0`, woodDrawn[1]);
  await tapGift(page, `tf:${tree.id}`, giftDrawn[1]);
  await camTo(page, steps[1] - 114);
  await tapGift(page, 'pbsteps', (await offTheBuildings(page, 'gift-pbsteps', DEFAULT_NAV, steps))[1]);
});

test('a building placed over a present lying on the lawn (the もようがえ): the present is drawn off it and opens at a tap', async ({ page }) => {
  test.setTimeout(90_000);
  const G = await open(page);
  const tree = G.SCENERY.find((s) => s.id === G.GIFT_TREES[0])!;
  const at = await openNear(page, 195, Math.round(tree.z - 20), 20);
  // the museum moved onto it: the present on its front row (one of the ops a もようがえ's ✓ sends)
  const [c, r] = tileAt(at[0], at[1]);
  const op = { sc: 'o', id: 'museum', at: T, k: 'museum', x: Math.max(0, c - 3), z: r, f: 0 };
  await page.evaluate((ops) => localStorage.setItem('island-demo.layout', ops), JSON.stringify([{ who: 'A', ...op }]));
  const m = new Map<string, LayoutEntry>();
  mergeLayout(m, { ...layoutOpOf(op)!, who: 'A' } as LayoutEntry);
  const g = navOf(layoutOf(m));
  expect(onBuilding(g, at[0], at[1], 0)).toBe(true);
  await seed(page, [{ kind: 'put', id: 'pbunder', what: 'present', at, who: 'B', t: T }]);
  expect(await page.evaluate(() => (window as unknown as { __layout: { obj(id: string): { x: number; z: number } } }).__layout.obj('museum'))).toMatchObject({ x: op.x, z: r });
  await camTo(page, at[1] - 114);
  await tapGift(page, 'pbunder', (await offTheBuildings(page, 'gift-pbunder', g, at))[1]);
});
