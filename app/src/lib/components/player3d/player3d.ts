// NH's human players in 3D (docs/design.md "Players"): a look (contract/look.ts PlayerLook) assembled from the parts
// scripts/players3d-models.ts converts (parts.ts: packed under static/room/player/), given the villagers' life by villager3d.ts
// animateModel with the player's own tuning (tune.ts). The same Villager3D for the scenes: states, actions, faces and
// blinks, seats, a tool in the hand, the eyes for first person.
//   - The body loads once per page; each player clones it. A part's mesh loads once (its colours share it); an item's
//     texture once. Each player's materials are its own (the island bends them; the face changes cells).
//   - Parts bind to the body's skeleton by joint name (their own joints, a skirt's or a ponytail's, grafted on); what's
//     modelled on the head binds to an anchor on the head bone: the head joint (hair), NH's hat brim, the face's front
//     (glasses), the crown (hair ornaments, a stand-in: design/avatar/closet/feasibility.md §3).
//   - Colours are tints: the skin (its texture's alpha says where), the hair, the hair-coloured parts.
//   - dress(look) swaps what changed in place: a colour or a texture is a material's change, a new shape a mesh's.
import {
  Bone, Box3, Color, DoubleSide, Matrix4, MeshLambertMaterial, Quaternion, RepeatWrapping, SRGBColorSpace, Sphere, Texture, Vector3,
  type Material, type Mesh, type MeshStandardMaterial, type Object3D, type SkinnedMesh, type WebGLProgramParametersWithUniforms, type WebGLRenderer
} from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ktx2On, textureFrom } from '../world3d/ktx2.ts';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { lean } from '../world3d/release.ts';
import { WHITE, withMaps } from '../world3d/blank.ts';
import { keepUsed } from '../world3d/keepUsed.ts';
import { animateModel, type Villager3D } from '../villager3d/villager3d.ts';
import { PARTS, bodyFile, covers, faceFile, irisFile, loadParts, meshFile, partBytes, texFile, warmEveryday, type ItemSpec, type PartFile, type PartTable, type TexSpec } from './parts.ts';
import { sharedSkin } from './skin.ts';
import { playerKind } from './tune.ts';
import { hooksOn } from '#lib/ui-state/preview.ts';

import { portrait } from './portrait.ts';
/** @public (the 2D heads' portraits, the closet's tiles) */
export { portrait };
import { DEFAULT_LOOKS, isOnepiece, type PlayerLook } from '#lib/contract/look.ts';
import { glbLoader } from '../world3d/gltf.ts';

/** @public (the すがた preview, the scenes) */
export interface Player3D extends Villager3D {
  /** Wear another look: what changed is swapped in place (a texture, a tint, a mesh); resolves once it's on. */
  dress(look: PlayerLook): Promise<void>;
  /** The look it wears now. */
  look(): PlayerLook;
}

/** Where what's modelled on the head is modelled from, in the head joint's frame (the body's axes), model units. */
const ANCHOR = { head: [0, 0, 0], hat: [0, 3.567, -0.281], face: [0, 1.85, 3.05], crown: [0, 6.3, -0.3] } as const;
type AnchorKind = keyof typeof ANCHOR | 'ornament';
type V3 = readonly [number, number, number];
/** The head's middle, in the head joint's frame (what a side ornament stands out from: hairSpots' rays aim there). */
const HEAD_MIDDLE = new Vector3(0, 3.4, -0.3);
/** A side ornament's own spot on a hairstyle (head frame; `turn` radians; `scale`), over the measured one (parts.json
 *  hair spot): B's low ponytail, the bow at its tie, as signed off (design/avatar/render/outfits/b.json). */
const ORNAMENT_ON: Record<string, { at: V3; turn?: V3; scale?: number }> = {
  PlayerHair12: { at: [0, 0.6, -3.75], turn: [1.45, 0, 0], scale: 0.75 }
};
/** The slots a look's parts go in (each a mesh of its own, or none). */
const SLOTS = ['hair', 'top', 'bottom', 'shoes', 'glasses', 'ornament', 'hat'] as const;
type Slot = (typeof SLOTS)[number];
/** A near-black garment's self-light (a flat charcoal, times the island's lift). */
const DARK_LIFT = 0x2e2e2e;
/** A colour's luma (sRGB, Rec. 709). */
const luma = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
/** The self-light (villager3d's: lit a little by its own colour). */
const LIFT = 0.32;
/** How far past the sphere round its joints at rest (model units) the figure may reach in any pose: its tallest hair
 *  or hat 3.6 over it, its body at most 2.3 in any state or action (a hop's lift moves the sphere with it), with room. */
const REACH = 10;

const loader = glbLoader({ ktx2: true });
/** By their file's key (parts.ts PartFile: `mesh/<key>.glb?v=…`). */
const glbs = new Map<string, Promise<GLTF>>();
const texs = new Map<string, Promise<Texture>>();

