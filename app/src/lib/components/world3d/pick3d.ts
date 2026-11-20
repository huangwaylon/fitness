// The 3D pick (R4 step 5, behind the `pick3d` switch: testMode.ts pick3dOn): what a tap at a client point goes to and
// where a thing's tap area is, from the tap areas the island's models put in things3 (Tap3: each DOM tap area's shape
// in world units) projected through the 3D camera, never a DOM read. The DOM island's answer (island/probe.ts) stays
// the default and the oracle (e2e/probe3d.spec.ts); taps still go to the DOM till the canvas router (step 6). Island3D's
// chunk only.
import type { World } from '../island/camera.svelte.ts';
import { pickOf, type Box, type Picked } from '../island/probe.ts';
import type { At } from './engine.ts';
import { things3, type Claim, type Route, type Tap3 } from './things3.ts';
import { hull, zIndexAt } from '#lib/world/geom.ts';
import { PLAN } from '#lib/world/world.ts';
import { uiBoxes } from '../island/placement.ts';

/** A tap area on screen (client px): its box, or a body's outline; rounded corners (px radii, the top's and bottom's). */
export interface Area {
  tap: Tap3;
  l: number;
  t: number;
  r: number;
  b: number;
  poly: [number, number][] | null;
  rx: [number, number];
  ry: [number, number];
  clip: { l: number; t: number; r: number; b: number } | null;
  foot: [number, number];
  /** How far past it a tap still lands on it (px): SLOP. */
  slop: number;
}

const Q: At = { sx: 0, sy: 0, k: 0, up: 0, ground: 0, depth: 0, visible: false };
const C: At[] = Array.from({ length: 8 }, () => ({ ...Q }));

/** Every tap area now (things3's), top first: by the World's stacking (its depth, else its own order), a later one on
 *  top of an equal one (the DOM's order). */
export function tapsNow(w: World, extra: readonly Tap3[] = []): Tap3[] {
  const list = [...things3(w).taps.values(), ...extra];
  const z = new Map<Tap3, number>();
  list.forEach((t, i) => {
    const [x, tz] = t.live ? t.live() : [t.x, t.z];
    z.set(t, (t.zi ?? (t.body ? zIndexAt(t.z, t.x, PLAN.z1) : zIndexAt(tz + (t.dz ?? 0), x, PLAN.z1))) + i / (list.length + 1));
  });
  return list.sort((a, b) => z.get(b)! - z.get(a)!);
}

/** Tap area `t` on screen now (client px), or null where the World would hide its node (out of view, behind the
 *  horizon, past the screen's edges, out of the camera's z window). */
export function areaOf(w: World, t: Tap3): Area | null {
  const p = w.three, v = w.view;
  if (!p) return null;
  if (t.body) return bodyOf(w, t);
  const live = t.live?.(), x = live ? live[0] : t.x, z = live ? live[1] : t.z, lift = live?.[2] ?? t.lift ?? 0;
  if (!live && !t.always && (z < w.win[0] || z > w.win[1])) return null;
  const q = p.at(x, z, lift, Q), h = t.h ?? 80;
  if (!q.visible || q.sy - (h + lift) * q.k > v.vh + 40 || q.sy < -60 || q.sx < -400 || q.sx > v.vw + 400) return null;
  const k = q.k, ky = t.model ? q.k * q.up : q.k, sx = q.sx + v.left, sy = q.sy + v.top;
  let l = sx + t.l * k, r = sx + t.r * k, tp = sy - t.t * ky, b = sy - t.b * ky;
  if (t.base) {
    // (its model's lowest point on screen: canvas px)
    let low = -Infinity;
    for (const pt of p.outline?.(t.base) ?? []) low = Math.max(low, pt[1]);
    b = Math.max(b, low + v.top);
  }
  if (t.min) {
    const [mw, mh, how] = t.min;
    if (r - l < mw) [l, r] = [(l + r - mw) / 2, (l + r + mw) / 2];
    if (b - tp < mh) [tp, b] = how === 'mid' ? [(tp + b - mh) / 2, (tp + b + mh) / 2] : [b - mh, b];
  }
  const c = t.clip;
  const rd = t.round ?? [0, 0], px = t.radius === undefined ? null : Math.min(t.radius, (r - l) / 2, (b - tp) / 2);
  return {
    tap: t, l, t: tp, r, b, poly: null,
    rx: px === null ? [rd[0] * (r - l), rd[1] * (r - l)] : [px, px], ry: px === null ? [rd[0] * (b - tp), rd[1] * (b - tp)] : [px, px],
    clip: c ? { l: sx + c.l * k, r: sx + c.r * k, t: sy - c.t * ky, b: sy - c.b * ky } : null, foot: [sx, sy], slop: SLOP
  };
}

