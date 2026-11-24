// The river path editor's core (docs/island-layout.md "The river tool"), pure: the main river as a few control points
// (knots) the editor's 川の道 drags, and back to tiles. The record stays the river's tiles (chunk ops, as a brush
// stroke's): knots live in the tool only, derived from the tiles each time it opens (pathOf), so a phone on an older
// build, the partner's and the 3D island (river.ts: the round turns, the falls, the fish) all read the new river with
// no new field. A segment between two knots the user didn't move keeps its tiles verbatim; a moved one is the
// straight line between its knots, rasterised 4-connected (route; river.ts rounds the turns as it draws). The rules (red blocks the save, amber is
// a note) are the level designer's: downhill only, a fall straight down its cliff, off cliff edges, never touching
// itself or other water but at its ends, never through a fixed thing. applyPath paints it: the old tiles back to land,
// the new ones river at their own tier (cliffs never change), what stood in the way moved aside (resolve.ts
// clearTile), the bridges re-placed across the new water. The 3D island and the world never import this (the editor's
// chunk only).
import { GRID, codeOf, idx, kindOf, onGrid, tierOf, type Kind } from './grid.ts';
import { footOf, objTiles, originOf, withChanges, type Layout, type Obj } from './model.ts';
import { kindDef } from './catalog.ts';
import { doorOf } from './model.ts';
import { clearTile } from './resolve.ts';
import { carryTops } from './tops.ts';

/** A control point: a tile's middle, from the start (the source) to the end (the mouth); a fall's two tiles pinned. */
export interface Knot {
  c: number;
  r: number;
  pin?: 'fall';
}
/** The river as the tool holds it: its knots, its tiles from the start to the end (grid indices), and each knot's
 *  tile index (seg[k]: where segment k, knot k to knot k+1, begins). */
export interface RiverPath {
  knots: Knot[];
  tiles: number[];
  seg: number[];
}
type IssueKind = 'end' | 'start' | 'uphill' | 'fall' | 'cliff-edge' | 'self' | 'water' | 'blocked' | 'length' | 'moved' | 'bridge' | 'fish-mouth' | 'fish-cliff';
export interface RiverIssue {
  kind: IssueKind;
  level: 'red' | 'amber';
  tiles: number[];
  ids: string[];
  ja: string;
}
export interface Routed extends RiverPath {
  issues: RiverIssue[];
}
export interface Applied {
  layout: Layout;
  /** Things moved out of the way (id → its new tile), the bridges re-placed (id → tile and facing). */
  moved: { id: string; k: string; x: number; z: number }[];
  bridges: { id: string; x: number; z: number; f: Obj['f'] }[];
  issues: RiverIssue[];
}

/** The river's length (tiles). */
const MIN_LEN = 4;
const MAX_LEN = 120;
/** Douglas-Peucker's tolerance (tiles), a line's sample step (tiles). */
const DP_TOL = 0.6;
const STEP = 0.25;
/** How far the end looks for an outlet (tiles), and the start for a pond. */
const END_PULL = 2;
const START_PULL = 1;

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const cOf = (i: number) => i % GRID.cols;
const rOf = (i: number) => Math.floor(i / GRID.cols);
const kindAt = (l: Layout, c: number, r: number): Kind => (onGrid(c, r) ? kindOf(l.codes[idx(c, r)]) : 'sea');
const tierAt = (l: Layout, c: number, r: number): number => (onGrid(c, r) ? tierOf(l.codes[idx(c, r)]) : 0);
const adj4 = (a: number, b: number) => Math.abs(cOf(a) - cOf(b)) + Math.abs(rOf(a) - rOf(b)) === 1;
const LAND_FILL: Kind[] = ['grass', 'sand', 'dirt'];

// ---- tiles → knots --------------------------------------------------------------------------------------------------

/** The main river's tiles (the largest 4-connected piece of river, across tiers; the first found on a tie). */
function mainRiver(l: Layout): number[] {
  const seen = new Uint8Array(GRID.cols * GRID.rows);
  let best: number[] = [];
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || kindOf(l.codes[i]) !== 'river') continue;
    const part = [i];
    seen[i] = 1;
    for (let h = 0; h < part.length; h++)
      for (const [dc, dr] of N4) {
        const c = cOf(part[h]) + dc, r = rOf(part[h]) + dr;
        if (!onGrid(c, r) || seen[idx(c, r)] || kindOf(l.codes[idx(c, r)]) !== 'river') continue;
        seen[idx(c, r)] = 1;
        part.push(idx(c, r));
      }
    if (part.length > best.length) best = part;
  }
  return best;
}

