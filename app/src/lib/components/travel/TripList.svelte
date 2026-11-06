<script lang="ts">
  // りょこう's first level (docs/travel.md "The sheet"): Orville at the Dodo Airlines counter with his one line (the first
  // opening of the day only), then a boarding pass per trip: those on now and coming first (soonest first), then
  // 「おもいで」, the trips gone by (newest first), each stamped.
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import Bubble from '../ui/Bubble.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Pass from './Pass.svelte';
  import { phaseOf, sortTrips } from './when.ts';

  interface Props {
    trips: readonly Trip[];
    now: number;
    /** Orville's line (null: not today's first opening). */
    hello: string | null;
    onopen: (id: TripId) => void;
  }
  let { trips, now, hello, onopen }: Props = $props();
  const sorted = $derived(sortTrips(trips, now));
</script>

<div class="list" data-trip-list>
  {#if hello}
    <div class="hello" data-orville>
      <span class="orv"><OfficialArt key="villagers/orville" size={92} eager /></span>
      <Bubble text={hello} name={t('travel.orville')} host={false} />
    </div>
  {/if}
  {#if sorted.coming.length}
    <h3 class="sec-label">{t('travel.coming')}</h3>
    {#each sorted.coming as trip (trip.id)}<Pass {trip} phase={phaseOf(trip, now)} onopen={() => onopen(trip.id)} />{/each}
  {/if}
  {#if sorted.past.length}
    <h3 class="sec-label" data-memories>{t('travel.memories')}</h3>
    {#each sorted.past as trip (trip.id)}<Pass {trip} phase={phaseOf(trip, now)} onopen={() => onopen(trip.id)} />{/each}
  {/if}
</div>

<style>
  .list { display: grid; gap: 12px; }
  .sec-label { margin-top: 8px; }
  .hello { display: flex; align-items: flex-end; gap: 2px; margin-bottom: 2px; }
  .orv { flex: none; display: grid; align-items: end; margin-bottom: 2px; animation: hop 520ms var(--ease-bounce) both; }
  .hello :global(.talk) { flex: 1; }
  @keyframes hop { from { transform: translateY(12px) scale(.9); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .orv { animation: none; } }
</style>
