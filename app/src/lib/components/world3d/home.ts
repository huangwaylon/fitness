// The homes in 3D (docs/island-layout.md "Homes"): a home's style built from NH's parts (layout/homes.ts partsOf:
// a wall, a roof and a door in their colours, or a tent), as converted by scripts/home-models.ts into
// static/room/homes/ (each part's GLB in its first colour, the other colours' albedos beside it). The wall and the roof
// share NH's origin (the house's front wall, its middle); the door stands in the wall's doorway (homes.json `door`: NH's
// DoorModel0 joint); a colour swaps the albedo of the materials it names. NH's soft look: Lambert, lit a little by its own colour (things.ts's), a lamp's own glow its night
// light. The scene places the group (engine.ts attach: bent there; homePlaces for where).
import { Color, Group, MeshLambertMaterial, SRGBColorSpace, TextureLoader, type Material, type Mesh, type MeshStandardMaterial, type Object3D, type Side, type Texture } from 'three';
import { withMaps } from './blank.ts';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { FAMILIES, partsOf, type HomeStyle } from '#lib/layout/homes.ts';
import { splitSides } from './sides.ts';
import { lean } from './release.ts';

/** World units a model unit (the island's furniture scale: 10 model units a 30u tile). */
export const HOME_U = 3;

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const textures = new TextureLoader();
const glbs = new Map<string, Promise<GLTF | null>>();
const maps = new Map<string, Promise<Texture | null>>();
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
    p = textures.loadAsync(`${base}${key}.webp?v=${FAMILIES[family]?.v ?? 0}`).then(
      (t) => {
        t.colorSpace = SRGBColorSpace;
        t.flipY = false;
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
    const g = await loader.loadAsync(new URL('../world3d/tent.glb', b).href).catch(() => null);
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
  const group = new Group();
  group.name = `home:${style.m}`;
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
  if (!group.children.length) return null;
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
export function homeLambert(src: MeshStandardMaterial, map: Texture | null = null, side: Side = src.side): Material {
  const own = !!src.emissiveMap;
  const m = new MeshLambertMaterial({
    map: map ?? src.map, color: src.color, transparent: src.transparent, opacity: src.opacity, alphaTest: src.alphaTest, side,
    emissive: own ? new Color(0xffe2a8) : new Color(0xffffff), emissiveMap: own ? src.emissiveMap : (map ?? src.map), emissiveIntensity: own ? 0 : 0.32
  });
  m.name = src.name;
  m.userData.lamp = own;
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
