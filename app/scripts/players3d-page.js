// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of scripts/players3d-models.ts: NH's human player as parts the app assembles at runtime
// (components/player3d). Built on the avatar study's assembler (design/avatar/render/player.js: served as /player.js):
//   bodyGltf()       the body (skeleton, skin, legs, face patches, ears, noses) with its tintable textures: the skin's
//                    alpha its tint mask (1: skin, tinted at runtime; 0: the underwear's own colour), the face patches'
//                    likewise (the eyes' and mouths' atlases come apart, per eye or mouth type: faceAtlas)
//   faceAtlas(kind, folder)  an eye type's 16 frames (4 × 4 of 128 × 64) or a mouth's 9 (3 × 3 of 64 × 64), skin-masked
//   cheeks()         the three blush shapes, skin-masked
//   meshGltf(folder) a part's mesh alone, its own joints (bound to the body's by name at runtime), no textures; hair's
//                    with its greyscale texture (tinted at runtime)
//   itemTex(slot, value)  an item worn on the player (player.js wear()) → its materials' baked albedos and how each
//                    is drawn (cutout, see-through, tinted by the hair's colour or the skin's)
import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { loadPlayer, bitmap, straight, normalMaps, bake, useFiles } from '/player.js';

const MAX = 256;
let FILES = {}, P = null;
const url = (folder, file) => (FILES[`${folder}.Nin_NX_NVN`]?.includes(file) ? `/src/${folder}.Nin_NX_NVN/${file}` : null);
async function px(folder, file, w, h) {
  const u = url(folder, file);
  if (!u) return null;
  const img = straight(await bitmap(u));
  if (!w || (img.width === w && img.height === h)) return img;
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(img.width - 1, Math.floor((x + 0.5) * img.width / w)), sy = Math.min(img.height - 1, Math.floor((y + 0.5) * img.height / h));
    out.data.set(img.data.subarray((sy * img.width + sx) * 4, (sy * img.width + sx) * 4 + 4), (y * w + x) * 4);
  }
  return out;
}
const canvasOf = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); return c; };
/** A canvas (or image) at ≤ MAX px, as PNG. */
function png(src, max = MAX) {
  const s = Math.min(1, max / Math.max(src.width, src.height));
  const c = document.createElement('canvas');
  c.width = Math.max(4, Math.round(src.width * s)); c.height = Math.max(4, Math.round(src.height * s));
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
const texOf = (img) => { const t = new THREE.CanvasTexture(canvasOf(img)); t.colorSpace = THREE.SRGBColorSpace; t.flipY = true; return t; };
const BASE_LOOK = { skin: '#ffffff', hairColor: '#ffffff', eye: 'PlayerEye00', mouth: 'PlayerMouth00', nose: 0, cheek: 0 };

window.init = async (files) => {
  FILES = files;
  normalMaps(false);
  P = await loadPlayer(structuredClone(BASE_LOOK), FILES);
  return true;
};
window.addFiles = (more) => { Object.assign(FILES, more); return true; };

/** The skin: _Alb with _Mix's red (the tint mask) as its alpha. */
async function skinTex() {
  const a = await px('PlayerBody', 'mSkin_Alb.png');
  const m = await px('PlayerBody', 'mSkin_Mix.png', a.width, a.height);
  for (let i = 0; i < a.data.length; i += 4) a.data[i + 3] = m.data[i];
  return a;
}
/** A face frame: its RGB where _Mix's red is 0, white where 1 (the skin's, tinted), the red as alpha; the sclera lifted
 *  toward white (player.js faceMat's). */
async function faceFrame(folder, base, frame, w, h) {
  const a = await px(folder, `${base}_Alb.${frame}.png`, w, h);
  if (!a) return null;
  const m = await px(folder, `${base}_Mix.${frame}.png`, w, h);
  for (let i = 0; i < a.data.length; i += 4) {
    const r = m ? m.data[i] / 255 : 0;
    if (base === 'mEye' && r < 0.5 && a.data[i] > 150) for (let c = 0; c < 3; c++) a.data[i + c] += Math.round((255 - a.data[i + c]) * 0.55);
    for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(a.data[i + c] * (1 - r) + 255 * r);
    a.data[i + 3] = Math.round(r * 255);
  }
  return a;
}
/** An eye type's 16 frames or a mouth type's 9, one atlas. */
window.faceAtlas = async (kind, folder, more) => {
  Object.assign(FILES, more ?? {});
  const [base, n, cols, cw, ch] = kind === 'eye' ? ['mEye', 16, 4, 128, 64] : ['mMouth', 9, 3, 64, 64];
  const rows = Math.ceil(n / cols), out = new ImageData(cols * cw, rows * ch);
  for (let i = 0; i < n; i++) {
    const f = await faceFrame(folder, base, i, cw, ch);
    if (!f) continue;
    const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
    for (let y = 0; y < ch; y++) out.data.set(f.data.subarray(y * cw * 4, (y + 1) * cw * 4), ((y0 + y) * cols * cw + x0) * 4);
  }
  return canvasOf(out).toDataURL('image/png');
};
/** The three blush shapes: white (skin) where _Alb is white, the blush (#f3958a) where black, the skin weight as alpha. */
window.cheeks = async () => {
  const out = [];
  for (const k of [0, 1, 2]) {
    const a = await px('PlayerBody', `mCheek_Alb.${k}.png`);
    const b = [0xf3, 0x95, 0x8a];
    for (let i = 0; i < a.data.length; i += 4) {
      const w = 1 - (1 - a.data[i] / 255) * 0.6;
      for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(255 * w + b[c] * (1 - w));
      a.data[i + 3] = Math.round(w * 255);
    }
    out.push(png(canvasOf(a), 128));
  }
  return out;
};

/** The body as a glTF: its meshes on its skeleton; the skin's and the legs' textures in it (tintable: material
 *  extras `tint`), the face patches' uvs on the atlases' first cell (their textures come apart). */
window.bodyGltf = async () => {
  const p = await loadPlayer(structuredClone(BASE_LOOK), FILES);
  const skin = texOf(await skinTex());
  const bare = await px('PlayerBody', 'mSocks_AlbOry.png');
  for (let i = 0; i < bare.data.length; i += 4) bare.data[i + 3] = 255;
  const nose = await px('PlayerBody', 'mNose_Alb.png');
  for (let i = 0; i < nose.data.length; i += 4) nose.data[i + 3] = 255;
  let tris = 0;
  const drop = [];
  // (every mesh of the body: the hidden noses aren't among the player's drawn parts)
  const all = [];
  p.body.traverse((x) => { if (x.isSkinnedMesh) all.push(x); });
  for (const m of all) {
    const n = (Array.isArray(m.material) ? m.material[0] : m.material)?.name || m.name.split('__').pop();
    if (n === 'mPaint') { drop.push(m); continue; }
    m.visible = true;
    const mat = new THREE.MeshStandardMaterial({ name: n, roughness: 1, metalness: 0 });
    if (n === 'mSkin') { mat.map = skin; mat.userData = { tint: 'skin', mask: 1 }; }
    else if (n === 'mSocks') { mat.map = texOf(bare); mat.userData = { tint: 'skin', mask: 1 }; }
    else if (n === 'mNose') mat.map = texOf(nose);
    else if (n === 'mEye' || n === 'mMouth' || n === 'mCheek') {
      const [cols, rows] = n === 'mEye' ? [4, 4] : n === 'mMouth' ? [3, 3] : [1, 1];
      mat.userData = { tint: 'skin', mask: 1, atlas: [cols, rows, n === 'mEye' ? 16 : n === 'mMouth' ? 9 : 1] };
      const uv = m.geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / cols, 1 - (1 - uv.getY(i)) / rows);
      // (a 4 px placeholder: its texture is the eye's, the mouth's or the blush's, set at runtime)
      mat.map = texOf(new ImageData(new Uint8ClampedArray(64).fill(255), 4, 4));
    }
    m.material = mat;
    if (/^Nose0[0-2]/.test(m.name)) m.name = m.name.slice(0, 6);
    const g = m.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
  }
  for (const m of drop) m.parent?.remove(m);
  // the study's attach bones go: the runtime makes its own
  const extra = [];
  p.body.traverse((n) => { if (/Attach$/.test(n.name)) extra.push(n); });
  for (const n of extra) n.parent?.remove(n);
  const strip = [];
  p.body.traverse((n) => { if (!n.isBone && !n.isMesh && n !== p.body && !n.isGroup && n.type !== 'Object3D') strip.push(n); });
  for (const n of strip) n.parent?.remove(n);
  const scene = new THREE.Scene();
  scene.add(p.root);
  const gltf = await new GLTFExporter().parseAsync(scene, { binary: false, onlyVisible: false, maxTextureSize: MAX });
  return { gltf: JSON.stringify(gltf), tris: Math.round(tris) };
};

