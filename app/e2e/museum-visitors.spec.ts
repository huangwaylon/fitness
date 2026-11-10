// The museum's visitors and its HUD (docs/design.md "The museum"): the day's NH villagers in the rooms, the same on
// every phone (museum/visitors.ts, seeded by the date: no relay), a tap one's line in a balloon (nobody walks); the
// room chip (its plaque's name, what's on show in the room of what it holds, the last day's new finds; hidden at the
// eyes); the NEW tags and the hall plaques' dots; an exhibit's card docked clear of it, and any tap off it only closing
// it; a doorway's dip closing every balloon.
import { expect, test, type Page } from './fixtures.ts';

// (an afternoon: three or four in the museum)
const MUSEUM = 'museum?demo&date=2026-11-04T14:00';
type V = { id: string; x: number; z: number; state: string; fade: number };
const mu = <R,>(page: Page, fn: string) => page.evaluate(`window.__museum.${fn}`) as Promise<R>;
const open = async (page: Page, url = MUSEUM) => {
  await page.goto(url);
  await page.waitForFunction(() => ((window as unknown as { __museum?: { stats(): { frames: number } } }).__museum?.stats()?.frames ?? 0) > 0);
};
const putAt = (page: Page, name: string) => page.evaluate(`window.__museum.spot(${JSON.stringify(name)}).then(([x, z]) => window.__museum.put(x, z))`);
const still = (page: Page) => expect.poll(() => mu<boolean>(page, 'still()'), { timeout: 15_000 }).toBe(true);
const seed = (page: Page, finds: [kind: 'fish' | 'bug' | 'sea' | 'fossil' | 'item', id: string, who: 'A' | 'B' | 'G'][]) =>
  page.addInitScript((list) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    const events = list.map(([kind, id, person], i) => ({ id: `seed-${i}`, type: 'find', data: { kind, id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events }));
  }, finds);
const ROOMS = ['hall', 'bug', 'fish', 'F1', 'F2', 'F3', 'G1', 'G2'];

/** A room with a visitor standing still in it (my villager put at its way in), and that visitor. */
async function stillVisitor(page: Page): Promise<{ room: string; v: V }> {
  for (let round = 0; round < 3; round++) {
    for (const room of ROOMS) {
      await putAt(page, room === 'hall' ? 'entrance' : `in:${room}`);
      let v: V | undefined;
      await expect.poll(async () => {
        v = (await mu<V[]>(page, 'visitors()')).find((x) => x.state !== 'walk' && x.fade === 1);
        return !!v;
      }, { timeout: 2_500 }).toBe(true).catch(() => {});
      if (v) return { room, v };
    }
  }
  throw new Error('no visitor standing still');
}

test('a tap on a visitor: its line in a balloon with its name, it turns to me; my villager never walks', async ({ page }) => {
  await open(page);
  const { room, v } = await stillVisitor(page);
  // (my villager beside it, so the camera has it on screen)
  await page.evaluate(`window.__museum.put(${v.x + 24}, ${v.z + 12})`);
  expect(await mu<string>(page, 'room()')).toBe(room);
  await still(page);
  const at = await mu<[number, number]>(page, 'mine()');
  const p = (await mu<[number, number] | null>(page, `visitorPx(${JSON.stringify(v.id)})`))!;
  await page.mouse.click(p[0], p[1]);
  await expect(page.locator('[data-fx="talk"]')).toHaveAttribute('aria-label', /^[^:]+: \S/);
  await expect.poll(async () => (await mu<V[]>(page, 'visitors()')).find((x) => x.id === v.id)?.state).toBe('talk');
  expect(await mu<[number, number]>(page, 'mine()')).toEqual(at);
  expect(await mu<boolean>(page, 'walking("A")')).toBe(false);
});

test('two phones see the same visitors in the same places (the date’s plan, nothing sent)', async ({ page, context }) => {
  const other = await context.newPage();
  await open(page);
  await open(other, `${MUSEUM}&as=B`);
  const { room } = await stillVisitor(page);
  await putAt(other, room === 'hall' ? 'entrance' : `in:${room}`);
  // (who, and where each stands still: a walk's spot is a moment apart on two phones loaded a moment apart)
  const still = (vs: V[]) => vs.map((x) => `${x.id}${x.state === 'walk' || x.fade < 1 ? '' : `@${Math.round(x.x)},${Math.round(x.z)}`}`).sort().join(' ');
  await expect.poll(async () => {
    const [a, b] = [await mu<V[]>(page, 'visitors()'), await mu<V[]>(other, 'visitors()')];
    return a.length > 0 && still(a) === still(b);
  }, { timeout: 15_000 }).toBe(true);
  await other.close();
});

