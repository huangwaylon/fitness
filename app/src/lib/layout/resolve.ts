// Two phones' edits of different objects can land on one tile (each op fine alone, the merge commutative: E13 of the
// sync review), or block a door between them (a piece put by a home's, the museum's or K.K.'s front tile while the other
// phone turns or moves the building to face it: round 2): when the partner's ops land, the phone whose op is the later
// of a clashing pair moves its own piece to the nearest tile where it stands clear, as a normal op
// (store/layout.svelte.ts), and the earlier stays. Both phones order two ops alike (their `at`, then who:
// contract/layout.ts's order), so only one of them moves, and its new tile is clear on the island as merged then:
// nothing ping-pongs. Pure.
import type { LayoutEntry } from '#lib/contract/layout.ts';
import type { Who } from '#lib/contract/live-protocol.ts';
import { kindDef } from './catalog.ts';
import { doorOf, objTiles, withChanges, type Layout, type Obj } from './model.ts';
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
function clearTile(l: Layout, id: string): [number, number] | null {
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

/** How near a door's tiles (tiles, either way) a piece is looked at as one that may block it. */
const DOOR_NEAR = 2;

/**
 * The pairs (my piece, a landed one of theirs) that block a door between them on `l` (validate's `door`: a home's, a
 * building's, a front like K.K.'s): the door's own building is one of the pair, or a piece near the door whose removal
 * clears it is; an error neither of a pair is in (the island had it, or another piece makes it) is nobody's here.
 */
function doorPairs(l: Layout, theirs: readonly string[], mine: readonly string[]): { mine: string; theirs: string }[] {
  if (!theirs.length || !mine.length) return [];
  // (the full check only when one of theirs is a door's or stands near one: a partner's burst elsewhere costs nothing)
  const owners = [...l.objects.values()].filter((o) => o.k === 'home' || kindDef(o.k)?.door || kindDef(o.k)?.front);
  const close = (o: Obj, tiles: [number, number][]) => objTiles(l, o).some(([c, r]) => tiles.some(([x, z]) => Math.max(Math.abs(c - x), Math.abs(r - z)) <= DOOR_NEAR));
  const by = (id: string) => {
    const o = l.objects.get(id);
    return !!o && owners.some((b) => b.id === id || close(o, [...doorOf(l, b).tiles, ...objTiles(l, b)]));
  };
  if (!theirs.some(by)) return [];
  const doors = validate(l).filter((i) => i.level === 'error' && i.code === 'door');
  const out: { mine: string; theirs: string }[] = [];
  for (const d of doors) {
    const k = key(d), at = d.ids[0];
    const near = (id: string): boolean => {
      const o = l.objects.get(id);
      return !!o && close(o, d.tiles);
    };
    const cause = new Map<string, boolean>();
    const blocks = (id: string): boolean => {
      if (id === at) return true;
      if (!near(id)) return false;
      if (!cause.has(id)) cause.set(id, !errors(withChanges(l, { remove: [id] })).has(k));
      return cause.get(id)!;
    };
    const ts = theirs.filter(blocks);
    if (!ts.length) continue;
    for (const m of mine) if (blocks(m)) for (const r of ts) if (r !== m) out.push({ mine: m, theirs: r });
  }
  return out;
}

/** Whether entry `a` is the later of two (contract/layout.ts's order: `at`, then who). */
const later = (a: LayoutEntry, b: LayoutEntry): boolean => a.at > b.at || (a.at === b.at && a.who > b.who);

/**
 * What `me` moves now the partner's pieces `landed` (their ids) are on the island `l` as merged (`entries`: each id's
 * winning op): each piece of mine that overlaps one of them, or blocks a door with one of them, my op the later of the
 * pair, to its nearest clear tile (clearTile). Never the guest's (the outdoors is the members'). Both phones run it on
 * the same island and only the later op's owner moves anything.
 */
export function resolveMoves(l: Layout, entries: ReadonlyMap<string, LayoutEntry>, landed: readonly string[], me: Who | null): { id: string; to: [number, number] }[] {
  if (!me || me === 'G' || !landed.length) return [];
  const entry = (id: string) => {
    const e = entries.get(`o|${id}`);
    return e && e.sc === 'o' && !e.rm ? e : null;
  };
  const isMine = (id: string) => entry(id)?.who === me;
  const theirs = landed.filter((id) => l.objects.has(id) && entry(id) && !isMine(id));
  if (!theirs.length) return [];
  const pairs: { mine: string; theirs: string }[] = [];
  for (const rid of theirs) for (const m of clashesWith(l, l.objects.get(rid)!)) if (isMine(m.id)) pairs.push({ mine: m.id, theirs: rid });
  pairs.push(...doorPairs(l, theirs, [...l.objects.keys()].filter(isMine)));
  const out: { id: string; to: [number, number] }[] = [];
  let now = l;
  for (const p of pairs) {
    if (out.some((o) => o.id === p.mine) || !later(entry(p.mine)!, entry(p.theirs)!)) continue;
    const to = clearTile(now, p.mine);
    if (!to) continue;
    out.push({ id: p.mine, to });
    now = withChanges(now, { set: [{ ...now.objects.get(p.mine)!, x: to[0], z: to[1], n: undefined }] });
  }
  return out;
}
