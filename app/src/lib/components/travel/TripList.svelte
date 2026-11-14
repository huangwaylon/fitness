<script lang="ts">
  // りょこう's first level (docs/design.md §Trips): a boarding pass per trip (Pass.svelte) under これからの旅 (on now
  // and coming, soonest first) and これまで (the past, newest first, each stamped), on the list's 旅 tab (TravelSheet; km | mi on its 設定
  // tab). From the trips' meta only (trips/meta.ts): no guide loads for the list.
  import type { TripId } from '#lib/travel/types.ts';
  import type { TripMeta } from '#lib/travel/trips/meta.ts';
  import { t } from '#lib/i18n/index.ts';
  import Pass from './Pass.svelte';
  import { phaseOf, sortTrips } from './when.ts';

  interface Props {
    trips: readonly TripMeta[];
    now: number;
    onopen: (id: TripId) => void;
  }
  let { trips, now, onopen }: Props = $props();
  const sorted = $derived(sortTrips(trips, now));
</script>

<div class="list sheet-scroll" data-trip-list>
  {#if sorted.coming.length}
    <h3 class="sec-label head">{t('travel.coming')}</h3>
    <div class="passes">{#each sorted.coming as m (m.id)}<Pass trip={m} phase={phaseOf(m, now)} onopen={() => onopen(m.id)} />{/each}</div>
  {/if}
  {#if sorted.past.length}
    <h3 class="sec-label head" data-memories>{t('travel.memories')}</h3>
    <div class="passes">{#each sorted.past as m (m.id)}<Pass trip={m} phase={phaseOf(m, now)} onopen={() => onopen(m.id)} />{/each}</div>
  {/if}
</div>

<style>
  .list { padding: 0 12px 24px; }
  .list > .sec-label:first-child { margin-top: 4px; }
  .passes { display: grid; gap: 12px; }
</style>
