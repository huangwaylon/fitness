// Tables keyed by ids the app already holds in a known order ship as their values in that order, so the ids don't
// travel twice (vite.config.ts packed-keys: an import of `<file>.json?packed`; the plain import, the tests' and the
// scripts', stays the table): the HHA numbers and the tent's names by the tent's codes, the balloon catalogue's names
// by its ids. Pure: vite.config.ts packs with the same key lists the app unpacks with.

/** The values in the keys' order (null: no entry for that key) and the entries of no key in the list. */
export interface Packed<T> {
  v: (T | null)[];
  x?: Record<string, T>;
}

export function pack<T>(table: Readonly<Record<string, T>>, keys: readonly string[]): Packed<T> {
  const known = new Set(keys);
  const x = Object.fromEntries(Object.entries(table).filter(([k]) => !known.has(k)));
  return { v: keys.map((k) => (Object.hasOwn(table, k) ? table[k] : null)), ...(Object.keys(x).length ? { x } : {}) };
}

export function unpack<T>(p: Packed<T>, keys: readonly string[]): Record<string, T> {
  if (p.v.length !== keys.length) throw new Error(`packedKeys: ${p.v.length} values for ${keys.length} keys (a build's table with another's keys)`);
  const out: Record<string, T> = {};
  keys.forEach((k, i) => {
    const v = p.v[i];
    if (v !== null) out[k] = v;
  });
  return Object.assign(out, p.x);
}

interface TentLists {
  items: object;
  walls: readonly string[];
  floors: readonly string[];
}
/** The tent's codes (tent/items.ts: items.json's items then more.json's, the wallpapers, the floors). */
export const tentCodes = (a: TentLists, b: TentLists): string[] => [...Object.keys({ ...a.items, ...b.items }), ...a.walls, ...b.walls, ...a.floors, ...b.floors];
/** The tent's names' keys (i18n/tent.*.json: `tent.item.*`, `tent.wall.*`, `tent.floor.*`; its series' named as they are). */
export const tentNameKeys = (a: TentLists, b: TentLists): string[] => [
  ...Object.keys({ ...a.items, ...b.items }).map((c) => `tent.item.${c}`),
  ...[...a.walls, ...b.walls].map((c) => `tent.wall.${c}`),
  ...[...a.floors, ...b.floors].map((c) => `tent.floor.${c}`)
];
/** The balloon catalogue's names' keys (island/catalog.json's rows `<id> …`: i18n/catalog.*.json). */
export const catalogNameKeys = (c: { items: readonly string[]; recipes: readonly string[] }): string[] => [
  ...c.items.map((r) => `item.name.${r.split(' ')[0]}`),
  ...c.recipes.map((r) => `recipe.name.${r.split(' ')[0]}`)
];

/** A file's place in a pack: its stem, offset and bytes (lib/packStore.ts PackRef). */
export type Ref = readonly [stem: string, offset: number, bytes: number];
/** As shipped: its pack's index in `packs`, and its offset only when it isn't right after the pack's previous file. */
type SlimRef = readonly [pack: number, bytes: number] | readonly [pack: number, offset: number, bytes: number];
/** tent/more.json's places: its pieces' models (`pk`; `g` their pack's group), its textures' and icons'. */
export interface RoomPlaces<R> {
  items: Record<string, { pk?: R; g?: string }>;
  tex: Record<string, R>;
  icons: Record<string, R>;
}
/** Each place rewritten, in one fixed order (the pieces', the textures', the icons'): the order the offsets follow in. */
function mapRefs<A, B>(t: RoomPlaces<A>, f: (r: A) => B): RoomPlaces<B> {
  const each = (o: Record<string, A>) => Object.fromEntries(Object.entries(o).map(([c, r]) => [c, f(r)]));
  const items = Object.fromEntries(Object.entries(t.items).map(([c, m]) => [c, m.pk === undefined ? (m as { pk?: B }) : { ...m, pk: f(m.pk) }]));
  return { items, tex: each(t.tex), icons: each(t.icons) };
}
/** more.json's ~2,800 places in ~700 packs by a pack's index, most without their offset (the file after the pack's
 *  last), the scripts' `g` dropped (vite.config.ts packed-keys): a sixth less gzip. */
export function packRefs(t: RoomPlaces<Ref>): RoomPlaces<SlimRef> & { packs: string[] } {
  const packs: string[] = [], index = new Map<string, number>(), end = new Map<string, number>();
  const slim = mapRefs(t, ([stem, offset, bytes]): SlimRef => {
    let i = index.get(stem);
    if (i === undefined) index.set(stem, (i = packs.push(stem) - 1));
    const next = end.get(stem) === offset;
    end.set(stem, offset + bytes);
    return next ? [i, bytes] : [i, offset, bytes];
  });
  for (const m of Object.values(slim.items)) delete m.g;
  return { ...slim, packs };
}
export function unpackRefs(t: RoomPlaces<SlimRef> & { packs: readonly string[] }): RoomPlaces<Ref> {
  const end = new Map<number, number>();
  return mapRefs(t, (r): Ref => {
    const [offset, bytes] = r.length === 3 ? [r[1], r[2]] : [end.get(r[0]) ?? 0, r[1]];
    end.set(r[0], offset + bytes);
    return [t.packs[r[0]], offset, bytes];
  });
}
