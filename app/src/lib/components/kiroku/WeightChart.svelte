<script lang="ts">
  // The weight chart (ADR 0020): one person, the last WEIGHT.chartWeeks weeks. Each weigh-in is a small mint dot, the
  // trend an ink line, the optional goal a dashed yuzu line. `mini`: a sparkline (no axes, no hover) for the summary
  // card. Drawn in pixels at the measured width so the dots stay round at 320–430. Hover / touch on the full chart
  // shows the day under the finger (date, weight, trend).
  import type { WeightPoint } from '#lib/model/weight.ts';
  import { daysBetween } from '#lib/model/weight.ts';
  import { addDays } from '#lib/scoring/index.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { kgText } from './fmt.ts';

  interface Props {
    points: WeightPoint[];
    goal: number | null;
    /** The last day shown (today). */
    to: string;
    weeks: number;
    mini?: boolean;
    label: string;
  }
  let { points, goal, to, weeks, mini = false, label }: Props = $props();

  let w = $state(0);
  const h = $derived(mini ? 44 : 176);
  const pad = $derived(mini ? { l: 3, r: 3, t: 5, b: 5 } : { l: 34, r: 8, t: 14, b: 22 });
  const from = $derived(addDays(to, -7 * weeks + 1));
  const span = $derived(Math.max(1, daysBetween(from, to)));
  const shown = $derived(points.filter((p) => p.date >= from && p.date <= to));
  /** The trend line starts from the trend carried into the window (the last weigh-in before it), so it never jumps. */
  const carry = $derived(points.findLast((p) => p.date < from) ?? null);

  const domain = $derived.by(() => {
    const vals = shown.flatMap((p) => [p.kg, p.trend]);
    if (carry) vals.push(carry.trend);
    if (goal !== null && !mini) vals.push(goal);
    if (!vals.length) return { lo: 0, hi: 1 };
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    const min = mini ? 1.2 : 2;
    if (hi - lo < min) {
      const mid = (hi + lo) / 2;
      lo = mid - min / 2;
      hi = mid + min / 2;
    }
    const m = (hi - lo) * 0.08;
    return { lo: lo - m, hi: hi + m };
  });
  const x = (date: string) => pad.l + (daysBetween(from, date) / span) * Math.max(1, w - pad.l - pad.r);
  const y = (kg: number) => pad.t + (1 - (kg - domain.lo) / (domain.hi - domain.lo)) * (h - pad.t - pad.b);

  const trendPath = $derived.by(() => {
    if (!w || !shown.length) return '';
    const pts = shown.map((p) => [x(p.date), y(p.trend)] as const);
    if (carry) pts.unshift([pad.l, y(carry.trend)]);
    return pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  });

  /** About three whole-kg gridlines (every 1, 2 or 5 kg). */
  const ticks = $derived.by(() => {
    if (mini) return [];
    const range = domain.hi - domain.lo;
    const step = range <= 3.5 ? 1 : range <= 8 ? 2 : 5;
    const out: number[] = [];
    for (let v = Math.ceil(domain.lo / step) * step; v <= domain.hi; v += step) out.push(v);
    return out;
  });
  /** Dates under the x axis: every 4 weeks back from today. */
  const xTicks = $derived(mini ? [] : [0, 1, 2].map((k) => addDays(to, -28 * k)).filter((d) => d >= from));
  const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

  let hover = $state<WeightPoint | null>(null);
  function move(e: PointerEvent) {
    if (mini || !shown.length) return;
    const box = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - box.left;
    let best = shown[0];
    for (const p of shown) if (Math.abs(x(p.date) - px) < Math.abs(x(best.date) - px)) best = p;
    hover = best;
  }
</script>

<div class="chart" class:mini bind:clientWidth={w} style:height="{h}px">
  {#if w > 0}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <svg width={w} height={h} viewBox="0 0 {w} {h}" role="img" aria-label={label}
      onpointermove={move} onpointerdown={move} onpointerleave={() => (hover = null)}>
      {#each ticks as v (v)}
        <line class="grid" x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
        <text class="ax" x={pad.l - 6} y={y(v)} text-anchor="end" dominant-baseline="middle">{v}</text>
      {/each}
      {#each xTicks as d (d)}
        <text class="ax" x={x(d)} y={h - 6} text-anchor={d === to ? 'end' : 'middle'}>{md(d)}</text>
      {/each}
      {#if goal !== null && !mini}
        <line class="goal" x1={pad.l} x2={w - pad.r} y1={y(goal)} y2={y(goal)} />
        <text class="ax goal-t" x={pad.l + 4} y={y(goal) - 5}>{t('weight.goalShort', { kg: goal.toFixed(1) })}</text>
      {/if}
      {#each shown as p (p.date)}
        <circle class="dot" cx={x(p.date)} cy={y(p.kg)} r={mini ? 1.6 : 2.8} />
      {/each}
      {#if trendPath}<path class="trend" d={trendPath} />{/if}
      {#if shown.length && mini}
        {@const last = shown[shown.length - 1]}
        <circle class="now" cx={x(last.date)} cy={y(last.trend)} r="3" />
      {/if}
      {#if hover}
        <line class="cross" x1={x(hover.date)} x2={x(hover.date)} y1={pad.t} y2={h - pad.b} />
        <circle class="ring" cx={x(hover.date)} cy={y(hover.kg)} r="5" />
      {/if}
    </svg>
    {#if hover}
      {@const left = Math.min(Math.max(x(hover.date), 70), w - 70)}
      <div class="tip" style:left="{left}px" aria-live="polite">
        <b>{formatDate(hover.date)}</b>
        <span>{kgText(hover.kg)} · {t('weight.trendShort')} {kgText(hover.trend)}</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .chart { position: relative; width: 100%; touch-action: pan-y; }
  svg { display: block; overflow: visible; }
  .grid { stroke: color-mix(in srgb, var(--text-soft) 18%, transparent); stroke-width: 1; }
  .ax { fill: var(--text-soft); font: 700 var(--fs-xs)/1 var(--font-num); }
  .goal { stroke: var(--c-yuzu-lip); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .goal-t { fill: var(--text-soft); }
  .dot { fill: var(--c-mint-lip); opacity: .75; }
  .trend { fill: none; stroke: var(--text); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .now { fill: var(--text); stroke: var(--fill-on-surface); stroke-width: 2; }
  .cross { stroke: color-mix(in srgb, var(--text) 40%, transparent); stroke-width: 1; }
  .ring { fill: none; stroke: var(--text); stroke-width: 2; }
  .tip {
    position: absolute; top: 0; transform: translateX(-50%); pointer-events: none; white-space: nowrap;
    display: grid; gap: 2px; padding: 6px 10px; border-radius: var(--r-chip); background: var(--c-cream); color: var(--c-ink);
    box-shadow: var(--sh-float); font-size: var(--fs-s); font-weight: 700; text-align: center;
  }
  .tip span { font-family: var(--font-num); }
</style>
