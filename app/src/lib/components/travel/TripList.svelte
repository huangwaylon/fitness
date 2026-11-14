<script lang="ts">
  // りょこう's first level (docs/design.md §Trips): a boarding pass per trip (Pass.svelte), the list tab's (TravelSheet):
  // これから (on now and coming, soonest first; none: 予定の旅はありません) or これまで (the past, newest first, each
  // stamped). From the trips' meta only (trips/meta.ts): no guide loads for the list.
  import type { TripId } from '#lib/travel/types.ts';
  import type { TripMeta } from '#lib/travel/trips/meta.ts';
  import { t } from '#lib/i18n/index.ts';
  import Pass from './Pass.svelte';
  import { phaseOf, sortTrips } from './when.ts';

  interface Props {
    trips: readonly TripMeta[];
    which: 'coming' | 'past';
    now: number;
    onopen: (id: TripId) => void;
  }
  let { trips, which, now, onopen }: Props = $props();
  const shown = $derived(sortTrips(trips, now)[which]);
</script>

<div class="list sheet-scroll" data-trip-list={which}>
  {#if shown.length}
    <div class="passes">{#each shown as m (m.id)}<Pass trip={m} phase={phaseOf(m, now)} onopen={() => onopen(m.id)} />{/each}</div>
  {:else}
    <p class="center" data-travel-none>{t('travel.none')}</p>
  {/if}
</div>

<style>
  .list { display: flex; flex-direction: column; padding: 6px 12px 24px; }
  .passes { display: grid; gap: 12px; }
  .center { flex: 1; display: grid; place-content: center; margin: 0; color: var(--text-soft); }
</style>
