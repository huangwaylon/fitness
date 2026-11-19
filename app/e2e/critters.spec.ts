// The island's critters and the balloon (docs/design.md "Scene interactions", "Balloon"): the balloon flies over the
// island in 3D, a tap pops it and its present falls to open ground in the front of the view; a fish shadow can be
// fished (caught on the bite, scared off by an early tap); a bug can be netted. None of it changes ベル, opens a sheet or
// navigates. `?critter=` (with ?demo) brings one on at once and keeps it until caught.
import { expect, test, type Page } from './fixtures.ts';
import { CATCH_LINES } from '../src/lib/world/catchLines.ts';
import { type Aim, BUTTONS, careOut, castIn, critter, findCount, findsOut, float, islandUp, isOut, loaded3d, mid, plateOnly, reelOnBite, tapAt, tapBox, tapFigure, toTheWater, w3, type W3 } from './island.ts';
import { hudBells } from './hud.ts';

/** NH's own catch line (ja), as the plate shows it (whitespace collapsed). */
const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');

// The installed app's full screen (a Home Screen app has no browser bars): with the island centred in the whole ocean,
// the 664px Safari viewport leaves too little sea under the beach for a fish.
test.use({ viewport: { width: 390, height: 844 } });


async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await islandUp(page);
  return { bells: await hudBells(page).getAttribute('aria-label'), url: page.url() };
}

/** Nothing counted, nothing opened, nowhere gone. */
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(hudBells(page)).toHaveAttribute('aria-label', before.bells!);
}

const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

test('a tap pops the balloon; its present falls onto the island and lies there until a tap picks it up', async ({ page }) => {
  // (the ずかん's packs: lib/artPack)
  const paks: string[] = [];
  page.on('request', (r) => /\/art\/finds\/pack\/.+\.pak$/.test(r.url()) && paks.push(r.url()));
  const before = await open(page, '&balloon');
  const balloon = () => w3(page, (w) => w.box('balloon'));
  // it drifts in from off the screen's edge: wait until it's well inside
  await expect.poll(async () => { const r = await balloon(); return !!r && r.left > 40 && r.left + r.width < 350; }, { timeout: 15_000 }).toBe(true);
  // (frame-locked: it drifts)
  await tapFigure(page, 'balloon', '', 0.25);
  await expect(page.locator('[data-fx="present"]')).toHaveCount(1);
  await expect.poll(balloon).toBeNull();
  expect(await cues(page)).toContain('scene-balloon');
  // it lands on the lawn and stays there (NH) until it's picked up, clear of everything lying there
  const gifts = () => findCount(page, 'present');
  await expect.poll(gifts, { timeout: 5000 }).toBe(1);
  await page.waitForTimeout(5000);
  expect(await gifts()).toBe(1);
  const g = (await findsOut(page, 'present'))[0].box;
  // (a world node out of view keeps its last box: only what is on screen counts; each by the point it lies on)
  const others = [...(await careOut(page)), ...(await findsOut(page)).filter((f) => f.kind !== 'present')].filter((o) => o.shown);
  for (const o of others) {
    const d = Math.hypot(o.foot[0] - (g.left + g.width / 2), o.foot[1] - (g.top + g.height));
    expect(d, o.kind).toBeGreaterThan(16);
  }
  // a tap: the present pops open where it lies (confetti), and what was inside (NH's furniture, clothing or a
  // DIY recipe) is on its plate with 「◯◯を てにいれた！」, nothing over my villager's head; no ベル
  await tapFigure(page, 'find', 'present');
  await expect(page.locator('[data-fx="present-open"]')).toHaveCount(1, { timeout: 2000 });
  await expect(page.locator('[data-fx="present-open"] .bit')).toHaveCount(14);
  await expect(page.locator('[data-fx="catch"]')).toContainText('を てにいれた！', { timeout: 4000 });
  // (or a genuine artwork for the museum: 1 present in 10, island/catalog.ts ART_ONE_IN)
  await plateOnly(page, /\/(finds\/(items|art)\/[^/]+|presents\/diy-recipe)\.webp/);
  // its icon drawn: a packed one's (clothing, an artwork) cut from its one pack, else its own file
  const icon = page.locator('[data-catch-stack] [data-fx="catch"].placed').last().locator('.catch-icon img');
  await expect.poll(() => icon.evaluate((i: HTMLImageElement) => (i.complete ? i.naturalWidth : 0))).toBeGreaterThan(0);
  const packed = (await icon.getAttribute('src'))!.startsWith('blob:');
  expect(paks, String(packed)).toHaveLength(packed ? 1 : 0);
  // the ずかん's カタログ / レシピ: a first find of it, and one more in today's tally (held a minute before it's sent)
  const sent = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []) as { type: string; data: Record<string, unknown> }[]);
  const find = sent.find((e) => e.type === 'find')!.data as { kind: string; id: string };
  expect(['item', 'recipe']).toContain(find.kind);
  expect(sent.filter((e) => e.type === 'tally').map((e) => e.data.counts)).toEqual([{ [`${find.kind}:${find.id}`]: 1 }]);
  await expect.poll(gifts).toBe(0);
  await unchanged(page, before);
});

