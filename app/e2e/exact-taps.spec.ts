// A tap lands where the finger was (docs/design.md "Tap targets"; the user: "tapping the river sometimes opens the
// shop"). WebKit moves a touch's click onto the nearest element that answers clicks within the finger's radius when the
// point itself is the 3D island's stage (touch adjustment): at the camera's far stop the sea off the back beach lies
// high on the screen beside the shop's and the museum's doors, and a tap on it opened the shop, or with the line out
// went through the door (ui-state/exactTaps.ts: the click from the pointerup's own point). And a beach find's
// thumb-size tap box (hitbox.ts pick) is the sea's where it reaches over the water: a tap on the sea beside a dig spot
// by the back beach casts. Real touches (page.touchscreen.tap), a pause between them past a double tap's time.
import { expect, test, type Page } from './fixtures.ts';
import RECORD from '../src/lib/layout/record-2026-11-03.json' with { type: 'json' };
import { is3d, quiet } from './island';

test.use({ viewport: { width: 393, height: 852 } });

const USER_LAYOUT = [
  ...(RECORD as object[]),
  { who: 'A', sc: 'o', id: 'museum', at: 1.79e12, k: 'museum', x: 9, z: 18, f: 0 },
  { who: 'A', sc: 'o', id: 'shop', at: 1.79e12, k: 'shop', x: 7, z: 49, f: 0 }
];
type Hooks = {
  __fish: { why(): string; line(): object | null };
  __world3d: { go(z: number, k?: number, x?: number): void; limits(): { min: number; max: number }; ground(cx: number, cy: number): { x: number; z: number } | null; camStill(): boolean };
  __world: { ground(x: number, z: number): { surface: string } };
  __cues: string[];
};
const hooks = <R,>(page: Page, fn: (h: Hooks) => R) => page.evaluate(`(${fn.toString()})(window)`) as Promise<R>;
type Pt = [number, number, number];

async function open(page: Page, layout: 'default' | 'user', date = '2026-11-04') {
  if (layout === 'user') await page.addInitScript((ops) => localStorage.setItem('island-demo.layout', ops), JSON.stringify(USER_LAYOUT));
  await page.addInitScript(() => ((window as unknown as Hooks).__cues = []));
  // (no balloon: one drifting over the sea took a tap meant for the water)
  await page.goto(`?demo&date=${date}T12:00`);
  expect(await is3d(page)).toBe(true);
  await quiet(page);
}
/** The camera's far stop (up the island as far as it goes), at zoom `k`, panned to world x `x`. */
async function farStop(page: Page, k: number, x?: number) {
  await page.evaluate(([k, x]) => {
    const w = (window as unknown as Hooks).__world3d;
    w.go(w.limits().max, k, x ?? undefined);
  }, [k, x ?? null] as const);
  await expect.poll(() => hooks(page, (h) => h.__world3d.camStill()), { message: 'the camera still' }).toBe(true);
}
const VIEWS = [[1, undefined], [3, 120], [3, 225], [3, 330]] as const;

/** The sea or river on screen (every 4 px) with nothing of the island's over it (no tap area, no find's art) 4–20 px
 *  from `near`'s (a building's tap area, the finds' art: `art`), nearest first: [x, y, how far]. */
