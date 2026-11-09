// Files into packs of a bounded size, as stably as can be (ききみみ's audio: kikimimi/packing.ts; the players' parts:
// player3d/packing.ts): a pack whose files didn't change keeps its bytes, name and hash, so the phones' caches keep it.
// Pure.

/** A home's k-th part's name (1-based): the home's own name for the first. */
export const partName = (home: string, k: number): string => (k === 1 ? home : `${home}-${k}`);

/** A file to pack: its id and length (bytes). */
export interface PackClip {
  id: string;
  bytes: number;
}

/**
 * A home's files (in its order) into parts of at most `max` bytes, as stably as it can: each part of the last plan
 * (`prev`, part name → ids) keeps its files still in the home, in its order, while they fit; what's new (or no longer
 * fits) goes into the last part with room, else a new one. So a changed file changes its own part only, a new one the
 * last part only, and the other parts keep their bytes and hash (the phones' caches keep them). A file over `max`
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
