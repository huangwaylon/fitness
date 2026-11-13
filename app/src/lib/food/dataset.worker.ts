// A food dataset fetched and parsed off the main thread (load.ts fetchDataset): posted `{ id, href }`, it fetches the
// file (with `key`: the members' chain menus from the relay, kalori.ts), parses it, gives each item its search keys
// when the file ships none (the products, the chain menus: search.ts keysOf, the barcodes from the ids first), answers its items a slice at a time (db.ts SLICE: each a short task for the page
// to take in) and its header last; `{ id, error }` when the fetch or the parse fails (`refused`: kalori.ts Refused).
// A chain-menu call's miss (keyed.ts: even one the kept copy covered) goes to the page as `{ keyed }`, for its log:
// here keyed's sink would log nowhere.
import { SLICE, withJan } from './db.ts';
import { fetchKalori, Refused } from './kalori.ts';
import { keysOf } from './search.ts';
import { keyedSink, type KeyedMiss } from '#lib/keyed.ts';
import type { Dataset } from './types.ts';

export type Parsed =
  | { id: number; items: Dataset['items'] }
  | { id: number; head: Omit<Dataset, 'items'> }
  | { id: number; error: string; refused?: true }
  | { keyed: { url: string; why: KeyedMiss; http?: number } };

const post = (m: Parsed) => (self as unknown as Worker).postMessage(m);
keyedSink((url, why, http) => post({ keyed: { url, why, ...(http ? { http } : {}) } }));

async function fetched(href: string, key?: string): Promise<Dataset> {
  if (key) return fetchKalori(href, key);
  const res = await fetch(href);
  if (!res.ok) throw new Error(`${href}: ${res.status}`);
  return (await res.json()) as Dataset;
}

self.onmessage = async (e: MessageEvent<{ id: number; href: string; key?: string }>) => {
  const { id, href, key } = e.data;
  try {
    const { items, ...head } = withJan(await fetched(href, key));
    for (const it of items) if (typeof it.keys !== 'string') it.keys = keysOf(it).join(' ');
    // (each slice let go once posted: the page's copy is the one kept)
    while (items.length) post({ id, items: items.splice(0, SLICE) });
    post({ id, head });
  } catch (err) {
    post({ id, error: String(err), ...(err instanceof Refused ? { refused: true as const } : {}) });
  }
};
