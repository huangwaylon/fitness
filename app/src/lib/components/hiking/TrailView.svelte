<script lang="ts">
  // A trail (the hiking app's detail screen): the map full screen (TrailMap) with its frosted buttons (‹ to the list
  // top-left, ✕ is the sheet's, zoom under it, locate bottom-left over the sheet), and the bottom sheet over it: the
  // grip and the peek (the name, distance, gain, difficulty, time) at a height that shows the whole elevation chart
  // (so it scrubs without opening the sheet), dragged or tapped up to 90 %; its body the chart, the plan card, 概要,
  // コース紹介, the tips, the facts and the credits. The location dot only after the locate button (the trip map's
  // LocWatch: the position never leaves the phone). Live tracking and the free hike come later (docs/hiking.md
  // "Later": the seam is the location watch here and TrailMap's fix).
  import { onMount } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Ic from './Ic.svelte';
  import ElevCard from './ElevCard.svelte';
  import PlanCard from './PlanCard.svelte';
  import TrailMap from './TrailMap.svelte';
  import { LocWatch } from '../travel/map/geo.ts';
  import { packing } from '../travel/packing.svelte.ts';
  import { fmtM, pick } from '../travel/text.ts';
  import { fmtKm } from '../travel/units.ts';
  import { loadTrack } from '#lib/hiking/load.ts';
  import { pointAt, prepare, type Prepared } from '#lib/hiking/track.ts';
  import { DIFF, DOGS, ROUTE, S, fmtSeason, fmtTime } from '#lib/hiking/strings.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';

  let { trail, onback }: { trail: Trail; onback: () => void } = $props();
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
    const sheet = body?.parentElement;
    const fallback = Math.round(vh * 0.16);
    if (!card || !sheet) return void (peekH = fallback);
    const h = card.getBoundingClientRect().bottom - sheet.getBoundingClientRect().top + body!.scrollTop + 14;
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

  <div class="back"><NavButton kind="back" onclick={onback} /></div>
  <div class="zoom" inert={full}>
    <button type="button" data-sfx="tick" aria-label={pick(S.zoomIn, L)} onclick={() => map?.zoom(1)}><Ic name="plus" w={2} /></button>
    <button type="button" data-sfx="tick" aria-label={pick(S.zoomOut, L)} onclick={() => map?.zoom(-1)}><Ic name="minus" w={2} /></button>
  </div>
  <button type="button" class="fab" class:on={!!fix} style:bottom="{peekH + 14}px" inert={full} data-locate data-sfx="tick" aria-label={pick(S.locate, L)} aria-pressed={!!fix} onclick={locate}>
    <Ic name="locate" w={1.85} />
  </button>
  {#if denied}<p class="denied" role="status">{pick(S.locDenied, L)}</p>{/if}

  <div class="sheet" class:dragging={drag !== null} style:height="{height}px">
    <div class="grip" role="button" tabindex="0" aria-expanded={sheetState === 'full'} aria-label={pick(S.sheetToggle, L)} data-sheet-grip data-sfx="page"
      onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onkeydown={key}></div>
    <div class="peek" data-sheet-peek role="presentation" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <h2 class="pk-title">{pick(trail.name, L)}</h2>
      <div class="pk-meta">
        <span class="s"><Ic name="dist" />{fmtKm(trail.lengthKm)}</span>
        <span class="s"><Ic name="gain" />{fmtM(trail.gainM)}</span>
        <span class="s d-{trail.diff}">{pick(DIFF[trail.diff], L)}</span>
        <span class="s"><Ic name="clock" />{fmtTime(trail.time, L)}</span>
      </div>
    </div>
    <div class="body" bind:this={body}>
      {#if track === 'ok' && prep}
        <ElevCard {prep} bind:held />
      {:else if track === 'failed'}
        <div class="track-msg err" role="alert" data-track-failed>{pick(S.trackFailed, L)} <button type="button" data-sfx="tick" onclick={load}>{pick(S.retry, L)}</button></div>
      {:else}
        <div class="track-msg" aria-busy="true"></div>
      {/if}
      {#if trail.plan}<PlanCard plan={trail.plan} {note} />{/if}
      <div class="section"><h3>{pick(S.secOverview, L)}</h3><p>{pick(trail.summary, L)}</p></div>
      <div class="section"><h3>{pick(S.secHike, L)}</h3><p>{pick(trail.description, L)}</p></div>
      <div class="section">
        <h3>{pick(S.secTips, L)}</h3>
        <ul class="tips">{#each trail.tips as tip, i (i)}<li>{pick(tip, L)}</li>{/each}</ul>
      </div>
      <div class="section">
        <h3>{pick(S.secDetails, L)}</h3>
        <dl class="facts">
          <dt>{pick(S.factRoute, L)}</dt><dd>{pick(ROUTE[trail.route], L)}</dd>
          <dt>{pick(S.factSeason, L)}</dt><dd>{fmtSeason(trail.season, L)}</dd>
          <dt>{pick(S.factDogs, L)}</dt><dd>{pick(DOGS[trail.dogs], L)}</dd>
          <dt>{pick(S.factPermit, L)}</dt><dd>{pick(trail.permit, L)}</dd>
          <dt>{pick(S.factLocation, L)}</dt><dd>{pick(trail.area, L)}</dd>
        </dl>
      </div>
      <div class="section"><p class="attrib">{pick(S.attribTrail, L)} ／ {pick(trail.tiles === 'us' ? S.attribUsgs : S.attribGsi, L)}</p></div>
    </div>
  </div>
</section>

<style>
  .detail { position: absolute; inset: 0; z-index: 10; background: var(--paper); overflow: hidden; }

  /* ‹ top-left (✕ is the sheet's, top-right), over a soft fade of the paper */
  .back { position: absolute; z-index: 1000; top: calc(var(--safe-t) + 5px); left: calc(12px + var(--safe-l)); }
  .detail::before {
    content: ''; position: absolute; z-index: 900; top: 0; left: 0; right: 0; height: calc(52px + var(--safe-t)); pointer-events: none;
    background: linear-gradient(to bottom, rgba(243, 245, 241, .92), rgba(243, 245, 241, 0));
  }
  /* zoom: the hiking app's frosted bar, under ✕ (and under the sheet when it's up) */
  .zoom {
    position: absolute; z-index: 500; top: calc(var(--safe-t) + 62px); right: calc(14px + var(--safe-r)); display: flex; flex-direction: column;
    border-radius: 14px; overflow: hidden; box-shadow: var(--sh-fab);
  }
  .zoom button {
    width: 38px; height: 44px; display: grid; place-items: center; border: 0; padding: 0; cursor: pointer; color: var(--ink);
    background: rgba(255, 255, 255, .9); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  }
  .zoom button + button { border-top: 1px solid var(--line); }
  .zoom button:active { background: #fff; }
  .zoom :global(.ic) { width: 19px; height: 19px; }
  .fab {
    position: absolute; z-index: 500; left: calc(16px + var(--safe-l)); width: 46px; height: 46px; border: 1px solid var(--line); border-radius: 50%;
    background: rgba(255, 255, 255, .88); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); color: var(--ink); cursor: pointer; box-shadow: var(--sh-fab);
    display: flex; align-items: center; justify-content: center; transition: transform .1s, background .15s, color .15s, border-color .15s, bottom .32s cubic-bezier(.25, .46, .45, .94);
  }
  .fab :global(.ic) { width: 23px; height: 23px; }
  .fab:active { transform: scale(.92); }
  .fab.on { background: var(--gps); border-color: var(--gps); color: #fff; }
  .denied {
    position: absolute; z-index: 560; top: calc(var(--safe-t) + 70px); left: 50%; translate: -50% 0; width: min(88vw, 344px); margin: 0; padding: 10px 14px;
    background: rgba(255, 255, 255, .94); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--sh-pop); font-size: 13px; font-weight: 700; line-height: 1.4;
  }

  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 600; display: flex; flex-direction: column; max-height: 92dvh;
    background: var(--surface); border-radius: 26px 26px 0 0; box-shadow: 0 -10px 40px rgba(22, 35, 29, .16);
    transition: height .32s cubic-bezier(.25, .46, .45, .94);
  }
  .sheet.dragging { transition: none; }
  .grip { flex-shrink: 0; padding: 10px 0 6px; display: flex; justify-content: center; cursor: grab; touch-action: none; }
  .grip::before { content: ''; width: 40px; height: 5px; border-radius: 3px; background: var(--line); }
  .peek { flex-shrink: 0; padding: 2px 20px 12px; cursor: pointer; touch-action: none; }
  .pk-title { margin: 0; font-family: var(--font-display); font-size: 21px; font-weight: 600; letter-spacing: -.1px; line-height: 1.18; color: var(--ink); }
  :lang(ja) .pk-title { font-weight: 700; }
  .pk-meta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; margin-top: 7px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
  .s { display: inline-flex; align-items: center; gap: 5px; font-variant-numeric: tabular-nums; }
  .pk-meta :global(.ic) { width: 15px; height: 15px; color: var(--muted); }
  .d-moderate, .d-hard, .d-veryhard { font-weight: 700; }
  .d-moderate { color: #8a5410; }
  .d-hard { color: #c0392b; }
  .d-veryhard { color: #8e3bb0; }

  .body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px 20px calc(24px + var(--safe-b)); scrollbar-width: none; }
  .body::-webkit-scrollbar { display: none; }
  .track-msg { min-height: 132px; margin-bottom: 20px; border-radius: 16px; background: var(--surface-2); border: 1px solid var(--line-2); }
  .track-msg.err {
    min-height: 0; padding: 12px 14px; font-size: 13.5px; font-weight: 600; line-height: 1.5; color: #a5331f;
    background: rgba(192, 57, 43, .08); border-color: rgba(192, 57, 43, .28);
  }
  .track-msg button { margin-left: 6px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(192, 57, 43, .28); background: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }
  .section { margin-bottom: 20px; }
  .section h3 { margin: 0 0 9px; font-family: var(--font-display); font-size: 18px; font-weight: 600; letter-spacing: -.1px; color: var(--ink); }
  :lang(ja) .section h3 { font-weight: 700; }
  .section p { margin: 0; font-size: 15px; line-height: 1.68; color: var(--ink-2); }
  .tips { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
  .tips li { position: relative; padding-left: 22px; font-size: 14.5px; line-height: 1.55; color: var(--ink-2); }
  .tips li::before { content: ''; position: absolute; left: 5px; top: 9px; width: 7px; height: 7px; border-radius: 50%; background: var(--pine); box-shadow: 0 0 0 4px var(--pine-soft); }
  .facts { display: grid; grid-template-columns: auto 1fr; gap: 0 20px; margin: 0; font-size: 14.5px; }
  .facts dt { padding: 9px 0; border-top: 1px solid var(--line-2); color: var(--muted); font-weight: 600; }
  .facts dd { margin: 0; padding: 9px 0; border-top: 1px solid var(--line-2); color: var(--ink); font-weight: 600; min-width: 0; overflow-wrap: break-word; }
  .facts dt:first-of-type, .facts dd:first-of-type { border-top: none; }
  .section .attrib { font-size: 11.5px; line-height: 1.5; color: var(--muted); }

  @media (min-width: 640px) {
    .body > *, .peek { max-width: 680px; margin-inline: auto; }
  }
</style>
