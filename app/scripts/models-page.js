// @ts-nocheck -- a plain browser module (three.js from the page's import map), not part of the app's build.
// The browser half of scripts/models.ts (docs/design.md "Official art: the 3D renders"): loaded in the installed
// Chrome by Playwright, it renders NH's Collada models with three.js to transparent PNGs. One call renders a set of
// looks of one thing (a tree's four seasons, a building's day / winter / lit) with one camera and one crop, so every
// look of a key lays over the others pixel for pixel and shares one anchor.
//
// Materials are rebuilt from the model folder's textures, NH's way as far as the files tell:
//   _Alb (sRGB albedo) or _AlbGry (gray) × the material's _Grd gradient (its row = the time of year, its column the
//   gray value: NH's seasonal tint of leaves, trunks and flowers); _Nrm two-channel (BC5, z rebuilt); _Mix (R metal,
//   G roughness, B ambient occlusion); _Emi emissive (weighted per material for the lit pass); _OP opacity (glass is
//   blended, leaves and ropes are cut out); mWinterSnow: the snow meshes (white, the shared snow normal map).
// Lighting: a soft sky/ground hemisphere, a warm key from the upper left with soft shadows, a cool fill; no tone map.
// Outputs per look: day, winter (its snow meshes on), lit (emissive only, black keyed out, a soft halo), trunk and
// canopy (the day image split by a leaves-only mask pass, so a villager can stand between them).
import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';

THREE.ShaderChunk.normal_fragment_maps = THREE.ShaderChunk.normal_fragment_maps.replace(
  'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
  'vec2 nxy = texture2D( normalMap, vNormalMapUv ).xy * 2.0 - 1.0; vec3 mapN = vec3( nxy, sqrt( max( 0.0, 1.0 - dot( nxy, nxy ) ) ) );'
);
THREE.ShaderChunk.aomap_fragment = THREE.ShaderChunk.aomap_fragment.replace(/texture2D\( aoMap, vAoMapUv \)\.r/, 'texture2D( aoMap, vAoMapUv ).b');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
const cache = new Map();
function tex(url, srgb, lut = false) {
  const k = `${url}|${srgb}|${lut}`;
  if (!cache.has(k)) {
    cache.set(k, loader.loadAsync(url).then((t) => {
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.wrapS = t.wrapT = lut ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      if (lut) { t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; }
      t.anisotropy = 8;
      return t;
    }).catch(() => null));
  }
  return cache.get(k);
}

/** Never drawn: collision, placeholders, the shadow cards NH lays under trees. */
const HIDE = new Set(['mSoftMesh', 'mDummy', 'mShadow', 'mShadowShake', 'mChimneyhole']);
/** What belongs to a tree's canopy layer (its leaves, blossoms, the snow on them), not its trunk. */
const canopyMat = (n) => /Leaf|Bloom|Back|Sakura|Flow|Petal|Snow|Frond/.test(n) && !/Trunk/.test(n);

/** The gradient for a gray material: <name>Color_Grd, else the one of its part (trunk, flowers, leaves). */
function grdFor(name, all) {
  const base = name.replace(/^m/, '');
  const exact = all.find((x) => x.split('/').pop().replace(/^m/, '').startsWith(`${base}Color_Grd`));
  if (exact) return exact;
  if (/Trunk/.test(name)) return all.find((x) => /TrunkColor_Grd/.test(x));
  if (/Flow|Petal/.test(name)) return all.find((x) => /(Flow|Petal)Color_Grd/.test(x));
  return all.find((x) => !/TrunkColor|FlowColor|PetalColor/.test(x)) ?? null;
}

