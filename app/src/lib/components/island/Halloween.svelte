<script lang="ts">
  // Halloween on the island (docs/design.md "Halloween"; events.ts): on Oct 31 a few of NH's orange pumpkins sit on the
  // health lawn and round the campsite's clearing (world nodes); from 17:00 they are spooky lanterns (NH's jack-o'-lanterns), lit
  // above the night tint with a soft flicker, and a light purple and orange wash lies over the island. Decoration only:
  // no taps, never over a control (when the camera settles, a pumpkin in view that a control covers isn't shown). Jack
  // is a visitor (Visitor.svelte).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { PUMPKIN_U, su } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';
  import { CAMPSITE, onLayout, type Pt } from '../../world/world.ts';
  import { site } from './site.svelte.ts';
  import { nearestWalkable, walkGeo } from '../../world/walkGraph.ts';

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
      // (a world node out of view is hidden but keeps a stale box: not a control on screen)
      const keep = guardsU(g, 2, (el) => getComputedStyle(el).visibility === 'hidden');
      const out = new Set<string>();
      for (const [x, z] of spots) {
        // anywhere the projector may draw it (by the horizon too, faded and sunk, where the HUD stands)
        const pr = w.screenAt(x, z);
        if (!pr.visible || pr.sy < -40 || pr.sy > w.view.vh + 80) continue;
        const [sx, sy] = w.screenU(x, z), hu = PUMPKIN_U * w.scaleAt(x, z);
        if (!clearAt(keep, sx, sy - hu / 2, hu / 2, hu / 2)) out.add(`${x},${z}`);
      }
      hidden = out;
    }, 300);
    return () => clearTimeout(id);
  });
</script>

<!-- display: contents: the pumpkins join the stage's stacking context (their depth among the island's things) -->
<div class="halloween" class:night data-halloween={night ? 'night' : 'day'} aria-hidden="true">
  {#if night}<div class="wash"></div>{/if}
  {#each SPOTS as [x, z], i (i)}
    {#if !hidden.has(`${x},${z}`)}
    <span class="pumpkin" data-pumpkin style:--i={i} {@attach w.at({ x, z, h: PUMPKIN_U + 20, light: night, m3: { key: night ? 'deco/spooky-lantern' : 'deco/pumpkin' } })}>
      {#if night}<span class="glow"></span>{/if}
      <span class="art"><OfficialArt key={night ? 'deco/spooky-lantern' : 'deco/pumpkin'} size={su(PUMPKIN_U)} /></span>
    </span>
    {/if}
  {/each}
</div>

<style>
  .halloween { display: contents; }
  /* world nodes at their foot: by day among the island's things by depth; lit at night above the time-of-day tint */
  .pumpkin { width: 0; height: 0; pointer-events: none; }
  .art { position: absolute; left: 0; top: 0; line-height: 0; translate: -50% -94%; filter: var(--leaf-tint,) drop-shadow(0 1.5px 1px rgba(80, 50, 20, .35)); }
  .art :global(.official) { max-width: none; }
  .night .art { animation: flicker 2.6s ease-in-out calc(var(--i) * -.9s) infinite; }
  /* the candle inside: a warm round glow that breathes unevenly */
  .glow {
    position: absolute; left: 0; top: 0; width: calc(60 * var(--su)); aspect-ratio: 1; translate: -50% -62%; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 190, 90, .55), rgba(255, 140, 50, .22) 55%, transparent);
    animation: glow 1.9s ease-in-out calc(var(--i) * -.7s) infinite alternate;
  }
  @keyframes glow { 0% { opacity: .75; transform: scale(.94); } 35% { opacity: 1; } 60% { opacity: .82; transform: scale(1.04); } 100% { opacity: .95; transform: scale(.98); } }
  @keyframes flicker { 0%, 100% { opacity: 1; } 45% { opacity: .9; } 52% { opacity: 1; } 70% { opacity: .94; } }
  /* the evening's wash: purple from above to a warm orange low down, over land, sea and sky, under the tint's z */
  .wash {
    position: absolute; inset: 0; z-index: var(--z-tint); pointer-events: none;
    background: linear-gradient(to bottom, rgba(120, 70, 190, .22), rgba(150, 80, 170, .14) 55%, rgba(255, 140, 60, .12));
    mix-blend-mode: soft-light;
  }
</style>
