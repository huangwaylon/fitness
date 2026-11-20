<script lang="ts">
  // A food's nutrients as tiles, four across (two on a phone narrower than 360 px): FoodCustom's view and FoodRecipe's
  // per-serving card. Each its name and its grams to one decimal ('–' unknown), `g` after the number with `unit`.
  import { t } from '#lib/i18n/index.ts';

  let { cells, unit = false }: { cells: readonly (readonly [k: string, v: number | null | undefined])[]; unit?: boolean } = $props();
</script>

<dl class="cells">
  {#each cells as [k, v] (k)}
    <div><dt>{t(`food.${k}`)}</dt><dd class="money">{v === null || v === undefined ? '–' : v.toFixed(1)}{#if unit && v !== null && v !== undefined}<small>g</small>{/if}</dd></div>
  {/each}
</dl>

<style>
  .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 0; }
  .cells div { min-width: 0; padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  dd { margin: 3px 0 0; font-size: var(--fs-body); }
  dd small { margin-left: 1px; font-size: var(--fs-xs); }
  /* (a 320 px phone: four tiles cut 「たんぱく質」; two by two) */
  @media (max-width: 359px) { .cells { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
