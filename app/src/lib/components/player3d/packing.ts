// The players' parts in packs (scripts/player-packs.ts writes them; parts.ts reads them): every file the part table
// names (and the KTX2 beside a texture the bundled table lists) in one of a few dozen packs under static/room/player/,
// `<home>.<hash>.pak`, where there were ~5,200 loose files (Pages caps a deploy at 20,000: lib/static-budget.ts). A pack
// is world3d/ktx2Pack.ts's container (its files' paths in its head: a pack alone says what's in it). Homes:
//   everyday   the body and both いつもの looks (contract/look.ts DEFAULT_LOOKS), as drawn (a texture's KTX2 where it
//              has one): fetched whole as a player is first drawn, ~330 KB
//   face, hair the eyes', mouths' and blushes' atlases; the hairstyles and their under-a-hat cuts
//   <slot>     the first closet's garments of a slot (top, bottom, socks, shoes, glasses, ornament, hat: the bundled
//              table's, what the closet lists and a saved コーデ wears), by id (a line's colours together), each with
//              its shape where it's the first to wear it
//   more-<slot> the rest of the slot's (the whole table's only: worn only by a look naming one)
//   webp       the WebPs of the textures with a KTX2 (drawn only where there's no GPU format, or its worker failed)
// each split past its bound (homeMax) as stably as can be (lib/packPlan.ts planHome): a changed part changes its own
// pack only. On Pages a part's Range comes back as its whole pack (lib/packStore.ts): the closet's packs are small (a
// first wear of a garment and a hairstyle ~0.5 MB at most), the rest's large (fewer files). Pure: no files here (the
// script and the tests read them).
import { DEFAULT_LOOKS, isOnepiece, type PlayerLook } from '../../contract/look.ts';
import type { At, PartTable, Placed } from './parts.ts';

/** A pack's bound (bytes): the closet's (and the faces', the hairstyles'), and the rest's. */
const PACK_MAX = 256_000;
const MORE_MAX = 1_200_000;
export const EVERYDAY = 'everyday';
const WEBP = 'webp';
/** A home's bound (the everyday pack's: one, fetched whole). */
export const homeMax = (home: string): number => (home.startsWith('more-') || home === WEBP || home === EVERYDAY ? MORE_MAX : PACK_MAX);
/** A pack's file name (`<home>-<k>.<hash>.pak`). */
export const packFile = (stem: string): string => `${stem}.pak`;

/** A WebP texture's KTX2 (`face/x.webp` → `face/x.ktx2`). */
export const ktx2Of = (path: string): string => path.replace(/\.webp$/, '.ktx2');

/** Every file `t` names, its path under room/player/ and its spec (`at` set on it; a texture's KTX2 `k`), in the table's
 *  order: the body, the blushes and faces, the meshes, the items' textures. */
export function tableFiles(t: PartTable): { path: string; spec: Placed; tex: boolean }[] {
  const out: { path: string; spec: Placed; tex: boolean }[] = [{ path: 'body.glb', spec: t.body, tex: false }];
  t.cheek.forEach((c, i) => out.push({ path: `face/cheek${i}.webp`, spec: c, tex: true }));
  for (const [id, f] of Object.entries(t.face)) {
    out.push({ path: `face/${id}.webp`, spec: f, tex: true });
    if (f.iris) out.push({ path: `face/${id}.iris.webp`, spec: f.iris, tex: true });
  }
  for (const [k, m] of Object.entries(t.mesh)) out.push({ path: `mesh/${k}.glb`, spec: m, tex: false });
  for (const it of Object.values(t.items)) for (const x of Object.values(it.tex)) if (x.file) out.push({ path: `tex/${x.file}`, spec: x, tex: true });
  return out;
}

