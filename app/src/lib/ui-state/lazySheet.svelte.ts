// A sheet the HUD mounts from its first opening (りょこう, けっこんしき: docs/design.md §Trips): its own chunk, loaded on
// the first show() and kept after it so a second is at once, and whether it is open (the island paused under it).
// Offline before the chunk is cached, a banner says so with もういちど; one that fails again online reloads the page
// (reload.ts reloadOnRepeat `module`). Offline with no service worker to serve it (a first
// visit), the chunk isn't asked for at all (chunkUnreachable):
// WebKit keeps a failed <link rel=modulepreload> (Vite's preload helper adds one for each of the chunk's files) for the
// page's life, so the import fails with it even once back online, and after the reload it hands the new page the old
// one's failed loads from its memory cache for a while (1 s here, 20 s and more on CI), so a tap then says offline
// again. `prefetch()`: the chunk fetched ahead of a tap (online only; a failure is the tap's to report). `show(arg)`: what
// this opening should show (トレイル's trail, ごはん on someone's day), kept in `ask` (a new object each time: an ask
// while it's open moves it), which the sheet reads on its mount and each change.
import { untrack, type Component } from 'svelte';
import { lazy, reloadOnRepeat } from './reload.ts';
import { toasts } from './toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';

type SheetComponent = Component<{ open: boolean }, object, 'open'>;
interface LazySheet<A = never> {
  Sheet: SheetComponent | null;
  open: boolean;
  /** The last show(arg)'s arg. */
  ask: { arg: A } | null;
  show(arg?: A): void;
  prefetch(): Promise<unknown>;
}

/** Offline, and no service worker to serve a chunk from its cache: no lazy import is asked for then (a failed one
 *  WebKit keeps, and every chunk sharing a file with it fails with it once back online: やること's panel's, asked as
 *  the menu unfolded offline, took りょこう's sheet with it, whose もう一度 then reloaded the page). */
export const chunkUnreachable = (): boolean => navigator.onLine === false && !navigator.serviceWorker?.controller;

const all: { open: boolean }[] = [];
/** Every lazySheet closed (a way off the island: 英語すごろく's invitation's 参加), so none reopens on the way back. */
export function closeSheets(): void {
  for (const x of all) x.open = false;
}

export function lazySheet<A = never>(load: () => Promise<{ default: SheetComponent }>): LazySheet<A> {
  const get = lazy(load);
  // (s.Sheet untracked: a show() from an effect must not make it re-run when the chunk comes, as toast.svelte.ts show)
  const up = (again: boolean): void => void (untrack(() => s.Sheet) || !chunkUnreachable() ? get() : Promise.reject(new Error('offline'))).then(
    (m) => { s.Sheet = m.default; s.open = true; },
    async () => {
      if (await reloadOnRepeat(+again, { module: true })) return;
      toasts.show(t('panel.sheetOffline'), 6000, { action: { label: t('state.retry'), run: () => up(true) } });
    });
  const s: LazySheet<A> = $state({ Sheet: null, open: false, ask: null, show: (...a: [A?]) => {
    if (a.length) s.ask = { arg: a[0] as A };
    up(false);
  }, prefetch: () => get(true) });
  all.push(s);
  return s;
}