function glb(f: PartFile, dir: string): Promise<GLTF> {
  let p = glbs.get(f.key);
  if (!p) {
    p = partBytes(f, dir).then((b) => {
      if (!b) throw new Error(`player: no ${f.key}`);
      return loader.parseAsync(b, '');
    }).then(lean);
    p.catch(() => glbs.delete(f.key));
    glbs.set(f.key, p);
  }
  return p;
}
/** How many of the parts' meshes worn each part's GLB is (by key; the body's is never counted: every player's), and
 *  the ones none wears, the least recently worn first: GLB_KEEP of those stay decoded (back in a look at once, the
 *  closet's way back and forth), the older let go of (geometry, images closed; fetched again if worn again). Before,
 *  every hairstyle, top and hat ever tried on stayed for the page's life (the reviewer's closet run: 377 GLBs). */
const GLB_KEEP = 16;
/** (a part's GLB taken before its load is awaited: an idle one's eviction never frees what a put is about to clone) */
const glbUse = keepUsed<string>(GLB_KEEP, (key) => {
  const p = glbs.get(key);
  glbs.delete(key);
  void p?.then(freeGlb, () => {});
});
const useGlb = glbUse.use, unuseGlb = glbUse.unuse;
/** An evicted part's model let go of: its geometries' GPU copies (and, through skin.ts's WeakMap on them, the remapped
 *  copies), its textures' and their decoded images. */
function freeGlb(g: GLTF) {
  g.scene.traverse((n) => {
    const m = n as Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    for (const mat of ([] as Material[]).concat(m.material)) {
      for (const v of Object.values(mat)) {
        if (!(v instanceof Texture)) continue;
        v.dispose();
        (v.image as { close?: () => void } | null)?.close?.();
      }
      mat.dispose();
    }
  });
}
/** @public (tests) The parts' GLBs kept: in use (worn), and decoded but worn by none. */
export const glbStats = () => ((s) => ({ cached: glbs.size, worn: s.used, idle: s.idle }))(glbUse.stats());
/** A texture (once per file, while some player wears it: `uses`): a KTX2's if it has one (the bundled table's: `k`),
 *  else its WebP (as TextureLoader draws it: flipped, the KTX2 encoded so). */
function tex(f: PartFile, dir: string): Promise<Texture> {
  const url = f.key;
  let p = texs.get(url);
  if (!p) {
    // (the KTX2 kept under its old address: a phone's transcoded copies from before the packs still match)
    const id = `room/player/${url.replace(/\.webp(?=\?|$)/, '.ktx2')}`;
    p = textureFrom(id, { flipY: true, ktx2: f.k ? () => partBytes(f, dir, true) : undefined, webp: () => partBytes(f, dir) }).then((t) => {
      // (NH's uvs run past 0–1, a face patch's below 0: repeated, as the GLBs' own textures are)
      t.wrapS = t.wrapT = RepeatWrapping;
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      cachedAt.set(t, url);
      return t;
    });
    p.catch(() => texs.delete(url));
    texs.set(url, p);
  }
  return p;
}
/** How many players' materials draw each texture (a garment's, a GLB's own, the iris, the bare legs under socks). At
 *  none it's let go of: its GPU copies on every renderer (three's dispose listener holds the renderer that drew it:
 *  a swapped-out top's kept the すがた page's renderer alive) and, a file's, its place in the cache (fetched again if
 *  worn again). */
const uses = new Map<Texture, number>();
const cachedAt = new Map<Texture, string>();
function letGo(t: Texture) {
  const n = (uses.get(t) ?? 1) - 1;
  if (n > 0) return void uses.set(t, n);
  uses.delete(t);
  drop(t);
}
/** A texture no player holds let go of: its GPU copies and, a file's, its place in the cache. */
function drop(t: Texture) {
  t.dispose();
  const u = cachedAt.get(t);
  if (u) {
    cachedAt.delete(t);
    texs.delete(u);
  }
}
/** @public (tests) The textures some player holds (`refs`: the holds), and the files' textures cached. */
export const texStats = () => ({ held: uses.size, refs: [...uses.values()].reduce((a, b) => a + b, 0), cached: texs.size });
// (the leak probe's and the console's: dev builds and ?demo)
if (typeof window !== 'undefined' && hooksOn(new URLSearchParams(location.search)))
  (window as unknown as { __player3d: unknown }).__player3d = { glbs: glbStats, texs: texStats };
/** The textures a material draws: its maps, and those its shader takes from elsewhere (userData: the iris, the bare
 *  legs; world3d/release.ts resourcesOf finds them there too). Not the shared white stand-in (blank.ts): no player's. */
function texturesOf(m: Material, into: Set<Texture>) {
  for (const v of [...Object.values(m), ...Object.values(m.userData ?? {})]) if (v instanceof Texture && v !== WHITE) into.add(v);
}

