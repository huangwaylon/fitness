// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The closet sweep's page (closet.ts): one player, every item worn in turn through player.js wear() (the runtime swap
// the closet would do), a thumbnail of the slot's region drawn into contact sheets, and per-item checks.
import * as THREE from 'three';
import { loadPlayer, boxOf, normalMaps } from '/player.js';
import { renderer, stage, shadows, standing } from '/studio.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';

let P = null, FILES = {}, SCENE = null;
const CELL = 128, COLS = 20, ROWS = 20;
let sheet = null, sheetN = 0;
const sheets = [];

/** Regions (world boxes) each slot's thumbnail frames, and the camera's yaw. */
const VIEW = {
  top: [[-5, 3.2, -2], [5, 10.2, 2], -0.45],
  onepiece: [[-5, 0.5, -2], [5, 10.2, 2], -0.45],
  bottom: [[-4, 0, -2], [4, 6.5, 2], -0.45],
  shoes: [[-2.6, 0, -1.5], [2.6, 2.8, 2.5], -0.6],
  socks: [[-2.6, 0, -1.5], [2.6, 5.4, 2.5], -0.6],
  glasses: [[-4.6, 9.4, -2], [4.6, 15.4, 3], -0.45],
  hat: [[-6.5, 8.2, -5], [6.5, 19.5, 5], -0.6],
  face: [[-4.6, 8.2, -2], [4.6, 15.4, 3], -0.45],
  bag: [[-6, 2, -5], [6, 13, 5], Math.PI - 0.7]
};
const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 500);
function frame(slot) {
  const [a, b, yaw] = VIEW[slot];
  const box = new THREE.Box3(new THREE.Vector3(...a), new THREE.Vector3(...b));
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const r = Math.max(s.y, s.x) / 0.92 / 2 / Math.tan((22 / 2) * Math.PI / 180);
  cam.position.set(c.x + r * Math.sin(yaw), c.y + r * 0.1, c.z + r * Math.cos(yaw));
  cam.lookAt(c);
}

window.closetInit = async (base, files) => {
  FILES = files;
  normalMaps(false);
  P = await loadPlayer(structuredClone(base), FILES);
  SCENE = stage('#e9efe9');
  shadows(P.root);
  SCENE.add(P.root);
  standing(P);
  renderer.setSize(512, 512);
  return true;
};
function newSheet() {
  sheet = document.createElement('canvas');
  sheet.width = COLS * CELL; sheet.height = ROWS * (CELL + 14);
  const g = sheet.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, sheet.width, sheet.height);
  sheetN = 0;
}
/** Draws the current frame into the open sheet, labelled (red label: flagged). */
function draw(label, bad) {
  if (!sheet || sheetN >= COLS * ROWS) { if (sheet) sheets.push(sheet.toDataURL('image/png')); newSheet(); }
  const g = sheet.getContext('2d');
  const x = (sheetN % COLS) * CELL, y = Math.floor(sheetN / COLS) * (CELL + 14);
  g.drawImage(renderer.domElement, x, y, CELL, CELL);
  if (bad) { g.strokeStyle = '#d00'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3); }
  g.fillStyle = bad ? '#c00' : '#222'; g.font = '9px sans-serif';
  g.fillText(label.slice(0, 26), x + 2, y + CELL + 10);
  sheetN++;
}
/** Close the category's sheets → their PNG data URLs. */
window.closetSheets = () => {
  if (sheet && sheetN) sheets.push(sheet.toDataURL('image/png'));
  sheet = null;
  return sheets.splice(0);
};

