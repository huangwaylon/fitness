<script module lang="ts">
  export type ShareTab = 'days' | 'map' | 'camps';
</script>

<script lang="ts">
  // A shared trip as its visitor sees it (`/s#<token>`, docs/travel.md "Sharing"): TripView's pages without what is
  // ours alone. 日程 (its photo, a chip a day and 準備, the day's card with the row that is now lit by the trip's clock;
  // or the logistics cards), 地図 (MapPane, its own chunk with MapLibre, without オフライン用に保存: the visitor isn't our
  // user) and キャンプ場 (a trip with campsites); never 持ち物 (the packing store isn't imported) nor the trip note:
  // `note` is null, so every {p:} value is 🔒 (i18n/link.ts: 非公開) and a private link a locked chip. No ‹ ✕: the
  // title bar holds the language switch. The foot: whose guide it is and until when the link works.
  import { untrack, tick } from 'svelte';
  import type { Trip } from '#lib/travel/types.ts';
  import { privateKeys } from '#lib/travel/tokens.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import PhotoBand from '../ui/PhotoBand.svelte';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Icon, { type IconName } from '../ui/Icon.svelte';
  import DayCard from '../travel/DayCard.svelte';
  import PrepCard from '../travel/PrepCard.svelte';
  import Txt from '../travel/Txt.svelte';
  import Lazy from '../ui/Lazy.svelte';
  import { listSpan } from '../travel/dates.ts';
  import { pick } from '../travel/text.ts';
  import { phaseOf, rowNow, todayDay } from '../travel/when.ts';
  import { dayColor } from '../travel/map/types.ts';
  import { md } from '#lib/i18n/format.ts';
  import { staticUrl } from '#lib/staticUrl.ts';
  import LangSwitch from './LangSwitch.svelte';
  import { untilDate } from './until.ts';

  let { trip, now, exp }: { trip: Trip; now: number; exp: string } = $props();

  const note = null;
  const locked = $derived(privateKeys(JSON.stringify(trip)).length > 0);
  const phase = $derived(phaseOf(trip, now));
  const today = $derived(todayDay(trip, now));
  const mark = $derived(rowNow(trip, now));
  const title = $derived(pick(trip.title, i18n.locale));
  const items = $derived<{ id: ShareTab; label: string; icon: IconName }[]>([
    { id: 'days', label: t('travel.tab.days'), icon: 'calendar' },
    ...(trip.places.length ? [{ id: 'map' as const, label: t('travel.tab.map'), icon: 'map' as const }] : []),
    ...(trip.camps?.length ? [{ id: 'camps' as const, label: t('travel.tab.camps'), icon: 'tent' as const }] : [])
  ]);
  let tab = $state<ShareTab>('days');
  const tabName = $derived(items.find((x) => x.id === tab)?.label ?? '');
  const hasPrep = $derived(trip.logistics.length > 0 || !!trip.foot);
  const prepFirst = $derived(hasPrep && phase.k === 'soon');
  let shown = $state<number | 'prep'>(untrack(() => mark?.day ?? today ?? (prepFirst ? 'prep' : (trip.days[0]?.n ?? 1))));
  const day = $derived(shown === 'prep' ? null : (trip.days.find((d) => d.n === shown) ?? null));

  let scroller: HTMLElement | undefined = $state();
  let hero: HTMLElement | undefined = $state();
  let bar: HTMLElement | undefined = $state();
  const heroEnd = () => (hero && bar ? hero.offsetHeight - bar.offsetHeight : 0);
  let past = $state(false);
  const scrolled = () => (past = !!scroller && !!hero && scroller.scrollTop > heroEnd());
  function pickTab(id: ShareTab) {
    tab = id;
    past = false;
    void tick().then(() => scroller?.scrollTo({ top: 0 }));
  }
  function pickDay(d: number | 'prep') {
    shown = d;
    if (scroller && scroller.scrollTop > heroEnd()) scroller.scrollTop = heroEnd();
  }
