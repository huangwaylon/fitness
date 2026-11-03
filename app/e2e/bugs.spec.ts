// The rest of NH's bugs (docs/design.md "Scene interactions"): a tarantula or a scorpion in the grass at night rears up
// when it's come at and charges if you keep coming, and once it settles a tap nets it; a mole cricket chirps under a
// mound and a tap digs it up; a tap on my villager now and then sends a flea hopping off it; the stink bugs on the
// flowers. Each keeps clear of every control and is a ずかん find, never ベル. `?critter=<id>` brings one on at once.
import { expect, test, type Page } from '@playwright/test';
import { quiet } from './island.ts';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { PERCH_3D, REAR_MS, type Perch } from '../src/lib/components/island/critters.ts';

const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');
test.use({ viewport: { width: 390, height: 844 } });
const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(hudJar(page)).toBeVisible();
  return hudJar(page).getAttribute('aria-label');
}
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
/** No control under the point (a critter must never sit on a button). */
const clear = (page: Page, p: { x: number; y: number }) => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

test('a tarantula at night: the first tap makes it rear up, it settles, then a tap nets it', async ({ page }) => {
  const bells = await open(page, '&date=2026-01-10T22:00&critter=tarantula');
  const t = page.locator('[data-critter="tarantula"]');
  await expect(t).toBeAttached();
  await page.waitForTimeout(900);
  const p = await at(page, '[data-critter="tarantula"]');
  expect(await clear(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-stalk="rear"]')).toBeAttached();
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  await expect(page.locator('[data-stalk="settled"]')).toBeAttached({ timeout: REAR_MS + 1000 });
  const q = await at(page, '[data-critter="tarantula"]');
  await page.mouse.click(q.x, q.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('tarantula'));
  expect(await finds(page)).toEqual([{ kind: 'bug', id: 'tarantula' }]);
  await expect(hudJar(page)).toHaveAttribute('aria-label', bells!);
});

test('a scorpion: a second tap while it is reared up and it charges off (gone, nothing caught)', async ({ page }) => {
  await open(page, '&date=2026-07-10T22:00&critter=scorpion');
  await expect(page.locator('[data-critter="scorpion"]')).toBeAttached();
  await page.waitForTimeout(900);
  const p = await at(page, '[data-critter="scorpion"]');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-stalk="rear"]')).toBeAttached();
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-critter="scorpion"]')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-bug-flee');
  expect(await finds(page)).toEqual([]);
});

test('a mole cricket chirps under a mound in the grass; a tap digs it up', async ({ page }) => {
  await open(page, '&date=2026-02-10T12:00&critter=mole-cricket');
  await expect(page.locator('[data-critter="mole-cricket"]')).toBeAttached();
  await page.waitForTimeout(900);
  const p = await at(page, '[data-critter="mole-cricket"]');
  expect(await clear(page, p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('mole-cricket'));
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-dig', 'scene-catch']));
});

test('a tap on my villager sends a flea hopping off into the grass; a tap on it nets it', async ({ page }) => {
  await open(page, '&date=2026-07-10T12:00&flea&critter=none'); // (no visiting bug: one out takes the flea's place)
  await quiet(page); // the opening beats are over
  await page.locator('button.vil').first().click();
  const flea = page.locator('[data-critter="flea"]');
  await expect(flea).toBeAttached();
  // the tap opens no phrase picker (that's the say button's: e2e/say.spec.ts)
  await expect(page.locator('[data-say-picker]')).toHaveCount(0);
  await page.waitForTimeout(2600); // its first hop lands in the grass
  const p = await at(page, '[data-critter="flea"]');
  // clear of every control (the partner idling about may pass in front of it for a moment)
  await expect.poll(() => clear(page, p), { timeout: 8000 }).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('flea'));
});

test('a stink bug on the flowers and a long-horned beetle on a trunk are netted, clear of every control', async ({ page }) => {
  for (const id of ['man-faced-stink-bug', 'citrus-long-horned-beetle'] as const) {
    await open(page, `&date=2026-05-10T21:00&critter=${id}`);
    await expect(page.locator(`[data-critter="${id}"]`)).toBeAttached();
    await page.waitForTimeout(1800);
    const p = await at(page, `[data-critter="${id}"]`);
    expect(await clear(page, p), id).toBe('');
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('[data-fx="catch"]')).toContainText(said(id));
  }
});

