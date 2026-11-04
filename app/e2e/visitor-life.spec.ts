// The visitors' life (docs/design.md "Visitors: life"): every visitor is NH's own 3D model on its spot, Gulliver sleeps face down until the fifth nudge, the ones who roam stroll and come back to their
// spot before a line (the balloon anchors to them there), they arrive from the campsite and leave to it (or by their
// own way), and the partner comes over to say hello to a visitor near home.
import { expect, test, type Page } from '@playwright/test';
import { camTo, campDoor, geo, is3d, sawIt, stageCam, tapFigure, watchFor } from './island.ts';
import { hudMenu } from './hud.ts';

/** The campsite's door, where the visitors come from and go back to (world x, z). */

test.use({ viewport: { width: 390, height: 844 } });
/** The visitor's 3D model's state (world3d/villagers.ts: villager3d's idle, walk, prone…), or null till it's in. */
const model = (page: Page) => page.evaluate(() => (window as unknown as { __villagers3: { state(s: string): string | null } }).__villagers3.state('visitor'));
const NIGHT = new Set(['wisp', 'celeste', 'kk-slider', 'jack']);
/** Where each stands: Gulliver on the beach (まえ), the rest at centre stage (the layout's plaza). */
const camOf = async (page: Page, id: string) => (id === 'gulliver' ? 30 : await stageCam(page));
/** The visitor node's transform (the projector's: where its feet are on screen). */
const feet = (page: Page, id: string) => page.locator(`[data-visitor="${id}"]`).evaluate((e) => (e as HTMLElement).style.transform);

for (const id of ['kk-slider', 'daisy-mae', 'wisp', 'gulliver', 'kicks', 'label', 'saharah', 'leif', 'redd', 'cj', 'flick', 'jack', 'celeste', 'franklin', 'jingle', 'zipper', 'reese'])
  test(`${id}: on its spot as NH's own 3D model (no card, no render), posed as the villagers are`, async ({ page }) => {
    await page.goto(`?demo&date=2026-11-04T${NIGHT.has(id) ? '21' : '12'}:00&visitor=${id}&critter=none`);
    await expect(hudMenu(page)).toBeVisible();
    await camTo(page, await camOf(page, id), false);
    const v = page.locator(`[data-visitor="${id}"]`);
    await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 3000 });
    await expect(v.locator('.art')).toBeVisible();
    await expect(v.locator('.official')).toHaveCount(0);
    await expect.poll(() => model(page), { timeout: 15_000 }).toBe(id === 'gulliver' ? 'prone' : 'idle');
    if (id === 'gulliver') await expect(v).toHaveAttribute('data-asleep', 'lie');
  });

test('Gulliver sleeps face down until the fifth nudge (NH), then stands and introduces himself', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  const g = page.locator('[data-visitor="gulliver"]');
  await expect(g).toHaveAttribute('data-asleep', 'lie');
  await expect(g.locator('.fxa.zzz')).toHaveCount(1);
  // his NH model lies face down on the sand (villager3d's prone), then stands
  const state = () => model(page);
  await expect.poll(state, { timeout: 15_000 }).toBe('prone');
  await tapFigure(page, '[data-visitor="gulliver"] .art');
  await page.waitForTimeout(400); // the first nudge
  for (let i = 1; i < 5; i++) {
    if (i > 1) await tapFigure(page, '[data-visitor="gulliver"] .art');
    await expect(g.locator('[data-mumble]')).toBeVisible();
    await expect(g).toHaveAttribute('data-asleep', 'lie');
    await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
    await page.waitForTimeout(250);
  }
  await tapFigure(page, '[data-visitor="gulliver"] .art');
  await expect(g).not.toHaveAttribute('data-asleep', /./);
  await expect(g.locator('.fxa.zzz')).toHaveCount(0);
  await expect.poll(state).toBe('idle');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('ジョニー');
  await expect(box).toHaveAttribute('data-pages', '2');
});

test('a stroll, and back on her spot before a line: the balloon anchors next to her', async ({ page }) => {
  await page.goto('?demo&date=2026-11-01T08:00&critter=none&stroll'); // Sunday morning: Daisy Mae
  await expect(hudMenu(page)).toBeVisible();
  const v = page.locator('[data-visitor="daisy-mae"]');
  await expect(v.locator('.art')).toBeVisible();
  const home = await feet(page, 'daisy-mae');
  // off on a stroll and standing somewhere else
  await expect.poll(() => feet(page, 'daisy-mae'), { timeout: 8000 }).not.toBe(home);
  await expect(v).not.toHaveClass(/walking/, { timeout: 4000 });
  // a tap on her where she stands now: she walks back, turns to my villager, then speaks
  await tapFigure(page, '[data-visitor="daisy-mae"] .art');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('ウリ', { timeout: 4000 });
  expect(await feet(page, 'daisy-mae')).toBe(home);
  const a = (await v.locator('.art').boundingBox())!, b = (await box.boundingBox())!;
  // by her: over her column, above (or below) her, as close as the controls around centre stage allow (placement.ts)
  expect(b.x < a.x + a.width && a.x < b.x + b.width).toBe(true);
  expect(Math.min(Math.abs(b.y + b.height - a.y), Math.abs(b.y - (a.y + a.height)))).toBeLessThan(200);
});