/** A material whose texture's alpha says where it takes the tint (255 − 127 × the tint's share: never 0, where a
 *  premultiplied decode loses the colour): the skin (the underwear keeps its own colour), the face patches (around
 *  the eyes and mouth), the bare legs; its self-light likewise. */
/** The eye's iris: its mask (the eye atlas's cells: 1 the iris, ~0.5 the pupil) and the eye colour it takes. */
interface Iris { map: { value: Texture | null }; colour: Color }
function maskMaterial(name: string, map: Texture, tint: Color, mask: { value: number }, iris: Iris | null = null): MeshLambertMaterial {
  const m = new MeshLambertMaterial({ name, map, emissive: new Color(0xffffff), emissiveMap: map, emissiveIntensity: LIFT });
  const uTint = { value: tint };
  m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.uniforms.uTint = uTint;
    s.uniforms.uMask = mask;
    // (the eye: its iris takes the eye colour, its pupil darker, by the mask sampled where the atlas is)
    const eye = iris ? `
  float irisV = texture2D( uIris, vMapUv ).r;
  diffuseColor.rgb = mix( diffuseColor.rgb, uEye * irisV * irisV, smoothstep( 0.08, 0.3, irisV ) );` : '';
    if (iris) {
      s.uniforms.uIris = iris.map;
      s.uniforms.uEye = { value: iris.colour };
    }
    s.fragmentShader = `uniform vec3 uTint;\nuniform float uMask;\n${iris ? 'uniform sampler2D uIris;\nuniform vec3 uEye;\n' : ''}${s.fragmentShader}`
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  diffuseColor.rgb *= mix( sampledDiffuseColor.rgb, sampledDiffuseColor.rgb * uTint, clamp( ( 1.0 - sampledDiffuseColor.a ) * 2.0, 0.0, 1.0 ) * uMask );${eye}
#endif`)
      .replace('#include <emissivemap_fragment>', `#ifdef USE_EMISSIVEMAP
  vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
  totalEmissiveRadiance *= mix( emissiveColor.rgb, emissiveColor.rgb * uTint, clamp( ( 1.0 - emissiveColor.a ) * 2.0, 0.0, 1.0 ) * uMask );
#endif`);
  };
  m.customProgramCacheKey = () => (iris ? 'player-mask-iris' : 'player-mask');
  return m;
}
/** A part's material: its texture (or colour), cut out or see-through, tinted (the hair's colour, the skin's). */
function partMaterial(name: string, map: Texture | null, spec: { color?: string; cut?: boolean; glass?: number }, tint: Color | null): MeshLambertMaterial {
  const color = tint ?? new Color(spec.color ?? 0xffffff);
  // (a tinted one glows by its tint: the very same colour, so a new tint changes both)
  const m = new MeshLambertMaterial({
    name, map, color, emissiveMap: map, emissiveIntensity: LIFT,
    ...(spec.cut ? { alphaTest: 0.5, side: DoubleSide } : {}),
    ...(spec.glass !== undefined ? { transparent: true, opacity: spec.glass, depthWrite: false } : {})
  });
  m.emissive = tint ?? (map ? new Color(0xffffff) : color.clone().multiplyScalar(0.5));
  return withMaps(m);
}

/** A part worn: its mesh's key, its GLB's file key (null once let go of: unwear). */
interface Worn { key: string; url: string | null; meshes: SkinnedMesh[]; bones: Bone[]; mats: Material[] }

/**
 * @public (the scenes, the すがた preview)
 * A player standing at its group's origin (its feet), facing +z, in `look`: `dir` the site's room/player/ ($app/paths
 * asset), `seed` its blink's rhythm. A part that can't be had (offline, never fetched) is drawn as the いつもの look's
 * (B's for B, else A's: the everyday pack; wearable). Rejects if the body isn't there (the caller keeps its stand-in).
 */
