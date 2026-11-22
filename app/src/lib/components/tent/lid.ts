// A piece's lid that shuts over who lies in it (docs/design.md "The tent": Sit, lie and switch): the cold sleep pod's
// hood. NH's export has no clip, bone or shut variant for it (FtrSFBedS: one Root joint, the hood a loose part of
// the body's mesh, its two glass panes meshes of their own), so the hood is cut out of the body by its connected parts
// (splitLid) and turned about its hinge. It shuts once the sleeper has lain down (SETTLE_MS, then LID_MS eased) and
// opens before they get up (the get-up waits for it: openIn), the sleeper settling a little deeper under it (sink);
// both phones run it off the lying pose they already share.
import { BufferGeometry, Group, Mesh, Vector3, type Object3D } from 'three';
import { cubicInOut } from '#lib/math.ts';

interface LidSpec {
  /** The hinge's axis point (the model's own units: x, y; the axis along its z). */
  hinge: readonly [number, number];
  /** How far it turns about +z to shut (rad). */
  shut: number;
  /** The body's loose parts reaching over this (model y) are the lid's. */
  over: number;
  /** Its own meshes (their materials' names): the glass. */
  mats: readonly string[];
  /** How far the sleeper settles into the mattress as it shuts (model units): a big head under the glass. */
  sink: number;
}

/** The pieces with one (NH's item codes). */
export const LIDS: Readonly<Record<string, LidSpec>> = {
  // the cold sleep pod (FtrSFBedS): the hood and its glass, hinged on the barrel at the pillow end (−x); shut, its
  // rim on the trough's and its free end against the foot's housing (by eye, side on); its glass 10.7-11.7 over the
  // floor above the head, a lying player's head's top 12.1, so they settle 1.2 deeper as it shuts (more, and the
  // head's side shows through the trough's slats)
  f13508: { hinge: [-9.1, 9.35], shut: (-29 * Math.PI) / 180, over: 14, mats: ['mGlass', 'mGlassR'], sink: 1.2 }
};

/** The lie-down's own time (villager3d SIT_MS) and a little: the lid waits for the sleeper to settle. */
export const SETTLE_MS = 450;
/** Shutting or opening all the way. */
export const LID_MS = 520;

/** A lid's motion: from `k0` (0 open … 1 shut) toward `to`, starting at `t0` (ms), `ms` for the whole way. */
export interface Lid {
  k0: number;
  to: 0 | 1;
  t0: number;
  ms: number;
}
export const lidOpen = (): Lid => ({ k0: 0, to: 0, t0: 0, ms: 0 });

/** How shut it is at `t` (eased). */
export function lidK(l: Lid, t: number): number {
  const span = Math.abs(l.to - l.k0) * l.ms;
  if (t < l.t0) return l.k0;
  if (span <= 0 || t >= l.t0 + span) return l.to;
  return l.k0 + (l.to - l.k0) * cubicInOut((t - l.t0) / span);
}

/** Toward shut (someone lies in it) or open, from wherever it is at `t`: shutting waits `settle` ms first; a lid
 *  already on its way there is left as it is. */
export function lidWant(l: Lid, shut: boolean, t: number): Lid {
  const to = shut ? 1 : 0;
  if (l.to === to) return l;
  return { k0: lidK(l, t), to, t0: shut ? t + SETTLE_MS : t, ms: LID_MS };
}

/** Whether it's still to move (waiting to shut, or on its way). */
export const lidMoving = (l: Lid, t: number): boolean => lidK(l, t) !== l.to;

/** Ms till a lid told to open is open (0: it is). */
export const lidOpenIn = (l: Lid, t: number): number => Math.max(0, l.t0 + l.k0 * l.ms - t);

/** Cut the lid out of a loaded model (once: its clones share the result): the parts of each body mesh reaching over
 *  `over` (welded at shared positions) become a mesh of their own, and they and the glass go under a group at the
 *  hinge (named `lid`: turn it about z to shut it). Returns the group, or null when the model has nothing of it. */
export function splitLid(root: Object3D, spec: LidSpec): Group | null {
  root.updateMatrixWorld(true);
  const meshes: Mesh[] = [], parts: Mesh[] = [];
  root.traverse((n) => void ((n as Mesh).isMesh && meshes.push(n as Mesh)));
  for (const m of meshes) {
    const cut = spec.mats.includes((m.material as { name?: string }).name ?? '') ? m : cutOver(m, spec.over);
    if (cut) parts.push(cut);
  }
  if (!parts.length) return null;
  const pivot = new Group();
  pivot.name = 'lid';
  pivot.position.set(spec.hinge[0], spec.hinge[1], 0);
  root.add(pivot);
  pivot.updateMatrixWorld(true);
  for (const p of parts) pivot.attach(p);
  return pivot;
}

/** The loose parts of `m` reaching over `y` (the model's frame) moved to a mesh of their own beside it (the same
 *  material and vertices), or null when none does. */
const cutOver = (m: Mesh, y: number): Mesh | null => cutWhere(m, (_, max) => max.y > y, 'lid');

/** The loose parts of `m` (welded at shared positions; `tri`: its triangles one by one) whose bounds in the model's frame
 *  pass `test` moved to a mesh of their own beside it (the same material and vertices, named `<m>_<tag>`), or null when
 *  none does. */
