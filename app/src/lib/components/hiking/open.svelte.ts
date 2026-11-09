// トレイル's always-loaded part (docs/hiking.md "Entry"): its sheet, a lazySheet (the chunk with the trails, the map's
// light component and the sheet), and what the next opening shows. The leaf menu's トレイル pill opens the list;
// another screen (りょこう's hike days) opens one trail:
//   openTrails()                  the list
//   openTrail('lake-22')          that trail's view (‹ goes to the list)
// (a Seattle hike's old trail-map link to its slug: lib/hiking/trails.ts hikeSlugOf)
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';
import { hooksOn } from '#lib/ui-state/preview.ts';

/** Its show's arg: the opening's level, a trail's slug or null for the list. */
export const hiking = lazySheet<string | null>(() => import('./HikingSheet.svelte'));

export const openTrails = (): void => hiking.show(null);

/** りょこう's hike days: `openTrail(hikeSlugOf(day.hike.gpx))` (travel/DayCard.svelte). */
export const openTrail = (slug: string): void => hiking.show(slug);

// the specs' and the console's way in (the demo's hooks)
if (typeof location !== 'undefined' && hooksOn(new URLSearchParams(location.search))) (window as unknown as { __hiking?: unknown }).__hiking = { openTrails, openTrail };