async function materialsFor(name, files, o) {
  const find = (suffix) => {
    for (const [folder, list] of files) if (list.includes(`${name}_${suffix}.png`)) return `/src/${folder}/${name}_${suffix}.png`;
    return null;
  };
  const all = files.flatMap(([f, l]) => l.filter((x) => x.endsWith('_Grd.png')).map((x) => `/src/${f}/${x}`));
  const gray = !find('Alb') && !!find('AlbGry');
  // a gray albedo is tinted by its gradient; a material with no albedo at all (a painted fence) is the gradient's colour
  const grdFile = gray || (!find('Alb') && !find('AlbGry')) ? grdFor(name, all) : null;
  const snowMat = name === 'mWinterSnow';
  // the snow's shared _Alb / _Mix are flat placeholders (gray, metal .6, no AO): snow is white, rough, unoccluded
  const albU = snowMat ? null : find('Alb') || find('AlbGry');
  const [alb, nrm, mix, emi, op, grd] = await Promise.all([
    albU && tex(albU, !grdFile), find('Nrm') && tex(find('Nrm'), false), !snowMat && find('Mix') && tex(find('Mix'), false),
    find('Emi') && tex(find('Emi'), true), find('OP') && tex(find('OP'), false), grdFile && tex(grdFile, true, true)
  ]);
  const snow = name === 'mWinterSnow';
  const glass = /Glass|Window/.test(name);
  const cut = !!op && !glass;
  const snowNrm = files.flatMap(([f, l]) => l.filter((x) => /WinterSnow\w*_Nrm\.png$/.test(x)).map((x) => `/src/${f}/${x}`))[0];
  const std = new THREE.MeshStandardMaterial({
    name,
    color: snow ? 0xf6f9ff : alb ? 0xffffff : 0xcfd8e0,
    map: alb || null,
    normalMap: nrm || (snow && snowNrm ? await tex(snowNrm, false) : null),
    normalScale: new THREE.Vector2(o.nrm, o.nrm),
    aoMap: mix || null,
    aoMapIntensity: o.aoI,
    roughness: snow ? 0.95 : 1,
    roughnessMap: !snow && mix ? mix : null,
    metalness: 0,
    alphaTest: cut ? 0.45 : alb && !op ? 0.5 : 0,
    transparent: !!op && !cut,
    alphaMap: op || null,
    side: THREE.DoubleSide
  });
  if (op && !cut) std.depthWrite = false;
  if (grd) {
    const row = Object.entries(o.grdRows ?? {}).find(([re]) => new RegExp(re).test(name))?.[1] ?? o.grdRow;
    const u = { grdMap: { value: grd }, grdV: { value: 1 - row }, grdU: { value: new THREE.Vector2(...(o.grdBlock ?? [0, 1])) } };
    std.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, u);
      s.fragmentShader = s.fragmentShader
        .replace('void main() {', 'uniform sampler2D grdMap; uniform float grdV; uniform vec2 grdU;\nvoid main() {')
        .replace('#include <map_fragment>', `#ifdef USE_MAP
          vec4 g0 = texture2D( map, vMapUv );
          diffuseColor.rgb *= texture2D( grdMap, vec2( grdU.x + clamp( g0.r, 0.01, 0.99 ) * grdU.y, grdV ) ).rgb;
        #else
          diffuseColor.rgb *= texture2D( grdMap, vec2( 0.5, grdV ) ).rgb;
        #endif`);
    };
    std.customProgramCacheKey = () => `grd-${name}`;
  }
  if (name === 'mMyDesign') std.color.set(0x7cc576);
  else if (grd && !alb) std.color.set(0xffffff);
  else if (!alb && !snow) { std.transparent = true; std.opacity = 0.55; std.color.set(0x6f8fa8); }
  const w = o.emiW?.[name] ?? o.emiDefault ?? 1;
  const black = { color: 0x000000, side: THREE.DoubleSide, alphaTest: cut || (alb && !op) ? 0.45 : 0, alphaMap: cut ? op : null, map: alb && !op ? alb : null };
  const lit = emi && w > 0
    ? new THREE.MeshBasicMaterial({ map: emi, color: new THREE.Color(o.litColor ?? 0xffe2a8).multiplyScalar(w), side: THREE.DoubleSide, alphaMap: op || null, alphaTest: cut ? 0.45 : 0 })
    : new THREE.MeshBasicMaterial(black);
  const mask = canopyMat(name)
    ? new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, alphaMap: op || null, alphaTest: op || alb ? 0.45 : 0, map: !op && alb ? alb : null })
    : new THREE.MeshBasicMaterial({ ...black, colorWrite: false });
  return { std, lit, mask };
}

const dae = new ColladaLoader();

