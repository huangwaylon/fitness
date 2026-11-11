// The homes in 3D (docs/island-layout.md "Homes"): a home's style built from NH's parts (layout/homes.ts partsOf:
// a wall, a roof and a door in their colours, or a tent), as converted by scripts/home-models.ts into
// static/room/homes/ (each part's GLB in its first colour, the other colours' albedos beside it). The wall and the roof
// share NH's origin (the house's front wall, its middle); the door stands in the wall's doorway (homes.json `door`: NH's
// DoorModel0 joint); a colour swaps the albedo of the materials it names. NH's soft look: Lambert, lit a little by its own colour (things.ts's), a lamp's own glow its night
// light. The scene places the group (engine.ts attach: bent there; homePlaces for where).
import { Group, MeshLambertMaterial, SRGBColorSpace, type CompressedTexture, type Material, type Mesh, type MeshStandardMaterial, type Object3D, type Side, type Texture } from 'three';
import { nhLambert, withMaps } from './blank.ts';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadTexture } from './ktx2.ts';
import { FAMILIES, partsOf, type HomeStyle } from '#lib/layout/homes.ts';
import { splitSides } from './sides.ts';
import { lean } from './release.ts';
import { quiet } from '#lib/quiet.ts';
import { glbLoader } from './gltf.ts';
import { keepUsed } from './keepUsed.ts';
import { freeModel } from './modelCache.ts';

/** World units a model unit (the island's furniture scale: 10 model units a 30u tile). */
const HOME_U = 3;

const loader = glbLoader({ ktx2: true });
const glbs = new Map<string, Promise<GLTF | null>>();
const maps = new Map<string, Promise<Texture | null>>();
/** The parts and colours no home built uses, kept (the island's three homes', ~11, back at once after a room). */
const HOME_KEEP = 12;
// Each built home holds what it's made of (`glb:<family>`, `map:<family.colour.mat>`) till releaseHome: of those no
// home holds, the HOME_KEEP last stay and the older go (geometry, textures, images), and a picker closed lets go of
// all but the island's own (trimHomes: a browse of the catalogue kept every one for the page's life, ~8-18 MB).
const kept = keepUsed<string>(HOME_KEEP, (k) => {
  const [kind, key] = [k.slice(0, 3), k.slice(4)];
  if (kind === 'glb') {
    const p = glbs.get(key);
    glbs.delete(key);
    void p?.then((g) => g && freeModel(g.scene, true));
  } else {
    const p = maps.get(key);
    maps.delete(key);
    void p?.then((t) => {
      if (!t) return;
      t.dispose();
      (t.image as { close?: () => void } | null)?.close?.();
      if ((t as CompressedTexture).isCompressedTexture) (t as CompressedTexture).mipmaps = [];
    });
  }
});
/** What a built home holds (its group's userData). */
const HOLDS = 'homeHolds';
/** A built home's parts and colours let go of (the group's left the scene for good: replaced, or the scene gone). */
export function releaseHome(g: Object3D | null | undefined): void {
  const holds = g?.userData[HOLDS] as string[] | undefined;
  if (!holds) return;
  delete g!.userData[HOLDS];
  for (const k of holds) kept.unuse(k);
}
/** What a home of `style` is made of (its parts' models, their colours' albedos), as held. */
const holdsOf = (style: HomeStyle): string[] =>
  partsOf(style).flatMap(({ family, colour }) => [`glb:${family}`, ...(FAMILIES[family]?.colours[colour] ?? []).map((mat) => `map:${family}.${colour}.${mat}`)]);
/** The parts and colours no home holds let go of, but those of `styles` (the island's homes: back on it, at once). */
export function trimHomes(styles: HomeStyle[]): void {
  const spare = new Set(styles.flatMap(holdsOf));
  kept.drop((k) => spare.has(k));
}
const baseUrl = (base?: string) => base ?? new URL('room/homes/', new URL(document.baseURI)).href;

