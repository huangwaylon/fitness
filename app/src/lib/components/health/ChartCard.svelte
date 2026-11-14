<script lang="ts">
  // One chart's card, the same for every chart in けんこう and ごはん's グラフ (docs/design.md "Goals in place"): its
  // icon and name, its goal at the upper right (GoalEdit: 「— 目標 8,000歩 以上 ✎」, set there when it's ours to set,
  // else shown read-only), then the caller's numbers, chart and key; with nothing recorded yet, one line instead (the
  // goal can still be set before the first record).
  import type { Snippet } from 'svelte';
  import type { Who } from '#lib/types.ts';
  import type { GoalId } from '#lib/contract/goals.ts';
  import { t } from '#lib/i18n/index.ts';
  import { BODY_ART, fruitArt, NUTRIENT_ART } from '#lib/art.ts';
  import { METRIC_FRUIT, type Metric } from '#lib/model/health.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import GoalEdit from './GoalEdit.svelte';
  import { GOAL_SPECS, goalLabel } from './goals.ts';

  interface Props {
    id: GoalId;
    /** Its name (the heading). */
    title: string;
    /** Whose data (`data-person`). */
    p: Who;
    /** The goal shown: the one in force at the period's end (null: none). */
    goal: number | null;
    /** Where the editor starts: the goal in force now (null: none), and −/＋ with none (the period's average, say). */
    now?: number | null;
    start?: number | null;
    /** Sets the goal (null clears it); absent: read-only. */
    onsave?: ((v: number | null) => void) | null;
    /** The editor's gentle note on a value (GoalEdit `warn`: the kcal goal's). */
    warn?: ((v: number) => string | null) | null;
    /** The chart's goal line: the bar charts' soft, the dot charts' yuzu (the chip's swatch matches it). */
    tone: 'soft' | 'yuzu';
    /** Nothing recorded yet: the one line. */
    empty: boolean;
    /** The card's hook for tests (`data-metric` / `data-food-chart`) and its look (`mc` bars, `bc` dots). */
    kind: 'metric' | 'food';
    children: Snippet;
  }
  let { id, title, p, goal, now, start = null, onsave = null, warn = null, tone, empty, kind, children }: Props = $props();

  const art = $derived(id in NUTRIENT_ART ? NUTRIENT_ART[id as keyof typeof NUTRIENT_ART] : id in BODY_ART ? BODY_ART[id as keyof typeof BODY_ART] : fruitArt(METRIC_FRUIT[id as Metric]));
  const cur = $derived(now === undefined ? goal : now);
  const hid = $derived(`${kind === 'food' ? 'fi' : 'mc'}-${id}`);
</script>

<section class="card hcard {tone === 'soft' ? 'mc' : 'bc'}" data-metric={kind === 'metric' ? id : undefined} data-food-chart={kind === 'food' ? id : undefined}
  data-person={p} data-goal-dir={GOAL_SPECS[id].dir} aria-labelledby={hid}>
  <header>
    <span class="ic"><OfficialArt key={art} size={24} /></span>
    <h3 id={hid}>{title}</h3>
    <GoalEdit id="{id}-goal" spec={GOAL_SPECS[id]} label={goalLabel(id, goal)} value={cur} {onsave} {start} {warn} {tone} />
  </header>
  {#if empty}
    <p class="none" data-health-empty={kind === 'metric' ? '' : undefined} data-food-empty={kind === 'food' ? '' : undefined}>{t('kiroku.empty')}</p>
  {:else}
    {@render children()}
  {/if}
</section>
