<script lang="ts">
  // ごはん's amount (a level over the search or the day): the food and its values per 100 g; its portions as chips
  // (the first the default; 100 g last), −/＋ by a whole portion for the things you count (本, 個, 杯 …) and by half
  // one for the rest (茶碗, 人前; ±10 g once grams are typed: stepOf), the grams field (ml for a drink; typed grams leave
  // the portions); what that amount holds, live; which meal; then ついか (a new entry) or ほぞん / けす (my entry). For a
  // recipe's ingredient (`pick`, マイレシピ): no meal, and ついか (into the recipe) or ほぞん / けす (an ingredient of it).
  // The item may be swapped while it is open (an entry opened from its snapshot, the catalog's portions arriving):
  // untouched, the amount starts again from the same grams; touched, the portion picked stays picked (by its label).
  // A serving with no known weight (`serving`: a custom food's, マイ食品): its values per serving, its one portion stepped
  // by whole servings, no grams field (its nominal 100 g never shown). A recipe's or custom food's: `open`, a button
  // left of ついか to open it (mine to edit, anyone else's to copy).
  import { untrack } from 'svelte';
  import type { Meal } from '#lib/contract/food.ts';
  import { FOOD_GRAMS, MEALS } from '#lib/contract/food.ts';
  import { nutrientsFor, portionsOf, type Item } from '#lib/food/index.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { gramsText, halfWidth, hasWeight, portionLabel, startOf, stepOf, unitOf } from './foodUi.ts';

  interface Props {
    item: Item;
    meal: Meal;
    /** The grams and portion label to start from (an entry's, a recent one's); else the default portion. */
    g0?: number;
    u0?: string;
    /** An entry of mine: ほぞん and けす instead of ついか. */
    editing?: boolean;
    /** A recipe's ingredient, not a meal: no meal to pick, the recipe's words. */
    pick?: boolean;
    /** A serving with no known weight (FoodSnap `sv`): whole servings, no grams. */
    serving?: boolean;
    ondone: (v: { m: Meal; g: number; u: string | null }) => void;
    onremove?: () => void;
    /** What the food came from, to open (a recipe, a custom food). */
    open?: { label: string; run: () => void } | null;
  }
  let { item, meal, g0, u0, editing = false, pick = false, serving = false, ondone, onremove, open = null }: Props = $props();

  const ps = $derived(serving ? (item.portions?.length ? item.portions : [{ label: t('food.my.one'), g: 100 }]) : portionsOf(item));
  /** g or ml: a drink's portions are in ml (100 ml counts as 100 g). */
  const unit = $derived(ps.some((p) => unitOf(p.label) === 'ml') ? 'ml' : 'g');
  // (the level is keyed: a new food or entry mounts a new picker, so the start is read once)
  const s0 = untrack(() => ({ ...startOf(ps, g0, u0), typed: g0 === undefined ? '' : gramsText(g0), meal, ps }));
  /** The portion picked, by its label (an index would point elsewhere once the catalog's portions are in). */
  let pl = $state(s0.ps[s0.pi].label);
  let mult = $state(s0.mult);
  let custom = $state(s0.custom);
  let typed = $state(s0.custom ? s0.typed : '');
  let m = $state<Meal>(s0.meal);
  /** Anything changed by hand (then a swapped item keeps the pick). */
  let touched = false;
  let seen = s0.ps;
  $effect.pre(() => {
    const now = ps;
    if (now === seen) return;
    seen = now;
    if (touched) return;
    const s = startOf(now, g0, u0);
    pl = now[s.pi].label;
    mult = s.mult;
    custom = s.custom;
    typed = s.custom ? s0.typed : '';
  });
  const pi = $derived(Math.max(0, ps.findIndex((p) => p.label === pl)));

  const typedG = $derived(Number(halfWidth(typed).replace(',', '.')));
  const g = $derived(custom ? (Number.isFinite(typedG) ? Math.round(typedG * 10) / 10 : 0) : Math.round(ps[pi].g * mult * 10) / 10);
  const ok = $derived(g >= FOOD_GRAMS.min && g <= FOOD_GRAMS.max);
  const n = $derived(nutrientsFor(item, ok ? g : 0));
  const per = (v: number | null | undefined) => (v === null || v === undefined ? '–' : v.toFixed(1));

  function portion(i: number) {
    touched = true;
    pl = ps[i].label;
    mult = 1;
    custom = false;
  }
  function step(d: -1 | 1) {
    touched = true;
    if (custom) {
      typed = gramsText(Math.max(0, Math.min(FOOD_GRAMS.max, Math.round(g + d * 10))));
      return;
    }
    const s = serving ? 1 : stepOf(ps[pi].label);
    mult = Math.max(s, Math.min(20, Math.round((mult + d * s) / s) * s));
  }
  function onGrams() {
    touched = true;
    custom = true;
  }
  function done() {
    if (ok) ondone({ m, g, u: custom ? null : portionLabel(ps[pi], mult) });
  }
</script>

