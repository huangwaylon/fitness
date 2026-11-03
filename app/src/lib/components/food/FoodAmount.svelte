<script lang="ts">
  // ごはん's amount (a level over the search or the day): the food and its values per 100 g; its portions as chips
  // (the first the default; 100 g last), −/＋ by half a portion, the grams field (typed grams leave the portions);
  // what that amount holds, live; which meal; then 追加 (a new entry) or 保存 / 削除 (my entry).
  import { untrack } from 'svelte';
  import type { Meal } from '#lib/contract/food.ts';
  import { FOOD_GRAMS, MEALS } from '#lib/contract/food.ts';
  import { nutrientsFor, portionsOf, type Item } from '#lib/food/index.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { gramsText, matchPortion, portionLabel } from './foodUi.ts';

  interface Props {
    item: Item;
    meal: Meal;
    /** The grams and portion label to start from (an entry's, a recent one's); else the default portion. */
    g0?: number;
    u0?: string;
    /** An entry of mine: 保存 and 削除 instead of 追加. */
    editing?: boolean;
    ondone: (v: { m: Meal; g: number; u: string | null }) => void;
    onremove?: () => void;
  }
  let { item, meal, g0, u0, editing = false, ondone, onremove }: Props = $props();

  const ps = $derived(portionsOf(item));
  /** The start: the portion named by the label (「茶碗1杯×2」), else one that makes the grams, else typed grams. */
  function start(): { pi: number; mult: number; custom: boolean } {
    if (g0 === undefined) return { pi: 0, mult: 1, custom: false };
    const [label, x] = (u0 ?? '').split('×');
    const pi = ps.findIndex((p) => p.label === label);
    if (pi >= 0 && Math.abs(ps[pi].g * (Number(x) || 1) - g0) < 0.05) return { pi, mult: Number(x) || 1, custom: false };
    const m = matchPortion(ps, g0);
    return m ? { ...m, custom: false } : { pi: 0, mult: 1, custom: true };
  }
  // (the level is keyed: a new food or entry mounts a new picker, so the start is read once)
  const s0 = untrack(() => ({ ...start(), typed: g0 === undefined ? '' : gramsText(g0), meal }));
  let pi = $state(s0.pi);
  let mult = $state(s0.mult);
  let custom = $state(s0.custom);
  let typed = $state(s0.custom ? s0.typed : '');
  let m = $state<Meal>(s0.meal);

  const typedG = $derived(Number(typed.replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(',', '.')));
  const g = $derived(custom ? (Number.isFinite(typedG) ? Math.round(typedG * 10) / 10 : 0) : Math.round(ps[pi].g * mult * 10) / 10);
  const ok = $derived(g >= FOOD_GRAMS.min && g <= FOOD_GRAMS.max);
  const n = $derived(nutrientsFor(item, ok ? g : 0));
  const per = (v: number | null | undefined) => (v === null || v === undefined ? '–' : v.toFixed(1));

  function portion(i: number) {
    pi = i;
    mult = 1;
    custom = false;
  }
  function step(d: -1 | 1) {
    if (custom) {
      typed = gramsText(Math.max(0, Math.min(FOOD_GRAMS.max, Math.round(g + d * 10))));
      return;
    }
    mult = Math.max(0.5, Math.min(20, mult + d * 0.5));
  }
  function onGrams() {
    custom = true;
  }
  function done() {
    if (ok) ondone({ m, g, u: custom ? null : portionLabel(ps[pi], mult) });
  }
</script>

<form class="amt" onsubmit={(e) => { e.preventDefault(); done(); }}>
  <section class="card head">
    <h3>{item.name}</h3>
    <p class="per money">{t('food.per100', { k: formatNum(item.kcal) })} · P {per(item.p)} · F {per(item.f)} · C {per(item.c)} · {t('food.s')} {per(item.salt)}</p>
  </section>

  <section class="card">
    <h4>{t('food.amount')}</h4>
    <div class="chips" role="group" aria-label={t('food.amount')}>
      {#each ps as p, i (p.label)}
        <button type="button" class="chip" aria-pressed={!custom && pi === i} data-sfx={!custom && pi === i ? 'none' : 'tick'} data-portion={p.label} onclick={() => portion(i)}>
          {p.label}{#if !/^100(g|ml)$/.test(p.label)}<small>{gramsText(p.g)}g</small>{/if}
        </button>
      {/each}
    </div>
    <div class="qty">
      <button type="button" class="nb" data-sfx="tick" aria-label={t('food.less')} data-step="-1" onclick={() => step(-1)}>−</button>
      <b class="mult money" aria-live="polite">{custom ? `${gramsText(g)}g` : `×${mult}`}</b>
      <button type="button" class="nb" data-sfx="tick" aria-label={t('food.more')} data-step="1" onclick={() => step(1)}>＋</button>
      <label class="grams">
        <span class="sr-only">{t('food.grams')}</span>
        <input type="text" inputmode="decimal" data-sfx="none" data-grams autocomplete="off" enterkeyhint="done" maxlength="6" size="5"
          value={custom ? typed : gramsText(g)} aria-invalid={!ok} oninput={(e) => { typed = e.currentTarget.value; onGrams(); }} />
        <span class="u" aria-hidden="true">g</span>
      </label>
    </div>
    <dl class="live" data-food-live>
      <div class="k"><dt class="sr-only">kcal</dt><dd class="money">{formatNum(n.kcal)}<small>kcal</small></dd></div>
      <div><dt>{t('food.p')}</dt><dd class="money">{n.p.toFixed(1)}</dd></div>
      <div><dt>{t('food.fa')}</dt><dd class="money">{n.fa.toFixed(1)}</dd></div>
      <div><dt>{t('food.c')}</dt><dd class="money">{n.c.toFixed(1)}</dd></div>
      <div><dt>{t('food.s')}</dt><dd class="money">{n.s.toFixed(1)}</dd></div>
    </dl>
  </section>

  <div class="seg" role="group" aria-label={t('food.whichMeal')}>
    {#each MEALS as id (id)}
      <button type="button" class="sb" aria-pressed={m === id} data-pick-meal={id} data-sfx={m === id ? 'none' : 'tick'} onclick={() => (m = id)}>{t(`food.meal.${id}`)}</button>
    {/each}
  </div>

  <div class="acts">
    {#if editing}<button type="button" class="btn paper small" data-sfx="undo" data-remove onclick={() => onremove?.()}>{t('food.remove')}</button>{/if}
    <button type="submit" class="btn small" data-sfx="confirm" data-done aria-disabled={!ok}>{editing ? t('food.save') : t('food.addOk')}</button>
  </div>
</form>

<style>
  .amt { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  .card { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 12px 14px; }
  .head { gap: 4px; }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; overflow-wrap: anywhere; }
  h4 { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .per { margin: 0; font-size: var(--fs-s); color: var(--text-soft); line-height: 1.4; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip, .sb, .nb {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .chip { padding: 0 14px; }
  .chip small { margin-left: 4px; font-size: var(--fs-xs); color: var(--text-soft); }
  .chip[aria-pressed='true'] small { color: inherit; opacity: .7; }
  .chip[aria-pressed='true'], .sb[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .chip:active, .sb:active, .nb:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
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
  .acts { display: flex; justify-content: flex-end; gap: 10px; }
  .acts .btn { margin: 0; min-width: 7em; }
</style>