type Rig = { model: string; balloon: number[]; gift: number[]; shadow: number[]; loaded: boolean };
type W3b = {
  __world3d?: { loaded(): boolean; balloon(): Rig | null; where(id: string): { hidden: boolean; model: string } | null; go(z: number, k?: number, x?: number): void; zoomRange(): { min: number; max: number }; limits(): { min: number; max: number } };
  __balloon?: { flight(): { f: { x0: number; x1: number; z: number; y: number; ms: number }; age: number } | null; pop(): void; move(x: number, z: number): void };
  __world: { at(x: number, z: number): [number, number]; ground(x: number, z: number): { surface: string } };
  __lands?: ([number, number, number] | null)[];
};
const W3b = (page: Page) => page.evaluate(() => (window as unknown as W3b).__world3d?.balloon() ?? null);

test('a balloon flies over the island in world space (its height steady, its shadow under it); popped, nothing is left in the sky', async ({ page }) => {
  await open(page, '&balloon');
  await loaded3d(page);
  await expect.poll(() => W3b(page), { timeout: 10_000 }).not.toBeNull();
  const a = (await W3b(page))!;
  await page.waitForTimeout(1200);
  const b = (await W3b(page))!;
  // it crosses: on along x, at its height (a gentle bob), the present on its string under the balloon, the blob
  // shadow on the ground right under it, well below
  expect(Math.abs(b.balloon[0] - a.balloon[0])).toBeGreaterThan(5);
  expect(Math.abs(b.balloon[1] - a.balloon[1])).toBeLessThan(8);
  expect(b.gift[1]).toBeLessThan(b.balloon[1] - 15);
  expect(Math.abs(b.shadow[2] - b.balloon[2])).toBeLessThan(6);
  expect(b.balloon[1] - b.shadow[1]).toBeGreaterThan(150);
  const f = await page.evaluate(() => (window as unknown as W3b).__balloon!.flight()!.f);
  expect(Math.sign(f.x1 - f.x0)).toBe(Math.sign(b.balloon[0] - a.balloon[0]));
  // its tap area on it: wait until it's well inside the screen, then a tap on it pops it
  const balloon = () => w3(page, (w) => w.box('balloon'));
  await expect.poll(async () => { const r = await balloon(); return !!r && r.left > 40 && r.left + r.width < 350; }, { timeout: 15_000 }).toBe(true);
  const r = (await balloon())!;
  expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(44);
  await tapFigure(page, 'balloon', '', 0.25);
  // gone at once, the 3D models and the tap area alike: only the falling present remains (its own model on its arc)
  await expect.poll(() => W3b(page), { timeout: 300 }).toBeNull();
  await expect.poll(balloon).toBeNull();
  expect(await cues(page)).toContain('scene-balloon');
  await expect(page.locator('[data-fx="present"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => (window as unknown as W3b).__world3d!.where('drop-1')?.model ?? null)).toBe('finds/present');
  await expect.poll(() => findCount(page, 'present'), { timeout: 5000 }).toBe(1);
  expect(await W3b(page)).toBeNull();
});

// Where the present lands, wherever it's popped: on open sand or grass in the front of the view, inside it, clear of
// the HUD and the bottom controls, where a tap picks it up. `cam`: the camera (a share of the way from まえ to おく,
// and the zoom: 'max' fully in); `over`: the balloon moved over a world point first (null: where it flies).
const POPS = [
  { name: 'at まえ, where it flies', cam: [0, 1], over: null },
  { name: 'over the back of the island (beyond the view): it drifts to the front', cam: [0.3, 1], over: [120, 1500] },
  { name: 'zoomed fully in', cam: [0.15, 'max'], over: null },
  { name: 'at おく, over the far side', cam: [1, 1], over: [330, 'back'] },
  { name: 'over the sea off the side', cam: [0.1, 1], over: [-60, 'mid'] }
] as const;
for (const c of POPS)
  test(`a popped balloon's present lands in the front of the view, on open ground, clear of the controls: ${c.name}`, async ({ page }) => {
    await open(page, '&balloon');
    await loaded3d(page);
    await expect.poll(() => W3b(page), { timeout: 10_000 }).not.toBeNull();
    await page.evaluate(({ cam, over }) => {
      const w = window as unknown as W3b, w3 = w.__world3d!, lim = w3.limits();
      w3.go(lim.min + (lim.max - lim.min) * cam[0], cam[1] === 'max' ? w3.zoomRange().max : 1);
      w.__lands = [];
      document.querySelector('.if-scene')!.addEventListener('island:present', (e) => w.__lands!.push((e as CustomEvent<{ to: [number, number, number] | null }>).detail.to));
      if (over) {
        // (the far end of the view's ground, or its middle)
        const g = (sy: number) => (w3 as unknown as { ground(x: number, y: number): { z: number } | null }).ground(195, sy)?.z ?? 0;
        const z = over[1] === 'back' ? g(innerHeight * 0.3) + 250 : over[1] === 'mid' ? g(innerHeight * 0.6) : over[1];
        w.__balloon!.move(over[0], z);
      }
    }, { cam: c.cam, over: c.over });
    await page.waitForTimeout(300);
    await page.evaluate(() => (window as unknown as W3b).__balloon!.pop());
    await expect.poll(() => W3b(page)).toBeNull(); // (popped: gone, however long a loaded runner's round trips take)
    const to = (await page.evaluate(() => (window as unknown as W3b).__lands![0]))!;
    expect(to).not.toBeNull();
    const at = await page.evaluate(([x, z]) => {
      const w = window as unknown as W3b;
      const rib = document.querySelector('.ribbon-wrap')!.getBoundingClientRect(), scene = document.querySelector('.if-scene')!.getBoundingClientRect();
      const hy = Number((document.querySelector('.if-scene') as HTMLElement).dataset.horizon);
      // every control outside the island's stage (the HUD's, the say button, the catch stack)
      const ui = [...document.querySelectorAll('button, [data-catch-stack]')].filter((el) => !el.closest('.stage') && (el as HTMLElement).checkVisibility()).map((el) => el.getBoundingClientRect()).filter((b) => b.width && b.height)
        .map((b) => [b.left, b.top, b.right, b.bottom]);
      return { p: w.__world.at(x, z), surface: w.__world.ground(x, z).surface, top: Math.max(rib.bottom, scene.top + hy), bottom: Math.min(scene.bottom, innerHeight), w: innerWidth, ui };
    }, [to[0], to[2]]);
    expect(['grass', 'sand']).toContain(at.surface);
    const [px, py] = at.p;
    // in view, in its front (the lower part), not under a control
    expect(px).toBeGreaterThan(16);
    expect(px).toBeLessThan(at.w - 16);
    expect(py).toBeGreaterThan(at.top + (at.bottom - at.top) * 0.25);
    expect(py).toBeLessThan(at.bottom - 16);
    for (const [x0, y0, x1, y1] of at.ui) expect(px > x0 && px < x1 && py > y0 && py < y1, `under a control at ${x0},${y0}`).toBe(false);
    // it lands there and a tap picks it up
    await expect.poll(() => findCount(page, 'present'), { timeout: 5000 }).toBe(1);
    const g = (await findsOut(page, 'present'))[0].box;
    expect(Math.hypot(g.left + g.width / 2 - px, g.top + g.height - py)).toBeLessThan(40);
    // (frame-locked: a point of it no villager stands over, its middle first: one wandering past, or zoomed in the
    // partner standing by, lies in front of it, and a tap there is theirs)
    await tapAt(page, (w) => {
      const r = w.__world3d.finds().find((f: { kind: string }) => f.kind === 'present')?.box;
      if (!r) return null;
      for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.75], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (w.__world3d.pick(x, y)?.kind !== 'villager') return [x, y] as const;
      }
      return null;
    }, null, { clear: ['villager'], mouse: true, timeout: 10_000 });
    await expect(page.locator('[data-fx="present-open"]')).toHaveCount(1, { timeout: 3000 });
  });

