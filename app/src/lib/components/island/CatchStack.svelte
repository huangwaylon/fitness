<script lang="ts">
  // The catch plates (catchStack.svelte.ts): a stack at the bottom centre of the screen, above the home indicator and
  // しずえ's box (--news-lift), clear of the say button at the bottom right (the same room kept at the left, so it stays
  // centred) and over the partner's edge face when that's at the bottom. The newest enters at the bottom; the older
  // slide up (a flip), and each fades out when it goes (its own timer, a tap, or pushed out by a fourth), then the
  // ones above it slide down into its room. Reduced motion: no slide, a quick fade.
  //   <CatchStack {scene} />   (in .if-scene, outside the scroller)
  import Plate from './Plate.svelte';
  import { flip } from 'svelte/animate';
  import { prefersReducedMotion } from 'svelte/motion';
  import { onDestroy } from 'svelte';
  import { FADE_MS, clearCards, dropCard, stack, stackShown } from './catchStack.svelte.ts';

  let { scene }: { scene?: HTMLElement } = $props();
  const still = $derived(prefersReducedMotion.current);
  const unshown = stackShown();
  onDestroy(() => (unshown(), clearCards()));
</script>

<div class="catch-stack" data-catch-stack>
  {#each stack.cards as c (c.n)}
    <div class="slot" class:leaving={c.leaving} inert={c.leaving} animate:flip={{ duration: still ? 0 : 260 }} style:--fade="{still ? 120 : FADE_MS}ms">
      <Plate {scene} x={c.x} y={c.y} art={c.art} parts={c.parts} hop={c.hop} leaving={c.leaving} ondone={() => dropCard(c.n)} />
    </div>
  {/each}
</div>

<style>
  .catch-stack {
    position: absolute; z-index: 2; left: 0; right: 0; bottom: calc(var(--pad-bottom, 8px) + 8px + var(--news-lift, 0px));
    /* the say button's room (44px and its 8px) and a breath, both sides */
    padding: 0 calc(var(--safe-right, 0px) + var(--hit, 44px) + 16px);
    display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none;
    --su: calc(100cqw / 390); /* the stage's unit, outside it (the plate's icon and type) */
  }
  /* the partner's face at the bottom edge (44px, 12px up): the stack stands over it */
  :global(.if-scene:has([data-partner-edge='bottom'])) .catch-stack { bottom: calc(var(--safe-bottom) + 64px + var(--news-lift, 0px)); }
  .slot { max-width: min(340px, 100%); display: flex; justify-content: center; transition: opacity var(--fade) ease, translate var(--fade) ease; }
  .slot.leaving { opacity: 0; translate: 0 -6px; pointer-events: none; }
  @media (prefers-reduced-motion: reduce) { .slot.leaving { translate: none; } }
</style>