const dae = new ColladaLoader();
const HIDE = /Soft[mM]esh|Dummy|Shadow/;
/** A part's mesh as a glTF, its own skeleton (joint names kept: bound by name at runtime) or none (a rigid part).
 *  `textured`: its materials' baked textures kept in it (hair: one texture per hairstyle, tinted at runtime). */
window.meshGltf = async (folder, file, textured, more) => {
  Object.assign(FILES, more ?? {});
  useFiles(FILES);
  const sc = (await dae.loadAsync(url(folder, file))).scene;
  let tris = 0, joints = 0;
  const drop = [], mats = {};
  const meshes = [];
  sc.traverse((m) => {
    if (m.isBone) joints++;
    if (m.isMesh) meshes.push(m);
    else if (!m.isBone && m !== sc && !m.isGroup && m.type !== 'Object3D') drop.push(m);
  });
  for (const m of meshes) {
    const n = (Array.isArray(m.material) ? m.material[0] : m.material)?.name || m.name.split('__').pop();
    if (HIDE.test(n)) { drop.push(m); continue; }
    const g = m.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) g.deleteAttribute(k);
    let mat = new THREE.MeshStandardMaterial({ name: n, roughness: 1, metalness: 0 });
    if (textured) {
      const skinPart = /HairSkin$/.test(n);
      const b = skinPart ? await bake.tint(n, folder, n, '#ffffff', true) : await bake.hair(n, folder, '#ffffff', n === 'mHair' ? 'mHair' : n);
      mat = b;
      mat.name = n;
      mat.userData = { tint: skinPart ? 'skin' : 'hair' };
    }
    m.material = mat;
    mats[n] = true;
  }
  for (const m of drop) m.parent?.remove(m);
  const gltf = await new GLTFExporter().parseAsync(sc, { binary: false, maxTextureSize: MAX });
  return { gltf: JSON.stringify(gltf), tris: Math.round(tris), joints, mats: Object.keys(mats) };
};

