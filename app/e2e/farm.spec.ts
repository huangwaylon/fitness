// The fields (docs/farming.md): starts in my pocket, planted on my field by a tap on it (its 3 × 3; the picker with two
// kinds or more); three days on the plant is ripe and a tap harvests it, three for one watered on the two days before;
// the vegetables sell at the shop; the partner sees my plants and waters them, never harvests them; ほる over my own
// plant's word digs it up; the shop's 苗 sends plants off every field back to starts. On `?demo`: the
// demo's events in localStorage (a field put down in the editor, a catch sold, the starts bought, as their writes have
// them). The plots are tapped by their world points (a field's tile middles: layout/grid.ts tileMid).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, quiet, tapAt, tapWorld } from './island.ts';
import { LIVE_V } from '../src/lib/contract/live-protocol.ts';

test.use({ viewport: { width: 393, height: 852 } });
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G'];
/** The demo's events of a day (as the writes keep them). */
const seed = (page: Page, day: string, events: Seed[]) =>
  page.addInitScript(([day, list]) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse(`${day}T09:00:00+09:00`);
    const rows = list.map(([type, data, person], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [day, events] as const);
/** ウェイ's field: 2 × 2 on まえ's lawn east of the path (tiles 10–11 × 17–18: nothing in front of it on screen, うめ at
 *  her spot, a goal tree's canopy, a flower's tap area). */
const FIELD: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 17, f: 0, s: 'a-2x2' }, 'A'];
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

/** A 3 × 2 field of mine a tile west of FIELD's (tiles 9–11 × 17–18) and its plots. */
const WIDE: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 9, z: 17, f: 0, s: 'a-3x2' }, 'A'];
const wide = (i: number, j = 0) => ({ ...plot(i - 1, j), p: `fd:field-A.${i}.${j}` });
const plants = (ps: string[], c = 'tomato') => ps.map((p) => ({ o: 'plant', p, c, src: 'start' }));
const swings = (page: Page) => page.evaluate(() => (window as unknown as { __fx3: { log(): { kind: string }[] } }).__fx3.log().filter((e) => e.kind === 'swing').length);

test('starts bought at the shop’s かう; one kind held: a tap on my empty plot plants its 3 × 3 at once, the tapped one first, the pop counting against the cap; none left, a word; no はたけ button', async ({ page, context }) => {
  await seed(page, D, [FIELD, ...POCKET.slice(0, 2)]);
  // three tomato starts from かう's 苗 (3 × 14), by the list's own name, kanji
  await page.goto(`shop?demo&date=${D}T12:00`);
  await expect(page.locator('[data-shop]')).toHaveAttribute('data-shells', '200');
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="buy"]').click();
  await expect(page.locator('[data-shop-start="tomato"] .nm')).toHaveText('トマトの苗');
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
  // one kind held: no picker; its 3 × 3's empty plots of mine, the tapped one, then the nearest, as many as I hold
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(page.locator('[data-farm-picker]')).toHaveCount(0);
  await expect.poll(() => pops(page)).toEqual(['トマトを 3かぶ うえた（3/40）']);
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトの苗を3区画に植えました');
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual(plants([plot(0).p, plot(1).p, plot(0, 1).p]));
  // one swing of the shovel a tap
  expect(await swings(page)).toBe(1);
  // none left: the fourth plot says so (the plants beside it aren't watered by a tap on my empty plot)
  await tapWorld(page, plot(1, 1).x, plot(1, 1).z);
  await expect.poll(() => pops(page)).toEqual(['トマトを 3かぶ うえた（3/40）', 'なえが ない！ おみせで かえるよ']);
  await expect(page.locator('[data-farm-picker]')).toHaveCount(0);
  await expect(page.locator('[data-fx="say"]')).toHaveCount(0);
  expect(await farmRows(page)).toHaveLength(3);
  // うめ (no plot of hers) has no farm button either
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
  expect(await farmRows(page)).toEqual([]);
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect(picker).toHaveCount(0);
  // the second plot's 3 × 3 (its column and the middle one)
  await expect.poll(() => pops(page)).toEqual(['トマトを 4かぶ うえた（4/40）']);
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual(plants([wide(2).p, wide(1).p, wide(2, 1).p, wide(1, 1).p]));
  // the run's crop: the first plot now plants tomatoes without asking
  await tapWorld(page, wide(0).x, wide(0).z);
  await expect.poll(() => pops(page)).toEqual(['トマトを 4かぶ うえた（4/40）', 'トマトを 2かぶ うえた（6/40）']);
  await expect(picker).toHaveCount(0);
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toHaveLength(6);
  // the picker lights the last pick, first
  await expect.poll(() => page.evaluate(() => localStorage.getItem('island-demo.farm.seed'))).toBe('{"c":"tomato","src":"start"}');
});

