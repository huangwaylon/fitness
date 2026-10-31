<script lang="ts">
  // One metric's chart (けんこう): a bar per day (1週, 1か月) or per week / month (the daily average of its recorded
  // days), one colour per person (ふたり: side by side, me first), solid when the goal was met and pale when not;
  // today's bar is outlined (still running); a day with no record gets a small dash on the baseline. The dashed line is
  // the goal (the Move goal per person, and when it changed), the solid line the 7-day average (day bars only). A tap
  // shows that bar's exact numbers for both; a horizontal drag turns the page (gestures.ts). Hand-drawn SVG at the
  // measured width.
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import type { BucketValue, Metric, Range } from '#lib/model/health.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { axisNum, metricText, niceTicks, rangeLabel, xLabels } from './fmt.ts';
  import { chartGestures } from './gestures.ts';

  export interface BarSeries {
    p: PersonId;
    vals: BucketValue[];
    /** The 7-day average per day (day bars only). */
    roll: (number | null)[] | null;
  }
  interface Props {
    metric: Metric;
    range: Range;
    series: BarSeries[];
    /** The first record (days before it aren't "no record"). */
    first: LocalDate;
    today: LocalDate;
    names: Record<PersonId, string>;
    label: string;
    /** The bar whose numbers are shown (bindable; shared by the charts so only one callout is open). */
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    /** Which way the last page turn went, for the slide. */
    slide: -1 | 0 | 1;
  }
  let { metric, range, series, first, today, names, label, selected, onselect, onswipe, slide }: Props = $props();

  let w = $state(0);
  let dx = $state(0);
  const H = 156;
  const pad = { l: 38, r: 6, t: 10, b: 22 };
  const n = $derived(range.buckets.length);
  const plotW = $derived(Math.max(1, w - pad.l - pad.r));
  const bw = $derived(plotW / n);

  const ticks = $derived.by(() => {
    let max = 0;
    for (const s of series) {
      for (const b of s.vals) max = Math.max(max, b.v ?? 0, b.goal);
      for (const r of s.roll ?? []) max = Math.max(max, r ?? 0);
    }
    return niceTicks(max * 1.04);
  });
  const top = $derived(ticks.at(-1) ?? 1);
  const y = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const base = $derived(y(0));

  /** Bars per bucket: side by side for two people, a little gap between buckets. */
  const barW = $derived(Math.max(1.5, Math.min(series.length > 1 ? 12 : 18, (bw * (series.length > 1 ? 0.84 : 0.62)) / series.length)));
  const barX = (i: number, k: number) => pad.l + i * bw + bw / 2 - (barW * series.length + (series.length - 1)) / 2 + k * (barW + 1);
  const cx = (i: number) => pad.l + i * bw + bw / 2;

  /** A bar with rounded top corners (radius ≤ 3), anchored to the baseline. */
  function bar(x: number, v: number): string {
    const yt = Math.min(y(v), base - 1);
    const r = Math.min(3, barW / 2, base - yt);
    return `M${x} ${base}V${yt + r}Q${x} ${yt} ${x + r} ${yt}H${x + barW - r}Q${x + barW} ${yt} ${x + barW} ${yt + r}V${base}Z`;
  }
  /** A stepped dashed goal line per person (one when every person's is the same). */
  const goals = $derived.by(() => {
    const paths: { p: PersonId | null; d: string }[] = [];
    const key = (s: BarSeries) => s.vals.map((b) => b.goal).join(',');
    const same = series.every((s) => key(s) === key(series[0]));
    for (const s of same ? series.slice(0, 1) : series) {
      let d = '';
      s.vals.forEach((b, i) => {
        const yy = y(b.goal).toFixed(1);
        d += i === 0 ? `M${pad.l} ${yy}` : `V${yy}`;
        d += `H${(pad.l + (i + 1) * bw).toFixed(1)}`;
      });
      paths.push({ p: same ? null : s.p, d });
    }
    return paths;
  });
  function rollPath(r: (number | null)[]): string {
    let d = '';
    let pen = false;
    r.forEach((v, i) => {
      if (v === null) return void (pen = false);
      d += `${pen ? 'L' : 'M'}${cx(i).toFixed(1)} ${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  }
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
      <defs><clipPath id="clip-{metric}"><rect x={pad.l} y="0" width={plotW} height={H} /></clipPath></defs>
      {#each ticks as v (v)}
        <line class="grid" class:zero={v === 0} x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
        <text class="ax" x={pad.l - 5} y={y(v)} text-anchor="end" dominant-baseline="middle">{axisNum(v)}</text>
      {/each}
      <g clip-path="url(#clip-{metric})">
        {#key range.from + range.period}
          <g class="plot" class:dragging={dx !== 0} style:--slide="{slide * 28}px" style:transform="translateX({dx * 0.5}px)">
            {#if sel !== null}<rect class="hl" x={pad.l + sel * bw} y={pad.t - 4} width={bw} height={base - pad.t + 4} rx="4" />{/if}
            {#each range.buckets as _, i (i)}
              {#each series as s, k (s.p)}
                {@const b = s.vals[i]}
                {#if b.v !== null && b.v > 0}
                  <path class="bar p{s.p}" class:now={b.today} style:opacity={b.today ? null : 0.34 + 0.66 * (b.met / Math.max(1, b.days))} d={bar(barX(i, k), b.v)} />
                {:else if b.v === null && missing(i)}
                  <rect class="none" x={barX(i, k) + barW / 2 - Math.min(3, barW / 2)} y={base - 1.5} width={Math.min(6, barW)} height="3" rx="1.5" />
                {/if}
              {/each}
            {/each}
            {#each goals as g (g.p ?? 'all')}
              <path class="goal" class:pA={g.p === 'A'} class:pB={g.p === 'B'} d={g.d} />
            {/each}
            {#each series as s (s.p)}
              {#if s.roll}<path class="roll-halo" d={rollPath(s.roll)} /><path class="roll p{s.p}" d={rollPath(s.roll)} />{/if}
            {/each}
          </g>
        {/key}
      </g>
      {#each xl as l (l.i)}
        <text class="ax" x={Math.min(Math.max(cx(l.i), pad.l + 14), w - pad.r - 14)} y={H - 6} text-anchor="middle">{l.text}</text>
      {/each}
    </svg>
    {#if sel !== null}
      <div class="tip" style:left={tipLeftSide ? `${pad.l + 4}px` : null} style:right={tipLeftSide ? null : `${pad.r + 4}px`} aria-live="polite">
        <b>{bucketTitle(sel)}{#if series[0]?.vals[sel].today}<small> · {t('health.todaySoFar')}</small>{/if}</b>
        {#each series as s (s.p)}
          {@const b = s.vals[sel]}
          <span class="trow"><i class="dot p{s.p}"></i><span class="nm">{names[s.p]}</span>
            {#if b.v === null}<span class="soft">{t('health.noData')}</span>
            {:else if range.unit === 'day'}<span class="money">{metricText(metric, b.v)}</span>{#if b.met}<span class="ok">✓</span>{/if}
            {:else}<span class="money">{metricText(metric, b.v)}</span><span class="soft">{t('health.tipDays', { n: b.met, d: b.days })}</span>{/if}
          </span>
        {/each}
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
  .ax { fill: var(--text-soft); font: 700 var(--fs-xs)/1 var(--font-num); }
  .plot { animation: slide 220ms cubic-bezier(.2, .8, .2, 1); }
  .plot:not(.dragging) { transition: transform 200ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: .2; translate: var(--slide) 0; } to { opacity: 1; translate: 0 0; } }
  .hl { fill: var(--hl); }
  /* opacity: the share of its days that met the goal (a day: met = solid, not met = pale) */
  .bar { stroke-width: 0; }
  .bar.now { fill-opacity: .3; stroke-width: 1.5; stroke-dasharray: 3 2; }
  .pA { fill: var(--person-a); stroke: var(--person-a); }
  .pB { fill: var(--person-b); stroke: var(--person-b); }
  .none { fill: color-mix(in srgb, var(--text-soft) 55%, transparent); }
  .goal { fill: none; stroke: var(--text-soft); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .goal.pA { stroke: var(--person-a); fill: none; }
  .goal.pB { stroke: var(--person-b); fill: none; }
  .roll, .roll-halo { fill: none; stroke-linejoin: round; stroke-linecap: round; }
  .roll { stroke-width: 2; }
  .roll.pA { stroke: color-mix(in srgb, var(--person-a) 70%, var(--text)); fill: none; }
  .roll.pB { stroke: color-mix(in srgb, var(--person-b) 70%, var(--text)); fill: none; }
  .roll-halo { stroke: var(--card); stroke-width: 5; }
  .tip {
    position: absolute; top: 2px; pointer-events: none; white-space: nowrap; z-index: 1;
    display: grid; gap: 3px; padding: 7px 11px; border-radius: var(--r-chip); background: var(--c-cream); color: var(--c-ink);
    box-shadow: var(--sh-float); font-size: var(--fs-s); font-weight: 700;
  }
  .tip small { font-size: var(--fs-s); color: var(--c-ink-soft); }
  .trow { display: flex; align-items: center; gap: 6px; }
  .trow .nm { color: var(--c-ink-soft); }
  .trow .money { font-size: var(--fs-body); }
  .trow .soft { color: var(--c-ink-soft); }
  .ok { color: var(--c-leaf-text); }
  .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  .dot.pA { background: var(--person-a); }
  .dot.pB { background: var(--person-b); }
</style>
