<script lang="ts">
  // 地図 (docs/travel.md "Maps"; lib/travel/itinerary.ts MapTabProps): the whole trip on one real map, full height, the
  // app's one trip map (the shared page /s's too). Every day's route in its colour and its stops as small dots
  // (whole/style.ts); the foot row 全体 · ● 11 · ● 12 … focuses a day (fitted, the others faded; onday) or every day.
  // A dot tapped is ringed where it is, the zoom kept, and its card shows 「11:55 ワイトモ鍾乳洞 日程で見る ✕」
  // (日程で見る: onlist). It follows the sheet's `day` and `stop` as they change. Top right: the locate button (the
  // dot; far from the trip a note, not a flight) and under it the layers button (a trip with candidates: Okinawa's
  // campsites, nature, food, off at first; in the app the saved places near the shown days, `places`, first and on:
  // never on /s). A campsite's dot opens its card (CampSheet), another candidate's its name; a saved place's square its
  // floating card (PlaceFloat). The maps' status (MapStatus): loading, offline (the route alone), 「保存した範囲のみ」 offline with the
  // trip's area saved (lib/offline), the location's notes. A trip with nothing to draw: 「この旅には地図がありません」.
  // Its life: mount it once per trip page and keep it mounted while another tab shows (`active` false: hidden, idle,
  // the location paused); the map is made the first time the tab shows (MapLibre a lazy chunk, engine.ts) and let go of
  // (its WebGL context) when this unmounts. Under mapStub() (the e2e's logic tier) no map: its dots and squares as
  // buttons. `window.__travelMap` (hooks on) is the specs' view.
  import { onMount, untrack } from 'svelte';
  import type { Locale } from '#lib/i18n/index.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import type { MapTabProps } from '#lib/travel/itinerary.ts';
  import type { Camp } from '#lib/travel/types.ts';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { mapStub } from '#lib/ui-state/testMode.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import { areas } from '#lib/offline/areas.svelte.ts';
  import { S as PS } from '#lib/places/strings.ts';
  import Icon from '../../ui/Icon.svelte';
  import Phrases from '../../ui/Phrases.svelte';
  import MapStatus from '../../map/MapStatus.svelte';
  import MapLayers from '../../map/MapLayers.svelte';
  import LocateDisc from '../../map/LocateDisc.svelte';
  import PlaceFloat from '../../places/PlaceFloat.svelte';
  import CampSheet from '../CampSheet.svelte';
  import { mapLoader } from '../../map/cached.ts';
  import { useLocate } from '../../map/locate.svelte.ts';
  import { MS } from '../../map/strings.ts';
  import type { PlacesLayer } from '../../map/places/layer.svelte.ts';
  import { pick } from '../text.ts';
  import { candidatesOf, dom, farFrom, findStop, mapDays, nameOf, openOn, pathOf } from './logic.ts';
  import type { WholeEngine } from './engine.ts';
  import { KIND_COLOR, LAYERS, type Layer, type Layers, type MapDay, type MapState } from './types.ts';

  type Props = MapTabProps & {
    /** The tab is showing. False: hidden and idle, the map kept. */
    active?: boolean;
    /** The labels' language (default: the reader's). */
    locale?: Locale;
    /** The trip note's private values (a campsite's card). */
    note?: Record<string, string> | null;
    /** The saved places' layer, made for the shown days' path (TripView's: the app's alone, never /s's). */
    places?: (path: () => [number, number][] | null) => PlacesLayer;
  };
  let { trip, itinerary, day, stop, onday, onlist, active = true, locale = i18n.locale, note = null, places }: Props = $props();

  const S = {
    all: { ja: '全体', en: 'All' },
    inPlan: { ja: '日程で見る', en: 'In the plan' },
    close: { ja: '閉じる', en: 'Close' },
    none: { ja: 'この旅には地図がありません', en: 'No map for this trip' }
  } as const;

  const days = $derived<readonly MapDay[]>(itinerary.days);
  const shown = $derived(mapDays(days));
  const hasMap = $derived(shown.length > 0);
  let focus = $state<number | null>(untrack(() => openOn(itinerary.days, day)));
  /** The ringed stop, the chosen candidate (one at a time; a saved place's square is the layer's own). */
  let selected = $state<string | null>(null);
  let cand = $state<string | null>(null);
  const card = $derived(findStop(days, selected));
  const candPlace = $derived(cand ? (trip.places.find((p) => p.id === cand) ?? null) : null);

  // the candidate layers (off at first) and the saved places near the shown days (on by default)
  const kinds = $derived(LAYERS.filter((l) => trip.places.some((p) => p.kind === l)));
  let layers = $state<Layers>({});
  let layersOpen = $state(false);
  const cands = $derived(candidatesOf(trip.places, layers));
  const layer = untrack(() => places?.(() => pathOf(days, focus)) ?? null);
  const rows = $derived([
    ...(layer?.near.length ? [{ id: 'places', label: pick(PS.layer, locale), on: layer.on, swatch: 'square', def: true }] : []),
    ...kinds.map((k) => ({ id: k, label: t(`travel.map.layer.${k}`), on: !!layers[k], swatch: KIND_COLOR[k] }))
  ]);
  const saved = $derived(layer ? { pts: layer.pts, shown: layer.on, sel: layer.selected } : undefined);
  let camp = $state<Camp | null>(null);
  let campOpen = $state(false);

  const loadEngine = lazy(() => import('./engine.ts'));
  let host: HTMLDivElement | undefined = $state();
  let gl: HTMLDivElement | undefined = $state();
  let mode = $state<string>(mapStub() ? 'stub' : 'loading');
  let tiled = $state(false);
  let engine = $state.raw<WholeEngine | null>(null);
  let made = 0;
  let footH = $state(0);
  let mapH = $state(0);
  let floatH = $state(0);
  let teardown: (() => void) | null = null;
  const input = () => ({ days, focus, selected, locale, cands, cand, saved });

  // the location (paused while the tab is hidden or the page is); far from every stop: the dot, a note, no flight
  let flyNext = false;
  const here = useLocate<'far'>({
    el: () => host,
    shown: () => active,
    onchange(w, first) {
      const fly = first || flyNext;
      flyNext = false;
      const far = !!w.fix && farFrom(days, w.fix);
      if (far && fly) here.tell('far');
      engine?.setFix(w.fix, fly && !far, w.stale);
    }
  });
  function locate() {
    if (here.state === 'on' && here.fix) {
      if (farFrom(days, here.fix)) return (here.tell('far'), engine?.fit());
      return engine?.setFix(here.fix, true, here.stale);
    }
    flyNext = true;
    here.start();
  }

  const loader = mapLoader(loadEngine, ({ createWholeEngine }) => {
    made++;
    engine = createWholeEngine(gl!, input(), { stop: pickStop, cand: pickCand, place: pickPlace, miss, mode: (m) => (mode = m), tile: () => (tiled = true) });
    if (here.fix) engine.setFix(here.fix, false, here.stale);
    engine.activate(active);
  }, { set: (m) => (mode = m), failed: () => mode === 'failed' });

  const snapshot = (): MapState => {
    const s = engine?.places() ?? { squares: [], tag: '' };
    return {
      mode, focus, selected, active, zoom: engine?.zoom() ?? null, center: engine?.center() ?? null, settled: engine?.settled() ?? false,
      ...(engine?.drawn() ?? { stops: 0, legs: 0 }), made, loc: here.state, layers: LAYERS.filter((l) => !!layers[l]), candidates: cands.map((p) => p.id),
      places: s.squares.length, ...s
    };
  };

  // the sheet's day (the cards closed unless on it)
  $effect(() => {
    const d = day;
    untrack(() => {
      focus = openOn(days, d);
      if (focus != null && findStop(days, selected)?.day.i !== focus) selected = null;
      layer?.select(null);
    });
  });
  // the sheet's stop (地図で見る): ringed; its day focused if another day is
  $effect(() => {
    const id = stop;
    untrack(() => {
      const s = findStop(days, id);
      if (!s) return;
      pickStop(s.stop.id);
      if (focus != null && focus !== s.day.i) ((focus = s.day.i), onday?.(focus));
    });
  });
  // the map made the first time the tab shows
  $effect(() => {
    if (active && hasMap) untrack(() => (teardown ??= loader.start(mode === 'stub', '__travelMap', { state: snapshot, px: (id: string) => engine?.px(id) ?? null })));
  });
  $effect(() => engine?.activate(active));
  $effect(() => {
    const i = input();
    engine?.update(i);
  });
  // a square chosen: the map eased only if it would sit under its card
  $effect(() => {
    const p = layer?.selected, h = floatH;
    if (p && h) untrack(() => engine?.reveal(p, footH + 8 + h));
  });

  onMount(() => () => {
    teardown?.();
    engine?.destroy();
    engine = null;
  });

  function pickStop(id: string) {
    ((selected = id), (cand = null), layer?.select(null));
  }
  /** A candidate's dot: a campsite's card, another's name. */
  function pickCand(id: string) {
    ((cand = id), (selected = null), layer?.select(null));
    const c = trip.camps?.find((x) => x.id === id);
    if (c) ((camp = c), (campOpen = true));
  }
  function pickPlace(id: string) {
    ((selected = null), (cand = null), layer?.select(id));
  }
  /** An empty map's tap: every card and the layers' panel closed. */
  function miss() {
    ((selected = null), (cand = null), layer?.select(null), (layersOpen = false));
  }
  function focusOn(d: number | null) {
    focus = d;
    miss();
    onday?.(d);
  }
  const toggle = (id: string) => (id === 'places' ? layer?.toggle() : (layers = { ...layers, [id]: !layers[id as Layer] }));
  /** Esc: an open card closes (true); else the sheet's own Esc. */
  export function escape(): boolean {
    if (!selected && !cand && !layer?.selected) return false;
    miss();
    return true;
  }
  const dayLabel = (d: MapDay) => `${locale === 'ja' ? `${d.i}日目` : `Day ${d.i}`} · ${Number(d.date.slice(5, 7))}/${dom(d.date)}${d.title ? ` · ${nameOf(d.title, locale)}` : ''}`;

  /** Offline with the trip's area saved (旅行 › 設定: OfflineMaps): 「保存した範囲のみ」 over whatever it drew. */
  const areaSaved = $derived(['saved', 'partial', 'saving'].includes(areas.state(`trip-${trip.id}`).k));
  const status = $derived(mode === 'failed' ? null : areaSaved && !online.current ? 'saved' : mode === 'offline' ? 'offline' : here.note);
  const noteText = $derived(here.note === 'denied' ? MS.refused[locale] : here.note === 'again' ? MS.again[locale] : here.note === 'far' ? t('travel.map.note.far') : undefined);
  const discs = $derived((rows.length ? 1 : 0) + (mode === 'failed' ? 0 : 1));
  const squares = $derived(saved?.shown ? saved.pts : []);
