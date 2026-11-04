// The museum (docs/design.md "The museum"): its inside (the hall and its two wings) with every fish and bug anyone has
// found on show, a creature's card. In by its door and back out: positions.spec (both islands), leaks.spec.
import { expect, test, type Page } from '@playwright/test';
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
  card(): string | null;
  put(x: number, z: number): void;
};
const mu = <R,>(page: Page, fn: string) => page.evaluate(`window.__museum.${fn}`) as Promise<R>;
const open = async (page: Page, url = MUSEUM) => {
  await page.goto(url);
  await page.waitForFunction(() => ((window as unknown as { __museum?: M }).__museum?.stats()?.frames ?? 0) > 0);
};
/** The demo's finds: these fish and bugs found by these people (as a catch writes them). */
const seed = (page: Page, finds: [kind: 'fish' | 'bug', id: string, who: 'A' | 'B' | 'G'][]) =>
  page.addInitScript((list) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    const events = list.map(([kind, id, person], i) => ({ id: `seed-${i}`, type: 'find', data: { kind, id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events }));
  }, finds);

test('a tap on the floor walks there, through the hall into a wing', async ({ page }) => {
  await open(page);
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  await page.evaluate('window.__museum.walkTo(150, 20)');
  await expect.poll(async () => {
    const [x, z] = await mu<[number, number]>(page, 'mine()');
    return Math.hypot(x - 150, z - 20);
  }, { timeout: 15_000 }).toBeLessThan(6);
});

test('the walls the camera cuts away stay put as one walks: each goes at most once on a walk, and comes back at most once (a jamb one passed), never back and forth', async ({ page }) => {
  await open(page);
  // through the openings into each wing and back, the cutaway read every frame
  for (const [from, to] of [[[30, 10], [110, 10]], [[110, 10], [30, 10]], [[-30, 10], [-110, 10]], [[-110, 10], [-30, 10]]] as const) {
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
  await page.evaluate('window.__museum.put(160, 80)');
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
  await page.evaluate('window.__museum.put(160, 80)');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  await expect.poll(async () => {
    const p = await mu<[number, number] | null>(page, 'creature("koi")');
    if (p) await page.mouse.click(p[0], p[1]);
    return mu<string | null>(page, 'card()');
  }, { timeout: 10_000 }).toBe('koi');
  const card = page.locator('[data-museum-card="koi"]');
  await expect(card).toContainText('ニシキゴイ');
  await expect(card).toContainText(/koi/i);
  await expect(card.locator('[data-museum-finder="B"]')).toContainText('11/4');
  await expect(card.locator('[data-museum-times]')).toContainText('×1');
  // ✕ closes it
  await card.getByRole('button', { name: 'とじる' }).click();
  await expect(card).toHaveCount(0);
});

test('the bug wing: every bug found lives there as it lives (flying, perched, crawling, in a case), drawn; a tap shows its card', async ({ page }) => {
  await seed(page, [['bug', 'common-butterfly', 'A'], ['bug', 'robust-cicada', 'B'], ['bug', 'tarantula', 'G'], ['bug', 'pondskater', 'A'], ['fish', 'sea-bass', 'B']]);
  await open(page);
  const sp = await mu<{ id: string; kind: string; tank: string; by: string }[]>(page, 'specimens()');
  expect(sp.filter((s) => s.kind === 'bug').map((s) => [s.id, s.tank]).sort()).toEqual([['common-butterfly', 'fly'], ['pondskater', 'water'], ['robust-cicada', 'trunk'], ['tarantula', 'terrarium']]);
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).sort(), { timeout: 15_000 }).toEqual(['common-butterfly', 'pondskater', 'robust-cicada', 'sea-bass', 'tarantula']);
  // the guest's tarantula in its case at the back: its card names the guest
  await page.evaluate('window.__museum.put(-250, -50)');
  await expect.poll(() => mu<boolean>(page, 'still()')).toBe(true);
  await expect.poll(async () => {
    const p = await mu<[number, number] | null>(page, 'creature("tarantula")');
    if (p) await page.mouse.click(p[0], p[1]);
    return mu<string | null>(page, 'card()');
  }, { timeout: 10_000 }).toBe('tarantula');
  await expect(page.locator('[data-museum-card="tarantula"] [data-museum-finder="G"]')).toBeVisible();
});

