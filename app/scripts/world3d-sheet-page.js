// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of scripts/world3d-sheet.ts: each model at its world scale beside an 80u villager card (the island's
// billboard), seen at the island's 30° pitch, with a close-up of the model alone in the cell's corner and its label.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const CELL = 300, INSET = 120;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setSize(CELL, CELL);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a9a6a, 1.6));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(-0.4, 1, 0.8);
  scene.add(sun);
}

/** items: [{ url, label, s, anchor, night? }], villager: an image URL; → a PNG data URL of the sheet. */
window.sheet = async ({ items, villager, cols, title }) => {
  const rows = Math.ceil(items.length / cols);
  const out = document.createElement('canvas');
  out.width = cols * CELL;
  out.height = rows * CELL + 36;
  const g = out.getContext('2d');
  g.fillStyle = '#f4efe2';
  g.fillRect(0, 0, out.width, out.height);
  g.fillStyle = '#333';
  g.font = 'bold 20px sans-serif';
  g.fillText(title, 10, 25);
  const vtex = await new THREE.TextureLoader().loadAsync(villager);
  vtex.colorSpace = THREE.SRGBColorSpace;
  const VH = 80, vAR = vtex.image.width / vtex.image.height;
  for (const [i, it] of items.entries()) {
    const x0 = (i % cols) * CELL, y0 = 36 + Math.floor(i / cols) * CELL;
    let gltf;
    try { gltf = await loader.loadAsync(it.url); } catch (e) { g.fillStyle = '#c00'; g.fillText(`✗ ${it.label}`, x0 + 6, y0 + 20); continue; }
    // (a pack's member: its node, named its id)
    const model = it.node ? (gltf.scene.getObjectByName(it.node) ?? gltf.scene) : gltf.scene;
    if (it.node) model.removeFromParent();
    model.scale.setScalar(it.s);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    // feet: the origin on the ground; centre: the bounds' middle at a bug's flying height (half a villager up)
    if (it.anchor === 'centre' || it.anchor === 'joint') model.position.set(-c.x, VH * 0.5 - c.y, -c.z);
    else model.position.set(0, 0, 0);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(it.night ? 0x1d2440 : 0xcfe3c2);
    lights(scene);
    if (it.night) scene.children.forEach((l) => (l.intensity *= 0.25));
    const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 32), new THREE.MeshLambertMaterial({ color: it.night ? 0x2c3a2c : 0x9cc47a }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(VH * vAR, VH), new THREE.MeshBasicMaterial({ map: vtex, transparent: true, alphaTest: 0.4 }));
    const w = Math.max(size.x, size.z, 1);
    card.position.set(-(w / 2 + VH * vAR * 0.5 + 4), VH / 2, 0);
    scene.add(card, model);
    // frame the villager and the model, at the island's pitch (30° down)
    const all = new THREE.Box3().setFromObject(scene.children.find((n) => n === model)).union(new THREE.Box3().setFromObject(card));
    const ac = all.getCenter(new THREE.Vector3()), as = all.getSize(new THREE.Vector3());
    const cam = new THREE.PerspectiveCamera(20, 1, 1, 20000);
    const d = (Math.max(as.x, as.y) * 0.62) / Math.tan(THREE.MathUtils.degToRad(10)) + as.z;
    const pitch = THREE.MathUtils.degToRad(30);
    cam.position.set(ac.x, ac.y + d * Math.sin(pitch), ac.z + d * Math.cos(pitch));
    cam.lookAt(ac);
    renderer.setScissorTest(false);
    renderer.render(scene, cam);
    g.drawImage(renderer.domElement, x0, y0);
    // the close-up: the model alone, filling the inset
    scene.remove(card);
    scene.background = new THREE.Color(it.night ? 0x1d2440 : 0xe9e4d4);
    const mb = new THREE.Box3().setFromObject(model), mc = mb.getCenter(new THREE.Vector3()), ms = mb.getSize(new THREE.Vector3());
    const r = Math.max(ms.x, ms.y, ms.z) * 0.62;
    const cd = r / Math.tan(THREE.MathUtils.degToRad(10)) + ms.z / 2;
    cam.position.set(mc.x + cd * 0.25, mc.y + cd * Math.sin(pitch), mc.z + cd * Math.cos(pitch));
    cam.lookAt(mc);
    renderer.render(scene, cam);
    g.drawImage(renderer.domElement, x0 + CELL - INSET - 4, y0 + 4, INSET, INSET);
    g.strokeStyle = '#776';
    g.strokeRect(x0 + CELL - INSET - 4, y0 + 4, INSET, INSET);
    g.fillStyle = 'rgba(255,255,255,.8)';
    g.fillRect(x0, y0 + CELL - 22, CELL, 22);
    g.fillStyle = '#222';
    g.font = '13px sans-serif';
    g.fillText(it.label, x0 + 4, y0 + CELL - 7);
    g.strokeStyle = '#bbb';
    g.strokeRect(x0, y0, CELL, CELL);
    model.traverse((n) => { if (n.isMesh) { n.geometry.dispose(); [].concat(n.material).forEach((m) => { m.map?.dispose(); m.dispose(); }); } });
  }
  return out.toDataURL('image/png');
};
window.ready = true;
