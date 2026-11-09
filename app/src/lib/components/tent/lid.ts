// A piece's lid that shuts over who lies in it (docs/design.md "The tent": Sit, lie and switch): the cold sleep pod's
// hood. NH's export has no clip, bone or shut variant for it (FtrSFBedS: one Root joint, the hood a loose part of
// the body's mesh, its two glass panes meshes of their own), so the hood is cut out of the body by its connected parts
// (splitLid) and turned about its hinge. It shuts once the sleeper has lain down (SETTLE_MS, then LID_MS eased) and
// opens before they get up (the get-up waits for it: openIn), the sleeper settling a little deeper under it (sink);
// both phones run it off the lying pose they already share.
import { BufferGeometry, Group, Mesh, Vector3, type Object3D } from 'three';
import { cubicInOut } from '#lib/math.ts';

export interface LidSpec {
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
 *  already on its way there is left as it is. `reduced` (prefers-reduced-motion): no motion, at once. */
export function lidWant(l: Lid, shut: boolean, t: number, reduced = false): Lid {
  const to = shut ? 1 : 0;
  if (l.to === to) return l;
  return { k0: lidK(l, t), to, t0: shut ? t + SETTLE_MS : t, ms: reduced ? 0 : LID_MS };
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
function cutOver(m: Mesh, y: number): Mesh | null {
  const g = m.geometry, pos = g.attributes.position, idx = g.index;
  if (!idx) return null;
  const n = pos.count, up = new Int32Array(n).map((_, i) => i);
  const find = (x: number) => {
    while (up[x] !== x) x = up[x] = up[up[x]];
    return x;
  };
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
  const high = new Set<number>(), v = new Vector3();
  for (let i = 0; i < n; i++) if (v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).y > y) high.add(find(i));
  if (!high.size) return null;
  const lid: number[] = [], rest: number[] = [];
  for (let i = 0; i < idx.count; i += 3) (high.has(find(idx.getX(i))) ? lid : rest).push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
  const lg = new BufferGeometry();
  for (const [k, a] of Object.entries(g.attributes)) lg.setAttribute(k, a);
  lg.setIndex(lid);
  g.setIndex(rest);
  const out = new Mesh(lg, m.material);
  out.name = `${m.name}_lid`;
  out.position.copy(m.position);
  out.quaternion.copy(m.quaternion);
  out.scale.copy(m.scale);
  m.parent?.add(out);
  out.updateMatrixWorld(true);
  return out;
}
