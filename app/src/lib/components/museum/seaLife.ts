// The sea creatures' exhibits in the aquarium (docs/design.md "The museum"): their two tanks (seaTanks.ts: the reef tank along the
// right wall, the tide pool in the middle) and in them every sea creature anyone has caught, each in its own place: NH's
// museum-tank model where NH has one (the `sea-museum` pack), the island's catch model otherwise
// (static/room/world3d/critters/sea/), scaled to its place. The drifters (a jellyfish, the squid, the nautilus) bob in
// the reef tank's water, the rest lie still on the sand. The water and the glass are the aquarium's (aquarium.ts WATER_*);
// static, batched; the drifters ask for frames only while on screen (at the ambient rate).
import { AdditiveBlending, BoxGeometry, Color, DoubleSide, Group, Matrix4, MeshBasicMaterial, PlaneGeometry, ShaderMaterial, Sphere, Vector3, type BufferGeometry, type Material, type Object3D } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { Rect } from './plan.ts';
import { WATER_FRAG, WATER_VERT, tankLight } from './aquarium.ts';
import { lookAt } from './look.ts';
import { alongX, piecesOf, waterOf, type Box, type Tank } from './tanks.ts';
import { batcher, decal, openBox } from './geometry.ts';
import { MIN_ACROSS, SEA_MUSEUM_MODEL, SEA_SPOTS, SEA_TANKS, type SeaTankId } from './seaTanks.ts';
import type { Specimen } from './species.ts';
import { modelBounds } from '../world3d/models3d.ts';
import M from './models.json' with { type: 'json' };

const MODELS = M.models as Record<string, { min: number[]; max: number[] }>;
const WATER: Record<SeaTankId, { deep: number; top: number; caustic: number; glow: number }> = {
  reef: { deep: 0x154f86, top: 0x64cae8, caustic: 0.28, glow: 0x86d6f2 },
  pool: { deep: 0x226a88, top: 0x84d8e4, caustic: 0.32, glow: 0xa8e6ee }
};
/** How near a tap (client px) picks a creature, at least. */
const REACH = 22;

/** A creature's model's bounds: its museum-tank variant's (models.json) or its catch model's (world3d assets). */
const boundsOf = (id: string): { min: number[]; max: number[] } | null => (SEA_MUSEUM_MODEL[id] ? MODELS[id] : modelBounds(`critters/sea/${id}`)) ?? null;

/** How a creature is drawn in its place: its scale (fit across, a little one up to MIN_ACROSS) and its bounds. */
function fitOf(id: string): { s: number; b: { min: number[]; max: number[] } } | null {
  const b = boundsOf(id), sp = SEA_SPOTS.get(id);
  if (!b || !sp) return null;
  const across = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], 0.5);
  return { s: Math.max(MIN_ACROSS / across, Math.min(1.3, sp.fit / across)), b };
}

