<script lang="ts">
  // A trail: the map full screen (TrailMap) under NavBar s `over` (‹ to the list, ✕ the sheet) and the map's own smoked
  // discs (zoom under ✕, locate bottom-left over the sheet), and the drag-up sheet over it, on the app's paper: the grip
  // and the peek (the name, 距離 · 標高差 · 時間 · 難易度) at a height that shows the whole elevation chart (so it
  // scrubs without opening the sheet), dragged or tapped up to 90 %; its body the chart, the plan card, 概要, コース紹介,
  // the tips, the facts and the credits, each a dense card. The location dot only after the locate button (the trip map's
  // LocWatch: the position never leaves the phone). Live tracking and the free hike come later (docs/hiking.md
  // "Later": the seam is the location watch here and TrailMap's fix).
  import { onMount } from 'svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Icon from '../ui/Icon.svelte';
  import StatStrip from '../ui/StatStrip.svelte';
  import ElevCard from './ElevCard.svelte';
  import PlanCard from './PlanCard.svelte';
  import TrailMap from './TrailMap.svelte';
  import { LocWatch } from '../travel/map/geo.ts';
  import { packing } from '../travel/packing.svelte.ts';
  import { pick } from '../travel/text.ts';
  import { trailStats } from './stats.ts';
  import { loadTrack } from '#lib/hiking/load.ts';
  import { pointAt, prepare, type Prepared } from '#lib/hiking/track.ts';
  import { DOGS, ROUTE, S, fmtSeason } from '#lib/hiking/strings.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';

  let { trail, onback, onclose }: { trail: Trail; onback: () => void; onclose: () => void } = $props();
  const L = $derived(i18n.locale);

  // the track
  let prep = $state.raw<Prepared | null>(null);
  let track = $state<'loading' | 'ok' | 'failed'>('loading');
  function load() {
    track = 'loading';
    void loadTrack(trail.slug).then((r) => {
      if (r.k === 'ok') ((prep = prepare(r.track)), (track = 'ok'));
      else track = 'failed';
    });
  }
  load();

  // the scrub: a distance held on the chart, its point on the map
  let held = $state<number | null>(null);
  const scrub = $derived(prep && held !== null ? pointAt(prep, held) : null);

  // the sheet: peek (just under the chart) or full (90 %), or a drag's height
  let vh = $state(800);
  let sheetState = $state<'peek' | 'full'>('peek');
  let drag = $state<number | null>(null);
  let body: HTMLElement | undefined = $state();
  let peekH = $state(0);
  function measure() {
    const card = body?.querySelector<HTMLElement>('[data-elev]') ?? body?.querySelector<HTMLElement>('.track-msg');
    const fallback = Math.round(vh * 0.16);
    if (!card) return void (peekH = fallback);
    // layout offsets from the sheet (the card's offsetParent), not the screen's rects: the sheet's opening zoom scales those
    const h = card.offsetTop + card.offsetHeight + 8;
    peekH = Math.round(Math.min(Math.max(h, fallback), vh * 0.62));
  }
  $effect(() => {
    void track;
    void vh;
    void Promise.resolve().then(measure);
  });
  const fullH = $derived(Math.round(vh * 0.9));
  const height = $derived(drag ?? (sheetState === 'full' ? fullH : peekH || Math.round(vh * 0.16)));

  function setSheet(s: 'peek' | 'full') {
    sheetState = s;
    if (s === 'peek' && body) body.scrollTop = 0;
  }
  // the grip and the peek drag the sheet; a tap toggles it
  let startY = 0, startH = 0, moved = false, pid: number | null = null;
  function down(e: PointerEvent) {
    pid = e.pointerId;
    startY = e.clientY;
    startH = height;
    moved = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (pid !== e.pointerId) return;
    if (Math.abs(e.clientY - startY) > 6) moved = true;
    if (moved) drag = Math.min(fullH, Math.max(peekH, startH + (startY - e.clientY)));
  }
  function up(e: PointerEvent) {
    if (pid !== e.pointerId) return;
    pid = null;
    if (moved && drag !== null) setSheet(drag > vh * 0.45 ? 'full' : 'peek');
    else if (e.type !== 'pointercancel') setSheet(sheetState === 'peek' ? 'full' : 'peek');
    drag = null;
  }
  function key(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    setSheet(sheetState === 'peek' ? 'full' : 'peek');
  }
  /** Esc: the full sheet folds to its peek (true), else the sheet's own Esc closes. */
  export function escape(): boolean {
    if (sheetState !== 'full') return false;
    setSheet('peek');
    return true;
  }

  // the location dot (after the locate button)
  let fix = $state<{ lon: number; lat: number } | null>(null);
  let denied = $state(false);
  let map: { flyToFix(): void; zoom(by: 1 | -1): void } | undefined = $state();
  const watch = new LocWatch((w) => {
    fix = w.fix ? { lon: w.fix.lon, lat: w.fix.lat } : null;
    denied = w.state === 'denied';
  });
  function locate() {
    map?.flyToFix();
    watch.start();
  }
  onMount(() => {
    const shown = () => watch.visible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', shown);
    return () => (document.removeEventListener('visibilitychange', shown), watch.stop());
  });

  const note = $derived(packing.note('hiking'));
  const full = $derived(sheetState === 'full' && drag === null);