/** A point on the sea well away from the float and the shadow, on the screen's other side at the float's height or
 *  just above, with no control over it: the float low on the screen put 366 on the say button (its sheet opened, the
 *  line stayed out: 4 in 20 under load). */
const awayAim: Aim<null> = (w) => {
  const r = w.__world3d.box('bobber');
  if (!r) return null;
  const bx = r.left + r.width / 2, by = r.top + r.height / 2;
  for (let dy = 0; dy <= 160; dy += 8)
    for (let dx = 0; dx <= 120; dx += 8) {
      const x = bx < 195 ? 366 - dx : 24 + dx, y = by - dy, g = w.__world3d.ground(x, y);
      if (g && w.__world.ground(g.x, g.z).surface === 'sea' && document.elementFromPoint(x, y)?.matches('.stage, canvas')) return [x, y];
    }
  return null;
};
/** awayAim's point, polled (a villager or a ripple may lie over every such point for a moment: WebKit's 1 in 20). */
const awayFromFloat = async (page: Page): Promise<[number, number]> => {
  let pt: [number, number] | null = null;
  await expect.poll(async () => (pt = (await page.evaluate(`(${awayAim.toString()})(window, null)`)) as [number, number] | null), { message: 'the sea away from the float, no control over it' }).not.toBeNull();
  return pt!;
};
/** A tap on the sea well away from the float and the shadow (any tap is the reel while the line is out): frame-locked,
 *  its point found and tapped in one held frame, polled while a control or a ripple lies over every such point. */
