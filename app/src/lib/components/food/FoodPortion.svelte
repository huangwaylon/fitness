<script lang="ts">
  // ごはん's amount controls, in the order they're decided (docs/design.md "Gohan" Amount): 状態, a chip per state of the
  // food with its kcal at the amount it would take, one line why (a chain menu's: サイズ and ミルク, a chip per word); 量, its portions as chips (the first the default; 100 g
  // last); −/＋ (nextMult: ×0.5 to ×20, dimmed at either end; ×0.5 read 「0.5倍」) and the grams field (ml for a drink;
  // none for a serving). The picker (`a`: AmountPick) holds the rules; the amount level (FoodAmount) and a search row
  // opened in place (FoodOpen) both draw it with this.
  import { nutrientsFor } from '#lib/food/index.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import type { AmountPick } from './amount.svelte.ts';
  import { gramsText, hasWeight } from './portions.ts';

  interface Props {
    a: AmountPick;
    /** The grams field focused (the keyboard up). */
    typing?: boolean;
  }
  let { a, typing = $bindable(false) }: Props = $props();
</script>

<div class="ctl">
  {#if a.groups}
    {#each a.groups as gr (gr.head)}
      <h4>{t(gr.head === 'milk' ? 'food.st.milk' : 'food.st.size')}</h4>
      <div class="chips" role="group" aria-label={t(gr.head === 'milk' ? 'food.st.milk' : 'food.st.size')} data-states={gr.head}>
        {#each gr.chips as c (c.label)}
          {@const k = a.keepIn(c.to)}
          <button type="button" class="chip big" aria-pressed={c.on} data-sfx={c.on ? 'none' : 'tick'} data-state={c.label} onclick={() => a.pickState(c.to)}>
            {c.label}<small>{formatNum(nutrientsFor(c.to, k.g).kcal)} kcal</small>
          </button>
        {/each}
      </div>
    {/each}
  {:else if a.states.length}
    <h4>{t('food.st.head')}</h4>
    <div class="chips" role="group" aria-label={t('food.st.head')} data-states>
      {#each a.states as v (v.id)}
        {@const k = a.keepIn(v)}
        <button type="button" class="chip big" aria-pressed={v.id === a.item.id} data-sfx={v.id === a.item.id ? 'none' : 'tick'} data-state={v.st} onclick={() => a.pickState(v)}>
          {v.st}<small>{formatNum(nutrientsFor(v, k.g).kcal)} kcal</small>
        </button>
      {/each}
    </div>
    {#if a.why}<p class="why" data-state-why>{a.why}</p>{/if}
  {/if}
  <h4>{t('food.amount')}</h4>
  <div class="chips" role="group" aria-label={t('food.amount')}>
    {#each a.ps as p, i (p.label)}
      <button type="button" class="chip big" aria-pressed={!a.custom && a.pi === i} data-sfx={!a.custom && a.pi === i ? 'none' : 'tick'} data-portion={p.label} onclick={() => a.portion(i)}>
        {p.label}{#if !a.serving && !hasWeight(p.label)}<small>{gramsText(p.g)}{a.unit}</small>{/if}
      </button>
    {/each}
  </div>
  <div class="qty">
    <button type="button" class="nb" data-sfx="tick" aria-label={t('food.less')} aria-disabled={a.atFloor} data-step="-1" onclick={() => a.step(-1)}>−</button>
    {#if a.custom}<b class="mult money">{gramsText(a.g)}{a.unit}</b>
    {:else}<b class="mult money" aria-hidden="true">×{a.mult}</b><span class="sr-only" aria-live="polite">{t('food.times', { n: a.mult })}</span>{/if}
    <button type="button" class="nb" data-sfx="tick" aria-label={t('food.more')} aria-disabled={a.atCap} data-step="1" onclick={() => a.step(1)}>＋</button>
    {#if !a.serving}<label class="grams">
      <span class="sr-only">{t(a.unit === 'ml' ? 'food.ml' : 'food.grams')}</span>
      <input type="text" inputmode="decimal" data-sfx="none" data-grams autocomplete="off" enterkeyhint="done" maxlength="8" size="5"
        value={a.custom ? a.typed : gramsText(a.g)} aria-invalid={!a.ok} oninput={(e) => a.grams(e.currentTarget.value)}
        onfocus={() => (typing = true)} onblur={() => (typing = false)} />
      <span class="u" aria-hidden="true">{a.unit}</span>
    </label>{/if}
  </div>
</div>

<style>
  .ctl { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
  h4 { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .why { margin: -2px 2px 4px; font-size: var(--fs-s); font-weight: 700; color: var(--leaf-text); }
  /* the chips: theme.css .chip.big */
  .chip small { margin-left: 4px; font-size: var(--fs-xs); color: var(--text-soft); }
  .chip[aria-pressed='true'] small { color: inherit; opacity: .7; }
  .nb {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill); width: var(--hit); flex: none;
    font: 700 var(--fs-talk)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .nb:active:not([aria-disabled='true']) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .nb[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .qty { display: flex; align-items: center; gap: 8px; }
  .mult { min-width: 3.4em; text-align: center; font-size: var(--fs-talk); }
  .grams { margin-left: auto; display: flex; align-items: baseline; gap: 6px; }
  .grams input {
    width: 5.5em; min-height: var(--hit); padding: 6px 10px; border: 0; border-radius: var(--r-btn); text-align: right;
    font: 700 var(--fs-input)/1.1 var(--font-num); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  .grams input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .grams input[aria-invalid='true'] { box-shadow: inset 0 0 0 2px var(--c-coral); }
  .u { font: 700 var(--fs-body)/1 var(--font-num); color: var(--text-soft); }
</style>
