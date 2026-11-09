// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of scripts/room-models.ts's surfaces and lights (docs/design.md "The tent", "Table tops", "Lamps"):
// loads one converted piece (static/room/models/<code>.glb, exactly what the tent draws) and
//   - sample: casts rays straight down over its footprint, a grid every half unit, each ray's hits from the top (their
//     height and how flat they face up); the Node half finds the piece's top: its flat level, the rectangle it covers
//     and the tiles that can hold a thing;
//   - emitter: where it glows (its lamp's point light): the middle of its emissive map's lit texels over its surface;
//   - locator: NH's own light locator (a node named Light in the game's Collada), for a light with no emissive map.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
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

/** A texel counts as lit over this (0…1, its brightest channel): an emissive map's dark parts are the unlit body. */
const LIT = 0.2;
/** Points sampled in each triangle (barycentric): a big triangle half lit counts by its lit half. */
const BARY = [[1 / 3, 1 / 3], [2 / 3, 1 / 6], [1 / 6, 2 / 3], [1 / 6, 1 / 6], [0.5, 0.5], [0, 0.5], [0.5, 0]];

/** The glow's middle: over every triangle of a mesh with an emissive map, its area × how lit its texels are (the
 *  map read where its uvs point, the texture transform gltfpack's quantising adds applied), the weighted mean of
 *  the points (null: no lit texel); and the model's bounds. Model units, the piece's own frame. */
window.emitter = async ({ url }) => {
  const g = await loader.loadAsync(url);
  g.scene.updateMatrixWorld(true);
  const sum = new THREE.Vector3();
  let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), p = new THREE.Vector3();
  const ua = new THREE.Vector2(), ub = new THREE.Vector2(), uc = new THREE.Vector2(), u = new THREE.Vector2();
  const meshes = [];
  g.scene.traverse((n) => { if (n.isMesh && n.material.emissiveMap) meshes.push(n); });
  for (const m of meshes) {
    const t = m.material.emissiveMap, img = t.image;
    const cv = new OffscreenCanvas(img.width, img.height), cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const px = cx.getImageData(0, 0, img.width, img.height).data;
    t.updateMatrix();
    const wrap = (v, mode) => (mode === THREE.ClampToEdgeWrapping ? Math.min(1, Math.max(0, v)) : v - Math.floor(v));
    const lum = (uv) => {
      uv.applyMatrix3(t.matrix);
      const x = Math.min(img.width - 1, Math.floor(wrap(uv.x, t.wrapS) * img.width)), y = Math.min(img.height - 1, Math.floor(wrap(uv.y, t.wrapT) * img.height));
      const i = (y * img.width + x) * 4;
      return Math.max(px[i], px[i + 1], px[i + 2]) / 255;
    };
    const geo = m.geometry, pos = geo.attributes.position, uv = geo.attributes.uv, idx = geo.index;
    const n = idx ? idx.count : pos.count, at = (k) => (idx ? idx.getX(k) : k);
    for (let k = 0; k < n; k += 3) {
      const [i0, i1, i2] = [at(k), at(k + 1), at(k + 2)];
      a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld);
      c.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld);
      ua.fromBufferAttribute(uv, i0); ub.fromBufferAttribute(uv, i1); uc.fromBufferAttribute(uv, i2);
      const area = p.subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).length() / 2;
      if (!area) continue;
      for (const [s1, s2] of BARY) {
        const s0 = 1 - s1 - s2;
        const l = lum(u.set(0, 0).addScaledVector(ua, s0).addScaledVector(ub, s1).addScaledVector(uc, s2));
        if (l < LIT) continue;
        p.set(0, 0, 0).addScaledVector(a, s0).addScaledVector(b, s1).addScaledVector(c, s2);
        const w = (area / BARY.length) * l;
        sum.addScaledVector(p, w);
        total += w;
      }
    }
  }
  const all = new THREE.Box3().setFromObject(g.scene);
  return { at: total ? sum.divideScalar(total).toArray() : null, box: [all.min.toArray(), all.max.toArray()] };
};

/** NH's light locator in the game's model (a node named Light), in the converted model's frame (the Collada's scene,
 *  as scripts/room-models-page.js bakes it). null: none. */
window.locator = async ({ url }) => {
  const c = await new ColladaLoader().loadAsync(url);
  const group = new THREE.Group();
  group.add(c.scene);
  group.updateMatrixWorld(true);
  const l = group.getObjectByName('Light');
  return l ? l.getWorldPosition(new THREE.Vector3()).toArray() : null;
};

window.ready = true;