async function seaTap(page: Page) {
  await tapAt(page, awayAim, null, { clear: null, mouse: true, message: 'the sea away from the float, no control over it' });
}
/** My villager on the beach by the shadow and a cast beside it (NH casts from where it stands): the float out. */
async function castBy(page: Page) {
  await expect.poll(() => isOut(page, 'fish')).toBe(true);
  await castIn(page, 'sea');
  await expect.poll(() => float(page)).not.toBeNull();
}
/** The fish has noticed the float (it swims up to it: world/fishing.ts). */
const noticed = (page: Page) =>
  expect.poll(() => page.evaluate(() => (window as unknown as { __fish: { line(): { fish: string | null } | null } }).__fish.line()?.fish ?? null), { timeout: 8000 }).not.toBeNull();

test('fishing: react to the 「！」 and a tap anywhere on the sea catches the fish', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  await expect.poll(() => isOut(page, 'fish')).toBe(true);
  const f = mid((await critter(page, 'fish'))!.box);
  // the shadow swims in the sea in front of the front beach (nearer than the shoreline, seen from まえ)
  const shore = await page.evaluate(() => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(195, 0)[1]);
  expect(f.y).toBeGreaterThan(shore);
  expect(f.y).toBeLessThan(844);
  await castBy(page);
  // the 「！」 a human's reaction after it shows (400 ms, in the page: a round trip back from here takes longer on a
  // loaded runner), small (≤ 28px) and inside the screen; nobody walked; then a tap on the sea reels it in
  const [tx, ty] = await awayFromFloat(page);
  const bang = await page.evaluate(([x, y]) => new Promise<{ x: number; width: number; under: boolean; walking: number }>((ok, no) => {
    const t = setTimeout(() => no(new Error('no bite')), 15_000);
    const look = () => {
      if (!document.querySelector('[data-bite]')) return requestAnimationFrame(look);
      setTimeout(() => {
        const r = document.querySelector('[data-bite]')!.getBoundingClientRect();
        const seen = { x: r.x, width: r.width, under: !!(window as unknown as { __fish: { line(): { under: boolean } | null } }).__fish.line()?.under, walking: (window as unknown as { __world3d: W3 }).__world3d.actor('mine')?.walking ? 1 : 0 };
        document.elementFromPoint(x, y)?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
        clearTimeout(t);
        ok(seen);
      }, 400);
    };
    look();
  }), [tx, ty] as const);
  expect(await page.locator('[data-bite]').count()).toBe(0);
  expect(bang.width).toBeLessThanOrEqual(28.5);
  expect(bang.x).toBeGreaterThanOrEqual(7.5);
  expect(bang.x + bang.width).toBeLessThanOrEqual(390 - 7.5);
  expect(bang.under).toBe(true);
  expect(bang.walking).toBe(0);
  const caught = page.locator('[data-fx="catch"]');
  await expect(caught).toHaveCount(1);
  await expect(caught).toContainText('釣'); // every sea fish's line says it (釣り上げた, 一本釣りだ…), whichever came
  await expect.poll(() => float(page)).toBeNull();
  await expect(page.locator('[data-bite]')).toHaveCount(0);
  await expect.poll(() => isOut(page, 'fish')).toBe(false);
  const heard = await cues(page);
  expect(heard).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
  expect(heard).not.toContain('scene-flee');
  await unchanged(page, before);
});

