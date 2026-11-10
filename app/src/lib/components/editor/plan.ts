// The editor's plan (docs/island-layout.md "The editor"): the layout drawn top-down on a 2D canvas, back of the island
// at the top (as the phones see it, the camera at the front), its view (scale and offset), and what is under the
// pointer. Pure but for the canvas it draws on.
import { GRID, TILE, idx, kindOf, tierOf, type Kind } from '#lib/layout/grid.ts';
import { goesIn, kindDef } from '#lib/layout/catalog.ts';
import { doorOf, facingVec, footOf, objMid, originOf, type Layout, type Obj } from '#lib/layout/model.ts';
import type { Issue } from '#lib/layout/validate.ts';
import type { Stem } from '#lib/layout/river.ts';
import { fenceMask, isFence } from '#lib/layout/garden.ts';

export interface View {
  /** Pixels per world unit, and where the grid's back-left corner (x0, z1) lands on the canvas (CSS px). */
  s: number;
  ox: number;
  oy: number;
}
const Z1 = GRID.z0 + GRID.rows * TILE;

export const toScreen = (v: View, x: number, z: number): [number, number] => [v.ox + (x - GRID.x0) * v.s, v.oy + (Z1 - z) * v.s];
export const toWorld = (v: View, px: number, py: number): [number, number] => [GRID.x0 + (px - v.ox) / v.s, Z1 - (py - v.oy) / v.s];
export const tileUnder = (v: View, px: number, py: number): [number, number] => {
  const [x, z] = toWorld(v, px, py);
  return [Math.floor((x - GRID.x0) / TILE), Math.floor((z - GRID.z0) / TILE)];
};
/** A view that fits the island in `w` × `h` px, the front of the island at the bottom: the grid's width, and along it
 *  the land's box (model.ts extentOf) and two tiles of sea (the whole grid without one; the grid keeps rows of sea
 *  behind the island for it to grow into). */
export function fitView(w: number, h: number, land?: { z0: number; z1: number }): View {
  const za = land && land.z1 > land.z0 ? Math.max(GRID.z0, land.z0 - 2 * TILE) : GRID.z0;
  const zb = land && land.z1 > land.z0 ? Math.min(Z1, land.z1 + 2 * TILE) : Z1;
  const s = Math.min((w - 40) / (GRID.cols * TILE), (h - 40) / (zb - za), 1.2);
  return { s, ox: (w - GRID.cols * TILE * s) / 2, oy: h - 20 - (Z1 - za) * s };
}
/** Zoom about a canvas point. */
export function zoomAt(v: View, px: number, py: number, k: number): View {
  const s = Math.max(0.12, Math.min(4, v.s * k));
  const [x, z] = toWorld(v, px, py);
  return { s, ox: px - (x - GRID.x0) * s, oy: py - (Z1 - z) * s };
}

