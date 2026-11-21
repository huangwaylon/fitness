// A trail's track by its slug (docs/hiking.md "Data"): static/hiking/tracks/<slug>.json (scripts/hiking-tracks.ts),
// fetched as its view opens; the service worker precaches all twelve (~80 KB: caches.ts precachable), so it reads offline.
// Its reference trails (net.ts, a Japan trail's): fetched as its map opens, never precached.
import type { TrackFile } from './types.ts';
import { netPath, parseNet, type NetFile } from './net.ts';
import { staticUrl } from '#lib/staticUrl.ts';

const trackPath = (slug: string): string => `hiking/tracks/${slug}.json`;

type TrackLoad = { k: 'ok'; track: TrackFile } | { k: 'failed' };

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

/** A trail's reference trails (net.ts), or null: none (a US trail, a registered hike), offline and never seen or saved,
 *  or not the schema. */
export async function loadNet(slug: string, get: typeof fetch = fetch): Promise<NetFile | null> {
  try {
    const res = await get(staticUrl(netPath(slug)));
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
    return parseNet(await res.json());
  } catch {
    return null;
  }
}
