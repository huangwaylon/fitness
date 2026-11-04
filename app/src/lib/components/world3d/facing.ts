// Which way a 3D villager holding a line faces, and where its rod points (docs/design.md "Fishing"): plain functions of
// where it is, its float and its seat, so every phone, given the same steps, turns it the same way. Headings in plan,
// radians, as world3d/villagers.ts's yaw: atan2(dx, −dz) in the world's x/z (three's rotation.y; three's z is −z).

/** Turned from `a` toward `b` the short way round, a `k`-per-second ease over `dt` ms (never past it). */
export function turn(a: number, b: number, dt: number, k: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, (k * dt) / 1000);
}

/** How fast a standing angler turns to its float (per second: NH's quick, smooth turn, ~0.2 s to face it). */
export const FACE_FLOAT_K = 12;

/** The heading of a standing angler at (x, z) facing its float at (fx, fz) square on from its rod's hand: the hand
 *  (lx, lz in the body's own frame, three's: x right, z forward) on the line from the feet's heading to the float,
 *  so the facing, the rod and the line are one line in plan. */
export function faceFloat(x: number, z: number, fx: number, fz: number, lx = 0, lz = 0): number {
  let want = Math.atan2(fx - x, -(fz - z));
  for (let i = 0; i < 4; i++) {
    const c = Math.cos(want), s = Math.sin(want);
    const hx = x + lx * c + lz * s, hz = z - (-lx * s + lz * c);
    want = Math.atan2(fx - hx, -(fz - hz));
  }
  return want;
}

/** Where an angler's rod points (three's space, on the water's level: villager3d aim()): standing, at its float;
 *  seated or lying (it can't turn on its seat), straight ahead of it from the hand, the way it faces. */
export function rodTarget(seated: boolean, yaw: number, hand: { x: number; z: number }, float: { x: number; z: number }): { x: number; z: number } {
  if (!seated) return { x: float.x, z: -float.z };
  return { x: hand.x + Math.sin(yaw) * 100, z: hand.z + Math.cos(yaw) * 100 };
}
