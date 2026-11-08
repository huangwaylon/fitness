<script lang="ts" module>
  /** What a chart's marks are drawn against: the measured width, the plot's, a bucket's and a bucket's centre. */
  export interface Geo {
    w: number;
    plotW: number;
    bw: number;
    cx: (i: number) => number;
    x0: (i: number) => number;
  }
</script>

<script lang="ts">
  // The frame every chart in けんこう and ごはん's グラフ is drawn in (BarChart, DotChart): the measured SVG, the
  // horizontal grid with its numbers, the dates under it, the goal (its dashed line, stepped where it changed; its words
  // are the card's chip and legend, never over the bars, but when it is far off the axis: 「目標 66.0 kg 前後 ↑」 at the
  // top or bottom edge), the page's
  // slide and drag, the picked bucket's band and its callout (inside the plot's top, on the half away from it, so the
  // bucket stays in sight). A tap picks the bucket under it (again: closes) and scrolls the chart fully into view; a
  // horizontal drag turns the page (gestures.ts). The caller draws its marks (`plot`) and the callout's lines (`tip`).
  import type { Snippet } from 'svelte';
  import type { LocalDate } from '#lib/types.ts';
  import type { Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import { bucketTitle, xLabels } from './fmt.ts';
  import { chartGestures } from './gestures.ts';

  interface Props {
    /** Unique per chart on the page (its SVG defs' ids). */
    id: string;
    H: number;
    pad: { l: number; r: number; t: number; b: number };
    range: Range;
    today: LocalDate;
    /** The chart in words (its role=img's name): what, whose, the range, the average and the goal. */
    label: string;
    /** The y grid: each line's value, height and number. */
    ticks: readonly { v: number; y: number; text: string }[];
    /** The goal: its height per bucket (stepped where it changed; null: none there, no line while `off`), its words
     *  (shown only while it is far off past an edge, `off`), and its colour. */
    goal: { ys: readonly (number | null)[]; text: string; off: 'above' | 'below' | null; tone: 'soft' | 'yuzu' } | null;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    /** Which way the last page turn went, for the slide. */
    slide: -1 | 0 | 1;
    /** Extra room each side of the plot's clip (a dot's radius). */
    bleed?: number;
    defs?: Snippet;
    /** The marks, under the goal line. */
    plot: Snippet<[Geo]>;
    /** Over the goal line (the bars' values). */
    over?: Snippet<[Geo]>;
    /** The picked bucket's lines under its title. */
    tip: Snippet<[number]>;
    /** Whether bucket i is today, still running (its title says so). */
    running?: (i: number) => boolean;
  }
  let { id, H, pad, range, today, label, ticks, goal, selected, onselect, onswipe, slide, bleed = 0, defs, plot, over, tip, running }: Props = $props();

  /** The chart's width: its last while the sheet is closed (kept mounted, display none, it reads 0): its picture kept. */
  let w = $state(0);
  let dx = $state(0);
  /** The range has turned since this chart was drawn: only then does the plot slide in (never as the sheet opens). */
  // svelte-ignore state_referenced_locally
  const drawn = range.from + range.period;
  let turned = $state(false);
  $effect.pre(() => {
    if (range.from + range.period !== drawn) turned = true;
  });
  const n = $derived(range.buckets.length);
  const plotW = $derived(Math.max(1, w - pad.l - pad.r));
  const bw = $derived(plotW / n);
  const geo = $derived<Geo>({ w, plotW, bw, cx: (i) => pad.l + i * bw + bw / 2, x0: (i) => pad.l + i * bw });
  const xl = $derived(xLabels(range, plotW));
  const base = $derived(H - pad.b);
  /** The goal's line: flat across each bucket, a step where it changed. */
  const goalD = $derived.by(() => {
    if (!goal || goal.off) return '';
    let d = '';
    goal.ys.forEach((yy, i) => {
      if (yy === null) return;
      d += `${d === '' ? `M${geo.x0(i).toFixed(1)} ` : 'V'}${yy.toFixed(1)}H${geo.x0(i + 1).toFixed(1)}`;
    });
    return d;
  });

  let box: HTMLElement | undefined = $state();
  function tap(px: number) {
    const i = Math.floor((px - pad.l) / bw);
    const next = i < 0 || i >= n || i === selected ? null : i;
    onselect(next);
    if (next !== null) box?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  const sel = $derived(selected !== null && selected >= 0 && selected < n ? selected : null);
  const tipLeftSide = $derived(sel !== null && geo.cx(sel) > pad.l + plotW / 2);
  /** A goal far off the axis: its words at the edge it is off past (with ↑ / ↓), kept inside the plot. */
  const goalY = $derived(goal?.off === 'below' ? base - 5 : pad.t + 8);
</script>

<div class="chart" bind:this={box} bind:clientWidth={() => w, (v) => v > 0 && (w = v)} style:height="{H}px" use:chartGestures={{ tap, swipe: onswipe, drag: (d) => (dx = d) }}>
  {#if w > 0}
    <svg width={w} height={H} viewBox="0 0 {w} {H}" role="img" aria-label={label}>
      <defs>
        <clipPath id="clip-{id}"><rect x={pad.l - bleed} y="0" width={plotW + 2 * bleed} height={H} /></clipPath>
        {@render defs?.()}
      </defs>
      {#each ticks as tk (tk.v)}
        <line class="grid" class:zero={tk.v === 0} x1={pad.l} x2={w - pad.r} y1={tk.y} y2={tk.y} />
        <text class="ax" x={pad.l - 5} y={tk.y} text-anchor="end" dominant-baseline="middle">{tk.text}</text>
      {/each}
      <g clip-path="url(#clip-{id})">
        {#key range.from + range.period}
          <g class="plot" class:turned class:dragging={dx !== 0} style:--slide="{slide * 28}px" style:transform="translateX({dx * 0.5}px)">
            {#if sel !== null}<rect class="hl" x={geo.x0(sel)} y={pad.t - 4} width={bw} height={base - pad.t + 4} rx="4" />{/if}
            {@render plot(geo)}
            {#if goal && goalD}<path class="goal {goal.tone}" d={goalD} />{/if}
            {@render over?.(geo)}
          </g>
        {/key}
      </g>
      {#if goal?.off}
        <text class="gtext" data-goal-line x={w - pad.r - 2} y={goalY} text-anchor="end">{goal.text}{goal.off === 'below' ? ' ↓' : ' ↑'}</text>
      {/if}
      {#each xl as l (l.i)}
        <text class="ax" x={Math.min(Math.max(geo.cx(l.i), pad.l + 14), w - pad.r - 14)} y={H - 6} text-anchor="middle">{l.text}</text>
      {/each}
    </svg>
    {#if sel !== null}
      <div class="tip" style:left={tipLeftSide ? `${pad.l + 4}px` : null} style:right={tipLeftSide ? null : `${pad.r + 4}px`} aria-live="polite">
        <b>{bucketTitle(range, sel, today)}{#if running?.(sel)}<small> · {t('health.todaySoFar')}</small>{/if}</b>
        {@render tip(sel)}
      </div>
    {/if}
  {/if}
</div>

<style>
  /* scroll-margin: clear of the sticky range row when a tap scrolls the chart into view */
  .chart { position: relative; width: 100%; scroll-margin: 84px 0 12px; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: pointer; }
  svg { display: block; overflow: visible; }
  .grid { stroke: color-mix(in srgb, var(--text-soft) 16%, transparent); stroke-width: 1; }
  .grid.zero { stroke: color-mix(in srgb, var(--text-soft) 45%, transparent); }
  .ax { fill: var(--text-soft); font: 700 var(--fs-s)/1 var(--font-num); }
  .gtext { fill: var(--text-soft); font: 700 var(--fs-xs)/1 var(--font-num); paint-order: stroke; stroke: var(--card); stroke-width: 3px; stroke-linejoin: round; }
  .plot.turned { animation: slide 220ms cubic-bezier(.2, .8, .2, 1); }
  .plot:not(.dragging) { transition: transform 200ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: .2; translate: var(--slide) 0; } to { opacity: 1; translate: 0 0; } }
  .hl { fill: var(--hl); }
  /* the goal: dashed, the chip's swatch (GoalEdit .gl) */
  .goal { fill: none; stroke-width: 1.5; stroke-dasharray: 5 4; }
  .goal.soft { stroke: var(--text-soft); }
  .goal.yuzu { stroke: var(--c-yuzu-lip); }
  .tip {
    position: absolute; top: 2px; pointer-events: none; white-space: nowrap; z-index: 1;
    display: grid; gap: 3px; padding: 7px 11px; border-radius: var(--r-chip); background: var(--c-cream); color: var(--c-ink);
    box-shadow: var(--sh-float); font-size: var(--fs-s); font-weight: 700;
  }
  .tip :global(small) { font-size: var(--fs-s); color: var(--c-ink-soft); }
  .tip :global(.money) { font-size: var(--fs-body); }
  .tip :global(.soft) { color: var(--c-ink-soft); }
</style>
