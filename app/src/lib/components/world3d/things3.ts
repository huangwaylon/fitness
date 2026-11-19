// The 3D island's things (R4 step 4): what Island3D's mirror draws, as data. A model writes each thing it has on the
// island here, by id: its NH model (`m3`) and where it is (a spot, or its live position). The DOM island's `m3` nodes
// (camera.svelte.ts World.at) are the old source, read beside it till each group of models has moved here; a thing here
// whose id a node also has is drawn from here, and the e2e's twin check (`checkTwins`) holds the two to agree meanwhile.
// Whether a thing is in view is the projector's own rule (World.place), worked out here from the camera, not a node.
import type { M3, Model3, World } from '../island/camera.svelte.ts';
import type { At } from './engine.ts';

export interface Thing3 {
  m3: M3;
  x: number;
  z: number;
  /** Units above the ground (a flier's height). */
  lift?: number;
  /** Its height (u) for the in-view test (default 80). */
  h?: number;
  /** A moving thing's live position, read each frame: [x, z, lift?]. */
  live?: () => readonly [number, number, number?];
  /** In view wherever it is along the island (the projector's `always`: not held to the camera's z window). */
  always?: boolean;
}
interface Entry extends Thing3 {
  id: string;
  /** The DOM node it was attached to, while the DOM island lasts (its art hidden once the model stands: Island3D). */
  el: HTMLElement | null;
}
type Node = ReturnType<World['models3']>[number];
/** One of mirror's sources: a registered thing, or an old `m3` node. */
export type Src = Entry | Node;

interface Registry {
  map: Map<string, Entry>;
  list: Src[] | null;
  nodes: readonly Node[] | null;
  /** The twin check (the e2e's): each frame a node and a thing share an id, what differs between them. */
  twins: { n: number; diffs: string[] } | null;
}
const regs = new WeakMap<World, Registry>();
function reg(w: World): Registry {
  let r = regs.get(w);
  if (!r) regs.set(w, (r = { map: new Map(), list: null, nodes: null, twins: null }));
  return r;
}

/** Put a thing on the island (`{@attach thing(w, id, t)}`, or called with no element): taken off by the returned
 *  function. A later one of the same id replaces it; an earlier one's taking off then does nothing. */
export function thing(w: World, id: string, t: Thing3): (el?: HTMLElement) => () => void {
  return (el?: HTMLElement) => {
    const r = reg(w), e: Entry = { ...t, id, el: el ?? null };
    // (the node's art hidden from its first frame, till the 3D island says it has no model for it: World.at's data-m3)
    if (el && !t.m3.art) el.toggleAttribute('data-m3', true);
    r.map.set(id, e);
    r.list = null;
    w.kick();
    return () => {
      if (r.map.get(id) !== e) return;
      r.map.delete(id);
      r.list = null;
    };
  };
}

/** Whether a thing of this id is on the island. */
export const has3 = (w: World, id: string): boolean => !!regs.get(w)?.map.has(id);

/** Every model mirror draws: the old nodes (but those whose id a thing has) and the things. The list is kept till
 *  either changes (read each frame). */
export function models3(w: World): readonly Src[] {
  const r = reg(w), nodes = w.models3();
  if (r.list && r.nodes === nodes) return r.list;
  r.nodes = nodes;
  r.list = [];
  for (const n of nodes) if (!r.map.has(n.m3!.id ?? n.id3)) r.list.push(n);
  for (const e of r.map.values()) r.list.push(e);
  return r.list;
}

const isEntry = (s: Src): s is Entry => !('id3' in s);
const rec: Model3 = { id: '', m3: null as unknown as M3, x: 0, z: 0, lift: 0, el: null, shown: false };

/** A source's model where it is now, in one record rewritten each call (read it before the next). */
export function model3(w: World, s: Src): Model3 {
  if (!isEntry(s)) return w.model3(s);
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
  reg(w).twins ??= { n: 0, diffs: [] };
}
/** What the twin check found so far (null: off). */
export const twins = (w: World): { n: number; diffs: string[] } | null => regs.get(w)?.twins ?? null;

/** The fields compared (an M3's own, read now: getters included). */
const M3_KEYS = ['key', 'id', 'yaw', 'pitch', 'flap', 'grey', 'off', 'ms', 'y', 'water', 'drop', 'size', 'face'] as const;
const close = (a: unknown, b: unknown) => a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-6);

/** Compare each twin (a node and a thing of one id) once: after the World's step, before mirror reads them. */
export function twinFrame(w: World): void {
  const r = regs.get(w);
  if (!r?.twins) return;
  for (const n of w.models3()) {
    const id = n.m3!.id ?? n.id3, e = r.map.get(id);
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
}
