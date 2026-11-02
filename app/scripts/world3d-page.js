// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of scripts/world3d-models.ts (the 3D island POC, /world3d): scripts/room-models-page.js (the tent's
// converter) copied, plus NH's gradient lookup (the gray albedo picks the colour, as scripts/models-page.js does), per-material gradient rows (`grdRows`: regex of the material name → row, a bush's flowers)
// and a gradient's block (`grdBlock`: [u0, width], a gradient holding two ramps side by side), as scripts/models-page.js
// reads them, and texture names for materials whose files go by another (`alias`). Everything else is the tent's: NH's materials baked into one texture each, merged per material, written
// by three's GLTFExporter.
import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Never drawn: collision, placeholders, NH's shadow cards, the snow of a winter look. */
const HIDE = new Set(['mSoftMesh', 'mDummy', 'mShadow', 'mShadowShake', 'mChimneyhole', 'mWinterSnow']);
/** The occlusion's weight in the baked albedo (three applies an AO map to the ambient only: baked, it darkens all light). */
const AO = 0.35;

const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

async function bitmap(url) {
  if (!url) return null;
  const r = await fetch(url);
  if (!r.ok) return null;
  return createImageBitmap(await r.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
}
/** An image decoded as it is (no premultiplied alpha), its alpha made opaque: an albedo whose alpha isn't an opacity
 *  (a 2D canvas would lose the colour of its see-through pixels). */
async function opaque(url) {
  const bm = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
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
  for (let i = 3; i < buf.length; i += 4) buf[i] = 255;
  return createImageBitmap(new ImageData(buf, w, h));
}
/** An image's pixels at w × h (scaled by the canvas: a smooth downscale). */
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

/** The gradient for a gray material: <name>Color_Grd, else the one of its part (scripts/models-page.js grdFor). */
function grdFor(name, all) {
  const base = name.replace(/^m/, '');
  const exact = all.find((x) => x.split('/').pop().replace(/^m/, '').startsWith(`${base}Color_Grd`));
  if (exact) return exact;
  if (/Trunk/.test(name)) return all.find((x) => /TrunkColor_Grd/.test(x));
  if (/Flow|Petal/.test(name)) return all.find((x) => /(Flow|Petal)Color_Grd/.test(x));
  return all.find((x) => !/TrunkColor|FlowColor|PetalColor/.test(x)) ?? null;
}

/** One material baked: { mat, tex: px or 0, lit }. */
async function bake(name, files, o) {
  // a material whose textures go by another name (`alias`: NH's fruit models)
  const tn = o.alias?.[name] ?? name;
  const find = (suffix) => {
    // a character's eyes and mouth keep one texture per expression (`mEye_Alb.0.png` …): the first, NH's resting face
    for (const n of [...(o.variant !== undefined ? [`${tn}_${suffix}.${o.variant}.png`] : []), `${tn}_${suffix}.png`, `${tn}_${suffix}.0.png`]) for (const [folder, list] of files) if (list.includes(n)) return `/src/${folder}/${n}`;
    return null;
  };
  const allGrd = files.flatMap(([f, l]) => l.filter((x) => x.endsWith('_Grd.png')).map((x) => `/src/${f}/${x}`));
  // a lit display (`_ETxt`: the countdown board's digits) is its own albedo and its emissive
  const etxt = find('ETxt');
  const albU = find('Alb') || find('AlbGry') || etxt;
  const gray = !find('Alb') && !!find('AlbGry');
  // a gradient named for the material (`grdFile`: regex of the material name → regex of the gradient's file name)
  const pick = Object.entries(o.grdFile ?? {}).find(([re]) => new RegExp(re).test(name))?.[1];
  const grdU = gray || !albU ? (pick ? allGrd.find((x) => new RegExp(pick).test(x.split('/').pop())) : grdFor(name, allGrd)) : null;
  const [alb, mix, op, emi, grd] = await Promise.all([bitmap(albU), bitmap(find('Mix')), bitmap(find('OP')), bitmap(find('Emi') || etxt), bitmap(grdU)]);
  const glass = /Glass|Window/.test(name);
  const row = Object.entries(o.grdRows ?? {}).find(([re]) => new RegExp(re).test(name))?.[1] ?? o.grdRow ?? 0.5;
  const [bu0, bw] = o.grdBlock ?? [0, 1];
  const grdPx = grd ? pixels(grd, grd.width, grd.height) : null;
  const grdAt = (u) => {
    const x = Math.min(grdPx.width - 1, Math.max(0, Math.round((bu0 + u * bw) * (grdPx.width - 1))));
    const y = Math.min(grdPx.height - 1, Math.max(0, Math.round(row * (grdPx.height - 1))));
    const i = (y * grdPx.width + x) * 4;
    return [grdPx.data[i] / 255, grdPx.data[i + 1] / 255, grdPx.data[i + 2] / 255];
  };
  const std = { name, roughness: 1, metalness: 0, side: THREE.DoubleSide };
  // the snow of a winter look (`snow`): white and rough, NH's shared snow textures being flat placeholders
  if (name === 'mWinterSnow') return { mat: new THREE.MeshStandardMaterial({ ...std, color: 0xf6f9ff }), tex: 0 };
  if (name === 'mMyDesign') return { mat: new THREE.MeshStandardMaterial({ ...std, color: 0xede3cf }), tex: 0 };
  if (!alb) {
    // a gradient's colour (a painted part), or a glass pane (no texture at all)
    if (grdPx) {
      const [r, g, b] = grdAt(0.5);
      return { mat: new THREE.MeshStandardMaterial({ ...std, color: new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace) }), tex: 0 };
    }
    // `flat`: one colour [rgb, opacity] (a fish's shadow: NH draws it untextured, dark and see-through)
    if (o.flat) return { mat: new THREE.MeshStandardMaterial({ ...std, color: o.flat[0], ...(o.flat[1] < 1 ? { transparent: true, opacity: o.flat[1], depthWrite: false } : {}) }), tex: 0 };
    return { mat: new THREE.MeshStandardMaterial({ ...std, color: 0x6f8fa8, transparent: true, opacity: 0.55, depthWrite: false }), tex: 0 };
  }
  const s = Math.min(1, o.maxTex / Math.max(alb.width, alb.height));
  const w = Math.max(4, Math.round(alb.width * s)), h = Math.max(4, Math.round(alb.height * s));
  let a = pixels(alb, w, h), d = a.data;
  const m = mix ? pixels(mix, w, h).data : null;
  const p = op ? pixels(op, w, h).data : null;
  let cutout = false, blend = false;
  // an albedo whose alpha is nearly all low isn't an opacity (NH's icons keep something else there): opaque
  let low = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 128) low++;
  const alphaOk = low < 0.9 * (d.length / 4);
  if (!alphaOk) {
    a = pixels(await opaque(albU), w, h);
    d = a.data;
  }
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    if (gray && grdPx) {
      const [gr, gg, gb] = grdAt(Math.min(0.99, Math.max(0.01, r)));
      // NH's (and scripts/models-page.js's): the gray albedo only picks the colour along the gradient (it isn't a
      // multiplier as well: the tent's converter darkens a canopy so)
      r = gr;
      g = gg;
      b = gb;
    }
    if (m) {
      const ao = 1 - AO * (1 - m[i + 2] / 255);
      r = linToSrgb(srgbToLin(r) * ao);
      g = linToSrgb(srgbToLin(g) * ao);
      b = linToSrgb(srgbToLin(b) * ao);
    }
    d[i] = Math.round(r * 255);
    d[i + 1] = Math.round(g * 255);
    d[i + 2] = Math.round(b * 255);
    // the opacity: the _OP map's (three's alphaMap reads green), else the albedo's own alpha (not a gray albedo's: a
    // tree's trunk keeps something else there, and NH cuts its leaves out with an _OP map)
    const al = p ? p[i + 1] : gray || !alphaOk ? 255 : d[i + 3];
    d[i + 3] = al;
    if (al < 250) (glass ? (blend = true) : (cutout = true));
  }
  const map = new THREE.CanvasTexture(canvasOf(a));
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.flipY = true;
  const mat = new THREE.MeshStandardMaterial({
    ...std, map,
    ...(blend ? { transparent: true, depthWrite: false } : {}),
    ...(cutout && !blend ? { alphaTest: 0.45 } : {})
  });
  let lit = false;
  if (emi && (o.emissive ?? true)) {
    const es = Math.min(1, o.maxEmi / Math.max(emi.width, emi.height));
    const e = pixels(emi, Math.max(4, Math.round(emi.width * es)), Math.max(4, Math.round(emi.height * es)));
    let any = false;
    for (let i = 0; i < e.data.length; i += 4) if (e.data[i] + e.data[i + 1] + e.data[i + 2] > 30) { any = true; break; }
    if (any) {
      const em = new THREE.CanvasTexture(canvasOf(e));
      em.colorSpace = THREE.SRGBColorSpace;
      em.flipY = true;
      mat.emissiveMap = em;
      mat.emissive = new THREE.Color(0xffe2a8);
      lit = true;
    }
  }
  return { mat, tex: w, lit };
}

