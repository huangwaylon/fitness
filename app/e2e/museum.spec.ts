// The museum (docs/design.md "The museum"): its inside (the hall and its wings) with every fish, bug, sea creature and
// fossil anyone has found and every genuine artwork a present has held on show, an exhibit's card. In by its door and
// back out: positions.spec (both islands), leaks.spec.
import { expect, test, type Page } from './fixtures.ts';
import { balloonState, expectWhole } from './balloon.ts';

const MUSEUM = 'museum?demo&date=2026-11-04T12:00';
type M = {
  stats(): { frames: number };
  mine(): [number, number] | null;
  still(): boolean;
  specimens(): { id: string; kind: string; tank: string; by: string }[];
  shown(): string[];
  nextHour(): void;
  creature(id: string): [number, number] | null;
  where(id: string): [number, number, number] | null;
  spot(name: string): Promise<[number, number]>;
  card(): string | null;
  put(x: number, z: number): void;
  walkTo(x: number, z: number): void;
  hit(cx: number, cy: number): { kind: string; x?: number; z?: number } | null;
  doorways(): Door[];
};
/** A doorway of the room drawn (engine.ts doorways): the room beyond, its floor line and plaques on the screen, its
 *  middle on the floor and the way into this room. */
type Door = { to: string; line: [[number, number], [number, number]]; plaques: [number, number][][]; at: [number, number]; inward: [number, number] };
const mu = <R,>(page: Page, fn: string) => page.evaluate(`window.__museum.${fn}`) as Promise<R>;
/** A named spot on the museum's floor (museum/spots.ts: no coordinates in here, so a re-layout moves no spec). */
const sp = (page: Page, name: string) => page.evaluate((n) => (window as unknown as { __museum: M }).__museum.spot(n), name);
/** The room drawn's doorway to `to`. */
const doorTo = async (page: Page, to: string) => (await mu<Door[]>(page, 'doorways()')).find((d) => d.to === to)!;
/** A floor point `k` units into the room drawn from its doorway to `to` (out through it, k < 0). */
const offDoor = async (page: Page, to: string, k: number): Promise<[number, number]> => {
  const d = await doorTo(page, to);
  return [d.at[0] + d.inward[0] * k, d.at[1] + d.inward[1] * k];
};
/** On the screen clear of the bars (portrait). */
const onScreen = ([x, y]: [number, number]) => x >= 8 && x <= 385 && y >= 60 && y <= 852 - 120;
/** My villager put at a named spot, or walked there. */
const putAt = (page: Page, name: string) => page.evaluate((n) => (window as unknown as { __museum: M }).__museum.spot(n).then(([x, z]) => (window as unknown as { __museum: M }).__museum.put(x, z)), name);
const walkToSpot = (page: Page, name: string) => page.evaluate((n) => (window as unknown as { __museum: M }).__museum.spot(n).then(([x, z]) => (window as unknown as { __museum: M }).__museum.walkTo(x, z)), name);
const open = async (page: Page, url = MUSEUM) => {
  await page.goto(url);
  await page.waitForFunction(() => ((window as unknown as { __museum?: M }).__museum?.stats()?.frames ?? 0) > 0);
};
/** The demo's finds: these fish, bugs, sea creatures, fossils and artworks (a present's `item`) found by these people
 *  (as a catch, a dig or a present writes them). */
const seed = (page: Page, finds: [kind: 'fish' | 'bug' | 'sea' | 'fossil' | 'item', id: string, who: 'A' | 'B' | 'G'][]) =>
  page.addInitScript((list) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    const events = list.map(([kind, id, person], i) => ({ id: `seed-${i}`, type: 'find', data: { kind, id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events }));
  }, finds);

test('a tap on the floor walks there, through the hall into a wing', async ({ page }) => {
  await open(page);
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  const [gx, gz] = await sp(page, 'room:fish');
  await walkToSpot(page, 'room:fish');
  await expect.poll(async () => {
    const [x, z] = await mu<[number, number]>(page, 'mine()');
    return Math.hypot(x - gx, z - gz);
  }, { timeout: 15_000 }).toBeLessThan(6);
  await expect.poll(() => mu<string>(page, 'room()')).toBe('fish');
});

test('the walls the camera cuts away stay put as one walks: each goes at most once on a walk, and comes back at most once (a jamb one passed), never back and forth', async ({ page }) => {
  await open(page);
  // through the openings into each wing and back, the cutaway read every frame
  const [fish, bug, hf, hb] = [await sp(page, 'in:fish'), await sp(page, 'in:bug'), await sp(page, 'in:hall:fish'), await sp(page, 'in:hall:bug')];
  for (const [from, to] of [[hf, fish], [fish, hf], [hb, bug], [bug, hb]] as const) {
    await page.evaluate(`window.__museum.put(${from[0]}, ${from[1]})`);
    await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
    const log = await page.evaluate(([x, z]) => new Promise<string[]>((done) => {
      const m = (window as unknown as { __museum: { walls(): string; walkTo(x: number, z: number): void; mine(): [number, number] } }).__museum;
      const seen = [m.walls()];
      m.walkTo(x, z);
      const step = () => {
        if (seen.at(-1) !== m.walls()) seen.push(m.walls());
        const [mx, mz] = m.mine();
        if (Math.hypot(mx - x, mz - z) > 1) requestAnimationFrame(step);
        else setTimeout(() => done([...seen, m.walls()]), 800);
      };
      requestAnimationFrame(step);
    }), to as unknown as [number, number]);
    const flips = log[0].split('').map((_, i) => log.slice(1).filter((s, k) => s[i] !== log[k][i]).length);
    expect(Math.max(...flips), `${from} → ${to}: ${log.join(' ')}`).toBeLessThanOrEqual(2);
  }
});

