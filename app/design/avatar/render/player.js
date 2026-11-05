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
/** Anchors in the head joint's frame (body axes), model units. hat: the head's middle (where hats, wigs and masks
 *  CapHat* hats are modelled from, their brim line; PlayerHair17's own Root sits there too. Hoods, wigs, helmets,
 *  full-face masks are modelled on the head joint itself, as the hair); glasses: fitted to AccessoryGlassCircle0 on the eyes,
 *  then the same for every pair (their files share one frame); face: the same point, for masks (CapMask*) and mouth
 *  accessories (a beard, a pacifier). crown: the top of a bald head, a stand-in for hair ornaments (CapOrnament*),
 *  which the game places per hairstyle and per ornament kind (the files don't say where). */
export const ANCHOR = { crown: [0, 6.3, -0.3], hat: [0, 3.567, -0.281], glasses: [0, 1.85, 3.32], face: [0, 1.85, 3.32] };
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
async function hairMat(name, folder, color, base = 'mHair') {
  const a = await px(folder, `${base}_AlbGry.png`);
  if (!a) return std(name, { color });
  const m = await px(folder, `${base}_Mix.png`, a.width, a.height);
  const op = await px(folder, `${base}_OP.png`, a.width, a.height);
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
  return std(name, { map: texOf(a), normalMap: await nrmTex(folder, base), ...(cut ? { alphaTest: 0.5, side: THREE.DoubleSide } : {}) });
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
  // (a see-through part with no albedo of its own: a visor, a lens)
  if (!a && o.glass) return std(name, { color: 0xbfd4e0, transparent: true, opacity: 0.35, roughness: 0.15, depthWrite: false });
  if (!a) return std(name, { color: 0xff00ff });
  const op = await px(folder, `${base}_OP.png`, a.width, a.height);
  for (let i = 0; i < a.data.length; i += 4) a.data[i + 3] = op ? op.data[i + 1] : 255;
  return std(name, { map: texOf(a), ...(op ? { transparent: !!o.glass, alphaTest: o.glass ? 0.01 : 0.5, side: THREE.DoubleSide, depthWrite: !o.glass } : {}), ...(o.mat ?? {}) });
}

/** A part's materials → their albedo's file base (and whether it's the greyscale, hair-tinted kind), from the Collada's
 *  effects: NH's material names don't always match their textures' (AccessoryGlassBostonBlackHigh_mAccessory samples
 *  mAccessory_Alb; a headphone's mCapHair samples mCap_AlbGry; a beard's mAccessory has only an _AlbGry). */
