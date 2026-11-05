// The すがた closet's colours, measured from the part table's own files (npm run look:swatches, after players3d): the part
// table (components/player3d/parts.json) names each item's colour line and textures but no colour, and the closet's dots
// and colour filter need one. Per garment item: its texture's dominant colour (the frame's for glasses, not the lens);
// per catalogue icon: its dominant colour (the tile tints the icon to a variant's colour: ClosetGrid).
// Usage (from app/): node scripts/look-swatches.ts → src/lib/components/look/swatches.json (commit it). Needs dwebp
// (brew install webp). Dominant: the opaque pixels binned at 5 bits a channel, the fullest bin's mean (a knit's cables or
// a shoe's laces don't drag it toward grey as a plain mean would); for an item, only the pixels its own among its line's
// colours (a loafer's black sole, a shirt's buttons are every colour's), and lifted as the island's light lifts the
// texture (gamma 0.85: the textures are albedo, darker than the catalogue's icons).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP = join(import.meta.dirname, '..');
const PARTS = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'player3d', 'parts.json'), 'utf8')) as {
  items: Record<string, { slot: string; line: string; tex: Record<string, { file?: string; glass?: number }>; icon: string | null }>;
};
const OUT = join(APP, 'src', 'lib', 'components', 'look', 'swatches.json');

/** A WebP's RGBA pixels (dwebp's PAM), from row `from` × its height down. */
function pixels(file: string, from = 0): Uint8Array {
  const pam = execFileSync('dwebp', ['-quiet', '-pam', file, '-o', '-'], { maxBuffer: 1 << 26 });
  const end = pam.indexOf('ENDHDR\n');
  const w = Number(/WIDTH (\d+)/.exec(pam.toString('latin1', 0, end))?.[1]);
  const h = Number(/HEIGHT (\d+)/.exec(pam.toString('latin1', 0, end))?.[1]);
  if (end < 0 || !w || !h) throw new Error(`${file}: not a PAM`);
  return new Uint8Array(pam.buffer, pam.byteOffset + end + 7 + Math.floor(h * from) * w * 4);
}

/** Where a slot's colour is on its texture, as the rows from a fraction down: a sock's top is its darker cuff (the
 *  foot below is the colour the catalogue names). */
const FROM: Record<string, number> = { socks: 0.45 };

const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

/** The dominant colour of RGBA pixels (the opaque ones, and only where `keep` says, when given). */
function dominant(px: Uint8Array, keep?: Uint8Array, lift = 1): string {
  const bins = new Map<number, [number, number, number, number]>();
  for (let i = 0; i + 3 < px.length; i += 4) {
    if (px[i + 3] < 128 || (keep && !keep[i >> 2])) continue;
    const k = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
    const b = bins.get(k) ?? [0, 0, 0, 0];
    b[0] += px[i], b[1] += px[i + 1], b[2] += px[i + 2], b[3]++;
    bins.set(k, b);
  }
  let best: [number, number, number, number] | null = null;
  for (const b of bins.values()) if (!best || b[3] > best[3]) best = b;
  if (!best) throw new Error('no opaque pixel');
  const up = (c: number) => 255 * (c / best![3] / 255) ** lift;
  return hex(up(best[0]), up(best[1]), up(best[2]));
}

/** The pixels of variant `v` its own to it: not the same colour (within 24 a channel) in 40% or more of its line's other
 *  colours (a sole black in most colours is the sole; a tube sock's white leg is shared, its stripes aren't). null: one
 *  variant, or under 2% of the texture left. */
function own(all: Uint8Array[], v: number): Uint8Array | null {
  if (all.length < 2 || all.some((p) => p.length !== all[0].length)) return null;
  const n = all[0].length >> 2, keep = new Uint8Array(n), me = all[v], need = (all.length - 1) * 0.4;
  let count = 0;
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    let same = 0;
    for (const p of all)
      if (p !== me && Math.abs(p[i] - me[i]) <= 24 && Math.abs(p[i + 1] - me[i + 1]) <= 24 && Math.abs(p[i + 2] - me[i + 2]) <= 24) same++;
    if (same < need) (keep[j] = 1), count++;
  }
  return count > n * 0.02 ? keep : null;
}

const items: Record<string, string> = {};
const icons: Record<string, string> = {};
const lines = new Map<string, [string, Uint8Array][]>();
for (const [id, it] of Object.entries(PARTS.items)) {
  const tex = Object.values(it.tex).find((t) => t.file && t.glass === undefined) ?? Object.values(it.tex).find((t) => t.file);
  if (tex?.file) {
    const line = lines.get(it.line) ?? [];
    line.push([id, pixels(join(APP, 'static', 'room', 'player', 'tex', tex.file), FROM[it.slot])]);
    lines.set(it.line, line);
  }
  if (it.icon && !(it.icon in icons)) icons[it.icon] = dominant(pixels(join(APP, 'static', 'art', 'finds', 'items', `${it.icon}.webp`)));
}
for (const line of lines.values()) {
  const all = line.map(([, px]) => px);
  line.forEach(([id, px], v) => (items[id] = dominant(px, own(all, v) ?? undefined, 0.85)));
}
const line = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
writeFileSync(OUT, `{\n "_": "scripts/look-swatches.ts: per item its texture's dominant colour, per catalogue icon its own",\n "items": {\n${line(items)}\n },\n "icons": {\n${line(icons)}\n }\n}\n`);
console.log(`${Object.keys(items).length} items, ${Object.keys(icons).length} icons → ${OUT}`);
