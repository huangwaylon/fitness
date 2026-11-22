<script lang="ts">
  // A trail's map (docs/hiking.md "Map"): MapLibre on the region's raster topo (map/engine.ts, its own lazy chunk, kept
  // by the service worker once drawn, with the tiles seen: docs/hiking.md "Offline"), the track, its ends and
  // waypoints, the scrub's dot, the location dot with its heading cone and accuracy circle, and the in-hike layers (walked,
  // off-route, OSM's other trails and the fork ahead: docs/hiking.md "In-hike map"; map/style.ts C). Under mapStub()
  // (the e2e's logic tier) no map is made: a stub that draws the track and the dots as SVG and says where they are.
  // Offline before the chunk came: a retry; the tiles not coming: the track alone, with a note.
  // `window.__trailMap` (hooks on) is the specs' view of a drawn map, and its turn as a gesture's (`rotate`).
  import { onMount } from 'svelte';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { mapStub } from '#lib/ui-state/testMode.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import type { Prepared } from '#lib/hiking/track.ts';
  import type { Region } from '#lib/hiking/types.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';
  import { C } from './map/style.ts';
  import type { Fix, Heading, Highlight, Loc } from './map/engine.ts';
  import { EngineFeed, type NetView } from './map/feed.svelte.ts';
  import type { Cam } from './map/follow.ts';
  import { mapLoader } from '../travel/map/cached.ts';
  import MapStatus from '../travel/map/MapStatus.svelte';

  interface Props {
    region: Region;
    center: Fix;
    prep: Prepared | null;
    scrub: Fix | null;
    fix: Loc | null;
    heading?: Heading | null;
    cam?: Cam;
    walked?: number | null;
    off?: [Fix, Fix] | null;
    net?: NetView;
    hl?: Highlight | null;
    /** The px the sheet's peek covers at the bottom (the track is fitted above it; the credit kept over it). */
    bottom: number;
    /** More px kept clear over the peek when fitting (the legend chip bottom-left). */
    clear?: number;
    /** The px the controls cover at the top (‹ ✕, the save pill, ＋ −: the track is fitted under them). */
    top: number;
    /** The trail's area is saved for offline (lib/offline): the topo capped at its z16 (online too); offline,
     *  「保存した範囲のみ」. */
    saved?: boolean;
    /** The offline note's top (lower while the banner or the junction card holds the top slot). */
    noteTop?: string;
    /** The map turned (its bearing, deg), a one-finger pan (the camera let go: follow.ts). */
    onbearing?: (deg: number) => void;
    onpan?: () => void;
  }
  let { region, center, prep, scrub, fix, heading = null, cam, walked = null, off = null, net, hl = null, bottom, clear = 0, top, saved = false, noteTop = 'calc(var(--ui-top) + 52px)', onbearing, onpan }: Props = $props();

  const loadEngine = lazy(() => import('./map/engine.ts'));
  let el: HTMLDivElement | undefined = $state();
  let mode = $state<'stub' | 'loading' | 'ready' | 'offline' | 'failed' | 'lost'>(mapStub() ? 'stub' : 'loading');
  const feed = new EngineFeed({
    get prep() { return prep; },
    get scrub() { return scrub; },
    get fix() { return fix; },
    get heading() { return heading; },
    get cam() { return cam; },
    get walked() { return walked; },
    get off() { return off; },
    get net() { return net; },
    get hl() { return hl; },
    get saved() { return saved; },
    get bottom() { return bottom + clear; },
    get top() { return top; }
  });

  export const zoom = (by: 1 | -1) => feed.engine?.zoom(by);
  /** The next fix brings the map to it (the locate button). */
  export const flyToFix = () => (fix ? feed.engine?.setFix(fix, true) : (feed.flyNext = true));
  /** The compass disc: north up. */
  export const north = () => feed.engine?.north();

  const map = mapLoader(loadEngine, ({ createEngine }) => {
    // (the props follow it in: feed.svelte.ts)
    if (el) feed.engine = createEngine(el, { region, center, bottom, top, saved }, {
      mode: (m) => (mode = m),
      bearing: (b) => onbearing?.(b),
      pan: () => onpan?.()
    });
  }, { set: (m) => (mode = m), failed: () => mode === 'failed' });
  const draw = map.draw;

  onMount(() => {
    const stop = map.start(mode === 'stub', '__trailMap', {
      state: () => ({ mode, ...feed.engine?.state() }),
      rotate: (deg: number) => feed.engine?.rotateTo(deg)
    });
    return () => {
      stop();
      feed.engine?.destroy();
      feed.engine = null;
    };
  });

  // the stub's drawing: the track on a flat projection fitted to its box
  const stub = $derived.by(() => {
    if (mode !== 'stub' || !prep) return null;
    const k = Math.cos((prep.pts[0][1] * Math.PI) / 180);
    const xs = prep.pts.map((p) => p[0] * k), ys = prep.pts.map((p) => -p[1]);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), s = 100 / Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0, 1e-9);
    const P = (lon: number, lat: number) => `${((lon * k - x0) * s).toFixed(2)},${((-lat - y0) * s).toFixed(2)}`;
    return { P, line: prep.pts.map((p) => P(p[0], p[1])).join(' ') };
  });
