// The fields (docs/farming.md): everyone's plots. Starts in my pocket, planted by a tap on any empty plot (its 3 × 3;
// the picker with two kinds or more); six hours on the plant is ripe and anyone's tap harvests it, three for one watered
// while growing; the vegetables sell at the shop; anyone waters, harvests or digs (ほる over a plant's word); the shop's
// 苗 sends plants off every field back to starts; the scene redraws a plant at its next stage by one timer. On `?demo`:
// the demo's events in localStorage (a field put down in the editor, a catch sold, the starts bought, as their writes
// have them; a farm row unsent, as the phones step those on the record's field). The plots are tapped by their world
// points (a field's tile middles: layout/grid.ts tileMid).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, quiet, tapAt, tapWorld, type W3 } from './island.ts';
import { LIVE_V } from '../src/lib/contract/live-protocol.ts';

test.use({ viewport: { width: 393, height: 852 } });
/** An event: its type, data, sender and its time (`HH:MM` that day; else 00:00, in list order: keep them ascending). */
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G', hm?: string];
/** The demo's events of a day (as the writes keep them; a farm row unsent: model/farm.ts steps only those without a
 *  stored field). */
const seed = (page: Page, day: string, events: Seed[]) =>
  page.addInitScript(([day, list]) => {
    if (localStorage.getItem('island-demo.events')) return;
    const rows = list.map(([type, data, person, hm], i) => {
      const at = Date.parse(`${day}T${hm ?? '00:00'}:00+09:00`) + i;
      return { id: `seed-${i}`, type, data, queuedAt: at, tries: 0, nextAt: 0, ...(type === 'farm' ? {} : { ackedAt: at }), person };
    });
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [day, events] as const);
/** A field: 2 × 2 on まえ's lawn east of the path (tiles 10–11 × 17–18: nothing in front of it on screen, うめ at her
 *  spot, a goal tree's canopy, a flower's tap area). */
const FIELD: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 17, f: 0, s: 'f-2x2' }, 'A'];
/** A plot's id and its world point (its tile's middle: the grid's x0 and z0 −90, 30 a tile). */
const plot = (i: number, j = 0) => ({ p: `fd:field-A.${i}.${j}`, x: -90 + (10 + i) * 30 + 15, z: -90 + (17 + j) * 30 + 15 });
const D = '2026-11-04';
const SHOTS = process.env.SHOTS;
/** 200 かいがら (a koi sold) and three tomato starts (3 × 14). */
const POCKET: Seed[] = [['tally', { date: D, counts: { 'fish:koi': 1 } }, 'A'], ['sell', { species: 'fish:koi', n: 1, v: 200 }, 'A'], ['buy_starts', { crop: 'tomato', n: 3, v: 42 }, 'A']];
/** The plot words this page pops (FarmPop's tag lives 1.2 s: each caught as it comes). */
const catchPops = (page: Page) =>
  page.addInitScript(() => {
    const seen: string[] = ((window as unknown as { __pops: string[] }).__pops = []);
    new MutationObserver((list) => {
      for (const r of list) for (const n of r.addedNodes) {
        const w = n instanceof HTMLElement ? (n.matches('[data-farm-pop]') ? n : n.querySelector('[data-farm-pop]')) : null;
        if (w) seen.push(w.textContent ?? '');
      }
    }).observe(document, { childList: true, subtree: true });
  });
const pops = (page: Page) => page.evaluate(() => (window as unknown as { __pops: string[] }).__pops);
/** The farm ops this page sent (not the seeds'). */
const farmRows = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{"events":[]}').events as { id: string; type: string; data: { ops: { o: string; p: string; n?: number }[] } }[])
  .filter((e) => e.type === 'farm' && !e.id.startsWith('seed-')).flatMap((e) => e.data.ops));

/** A 3 × 2 field a tile west of FIELD's (tiles 9–11 × 17–18; an older build's variant, its owner ignored) and its plots. */
const WIDE: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 9, z: 17, f: 0, s: 'b-3x2' }, 'A'];
const wide = (i: number, j = 0) => ({ ...plot(i - 1, j), p: `fd:field-A.${i}.${j}` });
const plants = (ps: string[], c = 'tomato') => ps.map((p) => ({ o: 'plant', p, c, src: 'start' }));
const water = (ps: string[]) => ps.map((p) => ({ o: 'water', p }));
/** The page owns its clock, at 06:00 on D: seeds at 05:xx keep their times (a queued row is stamped after the demo's
 *  own rows, which end 40 minutes before the page's now: store/view.ts composeModel) and fastForward grows them. One
 *  page a test: another page's model would stamp them anew. */
