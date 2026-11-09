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

export { partName, planHome } from '../packPlan.ts';

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
