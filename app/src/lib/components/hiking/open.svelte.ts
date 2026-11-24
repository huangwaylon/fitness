// トレイル's always-loaded part (docs/hiking.md "Entry"): its sheet, a lazySheet (the chunk with the trails, the map's
// light component and the sheet), and what the next opening shows. The leaf menu's トレイル pill opens the list;
// another screen (りょこう's hike days) opens one trail:
//   openTrails()                  the list
//   openTrail('lake-22')          that trail's view (‹ goes to the list)
//   openHike('lake-22')           a hike's notification's tap: the same, back in hike mode (listenHike: the app open)
// (a Seattle hike's old trail-map link to its slug: lib/hiking/slugs.ts hikeSlugOf)
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';
import { hooksOn } from '#lib/ui-state/preview.ts';

/** Its show's arg: the opening's level, a trail's slug or null for the list. */
export const hiking = lazySheet<string | null>(() => import('./HikingSheet.svelte'));

export const openTrails = (): void => hiking.show(null);

/** りょこう's hike days: `openTrail(hikeSlugOf(day.hike.gpx))` (travel/DayCard.svelte). */
export const openTrail = (slug: string): void => hiking.show(slug);

/** A hike's notification's tap (map/notify.ts, the page's own): that trail's view, back in hike mode. */
export function openHike(trail: string): void {
  openTrail(trail);
  void import('./map/notify.ts').then((m) => m.noteTapped());
}

/** The service worker's word that a hike's notification was tapped while the app was open ({k: 'open', to: 'hike',
 *  trail}: service-worker/notify.ts); the listener's removal. (One that opens the app: `?open=hike&trail=…`, Hud's.) */
export function listenHike(): () => void {
  const sw = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker;
  const on = (e: MessageEvent) => {
    const d = e.data as { k?: unknown; to?: unknown; trail?: unknown } | null;
    if (d?.k === 'open' && d.to === 'hike' && typeof d.trail === 'string') openHike(d.trail);
  };
  sw?.addEventListener('message', on);
  return () => sw?.removeEventListener('message', on);
}

// the specs' and the console's way in (the demo's hooks)
if (typeof location !== 'undefined' && hooksOn(new URLSearchParams(location.search))) (window as unknown as { __hiking?: unknown }).__hiking = { openTrails, openTrail };