/** The main river as a path: its outlet (by the sea, else into a pond, else its lowest tile), its far end the start,
 *  down the distances to the outlet keeping straight (river.ts stemOf's walk); its knots by Douglas-Peucker, both ends
 *  and both tiles of every fall kept. Null: no river of two tiles or more. */
export function pathOf(l: Layout): RiverPath | null {
  const comp = mainRiver(l);
  if (comp.length < 2) return null;
  const inComp = new Set(comp);
  const touches = (i: number, p: (c: number, r: number) => boolean) => N4.some(([dc, dr]) => p(cOf(i) + dc, rOf(i) + dr));
  let ends = comp.filter((i) => touches(i, (c, r) => kindAt(l, c, r) === 'sea'));
  if (!ends.length) ends = comp.filter((i) => touches(i, (c, r) => kindAt(l, c, r) === 'pond' && tierAt(l, c, r) <= tierOf(l.codes[i])));
  if (!ends.length) ends = [comp.reduce((a, b) => (tierOf(l.codes[b]) < tierOf(l.codes[a]) || (tierOf(l.codes[b]) === tierOf(l.codes[a]) && b < a) ? b : a))];
  ends.sort((a, b) => a - b);
  const dist = new Map<number, number>(ends.map((i) => [i, 0]));
  const q = [...ends];
  for (let h = 0; h < q.length; h++)
    for (const [dc, dr] of N4) {
      const c = cOf(q[h]) + dc, r = rOf(q[h]) + dr, k = idx(c, r);
      if (onGrid(c, r) && inComp.has(k) && !dist.has(k)) {
        dist.set(k, dist.get(q[h])! + 1);
        q.push(k);
      }
    }
  let far = q[0];
  for (const i of q) if (dist.get(i)! > dist.get(far)!) far = i;
  const tiles = [far];
  let dir: readonly [number, number] = [0, 0];
  while (dist.get(tiles.at(-1)!)! > 0) {
    const at = tiles.at(-1)!, d = dist.get(at)!;
    const steps = N4.filter(([dc, dr]) => onGrid(cOf(at) + dc, rOf(at) + dr) && dist.get(idx(cOf(at) + dc, rOf(at) + dr)) === d - 1);
    const s = steps.find(([dc, dr]) => dc === dir[0] && dr === dir[1]) ?? steps[0];
    dir = s;
    tiles.push(idx(cOf(at) + s[0], rOf(at) + s[1]));
  }
  return { ...knotsOf(l, tiles), tiles };
}

/** A tile path's knots: both ends, both tiles of every fall (pinned), and Douglas-Peucker's between them. */
function knotsOf(l: Layout, tiles: readonly number[]): { knots: Knot[]; seg: number[] } {
  const keep = new Set<number>([0, tiles.length - 1]);
  const pins = new Set<number>();
  for (let i = 0; i < tiles.length - 1; i++)
    if (tierOf(l.codes[tiles[i + 1]]) !== tierOf(l.codes[tiles[i]])) {
      keep.add(i).add(i + 1);
      pins.add(i).add(i + 1);
    }
  const fixed = [...keep].sort((a, b) => a - b);
  for (let k = 0; k < fixed.length - 1; k++) dp(fixed[k], fixed[k + 1]);
  function dp(a: number, b: number): void {
    if (b - a < 2) return;
    const ax = cOf(tiles[a]), ay = rOf(tiles[a]), bx = cOf(tiles[b]), by = rOf(tiles[b]);
    const L = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1, wd = DP_TOL;
    for (let i = a + 1; i < b; i++) {
      const x = cOf(tiles[i]), y = rOf(tiles[i]);
      const d = Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / L;
      if (d > wd) (wd = d), (worst = i);
    }
    if (worst < 0) return;
    keep.add(worst);
    dp(a, worst);
    dp(worst, b);
  }
  const seg = [...keep].sort((a, b) => a - b);
  return { seg, knots: seg.map((i) => ({ c: cOf(tiles[i]), r: rOf(tiles[i]), ...(pins.has(i) ? { pin: 'fall' as const } : {}) })) };
}

// ---- knots → tiles --------------------------------------------------------------------------------------------------

type P = [number, number];
/** The tiles the straight line from tile a to tile b crosses, 4-connected (a diagonal step takes the corner nearer the
 *  line: a 45° run a staircase, river.ts's straight diagonal), a and b included. */
