<script module lang="ts">
  export type Tab = 'days' | 'map' | 'camps' | 'pack';
</script>

<script lang="ts">
  // A trip on the unified kit (docs/design.md §Trips, level 2): its pages under one TabBar, 日程 · 地図 (with a
  // route) · キャンプ場 (with campsites: Okinawa's) · 持ち物 (frozen once the trip is over: when.ts readOnly). 日程 opens on the trip's photo (PhotoBand, 150 px, ‹ ✕ on it; the
  // title, dates, area at its foot), then its one control row, held under the title bar as the page scrolls: a chip a
  // day (its route colour, the date; the shown one yuzu) and 準備, then the day shown (DayCard: its timeline, the row
  // that is now marked) or the logistics cards (PrepCard) and the guide's foot. Scrolled past the photo, the title bar
  // (‹ the place ✕) takes its place. The day shown at first: the one that is now (today's, or the day of the row on
  // now), else the first. The other pages have the title bar from the top, the page's name after the place. `tab` is
  // the sheet's (kept while the app runs). Its private values not in yet (offline), a line says so.
  import { onMount, tick, untrack } from 'svelte';
  import type { Trip } from '#lib/travel/types.ts';
  import { privateKeys } from '#lib/travel/tokens.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import PhotoBand from '../ui/PhotoBand.svelte';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Icon, { type IconName } from '../ui/Icon.svelte';
  import DayCard from './DayCard.svelte';
  import PrepCard from './PrepCard.svelte';
  import MapPane from './MapPane.svelte';
  import PackList from './PackList.svelte';
  import CampList from './CampList.svelte';
  import Txt from './Txt.svelte';
  import { listSpan } from './dates.ts';
  import { md } from '#lib/i18n/format.ts';
  import { pick } from './text.ts';
  import { phaseOf, rowNow, todayDay } from './when.ts';
  import { packing } from './packing.svelte.ts';
  import { dayColor } from './map/types.ts';
  import { staticUrl } from '#lib/staticUrl.ts';

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
  const hasPrep = $derived(trip.logistics.length > 0 || !!trip.foot);

  /** Before the trip, 準備 first (its chip leading the days, the page opening on it): what to do now. */
  const prepFirst = $derived(hasPrep && phase.k === 'soon');
  /** The day on 日程 (its `n`), or 準備. */
  let shown = $state<number | 'prep'>(untrack(() => mark?.day ?? today ?? (prepFirst ? 'prep' : (trip.days[0]?.n ?? 1))));
  const day = $derived(shown === 'prep' ? null : (trip.days.find((d) => d.n === shown) ?? null));

  let scroller: HTMLElement | undefined = $state();
  let hero: HTMLElement | undefined = $state();
  let bar: HTMLElement | undefined = $state();
  /** How far 日程 scrolls before its photo is gone under the title bar. */
  const heroEnd = () => (hero && bar ? hero.offsetHeight - bar.offsetHeight : 0);
  /** 日程 scrolled past its photo: the title bar shows. */
  let past = $state(false);
  function scrolled() {
    past = !!scroller && !!hero && scroller.scrollTop > heroEnd();
  }
  /** Another page starts at its top. */
  function pickTab(id: Tab) {
    tab = id;
    past = false;
    void tick().then(() => scroller?.scrollTo({ top: 0 }));
  }
  /** Another day (or 準備) from its top, the control row where it was. */
  function pickDay(d: number | 'prep') {
    shown = d;
    if (scroller && scroller.scrollTop > heroEnd()) scroller.scrollTop = heroEnd();
  }

  // during the trip, the row that is now comes into view as the trip opens (only then: never at midnight)
  onMount(() => {
    if (!mark || tab !== 'days') return;
    void tick().then(() => {
      const el = scroller?.querySelector<HTMLElement>('[data-now], [data-next]');
      if (!el || !scroller) return;
      const box = scroller.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (r.bottom > box.bottom - 16) scroller.scrollTop += r.bottom - box.bottom + box.height / 3;
      scrolled();
    });
  });
</script>

