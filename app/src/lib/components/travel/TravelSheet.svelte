<script lang="ts">
  // りょこう's sheet (docs/design.md §Trips), its own chunk with its strings: a full sheet on the unified kit
  // (docs/design.md "Unified kit"). Two levels: the trips (TripList, from the small trips/meta.ts: no guide loads
  // for it), and a trip (TripView: its hero, its pages, its tab bar), its guide loaded when it is opened (each its own
  // chunk; offline before it is cached, 読み込めませんでした and もう一度).
  // The list's own tabs (a tablist, as ボット's): 旅 (TripList: これから and これまで) and 設定 (TravelSettings: km | mi).
  // It opens on the tab last shown this app session (DEVICE.travelTab, sessionStorage), else 旅.
  // An opening goes straight into the trip on now, else back where it was left (the trip and its page, while the app
  // runs). The island is paused under it (open.svelte.ts → the page's `paused`). Kept mounted between openings (Sheet's
  // `keep`: a reopening at once, where it was left, its scroll too), but for a trip on now (built again: today's day,
  // the row that is now in view) and the 地図 page (a closed sheet holds no MapLibre map: let go at the close).
  import { untrack } from 'svelte';
  import '#lib/i18n/travel.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import TripList from './TripList.svelte';
  import TravelSettings from './TravelSettings.svelte';
  import TripView, { type Tab } from './TripView.svelte';
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import { loadTrip } from '#lib/travel/trips/index.ts';
  import { TRIP_META } from '#lib/travel/trips/meta.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { pick } from './text.ts';
  import { phaseOf } from './when.ts';
  import { DEVICE, sessionKV } from '#lib/sync/storage.ts';

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

  type ListTab = 'trips' | 'settings';
  const LIST_TABS: readonly ListTab[] = ['trips', 'settings'];
  const ICONS = { trips: 'plane-takeoff', settings: 'gear' } as const;
  const kv = sessionKV();
  const kept = kv?.getItem(DEVICE.travelTab);
  /** The list's tab: the one kept this session, else 旅. */
  let ltab = $state<ListTab>(LIST_TABS.find((x) => x === kept) ?? 'trips');
  const items = $derived(LIST_TABS.map((id) => ({ id, label: t(`travel.tab.${id}`), icon: ICONS[id] })));
  function pickTab(id: ListTab) {
    ltab = id;
    try {
      kv?.setItem(DEVICE.travelTab, id);
    } catch {
      /* this opening only */
    }
  }

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
    if (on) {
      show(on.id);
      fresh++;
    } else if (sel) load(sel);
  }
  /** Bumped by an opening onto the trip on now: its level built afresh. */
  let fresh = $state(0);
  const keep = $derived(!(sel && tabs[sel] === 'map'));

  function back() {
    cue('back');
    const from = sel;
    sel = null;
    failed = null;
    void Promise.resolve().then(() => document.querySelector<HTMLElement>(`[data-trip="${from}"]`)?.focus({ preventScroll: true }));
  }
  const close = () => (open = false);

  // Where it opens.
  $effect(() => {
    if (open) untrack(opening);
  });
</script>

<Sheet bind:open tunes label={t('travel.title')} variant="full" timed="travel" {keep}>
  <div class="tv" data-travel data-level={sel ? 'trip' : 'list'}>
    {#key `${sel}|${fresh}`}
      <div class="lvl">
        {#if !sel}
          <div class="top"><NavBar pad title={t('travel.title')} onclose={close} /></div>
          <div class="panel" id="travel-panel" role="tabpanel" aria-labelledby="travel-tab-{ltab}" data-travel-panel={ltab}>
            {#if ltab === 'settings'}
              <div class="sheet-scroll"><TravelSettings /></div>
            {:else}
              <TripList trips={TRIP_META} {now} onopen={show} />
            {/if}
          </div>
          <TabBar {items} value={ltab} label={t('travel.listTabs')} attr="travel-tab" panel="travel-panel" onpick={pickTab} />
        {:else if trip}
          <TripView {trip} {now} onback={back} onclose={close} bind:tab={() => tabs[trip.id] ?? 'days', (v) => (tabs[trip.id] = v)} />
        {:else}
          <div class="top"><NavBar pad title={pick(meta?.title, i18n.locale)} onback={back} onclose={close} /></div>
          <div class="scroll sheet-scroll" data-trip-view={sel}>
            {#if failed === sel}
              <div class="center" data-travel-failed>
                <p>{t('travel.loadFailed')}</p>
                <button type="button" class="btn small paper" data-sfx="tick" onclick={() => load(sel!)}>{t('travel.retry')}</button>
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
  .lvl { flex: 1; min-height: 0; display: flex; flex-direction: column; animation: if-lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .top { flex: none; background-color: var(--surface); }
  .panel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .center { flex: 1; min-height: 60%; display: grid; place-content: center; justify-items: center; gap: 12px; margin: 0; color: var(--text-soft); }
  .center p { margin: 0; }
  /* guide text: Japanese breaks only between its words (Txt's <wbr>s), a word too long for the line anywhere */
  .tv :global(.guide) { word-break: keep-all; line-break: strict; overflow-wrap: anywhere; text-wrap: pretty; }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
</style>
