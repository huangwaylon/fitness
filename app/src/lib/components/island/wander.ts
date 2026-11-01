// The villagers' own wandering (docs/design.md "Walking"), the pure part: the points of interest a villager wanders to,
// the pick, where a follower stands beside the other and when two are close enough to chat. island/avatar.ts walks
// them; idle life decides when.
import { pickOne } from '#lib/random.ts';
import type { PersonId, WeekView } from '#lib/types.ts';
import { RING_FRUITS } from '#lib/config/rules.ts';
import { todayPct } from './progress.ts';
import { HOMES } from './world.ts';
import { walkable, type Pt, type WalkGeo } from './walkGraph.ts';

/** My villager away this long (ms) and the partner comes over. */
export const FOLLOW_MS = 8000;
/** Closer than this (u, feet to feet), two villagers standing still chat. */
const ADJACENT_U = 64;
/** Linger at a point of interest (ms) before the next or home; an outing is 1–3 of them. */
export const POI_LINGER: readonly [number, number] = [3000, 5000];
export const MAX_HOPS = 3;

export type PoiKind = 'tree' | 'rock' | 'shore' | 'stage' | 'spot' | 'seat' | 'bar';
export interface Poi { name: string; at: Pt; kind: PoiKind }

/** The fixed points of interest (walkGraph nodes): beside and behind the trees, the rock, the shore (stares at the
 *  sea), centre stage. Extra nodes a later layout adds (a pondside) are points of interest too. */
const BASE_POIS: Record<string, PoiKind> = {
  treeA: 'tree', treeB: 'tree', outA: 'tree', outB: 'tree', backA: 'spot', backB: 'spot', rock: 'rock',
  shoreL: 'shore', shoreC: 'shore', shoreR: 'shore', centreStage: 'stage',
  seatMaeL: 'seat', seatMaeR: 'seat', seatPondL: 'seat', seatPondR: 'seat', stoolW: 'seat', stoolE: 'seat', pullup: 'bar'
};
const FIXED = new Set(['homeA', 'homeB', 'midA', 'midB', 'centre', 'stairS', 'stairN', 'riverEast', 'riverBend', 'mouth', 'clifftop', ...Object.keys(BASE_POIS)]);

/** How far from home a villager wanders on its own (u). */
const POI_RANGE = 600;

/** Where a villager may wander now (within POI_RANGE of `home`, when given). With a visitor on the island, centre stage
 *  (a visitor's spot) and the shore in front of it are left to them. Doors aren't points of interest. */
export function pois(g: WalkGeo, visitor: boolean, home?: Pt): Poi[] {
  const out: Poi[] = [];
  for (const [name, at] of Object.entries(g.nodes)) {
    const kind = BASE_POIS[name] ?? (FIXED.has(name) || name.startsWith('door-') ? null : 'spot');
    if (!kind) continue;
    if (home && Math.hypot(at[0] - home[0], at[1] - home[1]) > POI_RANGE) continue;
    if (visitor && (name === 'centreStage' || name === 'shoreC')) continue;
    if (walkable(g, at[0], at[1])) out.push({ name, at, kind });
  }
  return out;
}

/** A point of interest to wander to: any of `list` not where it already stands (30u), at random. */
export function pickPoi(list: readonly Poi[], from: Pt, rnd: () => number): Poi | null {
  const far = list.filter((p) => Math.hypot(p.at[0] - from[0], p.at[1] - from[1]) > 30);
  return far.length ? pickOne(far, rnd) : null;
}

/** Side by side with a villager standing at `at`: beside it on either side (the side nearer `from` first), else just
 *  in front. */
export function besideSpots(g: WalkGeo, at: Pt, from: Pt): Pt[] {
  const s = from[0] <= at[0] ? -1 : 1;
  return ([[s * 40, 0], [-s * 40, 0], [s * 52, -6], [-s * 52, -6], [s * 30, -22], [-s * 30, -22]] as const)
    .map(([dx, dy]) => [Math.round(at[0] + dx), Math.round(at[1] + dy)] as Pt)
    .filter(([x, y]) => walkable(g, x, y));
}

export const adjacent = (a: Pt, b: Pt): boolean => Math.hypot(a[0] - b[0], a[1] - b[1]) < ADJACENT_U;

/** Follow my villager: it has been away FOLLOW_MS and the partner is free (home, awake, not busy). */
export const shouldFollow = (awaySince: number, now: number, partnerFree: boolean): boolean =>
  awaySince > 0 && now - awaySince >= FOLLOW_MS && partnerFree;

/** The two meet in the middle of the lawn for ふたりでぜんぶ's high-five: a step apart either side of the island's
 *  middle, between their homes and the trees (A on the left, B on the right, as their homes). */
export const MEET: { A: Pt; B: Pt } = {
  A: [175, HOMES.A[1] + 48],
  B: [215, HOMES.B[1] + 48]
};

const allMet = (v: WeekView, pid: PersonId) => RING_FRUITS.every((f) => todayPct(v.people[pid].rings[f]) >= 100);

/** What the villagers do about goals between two views: both people all four for the first time (ふたりでぜんぶ) → they
 *  meet in the middle; else a fruit newly met → that person's villager walks to their tree (mine first). */
export function goalMoves(p: WeekView, v: WeekView): { meet: boolean; walk: 'mine' | 'partner' | null } {
  const both = (w: WeekView) => allMet(w, w.me) && allMet(w, w.partner);
  if (both(v) && !both(p)) return { meet: true, walk: null };
  for (const who of ['mine', 'partner'] as const) {
    const pid = who === 'mine' ? v.me : v.partner;
    if (RING_FRUITS.some((f) => todayPct(v.people[pid].rings[f]) >= 100 && todayPct(p.people[pid].rings[f]) < 100)) return { meet: false, walk: who };
  }
  return { meet: false, walk: null };
}
