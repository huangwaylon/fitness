<script module lang="ts">
  export type Tab = 'days' | 'map' | 'prep' | 'pack';
</script>

<script lang="ts">
  // A trip on the unified kit (docs/design.md §Trips, level 2): its pages under one TabBar, 日程 · 地図 (AllDaysMap: the
  // whole trip; a trip without a map says so there) · 準備 · 持ち物 (frozen once the trip is over: when.ts readOnly),
  // the title bar (‹ the place ✕) over them all. 日程 is every day on one page (Itinerary: a boarding pass a day, the line we're heading to lit during the trip, the page
  // opening on it); 準備 the logistics cards (PrepCard), a trip's campsites (Okinawa's: CampList) and the guide's foot.
  // 日程 and 地図 hand each other a day and a stop (lib/travel/itinerary.ts MapTabProps): 地図 opens on the day being
  // read (the stub at the top), 地図で見る on a stop opens it on that stop, and the map's 日程で見る comes back to the
  // stop's line, opened. Back on 日程 from another page, it is where it was left. `tab` is the sheet's (kept while the
  // app runs). Its private values not in yet (offline), a line says so.
  import { tick, untrack } from 'svelte';
  import type { Trip } from '#lib/travel/types.ts';
  import { itinerary, type MapTabProps, guideLocale } from '#lib/travel/itinerary.ts';
  import { privateKeys } from '#lib/travel/tokens.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import Icon, { type IconName } from '../ui/Icon.svelte';
  import Itinerary from './Itinerary.svelte';
  import PrepCard from './PrepCard.svelte';
  import AllDaysMap from './whole/AllDaysMap.svelte';
  import { PlacesLayer } from '../map/places/layer.svelte.ts';
  import PackList from './PackList.svelte';
  import CampList from './CampList.svelte';
  import Txt from './Txt.svelte';
  import { pick } from './text.ts';
  import { todayDay } from './when.ts';
  import { packing } from './packing.svelte.ts';

  interface Props {
    trip: Trip;
    now: number;
    tab?: Tab;
    onback: () => void;
    onclose: () => void;
    /** The map made (true) and let go with this view (false): the sheet keeps no map once closed. */
    onmapped?: (on: boolean) => void;
  }
  let { trip, now, tab = $bindable('days'), onback, onclose, onmapped }: Props = $props();

  const note = $derived(packing.note(trip.id));
  const locked = $derived(note === null && privateKeys(JSON.stringify(trip)).length > 0);
  const title = $derived(pick(trip.title, i18n.locale));
  const hasMap = $derived(trip.places.length > 0);
  const hasPrep = $derived(trip.logistics.length > 0 || !!trip.camps?.length || !!trip.foot);
  const items = $derived<{ id: Tab; label: string; icon: IconName }[]>([
    { id: 'days', label: t('travel.tab.days'), icon: 'calendar' },
    { id: 'map', label: t('travel.tab.map'), icon: 'map' },
    ...(hasPrep ? [{ id: 'prep' as const, label: t('travel.prep'), icon: 'clipboard' as const }] : []),
    { id: 'pack', label: t('travel.tab.pack'), icon: 'backpack' }
  ]);
  const tabName = $derived(items.find((x) => x.id === tab)?.label ?? '');

  let scroller: HTMLElement | undefined = $state();
  let list: ReturnType<typeof Itinerary> | undefined = $state();
  /** The day at the top of 日程 (today's, during the trip, till it scrolls). */
  let viewDay = $state(untrack(() => todayDay(trip, now) ?? trip.days[0]?.n ?? 1));
  /** 日程's scroll when another page was picked (null: not left yet; it opens on the lit line). */
  let daysTop = $state<number | null>(null);

  /** What 地図 shows (MapTabProps): the day, the stop, and the way back to 日程. The map is made the first time 地図
   *  shows and kept (hidden on the other pages: never rebuilt), between the title bar and the tab bar. */
  let mapDay = $state<number | null>(untrack(() => viewDay));
  let mapStop = $state<string | null>(null);
  let mapMade = $state(false);
  $effect(() => {
    if (tab !== 'map') return;
    mapMade = true;
  });
  $effect(() => {
    if (!mapMade) return;
    untrack(() => onmapped?.(true));
    return () => untrack(() => onmapped?.(false));
  });
  const itin = $derived(itinerary(trip, i18n.locale));
  const mapProps: MapTabProps = $derived({
    trip,
    itinerary: itin,
    day: mapDay,
    stop: mapStop,
    onday: (d) => (mapDay = d),
    onlist: (id) => void toList(id)
  });

  function leave(id: Tab) {
    if (tab === 'days' && id !== 'days' && scroller) daysTop = scroller.scrollTop;
    // (the stop handed over is spent once 地図 is left: 地図で見る on the same stop again rings it again)
    if (tab === 'map' && id !== 'map') mapStop = null;
    tab = id;
  }
  /** Another page; 地図 on the day being read, 日程 where it was left, the others from their top. */
  function pickTab(id: Tab) {
    if (id === tab) return;
    if (id === 'map') ((mapDay = viewDay), (mapStop = null));
    leave(id);
    if (id !== 'days') void tick().then(() => scroller?.scrollTo({ top: 0 }));
  }
  /** 地図で見る: 地図 on the stop. */
  function toMap(id: string, day: number) {
    mapDay = day;
    mapStop = id;
    leave('map');
  }
  /** 日程で見る (the map's): 日程, scrolled to the stop's line, opened. */
  async function toList(id: string) {
    leave('days');
    await tick();
    list?.show(id);
  }

  let pane: { escape(): boolean } | undefined = $state();
  /** 地図's saved places (the app's alone: /s never makes the layer, so never loads the places' store). */
  const placesOf = (path: () => [number, number][] | null) => new PlacesLayer(path);
  /** Esc: 地図's stop card closes (true), else the sheet's own Esc. */
  export const escape = (): boolean => tab === 'map' && !!pane?.escape();
