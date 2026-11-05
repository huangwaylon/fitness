// NH's human players in 3D (docs/design.md "Players"): a look (contract/look.ts PlayerLook) assembled from the parts
// scripts/players3d-models.ts converts (parts.ts: static/room/player/…), given the villagers' life by villager3d.ts
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
  Bone, Color, DoubleSide, MeshLambertMaterial, Quaternion, RepeatWrapping, SRGBColorSpace, Skeleton, Texture, TextureLoader,
  type Material, type Mesh, type MeshStandardMaterial, type Object3D, type SkinnedMesh, type WebGLProgramParametersWithUniforms
} from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { lean } from '../world3d/release.ts';
import { animateModel, type Villager3D } from '../villager3d/villager3d.ts';
import { PARTS, bodyUrl, faceUrl, loadParts, meshUrl, texUrl, type ItemSpec, type PartTable, type TexSpec } from './parts.ts';
import { playerKind } from './tune.ts';

/** @public (the 2D heads' portraits, the closet's tiles) */
export { portrait } from './portrait.ts';
import { isOnepiece, type PlayerLook } from '#lib/contract/look.ts';

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
/** Where a hair ornament sits on a hairstyle (head frame; `turn` radians; `scale`): NH places them per hairstyle and
 *  the files don't say where, so the crown unless a style is listed (B's low ponytail: the bow at its tie, as signed
 *  off: design/avatar/render/outfits/b.json). */
const ORNAMENT_ON: Record<string, { at: V3; turn?: V3; scale?: number }> = {
  PlayerHair12: { at: [0, 0.6, -3.75], turn: [1.45, 0, 0], scale: 0.75 }
};
/** The slots a look's parts go in (each a mesh of its own, or none). */
const SLOTS = ['hair', 'top', 'bottom', 'shoes', 'glasses', 'ornament', 'hat'] as const;
type Slot = (typeof SLOTS)[number];
/** The self-light (villager3d's: lit a little by its own colour). */
const LIFT = 0.32;

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const glbs = new Map<string, Promise<GLTF>>();
const texs = new Map<string, Promise<Texture>>();
const texLoader = new TextureLoader();

function glb(url: string): Promise<GLTF> {
  let p = glbs.get(url);
  if (!p) {
    p = loader.loadAsync(url).then(lean);
    p.catch(() => glbs.delete(url));
    glbs.set(url, p);
  }
  return p;
}
/** A texture (once per address). */
function tex(url: string): Promise<Texture> {
  let p = texs.get(url);
  if (!p) {
    p = texLoader.loadAsync(url).then((t) => {
      // (NH's uvs run past 0–1, a face patch's below 0: repeated, as the GLBs' own textures are)
      t.wrapS = t.wrapT = RepeatWrapping;
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    });
    p.catch(() => texs.delete(url));
    texs.set(url, p);
  }
  return p;
}

/** A material whose texture's alpha says where it takes the tint (255 − 127 × the tint's share: never 0, where a
 *  premultiplied decode loses the colour): the skin (the underwear keeps its own colour), the face patches (around
 *  the eyes and mouth), the bare legs; its self-light likewise. */
function maskMaterial(name: string, map: Texture, tint: Color, mask: { value: number }): MeshLambertMaterial {
  const m = new MeshLambertMaterial({ name, map, emissive: new Color(0xffffff), emissiveMap: map, emissiveIntensity: LIFT });
  const uTint = { value: tint };
  m.onBeforeCompile = (s: WebGLProgramParametersWithUniforms) => {
    s.uniforms.uTint = uTint;
    s.uniforms.uMask = mask;
    s.fragmentShader = `uniform vec3 uTint;\nuniform float uMask;\n${s.fragmentShader}`
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  diffuseColor.rgb *= mix( sampledDiffuseColor.rgb, sampledDiffuseColor.rgb * uTint, clamp( ( 1.0 - sampledDiffuseColor.a ) * 2.0, 0.0, 1.0 ) * uMask );
#endif`)
      .replace('#include <emissivemap_fragment>', `#ifdef USE_EMISSIVEMAP
  vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
  totalEmissiveRadiance *= mix( emissiveColor.rgb, emissiveColor.rgb * uTint, clamp( ( 1.0 - emissiveColor.a ) * 2.0, 0.0, 1.0 ) * uMask );
#endif`);
  };
  m.customProgramCacheKey = () => 'player-mask';
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
  return m;
}

