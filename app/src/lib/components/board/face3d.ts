// The bulletin board's face in 3D (docs/board.md "To the 3D lead"): a plane over NH's cork, in the board model's own
// units (its origin the model's), with the face's canvas (face.ts) as its texture; handed to `world.three.attach`
// ('board', mesh), which places, turns, scales and bends it with the board. Loaded only on the 3D island.
import { CanvasTexture, Mesh, MeshLambertMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { FACE } from './spot.ts';

export interface Face3 {
  mesh: Mesh;
  /** The canvas was drawn again. */
  update(): void;
  dispose(): void;
}

export function faceMesh(canvas: HTMLCanvasElement): Face3 {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new MeshLambertMaterial({ map: tex });
  const geo = new PlaneGeometry(FACE.w, FACE.h);
  const mesh = new Mesh(geo, mat);
  mesh.name = 'board-face';
  mesh.position.set(0, FACE.y, FACE.z);
  mesh.receiveShadow = true;
  return {
    mesh,
    update: () => void (tex.needsUpdate = true),
    dispose: () => (tex.dispose(), mat.dispose(), geo.dispose())
  };
}
