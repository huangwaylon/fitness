<script lang="ts">
  // けっこんしき's always-loaded host (docs/wedding.md), in the HUD beside the other sheets (outside the island's stage
  // and its [data-exact-taps]): the board's sheet, its own chunk, mounted from its first opening (the menu's pill:
  // open.svelte.ts openWedding). Who may edit: a member (the guest reads only; the record refuses its writes anyway).
  //
  // The integrator wires the store here: `board` from components/wedding/board.svelte.ts (the record's wtask / wdone /
  // wconf / wnote folded, each task's progress from lib/wedding/progress.ts, today in the board's zone) and its
  // actions; until then the sheet shows the empty board.
  import { lazy } from '#lib/ui-state/reload.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { isGuest, villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { weddingSheet } from './open.svelte.ts';
  import type { Who3 } from './view.ts';

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

  const view = $derived(week.view);
  const names = $derived<Record<Who3, string>>({ A: view ? villagerNameOf(view, 'A') : 'A', B: view ? villagerNameOf(view, 'B') : 'B', G: view ? villagerNameOf(view, 'G') : 'G' });
</script>

{#if Sheet}<Sheet bind:open={weddingSheet.open} board={null} canEdit={!!view && !isGuest(view)} {names} />{/if}
