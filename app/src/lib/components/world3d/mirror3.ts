// What Island3D's mirror draws (R4 step 4): the things3 registry read beside the DOM island's old `m3`/`v3` nodes
// (camera.svelte.ts World.at) till each group of models has moved over; a node whose id (a character: its actor) a thing
// has is drawn from the thing, and the e2e's twin check (`checkTwins`) holds the two to agree meanwhile. Whether a thing
// is in view is the projector's own rule (World.place), worked out from the camera, not a node.
import type { M3, Model3, V3, World } from '../island/camera.svelte.ts';
import type { At } from './engine.ts';
import { things3, type Entry } from './things3.ts';

type Node = ReturnType<World['models3']>[number];
/** One of mirror's sources: a registered thing, or an old `m3` node. */
export type Src = Entry | Node;

interface Reader {
  list: Src[] | null;
  nodes: readonly Node[] | null;
  rev: number;
  /** model3's record, rewritten each call (per World: a module's would hold the last island's element, and through it
   *  its whole DOM and canvas, after it's gone: leaks.spec). */
  rec: Model3;
  /** The twin check (the e2e's): each frame a node and a thing share an id, what differs between them. */
  twins: { n: number; diffs: string[] } | null;
}
const readers = new WeakMap<World, Reader>();
function reader(w: World): Reader {
  let r = readers.get(w);
  if (!r) readers.set(w, (r = { list: null, nodes: null, rev: -1, rec: { id: '', m3: null as unknown as M3, x: 0, z: 0, lift: 0, el: null, shown: false }, twins: null }));
  return r;
}

/** Each character the 3D island draws, where it is now and whether in view: the old `v3` nodes (but an actor a figure
 *  has) and the figures. */
export function eachV3(w: World, fn: (v3: V3, x: number, z: number, shown: boolean) => void): void {
  const figs = things3(w).figs;
  if (!figs.size) return w.eachV3(fn);
  w.eachV3((v, x, z, shown) => void (figs.has(v.actor ?? 'visitor') || fn(v, x, z, shown)));
  for (const f of figs.values()) {
    const p = f.live?.(), x = p ? p[0] : f.x, z = p ? p[1] : f.z;
    fn(f.v3, x, z, inShot(w, x, z, 0, f.h ?? 80, !!f.live || !!f.always));
  }
}

/** Every model mirror draws: the old nodes (but those whose id a thing has) and the things. The list is kept till
 *  either changes (read each frame). */
export function models3(w: World): readonly Src[] {
  const r = reader(w), t = things3(w), nodes = w.models3();
  if (r.list && r.nodes === nodes && r.rev === t.rev) return r.list;
  r.nodes = nodes;
  r.rev = t.rev;
  r.list = [];
  for (const n of nodes) if (!t.map.has(n.m3!.id ?? n.id3)) r.list.push(n);
  for (const e of t.map.values()) r.list.push(e);
  return r.list;
}

const isEntry = (s: Src): s is Entry => !('id3' in s);

/** A source's model where it is now, in one record rewritten each call (read it before the next). */
export function model3(w: World, s: Src): Model3 {
  if (!isEntry(s)) return w.model3(s);
  const rec = reader(w).rec;
  if (s.live) {
    const p = s.live();
    (rec.x = p[0]), (rec.z = p[1]), (rec.lift = p[2] ?? s.lift ?? 0);
  } else (rec.x = s.x), (rec.z = s.z), (rec.lift = s.lift ?? 0);
  rec.id = s.id;
  rec.m3 = s.m3;
  rec.el = s.el;
  rec.shown = inShot(w, rec.x, rec.z, rec.lift, s.h ?? 80, !!s.live || !!s.always);
  return rec;
}

const Q: At = { sx: 0, sy: 0, k: 0, up: 0, ground: 0, depth: 0, visible: false };
/** In view, by the projector's rule (World.placeNode, place): in its z window (or `free`: moving, or always placed), in
 *  front of the horizon, not past the screen's bottom by its height, nor far past its other edges. */
