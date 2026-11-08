// A sheet the HUD mounts from its first opening (りょこう, けっこんしき: docs/design.md §Trips): its own chunk, loaded on
// the first show() and kept after it so a second is at once, and whether it is open (the island paused under it).
// Offline before the chunk is cached, a banner says so with もういちど; one that fails again back online reloads the
// page. Offline with no service worker to serve it (a first visit), the chunk isn't asked for at all (unreachable):
// WebKit keeps a failed <link rel=modulepreload> (Vite's preload helper adds one for each of the chunk's files) for the
// page's life, so the import fails with it even once back online, and after the reload it hands the new page the old
// one's failed loads from its memory cache for a while (1 s here, 20 s and more on CI), so a tap then says offline
// again. `prefetch()`: the chunk fetched ahead of a tap (online only; a failure is the tap's to report).
import type { Component } from 'svelte';
import { lazy, safeReload } from './reload.ts';
import { toasts } from './toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';

type SheetComponent = Component<{ open: boolean }, object, 'open'>;
export interface LazySheet { Sheet: SheetComponent | null; open: boolean; show(again?: boolean): void; prefetch(): Promise<unknown> }

/** Offline, and no service worker to serve the chunk from its cache. */
const unreachable = () => navigator.onLine === false && !navigator.serviceWorker?.controller;

export function lazySheet(load: () => Promise<{ default: SheetComponent }>): LazySheet {
  const get = lazy(load);
  const s: LazySheet = $state({ Sheet: null, open: false, show: (again = false) => void (s.Sheet || !unreachable() ? get() : Promise.reject(new Error('offline'))).then(
    (m) => { s.Sheet = m.default; s.open = true; },
    () => {
      if (again && navigator.onLine && safeReload(Date.now(), 'chunk')) return;
      toasts.show(t('panel.sheetOffline'), 6000, { action: { label: t('panel.sheetRetry'), run: () => s.show(true) } });
    }), prefetch: () => get(true) });
  return s;
}