/** A building's body (camera.svelte.ts placeBody): its model's silhouette once built, its box's 8 corners till then. */
function bodyOf(w: World, t: Tap3): Area | null {
  const p = w.three!, v = w.view, bx = t.body!;
  const own = bx.shape ? p.outline?.(bx.shape) : null;
  let seen = false, behind = false;
  for (let i = 0; i < 8; i++) {
    const y = i & 1 ? bx.h : 0, q = p.at(i & 4 ? bx.x1 - 1 : bx.x0 + 1, i & 2 ? bx.z1 - 1 : bx.z0 + 1, y, C[i]);
    if (y === 0 && q.visible) seen = true;
    if (!own && q.depth <= 1) behind = true;
  }
  const pts: [number, number][] = (own ?? C.map((q) => [q.sx, q.sy] as const)).map(([x, y]) => [x + v.left, y + v.top]);
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const l = Math.min(...xs), r = Math.max(...xs), tp = Math.min(...ys), b = Math.max(...ys);
  if (!seen || behind || tp - v.top > v.vh + 2 || b - v.top < 0 || r - v.left < 0 || l - v.left > v.vw) return null;
  const f = p.at(t.x, t.z, 0, Q);
  return { tap: t, l, t: tp, r, b, poly: hull(pts), rx: [0, 0], ry: [0, 0], clip: null, foot: [f.sx + v.left, f.sy + v.top], slop: SLOP };
}

/** Inside a convex polygon (either way round), or within `pad` px of it. */
function inPoly(pts: readonly (readonly [number, number])[], x: number, y: number, pad: number): boolean {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], len = Math.hypot(bx - ax, by - ay);
    if (!len) continue;
    const d = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / len;
    (lo = Math.min(lo, d)), (hi = Math.max(hi, d));
  }
  return lo >= -pad || hi <= pad;
}

/** A tap this far past an area is on it (px): a finger's edge (the canvas router's taps; WebKit hit-tested the DOM
 *  island's areas a px or two past their boxes, a scaled node's a px of its own more, ~3–6 px zoomed in). */
const SLOP = 2;

/** Whether a tap at (x, y) is on area `a`, or within `pad` px of it (its rounded corners and its clip as the DOM
 *  hit-tests them). */
export function onArea(a: Area, x: number, y: number, pad = 0): boolean {
  if (x < a.l - pad || x > a.r + pad || y < a.t - pad || y > a.b + pad) return false;
  if (a.clip && (x < a.clip.l - pad || x > a.clip.r + pad || y < a.clip.t - pad || y > a.clip.b + pad)) return false;
  if (a.poly) return inPoly(a.poly, x, y, pad);
  // (a corner's ellipse: the top's radii in the top corners, the bottom's in the bottom ones)
  const top = y < (a.t + a.b) / 2, rx = a.rx[top ? 0 : 1], ry = a.ry[top ? 0 : 1];
  if (!rx || !ry) return true;
  const cx = x < a.l + rx ? a.l + rx : x > a.r - rx ? a.r - rx : x, cy = top ? (y < a.t + ry ? a.t + ry : y) : y > a.b - ry ? a.b - ry : y;
  return ((x - cx) / (rx + pad)) ** 2 + ((y - cy) / (ry + pad)) ** 2 <= 1;
}

/** The tap area a tap at client (x, y) is on (`taps`: tapsNow's, top first), and where it is, or null. */
function pickTap(w: World, taps: readonly Tap3[], x: number, y: number): Area | null {
  for (const t of taps) {
    const a = areaOf(w, t);
    if (a && onArea(a, x, y, a.slop)) return a;
  }
  return null;
}
const pickedOf = (t: Tap3): Picked => ({ kind: t.kind as Picked['kind'], id: t.id, also: (t.also ?? []).map((r) => ({ kind: r.kind as Picked['kind'], id: r.id })) });
/** What a tap at client (x, y) goes to by the tap areas (`taps`: tapsNow's, top first), or null (the ground, the sky). */
export function pickTaps(w: World, taps: readonly Tap3[], x: number, y: number): Picked | null {
  const a = pickTap(w, taps, x, y);
  return a ? pickedOf(a.tap) : null;
}

/** The kinds whose box has a foot (probe.ts areaOf's `node`). */
const FOOTED = new Set(['villager', 'goal']);
/** Whether tap area `tp` is a part of thing (`kind`, `id`)'s box (probe.ts areaOf's: a tree's leaves and trunk, a goal
 *  tree's canopy and trunk; a `trunk` the trunk alone; a bench's seat as its fixture too). */
