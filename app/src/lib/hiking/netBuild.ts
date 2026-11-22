// トレイル's reference trails, the build (docs/hiking.md "Reference trails"): an Overpass answer (OpenStreetMap's paths,
// guideposts, peaks, huts around a trail) and the trail's track into its net file (net.ts). Pure: scripts/hiking-net.ts
// fetches and writes, the tests run it on fixtures.
//
//  1. The ways split into edges at the nodes they share (and their ends).
//  2. The route's corridor: each 5 m of the route claims the nearest edge running along it within CORRIDOR_M; an
//     edge's claimed stretches are the route's, the rest kept (a path 10 m beside the route stays when another edge is
//     the route; a crossing stays; a switchback's legs are each their own leg's).
//  3. Forks on the full network, nothing taken away yet: a node (or nodes within FORK_MERGE_M of each other) where
//     ≥ 3 ends of path|track|steps|footway edges meet, within FORK_M of the route. Each time the route passes it (an
//     out-and-back twice; a switchback's other leg going by is not a pass) its distance, its bearing in and the branch
//     it takes. The branches: the route's own directions from its geometry (line -1; the claimed edges there give
//     their names) and every other edge out of the node, each with its bearing BEARING_M out and a label (the way's
//     name, else the next named peak, hut or guidepost along it; a route's own way, the next peak, saddle, hut or
//     shelter before any guidepost, and never a guidepost naming where that way comes from: the trail's start or goal
//     behind it, a peak or hut passed).
//  4. What's left: joined back by way, clipped to KEEP_M of the track (roads, which Overpass gives within 150 m,
//     ROAD_KEEP_M), Douglas–Peucker at 5 m, 5 decimals.
import { prepare } from './track.ts';
import { trackHash, type LonLat, type NetBranch, type NetFile, type NetFork, type NetLine, type NetPoi, type PoiKind } from './net.ts';
import type { TrackFile } from './types.ts';
import { M_LAT, mLon } from './flat.ts';

/** The ways that make forks, and those drawn besides (bridleway; roads near the track for the valley approaches). */
export const TRAIL_KINDS = ['path', 'footway', 'track', 'steps'] as const;
export const OTHER_KINDS = ['bridleway'] as const;
export const ROAD_KINDS = ['unclassified', 'service', 'residential', 'tertiary', 'living_street'] as const;
const TRAILS = new Set<string>(TRAIL_KINDS);
const KINDS = new Set<string>([...TRAIL_KINDS, ...OTHER_KINDS, ...ROAD_KINDS]);
const ROADS = new Set<string>(ROAD_KINDS);

/** A fork's node within this of the route (m). */
const FORK_M = 25;
/** Fork nodes this close together are one fork (a staggered junction). */
const FORK_MERGE_M = 15;
/** A branch's bearing is to its point this far out (R1: 20–30 m). */
const BEARING_M = 25;
/** The route's corridor (R5: 20–25 m). */
const CORRIDOR_M = 22;
/** Along the route means within this of its bearing (either way). */
const PARALLEL_DEG = 35;
/** The route sampled this often for its claims. */
const STEP_M = 5;
/** A claim covers this either side along its edge (the samples' spacing and a slanted projection). */
const CLAIM_HALF_M = 10;
/** An edge out of a fork is the route's when claimed this far from the fork. */
const BRANCH_CLAIM_M = 50;
/** A leftover stub between claimed stretches shorter than this goes too. */
const STUB_M = 15;
/** Lines drawn within this of the track (m); roads within ROAD_KEEP_M. */
const KEEP_M = 1000;
export const ROAD_KEEP_M = 150;
/** A branch reaching less than this (a dead end: a hut's door, a viewpoint) makes no fork; it is still drawn. */
const SPUR_M = 80;
/** Two passes of a fork closer than this along the route are a switchback's legs unless about as near. */
const PASS_APART_M = 300;
const PASS_NEAR_M = 8;
/** …and only when it is clearly on another path itself: a pass this near the fork is the fork's (a short summit spur's
 *  way back down, the GPS a few metres off it). */
