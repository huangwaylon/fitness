<script lang="ts">
  // A trail's map (docs/hiking.md "Map"): MapLibre on the region's raster topo (map/engine.ts, its own lazy chunk, kept
  // by the service worker once drawn, with the tiles seen: docs/hiking.md "Offline"), the track, its ends and
  // waypoints, the scrub's dot, the location dot with its heading cone and accuracy circle, and the in-hike layers (walked,
  // off-route, OSM's other trails and the fork ahead: docs/hiking.md "In-hike map"; map/style.ts C), the saved places'
  // squares (map/places/layer.ts). Under mapStub() (the e2e's logic tier) no map is made: a stub that draws the track
  // and the dots as SVG and says where they are. The maps' one MapStatus: offline before the chunk came, a note (drawn
  // by itself once back online), else a retry; no tile 2 s in, 「地図を読み込み中…」; the tiles not coming, the track
  // alone with a note; the maps' cream attribution pill over the peek, hidden while the sheet is full.
  // `window.__trailMap` (hooks on) is the specs' view of a drawn map, and its turn as a gesture's (`rotate`).
  import { REACH } from '../map/sheet.svelte.ts';
  import { onMount } from 'svelte';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { mapStub } from '#lib/ui-state/testMode.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import type { Prepared } from '#lib/hiking/track.ts';
  import type { Region } from '#lib/hiking/types.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { pick } from '../travel/text.ts';
  import { C } from './map/style.ts';
  import type { Fix, Heading, Highlight, Loc } from './map/engine.ts';
  import type { MapPlace } from '../map/places/layer.ts';
  import { EngineFeed, type NetView } from './map/feed.svelte.ts';
  import type { Cam } from './map/follow.ts';
  import { mapLoader } from '../map/cached.ts';
  import MapStatus from '../map/MapStatus.svelte';
  import type { MapMode } from '../map/types.ts';

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
    /** The map's notes' top (MapStatus: px under the map's own top controls and the top slot). */
    noteTop: number;
    /** The sheet at full: the attribution hidden. */
    covered?: boolean;
    /** The saved places near the track (docs/hiking.md "Saved places"): the layer's toggle, hike mode's smaller squares,
     *  the one chosen (ringed). */
    places?: { pts: readonly MapPlace[]; shown: boolean; small: boolean; sel: MapPlace | null };
    /** The map turned (its bearing, deg), a one-finger pan (the camera let go: follow.ts); a saved place tapped, a tap
     *  on empty map. */
    onbearing?: (deg: number) => void;
    onpan?: () => void;
    onplace?: (id: string) => void;
    onmiss?: () => void;
  }
  let { region, center, prep, scrub, fix, heading = null, cam, walked = null, off = null, net, hl = null, bottom, clear = 0, top, saved = false, noteTop, covered = false, places, onbearing, onpan, onplace, onmiss }: Props = $props();

  const loadEngine = lazy(() => import('./map/engine.ts'));
  let el: HTMLDivElement | undefined = $state();
  let mode = $state<MapMode>(mapStub() ? 'stub' : 'loading');
  /** A topo tile has come (the loading note goes). */
  let tiled = $state(false);
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
    get places() { return places; },
    get bottom() { return bottom + clear; },
    get top() { return top; }
  });

  /** The next fix brings the map to it (the locate button). */
  export const flyToFix = () => (fix ? feed.engine?.setFix(fix, true) : (feed.flyNext = true));
  /** The compass disc: north up. */
  export const north = () => feed.engine?.north();
  /** The chosen square kept clear of its card over the map's bottom `cover` px. */
  export const reveal = (p: MapPlace, cover: number) => feed.engine?.reveal(p, cover);

  const map = mapLoader(loadEngine, ({ createEngine }) => {
    // (the props follow it in: feed.svelte.ts)
    if (el) feed.engine = createEngine(el, { region, center, bottom, top, saved }, {
      mode: (m) => (mode = m),
      tiles: () => (tiled = true),
      bearing: (b) => onbearing?.(b),
      pan: () => onpan?.(),
      place: (id) => onplace?.(id),
      miss: () => onmiss?.()
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

<div class="map map-attrib" class:covered data-trail-map data-mode={mode} role="application" aria-label={pick(S.mapAria, i18n.locale)} style:--peek="{bottom + REACH}px"
  data-scrub={scrub ? `${scrub.lon.toFixed(5)},${scrub.lat.toFixed(5)}` : ''}
  data-walked={walked === null ? '' : Math.round(walked)} data-off={off ? 1 : 0} data-loc-stale={fix?.stale ? 1 : 0} data-cam={cam ?? 'off'} data-heading={heading ? Math.round(heading.deg) : ''}
  data-places={places?.shown ? places.pts.length : 0} data-ref={net?.net && net.shown ? net.net.lines.length : 0} data-forks={net?.net && net.shown && net.forks ? net.net.forks.length : 0} data-hl={hl ? 1 : 0}>
  {#if mode === 'stub'}
    {#if stub}
      <!-- (a tap on the stub's drawing: an empty map's) -->
      <svg class="stub" viewBox="-5 -5 110 110" data-map-stub role="presentation" data-sfx="none" onclick={() => onmiss?.()}>
        <polyline points={stub.line} fill="none" stroke={C.track} stroke-width="1.2" />
        {#if net?.net && net.shown}{#each net.net.lines as l, k (k)}<polyline points={l.c.map((c) => stub.P(c[0], c[1])).join(' ')} fill="none" stroke={C.net} stroke-width="0.6" />{/each}{/if}
        {#if scrub}{@const [cx, cy] = stub.P(scrub.lon, scrub.lat).split(',')}<circle {cx} {cy} r="2" fill={C.scrub} data-scrub-dot />{/if}
        {#if fix}{@const [cx, cy] = stub.P(fix.lon, fix.lat).split(',')}<circle {cx} {cy} r="2" fill={fix.stale ? C.rim : C.gps} stroke={fix.stale ? C.grey : 'none'} stroke-width="0.6" data-loc-dot />{/if}
      </svg>
      {#if places?.shown}
        <div class="stub-places">
          {#each places.pts as p (p.id)}<button type="button" class="stub-place" class:sel={places.sel?.id === p.id} data-map-place={p.id} data-sfx="tick" aria-label={p.name} onclick={() => onplace?.(p.id)}></button>{/each}
        </div>
      {/if}
    {/if}
  {:else}
    <div class="gl" bind:this={el}></div>
  {/if}
  <MapStatus failed={mode === 'failed'} note={saved && !online.current && mode !== 'stub' ? 'saved' : mode === 'offline' ? 'offline' : null}
    loading={(mode === 'loading' || mode === 'ready') && !tiled} offlineText={t('offline.mapRoute')} top="{noteTop}px" bottom="30%" onretry={draw} />
</div>

<style>
  .map { position: absolute; inset: 0; isolation: isolate; background: var(--ctl-off); overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
  .gl { position: absolute; inset: 0; }
  .stub { position: absolute; inset: 70px 20px 45% 20px; width: calc(100% - 40px); height: auto; max-height: 50%; }
  .stub-places { position: absolute; top: calc(var(--ui-top, 0px) + 150px); left: 24px; display: flex; gap: 8px; }
  .stub-place { width: 16px; height: 16px; padding: 0; border: 2px solid #FFF9E3; border-radius: 4px; background: #4A3A2C; }
  .stub-place.sel { outline: 3px solid #FFD84D; }
</style>
