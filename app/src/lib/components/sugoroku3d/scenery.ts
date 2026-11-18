// 英語すごろく's island in 3D (engine.ts): the grass, the river and its bridges, the beach and the sea, the sandy path,
// the stepping stones (their kind's colour, its mark on top), the stretches' wooden signs, round trees and the museum.
// Low-poly and few materials: everything of one colour a vertex colour, merged into one mesh (one draw); the marks and
// the signs one canvas atlas; the water one.
import {
  BoxGeometry, BufferGeometry, CanvasTexture, CircleGeometry, Color, ConeGeometry, CylinderGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, Mesh,
  MeshLambertMaterial, PlaneGeometry, SRGBColorSpace, Shape, ShapeGeometry
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BOARD, GOAL, W } from '#lib/sugoroku/board.ts';
import { s } from '#lib/sugoroku/i18n.ts';
import { END_R, RIVER_HALF, STONE_R, STONE_T, bridges, riverY, toWorld } from './plan.ts';

type Kind = (typeof BOARD)[number]['kind'];
/** Each kind's stone (Board.svelte's fills): ことば cream, ダブル sky, ぶん mint, 絵 peach, イベント lilac, the ends yuzu. */
const KIND_COLOUR: Record<Kind, number> = { word: 0xfff9e3, double: 0x84b9e9, sentence: 0x9ce1d0, picture: 0xf7c9a8, event: 0xd7c3f5, start: 0xffd84d, goal: 0xffd84d };
const MARK: Record<Kind, string> = { start: s('kind.start'), word: 'A', double: '×2', sentence: '文', picture: '絵', event: '!', goal: s('kind.goal') };
const KINDS = Object.keys(KIND_COLOUR) as Kind[];
const AREAS = [...new Set(BOARD.map((b) => b.area))];
const INK = '#4a3a2c', WOOD = 0xa8835a, GRASS = 0x9fd38a, SAND = 0xf3dfa8, PATH = 0xefe0b8;
const FONT = '"Hiragino Maru Gothic ProN", "Hiragino Sans", system-ui, sans-serif';

/** The atlas's cells (4 × 4 of 128 px): the kinds' tops 0–6, the areas' signs 8–14. */
const CELLS = 4, PX = 128;
const cellOfKind = (k: Kind) => KINDS.indexOf(k);
const cellOfArea = (a: string) => 8 + AREAS.indexOf(a as (typeof AREAS)[number]);

