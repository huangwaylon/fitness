// Petals or maple leaves riding the stream in their weeks (WorldWater's floats, in 3D: NH's season/* models on the
// water): one every ~50u below the falls down to the mouth, each drifting 36u downstream over 15 s, turning slowly,
// then the next lap from its spot (out of step). Pure positions; Island3D draws them as instances (quiet: no shadow map).
import { CLIFF, RIVER, onBridge } from '../island/world.ts';

export interface Float {
  id: string;
  x: number;
  z: number;
  /** Downstream (unit, world x and z), its lap's offset (s) and its spin's way. */
  dx: number;
  dz: number;
  d: number;
  spin: number;
}

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
  return out;
})();

const LAP_S = 15, DRIFT_U = 36;

/** Where a float is at time `t` (ms): along its lap, its yaw, and how much it shows (fading in and out at the lap's
 *  ends). */
export function floatAt(f: Float, t: number): { x: number; z: number; yaw: number; show: number } {
  const k = (((t / 1000 + f.d) % LAP_S) + LAP_S) % LAP_S / LAP_S;
  return { x: f.x + f.dx * DRIFT_U * k, z: f.z + f.dz * DRIFT_U * k, yaw: f.spin * k * Math.PI * 2, show: Math.min(1, k * 8, (1 - k) * 8) };
}
