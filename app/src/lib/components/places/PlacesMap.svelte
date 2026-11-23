<script lang="ts">
  // 保存した場所's map (docs/places.md "Map"): MapLibre on the trip map's basemap with the matches clustered (map/engine.ts,
  // its own lazy chunk, kept by the service worker once drawn, with the tiles seen); offline before the chunk came, or
  // the tiles not coming: 「地図はオフラインです（場所のみ表示）」 over what it can draw (the list works the same). Under
  // mapStub() (the e2e's logic tier) no map is made: a stub with the first matches as buttons, the pin and the dot
  // said in attributes. `window.__placesMap` (testHooks: map/cached.ts) is the specs' view: state(), longPress(lng, lat),
  // pan(), bounds() (the stub's browse box, as a moveend would say it), and `fit` there sets the box about the points.
  // The attribution the maps' one cream pill (MapStatus's .map-attrib), hidden while the sheet is at full.
  import { REACH } from '../map/sheet.svelte.ts';
  import { onMount, untrack } from 'svelte';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { mapStub } from '#lib/ui-state/testMode.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { S } from '#lib/places/strings.ts';
  import type { LL } from '#lib/places/geo.ts';
  import { CAT_STYLE } from '#lib/places/cats.ts';
  import { pick } from '../travel/text.ts';
  import { mapLoader } from '../map/cached.ts';
  import MapStatus from '../map/MapStatus.svelte';
  import type { Fix, MapMode } from '../map/types.ts';
  import type { Cam, Engine, Pt, Sel } from './map/engine.ts';
  import type { Box } from '#lib/places/search.ts';

  interface Props {
    pts: readonly Pt[];
    sel: Sel | null;
    pin: LL | null;
    fix: Fix | null;
    /** The fix from before the page last hid (the dot grey). */
    stale?: boolean;
    /** The first view (the last one kept, else the places' middle). */
    cam: Cam;
    /** A fresh phone's first view (no view kept): the map opens about these, once (null: `cam`'s). */
    fitFirst?: readonly LL[] | null;
    /** The px the sheet covers (the attribution and the flights kept above it) and the controls at the top. */
    bottom: number;
    top: number;
    /** The sheet at full (or the card as tall): the attribution hidden. */
    covered?: boolean;
    /** A note of the view's own over the map (location refused), under the offline one. */
    say?: string | null;
    /** Browse mode's box: the map between these px (the sheet's peek, the bar), said on each moveend and when ready. */
    boxPad: { bottom: number; top: number };
    onview: (box: Box) => void;
    onselect: (id: string) => void;
    onpoint: (at: LL) => void;
    onmoved: () => void;
    oncam: (c: Cam) => void;
  }
  let { pts, sel, pin, fix, stale = false, cam, fitFirst = null, bottom, top, covered = false, say = null, boxPad, onview, onselect, onpoint, onmoved, oncam }: Props = $props();
  const L = $derived(i18n.locale);

  const loadEngine = lazy(() => import('./map/engine.ts'));
  let el: HTMLDivElement | undefined = $state();
  let mode = $state<MapMode>(mapStub() ? 'stub' : 'loading');
  let engine = $state.raw<Engine | null>(null);
  /** A basemap tile has come (the loading note goes). */
  let tiled = $state(false);
  /** The stub's view: its centre, as a pan moves it. */
  let stubCenter = $state.raw<LL | null>(null);

  export const zoom = (by: 1 | -1) => engine?.zoom(by);
  export const fly = (at: LL, z?: number) => (engine ? engine.fly(at, z) : (stubCenter = at));
  export const view = (): { center: LL; r: number } => engine?.view() ?? { center: stubCenter ?? cam.center, r: 1000 };
  const sayBox = () => engine && onview(engine.bounds(boxPad.bottom, boxPad.top));
  /** 全体を見る: the map about these (the stub: its box). */
  export function fit(lls: readonly LL[]) {
    if (engine) return engine.fit(lls, boxPad.bottom, top);
    if (mode === 'stub' && lls.length) onview([Math.min(...lls.map((l) => l[0])), Math.min(...lls.map((l) => l[1])), Math.max(...lls.map((l) => l[0])), Math.max(...lls.map((l) => l[1]))]);
  }

  let fitted = false;
  const map = mapLoader(loadEngine, ({ createEngine }) => {
    if (!el) return;
    engine = createEngine(el, { locale: L, cam, bottom, top }, {
      mode: (m) => (mode = m),
      tile: () => (tiled = true),
      select: (id) => onselect(id),
      point: (at) => onpoint(at),
      moved: () => onmoved(),
      cam: (c) => (oncam(c), sayBox())
    });
    // (the first map only: a redraw opens on `cam`)
    if (fitFirst?.length && !fitted) ((fitted = true), engine.fit(fitFirst, boxPad.bottom, top, true));
  }, { set: (m) => (mode = m), failed: () => mode === 'failed' });

  $effect(() => {
    const p = pts;
    engine?.setPlaces(p);
  });
  $effect(() => {
    const s = sel;
    engine?.setSelected(s);
  });
  $effect(() => {
    const p = pin;
    engine?.setPin(p);
  });
  $effect(() => {
    const f = fix, old = stale;
    engine?.setFix(f, old);
  });
  $effect(() => {
    const b = bottom, t = top;
    engine?.setPad(b, t);
  });
  // the first box once the map is drawn (a moveend says the next ones)
  $effect(() => {
    if (engine && (mode === 'ready' || mode === 'offline')) untrack(sayBox);
  });

  onMount(() => {
    const hook = {
      state: () => ({ mode, n: pts.length, sel: sel?.id ?? null, pin, fix, ...engine?.state() }),
      longPress: (lng: number, lat: number) => onpoint([lng, lat]),
      pan: (lng: number, lat: number) => ((stubCenter = [lng, lat]), onmoved()),
      bounds: (w: number, s: number, e: number, n: number) => onview([w, s, e, n])
    };
    const stop = map.start(mode === 'stub', '__placesMap', hook);
    return () => {
      stop();
      engine?.destroy();
      engine = null;
    };
  });

  /** (failed while offline: MapStatus's offlineText) */
  const offline = $derived(mode === 'offline' || (mode === 'stub' && !online.current));
  /** The stub's buttons: the first matches (a spec's taps), the chosen one among them. */
  const STUB_MAX = 60;
