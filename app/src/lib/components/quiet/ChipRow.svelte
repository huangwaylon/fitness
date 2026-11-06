<script lang="ts">
  // A row of chips (docs/design.md "Quiet sheets"): one line that scrolls sideways, its right edge fading while
  // there is more to the right. 44px high; the chips are its children.
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

<div class="q-chips" class:more role="group" aria-label={label} bind:this={el} onscroll={measure}>{@render children()}</div>

<style>
  .q-chips {
    display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px;
    overflow: auto hidden; scrollbar-width: none; white-space: nowrap; overscroll-behavior-x: contain;
  }
  .q-chips::-webkit-scrollbar { display: none; }
  .q-chips.more { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent); }
</style>
