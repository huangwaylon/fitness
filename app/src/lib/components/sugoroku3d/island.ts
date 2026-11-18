// 英語すごろく's board drawn on our own island (docs/sugoroku.md "The 3D board"): the island's ground (world3d/terrain.ts
// buildGround: NH's grass, sand, dirt path, cliffs' edges, the river's and the sea's water shaders) baked from the
// board's own layout (islandPlan.ts boardCodes), NH's models standing about (world3d/things.ts: instanced, KTX2, the
// island's shared model cache), our homes (world3d/home.ts) and NH's wooden bridges (world3d/structure.ts), all in the
// island's units and its three space; engine.ts puts the board (its stones and people) over it at islandPlan.ts
// BOARD_AT. The island's look: its loaders and caches, nothing of its assets copied. Built only when drawn (the logic
// mode draws nothing: engine.ts never calls this).
import { Box3, Frustum, Matrix4, type Camera, type Group, type Scene, type WebGLRenderer } from 'three';
import { Layout } from '#lib/layout/model.ts';
import { DEFAULT_HOMES } from '#lib/layout/homes.ts';
import { staticUrl } from '#lib/staticUrl.ts';
import { buildGround } from '../world3d/terrain.ts';
import { createThings } from '../world3d/things.ts';
import type { Inst } from '../world3d/objects.ts';
import { keyModel, modelBounds } from '../world3d/models3d.ts';
import { buildHome, releaseHome } from '../world3d/home.ts';
import { buildStructure } from '../world3d/structure.ts';
import { bendU } from '../world3d/bend.ts';
import { HOMES, PEOPLE, boardCodes, bridgePlaces, decoPlan, toLayout } from './islandPlan.ts';

export interface BoardIsland {
  /** The camera moved (three's space): the bend's pivot under it, what's out of view not drawn. */
  view(camera: Camera, pivotZ: number): void;
  /** A frame: the water's clock, any bake due; whether the static shadows want drawing again. */
  frame(t: number): boolean;
  dispose(): void;
}

/** The bend's radius while the board's drawn: the island's materials bend (bend.ts), the board's don't, so the bend is
 *  made too slight to see (and kept off float precision's edge: 5e5 is ~0.03u at the board's far end). */
const FLAT_R = 5e5;

/** An island model's name for a key or a model (assets.json's key → its model; a model's own name as is). */
const modelOf = (m: string): string => (modelBounds(m) ? m : (keyModel(m)?.m ?? m));
const boundsOf = (m: string) => modelBounds(modelOf(m));

/** The board's island in `scene`, drawn by `renderer`; `changed(shadows)` when something came in (a frame due, and
 *  the static shadows again if `shadows`). */
export function buildBoardIsland(renderer: WebGLRenderer, scene: Scene, changed: (shadows: boolean) => void): BoardIsland {
  const was = { r: bendU.uBendR.value, z: bendU.uBendZ.value };
  bendU.uBendR.value = FLAT_R;
  const layout = new Layout(boardCodes(), new Map(), { ...DEFAULT_HOMES });
  const ground = buildGround(layout, { renderer, base: staticUrl(''), look: 'summer' });
  scene.add(ground.group);
  let gone = false;
  void ground.ready.then(() => gone || changed(true));
  const height = (x: number, z: number) => ground.heightAt(x, z);

  // NH's models: one instanced draw a model and material (things.ts), what's out of view culled
  const things = createThings(scene, height, (sh = true) => changed(!!sh), { cull: true });
  things.tod(0, 0.32);
  const insts: Inst[] = decoPlan(boundsOf).map((d) => {
    const m = modelOf(d.m), b = boundsOf(d.m)!, [x, z] = toLayout(d.x, d.y);
    return { id: d.id, model: m, x, z, scale: (d.s ?? (d.h ?? 0) / (b.max[1] - Math.min(0, b.min[1]))) * PEOPLE, yaw: d.yaw ?? 0 };
  });
  void things.place(insts).then(() => gone || changed(true));

  // our homes and the bridges: built groups (their parts shared, page-wide caches), placed in three's space
  const built: Group[] = [];
  const stand = (g: Group | null, x: number, z: number, yaw: number, y = height(x, z)) => {
    if (!g) return;
    if (gone) return void releaseHome(g);
    g.position.set(x, y, -z);
    g.rotation.y = yaw;
    scene.add(g);
    built.push(g);
    changed(true);
  };
  for (const h of HOMES) {
    const [x, z] = toLayout(h.x, h.y);
    void buildHome(DEFAULT_HOMES[h.who], new URL(staticUrl('room/homes/'), document.baseURI).href).then((g) => {
      // (at the people's size: buildHome's group is at the island's scale)
      g?.scale.multiplyScalar(PEOPLE);
      stand(g, x, z, 0);
    });
  }
  for (const b of bridgePlaces()) {
    const dx = (Math.cos(b.yaw) * b.length) / 2, dz = (Math.sin(b.yaw) * b.length) / 2;
    const y = Math.min(height(b.x - dx, b.z - dz), height(b.x + dx, b.z + dz));
    void buildStructure({ ...b, family: 'bridge-wood', rise: 0 }, staticUrl('room/structures/')).then((g) => {
      // (narrower than NH's: two crossings side by side at the fork)
      g?.scale.set(1, 1, 0.55);
      stand(g, b.x, b.z, b.yaw, y);
    });
  }

  const frustum = new Frustum(), pv = new Matrix4(), box = new Box3();
  const seen = (box: Box3) => frustum.intersectsBox(box);
  let shadowsDue = false;
  return {
    view(camera, pivotZ) {
      bendU.uBendZ.value = pivotZ;
      camera.updateMatrixWorld();
      frustum.setFromProjectionMatrix(pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      if (things.cull(seen)) shadowsDue = true;
      // (the ground's bands: a band a row of 8 tiles, its meshes shown when its box is in view)
      for (const b of ground.chunks()) {
        const on = frustum.intersectsBox(box.set(box.min.set(-200, -20, -b.z1), box.max.set(800, 20, -b.z0)));
        for (const m of b.meshes) m.visible = on;
      }
      ground.near(-pivotZ);
    },
    frame(t) {
      ground.update(t);
      ground.near(-bendU.uBendZ.value);
      const due = shadowsDue;
      shadowsDue = false;
      return due;
    },
    dispose() {
      if (gone) return;
      gone = true;
      things.dispose();
      ground.dispose();
      scene.remove(ground.group);
      // (the homes and bridges stay in the scene: engine.ts's stage releases what's in it off its renderer)
      for (const g of built) releaseHome(g);
      built.length = 0;
      bendU.uBendR.value = was.r;
      bendU.uBendZ.value = was.z;
    }
  };
}
