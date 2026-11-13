// The members' chain menus (Kalori, docs/food-data.md "Kalori"): the relay's `GET /food/kalori` with this phone's key
// (relay/src/foodRoute.ts), never on Pages or in git. Kept in the Cache API (`food-kalori`) for offline and asked again
// at each catalog load with its ETag (a 304: the kept copy). 401/403 (unpaired, the guest) and 404 (none uploaded):
// the kept copy dropped, no retry (Refused); a network failure, no answer in KALORI_ANSWER_MS or another status: the
// kept copy, else an error (the caller retries at its next chance). Run in dataset.worker.ts, or on the page without a worker.
import { keyed } from '#lib/keyed.ts';
import type { Dataset } from './types.ts';

const CACHE = 'food-kalori';
/** How long the relay's answer (its headers, never the body's download) is waited for: on lie-fi the kept copy, not
 *  WebKit's ~60 s (review 11-13 B7). */
export const KALORI_ANSWER_MS = 15_000;

/** The relay said no (401, 403, 404): not asked again till the catalog's next load. */
export class Refused extends Error {}

/** The chain menus kept, fetched again or asked for with the ETag; each item's portions left out (always one 1食:
 *  portionsOf's default for an `sv` item), 38k arrays fewer on the heap. */
export async function fetchKalori(href: string, key: string): Promise<Dataset> {
  return lean(await fetched(href, key));
}

function lean(d: Dataset): Dataset {
  for (const it of d.items) if (it.sv && it.portions?.length === 1 && it.portions[0].g === 100) delete it.portions;
  return d;
}

async function fetched(href: string, key: string): Promise<Dataset> {
  const cache = typeof caches === 'undefined' ? null : await caches.open(CACHE).catch(() => null);
  const kept = await cache?.match(href).catch(() => undefined);
  const etag = kept?.headers.get('ETag');
  const r = await keyed(href, key, { headers: etag ? { 'If-None-Match': etag } : {}, cache: 'no-store' }, KALORI_ANSWER_MS);
  if (!r.ok && !r.res) {
    if (kept) return (await kept.json()) as Dataset;
    throw new Error(`${href}: ${r.why}`);
  }
  const res = r.res!;
  if (res.status === 304 && kept) return (await kept.json()) as Dataset;
  if (res.status === 200) {
    // (kept as it streams in, never as a string beside the parsed rows: ~10 MB of text; its ETag (weak, W/"…", once
    // gzipped) sent back as it came)
    const d = await Promise.all([res.clone().json() as Promise<Dataset>, cache?.put(href, res).catch(() => {})]).then(([d]) => d, () => null);
    if (!Array.isArray(d?.items)) {
      await cache?.delete(href).catch(() => false);
      throw new Error(`${href}: not a dataset`);
    }
    return d;
  }
  if (!r.ok && r.why === 'refused') {
    await cache?.delete(href).catch(() => false);
    throw new Refused(`${href}: ${res.status}`);
  }
  if (kept) return (await kept.json()) as Dataset;
  throw new Error(`${href}: ${res.status}`);
}
