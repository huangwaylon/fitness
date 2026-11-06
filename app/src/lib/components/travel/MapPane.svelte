<script lang="ts">
  // 地図 (docs/design.md §Trips, docs/travel.md "Maps"): the day chips (the page's one control row: each the day's
  // route colour and date, the shown day's again re-fits its route) and the map under them, held at the top of the page, and the chosen day's stops in order (its
  // number in the day's colour, the name, how it is reached, the arrival). The pane holds the state the map shares:
  // the day and the stop selected (a row tapped selects it, the map flies there; a pin tapped selects it, its row and
  // the rows it merges marked and scrolled into view). A trip with candidate places (Okinawa's campsites, nature,
  // food) has one small layer button on the map: its panel turns each layer on (its colour's dot); a campsite's pin
  // opens its card (CampSheet), a nature or food pin is tagged with its name.
  import type { Camp, Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Icon from '../ui/Icon.svelte';
  import TripMap from './map/TripMap.svelte';
  import CampSheet from './CampSheet.svelte';
  import { pinsOf } from './map/overlay.ts';
  import { dayColor, KIND_COLOR, LAYERS, type Layers } from './map/types.ts';
  import Txt from './Txt.svelte';
  import { pick } from './text.ts';
  import { fmtKm } from './units.ts';
  import { monthDay } from './dates.ts';

  interface Props {
    trip: Trip;
    note: Record<string, string> | null;
    start?: number;
  }
  let { trip, note, start = 1 }: Props = $props();
  // svelte-ignore state_referenced_locally
  let day = $state(start);
  let selected = $state<string | null>(null);
  const days = $derived([...new Set(trip.places.flatMap((p) => (p.kind === 'stop' && p.day ? [p.day] : [])))].sort((a, b) => a - b));
  const stops = $derived(trip.places.filter((p) => p.kind === 'stop' && p.day === day).sort((a, b) => (a.i ?? 0) - (b.i ?? 0)));
  /** The rows the selection marks: the selected stop's, and the others its pin merges (one spot's). */
  const marked = $derived(selected ? (pinsOf(trip.places, day).find((p) => p.ids.includes(selected!))?.ids ?? [selected]) : []);
  const hhmm = (min: number | undefined) => (min === undefined ? '' : `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  /** How a stop is reached: the leg's mode, minutes and distance; the day's first 「出発」. */
  function how(id: string): string {
    const lg = trip.legs.find((l) => l.to === id && l.day === day);
    if (!lg) return t('travel.map.start');
    return [t(`travel.map.mode.${lg.mode}`) + (lg.min ? ` ${t('travel.map.min', { min: lg.min })}` : ''), ...(lg.km ? [fmtKm(lg.km)] : [])].join(' · ');
  }
  const dateOf = (d: number) => trip.days.find((x) => x.n === d)?.date;
  let list: HTMLElement | undefined = $state();
  let map: ReturnType<typeof TripMap> | undefined = $state();
  /** The candidate layers the trip has, and the ones on (none at first). */
  const kinds = $derived(LAYERS.filter((l) => trip.places.some((p) => p.kind === l)));
  let layers = $state<Layers>({});
  let layersOpen = $state(false);
  let camp = $state<Camp | null>(null);
  let campOpen = $state(false);
  /** A pin tapped: a campsite's opens its card; a stop's row selected and brought into view in the list under the
   *  map. */
  function onPin(id: string) {
    selected = id;
    const c = trip.camps?.find((x) => x.id === id);
    if (c) return void ((camp = c), (campOpen = true));
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
    <div class="under">
      <ChipRow label={t('travel.map.days')}>
        {#each days as d (d)}
          {@const dt = dateOf(d)}
          <Chip label={t('travel.day', { n: d })} count={dt ? monthDay(dt) : undefined} dot={dayColor(trip.dayColors, d)} selected={day === d} data-map-day={d} onclick={() => pickDay(d)} />
        {/each}
      </ChipRow>
    </div>
    <div class="slot">
      <TripMap bind:this={map} places={trip.places} legs={trip.legs} dayColors={trip.dayColors} {day} selected={selected ?? undefined} {layers} locale={i18n.locale} onselect={onPin} />
      {#if kinds.length}
        <div class="lyr">
          <button type="button" class="lb" aria-expanded={layersOpen} aria-controls="map-layers" aria-label={t('travel.map.layers')} data-map-layers data-sfx={layersOpen ? 'toggle-off' : 'toggle-on'}
            onclick={() => (layersOpen = !layersOpen)}><Icon name="layers" size={20} />{#if kinds.some((k) => layers[k])}<span class="on" aria-hidden="true"></span>{/if}</button>
          {#if layersOpen}
            <div class="card dense panel" id="map-layers" role="group" aria-label={t('travel.map.layers')}>
              {#each kinds as k (k)}
                <button type="button" class="row" aria-pressed={!!layers[k]} data-map-layer={k} data-sfx={layers[k] ? 'toggle-off' : 'toggle-on'} onclick={() => (layers = { ...layers, [k]: !layers[k] })}>
                  <span class="sw" style:--k={KIND_COLOR[k]}></span><span class="ln">{t(`travel.map.layer.${k}`)}</span>
                  <span class="ck" aria-hidden="true">{#if layers[k]}<Icon name="check" size={16} stroke={2.6} />{/if}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <ol class="card dense stops" bind:this={list} style:--dc={dayColor(trip.dayColors, day)} aria-label="{t('travel.day', { n: day })} · {t('travel.map.stops', { n: stops.length })}">
    {#each stops as s (s.id)}
      <li>
        <button type="button" class="row stop" aria-pressed={marked.includes(s.id)} data-stop={s.id} data-sfx="tick" onclick={() => (selected = selected === s.id ? null : s.id)}>
          <span class="pin" aria-hidden="true">{(s.i ?? 0) + 1}</span>
          <span class="tx"><span class="nm guide"><Txt l={s.name} {note} /></span><span class="how">{how(s.id)}</span></span>
          <span class="tm">{hhmm(s.min)}</span>
        </button>
      </li>
    {/each}
  </ol>
  <p class="sr-only" aria-live="polite">{selected ? pick(trip.places.find((p) => p.id === selected)?.name, i18n.locale) : ''}</p>
</div>

{#if trip.camps?.length}<CampSheet bind:open={campOpen} {camp} {note} />{/if}

<style>
  .map-pane { display: grid; grid-template-columns: minmax(0, 1fr); padding-bottom: 24px; }
  /* the day chips and the map held at the top of the page as the stops scroll under */
  .held { position: sticky; top: 0; z-index: 2; }
  .under { background: var(--surface); padding: 4px 0 2px; }
  .slot { position: relative; height: clamp(240px, 38vh, 330px); overflow: hidden; touch-action: none; background: color-mix(in srgb, var(--c-sky) 35%, var(--card)); box-shadow: 0 var(--lip-s) 0 var(--lip); }
  .stops { list-style: none; margin: 10px 12px 0; padding: 0; }
  .stops li { position: relative; }
  .stops li + li::before { content: ''; position: absolute; top: 0; left: 12px; right: 12px; border-top: 1.5px dashed var(--stitch); z-index: 1; pointer-events: none; }
  .stop { scroll-margin: 8px; }
  .stop[aria-pressed='true'] { background: var(--hl); }
  .pin { width: 22px; height: 22px; border-radius: 50%; flex: none; display: grid; place-items: center; background: var(--dc); color: #fff; font: 600 var(--fs-s)/1 var(--font-num); }
  .tx { flex: 1; min-width: 0; display: grid; }
  .nm { font-size: var(--fs-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .how { font-size: var(--fs-s); color: var(--text-soft); }
  .tm { flex: none; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  /* the layer button: the locate button's cream disc, at the top right; its panel under it */
  .lyr { position: absolute; top: 8px; right: 8px; z-index: 2; display: grid; justify-items: end; gap: 6px; }
  .lb {
    position: relative; appearance: none; border: 0; padding: 0; margin: 0; cursor: pointer; width: var(--hit); height: var(--hit); display: grid; place-items: center;
    background: none; color: var(--c-ink-soft); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .lb::before { content: ''; position: absolute; inset: 2px; border-radius: 50%; background: var(--c-cream); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h, 4px) 0 var(--c-edge); }
  .lb[aria-expanded='true']::before { background: var(--c-yuzu); }
  .lb :global(.ic) { position: relative; }
  .lb:active::before { translate: 0 2px; box-shadow: inset 0 0 0 2px var(--c-edge), 0 1px 0 var(--c-edge); }
  .lb:focus-visible { outline: none; }
  .lb:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .on { position: absolute; top: 6px; right: 6px; width: 9px; height: 9px; border-radius: 50%; background: var(--c-coral); box-shadow: 0 0 0 2px var(--c-cream); }
  .panel { min-width: 160px; }
  .panel .row { width: 100%; }
  .panel .row[aria-pressed='true'] { background: var(--hl); }
  .sw { width: 12px; height: 12px; flex: none; border-radius: 50%; background: var(--k); box-shadow: 0 0 0 2px #fff; }
  .ln { flex: 1; text-align: start; font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .ck { width: 16px; flex: none; display: flex; color: var(--leaf-text); }
</style>
