// Two phones' edits of different objects can land on one tile (each op fine alone, the merge commutative: E13 of the
// sync review): when the partner's ops land, the phone whose op is the later of a clashing pair moves its own piece to
// the nearest tile where it stands clear, as a normal op (store/layout.svelte.ts), and the earlier stays. Both phones
// order two ops alike (their `at`, then who: contract/layout.ts's order), so only one of them moves, and its new tile
// is clear on the island as merged then: nothing ping-pongs. Pure.
import { kindDef } from './catalog.ts';
import { objTiles, withChanges, type Layout, type Obj } from './model.ts';
import { isWater } from './grid.ts';
import { overlap, validate, type Issue } from './validate.ts';

/** How far (tiles, ring by ring) a piece looks for a clear tile, and how many candidates get the full check. */
const RINGS = 8;
const CHECKS = 8;

/** The objects `o` overlaps (validate's rule). */
export function clashesWith(l: Layout, o: Obj): Obj[] {
  const out: Obj[] = [];
  for (const b of l.objects.values()) if (b.id !== o.id && overlap(l, o, b)) out.push(b);
  return out;
}

const key = (i: Issue): string => `${i.code}|${[...i.ids].sort().join(',')}`;
const errors = (l: Layout): Set<string> => new Set(validate(l).filter((i) => i.level === 'error').map(key));

/**
 * The nearest tile (x, z) where `id` stands clear of everything else: on land of one tier, out of the water, on grass
 * when it belongs there, overlapping nothing, and making no error the island doesn't have without it (a door, K.K.'s
 * front, a way blocked). Rings outwards, the same order on every phone; null when none is near (or it's a bridge or
 * stairs: those fit one place only).
 */
export function clearTile(l: Layout, id: string): [number, number] | null {
  const o = l.objects.get(id), def = o && kindDef(o.k);
  if (!o || !def || o.k === 'bridge' || o.k === 'stairs') return null;
  let base: Set<string> | null = null;
  let checked = 0;
  for (let r = 1; r <= RINGS; r++) {
    const ring: [number, number][] = [];
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dz)) === r) ring.push([dx, dz]);
    ring.sort((a, b) => a[0] ** 2 + a[1] ** 2 - (b[0] ** 2 + b[1] ** 2) || a[1] - b[1] || a[0] - b[0]);
    for (const [dx, dz] of ring) {
      const at: Obj = { ...o, x: o.x + dx, z: o.z + dz };
      if (at.x < 0 || at.z < 0) continue;
      const tiles = objTiles(l, at);
      if (tiles.some(([c, rr]) => isWater(l.kind(c, rr)))) continue;
      if (new Set(tiles.map(([c, rr]) => l.tier(c, rr))).size > 1) continue;
      if (def.on === 'grass' && tiles.some(([c, rr]) => l.kind(c, rr) !== 'grass')) continue;
      const next = withChanges(l, { set: [at] });
      if (clashesWith(next, at).length) continue;
      base ??= errors(withChanges(l, { remove: [id] }));
      const now = errors(next);
      if ([...now].every((e) => base!.has(e))) return [at.x, at.z];
      if (++checked >= CHECKS) return null;
    }
  }
  return null;
}
