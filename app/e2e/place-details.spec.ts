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
  /** The shard's entry for まぼろし寺 edited (default the fixture's). */
  tera?: (d: Record<string, unknown>) => Record<string, unknown>;
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
    const sh = JSON.parse(fix('places/shard.json').toString());
    if (o.tera) sh.p['107'] = o.tera(sh.p['107']);
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sh) });
  });
  await page.route('**/places/img/c0.12345678.webp', (r) =>
    o.sheet === 'abort' ? r.abort('internetdisconnected') : r.fulfill({ status: 200, contentType: 'image/webp', body: o.sheet ?? fix('places/card-sheet.webp') }));
}
async function phone(page: Page, context: BrowserContext, ins = IPHONE, rows = fixturePlaces()) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await insets(page, ins);
  const rec = newRecord();
  await rec.pair(context, 'A');
  await routePlaces(page, rows);
}
/** The places page, まぼろし寺's card (id 107: the fixtures' shard has its detail; the relay's row has no hours). */
async function openTera(page: Page, how: Tap, name = 'まぼろし寺') {
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'places', how);
  await expect(view(page)).toBeVisible();
  await view(page).locator('[data-places-q]').fill('まぼろし');
  await view(page).locator('[data-place-row]').first()[how]();
  await expect(card(page).locator('h2')).toHaveText(name);
}
/** まぼろし寺 with a long name (two lines and more) and a long note: a card taller than the sheet, so it scrolls. */
const LONG = 'まぼろし寺 東京別院 本堂・宝物殿・庭園・茶室・山門・鐘楼・五重塔・参道の茶屋';
const longRows = () => fixturePlaces().map((p) => (p.id === '107' ? { ...p, name: LONG, note: Array.from({ length: 24 }, (_, i) => `メモ ${i + 1}行目`).join('\n') } : p));
/** A finger on the card's scroller (touch events' types, as iOS sends them: sheet.pull reads these), moves in px. */
/** The guard over a card as tall as the full sheet (the low 'card' state at the full height): the map's ＋/− under it
 *  (track C deletes them: then this allows nothing). */
const TALL = { only: ['hit', 'clip', 'covered', 'layers', 'safe', 'target'] as const, allow: [{ check: ['hit', 'target'] as ('hit' | 'target')[], sel: '.zoom .disc', other: '.sheet', why: 'the map’s ＋/− under a card the full sheet’s height' }] };
const pull = (page: Page, steps: number[]) => view(page).locator('.card-wrap').evaluate((el, steps) => {
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + 160;
  const fire = (type: string, dy: number) => {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ identifier: 1, target: el, clientX: x, clientY: y + dy }] });
    el.dispatchEvent(e);
  };
  fire('touchstart', 0);
  for (const dy of steps) fire('touchmove', dy);
  fire('touchend', steps.at(-1) ?? 0);
}, steps);

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

    // The user's ask (2026-11-24): the head (‹, the name, ⋯) pinned at the top of the card's scroller, the rest scrolling
    // under it; its line only once scrolled; a long name two lines at most.
    test('a long card scrolls under its pinned head (its line once scrolled); ‹ still goes back', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      await phone(page, context, ins, longRows());
      await routeVendored(page);
      await openTera(page, how, LONG);
      const c = card(page), head = c.locator('.head'), wrap = view(page).locator('.card-wrap');
      await expect(c.locator('[data-place-photos] .cell')).toHaveCount(2);
      await settle(page);
      const name = (await c.locator('h2').boundingBox())!;
      expect(name.height).toBeLessThan(2 * 15 * 1.3 + 2); // two lines, the rest an ellipsis
      expect(await wrap.evaluate((e) => e.scrollHeight - e.clientHeight)).toBeGreaterThan(200);
      await expect(head).not.toHaveAttribute('data-scrolled');
      await shot(page, `P-card-rest-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins, ...TALL, only: [...TALL.only] });
      await wrap.evaluate((e) => e.scrollTo(0, 300));
      await expect(head).toHaveAttribute('data-scrolled');
      await settle(page);
      const [hb, wb] = [(await head.boundingBox())!, (await wrap.boundingBox())!];
      expect(Math.abs(hb.y - wb.y)).toBeLessThan(1);
      await expect(c.locator('[data-place-photos]')).not.toBeInViewport({ ratio: 0.9 });
      await shot(page, `P-card-scrolled-${info.project.name}-${h}`);
      await noOverlaps(page, { insets: ins, ...TALL, only: [...TALL.only] });
      // the bottom: 経路 and 保存日 clear of the head, the head still on top
      await wrap.evaluate((e) => e.scrollTo(0, e.scrollHeight));
      await expect(c.locator('[data-place-route]')).toBeInViewport();
      expect(Math.abs((await head.boundingBox())!.y - wb.y)).toBeLessThan(1);
      await c.locator('[data-place-back]')[how]();
      await expect(card(page)).toHaveCount(0);
      await expect(view(page)).toHaveAttribute('data-level', 'list');
    });

    test('the full card pulled down from its top folds the sheet; scrolled, a pull is the card’s', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      await phone(page, context, ins, longRows());
      await routeVendored(page);
      await openTera(page, how, LONG);
      await view(page).locator('[data-sheet-grip]')[how]();
      await expect(view(page)).toHaveAttribute('data-sheet', 'full');
      const wrap = view(page).locator('.card-wrap');
      await wrap.evaluate((e) => (e.scrollTop = 200));
      await pull(page, [20, 60, 120]);
      await expect(view(page)).toHaveAttribute('data-sheet', 'full');
      await wrap.evaluate((e) => (e.scrollTop = 0));
      await pull(page, [20, 60, 120]);
      await expect(view(page)).toHaveAttribute('data-sheet', 'card');
      await expect(card(page).locator('h2')).toHaveText(LONG);
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

  // Was track E's E3 (the details landing after the card settled grew it, the title jumping up): the band's box and
  // the line about it (two lines) held while the detail's out; photos without a line keep its room at the card's foot.
  // (a one-line one too: CI's fonts wrap the fixture's in one, the iPhone's in two)
  type Tera = (d: Record<string, unknown>) => Record<string, unknown>;
  const DESCS: [string, Tera | undefined][] = [['', undefined], [' (no line about it)', ({ desc: _d, ...d }) => d], [' (a one-line one)', (d) => ({ ...d, desc: '静かな寺。' })]];
  for (const [what, tera] of DESCS) {
    test(`the title stays put when the details arrive${what}`, async ({ page, context }, info) => {
      const g = gate();
      await phone(page, context);
      await routeVendored(page, { holdShard: g.shut, tera });
      await openTera(page, howOf(info.project.name));
      const t = card(page).locator('h2');
      await settle(page);
      const y0 = (await t.boundingBox())!.y;
      g.open();
      await expect(card(page).locator('[data-place-photos]')).toBeVisible();
      await settle(page);
      expect(Math.abs((await t.boundingBox())!.y - y0)).toBeLessThan(2);
    });
  }

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