const at6 = (page: Page) => page.clock.install({ time: new Date(`${D}T06:00:00+09:00`) });
const SIX = '?demo&weather=clear';
const swings = (page: Page) => page.evaluate(() => (window as unknown as { __fx3: { log(): { kind: string }[] } }).__fx3.log().filter((e) => e.kind === 'swing').length);

test('starts bought at the shop’s かう; one kind held: a tap on an empty plot plants its 3 × 3 at once, the tapped one first; none left, a word; no はたけ button', async ({ page, context }) => {
  await seed(page, D, [FIELD, ...POCKET.slice(0, 2)]);
  // three tomato starts from かう's 苗 (3 × 14), by the list's own name, kanji
  await page.goto(`shop?demo&date=${D}T12:00`);
  await expect(page.locator('[data-shop]')).toHaveAttribute('data-shells', '200');
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="buy"]').click();
  await expect(page.locator('[data-shop-start="tomato"] .nm')).toHaveText('トマトの苗');
  // the rule, under the starts (the sheet's kanji)
  await expect(page.locator('[data-shop-farm-rule]')).toHaveText('6時間で実る。水をやると3つ収穫（水なしは1つ）。雨の日もOK。畑はみんなのもの');
  for (let i = 0; i < 3; i++) await page.locator('[data-shop-more="tomato"]').click();
  // one bar: the pinned one names the crop and buys them
  await expect(page.locator('[data-shop-starts-offer]')).toHaveAttribute('data-shop-starts-offer', '42');
  await expect(page.locator('[data-shop-starts-offer]')).toHaveText('トマトの苗 ×3');
  await page.locator('[data-shop-buy]').click();
  await expect(page.locator('[data-shop]')).toHaveAttribute('data-shells', '158');
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトの苗×3を買いました');
  await catchPops(page);
  await page.goto(`?demo&date=${D}T12:00`);
  await islandUp(page);
  await quiet(page);
  // no farm button: the bottom left is the island's (the picker's empty anchor only)
  await expect(page.locator('[data-say-open]')).toBeVisible();
  await expect(page.locator('[data-farm-open], [data-farm-held]')).toHaveCount(0);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/island-no-button.png` });
  // one kind held: no picker; its 3 × 3's empty plots, the tapped one, then the nearest, as many as I hold
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(page.locator('[data-farm-picker]')).toHaveCount(0);
  // one word, the banner's (world kana, with the world's とりけす), no pop
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトを 3かぶ うえた');
  await expect(page.locator('.banner[role="status"]').getByRole('button')).toHaveText('とりけす');
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual(plants([plot(0).p, plot(1).p, plot(0, 1).p]));
  // one swing of the shovel a tap
  expect(await swings(page)).toBe(1);
  // none left: the fourth plot says so (the plants beside it aren't watered by a tap on an empty plot)
  await tapWorld(page, plot(1, 1).x, plot(1, 1).z);
  await expect.poll(() => pops(page)).toEqual(['なえが ない！ おみせで かえるよ']);
  await expect(page.locator('[data-farm-picker]')).toHaveCount(0);
  await expect(page.locator('[data-fx="say"]')).toHaveCount(0);
  expect(await farmRows(page)).toHaveLength(3);
  // うめ has no farm button either
  const b = await context.newPage();
  await b.goto(`?demo&as=B&date=${D}T12:00`);
  await islandUp(b);
  await expect(b.locator('[data-say-open]')).toBeVisible();
  await expect(b.locator('[data-farm-open]')).toHaveCount(0);
  await b.close();
});

test('two kinds held: an empty plot opens the picker; a tap on another plot while it’s open re-targets it; the pick plants that 3 × 3 and lasts the planting run', async ({ page }) => {
  await seed(page, D, [WIDE, ...POCKET.slice(0, 2), ['buy_starts', { crop: 'tomato', n: 6, v: 84 }, 'A'], ['buy_starts', { crop: 'carrot', n: 2, v: 28 }, 'A']]);
  await catchPops(page);
  await page.goto(`?demo&date=${D}T12:00&weather=clear`);
  await islandUp(page);
  await quiet(page);
  await tapWorld(page, wide(0).x, wide(0).z);
  const picker = page.locator('[data-farm-picker]');
  await expect(picker).toBeVisible();
  await expect(page.locator('[data-farm-pick="start:carrot"]')).toContainText('ニンジン');
  // another plot while it's open: the picker again, for that plot
  await tapWorld(page, wide(2).x, wide(2).z);
  await expect(picker).toBeVisible();
  if (SHOTS) {
    await expect.poll(() => picker.locator('img').evaluateAll((is) => is.length > 0 && is.every((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await page.screenshot({ path: `${SHOTS}/picker.png` });
  }
  // its ✕ shuts it (a floating card's, top right); the plot opens it again
  await page.locator('[data-farm-close]').click();
  await expect(picker).toHaveCount(0);
  await tapWorld(page, wide(2).x, wide(2).z);
  await expect(picker).toBeVisible();
  expect(await farmRows(page)).toEqual([]);
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect(picker).toHaveCount(0);
  // the second plot's 3 × 3 (its column and the middle one)
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトを 4かぶ うえた');
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual(plants([wide(2).p, wide(1).p, wide(2, 1).p, wide(1, 1).p]));
  // the run's crop: the first plot now plants tomatoes without asking
  await tapWorld(page, wide(0).x, wide(0).z);
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトを 2かぶ うえた');
  await expect(picker).toHaveCount(0);
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toHaveLength(6);
  // the picker lights the last pick, first
  await expect.poll(() => page.evaluate(() => localStorage.getItem('island-demo.farm.seed'))).toBe('{"c":"tomato","src":"start"}');
});

test('a mixed 3 × 3: a tap on an empty plot harvests first, the next plants, a tap on a plant waters', async ({ page }) => {
  await seed(page, D, [
    WIDE, ...POCKET, ['buy_starts', { crop: 'tomato', n: 3, v: 42 }, 'A'],
    // ripe at 11:30 at the west corner; うめ's at the east back corner at 11:59
    ['farm', { ops: plants([wide(0).p]) }, 'A', '05:30'],
    ['farm', { ops: plants([wide(2, 1).p]) }, 'B', '05:59']
  ]);
  await catchPops(page);
  await page.addInitScript(() => {
    // (うめ's tab there, as far as the demo's relay knows: an act goes only to someone present)
    const acts: string[] = ((window as unknown as { __acts: string[] }).__acts = []), bc = new BroadcastChannel('island-demo-relay');
    bc.onmessage = (e) => {
      if (e.data?.k === 'hi' && e.data.who === 'A') bc.postMessage({ k: 'hi', who: 'B' });
      if (e.data?.k === 'm' && e.data.m.kind === 'act' && e.data.m.act === 'water') acts.push(e.data.m.id);
    };
  });
  await at6(page);
  await page.goto(SIX);
  await islandUp(page);
  await page.clock.fastForward('05:40:00');
  await quiet(page);
  // the middle (empty): the ripe one first
  await tapWorld(page, wide(1).x, wide(1).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', /トマトを しゅうかく！ ×1/);
  // again: never the can; the harvest's tomato is a second kind (a vegetable plants too), so the picker, whose pick
  // plants the empty plots of its 3 × 3, the tapped one first, then the nearest
  await tapWorld(page, wide(1).x, wide(1).z);
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトを 4かぶ うえた');
  // the とりけす snackbar over the harvest's plate at the bottom, never on it
  await expect.poll(async () => {
    const [b, plate] = [await page.locator('.banner[role="status"]').boundingBox(), await page.locator('[data-catch-stack] > .slot').first().boundingBox()];
    return !!b && !!plate && b.y + b.height <= plate.y;
  }).toBe(true);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/plant-3x3-pop.png` });
  // a plant: the can over its 3 × 3's growing, unwatered ones (the new plants there and うめ's; the west one's out of
  // reach), a drop over each and the can's own
  await tapWorld(page, wide(2, 1).x, wide(2, 1).z);
  await expect.poll(() => pops(page)).toEqual(['4かぶに みずやり・3こ みのる']);
  await expect.poll(async () => (await farmRows(page)).length, { timeout: 10_000 }).toBe(9);
  const ops = await farmRows(page);
  expect(ops.slice(0, 5)).toEqual([{ o: 'harvest', p: wide(0).p, n: 1 }, ...plants([wide(1).p, wide(2).p, wide(1, 1).p, wide(0, 1).p])]);
  expect(ops.slice(5).map((o) => `${o.o} ${o.p}`).sort()).toEqual(water([wide(1).p, wide(2).p, wide(1, 1).p, wide(2, 1).p]).map((o) => `${o.o} ${o.p}`).sort());
  const drops = () => page.evaluate(() => (window as unknown as { __fx3: { log(): { kind: string }[] } }).__fx3.log().filter((e) => e.kind === 'drops').length);
  await expect.poll(drops).toBe(5);
  // the partner told at once: one `act` over the room (the demo's relay: sync/live-local.ts' BroadcastChannel)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __acts: string[] }).__acts)).toEqual([wide(2, 1).p]);
});