const partOf = (tp: Tap3, kind: string, id: string): boolean =>
  kind === 'trunk'
    ? tp.id === id && (tp.kind === 'tree' || tp.kind === 'goal') && tp.part === 'trunk'
    : (tp.kind === kind && tp.id === id) || !!tp.also?.some((o) => o.kind === kind && o.id === id);

/** Where thing (`kind`, `id`)'s tap area is on screen (its areas united), or null (none in view). */
export function boxTaps(w: World, taps: readonly Tap3[], kind: string, id = ''): Box | null {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, foot: [number, number] | null = null;
  for (const tp of taps) {
    if (!partOf(tp, kind, id)) continue;
    const a = areaOf(w, tp);
    if (!a) continue;
    [l, t, r, b] = [Math.min(l, a.l), Math.min(t, a.t), Math.max(r, a.r), Math.max(b, a.b)];
    if (FOOTED.has(kind) && (!foot || tp.part === 'trunk')) foot = a.foot;
  }
  return l < Infinity ? { left: l, top: t, width: r - l, height: b - t, foot } : null;
}

/** Every control's tap area shown (probe.ts controlsOf's island kinds), stacked or not. */
export function controlTaps(w: World, taps: readonly Tap3[], kinds: ReadonlySet<string>) {
  const out: { kind: string; id: string; box: { left: number; top: number; width: number; height: number } }[] = [];
  const seen = new Map<string, number>();
  for (const tp of taps) {
    if (!kinds.has(tp.kind)) continue;
    const a = areaOf(w, tp);
    if (!a) continue;
    const key = `${tp.kind}:${tp.id}`, i = seen.get(key);
    if (i === undefined) {
      seen.set(key, out.length);
      out.push({ kind: tp.kind, id: tp.id, box: { left: a.l, top: a.t, width: a.r - a.l, height: a.b - a.t } });
    } else {
      const bx = out[i].box, l = Math.min(bx.left, a.l), t = Math.min(bx.top, a.t);
      out[i].box = { left: l, top: t, width: Math.max(bx.left + bx.width, a.r) - l, height: Math.max(bx.top + bx.height, a.b) - t };
    }
  }
  return out;
}

/** The island's controls the tap areas stand for (probe.ts CONTROLS less the HUD's `ui` and the speech balloon's
 *  `talk`, which stay the DOM's). */
export const ISLAND_CONTROLS: ReadonlySet<string> = new Set(['villager', 'building', 'decor', 'goal', 'row', 'board', 'balloon', 'swarm', 'drop']);
/** The kinds whose DOM nodes are gone (R4 step 7): with the switch off (`?pick3d=0`, the DOM's answer) their tap areas
 *  answer where the DOM has nothing. */
export const GONE: ReadonlySet<string> = new Set(['flower', 'decor', 'tree', 'bush', 'campfire', 'sit', 'fixture', 'building', 'drop', 'swarm']);
/** What a tap at client (x, y) is of the GONE kinds by their tap areas, or null (the DOM's path's fallback); `act`: a
 *  control's own (the decor's, a building's: it has no button to take the click); `onHouse`: a building's, whether a
 *  point is on its body. */
export function pickGone(w: World, x: number, y: number): (Picked & { act?: (e: MouseEvent) => void; onHouse?: (px: number, py: number) => boolean }) | null {
  const a = pickTap(w, tapsNow(w).filter((t) => GONE.has(t.kind)), x, y), act = a?.tap.act;
  return a ? { ...pickedOf(a.tap), act: act && ((e) => act(x, y, a, e)), onHouse: a.tap.body ? (px, py) => onArea(a, px, py) : undefined } : null;
}
/** The box kinds the tap areas answer (the rest, the figures the scene hit-tests itself, are the DOM's for now). */
export const PICKED: ReadonlySet<string> = new Set([...ISLAND_CONTROLS, 'tree', 'trunk', 'bush', 'campfire', 'sit', 'fixture', 'flower']);
/** What stays the DOM's over the island (an overlay drawn over the canvas): the tree's popup, a speech balloon, a mark. */
const KEEP = '[data-tree-pop], [data-fx], [data-say], [data-mumble], [data-catch-stack]';

/** Whether the DOM keeps a tap on `el` (off the stage, an overlay, the HUD's and the sheets' buttons, the speech
 *  balloon), and the DOM's answer there. */
function domKeeps(el: Element | null): { keep: boolean; dom: Picked | null } {
  const dom = pickOf(el);
  return { keep: !!el && (!el.closest('.stage') || !!el.closest(KEEP) || dom?.kind === 'ui' || dom?.kind === 'talk'), dom };
}