async function loadLook(look, o) {
  const group = new THREE.Group();
  let door = null;
  for (const p of look.parts) {
    const c = await dae.loadAsync(`/src/${p.folder}/${p.dae}`);
    group.add(c.scene);
    c.scene.traverse((n) => {
      if (n.name === 'DoorModel0' && !door) { n.updateWorldMatrix(true, false); door = new THREE.Vector3().setFromMatrixPosition(n.matrixWorld); }
    });
  }
  if (o.rotY) group.rotation.y = THREE.MathUtils.degToRad(o.rotY);
  group.updateMatrixWorld(true);
  const meshes = [];
  group.traverse((n) => { if (n.isMesh) meshes.push(n); });
  const mats = new Map();
  let tris = 0;
  const lo = { ...o, ...look };
  for (const m of meshes) {
    const name = (Array.isArray(m.material) ? m.material[0] : m.material).name || (m.name || m.parent?.name || '').split('__').pop();
    if (!mats.has(name)) mats.set(name, await materialsFor(name, look.files, lo));
    m.userData.mat = name;
    m.castShadow = m.receiveShadow = true;
    m.frustumCulled = false;
    const g = m.geometry;
    if (g.attributes.uv && !g.attributes.uv1) g.setAttribute('uv1', g.attributes.uv);
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  }
  const hidden = (m) => HIDE.has(m.userData.mat) || (lo.hide || []).some((h) => m.name.includes(h) || m.userData.mat === h);
  const set = (v) => {
    for (const m of meshes) {
      const name = m.userData.mat, M = mats.get(name), snow = name === 'mWinterSnow';
      m.visible = !hidden(m) && (v === 'winter' || !snow || !!lo.snowAlways) && !(v === 'lit' && snow);
      m.material = v === 'lit' ? M.lit : v === 'mask' ? M.mask : M.std;
    }
  };
  return { group, door, meshes, set, tris: Math.round(tris), mats: [...mats.keys()] };
}

/** o: { looks: [{ name, parts: [{folder, dae}], files, outputs: [day|winter|lit|trunk|canopy], grdRow?, grdBlock?,
 *  snowAlways?, hide? }], pitch, yaw?, rotY?, ppu, nrm, aoI, light?, emiW?, halo?, anchor: 'door'|'origin' } */
