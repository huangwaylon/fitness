<script lang="ts">
  // The PFC balance (docs/design.md "Gohan"): protein, fat and carbohydrate as shares of the energy (model/food.ts
  // pfcShare: their Atwater kcal), one bar of them, then each one's % against the 食事摂取基準's
  // 目標量 (PFC_RANGES): within it the leaf's tick and the range, else ひくめ / たかめ and the range (no coral: a day off
  // balance is no error). Read-only; the summary card (a day) and グラフ's average card show it. `grams` (the average
  // card's): compact, no heading, a thinner bar, each one its grams a day and its % with ✓ / 低め / 高め (the ranges are
  // the day card's).
  import { PFC_RANGES, pfcShare, type PfcOf } from '#lib/model/food.ts';
  import { t } from '#lib/i18n/index.ts';

  let { p, fa, c, id, grams = null }: { p: number; fa: number; c: number; id: string; grams?: ((v: number, n: PfcOf) => string) | null } = $props();

  const share = $derived(pfcShare({ p, fa, c }));
  const ORDER = ['p', 'fa', 'c'] as const;
  const pct = (v: number) => Math.round(v);
  const rangeText = (n: PfcOf) => t('food.pfc.range', { lo: PFC_RANGES[n][0], hi: PFC_RANGES[n][1] });
  const label = $derived(share ? t('food.pfc.label', {
    p: pct(share.p), fa: pct(share.fa), c: pct(share.c)
  }) : '');
</script>

{#if share}
  <div class="pfc" class:compact={!!grams} data-pfc={id}>
    {#if !grams}
      <div class="head">
        <span>{t('food.pfc.head')}</span>
        <small>{t('food.pfc.basis')}</small>
      </div>
    {/if}
    <div class="bar" role="img" aria-label={label}>
      {#each ORDER as n (n)}<i class="s-{n}" style:width="{share[n]}%" data-share={n} data-pct={pct(share[n])}></i>{/each}
    </div>
    <ul class="legend">
      {#each ORDER as n (n)}
        {@const at = share.at[n]}
        <li data-pfc-of={n} data-at={at}>
          <i class="sw s-{n}" aria-hidden="true"></i>
          <span class="nm">{t(`food.${n}`)}</span>
          {#if grams}
            <span class="gv"><b class="money">{grams({ p, fa, c }[n], n)}</b> <small class:ok={at === 0}>{pct(share[n])}%{#if at === 0}<span aria-hidden="true"> ✓</span>{:else} {t(at < 0 ? 'food.pfc.low' : 'food.pfc.high')}{/if}</small></span>
          {:else}
            <b class="money">{pct(share[n])}%</b>
            <small class:ok={at === 0}>{#if at === 0}<span aria-hidden="true">✓ </span>{rangeText(n)}{:else}{t(at < 0 ? 'food.pfc.under' : 'food.pfc.over', { r: rangeText(n) })}{/if}</small>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .pfc { display: grid; gap: 6px; }
  .head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-size: var(--fs-s); font-weight: 700; }
  .head small { font-size: var(--fs-xs); color: var(--text-soft); }
  .bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: color-mix(in srgb, var(--lip) 45%, transparent); }
  .bar i { display: block; height: 100%; }
  .bar i + i { box-shadow: inset 2px 0 0 var(--card); }
  .s-p { background: var(--c-leaf); }
  .s-fa { background: var(--c-yuzu); }
  .s-c { background: var(--c-mint); }
  .legend { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 6px; }
  .legend li { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: 'sw nm' 'v v' 'r r'; align-items: center; column-gap: 4px; }
  .sw { grid-area: sw; width: 10px; height: 10px; border-radius: 3px; }
  .nm { grid-area: nm; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .legend b { grid-area: v; font-size: var(--fs-body); }
  .legend small { grid-area: r; font: 700 var(--fs-xs)/1.25 var(--font-ui); color: var(--text-soft); }
  .legend small.ok { color: var(--leaf-text); }
  .compact .bar { height: 8px; }
  .compact .nm { font-size: var(--fs-s); }
  .gv { grid-area: v; white-space: nowrap; }
  .gv b { font-size: var(--fs-s); }
  .gv small { font: 700 var(--fs-s)/1.25 var(--font-ui); }
</style>