const dae = new ColladaLoader();
const exporter = new GLTFExporter();

/** A mesh's triangles in the model's space at its rest pose: position, normal and uv only, never indexed. */
function plain(mesh) {
  mesh.updateWorldMatrix(true, false);
  const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  const n = src.attributes.position.count;
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  for (let i = 0; i < n; i++) {
    if (mesh.isSkinnedMesh) mesh.getVertexPosition(i, v);
    else v.fromBufferAttribute(src.attributes.position, i);
    v.applyMatrix4(mesh.matrixWorld);
    pos.set([v.x, v.y, v.z], i * 3);
    if (src.attributes.normal) {
      v.fromBufferAttribute(src.attributes.normal, i).applyMatrix3(nm).normalize();
      nrm.set([v.x, v.y, v.z], i * 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (src.attributes.normal) g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  else g.computeVertexNormals();
  g.setAttribute('uv', src.attributes.uv ? src.attributes.uv.clone() : new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return g;
}

/** o: { parts: [{folder, dae}], files: [[folder, names]], maxTex, maxEmi, grdRow?, hide? } → the glTF (JSON, images
 *  as PNG data URIs), the bounds, triangles and materials. */
window.convert = async (o) => {
  const group = new THREE.Group();
  for (const p of o.parts) {
    const c = await dae.loadAsync(`/src/${p.folder}/${p.dae}`);
    c.scene.traverse((n) => { if (n.isMesh) n.userData.folder = p.folder; });
    // a part's place (a snowboy's head on its body; the countdown board's display in its frame): moved up (and across,
    // and nearer) and scaled about its origin
    if (p.at) {
      c.scene.position.y += p.at[0];
      c.scene.position.x += p.at[2] ?? 0;
      c.scene.position.z += p.at[3] ?? 0;
      c.scene.scale.multiplyScalar(p.at[1]);
    }
    group.add(c.scene);
  }
  // a pose: a joint turned (degrees about its own x, y, z), scripts/models-page.js's (the shishi-odoshi's tube tipped)
  for (const [jn, r] of Object.entries(o.pose || {})) {
    const j = group.getObjectByName(jn);
    if (j) j.rotation.set(j.rotation.x + THREE.MathUtils.degToRad(r[0]), j.rotation.y + THREE.MathUtils.degToRad(r[1]), j.rotation.z + THREE.MathUtils.degToRad(r[2]));
  }
  group.updateMatrixWorld(true);
  const meshes = [];
  group.traverse((n) => { if (n.isMesh) meshes.push(n); });
  const baked = new Map(), byKey = new Map();
  let tris = 0;
  for (const m of meshes) {
    const name = (Array.isArray(m.material) ? m.material[0] : m.material).name || (m.name || m.parent?.name || '').split('__').pop();
    if ((HIDE.has(name) && !(o.snow && name === 'mWinterSnow')) || (o.hide || []).some((h) => m.name.includes(h) || name === h)) continue;
    const key = `${m.userData.folder}|${name}`;
    if (!baked.has(key)) {
      const others = new Set(o.parts.map((q) => q.folder).filter((f) => f !== m.userData.folder));
      const files = [...o.files.filter(([f]) => !others.has(f)), ...o.files.filter(([f]) => others.has(f))];
      baked.set(key, await bake(name, files, o));
    }
    const g = plain(m);
    tris += g.attributes.position.count / 3;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(g);
  }
  const scene = new THREE.Scene();
  const box = new THREE.Box3();
  const parts = [];
  let lit = false;
  for (const [key, gs] of byKey) {
    const b = baked.get(key);
    const mesh = new THREE.Mesh(gs.length > 1 ? mergeGeometries(gs) : gs[0], b.mat);
    mesh.name = key.split('|').pop();
    mesh.geometry.computeBoundingBox();
    box.union(mesh.geometry.boundingBox);
    parts.push([mesh.name, mesh.geometry.boundingBox.min.toArray().map((n) => +n.toFixed(1)), mesh.geometry.boundingBox.max.toArray().map((n) => +n.toFixed(1))]);
    if (b.lit) lit = true;
    scene.add(mesh);
  }
  const gltf = await exporter.parseAsync(scene, { binary: false, onlyVisible: true });
  return {
    gltf: JSON.stringify(gltf), box: [box.min.toArray(), box.max.toArray()], tris: Math.round(tris),
    mats: [...baked.keys()].map((k) => k.split('|').pop()), lit, parts
  };
};

window.ready = true;
