// The chain menus' id shards (food/kal/ in the build, scripts/food-shards.ts; docs/food-data.md "Format"):
// kalori.json cut into runs of its items in id order (Kalori numbers a shop's menu in runs: ~5 shops a run), so a day's
// chain menu, or a recent one's picture and shop, comes in ~11 KB, never the 1.2 MB file (load.ts wantIds). Made from
// the shipped file at each build, under its version: nothing more to commit or to version. Pure.
import { decodeItems, toColumns } from './db.ts';
import type { Item, Shipped } from './types.ts';

/** The runs (each ~545 of 54k items). */
const SHARDS = 100;

/** A shard: by column (a dataset's layout, `source: kalori`), the shops its items name (their names), and `with`: the
 *  items of this run kept with their vg group in another (id → the group's id). */
export type KalShard = Shipped & { with: Record<string, string> };

/** The shard of an id: the last of `at` (each shard's first id, ascending: kal/at.json) at or under its number. */
export function kalShard(at: readonly number[], id: string): number {
  const n = Number(id.slice(id.indexOf(':') + 1));
  let lo = 0, hi = at.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (at[mid] <= n) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** kalori.json (as shipped) as its id shards: each item in its id's run, one in a vg group in its group's (its sizes'
 *  chips at once; `with` says where), no aliases (search only); `at`, each run's first id. Throws on an id that is
 *  not a number. */
export function kalShards(file: Shipped, n = SHARDS): { at: number[]; shards: KalShard[] } {
  const num = (id: string) => Number(id.slice(id.indexOf(':') + 1));
  const all = decodeItems(file).map(({ aliases: _a, ...it }) => it as Item);
  const odd = all.find((it) => !Number.isSafeInteger(num(it.id)));
  if (odd) throw new Error(`${odd.id}: a chain menu's id that is not a number`);
  all.sort((a, b) => num(a.id) - num(b.id));
  const runs = Math.min(n, all.length);
  const at = Array.from({ length: runs }, (_, i) => num(all[Math.floor((i * all.length) / runs)].id));
  const out = at.map(() => ({ items: [] as Item[], with: {} as Record<string, string> }));
  for (const it of all) {
    const home = kalShard(at, it.vg ?? it.id), own = kalShard(at, it.id);
    out[home].items.push(it);
    if (own !== home) out[own].with[it.id] = it.vg!;
  }
  const shards = out.map(({ items, with: w }) => {
    const shops = Object.fromEntries([...new Set(items.map((it) => it.shop ?? ''))].map((id) => [id, { name: file.shops?.[id]?.name ?? id }]));
    return { ...toColumns({ source: 'kalori', shops, items }), with: w };
  });
  return { at, shards };
}
