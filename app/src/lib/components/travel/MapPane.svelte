<script lang="ts">
  // ちず (docs/design.md §Trips, docs/travel.md "Maps"): the day chips (each the day's route colour, kept under the page's tabs as
  // the page scrolls; the day's chip again re-fits its route), the map, and the chosen day's stops in order (a numbered
  // pin in the day's colour, the arrival time, the name). The pane holds the state the map shares: the day and the
  // stop selected (a row tapped selects it, the map flies there; a pin tapped selects it, its row and the rows it
  // merges marked and brought up from under the map as far as the map stays in sight). A trip with candidates
  // (Okinawa) has their layer chips (キャンプ / しぜん / たべもの with their dots' colours, off at first); a camp's
  // dot tapped opens its card (CampCard) in a sheet over the map.
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Sheet from '../ui/Sheet.svelte';
  import TripMap from './map/TripMap.svelte';
  import { pinsOf } from './map/overlay.ts';
  import { dayColor, KIND_COLOR, LAYERS, type Layers } from './map/types.ts';
  import CampCard from './CampCard.svelte';
  import Txt from './Txt.svelte';
  import { pick } from './text.ts';

  let { trip, note, start = 1 }: { trip: Trip; note: Record<string, string> | null; start?: number } = $props();
  // svelte-ignore state_referenced_locally
  let day = $state(start);
  let selected = $state<string | null>(null);
  const days = $derived([...new Set(trip.places.flatMap((p) => (p.kind === 'stop' && p.day ? [p.day] : [])))].sort((a, b) => a - b));
  const stops = $derived(trip.places.filter((p) => p.kind === 'stop' && p.day === day).sort((a, b) => (a.i ?? 0) - (b.i ?? 0)));
  /** The rows the selection marks: the selected stop's, and the others its pin merges (one spot's). */
  const marked = $derived(selected ? (pinsOf(trip.places, day).find((p) => p.ids.includes(selected!))?.ids ?? [selected]) : []);
  const hhmm = (min: number | undefined) => (min === undefined ? '' : `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  let list: HTMLElement | undefined = $state();
  let chips: HTMLElement | undefined = $state();
  let slot: HTMLElement | undefined = $state();
  let map: ReturnType<typeof TripMap> | undefined = $state();
  /** The candidate layers this trip has, and which are on. */
  const kinds = $derived(LAYERS.filter((l) => trip.places.some((p) => p.kind === l)));
  let layers = $state<Layers>({});
  /** The camp whose card is open (its pin tapped). */
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

  /** A pin's row brought up into view, but never the map out of it: the page scrolls at most till the map's top meets
   *  the day chips (the pin's tag names it on the map meanwhile). */
  function reveal(id: string) {
    const row = list?.querySelector<HTMLElement>(`[data-stop="${CSS.escape(id)}"]`);
    let sc = row?.parentElement;
    while (sc && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
    if (!row || !sc || !slot || !chips) return;
    const below = row.getBoundingClientRect().bottom + 8 - sc.getBoundingClientRect().bottom;
    const room = slot.getBoundingClientRect().top - chips.getBoundingClientRect().bottom;
    const by = Math.min(below, room);
    if (by > 0) sc.scrollBy({ top: by, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function pickDay(d: number) {
    if (d === day) map?.fit();
    day = d;
    selected = null;
  }
</script>

<div class="map-pane" data-map-pane data-day={day} data-selected={selected ?? undefined}>
  <div class="chips days" role="group" aria-label={t('travel.map.days')} bind:this={chips}>
    {#each days as d (d)}
      <button type="button" class="chip big" aria-pressed={day === d} data-map-day={d} data-sfx="tick" style:--dc={dayColor(trip.dayColors, d)} onclick={() => pickDay(d)}>
        <i class="sw" aria-hidden="true"></i>{t('travel.day', { n: d })}
      </button>
    {/each}
  </div>

  {#if kinds.length}
    <div class="chips layers" role="group" aria-label={t('travel.map.layers')}>
      {#each kinds as l (l)}
        <button type="button" class="chip big" aria-pressed={!!layers[l]} data-map-layer={l} data-sfx={layers[l] ? 'toggle-off' : 'toggle-on'} style:--dc={KIND_COLOR[l]} onclick={() => (layers = { ...layers, [l]: !layers[l] })}>
          <i class="sw dot" aria-hidden="true"></i>{t(`travel.map.layer.${l}`)}
        </button>
      {/each}
    </div>
  {/if}

  <div class="slot" bind:this={slot}>
    <TripMap bind:this={map} places={trip.places} legs={trip.legs} dayColors={trip.dayColors} {day} selected={selected ?? undefined} {layers} locale={i18n.locale} onselect={onPin} />
  </div>

  <ol class="stops card" bind:this={list} style:--dc={dayColor(trip.dayColors, day)} aria-label="{t('travel.day', { n: day })} · {t('travel.map.stops', { n: stops.length })}">
    {#each stops as s (s.id)}
      <li>
        <button type="button" class="stop" aria-pressed={marked.includes(s.id)} data-stop={s.id} data-sfx="tick" onclick={() => (selected = selected === s.id ? null : s.id)}>
          <span class="pin money" aria-hidden="true">{(s.i ?? 0) + 1}</span>
          <span class="nm guide"><Txt l={s.name} {note} /></span>
          <span class="tm money">{hhmm(s.min)}</span>
        </button>
      </li>
    {/each}
  </ol>
  <Sheet bind:open={campOpen} label={camp ? pick(camp.name, i18n.locale) : ''} onclose={() => (campOpen = false)}>
    {#if camp}<div class="camp-sheet" data-map-camp={camp.id}><CampCard {camp} {note} /></div>{/if}
  </Sheet>
  <p class="sr-only" aria-live="polite">{selected ? pick(trip.places.find((p) => p.id === selected)?.name, i18n.locale) : ''}</p>
</div>

<style>
  .map-pane { display: grid; gap: 12px; }
  /* the day chips stay under the page's sticky tabs (TripView .tabs: 4 + 44 + 8 px) as the stop list scrolls */
  .days {
    position: sticky; top: 56px; z-index: 1; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: -6px -8px 0; padding: 6px 8px 8px;
    background: linear-gradient(var(--surface) 80%, transparent);
  }
  .days::-webkit-scrollbar { display: none; }
  .days .chip { flex: none; }
  .sw { width: 12px; height: 12px; border-radius: 50%; background: var(--dc); box-shadow: 0 0 0 2px var(--card); }
  /* a layer's legend: its dot on the map, white-rimmed */
  .dot { box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 3px rgb(74 58 44 / .25); }
  .slot {
    position: relative; height: clamp(240px, 42vh, 360px); border-radius: var(--r-card); overflow: hidden; touch-action: none;
    background: color-mix(in srgb, var(--sea-flat) 22%, var(--card)); box-shadow: var(--sh-lip);
  }
  .layers { margin-top: -4px; }
  .layers .chip { gap: 8px; }
  .stops { list-style: none; margin: 0; padding: 6px; display: grid; gap: 2px; }
  .stop {
    appearance: none; border: 0; background: none; width: 100%; min-height: 52px; padding: 6px 10px; cursor: pointer; text-align: left;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; border-radius: var(--r-btn);
    color: var(--text); -webkit-tap-highlight-color: transparent;
  }
  .stop:active { background: var(--hl); }
  .stop[aria-pressed='true'] { background: var(--hl); box-shadow: inset 0 0 0 2px var(--c-yuzu-lip); }
  /* a map pin in the day's colour, its number upright in it */
  .pin { position: relative; display: grid; place-items: center; width: 30px; height: 30px; color: var(--c-cream); font-size: var(--fs-s); line-height: 1; }
  .pin::before {
    content: ''; position: absolute; inset: 0; z-index: -1; border-radius: 50% 50% 50% 4px; transform: rotate(-45deg);
    background: var(--dc); box-shadow: 0 2px 0 var(--sh-ground);
  }
  .stop { isolation: isolate; }
  .nm { font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .tm { font-size: var(--fs-s); color: var(--text-soft); }
</style>
