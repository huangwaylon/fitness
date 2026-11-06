<script lang="ts">
  // A unit's lesson dots (docs/curriculum-units.md §3; the UX review's sketches A–C): the 3 core lessons as dots (filled
  // once played to the end), the extras as small stars (☆ → ★), the next one ringed in yuzu. Decorative: the caller
  // says it in words (aria-label).
  import { CORE } from '#lib/kikimimi/path.ts';
  import type { Lesson } from '#lib/kikimimi/stages.ts';

  let { lessons, done = [], next = null, label = '' }: { lessons: readonly Lesson[]; done?: readonly Lesson[]; next?: Lesson | null; label?: string } = $props();
</script>

<span class="ld" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
  {#each lessons as l (l)}
    {#if CORE.includes(l)}<i class="dot" class:done={done.includes(l)} class:next={next === l} data-dot={l}></i>
    {:else}<i class="star" class:done={done.includes(l)} data-dot={l}>{done.includes(l) ? '★' : '☆'}</i>{/if}
  {/each}
</span>

<style>
  .ld { display: inline-flex; align-items: center; gap: 5px; line-height: 1; }
  .dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--leaf-text); flex: none; }
  .dot.done { background: var(--leaf-text); }
  .dot.next:not(.done) { background: var(--c-yuzu); box-shadow: inset 0 0 0 2px var(--edge); }
  .star { font: 700 13px/1 var(--font-ui); font-style: normal; color: var(--text-soft); }
  .star.done { color: var(--c-yuzu-lip); }
</style>
