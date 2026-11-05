<script lang="ts">
  // One person's sparse series (からだ: weight, body fat %, BMI or lean body mass). A dot per day with a measurement (or
  // per week / month: the average of its measurements), the dots joined by a thin line across the gaps between them,
  // the goal dashed with its words (ChartFrame), on an axis fitted to the values: the goal too when it is near, else
  // its words at that edge with ↑ / ↓ (to scale it would flatten the dots). A tap shows that bucket's numbers; a
  // horizontal drag turns the page. No good / bad colours on the dots.
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import type { DotBucket, Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import ChartFrame from './ChartFrame.svelte';
  import { axisNum } from './fmt.ts';

  interface Props {
    /** Unique per chart on the page (its SVG defs' ids). */
    id: string;
    person: PersonId;
    range: Range;
    buckets: DotBucket[];
    /** A value with its unit, for the callout (`68.4 kg`, `22.3%`). */
    fmt: (v: number) => string;
    /** The narrowest axis span (weight 2 kg: a flat week isn't magnified into a cliff). */
    minSpan?: number;
    goal: number | null;
    /** The goal's words (goals.ts goalLabel). */
    goalText: string;
    today: LocalDate;
    label: string;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { id, person, range, buckets, fmt, minSpan = 2, goal, goalText, today, label, selected, onselect, onswipe, slide }: Props = $props();

  const H = 148;
  const pad = { l: 38, r: 6, t: 10, b: 22 };

  const ext = $derived.by(() => {
    let lo = Infinity, hi = -Infinity;
    for (const b of buckets) if (b.v !== null) (lo = Math.min(lo, b.v)), (hi = Math.max(hi, b.v));
    return lo <= hi ? { lo, hi } : null;
  });
  /** A goal far from the period's values isn't drawn to scale: its words at that edge instead. */
  const goalOff = $derived.by((): 'above' | 'below' | null => {
    if (goal === null || !ext) return null;
    const span = Math.max(minSpan, ext.hi - ext.lo);
    return goal < ext.lo - span ? 'below' : goal > ext.hi + span ? 'above' : null;
  });
  const domain = $derived.by(() => {
    if (!ext) return { lo: 0, hi: 1 };
    let lo = ext.lo, hi = ext.hi;
    if (goal !== null && !goalOff) (lo = Math.min(lo, goal)), (hi = Math.max(hi, goal));
    if (hi - lo < minSpan) {
      const mid = (hi + lo) / 2;
      lo = mid - minSpan / 2;
      hi = mid + minSpan / 2;
    }
    const m = (hi - lo) * 0.08;
    return { lo: lo - m, hi: hi + m };
  });
  const y = (v: number) => pad.t + (1 - (v - domain.lo) / (domain.hi - domain.lo)) * (H - pad.t - pad.b);
  /** Two to five lines at a round step (1, 2, 5, 10, 20 …), whatever the span. */
  const ticks = $derived.by(() => {
    const span = domain.hi - domain.lo;
    const pow = 10 ** Math.floor(Math.log10(span / 3));
    const step = [1, 2, 5, 10].map((k) => k * pow).find((s) => span / s <= 3.5) ?? 10 * pow;
    const out: { v: number; y: number; text: string }[] = [];
    for (let k = Math.ceil(domain.lo / step); k * step <= domain.hi + 1e-9; k++) {
      const v = Math.round(k * step * 1000) / 1000;
      out.push({ v, y: y(v), text: axisNum(v) });
    }
    return out;
  });
  const goalMark = $derived(goal === null || !ext ? null : { ys: buckets.map(() => (goalOff ? null : y(goal))), y: goalOff ? 0 : y(goal), text: goalText, off: goalOff, tone: 'yuzu' as const });
</script>

<ChartFrame id="{id}{person}" {H} {pad} {range} {today} {label} {ticks} goal={goalMark} {selected} {onselect} {onswipe} {slide} bleed={4}>
  {#snippet plot(g)}
    {@const r = Math.max(1.8, Math.min(3.4, g.bw / 2.4))}
    {#each buckets as b, i (i)}
      {#if b.v !== null}<circle class="dot p{person}" cx={g.cx(i)} cy={y(b.v)} {r} />{/if}
    {/each}
    <!-- the measurements in order, one thin line through them (a gap without one is bridged, not broken) -->
    <path class="line p{person}" d={buckets.reduce((d, b, i) => (b.v === null ? d : `${d}${d ? 'L' : 'M'}${g.cx(i).toFixed(1)} ${y(b.v).toFixed(1)}`), '')} />
  {/snippet}
  {#snippet tip(i)}
    {@const b = buckets[i]}
    {#if b.v === null}<span class="soft">{t('health.noData')}</span>
    {:else}<span><span class="money">{fmt(b.v)}</span>{#if b.n > 1}<span class="soft"> {t('health.weight.avgOf', { n: b.n })}</span>{/if}</span>{/if}
  {/snippet}
</ChartFrame>

<style>
  .dot { opacity: .55; }
  .dot.pA { fill: var(--person-a); }
  .dot.pB { fill: var(--person-b); }
  .line { fill: none; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; opacity: .6; }
  .line.pA { stroke: var(--person-a); }
  .line.pB { stroke: var(--person-b); }
</style>
