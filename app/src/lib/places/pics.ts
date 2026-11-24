// A saved place's photo tokens (docs/places.md "Details"): `GET /places/pics?id=` with the phone's key (the relay's
// details: ≤ PICS_MAX (10) lh3 links a place, out of /places's payload), asked when its card opens (or a row is pressed), kept
// for the session (an answer per place; a failure isn't kept: the next open asks again). The images themselves come
// from Google's lh3 (contract picUrl), cached on view by the service worker (caches.ts isPlacePic).
import { picsOf } from '../contract/places.ts';
import { keyed } from '../keyed.ts';
import { getKey } from '../sync/storage.ts';
import { relayUrl } from '../sync/transport.ts';

const got = new Map<string, Promise<string[] | null>>();

/** A place's photo tokens ([] none; null: not reached). */
export function loadPics(id: string): Promise<string[] | null> {
  let p = got.get(id);
  if (!p) {
    got.set(id, (p = keyed(relayUrl(`/places/pics?id=${encodeURIComponent(id)}`), getKey(), {}, 10_000)
      .then(async (r) => (r.ok ? picsOf(await r.res.json().catch(() => null)) : null), () => null)
      .then((t) => (t || got.delete(id), t))));
  }
  return p;
}
