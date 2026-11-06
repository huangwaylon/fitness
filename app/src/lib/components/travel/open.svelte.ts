// りょこう's always-loaded part (docs/design.md §Trips): its sheet (the chunk with the guides, their strings and
// the sheet), loaded on the first opening and kept after it so a second is at once (the HUD mounts it, outside the
// island's [data-exact-taps] stage), and whether it is open (the island paused under it). Offline before the chunk is
// cached, the pill says so on a banner with もういちど; one that fails again back online reloads the page (Safari keeps
// a failed import for the page's life).
import type { Component } from 'svelte';
import { lazy, safeReload } from '#lib/ui-state/reload.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';

type SheetComponent = Component<{ open: boolean }, object, 'open'>;
export const trips = $state<{ Sheet: SheetComponent | null; open: boolean }>({ Sheet: null, open: false });

const load = lazy(() => import('./TravelSheet.svelte'));

/** The menu's りょこう pill (after its press beat), and the banner's もういちど (`again`). */
export function openTrips(again = false): void {
  load().then(
    (m) => {
      trips.Sheet = m.default;
      trips.open = true;
    },
    () => {
      if (again && navigator.onLine && safeReload(Date.now(), 'chunk')) return;
      toasts.show(t('panel.travelOffline'), 6000, { action: { label: t('panel.travelRetry'), run: () => openTrips(true) } });
    }
  );
}
