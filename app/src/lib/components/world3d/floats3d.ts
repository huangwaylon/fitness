// Petals or maple leaves riding the stream in their weeks (WorldWater's floats, in 3D: NH's season/* models on the
// water): one every ~50u below the falls down to the mouth, each drifting 36u downstream over 15 s, turning slowly,
// then the next lap from its spot (out of step); and a few afloat on the pond (docs/design.md "Pond"), circling it
// slowly. Pure positions; Island3D draws them as instances (quiet: no shadow map).
import { CLIFF, POND, RIVER, onBridge } from '../island/world.ts';

export interface Float {
  id: string;
  x: number;
  z: number;
  /** Downstream (unit, world x and z), its lap's offset (s) and its spin's way. */
  dx: number;
  dz: number;
  d: number;
  spin: number;
  /** On the pond: its circle (a share of the pond's radii) and where on it it starts (radians). */
  pond?: { r: number; a: number };
}

const LAP_S = 15, DRIFT_U = 36, POND_N = 5;
/** A pond float's lap round its ring (s). */
const POND_LAP_S = 90;

export const FLOATS: readonly Float[] = (() => {
  const out: Float[] = [];
  let k = 0;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1];
    if (az > CLIFF.z0 - 10 || ax < -30) continue;
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 50));
    for (let j = 0; j < n; j++, k++) {
      const t = (j + 0.3) / n, side = (((k * 7) % 5) - 2) * 2.4;
      const nx = -(bz - az) / len, nz = (bx - ax) / len;
      const x = ax + (bx - ax) * t + nx * side, z = az + (bz - az) * t + nz * side;
      if (!onBridge(x, z, -20)) out.push({ id: `float-${k}`, x, z, dx: (bx - ax) / len, dz: (bz - az) / len, d: (k * 3.7) % 15, spin: k % 2 ? 1 : -1 });
    }
  }
  // the pond's: five, out of step on rings inside its banks
  for (let i = 0; i < POND_N; i++) {
    const r = 0.3 + 0.4 * ((i * 3) % POND_N) / (POND_N - 1), a = (i / POND_N) * Math.PI * 2 + 0.4;
    out.push({ id: `float-pond-${i}`, x: POND.x, z: POND.z, dx: 0, dz: 0, d: i * 2.3, spin: i % 2 ? 1 : -1, pond: { r, a } });
  }
  return out;
})();


/** Where a float is at time `t` (ms): along its lap, its yaw, and how much it shows (fading in and out at the lap's
 *  ends). */
export function floatAt(f: Float, t: number): { x: number; z: number; yaw: number; show: number } {
  if (f.pond) {
    const a = f.pond.a + (f.spin * (t / 1000 + f.d) * Math.PI * 2) / POND_LAP_S;
    return { x: POND.x + Math.cos(a) * POND.rx * f.pond.r, z: POND.z + Math.sin(a) * POND.rz * f.pond.r, yaw: a * 1.5, show: 1 };
  }
  const k = (((t / 1000 + f.d) % LAP_S) + LAP_S) % LAP_S / LAP_S;
  return { x: f.x + f.dx * DRIFT_U * k, z: f.z + f.dz * DRIFT_U * k, yaw: f.spin * k * Math.PI * 2, show: Math.min(1, k * 8, (1 - k) * 8) };
}