</script>

<div class="pm map-attrib" class:covered data-places-map data-mode={mode} data-count={pts.length} data-sel={sel?.id ?? ''} data-pin={pin ? pin.map((x) => x.toFixed(4)).join(',') : ''}
  data-fix={fix ? 1 : 0} role="application" aria-label={pick(S.map, L)} style:--peek="{bottom + REACH}px">
  {#if mode === 'stub'}
    <div class="stub" data-map-stub>
      {#each pts.slice(0, STUB_MAX) as p (p.id)}
        {@const s = CAT_STYLE[p.cat]}
        <button type="button" class="sp" data-place-pin={p.id} aria-pressed={sel?.id === p.id} style:--f={s.fill} style:--g={s.ink} data-sfx="tick"
          aria-label={p.id} onclick={() => onselect(p.id)}>{s.glyph}</button>
      {/each}
    </div>
  {:else}
    <div class="gl" bind:this={el}></div>
  {/if}
  <MapStatus failed={mode === 'failed'} offlineText={pick(S.mapOffline, L)} loading={(mode === 'loading' || mode === 'ready') && !tiled} note={offline ? 'places' : say ? 'say' : null}
    text={offline ? pick(S.mapOffline, L) : (say ?? undefined)} top="calc(var(--ui-top) + 148px)" bottom="{bottom}px" onretry={map.draw} />
</div>

<style>
  .pm { position: absolute; inset: 0; isolation: isolate; background: #DCEFB4; overflow: hidden; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  .gl { position: absolute; inset: 0; }
  .stub { position: absolute; inset: calc(var(--ui-top) + 104px) 64px auto 12px; display: flex; flex-wrap: wrap; gap: 4px; }
  .sp { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #FFF9E3; background: var(--f); color: var(--g); font: 700 13px/1 var(--font-ui); padding: 0; }
  .sp[aria-pressed='true'] { outline: 3px solid #FFD84D; }
</style>