{#snippet prepChip()}<Chip label={t('travel.prep')} selected={shown === 'prep'} data-day-pick="prep" onclick={() => pickDay('prep')} />{/snippet}

<div class="trip" data-trip-view={trip.id} data-pane-tab={tab}>
  <div class="hd" class:over={tab === 'days'} class:solid={tab !== 'days' || past} bind:this={bar}>
    <NavBar pad title={tab === 'days' ? title : `${title} · ${tabName}`} {onback} {onclose} over={tab === 'days' && !past} />
  </div>

  <div class="scroll" class:map={tab === 'map'} bind:this={scroller} onscroll={scrolled}>
    {#if tab === 'days'}
      <div class="hero" bind:this={hero}>
        <PhotoBand src={staticUrl(trip.hero.src)} alt={pick(trip.hero.alt, i18n.locale)} height={150} edge>
          <span class="ht">{title}{#if phase.k === 'now'}<span class="sticker" data-trip-status="now">{t('travel.day', { n: phase.day })}</span>{/if}</span>
          <span class="hs">{listSpan(trip.start, trip.end, i18n.locale)} · <Txt l={trip.eyebrow} {note} /></span>
        </PhotoBand>
      </div>
      <div class="ctl">
        <ChipRow label={t('travel.tab.days')}>
          {#if prepFirst}{@render prepChip()}{/if}
          {#each trip.days as d (d.n)}
            <Chip label={t('travel.day', { n: d.n })} count={md(d.date)} dot={dayColor(trip.dayColors, d.n)} selected={shown === d.n} data-day-pick={d.n} onclick={() => pickDay(d.n)} />
          {/each}
          {#if hasPrep && !prepFirst}{@render prepChip()}{/if}
        </ChipRow>
      </div>
    {/if}
    {#if locked}<p class="hint" data-locked-hint><Icon name="lock" size={14} /> {t('travel.locked')}</p>{/if}

    <div class="pane" data-pane={tab}>
      {#if tab === 'days'}
        {#if day}
          <DayCard {day} {note} color={dayColor(trip.dayColors, day.n)} today={today === day.n} mark={mark?.day === day.n ? mark : null} />
        {:else}
          <div class="cards" data-prep>
            {#each trip.logistics as c (c.id)}<PrepCard card={c} {note} />{/each}
          </div>
          {#if trip.foot}<p class="foot guide"><Txt l={trip.foot} {note} /></p>{/if}
        {/if}
      {:else if tab === 'map'}
        <MapPane {trip} {note} start={mark?.day ?? today ?? 1} />
      {:else if tab === 'camps'}
        <CampList {trip} {note} />
      {:else}
        <PackList {trip} />
      {/if}
    </div>
  </div>

  <TabBar {items} value={tab} label={t('travel.tabs')} attr="trip-tab" onpick={pickTab} />
</div>

<style>
  .trip { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; }
  /* the title bar: over the photo on 日程 (‹ ✕ the app's discs) till the photo scrolls away; in the flow on the other
     pages */
  .hd { flex: none; position: relative; z-index: 6; background: var(--surface); }
  .hd.over { position: absolute; top: 0; left: 0; right: 0; background: none; transition: background-color var(--dur-quick); }
  .hd.solid { background: var(--surface); box-shadow: 0 var(--lip-s) 0 var(--lip); }
  .scroll { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; padding-bottom: 24px; }
  .scroll.map { padding-bottom: 0; }
  /* the photo's foot: the place (white at every time of day), its dates and area */
  .ht { display: flex; align-items: center; gap: 8px; font: 700 var(--fs-title)/1.2 var(--font-ui); letter-spacing: .02em; }
  .ht .sticker { text-shadow: none; }
  .hs { display: block; font-size: var(--fs-s); opacity: .95; }
  /* the one control row: held under the title bar (which lies over the page here) */
  .ctl { position: sticky; top: calc(var(--ui-top) + 48px); z-index: 4; background: var(--surface); padding: 4px 0 2px; }
  .hint { margin: 8px 16px 0; display: flex; align-items: center; gap: 6px; font-size: var(--fs-s); color: var(--text-soft); }
  .pane { display: grid; grid-template-columns: minmax(0, 1fr); }
  .pane[data-pane='days'], .pane[data-pane='camps'], .pane[data-pane='pack'] { padding: 6px 12px 0; }
  .cards { display: grid; gap: 8px; }
  .foot { margin: 14px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
</style>
