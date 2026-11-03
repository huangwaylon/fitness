// The ponds put down on the layout (kind `pond`), pure: each one's water, an oval a stone's breadth inside its
// footprint, turned with it. The 3D island draws it (world3d/pond.ts); the gameplay counts it a fresh water (the
// island's world.ts PONDS: fish swim in it, a line goes in, a tap ripples it).
import { footOf, objMid, type Layout } from './model.ts';

export interface PondPlace {
  id: string;
  /** Its middle on the ground (u), its turn, its water's half-axes (u, in its own frame: rx across, rz deep). */
  x: number;
  z: number;
  yaw: number;
  rx: number;
  rz: number;
}

/** The water's oval inside its footprint (u): a stone's breadth in from the edge. */
const POND_IN = 7;

/** Every pond put down on the layout. */
export function pondPlaces(layout: Layout): PondPlace[] {
  const out: PondPlace[] = [];
  for (const o of layout.objects.values()) {
    if (o.k !== 'pond') continue;
    const [x, z] = objMid(layout, o), [w, d] = footOf(layout, o);
    // (its own frame: across × deep before the turn)
    const [a, b] = o.f % 2 ? [d, w] : [w, d];
    out.push({ id: o.id, x, z, yaw: (o.f * Math.PI) / 2, rx: a * 15 - POND_IN, rz: b * 15 - POND_IN });
  }
  return out;
}

/** The oval (world) a pond's water covers: its middle and half-axes along world x and z. */
export const pondOval = (p: PondPlace): { x: number; z: number; rx: number; rz: number } =>
  Math.round(p.yaw / (Math.PI / 2)) % 2 ? { x: p.x, z: p.z, rx: p.rz, rz: p.rx } : { x: p.x, z: p.z, rx: p.rx, rz: p.rz };
