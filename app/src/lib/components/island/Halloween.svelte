<script lang="ts">
  // Halloween on the island (docs/design.md "Halloween"; events.ts): on Oct 31 a few of NH's orange pumpkins sit on the
  // health lawn and round the campsite's clearing; from 17:00 they are spooky lanterns (NH's jack-o'-lanterns, their
  // candles the 3D island's flickering lamps), and a light purple and orange wash lies over the sky (here, under the
  // canvas) and the island (the 3D light's Halloween grade: Island3D `spooky`). No DOM on the island (R4 step 7): the
  // pumpkins are things3 things. Decoration only: no taps, never over a control (when the camera settles, a pumpkin in
  // view that a control covers isn't shown). Jack is a visitor (visitor.svelte.ts).
  import { untrack } from 'svelte';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { PUMPKIN_U } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';
  import { thing, things3 } from '../world3d/things3.ts';
  import { CAMPSITE, onLayout, type Pt } from '#lib/world/world.ts';
  import { site } from './site.svelte.ts';
  import { nearestWalkable, walkGeo } from '#lib/world/walkGraph.ts';

  let { scene, night }: { scene?: HTMLElement; night: boolean } = $props();
  const w = useWorld();

  /** Where they sit (world x, z): four on the health lawn by its edges, clear of the trees and the villagers (まえ), four
   *  round the campsite's clearing, clear of centre stage, the cake, the arch and the lanterns, two by the tent's door
   *  (おく). */
  const LAWN: readonly Pt[] = [[40, 160], [350, 170], [36, 560], [360, 520]];
  /** Round the campsite's clearing, from its door (world.ts's campsite at 196, 984; the layout's wherever it stands, each
   *  on open ground there). */
  const CLEARING: readonly Pt[] = [[-84, -112], [100, -70], [-50, -26], [52, -26]];
  const SPOTS = $derived.by((): readonly Pt[] => {
    void site.rev;
    const g = onLayout() ? walkGeo() : null;
    return [...LAWN, ...CLEARING.map(([dx, dz]): Pt => {
      // (on the layout a home's door is its whole front: beside it, clear of its tap area)
      const ax = g && Math.abs(dz) < 60 ? Math.sign(dx) * Math.max(Math.abs(dx), (CAMPSITE.w ?? 0) / 2 + 16) : dx;
      const raw: Pt = [CAMPSITE.x + ax, CAMPSITE.z + dz], p = (g && nearestWalkable(g, raw[0], raw[1], 30)) || raw;
      return [Math.round(p[0]), Math.round(p[1])];
    })];
  });

  /** The spots not under a control on this screen, measured when the camera settles (and on a resize). */
  let hidden = $state<ReadonlySet<string>>(new Set());
  $effect(() => {
    void w.rest.z;
    void w.rest.vw;
    const spots = SPOTS;
    const id = setTimeout(() => {
      const g = stageGeo(scene);
      if (!g) return;
      // (an anchored overlay out of view is hidden but keeps a stale box: not a control on screen)
      const keep = guardsU(g, 2, (el) => getComputedStyle(el).visibility === 'hidden');
      const out = new Set<string>();
      for (const [x, z] of spots) {
        // anywhere the camera may show it (by the horizon too, faded and sunk, where the HUD stands)
        const pr = w.screenAt(x, z);
        if (!pr.visible || pr.sy < -40 || pr.sy > w.view.vh + 80) continue;
        const [sx, sy] = w.screenU(x, z), hu = PUMPKIN_U * w.scaleAt(x, z);
        if (!clearAt(keep, sx, sy - hu / 2, hu / 2, hu / 2)) out.add(`${x},${z}`);
      }
      hidden = out;
    }, 300);
    return () => clearTimeout(id);
  });

  /** The pumpkins out (not under a control): world x, z and their thing's id. */
  const out = $derived(SPOTS.flatMap(([x, z], i) => (hidden.has(`${x},${z}`) ? [] : [{ x, z, id3: `pumpkin-${i}` }])));
  $effect(() => {
    const list = out, key = night ? 'deco/spooky-lantern' : 'deco/pumpkin';
    return untrack(() => {
      const offs = list.map(({ x, z, id3 }) => thing(w, { x, z, h: PUMPKIN_U + 20, m3: { key, id: id3 } })());
      return () => offs.forEach((off) => off());
    });
  });
  // the e2e's row (things3 probe 'halloween'): day or night, and each pumpkin out (lit: a night's lantern)
  $effect(() => {
    const r = things3(w), row = () => ({ when: night ? 'night' : 'day', pumpkins: out.map((p) => ({ ...p, lit: night })) });
    r.probes.set('halloween', row);
    return () => void (r.probes.get('halloween') === row && r.probes.delete('halloween'));
  });
</script>

<!-- the evening's wash over the sky, under the 3D canvas (the island's own is the 3D light's) -->
{#if night}<div class="wash" aria-hidden="true"></div>{/if}

<style>
  /* purple from above to a warm orange low down, over the sky (z 0–2) and under the canvas (5) */
  .wash {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: linear-gradient(to bottom, rgba(120, 70, 190, .22), rgba(150, 80, 170, .14) 55%, rgba(255, 140, 60, .12));
    mix-blend-mode: soft-light;
  }
</style>
