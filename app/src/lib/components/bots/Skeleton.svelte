<script lang="ts">
  // A bot page's loading (docs/design.md "Bots"): three pale cards, pulsing (still under reduced motion), until its
  // first status, when none is kept from before. `attr`: the page's data-* (data-its-skeleton).
  let { attr }: { attr: string } = $props();
</script>

{#each [0, 1, 2] as i (i)}<div class="skel" {...{ [`data-${attr}-skeleton`]: '' }} aria-hidden="true"><span></span></div>{/each}

<style>
  .skel { height: 52px; display: flex; align-items: center; margin: 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .skel span { width: 60%; height: 12px; border-radius: 6px; background: var(--ctl-off); animation: pulse 1.2s ease-in-out infinite alternate; }
  @keyframes pulse { from { opacity: .45; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .skel span { animation: none; } }
</style>
