// The museum's visitors and its HUD (docs/design.md "The museum"): the day's NH villagers in the rooms, the same on
// every phone (museum/visitors.ts, seeded by the date: no relay), a tap one's line in a balloon (nobody walks); the
// room chip (its name, its wing's finds of the whole; hidden at the eyes); an exhibit's card docked clear of it, and a
// tap anywhere else only closes it.
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

test('the room chip: the room’s name and its wing’s finds of the whole, the hall its name only; hidden at the eyes', async ({ page }) => {
  await seed(page, [['fish', 'koi', 'A'], ['fossil', 't-rex-skull', 'B']]);
  await open(page);
  const chip = page.locator('[data-museum-chip]');
  await expect(chip).toHaveAttribute('data-museum-chip', 'はくぶつかん');
  await expect(chip.locator('[data-museum-chip-n]')).toHaveCount(0);
  for (const [spot, name, n] of [['room:fish', 'さかな', '1/80'], ['room:F2', 'かせき 2', '1/73'], ['room:G1', 'びじゅつ 1', '0/43']] as const) {
    await putAt(page, spot);
    await expect(chip).toHaveAttribute('data-museum-chip', name);
    await expect(chip.locator('[data-museum-chip-n]')).toHaveText(n);
  }
  await page.locator('[data-fpv]').click();
  await expect(chip).toHaveCount(0);
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
