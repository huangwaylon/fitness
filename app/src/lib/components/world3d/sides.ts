// See-through two-sided materials as two (one a side). three draws a transparent DoubleSide material in two passes, its
// back faces then its front ones, flipping the material's side with needsUpdate between them (WebGLRenderer
// renderObject): each pass looks its program up again (getProgram: getParameters and its cache key, ~3 KB of garbage
// and ~10 µs), two a draw, every frame. On the island that's the homes' and the bridges' glass and curtains, the models'
// see-through parts, the critters (soft: transparent) and the particles: measured on the demo island (Chromium) 27–31
// lookups a frame, ~13% of render()'s CPU and ~130 KB of garbage a frame. The same two draws as two materials, each its
// own side, never change program: the same pixels (the back faces drawn first, then the front: the same z, the lower id
// first; three sorts see-through objects by z, then id).
import { BackSide, DoubleSide, FrontSide, Mesh, type Material, type Side } from 'three';

/** Whether three would draw it in two passes. */
export const twoPass = (transparent: boolean, side: Side): boolean => transparent && side === DoubleSide;

/** A mesh with a see-through two-sided material split in two: itself its back faces (its shadow still both sides), a
 *  child its front ones (`make`: the same material for that side), drawn after it; that one's material, or null (a
 *  mesh that isn't one: left as it is). */
export function splitSides<M extends Material>(mesh: Mesh, make: (side: Side) => M): M | null {
  const m = mesh.material as Material;
  if (Array.isArray(mesh.material) || !twoPass(m.transparent, m.side)) return null;
  m.side = BackSide;
  m.shadowSide = DoubleSide;
  const fm = make(FrontSide), front = new Mesh(mesh.geometry, fm);
  front.name = `${mesh.name}:front`;
  front.renderOrder = mesh.renderOrder;
  front.receiveShadow = mesh.receiveShadow;
  front.frustumCulled = mesh.frustumCulled;
  mesh.add(front);
  return fm;
}
