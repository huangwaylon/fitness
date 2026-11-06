<script lang="ts">
  // A past trip as the old travel-plans site showed it (docs/travel.md "Classic guides"): Okinawa and Seattle, their
  // own look and palette (classic.css, all under .classic), their own screen over the app. The itinerary (the hero
  // photo with its back button, the day cards on the spine, the logistics cards, the footer), the map (Okinawa's: the
  // app's live map in the site's map card, CMap), the campsites (the one-criterion filter, the 26 cards, a card in the
  // bottom sheet from a map pin) and the packing list, frozen: the trip's own list as it was, no boxes, no edits,
  // nothing read from or sent to the relay. The bottom tab bar picks the view, each starting at its top. The guide's
  // own words are in its language (Seattle's English), the tabs and the back button in the reader's.
  //   <ClassicGuide {trip} onback={…} />
  import '#lib/i18n/travel.ts';
  import './classic.css';
  import { tick } from 'svelte';
  import { asset } from '$app/paths';
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import CText from './CText.svelte';
  import CIcon from './CIcon.svelte';
  import CDay from './CDay.svelte';
  import CCard from './CCard.svelte';
  import CCampBody from './CCampBody.svelte';
  import CMap from './CMap.svelte';
  import { CAMP_FILTERS, campShown, frozenPack, guideLang, viewsOf, type CampFilter, type View } from './guide.ts';
  import { pick } from '../text.ts';
  import { packing } from '../packing.svelte.ts';

  let { trip, onback }: { trip: Trip; onback?: () => void } = $props();

  /** Where the hero photo sits in its band (the site's --hero-pos). */
  const HERO_POS: Record<string, string> = { okinawa: '50% 52%', seattle: '50% 38%' };
  const TAB_ICON: Record<View, string> = { itinerary: 'calendar', map: 'map', camps: 'tent', packing: 'backpack' };

  const note = $derived(packing.note(trip.id));
  const lang = $derived(guideLang(trip, i18n.locale));
  const views = $derived(viewsOf(trip));
  const pack = $derived(frozenPack(trip.packing));
  let view = $state<View>('itinerary');
  let filter = $state<CampFilter>('all');
  let scroller: HTMLElement | undefined = $state();

  function show(v: View) {
    view = v;
    void tick().then(() => scroller?.scrollTo({ top: 0 }));
  }

  /** The campsite whose card is up (a map pin), and what had the focus before. */
  let campId = $state<string | null>(null);
  const camp = $derived(campId ? (trip.camps?.find((c) => c.id === campId) ?? null) : null);
  let sheet: HTMLElement | undefined = $state();
  let was: HTMLElement | null = null;
  function openCamp(id: string) {
    was = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    campId = id;
    void tick().then(() => sheet?.focus({ preventScroll: true }));
  }
  function closeCamp() {
    campId = null;
    if (was?.isConnected) was.focus({ preventScroll: true });
    was = null;
  }
  /** Esc closes the card, not the sheet the guide is in. */
  function sheetKey(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    closeCamp();
  }
</script>

