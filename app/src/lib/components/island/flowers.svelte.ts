// The wild flowers (docs/design.md "World", "Island care"): NH's flowers growing in clumps over the lawn (world.ts
// FLOWERS), the season's kinds (scene.ts WILD), FLOWER_U tall (≈ 0.4 × a villager); the 3D island draws them
// (world3d/objects.ts: hybrids and winter's snow caps too). What's left of them here: each one's tap area for the 3D
// pick (a tap waters it: SceneTaps, by its id), the flowers watered today (by either of us: NH's flower keeps a
// glitter for the rest of the day, a 3D glint every 4–6 s, out of step between flowers) and their list for the
// critters (a ladybug sits on a head) and the e2e's hooks (Island3D: scenery's look and watered, box; ?hit's overlay).
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import { FLOWER_U, flowerScale, wildFlower } from './scene.ts';
import { FLOWERS, type Flower } from '#lib/world/world.ts';
import { site } from './site.svelte.ts';
import type { World } from './camera.svelte.ts';
import { art, flowerArt } from '#lib/art.ts';
import { tap } from '../world3d/things3.ts';
import { islandDay } from './ambientClock.ts';
import { week } from '#lib/store/week.svelte.ts';
import { WATERED, wateredOn } from '#lib/world/sceneDay.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import { fx3d } from '#lib/world/fx3d.ts';

/** A wild flower as shown today: its art (a hybrid's colour in its spot), its height and width (u). */
type Shown = Flower & { i: number; key: string; h: number; wd: number; white: boolean };

const mod = (a: number, n: number) => ((a % n) + n) % n;
const lists = new WeakMap<World, () => (Shown & { watered: boolean })[]>();
/** The flowers shown on World `w`'s island, and whether each was watered today (none while the island isn't up). */
export const flowersOf = (w: World): (Shown & { watered: boolean })[] => lists.get(w)?.() ?? [];

/** The flowers' state on island `w` (call in IslandScene's script: its effects live with it). */
export function useFlowers(w: World, o: { season: () => Season; hybrid: () => { id: string; flower: string } | null }): void {
  const list = $derived(
    // (world.ts's flowers follow the island's layout: site.rev)
    (void site.rev, FLOWERS).map((f, i): Shown => {
      const hy = o.hybrid(), key = hy?.id === f.id ? `flowers/${hy.flower}` : flowerArt(wildFlower(f, o.season()));
      const h = FLOWER_U * flowerScale(wildFlower(f, o.season())), a = art(key);
      return { ...f, i, key, h, wd: a ? (h * a.w) / a.h : h, white: key.includes('white') };
    })
  );
  /** Today (the model's Tokyo day; the gallery has no view). */
  const date = $derived(week.view?.today ?? islandDay());
  /** The flowers watered today, by either of us. */
  let mine = $state<string[]>([]);
  const watered = $derived(new Set([...mine, ...(date === islandDay() ? Object.keys(shared.day.watered) : [])]));
  $effect(() => {
    const d = date;
    const read = () => (mine = wateredOn(d));
    read();
    document.addEventListener(WATERED, read);
    return () => document.removeEventListener(WATERED, read);
  });

  // each one's tap area for the 3D pick: the flower (its art stood on its foot), at least 44 px round its middle
  $effect(() => tap(w, list.map((f) => ({ kind: 'flower', id: f.id, x: f.x, z: f.z, h: f.h, model: true, l: -f.wd / 2, r: f.wd / 2, b: -0.04 * f.h, t: 0.96 * f.h, min: [44, 44, 'mid'] as const })))());

  // a watered one's glint: every 4–6 s (by its place in the list), out of step (as the 2D one's CSS cycle: its glint at
  // 84 % of a cycle that began (i × 1.3) mod 6 s before), by its top; only on screen, while the page shows
  $effect(() => {
    const on = list.filter((f) => watered.has(f.id));
    if (!on.length) return;
    const t0 = performance.now(), every = (f: Shown) => (4 + (f.i % 3)) * 1000;
    const next = new Map(on.map((f) => [f.id, t0 + mod(0.84 * every(f) - ((f.i * 1.3) % 6) * 1000, every(f))]));
    const id = setInterval(() => {
      const t = performance.now();
      for (const f of on) {
        if (t < next.get(f.id)!) continue;
        next.set(f.id, t + every(f));
        if (!document.hidden && w.inView(f.x, f.z, 20)) fx3d('glint', f.x + f.wd * 0.12, f.z - 3, f.h * 0.78);
      }
    }, 250);
    return () => clearInterval(id);
  });

  lists.set(w, () => list.map((f) => ({ ...f, watered: watered.has(f.id) })));
}
