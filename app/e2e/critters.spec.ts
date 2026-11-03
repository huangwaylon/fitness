// The island's critters and the balloon (docs/design.md "Scene interactions"): a tap pops the balloon and its present
// falls; a fish shadow can be fished (caught on the bite, lost on an early tap); a bug can be netted. None of it
// changes ベル, opens a sheet or navigates. `?critter=` (with ?demo) brings one on at once and keeps it until caught.
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { plateOnly } from './island.ts';

/** NH's own catch line (ja), as the plate shows it (whitespace collapsed). */
const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');

// The installed app's full screen (a Home Screen app has no browser bars): with the island centred in the whole ocean,
// the 664px Safari viewport leaves too little sea under the beach for a fish.
test.use({ viewport: { width: 390, height: 844 } });

const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await expect(hudJar(page)).toBeVisible();
  return { bells: await hudJar(page).getAttribute('aria-label'), url: page.url() };
}

/** Nothing counted, nothing opened, nowhere gone. */
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(hudJar(page)).toHaveAttribute('aria-label', before.bells!);
}

/** The centre of an element (critters are 0 × 0 anchors: their box is the point). */
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

/** Cast at the swimming shadow (where it is now: it dawdles, so a tap may land just behind it; once more then). */
async function cast(page: Page) {
  for (let i = 0; i < 3; i++) {
    const f = await at(page, '[data-critter="fish"]');
    await page.mouse.click(f.x, f.y);
    // the cast has begun (in place: no walk first): a second tap now would be an early one
    if (await page.locator('[data-bobber]').waitFor({ state: 'attached', timeout: 1500 }).then(() => true, () => false)) break;
  }
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 4000 });
}
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

test('a tap pops the balloon; its present falls onto the island and lies there until a tap picks it up', async ({ page }) => {
  const before = await open(page, '&balloon');
  const balloon = page.locator('.if-scene .balloon');
  // it drifts in from off the screen's edge: wait until it's well inside
  await expect.poll(async () => { const r = await balloon.boundingBox(); return !!r && r.x > 40 && r.x + r.width < 350; }, { timeout: 15_000 }).toBe(true);
  const b = (await balloon.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.25);
  await expect(page.locator('[data-fx="present"]')).toHaveCount(1);
  await expect(balloon).toHaveCount(0);
  expect(await cues(page)).toContain('scene-balloon');
  // it lands on the lawn and stays there (NH) until it's picked up, clear of everything lying there
  const gift = page.locator('[data-find="present"]');
  await expect(gift).toHaveCount(1, { timeout: 4000 });
  await page.waitForTimeout(5000);
  await expect(gift).toHaveCount(1);
  const g = (await gift.locator(':scope > *').boundingBox())!;
  for (const other of await page.locator('[data-care], [data-find]:not([data-find="present"])').all()) {
    // (a world node out of view keeps its last box: only what is on screen counts)
    if (!(await other.evaluate((e) => (e as HTMLElement).checkVisibility({ visibilityProperty: true })))) continue;
    const o = (await other.boundingBox())!;
    if (!o) continue;
    const d = Math.hypot(o.x + o.width / 2 - (g.x + g.width / 2), o.y + o.height - (g.y + g.height));
    expect(d, await other.getAttribute('data-care') ?? await other.getAttribute('data-find') ?? '').toBeGreaterThan(16);
  }
  // a tap: the present pops open where it lies (confetti), and what was inside (NH's furniture, clothing or a
  // DIY recipe) is on its plate with 「◯◯を てにいれた！」, nothing over my villager's head; no ベル
  await page.mouse.click(g.x + g.width / 2, g.y + g.height / 2);
  await expect(page.locator('[data-fx="present-open"]')).toHaveCount(1, { timeout: 2000 });
  await expect(page.locator('[data-fx="present-open"] .bit')).toHaveCount(14);
  await expect(page.locator('[data-fx="catch"]')).toContainText('を てにいれた！', { timeout: 4000 });
  await plateOnly(page, /\/(finds\/items\/[^/]+|presents\/diy-recipe)\.webp/);
  // the ずかん's カタログ / レシピ: a first find of it, and one more in today's tally (held a minute before it's sent)
  const sent = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []) as { type: string; data: Record<string, unknown> }[]);
  const find = sent.find((e) => e.type === 'find')!.data as { kind: string; id: string };
  expect(['item', 'recipe']).toContain(find.kind);
  expect(sent.filter((e) => e.type === 'tally').map((e) => e.data.counts)).toEqual([{ [`${find.kind}:${find.id}`]: 1 }]);
  await expect(gift).toHaveCount(0);
  await unchanged(page, before);
});

