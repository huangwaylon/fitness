<script lang="ts">
  // けっこんしき's always-loaded host (docs/wedding.md), in the HUD beside the other sheets (outside the island's stage
  // and its [data-exact-taps]): the board's sheet and its store (board.svelte.ts: the record's wtask / wdone / wconf /
  // wnote folded, each task's progress from lib/wedding/progress.ts, today in the board's zone), one chunk mounted from
  // the first opening (the menu's pill: open.svelte.ts openWedding). The store is the sheet's board and its actions; a
  // member's phone edits, the guest's reads only (no actions; the store and the record refuse its writes anyway).
  import { lazy } from '#lib/ui-state/reload.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { isGuest, villagerNameOf } from '#lib/ui-state/viewer.ts';
  import type { Who } from '#lib/types.ts';
  import { weddingSheet } from './open.svelte.ts';

  const loadSheet = lazy(() => Promise.all([import('./WeddingSheet.svelte'), import('./board.svelte.ts')]));
  let mod = $state.raw<{ Sheet: typeof import('./WeddingSheet.svelte').default; board: typeof import('./board.svelte.ts').board } | null>(null);

  // the chunk from the first opening; failed to load (offline, a deploy's moment): not open, the next tap tries again
  $effect(() => {
    if (!weddingSheet.mounted || mod) return;
    loadSheet().then(
      ([s, b]) => (mod = { Sheet: s.default, board: b.board }),
      () => (weddingSheet.open = weddingSheet.mounted = false)
    );
  });

  const view = $derived(week.view);
  const canEdit = $derived(!!view && !isGuest(view));
  const names = $derived<Record<Who, string>>({ A: view ? villagerNameOf(view, 'A') : 'A', B: view ? villagerNameOf(view, 'B') : 'B', G: view ? villagerNameOf(view, 'G') : 'G' });
</script>

{#if mod}<mod.Sheet bind:open={weddingSheet.open} board={view ? mod.board : null} {canEdit} {names} actions={canEdit ? mod.board : undefined} />{/if}