<form class="amt" onsubmit={(e) => { e.preventDefault(); done(); }}>
  <section class="card head">
    <h3>{item.name}</h3>
    <p class="per money">{serving ? t('food.my.per', { u: ps[0].label, k: formatNum(item.kcal) }) : t('food.per100', { k: formatNum(item.kcal) })} · P {per(item.p)} · F {per(item.f)} · C {per(item.c)} · {t('food.s')} {per(item.salt)}</p>
  </section>

  <section class="card">
    <h4>{t('food.amount')}</h4>
    <div class="chips" role="group" aria-label={t('food.amount')}>
      {#each ps as p, i (p.label)}
        <button type="button" class="chip big" aria-pressed={!custom && pi === i} data-sfx={!custom && pi === i ? 'none' : 'tick'} data-portion={p.label} onclick={() => portion(i)}>
          {p.label}{#if !serving && !hasWeight(p.label)}<small>{gramsText(p.g)}{unit}</small>{/if}
        </button>
      {/each}
    </div>
    <div class="qty">
      <button type="button" class="nb" data-sfx="tick" aria-label={t('food.less')} data-step="-1" onclick={() => step(-1)}>−</button>
      <b class="mult money" aria-live="polite">{custom ? `${gramsText(g)}${unit}` : `×${mult}`}</b>
      <button type="button" class="nb" data-sfx="tick" aria-label={t('food.more')} data-step="1" onclick={() => step(1)}>＋</button>
      {#if !serving}<label class="grams">
        <span class="sr-only">{t(unit === 'ml' ? 'food.ml' : 'food.grams')}</span>
        <input type="text" inputmode="decimal" data-sfx="none" data-grams autocomplete="off" enterkeyhint="done" maxlength="6" size="5"
          value={custom ? typed : gramsText(g)} aria-invalid={!ok} oninput={(e) => { typed = e.currentTarget.value; onGrams(); }} />
        <span class="u" aria-hidden="true">{unit}</span>
      </label>{/if}
    </div>
    <dl class="live" data-food-live>
      <div class="k"><dt class="sr-only">kcal</dt><dd class="money">{formatNum(n.kcal)}<small>kcal</small></dd></div>
      <div><dt>{t('food.p')}</dt><dd class="money">{n.p.toFixed(1)}<span class="sr-only"> g</span></dd></div>
      <div><dt>{t('food.fa')}</dt><dd class="money">{n.fa.toFixed(1)}<span class="sr-only"> g</span></dd></div>
      <div><dt>{t('food.c')}</dt><dd class="money">{n.c.toFixed(1)}<span class="sr-only"> g</span></dd></div>
      <div><dt>{t('food.s')}</dt><dd class="money">{n.s.toFixed(1)}<span class="sr-only"> g</span></dd></div>
    </dl>
  </section>

  {#if !pick}
    <div class="seg" role="group" aria-label={t('food.whichMeal')}>
      {#each MEALS as id (id)}
        <button type="button" class="sb" aria-pressed={m === id} data-pick-meal={id} data-sfx={m === id ? 'none' : 'tick'} onclick={() => (m = id)}>{t(`food.meal.${id}`)}</button>
      {/each}
    </div>
  {/if}

  <div class="acts level-acts">
    {#if open}<button type="button" class="btn paper small open" data-sfx="page" data-amount-open onclick={open.run}>{open.label}</button>{/if}
    {#if editing}<button type="button" class="btn paper small" data-sfx="undo" data-remove onclick={() => onremove?.()}>{t(pick ? 'food.rcp.itemRemove' : 'food.remove')}</button>{/if}
    <button type="submit" class="btn small" data-sfx="confirm" data-done aria-disabled={!ok}>
      {pick ? t(editing ? 'food.rcp.save' : 'food.rcp.itemAdd') : editing ? t('food.save') : t('food.addOk')}
    </button>
  </div>
</form>

<style>
  .amt { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  .card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 12px 14px; }
  .head { gap: 4px; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; overflow-wrap: anywhere; }
  h4 { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .per { margin: 0; font-size: var(--fs-s); color: var(--text-soft); line-height: 1.4; }
  /* the portions: theme.css .chip.big */
  .sb, .nb {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .chip small { margin-left: 4px; font-size: var(--fs-xs); color: var(--text-soft); }
  .chip[aria-pressed='true'] small { color: inherit; opacity: .7; }
  .sb[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .sb:active, .nb:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .qty { display: flex; align-items: center; gap: 8px; }
  .nb { width: var(--hit); flex: none; font-size: var(--fs-talk); }
  .mult { min-width: 3.4em; text-align: center; font-size: var(--fs-talk); }
  .grams { margin-left: auto; display: flex; align-items: baseline; gap: 6px; }
  .grams input {
    width: 5.5em; min-height: var(--hit); padding: 6px 10px; border: 0; border-radius: var(--r-btn); text-align: right;
    font: 700 var(--fs-input)/1.1 var(--font-num); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  .grams input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .grams input[aria-invalid='true'] { box-shadow: inset 0 0 0 2px var(--c-coral); }
  .u { font: 700 var(--fs-body)/1 var(--font-num); color: var(--text-soft); }
  /* the kcal large on its own line, the four nutrients under it (FoodSummary's cells) */
  .live { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; gap: 6px; margin: 0; }
  .live .k { grid-column: 1 / -1; }
  .live div:not(.k) { padding: 8px 6px 6px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 22%, transparent); }
  .live div { min-width: 0; }
  .live dt { font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .live dd { margin: 3px 0 0; font-size: var(--fs-body); }
  .live .k dd { font-size: var(--fs-title); }
  .live .k small { margin-left: 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .seg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .sb { padding: 0 2px; font-size: var(--fs-s); white-space: nowrap; }
</style>
