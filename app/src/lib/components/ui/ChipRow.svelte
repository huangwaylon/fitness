<script lang="ts">
  // A row of chips (docs/design.md "Unified kit"): one line that scrolls sideways, its end fading while there is more
  // to the right; 44px high, 12px from the sheet's sides, its chips' 44px hits inside it (its scroll clips them).
  // `children`: ui/Chip (or a Segmented at its end).
  //   <ChipRow label="日"> <Chip … /> … </ChipRow>
  import type { Snippet } from 'svelte';

  let { label, children }: { label: string; children: Snippet } = $props();
  let el: HTMLElement | undefined = $state();
  let more = $state(false);
  function measure() {
    if (el) more = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
  }
  $effect(() => {
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<div class="chip-row" class:more role="group" aria-label={label} bind:this={el} onscroll={measure}>{@render children()}</div>

<style>
  .chip-row {
    display: flex; align-items: center; gap: 6px; min-height: var(--hit); padding: 6px 12px; box-sizing: border-box;
    overflow: auto hidden; scrollbar-width: none; white-space: nowrap; overscroll-behavior-x: contain;
  }
  .chip-row::-webkit-scrollbar { display: none; }
  .more { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent); }
</style>
