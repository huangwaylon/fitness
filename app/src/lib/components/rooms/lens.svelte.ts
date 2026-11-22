// The first person's lens (docs/design.md "First person"): a pinch at the eyes widens or narrows the view from the
// head's own 70° (where it starts) between 50° and 130° (vertical; on a 393 × 659 phone about 32° → 104° across, a
// wider canvas capped at 120° across: firstPerson.ts), kept on this phone only
// (DEVICE.fpvFov), the same in every room; the rooms' engines eased to it by their components. No three.js
// (rooms/gesture.ts loads it before the engines).
import { DEVICE, localKV, writeRaw } from '#lib/sync/storage.ts';

/** The lens (vertical degrees): a head's, not the rooms' long 32°. Where it starts. */
export const FOV = 70;
/** The narrowest a pinch makes it (a closer look), and the widest: past ~130° a tall phone's top and bottom stretch
 *  too far (5.6× at the edge), while across it's still an action camera's 104°. */
export const FOV_MIN = 50, FOV_MAX = 130;

export const clampFov = (deg: number): number => (Number.isFinite(deg) ? Math.max(FOV_MIN, Math.min(FOV_MAX, deg)) : FOV);

const rad = Math.PI / 360;
/** The lens after a pinch's spread `f` (> 1, fingers apart: nearer, narrower), as a zoom: the half-angle's tangent over
 *  `f` (the world under the fingers grows by `f`), clamped. */
export const zoomFov = (deg: number, f: number): number => clampFov(Math.atan(Math.tan(clampFov(deg) * rad) / f) / rad);

function initial(): number {
  try {
    const v = localKV()?.getItem(DEVICE.fpvFov);
    return v ? clampFov(Number(v)) : FOV;
  } catch {
    return FOV;
  }
}

/** The lens kept (vertical degrees). */
export const lens = $state<{ fov: number }>({ fov: initial() });

/** A new lens (clamped, to a tenth), kept on this phone. */
export function setLens(deg: number): void {
  const v = Math.round(clampFov(deg) * 10) / 10;
  if (v === lens.fov) return;
  lens.fov = v;
  writeRaw(localKV(), DEVICE.fpvFov, String(v));
}
