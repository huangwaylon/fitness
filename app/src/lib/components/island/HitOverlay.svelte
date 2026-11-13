<script lang="ts">
  // `?hit` (a dev param, docs/ops/testing.md "URL params"): every tap target on the island drawn over it, refreshed each frame
  // while it's on: the scene's DOM targets (magenta: a tree's leaves and trunk, a bush, a flower, a villager, a door, a
  // button in the world) and the boxes the modules hit-test themselves (cyan: a shell, a weed, the rock, a bug, …;
  // hitbox.ts hitSources). Debug only: pointer-events none, nothing else changes.
  import { onMount } from 'svelte';
  import { grow, hitSources, MIN_HIT, type HitBox } from './hitbox.ts';

  interface Props {
    scene?: HTMLElement;
  }
  let { scene }: Props = $props();
  const DOM = '.stage button:not([disabled]), .stage [data-tree], .stage [data-bush], .stage [data-flower]';
  let boxes = $state<{ box: HitBox; kind: string; own: boolean }[]>([]);
  onMount(() => {
    let raf = 0;
    const frame = () => {
      const out: { box: HitBox; kind: string; own: boolean }[] = [];
      for (const el of scene?.querySelectorAll<HTMLElement>(DOM) ?? []) {
        if (!el.checkVisibility({ visibilityProperty: true })) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        // a target grown by its own ::after to a thumb's size (a flower) reads as that
        const box = el.dataset.hitMin !== undefined ? grow(r, MIN_HIT, 0) : { l: r.left, t: r.top, r: r.right, b: r.bottom };
        out.push({ box, kind: el.dataset.tree ? 'tree' : el.dataset.bush ? 'bush' : el.dataset.flower ? 'flower' : el.className.split(' ')[0] || 'button', own: false });
      }
      for (const list of hitSources) for (const h of list()) out.push({ ...h, own: true });
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
  .hits { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }
  i { position: absolute; box-sizing: border-box; border: 1.5px solid rgba(255, 0, 200, .9); background: rgba(255, 0, 200, .12); border-radius: 4px; }
  i.own { border-color: rgba(0, 200, 255, .95); background: rgba(0, 200, 255, .14); }
</style>