const PASS_OWN_M = 12;
/** A pass this close to the route's ends is no decision (the trailhead). */
const END_M = 20;
/** A label is looked for this far along a branch, and a POI within this of its line. */
const LABEL_REACH_M = 3000;
const POI_NEAR_M = 30;
/** Douglas–Peucker's tolerance. */
const DP_M = 5;

// ── Overpass's answer (out geom; POIs out center) ──
interface OsmTags { [k: string]: string | undefined }
export interface OsmWay { type: 'way'; id: number; nodes?: number[]; geometry?: { lat: number; lon: number }[]; center?: { lat: number; lon: number }; tags?: OsmTags }
export interface OsmNode { type: 'node'; id: number; lat: number; lon: number; tags?: OsmTags }
interface OsmRel { type: 'relation'; id: number; members?: { type: string; ref: number }[]; tags?: OsmTags }
export interface Overpass { elements: (OsmWay | OsmNode | OsmRel)[]; osm3s?: { timestamp_osm_base?: string } }

type XY = [number, number];

/** A local plane in metres (equirectangular about the track's middle latitude: a trail's few km). */
function plane(lat0: number, lon0: number) {
  const ky = M_LAT, kx = mLon(lat0);
  return {
    xy: (lon: number, lat: number): XY => [(lon - lon0) * kx, (lat - lat0) * ky],
    ll: (p: XY): LonLat => [round5(p[0] / kx + lon0), round5(p[1] / ky + lat0)]
  };
}
const round5 = (x: number) => Math.round(x * 1e5) / 1e5;
const dist = (a: XY, b: XY) => Math.hypot(b[0] - a[0], b[1] - a[1]);
/** Bearing a → b (°, 0 north, clockwise), whole degrees in [0, 360). */
const bearing = (a: XY, b: XY) => (Math.round((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI) + 360) % 360;
/** The angle between two bearings (0–180). */
export const angle = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
/** The angle between two undirected lines (0–90). */
const lineAngle = (a: number, b: number) => {
  const d = angle(a, b);
  return d > 90 ? 180 - d : d;
};

/** A polyline with its cumulative lengths. */
interface Poly { p: XY[]; cum: number[] }
const poly = (p: XY[]): Poly => {
  const cum = [0];
  for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + dist(p[i - 1], p[i]));
  return { p, cum };
};
const lenOf = (l: Poly) => l.cum[l.cum.length - 1];
/** The point `t` m along (clamped). */
function at(l: Poly, t: number): XY {
  const x = Math.max(0, Math.min(lenOf(l), t));
  let i = 1;
  while (i < l.cum.length - 1 && l.cum[i] < x) i++;
  const s = l.cum[i] - l.cum[i - 1], f = s > 0 ? (x - l.cum[i - 1]) / s : 0;
  return [l.p[i - 1][0] + f * (l.p[i][0] - l.p[i - 1][0]), l.p[i - 1][1] + f * (l.p[i][1] - l.p[i - 1][1])];
}
/** The stretch [t0, t1] of a polyline. */
function slice(l: Poly, t0: number, t1: number): XY[] {
  const out: XY[] = [at(l, t0)];
  for (let i = 0; i < l.p.length; i++) if (l.cum[i] > t0 && l.cum[i] < t1) out.push(l.p[i]);
  out.push(at(l, t1));
  return out;
}
/** The nearest point of a polyline to `q`: its distance, its position along, its segment's bearing. */
function nearest(l: Poly, q: XY): { d: number; t: number; deg: number } {
  let best = { d: Infinity, t: 0, deg: 0 };
  for (let i = 1; i < l.p.length; i++) {
    const a = l.p[i - 1], b = l.p[i], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    const u = L ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L)) : 0;
    const d = Math.hypot(q[0] - a[0] - u * dx, q[1] - a[1] - u * dy);
    if (d < best.d) best = { d, t: l.cum[i - 1] + u * (l.cum[i] - l.cum[i - 1]), deg: bearing(a, b) };
  }
  return best;
}