test('only the room my villager is in is drawn: a put changes it at once, a walk once through the doorway; a tap on a room not drawn walks through its doorway', async ({ page }) => {
  await open(page);
  const room = () => mu<string>(page, 'room()');
  expect(await room()).toBe('hall');
  // (a put: that room at once, no dip)
  await putAt(page, 'room:fish');
  expect(await room()).toBe('fish');
  // (the sea creatures' reef: the aquarium's own)
  await putAt(page, 'tank:reef');
  expect(await room()).toBe('fish');
  await putAt(page, 'in:hall:fish');
  expect(await room()).toBe('hall');
  // a walk: the hall's still drawn in the doorway (to 10 past its line: engine.ts SWAP_BAND), the aquarium after
  const walked = async ([x, z]: [number, number]) => {
    await page.evaluate(`window.__museum.walkTo(${x}, ${z})`);
    await expect.poll(async () => ((p) => Math.hypot(p[0] - x, p[1] - z))(await mu<[number, number]>(page, 'mine()')), { timeout: 10_000 }).toBeLessThan(1);
    await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  };
  const [past, beyond] = [await offDoor(page, 'fish', -6), await offDoor(page, 'fish', -24)];
  await walked(past);
  expect(await room()).toBe('hall');
  await walked(beyond);
  expect(await room()).toBe('fish');
  // from the hall, a tap past its side wall (the garden, not drawn): through its doorway, a step and a half in
  await putAt(page, 'in:hall:bug');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  const garden = await offDoor(page, 'bug', -3);
  const [tx, ty] = await mu<[number, number]>(page, `px(${garden[0]}, ${garden[1]})`);
  await page.mouse.click(Math.max(4, tx), ty);
  const [bx, bz] = await sp(page, 'in:bug');
  await expect.poll(async () => {
    const [x, z] = await mu<[number, number]>(page, 'mine()');
    return Math.hypot(x - bx, z - bz);
  }, { timeout: 10_000 }).toBeLessThan(2);
  await expect.poll(room, { timeout: 10_000 }).toBe('bug');
  // the fossils' loop, walked (each a fade, not a put): F1, F2 behind it, F3, and out to the hall by its back-right arch
  await putAt(page, 'room:F1');
  expect(await room()).toBe('F1');
  for (const [to, from] of [['F2', 'F1'], ['F3', 'F2'], ['hall', 'F3']] as const) {
    await walkToSpot(page, `in:${to}:${from}`);
    await expect.poll(room, { timeout: 15_000 }).toBe(to);
  }
  // the gallery's two rooms, each off the bug garden's far wall
  for (const g of ['G1', 'G2']) {
    await putAt(page, 'room:bug');
    await walkToSpot(page, `in:${g}`);
    await expect.poll(room, { timeout: 15_000 }).toBe(g);
  }
});

/** From a way in, a tap on the doorway to `to` at `where` (its floor's middle, half a tile in; its plaque's middle; its
 *  card, half way up the opening) goes through, a step and a half in. */
async function through(page: Page, from: string, to: string, where: 'floor' | 'plaque' | 'card') {
  const room = () => mu<string>(page, 'room()');
  const mid = (q: [number, number][]): [number, number] => [q.reduce((a, p) => a + p[0], 0) / q.length, q.reduce((a, p) => a + p[1], 0) / q.length];
  await putAt(page, from);
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  const was = await room(), d = await doorTo(page, to), k = where === 'floor' ? 5 : 0;
  const [x, y] = where === 'plaque' ? mid(d.plaques[0]) : await mu<[number, number]>(page, `px(${d.at[0] + d.inward[0] * k}, ${d.at[1] + d.inward[1] * k}, ${where === 'card' ? 20 : 0})`);
  // (a finger on the part of it on the screen: a side wall is at the screen's edge)
  await page.mouse.click(Math.max(4, Math.min(389, x)), y);
  await expect.poll(room, { timeout: 10_000 }).toBe(to);
  const [fx, fz] = await sp(page, `in:${to}:${was}`);
  await expect.poll(async () => ((p) => Math.hypot(p[0] - fx, p[1] - fz))((await mu<[number, number]>(page, 'mine()'))!), { timeout: 10_000 }).toBeLessThan(2);
}

test('a tap on each of the hall’s arches at its floor’s middle walks through it (a back arch’s floor isn’t the side arch’s, whose card and flag stand over it)', async ({ page }) => {
  await open(page);
  for (const to of ['F1', 'F3', 'bug', 'fish']) await through(page, 'entrance', to, 'floor');
});

test('a tap on a doorway (its card, its plaque, the floor before it) always walks through it, into the next room', async ({ page }) => {
  await open(page);
  // (the bug garden's ways on to the gallery, in its side wall; F1's on to F2, in its back wall, from beside it: in front of it my villager would take the tap)
  for (const where of ['card', 'plaque', 'floor'] as const) await through(page, 'in:bug:G1', 'G1', where);
  for (const where of ['card', 'plaque', 'floor'] as const) await through(page, 'in:bug:G2', 'G2', where);
  for (const where of ['card', 'plaque', 'floor'] as const) await through(page, 'fossil:dimetrodon-skull', 'F2', where);
});

