// The island's test probe (src/lib/components/island/probe.ts; docs/ops/testing.md "The test API"): `__world3d.pick`
// says what a tap at a point goes to, `box` where a thing is, `actor` a villager as shown. Today they read the DOM
// island: here they agree with it (a grid of points over the screen: pick is something exactly where a tap area is,
// and the thing's box holds the point), the oracle the 3D pick is held to when it takes over (the R4 plan).
import { expect, test, type Page } from './fixtures.ts';
import { camTo, is3d, quiet, stageCam } from './island.ts';

/** The DOM island's tap areas (what the specs' taps kept clear of before `pick`): the oracle. */
const TAP_AREAS = 'button, a, [role="button"], [data-actor], [data-fx="talk"]';

/** Each point of a grid over the screen where pick and the DOM disagree (none, when they agree), and how many
 *  points were something. */
const disagree = (page: Page) =>
  page.evaluate((areas) => {
    type Box = { left: number; top: number; width: number; height: number };
    const w = (window as unknown as { __world3d: { pickDom(x: number, y: number): { kind: string; id: string } | null; boxDom(k: string, id: string): Box | null } }).__world3d;
    const out: string[] = [];
    let hits = 0;
    for (let y = 4; y < innerHeight; y += 12)
      for (let x = 4; x < innerWidth; x += 12) {
        const el = document.elementFromPoint(x, y), dom = el?.closest(areas), p = w.pickDom(x, y);
        if (!!dom !== !!p) out.push(`${x},${y}: dom ${dom?.outerHTML.slice(0, 60)} pick ${JSON.stringify(p)}`);
        if (!p) continue;
        hits++;
        if (p.kind === 'ui' || p.kind === 'talk') continue;
        // (its box holds the point, 2 px's slack: WebKit hit-tests a scaled node's tap target a px or two past its box)
        const b = w.boxDom(p.kind, p.id);
        if (!b || x < b.left - 2 || x > b.left + b.width + 2 || y < b.top - 2 || y > b.top + b.height + 2) out.push(`${x},${y}: ${p.kind}:${p.id} outside its box ${JSON.stringify(b)}`);
      }
    return { out, hits };
  }, TAP_AREAS);

test('pick and box agree with the DOM island over the screen (a visitor, villagers, the goal trees, the HUD)', async ({ page }) => {
  // (the DOM's pick itself, pickDom and boxDom: pick and box answer from the 3D tap areas, held to the DOM's by probe3d.spec)
  await page.goto('?demo&date=2026-11-04T12:00&visitor=redd&awake');
  expect(await is3d(page)).toBe(true);
  await quiet(page);
  for (const z of [await stageCam(page), 300]) {
    await camTo(page, z);
    const { out, hits } = await disagree(page);
    expect(out).toEqual([]);
    expect(hits, 'something to tap on screen').toBeGreaterThan(20);
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
