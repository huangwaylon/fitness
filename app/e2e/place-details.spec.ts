// The place card's vendored details (PlaceCard, PlacePhotos, lib/places/vendored.ts), map review 2's track E: the card's
// text from the list's own data before any vendored file lands, a sheet that fails, the card with its band under the
// overlap guard at both iPhone heights; and the bugs found, as test.fixme for the card's owner to fix and un-fixme.
// Invented places only (e2e/places.ts), every vendored file route-fulfilled (fixtures/places, place-details), the
// network held by gates, never a wall-clock wait.
import { expect, test, type BrowserContext, type Page, type Route } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { fixturePlaces, routePlaces } from './places.ts';
import { IPHONE, SAFARI_BAR, insets, noOverlaps, settle } from './overlap.ts';
import { shot } from './shots.ts';
import { readFileSync } from 'node:fs';

type Tap = 'tap' | 'click';
const howOf = (project: string): Tap => (project.startsWith('webkit') ? 'tap' : 'click');
const view = (p: Page) => p.locator('dialog[open] [data-places]');
const card = (p: Page) => view(p).locator('[data-place-card]');
const fix = (f: string) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url));

/** A gate: a route's answer held till open(). */
function gate() {
  let open!: () => void;
  const shut = new Promise<void>((ok) => (open = ok));
  return { open, shut };
}
interface Vend {
  /** The index's answer (default the fixture's); 'abort' fails it as offline would. */
  index?: (n: number) => 'ok' | 'abort';
  sheet?: Buffer | 'abort';
  hold?: Promise<void>;
  holdShard?: Promise<void>;
}
async function routeVendored(page: Page, o: Vend = {}) {
  let n = 0;
  await page.route('**/places/index.json', async (r: Route) => {
    const k = o.index?.(n++) ?? 'ok';
    await o.hold;
    return k === 'abort' ? r.abort('internetdisconnected') : r.fulfill({ status: 200, contentType: 'application/json', body: fix('places/index.json') });
  });
  await page.route('**/places/d/0.0123abcd.json', async (r) => {
    await o.holdShard;
    return r.fulfill({ status: 200, contentType: 'application/json', body: fix('places/shard.json') });
  });
  await page.route('**/places/img/c0.12345678.webp', (r) =>
    o.sheet === 'abort' ? r.abort('internetdisconnected') : r.fulfill({ status: 200, contentType: 'image/webp', body: o.sheet ?? fix('places/card-sheet.webp') }));
}
async function phone(page: Page, context: BrowserContext, ins = IPHONE) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await insets(page, ins);
  const rec = newRecord();
  await rec.pair(context, 'A');
  await routePlaces(page, fixturePlaces());
}
/** The places page, まぼろし寺's card (id 107: the fixtures' shard has its detail; the relay's row has no hours). */
async function openTera(page: Page, how: Tap) {
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'places', how);
  await expect(view(page)).toBeVisible();
  await view(page).locator('[data-places-q]').fill('まぼろし');
  await view(page).locator('[data-place-row]').first()[how]();
  await expect(card(page).locator('h2')).toHaveText('まぼろし寺');
}

