// トレイル's always-loaded part (docs/hiking.md "Entry"): its sheet, a lazySheet (the chunk with the trails, the map's
// light component and the sheet), and what the next opening shows. The leaf menu's トレイル pill opens the list;
// another screen (りょこう's Seattle hike cards) opens one trail:
//   openTrails()                  the list
//   openTrail('lake-22')          that trail's view (‹ goes to the list)
// (a Seattle hike's old trail-map link to its slug: lib/hiking/trails.ts hikeSlugOf)
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';
import { hooksOn } from '#lib/ui-state/preview.ts';

export const hiking = lazySheet(() => import('./HikingSheet.svelte'));

/** The next opening's level: a trail's slug, or null for the list; `n` counts the asks (an ask while open moves it). */
export const hikingAsk = $state<{ slug: string | null; n: number }>({ slug: null, n: 0 });

export function openTrails(): void {
  hikingAsk.slug = null;
  hikingAsk.n++;
  hiking.show();
}

/** The classic Seattle guide's hike cards: `openTrail(hikeSlugOf(day.hike.gpx))` (classic/CDay.svelte). */
export function openTrail(slug: string): void {
  hikingAsk.slug = slug;
  hikingAsk.n++;
  hiking.show();
}

// the specs' and the console's way in (the demo's hooks)
if (typeof location !== 'undefined' && hooksOn(new URLSearchParams(location.search))) (window as unknown as { __hiking?: unknown }).__hiking = { openTrails, openTrail };
