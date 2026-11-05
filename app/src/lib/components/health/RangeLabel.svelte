<script lang="ts">
  // The middle of the charts' range row (RangeNav): the visible range (「10/2–10/31」, wrapping after its dash when a
  // long one doesn't fit beside the buttons) and its unit under it (「1日ごと」, 「1週ごとの 1日平均」).
  import type { LocalDate } from '#lib/types.ts';
  import type { Range } from '#lib/model/health.ts';
  import { t } from '#lib/i18n/index.ts';
  import { rangeLabel } from './fmt.ts';

  let { range, today }: { range: Range; today: LocalDate } = $props();
</script>

<span class="rl" aria-live="polite">
  <b class="money" data-range>{#each rangeLabel(range, today).split('–') as part, i (i)}{#if i}–<wbr />{/if}<span>{part}</span>{/each}</b>
  <small>{t(`health.unit.${range.unit}`)}</small>
</span>

<style>
  .rl { flex: 1; min-width: 0; display: grid; justify-items: center; gap: 3px; text-align: center; }
  .rl b { font-size: var(--fs-talk); line-height: 1.1; text-wrap: balance; }
  .rl b span { white-space: nowrap; }
  /* (beside a period pill the middle is narrow: the unit wraps, 「1か月ごとの / 1日平均」) */
  .rl small { font-size: var(--fs-s); font-weight: 700; line-height: 1.2; color: var(--text-soft); text-wrap: balance; }
</style>
