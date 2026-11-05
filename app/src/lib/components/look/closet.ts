// The closet behind せってい → すがた (design/avatar/customization.md §3): what the grid lists, as one small interface, so
// the level doesn't care where the parts come from. Until the closet pipeline's part table lands (static/room/player/,
// a manifest of part ids → mesh, texture, colour group, icon), `stubCloset` lists the parts of DEFAULT_LOOKS and the art
// scout's palette (design/avatar/catalog.md), each variant with a hand-picked swatch and no icon; useCloset swaps in the
// real one. The wear rules (a one-piece clears the bottoms, a bottom clears a one-piece) are here too, pure.
import { isOnepiece, type Hex, type PartId, type PlayerLook } from '#lib/contract/look.ts';

/** The level's category chips, in order (かお · かみ · トップス · ボトムス · ワンピース · くつした · くつ · こもの). */
export const CATEGORIES = ['face', 'hair', 'tops', 'bottoms', 'onepiece', 'socks', 'shoes', 'acc'] as const;
export type Category = (typeof CATEGORIES)[number];

/** A grid of parts: a face part, the hair, or a garment (tops and one-pieces are both the `top` slot). */
export type ClosetKind = 'eye' | 'mouth' | 'hair' | 'top' | 'onepiece' | 'bottom' | 'socks' | 'shoes' | 'glasses' | 'ornament';
/** The look's slot each kind wears into. */
const SLOT_OF = {
  eye: 'eye', mouth: 'mouth', hair: 'hair', top: 'top', onepiece: 'top', bottom: 'bottom',
  socks: 'socks', shoes: 'shoes', glasses: 'glasses', ornament: 'ornament'
} as const satisfies Record<ClosetKind, keyof PlayerLook>;
/** The kinds that may be left off (a なし tile first). */
export const OPTIONAL_KINDS: ReadonlySet<ClosetKind> = new Set(['socks', 'shoes', 'glasses', 'ornament']);
/** The kinds with colour variants and the colour filter (the garments; a face part or hair is its one shape). */
export const GARMENT_KINDS: ReadonlySet<ClosetKind> = new Set(['top', 'onepiece', 'bottom', 'socks', 'shoes', 'glasses', 'ornament']);

/** The colour filter's buckets, in the row's order (すべて first: no bucket). */
export const HUES = ['red', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'white', 'black'] as const;
export type Hue = (typeof HUES)[number];

/** One colour variant of an item: its part id, a swatch (the dot), its hue bucket and its icon (null: none yet). */
export interface Variant { id: PartId; swatch: Hex; hue: Hue; icon: string | null }
/** One tile: a base item (a shape and pattern) and its colour variants. */
export interface ClosetItem { key: string; kind: ClosetKind; variants: Variant[] }

export interface Closet {
  /** The tiles of a kind, in the closet's order. */
  items(kind: ClosetKind): ClosetItem[];
  /** The item and variant a part id is (null: not in this closet). */
  find(id: PartId | null | undefined): { item: ClosetItem; variant: Variant } | null;
  /** The colour swatches: hair, eyes, skin. */
  colours: { hairColor: readonly Hex[]; eyeColor: readonly Hex[]; skin: readonly Hex[] };
}