test('the floor near a doorway is the room’s: two tiles in from any doorway a tap stays in the room', async ({ page }) => {
  // (no visitors in: a floor tap is the floor's)
  await open(page, 'museum?demo&date=2026-11-04T03:00');
  let tried = 0;
  for (const r of ['hall', 'bug', 'fish', 'F1', 'F2', 'F3', 'G1', 'G2']) {
    await putAt(page, `room:${r}`);
    await expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 10_000 }).toBe(true);
    for (const d of await mu<Door[]>(page, 'doorways()')) {
      // (before its middle and toward either end: F1's left column, F3's floor)
      const along: [number, number] = [Math.abs(d.inward[1]), Math.abs(d.inward[0])];
      for (const k of [-10, 0, 10]) {
        const at: [number, number] = [d.at[0] + d.inward[0] * 20 + along[0] * k, d.at[1] + d.inward[1] * 20 + along[1] * k];
        const px = await mu<[number, number]>(page, `px(${at[0]}, ${at[1]})`);
        // (on the screen, and not under a plaque: one standing out from its wall is drawn over the floor behind it)
        const underPlaque = (await mu<Door[]>(page, 'doorways()')).some((o) => o.plaques.some((q) => {
          const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          return Math.abs(px[0] - cx) <= Math.max(44, Math.max(...xs) - Math.min(...xs)) / 2 && Math.abs(px[1] - cy) <= Math.max(44, Math.max(...ys) - Math.min(...ys)) / 2;
        }));
        if (!onScreen(px) || underPlaque) continue;
        tried++;
        const h = await page.evaluate(([x, y]) => (window as unknown as { __museum: M }).__museum.hit(x, y), px);
        // (the floor on this side of the doorway's line, or what stands there: never a walk through it)
        if (h?.kind === 'floor') expect((h.x! - d.at[0]) * d.inward[0] + (h.z! - d.at[1]) * d.inward[1], `${r} → ${d.to} at ${at}`).toBeGreaterThan(0);
      }
    }
  }
  expect(tried).toBeGreaterThan(10);
});

test('a plaque naming the hall over every way back to it, whole on the screen from the way in', async ({ page }) => {
  await open(page);
  for (const r of ['bug', 'fish', 'F1', 'F3']) {
    await putAt(page, `in:${r}:hall`);
    await expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 10_000 }).toBe(true);
    const d = await doorTo(page, 'hall');
    expect(d.plaques.length, r).toBe(1);
    for (const p of d.plaques[0]) expect(onScreen(p), `${r}: ${p}`).toBe(true);
  }
});

// The programs, drawn (logic mode compiles nothing): in CI's software GL the GPU process's compiles and rasters are most
// of their time (the museum's open alone 6-19 s on a loaded runner), and the drawn smoke's runners differ 2-3x in speed
// (11-10, every test in the job: world3d:24 8 -> 16 s), so 20-26 s on a fast one passed 30 s on a slow one. They check
// programs, not pixels: a pixel ratio of 1 (a quarter of the raster) and a drawn test's time, as the other drawn ones.
test.describe('the programs, drawn', () => {
  test.use({ deviceScaleFactor: 1 });

  test('a room change compiles nothing: every built room’s programs are made in the warm-up, shown for it', { tag: '@render' }, async ({ page }) => {
    test.setTimeout(60_000);
    await seed(page, [['fish', 'koi', 'A'], ['bug', 'tarantula', 'B'], ['sea', 'octopus', 'A'], ['fossil', 'amber', 'G'], ['fossil', 't-rex-skull', 'A'], ['item', 'famous-painting', 'A'], ['item', 'gallant-statue', 'B']]);
    await open(page);
    await page.evaluate(() => ['fish', 'fossil', 'art'].forEach((w) => (window as unknown as { __museum: { wake(w: string): void } }).__museum.wake(w)));
    await expect.poll(async () => (await mu<string[]>(page, 'shown()')).length, { timeout: 30_000 }).toBe(7);
    const warmed = () => expect.poll(() => page.evaluate('((s) => s.warming || s.loading > 0)(window.__museum.stats())'), { timeout: 30_000 }).toBe(false);
    await warmed();
    const stats = () => mu<{ frames: number; mem: number[] }>(page, 'stats()');
    const before = (await stats()).mem[2], seen: Record<string, number> = {};
    for (const name of ['room:fish', 'tank:reef', 'room:bug', 'room:F1', 'room:F2', 'room:F3', 'room:G1', 'room:G2', 'entrance']) {
      const f0 = (await stats()).frames;
      await putAt(page, name);
      await expect.poll(async () => (await stats()).frames, { timeout: 15_000 }).toBeGreaterThan(f0);
      await expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 15_000 }).toBe(true);
      seen[await mu<string>(page, 'room()')] = (await stats()).mem[2];
    }
    expect(Object.keys(seen).sort()).toEqual(['F1', 'F2', 'F3', 'G1', 'G2', 'bug', 'fish', 'hall']);
    expect(seen).toEqual(Object.fromEntries(Object.keys(seen).map((k) => [k, before])));
  });

  test('a wing rebuilt with a new find keeps its programs: none freed with the old wing to compile again for the new', { tag: '@render' }, async ({ page }) => {
    test.setTimeout(60_000);
    const river = ['koi', 'carp', 'goldfish', 'catfish', 'crawfish', 'bluegill', 'pike', 'char', 'loach', 'pond-smelt'];
    await seed(page, river.map((id) => ['fish', id, 'A'] as ['fish', string, 'A']));
    await open(page);
    await putAt(page, 'tank:river');
    const shown = async () => (await mu<string[]>(page, 'shown()')).length;
    await expect.poll(shown, { timeout: 15_000 }).toBe(7);
    const programs = async () => (await mu<{ mem: number[] }>(page, 'stats()')).mem[2];
    // (the warm-up done: its fading programs compiled with the rest)
    const warmed = () => expect.poll(() => page.evaluate('((s) => s.warming || s.loading > 0)(window.__museum.stats())'), { timeout: 30_000 }).toBe(false);
    await warmed();
    const before = await programs(), seen: number[] = [];
    // (a find kept off and let back: the aquarium rebuilt each time, as a new find rebuilds it)
    for (const id of [river[0], null, river[1], null]) {
      await page.evaluate((id) => (window as unknown as { __museum: { withhold(id: string | null): void } }).__museum.withhold(id), id);
      await expect.poll(shown, { timeout: 15_000 }).toBe(7);
      seen.push(await programs());
      await warmed();
      seen.push(await programs());
    }
    expect(seen).toEqual(seen.map(() => before));
  });
});

