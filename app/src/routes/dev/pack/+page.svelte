<script lang="ts">
  // /dev/pack?demo[&as=B|G][&trip=seattle|nz]: りょこう's packing list alone (components/travel/PackList.svelte), on the
  // demo's record, until the trips sheet mounts it under もちもの (e2e/travel-pack.spec.ts, the visual checks). Only in
  // the demo: a live phone sees nothing here.
  import { resolve } from '$app/paths';
  import PackList from '#lib/components/travel/PackList.svelte';
  import { loadTrip, TRIP_IDS } from '#lib/travel/trips/index.ts';
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import { week } from '#lib/store/week.svelte.ts';

  const q = new URLSearchParams(location.search).get('trip');
  const id: TripId = TRIP_IDS.find((x) => x === q) ?? 'okinawa';
  let trip = $state<Trip | null>(null);
  void loadTrip(id).then((x) => (trip = x));
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="page">
  {#if !week.demo}
    <p><a href={resolve('/')}>←</a></p>
  {:else if trip && week.view}
    <PackList {trip} />
  {/if}
</main>

<style>
  .page { max-width: var(--col); margin: 0 auto; padding: calc(var(--safe-top) + 16px) var(--side) calc(var(--safe-bottom) + 40px); background: var(--surface); min-height: 100dvh; }
</style>
