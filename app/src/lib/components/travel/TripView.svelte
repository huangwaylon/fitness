<script module lang="ts">
  export type Tab = 'days' | 'map' | 'pack' | 'camps';
</script>

<script lang="ts">
  // A trip in the quiet skin (docs/design.md §Trips, level 2; any trip not drawn like its original guide): its pages
  // under one bottom tab bar, 日程 · 地図 (with a route) · キャンプ場 (with campsites) · 持ち物. 日程 opens on the
  // trip's photo (150 px, ‹ ✕ on it; the title, dates, area and days at its foot); scrolled past it, the title bar
  // (‹ the place and its dates ✕) takes its place. Then the day cards (outside the trip all open; during it today's
  // open and in view, the row that is now marked), じゅんび (the logistics cards) and the guide's foot. The other
  // pages have the title bar from the top, the page's name beside the place. `tab` is the sheet's (kept while the
  // app runs). Its private values not in yet (offline), a line says so.
  import { onMount, tick } from 'svelte';
  import type { Trip } from '#lib/travel/types.ts';
  import { privateKeys } from '#lib/travel/tokens.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import SheetHeader from '../quiet/SheetHeader.svelte';
  import TabBar from '../quiet/TabBar.svelte';
  import Icon, { type IconName } from '../quiet/Icon.svelte';
  import Photo from './Photo.svelte';
  import DayCard from './DayCard.svelte';
  import PrepCard from './PrepCard.svelte';
  import CampList from './CampList.svelte';
  import MapPane from './MapPane.svelte';
  import PackList from './PackList.svelte';
  import Txt from './Txt.svelte';
  import { listSpan, shortSpan } from './dates.ts';
  import { pick } from './text.ts';
  import { phaseOf, rowNow, todayDay } from './when.ts';
  import { packing } from './packing.svelte.ts';
  import { dayColor } from './map/types.ts';

  interface Props {
    trip: Trip;
    now: number;
    tab?: Tab;
    onback: () => void;
    onclose: () => void;
  }
  let { trip, now, tab = $bindable('days'), onback, onclose }: Props = $props();

  const note = $derived(packing.note(trip.id));
  const locked = $derived(note === null && privateKeys(JSON.stringify(trip)).length > 0);
  const phase = $derived(phaseOf(trip, now));
  const today = $derived(todayDay(trip, now));
  const mark = $derived(rowNow(trip, now));
  const title = $derived(pick(trip.title, i18n.locale));
  const items = $derived<{ id: Tab; label: string; icon: IconName }[]>([
    { id: 'days', label: t('travel.tab.days'), icon: 'calendar' },
    ...(trip.places.length ? [{ id: 'map' as const, label: t('travel.tab.map'), icon: 'map' as const }] : []),
    ...(trip.camps?.length ? [{ id: 'camps' as const, label: t('travel.tab.camps'), icon: 'tent' as const }] : []),
    { id: 'pack', label: t('travel.tab.pack'), icon: 'backpack' }
  ]);
  const tabName = $derived(items.find((x) => x.id === tab)?.label ?? '');

  let scroller: HTMLElement | undefined = $state();
  let hero: HTMLElement | undefined = $state();
  /** 日程 scrolled past its photo: the title bar shows. */
  let past = $state(false);
  function scrolled() {
    if (!scroller || !hero) return void (past = false);
    past = scroller.scrollTop > hero.offsetHeight - 52;
  }
  /** The camp 地図で見る brings to the map (cleared when the map is left). */
  let focusCamp = $state<string | null>(null);
  /** Another page starts at its top. */
  function pickTab(id: Tab) {
    if (id !== 'map') focusCamp = null;
    tab = id;
    past = false;
    void tick().then(() => scroller?.scrollTo({ top: 0 }));
  }

  // outside the trip every day is open; during it, today's (the others closed); the reader's own after that
  // svelte-ignore state_referenced_locally
  let openDays = $state<number[]>(today ? [today] : trip.days.map((d) => d.n));
  const flip = <T,>(xs: T[], x: T): T[] => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

  // during the trip, today's card comes into view as the trip opens (only then: never at midnight)
  onMount(() => {
    const day = today;
    if (day && tab === 'days')
      void tick().then(() => {
        const el = scroller?.querySelector<HTMLElement>(`[data-day="${day}"]`);
        if (el && scroller) {
          scroller.scrollTop = el.offsetTop - 44 - 12;
          scrolled();
        }
      });
  });
</script>