test('six hours on: ripe, watered by うめ while growing it gives three, harvested by a tap a row off (54 かいがら); a growing one watered, then its time to ripe', async ({ page }) => {
  await seed(page, D, [
    FIELD, ...POCKET,
    ['farm', { ops: plants([plot(0).p]) }, 'A', '05:30'],
    ['farm', { ops: water([plot(0).p]) }, 'B', '05:40'],
    // ripe at 11:59
    ['farm', { ops: plants([plot(1).p]) }, 'A', '05:59']
  ]);
  await catchPops(page);
  await at6(page);
  await page.goto(SIX);
  await islandUp(page);
  await page.clock.fastForward('05:40:00');
  await quiet(page);
  // a row's miss: a tap on the empty plot behind it harvests the ripe plant there (the growing one on the diagonal stays)
  await tapWorld(page, plot(0, 1).x, plot(0, 1).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', /トマトを しゅうかく！ ×3・54かいがら/);
  await expect.poll(() => farmRows(page)).toEqual([{ o: 'harvest', p: plot(0).p, n: 3 }]);
  // the growing one: the can over it and the one growing back
  await tapWorld(page, plot(1).x, plot(1).z);
  // (its word shown before the next tap: FarmPop is a lazy chunk, loaded by the first pop, and a pop replaced before
  // it's in is never drawn)
  await expect.poll(() => pops(page)).toEqual(['2かぶに みずやり・3こ みのる']);
  // watered now: a word with its time to ripe (19 minutes less the seconds since, up to ten)
  await tapWorld(page, plot(1).x, plot(1).z);
  await expect.poll(() => pops(page)).toEqual(['2かぶに みずやり・3こ みのる', 'トマト・あと 20ぷん・みずやり ずみ']);
  await expect.poll(async () => (await farmRows(page)).filter((o) => o.o === 'water').map((o) => o.p).sort()).toEqual([plot(0).p, plot(1).p].sort());
});

test('a plot under a goal tree’s canopy is the plot’s; the canopy off the field still opens its tree', async ({ page }) => {
  // a 6 × 3 field beside うめ's goal tree (14, 10): its east plots lie under the tree's canopy on screen
  const beside: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 11, f: 0, s: 'f-6x3' }, 'A'];
  // a tomato and a carrot: two kinds, so the picker
  await seed(page, D, [beside, ...POCKET.slice(0, 2), ['buy_starts', { crop: 'tomato', n: 1, v: 14 }, 'A'], ['buy_starts', { crop: 'carrot', n: 1, v: 14 }, 'A']]);
  await catchPops(page);
  await page.goto(`?demo&date=${D}T12:00`);
  await islandUp(page);
  await quiet(page);
  const at = (i: number, j: number) => ({ p: `fd:field-A.${i}.${j}`, x: -90 + (10 + i) * 30 + 15, z: -90 + (11 + j) * 30 + 15 });
  const all = [0, 1, 2].flatMap((j) => [0, 1, 2, 3, 4, 5].map((i) => at(i, j)));
  const under = await page.evaluate((all) => all.filter(({ x, z }) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    return w.pick(...w.client(x, z, 0))?.kind === 'goal';
  }), all);
  expect(under.length).toBeGreaterThan(0);
  // (a tap there while it's the tree's: frame-locked, pick read at the tap)
  await tapAt(page, (w, [x, z]) => {
    const p = w.__world3d.client(x, z, 0);
    return w.__world3d.pick(p[0], p[1])?.kind === 'goal' ? p : null;
  }, [under[0].x, under[0].z] as const, { clear: null, message: 'the plot under the canopy' });
  // (two kinds held: the picker, whose pick plants it), the tree's popup shut
  await expect(page.locator('[data-farm-picker]')).toBeVisible();
  await expect(page.locator('.detail')).toHaveCount(0);
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual([{ o: 'plant', p: under[0].p, c: 'tomato', src: 'start' }]);
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトを 1かぶ うえた');
  // the canopy's top, no field under it: the tree's popup
  await tapAt(page, (w) => {
    const r = ['A', 'B'].map((t) => w.__world3d.box('goal', t)).find((r) => r && r.width > 0 && r.top > 0);
    return r && w.__world3d.pick(r.left + r.width / 2, r.top + 6)?.kind === 'goal' ? [r.left + r.width / 2, r.top + 6] : null;
  }, null, { clear: null, message: 'a canopy’s top' });
  await expect(page.locator('.detail')).toHaveCount(1);
});