test('the room chip: the room’s plaque word for word and what’s on show in it of what it holds, the hall its name only; 「あたらしい n」 for the last day’s finds; the hall’s plaques dotted; hidden at the eyes', async ({ page }) => {
  // (found this morning: new at 14:00)
  await seed(page, [['fish', 'koi', 'A'], ['fossil', 't-rex-skull', 'B']]);
  await open(page);
  const chip = page.locator('[data-museum-chip]'), fresh = chip.locator('[data-museum-chip-new]');
  await expect(chip).toHaveAttribute('data-museum-chip', 'はくぶつかん');
  await expect(chip.locator('[data-museum-chip-n]')).toHaveCount(0);
  await expect(fresh).toHaveText('あたらしい 2');
  expect((await mu<string[]>(page, 'dotted()')).sort()).toEqual(['fish', 'fossil']);
  for (const [spot, name, n, f] of [['room:fish', 'さ か な', /^1\/120$/, 'あたらしい 1'], ['room:F2', 'か せ き 2', /^1\/\d+$/, 'あたらしい 1'], ['room:G1', 'び じゅ つ', /^0\/\d+$/, null]] as const) {
    await putAt(page, spot);
    await expect(chip).toHaveAttribute('data-museum-chip', name);
    await expect(chip.locator('[data-museum-chip-n]')).toHaveText(n);
    if (f) await expect(fresh).toHaveText(f);
    else await expect(fresh).toHaveCount(0);
  }
  await page.locator('[data-fpv]').click();
  await expect(chip).toHaveCount(0);
});

test('a find of the last day: a NEW tag over it in its room, none elsewhere', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'A']]);
  await open(page);
  expect(await mu<string[]>(page, 'tagged()')).toEqual([]);
  await putAt(page, 'room:fish');
  await expect.poll(() => mu<string[]>(page, 'tagged()'), { timeout: 15_000 }).toEqual(['koi']);
  await putAt(page, 'room:bug');
  await expect.poll(() => mu<string[]>(page, 'tagged()')).toEqual([]);
});

test('with a card open, a tap on another exhibit only closes it; the next tap opens that one', async ({ page }) => {
  // (the koi low in its tank, its card at the top; the octopus in the reef, mid-screen, clear of it)
  await seed(page, [['fish', 'koi', 'A'], ['sea', 'octopus', 'B']]);
  await open(page);
  await putAt(page, 'room:fish');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).length, { timeout: 15_000 }).toBe(2);
  await still(page);
  const tapOn = async (id: string) => {
    const p = (await mu<[number, number] | null>(page, `creature(${JSON.stringify(id)})`))!;
    await page.mouse.click(p[0], p[1]);
  };
  await expect.poll(async () => (await tapOn('koi'), mu<string | null>(page, 'card()')), { timeout: 15_000 }).toBe('koi');
  // (the octopus where it shows, not under the card)
  const box = (await page.locator('[data-museum-card]').boundingBox())!, p = (await mu<[number, number] | null>(page, 'creature("octopus")'))!;
  expect(p[1] < box.y || p[1] > box.y + box.height, `octopus at ${p} under the card ${JSON.stringify(box)}`).toBe(true);
  await tapOn('octopus');
  await expect(page.locator('[data-museum-card]')).toHaveCount(0);
  await expect.poll(async () => (await tapOn('octopus'), mu<string | null>(page, 'card()')), { timeout: 15_000 }).toBe('octopus');
});

