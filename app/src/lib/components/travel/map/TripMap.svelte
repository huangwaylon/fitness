<script lang="ts">
  // The trip map (docs/travel.md "Maps"): MapLibre on OpenFreeMap's vector tiles in our NookPhone theme, the trip's legs in the
  // day colours, its stops as numbered NH pins, the candidate layers, and the location dot behind the locate button.
  // This component is light: the map's library (engine.ts: maplibre-gl, its worker, the fonts) is its own chunk, fetched
  // only when a map is drawn. Under drawOff() (the e2e's logic tier) no map is made: a stub tells the same state in
  // data-* and its pins are buttons. `window.__travelMap` (hooks on) is the specs' view.
  import { onMount } from 'svelte';
  import { hooksOn } from '#lib/ui-state/preview.ts';
  import { drawOff } from '#lib/ui-state/testMode.ts';
  import { LocWatch } from './geo.ts';
  import { candidatesOf, layersOn, legsData, stopsOf } from './overlay.ts';
  import { dayColor, nameOf, type MapState, type TripMapProps } from './types.ts';
  import type { Engine } from './engine.ts';

  let { places, legs, dayColors, day, selected, layers, locale, tiles, onselect }: TripMapProps = $props();

  let host: HTMLDivElement;
  let mapEl = $state<HTMLDivElement>();
  let mode = $state<MapState['mode']>(drawOff() ? 'stub' : 'loading');
  let loc = $state<MapState['loc']>('off');
  let engine: Engine | null = null;

  const input = () => ({ places, legs, dayColors, day, selected, layers, locale });
  const stops = $derived(stopsOf(places, day));
  const cands = $derived(candidatesOf(places, layers));

  const watch = new LocWatch((w, first) => {
    loc = w.state;
    engine?.setFix(w.fix, first || flyNext);
    flyNext = false;
  });
  /** The next fix brings the map to it (the button tapped while on: re-centre). */
  let flyNext = false;
  function locate() {
    if (watch.state === 'on' && watch.fix) return engine?.setFix(watch.fix, true);
    flyNext = true;
    watch.start();
  }

  function snapshot(): MapState {
    const v = engine?.view() ?? null;
    return {
      mode, day, selected: selected ?? null, locale, loc,
      stops: stops.map((p) => p.id), candidates: cands.map((p) => p.id), legs: legsData(legs, dayColors, day).features.length,
      layers: layersOn(layers), zoom: v?.zoom ?? null, center: v?.center ?? null
    };
  }

  // the props into the map
  $effect(() => {
    const i = input();
    engine?.update(i);
  });

  onMount(() => {
    let gone = false;
    // iOS Safari's own pinch-zoom of the page (the map pinches itself)
    const noPageZoom = (e: Event) => e.preventDefault();
    host.addEventListener('gesturestart', noPageZoom);
    // the watch runs only while the map is on screen and the tab shown
    let inView = true;
    const shown = () => watch.visible(inView && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([e]) => ((inView = e.isIntersecting), shown()));
    io.observe(host);
    document.addEventListener('visibilitychange', shown);
    if (mode !== 'stub')
      void import('./engine.ts').then(({ createEngine }) => {
        if (gone) return;
        const e = createEngine(mapEl!, input(), tiles, {
          select: (id) => onselect?.(id),
          ready: () => (mode = 'ready'),
          lost: (on) => (mode = on ? 'lost' : 'ready')
        });
        engine = e;
        e.update(input());
        if (watch.fix) e.setFix(watch.fix, false);
      });
    const hooks = hooksOn(new URLSearchParams(location.search));
    const hook = { state: snapshot, map: () => engine?.map ?? null };
    if (hooks) (window as unknown as { __travelMap?: unknown }).__travelMap = hook;
    return () => {
      gone = true;
      watch.stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', shown);
      host.removeEventListener('gesturestart', noPageZoom);
      engine?.destroy();
      engine = null;
      const w = window as unknown as { __travelMap?: unknown };
      if (w.__travelMap === hook) delete w.__travelMap;
    };
  });

  const LOCATE = {
    ja: { off: 'いまいる ばしょ', asking: 'さがしています…', on: 'いまいる ばしょへ', denied: 'いちじょうほうが オフです', unavailable: 'ばしょが わかりません' },
    en: { off: 'Where am I', asking: 'Finding you…', on: 'Back to me', denied: 'Location is off', unavailable: "Can't find you" }
  } as const;
</script>

