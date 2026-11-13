<script lang="ts">
  // The trip map (docs/travel.md "Maps"): MapLibre on OpenFreeMap's vector tiles in our NookPhone theme, the day's legs
  // in its colour, its stops as numbered NH pins (one spot's stops one pin, '2·6'; the selected one tagged with its
  // name), the candidate layers, and the location dot behind the locate button. This component is light: the map's
  // library (engine.ts: maplibre-gl, its worker, the fonts) is its own chunk, fetched only when a map is drawn and
  // kept by the service worker from then on (with the tiles it drew: docs/travel.md "Offline"); offline before it came: a
  // 「もういちど」 panel, and a map whose tiles don't come shows its route with a note. Under mapStub() (the e2e's logic tier) no map is made: a stub with the same pins as buttons.
  // `window.__travelMap` (hooks on) is the specs' view.
  import { onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { mapStub } from '#lib/ui-state/testMode.ts';
  import { pick } from '../text.ts';
  import { LocWatch } from './geo.ts';
  import { mapLoader } from './cached.ts';
  import { candidatesOf, farFrom, layersOn, legsData, pinLabel, pinsOf } from './overlay.ts';
  import { dayColor, type MapState, type TripMapProps } from './types.ts';
  import type { Engine } from './engine.ts';

  let { places, legs, dayColors, day, selected, layers, locale, saved = false, onselect }: TripMapProps = $props();

  const loadEngine = lazy(() => import('./engine.ts'));

  let host: HTMLDivElement;
  let mapEl = $state<HTMLDivElement>();
  let mode = $state<MapState['mode']>(mapStub() ? 'stub' : 'loading');
  let loc = $state<MapState['loc']>('off');
  let engine: Engine | null = null;

  const input = () => ({ places, legs, dayColors, day, selected, layers, locale });
  const pins = $derived(pinsOf(places, day));
  const cands = $derived(candidatesOf(places, layers));

  /** A short note over the map: the location refused, or the phone far from the trip (8 s; the map offline stays). */
  let say = $state<'denied' | 'far' | null>(null);
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  function tell(k: 'denied' | 'far') {
    say = k;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => (say = null), 8000);
  }

  /** The next fix brings the map to it (the button tapped). */
  let flyNext = false;
  const watch = new LocWatch((w, first) => {
    loc = w.state;
    if (w.state === 'denied') tell('denied');
    const fly = first || flyNext;
    flyNext = false;
    // far from every stop (at home, before the trip): the dot where it is, the map kept on the route
    const far = !!w.fix && farFrom(places, w.fix);
    if (far && fly) tell('far');
    engine?.setFix(w.fix, fly && !far);
  });
  function locate() {
    if (watch.state === 'on' && watch.fix) {
      if (farFrom(places, watch.fix)) return (tell('far'), engine?.fit());
      return engine?.setFix(watch.fix, true);
    }
    flyNext = true;
    watch.start();
  }

  /** Back to the day's route (its chip tapped again). */
  export const fit = () => engine?.fit();

  const map = mapLoader(loadEngine, ({ createEngine }) => {
    engine = createEngine(mapEl!, input(), { select: (id) => onselect?.(id), mode: (m) => (mode = m) });
    engine.update(input());
    if (watch.fix) engine.setFix(watch.fix, false);
  }, { set: (m) => (mode = m), failed: () => mode === 'failed' });
  const draw = map.draw;

  const snapshot = (): MapState => ({
    mode, loc, candidates: cands.map((p) => p.id), legs: legsData(legs, dayColors, day).features.length, layers: layersOn(layers), center: engine?.center() ?? null,
    moving: engine?.moving() ?? false
  });

  // the props into the map
  $effect(() => {
    const i = input();
    engine?.update(i);
  });

  onMount(() => {
    // iOS Safari's own pinch-zoom of the page (the map pinches itself)
    const noPageZoom = (e: Event) => e.preventDefault();
    host.addEventListener('gesturestart', noPageZoom);
    // the watch runs only while the map is on screen and the tab shown
    let inView = true;
    const shown = () => watch.visible(inView && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([e]) => ((inView = e.isIntersecting), shown()));
    io.observe(host);
    document.addEventListener('visibilitychange', shown);
    const stop = map.start(mode === 'stub', '__travelMap', { state: snapshot });
    return () => {
      stop();
      clearTimeout(sayTimer);
      watch.stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', shown);
      host.removeEventListener('gesturestart', noPageZoom);
      engine?.destroy();
      engine = null;
    };
  });

  /** Offline with the trip's area saved (lib/offline): 「保存した範囲のみ」 over the map, whatever it drew. */
  const note = $derived(mode === 'failed' ? null : saved && !online.current ? 'saved' : mode === 'offline' ? 'offline' : say);
