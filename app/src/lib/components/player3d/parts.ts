// The player part table (scripts/players3d-models.ts) and where each file is: under the site's room/player/ (the
// service worker caches it on first use, never at install), its content hash in the address. The bundle carries the
// first closet's table (parts.json: what the closet lists); the whole table (every item converted, ~1.1 MB) is fetched
// once, beside the parts, only when a look wears a part the bundled one hasn't (covers, loadParts).
import TABLE from './parts.json' with { type: 'json' };
import type { PlayerLook } from '#lib/contract/look.ts';

/** How a part's material is drawn: its texture (a file under tex/, or a plain colour), cut out, see-through (the
 *  opacity), tinted by the hair's colour or the skin's. */
export interface TexSpec { file?: string; v?: string; kb?: number; color?: string; cut?: boolean; glass?: number; tint?: 'hair' | 'skin' }
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
interface MeshSpec { v: string; kb: number; tris: number; rigid: boolean; mats: string[] }
export interface PartTable {
  body: { v: string; kb: number; tris: number };
  cheek: { v: string; kb: number }[];
  /** An eye's or mouth's atlas; an eye's iris mask beside it (the eye colour's tint). */
  face: Record<string, { v: string; kb: number; iris?: { v: string; kb: number } }>;
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
/** The whole table (room/player/parts.json, once a page; the bundled one if it can't be had). */
export function loadParts(dir: string): Promise<PartTable> {
  if (!PARTS.full) return Promise.resolve(PARTS);
  whole ??= fetch(`${dir.replace(/\/?$/, '/')}parts.json?v=${PARTS.full.v}`)
    .then((r) => (r.ok ? (r.json() as Promise<PartTable>) : PARTS))
    .catch(() => {
      whole = null;
      return PARTS;
    });
  return whole;
}

const slash = (dir: string) => dir.replace(/\/?$/, '/');
/** The body's address in `dir` (the site's room/player/: $app/paths asset). */
export const bodyUrl = (dir: string): string => `${slash(dir)}body.glb?v=${PARTS.body.v}`;
/** A mesh's address (a hairstyle's, a top's shape…), or null when the table hasn't it. */
export const meshUrl = (key: string, dir: string, t: PartTable = PARTS): string | null => (t.mesh[key] ? `${slash(dir)}mesh/${key}.glb?v=${t.mesh[key].v}` : null);
/** An eye's or mouth's atlas (by its part id) or a blush's (`cheek0`–`cheek2`). */
export function faceUrl(id: string, dir: string): string | null {
  const c = /^cheek([0-2])$/.exec(id);
  if (c) return `${slash(dir)}face/${id}.webp?v=${PARTS.cheek[+c[1]].v}`;
  return PARTS.face[id] ? `${slash(dir)}face/${id}.webp?v=${PARTS.face[id].v}` : null;
}
/** An eye's iris mask (its eye colour's tint), or null. */
export const irisUrl = (id: string, dir: string, t: PartTable = PARTS): string | null => {
  const i = t.face[id]?.iris;
  return i ? `${slash(dir)}face/${id}.iris.webp?v=${i.v}` : null;
};
/** An item's texture file's address. */
export const texUrl = (t: TexSpec, dir: string): string | null => (t.file ? `${slash(dir)}tex/${t.file}?v=${t.v}` : null);
