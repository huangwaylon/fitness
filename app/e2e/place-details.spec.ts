// The place card's Google details (PlaceCard, PlacePhotos: the row's det, the photos' links from GET /places/pics), map
// review 2's track E: the card's text and details at once, the band when the links land, a photo that fails, the card
// with its band under the overlap guard at both iPhone heights. Invented places only (e2e/places.ts), every request
// route-fulfilled, the network held by gates, never a wall-clock wait.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { CARD_DET, routePlaces, withCard } from './places.ts';
import type { Place } from '../src/lib/contract/places.ts';
import { IPHONE, SAFARI_BAR, insets, noOverlaps, settle } from './overlap.ts';
import { shot } from './shots.ts';

type Tap = 'tap' | 'click';
const howOf = (project: string): Tap => (project.startsWith('webkit') ? 'tap' : 'click');
const view = (p: Page) => p.locator('dialog[open] [data-places]');
const card = (p: Page) => view(p).locator('[data-place-card]');

/** A gate: a route's answer held till open(). */
function gate() {
  let open!: () => void;
  const shut = new Promise<void>((ok) => (open = ok));
  return { open, shut };
}
async function phone(page: Page, context: BrowserContext, ins = IPHONE, rows: Place[] = withCard(), o: Parameters<typeof routePlaces>[2] = {}) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await insets(page, ins);
  const rec = newRecord();
  await rec.pair(context, 'A');
  return routePlaces(page, rows, o);
}
/** The places page, まぼろし寺's card (id 107: places.ts CARD_DET, two photos). */
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
const longRows = () => withCard().map((p) => (p.id === '107' ? { ...p, name: LONG, note: Array.from({ length: 24 }, (_, i) => `メモ ${i + 1}行目`).join('\n') } : p));
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

    test('the card’s text and details at once; the band when the photos’ links land', async ({ page, context }, info) => {
      const how = howOf(info.project.name);
      const g = gate();
      await phone(page, context, ins, withCard(), { holdPics: g.shut });
      await openTera(page, how);
      const c = card(page);
      await expect(c.locator('.sub')).toContainText('寺社');
      await expect(c.locator('[data-hours]')).toHaveText('営業中 · 21:30まで');
      await expect(c.locator('[data-place-desc]')).toContainText('浅草の静かな寺');
      await expect(c.locator('[data-place-route]')).toBeVisible();
      await expect(c.locator('[data-place-photos]')).toHaveCount(0);
      await expect(c.locator('.band-hold')).toBeVisible();
      g.open();
      await expect(c.locator('[data-place-photos] img.cell')).toHaveCount(2);
    });

    const full = async (page: Page, context: BrowserContext, how: Tap) => {
      await phone(page, context, ins);
      await openTera(page, how);
      await expect(card(page).locator('[data-place-photos] img.cell')).toHaveCount(2);
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
      await openTera(page, how, LONG);
      const c = card(page), head = c.locator('.head'), wrap = view(page).locator('.card-wrap');
      await expect(c.locator('[data-place-photos] img.cell')).toHaveCount(2);
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

  test('a photo that fails: the paper placeholders, no dots, the credit stays', async ({ page, context }, info) => {
    await phone(page, context, IPHONE, withCard(), { pics: 'abort' });
    await openTera(page, howOf(info.project.name));
    const c = card(page);
    await expect(c.locator('[data-place-photos] .cell.miss')).toHaveCount(2);
    await expect(c.locator('[data-photo-dots]')).toHaveCount(0);
    await expect(c.locator('[data-place-photos] .cred')).toHaveText('写真：Googleマップ');
  });

  // Was track E's E3 (the details landing after the card settled grew it, the title jumping up): the band's box held
  // while the photos' links are out.
  for (const [what, det] of [['', CARD_DET], [' (no line about it)', { ...CARD_DET, desc: undefined }]] as const) {
    test(`the title stays put when the photos arrive${what}`, async ({ page, context }, info) => {
      const g = gate();
      await phone(page, context, IPHONE, withCard(det), { holdPics: g.shut });
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

  test('photo links that failed once (offline) are asked again on the next card', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    const relay = await phone(page, context, IPHONE, withCard(), { picsFail: (n) => n === 0 });
    const failed = page.waitForEvent('requestfailed', (r) => r.url().includes('/places/pics'));
    await openTera(page, how);
    await failed;
    await expect(card(page).locator('[data-place-photos]')).toHaveCount(0);
    await card(page).locator('[data-place-back]')[how]();
    await expect(card(page)).toHaveCount(0);
    await view(page).locator('[data-place-row]').first()[how]();
    await expect(card(page).locator('[data-place-photos] img.cell')).toHaveCount(2);
    expect(relay.pics.length).toBeGreaterThanOrEqual(2);
  });
});
