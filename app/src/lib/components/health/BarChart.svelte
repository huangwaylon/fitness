<script lang="ts">
  // One metric's chart (けんこう), one person's: a bar per day (1週, 1か月) or per week / month (the daily average of its
  // days with data) in their colour, solid when the goal was met and pale when not: Apple Health's values as is, so a
  // 66-step day is its short bar and a 0 a 1px sliver on the axis; today's bar is outlined (still running); a day with
  // no row at all gets a short faint hatched stub on the axis (plainly missing: not a gap that reads as zero, and not a
  // column that reads as a value). The dashed line is their
  // goal (stepped when their Move goal changed; none without one); with room (1週) each bar carries its value. ごはん's
  // グラフ (FoodChart) draws the kcal eaten with it: `plain` (no goal-met shading, every bar solid) and `avg`, the
  // period's daily average as a flat solid line (けんこう's cards pass neither). A tap shows that bar's exact numbers; a horizontal drag turns the page (gestures.ts).
  // Hand-drawn SVG at the measured width.
  import type { LocalDate, Who } from '#lib/types.ts';
  import type { BucketValue, Metric, Range } from '#lib/model/health.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { axisNum, barNum, metricText, niceTicks, rangeLabel, xLabels } from './fmt.ts';
  import { chartGestures } from './gestures.ts';

  interface Props {
    metric: Metric;
    range: Range;
    /** Whose bars (their colour; the guest's lilac on ごはん's グラフ). */
    p: Who;
    vals: BucketValue[];
    /** The first activity row (days before it aren't "no record"). */
    first: LocalDate;
    today: LocalDate;
    label: string;
    /** The bar whose numbers are shown (bindable; shared by the charts so only one callout is open). */
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    /** Which way the last page turn went, for the slide. */
    slide: -1 | 0 | 1;
    /** Unique per page when two charts of one metric share it (the SVG defs' ids). */
    id?: string;
    /** A flat solid line at this value (the period's daily average), or none. */
    avg?: number | null;
    /** No goal-met shading: every bar solid, the callout without ✓ and goal days (a log with a goal that isn't a target). */
    plain?: boolean;
  }
  let { metric, range, p, vals, first, today, label, selected, onselect, onswipe, slide, id = metric, avg = null, plain = false }: Props = $props();

  let w = $state(0);
  let dx = $state(0);
  const H = 168;
  const pad = { l: 38, r: 6, t: 14, b: 24 };
  const n = $derived(range.buckets.length);
  const plotW = $derived(Math.max(1, w - pad.l - pad.r));
  const bw = $derived(plotW / n);
  /** Value labels over the bars when each has room for one (1週). */
  const labels = $derived(n <= 7);

  const ticks = $derived.by(() => {
    let max = 0;
    for (const b of vals) max = Math.max(max, b.v ?? 0, b.goal ?? 0);
    return niceTicks(max * (labels ? 1.12 : 1.04));
  });
  const top = $derived(ticks.at(-1) ?? 1);
  const y = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const base = $derived(y(0));
  /** A no-record day's stub: this tall on the axis, far below any value worth reading. */
  const NONE_H = 7;

  /** One bar per bucket, wide (a gap of about a third between them). */
  const barW = $derived(Math.max(1.5, Math.min(28, bw * 0.68)));
  const barX = (i: number) => pad.l + i * bw + (bw - barW) / 2;
  const cx = (i: number) => pad.l + i * bw + bw / 2;

  /** A bar with rounded top corners (radius ≤ 3), anchored to the baseline. */
  function bar(x: number, v: number): string {
    const yt = Math.min(y(v), base - 1);
    const r = Math.min(3, barW / 2, base - yt);
    return `M${x} ${base}V${yt + r}Q${x} ${yt} ${x + r} ${yt}H${x + barW - r}Q${x + barW} ${yt} ${x + barW} ${yt + r}V${base}Z`;
  }
  /** The goal, stepped where it changed (the Move goal); none without one. */
  const goalPath = $derived.by(() => {
    let d = '';
    vals.forEach((b, i) => {
      if (b.goal === null) return;
      const yy = y(b.goal).toFixed(1);
      d += d === '' ? `M${i ? (pad.l + i * bw).toFixed(1) : pad.l} ${yy}` : `V${yy}`;
      d += `H${(pad.l + (i + 1) * bw).toFixed(1)}`;
    });
    return d;
  });
  const missing = (i: number) => {
    const b = range.buckets[i];
    return b.to >= first && b.from < today;
  };
  const xl = $derived(xLabels(range, plotW));

  let box: HTMLElement | undefined = $state();
  /** A tap picks the bar under it (again: closes); the chart scrolls fully into view so its callout isn't under the range row. */
  function tap(px: number) {
    const i = Math.floor((px - pad.l) / bw);
    const next = i < 0 || i >= n || i === selected ? null : i;
    onselect(next);
    if (next !== null) box?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  const sel = $derived(selected !== null && selected < n ? selected : null);
  /** The callout sits inside the plot's top, on the half away from the picked bar, so the bar stays in sight. */
  const tipLeftSide = $derived(sel !== null && cx(sel) > pad.l + plotW / 2);
  const bucketTitle = (i: number) => {
    const b = range.buckets[i];
    if (range.unit === 'day') return formatDate(b.from);
    return rangeLabel({ ...range, from: b.from, to: b.to, unit: range.unit === 'month' ? 'day' : range.unit }, today);
  };
</script>

<div class="chart" bind:this={box} bind:clientWidth={w} style:height="{H}px"
  use:chartGestures={{ tap, swipe: onswipe, drag: (d) => (dx = d) }}>
  {#if w > 0}
    <svg width={w} height={H} viewBox="0 0 {w} {H}" role="img" aria-label={label}>
      <defs>
        <clipPath id="clip-{id}"><rect x={pad.l} y="0" width={plotW} height={H} /></clipPath>
        <pattern id="hatch-{id}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hatch" width="1.2" height="3" /></pattern>
      </defs>
      {#each ticks as v (v)}
        <line class="grid" class:zero={v === 0} x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
        <text class="ax" x={pad.l - 5} y={y(v)} text-anchor="end" dominant-baseline="middle">{axisNum(v)}</text>
      {/each}
      <g clip-path="url(#clip-{id})">
        {#key range.from + range.period}
          <g class="plot" class:dragging={dx !== 0} style:--slide="{slide * 28}px" style:transform="translateX({dx * 0.5}px)">
            {#if sel !== null}<rect class="hl" x={pad.l + sel * bw} y={pad.t - 4} width={bw} height={base - pad.t + 4} rx="4" />{/if}
            {#each vals as b, i (i)}
              {#if b.v !== null}
                <path class="bar p{p}" class:now={b.today} style:opacity={b.today || plain ? null : 0.34 + 0.66 * (b.met / Math.max(1, b.days))} d={bar(barX(i), b.v)} />
              {:else if missing(i)}
                <rect class="none" x={barX(i) + 0.5} y={base - NONE_H} width={Math.max(1, barW - 1)} height={NONE_H - 0.5} rx={Math.min(1.5, barW / 2)} fill="url(#hatch-{id})" />
              {/if}
            {/each}
            {#if goalPath}<path class="goal" d={goalPath} />{/if}
            {#if avg !== null}<line class="avg-u" x1={pad.l} x2={pad.l + plotW} y1={y(avg)} y2={y(avg)} /><line class="avg" data-avg={Math.floor(avg)} x1={pad.l} x2={pad.l + plotW} y1={y(avg)} y2={y(avg)} />{/if}
            {#if labels}
              {#each vals as b, i (i)}
                {#if b.v !== null}<text class="val" x={cx(i)} y={Math.min(y(b.v), base - 1) - 4} text-anchor="middle">{barNum(b.v)}</text>{/if}
              {/each}
            {/if}
          </g>
        {/key}
      </g>
      {#each xl as l (l.i)}
        <text class="ax" x={Math.min(Math.max(cx(l.i), pad.l + 14), w - pad.r - 14)} y={H - 6} text-anchor="middle">{l.text}</text>
      {/each}
    </svg>
    {#if sel !== null}
      {@const b = vals[sel]}
      <div class="tip" style:left={tipLeftSide ? `${pad.l + 4}px` : null} style:right={tipLeftSide ? null : `${pad.r + 4}px`} aria-live="polite">
        <b>{bucketTitle(sel)}{#if b.today}<small> · {t('health.todaySoFar')}</small>{/if}</b>
        <span class="trow"><i class="dot p{p}"></i>
          {#if b.v === null}<span class="soft">{t('health.noData')}</span>
          {:else if range.unit === 'day'}<span class="money">{metricText(metric, b.v)}</span>{#if b.met && !plain}<span class="ok">✓</span>{/if}
          {:else}<span class="money">{metricText(metric, b.v)}</span><span class="soft">{plain ? t('health.recDays', { n: b.days }) : t('health.tipDays', { n: b.met, d: b.days })}</span>{/if}
        </span>
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
  .plot { animation: slide 220ms cubic-bezier(.2, .8, .2, 1); }
  .plot:not(.dragging) { transition: transform 200ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: .2; translate: var(--slide) 0; } to { opacity: 1; translate: 0 0; } }
  .hl { fill: var(--hl); }
  /* opacity: the share of its days that met the goal (a day: met = solid, not met = pale) */
  .bar { stroke-width: 0; }
  .bar.now { fill-opacity: .3; stroke-width: 1.5; stroke-dasharray: 3 2; }
  .pA { fill: var(--person-a); stroke: var(--person-a); }
  .pB { fill: var(--person-b); stroke: var(--person-b); }
  .pG { fill: var(--c-lilac); stroke: var(--c-lilac); }
  /* no row: a short faint hatched stub on the axis, plainly missing (neither a zero nor a value) */
  .none { stroke: color-mix(in srgb, var(--text-soft) 50%, transparent); stroke-width: 1; stroke-dasharray: 2 1.5; }
  .hatch { fill: color-mix(in srgb, var(--text-soft) 45%, transparent); }
  .goal { fill: none; stroke: var(--text-soft); stroke-width: 1.5; stroke-dasharray: 5 4; }
  /* the average: a thin solid line in the text colour over a card-coloured underlay, so it reads across the bars and
     apart from the dashed goal */
  .avg { stroke: var(--text); stroke-width: 1.5; stroke-linecap: round; }
  .avg-u { stroke: var(--card); stroke-width: 4; opacity: .85; }
  .val { fill: var(--text); font: 700 var(--fs-xs)/1 var(--font-num); paint-order: stroke; stroke: var(--card); stroke-width: 3px; stroke-linejoin: round; }
  .tip {
    position: absolute; top: 2px; pointer-events: none; white-space: nowrap; z-index: 1;
    display: grid; gap: 3px; padding: 7px 11px; border-radius: var(--r-chip); background: var(--c-cream); color: var(--c-ink);
    box-shadow: var(--sh-float); font-size: var(--fs-s); font-weight: 700;
  }
  .tip small { font-size: var(--fs-s); color: var(--c-ink-soft); }
  .trow { display: flex; align-items: center; gap: 6px; }
  .trow .money { font-size: var(--fs-body); }
  .trow .soft { color: var(--c-ink-soft); }
  .ok { color: var(--c-leaf-text); }
  .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  .dot.pA { background: var(--person-a); }
  .dot.pB { background: var(--person-b); }
  .dot.pG { background: var(--c-lilac); }
</style>
