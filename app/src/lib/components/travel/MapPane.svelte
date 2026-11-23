<script lang="ts">
  // 地図 (docs/design.md §Trips, docs/travel.md "Maps"): the day chips (the page's one control row: each the day's
  // route colour and date, the shown day's again re-fits its route) and the map under them, held at the top of the page, and the chosen day's stops in order (its
  // number in the day's colour, the name, how it is reached, the arrival). The pane holds the state the map shares:
  // the day and the stop selected (a row tapped selects it, the map flies there; a pin tapped selects it, its row and
  // the rows it merges marked and scrolled into view). A trip with candidate places (Okinawa's campsites, nature,
  // food) has one small layer button on the map: its panel turns each layer on (its colour's dot); a campsite's pin
  // opens its card (CampSheet), a nature or food pin is tagged with its name. In the app (TripView's `places`; never
  // on /s, which never loads the places' store) the saved places near the shown day (map/places) are a layer too, its
  // row first, on by default (the phone's one switch for every map); a square tapped, its floating card (PlaceFloat)
  // over the map, closed by ✕, an empty map's tap, Esc, another day, the layer off or a pin tapped.
  import { untrack } from 'svelte';
  import type { Camp, Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import MapLayers from '../map/MapLayers.svelte';
  import { MS } from '../map/strings.ts';
  import TripMap from './map/TripMap.svelte';
  import CampSheet from './CampSheet.svelte';
  import PlaceFloat from '../places/PlaceFloat.svelte';
  import type { PlacesLayer } from '../map/places/layer.svelte.ts';
  import { S as PS } from '#lib/places/strings.ts';
  import { dayPath, pinsOf } from './map/overlay.ts';
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
    /** The saved places' layer, made for a day's path (TripView's: the app's alone). */
    places?: (path: () => [number, number][]) => PlacesLayer;
  }
  let { trip, note, start = 1, places }: Props = $props();
  let day = $state(untrack(() => start));
  const layer = untrack(() => places?.(() => dayPath(trip.places, trip.legs, day)) ?? null);
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
  /** The trip's area to save ahead (lib/offline/plan.ts), and whether some of it is (the map's note offline). The plan
   *  computed a frame after the pane is up (track C: 63 ms at 4× in the open's long task); its id at once. */
  let plan = $state.raw<ReturnType<typeof planTrip> | null>(null);
  $effect(() => {
    const t = trip;
    let tm = 0;
    const raf = requestAnimationFrame(() => (tm = window.setTimeout(() => (plan = planTrip(t)))));
    return () => (cancelAnimationFrame(raf), clearTimeout(tm));
  });
  const saved = $derived(['saved', 'partial', 'saving'].includes(areas.state(`trip-${trip.id}`).k));
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
    layer?.select(null);
    const c = trip.camps?.find((x) => x.id === id);
    if (c) return void ((camp = c), (campOpen = true));
    list?.querySelector<HTMLElement>(`[data-stop="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function pickDay(d: number) {
    if (d === day) map?.fit();
    day = d;
    selected = null;
    layer?.select(null);
  }
  /** A saved place's square tapped: its card (the pin's selection let go). */
  function onPlace(id: string) {
    selected = null;
    layer?.select(id);
  }
  const rows = $derived([
    ...(layer?.near.length ? [{ id: 'places', label: pick(PS.layer, i18n.locale), on: layer.on, swatch: 'square', def: true }] : []),
    ...kinds.map((k) => ({ id: k, label: t(`travel.map.layer.${k}`), on: !!layers[k], swatch: KIND_COLOR[k] }))
  ]);
  const toggle = (id: string) => (id === 'places' ? layer?.toggle() : (layers = { ...layers, [id]: !layers[id as Layer] }));
  const savedPlaces = $derived(layer ? { pts: layer.pts, shown: layer.on, sel: layer.selected } : undefined);
  /** The card's foot: 8 px over the locate disc (TripMap: 44 px from 4 px up). */
  const FLOAT_BOTTOM = 56;
  let floatH = $state(0);
  // a square tapped: the map eased only if it would sit under its card
  $effect(() => {
    const p = layer?.selected, h = floatH;
    if (p && h) untrack(() => map?.reveal(p, FLOAT_BOTTOM + h));
  });
  /** Esc: a saved place's card closes (true), else the sheet's own Esc. */
  export function escape(): boolean {
    if (!layer?.selected) return false;
    layer.select(null);
    return true;
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
      <TripMap bind:this={map} places={trip.places} legs={trip.legs} dayColors={trip.dayColors} {day} selected={selected ?? undefined} {layers} locale={i18n.locale} {saved} {savedPlaces} onselect={onPin}
        onplace={onPlace} onmiss={() => (layer?.select(null), (layersOpen = false))} />
      <div class="offline"><SaveButton {plan} name={trip.title} /></div>
      {#if rows.length}
        <div class="lyr"><MapLayers bind:open={layersOpen} label={MS.layers[i18n.locale]} {rows} ontoggle={toggle} /></div>
      {/if}
      {#if layer?.selected && layer.on}<PlaceFloat p={layer.selected} bottom={FLOAT_BOTTOM} onclose={() => layer.select(null)} bind:h={floatH} />{/if}
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
  .slot { --slot-h: clamp(240px, 38vh, 330px); position: relative; height: var(--slot-h); overflow: hidden; touch-action: none; background: color-mix(in srgb, var(--c-sky) 35%, var(--card)); box-shadow: 0 var(--lip-s) 0 var(--lip); }
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
  /* (its panel over a place's card, clear of the locate disc: 2 + 44 + 6 over it, 8 + 44 + 4 under it) */
  .lyr { position: absolute; top: 2px; right: 2px; z-index: 561; pointer-events: none; --lyr-max: calc(var(--slot-h) - 108px); }
</style>