test('fishing: a tap while the fish swims up or nibbles scares it away (NH’s early pull), the line in', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  await castBy(page);
  await noticed(page);
  await seaTap(page);
  await expect.poll(() => float(page)).toBeNull();
  await expect.poll(() => isOut(page, 'fish'), { timeout: 2000 }).toBe(false);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-reel', 'scene-flee']));
  expect(await page.evaluate(() => (window as unknown as { __fish: { why(): string } }).__fish.why())).toBe('scared');
  await unchanged(page, before);
});

test('fishing: a tap while the float is still in the air reels it back in (never a dead tap), and the fish stays', async ({ page }) => {
  await open(page, '&critter=fish');
  await expect.poll(() => isOut(page, 'fish')).toBe(true);
  const [x, y] = await toTheWater(page, 'sea');
  // the cast and the reel in one go, in the page: the second tap lands while the float flies (world/fishing.ts FLY_MS)
  const phase = await page.evaluate(([x, y]) => {
    const tap = () => document.elementFromPoint(x, y)?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    const F = (window as unknown as { __fish: { line(): { phase: string } | null } }).__fish;
    tap();
    const was = F.line()?.phase ?? null;
    tap();
    return [was, F.line()?.phase ?? null];
  }, [x, y] as const);
  expect(phase).toEqual(['flying', null]);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-cast', 'scene-reel']));
  expect(await isOut(page, 'fish')).toBe(true);
});