for (const [h, ins] of [[852, IPHONE], [659, SAFARI_BAR]] as const) {
  test.describe(`393×${h}`, () => {
    test.use({ viewport: { width: 393, height: h } });

    test('the card’s text from the list’s data while the vendored index is still out; then the band', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      const g = gate();
      await phone(page, context, ins);
      await routeVendored(page, { hold: g.shut });
      await openTera(page, how);
      const c = card(page);
      await expect(c.locator('.sub')).toContainText('寺社');
      await expect(c.locator('[data-hours]')).toHaveText('営業時間は不明');
      await expect(c.locator('[data-place-route]')).toBeVisible();
      await expect(c.locator('[data-place-photos]')).toHaveCount(0);
      g.open();
      await expect(c.locator('[data-place-photos] .cell')).toHaveCount(2);
      await expect(c.locator('[data-hours]')).toHaveText('営業中 · 21:30まで');
    });

    const full = async (page: Page, context: BrowserContext, how: Tap) => {
      await phone(page, context, ins);
      await routeVendored(page);
      await openTera(page, how);
      await expect(card(page).locator('[data-place-photos] .cell')).toHaveCount(2);
      await expect(card(page).locator('[data-place-desc]')).toBeVisible();
      await settle(page);
    };
    test('the card with its photos, rating and line: no overlaps (the targets aside: below)', async ({ page, context }, info) => {
      await full(page, context, howOf(info.project.name));
      await shot(page, `E-card-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins, only: ['hit', 'clip', 'covered', 'layers', 'safe'] });
    });

    // BUG (track E, peer.md E5): 「写真: Googleマップ」 is a link 112×17 px (the guard's hit 45×20), right under the
    // band, where a swipe through the photos ends: a 17 px target. Fix: the app's hit44 on it (HoursLine's), or plain
    // text (the card's Googleマップ button is the same link).
    test('the card with its photos: every target 44 px', async ({ page, context }, info) => {
      await full(page, context, howOf(info.project.name));
      await noOverlaps(page, { insets: ins, only: ['target'] });
    });
  });
}

test.describe('393×852', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('a sheet that fails: the paper placeholders, no dots, the credit stays', async ({ page, context }, info) => {
    await phone(page, context);
    await routeVendored(page, { sheet: 'abort' });
    await openTera(page, howOf(info.project.name));
    const c = card(page);
    await expect(c.locator('[data-place-photos] .cell.miss')).toHaveCount(2);
    await expect(c.locator('[data-photo-dots]')).toHaveCount(0);
    await expect(c.locator('[data-place-photos] .cred')).toHaveText('写真：Googleマップ');
  });

  // Was track E's E2 (a short sheet stretched 4× tall): fixed as background-size width-scaled, height auto —
  // the sheet's own aspect, a short one never stretched. The fixture a one-row 1200×338 sheet.
  test('a short last sheet (one row, 1200×338): its cell drawn at the sheet’s own ratio', async ({ page, context }, info) => {
    await phone(page, context);
    await routeVendored(page, { sheet: fix('place-details/partial-sheet.webp') });
    await openTera(page, howOf(info.project.name));
    const cell = card(page).locator('[data-place-photos] .cell').first();
    await expect(card(page).locator('[data-place-photos] img.probe')).toHaveJSProperty('complete', true);
    const [w, hh] = (await cell.evaluate((e) => getComputedStyle(e).backgroundSize)).split(' ');
    expect(hh).toBe('auto'); // the sheet's own aspect: a short sheet never stretches (was 4× tall)
    expect(parseFloat(w)).toBeCloseTo((1200 * (150 * (600 / 338))) / 600, 1);
  });

  // BUG (track E, peer.md E3): the details land after the card has opened and settled (two serial fetches: index.json,
  // then the shard; at 400 ms RTT / 400 kbps about 1.8 s), and the 150 px band, the rating and the line about it come in
  // above the hours: the card grows ~240 px and the sheet with it, the title jumping up under the reader's eye.
  // Fix: reserve the band (its paper placeholder) for an id the scraper vendors (a cid or an ftid: 99 % have photos),
  // and fetch index.json when the page opens and the shard on the row's pointerdown, not on the card's mount.
  test('the title stays put when the details arrive', async ({ page, context }, info) => {
    const g = gate();
    await phone(page, context);
    await routeVendored(page, { holdShard: g.shut });
    await openTera(page, howOf(info.project.name));
    const t = card(page).locator('h2');
    await settle(page);
    const y0 = (await t.boundingBox())!.y;
    g.open();
    await expect(card(page).locator('[data-place-photos]')).toBeVisible();
    await settle(page);
    expect(Math.abs((await t.boundingBox())!.y - y0)).toBeLessThan(2);
  });

  // BUG (track E, peer.md E4): vendored.ts loadVendoredIndex memoises a failed index for the whole session ("a retry is
  // the next page load's"), and a shard's failure likewise: one card opened in a tunnel, before the index was ever
  // cached, and the home-screen app (open for days) shows no photos, hours or rating on any card till it's killed.
  // Fix: memoise only a good index (and a good shard); a failure forgets its promise (a retry on the next card's open).
  test('an index that failed once (offline) is asked again on the next card', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await phone(page, context);
    await routeVendored(page, { index: (n) => (n === 0 ? 'abort' : 'ok') });
    const failed = page.waitForEvent('requestfailed', (r) => r.url().endsWith('/places/index.json'));
    await openTera(page, how);
    await failed;
    await card(page).locator('[data-nav="back"], button').first()[how]();
    await expect(card(page)).toHaveCount(0);
    await view(page).locator('[data-place-row]').first()[how]();
    await expect(card(page).locator('[data-place-rating]')).toHaveText('★ 4.3 · 512件');
  });
});