test('arriving: from the campsite on foot along the paths (?arrive); leaving to it when the visit ends (?leave)', async ({ page }) => {
  // the page's clock, run on a second at a time: the walks, the 30 s visit and the walk back in a few real seconds
  await page.clock.install({ time: new Date('2026-11-01T08:00:00+09:00') });
  await page.goto('?demo&date=2026-11-01T08:00&critter=none&arrive&leave=30000');
  const v = page.locator('[data-visitor="daisy-mae"]');
  /** Runs the clock on until `ok` holds (at most `s` seconds of it): a second at a time, its timers fired but not its
   *  every frame (fastForward: the walks are timed, and the 3D island would draw each of 60 frames, in software on CI) */
  const until = async (ok: () => Promise<boolean>, s: number) => {
    for (let i = 0; i < s && !(await ok()); i++) await page.clock.fastForward(1000);
    expect(await ok()).toBe(true);
  };
  await expect(v).toHaveAttribute('data-phase', 'arrive');
  await expect(v).toHaveClass(/walking/);
  // she sets off from the campsite's door, in view (the 3D island shows the whole island)
  await is3d(page);
  const door = await page.evaluate(([x, z]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z), campDoor(await geo(page)));
  // (on the page's clock until the 3D island has placed her node where she stands: its first box is a stale one)
  const box0 = (await v.boundingBox())!;
  for (let i = 0; i < 30; i++) {
    const b = (await v.boundingBox())!;
    if (Math.hypot(b.x - box0.x, b.y - box0.y) > 1) break;
    await page.clock.fastForward(100);
  }
  const start = (await v.boundingBox())!;
  await until(async () => (await v.getAttribute('data-phase')) === 'here', 26);
  // she set off from the campsite (its way out, in front of the door): nearer it than her spot on the lawn (on screen:
  // far up the island the camera foreshortens the way)
  const spot = (await v.boundingBox())!, off = (b: { x: number; y: number }) => Math.hypot(b.x - door[0], b.y - door[1]);
  expect(off(start)).toBeLessThan(Math.hypot(start.x - spot.x, start.y - spot.y));
  // the visit ends 30 s after it began, however long the walk from the campsite took (the route's length moves with
  // the scenery the walk goes round)
  await until(async () => (await v.getAttribute('data-phase')) === 'leave', 32);
  await expect(v).toHaveClass(/walking/);
  await until(async () => (await page.locator('[data-visitor]').count()) === 0, 30);
});

for (const [id, way] of [['wisp', 'float'], ['celeste', 'fly'], ['jack', 'spook'], ['kk-slider', 'appear']] as const)
  test(`${id} arrives and leaves by ${way}`, async ({ page }) => {
    // (each phase watched from the start: on a slow GPU the island may be up only once one has gone by)
    const phase = (p: string) => `[data-visitor="${id}"][data-phase="${p}"]`;
    await watchFor(page, ['arrive', 'here', 'leave'].map(phase));
    await page.goto(`?demo&date=2026-11-04T21:00&visitor=${id}&critter=none&arrive&leave=4000`);
    const v = page.locator(`[data-visitor="${id}"]`);
    await expect(v).toHaveAttribute('data-way', way);
    expect(await sawIt(page, phase('arrive'))).toBe(true);
    await expect.poll(() => sawIt(page, phase('here')), { timeout: 4000 }).toBe(true);
    await expect.poll(() => sawIt(page, phase('leave')), { timeout: 6000 }).toBe(true);
    await expect(page.locator('[data-visitor]')).toHaveCount(0, { timeout: 4000 });
  });

test('the partner comes over to say hello to Daisy Mae on the lawn: they face each other, she answers with an emote', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T09:00&visitor=daisy-mae&critter=none&meet');
  await expect(hudMenu(page)).toBeVisible();
  // (the ?meet hook sends the partner 3 s after the visitor's in, and tries again every 700 ms, 12 times, while the
  // partner is busy: up to ~11 s)
  await expect(page.locator('[data-actor="partner"].walking')).toBeAttached({ timeout: 15_000 });
  await expect(page.locator('[data-visitor="daisy-mae"] .emote')).toBeAttached({ timeout: 6000 });
  // close by, not on them: the partner's feet a step from the visitor's, the visitor's middle still theirs
  await expect(page.locator('[data-actor="partner"].walking')).toHaveCount(0);
  const r = await page.evaluate(() => {
    const p = document.querySelector('[data-actor="partner"] .vil')!.getBoundingClientRect(), v = document.querySelector('[data-visitor] .art')!.getBoundingClientRect();
    const mid = [(v.left + v.right) / 2, (v.top + v.bottom) / 2] as const;
    return { d: Math.hypot((p.left + p.right) / 2 - mid[0], p.bottom - v.bottom), over: document.elementsFromPoint(mid[0], mid[1]).some((e) => e.closest('[data-actor]')) };
  });
  expect(r.d).toBeLessThan(130);
  expect(r.over).toBe(false);
});

test('Celeste points at a falling star', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T21:00&visitor=celeste&critter=none');
  await camTo(page, await stageCam(page), false);
  const v = page.locator('[data-visitor="celeste"]');
  await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 3000 });
  await page.evaluate(() => document.querySelector('.if-scene')!.dispatchEvent(new CustomEvent('island:star', { detail: { x: 40 } })));
  await expect(v).toHaveAttribute('data-motion', 'point');
  await expect(v.locator('.emote')).toBeAttached();
});
