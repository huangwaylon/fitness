// The island's structures in 3D (docs/island-layout.md "The 3D ground"): NH's own bridges (their shortest span) and
// inclines, as converted by scripts/home-models.ts --structures into static/room/structures/ (structures.json), each
// fitted to its footprint (a bridge spans its length, an incline climbs its one tier over its four tiles), NH's soft
// Lambert (home.ts's). structurePlaces says where; the scene attaches the group (engine.ts attach: bent there).
import { Box3, Group, Vector3, type Mesh, type MeshStandardMaterial } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import STRUCTURES from '#lib/layout/structures.json' with { type: 'json' };
import { TIER_H } from '#lib/layout/grid.ts';
import { footOf, objMid, type Layout, type Obj } from '#lib/layout/model.ts';
import { homeLambert } from './home.ts';

const FAMILIES = (STRUCTURES as unknown as { families: Record<string, { min: number[]; max: number[]; v: string }> }).families;
/** A bridge's or a stairs' variant → NH's model. */
const FAMILY: Record<string, Record<string, string>> = {
  bridge: { stone: 'bridge-stone', wood: 'bridge-wood', log: 'bridge-log', brick: 'bridge-brick', red: 'bridge-red', iron: 'bridge-iron', japanese: 'bridge-japanese', suspension: 'bridge-suspension' },
  stairs: { stone: 'stairs-stone-stair', brick: 'stairs-brick-stair', iron: 'stairs-iron-stair', wood: 'stairs-wood-stair', log: 'stairs-wood', natural: 'stairs-natural' }
};
export const structureFamily = (k: string, s: string | undefined): string | null => {
  const f = FAMILY[k]?.[s ?? ''] ?? FAMILY[k]?.[Object.keys(FAMILY[k] ?? {})[0]];
  return f && FAMILIES[f] ? f : null;
};

export interface StructurePlace {
  id: string;
  family: string;
  /** The footprint's middle on the ground (u), the turn, the length to span (u) and, for stairs, the rise. */
  x: number;
  z: number;
  yaw: number;
  length: number;
  rise: number;
}
/** Every bridge and stairs on the layout with a model of NH's. A bridge's deck runs along its footprint's length; an
 *  incline climbs away from its facing (f 0: toward +z). */
export function structurePlaces(layout: Layout): StructurePlace[] {
  const out: StructurePlace[] = [];
  for (const o of layout.objects.values()) {
    if (o.k !== 'bridge' && o.k !== 'stairs') continue;
    const family = structureFamily(o.k, o.s);
    if (!family) continue;
    const [w, d] = footOf(layout, o), [x, z] = objMid(layout, { ...o, n: undefined } as Obj);
    // NH's models run along their x: turned to the footprint's long side (and for stairs, up away from the facing)
    const along = o.f % 2 ? 'x' : 'z';
    const yaw = o.k === 'stairs' ? [Math.PI / 2, Math.PI, -Math.PI / 2, 0][o.f] : along === 'z' ? Math.PI / 2 : 0;
    out.push({ id: o.id, family, x, z, yaw, length: Math.max(w, d) * 30, rise: o.k === 'stairs' ? TIER_H : 0 });
  }
  return out;
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const glbs = new Map<string, Promise<GLTF | null>>();
/** A structure's model fitted to its place (a new group: geometry shared), its origin the footprint's middle on the
 *  lower ground; null when it can't load. */
export async function buildStructure(p: StructurePlace, base?: string): Promise<Group | null> {
  const b = base ?? new URL('room/structures/', new URL(document.baseURI)).href;
  let g = glbs.get(p.family);
  if (!g) glbs.set(p.family, (g = loader.loadAsync(`${b}${p.family}.glb?v=${FAMILIES[p.family]?.v ?? 0}`).catch(() => null)));
  const gl = await g;
  if (!gl) return null;
  const root = gl.scene.clone(true);
  root.traverse((n) => {
    const mesh = n as Mesh;
    if (!mesh.isMesh) return;
    mesh.material = homeLambert(mesh.material as MeshStandardMaterial);
    mesh.castShadow = mesh.receiveShadow = true;
  });
  const box = new Box3().setFromObject(root), size = box.getSize(new Vector3()), mid = box.getCenter(new Vector3());
  // centred on its footprint, its base on the ground; scaled to span the footprint's length (a bridge 90% of it)
  root.position.set(-mid.x, p.rise ? -box.min.y : 0, -mid.z);
  const k = (p.length * (p.rise ? 1 : 0.9)) / Math.max(1e-3, size.x);
  const group = new Group();
  const inner = new Group();
  inner.add(root);
  inner.scale.set(k, p.rise ? p.rise / Math.max(1e-3, size.y) : k, k);
  group.add(inner);
  group.rotation.y = p.yaw;
  group.name = `structure:${p.id}`;
  return group;
}
