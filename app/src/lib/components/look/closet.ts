// The closet behind せってい → すがた (design/avatar/customization.md §3): what the grid lists, as one small interface, so
// the level doesn't care where the parts come from. The closet is the part table's (components/player3d/parts.json, the
// 3D engineer's pipeline: every hairstyle, eye and mouth and each garment's colour line, with its catalogue icon) and its
// colours as measured from the parts' own textures (the table's `sw` per item and `icons`: the pipeline's); a bigger table (the
// pipeline's --all) is the same code. The wear rules (a one-piece clears the bottoms, a bottom clears a one-piece) are
// here too, pure.
import { isOnepiece, type Hex, type PartId, type PlayerLook } from '#lib/contract/look.ts';
import { artUrl } from '#lib/art.ts';
import PARTS from '../player3d/parts.json' with { type: 'json' };

/** A grid of parts: a face part, the hair, or a garment (tops and one-pieces are both the `top` slot). */
export type ClosetKind = 'eye' | 'mouth' | 'hair' | 'top' | 'onepiece' | 'bottom' | 'socks' | 'shoes' | 'hat' | 'glasses' | 'ornament';
/** The look's slot each kind wears into. */
const SLOT_OF = {
  eye: 'eye', mouth: 'mouth', hair: 'hair', top: 'top', onepiece: 'top', bottom: 'bottom',
  socks: 'socks', shoes: 'shoes', hat: 'hat', glasses: 'glasses', ornament: 'ornament'
} as const satisfies Record<ClosetKind, keyof PlayerLook>;
/** The kinds that may be left off (a なし tile first). */
export const OPTIONAL_KINDS: ReadonlySet<ClosetKind> = new Set(['socks', 'shoes', 'hat', 'glasses', 'ornament']);
/** The kinds with colour variants and the colour filter (the garments; a face part or hair is its one shape). */
export const GARMENT_KINDS: ReadonlySet<ClosetKind> = new Set(['top', 'onepiece', 'bottom', 'socks', 'shoes', 'hat', 'glasses', 'ornament']);

/** The colour filter's buckets, in the row's order (すべて first: no bucket). */
export const HUES = ['red', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'white', 'black'] as const;
export type Hue = (typeof HUES)[number];

/** One colour variant of an item: its part id, a swatch (the dot), its hue bucket, its icon (a URL; null: none) and how
 *  the icon is tinted to its colour (null: the icon is this colour already; else the grey icon's brightness factor
 *  before the swatch multiplies it: ClosetGrid). */
export interface Variant { id: PartId; swatch: Hex; hue: Hue; icon: string | null; tint: number | null }
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