/** The tiles' colours: NH's map, the higher tiers lighter. */
const BASE: Record<Kind, [number, number, number]> = {
  sea: [63, 143, 216], grass: [128, 196, 98], sand: [241, 217, 154], dirt: [201, 162, 107], stone: [180, 176, 166],
  brick: [197, 109, 80], plank: [185, 138, 85], river: [90, 180, 236], pond: [74, 166, 224]
};
function tileColour(kind: Kind, tier: number): string {
  const [r, g, b] = BASE[kind];
  const k = kind === 'sea' ? 0 : tier * 0.11;
  const m = (c: number) => Math.round(c + (255 - c) * k);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
const GROUP_COLOUR: Record<string, string> = {
  tree: '#2f8a3f', bush: '#3f9a4f', flower: '#d2589b', rock: '#7d7468', light: '#e6b22e', furniture: '#937047',
  season: '#5aa0d0', structure: '#6b5544', home: '#2f86bd', spot: '#d2701f', visitor: '#c2477a', crop: '#8a6a2f', fence: '#7a5530'
};
const OWNER: Record<string, [string, string]> = { 'home-A': ['#8fd3ff', 'ウェイ'], 'home-B': ['#ffb8cc', 'うめ'], 'home-G': ['#cdb4f2', 'お客さん'] };

export interface Draw {
  layout: Layout;
  view: View;
  w: number;
  h: number;
  grid: boolean;
  selected: ReadonlySet<string>;
  hover: [number, number] | null;
  /** Objects shown somewhere else (a drag in progress): id → their tile. */
  moved?: ReadonlyMap<string, { x: number; z: number; f: number }>;
  /** A placement's ghost. */
  ghost?: { k: string; x: number; z: number; f: number; ok: boolean } | null;
  /** The brush's tiles under the pointer. */
  brush?: [number, number][] | null;
  box?: { c0: number; r0: number; c1: number; r1: number } | null;
  issues: readonly Issue[];
  /** The issue in focus (its tiles drawn strongest). */
  focus?: Issue | null;
  /** A resize's new coast (しまの おおきさ: its grid codes): the land it gains or loses tinted, its outline dashed. */
  coast?: Uint8Array | null;
  /** The rivers' drawn lines and their turns' arcs (layout/river.ts), marked over the tiles; none: not shown. */
  river?: readonly Stem[] | null;
  icon(key: string): HTMLImageElement | null;
}

export function draw(ctx: CanvasRenderingContext2D, d: Draw): void {
  const { layout: l, view: v } = d;
  const T = TILE * v.s;
  ctx.clearRect(0, 0, d.w, d.h);
  ctx.fillStyle = '#2f74b8';
  ctx.fillRect(0, 0, d.w, d.h);
  // the visible tiles
  const [c0, r1] = tileUnder(v, 0, 0), [c1, r0] = tileUnder(v, d.w, d.h);
  const cA = Math.max(0, c0 - 1), cB = Math.min(GRID.cols - 1, c1 + 1), rA = Math.max(0, r0 - 1), rB = Math.min(GRID.rows - 1, r1 + 1);
  for (let r = rA; r <= rB; r++)
    for (let c = cA; c <= cB; c++) {
      const code = l.codes[idx(c, r)];
      const [x, y] = toScreen(v, GRID.x0 + c * TILE, GRID.z0 + (r + 1) * TILE);
      ctx.fillStyle = tileColour(kindOf(code), tierOf(code));
      ctx.fillRect(x, y, T + 0.5, T + 0.5);
    }
  // the cliffs: a dark edge on the higher side, a fall's white where a river steps down
  ctx.lineCap = 'round';
  for (let r = rA; r <= rB; r++)
    for (let c = cA; c <= cB; c++) {
      const k = l.kind(c, r);
      if (k === 'sea') continue;
      const t = l.tier(c, r);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nk = l.kind(c + dc, r + dr), nt = nk === 'sea' ? -1 : l.tier(c + dc, r + dr);
        if (nt >= t || nk === 'sea') continue;
        const fall = (k === 'river' || k === 'pond') && (nk === 'river' || nk === 'pond');
        // the shared edge's two ends (world): east/west a line along z, north/south along x
        const ex = GRID.x0 + (dc > 0 ? c + 1 : c) * TILE, ez = GRID.z0 + (dr > 0 ? r + 1 : r) * TILE;
        const [a, b] = dc ? [[ex, GRID.z0 + r * TILE], [ex, GRID.z0 + (r + 1) * TILE]] : [[GRID.x0 + c * TILE, ez], [GRID.x0 + (c + 1) * TILE, ez]];
        const [x0, y0] = toScreen(v, a[0], a[1]), [x1, y1] = toScreen(v, b[0], b[1]);
        ctx.strokeStyle = fall ? '#ffffff' : '#7a4f2c';
        ctx.lineWidth = Math.max(2, T * 0.12);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
  // the grid: tiles faint, chunks stronger
  if (d.grid && T >= 6) {
    ctx.lineWidth = 1;
    for (let c = cA; c <= cB + 1; c++) {
      const [x] = toScreen(v, GRID.x0 + c * TILE, 0);
      ctx.strokeStyle = c % 8 === 0 ? 'rgba(40,30,20,0.35)' : 'rgba(40,30,20,0.12)';
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, d.h);
      ctx.stroke();
    }
    for (let r = rA; r <= rB + 1; r++) {
      const [, y] = toScreen(v, 0, GRID.z0 + r * TILE);
      ctx.strokeStyle = r % 8 === 0 ? 'rgba(40,30,20,0.35)' : 'rgba(40,30,20,0.12)';
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(d.w, Math.round(y) + 0.5);
      ctx.stroke();
    }
  }
  // the issues' tiles
  for (const is of d.issues) {
    const strong = d.focus === is;
    ctx.fillStyle = is.level === 'error' ? `rgba(255,70,50,${strong ? 0.55 : 0.28})` : `rgba(255,190,40,${strong ? 0.5 : 0.22})`;
    for (const [c, r] of is.tiles) {
      const [x, y] = toScreen(v, GRID.x0 + c * TILE, GRID.z0 + (r + 1) * TILE);
      ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
    }
  }
  if (d.river) drawRiver(ctx, v, d.river);
  if (d.coast) drawCoast(ctx, d, d.coast, cA, cB, rA, rB);
  // the objects: big ones first (a thing on a table's top after its table), the selected last
  const objs = [...l.objects.values()].sort((a, b) => {
    const [aw, ad] = footOf(l, a), [bw, bd] = footOf(l, b);
    return bw * bd - aw * ad || +!!a.on - +!!b.on || (d.selected.has(a.id) ? 1 : 0) - (d.selected.has(b.id) ? 1 : 0);
  });
  for (const o of objs) {
    const m = d.moved?.get(o.id);
    drawObj(ctx, d, m ? { ...o, x: m.x, z: m.z, f: m.f as Obj['f'], n: undefined } : o, d.selected.has(o.id), !!m);
  }
  if (d.ghost) {
    const g = d.ghost;
    drawObj(ctx, d, { id: '', k: g.k, x: g.x, z: g.z, f: g.f as Obj['f'] }, false, true, g.ok ? 'ok' : 'bad');
  }
  // the brush
  if (d.brush?.length) {
    ctx.strokeStyle = '#fff9e3';
    ctx.lineWidth = 2;
    for (const [c, r] of d.brush) {
      const [x, y] = toScreen(v, GRID.x0 + c * TILE, GRID.z0 + (r + 1) * TILE);
      ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);
    }
  } else if (d.hover && !d.ghost) {
    const [c, r] = d.hover;
    const [x, y] = toScreen(v, GRID.x0 + c * TILE, GRID.z0 + (r + 1) * TILE);
    ctx.strokeStyle = 'rgba(255,249,227,0.9)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
  }
  if (d.box) {
    const { c0: a, r0: b, c1: e, r1: f } = d.box;
    const [x0, y0] = toScreen(v, GRID.x0 + Math.min(a, e) * TILE, GRID.z0 + (Math.max(b, f) + 1) * TILE);
    const [x1, y1] = toScreen(v, GRID.x0 + (Math.max(a, e) + 1) * TILE, GRID.z0 + Math.min(b, f) * TILE);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#fff9e3';
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = 'rgba(255,249,227,0.12)';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
}

/** A resize's ghost (the new codes over the layout): the tiles that turn land green, those the sea takes red, and the
 *  new coast (land against the sea) a dashed line. */
function drawCoast(ctx: CanvasRenderingContext2D, d: Draw, g: Uint8Array, cA: number, cB: number, rA: number, rB: number): void {
  const v = d.view, T = TILE * v.s;
  const land = (c: number, r: number) => c >= 0 && r >= 0 && c < GRID.cols && r < GRID.rows && kindOf(g[idx(c, r)]) !== 'sea';
  ctx.save();
  for (let r = rA; r <= rB; r++)
    for (let c = cA; c <= cB; c++) {
      const now = land(c, r), was = d.layout.kind(c, r) !== 'sea';
      if (now === was) continue;
      const [x, y] = toScreen(v, GRID.x0 + c * TILE, GRID.z0 + (r + 1) * TILE);
      ctx.fillStyle = now ? 'rgba(120,230,110,0.55)' : 'rgba(255,70,50,0.45)';
      ctx.fillRect(x, y, T + 0.5, T + 0.5);
    }
  ctx.setLineDash([Math.max(4, T * 0.3), Math.max(3, T * 0.2)]);
  ctx.lineWidth = Math.max(2, T * 0.1);
  ctx.strokeStyle = '#fff9e3';
  ctx.beginPath();
  for (let r = rA; r <= rB; r++)
    for (let c = cA; c <= cB; c++) {
      if (!land(c, r)) continue;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        if (land(c + dc, r + dr)) continue;
        const ex = GRID.x0 + (dc > 0 ? c + 1 : c) * TILE, ez = GRID.z0 + (dr > 0 ? r + 1 : r) * TILE;
        const [a, b] = dc ? [[ex, GRID.z0 + r * TILE], [ex, GRID.z0 + (r + 1) * TILE]] : [[GRID.x0 + c * TILE, ez], [GRID.x0 + (c + 1) * TILE, ez]];
        const [x0, y0] = toScreen(v, a[0], a[1]), [x1, y1] = toScreen(v, b[0], b[1]);
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
      }
    }
  ctx.stroke();
  ctx.restore();
}