type Sky3 = { __world3d?: { loaded(): boolean; where(id: string): { hidden: boolean; model: string } | null } };
test('a popped balloon leaves nothing in the sky: only its present falls (no copy hanging where it burst)', async ({ page }) => {
  await open(page, '&balloon');
  await page.waitForFunction(() => (window as unknown as Sky3).__world3d?.loaded(), null, { timeout: 30_000 });
  const balloon = page.locator('.if-scene .balloon');
  await expect.poll(async () => { const r = await balloon.boundingBox(); return !!r && r.x > 40 && r.x + r.width < 350; }, { timeout: 15_000 }).toBe(true);
  /** The 3D sky's models shown now (Island3D's sky:<n>: the balloon and the present on its string). */
  const shown = () => page.evaluate(() => {
    const w = (window as unknown as Sky3).__world3d!;
    return [0, 1, 2, 3].map((i) => w.where(`sky:${i}`)).flatMap((q) => (q && !q.hidden ? [q.model] : [])).sort();
  });
  const flying = await shown();
  expect(flying).toHaveLength(2);
  expect(flying).toContain('finds/present');
  const b = (await balloon.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.25);
  await expect(page.locator('[data-fx="present"]')).toHaveCount(1);
  // the flight still mounted (the burst's confetti flying out), the balloon and its present are already gone from the
  // sky, the 3D models and the DOM's alike: only the falling present remains
  await expect(page.locator('.if-scene .fly.popped')).toHaveCount(1);
  await expect.poll(shown, { timeout: 300 }).toEqual([]);
  for (const el of await page.locator('.if-scene .fly [data-m3sky]').all()) await expect(el).toBeHidden();
  await expect(page.locator('.if-scene .fly.popped')).toHaveCount(1);
  // then the flight goes, the sky empty
  await expect(balloon).toHaveCount(0);
  expect(await shown()).toEqual([]);
  await expect(page.locator('[data-fx="present"]')).toHaveCount(1);
});

/** A tap on the sea well away from the bobber and the shadow (any sea tap is the reel while the bobber is out). */
async function seaTap(page: Page) {
  const b = await at(page, '[data-bobber]');
  await page.mouse.click(b.x < 195 ? 366 : 24, b.y);
}

test('fishing: react to the 「！」 and a tap anywhere on the sea catches the fish', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  const fish = page.locator('[data-critter="fish"]');
  await expect(fish).toBeAttached();
  await page.waitForTimeout(500); // faded in
  const f = await at(page, '[data-critter="fish"]');
  // the shadow swims in the sea in front of the front beach (nearer than the shoreline, seen from まえ)
  const shore = await page.evaluate(() => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(195, 0)[1]);
  expect(f.y).toBeGreaterThan(shore);
  expect(f.y).toBeLessThan(844);
  await page.mouse.click(f.x + (f.x < 195 ? 40 : -40), f.y); // a cast beside the shadow, not on it
  await expect(page.locator('[data-bobber]')).toBeAttached();
  await expect(page.locator('[data-bite]')).toHaveText('！', { timeout: 10_000 });
  // the 「！」: small (≤ 28px) and inside the screen; the line runs from the bank, nobody walked
  await page.waitForTimeout(350); // popped in (it overshoots a little on the way)
  const bang = (await page.locator('[data-bite]').boundingBox())!;
  expect(bang.width).toBeLessThanOrEqual(28.5);
  expect(bang.x).toBeGreaterThanOrEqual(7.5);
  expect(bang.x + bang.width).toBeLessThanOrEqual(390 - 7.5);
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
  await expect(page.locator('[data-bobber="bite"]')).toBeAttached();
  await page.waitForTimeout(400); // a human's reaction
  await seaTap(page);
  const caught = page.locator('[data-fx="catch"]');
  await expect(caught).toHaveCount(1);
  await expect(caught).toContainText('釣'); // every sea fish's line says it (釣り上げた, 一本釣りだ…), whichever came
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/world-build/critters-catch.png' });
  await expect(page.locator('[data-bobber]')).toHaveCount(0);
  await expect(page.locator('[data-bite]')).toHaveCount(0);
  await expect(fish).toHaveCount(0);
  const heard = await cues(page);
  expect(heard).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
  expect(heard).not.toContain('scene-flee');
  await unchanged(page, before);
});

test('fishing: a first early tap only makes the fish hesitate (it still bites); a second scares it away', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  await page.waitForTimeout(500);
  await cast(page);
  await page.waitForTimeout(200);
  await seaTap(page); // still swimming up to it: too early, but only the first time
  await page.waitForTimeout(300);
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached();
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  expect(await cues(page)).not.toContain('scene-flee');
  await seaTap(page); // the second early tap
  await expect(page.locator('[data-bobber]')).toHaveCount(0);
  await expect(page.locator('[data-critter="fish"]')).toHaveCount(0, { timeout: 2000 });
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-flee');
  await unchanged(page, before);
});