export async function createPlayer(id: string, look: PlayerLook, dir: string, seed = 0): Promise<Player3D> {
  // (the bundled table when it has every part of the look: the whole one, ~1.1 MB, only for a part it hasn't)
  const table = (l: PlayerLook, t: PartTable) => (covers(l, t) ? Promise.resolve(t) : loadParts(dir));
  const base = DEFAULT_LOOKS[id === 'B' ? 'B' : 'A'];
  warmEveryday(dir);
  const [body, T0] = await Promise.all([glb(bodyFile(), dir), table(look, PARTS)]);
  let T = T0;
  /** The look asked for (look()); `cur` is the one drawn. */
  let asked: PlayerLook = { ...look };
  look = await wearable(look, T, dir, base);
  const model = cloneSkinned(body.scene);
  const bones = new Map<string, Bone>();
  model.traverse((n) => {
    if ((n as Bone).isBone && !bones.has(n.name)) bones.set(n.name, n as Bone);
  });
  const skinned: SkinnedMesh[] = [];
  model.traverse((n) => {
    if ((n as SkinnedMesh).isSkinnedMesh) skinned.push(n as SkinnedMesh);
  });
  const head = bones.get('Head');
  if (!head) throw new Error('player: no head');
  model.updateMatrixWorld(true);
  // the anchors: the head joint with the body's axes (its bone's rest turn undone), and NH's points on it
  const anchors = {} as Record<AnchorKind, Bone>;
  const attach = new Bone();
  attach.name = 'HeadAttach';
  head.add(attach);
  attach.quaternion.copy(head.getWorldQuaternion(new Quaternion()).invert().multiply(model.getWorldQuaternion(new Quaternion())));
  for (const k of [...Object.keys(ANCHOR), 'ornament'] as AnchorKind[]) {
    if (k === 'head') { anchors.head = attach; continue; }
    const b = new Bone();
    b.name = `${k}Attach`;
    if (k !== 'ornament') b.position.fromArray(ANCHOR[k]);
    attach.add(b);
    anchors[k] = b;
  }
  model.updateMatrixWorld(true);
  // its bounds (the rooms' culling, the shadows' too): a sphere round its joints at rest and its reach, the same for
  // every mesh on it, where three's own is a skinned mesh's vertices in the pose of the first frame it's drawn in
  const toModel = new Matrix4().copy(model.matrixWorld).invert(), joints = new Box3(), jv = new Vector3();
  model.traverse((n) => void ((n as Bone).isBone && joints.expandByPoint(jv.setFromMatrixPosition(n.matrixWorld).applyMatrix4(toModel))));
  const ball = joints.getBoundingSphere(new Sphere());
  ball.radius += REACH;
  const bound = (m: SkinnedMesh) => {
    // (in the mesh's own frame: its place on the model)
    m.updateWorldMatrix(true, false);
    m.boundingSphere = ball.clone().applyMatrix4(new Matrix4().copy(model.matrixWorld).invert().multiply(m.matrixWorld).invert());
    m.frustumCulled = true;
  };
  // one skeleton for the body and every part (skin.ts: one bone set a frame, not one a mesh)
  const rigSkin = sharedSkin(model);
  for (const m of skinned) rigSkin.bind(m, m.skeleton.bones);

  let cur: PlayerLook = { ...look };
  const skin = new Color(cur.skin), hair = new Color(cur.hairColor), eyeColour = new Color(cur.eyeColor);
  const socksMask = { value: 1 }, faceMask = { value: 1 };
  const owned: Material[] = [];
  /** The body's own: the skin, the legs (bare: the skin; in socks: their texture), the face patches, the noses. */
  const bodyMat = new Map<string, MeshLambertMaterial>();
  const faceTex: Partial<Record<'mEye' | 'mMouth' | 'mCheek', Texture>> = {};
  /** The cached atlases the face's copies show (their source): held while shown, so a face's sheet no one wears any
   *  more goes (hold), where only the copy was counted and every eye sheet ever tried stayed decoded. */
  const faceBase: Partial<Record<'mEye' | 'mMouth' | 'mCheek', Texture>> = {};
  /** Disposed (dispose()): a dress() queued or under way stops at its next await (GONE), and what it made is swept. */
  let gone = false;
  const GONE = new Error('player: disposed');
  const alive = () => {
    if (gone) throw GONE;
  };
  const faceId = (n: 'mEye' | 'mMouth' | 'mCheek') => (n === 'mEye' ? cur.eye : n === 'mMouth' ? cur.mouth : `cheek${cur.cheek}`);
  const loadFace = async (n: 'mEye' | 'mMouth' | 'mCheek') => {
    const u = faceFile(faceId(n), T);
    if (!u) throw new Error(`player: no face ${faceId(n)}`);
    // (its own copy: the cell is this player's offset)
    const sheet = await tex(u, dir), t = sheet.clone();
    faceBase[n] = sheet;
    t.needsUpdate = true;
    return t;
  };
  for (const n of ['mEye', 'mMouth', 'mCheek'] as const) faceTex[n] = await loadFace(n);
  // the iris mask (its own copy: a texture's uploaded image; sampled at the eye's own cell)
  const irisMap: Iris['map'] = { value: null };
  const loadIris = async () => {
    const u = irisFile(cur.eye, T);
    return u ? tex(u, dir) : null;
  };
  irisMap.value = await loadIris();
  const socksTex = async (): Promise<Texture | null> => {
    const it = cur.socks ? T.items[cur.socks] : null, t = it?.tex.mSocks;
    return t ? tex(texFile(t, T)!, dir) : null;
  };
  let socks = await socksTex();
  for (const m of skinned) {
    const s = m.material as MeshStandardMaterial, n = s.name;
    let mat: MeshLambertMaterial;
    if (n === 'mSkin') mat = maskMaterial(n, s.map!, skin, { value: 1 });
    else if (n === 'mSocks') {
      mat = maskMaterial(n, socks ?? s.map!, skin, socksMask);
      bodyMat.set('bare', mat);
      mat.userData.bare = s.map;
      socksMask.value = socks ? 0 : 1;
    } else if (n === 'mEye' || n === 'mMouth' || n === 'mCheek') {
      mat = maskMaterial(n, faceTex[n]!, skin, faceMask, n === 'mEye' ? { map: irisMap, colour: eyeColour } : null);
      mat.userData = { ...s.userData, ...(n === 'mEye' ? { iris: irisMap.value } : {}) };
    } else mat = partMaterial(n, s.map, {}, null);
    bodyMat.set(n, mat);
    owned.push(mat);
    m.material = mat;
  }
  const noses = () => {
    for (const m of skinned) {
      const k = /^mNose([0-2])$/.exec((m.material as Material).name);
      if (k) m.visible = +k[1] === cur.nose;
    }
  };
  noses();

  // ---- the parts ----
  /** The ornament's anchor: where its hairstyle's measured top (a crown, a wreath, a headband, horns) or left side (a
   *  hairpin, a side bow: L) is, the side ones turned to stand out of the hair; or a style's own spot (ORNAMENT_ON). */
  const placeOrnament = () => {
    const b = anchors.ornament, side = /^CapOrnamentL[A-Z]/.test(cur.ornament ?? '');
    const own = side ? ORNAMENT_ON[cur.hair] : undefined, spot = T.hair[cur.hair]?.spot;
    b.quaternion.identity();
    b.scale.setScalar(own?.scale ?? 1);
    if (own) {
      b.position.fromArray(own.at);
      b.rotation.set(...(own.turn ?? [0, 0, 0]));
    } else if (spot && side) {
      // (a little into the hair, its up along the way out of the head's middle)
      const at = new Vector3(...spot.side), out = at.clone().sub(HEAD_MIDDLE).normalize();
      b.position.copy(at).addScaledVector(out, -0.15);
      b.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), out);
    } else b.position.fromArray(spot ? [spot.top[0], spot.top[1] - 0.15, spot.top[2]] : ANCHOR.crown);
    b.updateMatrixWorld(true);
  };
  placeOrnament();
  const worn = new Map<Slot, Worn>();
  /** What a slot wears in a look: its mesh's key, its item (textures), its anchor. */
  function partOf(slot: Slot, l: PlayerLook): { key: string; item: ItemSpec | null; anchor: AnchorKind | null } | null {
    if (slot === 'hair') {
      const h = T.hair[l.hair];
      if (!h) return null;
      // under a hat: NH's cut-down hair where the style has one, else none
      const key = l.hat ? h.cap : h.mesh;
      return key ? { key, item: null, anchor: 'head' } : null;
    }
    if (slot === 'bottom' && isOnepiece(l.top)) return null;
    const id = l[slot];
    const item = id ? T.items[id] : null;
    if (!item?.mesh) return null;
    const anchor: AnchorKind | null = slot === 'glasses' ? 'face' : slot === 'ornament' ? 'ornament' : slot === 'hat' ? 'hat' : null;
    return { key: item.mesh, item, anchor };
  }
  /** The part's mesh bound to this player's skeleton: its own joints grafted on (under their parent, or the anchor). */
  async function put(slot: Slot, p: { key: string; item: ItemSpec | null; anchor: AnchorKind | null }): Promise<Worn> {
    const f = meshFile(p.key, T);
    if (!f) throw new Error(`player: no mesh ${p.key}`);
    const u = f.key;
    useGlb(u);
    let g: GLTF;
    try {
      g = await glb(f, dir);
      alive();
    } catch (e) {
      unuseGlb(u);
      throw e;
    }
    const part = cloneSkinned(g.scene);
    part.updateMatrixWorld(true);
    const ms: SkinnedMesh[] = [];
    part.traverse((n) => {
      if ((n as SkinnedMesh).isSkinnedMesh) ms.push(n as SkinnedMesh);
    });
    const on = p.anchor ? anchors[p.anchor] : null;
    const nm = (n: string) => (on ? (n === 'Root' ? `${slot}Root` : n === 'Head' ? on.name : n) : n);
    const added: Bone[] = [];
    const lookup = (n: string) => (on && n === on.name ? on : bones.get(n));
    for (const m of ms) {
      // the part's joints the body lacks, with their ancestors, root first
      const own: Bone[] = [];
      const want = (b: Object3D | null) => {
        if (!b || !(b as Bone).isBone || own.includes(b as Bone) || lookup(nm(b.name))) return;
        want(b.parent);
        own.push(b as Bone);
      };
      m.skeleton.bones.forEach(want);
      for (const b of own) {
        const parent = (b.parent as Bone)?.isBone ? lookup(nm(b.parent!.name)) : on;
        if (!parent) throw new Error(`player: ${p.key}'s joint ${b.name} has no place`);
        const c = new Bone();
        c.name = nm(b.name);
        c.position.copy(b.position);
        c.quaternion.copy(b.quaternion);
        c.scale.copy(b.scale);
        parent.add(c);
        rigSkin.graft(c);
        bones.set(c.name, c);
        added.push(c);
      }
      const to = m.skeleton.bones.map((b) => lookup(nm(b.name))!);
      model.add(m);
      m.updateMatrixWorld(true);
      rigSkin.bind(m, to);
      bound(m);
    }
    const w: Worn = { key: p.key, url: u, meshes: ms, bones: added, mats: [] };
    try {
      await dressPart(slot, w, p.item);
    } catch (e) {
      // (gone mid-way: its meshes and materials swept with the rest)
      if (e === GONE) dressing.add(w);
      else unwear(w);
      throw e;
    }
    return w;
  }
  /** A worn part's materials: its item's textures (a hairstyle's own, tinted). */
  async function dressPart(slot: Slot, w: Worn, item: ItemSpec | null) {
    for (const m of w.mats) disposeMat(m);
    w.mats = [];
    for (const m of w.meshes) {
      const s = m.material as MeshStandardMaterial, n = s.name;
      let mat: MeshLambertMaterial;
      if (!item) {
        // a hairstyle: its greyscale texture in its mesh, tinted (its skin parts with the skin's)
        const t = (s.userData?.tint as 'hair' | 'skin' | undefined) ?? (/HairSkin$/.test(n) ? 'skin' : 'hair');
        mat = partMaterial(n, s.map, {}, t === 'skin' ? skin : hair);
      } else {
        const spec: TexSpec = item.tex[n] ?? Object.values(item.tex)[0] ?? {};
        const map = spec.file ? await tex(texFile(spec, T)!, dir) : null;
        if (gone) {
          // (fetched for a player since disposed: none holds it)
          if (map && !uses.has(map)) drop(map);
          throw GONE;
        }
        mat = partMaterial(n, map, spec, spec.tint === 'hair' ? hair : spec.tint === 'skin' ? skin : null);
        // a near-black garment (B's polo and long skirt): its self-light a flat charcoal, not its texture's (black: no
        // light of its own at all, a black hole on a phone's island at dusk; NH's blacks read as charcoal)
        if (map && !spec.tint && item.sw && luma(item.sw) < 0.12) {
          mat.emissiveMap = WHITE;
          mat.emissive = new Color(DARK_LIFT);
        }
      }
      if (m.material !== mat && !w.mats.includes(m.material as Material)) (m.material as Material).dispose?.();
      m.material = mat;
      w.mats.push(mat);
      owned.push(mat);
    }
    void slot;
  }
  function disposeMat(m: Material) {
    const i = owned.indexOf(m);
    if (i >= 0) owned.splice(i, 1);
    m.dispose();
  }
  /** A part's GLB no longer worn by it (once). */
  function unwear(w: Worn) {
    if (w.url) unuseGlb(w.url);
    w.url = null;
  }
  /** Parts put while dispose() ran (not yet worn): swept with the rest. */
  const dressing = new Set<Worn>();
  function remove(slot: Slot) {
    const w = worn.get(slot);
    if (!w) return;
    for (const m of w.meshes) {
      m.removeFromParent();
      rigSkin.drop(m);
    }
    for (const m of w.mats) disposeMat(m);
    unwear(w);
    worn.delete(slot);
    // its own joints go, but those another part binds to too (a top's hem joints under a long skirt's): theirs now
    for (const b of w.bones.reverse()) {
      const other = [...worn.values()].find((o) => o.meshes.some((m) => rigSkin.uses(m).includes(b)));
      if (other) {
        other.bones.unshift(b);
        continue;
      }
      b.removeFromParent();
      if (bones.get(b.name) === b) bones.delete(b.name);
    }
  }
  try {
    for (const slot of SLOTS) {
      const p = partOf(slot, cur);
      if (p) worn.set(slot, await put(slot, p));
    }
  } catch (e) {
    // (a part missing: those put let go of, as the caller keeps its stand-in)
    for (const w of worn.values()) unwear(w);
    throw e;
  }

  /** The textures this player's materials draw, each counted once in `uses` (taken stock of once it's dressed: what
   *  a swap left behind goes then, what it kept is never let go of in between). */
  let held = new Set<Texture>();
  const hold = () => {
    if (gone) return;
    const now = new Set<Texture>();
    for (const m of owned) texturesOf(m, now);
    for (const t of Object.values(faceBase)) if (t) now.add(t);
    for (const t of now) if (!held.has(t)) uses.set(t, (uses.get(t) ?? 0) + 1);
    for (const t of held) if (!now.has(t)) letGo(t);
    held = now;
  };
  hold();
  const allSkinned = () => [...skinned, ...[...worn.values()].flatMap((w) => w.meshes)];
  const kind = playerKind(model, cur.mouthFrame);
  const v = animateModel(id, model, seed, kind);
  // (animateModel draws every mesh unculled, a villager's bounds unknown: a player's are)
  for (const m of allSkinned()) bound(m);
  const tints = () => {
    skin.set(cur.skin);
    hair.set(cur.hairColor);
    eyeColour.set(cur.eyeColor);
  };
  let busy: Promise<void> = Promise.resolve(), asks = 0;
  const dress = async (want: PlayerLook) => {
    alive();
    asked = { ...want };
    T = await table(want, T);
    const next = await wearable(want, T, dir, base);
    alive();
    const prev = cur;
    cur = { ...next };
    tints();
    noses();
    for (const n of ['mEye', 'mMouth', 'mCheek'] as const) {
      const was = n === 'mEye' ? prev.eye : n === 'mMouth' ? prev.mouth : `cheek${prev.cheek}`;
      if (was === faceId(n)) continue;
      // (the image swapped under the same texture: the cell it shows, its offset, is the face's)
      const u = faceFile(faceId(n), T);
      if (!u) continue;
      const sheet = await tex(u, dir);
      if (gone) {
        if (!uses.has(sheet)) drop(sheet);
        throw GONE;
      }
      const src = sheet.source, t = faceTex[n]!;
      faceBase[n] = sheet;
      // (its GPU copy let go of first, three's by its image: another size of image needs a new one; disposed after the
      // swap it let go of the new image's, another player's face if it wore that one, and orphaned its own)
      t.dispose();
      t.source = src;
      t.needsUpdate = true;
    }
    if (prev.eye !== cur.eye) {
      const iris = await loadIris();
      if (gone && iris && !uses.has(iris)) drop(iris);
      alive();
      bodyMat.get('mEye')!.userData.iris = irisMap.value = iris;
    }
    if (prev.socks !== cur.socks) {
      const s = await socksTex();
      if (gone && s && !uses.has(s)) drop(s);
      alive();
      socks = s;
      const mat = bodyMat.get('mSocks')!;
      mat.map = socks ?? (mat.userData.bare as Texture);
      mat.emissiveMap = mat.map;
      socksMask.value = socks ? 0 : 1;
    }
    if (prev.hair !== cur.hair || prev.ornament !== cur.ornament) placeOrnament();
    let skeletal = false;
    for (const slot of SLOTS) {
      const a = partOf(slot, prev), b = partOf(slot, cur), w = worn.get(slot);
      if (a?.key === b?.key && w) {
        // the same mesh: another colour's textures (or the same)
        if (b?.item && cur[slot as Exclude<Slot, 'hair'>] !== prev[slot as Exclude<Slot, 'hair'>]) await dressPart(slot, w, b.item);
        continue;
      }
      remove(slot);
      if (b) worn.set(slot, await put(slot, b));
      skeletal = true;
    }
    if (skeletal) {
      rigSkin.compact(allSkinned());
      kind.rebind();
    }
    // (the resting mouth: the face's next frame)
    restMouth.value = cur.mouthFrame;
    hold();
  };
  const restMouth = { value: cur.mouthFrame };
  const baseCell = kind.cell!;
  kind.cell = (part, i, face) => (part === 'mouth' && i === 0 && face !== 'sleepy' ? restMouth.value : baseCell(part, i, face));
  const dispose = v.dispose;
  /** What a dress() under way made after dispose(): its materials, the textures only they drew, its parts' meshes and
   *  their GLBs' counts. */
  const sweep = () => {
    const ts = new Set<Texture>();
    for (const m of owned) {
      texturesOf(m, ts);
      m.dispose();
    }
    owned.length = 0;
    for (const t of Object.values(faceBase)) if (t) ts.add(t);
    for (const t of ts) if (!uses.has(t)) drop(t);
    for (const w of [...worn.values(), ...dressing]) unwear(w);
    rigSkin.dispose([...allSkinned(), ...[...dressing].flatMap((w) => w.meshes)]);
    dressing.clear();
  };
  return Object.assign(v, {
    dress(next: PlayerLook) {
      // latest wins: one asked for while another is under way waits for it, and is skipped if a newer one is asked for
      // meanwhile (its promise the newer's): colours tapped quickly in すがた built every look in between, each in full
      // (a failed one, a part missing, doesn't stop the next)
      const n = ++asks;
      const run = busy.catch(() => {}).then(() => (n === asks ? dress(next).catch((e: unknown) => {
        if (e !== GONE) throw e;
        sweep();
      }) : undefined));
      busy = run;
      return run.then(() => (n === asks ? undefined : busy));
    },
    look: () => ({ ...asked }),
    dispose() {
      if (gone) return;
      gone = true;
      dispose();
      // (every texture it drew let go of on every renderer, though another player still wears it: that one's renderer
      // uploads it again, where kept it held this one's renderer, the room's or the すがた page's, alive)
      for (const t of held) {
        t.dispose();
        letGo(t);
      }
      held.clear();
      rigSkin.dispose(allSkinned());
      for (const m of owned) m.dispose();
      for (const t of Object.values(faceTex)) t?.dispose();
      for (const w of worn.values()) unwear(w);
    }
  }) as Player3D;
}