</script>

<div class="tm" bind:this={host} data-travel-map data-mode={mode} data-day={day} data-selected={selected ?? ''}>
  {#if mode === 'stub'}
    <div class="stub" data-map-stub data-stops={pins.flatMap((p) => p.ids).join(' ')}>
      {#each pins as p (p.id)}
        <button type="button" class="tm-pin" data-pin={p.id} data-sfx="tick" aria-pressed={!!selected && p.ids.includes(selected)} style:--pin={dayColor(dayColors, p.day)}
          aria-label={pinLabel(p, locale)} onclick={() => onselect?.(p.id)}><span class="tm-head">{p.n}</span><span class="tm-tail"></span></button>
      {/each}
      {#each cands as p (p.id)}
        <button type="button" class="cand" data-pin={p.id} data-sfx="tick" aria-pressed={p.id === selected} aria-label={pick(p.name, locale)}
          onclick={() => onselect?.(p.id)}></button>
      {/each}
    </div>
  {:else}
    <div class="gl" bind:this={mapEl}></div>
  {/if}
  {#if mode === 'failed'}
    <div class="failed" data-map-failed>
      <p>{t('travel.map.failed')}</p>
      <button type="button" class="btn small paper" data-map-retry data-sfx="tick" onclick={draw}>{t('travel.map.retry')}</button>
    </div>
  {:else}
    {#if note}<p class="note" data-map-note={note} role="status">{note === 'saved' ? t('offline.savedOnly') : t(`travel.map.note.${note}`)}</p>{/if}
    <button type="button" class="locate" data-locate={loc} data-sfx="tick" aria-label={t(`travel.map.locate.${loc}`)} aria-pressed={loc === 'on'} onclick={locate}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.8v3.4M12 17.8v3.4M2.8 12h3.4M17.8 12h3.4" />
        <circle cx="12" cy="12" r="6.2" />
        <circle class="in" cx="12" cy="12" r="2.6" />
      </svg>
    </button>
  {/if}
</div>

<style>
  /* its own stacking context: the pins' z-indexes (up to 1000, the selected one) stay under the sheet's sticky tabs and
     day chips; the map's chrome (the note, the locate button, the attribution) at 1001 over them */
  .tm { position: relative; isolation: isolate; width: 100%; height: 100%; min-height: 240px; overflow: hidden; background: #86CDEB; touch-action: none; -webkit-user-select: none; user-select: none; }
  .gl { position: absolute; inset: 0; touch-action: none; }
  .stub { position: absolute; inset: 0; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; padding: 52px 12px 12px; } /* (under the save pill) */

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
  :global(.tm-pin[aria-pressed='true'] .tm-head) { transform: translateY(-4px) scale(1.18); border-color: var(--c-yuzu, #FFD84D); box-shadow: 0 0 0 2px var(--c-edge, #937047), 0 4px 10px rgba(74, 58, 44, .3); }
  :global(.tm-pin[aria-pressed='true'] .tm-tail) { border-top-color: var(--c-yuzu, #FFD84D); }
  /* the selected pin's name: a small NH tag over its head */
  :global(.tm-tag) {
    display: none; position: absolute; left: 50%; bottom: calc(100% + 2px); translate: -50% 0; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    padding: 4px 10px; border-radius: var(--r-pill, 999px); background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C);
    font: 700 13px/1.2 var(--font-ui); box-shadow: inset 0 0 0 2px var(--c-edge, #937047), 0 2px 0 var(--c-edge, #937047); pointer-events: none;
  }
  :global(.tm-pin[aria-pressed='true'] .tm-tag) { display: block; }
  :global(.tm-pin:active .tm-head) { transform: translateY(1px) scale(.96); }
  :global(.tm-pin:focus-visible) { outline: none; }
  :global(.tm-pin:focus-visible .tm-head) { outline: 3px solid var(--focus, #4A3A2C); outline-offset: 2px; }
  .cand { width: var(--hit); height: var(--hit); border: 0; border-radius: 50%; background: #FFFFFF; }

  /* a note over the map (offline, the location off or far): a cream tag under the save pill and the layer button, the
     pins under it still tappable */
  .note {
    position: absolute; z-index: 1001; top: 50px; left: 50%; translate: -50% 0; width: max-content; max-width: calc(100% - 24px); margin: 0; padding: 6px 12px;
    border-radius: 14px; background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C); font: 700 var(--fs-s, 13px)/1.35 var(--font-ui); text-align: center;
    white-space: pre-line; pointer-events: none;
    box-shadow: inset 0 0 0 2px var(--c-edge, #937047), 0 3px 0 var(--c-edge, #937047);
  }
  /* the map's chunk or its WebGL didn't come (offline before a map ever drew): the paper, a word, a retry */
  .failed {
    position: absolute; inset: 0; z-index: 1001; display: grid; place-content: center; justify-items: center; gap: 12px; padding: 16px;
    background: var(--c-paper, #F5E4BC); color: var(--c-ink-soft, #6B5544); font: 700 var(--fs-body, 15px)/1.4 var(--font-ui); text-align: center;
  }
  .failed p { margin: 0; }

  /* the attribution (ODbL): small, cream, in the corner */
  .tm :global(.maplibregl-ctrl-attrib) {
    margin: 0 0 6px 6px; padding: 1px 7px; border-radius: var(--r-pill, 999px); background: rgba(255, 249, 227, .82);
    font: 500 9.5px/1.5 var(--font-ui); color: var(--c-ink-soft, #6B5544);
  }
  .tm :global(.maplibregl-ctrl-attrib a) { color: inherit; }
  .tm :global(.maplibregl-ctrl-bottom-left) { z-index: 1001; }

  /* the locate button: NavButton's disc (32px in the 44px hit, the kit's control), yuzu while on */
  .locate {
    position: absolute; right: 2px; bottom: 4px; z-index: 1001; appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer;
    width: var(--hit, 44px); height: var(--hit, 44px); display: grid; place-items: center; color: var(--text);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .locate::before { content: ''; position: absolute; inset: 6px; border-radius: 50%; background: var(--ctl); box-shadow: var(--sh-ctl-s); }
  .locate[aria-pressed='true'] { color: var(--c-ink, #4A3A2C); }
  .locate[aria-pressed='true']::before { background: var(--ctl-sel); }
  .locate[data-locate='asking'] svg { animation: tm-spin 1.2s linear infinite; }
  .locate[data-locate='denied'], .locate[data-locate='unavailable'] { color: var(--text-soft); }
  .locate:active::before { translate: 0 2px; box-shadow: var(--sh-ctl-s-press); }
  .locate:active svg { translate: 0 2px; }
  .locate:focus-visible { outline: none; }
  .locate:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  svg { position: relative; width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
  .in { fill: currentColor; stroke: none; }
  @keyframes tm-spin { to { rotate: 360deg; } }
  @media (prefers-reduced-motion: reduce) { .locate[data-locate='asking'] svg { animation: none; } }
</style>