test('the canvas never shows blank: each resize of its buffer (a drag’s lighter pixel ratio, its end, a new size) is drawn over in the same task', async ({ page }) => {
  // (a resize clears the canvas, and WebKit shows it cleared, the museum's dark, till the next draw: resized after a
  // frame's draw, a drag's start and end flashed black on the phone. The logic tier's pixel ratio is 1 either way, so
  // there the new sizes; the drawn tier's 2 → 1.5 → 2 too)
  await page.addInitScript(() => {
    const w = window as unknown as { __blank: string[]; __resized: number; __museum?: { stats(): { draws: number } } };
    w.__blank = [];
    w.__resized = 0;
    for (const k of ['width', 'height'] as const) {
      const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k)!;
      Object.defineProperty(HTMLCanvasElement.prototype, k, {
        get() { return d.get!.call(this); },
        set(v: number) {
          d.set!.call(this, v);
          const m = w.__museum;
          if (!m || !this.hasAttribute('data-museum-room')) return;
          w.__resized++;
          const d0 = m.stats().draws;
          queueMicrotask(() => m.stats().draws === d0 && w.__blank.push(`${k} ${v}`));
        }
      });
    }
  });
  await open(page);
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  const box = (await page.locator('[data-museum-room]').boundingBox())!;
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
  for (const dx of [120, -120]) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(cx + (dx * i) / 6, cy);
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(300);
  }
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.width, height: size.height - 80 });
  await page.waitForTimeout(300);
  await page.setViewportSize(size);
  await page.waitForTimeout(300);
  expect(await page.evaluate('window.__resized')).toBeGreaterThan(0);
  expect(await page.evaluate('window.__blank')).toEqual([]);
});

test('what’s on show: exactly the fish anyone has found (the guest’s too), each in its tank; nothing else', async ({ page }) => {
  await seed(page, [['fish', 'sea-bass', 'A'], ['fish', 'koi', 'B'], ['fish', 'neon-tetra', 'G'], ['fish', 'oarfish', 'A']]);
  await open(page);
  const sp = await mu<{ id: string; kind: string; tank: string; by: string }[]>(page, 'specimens()');
  expect(sp.map((s) => [s.id, s.tank, s.by]).sort()).toEqual([['koi', 'river', 'B'], ['neon-tetra', 'river', 'G'], ['oarfish', 'deep', 'A'], ['sea-bass', 'sea', 'A']]);
  // each drawn swimming in the aquarium (its model loaded), and no other
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).sort(), { timeout: 15_000 }).toEqual(['koi', 'neon-tetra', 'oarfish', 'sea-bass']);
});

test('seven at most a tank, from what was caught, the great tank’s with its one predator caught: a new pick as the hour changes while one’s in, the same on every phone', async ({ page, context }) => {
  const river = ['koi', 'carp', 'goldfish', 'catfish', 'crawfish', 'bluegill', 'pike', 'char', 'loach', 'pond-smelt'];
  // (the sea's: nine caught, one of them a predator, the tuna: in every hour's seven)
  const sea = ['sea-bass', 'dab', 'anchovy', 'horse-mackerel', 'red-snapper', 'butterfly-fish', 'puffer-fish', 'blowfish', 'tuna'];
  const finds = [...river.map((id) => ['fish', id, 'A'] as ['fish', string, 'A']), ...sea.map((id) => ['fish', id, 'B'] as ['fish', string, 'B'])];
  await seed(page, finds);
  await open(page);
  const riverShown = async () => (await mu<string[]>(page, 'shown()')).filter((id) => river.includes(id)).sort();
  const seaShown = async () => (await mu<string[]>(page, 'shown()')).filter((id) => sea.includes(id));
  await expect.poll(async () => (await riverShown()).length, { timeout: 15_000 }).toBe(7);
  await expect.poll(async () => (await seaShown()).length, { timeout: 15_000 }).toBe(7);
  expect(await seaShown()).toContain('tuna');
  const first = await riverShown();
  // another tab (another phone), the same hour: the same seven
  const other = await context.newPage();
  await seed(other, finds);
  await open(other);
  await expect.poll(async () => (await mu<string[]>(other, 'shown()')).filter((id) => river.includes(id)).sort(), { timeout: 15_000 }).toEqual(first);
  await other.close();
  // in front of the river tank as the hour turns: a new seven (the old fading out, the new in), still none but those
  // caught; the tuna still in the great tank
  await putAt(page, 'tank:river');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  await page.evaluate('window.__museum.nextHour()');
  await expect.poll(riverShown, { timeout: 15_000 }).not.toEqual(first);
  await expect.poll(async () => (await riverShown()).length, { timeout: 15_000 }).toBe(7);
  const next = await riverShown();
  for (const id of next) expect(river).toContain(id);
  await expect.poll(async () => (await seaShown()).length, { timeout: 15_000 }).toBe(7);
  expect(await seaShown()).toContain('tuna');
});