const rgb = (hex: Hex): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** A colour's bucket for the filter: its hue, or white / black / brown by lightness and saturation. */
export function hueOf(hex: Hex): Hue {
  const [r, g, b] = rgb(hex);
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

/** An item's key: its variant's id without the trailing colour digits (`TopsTexTopOuterLAran3` → `…Aran`), the part
 *  table's colour line. */
export const itemKey = (id: PartId): string => id.replace(/\d+$/, '');

/** A colour's grey as CSS grayscale() makes it (Rec. 709 weights). */
const grey = (hex: Hex) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const dist = (a: Hex, b: Hex) => {
  const [x, y] = [rgb(a), rgb(b)];
  return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
};

/** One entry of a closet: a part id, its swatch, and its line's catalogue icon (a URL) with the icon's own colour. */
export interface Entry { id: PartId; swatch: Hex; icon?: { url: string; colour: Hex } | null }

/**
 * A closet from a list of kinds and their entries. Garments group by colour line (itemKey), a face part or hairstyle
 * is a tile of its own. An item's icon is its line's (the catalogue has one per item, drawn in one of its colours): the
 * variant nearest the icon's colour shows it as it is, the others tint it (grey, brightened so its main colour reads
 * near white, times the swatch).
 */
export function closetFrom(parts: Partial<Record<ClosetKind, Entry[]>>, colours: Closet['colours']): Closet {
  const byKind = new Map<ClosetKind, ClosetItem[]>();
  const byId = new Map<PartId, { item: ClosetItem; variant: Variant }>();
  for (const [kind, list] of Object.entries(parts) as [ClosetKind, Entry[]][]) {
    const items: ClosetItem[] = [];
    const icons = new Map<ClosetItem, NonNullable<Entry['icon']>>();
    const byKey = new Map<string, ClosetItem>();
    for (const e of list) {
      if (byId.has(e.id)) continue;
      const key = GARMENT_KINDS.has(kind) ? itemKey(e.id) : e.id;
      let item = byKey.get(key);
      if (!item) {
        byKey.set(key, (item = { key, kind, variants: [] }));
        items.push(item);
        if (e.icon) icons.set(item, e.icon);
      }
      const variant: Variant = { id: e.id, swatch: e.swatch, hue: hueOf(e.swatch), icon: icons.get(item)?.url ?? null, tint: null };
      item.variants.push(variant);
      byId.set(e.id, { item, variant });
    }
    for (const [item, icon] of icons) {
      const own = item.variants.reduce((a, v) => (dist(v.swatch, icon.colour) < dist(a.swatch, icon.colour) ? v : a));
      const k = Math.round(Math.min(4, Math.max(1, 0.94 / Math.max(grey(icon.colour), 0.01))) * 100) / 100;
      for (const v of item.variants) v.tint = v === own ? null : k;
    }
    byKind.set(kind, items);
  }
  return { items: (kind) => byKind.get(kind) ?? [], find: (id) => (id ? byId.get(id) ?? null : null), colours };
}

/** The part table's shape, as far as the closet reads it. */
interface Table {
  face: Record<string, unknown>;
  hair: Record<string, unknown>;
  items: Record<string, { slot: string; onepiece?: boolean; icon: string | null; sw?: string }>;
  icons?: Record<string, string>;
}
/** The measured colours (the part table's): per item, per catalogue icon. */
interface Swatches { items: Record<string, Hex>; icons: Record<string, Hex> }
/** The kind of a part table item by its slot (a `top` that's a one-piece has its own grid). */
const KIND_OF: Record<string, ClosetKind> = {
  top: 'top', bottom: 'bottom', socks: 'socks', shoes: 'shoes', hat: 'hat', glasses: 'glasses', ornament: 'ornament'
};

/** The closet of a part table and its measured colours: every hairstyle, eye and mouth, and every garment in the
 *  table's order, grouped by line. An item without a measured colour isn't listed. */
function tableCloset(table: Table, swatches: Swatches): Closet {
  const parts: Partial<Record<ClosetKind, Entry[]>> = { hair: [], eye: [], mouth: [] };
  for (const id of Object.keys(table.hair)) parts.hair!.push({ id, swatch: HAIR });
  for (const id of Object.keys(table.face)) {
    if (id.startsWith('PlayerEye')) parts.eye!.push({ id, swatch: INK });
    else if (id.startsWith('PlayerMouth')) parts.mouth!.push({ id, swatch: INK });
  }
  for (const [id, it] of Object.entries(table.items)) {
    const kind = it.onepiece ? 'onepiece' : KIND_OF[it.slot];
    const swatch = swatches.items[id];
    if (!kind || !swatch) continue;
    const url = it.icon ? artUrl(`finds/items/${it.icon}`) : null;
    const colour = it.icon ? swatches.icons[it.icon] : undefined;
    (parts[kind] ??= []).push({ id, swatch, icon: url && colour ? { url, colour } : null });
  }
  return closetFrom(parts, COLOURS);
}

const HAIR = '#3b2619';
const INK = '#3d2416';
/** The hair, eye and skin swatches (the art scout's palette, design/avatar/catalog.md). */
const COLOURS: Closet['colours'] = {
  hairColor: ['#2f241d', '#2a1b12', '#3b2619', '#6b4129', '#9a6a43', '#c79a5b', '#8d8a86', '#7a3324', '#d99aa5'],
  eyeColor: ['#3d2416', '#5a3a28', '#2b2018', '#7a5a2e', '#4f6378'],
  skin: ['#f9dcc0', '#f6cfa8', '#e8b48a', '#c98e62', '#9a6440', '#6b432b']
};

let current: Closet | null = null;
/** The closet the level lists: the part table's, unless another was set (useCloset). */
const swatchesOf = (t: Table): Swatches => ({
  items: Object.fromEntries(Object.entries(t.items).flatMap(([id, it]) => (it.sw ? [[id, it.sw]] : []))), icons: t.icons ?? {}
});
export const closet = (): Closet => (current ??= tableCloset(PARTS as Table, swatchesOf(PARTS as Table)));
/** Swap the closet (a test's; null: back to the part table's). @public */
export function useCloset(c: Closet | null): void {
  current = c;
}

/** A look with `id` worn as `kind`, by NH's rules: a one-piece clears the bottoms; a bottom clears a one-piece; a hat
 *  and a hair ornament are both headwear, one at a time (a hat puts the hair under it: NH's cut where the style has one). */
export function wear(look: PlayerLook, kind: ClosetKind, id: PartId | null): PlayerLook {
  const slot = SLOT_OF[kind];
  if (id === null && !OPTIONAL_KINDS.has(kind)) return look;
  const out = { ...look, [slot]: id } as PlayerLook;
  if (slot === 'top' && isOnepiece(id)) out.bottom = null;
  if (slot === 'bottom' && id !== null && isOnepiece(look.top)) out.top = null;
  if (slot === 'hat' && id !== null) out.ornament = null;
  if (slot === 'ornament' && id !== null && out.hat) out.hat = null;
  return out;
}

/** Whether `kind`'s grid holds what `look` wears (a top's grid not when a one-piece is on, and the reverse). */
export function wornIn(look: PlayerLook, kind: ClosetKind): PartId | null {
  const id = look[SLOT_OF[kind]] ?? null;
  if (kind === 'top' && isOnepiece(id)) return null;
  if (kind === 'onepiece' && !isOnepiece(id)) return null;
  return id;
}