export function buildSeaLife(kit: Kit, list: readonly Specimen[]): Exhibit {
  const group = new Group();
  const geos: BufferGeometry[] = [];
  const mats: Material[] = [];
  const uTime = { value: 0 }, uNight = { value: 0 };
  let disposed = false;
  const frameMat = kit.lambert({ color: 0x3a4a5a });
  const sand = kit.lambert({ map: kit.tex('fish-sand', [2, 1]) });
  const batch = batcher(), at = new Matrix4();
  const box = (b: Box, m: Material) => batch.add(new BoxGeometry(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0), m, at.makeTranslation((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2));
  const glasses = new Set<Material>();
  const water = (id: SeaTankId, floor: boolean) => {
    const w = WATER[id];
    const m = new ShaderMaterial({
      vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, side: DoubleSide,
      uniforms: { uTime, uNight, uDeep: { value: new Color(w.deep) }, uTop: { value: new Color(w.top) }, uCaustic: { value: w.caustic }, uFloor: { value: floor ? 1 : 0 } },
      ...(floor ? { transparent: true, depthWrite: false, blending: AdditiveBlending } : {})
    });
    if (floor) (decal(m, 1), (m.forceSinglePass = true));
    m.userData.floor = floor;
    mats.push(m);
    return m;
  };
  const spheres = new Map<SeaTankId, Sphere>();
  for (const st of SEA_TANKS) {
    const t = st as unknown as Tank, b = st.box, w = waterOf(t), pc = piecesOf(t);
    box(pc.base, sand);
    // the reef's water's back against the wall; the pool, all glass, looked down into: its floor's caustics only
    if (st.id === 'reef') {
      const ax = alongX(b), back = new PlaneGeometry(ax ? w.x1 - w.x0 : w.z1 - w.z0, w.y1 - w.y0);
      batch.add(back, water(st.id, false), ax ? at.makeTranslation((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, w.z0) : at.makeRotationY(-Math.PI / 2).setPosition(w.x1, (w.y0 + w.y1) / 2, (w.z0 + w.z1) / 2));
    }
    batch.add(new PlaneGeometry(w.x1 - w.x0, w.z1 - w.z0), water(st.id, true), at.makeRotationX(-Math.PI / 2).setPosition((w.x0 + w.x1) / 2, w.y0 + 0.08, (w.z0 + w.z1) / 2));
    const g = new MeshBasicMaterial({ color: WATER[st.id].glow, transparent: true, opacity: st.id === 'pool' ? 0.2 : 0.16, depthWrite: false, side: DoubleSide, forceSinglePass: true });
    mats.push(g);
    glasses.add(g);
    const gb = pc.glass;
    batch.add(openBox(gb.x1 - gb.x0, gb.y1 - gb.y0, gb.z1 - gb.z0, ['-y']), g, at.makeTranslation((gb.x0 + gb.x1) / 2, (gb.y0 + gb.y1) / 2, (gb.z0 + gb.z1) / 2));
    for (const f of pc.frame) box(f, frameMat);
    // the tide pool's surface, faint (it's looked down into)
    if (st.id === 'pool') batch.add(new PlaneGeometry(w.x1 - w.x0, w.z1 - w.z0), g, at.makeRotationX(-Math.PI / 2).setPosition((w.x0 + w.x1) / 2, w.y1, (w.z0 + w.z1) / 2));
    spheres.set(st.id, new Sphere(new Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2), Math.hypot(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0) / 2));
  }
  geos.push(...batch.done(group, (m) => (glasses.has(m) ? 4 : m.userData.floor ? 1 : 0)));

  // ---- the creatures: each in its place, a drifter bobbing ----
  const ids = list.filter((s) => s.kind === 'sea' && SEA_SPOTS.has(s.id)).map((s) => s.id);
  const holders = new Map<string, Group>();
  const drifters: { id: string; h: Group; y: number; ph: number }[] = [];
  for (const id of ids) {
    const sp = SEA_SPOTS.get(id)!, fit = fitOf(id);
    if (!fit) continue;
    const { s, b } = fit;
    const h = new Group();
    h.position.set(sp.x, sp.y, sp.z);
    h.scale.setScalar(s);
    group.add(h);
    holders.set(id, h);
    if (sp.drifts) drifters.push({ id, h, y: sp.y, ph: (id.length * 1.7) % 6.28 });
    const put = (body: Object3D) => {
      // its middle over its place, its foot on the sand (a drifter: its middle at its height)
      body.position.set(-(b.min[0] + b.max[0]) / 2, sp.drifts ? -(b.min[1] + b.max[1]) / 2 : -b.min[1], -(b.min[2] + b.max[2]) / 2);
      h.add(body);
      kit.invalidate();
    };
    const got = SEA_MUSEUM_MODEL[id] ? kit.model(id) : kit.critter('sea', id);
    void got.then((g) => g && !disposed && put(g.scene.clone(true)));
  }
  const light = tankLight(kit, SEA_TANKS.map((st) => ({ box: st.box, top: waterOf(st as unknown as Tank).y1 })));
  group.add(light.lip.mesh);
  geos.push(light.lip.mesh.geometry);
  mats.push(light.lip.mesh.material as Material);
  const blocks: Rect[] = SEA_TANKS.map(({ box: b }) => ({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }));
  const where = (id: string): [number, number, number] | null => {
    const h = holders.get(id), fit = fitOf(id);
    if (!h || !fit) return null;
    const sp = SEA_SPOTS.get(id)!, tall = (fit.b.max[1] - fit.b.min[1]) * fit.s;
    return [h.position.x, sp.drifts ? h.position.y : sp.y + tall / 2, h.position.z];
  };
  return {
    group,
    wing: 'sea',
    blocks,
    pools: light.pools,
    frame(t, _dt, seen) {
      uTime.value = t / 1000;
      if (!drifters.length && ![...spheres.values()].some(seen)) return false;
      for (const d of drifters) {
        d.h.position.y = d.y + Math.sin(t / 1400 + d.ph) * 1.6;
        d.h.rotation.y = Math.sin(t / 5200 + d.ph) * 0.5;
      }
      // (the water's shimmer and the drifters: frames while the tanks are on screen)
      return [...spheres.values()].some(seen);
    },
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const id of holders.keys()) {
        const p = where(id), c = p && project(p[0], p[1], p[2]);
        if (!c) continue;
        const d = Math.hypot(c[0] - cx, c[1] - cy);
        if (d < REACH && (!best || d < best.d)) best = { id, d };
      }
      return best;
    },
    where,
    shown: () => [...holders.keys()],
    night(n) {
      uNight.value = n;
      const l = lookAt('sea', n);
      light.lip.cards(l.cards * l.glow);
    },
    dispose() {
      disposed = true;
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
    }
  };
}
