// Map flows, end to end as a person on an iPhone does them (docs/places.md, docs/travel.md "Maps", docs/hiking.md):
// 保存した場所 drawn on a realistic-size invented list (e2e/placesBig.ts: 3,400 places, abroad, overnight and unknown
// hours, long names, emoji), the relay slow or out of reach; taps in WebKit at 393×852 and 393×659, clicks in Chromium.
// No network: the relay and the tiles route-fulfilled (e2e/places.ts, e2e/trips.ts fixtureTiles: the tiles round Motobu).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { shot } from './shots.ts';
import { routePlaces } from './places.ts';
import { bigPlaces } from './placesBig.ts';
import { fixtureTiles, mapsDrawn } from './trips.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE } from './island.ts';
import { KEY_OF } from './relay.ts';
import { openTrip } from './trips.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';

type Tap = 'tap' | 'click';
const howOf = (project: string): Tap => (project.startsWith('webkit') ? 'tap' : 'click');
const view = (p: Page) => p.locator('dialog[open] [data-places]');
const rows = (p: Page) => view(p).locator('[data-place-row]');
const field = (p: Page) => view(p).locator('[data-places-q]');
const meta = (p: Page) => view(p).locator('[data-places-meta]');
type St = { mode: string; settled: boolean; clusters: number; badges: number; z: number; features: number };
const st = (p: Page) => p.evaluate(() => (window as unknown as { __placesMap?: { state(): St } }).__placesMap?.state() ?? null);
const settled = (p: Page) => expect.poll(async () => ((s) => s?.mode === 'ready' && s.settled)(await st(p)), { timeout: 30_000 }).toBe(true);

/** A paired phone with the big list, the map drawn (the island not), a view kept about Motobu (the fixture tiles). */
async function phone(page: Page, context: BrowserContext, o: { who?: 'A' | 'G'; cam?: false | [number, number, number] } = {}) {
  await mapsDrawn(page);
  await fixtureTiles(page);
  if (o.cam !== false) await context.addInitScript(([x, y, z]) => localStorage.setItem('island.placesCam', JSON.stringify({ center: [x, y], zoom: z })), o.cam ?? [127.88, 26.66, 12]);
  await newRecord().pair(context, o.who ?? 'A');
  const relay = await routePlaces(page, bigPlaces(), { guest: o.who === 'G' });
  await page.goto('');
  await islandUp(page);
  return relay;
}

/** Requests to `url` held till the returned release (a slow network: what the page shows before the answer). */
async function hold(page: Page, url: string | RegExp): Promise<() => void> {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(url, async (r) => (await gate, r.fallback()));
  return release;
}
const PLACES_URL = /^https:\/\/island-fund-relay[^/]*\/places(\?|$)/;
const closeAll = async (page: Page) => {
  for (let k = 0; k < 4 && (await page.locator('dialog[open]').count()); k++) await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
};

