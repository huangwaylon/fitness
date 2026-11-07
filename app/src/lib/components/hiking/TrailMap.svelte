<script lang="ts">
  // A trail's map (docs/hiking.md "Map"): MapLibre on the region's raster topo (map/engine.ts, its own lazy chunk, kept
  // by the service worker once drawn, with the tiles seen: docs/hiking.md "Offline"), the track, its ends and
  // waypoints, the scrub's dot, the location dot (map/style.ts C). Under drawOff() (the e2e's logic tier) no map is
  // made: a stub that draws the track and the dots as SVG and says where they are. Offline before the chunk came: a retry; the tiles not coming: the track alone, with a note.
  // `window.__trailMap` (hooks on) is the specs' view of a drawn map.
  import { onMount } from 'svelte';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { drawOff } from '#lib/ui-state/testMode.ts';
  import { hooksOn } from '#lib/ui-state/preview.ts';
  import type { Prepared } from '#lib/hiking/track.ts';
  import type { Region } from '#lib/hiking/types.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';
  import { C } from './map/style.ts';
  import type { Fix } from './map/engine.ts';
  import { EngineFeed } from './map/feed.svelte.ts';
  import { engineReady } from '../travel/map/cached.ts';

  interface Props {
    region: Region;
    center: Fix;
    prep: Prepared | null;
    scrub: Fix | null;
    fix: Fix | null;
    /** The px the sheet's peek covers at the bottom (the track is fitted above it; the credit kept over it). */
    bottom: number;
    /** The trail's area is saved for offline (lib/offline): offline, 「保存した範囲のみ」, the topo to its z16. */
    saved?: boolean;
  }
  let { region, center, prep, scrub, fix, bottom, saved = false }: Props = $props();
  let online = $state(typeof navigator === 'undefined' || navigator.onLine);

  const loadEngine = lazy(() => import('./map/engine.ts'));
  let el: HTMLDivElement | undefined = $state();
  let mode = $state<'stub' | 'loading' | 'ready' | 'offline' | 'failed' | 'lost'>(drawOff() ? 'stub' : 'loading');
  let gone = false;
  const feed = new EngineFeed({
    get prep() { return prep; },
    get scrub() { return scrub; },
    get fix() { return fix; },
    get bottom() { return bottom; }
  });

  export const zoom = (by: 1 | -1) => feed.engine?.zoom(by);
  /** The next fix brings the map to it (the locate button). */
  export const flyToFix = () => (fix ? feed.engine?.setFix(fix, true) : (feed.flyNext = true));

  function draw() {
    mode = 'loading';
    engineReady().then((ok) => (ok ? loadEngine() : Promise.reject(new Error('offline')))).then(
      ({ createEngine }) => {
        if (gone || !el) return;
        try {
          // (the props follow it in: feed.svelte.ts)
          feed.engine = createEngine(el, { region, center, bottom, savedOnly: saved && !navigator.onLine }, { mode: (m) => (mode = m) });
        } catch (e) {
          console.error(e);
          mode = 'failed';
        }
      },
      () => !gone && (mode = 'failed')
    );
  }

  onMount(() => {
    const on = () => (online = navigator.onLine);
    addEventListener('online', on);
    addEventListener('offline', on);
    const back = () => mode === 'failed' && draw();
    if (mode !== 'stub') (draw(), addEventListener('online', back));
    const hook = { state: () => ({ mode, ...feed.engine?.state() }) };
    const w = window as unknown as { __trailMap?: unknown };
    if (hooksOn(new URLSearchParams(location.search))) w.__trailMap = hook;
    return () => {
      gone = true;
      removeEventListener('online', back);
      removeEventListener('online', on);
      removeEventListener('offline', on);
      feed.engine?.destroy();
      feed.engine = null;
      if (w.__trailMap === hook) delete w.__trailMap;
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
  data-scrub={scrub ? `${scrub.lon.toFixed(5)},${scrub.lat.toFixed(5)}` : ''}>
  {#if mode === 'stub'}
    {#if stub}
      <svg class="stub" viewBox="-5 -5 110 110" data-map-stub>
        <polyline points={stub.line} fill="none" stroke={C.track} stroke-width="1.2" />
        {#if scrub}{@const [cx, cy] = stub.P(scrub.lon, scrub.lat).split(',')}<circle {cx} {cy} r="2" fill={C.scrub} data-scrub-dot />{/if}
      </svg>
    {/if}
  {:else}
    <div class="gl" bind:this={el}></div>
  {/if}
  {#if mode === 'failed'}
    <div class="failed" data-map-failed>
      <p>{pick(S.mapFailed, i18n.locale)}</p>
      <button type="button" class="btn small paper" data-sfx="tick" onclick={draw}>{pick(S.retry, i18n.locale)}</button>
    </div>
  {:else if saved && !online && mode !== 'stub'}
    <p class="note" role="status" data-map-note="saved">{t('offline.savedOnly')}</p>
  {:else if mode === 'offline'}
    <p class="note" role="status" data-map-note>{pick(S.mapOffline, i18n.locale)}</p>
  {/if}
</div>

<style>
  .map { position: absolute; inset: 0; background: var(--ctl-off); overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; }
  .gl { position: absolute; inset: 0; }
  .stub { position: absolute; inset: 70px 20px 45% 20px; width: calc(100% - 40px); height: auto; max-height: 50%; }
  .failed {
    position: absolute; inset: 0 0 30% 0; display: grid; place-content: center; justify-items: center; gap: 12px; padding: 16px;
    color: var(--text-soft); font: 700 var(--fs-body)/1.4 var(--font-ui); text-align: center;
  }
  .failed p { margin: 0; }
  .note {
    position: absolute; z-index: 2; top: calc(var(--ui-top) + 52px); left: 50%; translate: -50% 0; width: max-content; max-width: calc(100% - 32px); margin: 0;
    padding: 6px 12px; border-radius: var(--r-pill); background: var(--c-ink); color: var(--c-cream); font: 700 var(--fs-s)/1.3 var(--font-ui); box-shadow: var(--sh-float);
  }
  /* MapLibre's attribution, small, on the card, always over the sheet's peek (GSI's 出典 must show) */
  .map :global(.maplibregl-ctrl-bottom-right) { bottom: var(--peek, 0px); transition: bottom .32s var(--ease-soft); }
  .map :global(.maplibregl-ctrl-attrib) { font-size: 9px; background: color-mix(in srgb, var(--c-card) 86%, transparent); color: var(--c-ink-soft); }
  .map :global(.maplibregl-ctrl-attrib a) { color: var(--c-leaf-text); }
</style>