function atlas(): CanvasTexture {
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
  AREAS.forEach((a) => cell(cellOfArea(a), hex(WOOD), s(`area.${a}`), '#fff8e8', 40));
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

/** Trees by the route (plan points: Board.svelte's, more beyond its edges), kept off the stones and the path. */
const TREES: [number, number, number][] = [
  [20, 80, 11], [342, 150, 10], [18, 420, 12], [340, 500, 10], [24, 580, 11], [-30, 30, 14], [395, 60, 13], [-40, 170, 12], [400, 230, 14], [-45, 300, 13],
  [405, 360, 12], [-35, 440, 14], [395, 450, 12], [-40, 540, 13], [400, 580, 11], [130, 330, 9], [250, 345, 9], [-80, 100, 16], [440, 140, 15], [-90, 380, 16],
  [450, 300, 16], [-85, 500, 15], [445, 520, 14], [180, -10, 12], [60, -20, 13], [300, -15, 12]
];

/** Distance from plan point (x, y) to the route (its stones and the segments between). */
function routeDist(x: number, y: number): number {
  let d = Infinity;
  for (const sp of BOARD) for (const j of sp.next) {
    const b = BOARD[j], vx = b.x - sp.x, vy = b.y - sp.y, l2 = vx * vx + vy * vy;
    const t = Math.max(0, Math.min(1, ((x - sp.x) * vx + (y - sp.y) * vy) / l2));
    d = Math.min(d, Math.hypot(x - sp.x - vx * t, y - sp.y - vy * t));
  }
  return d;
}

/** The island's group (its geometries, materials and atlas released with the scene: engine.ts). */
export function buildIsland(): Group {
  const root = new Group();
  root.name = 'island';
  const solid = new MeshLambertMaterial({ vertexColors: true });
  const water = new MeshLambertMaterial({ color: 0x7cc3ea, emissive: 0x2a6f9a, emissiveIntensity: 0.25 });
  const tex = atlas();
  const marks = new MeshLambertMaterial({ map: tex });

  // the ground: grass, the beach's sand along a wavy shore, the sea beyond
  const parts: BufferGeometry[] = [];
  parts.push(paint(new PlaneGeometry(1800, 2000).rotateX(-Math.PI / 2).translate(0, 0, 0), GRASS));
  const shore = (y0: number, amp: number) => {
    const sh = new Shape();
    // (the shape's y is −Z once laid flat: the region beyond the shore, away from the camera)
    sh.moveTo(-900, 1400);
    for (let x = -900; x <= 900; x += 20) sh.lineTo(x, -toWorld(0, y0 + amp * Math.sin(x / 70) + amp * 0.5 * Math.cos(x / 31))[1]);
    sh.lineTo(900, 1400);
    return new ShapeGeometry(sh).rotateX(-Math.PI / 2);
  };
  parts.push(paint(shore(636, 6).translate(0, 0.15, 0), SAND));
  // the path: a strip along each link, a round patch under each stone
  for (const sp of BOARD) {
    parts.push(paint(at(new CircleGeometry(STONE_R + 5, 20).rotateX(-Math.PI / 2), sp.x, sp.y, 0.3), PATH));
    for (const j of sp.next) {
      const b = BOARD[j], len = Math.hypot(b.x - sp.x, b.y - sp.y), [ax, az] = toWorld(sp.x, sp.y), [bx, bz] = toWorld(b.x, b.y);
      const strip = new PlaneGeometry(14, len).rotateX(-Math.PI / 2).rotateY(Math.atan2(bx - ax, bz - az)).translate((ax + bx) / 2, 0.28, (az + bz) / 2);
      parts.push(paint(strip, PATH));
    }
  }
  // the bridges over the river: planks and two rails
  for (const br of bridges()) {
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
  // the museum the long way goes round (Board.svelte's house), and the signs' posts
  const [mx, mz] = toWorld(205, 318);
  parts.push(paint(new BoxGeometry(46, 22, 30).translate(mx, 11, mz), 0xf2e2c4, true));
  parts.push(paint(new ConeGeometry(34, 16, 4).rotateY(Math.PI / 4).scale(1, 1, 0.68).translate(mx, 30, mz), 0xb9785a, true));
  parts.push(paint(new BoxGeometry(10, 14, 1).translate(mx, 7, mz + 15.2), 0x8a5a3c, true));
  const signs = BOARD.map((sp, i) => ({ sp, i })).filter(({ sp, i }) => i > 0 && i < GOAL && BOARD[i - 1].area !== sp.area);
  for (const { sp } of signs) {
    const sx = sp.x < W / 2 ? sp.x - 26 : sp.x + 26;
    parts.push(paint(at(new BoxGeometry(1.6, 10, 1.6).translate(0, 5, 0), sx, sp.y + 4, 0), 0x8a6440));
  }
  // round trees (a trunk, a low-poly crown), kept off the route
  for (const [x, y, r] of TREES) {
    if (routeDist(x, y) < r + 16 || Math.abs(y - riverY(x)) < RIVER_HALF + r * 0.6) continue;
    parts.push(paint(at(new CylinderGeometry(r * 0.16, r * 0.22, r * 1.1, 6).translate(0, r * 0.55, 0), x, y, 0), 0x8a6440, true));
    parts.push(paint(at(new IcosahedronGeometry(r, 1).scale(1, 0.9, 1).translate(0, r * 1.55, 0), x, y, 0), (x * 7 + y) % 3 ? 0x5f9e54 : 0x6fb25e, true));
  }
  root.add(new Mesh(mergeGeometries(parts), solid));
  for (const g of parts) g.dispose();

  // the water: the river's ribbon across the island, the sea past the beach
  const pos: number[] = [], idx: number[] = [];
  for (let x = -720, n = 0; x <= 1080; x += 12, n++) {
    const y = riverY(x), [wx, z0] = toWorld(x, y - RIVER_HALF), [, z1] = toWorld(x, y + RIVER_HALF);
    pos.push(wx, 0.2, z0, wx, 0.2, z1);
    if (n) idx.push(2 * n - 2, 2 * n, 2 * n - 1, 2 * n - 1, 2 * n, 2 * n + 1);
  }
  const river = new BufferGeometry();
  river.setAttribute('position', new Float32BufferAttribute(pos, 3));
  river.setIndex(idx);
  river.computeVertexNormals();
  const sea = shore(668, 5).translate(0, 0.4, 0).deleteAttribute('uv');
  const waterGeo = mergeGeometries([river.toNonIndexed(), sea.toNonIndexed()]);
  river.dispose();
  sea.dispose();
  root.add(new Mesh(waterGeo, water));

  // the marks on the stones' tops, the signs' boards: one atlas
  const tops: BufferGeometry[] = [];
  BOARD.forEach((sp) => {
    const end = sp.kind === 'start' || sp.kind === 'goal', r = (end ? END_R : STONE_R) * 0.86;
    tops.push(at(intoCell(new CircleGeometry(r, 28), cellOfKind(sp.kind), 0.04).rotateX(-Math.PI / 2), sp.x, sp.y, STONE_T + 0.06).toNonIndexed());
  });
  for (const { sp } of signs) {
    const sx = sp.x < W / 2 ? sp.x - 26 : sp.x + 26;
    const board = new PlaneGeometry(22, 11), uv = board.getAttribute('uv');
    // (the cell's middle band: the label's 2:1)
    for (let k = 0; k < uv.count; k++) uv.setY(k, 0.25 + uv.getY(k) * 0.5);
    tops.push(at(intoCell(board, cellOfArea(sp.area)).rotateX(-0.35), sx, sp.y + 4, 12).toNonIndexed());
  }
  root.add(new Mesh(mergeGeometries(tops), marks));
  for (const g of tops) g.dispose();
  return root;
}