</script>

<div class="trip" data-trip-view={trip.id} data-pane-tab={tab}>
  <div class="hd">
    <NavBar pad title={tab === 'days' ? title : `${title} · ${tabName}`} {onback} {onclose} />
  </div>

  <div class="mid">
    <div class="scroll sheet-scroll" class:map={tab === 'map'} bind:this={scroller}>
      {#if locked}<p class="hint" data-locked-hint><Icon name="lock" size={14} /> {t('travel.locked')}</p>{/if}

      <div class="pane" data-pane={tab}>
        {#if tab === 'days'}
          <Itinerary bind:this={list} bind:viewDay {trip} {note} {now} {scroller} at={daysTop} onmap={hasMap ? toMap : null} />
        {:else if tab === 'prep'}
          <div class="cards" data-prep>
            {#each trip.logistics as c (c.id)}<PrepCard card={c} {note} />{/each}
          </div>
          {#if trip.camps?.length}
            <h2 class="sh">{t('travel.tab.camps')}</h2>
            <CampList {trip} {note} />
          {/if}
          {#if trip.foot}<p class="foot guide"><Txt l={trip.foot} {note} /></p>{/if}
        {:else if tab === 'pack'}
          <PackList {trip} />
        {/if}
      </div>
    </div>

    {#if mapMade}
      <div class="whole" class:on={tab === 'map'}><AllDaysMap bind:this={pane} {...mapProps} active={tab === 'map'} locale={guideLocale(trip, i18n.locale)} {note} places={placesOf} /></div>
    {/if}
  </div>
  <TabBar {items} value={tab} label={t('travel.tabs')} attr="trip-tab" onpick={pickTab} />
</div>

<style>
  .trip { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; }
  .hd { flex: none; position: relative; z-index: 6; background: var(--surface); box-shadow: 0 var(--lip-s) 0 var(--lip); }
  .scroll { padding-bottom: 24px; }
  .scroll.map { padding-bottom: 0; }
  .hint { margin: 8px 16px 0; display: flex; align-items: center; gap: 6px; font-size: var(--fs-s); color: var(--text-soft); }
  .pane { display: grid; grid-template-columns: minmax(0, 1fr); }
  .pane[data-pane='prep'], .pane[data-pane='pack'] { padding: 6px 12px 0; }
  .cards { display: grid; gap: 8px; }
  .sh { margin: 18px 4px 8px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .foot { margin: 14px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
  /* 地図's host: kept once made, hidden (never display: none: the map keeps its size) on the other pages */
  .mid { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; }
  .whole { position: absolute; inset: 0; z-index: 3; visibility: hidden; pointer-events: none; }
  .whole.on { visibility: visible; pointer-events: auto; }
</style>