test('Blathers greets once on the way in, untapped, briefly and clear of the plaques; a doorway’s dip closes every balloon at its start', async ({ page }) => {
  await open(page);
  const balloon = page.locator('[data-fx="talk"]');
  await expect(balloon).toHaveAttribute('aria-label', /^フータ: .*ようこそ/, { timeout: 15_000 });
  await expect(page.locator('[data-fx="talk"].placed')).toBeVisible();
  const b = (await page.locator('[data-fx="talk"].placed').boundingBox())!;
  type D = { plaques: [number, number][][] };
  for (const q of (await mu<D[]>(page, 'doorways()')).flatMap((d) => d.plaques)) {
    const [x0, x1, y0, y1] = [Math.min(...q.map((p) => p[0])), Math.max(...q.map((p) => p[0])), Math.min(...q.map((p) => p[1])), Math.max(...q.map((p) => p[1]))];
    expect(b.x + b.width <= x0 || b.x >= x1 || b.y + b.height <= y0 || b.y >= y1, `balloon ${JSON.stringify(b)} over a plaque ${[x0, x1, y0, y1]}`).toBe(true);
  }
  // (about two seconds: its line typed, then a short read)
  await expect(balloon).toHaveCount(0, { timeout: 3_000 });
  // (a balloon up as my villager sets off for the bug garden: Blathers' line on a tap)
  const c = (await mu<{ at: [number, number] } | null>(page, 'curator()'))!;
  await page.mouse.click(c.at[0], c.at[1] + 10);
  await expect(balloon).toHaveCount(1);
  await page.evaluate(() => {
    const d = document.querySelector('[data-museum-dip]')!, w = window as unknown as { dipSaw: number[] };
    w.dipSaw = [];
    new MutationObserver(() => void (d.getAttribute('data-museum-dip') === 'on' && w.dipSaw.push(document.querySelectorAll('[data-fx="talk"]').length)))
      .observe(d, { attributes: true, attributeFilter: ['data-museum-dip'] });
  });
  await page.evaluate('window.__museum.spot("in:bug").then(([x, z]) => window.__museum.walkTo(x, z))');
  await expect.poll(() => page.evaluate('window.dipSaw.length'), { timeout: 15_000 }).toBeGreaterThan(0);
  expect(await page.evaluate('window.dipSaw')).toEqual([0]);
  await expect.poll(() => mu<string>(page, 'room()')).toBe('bug');
  // (back in the hall: no second welcome)
  await page.evaluate('window.__museum.spot("room:hall").then(([x, z]) => window.__museum.walkTo(x, z))');
  await expect.poll(() => mu<string>(page, 'room()'), { timeout: 15_000 }).toBe('hall');
  // (frames drawn there with him on screen, each one where a welcome would come)
  await expect.poll(() => mu<boolean>(page, 'walking("A")'), { timeout: 15_000 }).toBe(false);
  const f0 = (await mu<{ frames: number }>(page, 'stats()')).frames;
  await expect.poll(async () => (await mu<{ frames: number }>(page, 'stats()')).frames).toBeGreaterThan(f0 + 5);
  await expect(balloon).toHaveCount(0);
});

test('NEW clears once its card is opened (on this phone, kept across a visit); tags hidden at the eyes', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'A'], ['fossil', 't-rex-skull', 'B']]);
  await open(page);
  const fresh = page.locator('[data-museum-chip-new]');
  await expect(fresh).toHaveText('あたらしい 2');
  await putAt(page, 'room:fish');
  await expect.poll(() => mu<string[]>(page, 'tagged()'), { timeout: 15_000 }).toEqual(['koi']);
  await still(page);
  // at the eyes: no tag (the chip goes too)
  await page.locator('[data-fpv]').click();
  await expect.poll(() => mu<string[]>(page, 'tagged()')).toEqual([]);
  await page.locator('[data-fpv]').click();
  await expect.poll(() => mu<string[]>(page, 'tagged()'), { timeout: 10_000 }).toEqual(['koi']);
  await still(page);
  await expect.poll(async () => {
    const p = await mu<[number, number] | null>(page, 'creature("koi")');
    if (p) await page.mouse.click(p[0], p[1]);
    return mu<string | null>(page, 'card()');
  }, { timeout: 15_000 }).toBe('koi');
  await expect.poll(() => mu<string[]>(page, 'tagged()')).toEqual([]);
  expect(await mu<string[]>(page, 'fresh()')).toEqual(['t-rex-skull']);
  await expect(fresh).toHaveCount(0);
  // (another visit: still looked at; the fossil still new)
  await open(page);
  await expect(page.locator('[data-museum-chip-new]')).toHaveText('あたらしい 1');
  expect(await mu<string[]>(page, 'fresh()')).toEqual(['t-rex-skull']);
  expect(await mu<string[]>(page, 'dotted()')).toEqual(['fossil']);
});