const TEXBASE = new Map();
async function readAlbedos(folder, file) {
  if (TEXBASE.has(folder)) return;
  const out = new Map();
  try {
    const doc = new DOMParser().parseFromString(await (await fetch(url(folder, file))).text(), 'application/xml');
    const files = new Map([...doc.querySelectorAll('library_images > image')].map((im) => [im.id, im.querySelector('init_from')?.textContent?.trim()]));
    for (const m of doc.querySelectorAll('library_materials > material')) {
      const fx = doc.getElementById(m.querySelector('instance_effect')?.getAttribute('url')?.slice(1) ?? '');
      const p = fx && [...fx.querySelectorAll('newparam')].find((n) => /-diffuse$/.test(n.getAttribute('sid') ?? '') && n.querySelector('surface'));
      const f = files.get(p?.querySelector('init_from')?.textContent?.trim() ?? '') ?? '';
      const r = /^([A-Za-z0-9]+)_Alb(Gry)?(\.0)?\.png$/.exec(f);
      if (r) out.set(m.getAttribute('name') || m.id, { base: r[1], gry: !!r[2] });
    }
  } catch { /* no map: by name */ }
  TEXBASE.set(folder, out);
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
 *  eyes() (the eyes' middle, world), wear(slot, value) (async: swap one part in place) }.
 *  `files`: { '<Folder>.Nin_NX_NVN': [file names] } of what's under `base` (the harness's /src/). */
export async function loadPlayer(o, files, base = '/src/') {
  FILES = files;
  BASE = base;
  return assemble(o);
}
async function assemble(o) {
  // (this player's files: setFace and wear may run after another player was loaded)
  const myFiles = FILES, myBase = BASE;
  const mine = () => { FILES = myFiles; BASE = myBase; };
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
  // the head items' anchor (hats, wigs, masks: their files' origin is the head's middle, not the head joint) and the
  // glasses' (one point for every pair: fitted once to AccessoryGlassCircle0 on the eyes), in the head's frame
  const hatAttach = new THREE.Bone();
  hatAttach.name = 'HatAttach';
  hatAttach.position.fromArray(ANCHOR.hat);
  attach.add(hatAttach);
  bones.set('HatAttach', hatAttach);
  const crownAttach = new THREE.Bone();
  crownAttach.name = 'CrownAttach';
  crownAttach.position.fromArray(ANCHOR.crown);
  attach.add(crownAttach);
  bones.set('CrownAttach', crownAttach);
  const add = async (folder, slot, onHead = false) => {
    if (!folder) return [];
    const f = FILES[F(folder)]?.find((n) => n.endsWith('.dae'));
    if (!f) throw new Error(`${folder}: no .dae`);
    const part = (await dae.loadAsync(url(folder, f))).scene;
    await readAlbedos(folder, f);
    const ms = graft(part, bones, body, ref, onHead ? { Root: `${slot}Root`, Head: 'HeadAttach', $top: 'HeadAttach' } : {});
    for (const m of ms) out.push({ mesh: m, slot, folder });
    return ms;
  };
  // rigid parts (glasses, a hat's hair): their one joint is the head's frame
  const rigid = async (folder, slot) => {
    if (!folder) return;
    const f = FILES[F(folder)].find((n) => n.endsWith('.dae'));
    const part = (await dae.loadAsync(url(folder, f))).scene;
    await readAlbedos(folder, f);
    const ms = [];
    part.traverse((n) => { if (n.isMesh && !HIDE.has(matName(n))) ms.push(n); });
    const holder = new THREE.Group();
    holder.name = `${slot}Holder`;
    attach.add(holder);
    const at = o.rigidOffset?.[slot] ?? (slot === 'hat' ? (/^CapHat/.test(folder) ? ANCHOR.hat : /^CapMask/.test(folder) ? ANCHOR.face : /^CapOrnament/.test(folder) && !/HeadsetDoc/.test(folder) ? ANCHOR.crown : null) : slot === 'face' ? ANCHOR.face : slot === 'glasses' && !o.glassesFit ? ANCHOR.glasses : null);
    if (at) holder.position.fromArray(at);
    for (const m of ms) {
      const g = new THREE.Mesh(m.geometry, m.material);
      g.name = m.name;
      holder.add(g);
      out.push({ mesh: g, slot, folder });
    }
  };
  // a head item (hats, wigs, masks, mouth accessories): skinned on the head if it has joints of its own (a hat's flaps,
  // a wig's strands), else rigid in the head's frame. Placed as the file has it (head space, as the hair).
  const headItem = async (folder, slot) => {
    const f = FILES[F(folder)]?.find((n) => n.endsWith('.dae'));
    if (!f) throw new Error(`${folder}: no .dae`);
    const part = (await dae.loadAsync(url(folder, f))).scene;
    await readAlbedos(folder, f);
    let joints = 0;
    part.traverse((n) => { if (n.isBone) joints++; });
    if (joints > 1) {
      // (skinned ones as their kind's rigid ones: a CapHat on the brim line, the rest on the head joint, as the hair)
      const on = /^CapHat/.test(folder) ? 'HatAttach' : /^CapOrnament/.test(folder) ? 'CrownAttach' : 'HeadAttach';
      const ms = graft(part, bones, body, ref, { Root: `${slot}Root`, Head: on, nw4f_root: on, Mdl_Root: on, $top: on });
      for (const m of ms) out.push({ mesh: m, slot, folder });
    } else await rigid(folder, slot);
  };
  // what each slot wears; wear() swaps one later (the closet's runtime swap: the body and the rest stay)
  const put = async (slot, v) => {
    if (slot === 'hair') return add(o.hat ? (o.hairCap ?? (o.hatHidesHair ? null : o.hair)) : (o.hair ?? o.hairCap), 'hair', true);
    if (slot === 'top') return add(v?.mesh, 'top');
    if (slot === 'bottom') return o.top?.onepiece ? null : add(v?.mesh, 'bottom');
    if (slot === 'shoes') return add(v, 'shoes');
    if (slot === 'glasses') return v && rigid(v, 'glasses');
    if (slot === 'hat' || slot === 'face') return v && headItem(v, slot);
    if (slot === 'bag') return v && add(v, 'bag');
  };
  const SLOTS = ['hair', 'top', 'bottom', 'shoes', 'glasses', 'hat', 'face', 'bag'];
  for (const k of SLOTS) await put(k, o[k]);
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
  const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); once.last = cache.get(k); return once.last; };
  const dress = async (rs) => {
  for (const r of rs) {
    const n = matName(r.mesh);
    let mat;
    once.last = undefined;
    if (r.slot === 'mSkin') mat = await once('skin', () => skinMat('mSkin', o.skin));
    else if (r.slot === 'mSocks') mat = o.socks ? await once(`socks${o.socks}`, () => clothMat('mSocks', o.socks, 'mSocks')) : await once('bare', async () => {
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
        for (let c = 0; c < 3; c++) a.data[i + c] = Math.round(sk[c] * w + b[c] * (1 - w));
        a.data[i + 3] = 255;
      }
      return std('mCheek', { map: texOf(a) });
    });
    else if (r.slot === 'mPaint') mat = await plainMat('mPaint', 'PlayerBody', 'mPaint');
    // (a hairstyle's, a wig's or a hat's skin and hair: tinted as the hair is)
    else if (/HairSkin$/.test(n)) mat = await once(`hairskin${r.folder}:${n}`, () => tintMat(n, r.folder, n, o.skin, true));
    else if (r.slot === 'hair') mat = await once(`hair${r.folder}:${n}`, () => hairMat(n, r.folder, o.hairColor ?? '#3b2a1e'));
    else if (/Hair$/.test(n) && url(r.folder, `${n}_AlbGry.png`)) mat = await once(`${r.folder}:${n}`, () => hairMat(n, r.folder, o.hairColor ?? '#3b2a1e', n));
    else if (r.slot === 'top') mat = await once(`top${o.top.tex}`, () => clothMat('mTops', o.top.tex, 'mTops', o.top.detail ?? 1));
    else if (r.slot === 'bottom') mat = await once(`bottom${o.bottom.tex}`, () => clothMat('mBottoms', o.bottom.tex, 'mBottoms', o.bottom.detail ?? 1));
    else if (r.slot === 'shoes') mat = await once(`shoes${r.folder}`, () => clothMat('mShoes', r.folder, 'mShoes', 0.6));
    else {
      const tb = TEXBASE.get(r.folder)?.get(n), b = tb?.base ?? n.replace(/^.*_(m[A-Z][A-Za-z]*)$/, '$1');
      if (tb?.gry || (!url(r.folder, `${b}_Alb.png`) && url(r.folder, `${b}_AlbGry.png`))) mat = await once(`${r.folder}:${n}`, () => hairMat(n, r.folder, o.hairColor ?? '#3b2a1e', b));
      else if (/Alpha$/.test(n)) mat = await once(`${r.folder}:${n}`, () => plainMat(n, r.folder, b, { glass: true, mat: { opacity: 0.35, roughness: 0.2 } }));
      else if (/^m(Cap|Bag)/.test(b)) mat = await once(`${r.folder}:${n}`, () => clothMat(n, r.folder, b, 0.6));
      else mat = await once(`${r.folder}:${n}`, () => plainMat(n, r.folder, b));
    }
    r.mesh.material = mat;
    r.mat = once.last;
    r.mesh.frustumCulled = false;
  }
  };
  await dress(out);
  const root = new THREE.Group();
  root.add(body);
  // glasses: the files don't say where on the face they sit (their one joint is the head's frame, the frame itself a
  // little behind its origin): fitted to the eyes here, centred on them, the lenses just in front of the face
  const fitGlasses = () => {
  const gh = attach.children.find((c) => c.name === 'glassesHolder');
  if (gh && !o.rigidOffset?.glasses && o.glassesFit) {
    const eye = out.find((r) => r.slot === 'mEye').mesh;
    const eb = boxOf(eye), gb = boxOf(gh);
    const ec = eb.getCenter(new THREE.Vector3()), gc = gb.getCenter(new THREE.Vector3());
    gh.position.set(ec.x - gc.x, ec.y - gc.y + (o.glassesY ?? -0.25), eb.max.z - gb.min.z + (o.glassesZ ?? -0.35));
    if (o.glassesScale) gh.scale.setScalar(o.glassesScale);
  }
  };
  fitGlasses();
  /** Swap one slot (hair | top | bottom | shoes | socks | glasses | hat | face | bag; a top or bottom as
   *  { mesh, tex }) without rebuilding the player: the slot's meshes go, the new part is grafted and dressed. A hat
   *  re-dresses the hair too (its PlayerHairCap, when the outfit names one). Files must already be in `files`. */
  const wear = async (slot, v) => {
    mine();
    o[slot] = v;
    if (slot === 'socks') {
      const r = out.find((x) => x.slot === 'mSocks');
      const old = r.mesh.material;
      for (const [k, v] of cache) if (v === r.mat && k !== 'bare') { cache.delete(k); old.map?.dispose(); old.normalMap?.dispose(); old.dispose(); }
      return dress([r]);
    }
    const slots = slot === 'hat' ? ['hat', 'hair'] : slot === 'top' ? ['top', 'bottom'] : [slot];
    for (const sl of slots) {
      for (const r of out.filter((x) => x.slot === sl)) {
        r.mesh.parent?.remove(r.mesh);
        r.mesh.geometry.dispose();
        for (const [k, v] of cache) if (v === r.mat) cache.delete(k);
        r.mesh.material.map?.dispose(); r.mesh.material.normalMap?.dispose(); r.mesh.material.dispose();
      }
      for (const h of attach.children.filter((c) => c.name === `${sl}Holder`)) attach.remove(h);
      for (let i = out.length - 1; i >= 0; i--) if (out[i].slot === sl) out.splice(i, 1);
      const before = out.length;
      await put(sl, o[sl]);
      await dress(out.slice(before));
    }
    if (slot === 'glasses') fitGlasses();
  };
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
    mine();
    eyeMesh.material = await frameMat('mEye', o.eye, eyeFrame);
    mouthMesh.material = await frameMat('mMouth', o.mouth, mouthFrame);
  };
  const eyes = () => boxOf(eyeMesh).getCenter(new THREE.Vector3());
  return { root, body, rig, bones, out, setFace, eyes, wear, outfit: o };
}


/** A world-space box of what's drawn (skinned vertices as posed). */
export function boxOf(obj) {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3();
  obj.traverse((n) => {
    if (!n.isMesh || !n.visible) return;
    const p = n.geometry.attributes.position, v = new THREE.Vector3();
    // (the skin's matrices as posed now: three updates them only when it draws)
    if (n.isSkinnedMesh) n.skeleton.update();
    for (let i = 0; i < p.count; i += 3) {
      v.fromBufferAttribute(p, i);
      if (n.isSkinnedMesh) n.applyBoneTransform(i, v);
      b.expandByPoint(v.applyMatrix4(n.matrixWorld));
    }
  });
  return b;
}
export { matName };
