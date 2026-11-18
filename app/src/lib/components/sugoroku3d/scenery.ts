// 英語すごろく's route in 3D (engine.ts; the island under it: island.ts): the stepping stones (NH's round flat stones in
// their kind's colour, its mark on top) and the stretches' wooden signs. Few draws: the stones' bodies and the signs'
// posts one mesh (vertex colours), the marks and the signs' boards one canvas atlas.
import { BoxGeometry, BufferGeometry, CanvasTexture, CircleGeometry, Color, Float32BufferAttribute, Group, LatheGeometry, Mesh, MeshLambertMaterial, PlaneGeometry, SRGBColorSpace, Vector2 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BOARD, GOAL, W } from '#lib/sugoroku/board.ts';
import { s } from '#lib/sugoroku/i18n.ts';
import { END_R, STONE_R, STONE_T, toWorld } from './plan.ts';

type Kind = (typeof BOARD)[number]['kind'];
/** Each kind's stone (Board.svelte's fills): ことば cream, ダブル sky, ぶん mint, 絵 peach, イベント lilac, the ends yuzu. */
const KIND_COLOUR: Record<Kind, number> = { word: 0xfff9e3, double: 0x84b9e9, sentence: 0x9ce1d0, picture: 0xf7c9a8, event: 0xd7c3f5, start: 0xffd84d, goal: 0xffd84d };
const MARK: Record<Kind, string> = { start: s('kind.start'), word: 'A', double: '×2', sentence: '文', picture: '絵', event: '!', goal: s('kind.goal') };
const KINDS = Object.keys(KIND_COLOUR) as Kind[];
const AREAS = [...new Set(BOARD.map((b) => b.area))];
const INK = '#4a3a2c', WOOD = 0xa8835a, TONE = 0xe8e8e8;
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

/** `geo` (non-indexed, no uv) with one colour on every vertex, ready to merge. */
function paint(geo: BufferGeometry, colour: number): BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  g.deleteAttribute('uv');
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

/** A stepping stone's body (NH's: a round flat stone, its top's edge rounded off, its foot sunk in the path): its top
 *  `top`, shading to `side` down its side (vertex colours). */
function stoneBody(r: number, top: number, side: number): BufferGeometry {
  const T = STONE_T;
  const prof = [[r * 0.9, -1.2], [r, 0.4], [r, T - 1.4], [r - 0.35, T - 0.55], [r - 1.1, T - 0.1], [r - 1.8, T], [0, T]].map(([x, y]) => new Vector2(x, y));
  const g = new LatheGeometry(prof, 32);
  const flat = g.toNonIndexed();
  g.dispose();
  flat.deleteAttribute('uv');
  flat.computeVertexNormals();
  const pos = flat.getAttribute('position'), a = new Float32Array(pos.count * 3), ct = new Color(top), cs = new Color(side), c = new Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(cs).lerp(ct, Math.min(1, Math.max(0, (pos.getY(i) - (T - 1.4)) / 1.2)));
    a.set([c.r, c.g, c.b], i * 3);
  }
  flat.setAttribute('color', new Float32BufferAttribute(a, 3));
  return flat;
}

/** Where a stretch's sign stands (plan point): beside its first stone, on the board's outer side, on the beach at most
 *  (islandPlan.ts: the land is the board's width). */
const signAt = (sp: (typeof BOARD)[number]): [number, number] => [Math.min(W - 8, Math.max(8, sp.x < W / 2 ? sp.x - 26 : sp.x + 26)), sp.y + 4];

/** The route's group: the stones, their marks, the signs (its geometries, materials and atlas released with the scene:
 *  engine.ts). */
export function buildRoute(): Group {
  const root = new Group();
  root.name = 'route';
  // (toned for the island's bright day light, world3d/engine.ts TOD.day: the kinds' colours as Board.svelte shows them)
  const solid = new MeshLambertMaterial({ vertexColors: true, color: TONE });
  const marks = new MeshLambertMaterial({ map: atlas(), color: TONE });

  // the stones' bodies (the ends bigger), the signs' posts
  const parts: BufferGeometry[] = BOARD.map((sp) => {
    const end = sp.kind === 'start' || sp.kind === 'goal', c = new Color(KIND_COLOUR[sp.kind]);
    return at(stoneBody(end ? END_R : STONE_R, c.getHex(), c.clone().multiplyScalar(0.74).getHex()), sp.x, sp.y, 0);
  });
  const signs = BOARD.filter((sp, i) => i > 0 && i < GOAL && BOARD[i - 1].area !== sp.area);
  for (const sp of signs) parts.push(paint(at(new BoxGeometry(1.6, 10, 1.6).translate(0, 5, 0), ...signAt(sp), 0), 0x8a6440));
  const body = new Mesh(mergeGeometries(parts), solid);
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  for (const g of parts) g.dispose();

  // the marks on the stones' tops, the signs' boards: one atlas
  const tops: BufferGeometry[] = BOARD.map((sp) => {
    const end = sp.kind === 'start' || sp.kind === 'goal', r = (end ? END_R : STONE_R) * 0.84;
    return at(intoCell(new CircleGeometry(r, 32), cellOfKind(sp.kind), 0.04).rotateX(-Math.PI / 2), sp.x, sp.y, STONE_T + 0.06).toNonIndexed();
  });
  for (const sp of signs) {
    const board = new PlaneGeometry(22, 11), uv = board.getAttribute('uv');
    // (the cell's middle band: the label's 2:1)
    for (let k = 0; k < uv.count; k++) uv.setY(k, 0.25 + uv.getY(k) * 0.5);
    tops.push(at(intoCell(board, cellOfArea(sp.area)).rotateX(-0.35), ...signAt(sp), 12).toNonIndexed());
  }
  const top = new Mesh(mergeGeometries(tops), marks);
  top.receiveShadow = true;
  root.add(top);
  for (const g of tops) g.dispose();
  return root;
}