test('a mixed 3 × 3: a tap on my empty plot harvests first, the next plants, a tap on a plant waters', async ({ page }) => {
  const D3 = '2026-11-07';
  await seed(page, D3, [
    WIDE, ...POCKET, ['buy_starts', { crop: 'tomato', n: 3, v: 42 }, 'A'],
    // ripe at the west corner; growing at the east back corner (ripe tomorrow: its watering counts)
    ['farm', { d: D, ops: plants([wide(0).p]) }, 'A'],
    ['farm', { d: '2026-11-05', ops: plants([wide(2, 1).p]) }, 'A']
  ]);
  await catchPops(page);
  await page.goto(`?demo&date=${D3}T12:00&weather=clear`);
  await islandUp(page);
  await quiet(page);
  // the middle (empty, mine): the ripe one first
  await tapWorld(page, wide(1).x, wide(1).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', /トマトを しゅうかく！ ×1/);
  // again: never the can; the harvest's tomato is a second kind (a vegetable plants too), so the picker, whose pick
  // plants my empty plots of its 3 × 3, the tapped one first, then the nearest
  await tapWorld(page, wide(1).x, wide(1).z);
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect.poll(() => pops(page)).toEqual(['トマトを 4かぶ うえた（6/40）']);
  // the 取り消す banner high while the harvest's plate stands at the bottom
  await expect.poll(async () => (await page.locator('.banner[role="status"]').boundingBox())!.y).toBeLessThan(300);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/plant-3x3-pop.png` });
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual([{ o: 'harvest', p: wide(0).p, n: 1 }, ...plants([wide(1).p, wide(2).p, wide(1, 1).p, wide(0, 1).p])]);
  // a plant: the can over its 3 × 3's dry ones (the new plants there and the growing one; the west one's out of reach)
  await tapWorld(page, wide(2, 1).x, wide(2, 1).z);
  await expect.poll(() => pops(page)).toEqual(['トマトを 4かぶ うえた（6/40）', 'みずやり']);
  const watered = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.world.A') ?? '{}').events as { kind: string; op?: string; id?: string }[]).filter((e) => e.kind === 'world' && e.op === 'watered').map((e) => e.id));
  expect(watered.sort()).toEqual([wide(1).p, wide(2).p, wide(1, 1).p, wide(2, 1).p].sort());
});

test('three days on: ripe, watered on the two days before it gives three, harvested by a tap a row off; sold at the shop for 54 かいがら; the partner waters, never harvests', async ({ page, context }) => {
  const D3 = '2026-11-07';
  await seed(page, D3, [
    FIELD, ...POCKET,
    ['farm', { d: D, ops: [{ o: 'plant', p: plot(0).p, c: 'tomato', src: 'start' }] }, 'A'],
    // the second a day later: ripe tomorrow
    ['farm', { d: '2026-11-05', ops: [{ o: 'plant', p: plot(1).p, c: 'tomato', src: 'start' }] }, 'A'],
    // うめ watered the first on the 5th and the 6th
    ['island', { date: '2026-11-05', taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'B'],
    ['island', { date: '2026-11-06', taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'B']
  ]);
  await page.goto(`?demo&date=${D3}T12:00`);
  await islandUp(page);
  await quiet(page);
  // a row's miss: a tap on my empty plot behind it harvests my ripe plant there (the growing one on the diagonal stays)
  await tapWorld(page, plot(0, 1).x, plot(0, 1).z);
  await expect(page.locator('[data-fx="catch"] .catch-plate')).toHaveAttribute('aria-label', /トマトを しゅうかく！ ×3・54かいがら/);
  await expect.poll(() => farmRows(page)).toEqual([{ o: 'harvest', p: plot(0).p, n: 3 }]);
  // the shop buys them: 3 × 18
  await page.goto(`shop?demo&date=${D3}T12:00`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  const before = Number(await page.locator('[data-shop]').getAttribute('data-shells'));
  await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
  await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
  await page.locator('[data-shop-tab="sell"]').click();
  const tomato = page.locator('[data-shop-catch="goods:tomato"]');
  await expect(tomato).toHaveAttribute('data-n', '3');
  for (let i = 0; i < 3; i++) await tomato.click();
  await page.locator('[data-shop-sell]').click();
  await expect.poll(async () => Number(await page.locator('[data-shop]').getAttribute('data-shells'))).toBe(before + 54);

  // うめ's phone (a clear sky: the seeded 11-07 rains): my plants are on her island; she waters the growing one, and
  // can't harvest mine
  const b = await context.newPage();
  await catchPops(b);
  await b.goto(`?demo&as=B&date=${D3}T12:00&weather=clear`);
  await islandUp(b);
  await quiet(b);
  await tapWorld(b, plot(1).x, plot(1).z);
  // watered now: a word, no harvest
  await tapWorld(b, plot(1).x, plot(1).z);
  await expect.poll(() => pops(b)).toEqual(['みずやり', expect.stringMatching(/の トマト・あと 1にち$/)]);
  // her tap watered both (the one growing back counts from its harvest day); never ほる on my plant
  await expect(b.locator('[data-farm-dig]')).toHaveCount(0);
  const watered = await b.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.world.B') ?? '{}').events as { kind: string; op?: string; id?: string }[]).filter((e) => e.kind === 'world' && e.op === 'watered').map((e) => e.id));
  expect(watered.sort()).toEqual([plot(0).p, plot(1).p].sort());
  expect((await farmRows(b)).filter((o) => o.o === 'harvest')).toHaveLength(1);
});

test('a plot under a goal tree’s canopy is the plot’s; the canopy off the field still opens its tree', async ({ page }) => {
  // ウェイ's 6 × 3 field beside うめ's goal tree (14, 10): its east plots lie under the tree's canopy on screen
  const beside: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 11, f: 0, s: 'a-6x3' }, 'A'];
  // a tomato and a carrot: two kinds, so the picker
  await seed(page, D, [beside, ...POCKET.slice(0, 2), ['buy_starts', { crop: 'tomato', n: 1, v: 14 }, 'A'], ['buy_starts', { crop: 'carrot', n: 1, v: 14 }, 'A']]);
  await catchPops(page);
  await page.goto(`?demo&date=${D}T12:00`);
  await islandUp(page);
  await quiet(page);
  const at = (i: number, j: number) => ({ p: `fd:field-A.${i}.${j}`, x: -90 + (10 + i) * 30 + 15, z: -90 + (11 + j) * 30 + 15 });
  const all = [0, 1, 2].flatMap((j) => [0, 1, 2, 3, 4, 5].map((i) => at(i, j)));
  const under = await page.evaluate((all) => all.filter(({ x, z }) => {
    const [cx, cy] = (window as unknown as { __world3d: { client(x: number, z: number, lift: number): [number, number] } }).__world3d.client(x, z, 0);
    return !!document.elementFromPoint(cx, cy)?.closest('.canopy');
  }), all);
  expect(under.length).toBeGreaterThan(0);
  const t = await tapWorld(page, under[0].x, under[0].z, { clear: null });
  expect(t.on).toBe('button.canopy');
  // (two kinds held: the picker, whose pick plants it), the tree's popup shut
  await expect(page.locator('[data-farm-picker]')).toBeVisible();
  await expect(page.locator('.canopy[aria-expanded="true"]')).toHaveCount(0);
  await page.locator('[data-farm-pick="start:tomato"]').click();
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual([{ o: 'plant', p: under[0].p, c: 'tomato', src: 'start' }]);
  await expect.poll(() => pops(page)).toEqual(['トマトを 1かぶ うえた（1/40）']);
  // the canopy's top, no field under it: the tree's popup
  const top = await tapAt(page, (w) => {
    const r = [...w.document.querySelectorAll('.canopy')].map((c: Element) => c.getBoundingClientRect()).find((r: DOMRect) => r.width > 0 && r.top > 0);
    return r ? [r.left + r.width / 2, r.top + 6] : null;
  }, null, { clear: null, message: 'a canopy’s top' });
  expect(top.on).toBe('button.canopy');
  await expect(page.locator('.canopy[aria-expanded="true"]')).toHaveCount(1);
});

test('a first tap on a growing plant names its crop, never a raw key (the names load first)', async ({ page }) => {
  const D1 = '2026-11-05';
  await seed(page, D1, [
    FIELD, ...POCKET.slice(0, 2), ['buy_starts', { crop: 'pumpkin', n: 1, v: 14 }, 'A'],
    ['farm', { d: D, ops: [{ o: 'plant', p: plot(0).p, c: 'pumpkin', src: 'start' }] }, 'A'],
    // watered today already: the tap's a word, not the can
    ['island', { date: D1, taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'A']
  ]);
  await catchPops(page);
  await page.goto(`?demo&date=${D1}T12:00&weather=clear`);
  await islandUp(page);
  await quiet(page);
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect.poll(() => pops(page)).toEqual([expect.stringMatching(/^カボチャ・あと \d+にち$/)]);
  expect((await pops(page)).join()).not.toMatch(/beach\.name\./);
});

test('a harvest tap takes my ripe plants of its 3 × 3 with one pop and a sparkle each; the next tap’s count joins the same plate', async ({ page }) => {
  const D3 = '2026-11-07';
  // WIDE's six plots ripe tomatoes, none watered: 1 each
  const at = wide;
  const six = [0, 1, 2].flatMap((i) => [at(i), at(i, 1)]);
  await seed(page, D3, [
    WIDE, ...POCKET.slice(0, 2), ['buy_starts', { crop: 'tomato', n: 6, v: 84 }, 'A'],
    ['farm', { d: D, ops: six.map((t) => ({ o: 'plant', p: t.p, c: 'tomato', src: 'start' })) }, 'A']
  ]);
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=${D3}T12:00&weather=clear`);
  await islandUp(page);
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

test('the partner’s watering of my plants plays on my island: drops over each, one heart; my tap there then says who', async ({ page }) => {
  const D1 = '2026-11-05';
  await seed(page, D1, [
    FIELD, ...POCKET,
    ['farm', { d: D, ops: [{ o: 'plant', p: plot(0).p, c: 'tomato', src: 'start' }, { o: 'plant', p: plot(1).p, c: 'tomato', src: 'start' }] }, 'A']
  ]);
  await catchPops(page);
  await page.goto(`?demo&date=${D1}T12:00&weather=clear`);
  await islandUp(page);
  await quiet(page);
  const fx = () => page.evaluate(() => (window as unknown as { __fx3: { log(): { kind: string }[] } }).__fx3.log().map((e) => e.kind).filter((k) => k === 'drops' || k === 'hearts').sort());
  expect(await fx()).toEqual([]);
  // うめ's phone waters both (one tap, its 3 × 3: one news a plot), as the demo's relay brings it (sync/live-local.ts:
  // another tab's BroadcastChannel; hers in front would hide this one, whose island then plays nothing), just now on
  // the island's clock
  await page.evaluate(([ids, v, t0]) => {
    const bc = new BroadcastChannel('island-demo-relay'), t = t0 + Date.now() - performance.timeOrigin;
    ids.forEach((id, i) => bc.postMessage({ k: 'm', m: { v, kind: 'world', op: 'watered', id, who: 'B', t: t + i } }));
    setTimeout(() => bc.close(), 1000);
  }, [[plot(0).p, plot(1).p], LIVE_V, Date.parse(`${D1}T12:00:00+09:00`)] as const);
  await expect.poll(fx, { timeout: 5000 }).toEqual(['drops', 'drops', 'hearts']);
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect.poll(() => pops(page)).toEqual([expect.stringMatching(/が みずを やってくれた$/)]);
});

test('my growing plant’s word offers ほる (44 pt, over the word, held while touched); it digs, 取り消す puts it back', async ({ page }) => {
  const D1 = '2026-11-05';
  await seed(page, D1, [
    FIELD, ...POCKET,
    ['farm', { d: D, ops: plants([plot(0).p], 'pumpkin') }, 'A'],
    // watered today already: the tap's a word, not the can
    ['island', { date: D1, taken: [], puts: [], shakes: [], watered: [plot(0).p], wishes: {} }, 'A']
  ]);
  await page.goto(`?demo&date=${D1}T12:00&weather=clear`);
  await islandUp(page);
  await quiet(page);
  await tapWorld(page, plot(0).x, plot(0).z);
  const dig = page.locator('[data-farm-dig]');
  await expect(dig).toBeVisible();
  await expect(page.locator('[data-farm-pop]')).toHaveText(/^カボチャ・あと \d+にち$/);
  const [d, w] = [await dig.boundingBox(), await page.locator('[data-farm-pop]').boundingBox()];
  expect(Math.min(d!.width, d!.height)).toBeGreaterThanOrEqual(44);
  // raised clear of the word (and the plot under it)
  expect(d!.y + d!.height).toBeLessThan(w!.y);
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
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('カボチャを掘り起こしました');
  await expect(dig).toHaveCount(0);
  // 取り消す puts it back (the one dig sent below is the second's)
  await page.getByRole('button', { name: '取り消す' }).click();
  // left alone, it goes after 3 s
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(dig).toBeVisible();
  await expect(dig).toHaveCount(0, { timeout: 4000 });
  // ほる again, kept: the dig sent
  await tapWorld(page, plot(0).x, plot(0).z);
  await dig.click();
  await expect.poll(() => farmRows(page), { timeout: 10_000 }).toEqual([{ o: 'dig', p: plot(0).p }]);
});

test('the shop’s 苗: my plants off every field (a field moved) back to starts in one row, with 取り消す', async ({ page }) => {
  await seed(page, D, [FIELD, ...POCKET, ['farm', { d: D, ops: plants(['fd:field-A.5.5', 'fd:field-A.6.5']) }, 'A']]);
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