<div class="trip" data-trip-view={trip.id} data-pane-tab={tab}>
  <div class="hd" class:over={tab === 'days'} class:solid={tab !== 'days' || past}>
    <SheetHeader {title} sub={tab === 'days' ? shortSpan(trip.start, trip.end, i18n.locale) : tabName} {onback} {onclose} sfx="self" over={tab === 'days' && !past} />
  </div>

  <div class="scroll" class:map={tab === 'map'} bind:this={scroller} onscroll={scrolled}>
    {#if tab === 'days'}
      <header class="hero" bind:this={hero}>
        <Photo photo={trip.hero} fill eager />
        <span class="shade" aria-hidden="true"></span>
        <span class="on">
          <span class="ht q-title">{title}{#if phase.k === 'now'}<span class="now" data-trip-status="now">{t('travel.day', { n: phase.day })}</span>{/if}</span>
          <span class="hs">{listSpan(trip.start, trip.end, i18n.locale)} · <Txt l={trip.eyebrow} {note} /></span>
        </span>
      </header>
    {/if}
    {#if locked}<p class="hint" data-locked-hint><Icon name="lock" size={14} /> {t('travel.locked')}</p>{/if}

    <div class="pane" data-pane={tab}>
      {#if tab === 'days'}
        <div class="days">
          {#each trip.days as d (d.n)}
            <DayCard day={d} {note} color={dayColor(trip.dayColors, d.n)} open={openDays.includes(d.n)} today={today === d.n} mark={mark?.day === d.n ? mark : null} ontoggle={() => (openDays = flip(openDays, d.n))} />
          {/each}
        </div>
        {#if trip.logistics.length}
          <h3 class="q-sec" data-prep>{t('travel.prep')}</h3>
          <div class="days">
            {#each trip.logistics as c (c.id)}<PrepCard card={c} {note} />{/each}
          </div>
        {/if}
        {#if trip.foot}<p class="foot guide"><Txt l={trip.foot} {note} /></p>{/if}
      {:else if tab === 'map'}
        <MapPane {trip} {note} start={mark?.day ?? today ?? 1} focus={focusCamp} />
      {:else if tab === 'pack'}
        <PackList {trip} />
      {:else}
        <CampList {trip} {note} onmap={(id) => ((focusCamp = id), pickTab('map'))} />
      {/if}
    </div>
  </div>

  <TabBar {items} value={tab} label={t('travel.tabs')} attr="trip-tab" onpick={pickTab} />
</div>

<style>
  .trip { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; }
  /* the title bar: over the photo on 日程 (its buttons on smoked discs) till the photo scrolls away; in the flow on
     the other pages */
  .hd { flex: none; padding-top: var(--ui-top); position: relative; z-index: 6; background: var(--q-bg); }
  .hd.over { position: absolute; top: 0; left: 0; right: 0; background: none; transition: background-color 160ms; }
  .hd.over :global(.q-hdr) { background: none; }
  .hd.solid { background: var(--q-bg); box-shadow: 0 1px 0 var(--q-hairline); }
  .hd.solid :global(.q-hdr) { background: var(--q-bg); }
  .scroll { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; padding-bottom: 24px; }
  .scroll.map { padding-bottom: 0; }
  /* the photo: 150 px under the status bar, darkened at its foot under the words (white at every time of day) */
  .hero { position: relative; height: calc(150px + var(--ui-top)); overflow: hidden; background: var(--q-sunken); }
  .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgb(20 15 10 / .28) 0%, rgb(20 15 10 / 0) 35%, rgb(20 15 10 / .12) 50%, rgb(20 15 10 / .66) 100%); }
  :global(:root[data-tod='night']) .hero { filter: brightness(.88); }
  .on { position: absolute; left: 16px; right: 16px; bottom: 12px; display: grid; gap: 1px; color: #fff; }
  .ht { display: flex; align-items: center; gap: 8px; font-size: var(--q-fs-title); line-height: 1.2; letter-spacing: .02em; }
  .now { font: var(--q-w-b) var(--q-fs-xs)/1.4 var(--q-font); background: #D2701F; border-radius: 6px; padding: 1px 6px; letter-spacing: .04em; }
  .hs { font-size: var(--q-fs-s); opacity: .92; }
  .hint { margin: 10px 20px 0; display: flex; align-items: center; gap: 6px; font-size: var(--q-fs-s); color: var(--q-muted); }
  .pane { display: grid; grid-template-columns: minmax(0, 1fr); }
  .pane[data-pane='days'], .pane[data-pane='pack'], .pane[data-pane='camps'] { padding: 12px 16px 0; }
  .pane[data-pane='days'] { padding-top: 12px; }
  .days { display: grid; gap: 12px; }
  .foot { margin: 16px 4px 0; font-size: var(--q-fs-s); color: var(--q-muted); }
  /* on 日程 the title bar lies over the content: a card scrolled to stays clear of it */
  .pane :global([data-day]), .pane :global([data-card]) { scroll-margin-top: calc(var(--ui-top) + 56px); }
</style>
