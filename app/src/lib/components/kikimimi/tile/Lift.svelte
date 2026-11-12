<script lang="ts">
  // The tile games' lifted tile (drag.svelte.ts), at the finger, raised over it: fixed, though a transformed sheet makes
  // that its containing block, so its origin is read off a zero-size fixed marker. Drawn last in the round, over all.
  import type { Lift } from './drag.svelte.ts';

  let { l }: { l: Lift } = $props();
  let originEl = $state<HTMLElement | null>(null);
  const origin = $derived.by(() => {
    const r = originEl?.getBoundingClientRect();
    return r ? { x: r.left, y: r.top } : { x: 0, y: 0 };
  });
</script>

<span class="lift-origin" bind:this={originEl}></span>
<span class="tile lift" class:back={l.back} aria-hidden="true" data-kiki-tile-lift
  style:width="{l.w}px" style:height="{l.h}px" style:transform="translate({l.x - l.dx - origin.x}px, {l.y - l.dy - origin.y - (l.back ? 0 : 12)}px) scale({l.back ? 1 : 1.08})"><span lang="en">{l.word}</span></span>

<style>
  .lift {
    position: fixed; left: 0; top: 0; z-index: 30; pointer-events: none; display: inline-grid; place-items: center; box-sizing: border-box;
    padding-inline: 0; white-space: nowrap; border-radius: 14px; font: 700 max(17px, var(--fs-body))/1.2 var(--font-ui);
    background: var(--ctl); color: var(--text); transform-origin: 50% 50%; will-change: transform;
    box-shadow: inset 0 0 0 2px var(--edge), 0 8px 0 var(--lip), 0 14px 22px rgba(0, 0, 0, .18);
  }
  .lift.back { transition: transform 160ms var(--ease), box-shadow 160ms var(--ease); box-shadow: inset 0 0 0 2px var(--edge), 0 4px 0 var(--lip); }
  .lift-origin { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; }
  @media (prefers-reduced-motion: reduce) { .lift.back { transition: none; } }
</style>