test('fishing: after a hesitation the fish comes back and bites, and the bite still catches it', async ({ page }) => {
  await open(page, '&critter=fish');
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  await page.waitForTimeout(500);
  await cast(page);
  await page.waitForTimeout(200);
  await seaTap(page);
  await expect(page.locator('[data-bite]')).toBeAttached({ timeout: 12_000 });
  await page.waitForTimeout(400);
  await seaTap(page);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(1);
});

test('a shark: a fin cuts the surface (NH), and the catch names it', async ({ page }) => {
  const before = await open(page, '&critter=great-white-shark');
  const fish = page.locator('[data-critter="fish"].is-fin');
  await expect(fish).toBeAttached();
  await page.waitForTimeout(500);
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x + (f.x < 195 ? 40 : -40), f.y);
  await expect(page.locator('[data-bite]')).toBeAttached({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await seaTap(page);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('great-white-shark'));
  await unchanged(page, before);
});

test('a tap on a butterfly nets it', async ({ page }) => {
  const before = await open(page, '&critter=common-butterfly');
  await expect(page.locator('[data-critter="common-butterfly"]')).toBeAttached();
  await page.waitForTimeout(2200); // in over its flowers
  const b = await at(page, '[data-critter="common-butterfly"]');
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('common-butterfly'));
  await expect(page.locator('[data-critter]')).toHaveCount(0);
  // the shared ずかん: the first catch is a `find` (the demo keeps its events in localStorage), never ベル
  const finds = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
  expect(finds).toEqual([{ kind: 'bug', id: 'common-butterfly' }]);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await unchanged(page, before);
});

test('a cicada perches on a trunk, clear of the tree, and a tap on it nets it', async ({ page }) => {
  await open(page, '&critter=robust-cicada');
  const c = page.locator('[data-critter="robust-cicada"].sat');
  await expect(c).toBeAttached({ timeout: 5000 });
  const p = await at(page, '[data-critter="robust-cicada"]');
  const target = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);
  expect(target).toBe(''); // not on the canopy or the fruit row
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('robust-cicada'));
});

test('a hermit crab crawls on the beach at night, clear of every control, and a tap on it nets it', async ({ page }) => {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-07-04T21:00&critter=hermit-crab');
  const crab = page.locator('[data-critter="hermit-crab"]');
  await expect(crab).toBeAttached();
  await page.waitForTimeout(1000);
  const p = await at(page, '[data-critter="hermit-crab"]');
  const sand = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);
  expect(sand).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('hermit-crab'));
});

test('a stag beetle perches on a trunk at night and is netted', {
  tag: '@quarantine',
  annotation: { type: 'quarantine', description: 'owner: engine agent, 2026-11-03: flaky on CI (failed before and on the cutover, logic shard 8). TODO: the trunk perch at night on the layout' }
}, async ({ page }) => {
  await page.goto('?demo&date=2026-07-04T22:00&critter=rainbow-stag');
  await expect(page.locator('[data-critter="rainbow-stag"].sat')).toBeAttached({ timeout: 5000 });
  const p = await at(page, '[data-critter="rainbow-stag"]');
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('rainbow-stag'));
  // NH's A: taps on the plate finish and turn its pages, and the last one closes it
  const plate = page.locator('[data-fx="catch"] .catch-plate');
  for (let i = 0; i < 6 && (await plate.count()); i++) await plate.click().catch(() => {});
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
});

test('a balloon floats by on its own in the daytime (the first in 30–60 s), in the sky lane under the HUD', async ({ page }) => {
  await page.clock.install();
  await open(page, '');
  await expect(page.locator('.fly')).toHaveCount(0);
  await page.clock.fastForward(61_000); // (its timers, not its every frame: the 3D island would draw each, in software on CI)
  const fly = page.locator('.fly');
  await expect(fly).toBeAttached();
  const box = await page.evaluate(() => {
    const f = document.querySelector('.fly')!, rib = document.querySelector('.ribbon-wrap')!.getBoundingClientRect();
    const b = document.querySelector('.fly .balloon')!.getBoundingClientRect();
    const hy = parseFloat(getComputedStyle(document.querySelector('.if-scene')!).getPropertyValue('--horizon-y'));
    return { top: b.top, bottom: b.bottom, ribbon: rib.bottom, hy };
  });
  // the HUD sits high in the sky, the horizon well under it: the balloon crosses the sky between them
  expect(box.top).toBeGreaterThanOrEqual(box.ribbon);
  expect(box.bottom).toBeLessThanOrEqual(box.hy + 8);
});

test('fish shadows: one teardrop each, NH’s sizes reading apart (a clownfish tiny, a whale shark huge)', async ({ page }) => {
  const len = async (id: string) => {
    await open(page, `&critter=${id}`);
    await expect(page.locator('[data-critter=fish] .fin svg')).toHaveCount(1);
    return (await page.locator('[data-critter=fish] .fin').boundingBox())!.width;
  };
  const small = await len('clownfish'), big = await len('whale-shark');
  expect(big / small).toBeGreaterThan(2.8); // 46u against 14u
});
