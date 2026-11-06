<script lang="ts">
  // 地図 (docs/design.md §Trips, docs/travel.md "Maps"): the map held at the top of the page, a 「表示」 button on it
  // (the candidate layers, when the trip has any, in a small menu), the day chips under it (each the day's route
  // colour; the shown day's again re-fits its route), and the chosen day's stops in order (its number in the day's
  // colour, the name, how it is reached, the arrival). The pane holds the state the map shares: the day and the stop
  // selected (a row tapped selects it, the map flies there; a pin tapped selects it, its row and the rows it merges
  // marked and scrolled into view). A camp's dot tapped opens its sheet (CampSheet).
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon from '../quiet/Icon.svelte';
  import Chip from '../quiet/Chip.svelte';
  import ChipRow from '../quiet/ChipRow.svelte';
  import TripMap from './map/TripMap.svelte';
  import { pinsOf } from './map/overlay.ts';
  import { dayColor, KIND_COLOR, LAYERS, type Layers } from './map/types.ts';
  import CampSheet from './CampSheet.svelte';
  import Txt from './Txt.svelte';
  import { pick } from './text.ts';
  import { fmtKm } from './units.ts';
  import { dayParts } from './dates.ts';

  interface Props {
    trip: Trip;
    note: Record<string, string> | null;
    start?: number;
    /** A camp to show (キャンプ場's 地図で見る): the camps' layer on, its dot selected. */
    focus?: string | null;
  }
  let { trip, note, start = 1, focus = null }: Props = $props();
  // svelte-ignore state_referenced_locally
  let day = $state(start);
  // svelte-ignore state_referenced_locally
  let selected = $state<string | null>(focus);
  const days = $derived([...new Set(trip.places.flatMap((p) => (p.kind === 'stop' && p.day ? [p.day] : [])))].sort((a, b) => a - b));
  const stops = $derived(trip.places.filter((p) => p.kind === 'stop' && p.day === day).sort((a, b) => (a.i ?? 0) - (b.i ?? 0)));
  /** The rows the selection marks: the selected stop's, and the others its pin merges (one spot's). */
  const marked = $derived(selected ? (pinsOf(trip.places, day).find((p) => p.ids.includes(selected!))?.ids ?? [selected]) : []);
  const hhmm = (min: number | undefined) => (min === undefined ? '' : `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  /** How a stop is reached: the leg's mode, minutes and distance; the day's first 「出発」. */
  function how(id: string): string {
    const lg = trip.legs.find((l) => l.to === id && l.day === day);
    if (!lg) return t('travel.map.start');
    return [t(`travel.map.mode.${lg.mode}`) + (lg.min ? ` ${t('travel.camps.drive', { min: lg.min })}` : ''), ...(lg.km ? [fmtKm(lg.km)] : [])].join(' · ');
  }
  const dateOf = (d: number) => trip.days.find((x) => x.n === d)?.date;
  let list: HTMLElement | undefined = $state();
  let map: ReturnType<typeof TripMap> | undefined = $state();
  /** The candidate layers this trip has, and which are on; the 「表示」 menu open. */
  const kinds = $derived(LAYERS.filter((l) => trip.places.some((p) => p.kind === l)));
  // svelte-ignore state_referenced_locally
  let layers = $state<Layers>(focus ? { camp: true } : {});
  let menu = $state(false);
  /** The camp whose sheet is open (its pin tapped). */
  let campId = $state<string | null>(null);
  const camp = $derived(campId ? trip.camps?.find((c) => c.id === campId) : undefined);
  let campOpen = $state(false);

  function onPin(id: string) {
    selected = id;
    if (trip.camps?.some((c) => c.id === id)) {
      campId = id;
      campOpen = true;
    } else reveal(id);
  }
  /** A pin's row brought into view in the list under the map. */
  function reveal(id: string) {
    list?.querySelector<HTMLElement>(`[data-stop="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function pickDay(d: number) {
    if (d === day) map?.fit();
    day = d;
    selected = null;
  }
</script>

<div class="map-pane" data-map-pane data-day={day} data-selected={selected ?? undefined}>
  <div class="held">
    <div class="slot">
      <TripMap bind:this={map} places={trip.places} legs={trip.legs} dayColors={trip.dayColors} {day} selected={selected ?? undefined} {layers} locale={i18n.locale} onselect={onPin} />
      {#if kinds.length}
        <button type="button" class="show" aria-expanded={menu} aria-haspopup="true" data-map-layers data-sfx={menu ? 'back' : 'open'} onclick={() => (menu = !menu)}>
          <Icon name="layers" size={16} />{t('travel.map.show')}
        </button>
        {#if menu}
          <div class="menu" role="menu" aria-label={t('travel.map.layers')}>
            {#each kinds as l (l)}
              <button type="button" class="mi" role="menuitemcheckbox" aria-checked={!!layers[l]} data-map-layer={l} data-sfx={layers[l] ? 'toggle-off' : 'toggle-on'}
                onclick={() => (layers = { ...layers, [l]: !layers[l] })}>
                <span class="dot" style:background={KIND_COLOR[l]}></span><span class="ml">{t(`travel.map.layer.${l}`)}</span>
                {#if layers[l]}<Icon name="check" size={18} />{/if}
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
    <div class="under">
      <ChipRow label={t('travel.map.days')}>
        {#each days as d (d)}
          {@const dt = dateOf(d)}
          <Chip label={dt ? `${t('travel.day', { n: d })} · ${t('travel.map.dayOf', { d: dayParts(dt, i18n.locale).d })}` : t('travel.day', { n: d })}
            dot={dayColor(trip.dayColors, d)} selected={day === d} data-map-day={d} onclick={() => pickDay(d)} />
        {/each}
      </ChipRow>
    </div>
  </div>

  <ol class="q-card stops" bind:this={list} style:--dc={dayColor(trip.dayColors, day)} aria-label="{t('travel.day', { n: day })} · {t('travel.map.stops', { n: stops.length })}">
    {#each stops as s (s.id)}
      <li>
        <button type="button" class="q-row stop" aria-pressed={marked.includes(s.id)} data-stop={s.id} data-sfx="tick" onclick={() => (selected = selected === s.id ? null : s.id)}>
          <span class="pin" aria-hidden="true">{(s.i ?? 0) + 1}</span>
          <span class="tx"><span class="nm guide q-ell"><Txt l={s.name} {note} /></span><span class="how">{how(s.id)}</span></span>
          <span class="tm">{hhmm(s.min)}</span>
        </button>
      </li>
    {/each}
  </ol>
  {#if camp}<CampSheet bind:open={campOpen} {camp} {note} attr="map-camp" />{/if}
  <p class="sr-only" aria-live="polite">{selected ? pick(trip.places.find((p) => p.id === selected)?.name, i18n.locale) : ''}</p>
</div>

<style>
  .map-pane { display: grid; grid-template-columns: minmax(0, 1fr); padding-bottom: 24px; }
  /* the map and the day chips held at the top of the page as the stops scroll under */
  .held { position: sticky; top: 0; z-index: 2; }
  .slot { position: relative; height: clamp(240px, 38vh, 330px); overflow: hidden; touch-action: none; background: #86D0D3; }
  .under { background: var(--q-bg); border-bottom: 1px solid var(--q-hairline); }
  .show {
    position: absolute; z-index: 1002; top: 12px; right: 12px; height: 32px; padding: 0 11px 0 9px; border: 0; border-radius: 16px; cursor: pointer;
    display: flex; align-items: center; gap: 5px; background: rgb(255 255 255 / .94); color: #3F3326;
    font: var(--q-w-b) var(--q-fs-s)/1 var(--q-font); box-shadow: 0 2px 8px rgb(30 40 40 / .15); -webkit-tap-highlight-color: transparent;
  }
  .show::after { content: ''; position: absolute; inset: -6px; }
  .menu {
    position: absolute; z-index: 1003; top: 50px; right: 12px; min-width: 180px; padding: 4px 0; border-radius: 14px;
    background: var(--q-surface); box-shadow: var(--q-shadow-float); border: 1px solid var(--q-hairline);
  }
  .mi {
    appearance: none; border: 0; background: none; width: 100%; min-height: 44px; padding: 0 14px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; text-align: start; color: var(--q-ink); font: var(--q-w) var(--q-fs-body)/1.2 var(--q-font);
  }
  .mi + .mi { border-top: 1px solid var(--q-hairline); }
  .mi :global(svg) { color: var(--q-accent-ink); }
  .mi:active { background: var(--q-sunken); }
  .ml { flex: 1; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgb(74 58 44 / .2); }
  .stops { list-style: none; margin: 12px 16px 0; padding: 0; }
  .stops li + li { border-top: 1px solid var(--q-hairline); }
  .stop { padding: 10px 16px 10px 14px; scroll-margin: 8px; }
  .stop[aria-pressed='true'] { background: var(--q-accent-soft); }
  .pin { width: 22px; height: 22px; border-radius: 50%; flex: none; display: grid; place-items: center; background: var(--dc); color: #fff; font: 700 12px/1 var(--q-font); }
  .tx { flex: 1; min-width: 0; display: grid; }
  .nm { font-size: var(--q-fs-body); }
  .how { font-size: var(--q-fs-s); color: var(--q-muted); }
  .tm { flex: none; font-size: var(--q-fs-s); color: var(--q-ink-2); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
