<script lang="ts">
  // One person's sparse series (からだ: weight, body fat %, BMI or lean body mass). A dot per day with a measurement (or
  // per week / month: the average of its measurements), the dots joined by a thin line across the gaps between them,
  // the goal solid (ChartFrame; its words the chip's), on an axis fitted to the values (the goal too when it is near; a
  // far one isn't drawn, to scale it would flatten the dots), from a grid line to a grid line: no empty band past the
  // last label. 体重 (`line`): the smoothed line (model/pace.ts weightLine) in place of the thin one, each point at its
  // own day, and on the current range with a verdict the projection dashed on from its end to where the pace's rate puts
  // the weight (`ahead`: PACE.ahead days at most, a quarter of the chart at most). A tap shows that bucket's numbers; a
  // horizontal drag turns the page. No good / bad colours on the dots.
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import type { DotBucket, Range } from '#lib/model/health.ts';
  import type { WeighIn } from '#lib/model/weight.ts';
  import { PACE } from '#lib/model/pace.ts';
  import { daysBetween } from '#lib/time/dates.ts';
  import { t } from '#lib/i18n/index.ts';
  import ChartFrame, { type Geo } from './ChartFrame.svelte';
  import { axisNum, weekdayRow } from './fmt.ts';

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
    today: LocalDate;
    label: string;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
    /** 体重's smoothed line, ascending (none: the thin line through the dots). */
    line?: readonly WeighIn[] | null;
    /** Its projection from today (model/pace.ts Pace `ahead`; the caller's: the current range only). */
    ahead?: { from: WeighIn; to: WeighIn } | null;
  }
  let { id, person, range, buckets, fmt, minSpan = 2, goal, today, label, selected, onselect, onswipe, slide, line = null, ahead = null }: Props = $props();

  /** A bucket's days (a month's ~30.4): how far a day moves along the axis. */
  const per = $derived(range.unit === 'day' ? 1 : range.unit === 'week' ? 7 : 30.44);
  /** The room past today, in buckets: PACE.ahead days, a quarter of the chart at most. */
  const room = $derived(ahead ? Math.min(PACE.ahead / per, range.buckets.length / 4) : 0);
  /** The line's points in sight: the range's, and one either side (the clip cuts them at the edges). */
  const shown = $derived.by(() => {
    if (!line) return [];
    const a = line.findIndex((w) => w.date >= range.from), z = line.findLastIndex((w) => w.date <= range.to);
    return a < 0 ? line.slice(-1) : line.slice(Math.max(0, a - 1), z + 2);
  });
  /** A day's x: at its share of its bucket (a day bucket's middle), past the range on at the buckets' pace. */
  function xOf(g: Geo, d: LocalDate): number {
    const bs = range.buckets;
    if (d > range.to) return xOf(g, range.to) + (daysBetween(range.to, d) / per) * g.bw;
    if (d < range.from) return g.x0(0) - (daysBetween(d, range.from) / per) * g.bw;
    const i = bs.findIndex((b) => d <= b.to);
    if (range.unit === 'day') return g.cx(i);
    return g.x0(i) + ((daysBetween(bs[i].from, d) + 0.5) / per) * g.bw;
  }
  const pathOf = (g: Geo, ws: readonly WeighIn[]) => ws.reduce((d, w, i) => `${d}${i ? 'L' : 'M'}${xOf(g, w.date).toFixed(1)} ${y(w.kg).toFixed(1)}`, '');

  /** 1週: a row more under the axis (the weekdays: ChartFrame). */
  const H = $derived(weekdayRow(range) ? 162 : 148);
  const pad = $derived({ l: 38, r: 6, t: 10, b: weekdayRow(range) ? 36 : 22 });

  const ext = $derived.by(() => {
    let lo = Infinity, hi = -Infinity;
    for (const b of buckets) if (b.v !== null) (lo = Math.min(lo, b.v)), (hi = Math.max(hi, b.v));
    for (const w of [...shown.filter((w) => w.date >= range.from && w.date <= range.to), ...(ahead ? [ahead.from, ahead.to] : [])]) (lo = Math.min(lo, w.kg)), (hi = Math.max(hi, w.kg));
    return lo <= hi ? { lo, hi } : null;
  });
  /** A goal far from the period's values isn't drawn (the chip says it). */
  const goalOn = $derived(goal !== null && !!ext && Math.abs(goal - (goal < ext.lo ? ext.lo : ext.hi)) <= Math.max(minSpan, ext.hi - ext.lo));
  /** The axis: the values (and a near goal) out to round lines at a step of 1, 2 or 5 × 10ⁿ (about three gaps), at
   *  least `minSpan` wide (widened on the side with less room), a hair past them so an edge dot isn't clipped. */
  const axis = $derived.by(() => {
    if (!ext) return { lo: 0, hi: 1, step: 1, m: 0 };
    let lo = ext.lo, hi = ext.hi;
    if (goalOn) (lo = Math.min(lo, goal!)), (hi = Math.max(hi, goal!));
    const span = Math.max(minSpan, hi - lo);
    const pow = 10 ** Math.floor(Math.log10(span / 3));
    const step = [1, 2, 5, 10].map((k) => k * pow).find((s) => span / s <= 3.5) ?? 10 * pow;
    let a = Math.floor(lo / step + 1e-9) * step, z = Math.ceil(hi / step - 1e-9) * step;
    while (z - a < minSpan - 1e-9) lo - a <= z - hi ? (a -= step) : (z += step);
    return { lo: a, hi: z, step, m: (z - a) * 0.04 };
  });
  const y = (v: number) => pad.t + (1 - (v - axis.lo + axis.m) / (axis.hi - axis.lo + 2 * axis.m)) * (H - pad.t - pad.b);
  const ticks = $derived.by(() => {
    const out: { v: number; y: number; text: string }[] = [];
    for (let k = Math.round(axis.lo / axis.step); k * axis.step <= axis.hi + 1e-9; k++) {
      const v = Math.round(k * axis.step * 1000) / 1000;
      out.push({ v, y: y(v), text: axisNum(v, axis.hi) });
    }
    return out;
  });
  const goalMark = $derived(goal === null || !goalOn ? null : { ys: buckets.map(() => y(goal)), tone: 'yuzu' as const });
