// The visitors' life (docs/design.md "Visitors: life"): every visitor is NH's own 3D model on its spot, Gulliver sleeps face down until the fifth nudge, the ones who roam stroll and come back to their
// spot before a line (the balloon anchors to them there), they arrive from the campsite and leave to it (or by their
// own way), and the partner comes over to say hello to a visitor near home.
import { expect, test, type Page } from './fixtures.ts';
import { campDoor, camTo, geo, is3d, islandUp, sawIt, stageCam, tapFigure, visitorOut, visitorsOut, w3, walking, watchFor, type VisitorIs, type W3 } from './island.ts';

/** The campsite's door, where the visitors come from and go back to (world x, z). */

// the visitors' strolls, arrivals and hellos are ambient life (e2e/fixtures.ts): on here
test.use({ viewport: { width: 390, height: 844 }, ambient: 'on' });
/** The visitor's 3D model's state (world3d/villagers.ts: villager3d's idle, walk, prone…), or null till it's in. */
const model = (page: Page) => page.evaluate(() => (window as unknown as { __villagers3: { state(s: string): string | null } }).__villagers3.state('visitor'));
const NIGHT = new Set(['wisp', 'celeste', 'jack']);
/** Where each stands: Gulliver on the beach (まえ), the rest at centre stage (the layout's plaza). */
const camOf = async (page: Page, id: string) => (id === 'gulliver' ? 30 : await stageCam(page));
/** Where visitor `id`'s feet are on screen (its box's foot, client px), or null: not out. */
const footOf = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __world3d: W3 }).__world3d.box('visitor', id)?.foot ?? null, id);
/** Its feet as a string, to compare: '' not out. */
const feet = async (page: Page, id: string) => (await footOf(page, id))?.map((n) => n.toFixed(1)).join(',') ?? '';

// (one of each kind: a roster special by day and at night, the one lying down, a model outside the roster, the pair;
// that every visitor the schedule brings has its model is visitors.test's, the GLBs' villager3d.test's)
for (const id of ['daisy-mae', 'wisp', 'gulliver', 'jack', 'reese'])
  test(`${id}: on its spot as NH's own 3D model (no card, no render), posed as the villagers are`, async ({ page }) => {
    await page.goto(`?demo&date=2026-11-04T${NIGHT.has(id) ? '21' : '12'}:00&visitor=${id}&critter=none`);
    await islandUp(page);
    await camTo(page, await camOf(page, id), false);
    const v = () => visitorOut(page, id);
    await expect.poll(async () => (await v())?.phase, { timeout: 3000 }).toBe('here');
    await expect.poll(async () => (await v())?.shown).toBe(true);
    expect((await v())?.card).toBe(false);
    await expect.poll(() => model(page), { timeout: 15_000 }).toBe(id === 'gulliver' ? 'prone' : 'idle');
    if (id === 'gulliver') expect((await v())?.asleep).toBe('lie');
  });

test('Gulliver sleeps face down until the fifth nudge (NH), then stands and introduces himself', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none');
  await islandUp(page);
  const g = () => visitorOut(page, 'gulliver');
  await expect.poll(async () => (await g())?.asleep).toBe('lie');
  await expect.poll(async () => (await g())?.fx.filter((f) => f === 'zzz').length).toBe(1);
  // his NH model lies face down on the sand (villager3d's prone), then stands
  const state = () => model(page);
  await expect.poll(state, { timeout: 15_000 }).toBe('prone');
  await tapFigure(page, 'visitor', 'gulliver');
  await page.waitForTimeout(400); // the first nudge
  for (let i = 1; i < 5; i++) {
    if (i > 1) await tapFigure(page, 'visitor', 'gulliver');
    await expect(page.locator('[data-mumble]')).toBeVisible();
    expect((await g())?.asleep).toBe('lie');
    await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
    await page.waitForTimeout(250);
  }
  await tapFigure(page, 'visitor', 'gulliver');
  await expect.poll(async () => (await g())?.asleep).toBeNull();
  await expect.poll(async () => (await g())?.fx.includes('zzz')).toBe(false);
  await expect.poll(state).toBe('idle');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('ジョニー');
  await expect(box).toHaveAttribute('data-pages', '2');
});

