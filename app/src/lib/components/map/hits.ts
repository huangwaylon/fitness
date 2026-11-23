// A tap's nearest feature (map/gl.ts tapRouter), pure: the features a fingertip's box caught, ordered by their
// screen distance from the tap; a feature with no point to measure (a line, a polygon) never wins.

export interface Px { x: number; y: number }

export function nearestHit<F>(hits: readonly F[], at: Px, project: (f: F) => Px | null): F | undefined {
  let best: F | undefined, d = Infinity;
  for (const f of hits) {
    const p = project(f);
    const k = p ? Math.hypot(p.x - at.x, p.y - at.y) : Infinity;
    if (k < d) ((d = k), (best = f));
  }
  return best;
}