test.describe('393×852', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test('a slow relay with a copy on the phone: the list, the count and the map from the copy at once, a row’s card before the answer; the answer merged quietly', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await phone(page, context);
    await fromMenu(page, 'places', how);
    await settled(page);
    await expect(meta(page)).toContainText('3,400件');
    // (the copy written: IndexedDB)
    await expect.poll(() => page.evaluate(() => new Promise<number>((res) => {
      const r = indexedDB.open('island-places');
      r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('places'); q.onsuccess = () => res(q.result ? 1 : 0); q.onerror = () => res(0); };
      r.onerror = () => res(0);
    }))).toBe(1);
    await closeAll(page);
    const release = await hold(page, PLACES_URL);
    await page.reload();
    await islandUp(page);
    await fromMenu(page, 'places', how);
    await expect(rows(page).first()).toBeVisible();
    await expect(meta(page)).toContainText('3,400件');
    await settled(page);
    await shot(page, `B-${info.project.name}-slow-copy`);
    await rows(page).first()[how]();
    await expect(view(page).locator('[data-place-card] h2')).toBeVisible();
    release();
    await view(page).locator('[data-place-card]').getByRole('button', { name: '戻る' })[how]();
    await expect(meta(page)).toContainText('3,400件');
  });

  test('a slow first run: the loading rows, ✕ still closes; opened again once the answer is in: the list', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await mapsDrawn(page);
    await fixtureTiles(page);
    // (a view kept: a fresh phone's first view is the next test's)
    await context.addInitScript(() => localStorage.setItem('island.placesCam', JSON.stringify({ center: [127.88, 26.66], zoom: 12 })));
    await newRecord().pair(context, 'A');
    await routePlaces(page, bigPlaces());
    const release = await hold(page, PLACES_URL);
    await page.goto('');
    await islandUp(page);
    await fromMenu(page, 'places', how);
    await expect(view(page).locator('[data-places-loading]')).toBeVisible();
    await shot(page, `B-${info.project.name}-slow-first`);
    await page.locator('dialog[open]').getByRole('button', { name: '閉じる' }).first()[how]();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    release();
    await fromMenu(page, 'places', how);
    await expect(rows(page).first()).toBeVisible();
    await expect(meta(page)).toContainText('3,400件');
  });

  test('a fresh phone, the list in while the sheet is open, places on every continent: the first view about them, not an empty sea', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await mapsDrawn(page);
    await fixtureTiles(page);
    await newRecord().pair(context, 'A');
    await routePlaces(page, bigPlaces());
    const release = await hold(page, PLACES_URL);
    await page.goto('');
    await islandUp(page);
    await fromMenu(page, 'places', how);
    await expect(view(page).locator('[data-places-loading]')).toBeVisible();
    release();
    await settled(page);
    // (the view kept a moment after the map stops: about the home, central Japan here, the most of the list in view)
    await expect.poll(async () => { const c = JSON.parse((await page.evaluate(() => localStorage.getItem('island.placesCam'))) ?? 'null') as { center: [number, number]; zoom: number } | null; return !!c && Math.abs(c.center[1] - 35.5) < 2.5 && Math.abs(c.center[0] - 138.5) < 3 && c.zoom >= 5; }).toBe(true);
    await shot(page, `B-${info.project.name}-fresh-world`);
    await expect(meta(page)).toHaveText(/^この範囲 1,\d{3} \/ 3,400件/);
  });

  test('the card before its vendored details: the name, the hours line and 経路 at once', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    const release = await hold(page, /\/places\/(index\.json|d\/|img\/)/);
    await phone(page, context);
    await fromMenu(page, 'places', how);
    await field(page)[how]();
    await field(page).pressSequentially('Sample');
    await rows(page).first()[how]();
    const c = view(page).locator('[data-place-card]');
    await expect(c.locator('h2')).toBeVisible();
    await expect(c.locator('[data-hours]')).toBeVisible();
    await expect(c.locator('[data-place-route]')).toHaveText('経路');
    await shot(page, `B-${info.project.name}-card-early`);
    release();
  });

  test('browse a big list, type a name, a row from the full list: the card, the map at z15 on it, the list kept behind ‹', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await phone(page, context);
    await fromMenu(page, 'places', how);
    await settled(page);
    await shot(page, `B-${info.project.name}-open`);
    await expect(meta(page)).toContainText('この範囲');
    await field(page)[how]();
    await field(page).pressSequentially('Dummy');
    await shot(page, `B-${info.project.name}-typed`);
    await field(page).blur();
    await rows(page).first()[how]();
    await expect(view(page).locator('[data-place-card]')).toBeVisible();
    await expect.poll(async () => ((s) => !!s && s.settled && s.z >= 15)(await st(page)), { timeout: 15_000 }).toBe(true);
    await shot(page, `B-${info.project.name}-card`);
    await view(page).locator('[data-place-card]').getByRole('button', { name: '戻る' })[how]();
    await expect(field(page)).toHaveValue('Dummy');
  });
});

/** Kana typed through an IME as WebKit sends it: compositionstart, each candidate an input while composing, then
 *  compositionend; `enter`: the Return that picks the candidate, a keydown after compositionend with isComposing false
 *  and keyCode 229 (Safari's order). */