/** Douglas–Peucker on a plane polyline. */
export function simplify(p: XY[], eps: number): XY[] {
  if (p.length < 3) return p;
  const keep = new Uint8Array(p.length);
  keep[0] = keep[p.length - 1] = 1;
  const stack: [number, number][] = [[0, p.length - 1]];
  while (stack.length) {
    const [i0, i1] = stack.pop()!;
    const a = p[i0], b = p[i1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    let best = -1, bi = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const d = L ? Math.abs(dy * (p[i][0] - a[0]) - dx * (p[i][1] - a[1])) / L : dist(a, p[i]);
      if (d > best) ((best = d), (bi = i));
    }
    if (best > eps) ((keep[bi] = 1), stack.push([i0, bi], [bi, i1]));
  }
  return p.filter((_, i) => keep[i]);
}

interface Edge {
  way: number;
  h: string;
  n?: string;
  sac?: string;
  /** The nodes at its ends. */
  a: number;
  b: number;
  line: Poly;
}
interface Poi { xy: XY; k: PoiKind; n?: string }

const POI_KIND = (t: OsmTags): PoiKind | null =>
  t.information === 'guidepost' ? 'post' : t.natural === 'peak' ? 'peak' : t.natural === 'saddle' ? 'saddle' : t.tourism === 'alpine_hut' ? 'hut' : t.amenity === 'shelter' ? 'shelter' : null;
/** A POI's label: its name (not a code: Tokyo's guideposts are named by their number, 151-750), else a guidepost's
 *  (first) destination. */
const poiName = (t: OsmTags): string | undefined => {
  const n = t['name:ja'] ?? t.name;
  return n && n !== t.ref && !/^[\d\s\-‐–_./]+$/.test(n) ? n : (t.destination?.split(';')[0].trim() || undefined);
};

/** A place name's core for matching a guidepost to it: spaces and a trailing 方面 / 駅 / バス停 / 山頂 / 登山口 … gone
 *  (谷峨方面 ~ 谷峨駅バス停 ~ 谷峨). */
const placeCore = (n: string): string => {
  let c = n.replace(/[\s　]/g, '');
  for (let was = ''; was !== c; ) ((was = c), (c = c.replace(/(方面|方向|へ|バス停|駅|山頂|登山口|入口|入り口)$/, '')));
  return c;
};
/** Whether a guidepost's name names a place: its core holds the place's (two characters at least). */
const names = (post: string, place: string): boolean => {
  const a = placeCore(post), b = placeCore(place);
  return b.length >= 2 && a.includes(b);
};

/** The net file for `track` from Overpass's answer, read on `day` (YYYY-MM-DD); `termini`, the trail's start and goal by
 *  name (a guidepost naming the one behind a way is no label for it). */