function glb(base: string, family: string): Promise<GLTF | null> {
  let p = glbs.get(family);
  if (!p) {
    p = loader.loadAsync(`${base}${family}.glb?v=${FAMILIES[family]?.v ?? 0}`).then(lean, (e: unknown) => {
      console.warn('home: model', family, e);
      return null;
    });
    glbs.set(family, p);
  }
  return p;
}
function albedo(base: string, family: string, colour: string, mat: string): Promise<Texture | null> {
  const key = `${family}.${colour}.${mat}`;
  let p = maps.get(key);
  if (!p) {
    // (a colour's KTX2s in a pack beside them, by material: texHash.ts looseTextures)
    p = loadTexture(`${base}${key}.webp?v=${FAMILIES[family]?.v ?? 0}`, { flipY: false, ktx2: `${family}.${colour}.ktx2p#${mat}` }).then(
      (t) => {
        t.colorSpace = SRGBColorSpace;
        return t;
      },
      () => null
    );
    maps.set(key, p);
  }
  return p;
}

/** A home's 3D model (a new group each call: the parts' geometry shared), at HOME_U a model unit, its origin the
 *  front wall's middle on the ground, facing the camera (+z in three's space); null when nothing could load. */
export async function buildHome(style: HomeStyle, base?: string): Promise<Group | null> {
  const b = baseUrl(base);
  // the campsite's tent: the island's own model (world3d's), for a picker's preview
  if (style.m === 'campsite') {
    const g = await quiet(loader.loadAsync(new URL('../world3d/tent.glb', b).href), 'tent.glb', null);
    if (!g) return null;
    const root = g.scene.clone(true);
    lambertAll(root, () => null);
    const group = new Group();
    group.add(root);
    group.scale.setScalar(HOME_U);
    return group;
  }
  const parts = partsOf(style);
  if (!parts.length) return null;
  // (held before the loads: an eviction meanwhile never frees what this home is about to draw)
  const holds = holdsOf(style);
  for (const k of holds) kept.use(k);
  const group = new Group();
  group.name = `home:${style.m}`;
  group.userData[HOLDS] = holds;
  const loaded = await Promise.all(parts.map(async ({ family, colour, at }) => {
    const g = await glb(b, family);
    const fam = FAMILIES[family];
    const swap = new Map<string, Texture | null>();
    for (const mat of fam?.colours[colour] ?? []) swap.set(mat, await albedo(b, family, colour, mat));
    return { g, swap, at };
  }));
  for (const { g, swap, at } of loaded) {
    if (!g) continue;
    const root = g.scene.clone(true);
    if (at) root.position.set(at[0], at[1], at[2]);
    lambertAll(root, (src) => swap.get(src.name) ?? null, true);
    group.add(root);
  }
  if (!group.children.length) return (releaseHome(group), null);
  group.scale.setScalar(HOME_U);
  return group;
}

/** Every mesh under root in NH's soft look (homeLambert, its map `mapOf` its source material's), casting and taking
 *  shadows if `shadows`; a see-through two-sided part as two (sides.ts). */
export function lambertAll(root: Object3D, mapOf: (src: MeshStandardMaterial) => Texture | null, shadows = false): void {
  const meshes: Mesh[] = [];
  root.traverse((n) => void ((n as Mesh).isMesh && meshes.push(n as Mesh)));
  for (const mesh of meshes) {
    const src = mesh.material as MeshStandardMaterial, map = mapOf(src);
    mesh.material = homeLambert(src, map);
    if (shadows) mesh.castShadow = mesh.receiveShadow = true;
    splitSides(mesh, (side) => homeLambert(src, map, side));
  }
}

/** NH's soft look on a part's material (things.ts's): Lambert, a little self-light, a lamp's own map its glow. */
function homeLambert(src: MeshStandardMaterial, map: Texture | null = null, side: Side = src.side): Material {
  const m = nhLambert(src, { lift: 0.32, lamp: { color: 0xffe2a8, at: 0 }, side, map, see: true });
  m.userData.lamp = !!src.emissiveMap;
  return withMaps(m);
}

/** The time of day on a built home: its lamp lit (0 … 1) and its self-light. */
export function homeTod(g: Group, lamps: number, lift = 0.32): void {
  g.traverse((n) => {
    const m = (n as Mesh).material as MeshLambertMaterial | undefined;
    if (!m || !(n as Mesh).isMesh) return;
    m.emissiveIntensity = m.userData.lamp ? lamps : lift;
  });
}
