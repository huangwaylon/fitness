// A sheet the HUD mounts from its first opening (りょこう, けっこんしき: docs/design.md §Trips): its own chunk, loaded on
// the first show() and kept after it so a second is at once, and whether it is open (the island paused under it).
// Offline before the chunk is cached, a banner says so with もういちど; one that fails again back online reloads the
// page (Safari keeps a failed import for the page's life). `prefetch()`: the chunk fetched ahead of a tap (online only;
// a failure is the tap's to report).
import type { Component } from 'svelte';
import { lazy, safeReload } from './reload.ts';
import { toasts } from './toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';

type SheetComponent = Component<{ open: boolean }, object, 'open'>;
export interface LazySheet { Sheet: SheetComponent | null; open: boolean; show(again?: boolean): void; prefetch(): Promise<unknown> }

export function lazySheet(load: () => Promise<{ default: SheetComponent }>): LazySheet {
  const get = lazy(load);
  const s: LazySheet = $state({ Sheet: null, open: false, show: (again = false) => void get().then(
    (m) => { s.Sheet = m.default; s.open = true; },
    () => {
      if (again && navigator.onLine && safeReload(Date.now(), 'chunk')) return;
      toasts.show(t('panel.sheetOffline'), 6000, { action: { label: t('panel.sheetRetry'), run: () => s.show(true) } });
    }), prefetch: () => get(true) });
  return s;
}
