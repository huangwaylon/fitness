// A food dataset fetched and parsed off the main thread (load.ts fetchDataset): posted `{ id, href }`, it fetches the
// file, parses it, gives each item its search keys when the file ships none (the products: search.ts keysOf, the
// barcodes from the ids first), then answers its items a slice at a time (db.ts SLICE: each a short task for the page
// to take in) and its header last; `{ id, error }` when the fetch or the parse fails.
import { SLICE, withJan } from './db.ts';
import { keysOf } from './search.ts';
import type { Dataset } from './types.ts';

export type Parsed = { id: number; items: Dataset['items'] } | { id: number; head: Omit<Dataset, 'items'> } | { id: number; error: string };

const post = (m: Parsed) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<{ id: number; href: string }>) => {
  const { id, href } = e.data;
  try {
    const res = await fetch(href);
    if (!res.ok) throw new Error(`${href}: ${res.status}`);
    const { items, ...head } = withJan((await res.json()) as Dataset);
    for (const it of items) if (typeof it.keys !== 'string') it.keys = keysOf(it).join(' ');
    for (let i = 0; i < items.length; i += SLICE) post({ id, items: items.slice(i, i + SLICE) });
    post({ id, head });
  } catch (err) {
    post({ id, error: String(err) });
  }
};
