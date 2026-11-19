// Walking (docs/design.md "Walking"): only a tap on empty ground walks my villager; a tap on something to do acts in
// place (my villager turns to it, the tool shows at the target) and a catch is its plate, my villager where it stood; the partner's
// wanders between points of interest with footsteps under it. Neither ends up over a control, mine stays a
// thumb-sized button while it walks, and a sheet stops them where they are.
import { expect, test, type Page } from './fixtures.ts';
import { BUTTONS, camTo, careOut, feetOf, islandUp, isOut, openNear, plateOnly, quiet, sawIt, tapAt, tapBox, tapWorld, w3, walking, watchFor, type ActorIs, type W3 } from './island.ts';
import { openRewards } from './hud.ts';

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await islandUp(page);
  await quiet(page); // the opening beats are over
}
/** A world point on screen (client px). */
const at = (page: Page, x: number, z: number) =>
  page.evaluate(([x, z]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z), [x, z] as const);
/** My villager's feet (client px: its box's foot). */
const feet = async (page: Page, id = 'mine') => ((f) => ({ x: f[0], y: f[1] }))((await feetOf(page, id))!);
/** Controls the standing figure (≈ 0.45 × 0.92 of its height above the feet: its tap area's height) overlaps: none,
 *  ever (`__world3d.controls`: stacked under it or not). */
const overlaps = (page: Page, id = 'mine') =>
  page.evaluate((id) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box('villager', id)!, [x, y] = b.foot!, h = b.height;
    const me = { x0: x - h * 0.225, x1: x + h * 0.225, y0: y - h * 0.92, y1: y };
    return w.controls().filter((c) => !(c.kind === 'villager' && c.id === id))
      .filter(({ box: r }) => me.x0 < r.left + r.width && r.left < me.x1 && me.y0 < r.top + r.height && r.top < me.y1).map((c) => `${c.kind}:${c.id}`);
  }, id);