/** The files a look needs (what a phone fetches to draw it: the everyday pack's, else each a slice of its pack), by
 *  `t` (the bundled first closet's table, or loadParts' whole one), by slot (`body`, `eye`, …, a slot it doesn't wear
 *  none); null for a slot whose part `t` hasn't. */
export function partFiles(look: PlayerLook, t: PartTable = PARTS): Record<string, PartFile[] | null> {
  const out: Record<string, PartFile[] | null> = {};
  const all = (fs: (PartFile | null)[]) => (fs.every(Boolean) ? (fs as PartFile[]) : null);
  out.body = [bodyFile(t)];
  out.eye = all([faceFile(look.eye, t), ...(t.face[look.eye]?.iris ? [irisFile(look.eye, t)] : [])]);
  out.mouth = all([faceFile(look.mouth, t)]);
  out.cheek = all([faceFile(`cheek${look.cheek}`, t)]);
  const h = t.hair[look.hair];
  out.hair = h ? all([look.hat && h.cap ? meshFile(h.cap, t) : meshFile(h.mesh, t)]) : null;
  for (const k of ['top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament', 'hat'] as const) {
    const id = look[k];
    if (!id || (k === 'bottom' && isOnepiece(look.top))) continue;
    const it = t.items[id];
    out[k] = it ? all([...(it.mesh ? [meshFile(it.mesh, t)] : []), ...Object.values(it.tex).filter((x) => x.file).map((x) => texFile(x, t))]) : null;
  }
  return out;
}

