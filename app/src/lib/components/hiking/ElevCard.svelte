<script lang="ts">
  // A trail's elevation chart (the hiking app's #elev-card): the smoothed profile as a pine area, the waypoints as
  // dashed amber lines, the range in the corner. Scrubbable: a press shows the readout (elevation and distance along)
  // with a violet dot that the map's dot follows; a drag moves it; let go and it stays; a tap while one is held clears
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
    return `${n(prep.lo)}${i18n.locale === 'ja' && !ft ? '～' : '–'}${n(prep.hi)} ${ft ? 'ft' : 'm'}`;
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

<div class="elev" bind:this={card} data-elev data-held={held === null ? '' : Math.round(held)}>
  <div class="hd"><span class="t">{pick(S.elevation, i18n.locale)}</span><span class="r" data-elev-range>{range}</span></div>
  <div class="plot" bind:clientWidth={w}>
    <svg bind:this={svg} viewBox="0 0 {w} {PROF.h}" preserveAspectRatio="none" role="img" aria-label={pick(S.scrub, i18n.locale)}
      onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <defs><linearGradient id="hk-eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1f6f5c" stop-opacity=".28" /><stop offset="100%" stop-color="#1f6f5c" stop-opacity=".03" /></linearGradient></defs>
      {#each prep.wpts as wp, i (i)}<line x1={x(wp.d)} y1="4" x2={x(wp.d)} y2={PROF.h} stroke={C.wpt} stroke-width="1" stroke-dasharray="3,3" opacity=".6" />{/each}
      <path d={paths.area} fill="url(#hk-eg)" />
      <path d={paths.line} fill="none" stroke="#1f6f5c" stroke-width="1.75" />
      {#if at}
        <line x1={x(at.d)} y1="0" x2={x(at.d)} y2={PROF.h} stroke="#16231d" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="4,3" />
        <circle cx={x(at.d)} cy={profileY(prep, at.ele)} r="4.5" fill={C.scrub} stroke="#fff" stroke-width="2" />
      {/if}
    </svg>
  </div>
  {#if at}
    <div class="tip" bind:clientWidth={tipW} style:left="{tipLeft}px" data-scrub-tip>{fmtM(Math.round(at.ele))}<span class="d">{fmtKm(at.d / 1000)}</span></div>
  {/if}
</div>

<style>
  .elev {
    position: relative; background: var(--surface-2); border: 1px solid var(--line-2); border-radius: 16px; padding: 13px 12px 8px; margin-bottom: 20px;
    /* a press-drag surface: never a text selection or the callout */
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }
  .hd { display: flex; justify-content: space-between; align-items: baseline; padding: 0 4px 8px; }
  .t { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
  .r { font-size: 12px; font-weight: 700; color: var(--ink-2); font-variant-numeric: tabular-nums; }
  svg { display: block; width: 100%; height: 96px; touch-action: none; cursor: crosshair; }
  .tip {
    position: absolute; top: 10px; left: 0; transform: translateX(-50%); z-index: 5; pointer-events: none; white-space: nowrap;
    background: var(--ink); border-radius: 9px; padding: 5px 10px; font-size: 12px; font-weight: 800; color: #fff; box-shadow: var(--sh-pop); font-variant-numeric: tabular-nums;
  }
  .d { color: rgba(255, 255, 255, .62); font-weight: 600; margin-left: 6px; }
</style>