/** Whether a flower's head (its top third) is under the point. */
const onFlowerHead = (page: Page, p: { x: number; y: number }) =>
  page.evaluate(({ x, y }) => [...document.querySelectorAll('[data-flower]')].some((el) => {
    const r = el.getBoundingClientRect();
    // (it sits over the head: its box's middle up to about half a flower's height above the top)
    return x > r.left && x < r.right && y > r.top - Math.max(6, r.height * 0.5) && y < r.top + r.height * 0.35;
  }), p);

test('NH’s flower bugs: a ladybug and a mantis sit still on a flower’s head (and are netted there)', async ({ page }) => {
  for (const id of ['ladybug', 'orchid-mantis']) {
    await open(page, `&date=2026-05-10T12:00&critter=${id}`);
    await expect(page.locator(`[data-critter="${id}"]`)).toBeAttached();
    await page.waitForTimeout(900);
    const p = await at(page, `[data-critter="${id}"]`);
    expect(await onFlowerHead(page, p), id).toBe(true);
    // clear of every control (a wandering villager may pass in front of it for a moment)
  await expect.poll(() => clear(page, p), { timeout: 8000 }).toBe('');
    await page.waitForTimeout(1500);
    const q = await at(page, `[data-critter="${id}"]`);
    expect(Math.hypot(q.x - p.x, q.y - p.y), 'it sits still (a 1u bob)').toBeLessThan(3);
  }
  const m = await at(page, '[data-critter="orchid-mantis"]');
  await expect.poll(() => clear(page, m), { timeout: 8000 }).toBe('');
  await page.mouse.click(m.x, m.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('orchid-mantis').slice(0, 6), { timeout: 4000 });
});

test('fireflies: a little cloud of lights blinking out of step', async ({ page }) => {
  await open(page, '&date=2026-07-10T21:00&critter=firefly');
  const lights = page.locator('[data-critter="firefly"] .glow');
  await expect(lights).toHaveCount(4);
  const delays = await lights.evaluateAll((els) => els.map((e) => getComputedStyle(e).animationDelay.split(',')[0]));
  expect(new Set(delays).size).toBe(4);
});

test('a butterfly lands on a flower now and then (its wings slowly opening and closing)', {
  tag: '@quarantine',
  annotation: { type: 'quarantine', description: 'owner: critters agent, 2026-11-03: red on main (3588b68, c572162) and 1 in 4 as CI runs it: the sprite box\'s middle vs the flower\'s DOM box on the layout\'s 3D island, a few px either way at the whole island\'s zoom. TODO: check the landing on the flower head\'s world point, not DOM boxes' }
}, async ({ page }) => {
  await open(page, '&date=2026-05-10T12:00&critter=common-butterfly');
  await expect(page.locator('[data-critter="common-butterfly"].sat')).toBeAttached({ timeout: 15_000 });
  expect(await onFlowerHead(page, await at(page, '[data-critter="common-butterfly"]'))).toBe(true);
});

test('a dragonfly darts near the water (NH: flying near water), clear of every control', async ({ page }) => {
  await open(page, '&date=2026-08-10T12:00&critter=darner-dragonfly');
  await expect(page.locator('[data-critter="darner-dragonfly"]')).toBeAttached();
  await expect(page.locator('[data-critter="darner-dragonfly"]')).toHaveAttribute('data-place', 'water-air');
  await page.waitForTimeout(2500);
  const p = await at(page, '[data-critter="darner-dragonfly"]');
  expect(p.y).toBeGreaterThan(0), expect(p.y).toBeLessThan(844);
  expect(await clear(page, p)).toBe('');
});

