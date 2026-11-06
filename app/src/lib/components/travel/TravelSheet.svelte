<script lang="ts">
  // りょこう's sheet (docs/design.md §Trips), its own chunk with its strings: full height, the quiet kit's skin
  // (docs/design.md "Quiet sheets"). Two levels: the trips (TripList, from the small trips/meta.ts: no guide loads
  // for it), and a trip, its guide loaded when it is opened (each its own chunk; offline before it is cached,
  // 読み込めませんでした and もう一度). A trip drawn like the original guides (`classic`: Okinawa, Seattle) is
  // classic/ClassicGuide's under this sheet's header; any other is TripView's (its hero, its pages, its tab bar).
  // An opening goes straight into the trip on now, else back where it was left (the trip and its page, while the app
  // runs). The island is paused under it (open.svelte.ts → the page's `paused`).
  import '#lib/i18n/travel.ts';
  import '../quiet/quiet.css';
  import Sheet from '../ui/Sheet.svelte';
  import SheetHeader from '../quiet/SheetHeader.svelte';
  import TripList from './TripList.svelte';
  import TripView, { type Tab } from './TripView.svelte';
  import ClassicGuide from './classic/ClassicGuide.svelte';
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import { loadTrip } from '#lib/travel/trips/index.ts';
  import { TRIP_META } from '#lib/travel/trips/meta.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { pick } from './text.ts';
  import { phaseOf } from './when.ts';
  import { shortSpan } from './dates.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  const now = $derived(minuteNow().getTime());

  /** The trip open (null: the list), and each trip's page: kept from one opening to the next. */
  let sel = $state<TripId | null>(null);
  let tabs = $state<Partial<Record<TripId, Tab>>>({});
  /** The guides loaded so far, and the one that failed (offline before its chunk was cached). */
  let guides = $state.raw<Partial<Record<TripId, Trip>>>({});
  let failed = $state<TripId | null>(null);
  const trip = $derived(sel ? (guides[sel] ?? null) : null);
  const meta = $derived(sel ? TRIP_META.find((m) => m.id === sel) : undefined);

  function load(id: TripId) {
    failed = null;
    if (guides[id]) return;
    loadTrip(id).then(
      (g) => (guides = { ...guides, [id]: g }),
      () => {
        if (sel === id) failed = id;
      }
    );
  }
  function show(id: TripId) {
    sel = id;
    load(id);
  }

  /** An opening: straight into the trip on now, else where it was left. */
  function opening() {
    const on = TRIP_META.find((m) => phaseOf(m, now).k === 'now');
    if (on) show(on.id);
    else if (sel) load(sel);
  }

  function back() {
    cue('back');
    const from = sel;
    sel = null;
    failed = null;
    void Promise.resolve().then(() => document.querySelector<HTMLElement>(`[data-trip="${from}"]`)?.focus({ preventScroll: true }));
  }
  const close = () => (open = false);
  function closed() {
    if (toasts.current) toasts.dismiss();
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
</script>

<Sheet bind:open label={t('travel.title')} variant="quiet" onclose={closed}>
  <div class="tv" data-travel data-level={sel ? 'trip' : 'list'}>
    {#key sel}
      <div class="lvl">
        {#if !sel}
          <div class="top"><SheetHeader title={t('travel.title')} onclose={close} sfx="self" /></div>
          <TripList trips={TRIP_META} {now} onopen={show} />
        {:else if trip && !trip.classic}
          <TripView {trip} {now} onback={back} onclose={close} bind:tab={() => tabs[trip.id] ?? 'days', (v) => (tabs[trip.id] = v)} />
        {:else}
          <div class="top">
            <SheetHeader title={pick(meta?.title, i18n.locale)} sub={meta ? shortSpan(meta.start, meta.end, i18n.locale) : undefined} onback={back} onclose={close} sfx="self" />
          </div>
          <div class="scroll" data-trip-view={sel}>
            {#if trip}
              <ClassicGuide {trip} />
            {:else if failed === sel}
              <div class="center" data-travel-failed>
                <p>{t('travel.loadFailed')}</p>
                <button type="button" class="q-btn" data-sfx="tick" onclick={() => load(sel!)}>{t('travel.retry')}</button>
              </div>
            {:else}
              <p class="center" aria-busy="true">{t('travel.loading')}</p>
            {/if}
          </div>
        {/if}
      </div>
    {/key}
  </div>
</Sheet>

<style>
  .tv { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .lvl { flex: 1; min-height: 0; display: flex; flex-direction: column; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  .top { flex: none; padding-top: var(--ui-top); background: var(--q-bg); border-bottom: 1px solid transparent; }
  .scroll { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; border-top: 1px solid var(--q-hairline); }
  .center { flex: 1; min-height: 60%; display: grid; place-content: center; justify-items: center; gap: 12px; margin: 0; color: var(--q-muted); }
  .center p { margin: 0; }
  /* guide text: Japanese breaks only between its words (Txt's <wbr>s), a word too long for the line anywhere */
  .tv :global(.guide) { word-break: keep-all; line-break: strict; overflow-wrap: anywhere; text-wrap: pretty; }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
</style>