</script>

<div class="whole map-attrib" class:off={!active} inert={!active || undefined} aria-hidden={!active || undefined} bind:this={host} bind:clientHeight={mapH} data-travel-map
  data-mode={hasMap ? mode : 'none'} data-focus={focus ?? 'all'} data-selected={selected ?? cand ?? ''} data-places={squares.length} style:--peek="{footH}px">
  {#if hasMap}
    {#if mode === 'stub'}
      <!-- (a tap on the stub's ground: an empty map's, which makes no sound on the drawn map either) -->
      <div class="stub" data-map-stub role="presentation" data-sfx="none" onclick={(e) => e.target === e.currentTarget && miss()}>
        {#each shown as d (d.i)}
          {#each d.stops as s, k (k)}
            {#if s.lat != null && s.lng != null}
              <button type="button" data-pin={s.id} data-day={d.i} data-faded={focus != null && focus !== d.i ? '' : undefined} aria-pressed={selected === s.id}
                style:--dc={d.colour} data-sfx="tick" onclick={() => pickStop(s.id)}>{nameOf(s.name, locale)}</button>
            {/if}
          {/each}
        {/each}
        {#each cands as p (p.id)}
          <button type="button" class="cand" data-pin={p.id} aria-pressed={cand === p.id} style:--dc={KIND_COLOR[p.kind as Layer]} data-sfx="tick" onclick={() => pickCand(p.id)}>{pick(p.name, locale)}</button>
        {/each}
        {#each squares as p (p.id)}
          <button type="button" class="sq" class:sel={saved?.sel?.id === p.id} data-map-place={p.id} aria-label={p.name} data-sfx="tick" onclick={() => pickPlace(p.id)}></button>
        {/each}
      </div>
    {:else}
      <div class="gl" bind:this={gl}></div>
    {/if}
    <MapStatus failed={mode === 'failed'} note={status} text={noteText} top="{8 + 48 * discs}px" bottom="{footH}px"
      loading={mode === 'loading' || (mode === 'ready' && !tiled)} offlineText={t('offline.mapRoute')} onretry={loader.draw} />
    <div class="ctl" style:--lyr-max="{Math.max(120, mapH - footH - 64)}px">
      {#if mode !== 'failed'}<LocateDisc size="small" loc={here.state} label={t(`travel.map.locate.${here.state}`)} onclick={locate} />{/if}
      {#if rows.length}<MapLayers bind:open={layersOpen} label={MS.layers[locale]} {rows} ontoggle={toggle} />{/if}
    </div>

    {#if layer?.selected && layer.on}<PlaceFloat p={layer.selected} bottom={footH + 8} onclose={() => layer.select(null)} bind:h={floatH} />{/if}
    <div class="bottom">
      {#if card}
        <div class="card" data-map-card={card.stop.id}>
          <span class="ct">{#if card.stop.time}<span class="tm">{card.stop.time}</span>{/if}<b>{nameOf(card.stop.name, locale)}</b></span>
          <button type="button" class="go" data-map-go data-sfx="tick" onclick={() => onlist(card.stop.id)}>{S.inPlan[locale]}</button>
          <button type="button" class="x" data-map-close aria-label={S.close[locale]} data-sfx="tick" onclick={() => (selected = null)}><Icon name="close" size={16} /></button>
        </div>
      {:else if candPlace && candPlace.kind !== 'camp'}
        <div class="card" data-map-card={candPlace.id}>
          <span class="ct"><i class="kd" style:--dc={KIND_COLOR[candPlace.kind as Layer]}></i><b>{pick(candPlace.name, locale)}</b></span>
          <button type="button" class="x" data-map-close aria-label={S.close[locale]} data-sfx="tick" onclick={() => (cand = null)}><Icon name="close" size={16} /></button>
        </div>
      {/if}
      <div class="foot" role="group" aria-label={t('travel.map.days')} bind:clientHeight={footH}>
        <button type="button" data-map-day="all" aria-pressed={focus === null} data-sfx="tick" onclick={() => focusOn(null)}>{S.all[locale]}</button>
        {#each shown as d (d.i)}
          <button type="button" data-map-day={d.i} aria-pressed={focus === d.i} aria-label={dayLabel(d)} style:--dc={d.colour} data-sfx="tick" onclick={() => focusOn(d.i)}><i></i>{dom(d.date)}</button>
        {/each}
      </div>
    </div>
    <p class="sr-only" aria-live="polite"><Phrases text={card ? `${card.stop.time ?? ''} ${nameOf(card.stop.name, locale)}` : candPlace ? pick(candPlace.name, locale) : ''} /></p>
  {:else}
    <div class="empty" data-map-empty><Icon name="map" size={28} /><p><Phrases text={S.none[locale]} /></p></div>
  {/if}
</div>

{#if trip.camps?.length}<CampSheet bind:open={campOpen} {camp} {note} />{/if}

<style>
  /* the whole tab's box (its host gives the height); hidden while another tab shows, the map kept laid out */
  .whole { position: absolute; inset: 0; isolation: isolate; overflow: hidden; background: color-mix(in srgb, var(--c-sky) 30%, var(--card)); touch-action: none; -webkit-user-select: none; user-select: none; }
  .whole.off { visibility: hidden; pointer-events: none; }
  .gl { position: absolute; inset: 0; touch-action: none; }
  .stub { position: absolute; inset: 0; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; padding: 12px 56px 12px 12px; overflow: auto; }
  .stub button { min-height: 32px; padding: 0 10px; border: 2px solid var(--dc); border-radius: var(--r-pill); background: var(--card); font: 500 var(--fs-s)/1 var(--font-ui); }
  .stub button[data-faded] { opacity: .4; }
  .stub button[aria-pressed='true'] { background: var(--dc); color: #fff; }
  .stub .sq { width: 32px; border: 0; border-radius: 6px; background: #4A3A2C; box-shadow: inset 0 0 0 3px #FFF9E3; }
  .stub .sq.sel { box-shadow: inset 0 0 0 3px #FFF9E3, 0 0 0 3px var(--c-yuzu); }

  /* the locate button, the layers button under it (its panel under that), top right */
  .ctl { position: absolute; top: 4px; right: 4px; z-index: 1003; display: grid; justify-items: end; gap: 4px; pointer-events: none; }
  .ctl > :global(*) { pointer-events: auto; }

  /* a stop's (or a candidate's) card over the foot row; the days as compact cells that wrap, never cut off */
  .bottom { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1002; display: grid; pointer-events: none; }
  .bottom > * { pointer-events: auto; }
  .card { margin: 0 12px 8px; display: flex; align-items: center; gap: 8px; padding: 6px 4px 6px 14px; border-radius: var(--r-row); background: var(--card); box-shadow: var(--sh-float); }
  .ct { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 10px; }
  .tm { flex: none; font: 600 var(--fs-s)/1.3 var(--font-num); color: var(--text-soft); }
  .ct b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 700 var(--fs-body)/1.35 var(--font-body); }
  .kd { flex: none; align-self: center; width: 10px; height: 10px; border-radius: 50%; background: var(--dc); }
  .go { flex: none; min-height: 44px; padding: 0 6px; border: 0; background: none; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--leaf-text); cursor: pointer; }
  .x { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: none; color: var(--text-soft); cursor: pointer; }
  .foot { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; padding: 6px 8px; background: var(--surface); box-shadow: 0 -1px 0 var(--lip); }
  .foot button { flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-width: 44px; min-height: 44px; padding: 0 9px; border: 0; border-radius: var(--r-pill); background: none; color: var(--text); font: 600 var(--fs-body)/1 var(--font-num); cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .foot button:first-child { font: 700 var(--fs-s)/1 var(--font-ui); }
  .foot button[aria-pressed='true'] { background: var(--c-yuzu); color: var(--c-ink); }
  .foot i { width: 8px; height: 8px; border-radius: 50%; background: var(--dc); }

  .empty { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 8px; color: var(--text-soft); background: var(--surface); }
  .empty p { margin: 0; font: 400 var(--fs-body)/1.4 var(--font-body); }
</style>
