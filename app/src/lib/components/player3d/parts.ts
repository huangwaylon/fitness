// The player part table (parts.json, scripts/players3d-models.ts) and where each file is: under the site's
// room/player/ (the service worker caches it on first use, never at install), its content hash in the address.
import TABLE from './parts.json' with { type: 'json' };

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
}
interface MeshSpec { v: string; kb: number; tris: number; rigid: boolean; mats: string[] }
export interface PartTable {
  body: { v: string; kb: number; tris: number };
  cheek: { v: string; kb: number }[];
  face: Record<string, { v: string; kb: number }>;
  mesh: Record<string, MeshSpec>;
  hair: Record<string, { mesh: string; cap: string | null }>;
  items: Record<string, ItemSpec>;
}
export const PARTS = TABLE as unknown as PartTable;

const slash = (dir: string) => dir.replace(/\/?$/, '/');
/** The body's address in `dir` (the site's room/player/: $app/paths asset). */
export const bodyUrl = (dir: string): string => `${slash(dir)}body.glb?v=${PARTS.body.v}`;
/** A mesh's address (a hairstyle's, a top's shape…), or null when the table hasn't it. */
export const meshUrl = (key: string, dir: string): string | null => (PARTS.mesh[key] ? `${slash(dir)}mesh/${key}.glb?v=${PARTS.mesh[key].v}` : null);
/** An eye's or mouth's atlas (by its part id) or a blush's (`cheek0`–`cheek2`). */
export function faceUrl(id: string, dir: string): string | null {
  const c = /^cheek([0-2])$/.exec(id);
  if (c) return `${slash(dir)}face/${id}.webp?v=${PARTS.cheek[+c[1]].v}`;
  return PARTS.face[id] ? `${slash(dir)}face/${id}.webp?v=${PARTS.face[id].v}` : null;
}
/** An item's texture file's address. */
export const texUrl = (t: TexSpec, dir: string): string | null => (t.file ? `${slash(dir)}tex/${t.file}?v=${t.v}` : null);
