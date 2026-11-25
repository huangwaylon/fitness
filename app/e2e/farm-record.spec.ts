// The field on a real record (docs/farming.md, e2e/record.ts: the relay's own code behind the phone's API): the phone
// shows the record's stored field, and an op the record refuses never loops. 2026-11-25 (the user: "I was able to
// plant, it was then removed automatically and I was told to try again, kept repeating"): a cache from before the field
// was served had its `since` past the field's last change, so no snapshot brought it; the phone showed every plot empty
// and planted on taken ones, the record refused each (`farm taken`) and the phone said 「あとでもう一度お試しください」.
// Both browsers (test-webkit rule: taps, the queue, the toast).
import { expect, test, type Page } from './fixtures.ts';
import { PINNED_DATE } from './fixtures.ts';
import { islandUp, quiet, tapWorld } from './island.ts';
import { newRecord } from './record.ts';

test.use({ viewport: { width: 393, height: 852 } });
const D = PINNED_DATE.slice(0, 10);
/** A 2 × 2 field on まえ's lawn east of the path (off the day's visitor's spot, whose figure takes a tap near it) and a
 *  plot's id and world point. */
const FIELD = { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 12, z: 14, f: 0, s: 'f-2x2' };
const plot = (i: number, j = 0) => ({ p: `fd:field-A.${i}.${j}`, x: -90 + (12 + i) * 30 + 15, z: -90 + (14 + j) * 30 + 15 });
const ALL = [plot(0), plot(1), plot(0, 1), plot(1, 1)].map((t) => t.p);
type Rec = ReturnType<typeof newRecord>;

/** The field, one pumpkin start in ウェイ's pocket, four tomato starts in うめ's. */
function setUp(rec: Rec) {
  expect(rec.event('A', 'decor', FIELD)).toMatchObject({ ok: true });
  for (const [who, crop, n] of [['A', 'pumpkin', 1], ['B', 'tomato', 4]] as const) {
    expect(rec.event(who, 'tally', { date: D, counts: { 'fish:koi': 1 } })).toMatchObject({ ok: true });
    expect(rec.event(who, 'sell', { species: 'fish:koi', n: 1, v: 200 })).toMatchObject({ ok: true });
    expect(rec.event(who, 'buy_starts', { crop, n, v: n * 14 })).toMatchObject({ ok: true });
  }
}
/** うめ plants every plot (her phone's farm event, straight to the record). */
const umePlants = (rec: Rec) => expect(rec.event('B', 'farm', { ops: ALL.map((p) => ({ o: 'plant', p, c: 'tomato', src: 'start' })) })).toMatchObject({ ok: true });
/** ウェイ's farm events as the record answered them: [ok, the ops' kinds]. */
const mine = (rec: Rec) => rec.sent.filter((s) => s.who === 'A' && s.type === 'farm').map((s) => [s.ok, (s.data.ops as { o: string }[]).map((o) => o.o).join()]);
/** What the phone keeps of the record (sync/cache.ts's `meta`): nothing, its rows, or its rows and the field. */
const kept = (page: Page) => page.evaluate(() => new Promise<'none' | 'rows' | 'field'>((ok) => {
  const q = indexedDB.open('island');
  q.onerror = () => ok('none');
  q.onsuccess = () => {
    const db = q.result;
    if (!db.objectStoreNames.contains('cache')) return (db.close(), ok('none'));
    const g = db.transaction('cache').objectStore('cache').get('meta');
    g.onsuccess = () => (db.close(), ok(!g.result ? 'none' : g.result.field ? 'field' : 'rows'));
    g.onerror = () => (db.close(), ok('none'));
  };
}));
const banner = (page: Page) => page.locator('.banner[role="status"] .txt');

test('a cache that never took the field (an older build’s) gets it: うめ’s plants show, a tap waters them, never a refused plant', async ({ page, context }) => {
  const rec = newRecord();
  setUp(rec);
  umePlants(rec);
  // the phone opens as an older build did: every reply's `field` unread, its `since` past the field's last change
  rec.tamper((_body, r) => {
    const { field: _f, ...rest } = r;
    return rest;
  });
  await rec.pair(context, 'A');
  await page.goto('');
  await islandUp(page);
  await expect.poll(() => kept(page), { timeout: 15_000 }).toBe('rows');
  // the new build: the field by the `seq` it holds (none), though nothing changed since
  rec.tamper(null);
  await page.reload();
  await islandUp(page);
  await quiet(page);
  await expect.poll(() => kept(page), { timeout: 15_000 }).toBe('field');
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect.poll(() => mine(rec), { timeout: 15_000 }).toEqual([[true, 'water,water,water,water']]);
});

test('a plot planted meanwhile: the record refuses my plant, the phone shows its field at once and says so, and the next tap waters it', async ({ page, context }) => {
  const rec = newRecord();
  setUp(rec);
  await rec.pair(context, 'A');
  // every banner's words as they come
  await page.addInitScript(() => {
    const seen: string[] = ((window as unknown as { __banners: string[] }).__banners = []);
    new MutationObserver(() => {
      const txt = document.querySelector('.banner[role="status"] .txt')?.textContent ?? '';
      if (txt && seen.at(-1) !== txt) seen.push(txt);
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  await page.goto('');
  await islandUp(page);
  await quiet(page);
  // うめ plants every plot; my phone hasn't heard (no poll yet)
  umePlants(rec);
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect(banner(page)).toHaveText('カボチャを 1かぶ うえた');
  // sent after its とりけす: refused `farm taken`; its ack carries the field: no "try again", the field's word
  await expect(banner(page)).toHaveText('はたけが かわってた！ いまの はたけを みてね', { timeout: 15_000 });
  expect(mine(rec)).toEqual([[false, 'plant']]);
  // the next tap acts on the record's field: うめ's plants watered (my start kept), never the plant again
  await tapWorld(page, plot(0).x, plot(0).z);
  await expect.poll(() => mine(rec), { timeout: 15_000 }).toEqual([[false, 'plant'], [true, 'water,water,water,water']]);
  // (never the generic 「あとでもう一度お試しください」)
  expect(await page.evaluate(() => (window as unknown as { __banners: string[] }).__banners)).toEqual(['カボチャを 1かぶ うえた', 'はたけが かわってた！ いまの はたけを みてね']);
});
