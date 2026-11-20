// What Island3D's mirror draws (R4 step 4): the things3 registry's things and figures, each where it is now and whether
// in view by the projector's own rule (World.place), worked out from the camera, not a node.
import type { World } from '../island/camera.svelte.ts';
import type { At } from './engine.ts';
import { things3, type Entry, type M3, type Model3, type V3 } from './things3.ts';

interface Reader {
  list: Entry[] | null;
  rev: number;
  /** model3's record, rewritten each call (per World: a module's would hold the last island's element, and through it
   *  its whole DOM and canvas, after it's gone: leaks.spec). */
  rec: Model3;
}
const readers = new WeakMap<World, Reader>();
function reader(w: World): Reader {
  let r = readers.get(w);
  if (!r) readers.set(w, (r = { list: null, rev: -1, rec: { id: '', m3: null as unknown as M3, x: 0, z: 0, lift: 0, el: null, shown: false } }));
  return r;
}

/** Each character the 3D island draws (the figures), where it is now and whether in view. */
export function eachV3(w: World, fn: (v3: V3, x: number, z: number, shown: boolean) => void): void {
  for (const f of things3(w).figs.values()) {
    const p = f.live?.(), x = p ? p[0] : f.x, z = p ? p[1] : f.z;
    fn(f.v3, x, z, inShot(w, x, z, 0, f.h ?? 80, !!f.live || !!f.always));
  }
}

/** Every model mirror draws. The list is kept till a thing comes or goes (read each frame). */
export function models3(w: World): readonly Entry[] {
  const r = reader(w), t = things3(w);
  if (!r.list || r.rev !== t.rev) (r.list = [...t.map.values()]), (r.rev = t.rev);
  return r.list;
}

/** A thing's model where it is now, in one record rewritten each call (read it before the next). */
export function model3(w: World, s: Entry): Model3 {
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

/** Whether thing `id` is in view now, by the projector's rule (false: no such thing). */
export function shown3(w: World, id: string): boolean {
  const s = things3(w).map.get(id);
  return !!s && model3(w, s).shown;
}

/** Whether the figure of actor `actor` (visitor, guest, kk) is in view now, by the projector's rule (false: none). */
export function figShown3(w: World, actor: string): boolean {
  const f = things3(w).figs.get(actor), p = f?.live?.();
  return !!f && inShot(w, p ? p[0] : f.x, p ? p[1] : f.z, 0, f.h ?? 80, !!f.live || !!f.always);
}

const Q: At = { sx: 0, sy: 0, k: 0, up: 0, ground: 0, depth: 0, visible: false };
/** In view, by the projector's rule (World.placeNode, place): in its z window (or `free`: moving, or always placed), in
 *  front of the horizon, not past the screen's bottom by its height, nor far past its other edges. */
function inShot(w: World, x: number, z: number, lift: number, h: number, free: boolean): boolean {
  const t = w.three, v = w.view;
  if (!t || (!free && (z < w.win[0] || z > w.win[1]))) return false;
  const q = t.at(x, z, lift, Q);
  return q.visible && !(q.sy - (h + lift) * q.k > v.vh + 40 || q.sy < -60 || q.sx < -400 || q.sx > v.vw + 400);
}
