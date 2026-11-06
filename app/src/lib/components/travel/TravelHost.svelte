<script lang="ts">
  // りょこう's always-loaded host (docs/travel.md "The sheet"), in the HUD, outside the island's [data-exact-taps]
  // stage: the sheet's chunk (the guides' list, their strings) from its first opening (open.svelte.ts openTrips), kept
  // mounted after it so a second opening is at once.
  import { lazy } from '#lib/ui-state/reload.ts';
  import { trips } from './open.svelte.ts';

  const loadSheet = lazy(() => import('./TravelSheet.svelte'));
  let Sheet = $state.raw<typeof import('./TravelSheet.svelte').default | null>(null);

  // failed to load (offline, a deploy's moment): not open (the island uncovered), and the next tap tries again
  $effect(() => {
    if (!trips.mounted || Sheet) return;
    loadSheet().then(
      (m) => (Sheet = m.default),
      () => (trips.open = trips.mounted = false)
    );
  });
</script>

{#if Sheet}<Sheet bind:open={trips.open} />{/if}
