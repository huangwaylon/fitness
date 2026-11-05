<script lang="ts">
  // The PFC balance (docs/design.md "Gohan"): protein, fat and carbohydrate as shares of the energy (model/food.ts
  // pfcShare: their Atwater kcal, alcohol a share of its own), one bar of them, then each one's % against the 食事摂取基準's
  // 目標量 (PFC_RANGES): within it the leaf's tick and the range, else ひくめ / たかめ and the range (no coral: a day off
  // balance is no error). Read-only; the summary card (a day) and the week's card show it.
  import { PFC_RANGES, pfcShare, type PfcOf } from '#lib/model/food.ts';
  import { t } from '#lib/i18n/index.ts';

  let { p, fa, c, al = 0, id }: { p: number; fa: number; c: number; al?: number; id: string } = $props();

  const share = $derived(pfcShare({ p, fa, c, al }));
  const ORDER = ['p', 'fa', 'c'] as const;
  const pct = (v: number) => Math.round(v);
  const rangeText = (n: PfcOf) => t('food.pfc.range', { lo: PFC_RANGES[n][0], hi: PFC_RANGES[n][1] });
  const label = $derived(share ? t('food.pfc.label', {
    p: pct(share.p), fa: pct(share.fa), c: pct(share.c)
  }) + (share.al >= 0.5 ? t('food.pfc.labelAl', { al: pct(share.al) }) : '') : '');
</script>

{#if share}
  <div class="pfc" data-pfc={id}>
    <div class="head">
      <span>{t('food.pfc.head')}</span>
      <small>{t('food.pfc.basis')}</small>
    </div>
    <div class="bar" role="img" aria-label={label}>
      {#each ORDER as n (n)}<i class="s-{n}" style:width="{share[n]}%" data-share={n} data-pct={pct(share[n])}></i>{/each}
      {#if share.al > 0}<i class="s-al" style:width="{share.al}%" data-share="al" data-pct={pct(share.al)}></i>{/if}
    </div>
    <ul class="legend">
      {#each ORDER as n (n)}
        {@const at = share.at[n]}
        <li data-pfc-of={n} data-at={at}>
          <i class="sw s-{n}" aria-hidden="true"></i>
          <span class="nm">{t(`food.${n}`)}</span>
          <b class="money">{pct(share[n])}%</b>
          <small class:ok={at === 0}>{#if at === 0}<span aria-hidden="true">✓ </span>{rangeText(n)}{:else}{t(at < 0 ? 'food.pfc.under' : 'food.pfc.over', { r: rangeText(n) })}{/if}</small>
        </li>
      {/each}
      {#if share.al >= 0.5}
        <li data-pfc-of="al"><i class="sw s-al" aria-hidden="true"></i><span class="nm">{t('food.al')}</span><b class="money">{pct(share.al)}%</b></li>
      {/if}
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
  .s-al { background: var(--c-lilac); }
  .legend { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px 6px; }
  .legend li { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: 'sw nm' 'v v' 'r r'; align-items: center; column-gap: 4px; }
  .sw { grid-area: sw; width: 10px; height: 10px; border-radius: 3px; }
  .nm { grid-area: nm; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .legend b { grid-area: v; font-size: var(--fs-body); }
  .legend small { grid-area: r; font: 700 var(--fs-xs)/1.25 var(--font-ui); color: var(--text-soft); }
  .legend small.ok { color: var(--leaf-text); }
</style>
