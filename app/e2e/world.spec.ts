// The rolling-log world (docs/design.md "World"): one depth order for everything (behind a tree a villager is hidden
// by it; just in front it covers the trunk while the canopy covers its head; a building likewise), the native scroller
// is the camera with two stops (まえ, おく), taps land on transformed sprites near the horizon, and nothing
// runs once it is still.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; cam(): number; stops(): number[]; idle(): boolean; at(x: number, z: number): [number, number]; put(x: number, z: number): void };
const world = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { __world?: W }).__world);
  await page.waitForTimeout(500);
};
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;

async function open(page: Page, cam: number) {
  await page.goto('?demo&season=summer&date=2026-07-01T10:00');
  await world(page);
  await call(page, (w, [z]) => w.go(z), [cam]);
  await page.waitForTimeout(400);
}

/** Put my villager at (x, z) and say who is on top at a point of it (fy: 0 its head … 1 its feet). */
async function topAt(page: Page, x: number, z: number, fy: number) {
  await call(page, (w, [x, z]) => w.put(x, z), [x, z]);
  // the scenery's art lets taps through (pointer-events: none): make it hit-testable for the probe
  await page.addStyleTag({ content: '[data-scenery-id] .art, [data-building] .door { pointer-events: auto !important; }' });
  await page.waitForTimeout(150);
  const r = (await page.locator('[data-actor="mine"] .vil img').first().boundingBox())!;
  return page.evaluate(([px, py]) => {
    const e = document.elementFromPoint(px, py);
    if (!e) return null;
    if (e.closest('[data-actor="mine"]')) return 'mine';
    const tree = e.closest('[data-scenery-id]');
    if (tree) return `${(tree as HTMLElement).dataset.sceneryId}:${(tree as HTMLElement).dataset.part}`;
    const b = e.closest('[data-building]');
    if (b) return `building:${(b as HTMLElement).dataset.building}`;
    return e.className.toString() || e.tagName;
  }, [r.x + r.width / 2, r.y + r.height * fy]);
}

test('a villager behind a tree is hidden by it; just in front it covers the trunk and the canopy covers its head', async ({ page }) => {
  await open(page, 300);
  // the oak behind the lawn at (328, 494)
  expect(await topAt(page, 328, 510, 0.55)).toMatch(/^oak-m1:/);
  expect(await topAt(page, 328, 486, 0.92)).toBe('mine');
  expect(await topAt(page, 328, 486, 0.08)).toBe('oak-m1:canopy');
  expect(await topAt(page, 328, 444, 0.1)).toBe('mine');
});

test('behind a building it is hidden, in front of it it covers it', async ({ page }) => {
  await open(page, 760);
  // the campsite's tent at (196, 984)
  expect(await topAt(page, 196, 1000, 0.6)).toBe('building:campsite');
  expect(await topAt(page, 196, 960, 0.4)).toBe('mine');
});

test('the camera is the scroller: two stops, the sprites follow it, nothing runs once it stops', async ({ page }) => {
  await page.goto('?demo&season=summer');
  await world(page);
  const [front, back] = await call(page, (w) => w.stops());
  expect(await call(page, (w) => w.cam())).toBe(front); // まえ: the bottom of the scroller
  expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= innerHeight)).toBe(true);
  /** The transforms of the scenery shown now, by id. */
  const shown = () => page.locator('[data-scenery-id]').evaluateAll((els) =>
    Object.fromEntries(els.filter((e) => (e as HTMLElement).style.visibility !== 'hidden').map((e) => [`${(e as HTMLElement).dataset.sceneryId}:${(e as HTMLElement).dataset.part}`, (e as HTMLElement).style.transform])));
  const before = await shown();
  await page.locator('[data-world-scroller]').evaluate((e) => e.scrollBy(0, -400));
  await page.waitForTimeout(500);
  // it rests where the scroll left it (no settling)
  const at = await call(page, (w) => w.cam());
  expect(at).toBeGreaterThan(front);
  await page.waitForTimeout(600);
  expect(await call(page, (w) => w.cam())).toBe(at);
  const after = await shown(), both = Object.keys(after).filter((k) => k in before);
  expect(both.length).toBeGreaterThan(0);
  expect(both.every((k) => after[k] !== before[k])).toBe(true);
  // once still, no frame is pending (polled: on a slow runner the snap's smooth scroll, or an ambient beat that sets a
  // villager walking, can still be under way)
  await expect.poll(() => call(page, (w) => w.idle()), { timeout: 10_000 }).toBe(true);
  for (const z of [back, 300, front]) {
    await call(page, (w, [z]) => w.go(z), [z]);
    await page.waitForTimeout(300);
    expect(Math.round(await call(page, (w) => w.cam()))).toBe(z);
  }
});

test('a tap on a sprite far up near the horizon lands on it (hit-testing follows the transforms)', async ({ page }) => {
  await open(page, 300);
  // the campsite, far up the island: its door is a button, small near the horizon
  const door = page.locator('[data-building="campsite"] button');
  const r = (await door.boundingBox())!;
  expect(r.height).toBeGreaterThan(10);
  const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-building="campsite"]'), [r.x + r.width / 2, r.y + r.height * 0.8]);
  expect(hit).toBe(true);
});

