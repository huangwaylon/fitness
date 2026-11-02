// The bulletin board's face in 3D (docs/board.md "To the 3D lead"): a plane over NH's cork, in the board model's own
// units (its origin the model's), with the face's canvas (face.ts) as its texture; handed to `world.three.attach`
// ('board', mesh), which places, turns, scales and bends it with the board. Loaded only on the 3D island.
import { Box3, CanvasTexture, Mesh, MeshLambertMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { FACE } from './spot.ts';

export interface Face3 {
  mesh: Mesh;
  /** The canvas was drawn again. */
  update(): void;
  /** Where the face is in the scene (world units, three's axes: z is the island's −z), for the e2e; null off it. */
  box(): { min: [number, number, number]; max: [number, number, number] } | null;
  dispose(): void;
}

export function faceMesh(canvas: HTMLCanvasElement): Face3 {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new MeshLambertMaterial({ map: tex });
  // the plane's place on the model is in its geometry: `attach` sets the object's matrix to the instance's (model
  // units, the model's origin), so a position on the mesh itself would be dropped (the face sat at the model's origin,
  // half under the sand, behind the cork)
  const geo = new PlaneGeometry(FACE.w, FACE.h).translate(0, FACE.y, FACE.z);
  const mesh = new Mesh(geo, mat);
  mesh.name = 'board-face';
  mesh.receiveShadow = true;
  return {
    mesh,
    update: () => void (tex.needsUpdate = true),
    box: () => {
      if (!mesh.parent) return null;
      mesh.updateMatrixWorld(true);
      const b = new Box3().setFromObject(mesh);
      return { min: b.min.toArray(), max: b.max.toArray() };
    },
    dispose: () => (tex.dispose(), mat.dispose(), geo.dispose())
  };
}