test('a shark: a fin cuts the surface (NH), and the catch names it', async ({ page }) => {
  const before = await open(page, '&critter=great-white-shark');
  await expect.poll(async () => (await critter(page, 'fish'))?.shape).toBe('fin');
  await castBy(page);
  const [x, y] = await awayFromFloat(page);
  await reelOnBite(page, x, y, 15_000);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('great-white-shark'));
  await unchanged(page, before);
});

test('a tap on a butterfly nets it', async ({ page }) => {
  const before = await open(page, '&critter=common-butterfly');
  await expect.poll(() => isOut(page, 'common-butterfly')).toBe(true);
  await page.waitForTimeout(2200); // in over its flowers
  // (frame-locked: it flutters; never under a control)
  await tapBox(page, 'critter', 'common-butterfly', { clear: BUTTONS, mouse: true });
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('common-butterfly'));
  expect(await w3(page, (w) => w.critters().length)).toBe(0);
  // the shared ずかん: the first catch is a `find` (the demo keeps its events in localStorage), never ベル
  const finds = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
  expect(finds).toEqual([{ kind: 'bug', id: 'common-butterfly' }]);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await unchanged(page, before);
});

test('a cicada perches on a trunk, clear of the tree, and a tap on it nets it', async ({ page }) => {
  await open(page, '&critter=robust-cicada');
  await expect.poll(async () => (await critter(page, 'robust-cicada'))?.sat, { timeout: 5000 }).toBe(true);
  // (frame-locked, once no control is over it: not on the canopy or the fruit row, nor a villager walking by)
  await tapBox(page, 'critter', 'robust-cicada', { clear: BUTTONS, mouse: true });
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('robust-cicada'));
});

test('a hermit crab crawls on the beach at night, clear of every control, and a tap on it nets it', async ({ page }) => {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-07-04T21:00&critter=hermit-crab');
  await islandUp(page);
  await expect.poll(() => isOut(page, 'hermit-crab')).toBe(true);
  await page.waitForTimeout(1000);
  // (frame-locked: it crawls; clear of every control)
  await tapBox(page, 'critter', 'hermit-crab', { clear: BUTTONS, mouse: true });
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('hermit-crab'));
});

test.describe(() => {
  test.use({ ambient: 'on' }); // (the balloon's own schedule: ambient life, e2e/fixtures.ts)
  test('a balloon floats by on its own in the daytime (the first in 20–40 s), across the island under the HUD', async ({ page }) => {
    await page.clock.install();
    await open(page, '');
    const balloon = () => w3(page, (w) => w.box('balloon'));
    expect(await balloon()).toBeNull();
    await page.clock.fastForward(61_000); // (its timers, not its every frame: the 3D island would draw each, in software on CI)
    await expect.poll(balloon).not.toBeNull();
    // its tap area (on the balloon and its present) under the HUD and over the island's foot, whatever x it's at
    await expect.poll(() => page.evaluate(() => {
      const rib = document.querySelector('.ribbon-wrap')!.getBoundingClientRect(), b = (window as unknown as { __world3d: W3 }).__world3d.box('balloon')!;
      const s = document.querySelector('.if-scene')!.getBoundingClientRect();
      return b.top + b.height / 2 > rib.bottom + 10 && b.top + b.height < s.bottom && b.height >= 44;
    }), { timeout: 5000 }).toBe(true);
  });
});

test('fish shadows: one each, NH’s sizes reading apart (a clownfish tiny, a whale shark huge)', async ({ page }) => {
  const len = async (id: string) => {
    await open(page, `&critter=${id}`);
    // (its length in world units: its box on screen turns with its heading and wags)
    await expect.poll(() => page.evaluate(() => (window as unknown as { __fish: { fish(): unknown[] } }).__fish.fish().length)).toBe(1);
    return page.evaluate(() => (window as unknown as { __fish: { fish(): { len: number }[] } }).__fish.fish()[0].len);
  };
  const small = await len('clownfish'), big = await len('whale-shark');
  expect(big / small).toBeGreaterThan(2.8); // 46u against 14u
});
