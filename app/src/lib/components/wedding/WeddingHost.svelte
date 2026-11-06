<script lang="ts">
  // けっこんしき's always-loaded host (docs/wedding.md), in the HUD beside the other sheets (outside the island's stage
  // and its [data-exact-taps]): the board's sheet (WeddingSheet.svelte, over its store board.svelte.ts), one chunk
  // mounted from the first opening (the menu's pill: open.svelte.ts openWedding).
  import { lazy } from '#lib/ui-state/reload.ts';
  import { weddingSheet } from './open.svelte.ts';

  const loadSheet = lazy(() => import('./WeddingSheet.svelte'));
  let Sheet = $state.raw<typeof import('./WeddingSheet.svelte').default | null>(null);

  // the chunk from the first opening; failed to load (offline, a deploy's moment): not open, the next tap tries again
  $effect(() => {
    if (!weddingSheet.mounted || Sheet) return;
    loadSheet().then(
      (m) => (Sheet = m.default),
      () => (weddingSheet.open = weddingSheet.mounted = false)
    );
  });
</script>

{#if Sheet}<Sheet bind:open={weddingSheet.open} />{/if}
