// Where a villager sits or lies on a piece (scripts/seat-anchors.ts: seats3d.json, each seat's and bed's shape from its
// model's geometry), as the villager3d API takes it (villager3d.ts sitAt): an Anchor in the space the villager's group
// stands in, the piece put there by its middle, its turn (yaw: three's, about y; 0 its front toward +z) and its scale
// (that space's units a model unit). Pure: unit-tested.
import DATA from './seats3d.json' with { type: 'json' };

/** A seat's or a bed's shape in its model's frame (model units, +z its front): scripts/room-surfaces.ts seatOf, bedOf. */
type Shape =
  | { k: 's'; y: number; x: number[]; z0: number; z1: number; back: number; sway?: 1 }
  | { k: 'l'; y: number; a: 'x' | 'z'; head: -1 | 1; s: [number, number]; c: number[]; py: number; sway?: 1 };
const D = DATA as unknown as { tent: Record<string, Shape>; island: Record<string, Shape> };

export interface Anchor {
  lie: boolean;
  /** Sitting: the seat's back edge in its middle (where the hips go, the body against the back); lying: the head's
   *  end of the mattress on its middle line. In the group's parent's space; y the seat's or the mattress's top. */
  x: number;
  y: number;
  z: number;
  /** Which way it faces (sitting: the seat's front; lying: from its head to its feet), three's yaw. */
  yaw: number;
  /** The floor under it (its feet's height: they reach it or dangle). */
  floor: number;
  /** Sitting: how deep the seat is (to its front edge) and how high its back stands over it (0 none). */
  depth: number;
  back: number;
  /** Lying: how long the mattress is, how much higher its pillow end; a hammock sways. */
  len: number;
  pillow: number;
  sway: boolean;
  /** A step in front of it (sitting) or beside it (lying): where one stands to get on and off. */
  from: [number, number];
}

export interface Place {
  x: number;
  z: number;
  /** The floor's height there. */
  y: number;
  yaw: number;
  /** Units a model unit. */
  s: number;
}

/** The shape of a piece: the tent's by item code, the island's by model name. */
export const shapeOf = (where: 'tent' | 'island', key: string): Shape | null => D[where][key] ?? null;

/** A piece's anchors (one a seat or a sleeper), or [] when it has no shape. */
export function anchorsOf(sh: Shape | null, p: Place): Anchor[] {
  if (!sh) return [];
  const c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
  // the model's (mx, mz) in the parent's space: turned by yaw (three's: +z toward +x by sin), scaled, moved
  const at = (mx: number, mz: number): [number, number] => [p.x + p.s * (mx * c + mz * sn), p.z + p.s * (-mx * sn + mz * c)];
  const dirYaw = (dx: number, dz: number) => p.yaw + Math.atan2(dx, dz);
  if (sh.k === 's') {
    return sh.x.map((mx) => {
      const [x, z] = at(mx, sh.z0), [fx, fz] = at(mx, sh.z1 + 6);
      return { lie: false, x, z, y: p.y + sh.y * p.s, yaw: p.yaw, floor: p.y, depth: (sh.z1 - sh.z0) * p.s, back: sh.back * p.s, len: 0, pillow: 0, sway: false, from: [fx, fz] };
    });
  }
  return sh.c.map((mc) => {
    const head = sh.head < 0 ? sh.s[0] : sh.s[1];
    const [x, z] = sh.a === 'x' ? at(head, mc) : at(mc, head);
    // the feet's way along the bed; one gets on from its front side, by the bed's middle
    const yaw = sh.a === 'x' ? dirYaw(-sh.head, 0) : dirYaw(0, -sh.head);
    const mid = (sh.s[0] + sh.s[1]) / 2;
    const [fx, fz] = sh.a === 'x' ? at(mid, 10) : at(mc + (mc < 0 ? -1 : 1) * 2, sh.s[1] + 6);
    return { lie: true, x, z, y: p.y + sh.y * p.s, yaw, floor: p.y, depth: 0, back: 0, len: (sh.s[1] - sh.s[0]) * p.s, pillow: sh.py * p.s, sway: !!sh.sway, from: [fx, fz] };
  });
}