test('a tap on a weed pulls it where it is: my villager stays put', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // (the day's visitor stands by: the weed nearest the middle grows within its reach, and the weed's own box wins)
    await open(page);
    // the lawn runs on up to the campsite: the camera half way up it, then the weed nearest the screen's middle
    await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(300));
    // (the camera there and the island at rest: the weeds where they're drawn)
    await expect.poll(() => page.evaluate(() => {
      const w = window as unknown as { __world: { idle(): boolean }; __world3d?: { camStill(): boolean } };
      const w2 = window as unknown as { __world: { cam(): number } };
      return Math.abs(w2.__world.cam() - 300) < 1 && (w.__world3d ? w.__world3d.camStill() : w.__world.idle());
    })).toBe(true);
    await expect(page.locator('[data-kk] .art')).toBeVisible(); // (K.K. on his stool: his chunk in, his node placed)
    const weed = () => page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.care().filter((c) => c.kind === 'weed' && c.shown)
      .map((c) => ({ uid: c.uid, x: c.foot[0], y: c.foot[1] })).filter((q) => q.y > 150 && q.y < innerHeight - 30)
      // (nothing else's tap area over it: a flower, a tree, a dig spot beside it)
      .filter((q) => !(window as unknown as { __world3d: { pick(cx: number, cy: number): object | null } }).__world3d.pick(q.x, q.y - 4))
      // (nor behind the day's visitor or K.K. on his stool: their figures stand over it, the scene asks them)
      .filter((q) => [...document.querySelectorAll('[data-visitor] .art, [data-kk] .art')].every((k) => { const b = k.getBoundingClientRect(); return q.x < b.left - 14 || q.x > b.right + 14 || q.y < b.top - 14 || q.y > b.bottom + 14; }))
      .sort((a, b) => Math.abs(a.y - innerHeight * 0.5) - Math.abs(b.y - innerHeight * 0.5))[0] ?? null);
    // (polled: the weeds that came into view show once the camera has settled there and nothing covers them, Care's)
    await expect.poll(weed).not.toBeNull();
    const p = (await weed())!;
    const mine = () => page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
    const at0 = await mine();
    // (frame-locked: the weed where it's drawn at the tap, the island still settling a px or two)
    await tapAt(page, (w, uid) => {
      const f = w.__world3d.care().find((c: { uid: string }) => c.uid === uid)?.foot;
      return f && f[0] ? [f[0], f[1] - 4] : null;
    }, p.uid, { clear: null, mouse: true, message: 'the weed' });
    // pulled at once (that one: another may come into view as the island settles), nobody walked
    await expect.poll(async () => (await careOut(page, 'weed')).some((c) => c.uid === p.uid), { timeout: 3000 }).toBe(false);
    await page.waitForTimeout(400);
    await expect.poll(() => walking(page)).toBe(false);
    // (where it stands on the island: the camera may still ease a px or two on the long island)
    const at1 = await mine();
    expect(Math.hypot(at1[0] - at0[0], at1[1] - at0[1])).toBeLessThan(1);
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/weed.png` });
  });

test('a tap on the ground walks there, never over a control, a thumb-sized button on the way; a second tap re-targets the walk from where the villager is', async ({ page }) => {
  await open(page);
  const home = await feet(page);
  // (open ground there a tap walks to, nothing over it on this screen)
  const pa = await openNear(page, 210, 290, 45, true), pb = await openNear(page, 175, 185, 45, true);
  // (frame-locked taps, each where its ground is at the tap: the camera follows the walk)
  await tapWorld(page, ...pa, { mouse: true });
  await expect.poll(() => walking(page)).toBe(true);
  const btn = await w3(page, (w) => w.box('villager', 'mine'));
  expect(Math.min(btn!.width, btn!.height)).toBeGreaterThanOrEqual(44);
  await page.waitForTimeout(150);
  await tapWorld(page, ...pb, { mouse: true });
  await expect.poll(() => walking(page), { timeout: 4000 }).toBe(false);
  const f = await feet(page), b = await at(page, ...pb);
  expect(Math.hypot(f.x - home.x, f.y - home.y)).toBeGreaterThan(20);
  expect(Math.hypot(f.x - b[0], f.y - b[1])).toBeLessThan(12);
  expect(await overlaps(page)).toEqual([]);
});

test('a netted bug holds still under the net, swung where it is (no walk); the catch is its plate, flown in from the bug, nothing over the head, my villager bouncing', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a wait sized for the game at full speed (an animation, a spawn, a sync within its seconds); software GL slows the game itself' } }, async ({ page }) => {
  const SQUISH: ActorIs = { actor: 'mine', is: 'act:squish' };
  await watchFor(page, [SQUISH]);
  await open(page, '&critter=common-butterfly');
  await expect.poll(() => isOut(page, 'common-butterfly')).toBe(true);
  await page.waitForTimeout(1600); // it has flown in
  const home = await feet(page);
  // (frame-locked: it flutters)
  const p = await tapBox(page, 'critter', 'common-butterfly', { clear: BUTTONS, mouse: true });
  // held still where it was under the net
  const still = await page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    const at = () => { const c = w.critters().find((c) => c.id === 'common-butterfly'); return c ? JSON.stringify(c.box) : null; };
    const a = at();
    return new Promise<boolean>((done) => setTimeout(() => { const b = at(); done(b === null || b === a); }, 100));
  });
  expect(still).toBe(true);
  // the net floats and swings where the bug is; my villager stays where it stood
  await expect(page.locator('[data-net="float"]')).toBeAttached({ timeout: 2000 });
  await expect.poll(() => walking(page)).toBe(false);
  // the plate in the bottom stack, its icon flown in from where the bug was; nothing over my villager's head
  const from = await plateOnly(page, 'critters/common-butterfly');
  expect(Math.hypot(from.x - p.x, from.y - p.y)).toBeLessThan(60);
  // and my villager gave the tap's little bounce
  expect(await sawIt(page, SQUISH)).toBe(true);
  const f = await feet(page);
  expect(Math.hypot(f.x - home.x, f.y - home.y)).toBeLessThan(1); // where it stood
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/catch.png` });
});

