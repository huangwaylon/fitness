// @ts-nocheck -- a plain browser module, not part of the app's build.
// The render studio for the player harness: a 1024 px renderer, soft NH-like light on a pastel ground, framing shots,
// the standing and bench-sitting poses (the app's villager3d poses.ts, as they are).
import * as THREE from 'three';
import { boxOf } from '/player.js';
import { idle, sitOn } from '/v3d/poses.ts';
const std = (name, o = {}) => new THREE.MeshStandardMaterial({ name, roughness: 0.92, metalness: 0, ...o });

export const SIZE = 1024;
export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setPixelRatio(1);
renderer.setSize(SIZE, SIZE);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

export function stage(bg) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg ?? '#cfe8e0');
  scene.add(new THREE.HemisphereLight(0xfffaf0, 0xb8c8c0, 1.9));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.5);
  key.position.set(-6, 14, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 14, bottom: -4, near: 0.5, far: 60 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.55);
  fill.position.set(8, 6, 6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(0, 8, -10);
  scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.12 }));
  ground.receiveShadow = true;
  scene.add(ground);
  return scene;
}
export function shadows(root) { root.traverse((n) => { if (n.isMesh) { n.castShadow = !n.material?.transparent; n.receiveShadow = false; } }); }
export function shot(scene, box, yaw, pitch = 0.08, fill = 0.86) {
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 500);
  const r = Math.max(s.y, s.x * 1.05) / fill / 2 / Math.tan((22 / 2) * Math.PI / 180);
  cam.position.set(c.x + r * Math.sin(yaw) * Math.cos(pitch), c.y + r * Math.sin(pitch), c.z + r * Math.cos(yaw) * Math.cos(pitch));
  cam.lookAt(c);
  renderer.render(scene, cam);
  return renderer.domElement.toDataURL('image/png');
}
/** NH's rest pose with the arms down (the app's idle at t 0). */
export function standing(p) { p.rig.apply(idle(0, 0)); p.body.updateMatrixWorld(true); }
/** On a bench: the app's sitOn, the bench box under the thighs. */
export function seated(p, scene, x = 0) {
  const b = p.rig.body;
  const h = b.hip - 0.3; // the seat: under the hips' joint
  const pose = sitOn(0, b, h, false, 0);
  pose.j.Head = [0.05, 0, 0];
  p.rig.apply(pose);
  // (a skirt or a dress laid over the thighs; a top's hem only a little)
  skirtSit(p, /Skirt/.test(p.outfit.bottom?.mesh ?? '') || /Onepiece/.test(p.outfit.top?.mesh ?? '') ? 1 : 0.3);
  p.body.updateMatrixWorld(true);
  return h;
}
/** A garment's skirt joints (Skirt_<n>_<L|R><F|C|B>: NH moves them by cloth physics, the files have no rest
 *  answer for a seated pose) laid over the thighs: the front ones forward with the thighs, then draped down past the
 *  knees; the sides half; the back ones barely. Model-space turns, applied as rig.ts does (after each one's rest). */
export function skirtSit(p, k = 1) {
  const rootQ = p.body.getWorldQuaternion(new THREE.Quaternion()).invert();
  const e = new THREE.Euler(), r = new THREE.Quaternion();
  const bones = [...p.bones.values()].filter((b) => /^Skirt_\d_[LR][FCB]$/.test(b.name));
  p.skirtRest ??= new Map(bones.map((b) => [b, b.quaternion.clone()]));
  // root first: a child's frame is taken after its parent turned
  bones.sort((a, b) => a.name.localeCompare(b.name));
  for (const b of bones) {
    const [, lvl, side, part] = /^Skirt_(\d)_([LR])([FCB])$/.exec(b.name);
    b.quaternion.copy(p.skirtRest.get(b));
    b.updateMatrixWorld(true);
    const first = lvl === '1';
    const pitch = first ? { F: -1.45, C: -1.0, B: -0.25 }[part] : lvl === '2' ? { F: 1.25, C: 0.8, B: 0.1 }[part] : { F: 0.15, C: 0.1, B: 0 }[part];
    const out = first ? (side === 'L' ? -1 : 1) * { F: 0.08, C: 0.25, B: 0.1 }[part] : 0;
    const w = rootQ.clone().multiply(b.getWorldQuaternion(new THREE.Quaternion()));
    r.setFromEuler(e.set(pitch * k, 0, out * k));
    b.quaternion.multiply(w.clone().invert().multiply(r).multiply(w));
    b.updateMatrixWorld(true);
  }
}
export function bench(scene, w, top, z = -0.5) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, 2.6), std('bench', { color: 0x9a6a44, roughness: 0.8 }));
  g.position.set(0, top - 0.55, z);
  g.castShadow = g.receiveShadow = true;
  const legs = [-1, 1].map((s) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.9, top - 1.1, 2.0), std('bench', { color: 0x7d5434 })); l.position.set(s * (w / 2 - 1.2), (top - 1.1) / 2, z); l.castShadow = true; return l; });
  scene.add(g, ...legs);
}

