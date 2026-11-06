<script lang="ts">
  // A classic guide's 地図 (the site's v-map): the map card held at the top as the page scrolls (the app's live
  // TripMap in it, online: nothing downloaded for it), the day chips (each its route colour, the legend; then 全3日間),
  // the candidate layer chips (told apart by shape), and the day's stops as the itinerary's timeline, two-way linked
  // with the pins: a day opens at its first stop ("now", what's behind it greys out), a row or a pin moves it; the
  // day's chip again brings the map back to its route; a campsite's pin opens its card (`oncamp`). The map pane's
  // hooks are the trip map's (data-map-pane, data-map-day, data-map-layer, data-stop: e2e/trips.ts).
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import TripMap from '../map/TripMap.svelte';
  import { LAYERS, type Layers } from '../map/types.ts';
  import CText from './CText.svelte';
  import { hhmm, rowState, stopDays, stopRows } from './guide.ts';
  import { pick as pickL } from '../text.ts';

  let { trip, note, oncamp }: { trip: Trip; note: Record<string, string> | null; oncamp: (id: string) => void } = $props();

  const days = $derived(stopDays(trip.places));
  const kinds = $derived(LAYERS.filter((l) => trip.places.some((p) => p.kind === l)));
  /** The day shown (0: every day), the minute of the stop we're "at" (null: none), the stop picked. */
  // svelte-ignore state_referenced_locally
  let day = $state(stopDays(trip.places)[0] ?? 1);
  // svelte-ignore state_referenced_locally
  let at = $state<number | null>(stopRows(trip.places, day)[0]?.min ?? null);
  let sel = $state<string | null>(null);
  let layers = $state<Layers>({});
  let map: ReturnType<typeof TripMap> | undefined = $state();
  /** The stop the map labels: the one picked, else the one we're at. */
  const shown = $derived(sel ?? stopRows(trip.places, day).find((r) => rowState(r, day, at) === 'now')?.id);

  function setDay(d: number) {
    if (d === day) map?.fit();
    day = d;
    at = d === 0 ? null : (stopRows(trip.places, d)[0]?.min ?? null);
    sel = null;
  }
  function pick(id: string) {
    sel = id;
    if (trip.camps?.some((c) => c.id === id)) return oncamp(id);
    const r = stopRows(trip.places, 0).find((x) => x.id === id);
    if (r && r.day === day) at = r.min;
  }
</script>

<div class="cmap" data-map-pane data-day={day} data-selected={sel ?? undefined}>
  <div class="mapstick">
    <div class="mapcard" data-classic-map>
      <TripMap bind:this={map} places={trip.places} legs={trip.legs} dayColors={trip.dayColors} {day} selected={shown} {layers} locale={i18n.locale} onselect={pick} />
    </div>
  </div>
  <div class="filters map-days" role="group" aria-label={t('travel.classic.map.pickDay')}>
    {#each days as d (d)}
      <button type="button" data-day={d} data-map-day={d} class:active={day === d} aria-pressed={day === d} data-sfx="tick" onclick={() => setDay(d)}><span class="sw d{d}"></span><span>{t('travel.classic.map.day', { n: d })}</span></button>
    {/each}
    <button type="button" data-day="all" data-map-day="all" class:active={day === 0} aria-pressed={day === 0} data-sfx="tick" onclick={() => setDay(0)}><span>{t('travel.classic.map.all', { n: days.length })}</span></button>
  </div>
  {#if kinds.length}
    <div class="filters map-layers" role="group" aria-label={t('travel.classic.map.pickLayer')}>
      {#each kinds as k (k)}
        <button type="button" data-layer={k} data-map-layer={k} class:active={!!layers[k]} aria-pressed={!!layers[k]} data-sfx={layers[k] ? 'toggle-off' : 'toggle-on'} onclick={() => (layers = { ...layers, [k]: !layers[k] })}><span class="sw k-{k}"></span><span>{t(`travel.classic.map.${k}`)}</span></button>
      {/each}
    </div>
  {/if}
  <div class="group stopcard">
    {#each day === 0 ? days : [day] as d (d)}
      <ul class="tl stoplist d{d}" data-day={d}>
        {#each stopRows(trip.places, d) as r (r.id)}
          <li class={rowState(r, day, at)} class:sel={sel === r.id}>
            <button class="stoprow" type="button" data-stop={r.id} aria-pressed={sel === r.id} data-sfx="tick" onclick={() => pick(r.id)}><span class="time">{hhmm(r.min)}</span><span class="dot"></span><span class="txt"><CText l={r.name} {note} /></span></button>
          </li>
        {/each}
      </ul>
    {/each}
  </div>
  <p class="sr" aria-live="polite">{sel ? pickL(trip.places.find((p) => p.id === sel)?.name, i18n.locale) : ''}</p>
</div>
