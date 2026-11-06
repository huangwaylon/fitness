// The classic guides (components/travel/classic, docs/travel.md "Classic guides"): Okinawa and Seattle as the old
// travel-plans site showed them, in the trips' sheet on the demo. Okinawa: its four tabs (日程 地図 キャンプ場 持ち物),
// its days open as the site had them, a logistics card, the map card (the trip map's stub in the logic tier: the
// day chips, 全3日間, a camp pin's card in the guide's own sheet, Esc closing only it), the campsites' one-criterion
// filter and a card, the packing list frozen (no box, no edit, no reset); 本棚 back to the passes. Seattle: its two
// tabs, closed days, a hike's card (the photo, the difficulty, the six stats, the trail map) in the guide's English.
import { expect, test, type Page } from './fixtures.ts';
import { gotoTrips, pickTrip, tripsSheet } from './trips.ts';

test.use({ viewport: { width: 393, height: 852 } });
const guide = (p: Page, trip: string) => p.locator(`dialog[open] [data-classic="${trip}"]`);
const view = (p: Page, v: string) => p.locator(`dialog[open] [data-classic-view="${v}"]`);
const tab = (p: Page, v: string) => p.locator(`dialog[open] [data-classic-tab="${v}"]`);

test('Okinawa: the site’s itinerary, map, campsites and a frozen packing list; 本棚 back to the passes', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'okinawa');
  const g = guide(page, 'okinawa');
  await expect(g).toBeVisible();
  // the tab bar: the site's four, the itinerary on
  await expect(g.locator('[data-classic-tab]')).toHaveText(['日程', '地図', 'キャンプ場', '持ち物']);
  await expect(tab(page, 'itinerary')).toHaveAttribute('aria-selected', 'true');
  // the hero and the days, open as the site had them; the logistics cards closed, one opens to its stats
  await expect(g.locator('.hero h1')).toHaveText('沖縄 2026');
  await expect(view(page, 'itinerary').locator('details[data-day][open]')).toHaveCount(3);
  await expect(view(page, 'itinerary').locator('details[data-day="1"] ul.tl li')).toHaveCount(12);
  const flights = view(page, 'itinerary').locator('details[data-card="flights"]');
  await expect(flights).not.toHaveAttribute('open');
  await flights.locator('summary').click();
  await expect(flights.locator('.stat')).toHaveCount(6);
  await expect(flights.locator('[data-locked]')).toHaveCount(0);

  // 地図: the site's map card with the trip map in it, the day chips and 全3日間, a camp pin's card
  await tab(page, 'map').click();
  await expect(view(page, 'map').locator('[data-travel-map]')).toBeVisible();
  await expect(view(page, 'map').locator('[data-map-day]')).toHaveText(['1日目', '2日目', '3日目', '3日間']);
  await expect(view(page, 'map').locator('.stoplist li.now')).toHaveCount(1);
  await view(page, 'map').locator('[data-map-day="all"]').click();
  await expect(view(page, 'map').locator('ul.stoplist')).toHaveCount(3);
  await view(page, 'map').locator('[data-map-day="2"]').click();
  await view(page, 'map').locator('[data-stop="s2-3"]').click();
  // the stop picked is "now": what's before it greys out
  await expect(view(page, 'map').locator('.stoplist li.past')).toHaveCount(3);
  await view(page, 'map').locator('[data-map-layer="camp"]').click();
  await view(page, 'map').locator('[data-map-stub] [data-pin="katsuren-beach"]').click();
  const sheet = page.locator('dialog[open] [data-classic-camp="katsuren-beach"]');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('dialog', { name: '勝連ビーチ' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(g).toBeVisible();

  // キャンプ場: 26 cards; one criterion at a time; a card opens
  await tab(page, 'camps').click();
  const camps = view(page, 'camps').locator('details[data-camp]');
  await expect(camps).toHaveCount(26);
  await expect(view(page, 'camps').locator('[data-filter]')).toHaveText(['全26件', '無料', '有料', 'ビーチ', 'トイレ', 'シャワー']);
  await view(page, 'camps').locator('[data-filter="paid"]').click();
  await expect(view(page, 'camps').locator('[data-filter="paid"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(view(page, 'camps').locator('details[data-camp]:visible')).toHaveCount(11);
  await view(page, 'camps').locator('[data-filter="shower"]').click();
  await expect(view(page, 'camps').locator('[data-filter="paid"]')).toHaveAttribute('aria-pressed', 'false');
  const first = view(page, 'camps').locator('details[data-camp]:visible').first();
  await first.locator('summary').click();
  await expect(first.locator('.stat')).toHaveCount(3);
  await expect(first.locator('a.outlink')).toHaveAttribute('target', '_blank');

  // 持ち物: frozen, the seed's six groups and their items, nothing to tick or edit
  await tab(page, 'packing').click();
  const pack = view(page, 'packing');
  await expect(pack.locator('.group')).toHaveCount(6);
  await expect(pack.locator('.group').first().locator('.ct')).toHaveText('4');
  await expect(pack.locator('.packrow')).toHaveCount(35);
  await expect(pack.locator('input, [role="checkbox"], button')).toHaveCount(0);
  await expect(page.locator('dialog[open] [data-pack-item], dialog[open] [data-pack-edit], dialog[open] [data-pack-reset]')).toHaveCount(0);

  // 本棚: only on the itinerary (it sits in the hero), back to the passes
  await expect(page.locator('dialog[open] [data-classic-back]')).toHaveCount(0);
  await tab(page, 'itinerary').click();
  await page.locator('dialog[open] [data-classic-back]').click();
  await expect(g).toHaveCount(0);
  await expect(tripsSheet(page).locator('[data-trip]')).toHaveCount(3);
});

test('Seattle: two tabs, its days closed, a hike’s card in the guide’s English', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'seattle');
  const g = guide(page, 'seattle');
  await expect(g.locator('[data-classic-tab]')).toHaveText(['日程', '持ち物']);
  await expect(g.locator('.hero h1')).toHaveText('Seattle 2026');
  const days = view(page, 'itinerary').locator('details[data-day]');
  await expect(days).toHaveCount(18);
  await expect(view(page, 'itinerary').locator('details[data-day][open]')).toHaveCount(0);
  // the flight days ringed, the hikes filled, as the site's
  await expect(days.first()).toHaveClass(/\btravel\b/);
  const hike = view(page, 'itinerary').locator('details[data-day="2"]');
  await expect(hike).toHaveClass(/\bhike\b/);
  await expect(hike.locator('.lead-chip')).toHaveText('3JULFri');
  await hike.locator('summary').click();
  await expect(hike.locator('figure.thumb figcaption')).toHaveText('Granite Falls, WA');
  await expect(hike.locator('.diff.mod')).toHaveText('Moderate');
  await expect(hike.locator('.where')).toHaveText('Granite Falls, WA · Jul 3');
  await expect(hike.locator('.stat .k')).toHaveText(['Distance', 'Elevation gain', 'Route', 'Drive time', 'Hike time', 'Pass required']);
  await expect(hike.locator('.stat .v').first()).toHaveText('9.8 km');
  // the trail map: トレイル's own Lake 22 in the app (over the guide), ✕ back to the guide
  await hike.locator('[data-trail-open="lake-22"]').click();
  await expect(page.locator('dialog[open][data-hiking] [data-trail-view="lake-22"]')).toBeVisible();
  await page.locator('dialog[open][data-hiking] .x .nav').click();
  await expect(page.locator('dialog[open][data-hiking]')).toHaveCount(0);
  await expect(hike).toBeVisible();
  // 持ち物: frozen
  await tab(page, 'packing').click();
  await expect(view(page, 'packing').locator('h2')).toHaveText('Packing');
  await expect(view(page, 'packing').locator('.group')).toHaveCount(4);
  await expect(view(page, 'packing').locator('input, [role="checkbox"], button')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});