test('the ground is baked: the bands in view show the season’s terrain chunks; the back loads lazily', async ({ page }) => {
  await page.goto('?demo&season=summer');
  await world(page);
  const shown = await page.locator('[data-world-ground] .gband:not([style*="hidden"]) img').evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLImageElement).src.split('/').slice(-2).join('/')))]);
  expect(shown.length).toBeGreaterThan(0);
  for (const s of shown) expect(s).toMatch(/^summer\/[0-7]\.webp\?v=\d+$/);
});

test('at night a lamp’s light sorts with its lamp: a tree in front covers it, the lamp’s own sprite is under it', async ({ page }) => {
  await page.goto('?demo&season=summer&date=2026-07-01T21:00&critter=none');
  await world(page);
  await call(page, (w) => w.go(642));
  await page.waitForTimeout(400);
  const z = await page.evaluate(() => {
    const zi = (sel: string) => Number(getComputedStyle(document.querySelector(sel)!).zIndex);
    const f = (sel: string) => getComputedStyle(document.querySelector(sel)!).filter;
    return { glow: zi('[data-glow="lantern-3"]'), lamp: zi('[data-scenery-id="lantern-3"]'), canopy: zi('[data-scenery-id="oak-k1"][data-part="canopy"]'), lit: f('[data-glow="lantern-3"]'), tree: f('[data-scenery-id="oak-k1"] img') };
  });
  expect(z.glow).toBeGreaterThan(z.lamp);
  expect(z.glow).toBeLessThan(z.canopy);
  // the light is never tinted; the tree is (the time of day's tint, at the source)
  expect(z.lit).toBe('none');
  expect(z.tree).toMatch(/url/);
});

test('at night the tint is on what each thing draws, never on what a tap reaction moves (it stays tinted while it moves)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T22:00&critter=none');
  await world(page);
  await call(page, (w) => w.go(380));
  await page.waitForTimeout(600);
  // tap reactions: a bush's shake, an oak's rustle, my villager's squish (and the villagers' own loops)
  const tap = async (sel: string) => {
    const b = (await page.locator(sel).first().boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  };
  await tap('.stage [data-bush]');
  await tap('[data-tree="oak-m1"]:not([data-tree-part])');
  await tap('[data-actor="mine"] .vil'); // a squish
  await page.waitForTimeout(100);
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    // (an svg's parts are drawn with it: no layer of their own)
    const moving = document.getAnimations().map((a) => (a.effect as KeyframeEffect | null)?.target).filter((t): t is Element => !!t?.closest?.('.stage .wn') && !t.parentElement?.closest('svg'));
    for (const t of moving) {
      // no ancestor up to (and including) its world node carries the tint: WebKit's layer for the move would escape it
      for (let e: Element | null = t.parentElement; e && !e.matches('.stage'); e = e.parentElement) {
        if (getComputedStyle(e).filter.includes('url(')) out.push(`${t.tagName}.${t.getAttribute('class')} under ${e.tagName}.${e.getAttribute('class')}`);
        if (e.classList.contains('wn')) break;
      }
    }
    return { moving: moving.length, out };
  });
  expect(bad.moving).toBeGreaterThan(0);
  expect(bad.out).toEqual([]);
  // what they draw is tinted: the bush's and the oak's images; a lamp's light is not
  for (const sel of ['.stage [data-bush] img', '[data-scenery-id="oak-m1"] img']) {
    expect(await page.locator(sel).first().evaluate((e) => getComputedStyle(e).filter)).toContain('url(');
  }
  expect(await page.locator('[data-glow] img').first().evaluate((e) => getComputedStyle(e).filter)).toBe('none');
});

test('on the stairs and on the tier above, a villager draws in front of the cliff’s face; below it, in front as ever', async ({ page }) => {
  await page.goto('?demo&season=summer&date=2026-07-01T10:00&critter=none&visitor=none');
  await world(page);
  const [, back] = await call(page, (w) => w.stops());
  await call(page, (w, [z]) => w.go(z), [back]);
  await page.waitForTimeout(400);
  // the face lets taps through: make it hit-testable for the probe
  await page.addStyleTag({ content: '[data-cliff-face] img { pointer-events: auto !important; }' });
  /** Who is on top at my villager's middle and just above its feet, standing at (x, z). */
  const onTop = async (x: number, z: number) => {
    await call(page, (w, [x, z]) => w.put(x, z), [x, z]);
    await page.waitForTimeout(200);
    const r = (await page.locator('[data-actor="mine"] .vil img').first().boundingBox())!;
    return page.evaluate((pts) => pts.map(([px, py]) => {
      const e = document.elementFromPoint(px, py);
      return e?.closest('[data-actor="mine"]') ? 'mine' : e?.closest('[data-cliff-face]') ? 'cliff' : e?.className.toString() || e?.tagName || null;
    }), [[r.x + r.width / 2, r.y + r.height * 0.5], [r.x + r.width / 2, r.y + r.height * 0.9]]);
  };
  const shots = process.env.SHOTS_DIR;
  // at the foot of the stairs, half way up, at the top and further back on the tier above (the stairs: x 36–84)
  for (const [z, name] of [[1036, 'foot'], [1060, 'mid'], [1084, 'top'], [1110, 'above']] as const) {
    expect(await onTop(60, z), `${name} of the stairs`).toEqual(['mine', 'mine']);
    if (shots) await page.screenshot({ path: `${shots}/stairs-${name}.png` });
  }
});