</script>

<div class="map" data-trail-map data-mode={mode} role="application" aria-label={pick(S.mapAria, i18n.locale)} style:--peek="{bottom}px"
  data-scrub={scrub ? `${scrub.lon.toFixed(5)},${scrub.lat.toFixed(5)}` : ''}
  data-walked={walked === null ? '' : Math.round(walked)} data-off={off ? 1 : 0} data-loc-stale={fix?.stale ? 1 : 0} data-cam={cam ?? 'off'} data-heading={heading ? Math.round(heading.deg) : ''}
  data-ref={net?.net && net.shown ? net.net.lines.length : 0} data-forks={net?.net && net.shown && net.forks ? net.net.forks.length : 0} data-hl={hl ? 1 : 0}>
  {#if mode === 'stub'}
    {#if stub}
      <svg class="stub" viewBox="-5 -5 110 110" data-map-stub>
        <polyline points={stub.line} fill="none" stroke={C.track} stroke-width="1.2" />
        {#if net?.net && net.shown}{#each net.net.lines as l, k (k)}<polyline points={l.c.map((c) => stub.P(c[0], c[1])).join(' ')} fill="none" stroke={C.net} stroke-width="0.6" stroke-dasharray="1 1" />{/each}{/if}
        {#if scrub}{@const [cx, cy] = stub.P(scrub.lon, scrub.lat).split(',')}<circle {cx} {cy} r="2" fill={C.scrub} data-scrub-dot />{/if}
        {#if fix}{@const [cx, cy] = stub.P(fix.lon, fix.lat).split(',')}<circle {cx} {cy} r="2" fill={fix.stale ? C.rim : C.gps} stroke={fix.stale ? C.grey : 'none'} stroke-width="0.6" data-loc-dot />{/if}
      </svg>
    {/if}
  {:else}
    <div class="gl" bind:this={el}></div>
  {/if}
  <MapStatus failed={mode === 'failed'} note={saved && !online.current && mode !== 'stub' ? 'saved' : mode === 'offline' ? 'offline' : null}
    top={noteTop} bottom="30%" onretry={draw} />
</div>

<style>
  .map { position: absolute; inset: 0; isolation: isolate; background: var(--ctl-off); overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
  .gl { position: absolute; inset: 0; }
  .stub { position: absolute; inset: 70px 20px 45% 20px; width: calc(100% - 40px); height: auto; max-height: 50%; }
  /* MapLibre's attribution (GSI's 出典, OSM's credit while its trails draw), small, on the card, bottom-left over the
     sheet's peek (bottom-right holds the location and compass discs) */
  .map :global(.maplibregl-ctrl-bottom-left) { bottom: var(--peek, 0px); left: var(--safe-left, 0px); transition: bottom .32s var(--ease-soft); }
  .map :global(.maplibregl-ctrl-attrib) { font-size: 9px; background: color-mix(in srgb, var(--c-card) 86%, transparent); color: var(--c-ink-soft); }
  .map :global(.maplibregl-ctrl-attrib a) { color: var(--c-leaf-text); }
</style>
