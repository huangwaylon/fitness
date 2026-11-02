// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of scripts/villagers3d-models.ts: one NH villager (NpcNml<Species><nn>) as a skinned glTF. The body's
// Collada (its 46-joint skeleton and skin kept: a SkinnedMesh, posed by villager3d/ at runtime), its default top (the
// species' NpcNmlTops<Species><Tshirts|Onepiece><H|L|N> mesh, rebound to the body's skeleton, wearing the clothing's own
// TopsTex<…> texture), and the face: NH swaps the eyes' (16) and the mouth's (9) textures for an expression, so each is
// one atlas here (a grid of cells; the material's extras say how many: villager3d/faces.ts picks a cell by uv offset).
// The textures are baked as world3d-page.js bakes them (the occlusion of _Mix's blue into the albedo, _OP's green as
// the cutout), the eyes' and mouths' albedos opaque (their alpha is a shading mask in NH's shader, not an opacity).
import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

/** Never drawn (world3d-page.js's, and NH's soft-body collision meshes). */
const HIDE = new Set(['mSoftMesh', 'mSoftmesh', 'mDummy', 'mShadow', 'mShadowShake']);
const AO = 0.35;
const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

async function bitmap(url) {
  if (!url) return null;
  const r = await fetch(url);
  if (!r.ok) return null;
  return createImageBitmap(await r.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
}
/** An image's pixels at w × h, straight (unpremultiplied) through WebGL: a 2D canvas would lose the colour under a low
 *  alpha (NH's eyes keep a mask there), so the image is uploaded as it is, read back and scaled by the 2D canvas opaque. */
function straight(bm) {
  const w = bm.width, h = bm.height;
  const gl = new OffscreenCanvas(w, h).getContext('webgl2');
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bm);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  const buf = new Uint8ClampedArray(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return new ImageData(buf, w, h);
}
async function opaqueAt(url, w, h) {
  const bm = await bitmap(url);
  if (!bm) return null;
  const img = straight(bm);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
  const src = new OffscreenCanvas(img.width, img.height);
  src.getContext('2d').putImageData(img, 0, 0);
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, w, h);
  return g.getImageData(0, 0, w, h);
}
function pixels(bm, w, h) {
  const c = new OffscreenCanvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(bm, 0, 0, w, h);
  return g.getImageData(0, 0, w, h);
}
function canvasOf(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d').putImageData(img, 0, 0);
  return c;
}
const std = (name) => ({ name, roughness: 1, metalness: 0 });
function texOf(img) {
  const t = new THREE.CanvasTexture(canvasOf(img));
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = true;
  return t;
}

/** The occlusion (_Mix's blue) baked into an albedo's pixels (world3d-page.js's weight). */
function occlude(d, m) {
  for (let i = 0; i < d.length; i += 4) {
    const ao = 1 - AO * (1 - m[i + 2] / 255);
    for (let k = 0; k < 3; k++) d[i + k] = Math.round(linToSrgb(srgbToLin(d[i + k] / 255) * ao) * 255);
  }
}

/** A plain material (the body, a top): its albedo at ≤ maxTex, occluded, cut out by its _OP (green) if it has one. */
async function plainMat(name, url, o) {
  const alb = await bitmap(url(`${name}_Alb.png`));
  if (!alb) return new THREE.MeshStandardMaterial({ ...std(name), color: 0xcccccc });
  const s = Math.min(1, o.maxTex / Math.max(alb.width, alb.height));
  const w = Math.max(4, Math.round(alb.width * s)), h = Math.max(4, Math.round(alb.height * s));
  const a = await opaqueAt(url(`${name}_Alb.png`), w, h);
  const mix = await bitmap(url(`${name}_Mix.png`));
  if (mix) occlude(a.data, pixels(mix, w, h).data);
  const op = await bitmap(url(`${name}_OP.png`));
  let cut = false;
  if (op) {
    const p = pixels(op, w, h).data;
    for (let i = 0; i < a.data.length; i += 4) {
      a.data[i + 3] = p[i + 1];
      if (p[i + 1] < 250) cut = true;
    }
  }
  return new THREE.MeshStandardMaterial({ ...std(name), map: texOf(a), ...(cut ? { alphaTest: 0.45, side: THREE.DoubleSide } : {}) });
}

/** An expression atlas: `<name>_Alb.<i>.png` for every i, each a cell (cw × ch) of a cols-wide grid, row 0 at the top. */
async function atlasMat(name, url, n, cols, cw, ch) {
  const rows = Math.ceil(n / cols);
  const out = new ImageData(cols * cw, rows * ch);
  let have = 0;
  for (let i = 0; i < n; i++) {
    const img = await opaqueAt(url(`${name}_Alb.${i}.png`), cw, ch);
    if (!img) continue;
    have++;
    // (no occlusion: a face's _Mix keeps its highlights' mask in blue)
    const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
    for (let y = 0; y < ch; y++) out.data.set(img.data.subarray(y * cw * 4, (y + 1) * cw * 4), ((y0 + y) * cols * cw + x0) * 4);
  }
  const mat = new THREE.MeshStandardMaterial({ ...std(name), map: texOf(out) });
  mat.userData = { atlas: [cols, rows, have] };
  return mat;
}

const dae = new ColladaLoader();
const exporter = new GLTFExporter();

/** o: { body: [folder, dae], tops?: [folder, dae], topsTex?: folder, files: { [folder]: names[] }, maxTex, eye: [cols, w, h], mouth: [cols, w, h] }
 *  → { gltf (JSON, images as PNG data URIs), box, tris, joints, uv (the eyes' and mouth's uv ranges) }. */