<div class="classic t-{trip.id}" data-classic={trip.id} data-view={view} style:--hero-pos={HERO_POS[trip.id] ?? '50% 50%'}>
  <div class="scroller" bind:this={scroller} inert={!!camp}>
    <article class="guide">
      {#if view === 'itinerary' && onback}
        <button class="backbtn" type="button" data-sfx="back" data-classic-back onclick={onback}><CIcon name="arrow-left" /><span>{t('travel.classic.back')}</span></button>
      {/if}
      <div class="views">
        <section class="view v-itinerary" hidden={view !== 'itinerary'} data-classic-view="itinerary">
          <header class="hero">
            <img class="hero-img" src={asset(trip.hero.src as Parameters<typeof asset>[0])} alt="" decoding="async" />
            <div class="scrim"></div>
            <div class="htext">
              <span class="eyebrow"><CText l={trip.eyebrow} {note} /></span>
              <h1><CText l={trip.title} {note} /> {trip.start.slice(0, 4)}</h1>
              <p class="sub"><CText l={trip.sub} {note} /></p>
            </div>
          </header>
          <div class="spine days">
            {#each trip.days as d (d.n)}<CDay day={d} {note} {lang} />{/each}
          </div>
          {#if trip.logistics.length}
            <h2 class="section" lang={lang}><CIcon name="info" /><span>{t('travel.classic.logistics', undefined, lang)}</span></h2>
            <div class="spine">
              {#each trip.logistics as c (c.id)}<CCard card={c} {note} />{/each}
            </div>
          {/if}
          {#if trip.foot}<div class="footer"><CText l={trip.foot} {note} /></div>{/if}
        </section>

        {#if view === 'map'}
          <section class="view v-map" data-classic-view="map"><CMap {trip} {note} oncamp={openCamp} /></section>
        {/if}

        {#if trip.camps?.length}
          {@const camps = trip.camps}
          <section class="view v-camps" hidden={view !== 'camps'} data-classic-view="camps">
            <h2 class="section" lang={lang}><CIcon name="tent" /><span id="classic-camps-h-{trip.id}">{t('travel.classic.campsites', undefined, lang)}</span></h2>
            {#if trip.campsIntro}<p class="intro"><CText l={trip.campsIntro} {note} /></p>{/if}
            <div class="filters camp-filters" role="group" aria-labelledby="classic-camps-h-{trip.id}" lang={lang}>
              {#each CAMP_FILTERS as f (f)}
                <button type="button" data-filter={f} class:active={filter === f} aria-pressed={filter === f} data-sfx="tick" onclick={() => (filter = f)}>{t(`travel.classic.camps.${f}`, { n: camps.length }, lang)}</button>
              {/each}
            </div>
            <div class="spine camp-list">
              {#each camps as c (c.id)}
                <details class="ccard camp {c.type}" hidden={!campShown(c, filter)} data-camp={c.id}>
                  <summary class="head" data-sfx="page">
                    <span class="node"></span>
                    <span class="gly"><CIcon name="tent" /></span>
                    <div class="ttl"><div class="t"><CText l={c.name} {note} /></div><div class="sub2"><CText l={c.sub} {note} /></div></div>
                    <span class="chev"><CIcon name="chevron-right" /></span>
                  </summary>
                  <div class="content"><CCampBody camp={c} {note} {lang} /></div>
                </details>
              {/each}
            </div>
            {#if trip.campsFoot}<div class="footer"><CText l={trip.campsFoot} {note} /></div>{/if}
          </section>
        {/if}

        <section class="view v-packing" hidden={view !== 'packing'} data-classic-view="packing">
          <h2 class="section" lang={lang}><CIcon name="backpack" /><span>{t('travel.classic.packing', undefined, lang)}</span></h2>
          <div class="packlist" data-frozen>
            {#each pack as c (c.id)}
              <div class="group" data-cat={c.id}>
                <div class="glabel"><span class="gicon"><CIcon name={c.icon} /></span><span class="gname"><CText l={c.name} {note} /></span><span class="ct">{c.items.length}</span></div>
                {#each c.items as it (it.id)}
                  <div class="packrow" data-item={it.id}><span class="ctxt"><CText l={it.text} {note} />{#if it.note}<small><CText l={it.note} {note} /></small>{/if}</span></div>
                {/each}
              </div>
            {/each}
          </div>
        </section>
      </div>
    </article>
  </div>

  <nav class="tabbar" inert={!!camp}>
    <div class="tabbar-inner" role="tablist" aria-label={pick(trip.title, i18n.locale)}>
      {#each views as v (v)}
        <button type="button" class="tabbtn" role="tab" aria-selected={view === v} data-classic-tab={v} data-sfx="tick" onclick={() => show(v)}><CIcon name={TAB_ICON[v]} cls="ic-tab" /><span class="lb">{t(`travel.classic.tab.${v}`)}</span></button>
      {/each}
    </div>
  </nav>

  {#if camp}
    <div class="camp-sheet" data-classic-camp={camp.id}>
      <!-- the scrim closes it, as the ✕ does (a tap on the dimmed guide; the ✕ and Esc are the keyboard's way) -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="scrim" data-sfx="back" onclick={closeCamp} aria-hidden="true"></div>
      <div class="sheet-card" role="dialog" aria-modal="true" aria-label={pick(camp.name, i18n.locale)} tabindex="-1" bind:this={sheet} onkeydown={sheetKey}>
        <div class="sheet-head">
          <div class="ttl"><div class="t"><CText l={camp.name} {note} /></div><div class="sub2"><CText l={camp.sub} {note} /></div></div>
          <button class="icon-btn sheet-x" type="button" data-sfx="back" data-classic-close onclick={closeCamp}><CIcon name="x" /><span class="sr">{t('travel.classic.close')}</span></button>
        </div>
        <div class="sheet-body"><CCampBody {camp} {note} {lang} /></div>
      </div>
    </div>
  {/if}
</div>