<div class="tm" bind:this={host} data-travel-map data-mode={mode} data-day={day} data-selected={selected ?? ''} data-loc={loc}>
  {#if mode === 'stub'}
    <div class="stub" data-map-stub data-stops={stops.map((p) => p.id).join(' ')} data-candidates={cands.map((p) => p.id).join(' ')} data-layers={layersOn(layers).join(' ')}>
      {#each stops as p (p.id)}
        <button type="button" class="tm-pin" data-pin={p.id} data-sfx="tick" aria-pressed={p.id === selected} style:--pin={dayColor(dayColors, p.day ?? 1)}
          aria-label={`${p.i ?? ''} ${nameOf(p.name, locale)}`.trim()} onclick={() => onselect?.(p.id)}><span class="tm-head">{p.i ?? ''}</span><span class="tm-tail"></span></button>
      {/each}
      {#each cands as p (p.id)}
        <button type="button" class="cand" data-pin={p.id} data-kind={p.kind} data-sfx="tick" aria-pressed={p.id === selected} aria-label={nameOf(p.name, locale)}
          onclick={() => onselect?.(p.id)}></button>
      {/each}
    </div>
  {:else}
    <div class="gl" bind:this={mapEl}></div>
  {/if}
  <button type="button" class="locate" data-locate={loc} data-sfx="tick" aria-label={LOCATE[locale][loc]} aria-pressed={loc === 'on'} onclick={locate}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8v3.4M12 17.8v3.4M2.8 12h3.4M17.8 12h3.4" />
      <circle cx="12" cy="12" r="6.2" />
      <circle class="in" cx="12" cy="12" r="2.6" />
    </svg>
  </button>
</div>

<style>
  .tm { position: relative; width: 100%; height: 100%; min-height: 240px; overflow: hidden; background: #86CDEB; touch-action: none; -webkit-user-select: none; user-select: none; }
  .gl { position: absolute; inset: 0; touch-action: none; }
  .stub { position: absolute; inset: 0; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; padding: 12px; }

  /* the stops: NH's round pins, the day's colour, the number in Fredoka, a white rim, the little tail, a 44px hit */
  :global(.tm-pin) {
    appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; position: relative;
    width: var(--hit, 44px); height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  :global(.tm-head) {
    display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; box-sizing: border-box;
    background: var(--pin); border: 3px solid #FFFFFF; color: #FFFFFF; font: 700 15px/1 var(--font-num); letter-spacing: -.02em;
    box-shadow: 0 2px 0 rgba(74, 58, 44, .28), 0 3px 8px rgba(74, 58, 44, .18); text-shadow: 0 1px 0 rgba(0, 0, 0, .18);
    transition: transform var(--dur-quick, 140ms) var(--ease-bounce);
  }
  :global(.tm-tail) {
    width: 0; height: 0; margin-top: -2px; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #FFFFFF;
    filter: drop-shadow(0 2px 0 rgba(74, 58, 44, .22));
  }
  :global(.tm-pin[aria-pressed='true'] .tm-head) { transform: translateY(-4px) scale(1.18); border-color: var(--c-yuzu, #FFD84D); box-shadow: 0 0 0 2px var(--c-edge, #937047), 0 4px 10px rgba(74, 58, 44, .3); }
  :global(.tm-pin[aria-pressed='true'] .tm-tail) { border-top-color: var(--c-yuzu, #FFD84D); }
  :global(.tm-pin:active .tm-head) { transform: translateY(1px) scale(.96); }
  :global(.tm-pin:focus-visible) { outline: none; }
  :global(.tm-pin:focus-visible .tm-head) { outline: 3px solid var(--focus, #4A3A2C); outline-offset: 2px; }
  .cand { width: var(--hit); height: var(--hit); border: 0; border-radius: 50%; background: #FFFFFF; }

  /* the attribution (ODbL): small, cream, in the corner */
  .tm :global(.maplibregl-ctrl-attrib) {
    margin: 0 0 6px 6px; padding: 1px 7px; border-radius: var(--r-pill, 999px); background: rgba(255, 249, 227, .82);
    font: 500 9.5px/1.5 var(--font-ui); color: var(--c-ink-soft, #6B5544);
  }
  .tm :global(.maplibregl-ctrl-attrib a) { color: inherit; }
  .tm :global(.maplibregl-ctrl-bottom-left) { z-index: 1; }

  /* the locate button: the app's cream disc (EyeToggle's measures), yuzu while on */
  .locate {
    position: absolute; right: 8px; bottom: 10px; z-index: 2; appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer;
    width: var(--hit, 44px); height: var(--hit, 44px); display: grid; place-items: center; color: var(--c-ink-soft, #6B5544);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .locate::before {
    content: ''; position: absolute; left: 2px; top: 2px; width: 40px; height: 40px; border-radius: 50%;
    background: var(--c-cream, #FFF9E3); box-shadow: inset 0 0 0 2px var(--c-edge, #937047), 0 var(--lip-h, 4px) 0 var(--c-edge, #937047);
  }
  .locate[aria-pressed='true'] { color: var(--c-ink, #4A3A2C); }
  .locate[aria-pressed='true']::before { background: var(--c-yuzu, #FFD84D); }
  .locate[data-locate='asking'] svg { animation: tm-spin 1.2s linear infinite; }
  .locate[data-locate='denied'], .locate[data-locate='unavailable'] { color: #A88B68; }
  .locate:active::before { translate: 0 2px; box-shadow: inset 0 0 0 2px var(--c-edge, #937047), 0 1px 0 var(--c-edge, #937047); }
  .locate:active svg { translate: 0 2px; }
  .locate:focus-visible { outline: none; }
  .locate:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  svg { position: relative; width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
  .in { fill: currentColor; stroke: none; }
  @keyframes tm-spin { to { rotate: 360deg; } }
  @media (prefers-reduced-motion: reduce) { .locate[data-locate='asking'] svg { animation: none; } }
</style>
