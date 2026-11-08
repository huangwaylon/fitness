<script lang="ts">
  // A daily series' chart, one person's (けんこう's activity, ごはん's kcal and nutrients): a bar per day (1週, 1か月) or
  // per week / month (the daily average of its days with a record) in their colour, solid when its goal was met the
  // goal's way (at least, at most, near: model/health.ts seriesBuckets' `met`) and paler the fewer of its days did (today's too: solid once met):
  // Apple Health's values as is, so a 66-step day is its short bar and a 0 a 1px sliver on the axis; today's bar is
  // outlined (still running); a day with no record gets a short faint hatched stub on the axis (plainly missing: not a
  // gap that reads as zero, and not a column that reads as a value). The goal dashed (stepped where it changed; its
  // words are the card's chip and legend, not in the plot: ChartFrame); `avg`, the period's daily average, a flat solid line; with room (1週) each bar carries
  // its value. `plain` (no goal): every bar solid. Hand-drawn SVG at the measured width, in ChartFrame.
  import type { LocalDate, Who } from '#lib/types.ts';
  import type { BucketValue, Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import ChartFrame from './ChartFrame.svelte';
  import { axisNum, barNum, niceTicks } from './fmt.ts';

  interface Props {
    /** Unique per chart on the page (its SVG defs' ids). */
    id: string;
    range: Range;
    /** Whose bars (their colour; the guest's lilac on ごはん's グラフ). */
    p: Who;
    vals: BucketValue[];
    /** The first record (days before it aren't "no record"). */
    first: LocalDate;
    today: LocalDate;
    label: string;
    /** The goal's words for its line (goals.ts goalLabel), or null: none. */
    goalText: string | null;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
    /** A flat solid line at this value (the period's daily average), or none. */
    avg?: number | null;
    /** No goal-met shading: every bar solid, the callout without ✓ and goal days. */
    plain?: boolean;
    /** A value in words (the callout) and over its bar. */
    fmt: (v: number) => string;
    barFmt?: ((v: number) => string) | null;
  }
  let { id, range, p, vals, first, today, label, goalText, selected, onselect, onswipe, slide, avg = null, plain = false, fmt, barFmt = null }: Props = $props();
  const barText = $derived(barFmt ?? barNum);

  const H = 168;
  const pad = { l: 38, r: 6, t: 14, b: 24 };
  /** Value labels over the bars when each has room for one (1週). */
  const labels = $derived(range.buckets.length <= 7);

  /** 0 to a round top over the tallest bar, the goal and the average (so the goal line is always on the axis). */
  const raw = $derived.by(() => {
    let max = avg ?? 0;
    for (const b of vals) max = Math.max(max, b.v ?? 0, b.goal ?? 0);
    return niceTicks(max * (labels ? 1.12 : 1.04));
  });
  const top = $derived(raw.at(-1) ?? 1);
  const y = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const ticks = $derived(raw.map((v) => ({ v, y: y(v), text: axisNum(v) })));
  const base = $derived(y(0));
  /** A no-record day's stub: this tall on the axis, far below any value worth reading. */
  const NONE_H = 7;

  /** The goal per bucket (stepped where it changed); none at all: no line. */
  const goal = $derived.by(() => {
    if (goalText === null) return null;
    const ys = vals.map((b) => (b.goal === null ? null : y(b.goal)));
    return ys.every((v) => v === null) ? null : { ys, text: goalText, off: null, tone: 'soft' as const };
  });

  const missing = (i: number) => {
    const b = range.buckets[i];
    return b.to >= first && b.from < today;
  };
</script>

<ChartFrame {id} {H} {pad} {range} {today} {label} {ticks} {goal} {selected} {onselect} {onswipe} {slide} running={(i) => vals[i]?.today ?? false}>
  {#snippet defs()}
    <pattern id="hatch-{id}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hatch" width="1.2" height="3" /></pattern>
  {/snippet}
  {#snippet plot(g)}
    {@const barW = Math.max(1.5, Math.min(28, g.bw * 0.68))}
    {#each vals as b, i (i)}
      {@const x = g.x0(i) + (g.bw - barW) / 2}
      {#if b.v !== null}
        {@const yt = Math.min(y(b.v), base - 1)}
        {@const r = Math.min(3, barW / 2, base - yt)}
        <path class="bar p{p}" class:now={b.today} style:--met={plain ? 1 : b.met / Math.max(1, b.days)}
          d="M{x} {base}V{yt + r}Q{x} {yt} {x + r} {yt}H{x + barW - r}Q{x + barW} {yt} {x + barW} {yt + r}V{base}Z" />
      {:else if missing(i)}
        <rect class="none" x={x + 0.5} y={base - NONE_H} width={Math.max(1, barW - 1)} height={NONE_H - 0.5} rx={Math.min(1.5, barW / 2)} fill="url(#hatch-{id})" />
      {/if}
    {/each}
  {/snippet}
  {#snippet over(g)}
    {#if avg !== null}<line class="avg-u" x1={g.x0(0)} x2={g.x0(0) + g.plotW} y1={y(avg)} y2={y(avg)} /><line class="avg" data-avg={Math.round(avg)} x1={g.x0(0)} x2={g.x0(0) + g.plotW} y1={y(avg)} y2={y(avg)} />{/if}
    {#if labels}
      {#each vals as b, i (i)}
        {#if b.v !== null}<text class="val" x={g.cx(i)} y={Math.min(y(b.v), base - 1) - 4} text-anchor="middle">{barText(b.v)}</text>{/if}
      {/each}
    {/if}
  {/snippet}
  {#snippet tip(i)}
    {@const b = vals[i]}
    <span class="trow"><i class="dot p{p}"></i>
      {#if b.v === null}<span class="soft">{t('health.noData')}</span>
      {:else if range.unit === 'day'}<span class="money">{fmt(b.v)}</span>{#if b.met && !plain}<span class="ok">✓</span>{/if}
      {:else}<span class="money">{fmt(b.v)}</span><span class="soft">{plain ? t('health.recDays', { n: b.days }) : t('health.tipDays', { n: b.met, d: b.days })}</span>{/if}
    </span>
  {/snippet}
</ChartFrame>

<style>
  /* the fill: the share of its days that met the goal (a day: met = solid, not met = pale; today's alike, met once its
     value is: the dashed outline says it's still running), never under --bar-floor (night's higher: the navy card) */
  .bar { stroke-width: 0; fill-opacity: calc(var(--bar-floor) + (1 - var(--bar-floor)) * var(--met)); }
  .bar.now { stroke-width: 1.5; stroke-dasharray: 3 2; }
  /* at night a pale bar keeps its full-colour edge too (its fill alone is ~1.6:1 on the navy card) */
  :global(:root[data-tod='night']) .bar:not(.now) { stroke-width: 1; }
  .pA { fill: var(--person-a); stroke: var(--person-a); }
  .pB { fill: var(--person-b); stroke: var(--person-b); }
  .pG { fill: var(--c-lilac); stroke: var(--c-lilac); }
  /* no row: a short faint hatched stub on the axis, plainly missing (neither a zero nor a value) */
  .none { stroke: color-mix(in srgb, var(--text-soft) 50%, transparent); stroke-width: 1; stroke-dasharray: 2 1.5; }
  .hatch { fill: color-mix(in srgb, var(--text-soft) 45%, transparent); }
  /* the average: a thin solid line in the text colour over a card-coloured underlay, so it reads across the bars and
     apart from the dashed goal */
  .avg { stroke: var(--text); stroke-width: 1.5; stroke-linecap: round; }
  .avg-u { stroke: var(--card); stroke-width: 4; opacity: .85; }
  .val { fill: var(--text); font: 700 var(--fs-xs)/1 var(--font-num); paint-order: stroke; stroke: var(--card); stroke-width: 3px; stroke-linejoin: round; }
  .trow { display: flex; align-items: center; gap: 6px; }
  .ok { color: var(--c-leaf-text); }
  .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  .dot.pA { background: var(--person-a); }
  .dot.pB { background: var(--person-b); }
  .dot.pG { background: var(--c-lilac); }
</style>
