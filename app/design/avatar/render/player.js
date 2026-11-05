// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The NH player assembler (design exploration): an outfit JSON → a skinned three.js Group built from the game-file
// dump's Collada and PNGs (PlayerBody + hair + top/bottom/shoes + glasses; eyes, mouth, cheeks as NH's face patches),
// NH's tints baked into the textures (skin, hair colour, blush). See ../tech-notes.md. Served by harness.ts at
// /player.js; the app's villager3d rig.ts and poses.ts at /v3d/ (type-stripped).
import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { rigOf } from '/v3d/rig.ts';

export async function bitmap(url) {
  if (!url) return null;
  const r = await fetch(url);
  if (!r.ok) return null;
  return createImageBitmap(await r.blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
}
/** An image's straight (unpremultiplied) pixels, through WebGL (a 2D canvas loses colour under low alpha). */
export function straight(bm) {
  const w = bm.width, h = bm.height;
  // one context for every read (a context per image runs Chrome out of them and loses the renderer's)
  const gl = (straight.gl ??= new OffscreenCanvas(1, 1).getContext('webgl2'));
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
  gl.deleteFramebuffer(fb);
  gl.deleteTexture(t);
  // (no flip: the image's first row went in at the texture's row 0 and comes back first)
  return new ImageData(buf, w, h);
}


const dae = new ColladaLoader();
const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
let FILES = {};
let BASE = '/src/';
const F = (n) => `${n}.Nin_NX_NVN`;
const url = (folder, file) => (FILES[F(folder)]?.includes(file) ? `${BASE}${F(folder)}/${file}` : null);
async function px(folder, file, w, h) {
  const u = url(folder, file);
  if (!u) return null;
  const img = straight(await bitmap(u));
  if (!w || (img.width === w && img.height === h)) return img;
  // rescale channel-exact (alpha kept as data): through a canvas of an opaque copy per pair of channels
  const out = new ImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(img.width - 1, Math.floor((x + 0.5) * img.width / w)), sy = Math.min(img.height - 1, Math.floor((y + 0.5) * img.height / h));
    const i = (sy * img.width + sx) * 4, o = (y * w + x) * 4;
    out.data[o] = img.data[i]; out.data[o + 1] = img.data[i + 1]; out.data[o + 2] = img.data[i + 2]; out.data[o + 3] = img.data[i + 3];
  }
  return out;
}
function texOf(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  c.getContext('2d').putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = true;
  t.anisotropy = 8;
  return t;
}
const mul = (a, b) => Math.round(linToSrgb(srgbToLin(a / 255) * srgbToLin(b / 255)) * 255);
const std = (name, o = {}) => new THREE.MeshStandardMaterial({ name, roughness: 0.92, metalness: 0, ...o });

/** NH's cloth albedo (tops, bottoms, shoes, socks): RGB is the colour, A a fabric detail (0.5 neutral: the knit, the
 *  weave) laid over it; _OP's green the cutout. `k` how strongly the detail shows. */
async function clothMat(name, folder, base, k = 1.0) {
  const a = await px(folder, `${base}_Alb.png`);
  if (!a) return std(name, { color: 0xff00ff });
  const op = await px(folder, `${base}_OP.png`, a.width, a.height);
  const mix = await px(folder, `${base}_Mix.png`, a.width, a.height);
  let cut = false;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = 1 + k * (a.data[i + 3] / 255 - 0.5) * 1.6;
    // _Mix's green: the weave's cavities (the cables, the ribbing; flat white on plain cloth), baked in gently
    const ao = mix ? 0.6 + 0.4 * (mix.data[i + 1] / 255) : 1;
    for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(linToSrgb(Math.min(1, srgbToLin(a.data[i + c] / 255) * d * ao)) * 255);
    a.data[i + 3] = op ? op.data[i + 1] : 255;
    if (op && op.data[i + 1] < 250) cut = true;
  }
  return std(name, { map: texOf(a), normalMap: await nrmTex(folder, base), normalScale: new THREE.Vector2(1.6, 1.6), ...(cut ? { alphaTest: 0.5, side: THREE.DoubleSide } : {}) });
}

/** NH's _Nrm (two channels, BC5: x in red, y in green, z rebuilt) as a three.js normal map (renders only: the GLB
 *  export drops it). */
