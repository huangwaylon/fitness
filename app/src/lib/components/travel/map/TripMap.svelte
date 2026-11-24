<script lang="ts">
  // The trip map (docs/travel.md "Maps"): MapLibre on OpenFreeMap's vector tiles in our NookPhone theme, the day's legs
  // in its colour, its stops as numbered NH pins (one spot's stops one pin, '2·6'; the selected one tagged with its
  // name), the candidate layers, the saved places near the day (map/places: TripView's squares), and the location dot
  // behind the locate button. This component is light: the map's
  // library (engine.ts: maplibre-gl, its worker, the fonts) is its own chunk, fetched only when a map is drawn and
  // kept by the service worker from then on (with the tiles it drew: docs/travel.md "Offline"); offline before it came:
  // a note, the map drawn by itself once back online (online: a もう一度 panel); a map whose tiles don't come shows its
  // route with a note. Under mapStub() (the e2e's logic tier) no map is made: a stub with the same pins and squares as
  // buttons.
  // `window.__travelMap` (hooks on) is the specs' view.
  import { onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { mapStub } from '#lib/ui-state/testMode.ts';
  import { pick } from '../text.ts';
  import MapStatus from '../../map/MapStatus.svelte';
  import LocateDisc from '../../map/LocateDisc.svelte';
  import { useLocate } from '../../map/locate.svelte.ts';
  import { MS } from '../../map/strings.ts';
  import { mapLoader } from '../../map/cached.ts';
  import { candidatesOf, farFrom, layersOn, legsData, pinLabel, pinsOf } from './overlay.ts';
  import { dayColor, type MapState, type TripMapProps } from './types.ts';
  import type { Engine } from './engine.ts';
  import type { MapPlace } from '../../map/places/layer.ts';

  let { places, legs, dayColors, day, selected, layers, locale, saved = false, savedPlaces, onselect, onplace, onmiss }: TripMapProps = $props();

  const loadEngine = lazy(() => import('./engine.ts'));

  let host: HTMLDivElement;
  let mapEl = $state<HTMLDivElement>();
  let mode = $state<MapState['mode']>(mapStub() ? 'stub' : 'loading');
  /** A basemap tile has come (till then, after 2 s, 「地図を読み込み中…」). */
  let tiled = $state(false);
  let engine: Engine | null = null;

  const input = () => ({ places, legs, dayColors, day, selected, layers, locale, savedPlaces });
  const pins = $derived(pinsOf(places, day));
  const cands = $derived(candidatesOf(places, layers));

  /** The next fix brings the map to it (the button tapped). */
  let flyNext = false;
  // the location (map/locate: paused while the map is scrolled away or the tab hidden); its note: refused, or the phone
  // far from the trip
  const here = useLocate<'far'>({
    el: () => host,
    onchange(w, first) {
      const fly = first || flyNext;
      flyNext = false;
      // far from every stop (at home, before the trip): the dot where it is, the map kept on the route
      const far = !!w.fix && farFrom(places, w.fix);
      if (far && fly) here.tell('far');
      engine?.setFix(w.fix, fly && !far, w.stale);
    }
  });
  function locate() {
    if (here.state === 'on' && here.fix) {
      if (farFrom(places, here.fix)) return (here.tell('far'), engine?.fit());
      return engine?.setFix(here.fix, true, here.stale);
    }
    flyNext = true;
    here.start();
  }

  /** Back to the day's route (its chip tapped again). */
  export const fit = () => engine?.fit();
  /** The chosen square kept clear of its card over the map's bottom `cover` px. */
  export const reveal = (p: MapPlace, cover: number) => engine?.reveal(p, cover);

  const map = mapLoader(loadEngine, ({ createEngine }) => {
    engine = createEngine(mapEl!, input(), {
      select: (id) => onselect?.(id), mode: (m) => (mode = m), tile: () => (tiled = true), place: (id) => onplace?.(id), miss: () => onmiss?.()
    });
    if (here.fix) engine.setFix(here.fix, false, here.stale);
  }, { set: (m) => (mode = m), failed: () => mode === 'failed' });
  const draw = map.draw;

  const snapshot = (): MapState => {
    const s = engine?.places() ?? { squares: [], tag: '' };
    return {
      mode, loc: here.state, candidates: cands.map((p) => p.id), legs: legsData(legs, dayColors, day).features.length, places: s.squares.length, ...s,
      layers: layersOn(layers), center: engine?.center() ?? null, settled: engine?.settled() ?? false
    };
  };

  // the props into the map (the engine redraws only what changed)
  $effect(() => {
    const i = input();
    engine?.update(i);
  });

  onMount(() => {
    const stop = map.start(mode === 'stub', '__travelMap', { state: snapshot });
    return () => {
      stop();
      engine?.destroy();
      engine = null;
    };
  });

  /** Offline with the trip's area saved (lib/offline): 「保存した範囲のみ」 over the map, whatever it drew. */
  const note = $derived(mode === 'failed' ? null : saved && !online.current ? 'saved' : mode === 'offline' ? 'offline' : here.note);
  const noteText = $derived(here.note === 'denied' ? MS.refused[locale] : here.note === 'far' ? t('travel.map.note.far') : undefined);
</script>

<div class="tm map-attrib" bind:this={host} data-travel-map data-mode={mode} data-day={day} data-selected={selected ?? ''}
  data-places={savedPlaces?.shown ? savedPlaces.pts.length : 0}>
  {#if mode === 'stub'}
    <!-- (a tap on the stub's ground: an empty map's) -->
    <div class="stub" data-map-stub data-stops={pins.flatMap((p) => p.ids).join(' ')} role="presentation" data-sfx="none" onclick={(e) => e.target === e.currentTarget && onmiss?.()}>
      {#each pins as p (p.id)}
        <button type="button" class="tm-pin" data-pin={p.id} data-sfx="tick" aria-pressed={!!selected && p.ids.includes(selected)} style:--pin={dayColor(dayColors, p.day)}
          aria-label={pinLabel(p, locale)} onclick={() => onselect?.(p.id)}><span class="tm-head">{p.n}</span><span class="tm-tail"></span></button>
      {/each}
      {#each cands as p (p.id)}
        <button type="button" class="cand" data-pin={p.id} data-sfx="tick" aria-pressed={p.id === selected} aria-label={pick(p.name, locale)}
          onclick={() => onselect?.(p.id)}></button>
      {/each}
      {#if savedPlaces?.shown}
        {#each savedPlaces.pts as p (p.id)}
          <button type="button" class="stub-place" class:sel={savedPlaces.sel?.id === p.id} data-map-place={p.id} data-sfx="tick" aria-label={p.name} onclick={() => onplace?.(p.id)}></button>
        {/each}
      {/if}
    </div>
  {:else}
    <div class="gl" bind:this={mapEl}></div>
  {/if}
  <MapStatus failed={mode === 'failed'} {note} text={noteText} top="50px" loading={mode === 'loading' || (mode === 'ready' && !tiled)}
    offlineText={t('offline.mapRoute')} onretry={draw} />
  {#if mode !== 'failed'}
    <LocateDisc size="small" loc={here.state} label={t(`travel.map.locate.${here.state}`)} onclick={locate} />
  {/if}
</div>

<style>
  /* its own stacking context: the pins' z-indexes (up to 1000, the selected one) stay under the sheet's sticky tabs and
     day chips; the map's chrome (the note, the locate button, the attribution) at 1001 over them */
  .tm { position: relative; isolation: isolate; width: 100%; height: 100%; min-height: 240px; overflow: hidden; background: #86CDEB; touch-action: none; -webkit-user-select: none; user-select: none; }
  .gl { position: absolute; inset: 0; touch-action: none; }
  .stub { position: absolute; inset: 0; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; padding: 52px 12px 12px; } /* (under the layer button) */

  /* the stops: NH's round pins, the day's colour, the number in Fredoka, a white rim, the little tail, a 44px hit */
  :global(.tm-pin) {
    appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; position: relative;
    width: var(--hit, 44px); height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  :global(.tm-head) {
    display: grid; place-items: center; min-width: 30px; height: 30px; padding: 0 5px; border-radius: 15px; box-sizing: border-box; white-space: nowrap;
    background: var(--pin); border: 3px solid #FFFFFF; color: #FFFFFF; font: 700 15px/1 var(--font-num); letter-spacing: -.02em;
    box-shadow: 0 2px 0 rgba(74, 58, 44, .28), 0 3px 8px rgba(74, 58, 44, .18); text-shadow: 0 1px 0 rgba(0, 0, 0, .18);
    transition: transform var(--dur-quick, 140ms) var(--ease-bounce);
  }
  :global(.tm-tail) {
    width: 0; height: 0; margin-top: -2px; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #FFFFFF;
    filter: drop-shadow(0 2px 0 rgba(74, 58, 44, .22));
  }
  :global(.tm-pin[aria-pressed='true'] .tm-head) { transform: translateY(-4px) scale(1.18); border-color: var(--c-yuzu); box-shadow: 0 0 0 2px var(--c-edge), 0 4px 10px rgba(74, 58, 44, .3); }
  :global(.tm-pin[aria-pressed='true'] .tm-tail) { border-top-color: var(--c-yuzu); }
  /* the selected pin's name: a small NH tag over its head */
  :global(.tm-tag) {
    display: none; position: absolute; left: 50%; bottom: calc(100% + 2px); translate: -50% 0; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    padding: 4px 10px; border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink);
    font: 700 13px/1.2 var(--font-ui); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge); pointer-events: none;
  }
  :global(.tm-pin[aria-pressed='true'] .tm-tag) { display: block; }
  :global(.tm-pin:active .tm-head) { transform: translateY(1px) scale(.96); }
  :global(.tm-pin:focus-visible) { outline: none; }
  :global(.tm-pin:focus-visible .tm-head) { outline: 3px solid var(--focus); outline-offset: 2px; }
  .cand { width: var(--hit); height: var(--hit); border: 0; border-radius: 50%; background: #FFFFFF; }
  /* a saved place's square (map/places/badge.ts), ringed in yuzu once chosen */
  .stub-place { width: var(--hit); height: var(--hit); border: 0; border-radius: 6px; background: #4A3A2C; box-shadow: inset 0 0 0 3px #FFF9E3; }
  .stub-place.sel { box-shadow: inset 0 0 0 3px #FFF9E3, 0 0 0 3px var(--c-yuzu); }

  /* the locate disc (map/LocateDisc, small) bottom-right; the attribution's pill (map/MapStatus) bottom-left */
  .tm > :global(.locate) { position: absolute; right: 2px; bottom: 4px; z-index: 1001; }
</style>