</script>

{#snippet prepChip()}<Chip label={t('travel.prep')} selected={shown === 'prep'} data-day-pick="prep" onclick={() => pickDay('prep')} />{/snippet}
{#snippet lang()}<LangSwitch />{/snippet}

<div class="trip" data-share-trip={trip.id} data-pane-tab={tab}>
  <div class="hd" class:over={tab === 'days'} class:solid={tab !== 'days' || past} bind:this={bar}>
    <NavBar pad title={tab === 'days' ? title : `${title} · ${tabName}`} over={tab === 'days' && !past} trailing={lang} />
  </div>

  <div class="scroll sheet-scroll" class:map={tab === 'map'} bind:this={scroller} onscroll={scrolled}>
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

    <div class="pane" data-pane={tab}>
      {#if tab === 'days'}
        {#if day}
          <DayCard {day} {note} color={dayColor(trip.dayColors, day.n)} today={today === day.n} mark={mark?.day === day.n ? mark : null} />
        {:else}
          <div class="cards" data-prep>
            {#each trip.logistics as c (c.id)}<PrepCard card={c} {note} />{/each}
          </div>
          {#if trip.foot}<p class="tfoot guide"><Txt l={trip.foot} {note} /></p>{/if}
        {/if}
        <footer class="foot" data-share-foot>
          {#if locked}<p data-share-private><Icon name="lock" size={14} /> {t('link.privateHint')}</p>{/if}
          <p>{t('link.foot', { date: untilDate(exp, i18n.locale) })}</p>
        </footer>
      {:else if tab === 'map'}
        <Lazy load={() => import('../travel/MapPane.svelte')}>{#snippet children(MapPane)}<MapPane {trip} {note} start={mark?.day ?? today ?? 1} />{/snippet}</Lazy>
      {:else if tab === 'camps'}
        <Lazy load={() => import('../travel/CampList.svelte')}>{#snippet children(CampList)}<CampList {trip} {note} />{/snippet}</Lazy>
      {/if}
    </div>
  </div>

  <TabBar {items} value={tab} label={t('link.tabs')} attr="trip-tab" onpick={pickTab} />
</div>

<style>
  .trip { height: var(--vh-fill); display: flex; flex-direction: column; position: relative; background: var(--surface); }
  .hd { flex: none; position: relative; z-index: 6; background: var(--surface); }
  .hd.over { position: absolute; top: 0; left: 0; right: 0; background: none; transition: background-color var(--dur-quick); }
  .hd.solid { background: var(--surface); box-shadow: 0 var(--lip-s) 0 var(--lip); }
  .scroll { padding-bottom: 24px; }
  .scroll.map { padding-bottom: 0; }
  .ht { display: flex; align-items: center; gap: 8px; font: 700 var(--fs-title)/1.2 var(--font-ui); letter-spacing: .02em; }
  .ht .sticker { text-shadow: none; }
  .hs { display: block; font-size: var(--fs-s); opacity: .95; }
  .ctl { position: sticky; top: calc(var(--ui-top) + 48px); z-index: 4; background: var(--surface); padding: 4px 0 2px; }
  .pane { display: grid; grid-template-columns: minmax(0, 1fr); }
  .pane[data-pane='days'], .pane[data-pane='camps'] { padding: 6px 12px 0; }
  .cards { display: grid; gap: 8px; }
  .tfoot { margin: 14px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
  .foot { margin: 18px 4px 0; font-size: var(--fs-s); color: var(--text-soft); text-align: center; }
  .foot p { margin: 4px 0; display: flex; align-items: center; justify-content: center; gap: 6px; }
  /* a visitor saves nothing ahead (オフライン用に保存 is ours: MapPane's) */
  .trip :global(.offline:has([data-offline-save])) { display: none; }
  .trip :global(.guide) { word-break: keep-all; line-break: strict; overflow-wrap: anywhere; text-wrap: pretty; }
</style>
