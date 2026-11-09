// ききみみ's audio packs (docs/kikimimi-engine.md "Loading", "Audio"): every finished clip (mono AAC m4a,
// whole, as the audio script makes it) concatenated into a few files under static/audio/listen/, `<pack>.<hash>.pak`,
// one file per pack where there were hundreds of loose clips (Cloudflare Pages caps a deploy at 20,000 files). A clip
// has one home: its level's pack (`lv4`), the ladders' (`ladder`) or its unit's (`u-<unit>`), and its slow take the
// home's slow pack (`lv1-slow`); a home past PACK_MAX (SLOW_PACK_MAX) is split into parts (`lv4`, `lv4-2`, …).
// packs.json (scripts/kikimimi-packs.ts writes it; compile.ts reads it) names each pack's hash and its clips' offsets
// and lengths; the compiled chunks carry each clip's (compile.ts), and the phone fetches a pack whole and slices it
// (components/kikimimi/packs.ts). Pure: no files here (the script and the tests read them).

/** A pack's bound (bytes): a normal home past it is split. */
export const PACK_MAX = 1_200_000;
/** A slow pack's bound (bytes; the 🐢 takes are fetched only when asked for). */
export const SLOW_PACK_MAX = 800_000;
/** A まるごと 聞く file's pack's bound (bytes): its pieces are fetched as slices, a piece's run of lines at once
 *  (components/kikimimi/packs.ts), so a file is one pack (static/ is near its file cap). */
export const LONG_PACK_MAX = 8_000_000;

/** packs.json's entry for a pack: its content hash (8 hex, of the file), whether it holds slow takes, and its clips
 *  in file order: id, offset, bytes. */
export interface PackEntry {
  hash: string;
  slow?: true;
  clips: [id: string, offset: number, bytes: number][];
}
export type Packs = Record<string, PackEntry>;

/** A pack's file name under static/audio/listen/ (its stem, `<pack>.<hash>`, is what the chunks name). */
const packStem = (name: string, e: Pick<PackEntry, 'hash'>): string => `${name}.${e.hash}`;
export const packFile = (name: string, e: Pick<PackEntry, 'hash'>): string => `${packStem(name, e)}.pak`;

/** A home's k-th part's name (1-based): the home's own name for the first. */
export const partName = (home: string, k: number): string => (k === 1 ? home : `${home}-${k}`);

/** A clip to pack: its id and length (bytes). */
export interface PackClip {
  id: string;
  bytes: number;
}

/**
 * A home's clips (in its order) into parts of at most `max` bytes, as stably as it can: each part of the last plan
 * (`prev`, part name → ids) keeps its clips still in the home, in its order, while they fit; what's new (or no longer
 * fits) goes into the last part with room, else a new one. So a changed clip changes its own part only, a new one the
 * last part only, and the other parts keep their bytes and hash (the phones' caches keep them). A clip over `max`
 * alone gets a part of its own. Empty parts drop out (the later ones renumbered). Returns part name → ids.
 */
export function planHome(home: string, clips: readonly PackClip[], max: number, prev: Readonly<Record<string, readonly string[]>> = {}): Map<string, string[]> {
  const size = new Map(clips.map((c) => [c.id, c.bytes]));
  const placed = new Set<string>();
  const parts: { ids: string[]; bytes: number }[] = [];
  for (let k = 1; prev[partName(home, k)]; k++) {
    const part = { ids: [] as string[], bytes: 0 };
    for (const id of prev[partName(home, k)]) {
      const n = size.get(id);
      if (n === undefined || placed.has(id) || (part.ids.length && part.bytes + n > max)) continue;
      part.ids.push(id);
      part.bytes += n;
      placed.add(id);
    }
    if (part.ids.length) parts.push(part);
  }
  for (const { id, bytes } of clips) {
    if (placed.has(id)) continue;
    let last = parts.at(-1);
    if (!last || (last.ids.length && last.bytes + bytes > max)) parts.push((last = { ids: [], bytes: 0 }));
    last.ids.push(id);
    last.bytes += bytes;
    placed.add(id);
  }
  return new Map(parts.map((p, i) => [partName(home, i + 1), p.ids]));
}

/** Where a clip is in its pack: the pack's stem (`lv4-2.1a2b3c4d`), offset and bytes. */
export type PackRef = readonly [stem: string, offset: number, bytes: number];

/** Every clip's place (normal and slow) from packs.json. */
export function clipPlaces(packs: Readonly<Packs>): { normal: Map<string, PackRef>; slow: Map<string, PackRef> } {
  const normal = new Map<string, PackRef>(), slow = new Map<string, PackRef>();
  for (const [name, e] of Object.entries(packs)) {
    const stem = packStem(name, e);
    for (const [id, offset, bytes] of e.clips) (e.slow ? slow : normal).set(id, [stem, offset, bytes]);
  }
  return { normal, slow };
}
