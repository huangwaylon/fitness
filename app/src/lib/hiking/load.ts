// A trail's track by its slug (docs/hiking.md "Data"): static/hiking/tracks/<slug>.json (scripts/hiking-tracks.ts),
// fetched as its view opens; the service worker precaches all ten (~70 KB: caches.ts precachable), so it reads offline.
import type { TrackFile } from './types.ts';
import { staticUrl } from '#lib/staticUrl.ts';

const trackPath = (slug: string): string => `/hiking/tracks/${slug}.json`;

export type TrackLoad = { k: 'ok'; track: TrackFile } | { k: 'failed' };

const isTrack = (x: unknown): x is TrackFile => !!x && typeof x === 'object' && (x as TrackFile).v === 1 && Array.isArray((x as TrackFile).pts) && (x as TrackFile).pts.length > 1;

export async function loadTrack(slug: string, get: typeof fetch = fetch): Promise<TrackLoad> {
  try {
    const res = await get(staticUrl(trackPath(slug)));
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return { k: 'failed' };
    const t: unknown = await res.json();
    return isTrack(t) ? { k: 'ok', track: t } : { k: 'failed' };
  } catch {
    return { k: 'failed' };
  }
}
