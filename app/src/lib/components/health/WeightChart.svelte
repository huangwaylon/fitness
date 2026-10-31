<script lang="ts">
  // One person's weight (けんこう): a dot per day with a weigh-in (or per week / month: the average of its weigh-ins),
  // the dots joined by a thin line across the gaps between weigh-ins, the goal dashed, on an axis fitted to their weights. A tap shows that day's numbers; a horizontal
  // drag turns the page. No good / bad colours.
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import type { Range, WeightBucket } from '#lib/model/health.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { kgText } from '../kiroku/fmt.ts';
  import { rangeLabel, xLabels } from './fmt.ts';
  import { chartGestures } from './gestures.ts';

  interface Props {
    person: PersonId;
    range: Range;
    buckets: WeightBucket[];
    goal: number | null;
    today: LocalDate;
    label: string;
    selected: number | null;
    onselect: (i: number | null) => void;
    onswipe: (dir: -1 | 1) => void;
    slide: -1 | 0 | 1;
  }
  let { person, range, buckets, goal, today, label, selected, onselect, onswipe, slide }: Props = $props();

  let w = $state(0);
  let dx = $state(0);
  const H = 148;
  const pad = { l: 38, r: 6, t: 10, b: 22 };
  const n = $derived(range.buckets.length);
  const plotW = $derived(Math.max(1, w - pad.l - pad.r));
  const bw = $derived(plotW / n);
  const cx = (i: number) => pad.l + i * bw + bw / 2;

  const dataVals = $derived(buckets.map((b) => b.kg).filter((v): v is number => v !== null));
  /** A goal far from the period's weights isn't drawn to scale (it would flatten them): a label at that edge instead. */
  const goalOff = $derived.by((): 'above' | 'below' | null => {
    if (goal === null || !dataVals.length) return null;
    const lo = Math.min(...dataVals), hi = Math.max(...dataVals), span = Math.max(2, hi - lo);
    return goal < lo - span ? 'below' : goal > hi + span ? 'above' : null;
  });
  const domain = $derived.by(() => {
    const vals = [...dataVals];
    if (goal !== null && vals.length && !goalOff) vals.push(goal);
    if (!vals.length) return { lo: 0, hi: 1 };
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < 2) {
      const mid = (hi + lo) / 2;
      lo = mid - 1;
      hi = mid + 1;
    }
    const m = (hi - lo) * 0.08;
    return { lo: lo - m, hi: hi + m };
  });
  const y = (kg: number) => pad.t + (1 - (kg - domain.lo) / (domain.hi - domain.lo)) * (H - pad.t - pad.b);
  const ticks = $derived.by(() => {
    const range = domain.hi - domain.lo;
    const step = range <= 3.5 ? 1 : range <= 8 ? 2 : 5;
    const out: number[] = [];
    for (let v = Math.ceil(domain.lo / step) * step; v <= domain.hi; v += step) out.push(v);
    return out;
  });
  /** The weigh-ins in order, one thin line through them (a gap without one is bridged, not broken). */
  const linePath = $derived.by(() => {
    let d = '';
    let pen = false;
    buckets.forEach((b, i) => {
      if (b.kg === null) return;
      d += `${pen ? 'L' : 'M'}${cx(i).toFixed(1)} ${y(b.kg).toFixed(1)}`;
      pen = true;
    });
    return d;
  });
  const any = $derived(buckets.some((b) => b.kg !== null));
  const xl = $derived(xLabels(range, plotW));
  const r = $derived(Math.max(1.8, Math.min(3.4, bw / 2.4)));

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
  const title = (i: number) => {
    const b = range.buckets[i];
    return range.unit === 'day' ? formatDate(b.from) : rangeLabel({ ...range, from: b.from, to: b.to, unit: 'day' }, today);
  };
</script>