function rasterise(a: P, b: P): number[] {
  const out = [idx(a[0], a[1])];
  let c = a[0], r = a[1];
  const toward = (tc: number, tr: number, p: P) => {
    while (c !== tc || r !== tr) {
      const sc = Math.sign(tc - c), sr = Math.sign(tr - r);
      if (sc && sr) {
        // the corner nearer the curve's point
        const dA = Math.hypot(c + sc - p[0], r - p[1]), dB = Math.hypot(c - p[0], r + sr - p[1]);
        if (dA <= dB) c += sc;
        else r += sr;
      } else if (sc) c += sc;
      else r += sr;
      out.push(idx(c, r));
    }
  };
  const m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP));
  for (let s = 1; s <= m; s++) {
    const p: P = [a[0] + ((b[0] - a[0]) * s) / m, a[1] + ((b[1] - a[1]) * s) / m];
    toward(Math.round(p[0]), Math.round(p[1]), p);
  }
  return out;
}

/** A path's tiles tidied: a loop (a tile met again) cut back to its first visit, and a one-tile detour (a tile four
 *  steps on beside one) cut short; each knot's mark goes to the tile kept where its own went. */
function tidy(tiles: number[], marks: number[]): { tiles: number[]; marks: number[] } {
  let t = [...tiles], m = [...marks];
  for (let changed = true; changed; ) {
    changed = false;
    const outT: number[] = [], outM: number[] = [], at = new Map<number, number>();
    for (let i = 0; i < t.length; i++) {
      const was = at.get(t[i]);
      if (was !== undefined) {
        // (a loop: back to the first visit; the knots inside it marked there)
        for (let k = outT.length - 1; k > was; k--) {
          at.delete(outT[k]);
          if (outM[k] >= 0 && outM[was] < 0) outM[was] = outM[k];
        }
        outT.length = outM.length = was + 1;
        if (m[i] >= 0 && outM[was] < 0) outM[was] = m[i];
        changed = true;
        continue;
      }
      at.set(t[i], outT.length);
      outT.push(t[i]);
      outM.push(m[i]);
    }
    t = outT;
    m = outM;
    for (let i = 0; i + 3 < t.length; i++)
      if (adj4(t[i], t[i + 3]) && m[i + 1] < 0 && m[i + 2] < 0) {
        t.splice(i + 1, 2);
        m.splice(i + 1, 2);
        changed = true;
        break;
      }
  }
  return { tiles: t, marks: m };
}

/** The knots' path over the island: a segment whose two knots `base` has side by side keeps base's tiles; any other the
 *  straight line between them (rasterise; into and out of a fall a tile straight across its cliff first), river.ts
 *  rounding its turns as it draws; then the checks (riverIssues). Straight, not a spline (the design's Catmull-Rom): a
 *  spline bowed a long straight run a tile off its column beside a short segment (the default's, into the sea), and
 *  the drawn water is round at every turn anyway. */
export function route(knots: readonly Knot[], base: RiverPath | null, l: Layout, was: RiverPath | null = base): Routed {
  const ks = knots.filter((k, i) => i === 0 || k.c !== knots[i - 1].c || k.r !== knots[i - 1].r);
  if (!ks.length) return { knots: [], tiles: [], seg: [], issues: [lengthIssue([])] };
  const pts: P[] = ks.map((k) => [k.c, k.r]);
  const n = pts.length;
  const tiles: number[] = [idx(pts[0][0], pts[0][1])], marks: number[] = [0];
  const fallStep = (k: number): P | null => {
    // a fall's two pinned knots side by side: its direction (from the upper to the lower)
    const a = ks[k], b = ks[k + 1];
    return a?.pin && b?.pin && Math.abs(a.c - b.c) + Math.abs(a.r - b.r) === 1 ? [b.c - a.c, b.r - a.r] : null;
  };
  for (let k = 0; k < n - 1; k++) {
    const a = ks[k], b = ks[k + 1];
    let part: number[] | null = null;
    if (base) {
      const j = base.knots.findIndex((q, i) => i < base.knots.length - 1 && q.c === a.c && q.r === a.r && base.knots[i + 1].c === b.c && base.knots[i + 1].r === b.r);
      if (j >= 0) part = base.tiles.slice(base.seg[j], base.seg[j + 1] + 1);
    }
    if (!part) {
      // in from a fall below its lower knot, out to one above its upper: a tile straight across the cliff first
      const out = k > 0 ? fallStep(k - 1) : null, into = fallStep(k + 1);
      let A: P = pts[k], B: P = pts[k + 1];
      const pre: number[] = [], post: number[] = [];
      if (out && Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]) > 1) {
        pre.push(idx(A[0], A[1]));
        A = [A[0] + out[0], A[1] + out[1]];
      }
      if (into && Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]) > 1) {
        post.push(idx(B[0], B[1]));
        B = [B[0] - into[0], B[1] - into[1]];
      }
      part = [...pre, ...rasterise(A, B), ...post];
    }
    for (let i = 1; i < part.length; i++) {
      tiles.push(part[i]);
      marks.push(i === part.length - 1 ? k + 1 : -1);
    }
  }
  const t = tidy(tiles, marks);
  const seg: number[] = [];
  for (let k = 0; k < n; k++) {
    const i = t.marks.indexOf(k);
    seg.push(i >= 0 ? i : (seg.at(-1) ?? 0));
  }
  const path: RiverPath = { knots: ks.map((k) => ({ ...k })), tiles: t.tiles, seg };
  return { ...path, issues: riverIssues(l, was, path) };
}