test('a stroll, and back on her spot before a line: the balloon anchors next to her', async ({ page }) => {
  // (her stroll 8 s after she shows: her spot read first, once she stands still on it; at 3 s a slow CI runner's
  // first read was mid-stroll, runs 42493608069 and 42495987780)
  await page.goto('?demo&date=2026-11-01T08:00&critter=none&stroll=8000'); // Sunday morning: Daisy Mae
  await islandUp(page);
  const v = () => visitorOut(page, 'daisy-mae');
  await expect.poll(async () => (await v())?.shown).toBe(true);
  let home = '';
  await expect.poll(async () => home === (home = await feet(page, 'daisy-mae')), { intervals: [250] }).toBe(true);
  // off on a stroll and standing somewhere else
  await expect.poll(() => feet(page, 'daisy-mae'), { timeout: 15_000 }).not.toBe(home);
  await expect.poll(async () => (await v())?.walking, { timeout: 4000 }).toBe(false);
  // a tap on her where she stands now: she walks back, turns to my villager, then speaks
  await tapFigure(page, 'visitor', 'daisy-mae');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('ウリ', { timeout: 4000 });
  expect(await feet(page, 'daisy-mae')).toBe(home);
  const a = (await w3(page, (w) => w.box('visitor', 'daisy-mae')))!, b = (await box.boundingBox())!;
  // by her: over her column, above (or below) her, as close as the controls around centre stage allow (placement.ts)
  expect(b.x < a.left + a.width && a.left < b.x + b.width).toBe(true);
  expect(Math.min(Math.abs(b.y + b.height - a.top), Math.abs(b.y - (a.top + a.height)))).toBeLessThan(200);
});

test('arriving: from the campsite on foot along the paths (?arrive); leaving to it when the visit ends (?leave)', async ({ page }) => {
  // the page's clock, run on a second at a time: the walks, the 30 s visit and the walk back in a few real seconds
  await page.clock.install({ time: new Date('2026-11-01T08:00:00+09:00') });
  await page.goto('?demo&date=2026-11-01T08:00&critter=none&arrive&leave=30000');
  const v = () => visitorOut(page, 'daisy-mae');
  /** Runs the clock on until `ok` holds (at most `s` seconds of it): a second at a time, its timers fired but not its
   *  every frame (fastForward: the walks are timed, and the 3D island would draw each of 60 frames, in software on CI) */
  const until = async (ok: () => Promise<boolean>, s: number) => {
    for (let i = 0; i < s && !(await ok()); i++) await page.clock.fastForward(1000);
    expect(await ok()).toBe(true);
  };
  await expect.poll(async () => (await v())?.phase).toBe('arrive');
  await expect.poll(async () => (await v())?.walking).toBe(true);
  // she sets off from the campsite's door, in view (the 3D island shows the whole island)
  await is3d(page);
  const door = await page.evaluate(([x, z]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z), campDoor(await geo(page)));
  // (on the page's clock until the 3D island has placed her node where she stands: its first box is a stale one)
  const at = async () => ((f) => ({ x: f[0], y: f[1] }))((await footOf(page, 'daisy-mae'))!), box0 = await at();
  for (let i = 0; i < 30; i++) {
    const b = await at();
    if (Math.hypot(b.x - box0.x, b.y - box0.y) > 1) break;
    await page.clock.fastForward(100);
  }
  const start = await at();
  await until(async () => (await v())?.phase === 'here', 26);
  // she set off from the campsite (its way out, in front of the door): nearer it than her spot on the lawn (on screen:
  // far up the island the camera foreshortens the way)
  const spot = await at(), off = (b: { x: number; y: number }) => Math.hypot(b.x - door[0], b.y - door[1]);
  expect(off(start)).toBeLessThan(Math.hypot(start.x - spot.x, start.y - spot.y));
  // the visit ends 30 s after it began, however long the walk from the campsite took (the route's length moves with
  // the scenery the walk goes round)
  await until(async () => (await v())?.phase === 'leave', 32);
  await expect.poll(async () => (await v())?.walking).toBe(true);
  await until(async () => (await visitorsOut(page)).length === 0, 30);
});

