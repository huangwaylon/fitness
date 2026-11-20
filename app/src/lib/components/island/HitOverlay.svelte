<script lang="ts">
  // `?hit` (a dev param, docs/ops/testing.md "URL params"): every tap target on the island drawn over it, refreshed each frame
  // while it's on: the 3D tap areas (magenta: a villager, a goal tree, a door, a tree's leaves, a bush, a seat;
  // world3d/pick3d.ts) and the boxes sized to a thumb (cyan: those the modules keep themselves, a shell, a weed, the rock,
  // a bug, …: hitbox.ts hitSources; a tap area with a least size, a flower, a tree's trunk). Debug only: pointer-events
  // none, nothing else changes.
  import { onMount } from 'svelte';
  import { hitSources, type HitBox } from './hitbox.ts';
  import { useWorld } from './camera.svelte.ts';
  import { areaOf, tapsNow } from '../world3d/pick3d.ts';

  const w = useWorld();
  let boxes = $state<{ box: HitBox; kind: string; own: boolean }[]>([]);
  onMount(() => {
    let raf = 0;
    const frame = () => {
      const out: { box: HitBox; kind: string; own: boolean }[] = [];
      for (const list of hitSources) for (const h of list()) out.push({ ...h, own: true });
      for (const t of tapsNow(w)) ((a) => a && out.push({ box: { l: a.l, t: a.t, r: a.r, b: a.b }, kind: t.kind, own: !!t.min }))(areaOf(w, t));
      boxes = out;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="hits" aria-hidden="true" data-hit-overlay>
  {#each boxes as h, i (i)}
    <i class:own={h.own} data-hit-kind={h.kind} style:left="{h.box.l}px" style:top="{h.box.t}px" style:width="{h.box.r - h.box.l}px" style:height="{h.box.b - h.box.t}px"></i>
  {/each}
</div>

<style>
  .hits { position: fixed; inset: 0; z-index: var(--z-door); pointer-events: none; }
  i { position: absolute; box-sizing: border-box; border: 1.5px solid rgba(255, 0, 200, .9); background: rgba(255, 0, 200, .12); border-radius: 4px; }
  i.own { border-color: rgba(0, 200, 255, .95); background: rgba(0, 200, 255, .14); }
</style>