async function ime(page: Page, steps: string[], enter = false) {
  await field(page).evaluate((el: HTMLInputElement, { steps, enter }) => {
    const base = el.value;
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    for (const s of steps) {
      el.value = base + s;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: s, inputType: 'insertCompositionText', isComposing: true }));
    }
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: steps.at(-1) }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: steps.at(-1), inputType: 'insertFromComposition', isComposing: false }));
    if (enter) {
      const k = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
      Object.defineProperty(k, 'keyCode', { value: 229 });
      el.dispatchEvent(k);
    }
  }, { steps, enter });
}

test.describe('IME', () => {
  test.use({ viewport: { width: 393, height: 852 } });
  test('kana through an IME: no chip mid-composition, the candidate’s Return keeps the field and the keyboard, a full-width space or Enter after takes it', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await phone(page, context);
    await fromMenu(page, 'places', how);
    await field(page)[how]();
    await expect(field(page)).toBeFocused();
    await field(page).evaluate((el) => el.addEventListener('blur', () => ((window as unknown as { __b: string }).__b = new Error().stack ?? '')));
    await ime(page, ['ら', 'らー', 'らーめ', 'らーめん', 'ラーメン'], true);
    console.log('BLUR', await page.evaluate(() => (window as unknown as { __b: string }).__b));
    // the Return picked the candidate: still typing (focused, the text the field's, no chip yet)
    await expect(field(page)).toBeFocused();
    await expect(field(page)).toHaveValue('ラーメン');
    await expect(view(page).locator('[data-qchip="cat:麺:ラーメン"]')).toHaveCount(0);
    await field(page).pressSequentially('　');
    await expect(view(page).locator('[data-qchip="cat:麺:ラーメン"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(field(page)).toHaveValue('');
    // an area through the IME, then Enter (a real one): 渋谷周辺, a search everywhere
    await ime(page, ['し', 'しぶ', 'しぶや', '渋谷'], true);
    await expect(field(page)).toHaveValue('渋谷');
    await field(page).press('Enter');
    await expect(view(page).locator('[data-qchip]')).toHaveText(['ラーメン', '渋谷周辺']);
    await expect(meta(page)).toHaveText(/^\d+ \/ 3,400件/);
    // Backspace mid-composition (the field's own) never takes a chip
    await field(page).focus();
    await field(page).evaluate((el: HTMLInputElement) => {
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      const k = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Backspace' });
      Object.defineProperty(k, 'keyCode', { value: 229 });
      el.dispatchEvent(k);
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' }));
    });
    await expect(view(page).locator('[data-qchip]')).toHaveText(['ラーメン', '渋谷周辺']);
  });
});

test.describe('location', () => {
  test.use({ viewport: { width: 393, height: 852 } });
  test('granted: the disc on, 近く the places within 1.5 km with their distance; moved (a train ride later): 近く follows the new spot', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 35.66, longitude: 139.7, accuracy: 20 });
    await phone(page, context);
    await fromMenu(page, 'places', how);
    await settled(page);
    const disc = view(page).locator('[data-locate]');
    await disc[how]();
    await expect(disc).toHaveAttribute('data-locate', 'on');
    await field(page)[how]();
    await field(page).pressSequentially('近く');
    await expect(view(page).locator('[data-qchip]')).toHaveText(['現在地周辺']);
    await expect(rows(page).first().locator('.sbt')).toHaveText(/ · \d+ m$|km$/);
    await expect(meta(page)).toHaveText(/^\d+ \/ 3,400件/);
    await shot(page, `B-${info.project.name}-near`);
    await context.setGeolocation({ latitude: 34.69, longitude: 135.5, accuracy: 20 });
    await expect(rows(page).first().locator('.sbt')).toContainText('大阪');
  });
});