/** The rivers as the 3D island draws them (layout/river.ts), over their tiles: the band's banks faint, the centreline,
 *  each turn's arc orange with its radius (in tiles) at its middle and a spoke from its centre, so a painter sees where
 *  the curves go. */
function drawRiver(ctx: CanvasRenderingContext2D, v: View, stems: readonly Stem[]): void {
  ctx.save();
  ctx.lineJoin = ctx.lineCap = 'round';
  for (const s of stems) {
    const line = (side: number) => {
      ctx.beginPath();
      for (let i = 0; i < s.x.length; i++) {
        const [x, y] = toScreen(v, s.x[i] - s.fz[i] * s.hw[i] * side, s.z[i] + s.fx[i] * s.hw[i] * side);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    };
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1;
    line(1);
    line(-1);
    ctx.setLineDash([]);
    ctx.strokeStyle = '#123a6b';
    ctx.lineWidth = 2;
    line(0);
    for (const a of s.arcs) {
      // its sweep: the way round from its start that comes to its end
      const a0 = Math.atan2(a.z0 - a.cz, a.x0 - a.cx), sw = (a.deg * Math.PI) / 180;
      const at = (th: number) => [a.cx + a.r * Math.cos(th), a.cz + a.r * Math.sin(th)];
      const [ex, ez] = at(a0 + sw), dir = Math.hypot(ex - a.x1, ez - a.z1) < 1 ? 1 : -1;
      ctx.strokeStyle = '#ff8a1f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const [x, y] = toScreen(v, ...(at(a0 + (dir * sw * k) / 24) as [number, number]));
        if (k) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      const [mx, my] = toScreen(v, ...(at(a0 + (dir * sw) / 2) as [number, number])), [cx, cy] = toScreen(v, a.cx, a.cz);
      ctx.strokeStyle = 'rgba(255,138,31,0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff8a1f';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      const label = `R ${(a.r / TILE).toFixed(1)}マス · ${Math.round(a.deg)}°`;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.strokeText(label, (mx + cx) / 2, (my + cy) / 2);
      ctx.fillStyle = '#a34a00';
      ctx.fillText(label, (mx + cx) / 2, (my + cy) / 2);
    }
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function drawObj(ctx: CanvasRenderingContext2D, d: Draw, o: Obj, selected: boolean, ghost: boolean, state?: 'ok' | 'bad') {
  const { layout: l, view: v } = d;
  const def = kindDef(o.k);
  if (!def) return;
  const [w, dd] = footOf(l, o);
  const T = TILE * v.s;
  const [ox, oz] = originOf(l, o);
  const [x, y] = toScreen(v, GRID.x0 + ox * TILE, GRID.z0 + (oz + dd) * TILE);
  const W = w * T, H = dd * T;
  ctx.globalAlpha = ghost ? 0.75 : 1;
  if (goesIn(o.k)) {
    // a home (its owner's colour, its look's word) or one of the island's buildings (its name)
    const home = o.k === 'home';
    const [fill, name] = home ? (OWNER[o.id] ?? ['#dddddd', '']) : ['#e9dcc0', def.ja];
    ctx.fillStyle = fill;
    roundRect(ctx, x + 2, y + 2, W - 4, H - 4, T * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#4a3a2c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const style = l.homes[o.id === 'home-B' ? 'B' : o.id === 'home-G' ? 'G' : 'A'];
    ctx.fillStyle = '#4a3a2c';
    ctx.font = `700 ${Math.max(9, Math.min(15, T * 0.45))}px "Zen Maru Gothic", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (home) {
      ctx.fillText(`${name}の家`, x + W / 2, y + H / 2 - T * 0.15);
      ctx.font = `500 ${Math.max(8, Math.min(12, T * 0.32))}px system-ui, sans-serif`;
      ctx.fillText(style.m === 'campsite' ? 'テント' : style.m.startsWith('tent') ? 'テント' : '家', x + W / 2, y + H / 2 + T * 0.32);
    } else ctx.fillText(name, x + W / 2, y + H / 2);
    // the door: a notch on the front edge
    const door = doorOf(l, o).at, [dx, dy] = toScreen(v, door[0], door[1]);
    ctx.fillStyle = '#7a4f2c';
    ctx.beginPath();
    ctx.arc(dx, dy, Math.max(3, T * 0.18), 0, Math.PI * 2);
    ctx.fill();
  } else if (o.k === 'stairs' || o.k === 'bridge') {
    ctx.fillStyle = o.k === 'stairs' ? 'rgba(170,165,155,0.95)' : 'rgba(160,150,135,0.95)';
    ctx.fillRect(x + 1, y + 1, W - 2, H - 2);
    ctx.strokeStyle = 'rgba(74,58,44,0.6)';
    ctx.lineWidth = 1;
    const [fx, fz] = facingVec(o.f);
    const steps = o.k === 'stairs' ? 6 : 8;
    for (let k = 1; k < steps; k++) {
      ctx.beginPath();
      if (fz !== 0) {
        const yy = y + (H * k) / steps;
        ctx.moveTo(x + 2, yy);
        ctx.lineTo(x + W - 2, yy);
      } else {
        const xx = x + (W * k) / steps;
        ctx.moveTo(xx, y + 2);
        ctx.lineTo(xx, y + H - 2);
      }
      ctx.stroke();
    }
    if (o.k === 'stairs') {
      // an arrow up the flight (away from its facing)
      const cx = x + W / 2, cy = y + H / 2, L = Math.min(W, H) * 0.32;
      const ax = -fx, ay = fz; // up the flight in screen space (z up the screen)
      ctx.strokeStyle = '#4a3a2c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - ax * L, cy - ay * L);
      ctx.lineTo(cx + ax * L, cy + ay * L);
      ctx.lineTo(cx + ax * L * 0.4 - ay * L * 0.5, cy + ay * L * 0.4 + ax * L * 0.5);
      ctx.moveTo(cx + ax * L, cy + ay * L);
      ctx.lineTo(cx + ax * L * 0.4 + ay * L * 0.5, cy + ay * L * 0.4 - ax * L * 0.5);
      ctx.stroke();
    }
  } else if (o.k === 'spot') {
    const [mx, my] = toScreen(v, ...objMid(l, o));
    ctx.fillStyle = '#d2701f';
    ctx.beginPath();
    ctx.arc(mx, my - T * 0.18, Math.max(3, T * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(mx - T * 0.12, my - T * 0.12);
    ctx.lineTo(mx, my + T * 0.15);
    ctx.lineTo(mx + T * 0.12, my - T * 0.12);
    ctx.fill();
    ctx.fillStyle = '#4a3a2c';
    ctx.font = `600 ${Math.max(8, T * 0.28)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(o.s === 'stage' ? 'ステージ' : o.s === 'villager-b' ? 'うめ' : 'ウェイ', mx, my + T * 0.18);
  } else if (isFence(o.k)) {
    // a fence as NH's map has it: a post and a bar to each neighbour it joins (layout/garden.ts), a lone one across or
    // along by its facing
    const [mx, my] = toScreen(v, ...objMid(l, o)), mask = fenceMask(l, o);
    ctx.strokeStyle = '#7a5530';
    ctx.lineWidth = Math.max(2, T * 0.16);
    ctx.beginPath();
    if (!mask) {
      const along = o.f % 2 === 1;
      ctx.moveTo(mx - (along ? 0 : T * 0.4), my - (along ? T * 0.4 : 0));
      ctx.lineTo(mx + (along ? 0 : T * 0.4), my + (along ? T * 0.4 : 0));
    }
    // (E, N, W, S: north is up the plan)
    [[1, 0], [0, -1], [-1, 0], [0, 1]].forEach(([dx, dy], i) => {
      if (!(mask & (1 << i))) return;
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + dx * T * 0.5, my + dy * T * 0.5);
    });
    ctx.stroke();
    ctx.fillStyle = '#5b3d20';
    ctx.beginPath();
    ctx.arc(mx, my, Math.max(2, T * 0.13), 0, Math.PI * 2);
    ctx.fill();
  } else {
    // its footprint, softly, and its icon over it (a default piece at its exact spot)
    ctx.fillStyle = `${GROUP_COLOUR[def.group] ?? '#937047'}33`;
    roundRect(ctx, x + 2, y + 2, W - 4, H - 4, T * 0.2);
    ctx.fill();
    const img = def.icon ? d.icon(iconKey(o)) : null;
    const [mx, my] = toScreen(v, ...objMid(l, o));
    if (img && img.complete && img.naturalWidth) {
      // its drawn height in tiles (a tree stands over its tile, a flower sits in it), as wide as its footprint at most
      const tall = T * Math.max(def.group === 'flower' ? 0.55 : 0.85, Math.min(2.4, (def.h || 30) / 45));
      const k = Math.min((W * 1.15) / img.naturalWidth, tall / img.naturalHeight);
      const iw = img.naturalWidth * k, ih = img.naturalHeight * k;
      ctx.save();
      if (!def.turns && o.f % 2) {
        ctx.translate(mx, 0);
        ctx.scale(-1, 1);
        ctx.translate(-mx, 0);
      }
      ctx.drawImage(img, mx - iw / 2, my + H / 2 - ih - 1, iw, ih);
      ctx.restore();
    } else {
      ctx.fillStyle = GROUP_COLOUR[def.group] ?? '#937047';
      ctx.beginPath();
      ctx.arc(mx, my, Math.max(3, Math.min(W, H) * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    if (def.turns) {
      // its front: a small mark on the front edge
      const [fx, fz] = facingVec(o.f);
      const [ex, ey] = [mx + (fx * W) / 2, my - (fz * H) / 2];
      ctx.fillStyle = '#4a3a2c';
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(2, T * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (selected || state) {
    ctx.strokeStyle = state === 'bad' ? '#ff4b3a' : state === 'ok' ? '#6ed07a' : '#ff8a00';
    ctx.lineWidth = 2.5;
    roundRect(ctx, x + 1, y + 1, W - 2, H - 2, T * 0.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** An object's palette icon (its variant's, where the art has one). */
function iconKey(o: Pick<Obj, 'k' | 's'>): string {
  const def = kindDef(o.k);
  if (!def) return '';
  if ((o.k === 'bush' || o.k === 'hedge') && o.s && !o.s.startsWith('month')) return `bushes/${o.s}`;
  if (o.k === 'garden-lantern' && o.s === 'white') return 'deco/garden-lantern-white';
  return def.icon;
}