</script>

<ChartFrame id="{id}{person}" {H} {pad} {range} {today} {label} {ticks} goal={goalMark} {selected} {onselect} {onswipe} {slide} bleed={4} ahead={room}>
  {#snippet plot(g)}
    {@const r = Math.max(1.8, Math.min(3.4, g.bw / 2.4))}
    {#each buckets as b, i (i)}
      {#if b.v !== null}<circle class="dot p{person}" cx={g.cx(i)} cy={y(b.v)} {r} />{/if}
    {/each}
    {#if line}
      <!-- 体重: the smoothed line, then the projection dashed -->
      <path class="trend p{person}" data-trend d={pathOf(g, shown)} />
      <!-- (from the line's end: the EWMA lags the Theil–Sen weight it aims from, so no gap opens between them) -->
      {#if ahead}<path class="ahead p{person}" data-ahead d={pathOf(g, [line.at(-1) ?? ahead.from, ahead.to])} />{/if}
    {:else}
      <!-- the measurements in order, one thin line through them (a gap without one is bridged, not broken) -->
      <path class="line p{person}" d={buckets.reduce((d, b, i) => (b.v === null ? d : `${d}${d ? 'L' : 'M'}${g.cx(i).toFixed(1)} ${y(b.v).toFixed(1)}`), '')} />
    {/if}
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
  .trend, .ahead { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .ahead { stroke-dasharray: 4 4; opacity: .7; }
  .trend.pA, .ahead.pA { stroke: var(--person-a); }
  .trend.pB, .ahead.pB { stroke: var(--person-b); }
</style>