/** What the canvas router acts on at client (x, y) (things3 Route): the DOM's where it stays, nothing in a rush, else
 *  the tap area under it and, a building's, its body. */
export function route3d(w: World, doc: Pick<Document, 'elementFromPoint'>, x: number, y: number): Route {
  if (domKeeps(doc.elementFromPoint(x, y)).keep) return 'dom';
  if (w.three?.rushing?.()) return 'rush';
  const taps = tapsNow(w), a = pickTap(w, taps, x, y), t = a?.tap ?? null;
  const body = t?.kind === 'building' ? (t.body ? a : ((b) => b && areaOf(w, b))(taps.find((o) => o.kind === 'building' && o.id === t.id && o.body))) : null;
  return { under: t && pickedOf(t), tap: t, area: a, onHouse: body ? (px, py) => onArea(body, px, py) : undefined };
}

/** What a tap at client (x, y) goes to with the switch on: the DOM's answer where the DOM stays (off the stage, an
 *  overlay, the HUD's and the sheets' buttons), else the tap areas' (null in a rush: a touch on a fling only stops it). */
export function pick3dAt(w: World, doc: Pick<Document, 'elementFromPoint'>, x: number, y: number): Picked | null {
  const el = doc.elementFromPoint(x, y), { keep, dom } = domKeeps(el);
  if (keep) return dom;
  if (w.three?.rushing?.()) return null;
  return pickTaps(w, tapsNow(w), x, y);
}

/** What a tap at client (x, y) on the island goes to in the scene's own chain before the scenery and the ground
 *  (SceneTaps claims: a plot, a visitor, K.K., a critter, the deck, the cake, a find, a weed, a cast…), or null (what
 *  `pick` says takes it). `src` 3d: under it the tap areas' answer and the modules' boxes from the 3D island (models'
 *  silhouettes, figures' spots); dom: the DOM's node and art (the oracle). Off the island (the HUD, an overlay): null. */
export function claimAt(w: World, doc: Pick<Document, 'elementFromPoint'>, x: number, y: number, src: 'dom' | '3d'): Claim | null {
  const chain = things3(w).claims, el = doc.elementFromPoint(x, y), { keep, dom } = domKeeps(el);
  if (!chain || !el || keep) return null;
  // (the DOM's answer, else the kinds whose nodes are gone by their tap areas: SceneTaps onClick's)
  if (src === 'dom') return ((g) => chain(x, y, dom ?? g, 'dom', g?.onHouse))(dom ? null : pickGone(w, x, y));
  const r = route3d(w, doc, x, y);
  return typeof r === 'string' ? null : chain(x, y, r.under, '3d', r.onHouse);
}

/** The island's controls a guard stands for (the balloon's is never one: placement.ts). */
const GUARDED: ReadonlySet<string> = new Set([...ISLAND_CONTROLS].filter((k) => k !== 'balloon'));
/** placement.ts' guards (what an overlay or a figure keeps clear of, client px, 6 px round each) with the island's
 *  controls' boxes from the tap areas (`skip`: leave some out, by kind and id), the HUD's, the popup's and the
 *  overlays' still the DOM's (things3 guards3: standsClear's and the balloon's present's, with the switch). */
export function guards3(w: World, skip?: (c: Claim) => boolean): { x0: number; x1: number; y0: number; y1: number }[] {
  const island = (el: Element) => el.tagName === 'BUTTON' && !!el.closest('.stage') && ((p) => !!p && ISLAND_CONTROLS.has(p.kind))(pickOf(el));
  return [...uiBoxes(island, () => false), ...tapGuards(w, (t) => GUARDED.has(t.kind) && !skip?.({ kind: t.kind, id: t.id }))];
}
/** The boxes of the tap areas `take` takes (client px, 6 px round each: each area its own, as each of the DOM's buttons
 *  is: a goal tree's canopy and trunk). */
function tapGuards(w: World, take: (t: Tap3) => boolean): { x0: number; x1: number; y0: number; y1: number }[] {
  const out: { x0: number; x1: number; y0: number; y1: number }[] = [];
  for (const t of tapsNow(w)) {
    const a = take(t) ? areaOf(w, t) : null;
    if (a) out.push({ x0: a.l - 6, y0: a.t - 6, x1: a.r + 6, y1: a.b + 6 });
  }
  return out;
}
/** The guards of the island's controls whose DOM buttons are gone (GONE: the decor, a building) of the kinds `keep`
 *  takes (placement.ts' guards' with no button to measure: provideGoneGuards, Island3D's). */
export const goneGuards = (w: World, keep: (kind: string) => boolean) => tapGuards(w, (t) => GUARDED.has(t.kind) && GONE.has(t.kind) && keep(t.kind));