<div class="chart" bind:this={box} bind:clientWidth={w} style:height="{H}px" use:chartGestures={{ tap, swipe: onswipe, drag: (d) => (dx = d) }}>
  {#if w > 0}
    <svg width={w} height={H} viewBox="0 0 {w} {H}" role="img" aria-label={label}>
      <defs><clipPath id="clip-w{person}"><rect x={pad.l - 4} y="0" width={plotW + 8} height={H} /></clipPath></defs>
      {#each ticks as v (v)}
        <line class="grid" x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
        <text class="ax" x={pad.l - 5} y={y(v)} text-anchor="end" dominant-baseline="middle">{v}</text>
      {/each}
      <g clip-path="url(#clip-w{person})">
        {#key range.from + range.period}
          <g class="plot" class:dragging={dx !== 0} style:--slide="{slide * 28}px" style:transform="translateX({dx * 0.5}px)">
            {#if sel !== null}<rect class="hl" x={pad.l + sel * bw} y={pad.t - 4} width={bw} height={H - pad.b - pad.t + 4} rx="4" />{/if}
            {#if goal !== null && any && !goalOff}<line class="goal" x1={pad.l} x2={w - pad.r} y1={y(goal)} y2={y(goal)} />{/if}
            {#each buckets as b, i (i)}
              {#if b.kg !== null}<circle class="dot p{person}" cx={cx(i)} cy={y(b.kg)} {r} />{/if}
            {/each}
            {#if linePath}<path class="line p{person}" d={linePath} />{/if}
          </g>
        {/key}
      </g>
      {#if goal !== null && any}
        <text class="ax" x={pad.l + 4} y={goalOff === 'below' ? H - pad.b - 5 : goalOff === 'above' ? pad.t + 8 : y(goal) - 5}>{t('weight.goalShort', { kg: goal.toFixed(1) })}{goalOff === 'below' ? ' ↓' : goalOff === 'above' ? ' ↑' : ''}</text>
      {/if}
      {#each xl as l (l.i)}
        <text class="ax" x={Math.min(Math.max(cx(l.i), pad.l + 14), w - pad.r - 14)} y={H - 6} text-anchor="middle">{l.text}</text>
      {/each}
    </svg>
    {#if sel !== null}
      {@const b = buckets[sel]}
      <div class="tip" style:left={tipLeftSide ? `${pad.l + 4}px` : null} style:right={tipLeftSide ? null : `${pad.r + 4}px`} aria-live="polite">
        <b>{title(sel)}</b>
        {#if b.kg === null}<span class="soft">{t('health.noData')}</span>
        {:else}<span><span class="money">{kgText(b.kg)}</span>{#if b.n > 1}<span class="soft"> {t('health.weight.avgOf', { n: b.n })}</span>{/if}</span>{/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  /* scroll-margin: clear of the sticky range row when a tap scrolls the chart into view */
  .chart { position: relative; width: 100%; scroll-margin: 84px 0 12px; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: pointer; }
  svg { display: block; overflow: visible; }
  .grid { stroke: color-mix(in srgb, var(--text-soft) 16%, transparent); stroke-width: 1; }
  .ax { fill: var(--text-soft); font: 700 var(--fs-s)/1 var(--font-num); }
  .plot { animation: slide 220ms cubic-bezier(.2, .8, .2, 1); }
  .plot:not(.dragging) { transition: transform 200ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: .2; translate: var(--slide) 0; } to { opacity: 1; translate: 0 0; } }
  .hl { fill: var(--hl); }
  .goal { stroke: var(--c-yuzu-lip); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .dot { opacity: .55; }
  .dot.pA { fill: var(--person-a); }
  .dot.pB { fill: var(--person-b); }
  .line { fill: none; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; opacity: .6; }
  .line.pA { stroke: var(--person-a); }
  .line.pB { stroke: var(--person-b); }
  .tip {
    position: absolute; top: 2px; pointer-events: none; white-space: nowrap; z-index: 1;
    display: grid; gap: 3px; padding: 7px 11px; border-radius: var(--r-chip); background: var(--c-cream); color: var(--c-ink);
    box-shadow: var(--sh-float); font-size: var(--fs-s); font-weight: 700;
  }
  .tip .money { font-size: var(--fs-body); }
  .tip .soft { color: var(--c-ink-soft); }
</style>
