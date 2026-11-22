// トレイル's 保存した場所 layer (docs/hiking.md "Saved places"), the logic tier: the saved places (GET /places routed to
// invented ones, e2e/places.ts) within 2 km of the trail's track drawn on its map (the stub's squares), nearest first;
// the legend's 保存した場所 half toggles them, on by default, kept on this phone over a reload; a square's tap: the
// floating card (name, category, the hours line, ルート, ✕). Every trail's track is the invented fixture (tiny.gpx).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { BASE, islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { shot } from './shots.ts';
import { routePlaces } from './places.ts';
import { KEY_OF } from './relay.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';
import type { Place } from '../src/lib/contract/places.ts';

test.use({ viewport: { width: 393, height: 852 } });
const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
const sheet = (p: Page) => p.locator('dialog[open] [data-hiking]');
const howOf = (project: string) => (project.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';

const NOW_S = Date.parse('2026-11-04T12:00:00+09:00') / 1000;
const near = (id: string, name: string, lat: number, lng: number, o: Partial<Place> = {}): Place => ({
  id, name, lat, lng, addr: '神奈川県足柄下郡箱根町1', cat: '温泉', sub: '温泉', added: NOW_S - 9 * 86_400, hours: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ d, o: 600, c: 1200 })), tz: 'Asia/Tokyo', web: '', note: '', by: 0, ...o
});
// the track runs 35.000–35.010 N about 139.000 E
const PLACES = [
  near('1', 'てすと温泉', 35.003, 139.001),
  near('2', 'ためし茶屋', 35.012, 139.012, { cat: 'カフェ', sub: '喫茶店', hours: null }),
  near('3', '遠くの店', 35.1, 139.1, { cat: '麺', sub: 'ラーメン' })
];

async function openKinpu(page: Page) {
  await page.addInitScript((key) => (localStorage.setItem('e2e.render', 'none'), localStorage.setItem('island.key', key)), KEY_OF.A);
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  await routePlaces(page, PLACES);
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
  await islandUp(page);
  await fromMenu(page, 'hiking');
  await sheet(page).locator('[data-trail="kinpu-odarumi"]').click();
  const view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(view.locator('[data-elev]')).toBeVisible();
  return view;
}

test('saved places within 2 km of the track: the legend’s toggle (kept on this phone), a square’s floating card', async ({ page }, info) => {
  const how = howOf(info.project.name);
  let view = await openKinpu(page);
  const map = () => view.locator('[data-trail-map]');
  const toggle = () => view.locator('[data-places-toggle]');
  await expect(map()).toHaveAttribute('data-places', '2');
  await expect(view.locator('.legend')).toHaveText(/^このルート\s*保存した場所$/);
  await expect(toggle()).toHaveAttribute('aria-pressed', 'true');
  // a square: its card (the nearest first), ✕
  await view.locator('[data-trail-place="1"]')[how]();
  const card = view.locator('[data-trail-place-card="1"]');
  await expect(card.locator('.nm')).toHaveText('てすと温泉');
  await expect(card.locator('.ct')).toHaveText('温泉');
  await expect(card.locator('[data-hours]')).toHaveText('営業中 · 20:00まで');
  await expect(card.locator('[data-place-route]')).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=35.003,139.001');
  await shot(page, 'shot-trail-stub');
  await card.getByRole('button', { name: '閉じる' })[how]();
  await expect(card).toHaveCount(0);
  await view.locator('[data-trail-place="2"]')[how]();
  await expect(view.locator('[data-trail-place-card="2"] [data-hours]')).toHaveText('営業時間は不明');
  // off: gone (the card too), and still off after a reload
  await toggle()[how]();
  await expect(toggle()).toHaveAttribute('aria-pressed', 'false');
  await expect(map()).toHaveAttribute('data-places', '0');
  await expect(view.locator('[data-trail-place-card]')).toHaveCount(0);
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'hiking');
  await sheet(page).locator('[data-trail="kinpu-odarumi"]').click();
  view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(toggle()).toHaveAttribute('aria-pressed', 'false');
  await expect(map()).toHaveAttribute('data-places', '0');
  await toggle()[how]();
  await expect(map()).toHaveAttribute('data-places', '2');
});