/** A texture canvas at ≤ 256 px → PNG data URL (its WebP size is measured on the Node side). */
function texPng(map) {
  const im = map?.image;
  if (!im) return null;
  const s = Math.min(1, 256 / Math.max(im.width, im.height));
  const c = document.createElement('canvas');
  c.width = Math.max(4, Math.round(im.width * s)); c.height = Math.max(4, Math.round(im.height * s));
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
function alphaCoverage(map) {
  const im = map?.image;
  if (!im || !im.getContext) return 1;
  const d = im.getContext('2d').getImageData(0, 0, im.width, im.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 16) if (d[i] > 127) n++;
  return n / (d.length / 16);
}

/** Wear each item (it: { id, slot, value }) → per item { id, ok, err, box, tris, cover, mats, tex: [png] }. */
window.closetBatch = async (items, more) => {
  Object.assign(FILES, more);
  const res = [];
  for (const it of items) {
    const r = { id: it.id };
    try {
      await P.wear(it.slot, it.value);
      standing(P);
      const slot = it.slot === 'top' && it.value.onepiece ? 'top' : it.slot;
      const ms = P.out.filter((x) => x.slot === (slot === 'socks' ? 'mSocks' : slot)).map((x) => x.mesh);
      r.meshes = ms.length;
      if (ms.length) {
        const b = new THREE.Box3();
        for (const m of ms) b.union(boxOf(m));
        r.box = [b.min.toArray(), b.max.toArray()].map((v) => v.map((n) => +n.toFixed(2)));
        r.tris = Math.round(ms.reduce((t, m) => t + (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3, 0));
        r.mats = ms.map((m) => m.material.name);
        // (a see-through part, a lens or a visor, may have no albedo and is mostly clear by design)
        const solid = ms.filter((m) => !/Alpha$/.test(m.material.name));
        r.untextured = solid.filter((m) => !m.material.map).map((m) => m.material.name);
        r.cover = solid.length ? +Math.min(...solid.map((m) => alphaCoverage(m.material.map))).toFixed(3) : 1;
        r.tex = [...new Set(ms.map((m) => m.material.map))].map(texPng).filter(Boolean);
      }
    } catch (e) {
      r.err = String(e.message ?? e).slice(0, 160);
    }
    frame(it.slot === 'top' && it.value?.onepiece ? 'onepiece' : it.slot);
    renderer.render(SCENE, cam);
    r.why = check(it, r);
    draw(it.id.replace(/^(TopsTex|BottomsTex|Accessory|SocksTex)/, ''), r.why.length > 0);
    res.push(r);
  }
  return res;
};
/** What looks broken: an error, no mesh, an untextured material, a box away from where the slot belongs, a texture
 *  that's mostly cut away. */
function check(it, r) {
  const why = [];
  if (r.err) return [`error: ${r.err}`];
  if (it.slot !== 'socks' && !r.meshes) return ['no mesh drawn'];
  if (r.untextured?.length) why.push(`no albedo: ${r.untextured.join(',')}`);
  if (r.cover < 0.08) why.push(`texture ${Math.round(r.cover * 100)}% opaque`);
  if (!r.box) return why;
  const [a, b] = r.box, c = a.map((v, i) => (v + b[i]) / 2), sz = a.map((v, i) => b[i] - v);
  const far = (p, d) => Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]) > d;
  const s = it.slot, one = s === 'top' && it.value.onepiece;
  if (s === 'top' && !one && (c[1] < 4 || c[1] > 9.5 || Math.abs(c[0]) > 1.5)) why.push('top off the torso');
  if (one && (c[1] < 2 || c[1] > 9.5)) why.push('dress off the body');
  if (s === 'bottom' && (c[1] < 0.8 || c[1] > 6.5)) why.push('bottom off the legs');
  if (s === 'shoes' && (b[1] > 4 || a[1] < -0.6)) why.push('shoes off the feet');
  if (s === 'glasses' && it.cat !== 'glassmouth' && far([0, 12.2, 1.5], 2.5)) why.push('glasses off the eyes');
  if ((s === 'hat' || s === 'face') && (far([0, 12.2, 0], 6.5) || Math.max(...sz) > 26)) why.push('off the head');
  if (s === 'bag' && far([0, 7, 0], 8)) why.push('bag off the body');
  if (s === 'hat' && /^CapHat/.test(it.id) && a[1] < 10.3) why.push('hat below the brim line');
  return why;
}

/** One mesh folder as a glTF (its own skeleton, no textures: the shared-mesh GLB the closet would load). */
const dae = new ColladaLoader();
window.meshGltf = async (folder, file) => {
  const sc = (await dae.loadAsync(`/src/${folder}.Nin_NX_NVN/${file}`)).scene;
  let tris = 0;
  const drop = [];
  sc.traverse((m) => {
    if (m.isMesh) {
      const n = (Array.isArray(m.material) ? m.material[0] : m.material)?.name ?? '';
      if (/Soft[mM]esh|Dummy|Shadow/.test(n)) { drop.push(m); return; }
      const g = m.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
      m.material = new THREE.MeshStandardMaterial({ name: n });
    } else if (!m.isBone && m !== sc && !m.isGroup && m.type !== 'Object3D') drop.push(m);
  });
  for (const m of drop) m.parent?.remove(m);
  const gltf = await new GLTFExporter().parseAsync(sc, { binary: false });
  return { gltf: JSON.stringify(gltf), tris: Math.round(tris) };
};

window.ready = true;