type W = { __world: { go(z: number): void; at(x: number, z: number): [number, number] } };
test("NH's palm beetles on the palms at night (a horned atlas), the stags on a hardwood trunk; each netted", async ({ page }) => {
  for (const [id, place] of [['horned-atlas', 'palm'], ['golden-stag', 'palm'], ['saw-stag', 'trunk']] as const) {
    await open(page, `&date=2026-07-10T22:00&critter=${id}`);
    const b = page.locator(`[data-critter="${id}"]`);
    await expect(b).toHaveAttribute('data-place', place);
    await expect(page.locator(`[data-critter="${id}"].sat`)).toBeAttached({ timeout: 5000 });
    const p = await at(page, `[data-critter="${id}"]`);
    expect(await clear(page, p), id).toBe('');
    // on a palm's (or a tree's) trunk: within a few units of one of its kind's foot, up the trunk
    const trunks = await page.evaluate((kind) => [...document.querySelectorAll(kind === 'palm' ? '[data-kind="palm"] .art' : '.tree, [data-kind="oak"][data-part="trunk"] .art, [data-kind="cedar"] .art')]
      .map((el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }), place === 'palm' ? 'palm' : 'oak');
    expect(trunks.some(([l, t, r, bt]) => p.x > l && p.x < r && p.y > t && p.y < bt), id).toBe(true);
    await page.screenshot({ path: `/tmp/world-build/critters-bug-${place}.png` });
    await page.mouse.click(p.x, p.y);
    await expect(page.locator('[data-fx="catch"]')).toContainText(said(id).slice(0, 8), { timeout: 4000 }); // (a three-line line turns a page)
  }
});

type W3 = { __world3d?: { loaded(): boolean; where(id: string): { x: number; y: number; z: number; hidden: boolean } | null; client(x: number, z: number, lift?: number): [number, number] } };
test('on the 3D island a bug perched on a trunk sits on its bark, in view under the canopy, and a tap where it\'s drawn nets it (by day and at night)', async ({ page }) => {
  test.setTimeout(60_000);
  for (const [date, id, palm] of [['2026-07-10T12:00', 'robust-cicada', false], ['2026-07-10T22:00', 'saw-stag', false], ['2026-07-10T22:00', 'horned-atlas', true]] as const) {
    await open(page, `&date=${date}&critter=${id}&visitor=none`);
    await page.waitForFunction(() => (window as unknown as W3).__world3d?.loaded(), null, { timeout: 30_000 });
    await expect(page.locator(`[data-critter="${id}"].sat`)).toBeAttached({ timeout: 5000 });
    // its model, and the trunk it's on: on the bark's front (out of the trunk toward the camera), under the canopy
    const m = await page.evaluate(() => {
      for (let n = 1; n < 40; n++) {
        const at = (window as unknown as W3).__world3d!.where(`bug-${n}`);
        if (at && !at.hidden) return at;
      }
      return null;
    });
    expect(m, id).not.toBeNull();
    // (the trunks and the ground as the page's island has them: the layout's on it)
    const [x, z] = [m!.x, -m!.z], lift = m!.y - (await page.evaluate(([x, z]) => (window as unknown as { __world: { height(x: number, z: number): Promise<number> } }).__world.height(x, z), [x, z]));
    const trunks = await page.evaluate((palm) => (window as unknown as { __world: { perches(palm: boolean): Perch[] } }).__world.perches(palm), palm);
    const p = trunks.sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
    expect(Math.abs(x - p.x), id).toBeLessThan(2);
    expect(p.z - z, `${id} out of the trunk`).toBeGreaterThan(PERCH_3D[p.kind].out * p.h * 0.9);
    expect(lift, `${id} under the canopy`).toBeLessThan(PERCH_3D[p.kind].lift * p.h * 1.2);
    // a tap where it's drawn (its model on screen) nets it, before the tree takes the tap
    const [cx, cy] = await page.evaluate(([x, z, l]) => (window as unknown as W3).__world3d!.client(x, z, l), [x, z, lift]);
    expect(await clear(page, { x: cx, y: cy }), id).toBe('');
    await page.mouse.click(cx, cy);
    await expect(page.locator('[data-fx="catch"]')).toContainText(said(id).slice(0, 8), { timeout: 4000 });
  }
});
