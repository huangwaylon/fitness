// A water critter's height on the 3D island (Island3D's mirror, an `m3.water` node): `lift` over the water's surface,
// or under it (a fish's shadow, lift < 0) but never under its bed. The water and its bed are read where the critter is
// in its water (`wet`: a fish's middle; its model stands by its nose, which can reach over a bank or the clifftop,
// whose stream stands 40 u over the sea), the lift then taken from the ground under the node, where the model stands.
// Pure.

export interface WaterAt {
  /** The water's surface at (x, z). */
  waterY(x: number, z: number): number;
  /** What's under the water at (x, z). */
  bedY(x: number, z: number): number;
  /** The ground at (x, z). */
  heightOf(x: number, z: number): number;
}

/** The lift over the ground at the node (x, z) of a critter `lift` over the water read at `wet` (else the node's). */
export function wetLift(w: WaterAt, x: number, z: number, lift: number, wet?: { x: number; z: number } | null): number {
  const wx = wet?.x ?? x, wz = wet?.z ?? z, top = w.waterY(wx, wz);
  return Math.max(top + lift, Math.min(w.bedY(wx, wz) + 0.1, top)) - w.heightOf(x, z);
}