test('K.K. on his stool: NH’s own 3D model sitting on it by day, nodded off on it at night (zzz)', async ({ page }) => {
  const kk = () => page.evaluate(() => (window as unknown as { __villagers3: { state(s: string): string | null } }).__villagers3.state('kk'));
  await page.goto('?demo&date=2026-11-04T12:00&visitor=none&critter=none');
  await islandUp(page);
  await camTo(page, (await geo(page)).CAMS.mae, false);
  await expect.poll(async () => ((k) => k?.mode === 'day' && k.shown)(await visitorOut(page, 'kk'))).toBe(true);
  await expect.poll(kk, { timeout: 15_000 }).toBe('sit');
  await page.goto('?demo&date=2026-11-05T02:00&visitor=none&critter=none');
  await islandUp(page);
  await camTo(page, (await geo(page)).CAMS.mae, false);
  await expect.poll(async () => ((k) => k?.mode === 'asleep' && k.fx.filter((f) => f === 'zzz').length)(await visitorOut(page, 'kk'))).toBe(1);
  await expect.poll(kk, { timeout: 15_000 }).toBe('nap');
});

for (const [id, way] of [['wisp', 'float'], ['celeste', 'fly'], ['jack', 'spook']] as const)
  test(`${id} arrives and leaves by ${way}`, async ({ page }) => {
    // (each phase watched from the start: on a slow GPU the island may be up only once one has gone by)
    const phase = (p: string): VisitorIs => ({ visitor: id, is: `phase:${p}` });
    await watchFor(page, ['arrive', 'here', 'leave'].map(phase));
    await page.goto(`?demo&date=2026-11-04T21:00&visitor=${id}&critter=none&arrive&leave=4000`);
    const v = () => visitorOut(page, id);
    await expect.poll(async () => (await v())?.way).toBe(way);
    expect(await sawIt(page, phase('arrive'))).toBe(true);
    // (the phases are recorded as they come, so a long wait costs a green run nothing: on a loaded runner the page's
    // first seconds block its main thread, and the arrival's 1.6–2.2 s timer fired 6.3 s after it began, the
    // departure's a few ms later: past the 4 s poll, the CI flakes of 2026-11-09)
    await expect.poll(() => sawIt(page, phase('here')), { timeout: 15_000 }).toBe(true);
    await expect.poll(() => sawIt(page, phase('leave')), { timeout: 15_000 }).toBe(true);
    await expect.poll(async () => (await visitorsOut(page)).length, { timeout: 15_000 }).toBe(0);
  });

test('the partner comes over to say hello to Daisy Mae on the lawn: they face each other, she answers with an emote', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T09:00&visitor=daisy-mae&critter=none&meet&awake'); // (&awake: the partner's app counted open)
  await islandUp(page);
  // (the ?meet hook sends the partner 3 s after the visitor's in, and tries again every 700 ms, 12 times, while the
  // partner is busy: up to ~11 s)
  await expect.poll(() => walking(page, 'partner'), { timeout: 15_000 }).toBe(true);
  await expect.poll(async () => (await visitorOut(page, 'daisy-mae'))?.emote, { timeout: 6000 }).toBe(true);
  // close by, not on them: the partner's feet a step from the visitor's, the visitor's middle still theirs
  await expect.poll(() => walking(page, 'partner')).toBe(false);
  const r = await page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, p = w.box('villager', 'partner')!, v = w.box('visitor', 'daisy-mae')!;
    const mid = [v.left + v.width / 2, v.top + v.height / 2] as const;
    const over = w.controls().some((c) => c.kind === 'villager' && mid[0] >= c.box.left && mid[0] <= c.box.left + c.box.width && mid[1] >= c.box.top && mid[1] <= c.box.top + c.box.height);
    return { d: Math.hypot(p.left + p.width / 2 - mid[0], p.top + p.height - (v.top + v.height)), over };
  });
  expect(r.d).toBeLessThan(130);
  expect(r.over).toBe(false);
});

test('Celeste points at a falling star', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T21:00&visitor=celeste&critter=none');
  await camTo(page, await stageCam(page), false);
  const v = () => visitorOut(page, 'celeste');
  await expect.poll(async () => (await v())?.phase, { timeout: 3000 }).toBe('here');
  await page.evaluate(() => document.querySelector('.if-scene')!.dispatchEvent(new CustomEvent('island:star', { detail: { x: 40 } })));
  await expect.poll(async () => (await v())?.motion).toBe('point');
  await expect.poll(async () => (await v())?.emote).toBe(true);
});