test('a skeleton’s new pieces: one NEW over the set (one on the chip), cleared by any piece’s card', async ({ page }) => {
  await seed(page, [['fossil', 't-rex-skull', 'A'], ['fossil', 't-rex-torso', 'A'], ['fossil', 't-rex-tail', 'B']]);
  await open(page);
  await expect(page.locator('[data-museum-chip-new]')).toHaveText('あたらしい 1');
  await putAt(page, 'room:F2');
  await expect.poll(() => mu<string[]>(page, 'tagged()'), { timeout: 15_000 }).toEqual(['set:t-rex']);
  await expect(page.locator('[data-museum-chip-new]')).toHaveText('あたらしい 1');
  await still(page);
  await expect.poll(async () => {
    const p = await mu<[number, number] | null>(page, 'creature("t-rex-torso")');
    if (p) await page.mouse.click(p[0], p[1]);
    return mu<string | null>(page, 'card()');
  }, { timeout: 15_000 }).toMatch(/^t-rex-/);
  await expect.poll(() => mu<string[]>(page, 'tagged()')).toEqual([]);
  expect(await mu<string[]>(page, 'fresh()')).toEqual([]);
});

test('NEW counts only what is drawn now (the hour’s pick of a tank: one not swimming isn’t new yet); four or more new in a tank, one 「NEW ×n」 on it', async ({ page }) => {
  const SEA = ['sea-bass', 'horse-mackerel', 'olive-flounder', 'red-snapper', 'dab', 'blowfish', 'puffer-fish', 'barred-knifejaw', 'anchovy', 'zebra-turkeyfish'];
  await seed(page, SEA.map((id) => ['fish', id, 'A'] as const));
  await open(page);
  await putAt(page, 'room:fish');
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).length, { timeout: 15_000 }).toBeGreaterThan(0);
  const shown = (await mu<string[]>(page, 'shown()')).filter((id) => SEA.includes(id));
  // (seven a tank: three of the ten not in the water this hour)
  expect(shown.length).toBe(7);
  expect((await mu<string[]>(page, 'fresh()')).sort()).toEqual([...shown].sort());
  await expect(page.locator('[data-museum-chip-new]')).toHaveText(`あたらしい ${shown.length}`);
  await expect.poll(() => mu<string[]>(page, 'tagged()')).toEqual(['case:sea']);
});

test('an exhibit’s card docks clear of it (low on the screen: the card at the top), and a tap on the floor only closes it', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'A'], ['fish', 'sea-bass', 'B']]);
  await open(page);
  await expect.poll(async () => (await mu<string[]>(page, 'shown()')).length, { timeout: 15_000 }).toBe(2);
  await putAt(page, 'room:fish');
  await still(page);
  const H = page.viewportSize()!.height, docks = new Set<string>();
  for (const id of ['koi', 'sea-bass']) {
    let y = 0;
    await expect.poll(async () => {
      const p = await mu<[number, number] | null>(page, `creature(${JSON.stringify(id)})`);
      if (p) (y = p[1]), await page.mouse.click(p[0], p[1]);
      return mu<string | null>(page, 'card()');
    }, { timeout: 15_000 }).toBe(id);
    const dock = (await page.locator('[data-museum-card]').getAttribute('data-museum-dock'))!;
    expect(dock).toBe(y > H * 0.55 ? 'top' : 'bottom');
    docks.add(dock);
    // the floor beside me: the card closes, nobody walks
    const at = await mu<[number, number]>(page, 'mine()');
    const [fx, fy] = await mu<[number, number]>(page, `px(${at[0] + 20}, ${at[1]})`);
    await page.mouse.click(fx, fy);
    await expect(page.locator('[data-museum-card]')).toHaveCount(0);
    expect(await mu<boolean>(page, 'walking("A")')).toBe(false);
    expect(await mu<[number, number]>(page, 'mine()')).toEqual(at);
  }
  expect([...docks].sort()).toEqual(['bottom', 'top']);
});
