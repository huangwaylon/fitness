// The island's test probe (src/lib/components/island/probe.ts; docs/ops/testing.md "The test API"): `__world3d.pick`
// says what a tap at a point goes to, `box` where a thing is, `actor` a villager as shown. The island has no DOM of its
// own (R4 steps 7–9): pick answers from the 3D tap areas, but over the DOM above the island (the HUD, the speech
// balloon), which is the DOM's: here each of the page's buttons answers as itself, and every point pick gives a tap
// area lies in that thing's box (a grid of points over the screen).
import { expect, test, type Page } from './fixtures.ts';
import { camTo, is3d, quiet, stageCam } from './island.ts';

/** The DOM over the island a tap goes to (the HUD's buttons, the speech balloon). */
const DOM_AREAS = 'button, a, [role="button"], [data-fx="talk"]';

/** Each point of a grid over the screen where pick isn't what's there (a button not `ui`/`talk`; a tap area's point
 *  outside its thing's box), and how many points were the DOM's and the tap areas'. */
const disagree = (page: Page) =>
  page.evaluate((areas) => {
    type Box = { left: number; top: number; width: number; height: number };
    const w = (window as unknown as { __world3d: { pick(x: number, y: number): { kind: string; id: string } | null; box(k: string, id: string): Box | null } }).__world3d;
    const out: string[] = [];
    let dom = 0, taps = 0;
    for (let y = 4; y < innerHeight; y += 12)
      for (let x = 4; x < innerWidth; x += 12) {
        const el = document.elementFromPoint(x, y), b = el?.closest(areas), p = w.pick(x, y);
        if (b) {
          dom++;
          if (p?.kind !== 'ui' && p?.kind !== 'talk') out.push(`${x},${y}: dom ${b.outerHTML.slice(0, 60)} pick ${JSON.stringify(p)}`);
          continue;
        }
        if (!p) continue;
        taps++;
        // (its box holds the point, the pick's own slop: pick3d.ts SLOP, 2 px)
        const r = w.box(p.kind, p.id);
        if (!r || x < r.left - 2 || x > r.left + r.width + 2 || y < r.top - 2 || y > r.top + r.height + 2) out.push(`${x},${y}: ${p.kind}:${p.id} outside its box ${JSON.stringify(r)}`);
      }
    return { out, dom, taps };
  }, DOM_AREAS);

test("pick over the screen: the HUD's buttons as themselves, every tap area's point in its thing's box", async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=redd&awake');
  expect(await is3d(page)).toBe(true);
  await quiet(page);
  for (const z of [await stageCam(page), 300]) {
    await camTo(page, z);
    const { out, dom, taps } = await disagree(page);
    expect(out).toEqual([]);
    expect(dom, 'the HUD on screen').toBeGreaterThan(20);
    expect(taps, 'something to tap on the island').toBeGreaterThan(20);
  }
});

test("box: a villager's and a visitor's foot is where the world puts them; actor reads my villager", async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=redd');
  expect(await is3d(page)).toBe(true);
  await camTo(page, await stageCam(page));
  const r = await page.evaluate(() => {
    type W = {
      __world3d: { box(k: string, id?: string): { foot: [number, number] | null } | null; actor(slot?: string): { walking: boolean; v3: boolean } | null; pick(x: number, y: number): { kind: string; id: string } | null };
      __world: { at(x: number, z: number): [number, number]; mine(): [number, number] };
    };
    const w = window as unknown as W, foot = w.__world3d.box('villager', 'mine')!.foot!, at = w.__world.at(...w.__world.mine());
    const v = w.__world3d.box('visitor', 'redd');
    return { off: Math.hypot(foot[0] - at[0], foot[1] - at[1]), visitor: !!v?.foot, actor: w.__world3d.actor(), none: w.__world3d.box('villager', 'nobody') };
  });
  expect(r.off).toBeLessThan(2);
  expect(r.visitor).toBe(true);
  expect(r.actor).toMatchObject({ walking: false, v3: true });
  expect(r.none).toBeNull();
});