// ---- the rules ------------------------------------------------------------------------------------------------------

const lengthIssue = (tiles: number[]): RiverIssue => ({ kind: 'length', level: 'red', tiles, ids: [], ja: `川は${MIN_LEN}〜${MAX_LEN}マスで陸の上に` });

/** The tiles an object keeps clear: a home's, a building's and a front's door tiles, stairs' foot and top. */
function keptTiles(l: Layout, o: Obj): [number, number][] {
  const def = kindDef(o.k);
  if (o.k === 'home' || def?.door || def?.front) return doorOf(l, o).tiles;
  if (o.k === 'stairs') {
    const [w, d] = footOf(l, o), out: [number, number][] = [];
    if (o.f % 2 === 0) for (let i = 0; i < w; i++) out.push([o.x + i, o.z - 1], [o.x + i, o.z + d]);
    else for (let j = 0; j < d; j++) out.push([o.x - 1, o.z + j], [o.x + w, o.z + j]);
    return out;
  }
  return [];
}
/** Whether an object holds its ground (the river goes round it): the catalogue's fixed, stairs, a field. */
const holds = (o: Obj): boolean => !!kindDef(o.k)?.fixed || o.k === 'stairs' || o.k === 'field';

/** The river's own tiles once painted: the path, and the old river's tiles off it still joined to a tile of the old
 *  path it keeps (a broad mouth, a stub: kept as they are). */
function keptExtras(l: Layout, was: RiverPath | null, now: Set<number>): Set<number> {
  const out = new Set<number>();
  if (!was) return out;
  const comp = mainRiver(l), oldPath = new Set(was.tiles);
  const extra = new Set(comp.filter((i) => !oldPath.has(i)));
  const q = was.tiles.filter((i) => now.has(i));
  for (let h = 0; h < q.length; h++)
    for (const [dc, dr] of N4) {
      const c = cOf(q[h]) + dc, r = rOf(q[h]) + dr, k = idx(c, r);
      if (onGrid(c, r) && extra.has(k) && !out.has(k) && !now.has(k)) {
        out.add(k);
        q.push(k);
      }
    }
  return out;
}

