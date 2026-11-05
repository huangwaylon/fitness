// What lies on the ground and opens or picks up at a tap (docs/design.md "Tap targets", "Balloon", "Shaking a tree";
// docs/backend.md "Shared world"): a balloon's present, a tree's and a piece of wood, each tapped where it's drawn (a
// real touch: exactTaps.ts sends its click to the finger's point), beside a tree, a building and the water, all collected.
// And the live bug (2026-11-05, the move to https://island-fund.pages.dev: a new origin, empty storage): a phone that
// lost its own record of the day gets my claims back in the relay's replay; what I had opened lay there again on my
// phone and a tap did nothing (my claim was the day's already: it can't be made twice). Now a claim, mine too, is gone.
import { expect, test, type Page } from '@playwright/test';
import { camTo, geo, openNear, quiet, type Geo } from './island.ts';
import { hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });

const DATE = '2026-11-05';
const Q = `?demo&date=${DATE}T12:00&critter=none&visitor=none`;
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
  await expect(hudMenu(page)).toBeVisible();
  await quiet(page);
}
async function open(page: Page): Promise<Geo> {
  await page.goto(Q);
  await expect(hudMenu(page)).toBeVisible();
  await quiet(page);
  return geo(page);
}
/** Whether `id` was claimed by A in the shared day (the phone's fold of it). */
const pickedBy = (page: Page, id: string) =>
  page.evaluate((id) => {
    const d = JSON.parse(localStorage.getItem('island-demo.world.A') ?? '{"events":[]}') as { events: Ev[] };
    return d.events.filter((e) => e.kind === 'pick' && e.id === id).map((e) => `${e.who}:${e.what.split(':')[0]}`);
  }, id);
/** Where a present is drawn: its 3D model's middle (`gift-<uid>`, through the camera's projection), else its art's. */
async function giftPoint(page: Page, uid: string): Promise<[number, number]> {
  const at = () => page.evaluate((uid) => {
    const w = (window as unknown as { __world3d?: { where(id: string): { x: number; y: number; z: number; hidden: boolean } | null; client(x: number, z: number, lift?: number): [number, number] } }).__world3d;
    const p = w?.where(`gift-${uid}`);
    if (p && !p.hidden) return w!.client(p.x, -p.z, p.y + 12);
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