const waterBeside = (page: Page, near: 'building' | 'find') => page.evaluate((near) => {
  const h = window as unknown as Hooks, out: [number, number, number][] = [];
  const TAPS = 'button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building], [data-decor], [data-actor], [data-visitor]';
  const art = [...document.querySelectorAll('[data-find] img, [data-find] svg')].filter((e) => e.closest<HTMLElement>('[data-find]')!.checkVisibility({ visibilityProperty: true })).map((e) => e.getBoundingClientRect()).filter((r) => r.width);
  const off = (r: DOMRect, x: number, y: number) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  const onArt = (x: number, y: number, pad: number) => art.some((r) => off(r, x, y) <= pad);
  const hits = near === 'building' ? (x: number, y: number) => !!document.elementFromPoint(x, y)?.closest('[data-building]') : (x: number, y: number) => onArt(x, y, 0);
  const boxes = near === 'building' ? [...document.querySelectorAll('[data-building] .door')].map((e) => e.getBoundingClientRect()).filter((r) => r.width) : art;
  const seen = new Set<string>();
  for (const b of boxes)
    for (let y = Math.max(120, Math.round(b.top) - 20); y < Math.min(innerHeight - 120, b.bottom + 20); y += 4)
      for (let x = Math.max(12, Math.round(b.left) - 20); x < Math.min(innerWidth - 12, b.right + 20); x += 4) {
        if (seen.has(`${x},${y}`)) continue;
        seen.add(`${x},${y}`);
        const g = h.__world3d.ground(x, y), s = g && h.__world.ground(g.x, g.z).surface;
        if ((s !== 'sea' && s !== 'water') || document.elementFromPoint(x, y)?.closest(TAPS) || onArt(x, y, 6)) continue;
        for (let r = 4; r <= 20; r += 4)
          if (Array.from({ length: 16 }, (_, a) => [x + Math.cos((a / 16) * Math.PI * 2) * r, y + Math.sin((a / 16) * Math.PI * 2) * r]).some(([px, py]) => hits(px, py))) {
            out.push([x, y, r]);
            break;
          }
      }
  return out.sort((a, b) => a[2] - b[2]);
}, near);
/** Up to `n` of them, spread from the nearest on. */
const spread = <T,>(xs: T[], n: number) => xs.filter((_, i) => i % Math.max(1, Math.floor(xs.length / n)) === 0).slice(0, n);

/** The finds shown within `r` px of (x, y) (their art): uid and art middle, nearest first. */
const findsNear = (page: Page, x: number, y: number, r: number) => page.evaluate(([x, y, r]) => [...document.querySelectorAll<HTMLElement>('[data-find]')].filter((el) => el.checkVisibility({ visibilityProperty: true })).flatMap((el) => {
  const b = el.querySelector('img, svg')?.getBoundingClientRect();
  const d = b?.width ? Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom)) : Infinity;
  return d <= r ? [{ uid: el.getAttribute('data-uid')!, d, x: b!.left + b!.width / 2, y: b!.top + b!.height / 2 }] : [];
}).sort((a, b) => a.d - b.d), [x, y, r] as const);

/** A tap on the sea at each point casts, and the next tap there reels in: never a door, never a find. */
async function castsAt(page: Page, pts: Pt[], url: string) {
  for (const [x, y, r] of pts) {
    const near = (await findsNear(page, x, y, 30)).map((f) => f.uid);
    await page.waitForTimeout(400);
    await page.touchscreen.tap(x, y);
    const why = () => hooks(page, (h) => `${h.__fish.why()} (${h.__cues.slice(-3).join(' ')})`);
    await expect.poll(why, { message: `a tap on the water at ${x},${y}, ${r} px off` }).toMatch(/^cast in the /);
    expect(page.url()).toBe(url);
    // (the finds beside it still there)
    for (const uid of near) await expect(page.locator(`[data-find][data-uid="${uid}"]`)).toHaveCount(1);
    await page.waitForTimeout(400);
    await page.touchscreen.tap(x, y);
    await expect.poll(() => hooks(page, (h) => h.__fish.line()), { message: `the reel at ${x},${y}` }).toBeNull();
    expect(page.url()).toBe(url);
  }
}