test('a tap on a fish shows its card: its names, who found it first and when, how many', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'B']]);
  await open(page);
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).length, { timeout: 15_000 }).toBe(1);
  // in front of the river tank, the camera on it
  await putAt(page, 'tank:river');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  const at = await mu<[number, number]>(page, 'mine()');
  await expect.poll(async () => {
    const p = await mu<[number, number] | null>(page, 'creature("koi")');
    if (p) await page.mouse.click(p[0], p[1]);
    return mu<string | null>(page, 'card()');
  }, { timeout: 10_000 }).toBe('koi');
  // (an exhibit's tap opens its card where one stands: it never walks; a walk would have begun with the tap)
  expect(await mu<[number, number]>(page, 'mine()')).toEqual(at);
  expect(await mu<boolean>(page, 'walking("A")')).toBe(false);
  const card = page.locator('[data-museum-card="koi"]');
  await expect(card).toContainText('ニシキゴイ');
  await expect(card).toContainText(/koi/i);
  await expect(card.locator('[data-museum-finder="B"]')).toContainText('11/4');
  await expect(card.locator('[data-museum-times]')).toContainText('×1');
  // ✕ closes it
  await card.getByRole('button', { name: '閉じる' }).click();
  await expect(card).toHaveCount(0);
});

/** A tap on an exhibit (its card, once the camera's still on it). */
async function tapOn(page: Page, id: string) {
  await expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 15_000 }).toBe(true);
  await expect.poll(async () => {
    const p = await mu<[number, number] | null>(page, `creature(${JSON.stringify(id)})`);
    if (p) await page.mouse.click(p[0], p[1]);
    return mu<string | null>(page, 'card()');
  }, { timeout: 15_000 }).toBe(id);
}

test('the fossils: a fossil found is on show in its wing, built once my villager comes near (its pack fetched then); a skeleton’s pieces join as they’re found, its card whole once all are in', async ({ page }) => {
  await seed(page, [['fossil', 't-rex-skull', 'A'], ['fossil', 't-rex-torso', 'B'], ['fossil', 't-rex-tail', 'A'], ['fossil', 'amber', 'G'], ['fish', 'sea-bass', 'B']]);
  const packs: string[] = [];
  page.on('request', (r) => /\/room\/museum\/fossil/.test(r.url()) && packs.push(r.url().replace(/^.*\/museum\/|\?.*$/g, '')));
  await open(page);
  await page.evaluate('window.__museum.withhold("t-rex-tail")');
  expect((await mu<{ id: string }[]>(page, 'fossils()')).map((f) => f.id)).toEqual(['amber', 't-rex-skull', 't-rex-torso']);
  // in the hall: the fossils' rooms not built, nothing of them fetched
  await expect.poll(() => mu<string[]>(page, 'shown()'), { timeout: 15_000 }).toEqual(['sea-bass']);
  expect(await mu<string[]>(page, 'awake()')).not.toContain('F1');
  // through the back opening: the first room woken, the standalone ones' pack fetched, the amber drawn
  await walkToSpot(page, 'in:F1');
  await expect.poll(() => mu<string[]>(page, 'awake()'), { timeout: 15_000 }).toContain('F1');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).filter((id) => id !== 'sea-bass').sort(), { timeout: 15_000 }).toEqual(['amber']);
  expect([...new Set(packs)].sort()).toEqual(['fossils.glb']);
  // in front of the T. rex in the next room: woken, its pack fetched, its card, two of its three pieces
  await putAt(page, 'fossil:t-rex-torso');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).filter((id) => id !== 'sea-bass').sort(), { timeout: 15_000 }).toEqual(['amber', 't-rex-skull', 't-rex-torso']);
  expect([...new Set(packs)].sort()).toEqual(['fossil-t-rex.glb', 'fossils.glb']);
  await tapOn(page, 't-rex-skull');
  const card = page.locator('[data-museum-card="t-rex-skull"]');
  await expect(card).toContainText('Tレックスの あたま');
  await expect(card.locator('[data-museum-more]')).toHaveText('Tレックス 2/3');
  await expect(card.locator('[data-museum-finder="A"]')).toContainText('11/4');
  await card.getByRole('button', { name: '閉じる' }).click();
  // its tail donated (the find arrives): drawn in its place at the skeleton's end, and the skeleton whole
  await page.evaluate('window.__museum.withhold(null)');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).includes('t-rex-tail'), { timeout: 15_000 }).toBe(true);
  const [skull, tail] = await Promise.all(['t-rex-skull', 't-rex-tail'].map((id) => mu<[number, number, number]>(page, `where("${id}")`)));
  // (two pieces along: fossils.ts PIECE_W 17)
  expect([tail[0] - skull[0], tail[2] - skull[2]]).toEqual([34, 0]);
  await tapOn(page, 't-rex-tail');
  await expect(page.locator('[data-museum-card="t-rex-tail"] [data-museum-more]')).toHaveText('Tレックス コンプリート！');
});

test('the sea creatures in the aquarium: each caught one in its tank (the reef, the tide pool), NH’s museum-tank model where it has one; a tap shows its card', async ({ page }) => {
  await seed(page, [['sea', 'octopus', 'A'], ['sea', 'sea-star', 'G'], ['sea', 'moon-jellyfish', 'B'], ['fish', 'sea-bass', 'B']]);
  const files: string[] = [];
  page.on('request', (r) => /\/(sea-museum|critters\/sea\/)/.test(r.url()) && files.push(r.url().replace(/^.*\/(museum|world3d)\/|\?.*$/g, '')));
  await open(page);
  expect((await mu<{ id: string; tank: string }[]>(page, 'specimens()')).filter((s) => s.tank !== 'sea').map((s) => [s.id, s.tank])).toEqual([['sea-star', 'pool'], ['moon-jellyfish', 'reef'], ['octopus', 'reef']]);
  await putAt(page, 'tank:reef');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).filter((id) => id !== 'sea-bass').sort(), { timeout: 15_000 }).toEqual(['moon-jellyfish', 'octopus', 'sea-star']);
  // the octopus and the jellyfish NH's museum ones (one pack), the sea star the island's catch model
  await expect.poll(() => [...new Set(files)].sort(), { timeout: 15_000 }).toEqual(['critters/sea/sea-star.glb', 'sea-museum.glb']);
  await tapOn(page, 'octopus');
  await expect(page.locator('[data-museum-card="octopus"]')).toContainText('タコ');
});

