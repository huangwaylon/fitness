// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of scripts/room-models.ts's surfaces (docs/design.md "The tent", "Table tops"): loads one converted
// piece (static/room/models/<code>.glb, exactly what the tent draws) and casts rays straight down over its footprint,
// a grid every half unit, each ray's hits from the top (their height and how flat they face up). The Node half finds
// the piece's top: its flat level, the rectangle it covers and the tiles that can hold a thing.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const ray = new THREE.Raycaster();
const down = new THREE.Vector3(0, -1, 0);

/** Rays down over x −W/2…W/2, z −D/2…D/2 (model units, the piece's own facing), `step` apart: each ray's hits, top
 *  first, as [y, normal.y] (to two decimals: 1 a face up, −1 an underside). */
window.sample = async ({ url, W, D, step }) => {
  const g = await loader.loadAsync(url);
  const root = g.scene;
  root.traverse((n) => {
    if (n.isMesh) for (const m of Array.isArray(n.material) ? n.material : [n.material]) m.side = THREE.DoubleSide;
  });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const nx = Math.round(W / step), nz = Math.round(D / step);
  const out = [];
  const nm = new THREE.Matrix3();
  for (let i = 0; i < nx; i++) {
    const row = [];
    for (let j = 0; j < nz; j++) {
      const x = -W / 2 + (i + 0.5) * step, z = -D / 2 + (j + 0.5) * step;
      ray.set(new THREE.Vector3(x, box.max.y + 5, z), down);
      const hits = ray.intersectObject(root, true).map((h) => {
        nm.getNormalMatrix(h.object.matrixWorld);
        const n = h.face.normal.clone().applyMatrix3(nm).normalize();
        return [Math.round(h.point.y * 100) / 100, Math.round(n.y * 100) / 100];
      });
      row.push(hits);
    }
    out.push(row);
  }
  // and from the front (+z, the way a piece faces) at each height: how far in a straight look reaches (the z of the
  // first thing in the way, or null: nothing), so a level under a roof can be told open in front or closed
  const back = new THREE.Vector3(0, 0, -1), front = [];
  const ny = Math.ceil((box.max.y + 1) / step);
  for (let i = 0; i < nx; i++) {
    const col = [];
    for (let k = 0; k < ny; k++) {
      ray.set(new THREE.Vector3(-W / 2 + (i + 0.5) * step, (k + 0.5) * step, D / 2 + 20), back);
      const h = ray.intersectObject(root, true)[0];
      col.push(h ? Math.round(h.point.z * 100) / 100 : null);
    }
    front.push(col);
  }
  return { grid: out, front, top: box.max.y };
};

window.ready = true;
