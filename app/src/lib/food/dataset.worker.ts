// A food dataset fetched and parsed off the main thread (load.ts fetchDataset): posted `{ id, href }`, it fetches the
// file, parses it, gives each item its search keys when the file ships none (the products, the chain menus: search.ts
// keysOf, the barcodes from the ids first), answers its items a slice at a time (db.ts SLICE: each a short task for the
// page to take in) and its header last; `{ id, error }` when the fetch or the parse fails. A columnar file (the
// products: types.ts Shipped) is decoded a slice at a time too, so its items are never all in memory here with it.
import { countOf, decodeItems, headerOf, SLICE, withJan } from './db.ts';
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

self.onmessage = async (e: MessageEvent<{ id: number; href: string }>) => {
  const { id, href } = e.data;
  try {
    const file = await fetched(href);
    const head = headerOf(file);
    const n = countOf(file);
    for (let i = 0; i < n; i += SLICE) {
      // (an object file's slice let go of once posted, a columnar one's made now: the page's copy is the one kept)
      const slice = 'cols' in file && file.cols ? decodeItems(file, i, i + SLICE) : file.items!.splice(0, SLICE);
      const { items } = withJan({ ...head, items: slice });
      for (const it of items) if (typeof it.keys !== 'string') it.keys = keysOf(it).join(' ');
      post({ id, items });
    }
    post({ id, head });
  } catch (err) {
    post({ id, error: String(err) });
  }
};