</script>

<svelte:window bind:innerHeight={vh} />

<section class="detail" data-trail-view={trail.slug} data-sheet={sheetState}>
  <TrailMap bind:this={map} region={trail.tiles} center={trail.center} {prep} {scrub} {fix} bottom={peekH} />

  <div class="top"><NavBar size="s" over title={pick(trail.name, L)} {onback} {onclose} /></div>
  <div class="zoom" inert={full}>
    <button type="button" class="disc" data-sfx="tick" aria-label={pick(S.zoomIn, L)} onclick={() => map?.zoom(1)}><Icon name="plus" size={18} /></button>
    <button type="button" class="disc" data-sfx="tick" aria-label={pick(S.zoomOut, L)} onclick={() => map?.zoom(-1)}><Icon name="minus" size={18} /></button>
  </div>
  <button type="button" class="disc locate" class:on={!!fix} style:bottom="{peekH + 8}px" inert={full} data-locate data-sfx="tick" aria-label={pick(S.locate, L)} aria-pressed={!!fix} onclick={locate}>
    <Icon name="locate" size={20} />
  </button>
  {#if denied}<p class="denied" role="status">{pick(S.locDenied, L)}</p>{/if}

  <div class="sheet" class:dragging={drag !== null} style:height="{height}px">
    <div class="grip" role="button" tabindex="0" aria-expanded={sheetState === 'full'} aria-label={pick(S.sheetToggle, L)} data-sheet-grip data-sfx="page"
      onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onkeydown={key}></div>
    <div class="peek" data-sheet-peek role="presentation" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <h2 class="pk-title">{pick(trail.name, L)}</h2>
      <StatStrip items={trailStats(trail, L, true)} />
    </div>
    <div class="body" bind:this={body}>
      {#if track === 'ok' && prep}
        <ElevCard {prep} bind:held />
      {:else if track === 'failed'}
        <div class="card dense track-msg err" role="alert" data-track-failed>
          <p>{pick(S.trackFailed, L)}</p>
          <button type="button" class="btn small paper" data-sfx="tick" onclick={load}>{pick(S.retry, L)}</button>
        </div>
      {:else}
        <div class="card dense track-msg" aria-busy="true"></div>
      {/if}
      {#if trail.plan}<PlanCard plan={trail.plan} {note} />{/if}
      <h3 class="sec-label head">{pick(S.secOverview, L)}</h3>
      <p class="card dense txt">{pick(trail.summary, L)}</p>
      <h3 class="sec-label head">{pick(S.secHike, L)}</h3>
      <p class="card dense txt">{pick(trail.description, L)}</p>
      <h3 class="sec-label head">{pick(S.secTips, L)}</h3>
      <ul class="card dense tips">
        {#each trail.tips as tip, i (i)}<li class="row"><Icon name="check" size={16} />{pick(tip, L)}</li>{/each}
      </ul>
      <h3 class="sec-label head">{pick(S.secDetails, L)}</h3>
      <dl class="card dense facts">
        <div class="row kv"><dt>{pick(S.factRoute, L)}</dt><dd>{pick(ROUTE[trail.route], L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factSeason, L)}</dt><dd>{fmtSeason(trail.season, L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factDogs, L)}</dt><dd>{pick(DOGS[trail.dogs], L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factPermit, L)}</dt><dd>{pick(trail.permit, L)}</dd></div>
        <div class="row kv"><dt>{pick(S.factLocation, L)}</dt><dd>{pick(trail.area, L)}</dd></div>
      </dl>
      <p class="attrib">{pick(S.attribTrail, L)} ／ {pick(trail.tiles === 'us' ? S.attribUsgs : S.attribGsi, L)}</p>
    </div>
  </div>
</section>

<style>
  .detail { position: absolute; inset: 0; z-index: 10; background: var(--surface); overflow: hidden; }

  /* ‹ ✕ over the map (NavBar s over: smoked discs); the map's own buttons in the same disc */
  .top { position: absolute; z-index: 1000; top: 0; left: 0; right: 0; padding: var(--ui-top) calc(4px + var(--safe-right)) 0 calc(4px + var(--safe-left)); pointer-events: none; }
  .top :global(.nav) { pointer-events: auto; }
  .disc {
    position: relative; appearance: none; border: 0; padding: 0; width: var(--hit); height: var(--hit); display: grid; place-items: center;
    background: none; color: #fff; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: opacity var(--dur-quick), bottom .32s var(--ease-soft);
  }
  .disc::before {
    content: ''; position: absolute; inset: 6px; border-radius: 50%; background: rgb(30 24 18 / .35);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); transition: background var(--dur-quick);
  }
  .disc :global(svg) { position: relative; }
  .disc:active { opacity: .55; }
  .disc:focus-visible { outline: 2px solid var(--focus); outline-offset: -4px; }
  .zoom { position: absolute; z-index: 500; top: calc(var(--ui-top) + 48px); right: calc(4px + var(--safe-right)); display: flex; flex-direction: column; }
  .locate { position: absolute; z-index: 500; left: calc(4px + var(--safe-left)); }
  .locate.on::before { background: var(--c-sky); }
  .denied {
    position: absolute; z-index: 560; top: calc(var(--ui-top) + 52px); left: 50%; translate: -50% 0; width: min(88vw, 344px); margin: 0; padding: 10px 12px;
    background: var(--card); color: var(--text); border-radius: var(--r-row); box-shadow: var(--sh-float); font-size: var(--fs-s); line-height: 1.45;
  }

  /* the drag-up sheet: the app's paper with its lip, the cards on it */
  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 600; display: flex; flex-direction: column; max-height: 92dvh;
    background: var(--surface); border-radius: var(--r-card) var(--r-card) 0 0; box-shadow: 0 calc(-1 * var(--lip-s)) 0 var(--lip), var(--sh-float);
    transition: height .32s var(--ease-soft);
  }
  .sheet.dragging { transition: none; }
  .grip { flex: none; padding: 8px 0 4px; display: flex; justify-content: center; cursor: grab; touch-action: none; }
  .grip::before { content: ''; width: 36px; height: 5px; border-radius: var(--r-pill); background: var(--stitch); }
  .grip:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }
  .peek { flex: none; padding: 0 calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); cursor: pointer; touch-action: none; }
  .pk-title { margin: 0 4px; font: 700 var(--fs-talk)/1.25 var(--font-ui); color: var(--text); }
  .peek :global(.stats) { padding: 6px 0 8px; }

  .body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; scrollbar-width: none;
    display: flex; flex-direction: column; gap: 8px; padding: 0 calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left));
  }
  .body::-webkit-scrollbar { display: none; }
  /* (the cards clip: never shrunk to the scroller) */
  .body > * { flex: none; }
  .body > .sec-label.head { margin: 8px 4px -2px; }
  .card.track-msg { min-height: 132px; }
  .card.track-msg.err { min-height: 0; display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: var(--coral-text); }
  .track-msg p { flex: 1; margin: 0; font-size: var(--fs-s); }
  .track-msg .btn { flex: none; }
  .card.txt { margin: 0; padding: 12px; line-height: 1.65; }
  .tips { list-style: none; margin: 0; }
  .tips .row { align-items: flex-start; font-size: var(--fs-s); line-height: 1.5; }
  .tips .row :global(svg) { flex: none; margin-top: 2px; color: var(--leaf-text); }
  .facts { margin: 0; }
  .facts dd { margin: 0; font-weight: 600; }
  .attrib { margin: 4px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
</style>