/** The checks on a path over the island (`was`: the river as it is, its tiles about to go). */
function riverIssues(l: Layout, was: RiverPath | null, p: RiverPath): RiverIssue[] {
  const out: RiverIssue[] = [];
  const add = (kind: IssueKind, level: RiverIssue['level'], tiles: number[], ja: string, ids: string[] = []) => out.push({ kind, level, tiles: [...new Set(tiles)], ids, ja });
  const T = p.tiles, n = T.length;
  if (n < MIN_LEN || n > MAX_LEN || T.some((i) => kindAt(l, cOf(i), rOf(i)) === 'sea')) add('length', 'red', T.filter((i) => n < MIN_LEN || n > MAX_LEN || kindAt(l, cOf(i), rOf(i)) === 'sea'), lengthIssue([]).ja);
  if (!n) return out;
  const on = new Set(T);
  const extras = keptExtras(l, was, on);
  const oldRiver = new Set([...(was?.tiles ?? []), ...mainRiver(l)]);
  const tier = (i: number) => tierAt(l, cOf(i), rOf(i));
  const kind = (c: number, r: number): Kind => {
    const k = idx(c, r);
    if (onGrid(c, r) && on.has(k)) return 'river';
    if (onGrid(c, r) && extras.has(k)) return 'river';
    // (the old river's tiles off the new path go back to land)
    if (onGrid(c, r) && oldRiver.has(k)) return 'grass';
    return kindAt(l, c, r);
  };
  // pond objects' water
  const pondObj = new Set<number>();
  for (const o of l.objects.values()) if (o.k === 'pond') for (const [c, r] of objTiles(l, o)) if (onGrid(c, r)) pondObj.add(idx(c, r));
  const nb = (i: number) => N4.map(([dc, dr]) => [cOf(i) + dc, rOf(i) + dr] as P);
  // 1. its ends: the end by the tier-0 sea or a painted pond no higher; the start not by the sea
  const end = T[n - 1], start = T[0];
  const endSea = tier(end) === 0 && nb(end).some(([c, r]) => kind(c, r) === 'sea');
  const endPond = nb(end).some(([c, r]) => kind(c, r) === 'pond' && tierAt(l, c, r) <= tier(end));
  if (!endSea && !endPond) add('end', 'red', [end], '終わりは海か池につないでください');
  if (n > 1 && nb(start).some(([c, r]) => kind(c, r) === 'sea')) add('start', 'red', [start], '始まりが海に触れています');
  // 2. downhill only; a fall straight down its cliff (the tile above, the fall, the tile below in a line, the cliff
  // straight across it)
  const up: number[] = [], bent: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = tier(T[i]), b = tier(T[i + 1]);
    if (b > a) up.push(T[i], T[i + 1]);
    if (b >= a) continue;
    const dc = cOf(T[i + 1]) - cOf(T[i]), dr = rOf(T[i + 1]) - rOf(T[i]);
    const inLine = (j: number) => j >= 0 && j + 1 < n && cOf(T[j + 1]) - cOf(T[j]) === dc && rOf(T[j + 1]) - rOf(T[j]) === dr;
    const square = [-1, 1].every((s) => tierAt(l, cOf(T[i]) + dr * s, rOf(T[i]) + dc * s) === a && tierAt(l, cOf(T[i + 1]) + dr * s, rOf(T[i + 1]) + dc * s) === b);
    if (!inLine(i - 1) || !inLine(i + 1) || !square) bent.push(T[Math.max(0, i - 1)], T[i], T[i + 1], T[Math.min(n - 1, i + 2)]);
  }
  if (up.length) add('uphill', 'red', up, '川が上り坂になっています（下る向きにだけ流れます）');
  if (bent.length) add('fall', 'red', bent, '滝はまっすぐ崖を下る');
  // 3. off cliff edges: an upper tile by lower land only at its own fall
  const edge: number[] = [];
  T.forEach((i, j) => {
    for (const [c, r] of nb(i)) {
      if (!onGrid(c, r) || tierAt(l, c, r) >= tier(i)) continue;
      const k = idx(c, r);
      if (k === T[j + 1] || k === T[j - 1]) continue;
      const nk = kind(c, r);
      if (nk !== 'sea' && nk !== 'river' && nk !== 'pond') edge.push(i);
    }
  });
  if (edge.length) add('cliff-edge', 'red', edge, '川が崖の縁に触れています');
  // 4. never touching itself (one tile wide, one stem): no tile within one (diagonals too) of one 3+ steps away
  const self: number[] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 3; j < n; j++)
      if (Math.max(Math.abs(cOf(T[i]) - cOf(T[j])), Math.abs(rOf(T[i]) - rOf(T[j]))) <= 1) self.push(T[i], T[j]);
  if (self.length) add('self', 'red', self, '川が自分に触れています（1マス空けてください）');
  // 5. no other water by it but at its ends: the sea, a pond (painted or put down), another river
  const wet: number[] = [];
  T.forEach((i, j) => {
    if (kindAt(l, cOf(i), rOf(i)) === 'pond' || pondObj.has(i)) wet.push(i);
    if (j === n - 1) return;
    for (const [c, r] of nb(i)) {
      if (!onGrid(c, r) && j > 0) {
        wet.push(i);
        continue;
      }
      const k = idx(c, r), nk = kind(c, r);
      if (on.has(k) || extras.has(k)) continue;
      // (the start's spring: a pond)
      if (j === 0 && (nk === 'pond' || pondObj.has(k))) continue;
      if (nk === 'sea' || nk === 'river' || nk === 'pond' || pondObj.has(k)) wet.push(i);
    }
  });
  if (wet.length) add('water', 'red', wet, '川の途中が海・池・ほかの川に触れています');
  // 6. never through a thing that holds its ground (a home, the museum, a goal tree, stairs, a field, a door's tiles)
  const blocked: number[] = [], who: string[] = [];
  let what = '';
  for (const o of l.objects.values()) {
    if (!holds(o) && !keptTiles(l, o).length) continue;
    const hit = [...(holds(o) ? objTiles(l, o) : []), ...keptTiles(l, o)].filter(([c, r]) => onGrid(c, r) && on.has(idx(c, r)));
    if (!hit.length) continue;
    blocked.push(...hit.map(([c, r]) => idx(c, r)));
    who.push(o.id);
    what ||= o.k === 'home' ? '家' : (kindDef(o.k)?.ja ?? '物');
  }
  if (blocked.length) add('blocked', 'red', blocked, `${what}${who.length > 1 ? 'など' : ''}の上は通れない`, who);
  // amber: what stands in the way moves aside
  const moving = displaced(l, on);
  if (moving.length) add('moved', 'amber', moving.flatMap((o) => objTiles(l, o).filter(([c, r]) => onGrid(c, r) && on.has(idx(c, r))).map(([c, r]) => idx(c, r))), `${moving.length}個の物を動かします`, moving.map((o) => o.id));
  // amber: the fish that need a mouth or a fall the river had
  if (was?.tiles.length) {
    const wEnd = was.tiles.at(-1)!;
    const wasSea = N4.some(([dc, dr]) => kindAt(l, cOf(wEnd) + dc, rOf(wEnd) + dr) === 'sea');
    if (wasSea && !endSea && endPond) add('fish-mouth', 'amber', [end], '河口の魚（サケ・チョウザメ等）がいなくなります');
    const falls = (q: readonly number[]) => q.some((i, j) => j > 0 && tier(q[j - 1]) > tier(i));
    if (falls(was.tiles) && !falls(T)) add('fish-cliff', 'amber', [start], '崖の上の魚（イワナ等）がいなくなります');
  }
  return out;
}

