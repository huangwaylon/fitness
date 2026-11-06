<script lang="ts">
  // りょこう's first level (docs/design.md §Trips): a boarding pass per trip (Pass.svelte) under これからの旅 (on now
  // and coming, soonest first) and これまで (the past, newest first, each stamped). Under them the one km | mi switch
  // (this phone's, units.ts). From the trips' meta only (trips/meta.ts): no guide loads for the list.
  import type { TripId } from '#lib/travel/types.ts';
  import type { TripMeta } from '#lib/travel/trips/meta.ts';
  import { t } from '#lib/i18n/index.ts';
  import Icon from '../ui/Icon.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import Pass from './Pass.svelte';
  import { phaseOf, sortTrips } from './when.ts';
  import { UNITS, setUnits, units } from './units.ts';

  interface Props {
    trips: readonly TripMeta[];
    now: number;
    onopen: (id: TripId) => void;
  }
  let { trips, now, onopen }: Props = $props();
  const sorted = $derived(sortTrips(trips, now));
  const unitItems = UNITS.map((u) => ({ id: u, label: u }));
</script>

<div class="list" data-trip-list>
  {#if sorted.coming.length}
    <h3 class="sec-label head">{t('travel.coming')}</h3>
    <div class="passes">{#each sorted.coming as m (m.id)}<Pass trip={m} phase={phaseOf(m, now)} onopen={() => onopen(m.id)} />{/each}</div>
  {/if}
  {#if sorted.past.length}
    <h3 class="sec-label head" data-memories>{t('travel.memories')}</h3>
    <div class="passes">{#each sorted.past as m (m.id)}<Pass trip={m} phase={phaseOf(m, now)} onopen={() => onopen(m.id)} />{/each}</div>
  {/if}
  <div class="card dense units">
    <div class="row">
      <Icon name="ruler" size={18} />
      <span class="ul">{t('travel.units')}</span>
      <Segmented items={unitItems} value={units.current} label={t('travel.units')} attr="units" onpick={setUnits} />
    </div>
  </div>
</div>

<style>
  .list { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; padding: 0 12px calc(var(--safe-bottom, 0px) + 24px); }
  .list > .sec-label:first-child { margin-top: 4px; }
  .passes { display: grid; gap: 12px; }
  .units { margin-top: 20px; }
  .units .row { padding: 6px 6px 6px 12px; color: var(--text-soft); }
  .ul { flex: 1; color: var(--text); font-weight: 600; }
  .units :global(.seg) { flex: 0 0 132px; }
</style>
