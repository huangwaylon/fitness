<script module lang="ts">
  export type ShareTab = 'days' | 'map' | 'prep' | 'pack';
</script>

<script lang="ts">
  // A shared trip as its visitor sees it (`/s#<token>`, docs/travel.md "Sharing"): TripView's pages without what is
  // ours alone. 日程 (Itinerary: every day, the line we're heading to lit by the trip's clock), 地図 (AllDaysMap, its own
  // chunk, MapLibre another, made the first time 地図 shows and kept: never the saved places, the visitor isn't our
  // user), 準備 (the logistics cards and a trip's
  // campsites). A `trips` link's trip (`shared`: the relay's snapshot of it) adds 持ち物 (PackShare: read-only, never the
  // packing store) and its note's free values in 準備's メモ card (redacted: Redacted's 🔒); a v1 `trip` link's (`shared`
  // null) has neither. `note` is null either way, so every {p:} value is 🔒 (i18n/link.ts: 非公開) and a private link a
  // locked chip. ‹ back to the list (a `trips` link's); the title bar holds the language switch. The foot: whose guide
  // it is and until when the link works.
  import { tick } from 'svelte';
  import type { Trip } from '#lib/travel/types.ts';
  import type { SharedTrip } from '#lib/contract/share.ts';
  import { privateKeys } from '#lib/travel/tokens.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import Icon, { type IconName } from '../ui/Icon.svelte';
  import Itinerary from '../travel/Itinerary.svelte';
  import PrepCard from '../travel/PrepCard.svelte';
  import Txt from '../travel/Txt.svelte';
  import Lazy from '../ui/Lazy.svelte';
  import { pick } from '../travel/text.ts';
  import { todayDay } from '../travel/when.ts';
  import { itinerary, guideLocale } from '#lib/travel/itinerary.ts';
  import LangSwitch from './LangSwitch.svelte';
  import { untilDate } from './until.ts';
  import Redacted from './Redacted.svelte';

  interface Props {
    trip: Trip;
    now: number;
    exp: string;
    /** A `trips` link's data for this trip (null: a v1 `trip` link, no 持ち物 or notes). */
    shared?: SharedTrip | null;
    onback?: (() => void) | null;
  }
  let { trip, now, exp, shared = null, onback = null }: Props = $props();

  const note = null;
  const locked = $derived(privateKeys(JSON.stringify(trip)).length > 0);
  const title = $derived(pick(trip.title, i18n.locale));
  const notes = $derived(shared?.notes ?? []);
  const hasPrep = $derived(trip.logistics.length > 0 || !!trip.camps?.length || !!trip.foot || notes.length > 0);
  const items = $derived<{ id: ShareTab; label: string; icon: IconName }[]>([
    { id: 'days', label: t('travel.tab.days'), icon: 'calendar' },
    { id: 'map', label: t('travel.tab.map'), icon: 'map' },
    ...(hasPrep ? [{ id: 'prep' as const, label: t('travel.prep'), icon: 'clipboard' as const }] : []),
    ...(shared ? [{ id: 'pack' as const, label: t('travel.tab.pack'), icon: 'backpack' as const }] : [])
  ]);
  let tab = $state<ShareTab>('days');
  const tabName = $derived(items.find((x) => x.id === tab)?.label ?? '');

  let scroller: HTMLElement | undefined = $state();
  let viewDay = $state(1);
  let daysTop = $state<number | null>(null);
  /** 地図: on the day being read (today's during the trip before 日程 scrolled), kept once made, between the bars. */
  let mapDay = $state<number | null>(null);
  let mapMade = $state(false);
  const itin = $derived(itinerary(trip, i18n.locale));
  function pickTab(id: ShareTab) {
    if (id === tab) return;
    if (tab === 'days' && scroller) daysTop = scroller.scrollTop;
    if (id === 'map') ((mapDay = daysTop === null ? (todayDay(trip, now) ?? 1) : viewDay), (mapMade = true));
    tab = id;
    if (id !== 'days') void tick().then(() => scroller?.scrollTo({ top: 0 }));
  }
</script>