export function buildNet(osm: Overpass, track: TrackFile, day: string, termini: { start?: string; goal?: string } = {}): NetFile {
  const lats = track.pts.map((p) => p[1]), lons = track.pts.map((p) => p[0]);
  const P = plane((Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lons) + Math.max(...lons)) / 2);
  const route = poly(track.pts.map((p) => P.xy(p[0], p[1])));
  const prep = prepare(track);
  /** A route position (m, the plane's) as the trail view's distance (track.ts prepare: stretched to the raw length). */
  const viewD = (t: number) => {
    let i = 1;
    while (i < route.cum.length - 1 && route.cum[i] < t) i++;
    const s = route.cum[i] - route.cum[i - 1], f = s > 0 ? (t - route.cum[i - 1]) / s : 0;
    return Math.round(prep.d[i - 1] + f * (prep.d[i] - prep.d[i - 1]));
  };
  const toRoute = (q: XY) => nearest(route, q);

  // ── 1. edges ──
  const ways = osm.elements.filter((e): e is OsmWay & { nodes: number[]; geometry: { lat: number; lon: number }[] } =>
    e.type === 'way' && KINDS.has(e.tags?.highway ?? '') && !!e.nodes && !!e.geometry && e.nodes.length === e.geometry.length && e.nodes.length >= 2);
  const relName = new Map<number, string>();
  for (const r of osm.elements) if (r.type === 'relation' && r.tags?.route === 'hiking' && r.tags.name) for (const m of r.members ?? []) if (m.type === 'way' && !relName.has(m.ref)) relName.set(m.ref, r.tags.name);
  const uses = new Map<number, number>();
  for (const w of ways) w.nodes.forEach((n, i) => uses.set(n, (uses.get(n) ?? 0) + (i === 0 || i === w.nodes.length - 1 ? 2 : 1)));
  const edges: Edge[] = [];
  for (const w of ways) {
    const t = w.tags!;
    let from = 0;
    for (let i = 1; i < w.nodes.length; i++) {
      if (i < w.nodes.length - 1 && (uses.get(w.nodes[i]) ?? 0) < 2) continue;
      const p = w.geometry.slice(from, i + 1).map((g) => P.xy(g.lon, g.lat));
      edges.push({ way: w.id, h: t.highway!, n: t['name:ja'] ?? t.name, sac: t.sac_scale, a: w.nodes[from], b: w.nodes[i], line: poly(p) });
      from = i;
    }
  }
  const ends = new Map<number, number[]>(); // node → edges with an end there
  edges.forEach((e, i) => {
    for (const n of [e.a, e.b]) ends.set(n, [...(ends.get(n) ?? []), i]);
  });
  const nodeXY = (n: number): XY => {
    const e = edges[ends.get(n)![0]];
    return e.a === n ? e.line.p[0] : e.line.p[e.line.p.length - 1];
  };
  /** An edge's polyline as walked out of node `n`. */
  const outOf = (e: Edge, n: number): Poly => (e.a === n ? e.line : poly([...e.line.p].reverse()));

  const pois: Poi[] = [];
  for (const e of osm.elements) {
    const t = e.tags;
    const k = t && POI_KIND(t);
    if (!k) continue;
    const c = e.type === 'node' ? { lon: e.lon, lat: e.lat } : e.type === 'way' ? e.center : undefined;
    if (c) pois.push({ xy: P.xy(c.lon, c.lat), k, n: poiName(t) });
  }

  // ── 2. the route's claims (taken away in 4) ──
  const claims: number[][] = edges.map(() => []);
  const boxes = edges.map((e) => box(e.line.p, CORRIDOR_M));
  for (let s = 0; s <= lenOf(route); s += STEP_M) {
    const q = at(route, s), rdeg = bearing(at(route, s - 1), at(route, s + 1));
    let best: { e: number; d: number; t: number } | null = null;
    edges.forEach((e, i) => {
      const b = boxes[i];
      if (q[0] < b[0] || q[0] > b[2] || q[1] < b[1] || q[1] > b[3]) return;
      const m = nearestParallel(e.line, q, rdeg);
      if (m && m.d <= CORRIDOR_M && (!best || m.d < best.d)) best = { e: i, d: m.d, t: m.t };
    });
    if (best) claims[(best as { e: number }).e].push((best as { t: number }).t);
  }
  /** Each edge's kept stretches [t0, t1]. */
  const kept = edges.map((e, i) => keptOf(lenOf(e.line), claims[i]));

  // ── 3. forks, on the whole network (an edge out of one is the route's if claimed at its start) ──
  const trailEnds = (n: number) => (ends.get(n) ?? []).filter((i) => TRAILS.has(edges[i].h)).length;
  const candidates = [...ends.keys()].filter((n) => trailEnds(n) >= 3 && toRoute(nodeXY(n)).d <= FORK_M);
  const clusters: number[][] = [];
  for (const n of candidates) {
    const near = clusters.filter((c) => c.some((m) => dist(nodeXY(m), nodeXY(n)) <= FORK_MERGE_M));
    const merged = [n, ...near.flat()];
    for (const c of near) clusters.splice(clusters.indexOf(c), 1);
    clusters.push(merged);
  }
  const forks: (NetFork & { edges: { e: number; n: number; br: number }[] })[] = [];
  for (const cluster of clusters) {
    const inside = new Set(cluster);
    const centre = cluster.map(nodeXY).reduce((best, q) => (toRoute(q).d < toRoute(best).d ? q : best));
    const passes = passesOf(route, centre).filter((s) => s >= END_M && s <= lenOf(route) - END_M);
    if (!passes.length) continue;
    // the route's own ways out (each pass: back and on), alike ones once
    const br: NetBranch[] = [];
    const routeBr = (deg: number) => {
      const i = br.findIndex((b) => b.line === -1 && angle(b.deg, deg) < PARALLEL_DEG);
      return i >= 0 ? i : br.push({ deg, line: -1 }) - 1;
    };
    const pass = passes.map((s) => {
      const here = at(route, s);
      routeBr(bearing(here, at(route, s - BEARING_M)));
      return { at: viewD(s), inDeg: bearing(at(route, s - BEARING_M), here), take: routeBr(bearing(here, at(route, s + BEARING_M))) };
    });
    const routeNames = new Map<number, string>();
    const own: { e: number; n: number; br: number }[] = [];
    for (const n of cluster) {
      for (const i of ends.get(n)!) {
        const e = edges[i];
        const other = e.a === n ? e.b : e.a;
        if (inside.has(other) && other !== n) continue; // between the cluster's nodes
        const out = outOf(e, n);
        const deg = bearing(out.p[0], at(out, BEARING_M));
        if (claimedAt(kept[i], lenOf(e.line), e.a === n)) {
          const along = br.reduce((best, b, j) => (b.line === -1 && (best < 0 || angle(b.deg, deg) < angle(br[best].deg, deg)) ? j : best), -1);
          if (e.n && !routeNames.has(along)) routeNames.set(along, e.n);
          continue;
        }
        if (reach(edges, ends, i, n, inside) < SPUR_M) continue; // a hut's door, a viewpoint's few steps: no decision
        own.push({ e: i, n, br: br.push({ deg, line: -2 }) - 1 });
        kept[i] = keepFrom(kept[i], lenOf(e.line), e.a === n);
      }
    }
    // R12: a fork offers a path: off the route, or the route's own three ways (a summit's spur: up, back, on)
    if (br.length < 3 || !(own.some((o) => TRAILS.has(edges[o.e].h)) || br.filter((b) => b.line === -1).length >= 3)) continue;
    // labels: the route's ways, its way's name else the next POI along the route; an edge, its name else the next
    // POI along it
    br.forEach((b, i) => {
      if (b.line !== -1) return;
      const n = routeNames.get(i) ?? nextPoiAlongRoute(route, pois, passes, b.deg, centre, termini);
      if (n) b.n = n;
    });
    for (const o of own) {
      const n = edges[o.e].n ?? nextPoiAlong(edges, ends, pois, o.e, o.n, inside);
      if (n) br[o.br].n = n;
    }
    // a label on two ways tells them apart no better than none (an out-and-back's peak both ways)
    for (const b of br) if (b.n && br.filter((x) => x.n === b.n).length > 1) for (const x of br.filter((y) => y.n === b.n)) delete x.n;
    forks.push({ p: P.ll(centre), pass, br, edges: own });
  }

  // ── 4. the lines ──
  interface Piece { edge: number; t0: number; t1: number; p: XY[] }
  const pieces: Piece[] = [];
  edges.forEach((e, i) => {
    const reach = ROADS.has(e.h) ? ROAD_KEEP_M : KEEP_M;
    for (const [t0, t1] of kept[i]) for (const p of clip(slice(e.line, t0, t1), reach, toRoute)) pieces.push({ edge: i, t0, t1, p });
  });
  // joined back along each way (pieces end to end), each a line
  const lines: { piece: number[]; p: XY[] }[] = [];
  const byWay = new Map<number, number[]>();
  pieces.forEach((pc, i) => byWay.set(edges[pc.edge].way, [...(byWay.get(edges[pc.edge].way) ?? []), i]));
  for (const ids of byWay.values()) {
    const left = new Set(ids);
    while (left.size) {
      const first = left.values().next().value!;
      left.delete(first);
      const chain = { piece: [first], p: [...pieces[first].p] };
      for (let grown = true; grown; ) {
        grown = false;
        for (const j of left) {
          const q = pieces[j].p, head = chain.p[0], tail = chain.p[chain.p.length - 1];
          if (dist(tail, q[0]) < 0.5) chain.p.push(...q.slice(1));
          else if (dist(tail, q[q.length - 1]) < 0.5) chain.p.push(...[...q].reverse().slice(1));
          else if (dist(head, q[q.length - 1]) < 0.5) chain.p.unshift(...q.slice(0, -1));
          else if (dist(head, q[0]) < 0.5) chain.p.unshift(...[...q].reverse().slice(0, -1));
          else continue;
          chain.piece.push(j);
          left.delete(j);
          grown = true;
        }
      }
      lines.push(chain);
    }
  }
  const lineOfPiece = new Map<number, number>();
  lines.forEach((l, i) => l.piece.forEach((pc) => lineOfPiece.set(pc, i)));
  const netLines: NetLine[] = lines.map((l) => {
    const e = edges[pieces[l.piece[0]].edge];
    const c = dedupe(simplify(l.p, DP_M).map(P.ll));
    const n = e.n ?? relName.get(e.way);
    return { c, ...(n ? { n } : {}), h: e.h, ...(e.sac ? { sac: e.sac } : {}) };
  });

  // a branch's line: its edge's kept piece nearest the fork (none: the edge was the route's, so the branch goes)
  const outForks: NetFork[] = [];
  for (const f of forks) {
    const drop = new Set<number>();
    for (const o of f.edges) {
      const e = edges[o.e], fromA = e.a === o.n, L = lenOf(e.line);
      let best = -1, bestT = Infinity;
      pieces.forEach((pc, i) => {
        if (pc.edge !== o.e) return;
        const t = fromA ? pc.t0 : L - pc.t1;
        if (t < bestT) ((bestT = t), (best = i));
      });
      if (best < 0 || bestT > 2 * CORRIDOR_M) drop.add(o.br);
      else f.br[o.br].line = lineOfPiece.get(best)!;
    }
    if (drop.size) {
      const idx = f.br.map((_, i) => i).filter((i) => !drop.has(i));
      if (idx.length < 3 || !(idx.some((i) => f.br[i].line >= 0 && TRAILS.has(netLines[f.br[i].line].h)) || idx.filter((i) => f.br[i].line === -1).length >= 3)) continue;
      f.br = idx.map((i) => f.br[i]);
      f.pass = f.pass.map((s) => ({ ...s, take: idx.indexOf(s.take) }));
    }
    outForks.push({ p: f.p, pass: f.pass, br: f.br });
  }
  outForks.sort((a, b) => a.pass[0].at - b.pass[0].at);

  const netPois: NetPoi[] = pois
    .filter((q) => q.n && toRoute(q.xy).d <= KEEP_M)
    .map((q) => ({ p: P.ll(q.xy), k: q.k, n: q.n }));
  return { v: 1, src: 'osm', at: day, trk: trackHash(track.pts), north: 'true', lines: netLines, forks: outForks, ...(netPois.length ? { pois: netPois } : {}) };
}