test.describe('vendored warm-up', () => {
  test.use({ viewport: { width: 393, height: 852 } });
  test('the card’s details warmed after the list: never while the slow relay is answering, never offline; a row’s press asks its shard', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    const asked: string[] = [];
    const vfix = (f: string) => readFileSync(new URL(`./fixtures/places/${f}`, import.meta.url));
    await page.route('**/places/index.json', (r) => (asked.push('index'), r.fulfill({ contentType: 'application/json', body: vfix('index.json') })));
    await page.route('**/places/d/*.json', (r) => (asked.push('shard'), r.fulfill({ contentType: 'application/json', body: vfix('shard.json') })));
    await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
    await newRecord().pair(context, 'A');
    await routePlaces(page, bigPlaces(400));
    const release = await hold(page, PLACES_URL);
    await page.goto('');
    await islandUp(page);
    const warm = () => page.evaluate(() => (window as unknown as { __places?: { warm: string } }).__places?.warm ?? null);
    await fromMenu(page, 'places', how);
    // the first run: the list waits on the relay, nothing warmed meanwhile
    await expect(view(page).locator('[data-places-loading]')).toBeVisible();
    expect(await warm()).toBe('off');
    release();
    await expect(rows(page).first()).toBeVisible();
    await expect.poll(() => asked).toEqual(['index']);
    expect(await warm()).toBe('asked');
    // a row's press: its shard before the card asks
    const b = (await rows(page).first().boundingBox())!;
    await page.mouse.move(b.x + 40, b.y + b.height / 2);
    await page.mouse.down();
    await expect.poll(() => asked).toEqual(['index', 'shard']);
    await page.mouse.up();
    await expect(view(page).locator('[data-place-card]')).toBeVisible();
    // offline (a second page: the copy on the phone, the session's index not asked yet): the list, nothing warmed till
    // the phone is back online
    await closeAll(page);
    asked.length = 0;
    await page.close();
    const p2 = await context.newPage();
    // (offline as the app reads it, navigator.onLine and its events, from once the sheet's chunk is in (a phone has it
    // from the service worker; this page none), its first fetch held till then; the relay out of reach)
    await p2.addInitScript(() => {
      const w = window as unknown as { __off: boolean };
      w.__off = false;
      Object.defineProperty(Navigator.prototype, 'onLine', { get: () => !w.__off, configurable: true });
    });
    await p2.route('**/places/index.json', (r) => (asked.push('index'), r.fulfill({ contentType: 'application/json', body: vfix('index.json') })));
    const relay2 = await routePlaces(p2, bigPlaces(400), { down: true });
    const release2 = await hold(p2, PLACES_URL);
    await p2.goto('');
    await islandUp(p2);
    await fromMenu(p2, 'places', how);
    await expect(rows(p2).first()).toBeVisible();
    await p2.evaluate(() => (((window as unknown as { __off: boolean }).__off = true), dispatchEvent(new Event('offline'))));
    release2();
    await expect(meta(p2)).toContainText('オフライン');
    await expect(rows(p2).first()).toBeVisible();
    expect(await p2.evaluate(() => (window as unknown as { __places?: { warm: string } }).__places?.warm)).toBe('off');
    expect(asked).toEqual([]);
    relay2.down(false);
    await p2.evaluate(() => (((window as unknown as { __off: boolean }).__off = false), dispatchEvent(new Event('online'))));
    await expect.poll(() => asked).toEqual(['index']);
  });
});

test.describe('393×659', () => {
  test.use({ viewport: { width: 393, height: 659 } });
  test('the short phone: the peek shows the field, the chips, the count and rows; full, the card, the sort sheet; Esc backs out a level at a time', async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await phone(page, context, { cam: [139.7, 35.66, 13] }); // (Tokyo: the rows in view; no tiles there)
    await fromMenu(page, 'places', how);
    await settled(page);
    await expect(rows(page).first()).toBeInViewport();
    await shot(page, `B-${info.project.name}-659-peek`);
    await view(page).locator('[data-sort]')[how]();
    await shot(page, `B-${info.project.name}-659-sort`);
    await page.locator('dialog[open] [data-sort-pick="new"]')[how]();
    await page.locator('dialog[open] [data-places-filter-show]')[how]();
    await expect(view(page).locator('[data-sort]')).toHaveAttribute('data-sort', 'new');
    await field(page)[how]();
    await expect(view(page)).toHaveAttribute('data-sheet', 'full');
    await field(page).blur();
    await shot(page, `B-${info.project.name}-659-full`);
    await rows(page).first()[how]();
    await expect(view(page)).toHaveAttribute('data-level', 'card');
    await settled(page);
    await shot(page, `B-${info.project.name}-659-card`);
    await page.keyboard.press('Escape');
    await expect(view(page)).toHaveAttribute('data-level', 'list');
    await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });
});

