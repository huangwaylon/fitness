<script lang="ts">
  // A bot page's loading (docs/design.md "Bots"): the status card's shape, pale and pulsing (still under reduced
  // motion), until its first status, when none is kept from before. `attr`: the page's data-* (data-its-skeleton).
  let { attr }: { attr: string } = $props();
</script>

<div class="skel card pad" {...{ [`data-${attr}-skeleton`]: '' }} aria-hidden="true"><span class="w"></span><span class="s"></span><span class="b"></span><span class="s"></span></div>

<style>
  .skel { height: 132px; display: grid; align-content: start; gap: 10px; }
  .skel span { height: 12px; border-radius: 6px; background: var(--ctl-off); animation: pulse 1.2s ease-in-out infinite alternate; }
  .skel .w { width: 30%; height: 16px; }
  .skel .s { width: 60%; }
  .skel .b { height: 32px; }
  @keyframes pulse { from { opacity: .45; } to { opacity: 1; } }
</style>
