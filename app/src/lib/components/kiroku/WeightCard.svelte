<script lang="ts">
  // 体重のながれ (ADR 0020): the calm summary at the top of きろく's からだ, one row per person (me first): avatar, the
  // trend kg, this week's change and a sparkline. A row opens that person's weight screen. Weight never earns ベル, so
  // there are no ベル here and no colours for "good" or "bad": a change is just a number.
  import type { PersonId } from '#lib/types.ts';
  import type { WeightTrend } from '#lib/model/weight.ts';
  import { WEIGHT } from '#lib/config/rules.ts';
  import Avatar from '../characters/Avatar.svelte';
  import WeightChart from './WeightChart.svelte';
  import { kgDelta, kgText } from './fmt.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    trends: Record<PersonId, WeightTrend>;
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    today: string;
    onopen: (p: PersonId) => void;
  }
  let { trends, order, names, villagers, today, onopen }: Props = $props();
</script>

<section class="card wcard" aria-labelledby="weight-h">
  <h3 id="weight-h">{t('weight.title')}</h3>
  {#each order as p (p)}
    {@const w = trends[p]}
    <button type="button" class="row" data-sfx="page" onclick={() => onopen(p)} aria-label="{t('weight.open', { name: names[p] })}{w.latest ? ` ${kgText(w.latest.trend)} ${t('weight.weekShort', { d: kgDelta(w.weekChange) })}` : ''}">
      <Avatar person={p} villager={villagers[p]} size={30} />
      {#if w.latest}
        <span class="nums" aria-hidden="true">
          <b class="money">{w.latest.trend.toFixed(1)}<small>kg</small></b>
          <span class="wk money">{t('weight.weekShort', { d: kgDelta(w.weekChange) })}</span>
        </span>
        <span class="spark" aria-hidden="true">
          <WeightChart points={w.points} goal={null} to={today} weeks={WEIGHT.chartWeeks} mini label="" />
        </span>
      {:else}
        <span class="none">{t('weight.empty')}</span>
      {/if}
      <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
  {/each}
</section>

<style>
  .wcard { display: grid; gap: 4px; padding: 12px 14px 8px; }
  h3 { margin: 0 0 2px; font-size: var(--fs-body); font-weight: 700; }
  .row {
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-align: left;
    display: flex; align-items: center; gap: 10px; min-height: var(--hit); padding: 4px 0; width: 100%; border-radius: var(--r-chip);
  }
  .row + .row { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .row:active { transform: translateY(2px); }
  .nums { display: grid; gap: 3px; flex: none; min-width: 5.4em; }
  .nums b { font-size: var(--fs-talk); }
  .nums small { font-size: var(--fs-s); margin-left: 2px; color: var(--text-soft); }
  .wk { font-size: var(--fs-s); color: var(--text-soft); white-space: nowrap; }
  .spark { flex: 1; min-width: 0; }
  .none { flex: 1; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .chev { width: 18px; height: 18px; flex: none; color: var(--text-soft); }
</style>
