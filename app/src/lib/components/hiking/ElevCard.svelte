<script lang="ts">
  // A trail's elevation chart on a dense card: the smoothed profile (the track's coral line over a leaf area), the
  // waypoints as dashed yuzu lines, the range in the corner. Scrubbable: a press shows the readout (elevation and
  // distance along) with the scrub's violet dot that the map's dot follows; a drag moves it; let go and it stays; a tap while one is held clears
  // it. `held` is the inspected distance (m) or null.
  import { PROF, pointAt, profilePaths, profileY, scrubDistance, type Prepared } from '#lib/hiking/track.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { fmtM, pick } from '../travel/text.ts';
  import { fmtKm, units } from '../travel/units.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { C } from './map/style.ts';

  let { prep, held = $bindable(null) }: { prep: Prepared; held?: number | null } = $props();

  let w = $state(340);
  let card: HTMLElement | undefined = $state();
  let svg: SVGSVGElement | undefined = $state();
  let tipW = $state(0);
  const paths = $derived(profilePaths(prep, w));
  const x = (d: number) => (d / prep.total) * w;
  const at = $derived(held === null ? null : pointAt(prep, held));

  const range = $derived.by(() => {
    const ft = units.current === 'mi';
    const n = (m: number) => Math.round(ft ? m * 3.28084 : m).toLocaleString('en-US');
    return `${n(prep.lo)}${i18n.locale === 'ja' && !ft ? '〜' : '–'}${n(prep.hi)} ${ft ? 'ft' : 'm'}`;
  });

  // the gesture: a press reveals (an empty chart), a drag past 6px moves, a clean tap on a held readout clears
  let rect: DOMRect | null = null;
  let startX = 0, moved = false, startHeld = false, raf = 0, lastX = 0;
  const apply = (cx: number) => rect && (held = scrubDistance(cx, rect.left, rect.width, prep.total));
  function down(e: PointerEvent) {
    if (!svg) return;
    rect = svg.getBoundingClientRect();
    startX = e.clientX;
    moved = false;
    startHeld = held !== null;
    if (!startHeld) apply(e.clientX);
    svg.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function move(e: PointerEvent) {
    if (!rect) return;
    lastX = e.clientX;
    if (Math.abs(lastX - startX) > 6) moved = true;
    raf ||= requestAnimationFrame(() => {
      raf = 0;
      if (moved || !startHeld) apply(lastX);
    });
  }
  function up(e: PointerEvent) {
    if (!rect) return;
    rect = null;
    if (raf) (cancelAnimationFrame(raf), (raf = 0));
    if (!moved && e.type !== 'pointercancel' && startHeld) held = null;
  }
  /** The readout's left (px in the card), kept inside it. */
  const tipLeft = $derived.by(() => {
    if (!at || !card || !svg) return 0;
    const off = svg.getBoundingClientRect().left - card.getBoundingClientRect().left;
    const cx = off + (at.d / prep.total) * svg.clientWidth, half = tipW / 2;
    return Math.max(half + 2, Math.min(card.clientWidth - half - 2, cx));
  });
</script>

<div class="card dense elev" bind:this={card} data-elev data-held={held === null ? '' : Math.round(held)}>
  <div class="hd"><span class="t">{pick(S.elevation, i18n.locale)}</span><span class="r" data-elev-range>{range}</span></div>
  <div class="plot" bind:clientWidth={w}>
    <svg bind:this={svg} viewBox="0 0 {w} {PROF.h}" preserveAspectRatio="none" role="img" aria-label={pick(S.scrub, i18n.locale)}
      onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      {#each prep.wpts as wp, i (i)}<line class="wpt" x1={x(wp.d)} y1="4" x2={x(wp.d)} y2={PROF.h} />{/each}
      <path class="area" d={paths.area} />
      <path class="line" d={paths.line} />
      {#if at}
        <line class="at" x1={x(at.d)} y1="0" x2={x(at.d)} y2={PROF.h} />
        <circle cx={x(at.d)} cy={profileY(prep, at.ele)} r="4.5" fill={C.scrub} class="dot" />
      {/if}
    </svg>
  </div>
  {#if at}
    <div class="tip" bind:clientWidth={tipW} style:left="{tipLeft}px" data-scrub-tip>{fmtM(Math.round(at.ele))}<span class="d">{fmtKm(at.d / 1000)}</span></div>
  {/if}
</div>

<style>
  .card.elev {
    flex: none; padding: 10px 12px 8px; overflow: visible;
    /* a press-drag surface: never a text selection or the callout */
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }
  .hd { display: flex; justify-content: space-between; align-items: baseline; padding: 0 2px 6px; }
  .t { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .r { font: 600 var(--fs-s)/1.2 var(--font-num); color: var(--text); }
  svg { display: block; width: 100%; height: 96px; touch-action: none; cursor: crosshair; }
  .wpt { stroke: var(--c-yuzu-lip); stroke-width: 1; stroke-dasharray: 3 3; }
  .area { fill: color-mix(in srgb, var(--c-leaf) 20%, transparent); }
  .line { fill: none; stroke: var(--c-coral-text); stroke-width: 2; stroke-linejoin: round; }
  .at { stroke: var(--text); stroke-opacity: .5; stroke-width: 1.5; stroke-dasharray: 4 3; }
  .dot { stroke: var(--c-card); stroke-width: 2; }
  .tip {
    position: absolute; top: 8px; left: 0; transform: translateX(-50%); z-index: 5; pointer-events: none; white-space: nowrap;
    background: var(--c-ink); color: var(--c-cream); border-radius: var(--r-chip); padding: 5px 10px; box-shadow: var(--sh-float);
    font: 600 var(--fs-s)/1.2 var(--font-num);
  }
  .d { opacity: .7; margin-left: 6px; }
</style>
