// The visitors' life (docs/design.md "Visitors: life"): every visitor breathes and shifts (its idle rig's transform
// changes over time), Gulliver sleeps face down until the fifth nudge, the ones who roam stroll and come back to their
// spot before a line (the balloon anchors to them there), they arrive from the campsite and leave to it (or by their
// own way), and the partner comes over to say hello to a visitor near home (never across the island to centre stage).
import { expect, test, type Page } from '@playwright/test';
import { campDoor, geo, is3d, oku, sawIt, watchFor } from './island.ts';

/** The campsite's door, where the visitors come from and go back to (world x, z). */

test.use({ viewport: { width: 390, height: 844 } });
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function tapOn(page: Page, sel: string, fy = 0.5) {
  const r = (await page.locator(sel).boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height * fy);
}
/** The idle rig's live transform (its breath, weight shift and signature loop) and the body's motion. */
const rig = (page: Page, id: string) =>
  page.locator(`[data-visitor="${id}"] .idle`).evaluate((e) => {
    const s = getComputedStyle(e);
    return `${s.scale}|${s.rotate}|${s.translate}|${s.transform}|${s.opacity}`;
  });
const NIGHT = new Set(['wisp', 'celeste', 'kk-slider', 'jack']);
/** Where each stands: Daisy Mae and Gulliver at まえ, the rest at centre stage (おく). */
const camOf = async (page: Page, id: string) => (id === 'daisy-mae' || id === 'gulliver' ? 30 : await oku(page));
/** The camera to a world z (まえ, 642 おく: the campsite's clearing), settled. */
async function camera(page: Page, z: number) {
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world);
  // (again until it holds: the scene may still re-fit its camera as it settles in)
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
    await page.waitForTimeout(250);
    return page.evaluate((z) => Math.abs((window as unknown as { __world: { cam(): number } }).__world.cam() - z), z);
  }, { timeout: 5000 }).toBeLessThan(1.5); // (WebKit scrolls by whole px: within a px of z)
  await page.waitForTimeout(250);
}
/** The visitor node's transform (the projector's: where its feet are on screen). */
const feet = (page: Page, id: string) => page.locator(`[data-visitor="${id}"]`).evaluate((e) => (e as HTMLElement).style.transform);

for (const id of ['kk-slider', 'daisy-mae', 'wisp', 'gulliver', 'jack', 'celeste', 'franklin', 'jingle', 'pave', 'zipper', 'reese'])
  test(`${id}: alive on centre stage (breathing, its own loop, a shadow that breathes with it)`, async ({ page }) => {
    await page.goto(`?demo&date=2026-11-04T${NIGHT.has(id) ? '21' : '12'}:00&visitor=${id}&critter=none`);
    await expect(ribbon(page)).toBeVisible();
    await camera(page, await camOf(page, id));
    const v = page.locator(`[data-visitor="${id}"]`);
    await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 3000 });
    await expect(v.locator('.art')).toBeVisible();
    await expect(v.locator('.idle')).toHaveCount(1);
    const anim = await v.locator('.idle').evaluate((e) => getComputedStyle(e).animationName);
    expect(anim).toMatch(/breathe|snore/);
    expect(await v.locator('.shade').evaluate((e) => getComputedStyle(e).animationName)).not.toBe('none');
    const a = await rig(page, id);
    await page.waitForTimeout(650);
    const b = await rig(page, id);
    expect(b).not.toBe(a);
    if (id === 'gulliver') await expect(v).toHaveAttribute('data-asleep', 'lie');
  });

test('Gulliver sleeps face down until the fifth nudge (NH), then stands and introduces himself', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none');
  await expect(ribbon(page)).toBeVisible();
  const g = page.locator('[data-visitor="gulliver"]');
  await expect(g).toHaveAttribute('data-asleep', 'lie');
  await expect(g.locator('.fxa.zzz')).toHaveCount(1);
  await tapOn(page, '[data-visitor="gulliver"] .art');
  await page.waitForTimeout(400); // the first nudge
  for (let i = 1; i < 5; i++) {
    if (i > 1) await tapOn(page, '[data-visitor="gulliver"] .art');
    await expect(g.locator('[data-mumble]')).toBeVisible();
    await expect(g).toHaveAttribute('data-asleep', 'lie');
    await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
    await page.waitForTimeout(250);
  }
  await tapOn(page, '[data-visitor="gulliver"] .art');
  await expect(g).not.toHaveAttribute('data-asleep', /./);
  await expect(g.locator('.fxa.zzz')).toHaveCount(0);
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('ジョニー');
  await expect(box).toHaveAttribute('data-pages', '2');
});