export function inShot(w: World, x: number, z: number, lift: number, h: number, free: boolean): boolean {
  const t = w.three, v = w.view;
  if (!t || (!free && (z < w.win[0] || z > w.win[1]))) return false;
  const q = t.at(x, z, lift, Q);
  return q.visible && !(q.sy - (h + lift) * q.k > v.vh + 40 || q.sy < -60 || q.sx < -400 || q.sx > v.vw + 400);
}

/** The e2e's twin check on (testHooks): each frame, every node a thing shares an id with is compared to it. */
export function checkTwins(w: World): void {
  reader(w).twins ??= { n: 0, diffs: [] };
}
/** What the twin check found so far (null: off). */
export const twins = (w: World): { n: number; diffs: string[] } | null => readers.get(w)?.twins ?? null;

/** The fields compared (an M3's own, read now: getters included). */
const M3_KEYS = ['key', 'id', 'yaw', 'pitch', 'flap', 'grey', 'off', 'ms', 'y', 'water', 'drop', 'size', 'face'] as const;
const close = (a: unknown, b: unknown) => a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-6);

/** Compare each twin (a node and a thing of one id) once: after the World's step, before mirror reads them. */
export function twinFrame(w: World): void {
  const r = readers.get(w), t = things3(w);
  if (!r?.twins) return;
  for (const n of w.models3()) {
    const id = n.m3!.id ?? n.id3, e = t.map.get(id);
    if (!e) continue;
    r.twins.n++;
    const a = { ...w.model3(n) }, b = model3(w, e), out: string[] = [];
    // (a live position read twice, a moment apart: a mover's a hair on)
    for (const k of ['x', 'z', 'lift'] as const) if (!(Math.abs(a[k] - b[k]) < (e.live ? 0.5 : 1e-6))) out.push(`${k} ${a[k]}≠${b[k]}`);
    if (a.shown !== b.shown) out.push(`shown ${a.shown}≠${b.shown}`);
    for (const k of M3_KEYS) if (!close(a.m3[k], b.m3[k])) out.push(`m3.${k} ${a.m3[k]}≠${b.m3[k]}`);
    if (!!a.m3.emit !== !!b.m3.emit || (a.m3.emit && (a.m3.emit.kind !== b.m3.emit!.kind || a.m3.emit.every !== b.m3.emit!.every))) out.push('m3.emit');
    if (!!a.m3.line !== !!b.m3.line || !!a.m3.wash !== !!b.m3.wash || !!a.m3.art !== !!b.m3.art) out.push('m3.line/wash/art');
    if (out.length && r.twins.diffs.length < 50) r.twins.diffs.push(`${id}: ${out.join(', ')}`);
  }
  if (!t.figs.size) return;
  const seen = new Map<string, [V3, number, number, boolean]>();
  w.eachV3((v, x, z, shown) => void seen.set(v.actor ?? 'visitor', [v, x, z, shown]));
  for (const [id, f] of t.figs) {
    const a = seen.get(id);
    if (!a) continue;
    r.twins.n++;
    const [x, z] = f.live ? f.live() : [f.x, f.z], shown = inShot(w, x, z, 0, f.h ?? 80, !!f.live || !!f.always), out: string[] = [];
    const tol = f.live ? 0.5 : 1e-6;
    if (!(Math.abs(a[1] - x) < tol) || !(Math.abs(a[2] - z) < tol)) out.push(`at ${a[1]},${a[2]}≠${x},${z}`);
    if (a[3] !== shown) out.push(`shown ${a[3]}≠${shown}`);
    for (const k of ['id', 'actor', 'seat', 'yaw'] as const) if (a[0][k] !== f.v3[k]) out.push(`v3.${k} ${a[0][k]}≠${f.v3[k]}`);
    if (!!a[0].also !== !!f.v3.also || a[0].also?.id !== f.v3.also?.id) out.push('v3.also');
    if (out.length && r.twins.diffs.length < 50) r.twins.diffs.push(`v3 ${id}: ${out.join(', ')}`);
  }
}