/** An item worn on the player (player.js wear(): its materials baked as the closet showed them, the tints white) →
 *  per material { png, cut, glass, tint }. */
window.itemTex = async (slot, value, more) => {
  Object.assign(FILES, more ?? {});
  await P.wear(slot, value);
  const key = slot === 'socks' ? 'mSocks' : slot;
  const out = {};
  for (const r of P.out.filter((x) => x.slot === key)) {
    const m = r.mesh.material, n = m.name;
    if (out[n]) continue;
    const folder = r.folder ?? value;
    const tint = /HairSkin$/.test(n) ? 'skin' : (/Hair$/.test(n) || (m.map && FILES[`${folder}.Nin_NX_NVN`]?.some((f) => f === `${n.replace(/^.*_(m[A-Z][A-Za-z]*)$/, '$1')}_AlbGry.png`) && !FILES[`${folder}.Nin_NX_NVN`]?.some((f) => f === `${n.replace(/^.*_(m[A-Z][A-Za-z]*)$/, '$1')}_Alb.png`))) ? 'hair' : null;
    out[n] = {
      png: m.map?.image ? png(m.map.image) : null,
      cut: m.alphaTest > 0 && !m.transparent, glass: !!m.transparent, opacity: m.transparent ? m.opacity : 1,
      color: m.map ? null : '#' + m.color.getHexString(), tint
    };
  }
  return out;
};

window.ready = true;