test('a stroll, and back on her spot before a line: the balloon anchors next to her', async ({ page }) => {
  await page.goto('?demo&date=2026-11-01T08:00&critter=none&stroll'); // Sunday morning: Daisy Mae
  await expect(ribbon(page)).toBeVisible();
  const v = page.locator('[data-visitor="daisy-mae"]');
  await expect(v.locator('.art')).toBeVisible();
  const home = await feet(page, 'daisy-mae');
  // off on a stroll and standing somewhere else
  await expect.poll(() => feet(page, 'daisy-mae'), { timeout: 8000 }).not.toBe(home);
  await expect(v).not.toHaveClass(/walking/, { timeout: 4000 });
  // a tap on her where she stands now: she walks back, turns to my villager, then speaks
  await tapOn(page, '[data-visitor="daisy-mae"] .art');
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
  // from the campsite, out of sight from まえ: she comes into view on the lawn as she nears her spot (the 3D island
  // shows the whole island: she sets off from the campsite's door in view)
  const three = await is3d(page);
  const door = three ? await page.evaluate(([x, z]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x, z), campDoor(await geo(page))) : null;
  const start = (await v.boundingBox())!;
  if (!three) {
    await expect(v.locator('.art')).toBeHidden();
    await until(() => v.locator('.art').isVisible(), 26);
  }
  await until(async () => (await v.getAttribute('data-phase')) === 'here', 26);
  if (door) {
    // she set off from the campsite (its way out, in front of the door): nearer it than half her spot on the lawn is
    const spot = (await v.boundingBox())!, off = (b: { x: number; y: number }) => Math.hypot(b.x - door[0], b.y - door[1]);
    expect(off(start)).toBeLessThan(off(spot) / 2);
  }
  // the visit ends 30 s after it began, however long the walk from the campsite took (the route's length moves with
  // the scenery the walk goes round)
  await until(async () => (await v.getAttribute('data-phase')) === 'leave', 32);
  await expect(v).toHaveClass(/walking/);
  if (!three) await until(async () => !(await v.locator('.art').isVisible()), 20);
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
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-actor="partner"].walking')).toBeAttached({ timeout: 6000 });
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

test('nobody crosses the island to say hello at centre stage (the partner keeps within 600u)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=jingle&critter=none&meet');
  await expect(ribbon(page)).toBeVisible();
  await is3d(page); // (the 3D island up first: on a slow GPU it takes a while)
  await expect(page.locator('[data-visitor="jingle"]')).toHaveAttribute('data-phase', 'here', { timeout: 3000 });
  await page.waitForTimeout(6000);
  // still on the front lawn (an idle wander may take it about there), nowhere near the campsite
  const stage = (await geo(page)).CENTRE_STAGE;
  const d = await page.evaluate(([sx, sz]) => {
    const p = document.querySelector('[data-actor="partner"]')!.getBoundingClientRect();
    const [x, y] = (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(sx, sz);
    return Math.hypot(p.left - x, p.top - y);
  }, stage);
  expect(d).toBeGreaterThan(150);
});

test('Celeste points at a falling star', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T21:00&visitor=celeste&critter=none');
  await camera(page, await oku(page));
  const v = page.locator('[data-visitor="celeste"]');
  await expect(v).toHaveAttribute('data-phase', 'here', { timeout: 3000 });
  await page.evaluate(() => document.querySelector('.if-scene')!.dispatchEvent(new CustomEvent('island:star', { detail: { x: 40 } })));
  await expect(v.locator('.body')).toHaveAttribute('data-act', 'point');
  await expect(v.locator('.emote')).toBeAttached();
});