/** A look's files (paths: a texture's WebP), as player3d.ts partFiles draws it. */
export function lookPaths(look: PlayerLook, t: PartTable): string[] {
  const out = ['body.glb', `face/${look.eye}.webp`, `face/${look.mouth}.webp`, `face/cheek${look.cheek}.webp`];
  if (t.face[look.eye]?.iris) out.push(`face/${look.eye}.iris.webp`);
  const h = t.hair[look.hair];
  if (h) out.push(`mesh/${look.hat && h.cap ? h.cap : h.mesh}.glb`);
  for (const k of ['top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament', 'hat'] as const) {
    const it = look[k] ? t.items[look[k]!] : null;
    if (!it || (k === 'bottom' && isOnepiece(look.top))) continue;
    if (it.mesh) out.push(`mesh/${it.mesh}.glb`);
    for (const x of Object.values(it.tex)) if (x.file) out.push(`tex/${x.file}`);
  }
  return out;
}

/** Each file's home, in its home's order (`t` the whole table, `closet` the bundled one's items; `has`: whether a file
 *  is there to pack, a KTX2 among them): home → paths. */
export function homes(t: PartTable, closet: ReadonlySet<string>, has: (path: string) => boolean): Map<string, string[]> {
  const out = new Map<string, string[]>(), placed = new Set<string>();
  const add = (home: string, path: string) => {
    if (placed.has(path) || !has(path)) return;
    placed.add(path);
    if (!out.has(home)) out.set(home, []);
    out.get(home)!.push(path);
  };
  /** A texture as drawn (its KTX2 where it has one: its WebP goes to `webp`), or a mesh. */
  const drawn = (home: string, path: string) => {
    if (path.endsWith('.webp') && has(ktx2Of(path))) {
      add(home, ktx2Of(path));
      add(WEBP, path);
    } else add(home, path);
  };
  for (const look of Object.values(DEFAULT_LOOKS)) for (const p of lookPaths(look, t)) drawn(EVERYDAY, p);
  add(EVERYDAY, 'body.glb');
  t.cheek.forEach((_, i) => drawn('face', `face/cheek${i}.webp`));
  for (const [id, f] of Object.entries(t.face).sort(([a], [b]) => a.localeCompare(b))) {
    drawn('face', `face/${id}.webp`);
    if (f.iris) drawn('face', `face/${id}.iris.webp`);
  }
  for (const id of Object.keys(t.hair).sort()) {
    const h = t.hair[id];
    add('hair', `mesh/${h.mesh}.glb`);
    if (h.cap) add('hair', `mesh/${h.cap}.glb`);
  }
  const items = Object.entries(t.items).sort(([a], [b]) => a.localeCompare(b));
  for (const first of [true, false])
    for (const [id, it] of items) {
      if (closet.has(id) !== first) continue;
      const home = first ? it.slot : `more-${it.slot}`;
      if (it.mesh) add(home, `mesh/${it.mesh}.glb`);
      for (const x of Object.values(it.tex)) if (x.file) drawn(home, `tex/${x.file}`);
    }
  // (a mesh no item or hairstyle wears: kept, in the hair's)
  for (const k of Object.keys(t.mesh).sort()) add('hair', `mesh/${k}.glb`);
  return out;
}

/** `t` with each file's place (`places`: path → [the pack's stem, offset, bytes]; a texture's KTX2's as its `k`), the
 *  packs' stems sorted (`packs`), the everyday pack's index; a file with no place loses its `at` (and `k`). A copy. */
export function placeTable(t: PartTable, places: ReadonlyMap<string, readonly [string, number, number]>): PartTable {
  const out = structuredClone(t);
  const stems = [...new Set([...places.values()].map(([s]) => s))].sort();
  const index = new Map(stems.map((s, i) => [s, i]));
  const at = (path: string): At | undefined => {
    const p = places.get(path);
    return p ? [index.get(p[0])!, p[1], p[2]] : undefined;
  };
  for (const { path, spec, tex } of tableFiles(out)) {
    delete spec.at;
    delete spec.k;
    const a = at(path), k = tex ? at(ktx2Of(path)) : undefined;
    if (a) spec.at = a;
    if (k) spec.k = k;
  }
  out.packs = stems;
  const every = stems.findIndex((s) => s.startsWith(`${EVERYDAY}.`));
  if (every >= 0) out.everyday = every;
  else delete out.everyday;
  return out;
}
