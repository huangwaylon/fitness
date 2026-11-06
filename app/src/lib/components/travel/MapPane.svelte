<script lang="ts">
  // ちず (docs/travel.md "The sheet", "Maps"): the day chips (each the day's route colour), the map, and the chosen
  // day's stops in order (a numbered pin in the day's colour, the arrival time, the name). The pane holds the state the
  // map shares: the day and the stop selected (a row tapped selects it, the map flies there; a pin tapped selects
  // it, the list scrolls to its row). The map itself (map/TripMap.svelte, the map branch) mounts in the slot below:
  //   <TripMap places={trip.places} legs={trip.legs} dayColors={trip.dayColors} {day} {selected} locale={i18n.locale} onselect={(id) => (selected = id)} />
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Txt from './Txt.svelte';

  let { trip, note, start = 1 }: { trip: Trip; note: Record<string, string> | null; start?: number } = $props();
  // svelte-ignore state_referenced_locally
  let day = $state(start);
  let selected = $state<string | null>(null);
  const days = $derived([...new Set(trip.places.flatMap((p) => (p.kind === 'stop' && p.day ? [p.day] : [])))].sort((a, b) => a - b));
  const stops = $derived(trip.places.filter((p) => p.kind === 'stop' && p.day === day).sort((a, b) => (a.i ?? 0) - (b.i ?? 0)));
  const colour = (d: number) => trip.dayColors[d - 1] ?? 'var(--c-leaf)';
  const hhmm = (min: number | undefined) => (min === undefined ? '' : `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  let list: HTMLElement | undefined = $state();

  function pickDay(d: number) {
    day = d;
    selected = null;
  }
  // a stop selected elsewhere (a pin on the map): its row comes into view
  $effect(() => {
    const id = selected;
    if (!id || !list) return;
    list.querySelector<HTMLElement>(`[data-stop="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
</script>

<div class="map-pane" data-map-pane data-day={day} data-selected={selected ?? undefined}>
  <div class="chips days" role="group" aria-label={t('travel.map.days')}>
    {#each days as d (d)}
      <button type="button" class="chip big" aria-pressed={day === d} data-map-day={d} data-sfx={day === d ? 'none' : 'tick'} style:--dc={colour(d)} onclick={() => pickDay(d)}>
        <i class="sw" aria-hidden="true"></i>{t('travel.day', { n: d })}
      </button>
    {/each}
  </div>

  <!-- the map's slot: map/TripMap.svelte mounts here (the map branch), over this placeholder -->
  <div class="slot" data-trip-map-slot>
    <div class="soon">
      <OfficialArt key="deco/airport" size={72} />
      <p>{t('travel.map.soon')}</p>
    </div>
  </div>

  <ol class="stops card" bind:this={list} style:--dc={colour(day)} aria-label="{t('travel.day', { n: day })} · {t('travel.map.stops', { n: stops.length })}">
    {#each stops as s, i (s.id)}
      <li>
        <button type="button" class="stop" aria-pressed={selected === s.id} data-stop={s.id} data-sfx="tick" onclick={() => (selected = selected === s.id ? null : s.id)}>
          <span class="pin money" aria-hidden="true">{i + 1}</span>
          <span class="nm guide"><Txt l={s.name} {note} /></span>
          <span class="tm money">{hhmm(s.min)}</span>
        </button>
      </li>
    {/each}
  </ol>
  <p class="sr-only" aria-live="polite">{selected ? stops.find((s) => s.id === selected)?.name[i18n.locale] ?? '' : ''}</p>
</div>

<style>
  .map-pane { display: grid; gap: 12px; }
  .days { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -8px; padding: 2px 8px 6px; }
  .days::-webkit-scrollbar { display: none; }
  .days .chip { flex: none; }
  .sw { width: 12px; height: 12px; border-radius: 50%; background: var(--dc); box-shadow: 0 0 0 2px var(--card); }
  .slot {
    position: relative; height: clamp(240px, 42vh, 360px); border-radius: var(--r-card); overflow: hidden; touch-action: none;
    background: color-mix(in srgb, var(--sea-flat) 22%, var(--card)); box-shadow: var(--sh-lip);
  }
  .soon { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 8px; text-align: center; }
  .soon p { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text-soft); }
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
