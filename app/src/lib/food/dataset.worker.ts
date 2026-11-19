// A food dataset fetched and parsed off the main thread (load.ts fetchDataset): posted `{ id, href, keep }`, it fetches
// the file, parses it, gives each item its search keys (no file ships them: search.ts keysOf, the barcodes from the ids
// first; `keep`, a core dataset: the ones built for this version of the file last time, keysCache.ts, else built and
// kept), answers its items a slice at a time (db.ts SLICE: each a short task for the page to take in) and its header
// last (after the keys it built are kept: the page lets the worker go then); `{ id, error }` when the fetch or the parse
// fails. The file (by column: types.ts Shipped) is decoded a slice at a time, so its items are never all in memory here
// with it.
import { countOf, decodeItems, fillIn, headerOf, SLICE } from './db.ts';
import { openKeys, readKeys, writeKeys } from './keysCache.ts';
import { keysOf } from './search.ts';
import type { Dataset, Shipped } from './types.ts';

export type Parsed =
  | { id: number; items: Dataset['items'] }
  | { id: number; head: Omit<Dataset, 'items'> }
  | { id: number; error: string };

const post = (m: Parsed) => (self as unknown as Worker).postMessage(m);

async function fetched(href: string): Promise<Shipped> {
  const res = await fetch(href);
  if (!res.ok) throw new Error(`${href}: ${res.status}`);
  return (await res.json()) as Shipped;
}

// (none kept on the dev server: its worker has no hashed URL to say its code changed)
const KEEP = !import.meta.env.DEV;

self.onmessage = async (e: MessageEvent<{ id: number; href: string; keep?: boolean }>) => {
  const { id, href } = e.data;
  const keep = KEEP && !!e.data.keep;
  // (the database opened under the file's fetch)
  if (keep) openKeys();
  try {
    const file = await fetched(href);
    // (a file not by column, another layout: an error, the dataset left out and logged, never empty in silence)
    if (!Array.isArray(file?.cols?.id)) throw new Error(`${href}: not by column`);
    const head = headerOf(file);
    const n = countOf(file);
    // (kept by the file's path, under its version and this worker's build: either new, they're built again)
    const at = keep ? new URL(href) : null;
    const v = at ? `${at.search} ${self.location.pathname}` : '';
    const kept = at ? await readKeys(at.pathname, v, n) : null;
    const built: string[] | null = at && !kept ? [] : null;
    for (let i = 0; i < n; i += SLICE) {
      // (made now: the page's copy is the one kept)
      const { items } = fillIn({ ...head, items: decodeItems(file, i, i + SLICE) });
      if (kept) for (let j = 0; j < items.length; j++) items[j].keys = kept[i + j];
      else
        for (const it of items) {
          it.keys = keysOf(it).join(' ');
          built?.push(it.keys);
        }
      post({ id, items });
    }
    if (at && built) await writeKeys(at.pathname, v, built);
    post({ id, head });
  } catch (err) {
    post({ id, error: String(err) });
  }
};