test('the art gallery: a present’s genuine artwork on show, a painting on its wall, a statue on its plinth; a tap shows its real title', async ({ page }) => {
  await seed(page, [['item', 'famous-painting', 'A'], ['item', 'gallant-statue', 'B'], ['item', 'froggy-chair', 'A']]);
  await open(page);
  expect((await mu<{ id: string }[]>(page, 'art()')).map((a) => a.id)).toEqual(['famous-painting', 'gallant-statue']);
  await putAt(page, 'art:famous-painting');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).sort(), { timeout: 15_000 }).toEqual(['famous-painting', 'gallant-statue']);
  // the painting hung at eye height on its panel, the statue standing on its plinth
  const [p, st] = await Promise.all(['famous-painting', 'gallant-statue'].map((id) => mu<[number, number, number]>(page, `where("${id}")`)));
  // (on a panel, at its middle: art.ts PANEL_H)
  expect(p[1]).toBe(15.5);
  expect(st[1]).toBeGreaterThan(20);
  await tapOn(page, 'famous-painting');
  const card = page.locator('[data-museum-card="famous-painting"]');
  await expect(card).toContainText('ゆうめいな めいが');
  await expect(card.locator('[data-museum-more]')).toContainText('モナ・リザ');
});

test('a gallery panel between the camera and my villager fades out (its paintings with it) and stands again once I’m clear', async ({ page }) => {
  await seed(page, [['item', 'calm-painting', 'A'], ['item', 'flowery-painting', 'B']]);
  await open(page);
  const panels = () => mu<string>(page, 'panels()');
  await putAt(page, 'in:G1');
  await expect.poll(panels, { timeout: 15_000 }).toMatch(/^0{6}$/);
  // behind the second row's panel (the first row's calm painting before me)
  await putAt(page, 'art:calm-painting');
  await expect.poll(panels).toMatch(/1/);
  await putAt(page, 'in:G1');
  await expect.poll(panels).toMatch(/^0{6}$/);
});

test('the bug wing: every bug found lives there as it lives (flying, perched, crawling, in a case), drawn; a tap shows its card', async ({ page }) => {
  await seed(page, [['bug', 'common-butterfly', 'A'], ['bug', 'robust-cicada', 'B'], ['bug', 'tarantula', 'G'], ['bug', 'pondskater', 'A'], ['fish', 'sea-bass', 'B']]);
  await open(page);
  const sp = await mu<{ id: string; kind: string; tank: string; by: string }[]>(page, 'specimens()');
  expect(sp.filter((s) => s.kind === 'bug').map((s) => [s.id, s.tank]).sort()).toEqual([['common-butterfly', 'fly'], ['pondskater', 'water'], ['robust-cicada', 'trunk'], ['tarantula', 'terrarium']]);
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).sort(), { timeout: 15_000 }).toEqual(['common-butterfly', 'pondskater', 'robust-cicada', 'sea-bass', 'tarantula']);
  // the guest's tarantula in its case at the back: its card names the guest
  await putAt(page, 'room:bug');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  await expect.poll(async () => {
    const p = await mu<[number, number] | null>(page, 'creature("tarantula")');
    if (p) await page.mouse.click(p[0], p[1]);
    return mu<string | null>(page, 'card()');
  }, { timeout: 10_000 }).toBe('tarantula');
  await expect(page.locator('[data-museum-card="tarantula"] [data-museum-finder="G"]')).toBeVisible();
});

test('ten bugs at most, from what was caught, each in a place of its own (none on another): the same ten on every phone, a new ten as the hour changes while one’s in', async ({ page, context }) => {
  const bugs = ['common-butterfly', 'yellow-butterfly', 'tiger-butterfly', 'monarch-butterfly', 'honeybee', 'moth', 'ladybug', 'mantis', 'stinkbug', 'red-dragonfly',
    'darner-dragonfly', 'firefly', 'robust-cicada', 'saw-stag', 'walker-cicada', 'goliath-beetle', 'cricket', 'bell-cricket', 'grasshopper', 'snail', 'pondskater',
    'tarantula', 'hermit-crab', 'pill-bug', 'spider', 'bagworm'];
  const finds = bugs.map((id, i) => ['bug', id, i % 2 ? 'A' : 'B'] as ['bug', string, 'A' | 'B']);
  await seed(page, finds);
  await open(page);
  const bugsShown = async (p = page) => (await mu<string[]>(p, 'shown()')).filter((id) => bugs.includes(id)).sort();
  expect((await mu<{ kind: string }[]>(page, 'specimens()')).filter((s) => s.kind === 'bug').length).toBe(bugs.length);
  await expect.poll(async () => (await bugsShown()).length, { timeout: 15_000 }).toBe(10);
  const first = await bugsShown();
  // none on another: each two of them apart in the garden, a few times over as they go
  const apart = async () => {
    const at = await Promise.all(first.map((id) => mu<[number, number, number] | null>(page, `where(${JSON.stringify(id)})`)));
    let least = Infinity;
    for (let i = 0; i < at.length; i++) for (let k = i + 1; k < at.length; k++) {
      const a = at[i], b = at[k];
      if (a && b) least = Math.min(least, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
    }
    return least;
  };
  await putAt(page, 'room:bug');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  for (let i = 0; i < 4; i++) {
    expect(await apart()).toBeGreaterThan(8);
    await page.waitForTimeout(400);
  }
  // another tab (another phone), the same hour: the same ten
  const other = await context.newPage();
  await seed(other, finds);
  await open(other);
  await expect.poll(() => bugsShown(other), { timeout: 15_000 }).toEqual(first);
  await other.close();
  // in the garden as the hour turns: a new ten (the old fading out, the new in), still none but those caught
  await page.evaluate('window.__museum.nextHour()');
  await expect.poll(bugsShown, { timeout: 15_000 }).not.toEqual(first);
  await expect.poll(async () => (await bugsShown()).length, { timeout: 15_000 }).toBe(10);
});

test('the guest visits too: in, walking, the finds on show', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'G']]);
  await open(page, 'museum?demo&as=G&date=2026-11-04T12:00');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')), { timeout: 15_000 }).toEqual(['koi']);
  const [gx, gz] = await sp(page, 'room:bug');
  await walkToSpot(page, 'room:bug');
  await expect.poll(async () => {
    const [x, z] = await mu<[number, number]>(page, 'mine()');
    return Math.hypot(x - gx, z - gz);
  }, { timeout: 15_000 }).toBeLessThan(6);
});

