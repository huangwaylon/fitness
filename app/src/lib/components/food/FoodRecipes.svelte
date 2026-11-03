<script lang="ts">
  // ごはん's レシピ tab (マイレシピ, docs/design.md "Gohan"): everyone's recipes, the latest changed first, a card each:
  // its name, who set it (avatar and name), how many servings, a serving's kcal large and the whole's, a serving's
  // P/F/C/salt (FoodSummary's cells), and 「ごはんに ついか」. The card opens it (mine: the editor; anyone else's:
  // read-only, to copy). ＋ あたらしい レシピ on top; none yet: a line on what it is for. Then マイ食品 (everyone's custom
  // foods, the latest changed first): a card each with its name, who made it, its serving (its label, its weight when
  // known) and that serving's kcal; it opens the editor (mine) or the read-only view; ＋ じぶんの 食品を つくる.
  import type { Who } from '#lib/types.ts';
  import type { FoodCustom } from '#lib/contract/food.ts';
  import type { Recipe, RecipeSums } from '#lib/model/food.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import Avatar from '../characters/Avatar.svelte';
  import { servingText } from './foodUi.ts';

  interface Props {
    list: readonly Recipe[];
    names: Record<Who, string>;
    villagerOf: (w: Who) => string | null;
    onnew: () => void;
    onopen: (r: Recipe) => void;
    onlog: (r: Recipe) => void;
    customs: readonly FoodCustom[];
    oncustomnew: () => void;
    oncustom: (c: FoodCustom) => void;
  }
  let { list, names, villagerOf, onnew, onopen, onlog, customs, oncustomnew, oncustom }: Props = $props();
  const kcal = (n: number) => t('kiroku.kcal', { n: formatNum(n) });
  const g1 = (v: number | null) => (v === null ? '–' : v.toFixed(1));
  /** A serving's four nutrients, as FoodSummary's cells. */
  const cells = (x: RecipeSums) => [['p', x.p], ['fa', x.fa], ['c', x.c], ['s', x.s]] as const;
</script>

<div class="rcps">
  <h3 class="lh">{t('food.rcp.mine')}</h3>
  <button type="button" class="btn paper small new" data-sfx="page" data-recipe-new onclick={onnew}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>{t('food.rcp.new')}
  </button>

  {#if !list.length}
    <section class="card empty" data-recipes-empty><p>{t('food.rcp.empty')}</p></section>
  {:else}
    <ul class="list" data-recipes>
      {#each list as r (r.id)}
        <li class="card rc" data-recipe={r.id} data-owner={r.who}>
          <button type="button" class="open" data-sfx="page" data-recipe-open={r.id} onclick={() => onopen(r)}>
            <span class="nm">{r.n}</span>
            <span class="who"><span class="av" aria-hidden="true"><Avatar person={r.who} villager={villagerOf(r.who)} size={22} /></span><span class="sv">{names[r.who]} · {t('food.rcp.servings', { n: r.sv })}</span></span>
            <span class="kc"><b class="money" data-recipe-per>{kcal(r.per.kcal)}</b><small>{t('food.rcp.one')}</small></span>
            <small class="all money" data-recipe-total>{t('food.rcp.all', { k: formatNum(r.total.kcal) })}</small>
            <span class="cells">
              {#each cells(r.per) as [k, v] (k)}
                <span class="cell" data-nutrient={k}><small>{t(`food.${k}`)}</small><b class="money">{g1(v)}</b></span>
              {/each}
            </span>
          </button>
          <button type="button" class="btn small log" data-sfx="page" data-recipe-log={r.id} onclick={() => onlog(r)}>{t('food.rcp.log')}</button>
        </li>
      {/each}
    </ul>
  {/if}

  <h3 class="lh my">{t('food.my.head')}</h3>
  <button type="button" class="btn paper small new" data-sfx="page" data-custom-new onclick={oncustomnew}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 V19 M5 12 H19" /></svg>{t('food.my.new')}
  </button>
  {#if !customs.length}
    <section class="card empty" data-customs-empty><p>{t('food.my.empty')}</p></section>
  {:else}
    <ul class="list" data-customs>
      {#each customs as c (c.id)}
        <li class="card rc" data-custom={c.id} data-owner={c.who}>
          <button type="button" class="open my" data-sfx="page" data-custom-open={c.id} onclick={() => oncustom(c)}>
            <span class="nm">{c.n}</span>
            <span class="who"><span class="av" aria-hidden="true"><Avatar person={c.who} villager={villagerOf(c.who)} size={22} /></span><span class="sv">{names[c.who]} · <span data-custom-serving>{servingText(c)}</span></span></span>
            <span class="kc"><b class="money" data-custom-kcal>{kcal(c.k)}</b></span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .rcps { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .lh { margin: 4px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .lh.my { margin-top: 12px; }
  .new { margin: 0; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .new svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }
  .empty p { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .rc { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding: 10px 12px 12px; }
  /* the card's face: name and kcal, who and the whole's kcal, then a serving's four nutrients */
  .open {
    appearance: none; border: 0; background: none; cursor: pointer; width: 100%; text-align: left; font: inherit; color: var(--text);
    display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'nm kc' 'who all' 'cells cells';
    align-items: center; column-gap: 10px; row-gap: 6px; padding: 2px; border-radius: var(--r-chip);
  }
  .open.my { grid-template-areas: 'nm kc' 'who kc'; }
  .open:active { background: color-mix(in srgb, var(--lip) 30%, transparent); }
  .open:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .nm { grid-area: nm; font-weight: 700; font-size: var(--fs-talk); overflow-wrap: anywhere; }
  .who { grid-area: who; display: flex; align-items: center; gap: 6px; min-width: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; }
  .who .av { display: flex; flex: none; }
  .sv { overflow: hidden; text-overflow: ellipsis; }
  .kc { grid-area: kc; display: flex; align-items: baseline; gap: 4px; justify-self: end; font-size: var(--fs-talk); white-space: nowrap; }
  .kc small { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
  .all { grid-area: all; justify-self: end; font-size: var(--fs-s); color: var(--text-soft); white-space: nowrap; }
  .cells { grid-area: cells; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .cell { display: grid; gap: 3px; min-width: 0; padding: 6px 6px 5px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  .cell small { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cell b { font-size: var(--fs-body); }
  .log { margin: 0; justify-self: end; min-width: 7em; }
</style>