/** `look` as it can be drawn now: each part whose files can't all be had (offline and never fetched; or `t` hasn't
 *  it) the いつもの look's (`base`, the everyday pack's); a one-piece's stand-in that isn't one brings `base`'s bottoms.
 *  Fetches what it checks (the store holds it for the load after: each a slice, or its pack). */
export async function wearable(look: PlayerLook, t: PartTable, dir: string, base: PlayerLook): Promise<PlayerLook> {
  // (a texture's KTX2 where it's drawn from it, else its WebP; either will do)
  const one = async (f: PartFile) => (f.k && ktx2On() && (await partBytes(f, dir, true))) || (await partBytes(f, dir));
  const have = async (fs: PartFile[] | null) => !!fs && (await Promise.all(fs.map(one))).every(Boolean);
  const items = ['top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament', 'hat'] as const;
  const out: PlayerLook = { ...look };
  const files = partFiles(look, t);
  const ok = await Promise.all(items.map((k) => (k in files ? have(files[k]) : Promise.resolve(true))));
  items.forEach((k, i) => {
    if (!ok[i]) out[k] = base[k] ?? null;
  });
  if (!ok[0] && !isOnepiece(out.top) && !out.bottom) out.bottom = base.bottom;
  const head = partFiles(out, t);
  const [eye, mouth, cheek, hair, bottom] = await Promise.all([have(head.eye), have(head.mouth), have(head.cheek), have(head.hair), 'bottom' in head && out.bottom !== look.bottom ? have(head.bottom) : Promise.resolve(true)]);
  if (!eye) out.eye = base.eye;
  if (!mouth) out.mouth = base.mouth;
  if (!cheek) out.cheek = base.cheek;
  if (!hair) out.hair = base.hair;
  if (!bottom) out.bottom = base.bottom;
  return out;
}

/** The portraits' own player (a scene's on screen stays as it is): made on the first shot, dressed in each look in
 *  turn, its head drawn through `renderer` (player3d portrait: a render target, never another context) as a PNG data
 *  URL (null: `gone()` by then). One shot at a time is the caller's (a queue). */
export type Shooter = ReturnType<typeof createShooter>;
export function createShooter(name: string, dir: string) {
  let made: Promise<Player3D> | null = null;
  return {
    async shoot(renderer: WebGLRenderer, look: PlayerLook, px: number, gone: () => boolean): Promise<string | null> {
      made ??= createPlayer(name, look, dir, 0).then((p) => (p.step(0), p.step(1000), p));
      const p = await made;
      await p.dress(look);
      p.face(null);
      p.step(2000);
      return gone() ? null : portrait(renderer, p, px, null).toDataURL('image/png');
    },
    /** Its player let go of (made again on the next shot). */
    dispose() {
      const p = made;
      made = null;
      void p?.then((v) => v.dispose(), () => {});
    }
  };
}