test('the curator at the desk: his welcome untapped on the way in, he watches my villager, dozes off and wakes as it comes up, and a tap is his line, a new one each time', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'B'], ['bug', 'tarantula', 'A']]);
  await open(page);
  const balloon = page.locator('[data-fx="talk"]');
  // (his welcome once in the visit, brief: its first line, no tap)
  await expect(balloon).toHaveAttribute('aria-label', /^フータ: ホーッ！ ようこそ はくぶつかんへ！$/, { timeout: 15_000 });
  type C = { at: [number, number]; doing: string | null } | null;
  const doing = async () => {
    const c = await mu<C>(page, 'curator()');
    return c ? c.doing : 'not in';
  };
  // my villager in front of the desk: he watches it, and the hall draws while he's on screen (his idle)
  await putAt(page, 'desk');
  await expect.poll(doing, { timeout: 15_000 }).toBe('look');
  const frames = async () => (await mu<{ frames: number }>(page, 'stats()')).frames;
  const f0 = await frames();
  // (what's measured: the frames drawn over a while)
  await page.waitForTimeout(600);
  expect(await frames()).toBeGreaterThan(f0 + 5);
  // nodding off; my villager walking away and back up wakes him
  await page.evaluate('window.__museum.curatorDoze()');
  expect(await doing()).toBe('doze');
  await putAt(page, 'entrance');
  // (what's measured: still asleep a while later, my villager far off)
  await page.waitForTimeout(500);
  expect(await doing()).toBe('doze');
  await putAt(page, 'desk');
  await expect.poll(doing, { timeout: 5_000 }).toBe('look');
  const tapHim = async () => {
    const c = (await mu<C>(page, 'curator()'))!;
    await page.mouse.click(c.at[0], c.at[1] + 10);
  };
  await tapHim();
  await expect(balloon).toHaveAttribute('aria-label', /^フータ: /);
  expect(await doing()).toBe('talk');
  const lines = new Set([(await balloon.getAttribute('aria-label'))!]);
  for (let i = 0; i < 3; i++) {
    const was = await balloon.getAttribute('aria-label');
    await tapHim();
    await expect(balloon).not.toHaveAttribute('aria-label', was!);
    lines.add((await balloon.getAttribute('aria-label'))!);
  }
  expect([...lines].some((l) => l.includes('ようこそ'))).toBe(false);
  // the count of what's on show in his line, when he says it
  for (const l of lines) if (l.includes('しゅるい')) expect(l).toContain('さかなが 1しゅるい');
});

// Sitting (docs/design.md "The museum": the aquarium's benches; rooms/seating.ts): a tap on a bench walks my villager
// up to it and sits it facing the great tank, the other phone sees it seated (the rooms' presence, `seat`), its own a
// tap on the same bench takes the other seat; a tap on the floor gets it up.
test('the aquarium’s benches: a tap sits my villager on one, the other phone sees it, theirs takes the other seat, a tap on the floor gets up', async ({ page, context }) => {
  test.setTimeout(60_000);
  type Who = { at: [number, number]; walking: boolean; seated: boolean } | null;
  type Seat = { id: string; n: number } | null;
  const other = await context.newPage();
  await open(page);
  await open(other, 'museum?demo&as=B&date=2026-11-04T12:00');
  // (each sees the other in here)
  await expect.poll(async () => !!(await mu<Who>(page, 'who("B")')) && !!(await mu<Who>(other, 'who("A")')), { timeout: 15_000 }).toBe(true);
  for (const [p, name] of [[page, 'room:fish'], [other, 'tank:sea']] as const) {
    await putAt(p, name);
    await expect.poll(() => mu<boolean>(p, 'still()'), { timeout: 10_000 }).toBe(true);
  }
  const tapBench = async (p: Page, n: number) => {
    const [x, y] = (await mu<[number, number]>(p, `benchPx("dmbench1", ${n})`))!;
    await p.mouse.click(x, y);
  };
  await page.bringToFront();
  await tapBench(page, 0);
  await expect.poll(() => mu<Seat>(page, 'seat()'), { timeout: 10_000 }).toMatchObject({ id: 'dmbench1' });
  const mine = (await mu<Seat>(page, 'seat()'))!;
  expect((await mu<Who>(page, 'who("A")'))!.seated).toBe(true);
  // the other phone: A seated there too, on that seat
  await expect.poll(() => mu<Seat>(other, 'theirSeat("A")'), { timeout: 5_000 }).toMatchObject(mine);
  await expect.poll(async () => (await mu<Who>(other, 'who("A")'))?.seated, { timeout: 5_000 }).toBe(true);
  // B's tap on the same bench: the other seat (one villager a seat)
  await other.bringToFront();
  await expect.poll(() => mu<boolean>(other, 'still()'), { timeout: 10_000 }).toBe(true);
  await tapBench(other, 1 - mine.n);
  await expect.poll(() => mu<Seat>(other, 'seat()'), { timeout: 10_000 }).toEqual({ id: 'dmbench1', n: 1 - mine.n });
  await expect.poll(() => mu<Seat>(page, 'theirSeat("B")'), { timeout: 5_000 }).toMatchObject({ id: 'dmbench1', n: 1 - mine.n });
  expect(await mu<Seat>(page, 'seat()')).toEqual(mine);
  // A: a tap on the floor gets up (at the seat's step), the next walks there
  await page.bringToFront();
  await expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 10_000 }).toBe(true);
  const [gx, gz] = await sp(page, 'room:fish');
  const [fx, fy] = await mu<[number, number]>(page, `px(${gx}, ${gz})`);
  await page.mouse.click(fx, fy);
  await expect.poll(() => mu<Seat>(page, 'seat()')).toBeNull();
  expect((await mu<Who>(page, 'who("A")'))!.walking).toBe(false);
  await page.mouse.click(fx, fy);
  await expect.poll(async () => {
    const w = (await mu<Who>(page, 'who("A")'))!;
    return !w.seated && Math.hypot(w.at[0] - gx, w.at[1] - gz) < 6;
  }, { timeout: 10_000 }).toBe(true);
  await expect.poll(async () => (await mu<Who>(other, 'who("A")'))?.seated, { timeout: 5_000 }).toBe(false);
  await expect.poll(() => mu<Seat>(other, 'theirSeat("A")')).toBeNull();
  await other.close();
});