window.convertVillager = async (o) => {
  const inFolder = (folder) => (n) => (o.files[folder]?.includes(n) ? `/src/${folder}/${n}` : null);
  const body = (await dae.loadAsync(`/src/${o.body[0]}/${o.body[1]}.dae`)).scene;
  body.updateMatrixWorld(true);
  const bones = new Map();
  body.traverse((n) => { if (n.isBone) bones.set(n.name, n); });
  // never drawn: collision, placeholders, shadow cards; and a special character's other faces (FaceBad, FaceGood,
  // FaceNothing: NH swaps whole meshes for theirs), as world3d-assets.ts's visitors hide them
  const hidden = (n) => /^Face(Bad|Good|Nothing)/.test(n.name) || HIDE.has((Array.isArray(n.material) ? n.material[0] : n.material)?.name);
  const gone = [];
  body.traverse((n) => { if (n.isMesh && hidden(n)) gone.push(n); });
  for (const n of gone) n.parent?.remove(n);
  const skinned = [];
  body.traverse((n) => { if (n.isSkinnedMesh) skinned.push(n); });
  if (!skinned.length) throw new Error('no skinned mesh');
  // the top: its own copy of the skeleton → the body's bones, by name
  if (o.tops) {
    const tops = (await dae.loadAsync(`/src/${o.tops[0]}/${o.tops[1]}.dae`)).scene;
    tops.updateMatrixWorld(true);
    const tm = [];
    tops.traverse((n) => { if (n.isSkinnedMesh) tm.push(n); });
    for (const m of tm) {
      // a top's own joints (a dress's skirt, Tom Nook's tail through his shirt): grafted onto the body's skeleton where
      // their parent is, root first
      const own = m.skeleton.bones.filter((b) => !bones.has(b.name));
      for (let pass = 0; own.length && pass < 8; pass++) {
        for (let i = own.length - 1; i >= 0; i--) {
          const b = own[i], parent = b.parent?.isBone || b.parent ? bones.get(b.parent.name) : null;
          if (!parent) continue;
          const c = new THREE.Bone();
          c.name = b.name;
          c.position.copy(b.position);
          c.quaternion.copy(b.quaternion);
          c.scale.copy(b.scale);
          parent.add(c);
          bones.set(c.name, c);
          own.splice(i, 1);
        }
      }
      if (own.length) throw new Error(`top's joints with no place on the body: ${own.map((b) => b.name).join(',')}`);
      body.updateMatrixWorld(true);
      const skel = new THREE.Skeleton(m.skeleton.bones.map((b) => bones.get(b.name)), m.skeleton.boneInverses.map((x) => x.clone()));
      const host = skinned[0].parent;
      host.add(m);
      m.position.copy(skinned[0].position);
      m.quaternion.copy(skinned[0].quaternion);
      m.scale.copy(skinned[0].scale);
      m.updateMatrixWorld(true);
      m.bind(skel, m.bindMatrix.clone());
      m.userData.tops = true;
      skinned.push(m);
    }
  }
  // the materials
  const bodyUrl = inFolder(o.body[0]);
  const topsUrl = o.topsTex ? inFolder(o.topsTex) : () => null;
  const uv = {};
  let tris = 0;
  for (const m of skinned) {
    const name = m.userData.tops ? 'mTops' : (Array.isArray(m.material) ? m.material[0] : m.material).name || m.name.split('__').pop();
    let mat;
    if (name === 'mEye') mat = await atlasMat('mEye', bodyUrl, 16, o.eye[0], o.eye[1], o.eye[2]);
    else if (name === 'mMouth') mat = await atlasMat('mMouth', bodyUrl, 9, o.mouth[0], o.mouth[1], o.mouth[2]);
    else if (name === 'mTops') mat = await plainMat('mTops', topsUrl, o);
    else mat = await plainMat(name, bodyUrl, o);
    m.material = mat;
    m.name = name;
    m.castShadow = false;
    const g = m.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    if (name === 'mEye' || name === 'mMouth') {
      const a = g.attributes.uv;
      let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (let i = 0; i < a.count; i++) {
        u0 = Math.min(u0, a.getX(i)); u1 = Math.max(u1, a.getX(i)); v0 = Math.min(v0, a.getY(i)); v1 = Math.max(v1, a.getY(i));
      }
      uv[name] = [u0, u1, v0, v1].map((n) => +n.toFixed(3));
    }
    // three's exporter wants the skin's attributes as they are; drop what the app never reads
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
  }
  // nothing but the skeleton and the skinned meshes (Collada's extra nodes, a light or a camera, dropped)
  const drop = [];
  body.traverse((n) => { if (!n.isBone && !n.isSkinnedMesh && n !== body && !n.isGroup && n.type !== 'Object3D') drop.push(n); });
  for (const n of drop) n.parent?.remove(n);
  const box = new THREE.Box3();
  body.updateMatrixWorld(true);
  for (const m of skinned) {
    m.computeBoundingBox?.();
    const b = m.boundingBox ? m.boundingBox.clone().applyMatrix4(m.matrixWorld) : new THREE.Box3().setFromObject(m);
    box.union(b);
  }
  const scene = new THREE.Scene();
  scene.add(body);
  const gltf = await exporter.parseAsync(scene, { binary: false, onlyVisible: true });
  return { gltf: JSON.stringify(gltf), box: [box.min.toArray(), box.max.toArray()], tris: Math.round(tris), joints: bones.size, uv };
};

window.ready = true;
