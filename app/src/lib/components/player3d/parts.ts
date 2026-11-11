// The player part table (scripts/players3d-models.ts) and where each file is: a slice of one of a few dozen packs under
// the site's room/player/ (scripts/player-packs.ts, packing.ts: `<home>.<hash>.pak`; the service worker caches what's
// fetched on first use, never at install). Each file's place, `at` (its KTX2's, `k`), is in the table: [the pack's
// index in `packs`, offset, bytes]. Both いつもの looks are one pack, `everyday`, fetched whole as a player is first drawn;
// any other part comes alone, a Range of its pack (lib/packStore.ts: Pages answers with the whole pack, then held).
// The bundle carries the first closet's table (parts.json: what the closet lists); the whole table (every item
// converted, ~1.1 MB) is fetched once, beside the packs, only when a look wears a part the bundled one hasn't (covers,
// loadParts).
import TABLE from './parts.json' with { type: 'json' };
import type { PlayerLook } from '#lib/contract/look.ts';
import { PackStore } from '#lib/packStore.ts';

/** Where a file is: its pack (an index in the table's `packs`), offset and bytes. */
export type At = [pack: number, offset: number, bytes: number];
/** A file's place, and its KTX2's (a texture the bundled table lists: world3d/texHash.ts looseTextures). */
export interface Placed { at?: At; k?: At }
/** How a part's material is drawn: its texture (a file under tex/, or a plain colour), cut out, see-through (the
 *  opacity), tinted by the hair's colour or the skin's. */
export interface TexSpec extends Placed { file?: string; v?: string; kb?: number; color?: string; cut?: boolean; glass?: number; tint?: 'hair' | 'skin' }
export interface ItemSpec {
  slot: 'top' | 'bottom' | 'socks' | 'shoes' | 'glasses' | 'ornament' | 'hat';
  /** Its mesh (mesh/<key>.glb); none for socks (a texture on the body's legs). */
  mesh?: string;
  /** A one-piece: it clears the bottoms. */
  onepiece?: boolean;
  /** Material name → its texture. */
  tex: Record<string, TexSpec>;
  /** Its colour line (the id without its digit: the closet's colour swatches). */
  line: string;
  /** The closet's icon (static/art/finds/items/<icon>.webp), or null. */
  icon: string | null;
  /** Its swatch: its texture's own dominant colour (the closet's dot and colour filter). */
  sw?: string;
}
interface MeshSpec extends Placed { v: string; kb: number; tris: number; rigid: boolean; mats: string[] }
type FileSpec = Placed & { v: string; kb: number };
export interface PartTable {
  /** The packs' stems (`<home>.<hash>`: room/player/<stem>.pak), and which holds both いつもの looks. */
  packs?: string[];
  everyday?: number;
  body: FileSpec & { tris: number };
  cheek: FileSpec[];
  /** An eye's or mouth's atlas; an eye's iris mask beside it (the eye colour's tint). */
  face: Record<string, FileSpec & { iris?: FileSpec }>;
  mesh: Record<string, MeshSpec>;
  /** A hairstyle's mesh, its under-a-hat cut, and its top and left side as measured (hair ornaments sit there: head
   *  joint frame, the body's axes). */
  hair: Record<string, { mesh: string; cap: string | null; spot?: { top: [number, number, number]; side: [number, number, number] } }>;
  items: Record<string, ItemSpec>;
  /** Each catalogue icon's own colour (the closet tints a line's icon to a colour). */
  icons: Record<string, string>;
  /** The whole table's hash and size (the bundle's table only). */
  full?: { v: string; items: number };
}
/** The first closet's table (bundled). */
export const PARTS = TABLE as unknown as PartTable;

/** Whether `t` has every part `look` wears (its hairstyle and the cut under a hat, its eye and mouth, each item and its
 *  mesh): the bundled table draws it with no fetch of the whole one. */
export function covers(look: PlayerLook, t: PartTable = PARTS): boolean {
  const h = t.hair[look.hair];
  if (!h || !t.mesh[h.mesh] || (h.cap && !t.mesh[h.cap]) || !t.face[look.eye] || !t.face[look.mouth]) return false;
  for (const k of ['top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament', 'hat'] as const) {
    const id = look[k];
    if (!id) continue;
    const it = t.items[id];
    if (!it || (it.mesh && !t.mesh[it.mesh])) return false;
  }
  return true;
}