test('the hall’s benches: a tap on one walks up and sits my villager facing the camera; seated, the first tap (Blathers, the floor) only gets it up', async ({ page }) => {
  // (late, nobody else in: a visitor sitting there would take the tap)
  await open(page, 'museum?demo&date=2026-11-04T23:59');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  const sit = async () => {
    const [x, y] = (await mu<[number, number]>(page, 'benchPx("hbench1", 0)'))!;
    await page.mouse.click(x, y);
    await expect.poll(() => mu<{ id: string } | null>(page, 'seat()'), { timeout: 10_000 }).toMatchObject({ id: 'hbench1' });
    await expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 10_000 }).toBe(true);
  };
  type Who = { at: [number, number]; walking: boolean; seated: boolean };
  await sit();
  expect(await mu<string>(page, 'room()')).toBe('hall');
  // (the seat's step: where it got up from, and gets up at)
  const step = (await mu<Who>(page, 'who("A")'))!.at;
  // (a tap on what would otherwise answer or walk: Blathers, then the floor across the hall)
  const targets = [
    async () => ((c) => [c.at[0], c.at[1] + 10] as [number, number])((await mu<{ at: [number, number] }>(page, 'curator()'))!),
    async () => mu<[number, number]>(page, `px(${(await sp(page, 'room:hall')).join(', ')})`)
  ];
  for (const target of targets) {
    const [x, y] = await target();
    await page.mouse.click(x, y);
    await expect.poll(() => mu<{ id: string } | null>(page, 'seat()')).toBeNull();
    const w = (await mu<Who>(page, 'who("A")'))!;
    expect(w.walking || w.seated).toBe(false);
    expect(Math.hypot(w.at[0] - step[0], w.at[1] - step[1])).toBeLessThan(3);
    await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
    expect(await mu<string | null>(page, 'card()')).toBeNull();
    await sit();
  }
});

test('while a drag turns the camera the curator’s balloon stays whole (its box, not only its text) by him', async ({ page }) => {
  await open(page);
  type C = { at: [number, number]; doing: string | null } | null;
  await putAt(page, 'desk');
  await expect.poll(async () => (await mu<C>(page, 'curator()'))?.doing, { timeout: 15_000 }).toBe('look');
  const him = async () => ((c) => ({ x: c.at[0], y: c.at[1] }))((await mu<C>(page, 'curator()'))!);
  const h = await him();
  await page.mouse.click(h.x, h.y + 10);
  await expect(page.locator('[data-fx="talk"].placed')).toBeVisible();
  // (its pop-in over)
  await expect.poll(() => page.locator('[data-fx="talk"]').evaluate((e) => e.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
  const near = (await balloonState(page, '[data-fx="talk"]', await him()))!.dist + 8;
  const box = (await page.locator('[data-museum-room]').boundingBox())!;
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height * 0.75];
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(cx + i * 12, cy);
  // (the camera turned: he moved on screen)
  await expect.poll(async () => ((p) => Math.hypot(p.x - h.x, p.y - h.y))(await him())).toBeGreaterThan(10);
  const h1 = await him();
  await expectWhole(page, '[data-fx="talk"]', h1, near);
  await page.mouse.up();
});

test('a villager with no 3D model (チューリ: not in NH\'s files) stands in the museum as its card, not a shadow alone', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: [{ id: 'seed-v', type: 'pref', data: { key: 'villager', value: 'tulin' }, queuedAt: at, tries: 0, nextAt: 0, ackedAt: at, person: 'G' }] }));
  });
  await open(page, `${MUSEUM}&as=G`);
  await expect.poll(() => mu<boolean>(page, 'asCard("G")'), { timeout: 15_000 }).toBe(true);
  expect(await mu<string | null>(page, 'model("G")')).toBeNull();
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/museum-card.png` });
});
