<script lang="ts">
  // りょこう's sheet (docs/design.md §Trips), its own chunk with the guides and their strings: full height (Sheet's
  // `pop`, grown out of the menu's pill), one title bar (りょこう, or the trip's name with ‹ back to the list; ✕) over
  // one scroller: the boarding passes (TripList), or a trip (TripView). The three guides load with it (each its own
  // chunk; offline before they are cached, よみこめませんでした and もういちど). The day's first opening is Orville's (the
  // list); after it, straight into a trip on now, else where it was left (the trip and its page, while the app
  // runs). The island is paused under it (open.svelte.ts →
  // the page's `paused`).
  import '#lib/i18n/travel.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TripList from './TripList.svelte';
  import TripView, { type Tab } from './TripView.svelte';
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import { TRIP_IDS, loadTrip } from '#lib/travel/trips/index.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { minuteNow, dayKey } from '#lib/time/clock.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { pick, plain } from './text.ts';
  import { nextRow, phaseOf, sortTrips } from './when.ts';
  import { packing } from './packing.svelte.ts';
  import { myProgress, packView } from './packView.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  let trips = $state.raw<Trip[] | null>(null);
  let failed = $state(false);
  function load() {
    failed = false;
    Promise.all(TRIP_IDS.map(loadTrip)).then(
      (xs) => {
        trips = xs;
        if (open) opening();
      },
      () => (failed = true)
    );
  }
  load();

  /** The trip open (null: the list), and each trip's page: kept from one opening to the next. */
  let sel = $state<TripId | null>(null);
  let tabs = $state<Partial<Record<TripId, Tab>>>({});
  const trip = $derived(trips?.find((x) => x.id === sel) ?? null);
  const now = $derived(minuteNow().getTime());

  /** An opening: the day's first (on this phone) at the counter, Orville with his line (the trip list); a later one
   *  straight into the trip on now, else where it was left. */
  function opening() {
    if (!trips) return;
    const day = dayKey(), kv = localKV();
    if (kv?.getItem(DEVICE.travelHello) !== day) {
      try {
        kv?.setItem(DEVICE.travelHello, day);
      } catch {
        /* full or private: he says it again next time */
      }
      hello = helloLine(trips);
      sel = null;
      return;
    }
    const on = trips.find((x) => phaseOf(x, now).k === 'now');
    if (on) sel = on.id;
  }

  /** Orville's line: during a trip, the next stop; on its eve, how the packing is going; before, the days to go. */
  let hello = $state<string | null>(null);
  function helloLine(all: readonly Trip[]): string {
    const next = sortTrips(all, now).coming[0];
    const ph = next && phaseOf(next, now);
    if (!ph || ph.k === 'past') return t('travel.hello.none');
    if (ph.k === 'now') {
      const up = nextRow(next, now);
      const row = up && next.days[up.day - 1].rows[up.i];
      return row ? t('travel.hello.next', { t: row.t, what: plain(pick(row.text, i18n.locale), packing.note(next.id)) }) : t('travel.hello.now', { n: ph.day });
    }
    if (ph.days > 1) return t('travel.hello.soon', { n: ph.days });
    const c = myProgress(packView(packing.list(next.id, next.packing), packing.me, i18n.locale));
    return c.done ? t('travel.hello.packed') : t('travel.hello.packing', { n: c.mine, total: c.total });
  }

  function back() {
    cue('back');
    const from = sel;
    sel = null;
    void Promise.resolve().then(() => document.querySelector<HTMLElement>(`[data-trip="${from}"]`)?.focus({ preventScroll: true }));
  }
  function closed() {
    if (toasts.current) toasts.dismiss();
    hello = null;
  }

  // Its open and close tunes (it mounts on the first tap, already open: that is an open too), and where it opens.
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
    if (o) opening();
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
      <div class="center" data-travel-failed>
        <p>{t('travel.loadFailed')}</p>
        <button type="button" class="btn small paper" data-sfx="tick" onclick={load}>{t('travel.retry')}</button>
      </div>
    {:else if !trips}
      <p class="center" aria-busy="true">{t('travel.loading')}</p>
    {:else}
      {#key sel}
        <div class="lvl">
          {#if trip}
            <TripView {trip} {now} bind:tab={() => tabs[trip.id] ?? 'days', (v) => (tabs[trip.id] = v)} />
          {:else}
            <TripList {trips} {now} {hello} onopen={(id) => (sel = id)} />
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
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips
     show; no top padding (the level's margin keeps the room), so the trip's tabs stick flush under the title bar */
  .tv-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 0 8px var(--body-pad); display: flex; flex-direction: column;
  }
  .center { flex: 1; display: grid; place-content: center; justify-items: center; gap: 12px; margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  .center p { margin: 0; }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .lvl { display: grid; margin-top: 6px; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  /* guide text: Japanese breaks only between its words (Txt's <wbr>s), a word too long for the line anywhere */
  .tv-body :global(.guide) { word-break: keep-all; line-break: strict; overflow-wrap: anywhere; text-wrap: pretty; }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
</style>