/** The things on the path's tiles that move aside: not those that hold their ground, a bridge (re-placed) nor what's
 *  on a table's top (it goes with its table). */
function displaced(l: Layout, on: ReadonlySet<number>): Obj[] {
  const out: Obj[] = [];
  for (const o of l.objects.values()) {
    if (holds(o) || o.k === 'bridge' || o.on) continue;
    if (objTiles(l, o).some(([c, r]) => onGrid(c, r) && on.has(idx(c, r)))) out.push(o);
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---- painting it ----------------------------------------------------------------------------------------------------

/** The kind an old river tile goes back to: the commonest of grass, sand and dirt among its four neighbours (grass on
 *  a tie or none). */
function fillKind(l: Layout, i: number, gone: ReadonlySet<number>): Kind {
  const n = new Map<Kind, number>();
  for (const [dc, dr] of N4) {
    const c = cOf(i) + dc, r = rOf(i) + dr;
    if (!onGrid(c, r) || gone.has(idx(c, r))) continue;
    const k = kindAt(l, c, r);
    if (LAND_FILL.includes(k)) n.set(k, (n.get(k) ?? 0) + 1);
  }
  let best: Kind = 'grass', bn = 0;
  for (const k of LAND_FILL) if ((n.get(k) ?? 0) > bn) (best = k), (bn = n.get(k)!);
  return best;
}

/**
 * The island with the river on `routed`'s tiles (a new Layout: nav's, riverOf's and the ground's caches are keyed by
 * it): the old river's tiles off it back to land (fillKind; a broad mouth or a stub still joined to a kept tile stays),
 * the new ones river at their own tier, what stood on them moved to its nearest clear tile (resolve.ts clearTile: red
 * when there's none), each bridge that crossed the old river re-placed across the new one (amber when it can't be).
 * The same river gives the same tiles back.
 */
export function applyPath(l: Layout, was: RiverPath | null, routed: RiverPath & { issues?: RiverIssue[] }): Applied {
  const on = new Set(routed.tiles);
  const extras = keptExtras(l, was, on);
  const gone = new Set<number>();
  for (const i of [...(was?.tiles ?? []), ...mainRiver(l)]) if (!on.has(i) && !extras.has(i)) gone.add(i);
  const tiles: [number, number, number][] = [];
  for (const i of [...gone].sort((a, b) => a - b)) tiles.push([cOf(i), rOf(i), codeOf(fillKind(l, i, gone), tierOf(l.codes[i]))]);
  for (const i of routed.tiles) {
    if (kindOf(l.codes[i]) === 'river') continue;
    tiles.push([cOf(i), rOf(i), codeOf('river', kindOf(l.codes[i]) === 'sea' ? 0 : tierOf(l.codes[i]))]);
  }
  const issues = [...(routed.issues ?? [])].filter((i) => i.kind !== 'moved');
  let next = tiles.length ? withChanges(l, { tiles }) : withChanges(l, {});
  // what stood in the way, to its nearest clear tile (one at a time, each on the island as the last left it)
  const moved: Applied['moved'] = [], stuck: string[] = [], stuckTiles: number[] = [];
  for (const o of displaced(l, on)) {
    const to = clearTile(next, o.id);
    if (!to) {
      stuck.push(o.id);
      stuckTiles.push(...objTiles(l, o).filter(([c, r]) => onGrid(c, r) && on.has(idx(c, r))).map(([c, r]) => idx(c, r)));
      continue;
    }
    const cur = next.objects.get(o.id)!;
    next = withChanges(next, { set: [{ ...cur, x: to[0], z: to[1], n: undefined }] });
    moved.push({ id: o.id, k: o.k, x: to[0], z: to[1] });
  }
  if (moved.length) issues.push({ kind: 'moved', level: 'amber', tiles: moved.map((m) => idx(m.x, m.z)), ids: moved.map((m) => m.id), ja: `${moved.length}個の物を動かします` });
  if (stuck.length) issues.push({ kind: 'moved', level: 'red', tiles: stuckTiles, ids: stuck, ja: '動かす場所がない物があります' });
  // the bridges that crossed the old river, across the new one
  const bridges: Applied['bridges'] = [], homeless: string[] = [], homelessTiles: number[] = [];
  const oldOn = new Set(was?.tiles ?? []);
  for (const o of [...l.objects.values()].filter((b) => b.k === 'bridge').sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const covered = objTiles(l, o).filter(([c, r]) => onGrid(c, r) && oldOn.has(idx(c, r)));
    if (!covered.length) continue;
    if (bridgeOk(next, o)) continue;
    const at = bridgeSpot(next, routed, o, bridges);
    if (!at) {
      homeless.push(o.id);
      homelessTiles.push(...objTiles(l, o).filter(([c, r]) => onGrid(c, r)).map(([c, r]) => idx(c, r)));
      continue;
    }
    next = withChanges(next, { set: [{ ...next.objects.get(o.id)!, ...at, n: undefined }] });
    bridges.push({ id: o.id, ...at });
  }
  if (homeless.length) issues.push({ kind: 'bridge', level: 'amber', tiles: homelessTiles, ids: homeless, ja: '橋の置き場がない' });
  // (what's on a table's top goes with its table)
  next = carryTops(l, next);
  return { layout: next, moved, bridges, issues };
}

/** Whether a bridge stands right on this island: water under its middle, its two ends on land of one tier. */
function bridgeOk(l: Layout, o: Obj): boolean {
  const [w, d] = footOf(l, o), [x0, z0] = originOf(l, o);
  const ends: P[] = o.f % 2 ? [[x0, z0], [x0 + w - 1, z0]] : [[x0, z0], [x0, z0 + d - 1]];
  const wet = (c: number, r: number) => ['river', 'pond', 'sea'].includes(kindAt(l, c, r));
  const mid = objTiles(l, o).filter(([c, r]) => !ends.some(([ec, er]) => ec === c && er === r));
  return mid.some(([c, r]) => wet(c, r)) && !ends.some(([c, r]) => wet(c, r) || kindAt(l, c, r) === 'sea') && tierAt(l, ends[0][0], ends[0][1]) === tierAt(l, ends[1][0], ends[1][1]);
}

/** A bridge's new place across the path: a tile on a straight run (the tiles before and after it in line), two or more
 *  from either end and from a fall, its deck's ends land of one tier with nothing solid on them, not by a bridge put
 *  already; turned across the flow; the nearest its old middle, then the first down the path. */
function bridgeSpot(l: Layout, p: RiverPath, o: Obj, placed: readonly { x: number; z: number }[]): { x: number; z: number; f: Obj['f'] } | null {
  const T = p.tiles, n = T.length;
  const [w, d] = footOf(l, o), [ox, oz] = originOf(l, o);
  const mx = ox + (w - 1) / 2, mz = oz + (d - 1) / 2;
  const tier = (i: number) => tierOf(l.codes[i]);
  let best: { x: number; z: number; f: Obj['f'] } | null = null, bd = Infinity;
  for (let i = 2; i < n - 2; i++) {
    const dc = cOf(T[i + 1]) - cOf(T[i]), dr = rOf(T[i + 1]) - rOf(T[i]);
    if (cOf(T[i]) - cOf(T[i - 1]) !== dc || rOf(T[i]) - rOf(T[i - 1]) !== dr) continue;
    if ([-2, -1, 0, 1].some((k) => tier(T[i + k]) !== tier(T[i + k + 1]))) continue;
    const c = cOf(T[i]), r = rOf(T[i]);
    // across the flow: a flow along x spans z (f 0 or 2), along z spans x (f 1 or 3), the old facing's way kept
    const f: Obj['f'] = dc !== 0 ? (o.f % 2 === 0 ? o.f : 0) : o.f % 2 === 1 ? o.f : 1;
    const ends: P[] = dc !== 0 ? [[c, r - 1], [c, r + 1]] : [[c - 1, r], [c + 1, r]];
    const t0 = tierAt(l, c, r);
    if (!ends.every(([ec, er]) => onGrid(ec, er) && !['river', 'pond', 'sea'].includes(kindAt(l, ec, er)) && tierAt(l, ec, er) === t0)) continue;
    if (ends.some(([ec, er]) => [...l.objects.values()].some((q) => q.id !== o.id && (kindDef(q.k)?.block || q.k === 'stairs' || q.k === 'bridge') && objTiles(l, q).some(([qc, qr]) => qc === ec && qr === er)))) continue;
    if (placed.some((b) => Math.abs(b.x - c) + Math.abs(b.z - r) <= 3)) continue;
    const x = dc !== 0 ? c : c - 1, z = dc !== 0 ? r - 1 : r;
    const dist = Math.hypot(c - mx, r - mz);
    if (dist < bd - 1e-9) (bd = dist), (best = { x, z, f });
  }
  return best;
}

// ---- the handles' pull ----------------------------------------------------------------------------------------------

/** Whether tile (c, r) may be the end: land (or the old river) by the tier-0 sea at tier 0, or by a painted pond no
 *  higher. */
function outletAt(l: Layout, c: number, r: number, river: ReadonlySet<number>): boolean {
  if (!onGrid(c, r)) return false;
  const k = kindAt(l, c, r), t = tierAt(l, c, r);
  if (k === 'sea' || k === 'pond' || (k === 'river' && !river.has(idx(c, r)))) return false;
  return N4.some(([dc, dr]) => {
    const nk = kindAt(l, c + dc, r + dr);
    return (nk === 'sea' && t === 0) || (nk === 'pond' && tierAt(l, c + dc, r + dr) <= t);
  });
}

/** Where the end handle lands near tile (c, r): there if it's an outlet, else the nearest outlet within END_PULL
 *  tiles (the sea's coast, a pond's edge), else (c, r). */
export function pullEnd(l: Layout, c: number, r: number, was: RiverPath | null = null): [number, number] {
  return pull(l, c, r, END_PULL, (cc, rr, river) => outletAt(l, cc, rr, river), was);
}
/** Where the start handle lands near tile (c, r): by a pond within START_PULL tiles (that pond the spring), else
 *  (c, r). */
export function pullStart(l: Layout, c: number, r: number, was: RiverPath | null = null): [number, number] {
  return pull(l, c, r, START_PULL, (cc, rr, river) => {
    const k = kindAt(l, cc, rr);
    if (!onGrid(cc, rr) || k === 'sea' || k === 'pond' || (k === 'river' && !river.has(idx(cc, rr)))) return false;
    return N4.some(([dc, dr]) => kindAt(l, cc + dc, rr + dr) === 'pond');
  }, was);
}
function pull(l: Layout, c: number, r: number, reach: number, ok: (c: number, r: number, river: ReadonlySet<number>) => boolean, was: RiverPath | null): [number, number] {
  const river = new Set([...(was?.tiles ?? []), ...mainRiver(l)]);
  if (ok(c, r, river)) return [c, r];
  let best: [number, number] | null = null, bd = Infinity;
  for (let dr = -reach; dr <= reach; dr++)
    for (let dc = -reach; dc <= reach; dc++) {
      const d = Math.hypot(dc, dr);
      if (d < bd - 1e-9 && ok(c + dc, r + dr, river)) (bd = d), (best = [c + dc, r + dr]);
    }
  return best ?? [c, r];
}