/** How far the network reaches out of node `from` along edge `start` (never back through the fork's `inside`
 *  nodes), counted up to SPUR_M. */
function reach(edges: Edge[], ends: Map<number, number[]>, start: number, from: number, inside: Set<number>): number {
  let total = 0;
  const seen = new Set<number>([start]);
  const stack: [number, number][] = [[start, from]];
  while (stack.length && total < SPUR_M) {
    const [e, n] = stack.pop()!;
    total += lenOf(edges[e].line);
    const next = edges[e].a === n ? edges[e].b : edges[e].a;
    if (inside.has(next)) continue;
    for (const i of ends.get(next) ?? []) if (!seen.has(i)) (seen.add(i), stack.push([i, next]));
  }
  return total;
}

/** The route's positions (m) where it passes `q` within FORK_M: one a visit (the nearest point of each stretch within
 *  reach, stretches less than 60 m apart one visit); a visit near another nearer one (within PASS_APART_M along and
 *  PASS_NEAR_M farther) and itself over PASS_OWN_M from the fork is a switchback's other leg going by, not a pass. */
function passesOf(route: Poly, q: XY): number[] {
  const visits: { s: number; d: number; end: number }[] = [];
  for (let i = 1; i < route.p.length; i++) {
    const seg = poly([route.p[i - 1], route.p[i]]);
    const m = nearest(seg, q);
    if (m.d > FORK_M) continue;
    const s = route.cum[i - 1] + m.t, last = visits[visits.length - 1];
    if (last && route.cum[i - 1] - last.end < 60) {
      if (m.d < last.d) ((last.s = s), (last.d = m.d));
      last.end = route.cum[i];
    } else visits.push({ s, d: m.d, end: route.cum[i] });
  }
  return visits.filter((v) => !(v.d > PASS_OWN_M && visits.some((w) => w !== v && Math.abs(w.s - v.s) < PASS_APART_M && v.d > w.d + PASS_NEAR_M))).map((v) => v.s);
}