test('a first tap on a growing plant names its crop (the names load first) and its time to ripe in hours and minutes', async ({ page }) => {
  await seed(page, D, [
    FIELD, ...POCKET.slice(0, 2), ['buy_starts', { crop: 'pumpkin', n: 1, v: 14 }, 'A'],
    // ripe at 11:30; watered already: the tap's a word, not the can
    ['farm', { ops: plants([plot(0).p], 'pumpkin') }, 'A', '05:30'],
    ['farm', { ops: water([plot(0).p]) }, 'A', '05:40']
  ]);
  await catchPops(page);
  await at6(page);
  await page.goto(SIX);
  await islandUp(page);
  await quiet(page);
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect.poll(() => pops(page)).toEqual(['カボチャ・あと 5じかん 30ぷん・みずやり ずみ']);
  expect((await pops(page)).join()).not.toMatch(/beach\.name\./);
});

test('anyone’s tap harvests: うめ takes the ripe plants of its 3 × 3 with one pop and a sparkle each; the next tap’s count joins the same plate', async ({ page }) => {
  // WIDE's six plots ripe tomatoes (ウェイ's planting), none watered: 1 each
  const at = wide;
  const six = [0, 1, 2].flatMap((i) => [at(i), at(i, 1)]);
  await seed(page, D, [WIDE, ['farm', { ops: plants(six.map((t) => t.p)) }, 'A', '05:30']]);
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await at6(page);
  await page.goto(`${SIX}&as=B`);
  await islandUp(page);
  await page.clock.fastForward('06:00:00');
  await quiet(page);
  const sparkles = () => page.evaluate(() => (window as unknown as { __fx3: { log(): { kind: string; size?: number }[] } }).__fx3.log().filter((e) => e.kind === 'sparkle' && e.size === 0.6).length);
  // the corner's 3 × 3: four plants, one tap
  await tapWorld(page, at(0).x, at(0).z);
  await expect.poll(sparkles).toBe(4);
  await expect.poll(async () => (await farmRows(page)).length).toBe(4);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', 'トマトを しゅうかく！ ×4・72かいがら');
  // the far column's two, by a tap on a plant just picked (a run across the field, never the can), the same plate
  // counting on
  await tapWorld(page, at(1).x, at(1).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', 'トマトを しゅうかく！ ×6・108かいがら');
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(1);
  await expect.poll(sparkles).toBe(6);
  await expect.poll(async () => (await farmRows(page)).map((o) => `${o.o} ${o.p} ${o.n}`).sort()).toEqual(six.map((t) => `harvest ${t.p} 1`).sort());
  const cues = await page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
  expect(cues.filter((c) => c === 'scene-harvest')).toHaveLength(2);
  expect(cues).not.toContain('scene-catch');
});

test('a plant is drawn anew at its next stage by one timer: stage 0, then 1 a third of the way', async ({ page }) => {
  // planted 05:58: stage 1 from 07:58
  await seed(page, D, [FIELD, ['farm', { ops: plants([plot(0).p]) }, 'A', '05:58']]);
  await at6(page);
  await page.goto(SIX);
  await islandUp(page);
  const model = () => page.evaluate((p) => (window as unknown as { __world3d: W3 }).__world3d.where(p)?.model ?? null, plot(0).p);
  await expect.poll(model).toBe('garden/crop-tomato-0');
  await page.clock.fastForward('01:50:00');
  await expect.poll(model).toBe('garden/crop-tomato-0');
  await page.clock.fastForward('00:10:00');
  await expect.poll(model).toBe('garden/crop-tomato-1');
});

test('the partner’s watering plays on my island at once: a drop over each plant, and they read watered before the sync', async ({ page }) => {
  await seed(page, D, [FIELD, ...POCKET, ['farm', { ops: plants([plot(0).p, plot(1).p]) }, 'A', '05:30']]);
  await catchPops(page);
  await at6(page);
  await page.goto(SIX);
  await islandUp(page);
  await quiet(page);
  const drops = () => page.evaluate(() => (window as unknown as { __fx3: { log(): { kind: string }[] } }).__fx3.log().filter((e) => e.kind === 'drops').length);
  expect(await drops()).toBe(0);
  // うめ's tap on the first plot, as the demo's relay brings it (sync/live-local.ts: another tab's BroadcastChannel), just
  // now: one `act`, her 3 × 3 watered here too
  await page.evaluate(([p, v]) => {
    const bc = new BroadcastChannel('island-demo-relay');
    bc.postMessage({ k: 'm', m: { v, kind: 'act', act: 'water', id: p, who: 'B', t: Date.now() } });
    setTimeout(() => bc.close(), 1000);
  }, [plot(0).p, LIVE_V] as const);
  await expect.poll(drops, { timeout: 5000 }).toBe(2);
  // watered: my tap is a word, and sends nothing (her ops are the record's)
  await tapWorld(page, plot(1).x, plot(1).z);
  await expect.poll(() => pops(page)).toEqual(['トマト・あと 5じかん 30ぷん・みずやり ずみ']);
  expect(await farmRows(page)).toEqual([]);
});

test('a growing plant’s word offers ほる to anyone (44 pt, at the word’s right end, deaf for 300 ms, held while touched); it digs, とりけす puts it back', async ({ page }) => {
  await seed(page, D, [
    FIELD, ...POCKET,
    // うめ's pumpkin (ripe at 11:40), watered: my tap's a word, not the can
    ['farm', { ops: plants([plot(0).p], 'pumpkin') }, 'B', '05:40'],
    ['farm', { ops: water([plot(0).p]) }, 'B', '05:45']
  ]);
  await at6(page);
  await page.goto(SIX);
  await islandUp(page);
  await quiet(page);
  await tapWorld(page, plot(0).x, plot(0).z);
  const dig = page.locator('[data-farm-dig]');
  await expect(dig).toBeVisible();
  await expect(page.locator('[data-farm-pop]')).toHaveText('カボチャ・あと 5じかん 40ぷん・みずやり ずみ');
  const [d, w] = [await dig.boundingBox(), await page.locator('[data-farm-pop]').boundingBox()];
  expect(Math.min(d!.width, d!.height)).toBeGreaterThanOrEqual(44);
  // inline at the word's right end, not over the plots behind it
  expect(d!.x).toBeGreaterThanOrEqual(w!.x + w!.width);
  expect(Math.abs(d!.y + d!.height / 2 - (w!.y + w!.height / 2))).toBeLessThan(2);
  // it takes taps 300 ms on (a quick second tap meant for the field goes through)
  await expect(dig).toHaveCSS('pointer-events', 'auto');
  const tag = page.locator('.farm-pop');
  if (SHOTS) {
    await expect.poll(() => tag.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await page.screenshot({ path: `${SHOTS}/dig-button.png` });
  }
  // a finger on it holds its clock
  await page.mouse.move(d!.x + d!.width / 2, d!.y + d!.height / 2);
  await page.mouse.down();
  await expect.poll(() => tag.evaluate((el) => el.getAnimations().map((a) => a.playState).join())).toBe('paused');
  await page.mouse.up();
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('カボチャを ほった');
  await expect(dig).toHaveCount(0);
  // とりけす (the world's undo: a world act's banner) puts it back (the one dig sent below is the second's)
  await page.getByRole('button', { name: 'とりけす' }).click();
  // left alone, it goes after 3 s
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(dig).toBeVisible();
  await expect(dig).toHaveCount(0, { timeout: 4000 });
  // ほる again, kept: the dig sent
  await tapWorld(page, plot(0).x, plot(0).z);
  await dig.click();
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual([{ o: 'dig', p: plot(0).p }]);
});

test('the shop’s 苗: anyone’s plants off every field (a field moved) back to starts in one row, with 取り消す', async ({ page }) => {
  await seed(page, D, [FIELD, ...POCKET, ['farm', { ops: plants(['fd:field-A.5.5']) }, 'A', '09:00'], ['farm', { ops: plants(['fd:field-A.6.5']) }, 'B', '09:10']]);
  await page.goto(`shop?demo&date=${D}T12:00`);
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="buy"]').click();
  const row = page.locator('[data-shop-orphans]');
  await expect(row).toHaveAttribute('data-shop-orphans', '2');
  await expect(row).toContainText('畑の外の株 2株');
  await row.scrollIntoViewIfNeeded();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/shop-orphans.png` });
  await page.locator('[data-shop-orphans-dig]').click();
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('2株を苗に戻しました');
  await expect(row).toHaveCount(0);
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual([{ o: 'dig', p: 'fd:field-A.5.5' }, { o: 'dig', p: 'fd:field-A.6.5' }]);
});
