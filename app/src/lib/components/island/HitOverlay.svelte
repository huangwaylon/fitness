<script lang="ts">
  // `?hit` (a dev param, docs/ops/testing.md "URL params"): every tap target on the island drawn over it, refreshed each frame
  // while it's on: the scene's DOM targets (magenta: a tree's leaves and trunk, a bush, a villager, a door, a button in
  // the world) and the boxes the modules keep themselves (cyan: a shell, a weed, the rock, a bug, …; hitbox.ts
  // hitSources; a flower's 3D tap area, world3d/pick3d.ts). Debug only: pointer-events none, nothing else changes.
  import { onMount } from 'svelte';
  import { hitSources, type HitBox } from './hitbox.ts';
  import { useWorld } from './camera.svelte.ts';
  import { GONE, areaOf, tapsNow } from '../world3d/pick3d.ts';

  interface Props {
    scene?: HTMLElement;
  }
  let { scene }: Props = $props();
  const w = useWorld();
  const DOM = '.stage button:not([disabled]), .stage [data-tree], .stage [data-bush]';
  let boxes = $state<{ box: HitBox; kind: string; own: boolean }[]>([]);
  onMount(() => {
    let raf = 0;
    const frame = () => {
      const out: { box: HitBox; kind: string; own: boolean }[] = [];
      for (const el of scene?.querySelectorAll<HTMLElement>(DOM) ?? []) {
        if (!el.checkVisibility({ visibilityProperty: true })) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const box = { l: r.left, t: r.top, r: r.right, b: r.bottom };
        out.push({ box, kind: el.dataset.tree ? 'tree' : el.dataset.bush ? 'bush' : el.className.split(' ')[0] || 'button', own: false });
      }
      for (const list of hitSources) for (const h of list()) out.push({ ...h, own: true });
      // (the kinds whose nodes are gone, a flower: their 3D tap areas)
      for (const t of tapsNow(w)) if (GONE.has(t.kind)) ((a) => a && out.push({ box: { l: a.l, t: a.t, r: a.r, b: a.b }, kind: t.kind, own: true }))(areaOf(w, t));
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
