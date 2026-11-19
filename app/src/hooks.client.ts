// A route's crash (+error.svelte's 「開けませんでした」) into the phone's log: Kit catches it, so the window's error
// listeners never see it (sync/log.ts routeError; docs/ops/observability.md). Kit's own errors (a 404) only count.
import type { HandleClientError } from '@sveltejs/kit/hooks';
import { routeError } from '#lib/sync/log.ts';
import { routeOf } from '#lib/ui-state/paths.ts';

export const handleError: HandleClientError = ({ kind, error, event }) =>
  routeError(error, routeOf(event.url.pathname), kind === 'unknown' ? undefined : kind === 'framework' ? error.status : 'app');
