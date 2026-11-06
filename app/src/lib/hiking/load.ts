// A trail's track by its slug (docs/hiking.md "Data"), loaded only as its view opens. The tracks are AllTrails exports,
// so none is committed yet (the user's decision is pending): in dev (or a local build with VITE_HIKING_LOCAL=1) they
// come from the gitignored app/hiking-local/ (scripts/hiking-tracks.ts writes it), each its own lazy chunk; otherwise
// from static/travel/hiking/tracks/<slug>.json, the path for when they're committed (under travel/: never precached,
// caches.ts isTravel), which today answers 404: 'missing', the view says so quietly.
import { asset } from '$app/paths';
import type { TrackFile } from './types.ts';

/** The committed path of a slug's track (static/). */
export const trackPath = (slug: string): string => `/travel/hiking/tracks/${slug}.json`;

const LOCAL = import.meta.env.DEV || import.meta.env.VITE_HIKING_LOCAL === '1';
// (a static glob: in a production build without the flag it is dropped with its branch, so no local track can ship)
const local: Record<string, () => Promise<unknown>> = LOCAL ? import.meta.glob('../../../hiking-local/*.json', { import: 'default' }) : {};

export type TrackLoad = { k: 'ok'; track: TrackFile } | { k: 'missing' } | { k: 'failed' };

const isTrack = (x: unknown): x is TrackFile => !!x && typeof x === 'object' && (x as TrackFile).v === 1 && Array.isArray((x as TrackFile).pts) && (x as TrackFile).pts.length > 1;

export async function loadTrack(slug: string, get: typeof fetch = fetch): Promise<TrackLoad> {
  const dev = Object.entries(local).find(([p]) => p.endsWith(`/${slug}.json`))?.[1];
  try {
    if (dev) {
      const t = await dev();
      return isTrack(t) ? { k: 'ok', track: t } : { k: 'failed' };
    }
    const res = await get(asset(trackPath(slug) as Parameters<typeof asset>[0]));
    if (res.status === 404 || !(res.headers.get('content-type') ?? '').includes('json')) return { k: 'missing' };
    if (!res.ok) return { k: 'failed' };
    const t: unknown = await res.json();
    return isTrack(t) ? { k: 'ok', track: t } : { k: 'failed' };
  } catch {
    return { k: 'failed' };
  }
}