async function nrmTex(folder, base) {
  if (NO_NRM) return null;
  const a = await px(folder, `${base}_Nrm.png`);
  if (!a) return null;
  for (let i = 0; i < a.data.length; i += 4) {
    const x = a.data[i] / 127.5 - 1, y = a.data[i + 1] / 127.5 - 1;
    a.data[i + 2] = Math.round((Math.sqrt(Math.max(0, 1 - x * x - y * y)) * 0.5 + 0.5) * 255);
    a.data[i + 3] = 255;
  }
  const t = texOf(a);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
let NO_NRM = false;
/** Normal maps off (for the GLB export, as the villagers' carry none). */
export const normalMaps = (on) => { NO_NRM = !on; };

/** The body's skin: _Alb (white where skin, its own grey for the underwear) × the skin tone where _Mix's red. */
async function skinMat(name, skin) {
  const a = await px('PlayerBody', 'mSkin_Alb.png');
  const m = await px('PlayerBody', 'mSkin_Mix.png', a.width, a.height);
  const s = hex(skin);
  for (let i = 0; i < a.data.length; i += 4) {
    const r = m.data[i] / 255;
    for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(a.data[i + c] * (1 - r) + mul(a.data[i + c], s[c]) * r);
    a.data[i + 3] = 255;
  }
  return std(name, { map: texOf(a) });
}

/** A face decal (eye, mouth): its frame's RGB where _Mix's red is 0, see-through where it's 1 (the skin under it). */
async function faceMat(name, folder, base, frame, o) {
  const a = await px(folder, `${base}_Alb.${frame}.png`);
  if (!a) return std(name, { color: 0xff00ff });
  const m = await px(folder, `${base}_Mix.${frame}.png`, a.width, a.height);
  const iris = o.eyeColor ? hex(o.eyeColor) : null;
  const skin = hex(o.skin);
  for (let i = 0; i < a.data.length; i += 4) {
    // (the eye's alpha: its sclera and iris shading; the iris tinted where the RGB is dark inside the eye)
    if (iris && name === 'mEye' && m && m.data[i] < 128) {
      const lum = a.data[i] / 255, sh = a.data[i + 3] / 255;
      if (lum < 0.15) for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(iris[c] * (0.25 + 0.75 * (1 - sh)) + a.data[i + c]);
    }
    // the sclera a little lifted toward white (NH's shader shows it white; the albedo's is a light grey)
    if (name === 'mEye' && m && m.data[i] < 128 && a.data[i] > 150) for (let c = 0; c < 3; c++) a.data[i + c] += Math.round((255 - a.data[i + c]) * (o.scleraLift ?? 0.55));
    // the patch is the face itself: skin where _Mix's red (blended at its soft edge)
    const r = m ? m.data[i] / 255 : 0;
    for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(a.data[i + c] * (1 - r) + skin[c] * r);
    a.data[i + 3] = 255;
  }
  return std(name, { map: texOf(a) });
}

/** The hair: _AlbGry (grey) × the hair colour, _Mix's red its shading. */
async function hairMat(name, folder, color) {
  const a = await px(folder, 'mHair_AlbGry.png');
  const m = await px(folder, 'mHair_Mix.png', a.width, a.height);
  const op = await px(folder, 'mHair_OP.png', a.width, a.height);
  const h = hex(color);
  let cut = false;
  for (let i = 0; i < a.data.length; i += 4) {
    const shade = m ? 0.55 + 0.45 * (m.data[i] / 255) : 1;
    const spec = m ? 0.12 * (m.data[i + 2] / 255) : 0;
    for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(linToSrgb(Math.min(1, srgbToLin(a.data[i] / 255) * srgbToLin(h[c] / 255) * shade + spec * srgbToLin(h[c] / 255 + 0.3))) * 255);
    a.data[i + 3] = op ? op.data[i + 1] : 255;
    if (op && op.data[i + 1] < 250) cut = true;
  }
  // (back faces culled: the back hair's inner shell faces forward)
  return std(name, { map: texOf(a), normalMap: await nrmTex(folder, 'mHair'), ...(cut ? { alphaTest: 0.5, side: THREE.DoubleSide } : {}) });
}

/** An albedo × a tint where its _Mix's red (a hairstyle's skin: the shaved sides, the nape). */
async function tintMat(name, folder, base, tint, all = false) {
  const a = await px(folder, `${base}_Alb.png`);
  if (!a) return std(name, { color: tint });
  const m = await px(folder, `${base}_Mix.png`, a.width, a.height);
  const op = await px(folder, `${base}_OP.png`, a.width, a.height);
  const s = hex(tint);
  for (let i = 0; i < a.data.length; i += 4) {
    const r = all || !m ? 1 : m.data[i] / 255;
    for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(a.data[i + c] * (1 - r) + mul(a.data[i + c], s[c]) * r);
    a.data[i + 3] = op ? op.data[i + 1] : 255;
  }
  return std(name, { map: texOf(a), ...(op ? { alphaTest: 0.5, side: THREE.DoubleSide } : {}) });
}

async function plainMat(name, folder, base, o = {}) {
  const a = await px(folder, `${base}_Alb.png`) ?? await px(folder, `${base}_Alb.0.png`);
  if (!a) return std(name, { color: 0xff00ff });
  const op = await px(folder, `${base}_OP.png`, a.width, a.height);
  for (let i = 0; i < a.data.length; i += 4) a.data[i + 3] = op ? op.data[i + 1] : 255;
  return std(name, { map: texOf(a), ...(op ? { transparent: !!o.glass, alphaTest: o.glass ? 0.01 : 0.5, side: THREE.DoubleSide, depthWrite: !o.glass } : {}), ...(o.mat ?? {}) });
}

const matName = (m) => (Array.isArray(m.material) ? m.material[0] : m.material)?.name || m.name.split('__').pop();
const HIDE = new Set(['mSoftMesh', 'mSoftmesh', 'mDummy', 'mShadow', 'mShadowShake']);

/** A part's skinned meshes onto the body's skeleton by joint name (its own joints grafted on where their parent is). */
function graft(part, bones, host, ref, rename = {}) {
  const nm = (n) => rename[n] ?? n;
  part.updateMatrixWorld(true);
  const ms = [];
  part.traverse((n) => { if (n.isSkinnedMesh && !HIDE.has(matName(n))) ms.push(n); });
  for (const m of ms) {
    // the part's joints the body lacks, with their ancestors up to one it has (a joint with no weights isn't in the
    // skin's list but may still be a parent), root first
    const own = [];
    const want = (b) => {
      if (!b || b === part || own.includes(b) || bones.has(nm(b.name))) return;
      if (b.parent && b.parent !== part && (b.parent.isBone || b.parent.type === 'Object3D' && b.parent.name)) want(b.parent);
      own.push(b);
    };
    m.skeleton.bones.forEach(want);
    for (let pass = 0; own.length && pass < 8; pass++) {
      for (let i = 0; i < own.length; i++) {
        const b = own[i];
        const top = !b.parent || b.parent === part || !(b.parent.isBone || own.includes(b.parent) || bones.has(nm(b.parent.name)));
        const parent = top ? (rename.$top ? bones.get(rename.$top) : null) : bones.get(nm(b.parent.name));
        if (!parent) continue;
        const c = new THREE.Bone();
        c.name = nm(b.name); c.position.copy(b.position); c.quaternion.copy(b.quaternion); c.scale.copy(b.scale);
        parent.add(c);
        bones.set(c.name, c);
        own.splice(i--, 1);
      }
    }
    if (own.length) throw new Error(`joints with no place on the body: ${own.map((b) => b.name)}`);
    host.updateMatrixWorld(true);
    const skel = new THREE.Skeleton(m.skeleton.bones.map((b) => bones.get(nm(b.name))), m.skeleton.boneInverses.map((x) => x.clone()));
    ref.parent.add(m);
    m.position.copy(ref.position); m.quaternion.copy(ref.quaternion); m.scale.copy(ref.scale);
    m.updateMatrixWorld(true);
    m.bind(skel, m.bindMatrix.clone());
  }
  return ms;
}

/** o: the outfit → { root (a Group, the player at its origin, facing +z), rig, meshes: [{ mesh, slot }] }. */
/** An outfit (see outfits/*.json) → the player: { root (a Group at the origin, facing +z, 15.3 model units tall),
 *  body (the Collada scene: the skeleton), bones (name → Bone, the parts' own joints grafted in), rig (the app's
 *  villager3d rig.ts on it: rig.apply(pose) takes poses.ts poses as they are), out ([{ mesh, slot, folder }]),
 *  setFace(eyeFrame, mouthFrame) (async: NH's 16 eye and 9 mouth textures, swapped on the face's patches),
 *  eyes() (the eyes' middle, world) }.
 *  `files`: { '<Folder>.Nin_NX_NVN': [file names] } of what's under `base` (the harness's /src/). */
export async function loadPlayer(o, files, base = '/src/') {
  FILES = files;
  BASE = base;
  return assemble(o);
}
async function assemble(o) {
  const body = (await dae.loadAsync(url('PlayerBody', 'PlayerBody.dae'))).scene;
  body.updateMatrixWorld(true);
  const bones = new Map();
  body.traverse((n) => { if (n.isBone && !bones.has(n.name)) bones.set(n.name, n); });
  const skinned = [];
  body.traverse((n) => { if (n.isSkinnedMesh) skinned.push(n); });
  const ref = skinned.find((m) => /mSkin/.test(m.name)) ?? skinned[0];
  const nose = `Nose0${o.nose ?? 0}`;
  const out = [];
  for (const m of skinned) {
    const mat = matName(m);
    if (mat === 'mPaint' && !o.paint) { m.visible = false; continue; }
    if (/^Nose0\d/.test(m.name) && !m.name.startsWith(nose)) { m.visible = false; continue; }
    out.push({ mesh: m, slot: mat });
  }
  // the head's frame for what's modelled on it (hair: its file's Root and Head are the head joint, the body's axes)
  const head = bones.get('Head');
  const attach = new THREE.Bone();
  attach.name = 'HeadAttach';
  head.add(attach);
  body.updateMatrixWorld(true);
  attach.quaternion.copy(head.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(body.getWorldQuaternion(new THREE.Quaternion())));
  bones.set('HeadAttach', attach);
  const add = async (folder, slot, onHead = false) => {
    if (!folder) return [];
    const f = FILES[F(folder)]?.find((n) => n.endsWith('.dae'));
    if (!f) throw new Error(`${folder}: no .dae`);
    const part = (await dae.loadAsync(url(folder, f))).scene;
    const ms = graft(part, bones, body, ref, onHead ? { Root: `${slot}Root`, Head: 'HeadAttach', $top: 'HeadAttach' } : {});
    for (const m of ms) out.push({ mesh: m, slot, folder });
    return ms;
  };
  // rigid parts (glasses, a hat's hair): their one joint is the head's frame
  const rigid = async (folder, slot) => {
    if (!folder) return;
    const f = FILES[F(folder)].find((n) => n.endsWith('.dae'));
    const part = (await dae.loadAsync(url(folder, f))).scene;
    const ms = [];
    part.traverse((n) => { if (n.isMesh && !HIDE.has(matName(n))) ms.push(n); });
    const holder = new THREE.Group();
    holder.name = `${slot}Holder`;
    attach.add(holder);
    if (o.rigidOffset?.[slot]) holder.position.fromArray(o.rigidOffset[slot]);
    for (const m of ms) {
      const g = new THREE.Mesh(m.geometry, m.material);
      g.name = m.name;
      holder.add(g);
      out.push({ mesh: g, slot, folder });
    }
  };
  await add(o.hairCap ?? o.hair, 'hair', true);
  await add(o.top?.mesh, 'top');
  if (!o.top?.onepiece) await add(o.bottom?.mesh, 'bottom');
  await add(o.shoes, 'shoes');
  if (o.glasses) await rigid(o.glasses, 'glasses');
  for (const x of o.extra ?? []) {
    if (!x.rigid) { await add(x.folder, 'extra', !!x.onHead); continue; }
    // (a hair ornament's place is per hairstyle in the game, not in the files: `at` [x, y, z] in the head's frame,
    // `turn` [x, y, z] radians, `scale`)
    await rigid(x.folder, 'extra');
    const hd = attach.children.at(-1);
    if (x.at) hd.position.fromArray(x.at);
    if (x.turn) hd.rotation.set(...x.turn);
    if (x.scale) hd.scale.setScalar(x.scale);
  }

  // materials
  const cache = new Map();
  const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
  for (const r of out) {
    const n = matName(r.mesh);
    let mat;
    if (r.slot === 'mSkin') mat = await once('skin', () => skinMat('mSkin', o.skin));
    else if (r.slot === 'mSocks') mat = o.socks ? await once('socks', () => clothMat('mSocks', o.socks, 'mSocks')) : await once('bare', async () => {
      const a = await px('PlayerBody', 'mSocks_AlbOry.png'); const s = hex(o.skin);
      for (let i = 0; i < a.data.length; i += 4) { for (let c = 0; c < 3; c++) a.data[i + c] = mul(a.data[i + c], s[c]); a.data[i + 3] = 255; }
      return std('mSocks', { map: texOf(a) });
    });
    else if (r.slot === 'mEye') mat = await faceMat('mEye', o.eye, 'mEye', o.eyeFrame ?? 0, o);
    else if (r.slot === 'mMouth') mat = await faceMat('mMouth', o.mouth, 'mMouth', o.mouthFrame ?? 0, o);
    else if (r.slot === 'mNose') mat = await once('nose', () => plainMat('mNose', 'PlayerBody', 'mNose'));
    else if (r.slot === 'mCheek') mat = await once('cheek', async () => {
      // the cheeks' patch of the face: skin where _Alb is white, the blush where it's black (its shape: 0-2)
      const a = await px('PlayerBody', `mCheek_Alb.${o.cheek ?? 0}.png`); const b = hex(o.blush ?? '#f3958a'), sk = hex(o.skin), k = o.blushK ?? 0.6;
      for (let i = 0; i < a.data.length; i += 4) {
        const w = 1 - (1 - a.data[i] / 255) * k;
        for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(sk[c] * w + mul(sk[c], b[c]) * 0 + b[c] * (1 - w));
        a.data[i + 3] = 255;
      }
      return std('mCheek', { map: texOf(a) });
    });
    else if (r.slot === 'mPaint') mat = await plainMat('mPaint', 'PlayerBody', 'mPaint');
    else if (r.slot === 'hair' && n === 'mHairSkin') mat = await once(`hairskin${r.folder}`, () => tintMat(n, r.folder, n, o.skin, true));
    else if (r.slot === 'hair') mat = await once(`hair${n}`, () => hairMat(n, r.folder, o.hairColor ?? '#3b2a1e'));
    else if (r.slot === 'top') mat = await once('top', () => clothMat('mTops', o.top.tex, 'mTops', o.top.detail ?? 1));
    else if (r.slot === 'bottom') mat = await once('bottom', () => clothMat('mBottoms', o.bottom.tex, 'mBottoms', o.bottom.detail ?? 1));
    else if (r.slot === 'shoes') mat = await once('shoes', () => clothMat('mShoes', o.shoes, 'mShoes', 0.6));
    else if (/^mCap/.test(n)) mat = await once(`${r.folder}:${n}`, () => clothMat(n, r.folder, n, 0.6));
    else mat = await once(`${r.folder}:${n}`, () => plainMat(n, r.folder, n, { glass: /Alpha/.test(n), mat: /Alpha/.test(n) ? { opacity: 0.35, roughness: 0.2 } : {} }));
    r.mesh.material = mat;
    r.mesh.frustumCulled = false;
  }
  const root = new THREE.Group();
  root.add(body);
  // glasses: the files don't say where on the face they sit (their one joint is the head's frame, the frame itself a
  // little behind its origin): fitted to the eyes here, centred on them, the lenses just in front of the face
  const gh = attach.children.find((c) => c.name === 'glassesHolder');
  if (gh && !o.rigidOffset?.glasses) {
    const eye = out.find((r) => r.slot === 'mEye').mesh;
    const eb = boxOf(eye), gb = boxOf(gh);
    const ec = eb.getCenter(new THREE.Vector3()), gc = gb.getCenter(new THREE.Vector3());
    gh.position.set(ec.x - gc.x, ec.y - gc.y + (o.glassesY ?? -0.25), eb.max.z - gb.min.z + (o.glassesZ ?? -0.35));
    if (o.glassesScale) gh.scale.setScalar(o.glassesScale);
  }
  const rig = rigOf(body);
  // the face: a frame's texture made once, then swapped (NH swaps the eyes' and the mouth's textures the same way)
  const faces = new Map();
  const eyeMesh = out.find((r) => r.slot === 'mEye').mesh, mouthMesh = out.find((r) => r.slot === 'mMouth').mesh;
  const frameMat = (slot, folder, frame) => {
    const k = `${slot}${frame}`;
    if (!faces.has(k)) faces.set(k, faceMat(slot, folder, slot, frame, o));
    return faces.get(k);
  };
  faces.set(`mEye${o.eyeFrame ?? 0}`, Promise.resolve(eyeMesh.material));
  faces.set(`mMouth${o.mouthFrame ?? 0}`, Promise.resolve(mouthMesh.material));
  const setFace = async (eyeFrame = 0, mouthFrame = 0) => {
    eyeMesh.material = await frameMat('mEye', o.eye, eyeFrame);
    mouthMesh.material = await frameMat('mMouth', o.mouth, mouthFrame);
  };
  const eyes = () => boxOf(eyeMesh).getCenter(new THREE.Vector3());
  return { root, body, rig, bones, out, setFace, eyes, outfit: o };
}


/** A world-space box of what's drawn (skinned vertices as posed). */
export function boxOf(obj) {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3();
  obj.traverse((n) => {
    if (!n.isMesh || !n.visible) return;
    const p = n.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      v.fromBufferAttribute(p, i);
      if (n.isSkinnedMesh) n.applyBoneTransform(i, v);
      b.expandByPoint(v.applyMatrix4(n.matrixWorld));
    }
  });
  return b;
}
export { matName };
