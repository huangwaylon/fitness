// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of render.ts: the window functions the Node side calls (renders, sheets, inspection).
import * as THREE from 'three';
import { loadPlayer, bitmap, straight, boxOf, matName, normalMaps } from '/player.js';
import { renderer, stage, shadows, shot, standing, seated, bench } from '/studio.js';
let FILES = {};
const assemble = (o) => loadPlayer(o, FILES);

/** A texture's RGB (opaque), R, G, B and A side by side, on a checker. */
window.inspect = async (url) => {
  const img = straight(await bitmap(url));
  const w = img.width, h = img.height, s = Math.max(1, Math.round(256 / Math.max(w, h)));
  const c = document.createElement('canvas');
  c.width = w * 5 * s + 40; c.height = h * s + 24;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.imageSmoothingEnabled = false;
  ['rgb', 'R', 'G', 'B', 'A'].forEach((lab, k) => {
    const o = new ImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      if (k === 0) { o.data[i] = img.data[i]; o.data[i + 1] = img.data[i + 1]; o.data[i + 2] = img.data[i + 2]; }
      else o.data[i] = o.data[i + 1] = o.data[i + 2] = img.data[i + k - 1];
      o.data[i + 3] = 255;
    }
    const t = new OffscreenCanvas(w, h); t.getContext('2d').putImageData(o, 0, 0);
    g.drawImage(t, k * (w * s + 10), 20, w * s, h * s);
    g.fillStyle = '#000'; g.font = '14px sans-serif'; g.fillText(`${lab} ${w}x${h}`, k * (w * s + 10) + 2, 15);
  });
  return c.toDataURL('image/png');
};


window.renderOne = async (o, files) => {
  FILES = files;
  const p = await assemble(o);
  shadows(p.root);
  const scene = stage(o.bg);
  scene.add(p.root);
  standing(p);
  const box = boxOf(p.root);
  const front = shot(scene, box, 0);
  const q = shot(scene, box, -0.6, 0.12);
  const back = shot(scene, box, Math.PI + 0.35, 0.12);
  // the head close (face check)
  const hb = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, box.max.y - (box.max.y - box.min.y) * 0.27, 0), new THREE.Vector3(1, (box.max.y - box.min.y) * 0.55, 1));
  const face = shot(scene, hb, -0.35, 0.05, 0.95);
  const h = seated(p, scene);
  const sb = boxOf(p.root);
  // the seat's top under the thighs: the lowest point of the body above the knees' line, roughly the hips' less a bit
  const seat = new THREE.Vector3().setFromMatrixPosition(p.bones.get('Leg_1_L').matrixWorld).y - 0.9;
  bench(scene, 10, seat);
  const lift = 0; void h; void lift;
  const s = shot(scene, sb.union(new THREE.Box3(new THREE.Vector3(-3, 0, -1), new THREE.Vector3(3, 0.1, 1))), -0.25, 0.1, 0.9);
  const b0 = boxOf(p.root);
  return { front, '34': q, back, face, seated: s, info: JSON.stringify({ body: p.rig.body, height: +(box.max.y - box.min.y).toFixed(2), seatedTop: +b0.max.y.toFixed(2), meshes: p.out.filter((r) => r.mesh.visible).map((r) => `${r.slot}:${matName(r.mesh)}`) }) };
};

window.renderPair = async (a, b, files) => {
  FILES = files;
  const pa = await assemble(a), pb = await assemble(b);
  const scene = stage(a.bg);
  for (const p of [pa, pb]) { shadows(p.root); scene.add(p.root); }
  const gap = 4.6;
  pa.root.position.x = -gap; pb.root.position.x = gap;
  pa.root.rotation.y = 0.18; pb.root.rotation.y = -0.18;
  standing(pa); standing(pb);
  const both = () => boxOf(pa.root).union(boxOf(pb.root));
  const front = shot(scene, both(), 0, 0.08, 0.8);
  seated(pa, scene); seated(pb, scene);
  scene.updateMatrixWorld(true);
  const seat = new THREE.Vector3().setFromMatrixPosition(pa.bones.get('Leg_1_L').matrixWorld).y - 0.9;
  bench(scene, 22, seat);
  pa.root.rotation.y = 0.12; pb.root.rotation.y = -0.12;
  const s = shot(scene, both().union(new THREE.Box3(new THREE.Vector3(-11, 0, -1), new THREE.Vector3(11, seat, 1))), 0, 0.12, 0.9);
  return { front, seated: s };
};

window.debug = async (o, files) => {
  FILES = files;
  const p = await assemble(o);
  standing(p);
  const r = {};
  for (const n of ['Head', 'Feel', 'Neck', 'Item', 'Root', 'Bangs_C', 'Hair_1']) {
    const b = p.bones.get(n); if (!b) continue;
    const pos = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
    const q = b.getWorldQuaternion(new THREE.Quaternion());
    r[n] = { pos: pos.toArray().map((v) => +v.toFixed(2)), q: q.toArray().map((v) => +v.toFixed(2)), parent: b.parent?.name };
  }
  for (const x of p.out) {
    const b = boxOf(x.mesh);
    r[`${x.slot}:${matName(x.mesh)}`] = [b.min.toArray().map((v) => +v.toFixed(2)), b.max.toArray().map((v) => +v.toFixed(2))];
    if (x.mesh.isSkinnedMesh && x.slot === 'hair') r.hairInv = x.mesh.skeleton.bones.map((bb, i) => [bb.name, x.mesh.skeleton.boneInverses[i].elements.map((v) => +v.toFixed(2)).join(' ')]);
  }
  return JSON.stringify(r, null, 1);
};
/** Each texture's mean RGB (straight pixels, opaque where an _OP says so). */
window.avg = async (urls) => {
  const out = {};
  for (const u of urls) {
    const bm = await bitmap(u); if (!bm) continue;
    const d = straight(bm).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    out[u] = [r / n, g / n, b / n].map(Math.round);
  }
  return out;
};
/** A labelled grid: the base outfit with one key set to each value (dotted keys reach in: "top.tex"), each a
 *  `view` shot (face | front | 34) at 256 px. */
