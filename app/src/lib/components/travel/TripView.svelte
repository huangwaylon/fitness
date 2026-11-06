<script lang="ts">
  // A trip (docs/travel.md "The sheet", level 2): the hero photo band (the trip's line, its dates, where it stands),
  // then the pages under a Segmented that stays at the top as the trip scrolls: にってい (the day cards, today's open
  // and in view during the trip, the row that is now marked; then じゅんび, the logistics cards; the guide's foot),
  // ちず (when the trip has a route), もちもの, and キャンプ when it has campsites.
  import { tick } from 'svelte';
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Segmented from '../ui/Segmented.svelte';
  import Photo from './Photo.svelte';
  import DayCard from './DayCard.svelte';
  import GuideCard from './GuideCard.svelte';
  import CampList from './CampList.svelte';
  import MapPane from './MapPane.svelte';
  import PackPane from './PackPane.svelte';
  import Txt from './Txt.svelte';
  import { pick } from './text.ts';
  import { spanLabel } from './dates.ts';
  import { currentRow, phaseOf, todayDay } from './when.ts';
  import { packing } from './packing.svelte.ts';

  type Tab = 'days' | 'map' | 'pack' | 'camps';
  let { trip, now }: { trip: Trip; now: number } = $props();

  const note = $derived(packing.note(trip.id));
  const phase = $derived(phaseOf(trip, now));
  const today = $derived(todayDay(trip, now));
  const nowRow = $derived(currentRow(trip, now));
  const tabs = $derived<{ id: Tab; label: string }[]>([
    { id: 'days', label: t('travel.tab.days') },
    ...(trip.places.length ? [{ id: 'map' as const, label: t('travel.tab.map') }] : []),
    { id: 'pack', label: t('travel.tab.pack') },
    ...(trip.camps?.length ? [{ id: 'camps' as const, label: t('travel.tab.camps') }] : [])
  ]);
  let tab = $state<Tab>('days');
  let tabsEl: HTMLElement | undefined = $state();
  /** Another page: it starts at its top, under the tabs (when they were stuck at the scroller's top). */
  function pickTab(id: Tab) {
    const box = tabsEl?.getBoundingClientRect(), scroller = tabsEl?.closest('[data-travel]')?.getBoundingClientRect();
    const stuck = !!box && !!scroller && box.top <= scroller.top + 1;
    tab = id;
    if (stuck) void tick().then(() => tabsEl?.closest('[data-travel]')?.scrollTo({ top: (root?.querySelector<HTMLElement>('.hero')?.offsetHeight ?? 0) + 12 }));
  }

  // today's card open as the trip opens (the others closed); the reader's own opening and closing after that
  // svelte-ignore state_referenced_locally
  let openDays = $state<number[]>(today ? [today] : []);
  let openCards = $state<string[]>([]);
  const flip = <T,>(xs: T[], x: T): T[] => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

  let root: HTMLElement | undefined = $state();
  // during the trip, today's card comes into view under the tabs as the trip opens
  $effect(() => {
    if (!root || !today) return;
    void tick().then(() => root?.querySelector<HTMLElement>(`[data-day="${today}"]`)?.scrollIntoView({ block: 'start' }));
  });

  const status = $derived(
    phase.k === 'soon' ? (phase.days === 1 ? t('travel.tomorrowAria') : t('travel.soonAria', { n: phase.days })) : phase.k === 'now' ? t('travel.nowAria', { n: phase.day }) : t('travel.memories')
  );
</script>

<div class="trip" bind:this={root} data-trip-view={trip.id}>
  <header class="hero">
    <Photo photo={trip.hero} fill eager />
    <span class="shade" aria-hidden="true"></span>
    <span class="on">
      <span class="status {phase.k}" data-trip-status={phase.k}>{status}</span>
      <span class="eyebrow guide">{pick(trip.eyebrow, i18n.locale)}</span>
      <span class="sub guide">{pick(trip.sub, i18n.locale)}</span>
      <span class="sr-only">{spanLabel(trip.start, trip.end, i18n.locale)}</span>
    </span>
  </header>

  <div class="tabs" bind:this={tabsEl}>
    <Segmented items={tabs} value={tab} label={t('travel.tabs')} attr="trip-tab" onpick={pickTab} />
  </div>

  <div class="pane" data-pane={tab}>
    {#if tab === 'days'}
      {#each trip.days as d (d.n)}
        <DayCard day={d} {note} open={openDays.includes(d.n)} today={today === d.n} now={nowRow?.day === d.n ? nowRow.i : null} ontoggle={() => (openDays = flip(openDays, d.n))} />
      {/each}
      {#if trip.logistics.length}
        <h3 class="sec-label" data-prep>{t('travel.prep')}</h3>
        {#each trip.logistics as c (c.id)}
          <GuideCard card={c} {note} open={openCards.includes(c.id)} ontoggle={() => (openCards = flip(openCards, c.id))} />
        {/each}
      {/if}
      {#if trip.foot}<p class="foot guide"><Txt l={trip.foot} {note} /></p>{/if}
    {:else if tab === 'map'}
      <MapPane {trip} {note} start={nowRow?.day ?? today ?? 1} />
    {:else if tab === 'pack'}
      <PackPane {trip} {note} />
    {:else}
      <CampList {trip} {note} />
    {/if}
  </div>
</div>

<style>
  .trip { display: grid; gap: 12px; }
  /* the hero: the trip's photo in a band, darkened at its foot under the words (cream on it at every time of day) */
  .hero { position: relative; height: 176px; border-radius: var(--r-card); overflow: hidden; background: var(--hl); box-shadow: var(--sh-lip); }
  .shade { position: absolute; inset: 0; background: linear-gradient(transparent 20%, rgb(40 30 20 / .45) 55%, rgb(40 30 20 / .78)); }
  .on { position: absolute; left: 14px; right: 14px; bottom: 12px; display: grid; justify-items: start; gap: 2px; color: var(--c-cream); text-shadow: 0 1px 2px rgb(0 0 0 / .35); }
  .status {
    margin-bottom: 4px; padding: 3px 10px; border-radius: var(--r-pill); text-shadow: none;
    background: var(--c-cream); color: var(--c-ink); font: 700 var(--fs-s)/1.3 var(--font-ui); box-shadow: 0 2px 0 var(--c-lip);
  }
  .status.now { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .eyebrow { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .sub { font: 500 var(--fs-s)/1.35 var(--font-ui); opacity: .95; }
  /* the pages' switch stays at the top of the scroller (the paper behind it) */
  .tabs { position: sticky; top: 0; z-index: 2; margin: 0 -8px; padding: 4px 8px 8px; background: linear-gradient(var(--surface) 82%, transparent); }
  .pane { display: grid; gap: 12px; }
  .pane > :global(.card[data-day]), .pane > :global(.card[data-card]) { scroll-margin-top: 68px; }
  .foot { margin: 0 4px; font: 500 var(--fs-xs)/1.5 var(--font-ui); color: var(--text-soft); }
</style>
