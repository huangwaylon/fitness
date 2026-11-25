// The wild flowers (docs/design.md "World", "Island care"): NH's flowers growing in clumps over the lawn (world.ts
// FLOWERS), the season's kinds (scene.ts WILD), FLOWER_U tall (≈ 0.4 × a villager); the 3D island draws them
// (world3d/objects.ts: hybrids and winter's snow caps too). What's left of them here: each one's tap area for the 3D
// pick (a tap waters it: SceneTaps, by its id), the flowers watered today (by either of us: NH's flower keeps a
// glitter for the rest of the day, a 3D glint every 4–6 s, out of step between flowers) and their list for the
// critters (a ladybug sits on a head), a new hybrid's greeting (a sparkle and a line, once a phone) and the e2e's hooks (Island3D: scenery's look and watered, box; ?hit's overlay).
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import { FLOWER_U, flowerModel, flowerScale, wildFlower } from './scene.ts';
import { FLOWERS, type Flower } from '#lib/world/world.ts';
import { site } from './site.svelte.ts';
import type { World } from './camera.svelte.ts';
import { flowerArt, type FlowerId } from '#lib/art.ts';
import { tap } from '../world3d/things3.ts';
import { islandDay } from './ambientClock.ts';
import { week } from '#lib/store/week.svelte.ts';
import { WATERED, greetOnce, wateredOn } from '#lib/world/sceneDay.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import { fx3d } from '#lib/world/fx3d.ts';

/** A wild flower as shown today: its art key (a hybrid's colour in its spot), its tap area's height and its model's
 *  width (u). */
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
      const hy = o.hybrid(), id = (hy?.id === f.id ? hy.flower : wildFlower(f, o.season())) as FlowerId, key = flowerArt(id);
      return { ...f, i, key, h: FLOWER_U * flowerScale(id), wd: flowerModel(id).w, white: key.includes('white') };
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

  // each one's tap area for the 3D pick: the flower (its model's width) on its foot, at least 44 px round its middle
  $effect(() => tap(w, list.map((f) => ({ kind: 'flower', id: f.id, x: f.x, z: f.z, h: f.h, model: true, l: -f.wd / 2, r: f.wd / 2, b: -0.04 * f.h, t: 0.96 * f.h, min: [44, 44, 'mid'] as const })))());

  // a watered one's glint: every 4–6 s (by its place in the list), out of step (as the 2D one's CSS cycle: its glint at
  // 84 % of a cycle that began (i × 1.3) mod 6 s before), by its top; only on screen, while the page shows
  $effect(() => {
    const on = list.filter((f) => watered.has(f.id));
    if (!on.length) return;
    const t0 = performance.now(), every = (f: Shown) => (4 + (f.i % 3)) * 1000;
    const next = new Map(on.map((f) => [f.id, t0 + mod(0.84 * every(f) - ((f.i * 1.3) % 6) * 1000, every(f))]));
    // (a timer to the next one due, not a 250 ms poll)
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = performance.now();
      let soon = Infinity;
      for (const f of on) {
        if (t >= next.get(f.id)!) {
          next.set(f.id, t + every(f));
          if (!document.hidden && w.inView(f.x, f.z, 20)) fx3d('glint', f.x + f.wd * 0.12, f.z - 3, f.h * 0.78);
        }
        soon = Math.min(soon, next.get(f.id)!);
      }
      id = setTimeout(tick, Math.max(16, soon - t));
    };
    tick();
    return () => clearTimeout(id);
  });

  // a new hybrid is a find: the first time this phone sees today's (once the record's rows are in, so a phone that only
  // heard part of yesterday's watering never greets one that isn't everyone's), a sparkle on it and a line
  $effect(() => {
    const hy = o.hybrid(), f = hy && shared.recordIn ? list.find((x) => x.id === hy.id) : undefined;
    if (!hy || !f) return;
    const at = hy.flower.indexOf('-');
    const line = t('world.hybrid', { colour: t(`world.flower.${hy.flower.slice(0, at)}`), kind: t(`world.flower.${hy.flower.slice(at + 1)}`) });
    let id: ReturnType<typeof setTimeout>;
    const greet = (): void => {
      const done = greetOnce(`${islandDay()}|${hy.id}|${hy.flower}`, () => {
        // (not while the page is away or the 3D island isn't up yet: a second later)
        if (document.hidden || !fx3d('sparkle', f.x, f.z, f.h * 0.7, { size: 1.2 })) return false;
        toasts.show(line, 3600, { reaction: 'joy' });
        return true;
      });
      if (!done) id = setTimeout(greet, 1000);
    };
    greet();
    return () => clearTimeout(id);
  });

  lists.set(w, () => list.map((f) => ({ ...f, watered: watered.has(f.id) })));
}
