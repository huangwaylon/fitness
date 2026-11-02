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

/** A material's textures by the Collada's effects (material id → its diffuse image's file, less `_Alb.png`): NH's
 *  materials don't always have textures of their own: mCapVis (the ears, the hair and the horns a hat hides: NH draws
 *  it without one) samples mBody_Alb, mGlassCap mGlass_Alb, a hedgehog's or a kangaroo's mSoftmesh mBody_Alb or
 *  mCloth_Alb. Looked up by the material's own name these were plain grey. */
function albedos(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const files = new Map([...doc.querySelectorAll('library_images > image')].map((im) => [im.id, im.querySelector('init_from')?.textContent?.trim()]));
  const out = new Map();
  for (const m of doc.querySelectorAll('library_materials > material')) {
    const fx = doc.getElementById(m.querySelector('instance_effect')?.getAttribute('url')?.slice(1) ?? '');
    const p = fx && [...fx.querySelectorAll('newparam')].find((n) => /-diffuse$/.test(n.getAttribute('sid') ?? '') && n.querySelector('surface'));
    const f = files.get(p?.querySelector('init_from')?.textContent?.trim() ?? '') ?? '';
    const base = /^([A-Za-z0-9]+)_Alb(\.0)?\.png$/.exec(f)?.[1];
    if (base) out.set(m.id, base);
  }
  return out;
}

/** A plain material (the body, a top): its albedo (`<base>_Alb.png`) at ≤ maxTex, occluded by `<base>_Mix`, cut out by
 *  `<base>_OP`'s green if it has one. The texture is made once per base and shared (mCapVis and the tail wear the
 *  body's own: one image in the GLB). */
async function plainMat(name, base, url, o, cache) {
  const key = url(`${base}_Alb.png`);
  if (!cache.has(key)) cache.set(key, plainTex(base, url, o));
  const t = await cache.get(key);
  if (!t) return new THREE.MeshStandardMaterial({ ...std(name), color: 0xcccccc });
  return new THREE.MeshStandardMaterial({ ...std(name), map: t.map, ...(t.cut ? { alphaTest: 0.45, side: THREE.DoubleSide } : {}) });
}
async function plainTex(name, url, o) {
  const alb = await bitmap(url(`${name}_Alb.png`));
  if (!alb) return null;
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
  return { map: texOf(a), cut };
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
 *  → { gltf (JSON, images as PNG data URIs), box, tris, joints, uv (the eyes' and mouth's uv ranges), want (each
 *  material: whether its source had an albedo) }. */
window.convertVillager = async (o) => {
  const inFolder = (folder) => (n) => (o.files[folder]?.includes(n) ? `/src/${folder}/${n}` : null);
  const bodyDae = `/src/${o.body[0]}/${o.body[1]}.dae`;
  const base = albedos(await (await fetch(bodyDae)).text());
  const body = (await dae.loadAsync(bodyDae)).scene;
  body.updateMatrixWorld(true);
  const bones = new Map();
  body.traverse((n) => { if (n.isBone) bones.set(n.name, n); });
  // never drawn: collision, placeholders, shadow cards. The faces NH swaps whole meshes for (FaceNothing, FaceGood,
  // FaceBad: a bird's beak, a deer's or a gorilla's muzzle, a special character's face: their mBeak, or their mEye)
  // are kept, each named for its face: villager3d.ts shows the one for the expression (FaceNothing at rest)
  const hidden = (n) => (!o.swaps && /^Face(Bad|Good)/.test(n.name)) || HIDE.has((Array.isArray(n.material) ? n.material[0] : n.material)?.name);
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
  /** each material's name → whether its source has a base colour (models.ts fails a GLB that lost one) */
  const want = {};
  const cache = new Map();
  let tris = 0;
  for (const m of skinned) {
    const name = m.userData.tops ? 'mTops' : (Array.isArray(m.material) ? m.material[0] : m.material).name || m.name.split('__').pop();
    let mat;
    if (name === 'mEye') mat = await atlasMat('mEye', bodyUrl, 16, o.eye[0], o.eye[1], o.eye[2]);
    else if (name === 'mMouth') mat = await atlasMat('mMouth', bodyUrl, 9, o.mouth[0], o.mouth[1], o.mouth[2]);
    else if (name === 'mTops') mat = await plainMat('mTops', 'mTops', topsUrl, o, cache);
    else mat = await plainMat(name, base.get(name) ?? name, bodyUrl, o, cache);
    const src = name === 'mEye' || name === 'mMouth' ? bodyUrl(`${name}_Alb.0.png`) : name === 'mTops' ? topsUrl('mTops_Alb.png') : bodyUrl(`${base.get(name) ?? name}_Alb.png`);
    want[name] = (want[name] ?? false) || !!src;
    m.material = mat;
    // (a face mesh keeps its face: FaceGood:mBeak)
    const face = /^(Face(?:Bad|Good|Nothing))/.exec(m.name)?.[1];
    m.name = face ? `${face}:${name}` : name;
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
  return { gltf: JSON.stringify(gltf), box: [box.min.toArray(), box.max.toArray()], tris: Math.round(tris), joints: bones.size, uv, want };
};

window.ready = true;