window.renderSet = async (o) => {
  const t0 = performance.now();
  const scene = new THREE.Scene();
  const looks = [];
  for (const l of o.looks) looks.push({ ...l, ...(await loadLook(l, o)) });
  for (const l of looks) scene.add(l.group);
  const tLoad = performance.now() - t0;
  const box = new THREE.Box3();
  for (const l of looks) {
    l.set(l.outputs.includes('winter') ? 'winter' : 'day');
    for (const m of l.meshes) if (m.visible) box.expandByObject(m, true);
  }
  const centre = box.getCenter(new THREE.Vector3()), R = box.getSize(new THREE.Vector3()).length();
  const pitch = THREE.MathUtils.degToRad(o.pitch), yaw = THREE.MathUtils.degToRad(o.yaw || 0);
  const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, R * 4);
  if (o.pitch >= 89.9) cam.up.set(0, 0, -1);
  cam.position.copy(centre).addScaledVector(dir, R * 2);
  cam.lookAt(centre);
  cam.updateMatrixWorld(true);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(cam.matrixWorldInverse);
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  Object.assign(cam, { left: x0 - 2, right: x1 + 2, top: y1 + 2, bottom: y0 - 2 });
  cam.updateProjectionMatrix();
  // px per model unit: fixed, or what makes the image targetH px tall
  const ppu = o.targetH ? o.targetH / (cam.top - cam.bottom) : o.ppu;
  const W = Math.round((cam.right - cam.left) * ppu), H = Math.round((cam.top - cam.bottom) * ppu);
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);

  const L = o.light || {};
  const hemi = new THREE.HemisphereLight(0xeef4ff, 0xb8a888, L.hemi ?? 2.2);
  const key = new THREE.DirectionalLight(0xfff0d8, L.key ?? 2.6);
  key.position.copy(centre).add(new THREE.Vector3(-0.55, 0.9, 0.75).normalize().multiplyScalar(R * 2));
  key.target.position.copy(centre);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 0.1, far: R * 5 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.05;
  key.shadow.radius = 3;
  const fill = new THREE.DirectionalLight(0xdfe8ff, L.fill ?? 0.7);
  fill.position.copy(centre).add(new THREE.Vector3(0.8, 0.3, 0.4).multiplyScalar(R));
  const amb = new THREE.AmbientLight(0xffffff, L.amb ?? 0.6);
  scene.add(hemi, key, key.target, fill, amb);

  const raw = {};
  const tR = performance.now();
  for (const l of looks) {
    const passes = [...new Set(l.outputs.flatMap((v) => (v === 'trunk' || v === 'canopy' ? ['day', 'mask'] : [v])))];
    for (const v of passes) {
      for (const k of looks) k.group.visible = k === l;
      l.set(v);
      hemi.visible = key.visible = fill.visible = amb.visible = v !== 'lit' && v !== 'mask';
      renderer.render(scene, cam);
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      c.getContext('2d').drawImage(renderer.domElement, 0, 0);
      raw[`${l.name}|${v}`] = c;
    }
  }
  const tRender = performance.now() - tR;
  let bx0 = W, by0 = H, bx1 = -1, by1 = -1;
  for (const [k, c] of Object.entries(raw)) {
    if (!/\|(day|winter)$/.test(k)) continue;
    const d = c.getContext('2d').getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) {
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
    }
  }
  const cw = bx1 - bx0 + 1, ch = by1 - by0 + 1;
  if (o.targetH && Math.abs(ch - o.targetH) > 1) {
    // the box held more than shows (a hidden card, a cut-out's empty margin): again at the scale that makes it targetH
    for (const l of looks) l.group.traverse((n) => { if (n.isMesh) n.geometry.dispose(); });
    return window.renderSet({ ...o, targetH: undefined, ppu: (ppu * o.targetH) / ch });
  }
  const px = (c) => c.getContext('2d').getImageData(bx0, by0, cw, ch);
  const canvas = (img) => {
    const k = document.createElement('canvas');
    k.width = cw; k.height = ch;
    k.getContext('2d').putImageData(img, 0, 0);
    return k;
  };
  const images = {}, opaque = {};
  for (const l of looks) for (const v of l.outputs) {
    const id = `${l.name}|${v}`;
    if (v === 'lit') {
      const s = px(raw[id]), d = s.data;
      for (let i = 0; i < d.length; i += 4) {
        const a = Math.max(d[i], d[i + 1], d[i + 2]);
        if (a < 10) { d[i + 3] = 0; continue; }
        for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, (d[i + c] * 255) / a);
        d[i + 3] = a;
      }
      const t = canvas(s);
      const k = document.createElement('canvas');
      k.width = cw; k.height = ch;
      const g = k.getContext('2d');
      g.filter = `blur(${Math.max(1, Math.round(ppu * (o.halo ?? 0.9)))}px)`;
      g.globalAlpha = 0.8;
      g.drawImage(t, 0, 0);
      g.filter = 'none';
      g.globalAlpha = 1;
      g.drawImage(t, 0, 0);
      images[id] = k.toDataURL('image/png');
    } else if (v === 'trunk' || v === 'canopy') {
      const s = px(raw[`${l.name}|day`]), m = px(raw[`${l.name}|mask`]).data, d = s.data;
      for (let i = 0; i < d.length; i += 4) {
        const leaf = m[i + 3] > 0 ? m[i] / 255 : 0;
        d[i + 3] = Math.round(d[i + 3] * (v === 'canopy' ? leaf : 1 - leaf));
      }
      // the layer's opaque box (fractions of the image): the scene clips the layer's box to it, so the clear part of
      // the canopy's image doesn't stand in front of whoever is under it (a hit test, a tap)
      let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 32) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      opaque[id] = [y0 / ch, 1 - (x1 + 1) / cw, 1 - (y1 + 1) / ch, x0 / cw];
      images[id] = canvas(s).toDataURL('image/png');
    } else images[id] = canvas(px(raw[id])).toDataURL('image/png');
  }
  const first = looks[0];
  const at = o.anchor === 'door' && first.door ? first.door.clone() : new THREE.Vector3(0, 0, 0).applyMatrix4(first.group.matrixWorld);
  at.y = box.min.y;
  const ndc = at.project(cam);
  const res = {
    images, opaque, w: cw, h: ch, anchor: [((ndc.x + 1) / 2) * W - bx0, ((1 - ndc.y) / 2) * H - by0],
    units: [cw / ppu, ch / ppu], box: [box.min.toArray(), box.max.toArray()], tris: looks.map((l) => l.tris), mats: looks.map((l) => l.mats),
    ms: { load: Math.round(tLoad), render: Math.round(tRender), total: Math.round(performance.now() - t0) }
  };
  for (const l of looks) l.group.traverse((n) => { if (n.isMesh) n.geometry.dispose(); });
  return res;
};
window.ready = true;