/** A colour's bucket for the filter: its hue, or white / black / brown by lightness and saturation. */
export function hueOf(hex: Hex): Hue {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.15 || d < 0.06) return l >= 0.5 ? 'white' : 'black';
  const h = (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  if (l > 0.85) return h >= 290 || h < 15 ? 'pink' : 'white';
  if (h >= 15 && h < 50) return s > 0.6 && l > 0.45 ? 'yellow' : 'brown';
  if (h < 15 || h >= 345) return l > 0.7 ? 'pink' : 'red';
  if (h < 70) return 'yellow';
  if (h < 170) return 'green';
  if (h < 255) return 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

/** An item's key: its variant's id without the trailing colour digits (`TopsTexTopOuterLAran3` → `…Aran`). */
export const itemKey = (id: PartId): string => id.replace(/\d+$/, '');

/** A closet from a list of kinds and their variants (the stub's and, until it brings its own, any table's). */
export function closetFrom(
  parts: Partial<Record<ClosetKind, [PartId, Hex][]>>,
  colours: Closet['colours'],
  icon: (id: PartId) => string | null = () => null
): Closet {
  const byKind = new Map<ClosetKind, ClosetItem[]>();
  const byId = new Map<PartId, { item: ClosetItem; variant: Variant }>();
  for (const [kind, list] of Object.entries(parts) as [ClosetKind, [PartId, Hex][]][]) {
    const items: ClosetItem[] = [];
    const byKey = new Map<string, ClosetItem>();
    for (const [id, swatch] of list) {
      if (byId.has(id)) continue;
      const key = GARMENT_KINDS.has(kind) ? itemKey(id) : id;
      let item = byKey.get(key);
      if (!item) byKey.set(key, (item = { key, kind, variants: [] })), items.push(item);
      const variant = { id, swatch, hue: hueOf(swatch), icon: icon(id) };
      item.variants.push(variant);
      byId.set(id, { item, variant });
    }
    byKind.set(kind, items);
  }
  return { items: (kind) => byKind.get(kind) ?? [], find: (id) => (id ? byId.get(id) ?? null : null), colours };
}

const num = (prefix: string, n: number): PartId[] => Array.from({ length: n }, (_, i) => `${prefix}${String(i).padStart(2, '0')}`);
const plain = (ids: PartId[], swatch: Hex): [PartId, Hex][] => ids.map((id) => [id, swatch]);

/** The stand-in closet: every hairstyle, eye and mouth of the dump, the default looks' garments and the art scout's
 *  palette (catalog.md "Curated customization palette"), their swatches judged from its sheets. */
export const stubCloset: Closet = closetFrom({
  hair: plain(num('PlayerHair', 37), '#3b2619'),
  eye: plain(num('PlayerEye', 26), '#3d2416'),
  mouth: plain(num('PlayerMouth', 4), '#c0504d'),
  top: [
    ['TopsTexTopOuterLAran3', '#3f6b45'], ['TopsTexTopOuterLAran1', '#ece2c8'], ['TopsTexTopOuterLSweat1', '#4f7a4a'],
    ['TopsTexTopOuterLArancardigan0', '#c9a77a'], ['TopsTexTopTshirtsLVnecksweater2', '#2a2a2a'],
    ['TopsTexTopYshirtsHPolo7', '#262626'], ['TopsTexTopYshirtsHStandard0', '#f4f4f0'], ['TopsTexTopTshirtsHPocketshirts0', '#f6f6f2']
  ],
  onepiece: [
    ['TopsTexOnepieceAlineHLinen0', '#232323'], ['TopsTexOnepieceAlineHLinen3', '#efe6d2'], ['TopsTexOnepieceBoxLShirt1', '#d9c6a5'],
    ['TopsTexOnepieceBalloonHDolly0', '#f2a9bf'], ['TopsTexOnepieceBalloonHLace7', '#1e1e1e']
  ],
  bottom: [
    ['BottomsTexPantsNormalSlacks0', '#3a3a3e'], ['BottomsTexPantsNormalSlacks6', '#d8d3c6'], ['BottomsTexPantsNormalChino0', '#cdb48d'],
    ['BottomsTexPantsNormalDenim0', '#4c6c9a'], ['BottomsTexPantsNormalDenim3', '#242424'], ['BottomsTexPantsNormalSweat0', '#b9a6d6'],
    ['BottomsTexPantsWideChino1', '#cfb68f'], ['BottomsTexSkirtLongDenim3', '#1f1f1f'], ['BottomsTexSkirtLongPleats4', '#8c8c8c'],
    ['BottomsTexSkirtLongChino0', '#cbb28a'], ['BottomsTexSkirtLongMaone1', '#3b3b3b'], ['BottomsTexSkirtAlineFlare1', '#222222']
  ],
  socks: [
    ['SocksTexDailysocks1', '#222222'], ['SocksTexDailysocks5', '#f4f4f4'], ['SocksTexLine0', '#dfe3ea'], ['SocksTexFootcover6', '#262626']
  ],
  shoes: [
    ['ShoesLowcutRubbertoe7', '#222222'], ['ShoesHighcutRubbertoe7', '#222222'], ['ShoesHighcutRubbertoe0', '#2c3a5c'],
    ['ShoesLowcutLeathersneker0', '#f2f2ee'], ['ShoesLowcutSlipon6', '#ede3cc'], ['ShoesLowcutLoafers1', '#2a2220'], ['ShoesLowcutSuede1', '#3d5a99']
  ],
  glasses: [
    ['AccessoryGlassCircle0', '#4a4a4a'], ['AccessoryGlassCircle3', '#7a5634'], ['AccessoryGlassOval6', '#a0706a'],
    ['AccessoryGlassThurmont0', '#3a2a20'], ['AccessoryGlassOctagon4', '#3d3d3d'], ['AccessoryGlassSquare1', '#2b2b2b']
  ],
  ornament: [['CapOrnamentLRibbon7', '#1d1d1d'], ['CapOrnamentLHearthairpin0', '#e2506a']]
}, {
  hairColor: ['#2f241d', '#2a1b12', '#3b2619', '#6b4129', '#9a6a43', '#c79a5b', '#8d8a86', '#7a3324', '#d99aa5'],
  eyeColor: ['#3d2416', '#5a3a28', '#2b2018', '#7a5a2e', '#4f6378'],
  skin: ['#f9dcc0', '#f6cfa8', '#e8b48a', '#c98e62', '#9a6440', '#6b432b']
});

let current: Closet = stubCloset;
/** The closet the level lists. */
export const closet = (): Closet => current;
/** Swap the closet (the part table's, once it lands). @public */
export function useCloset(c: Closet): void {
  current = c;
}

/** A look with `id` worn as `kind`, by NH's rules: a one-piece clears the bottoms; a bottom clears a one-piece. */
export function wear(look: PlayerLook, kind: ClosetKind, id: PartId | null): PlayerLook {
  const slot = SLOT_OF[kind];
  if (id === null && !OPTIONAL_KINDS.has(kind)) return look;
  const out = { ...look, [slot]: id } as PlayerLook;
  if (slot === 'top' && isOnepiece(id)) out.bottom = null;
  if (slot === 'bottom' && id !== null && isOnepiece(look.top)) out.top = null;
  return out;
}

/** Whether `kind`'s grid holds what `look` wears (a top's grid not when a one-piece is on, and the reverse). */
export function wornIn(look: PlayerLook, kind: ClosetKind): PartId | null {
  const id = look[SLOT_OF[kind]] ?? null;
  if (kind === 'top' && isOnepiece(id)) return null;
  if (kind === 'onepiece' && !isOnepiece(id)) return null;
  return id;
}

/** A swatch for a part (the figure's stand-in colours): its variant's, else `fallback`. */
export const swatchOf = (id: PartId | null | undefined, fallback: Hex): Hex => closet().find(id)?.variant.swatch ?? fallback;