let whole: Promise<PartTable> | null = null;
/** The whole table (room/player/parts.json, once a page; the bundled one if it can't be had, and then asked for again
 *  the next time: a reply that isn't ok, a 404 or a 5xx at a deploy's moment, as a network error, never kept for the
 *  page's life). */
export function loadParts(dir: string): Promise<PartTable> {
  if (!PARTS.full) return Promise.resolve(PARTS);
  const again = () => {
    whole = null;
    return PARTS;
  };
  whole ??= fetch(`${dir.replace(/\/?$/, '/')}parts.json?v=${PARTS.full.v}`)
    .then((r) => (r.ok ? (r.json() as Promise<PartTable>) : again()))
    .catch(again);
  return whole;
}

const slash = (dir: string) => dir.replace(/\/?$/, '/');

/** A file of the parts: `key` its name under room/player/ and content hash (`mesh/<key>.glb?v=…`: what's cached once a
 *  page by), where it is (`at`) and its KTX2 (`k`), in `t`'s packs. */
export interface PartFile { key: string; at?: At; k?: At; t: PartTable }
const file = (key: string, spec: Placed & { v?: string }, t: PartTable): PartFile => ({ key: `${key}?v=${spec.v ?? ''}`, at: spec.at, k: spec.k, t });
/** The body. */
export const bodyFile = (t: PartTable = PARTS): PartFile => file('body.glb', t.body, t);
/** A mesh (a hairstyle's, a top's shape…), or null when the table hasn't it. */
export const meshFile = (key: string, t: PartTable = PARTS): PartFile | null => (t.mesh[key] ? file(`mesh/${key}.glb`, t.mesh[key], t) : null);
/** An eye's or mouth's atlas (by its part id) or a blush's (`cheek0`–`cheek2`). */
export function faceFile(id: string, t: PartTable = PARTS): PartFile | null {
  const c = /^cheek([0-2])$/.exec(id), spec = c ? t.cheek[+c[1]] : t.face[id];
  return spec ? file(`face/${id}.webp`, spec, t) : null;
}
/** An eye's iris mask (its eye colour's tint), or null. */
export const irisFile = (id: string, t: PartTable = PARTS): PartFile | null => {
  const i = t.face[id]?.iris;
  return i ? file(`face/${id}.iris.webp`, i, t) : null;
};
/** An item's texture file. */
export const texFile = (spec: TexSpec, t: PartTable = PARTS): PartFile | null => (spec.file ? file(`tex/${spec.file}`, spec, t) : null);

const stores = new Map<string, PackStore>();
/** `dir`'s packs (the site's room/player/: $app/paths asset), held in memory: the everyday pack and a few more, till
 *  the page hides (no idle let-go, as the rooms' packs have: a look or the closet asks again any moment, 4 MB at most). */
const storeOf = (dir: string): PackStore => {
  let s = stores.get(dir);
  if (!s) stores.set(dir, (s = new PackStore({ url: (stem) => `${slash(dir)}${stem}.pak`, cap: 4_000_000, tag: 'player', dropOnHide: true })));
  return s;
};
const refOf = (t: PartTable, at: At | undefined) => (at && t.packs?.[at[0]] ? ([t.packs[at[0]], at[1], at[2]] as const) : null);
/** A file's bytes (its KTX2's with `ktx2`), a copy; null when it can't be had (offline and never fetched, or no place). */
export function partBytes(f: PartFile, dir: string, ktx2 = false): Promise<ArrayBuffer | null> {
  const ref = refOf(f.t, ktx2 ? f.k : f.at);
  return ref ? storeOf(dir).bytes(ref) : Promise.resolve(null);
}
/** The everyday pack (both いつもの looks, the body) fetched whole and held: its files are sliced from memory. */
export function warmEveryday(dir: string, t: PartTable = PARTS): void {
  const stem = t.everyday === undefined ? undefined : t.packs?.[t.everyday];
  if (stem) void storeOf(dir).pack(stem);
}
