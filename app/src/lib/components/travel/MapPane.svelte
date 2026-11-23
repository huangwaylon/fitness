<script lang="ts">
  // 地図 (docs/design.md §Trips, docs/travel.md "Maps"): the day chips (the page's one control row: each the day's
  // route colour and date, the shown day's again re-fits its route) and the map under them, held at the top of the page, and the chosen day's stops in order (its
  // number in the day's colour, the name, how it is reached, the arrival). The pane holds the state the map shares:
  // the day and the stop selected (a row tapped selects it, the map flies there; a pin tapped selects it, its row and
  // the rows it merges marked and scrolled into view). A trip with candidate places (Okinawa's campsites, nature,
  // food) has one small layer button on the map: its panel turns each layer on (its colour's dot); a campsite's pin
  // opens its card (CampSheet), a nature or food pin is tagged with its name.
  import { untrack } from 'svelte';
  import type { Camp, Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import MapLayers from '../map/MapLayers.svelte';
  import { MS } from '../map/strings.ts';
  import TripMap from './map/TripMap.svelte';
  import CampSheet from './CampSheet.svelte';
  import { pinsOf } from './map/overlay.ts';
  import { dayColor, KIND_COLOR, LAYERS, type Layer, type Layers } from './map/types.ts';
  import Txt from './Txt.svelte';
  import { pick } from './text.ts';
  import { fmtKm } from './units.ts';
  import { md } from '#lib/i18n/format.ts';
  import SaveButton from '../offline/SaveButton.svelte';
  import { areas } from '#lib/offline/areas.svelte.ts';
  import { planTrip } from '#lib/offline/plan.ts';

  interface Props {
    trip: Trip;
    note: Record<string, string> | null;
    start?: number;
  }
  let { trip, note, start = 1 }: Props = $props();
  let day = $state(untrack(() => start));
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
  /** The trip's area to save ahead (lib/offline/plan.ts), and whether some of it is (the map's note offline). */
  const plan = $derived(planTrip(trip));
  const saved = $derived(['saved', 'partial', 'saving'].includes(areas.state(plan.id).k));
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
    list?.querySelector<HTMLElement>(`[data-stop="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
          <Chip label={t('travel.day', { n: d })} count={dt ? md(dt) : undefined} dot={dayColor(trip.dayColors, d)} selected={day === d} data-map-day={d} onclick={() => pickDay(d)} />
        {/each}
      </ChipRow>
    </div>
    <div class="slot">
      <TripMap bind:this={map} places={trip.places} legs={trip.legs} dayColors={trip.dayColors} {day} selected={selected ?? undefined} {layers} locale={i18n.locale} {saved} onselect={onPin} />
      <div class="offline"><SaveButton {plan} name={trip.title} /></div>
      {#if kinds.length}
        <div class="lyr">
          <MapLayers bind:open={layersOpen} label={MS.layers[i18n.locale]} rows={kinds.map((k) => ({ id: k, label: t(`travel.map.layer.${k}`), on: !!layers[k], swatch: KIND_COLOR[k] }))}
            ontoggle={(k) => (layers = { ...layers, [k]: !layers[k as Layer] })} />
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
  /* the save pill over the map's top-left (the layer button the top-right), as on a trail's map */
  .offline { position: absolute; top: 2px; left: 8px; z-index: 2; }
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
  /* the layer button (map/MapLayers): the locate button's disc, at the top right; its panel under it (only they take
     taps: the save pill's right end is under the box round them) */
  .lyr { position: absolute; top: 2px; right: 2px; z-index: 2; pointer-events: none; }
</style>
