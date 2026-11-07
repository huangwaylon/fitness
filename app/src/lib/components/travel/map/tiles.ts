// The basemap's tiles fetched by the page, not MapLibre's worker (docs/backend.md "Service worker" › Offline): the
// service worker keeps the tiles a map drew so it draws them offline, and WebKit's service worker never sees the
// worker's own fetches (checked: the page's are). So the tile URLs go to the worker under a protocol of ours
// (transformRequest), and MapLibre hands each back to the page (addProtocol's loader runs there), which fetches it.
// Pure but for the fetch.
import type { AddProtocolAction, RequestTransformFunction } from 'maplibre-gl';

export const VIA = 'island-tile';

/** OpenFreeMap's tile URLs under our protocol; anything else (the TileJSON: the page's already) as it is. */
export const viaPage = (origin: string): RequestTransformFunction => (url, kind) =>
  kind === 'Tile' && url.startsWith(`${origin}/`) ? { url: `${VIA}${url.slice(url.indexOf('://'))}` } : undefined;

/** The page's fetch of a tile under our protocol (an empty tile: an empty buffer; a refused one: an error the map shows
 *  as its offline note). */
export const loadViaPage = (get: typeof fetch = fetch): AddProtocolAction => async (p, ctl) => {
  const res = await get(`https${p.url.slice(VIA.length)}`, { signal: ctl.signal, credentials: 'omit' });
  if (!res.ok) throw Object.assign(new Error(`tile ${res.status}`), { status: res.status });
  return { data: await res.arrayBuffer(), cacheControl: res.headers.get('cache-control'), expires: res.headers.get('expires') };
};
