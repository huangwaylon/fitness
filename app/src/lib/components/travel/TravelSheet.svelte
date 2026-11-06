<script lang="ts">
  // りょこう's sheet (docs/travel.md "The sheet"), its own chunk with the guides and their strings: full height (Sheet's
  // `pop`, grown out of the menu's pill), one title bar (りょこう, or the trip's name with ‹ back to the list; ✕) over
  // one scroller: the boarding passes (TripList), or a trip (TripView). The three guides load with it (each its own
  // chunk). The island is paused under it (open.svelte.ts → the page's `paused`).
  import '#lib/i18n/travel.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TripList from './TripList.svelte';
  import TripView from './TripView.svelte';
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import { TRIP_IDS, loadTrip } from '#lib/travel/trips/index.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { minuteNow, dayKey } from '#lib/time/clock.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { pick } from './text.ts';
  import { phaseOf, sortTrips } from './when.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  let trips = $state.raw<Trip[] | null>(null);
  let failed = $state(false);
  function load() {
    failed = false;
    Promise.all(TRIP_IDS.map(loadTrip)).then(
      (xs) => (trips = xs),
      () => (failed = true)
    );
  }
  load();

  /** The trip open (null: the list). */
  let sel = $state<TripId | null>(null);
  const trip = $derived(trips?.find((x) => x.id === sel) ?? null);
  const now = $derived(minuteNow().getTime());

  /** Orville's line: on this phone's first opening of the (Tokyo) day only; chosen as the sheet opens. */
  let hello = $state<string | null>(null);
  $effect(() => {
    if (!open || !trips) return;
    const day = dayKey(), kv = localKV();
    if (kv?.getItem(DEVICE.travelHello) === day) return;
    try {
      kv?.setItem(DEVICE.travelHello, day);
    } catch {
      /* full or private: he says it again next time */
    }
    const next = sortTrips(trips, now).coming[0];
    const ph = next ? phaseOf(next, now) : null;
    hello = ph?.k === 'now' ? t('travel.hello.now', { n: ph.day }) : ph?.k !== 'soon' ? t('travel.hello.none') : ph.days === 1 ? t('travel.hello.tomorrow') : t('travel.hello.soon', { n: ph.days });
  });

  function openTrip(id: TripId) {
    sel = id;
  }
  function back() {
    cue('back');
    const from = sel;
    sel = null;
    void Promise.resolve().then(() => document.querySelector<HTMLElement>(`[data-trip="${from}"]`)?.focus({ preventScroll: true }));
  }
  function closed() {
    if (toasts.current) toasts.dismiss();
    sel = null;
    hello = null;
  }

  // Its open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });
  // a new level starts at its top
  let body: HTMLElement | undefined = $state();
  $effect(() => {
    void sel;
    if (body) body.scrollTop = 0;
  });
</script>

<Sheet bind:open label={t('travel.title')} variant="pop" onclose={closed}>
  <div class="titlebar"><NavBar title={trip ? pick(trip.title, i18n.locale) : t('travel.title')} onback={trip ? back : null} onclose={() => (open = false)} sfx="self" /></div>
  <div class="tv-body" bind:this={body} data-travel data-level={trip ? 'trip' : 'list'}>
    {#if failed}
      <div class="center">
        <p>{t('travel.loading')}</p>
        <button type="button" class="btn small paper" data-sfx="tick" onclick={load}>↻</button>
      </div>
    {:else if !trips}
      <p class="center" aria-busy="true">{t('travel.loading')}</p>
    {:else}
      {#key sel}
        <div class="lvl">
          {#if trip}
            <TripView {trip} {now} />
          {:else}
            <TripList {trips} {now} {hello} onopen={openTrip} />
          {/if}
        </div>
      {/key}
    {/if}
  </div>
</Sheet>

<style>
  .titlebar { flex: none; position: relative; z-index: 3; margin-bottom: 4px; }
  .titlebar::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips show */
  .tv-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column;
  }
  .center { flex: 1; display: grid; place-content: center; justify-items: center; gap: 12px; margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .lvl { display: grid; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  /* guide text (docs/design.md §Trips): normal Japanese line breaking inside the guides' own words, not keep-all */
  .tv-body :global(.guide) { word-break: normal; line-break: strict; overflow-wrap: anywhere; text-wrap: pretty; }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
</style>
