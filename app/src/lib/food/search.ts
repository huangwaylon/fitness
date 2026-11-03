// The food search's index and ranking (ported from the calorie PoC's core/search.js). Pure: the caller owns the lists.
import { searchKey } from './text.ts';
import type { Item } from './types.ts';

/** An item as the search sees it: its name's and aliases' keys, every searchable field joined (`h`), its curated boost
 *  and its rank penalty. */
export interface Entry {
  it: Item;
  n: string;
  al: string[];
  h: string;
  pop: number;
  pen: number;
}

/** Each curated pop level (1–3) outweighs a little over half a match tier, so 食パン (substring, pop 3) beats パン粉
 *  (prefix, pop 1). */
const POP_WEIGHT = 0.6;
/** A `secondary` dataset's items (regional, school lunch, products) rank below a core item a curated alias matches. */
export const SECONDARY_PENALTY = 1.5;

export function entryOf(it: Item, pen = 0): Entry {
  const n = searchKey(it.name);
  const al = (it.aliases ?? []).map(searchKey);
  const h = [n, searchKey(it.full), ...al, searchKey(it.en), searchKey(it.brand), it.jan ?? '', searchKey(it.cat)].join('\u0001');
  return { it, n, al, h, pop: it.pop ?? 0, pen };
}

/** Lower is better: the name exact, its prefix, a substring of it, then an alias exact, prefix, substring, then any
 *  other field. */
function tierOf(e: Entry, q: string): number {
  if (e.n === q) return 0;
  if (e.n.startsWith(q)) return 1;
  if (e.n.includes(q)) return 2;
  if (e.al.includes(q)) return 3;
  if (e.al.some((a) => a.startsWith(q))) return 4;
  if (e.al.some((a) => a.includes(q))) return 5;
  return 6;
}

/** Every query token (split on spaces) in an item's text, best first. One row per normalized name + kcal, and one
 *  per cross-source verify group (`groupOf`): a group shows its best non-secondary hit (else its best) at the place of
 *  its best hit, so a school lunch's closer name never hides the core item. */
export function search(entries: readonly Entry[], query: string, limit = 60, groupOf: (id: string) => number | undefined = () => undefined): Item[] {
  const tokens = query.trim().split(/[\s　]+/).map(searchKey).filter(Boolean);
  if (!tokens.length) return [];
  const q = tokens.join('');
  const hits: { e: Entry; s: number }[] = [];
  for (const e of entries) if (tokens.every((t) => e.h.includes(t))) hits.push({ e, s: tierOf(e, q) + e.pen - e.pop * POP_WEIGHT });
  hits.sort((a, b) => a.s - b.s || b.e.pop - a.e.pop || a.e.n.length - b.e.n.length);
  const rep = new Map<number, Entry>();
  for (const { e } of hits) {
    const g = groupOf(e.it.id);
    if (g === undefined) continue;
    const r = rep.get(g);
    if (!r || (r.pen > 0 && e.pen <= 0)) rep.set(g, e);
  }
  const seen = new Set<string | number>();
  const out: Item[] = [];
  for (const h of hits) {
    const g = groupOf(h.e.it.id);
    const e = g === undefined ? h.e : rep.get(g)!;
    const k = `${e.n}|${e.it.kcal}`;
    if (seen.has(k) || (g !== undefined && seen.has(g))) continue;
    seen.add(k);
    if (g !== undefined) seen.add(g);
    if (out.push(e.it) >= limit) break;
  }
  return out;
}