test('the guest visits too: in, walking, the finds on show', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'G']]);
  await open(page, 'museum?demo&as=G&date=2026-11-04T12:00');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')), { timeout: 15_000 }).toEqual(['koi']);
  await page.evaluate('window.__museum.walkTo(-150, 10)');
  await expect.poll(async () => {
    const [x, z] = await mu<[number, number]>(page, 'mine()');
    return Math.hypot(x + 150, z - 10);
  }, { timeout: 15_000 }).toBeLessThan(6);
});

test('the curator at the desk: he watches my villager, dozes off and wakes as it comes up, and a tap is his line, a new one each time', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'B'], ['bug', 'tarantula', 'A']]);
  await open(page);
  type C = { at: [number, number]; doing: string | null } | null;
  const doing = async () => {
    const c = await mu<C>(page, 'curator()');
    return c ? c.doing : 'not in';
  };
  // my villager in front of the desk: he watches it, and the hall draws while he's on screen (his idle)
  await page.evaluate('window.__museum.put(0, -12)');
  await expect.poll(doing, { timeout: 15_000 }).toBe('look');
  const frames = async () => (await mu<{ frames: number }>(page, 'stats()')).frames;
  const f0 = await frames();
  await page.waitForTimeout(600);
  expect(await frames()).toBeGreaterThan(f0 + 5);
  // nodding off; my villager walking away and back up wakes him
  await page.evaluate('window.__museum.curatorDoze()');
  expect(await doing()).toBe('doze');
  await page.evaluate('window.__museum.put(0, 60)');
  await page.waitForTimeout(500);
  expect(await doing()).toBe('doze');
  await page.evaluate('window.__museum.put(0, -12)');
  await expect.poll(doing, { timeout: 5_000 }).toBe('look');
  const balloon = page.locator('[data-fx="talk"]');
  const tapHim = async () => {
    const c = (await mu<C>(page, 'curator()'))!;
    await page.mouse.click(c.at[0], c.at[1] + 10);
  };
  await tapHim();
  await expect(balloon).toHaveAttribute('aria-label', /^フータ: .*ようこそ/);
  expect(await doing()).toBe('talk');
  const lines = new Set<string>();
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
  for (const [p, x] of [[page, 150], [other, 130]] as const) {
    await p.evaluate(`window.__museum.put(${x}, 10)`);
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
  // A: a tap on the floor gets up and walks there
  await page.bringToFront();
  await expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 10_000 }).toBe(true);
  const [fx, fy] = await mu<[number, number]>(page, 'px(150, 15)');
  await page.mouse.click(fx, fy);
  await expect.poll(() => mu<Seat>(page, 'seat()')).toBeNull();
  await expect.poll(async () => {
    const w = (await mu<Who>(page, 'who("A")'))!;
    return !w.seated && Math.hypot(w.at[0] - 150, w.at[1] - 15) < 6;
  }, { timeout: 10_000 }).toBe(true);
  await expect.poll(async () => (await mu<Who>(other, 'who("A")'))?.seated, { timeout: 5_000 }).toBe(false);
  await expect.poll(() => mu<Seat>(other, 'theirSeat("A")')).toBeNull();
  await other.close();
});

test('while a drag turns the camera the curator’s balloon stays whole (its box, not only its text) by him', async ({ page }) => {
  await open(page);
  type C = { at: [number, number]; doing: string | null } | null;
  await page.evaluate('window.__museum.put(0, -12)');
  await expect.poll(async () => (await mu<C>(page, 'curator()'))?.doing, { timeout: 15_000 }).toBe('look');
  const him = async () => ((c) => ({ x: c.at[0], y: c.at[1] }))((await mu<C>(page, 'curator()'))!);
  const h = await him();
  await page.mouse.click(h.x, h.y + 10);
  await expect(page.locator('[data-fx="talk"].placed')).toBeVisible();
  await page.waitForTimeout(300); // (its pop-in)
  const near = (await balloonState(page, '[data-fx="talk"]', await him()))!.dist + 8;
  const box = (await page.locator('[data-museum-room]').boundingBox())!;
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height * 0.75];
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(cx + i * 12, cy);
  await page.waitForTimeout(100);
  // (the camera turned: he moved on screen)
  const h1 = await him();
  expect(Math.hypot(h1.x - h.x, h1.y - h.y)).toBeGreaterThan(10);
  await expectWhole(page, '[data-fx="talk"]', h1, near);
  await page.mouse.up();
});