test.describe('trip and trail maps', () => {
  test.use({ viewport: { width: 393, height: 852 } });
  const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
  // (three by Kinpu's invented track, 35.000–35.010 N about 139.000 E, among the 3,400)
  const LIST = [...bigPlaces(), ...[0, 1, 2].map((k) => ({ ...bigPlaces(1)[0], id: `77${k}`, name: `トレイル脇${k}`, lat: 35.002 + k * 0.003, lng: 139.001 }))];
  async function app(page: Page) {
    await page.addInitScript((key) => (localStorage.setItem('island.key', key), localStorage.setItem('e2e.render', 'none')), KEY_OF.A);
    await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
    await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
    await routePlaces(page, LIST);
    await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
    await islandUp(page);
  }
  const copied = (page: Page) => expect.poll(() => page.evaluate(() => new Promise<number>((res) => {
    const r = indexedDB.open('island-places');
    r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('places'); q.onsuccess = () => res(q.result ? 1 : 0); q.onerror = () => res(0); };
    r.onerror = () => res(0);
  }))).toBe(1);

  test('a slow relay: the trip’s and the trail’s squares from the copy before it answers; the one switch shared (off on the trip: off on the trail, kept over a reload)', async ({ page }, info) => {
    const how = howOf(info.project.name);
    await app(page);
    await openTrip(page, 'okinawa', 'map');
    const pane = page.locator('dialog[open] [data-map-pane]');
    await pane.locator('[data-map-day="2"]')[how]();
    const n = Number(await pane.locator('[data-travel-map]').getAttribute('data-places'));
    await expect.poll(async () => Number(await pane.locator('[data-travel-map]').getAttribute('data-places'))).toBeGreaterThan(0);
    await copied(page);
    // reloaded with the relay held: the squares at once
    const release = await hold(page, PLACES_URL);
    await page.reload();
    await islandUp(page);
    await openTrip(page, 'okinawa', 'map');
    await pane.locator('[data-map-day="2"]')[how]();
    await expect.poll(async () => Number(await pane.locator('[data-travel-map]').getAttribute('data-places'))).toBeGreaterThan(0);
    expect(n).toBeGreaterThanOrEqual(0);
    // the switch off here
    await pane.locator('[data-map-layers]')[how]();
    await pane.locator('[data-map-layer="places"]')[how]();
    await expect(pane.locator('[data-travel-map]')).toHaveAttribute('data-places', '0');
    await closeAll(page);
    // the trail: from the copy too, and off (the one switch)
    await fromMenu(page, 'hiking', how);
    const sheet = page.locator('dialog[open] [data-hiking]');
    await sheet.locator('[data-trail="kinpu-odarumi"]')[how]();
    const trail = sheet.locator('[data-trail-view="kinpu-odarumi"]');
    await expect(trail.locator('[data-elev]')).toBeVisible();
    await expect(trail.locator('[data-trail-map]')).toHaveAttribute('data-places', '0');
    await trail.locator('[data-map-layers]')[how]();
    await expect(trail.locator('[data-map-layer="places"]')).toHaveAttribute('aria-pressed', 'false');
    await trail.locator('[data-map-layer="places"]')[how]();
    await expect(trail.locator('[data-trail-map]')).toHaveAttribute('data-places', '3');
    release();
    // a square's card: the same words as the trip's (経路, 閉じる)
    await trail.locator('[data-map-layers]')[how]();
    await trail.locator('[data-map-place="770"]')[how]();
    const float = trail.locator('[data-place-float="770"]');
    await expect(float.locator('[data-place-route]')).toHaveText('経路');
    await expect(float.getByRole('button', { name: '閉じる' })).toBeVisible();
    await shot(page, `B-${info.project.name}-trail-float`);
  });
});
