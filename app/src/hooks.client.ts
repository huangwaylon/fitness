// A route's crash (+error.svelte's 「開けませんでした」) into the phone's log: Kit catches it, so the window's error
// listeners never see it (sync/log.ts routeError; docs/ops/observability.md). Kit's own errors (a 404) only count.
import type { HandleClientError } from '@sveltejs/kit/hooks';
import { routeError } from '#lib/sync/log.ts';
import { isBare, routeOf } from '#lib/ui-state/paths.ts';
import { getKey } from '#lib/sync/storage.ts';
import { readEarly } from '#lib/sync/cacheEarly.ts';

// a paired phone's record from IndexedDB now, as the entry's modules run: before the root layout's chunks and
// AppShell's mount (sync/cacheEarly.ts; cache.ts loadCache takes it, +layout.ts asks for it next); a bare page has none
if (getKey() && !isBare(routeOf(location.pathname))) readEarly();

export const handleError: HandleClientError = ({ kind, error, event }) =>
  routeError(error, routeOf(event.url.pathname), kind === 'unknown' ? undefined : kind === 'framework' ? error.status : 'app');