const box = (p: XY[], pad: number): [number, number, number, number] => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of p) ((x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y)));
  return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
};

/** The nearest point of `l` to `q` on a segment running along `deg` (either way), else null. */
function nearestParallel(l: Poly, q: XY, deg: number): { d: number; t: number } | null {
  let best: { d: number; t: number } | null = null;
  for (let i = 1; i < l.p.length; i++) {
    const a = l.p[i - 1], b = l.p[i];
    if (lineAngle(bearing(a, b), deg) >= PARALLEL_DEG) continue;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    const u = L ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L)) : 0;
    const d = Math.hypot(q[0] - a[0] - u * dx, q[1] - a[1] - u * dy);
    if (!best || d < best.d) best = { d, t: l.cum[i - 1] + u * (l.cum[i] - l.cum[i - 1]) };
  }
  return best;
}

/** An edge's stretches left once its claims (positions along it) are cut out: each claim ±CLAIM_HALF_M, a claimed end
 *  within CLAIM_HALF_M taken to the end, and a stub shorter than STUB_M beside a claim dropped. */
export function keptOf(L: number, claims: number[]): [number, number][] {
  if (!claims.length) return [[0, L]];
  const cut: [number, number][] = [];
  for (const t of [...claims].sort((a, b) => a - b)) {
    const lo = t - CLAIM_HALF_M <= CLAIM_HALF_M ? 0 : t - CLAIM_HALF_M, hi = t + CLAIM_HALF_M >= L - CLAIM_HALF_M ? L : t + CLAIM_HALF_M;
    const last = cut[cut.length - 1];
    if (last && lo <= last[1]) last[1] = Math.max(last[1], hi);
    else cut.push([lo, hi]);
  }
  const out: [number, number][] = [];
  let from = 0;
  for (const [lo, hi] of [...cut, [L, L] as [number, number]]) {
    if (lo - from >= STUB_M) out.push([from, lo]);
    from = hi;
  }
  return out;
}

