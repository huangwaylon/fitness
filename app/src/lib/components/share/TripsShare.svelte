<script lang="ts">
  // The whole trips page as a `trips` link's visitor sees it (`/s#<token>`, docs/travel.md "Sharing"): the trips list
  // as the app groups it (TripList: これからの旅, これまで, from the small meta), a trip tapped → its pages (TripShare,
  // its guide loaded from the bundle, 持ち物 and the note's free values from the relay's snapshot), ‹ back to the list.
  // Read-only: no packing store, no sync.
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import type { SharedTrips } from '#lib/contract/share.ts';
  import { loadTrip } from '#lib/travel/trips/index.ts';
  import { TRIP_META } from '#lib/travel/trips/meta.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import NavBar from '../ui/NavBar.svelte';
  import LoadError from '../ui/LoadError.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import TripList from '../travel/TripList.svelte';
  import LangSwitch from './LangSwitch.svelte';
  import TripShare from './TripShare.svelte';
  import { untilDate } from './until.ts';

  let { data, now, exp }: { data: SharedTrips; now: number; exp: string } = $props();

  let sel = $state<TripId | null>(null);
  let trip = $state.raw<Trip | null>(null);
  let failed = $state(false);
  let scrollTop = 0;

  async function show(id: TripId) {
    scrollTop = document.querySelector('[data-trip-list]')?.scrollTop ?? 0;
    sel = id;
    failed = false;
    trip = null;
    try {
      const g = await loadTrip(id);
      if (sel === id) trip = g;
    } catch {
      if (sel === id) failed = true;
    }
  }
  function back() {
    const from = sel;
    sel = null;
    trip = null;
    void Promise.resolve().then(() => {
      const list = document.querySelector('[data-trip-list]');
      if (list) list.scrollTop = scrollTop;
      document.querySelector<HTMLElement>(`[data-trip="${from}"]`)?.focus({ preventScroll: true });
    });
  }
</script>

{#snippet lang()}<LangSwitch />{/snippet}

{#if sel && trip}
  <TripShare {trip} {now} {exp} shared={data[trip.id] ?? { pack: [], notes: [] }} onback={back} />
{:else}
  <div class="trips" data-share-trips data-level={sel ? 'loading' : 'list'}>
    <div class="hd"><NavBar pad title={t('travel.title')} onback={sel ? back : null} trailing={lang} /></div>
    {#if sel}
      <div class="state">
        {#if failed}<LoadError text={t('link.offline')} onretry={() => void show(sel!)} data-share-retry />{:else}<p class="soft" aria-busy="true"><Phrases text={t('link.loading')} /></p>{/if}
      </div>
    {:else}
      <TripList trips={TRIP_META} {now} onopen={(id) => void show(id)} />
      <footer class="foot" data-share-foot><p><Phrases text={t('link.foot', { date: untilDate(exp, i18n.locale) })} /></p></footer>
    {/if}
  </div>
{/if}

<style>
  .trips { height: var(--vh-fill); display: flex; flex-direction: column; background: var(--surface); }
  .hd { flex: none; background: var(--surface); }
  .trips :global([data-trip-list]) { flex: 1; min-height: 0; }
  .state { flex: 1; display: grid; place-items: center; padding: 16px; }
  .soft { color: var(--text-soft); font-size: var(--fs-s); margin: 0; }
  .foot { flex: none; padding: 8px 16px calc(var(--safe-bottom) + 12px); font-size: var(--fs-s); color: var(--text-soft); text-align: center; }
  .foot p { margin: 0; }
</style>
