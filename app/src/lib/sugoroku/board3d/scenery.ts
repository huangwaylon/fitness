// 英語すごろく's island in 3D (engine.ts), for a game's board (board.ts: its route, river, house and trees): the grass, the river and its bridges, the beach and the sea, the sandy path,
// the stepping stones (their kind's colour, its mark on top), the stretches' wooden signs, round trees and the museum.
// Low-poly and few materials: everything of one colour a vertex colour, merged into one mesh (one draw); the marks and
// the signs one canvas atlas; the water one.
import {
  BoxGeometry, BufferGeometry, CanvasTexture, CircleGeometry, Color, ConeGeometry, CylinderGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, Mesh,
  MeshLambertMaterial, PlaneGeometry, SRGBColorSpace, Shape, ShapeGeometry
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { riverY, waysAt, type AreaId, type Board, type SpaceKind } from '#lib/sugoroku/board.ts';
import { s } from '#lib/sugoroku/i18n.ts';
import { END_R, RIVER_HALF, STONE_R, STONE_T, bridges, toWorld } from './plan.ts';

type Kind = SpaceKind;
/** Each kind's stone (Board.svelte's fills): ことば cream, ダブル sky, ぶん mint, 絵 peach, イベント lilac, the ends yuzu. */
const KIND_COLOUR: Record<Kind, number> = { word: 0xfff9e3, double: 0x84b9e9, sentence: 0x9ce1d0, picture: 0xf7c9a8, event: 0xd7c3f5, start: 0xffd84d, goal: 0xffd84d };
const MARK: Record<Kind, string> = { start: s('kind.start'), word: 'A', double: '×2', sentence: '文', picture: '絵', event: '!', goal: s('kind.goal') };
const KINDS = Object.keys(KIND_COLOUR) as Kind[];
/** A みんなで！ stone's top (its body a ことば's, what it plays as once played): rose, two heads; the atlas's cell 7. */
const MINI_CELL = 7, MINI_COLOUR = 0xf2bccf;
const INK = '#4a3a2c', WOOD = 0xa8835a, GRASS = 0x9fd38a, SAND = 0xf3dfa8, PATH = 0xefe0b8;
const FONT = '"Hiragino Maru Gothic ProN", "Hiragino Sans", system-ui, sans-serif';

/** The atlas's cells (4 × 4 of 128 px): the kinds' tops 0–6, the board's areas' signs 8–15 (a fork's way's sign
 *  with a second line: 近道 or 遠回り and its steps). */
const CELLS = 4, PX = 128;
const cellOfKind = (k: Kind) => KINDS.indexOf(k);
/** A sign's board (2:1, the atlas cell's middle band) and its middle's height: 1.6× the first boards (22 × 11 at 12),
 *  so 「飛行場 遠回り 9マス」 reads at the default camera (B-U3); the same one draw. */
const SIGN_W = 35, SIGN_H = 17.5, SIGN_Y = 19;

function atlas(areas: readonly AreaId[], notes: ReadonlyMap<AreaId, string>): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = CELLS * PX;
  const g = c.getContext('2d')!;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const cell = (i: number, bg: string, text: string, fg: string, size: number) => {
    const x = (i % CELLS) * PX, y = Math.floor(i / CELLS) * PX;
    g.fillStyle = bg;
    g.fillRect(x, y, PX, PX);
    g.fillStyle = fg;
    g.font = `700 ${size}px ${FONT}`;
    g.fillText(text, x + PX / 2, y + PX / 2 + size * 0.04, PX - 10);
  };
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
  KINDS.forEach((k, i) => cell(i, hex(KIND_COLOUR[k]), MARK[k], INK, k === 'start' || k === 'goal' ? 26 : k === 'double' ? 54 : 64));
  // みんなで！: two heads and shoulders
  {
    const x = (MINI_CELL % CELLS) * PX, y = Math.floor(MINI_CELL / CELLS) * PX;
    cell(MINI_CELL, hex(MINI_COLOUR), '', INK, 64);
    g.fillStyle = INK;
    for (const dx of [-20, 20]) {
      g.beginPath();
      g.arc(x + PX / 2 + dx, y + 46, 14, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(x + PX / 2 + dx, y + 92, 22, 20, 0, Math.PI, 0);
      g.fill();
    }
  }
  // a sign's label: heavy, outlined in dark wood (it reads at the camera's distance on a phone: B-U3)
  const label = (text: string, cx: number, cy: number, size: number, fg: string, max: number) => {
    g.font = `800 ${size}px ${FONT}`;
    g.lineJoin = 'round';
    g.lineWidth = Math.max(3, size * 0.16);
    g.strokeStyle = '#4a3220';
    g.strokeText(text, cx, cy, max);
    g.fillStyle = fg;
    g.fillText(text, cx, cy, max);
  };
  areas.forEach((a, i) => {
    const note = notes.get(a), x = ((8 + i) % CELLS) * PX, y = Math.floor((8 + i) / CELLS) * PX;
    cell(8 + i, hex(WOOD), '', '#fff8e8', 30);
    if (!note) return label(s(`area.${a}`), x + PX / 2, y + PX / 2 + 2, 42, '#fff8e8', PX - 10);
    // (the name up a little, the way's note under it: both in the band the sign shows)
    label(s(`area.${a}`), x + PX / 2, y + PX / 2 - 11, 31, '#fff8e8', PX - 10);
    label(note, x + PX / 2, y + PX / 2 + 17, 21, '#ffe9a8', PX - 6);
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** `geo` (non-indexed, uv kept if `uv`) with one colour on every vertex, ready to merge. */
function paint(geo: BufferGeometry, colour: number, flat = false, uv = false): BufferGeometry {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  if (!uv) g.deleteAttribute('uv');
  if (flat) g.computeVertexNormals();
  const c = new Color(colour), n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new Float32BufferAttribute(a, 3));
  return g;
}

/** Circle `geo`'s uv (0–1) moved into atlas cell `i`. */
function intoCell(geo: BufferGeometry, i: number, inset = 0): BufferGeometry {
  const uv = geo.getAttribute('uv'), col = i % CELLS, row = Math.floor(i / CELLS);
  for (let k = 0; k < uv.count; k++) {
    const u = inset + uv.getX(k) * (1 - 2 * inset), v = inset + uv.getY(k) * (1 - 2 * inset);
    uv.setXY(k, (col + u) / CELLS, 1 - (row + 1 - v) / CELLS);
  }
  return geo;
}

/** A plan point as a world position (y up). */
const at = (geo: BufferGeometry, x: number, y: number, h: number) => {
  const [wx, wz] = toWorld(x, y);
  return geo.translate(wx, h, wz);
};

/** A stone top's vertices (a circle of TOP_SEGS, non-indexed: the stones' in order at the merged mesh's start). */
const TOP_SEGS = 28, TOP_VERTS = TOP_SEGS * 3;
/** The みんなで！ stones played: their tops moved to the ことば's cell (the island's group, buildIsland's). */
export function markPlayed(root: Group, b: Board, stones: readonly number[]): void {
  const mesh = root.userData.tops as Mesh | undefined, uv = mesh?.geometry.getAttribute('uv');
  if (!uv) return;
  const du = ((cellOfKind('word') % CELLS) - (MINI_CELL % CELLS)) / CELLS, dv = (Math.floor(MINI_CELL / CELLS) - Math.floor(cellOfKind('word') / CELLS)) / CELLS;
  for (const i of stones) {
    if (!b.spaces[i]?.mini || (mesh!.userData.played as Set<number> | undefined)?.has(i)) continue;
    (mesh!.userData.played ??= new Set<number>()).add(i);
    for (let k = i * TOP_VERTS; k < (i + 1) * TOP_VERTS; k++) uv.setXY(k, uv.getX(k) + du, uv.getY(k) + dv);
  }
  uv.needsUpdate = true;
}

/** The island's group (its geometries, materials and atlas released with the scene: engine.ts). */
export function buildIsland(b: Board): Group {
  const root = new Group();
  root.name = 'island';
  const solid = new MeshLambertMaterial({ vertexColors: true });
  const water = new MeshLambertMaterial({ color: 0x7cc3ea, emissive: 0x2a6f9a, emissiveIntensity: 0.25 });
  const BOARD = b.spaces, goalY = BOARD[b.goal].y;
  const areas = [...new Set(BOARD.map((sp) => sp.area))];
  const cellOfArea = (a: string) => 8 + areas.indexOf(a as (typeof areas)[number]);
  // a fork's ways' signs: 近道 / 遠回り and the steps under the name
  const notes = new Map<AreaId, string>();
  for (const f of b.forks) {
    const ws = waysAt(b, f);
    ws.forEach((w, i) => {
      if (!b.signs.some((sg) => sg.i === BOARD[f].next[i])) return;
      const other = ws[1 - i].steps, kind = w.steps < other ? 'short' : w.steps > other ? 'long' : 'even';
      notes.set(w.area, `${kind === 'even' ? '' : s(`way.${kind}`, { a: '' }).replace(/^の/, '')} ${s('way.steps', { n: w.steps })}`.trim());
    });
  }
  const tex = atlas(areas, notes);
  const marks = new MeshLambertMaterial({ map: tex });

  // the ground: grass, the beach's sand along a wavy shore, the sea beyond
  const parts: BufferGeometry[] = [];
  const [, gz] = toWorld(0, goalY / 2);
  parts.push(paint(new PlaneGeometry(1800, goalY + 1400).rotateX(-Math.PI / 2).translate(0, 0, gz), GRASS));
  const shore = (y0: number, amp: number) => {
    const sh = new Shape();
    // (the shape's y is −Z once laid flat: the region beyond the shore, away from the camera)
    sh.moveTo(-900, -toWorld(0, y0 + 700)[1]);
    for (let x = -900; x <= 900; x += 20) sh.lineTo(x, -toWorld(0, y0 + amp * Math.sin(x / 70) + amp * 0.5 * Math.cos(x / 31))[1]);
    sh.lineTo(900, -toWorld(0, y0 + 700)[1]);
    return new ShapeGeometry(sh).rotateX(-Math.PI / 2);
  };
  parts.push(paint(shore(goalY + 24, 6).translate(0, 0.15, 0), SAND));
  // the path: a strip along each link, a round patch under each stone
  for (const sp of BOARD) {
    parts.push(paint(at(new CircleGeometry(STONE_R + 5, 20).rotateX(-Math.PI / 2), sp.x, sp.y, 0.3), PATH));
    for (const j of sp.next) {
      const to = BOARD[j], len = Math.hypot(to.x - sp.x, to.y - sp.y), [ax, az] = toWorld(sp.x, sp.y), [bx, bz] = toWorld(to.x, to.y);
      const strip = new PlaneGeometry(14, len).rotateX(-Math.PI / 2).rotateY(Math.atan2(bx - ax, bz - az)).translate((ax + bx) / 2, 0.28, (az + bz) / 2);
      parts.push(paint(strip, PATH));
    }
  }
  // the bridges over the river: planks and two rails
  for (const br of bridges(b)) {
    const [x, z] = toWorld(br.x, br.y);
    const deck = new BoxGeometry(18, 1.6, RIVER_HALF * 2 + 10);
    const rail = (side: number) => new BoxGeometry(1.4, 3, RIVER_HALF * 2 + 8).translate(side * 9, 2, 0);
    for (const [g, c] of [[deck.translate(0, 0.8, 0), 0xc49a6c], [rail(-1), 0x9a6f45], [rail(1), 0x9a6f45]] as const) parts.push(paint(g.rotateY(br.yaw).translate(x, 0, z), c));
  }
  // the stones' bodies, the ends bigger
  BOARD.forEach((sp) => {
    const end = sp.kind === 'start' || sp.kind === 'goal', r = end ? END_R : STONE_R, c = new Color(KIND_COLOUR[sp.kind]).multiplyScalar(0.86).getHex();
    parts.push(paint(at(new CylinderGeometry(r * 0.94, r, STONE_T, 28).translate(0, STONE_T / 2, 0), sp.x, sp.y, 0), c));
  });
  // the house (by the museum's stretch, or 家), and the signs' posts
  const [mx, mz] = toWorld(b.house.x, b.house.y);
  parts.push(paint(new BoxGeometry(46, 22, 30).translate(mx, 11, mz), 0xf2e2c4, true));
  parts.push(paint(new ConeGeometry(34, 16, 4).rotateY(Math.PI / 4).scale(1, 1, 0.68).translate(mx, 30, mz), 0xb9785a, true));
  parts.push(paint(new BoxGeometry(10, 14, 1).translate(mx, 7, mz + 15.2), 0x8a5a3c, true));
  for (const sg of b.signs) parts.push(paint(at(new BoxGeometry(2, SIGN_Y - SIGN_H / 2 + 1, 2).translate(0, (SIGN_Y - SIGN_H / 2 + 1) / 2, 0), sg.x, sg.y, 0), 0x8a6440));
  // round trees (a trunk, a low-poly crown), kept off the route
  for (const [x, y, r] of b.trees) {
    parts.push(paint(at(new CylinderGeometry(r * 0.16, r * 0.22, r * 1.1, 6).translate(0, r * 0.55, 0), x, y, 0), 0x8a6440, true));
    parts.push(paint(at(new IcosahedronGeometry(r, 1).scale(1, 0.9, 1).translate(0, r * 1.55, 0), x, y, 0), (x * 7 + y) % 3 ? 0x5f9e54 : 0x6fb25e, true));
  }
  root.add(new Mesh(mergeGeometries(parts), solid));
  for (const g of parts) g.dispose();

  // the water: the river's ribbon across the island, the sea past the beach
  const pos: number[] = [], idx: number[] = [];
  for (let x = -720, n = 0; x <= 1080; x += 12, n++) {
    const y = riverY(b, x), [wx, z0] = toWorld(x, y - RIVER_HALF), [, z1] = toWorld(x, y + RIVER_HALF);
    pos.push(wx, 0.2, z0, wx, 0.2, z1);
    if (n) idx.push(2 * n - 2, 2 * n, 2 * n - 1, 2 * n - 1, 2 * n, 2 * n + 1);
  }
  const river = new BufferGeometry();
  river.setAttribute('position', new Float32BufferAttribute(pos, 3));
  river.setIndex(idx);
  river.computeVertexNormals();
  const sea = shore(goalY + 56, 5).translate(0, 0.4, 0).deleteAttribute('uv');
  const waterGeo = mergeGeometries([river.toNonIndexed(), sea.toNonIndexed()]);
  river.dispose();
  sea.dispose();
  root.add(new Mesh(waterGeo, water));

  // the marks on the stones' tops, the signs' boards: one atlas
  const tops: BufferGeometry[] = [];
  BOARD.forEach((sp) => {
    const end = sp.kind === 'start' || sp.kind === 'goal', r = (end ? END_R : STONE_R) * 0.86;
    tops.push(at(intoCell(new CircleGeometry(r, TOP_SEGS), sp.mini ? MINI_CELL : cellOfKind(sp.kind), 0.04).rotateX(-Math.PI / 2), sp.x, sp.y, STONE_T + 0.06).toNonIndexed());
  });
  for (const sg of b.signs) {
    const board = new PlaneGeometry(SIGN_W, SIGN_H), uv = board.getAttribute('uv');
    // (the cell's middle band: the label's 2:1)
    for (let k = 0; k < uv.count; k++) uv.setY(k, 0.25 + uv.getY(k) * 0.5);
    tops.push(at(intoCell(board, cellOfArea(BOARD[sg.i].area)).rotateX(-0.35), sg.x, sg.y, SIGN_Y).toNonIndexed());
  }
  const topMesh = new Mesh(mergeGeometries(tops), marks);
  root.add(topMesh);
  root.userData.tops = topMesh;
  for (const g of tops) g.dispose();
  return root;
}