function cutWhere(m: Mesh, test: (min: Vector3, max: Vector3) => boolean, tag: string, tri = false): Mesh | null {
  const g = m.geometry, pos = g.attributes.position, idx = g.index;
  if (!idx) return null;
  const n = pos.count, up = new Int32Array(n).map((_, i) => i);
  const find = (x: number) => {
    while (up[x] !== x) x = up[x] = up[up[x]];
    return x;
  };
  const v = new Vector3(), lo = new Vector3(), hi = new Vector3();
  let inCut: (i: number) => boolean;
  if (tri) {
    inCut = (i) => {
      lo.set(Infinity, Infinity, Infinity);
      hi.set(-Infinity, -Infinity, -Infinity);
      for (let k = 0; k < 3; k++) (v.fromBufferAttribute(pos, idx.getX(i + k)).applyMatrix4(m.matrixWorld), lo.min(v), hi.max(v));
      return test(lo, hi);
    };
  } else {
    const same = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const k = `${pos.getX(i)},${pos.getY(i)},${pos.getZ(i)}`;
      const j = same.get(k);
      if (j === undefined) same.set(k, i);
      else up[find(i)] = find(j);
    }
    for (let i = 0; i < idx.count; i += 3) {
      const a = find(idx.getX(i));
      up[find(idx.getX(i + 1))] = a;
      up[find(idx.getX(i + 2))] = a;
    }
    // each loose part's bounds
    const box = new Map<number, [Vector3, Vector3]>();
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      const r = find(i), b = box.get(r);
      if (b) (b[0].min(v), b[1].max(v));
      else box.set(r, [v.clone(), v.clone()]);
    }
    const cut = new Set<number>();
    for (const [r, [a, b]] of box) if (test(a, b)) cut.add(r);
    inCut = (i) => cut.has(find(idx.getX(i)));
  }
  const lid: number[] = [], rest: number[] = [];
  for (let i = 0; i < idx.count; i += 3) (inCut(i) ? lid : rest).push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
  if (!lid.length) return null;
  const lg = new BufferGeometry();
  for (const [k, a] of Object.entries(g.attributes)) lg.setAttribute(k, a);
  lg.setIndex(lid);
  g.setIndex(rest);
  const out = new Mesh(lg, m.material);
  out.name = `${m.name}_${tag}`;
  out.position.copy(m.position);
  out.quaternion.copy(m.quaternion);
  out.scale.copy(m.scale);
  m.parent?.add(out);
  out.updateMatrixWorld(true);
  return out;
}

// ---- a piece's other parts cut out at load (docs/design.md "The gym"): the weight bench's baked bar (lifted off the
//      rack while one presses: the barbell's in the hands), the bathroom stall's door (it swings open as one goes in and
//      out), the lifeguard chair's canopy (hidden while one sits: it went through a seated head) ----

interface PartSpec {
  /** The group's name the part goes under (the use's code finds it: tent/uses.ts). */
  name: 'bar' | 'door' | 'hood';
  /** The loose parts wholly inside this box (model units: x0, y0, z0, x1, y1, z1). */
  box: readonly [number, number, number, number, number, number];
  /** Its group's origin (model units): a door's hinge (it turns about y there); else the model's own. */
  at?: readonly [number, number, number];
  /** The triangles inside, one by one (a door panel welded to its frame), not whole loose parts. */
  tri?: true;
}
/** The pieces with one, by item code (each box by eye off its model's rays, scripts/room-surfaces-page.js). */
export const PARTS: Readonly<Record<string, PartSpec>> = {
  // the weight bench's small bar and its plates on the rack over the head's end (−x): 14.3 up, along z
  f1452: { name: 'bar', box: [-9.8, 11, -5.8, -2.8, 17.6, 5.8], at: [-6.276, 14.294, 0] },
  // the bathroom stall's door across its front (z +4.4 … +5.1), hinged on its right (+x)
  f1235: { name: 'door', box: [-4.8, 0.6, 4.2, 4.75, 18.7, 5.2], at: [4.75, 0, 4.75], tri: true },
  // the lifeguard chair's canopy, over the seat (23.5 … 25.5 up)
  f3345: { name: 'hood', box: [-20, 22.6, -20, 20, 40, 20] }
};

/** Cut a part out of a loaded model (once: its clones share it): the loose parts of each mesh inside the spec's box go
 *  under a group named its name, at its `at`. Returns the group, or null when nothing's inside. */
export function splitPart(root: Object3D, spec: PartSpec): Group | null {
  root.updateMatrixWorld(true);
  const meshes: Mesh[] = [], parts: Mesh[] = [];
  root.traverse((n) => void ((n as Mesh).isMesh && meshes.push(n as Mesh)));
  const [x0, y0, z0, x1, y1, z1] = spec.box;
  for (const m of meshes) {
    const cut = cutWhere(m, (lo, hi) => lo.x >= x0 && lo.y >= y0 && lo.z >= z0 && hi.x <= x1 && hi.y <= y1 && hi.z <= z1, spec.name, spec.tri);
    if (cut) parts.push(cut);
  }
  if (!parts.length) return null;
  const g = new Group();
  g.name = spec.name;
  if (spec.at) g.position.set(spec.at[0], spec.at[1], spec.at[2]);
  root.add(g);
  g.updateMatrixWorld(true);
  for (const p of parts) g.attach(p);
  return g;
}