for (const layout of ['default', 'user'] as const) {
  test(`${layout} island, the camera at its far stop: a tap on the water beside a building casts`, async ({ page }) => {
    test.slow();
    await open(page, layout);
    const url = page.url();
    // (the whole island's zoom, and zoomed in along the back beach: the sea by the shop's side, high on the screen)
    let tried = 0;
    for (const [k, x] of VIEWS) {
      await farStop(page, k, x);
      const pts = await waterBeside(page, 'building');
      tried += pts.length;
      await castsAt(page, spread(pts, 3), url);
    }
    expect(tried, 'water beside a building at the far stop').toBeGreaterThan(0);
  });

  test(`${layout} island: a tap on the shop's own tap area opens it`, async ({ page }) => {
    test.slow();
    await open(page, layout);
    // (from the far stop on down: on the default island it stands lower down)
    let door: [number, number] | null = null;
    const { max } = await hooks(page, (h) => h.__world3d.limits());
    for (let z = max; z > 0 && !door; z -= 200) {
      await page.evaluate((z) => (window as unknown as Hooks).__world3d.go(z, 1), z);
      await expect.poll(() => hooks(page, (h) => h.__world3d.camStill())).toBe(true);
      door = await page.evaluate(() => {
        const el = document.querySelector('[data-building="shop"] .door'), r = el?.getBoundingClientRect();
        if (!r?.width) return null;
        for (let fy = 0.3; fy < 0.9; fy += 0.1)
          for (const fx of [0.5, 0.4, 0.6]) {
            const x = r.left + r.width * fx, y = r.top + r.height * fy;
            if (y > 120 && document.elementFromPoint(x, y) === el) return [x, y] as [number, number];
          }
        return null;
      });
    }
    expect(door, 'the shop on screen').not.toBeNull();
    await page.waitForTimeout(400);
    await page.touchscreen.tap(door![0], door![1]);
    // (my villager walks up to it first: from the far end of the island, a long walk)
    await expect(page).toHaveURL(/\/shop/, { timeout: 30_000 });
  });

  test(`${layout} island, the camera at its far stop: a tap on the sea beside a find by the back beach casts, a tap on it picks it up`, async ({ page }) => {
    test.slow();
    // (a day with a find by the back beach on each island: the day's spots are drawn from the layout's open ground,
    // so a new piece on the island, K.K.'s stool, draws them anew)
    await open(page, layout, layout === 'user' ? '2026-11-09' : '2026-11-07');
    const url = page.url();
    let tried = 0, last: { k: number; x?: number; pt: Pt } | null = null;
    for (const [k, x] of VIEWS) {
      await farStop(page, k, x);
      const pts = await waterBeside(page, 'find');
      tried += pts.length;
      await castsAt(page, spread(pts, 3), url);
      if (pts.length) last = { k, x, pt: pts[0] };
    }
    expect(tried, 'the sea beside a find at the far stop').toBeGreaterThan(0);
    // the find beside the sea there itself, on its art's middle
    await farStop(page, last!.k, last!.x);
    const [on] = await findsNear(page, last!.pt[0], last!.pt[1], 20);
    expect(on, 'the find by the sea').toBeDefined();
    await page.waitForTimeout(400);
    await page.touchscreen.tap(on.x, on.y);
    await expect(page.locator(`[data-find][data-uid="${on.uid}"]`)).toHaveCount(0);
  });
}

// The rooms the same: a tap on the room's floor beside its back button (or the tent's light switch, the museum's
// view reset) is the room's (its canvas: my villager walks, a piece answers), never the button's.
for (const [room, ready] of [['tent', '__tent'], ['museum', '__museum']] as const)
  test(`the ${room}: a tap on the room beside its back button stays in the room, a tap on the button leaves`, async ({ page }) => {
    test.slow();
    await page.goto(`${room}?demo&date=2026-11-04T12:00`);
    await page.waitForFunction((k) => ((window as unknown as Record<string, { stats(): { frames: number } }>)[k]?.stats()?.frames ?? 0) > 0, ready);
    await page.waitForTimeout(1500);
    const back = page.locator(`[data-${room}] .nav.back`);
    await expect(back).toBeVisible();
    const pts = await back.evaluate((el) => {
      const b = el.getBoundingClientRect(), out: [number, number][] = [];
      // below it and to its right, 6–14 px off its edge, on the room's canvas
      for (const d of [6, 10, 14]) out.push([b.left + b.width / 2, b.bottom + d], [b.right + d, b.top + b.height / 2], [b.left + 12, b.bottom + d]);
      return out.filter(([x, y]) => document.elementFromPoint(x, y)?.matches('canvas'));
    });
    expect(pts.length).toBeGreaterThan(3);
    const url = page.url();
    for (const [x, y] of pts) {
      await page.waitForTimeout(400);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(300);
      expect(page.url(), `a tap at ${x},${y}`).toBe(url);
    }
    const b = (await back.boundingBox())!;
    await page.waitForTimeout(400);
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await expect(page).not.toHaveURL(url, { timeout: 10_000 });
  });
