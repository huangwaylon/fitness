// Petals or maple leaves riding the stream in their weeks (NH's season/* models on the water): one every 90u along it
// from below the falls' pool down to the mouth (13 on the layout's river), each drifting 36u downstream over 15 s, turning slowly, then the next lap from its spot (out
// of step); and a few afloat on the pond (docs/design.md "Pond"), circling it slowly. Pure positions; Island3D draws them as instances (quiet: no shadow map).
import { POND, RIVER, freshWhere, onBridge, onLand, worldGen } from '#lib/world/world.ts';

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
/** The stream's floats' spacing along it (u): a dozen or so down the layout's river (the old island's 12), never a chain. */
const SPACING_U = 90;
/** A pond float's lap round its ring (s). */
const POND_LAP_S = 90;

function build(): Float[] {
  const out: Float[] = [];
  // the stream's: one every SPACING_U along the whole centreline, carried over its points (the layout's has one a
  // tile), from below the falls' pool (freshWhere's clifftop: the upper reach and the falls' foam) to the sea
  let k = 0, at = SPACING_U * 0.3, sea = false;
  for (let i = 0, run = 0; i < RIVER.length - 1 && !sea; i++) {
    const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1], len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / (len || 1), uz = (bz - az) / (len || 1);
    for (; at < run + len; at += SPACING_U) {
      const cx = ax + ux * (at - run), cz = az + uz * (at - run);
      if (freshWhere(cx, cz) === 'clifftop') continue;
      if ((sea = !onLand(cx, cz))) break;
      const side = (((k * 7) % 5) - 2) * 2.4, x = cx - uz * side, z = cz + ux * side;
      if (!onBridge(x, z, -20)) out.push({ id: `float-${k}`, x, z, dx: ux, dz: uz, d: (k * 3.7) % 15, spin: k % 2 ? 1 : -1 });
      k++;
    }
    run += len;
  }
  // the pond's: five, out of step on rings inside its banks
  for (let i = 0; i < POND_N; i++) {
    const r = 0.3 + 0.4 * ((i * 3) % POND_N) / (POND_N - 1), a = (i / POND_N) * Math.PI * 2 + 0.4;
    out.push({ id: `float-pond-${i}`, x: POND.x, z: POND.z, dx: 0, dz: 0, d: i * 2.3, spin: i % 2 ? 1 : -1, pond: { r, a } });
  }
  return out;
}
let cached: { gen: number; list: Float[] } | null = null;
/** The floats on the island's waters now: world.ts's, or on the layout (site.on) its river and pond (world.ts's live
 *  geometry: rebuilt when it changes, worldGen()). */
export function floats(): readonly Float[] {
  if (!cached || cached.gen !== worldGen()) cached = { gen: worldGen(), list: build() };
  return cached.list;
}


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