window.sheet = async ({ base, key, values, view = 'face', cols = 6 }, files) => {
  FILES = files;
  const cell = 256, rows = Math.ceil(values.length / cols);
  const c = document.createElement('canvas');
  c.width = cols * cell; c.height = rows * (cell + 18);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < values.length; i++) {
    const o = structuredClone(base);
    const ks = key.split('.'); let t = o;
    for (const k of ks.slice(0, -1)) t = t[k] ??= {};
    t[ks.at(-1)] = values[i];
    let img;
    try {
      const p = await assemble(o);
      const scene = stage(o.bg); shadows(p.root); scene.add(p.root); standing(p);
      const box = boxOf(p.root);
      const hb = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(0, box.max.y - (box.max.y - box.min.y) * 0.27, 0), new THREE.Vector3(1, (box.max.y - box.min.y) * 0.55, 1));
      img = view === 'face' ? shot(scene, hb, -0.3, 0.05, 0.95) : shot(scene, box, view === '34' ? -0.6 : 0, 0.1);
    } catch (e) { console.log('[a]', values[i], e.message); continue; }
    const im = new Image(); im.src = img; await im.decode();
    const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 18);
    g.drawImage(im, x, y, cell, cell);
    g.fillStyle = '#000'; g.font = '12px sans-serif'; g.fillText(JSON.stringify(values[i]).slice(0, 40), x + 3, y + cell + 13);
  }
  return c.toDataURL('image/png');
};


window.ready = true;

/** A comparison sheet: the target on the left, renders in a grid on the right, each labelled. imgs: [label, dataUrl]. */
window.compare = async (target, imgs, title) => {
  const load = async (u) => { const im = new Image(); im.src = u; await im.decode(); return im; };
  const t = await load(target);
  const H = 1200, cols = 3, cw = 400, rows = Math.ceil(imgs.length / cols), ch = Math.min(400, Math.floor((H - 40) / rows));
  const c = document.createElement('canvas');
  c.width = H + cols * cw; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(t, 0, 0, H, H * t.height / t.width);
  g.fillStyle = '#000'; g.font = 'bold 22px sans-serif'; g.fillText('target.jpg', 10, 28);
  g.fillText(title ?? '', H + 10, 28);
  for (let i = 0; i < imgs.length; i++) {
    const im = await load(imgs[i][1]);
    const x = H + (i % cols) * cw, y = 40 + Math.floor(i / cols) * ch, s = Math.min(cw / im.width, (ch - 22) / im.height);
    g.drawImage(im, x + (cw - im.width * s) / 2, y, im.width * s, im.height * s);
    g.font = '15px sans-serif'; g.fillText(imgs[i][0], x + 6, y + ch - 6);
  }
  return c.toDataURL('image/png');
};

/** The outfit as one glTF (for its packed size): at its bind pose, every texture ≤ 256 px, the eyes' 16 and the
 *  mouth's 9 frames as atlases (4 × 4 of 128 × 64, 3 × 3 of 64 × 64; the face patch's uvs on cell 0), as the
 *  villagers' GLBs carry theirs. */
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
window.exportOne = async (o, files) => {
  FILES = files;
  normalMaps(false);
  const p = await assemble(o);
  normalMaps(true);
  const atlas = async (slot, n, cols, cw, ch) => {
    const rows = Math.ceil(n / cols);
    const c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch;
    const g = c.getContext('2d');
    const mesh = p.out.find((r) => r.slot === slot).mesh;
    for (let i = 0; i < n; i++) {
      await p.setFace(slot === 'mEye' ? i : 0, slot === 'mMouth' ? i : 0);
      g.drawImage(mesh.material.map.image, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = true;
    mesh.material = new THREE.MeshStandardMaterial({ name: slot, map: t, roughness: 0.92 });
    mesh.material.userData = { atlas: [cols, rows, n] };
    const uv = mesh.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / cols, 1 - (1 - uv.getY(i)) / rows);
    uv.needsUpdate = true;
  };
  await atlas('mEye', 16, 4, 128, 64);
  await atlas('mMouth', 9, 3, 64, 64);
  let tris = 0;
  p.root.traverse((m) => {
    if (!m.isMesh || !m.visible) return;
    const g = m.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
  });
  const drop = [];
  p.body.traverse((n) => { if (!n.isBone && !n.isMesh && n !== p.body && !n.isGroup && n.type !== 'Object3D') drop.push(n); });
  for (const n of drop) n.parent?.remove(n);
  const scene = new THREE.Scene(); scene.add(p.root);
  const gltf = await new GLTFExporter().parseAsync(scene, { binary: false, onlyVisible: true, maxTextureSize: 256 });
  return { gltf: JSON.stringify(gltf), tris: Math.round(tris) };
};