test('a sheet stops the walk where it is', async ({ page }) => {
  await open(page);
  // (open lawn read from the page's island: a fixed point may be where a building or the day's things stand)
  await tapWorld(page, ...(await openNear(page, 210, 290, 45, true)), { mouse: true });
  await page.waitForTimeout(120);
  await openRewards(page);
  await expect(page.locator('dialog[open]')).toBeVisible();
  const a = await feet(page);
  await page.waitForTimeout(700);
  expect(await feet(page)).toEqual(a);
  await expect.poll(() => walking(page)).toBe(false);
});

/** The partner sets off on a one-stop outing (__world.wander; false: it can't yet). */
const setOff = (page: Page) => page.evaluate(() => (window as unknown as { __world: { wander(): boolean } }).__world.wander());
const footsteps = (page: Page) =>
  page.evaluate(() => ((window as { __cues?: string[] }).__cues ?? []).filter((c) => c.startsWith('footstep-')).length);

test('the partner wanders off to a point of interest and back, footsteps under it, never over a control', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
    await page.goto('?demo&date=2026-11-04T12:00&awake'); // (the partner's app counted open: awake, free to go)
    // the island up and its opening beats over (10-odd s in software GL), where the partner stands read, then its outing
    // (`?wander`'s timer set it off 3.2 s in, now and then before the spec had read where it stood: WebKit 3 in 8)
    await islandUp(page, { timeout: 15_000 });
    await quiet(page);
    // (where it stood as it set off: wander only sends it from home)
    let home = { x: 0, y: 0 }, steps = 0;
    await expect.poll(async () => {
      const [at, n] = [await feet(page, 'partner'), await footsteps(page)];
      if (!(await setOff(page))) return false;
      [home, steps] = [at, n];
      return true;
    }).toBe(true);
    await expect.poll(() => walking(page, 'partner')).toBe(true);
    await expect.poll(() => footsteps(page)).toBeGreaterThan(steps);
    await expect.poll(() => walking(page, 'partner'), { timeout: 8000 }).toBe(false);
    const there = await feet(page, 'partner');
    expect(Math.hypot(there.x - home.x, there.y - home.y)).toBeGreaterThan(20);
    expect(await overlaps(page, 'partner')).toEqual([]);
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/wander.png` });
    // an outing ends at home
    await expect.poll(async () => {
      const f = await feet(page, 'partner');
      return Math.round(Math.hypot(f.x - home.x, f.y - home.y));
    }, { timeout: 30_000 }).toBeLessThan(2);
  });

test('under a sheet the walkers stop and no footstep sounds', async ({ page }) => {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-11-04T12:00&awake');
  // (the island up and its opening beats over first, as above, then the partner's outing)
  await islandUp(page, { timeout: 15_000 });
  await quiet(page);
  await expect.poll(() => setOff(page)).toBe(true);
  await expect.poll(() => walking(page, 'partner')).toBe(true);
  await openRewards(page);
  await expect(page.locator('dialog[open]')).toBeVisible();
  const n = await footsteps(page);
  const a = await feet(page, 'partner');
  await page.waitForTimeout(1500);
  expect(await feet(page, 'partner')).toEqual(a);
  expect(await footsteps(page)).toBe(n);
});

test('a visitor: a tap and they speak, my villager turning to them where it stands', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('?demo&date=2026-11-04T12:00&visitor=jingle');
    await islandUp(page);
    await quiet(page);
    // a host stands on centre stage, the campsite's clearing (おく)
    await camTo(page, 642, false);
    const home = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
    // (frame-locked: the figure where it's drawn at the tap; its layer takes no pointer, the scene asks it)
    await tapBox(page, 'visitor', 'jingle', { clear: null, mouse: true });
    await expect(page.locator('[data-fx="talk"].placed')).toBeVisible({ timeout: 4000 });
    await expect.poll(() => walking(page)).toBe(false);
    expect(await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine())).toEqual(home);
  });