/** A polyline's runs within `reach` of the route (to ~10 m). */
function clip(p: XY[], reach: number, toRoute: (q: XY) => { d: number }): XY[][] {
  const dense: XY[] = [p[0]];
  for (let i = 1; i < p.length; i++) {
    const n = Math.ceil(dist(p[i - 1], p[i]) / 10);
    for (let k = 1; k <= n; k++) dense.push([p[i - 1][0] + ((p[i][0] - p[i - 1][0]) * k) / n, p[i - 1][1] + ((p[i][1] - p[i - 1][1]) * k) / n]);
  }
  const out: XY[][] = [];
  let cur: XY[] = [];
  for (const q of dense) {
    if (toRoute(q).d <= reach) cur.push(q);
    else if (cur.length) (cur.length > 1 && out.push(cur), (cur = []));
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

/** Whether an edge's start (its `a` end, or its `b`) is the route's: claimed there for BRANCH_CLAIM_M (or the edge
 *  whole). A branch leaving at a slant has its first few metres claimed by the route's samples beside the node (as
 *  near it as the route's own edge there): its first kept stretch is taken back to the fork (keepFrom). */
const claimedAt = (kept: [number, number][], L: number, fromA: boolean): boolean => {
  if (!kept.length) return true;
  const gap = fromA ? kept[0][0] : L - kept[kept.length - 1][1];
  return gap >= Math.min(L, BRANCH_CLAIM_M);
};
/** An edge's kept stretches with the one nearest its `a` end (or its `b`) taken to that end. */
const keepFrom = (kept: [number, number][], L: number, fromA: boolean): [number, number][] =>
  fromA ? [[0, kept[0][1]], ...kept.slice(1)] : [...kept.slice(0, -1), [kept[kept.length - 1][0], L]];

/** Repeated points after rounding gone (a line keeps two). */
function dedupe(c: LonLat[]): LonLat[] {
  const out = c.filter((p, i) => i === 0 || p[0] !== c[i - 1][0] || p[1] !== c[i - 1][1]);
  return out.length > 1 ? out : [c[0], c[c.length - 1]];
}

/** The nearest named POI (a guidepost's destination) reached along edge `start` out of node `from`, the network
 *  walked on from there (never back through the fork's `inside` nodes) up to LABEL_REACH_M; POIs at the fork itself
 *  (its own guidepost) don't count. */
function nextPoiAlong(edges: Edge[], ends: Map<number, number[]>, pois: Poi[], start: number, from: number, inside: Set<number>): string | undefined {
  const named = pois.filter((q) => q.n);
  const origin = edges[start].a === from ? edges[start].line.p[0] : edges[start].line.p[edges[start].line.p.length - 1];
  const far = named.filter((q) => dist(q.xy, origin) > POI_NEAR_M);
  let best: { d: number; n: string } | null = null;
  const done = new Map<number, number>();
  const queue: { e: number; from: number; d: number }[] = [{ e: start, from, d: 0 }];
  while (queue.length) {
    queue.sort((a, b) => a.d - b.d);
    const { e, from: n, d } = queue.shift()!;
    if (best && d >= best.d) break;
    const edge = edges[e], L = lenOf(edge.line), fromA = edge.a === n;
    for (const q of far) {
      const m = nearest(edge.line, q.xy);
      if (m.d > POI_NEAR_M) continue;
      const total = d + (fromA ? m.t : L - m.t);
      if (!best || total < best.d) best = { d: total, n: q.n! };
    }
    const next = fromA ? edge.b : edge.a, nd = d + L;
    if (inside.has(next) || nd > LABEL_REACH_M || (done.get(next) ?? Infinity) <= nd) continue;
    done.set(next, nd);
    for (const i of ends.get(next) ?? []) if (i !== e) queue.push({ e: i, from: next, d: nd });
  }
  return best?.n;
}

/** The route's way out at bearing `deg`: the nearest named POI within POI_NEAR_M of the route ahead that way (from the
 *  pass that leaves so, else the one that comes back so), up to LABEL_REACH_M, past the fork's own; a peak, saddle, hut
 *  or shelter before any guidepost; a guidepost naming where that way comes from (the trail's end behind it, a peak or
 *  hut passed: it points back) never. */
function nextPoiAlongRoute(route: Poly, pois: Poi[], passes: number[], deg: number, centre: XY, ends: { start?: string; goal?: string }): string | undefined {
  const named = pois.filter((q) => q.n && dist(q.xy, centre) > POI_NEAR_M).map((q) => ({ q, m: nearest(route, q.xy) })).filter((x) => x.m.d <= POI_NEAR_M);
  let best: { d: number; n: string; post: boolean } | null = null;
  for (const s of passes) {
    const here = at(route, s);
    for (const dir of [1, -1]) {
      if (angle(bearing(here, at(route, s + dir * BEARING_M)), deg) >= PARALLEL_DEG) continue;
      // behind this way: the end it comes from (not when it is also the one it goes to: an out-and-back), places passed
      const from = dir > 0 ? ends.start : ends.goal, to = dir > 0 ? ends.goal : ends.start;
      const behind = [...(from && !(to && (names(to, from) || names(from, to))) ? [from] : []), ...named.filter(({ q, m }) => q.k !== 'post' && (m.t - s) * dir < 0).map(({ q }) => q.n!)];
      for (const { q, m } of named) {
        const d = (m.t - s) * dir, post = q.k === 'post';
        if (d <= 0 || d > LABEL_REACH_M || (post && behind.some((b) => names(q.n!, b)))) continue;
        if (!best || (best.post !== post ? best.post : d < best.d)) best = { d, n: q.n!, post };
      }
    }
  }
  return best?.n;
}