{#snippet lang()}<LangSwitch />{/snippet}
{#snippet foot()}
  <footer class="foot" data-share-foot>
    {#if locked}<p data-share-private><Icon name="lock" size={14} /> {t('link.privateHint')}</p>{/if}
    <p>{t('link.foot', { date: untilDate(exp, i18n.locale) })}</p>
  </footer>
{/snippet}

<div class="trip" data-share-trip={trip.id} data-pane-tab={tab}>
  <div class="hd">
    <NavBar pad title={tab === 'days' ? title : `${title} · ${tabName}`} {onback} trailing={lang} />
  </div>

  <div class="mid">
    <div class="scroll sheet-scroll" class:map={tab === 'map'} bind:this={scroller}>
      <div class="pane" data-pane={tab}>
        {#if tab === 'days'}
          <Itinerary bind:viewDay {trip} {note} {now} {scroller} at={daysTop} />
          {@render foot()}
        {:else if tab === 'prep'}
          <div class="cards" data-prep>
            {#if notes.length}
              <section class="card pad notes" data-share-notes aria-labelledby="share-notes">
                <h3 id="share-notes" class="nh"><Icon name="edit" size={16} />{t('link.notes')}</h3>
                {#each notes as n, i (i)}<p class="guide"><Redacted s={n} /></p>{/each}
              </section>
            {/if}
            {#each trip.logistics as c (c.id)}<PrepCard card={c} {note} />{/each}
          </div>
          {#if trip.camps?.length}
            <h2 class="sh">{t('travel.tab.camps')}</h2>
            <Lazy load={() => import('../travel/CampList.svelte')}>{#snippet children(CampList)}<CampList {trip} {note} />{/snippet}</Lazy>
          {/if}
          {#if trip.foot}<p class="tfoot guide"><Txt l={trip.foot} {note} /></p>{/if}
          {@render foot()}
        {:else if tab === 'pack'}
          <Lazy load={() => import('./PackShare.svelte')}>{#snippet children(PackShare)}<PackShare {trip} shared={shared ?? undefined} />{/snippet}</Lazy>
        {/if}
      </div>
    </div>

    {#if mapMade}
      <div class="whole" class:on={tab === 'map'}>
        <Lazy load={() => import('../travel/whole/AllDaysMap.svelte')}>{#snippet children(AllDaysMap)}<AllDaysMap {trip} itinerary={itin} day={mapDay} stop={null} active={tab === 'map'} locale={guideLocale(trip, i18n.locale)} onday={(d) => (mapDay = d)} onlist={() => (tab = 'days')} />{/snippet}</Lazy>
      </div>
    {/if}
  </div>
  <TabBar {items} value={tab} label={t('link.tabs')} attr="trip-tab" onpick={pickTab} />
</div>

<style>
  .trip { height: var(--vh-fill); display: flex; flex-direction: column; position: relative; background: var(--surface); }
  .hd { flex: none; position: relative; z-index: 6; background: var(--surface); box-shadow: 0 var(--lip-s) 0 var(--lip); }
  .scroll { padding-bottom: 24px; }
  .scroll.map { padding-bottom: 0; }
  .pane { display: grid; grid-template-columns: minmax(0, 1fr); }
  .pane[data-pane='prep'], .pane[data-pane='pack'] { padding: 6px 12px 0; }
  .notes { display: grid; gap: 6px; }
  .notes .nh { margin: 0; display: flex; align-items: center; gap: 6px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .notes p { margin: 0; font-size: var(--fs-body); line-height: 1.5; }
  .cards { display: grid; gap: 8px; }
  .sh { margin: 18px 4px 8px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .tfoot { margin: 14px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
  .foot { margin: 18px 4px 0; font-size: var(--fs-s); color: var(--text-soft); text-align: center; }
  .foot p { margin: 4px 0; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .trip :global(.guide) { word-break: keep-all; line-break: strict; overflow-wrap: anywhere; text-wrap: pretty; }
  /* 地図's host: kept once made, hidden (never display: none: the map keeps its size) on the other pages */
  .mid { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; }
  .whole { position: absolute; inset: 0; z-index: 3; visibility: hidden; pointer-events: none; }
  .whole.on { visibility: visible; pointer-events: auto; }
</style>