interface Worn { key: string; meshes: SkinnedMesh[]; bones: Bone[]; mats: Material[] }

/**
 * @public (the scenes, the すがた preview)
 * A player standing at its group's origin (its feet), facing +z, in `look`: `dir` the site's room/player/ ($app/paths
 * asset), `seed` its blink's rhythm. Rejects if a part it needs isn't there (the caller keeps its stand-in).
 */
export async function createPlayer(id: string, look: PlayerLook, dir: string, seed = 0): Promise<Player3D> {
  const [body, T] = await Promise.all([glb(bodyUrl(dir)), loadParts(dir)]);
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

  let cur: PlayerLook = { ...look };
  const skin = new Color(cur.skin), hair = new Color(cur.hairColor);
  const socksMask = { value: 1 }, faceMask = { value: 1 };
  const owned: Material[] = [];
  /** The body's own: the skin, the legs (bare: the skin; in socks: their texture), the face patches, the noses. */
  const bodyMat = new Map<string, MeshLambertMaterial>();
  const faceTex: Partial<Record<'mEye' | 'mMouth' | 'mCheek', Texture>> = {};
  const faceFile = (n: 'mEye' | 'mMouth' | 'mCheek') => (n === 'mEye' ? cur.eye : n === 'mMouth' ? cur.mouth : `cheek${cur.cheek}`);
  const loadFace = async (n: 'mEye' | 'mMouth' | 'mCheek') => {
    const u = faceUrl(faceFile(n), dir);
    if (!u) throw new Error(`player: no face ${faceFile(n)}`);
    // (its own copy: the cell is this player's offset)
    const t = (await tex(u)).clone();
    t.needsUpdate = true;
    return t;
  };
  for (const n of ['mEye', 'mMouth', 'mCheek'] as const) faceTex[n] = await loadFace(n);
  const socksTex = async (): Promise<Texture | null> => {
    const it = cur.socks ? T.items[cur.socks] : null, t = it?.tex.mSocks;
    return t ? tex(texUrl(t, dir)!) : null;
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
      mat = maskMaterial(n, faceTex[n]!, skin, faceMask);
      mat.userData = { ...s.userData };
    } else mat = partMaterial(n, s.map, {}, null);
    bodyMat.set(n, mat);
    owned.push(mat);
    m.material = mat;
    m.frustumCulled = false;
  }
  const noses = () => {
    for (const m of skinned) {
      const k = /^mNose([0-2])$/.exec((m.material as Material).name);
      if (k) m.visible = +k[1] === cur.nose;
    }
  };
  noses();

  // ---- the parts ----
  /** The ornament's anchor where the hairstyle has it. */
  const placeOrnament = () => {
    const b = anchors.ornament, o = ORNAMENT_ON[cur.hair];
    b.position.fromArray(o?.at ?? ANCHOR.crown);
    b.rotation.set(...(o?.turn ?? [0, 0, 0]));
    b.scale.setScalar(o?.scale ?? 1);
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
    const u = meshUrl(p.key, dir, T);
    if (!u) throw new Error(`player: no mesh ${p.key}`);
    const g = await glb(u);
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
        bones.set(c.name, c);
        added.push(c);
      }
      model.updateMatrixWorld(true);
      const skel = new Skeleton(m.skeleton.bones.map((b) => lookup(nm(b.name))!), m.skeleton.boneInverses.map((x) => x.clone()));
      const bind = m.bindMatrix.clone();
      model.add(m);
      m.updateMatrixWorld(true);
      m.bind(skel, bind);
      m.frustumCulled = false;
    }
    const w: Worn = { key: p.key, meshes: ms, bones: added, mats: [] };
    await dressPart(slot, w, p.item);
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
        const map = spec.file ? await tex(texUrl(spec, dir)!) : null;
        mat = partMaterial(n, map, spec, spec.tint === 'hair' ? hair : spec.tint === 'skin' ? skin : null);
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
  function remove(slot: Slot) {
    const w = worn.get(slot);
    if (!w) return;
    for (const m of w.meshes) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    for (const m of w.mats) disposeMat(m);
    worn.delete(slot);
    // its own joints go, but those another part binds to too (a top's hem joints under a long skirt's): theirs now
    for (const b of w.bones.reverse()) {
      const other = [...worn.values()].find((o) => o.meshes.some((m) => m.skeleton.bones.includes(b)));
      if (other) {
        other.bones.unshift(b);
        continue;
      }
      b.removeFromParent();
      if (bones.get(b.name) === b) bones.delete(b.name);
    }
  }
  for (const slot of SLOTS) {
    const p = partOf(slot, cur);
    if (p) worn.set(slot, await put(slot, p));
  }

  const kind = playerKind(model, cur.mouthFrame);
  const v = animateModel(id, model, seed, kind);
  const tints = () => {
    skin.set(cur.skin);
    hair.set(cur.hairColor);
  };
  let busy: Promise<void> = Promise.resolve();
  const dress = async (next: PlayerLook) => {
    const prev = cur;
    cur = { ...next };
    tints();
    noses();
    for (const n of ['mEye', 'mMouth', 'mCheek'] as const) {
      const was = n === 'mEye' ? prev.eye : n === 'mMouth' ? prev.mouth : `cheek${prev.cheek}`;
      if (was === faceFile(n)) continue;
      // (the image swapped under the same texture: the cell it shows, its offset, is the face's)
      const u = faceUrl(faceFile(n), dir);
      if (!u) continue;
      const src = (await tex(u)).source, t = faceTex[n]!;
      t.source = src;
      // (its GPU copy let go of: another size of image needs a new one)
      t.dispose();
      t.needsUpdate = true;
    }
    if (prev.socks !== cur.socks) {
      socks = await socksTex();
      const mat = bodyMat.get('mSocks')!;
      mat.map = socks ?? (mat.userData.bare as Texture);
      mat.emissiveMap = mat.map;
      socksMask.value = socks ? 0 : 1;
    }
    if (prev.hair !== cur.hair) placeOrnament();
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
    if (skeletal) kind.rebind();
    // (the resting mouth: the face's next frame)
    restMouth.value = cur.mouthFrame;
  };
  const restMouth = { value: cur.mouthFrame };
  const baseCell = kind.cell!;
  kind.cell = (part, i, face) => (part === 'mouth' && i === 0 && face !== 'sleepy' ? restMouth.value : baseCell(part, i, face));
  const dispose = v.dispose;
  return Object.assign(v, {
    dress(next: PlayerLook) {
      busy = busy.then(() => dress(next));
      return busy;
    },
    look: () => ({ ...cur }),
    dispose() {
      dispose();
      for (const m of owned) m.dispose();
      for (const t of Object.values(faceTex)) t?.dispose();
    }
  }) as Player3D;
}

/** The parts a look needs (their addresses: what a phone fetches to draw it; the service worker caches each), by
 *  `t` (the bundled first closet's table, or loadParts' whole one). */
export function partUrls(look: PlayerLook, dir: string, t: PartTable = PARTS): string[] {
  const out = [bodyUrl(dir)];
  const f = (u: string | null) => u && out.push(u);
  f(faceUrl(look.eye, dir));
  f(faceUrl(look.mouth, dir));
  f(faceUrl(`cheek${look.cheek}`, dir));
  const h = t.hair[look.hair];
  if (h) f(meshUrl(look.hat && h.cap ? h.cap : h.mesh, dir, t));
  for (const k of ['top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament', 'hat'] as const) {
    const id = look[k];
    const it = id ? t.items[id] : null;
    if (!it || (k === 'bottom' && isOnepiece(look.top))) continue;
    if (it.mesh) f(meshUrl(it.mesh, dir, t));
    for (const t of Object.values(it.tex)) f(texUrl(t, dir));
  }
  return out;
}
