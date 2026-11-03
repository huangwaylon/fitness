<script lang="ts">
  // ごはん (the meal log, docs/design.md "Gohan"): the HUD bowl's popup. Whose day (this phone's person first; the
  // partner, and the guest once it has logged or on its own phone: everyone sees everyone's meals), ‹ the day ›
  // and きょう, the summary card, then the four meals. On my own day ＋ per meal → the search → the amount → 追加;
  // an entry → its amount → 保存 / 削除; ✎ → the kcal goal. Those push a level (FoodSheet's title bar: its ‹).
  // Anyone else's day is read-only. データの出典 at the foot.
  import '#lib/i18n/food.ts'; // the meal log's strings, loaded with it
  import type { LocalDate, Who } from '#lib/types.ts';
  import { KCAL_GOAL, MEALS, type FoodEntry, type Meal } from '#lib/contract/food.ts';
  import { foodDay, foodEntries, kcalGoal, proteinGoal } from '#lib/model/food.ts';
  import { editFood, logFood, removeFood, setKcalGoal } from '#lib/store/actions.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { toSnap, type FoodDb, type Item } from '#lib/food/index.ts';
  import Avatar from '../characters/Avatar.svelte';
  import ValueInput from '../health/ValueInput.svelte';
  import { dayTitle } from '../kiroku/fmt.ts';
  import FoodSummary from './FoodSummary.svelte';
  import FoodMeal from './FoodMeal.svelte';
  import FoodSearch from './FoodSearch.svelte';
  import FoodAmount from './FoodAmount.svelte';
  import FoodCredits from './FoodCredits.svelte';
  import { foodDb, itemOf, parseKcalGoal, recentOf } from './foodUi.ts';

  let { title = $bindable(''), back = $bindable(null) }: { title?: string; back?: (() => void) | null } = $props();

  const m = $derived(week.model);
  const view = $derived(week.view);
  /** This phone's person: a member, or the guest. */
  const me = $derived<Who>(view?.viewer ?? 'A');
  const order = $derived.by<Who[]>(() => {
    if (!view || !m) return [me];
    const all: Who[] = [view.me, view.partner];
    if (me === 'G' || foodEntries(m.state, 'G').length) all.push('G');
    return [me, ...all.filter((w) => w !== me)];
  });
  const names = $derived<Record<Who, string>>({
    A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B', G: view?.guest.villagerName ?? 'G'
  });
  const villagerOf = (w: Who) => (w === 'G' ? (view?.guest.villager ?? null) : (view?.people[w].villager ?? null));

  let picked = $state<Who | null>(null);
  const who = $derived<Who>(picked ?? me);
  const mine = $derived(who === me);
  /** The day shown (null: today, following the clock). */
  let picked_d = $state<LocalDate | null>(null);
  const today = $derived(view?.today ?? '');
  const date = $derived(picked_d ?? today);

  const day = $derived(m && date ? foodDay(m.state, who, date) : null);
  const goal = $derived(m ? kcalGoal(m.state, who) : null);
  const protein = $derived(m ? proteinGoal(m.state, who, m.now) : null);
  const byMeal = (k: Meal) => day?.entries.filter((e) => e.m === k) ?? [];
  const recent = $derived(m ? recentOf(foodEntries(m.state, me)) : []);

  type Level =
    | { k: 'search'; meal: Meal }
    | { k: 'amount'; meal: Meal; item: Item; g0?: number; u0?: string; entry?: FoodEntry }
    | { k: 'goal' };
  let stack = $state<Level[]>([]);
  const top = $derived(stack.at(-1) ?? null);
  let scroller: Element | null = null;
  let root: HTMLElement | undefined = $state();
  $effect(() => {
    title = !top ? '' : top.k === 'goal' ? t('goal.title') : t(`food.meal.${top.meal}`);
    back = top ? up : null;
  });
  function go(l: Level) {
    stack = [...stack, l];
    scroller ??= root?.closest('[data-food-sheet]') ?? null;
    scroller?.scrollTo({ top: 0 });
  }
  function up() {
    cue('back');
    stack = stack.slice(0, -1);
  }
  const home = () => (stack = []);

  function setWho(w: Who) {
    if (w === who || !order.includes(w)) return;
    cue('tick');
    picked = w;
  }
  function shift(dir: -1 | 1) {
    if (dir > 0 && date >= today) return;
    const next = addDays(date, dir);
    picked_d = next >= today ? null : next;
  }

  function add(item: Item, meal: Meal, g0?: number, u0?: string) {
    go({ k: 'amount', meal, item, g0, u0 });
  }
  /** An entry of mine → its amount, with the catalog's portions for it (once the catalog is in). */
  function edit(e: FoodEntry) {
    const open = (db: FoodDb | null) => go({ k: 'amount', meal: e.m, item: itemOf(e.f, db), g0: e.g, u0: e.f.u, entry: e });
    foodDb().then(open, () => open(null));
  }
  function done(l: Extract<Level, { k: 'amount' }>, v: { m: Meal; g: number; u: string | null }) {
    if (l.entry) {
      if (editFood(l.entry.id, { m: v.m, g: v.g, u: v.u }).ok) toasts.show(t('food.saved'), 2000, { reaction: 'pleased' });
    } else if (logFood({ d: date, m: v.m, g: v.g, f: toSnap(l.item, v.u ?? undefined) }).ok) {
      toasts.show(t('food.added', { meal: t(`food.meal.${v.m}`), name: l.item.name }), 2500, { reaction: 'pleased' });
    }
    home();
  }
  function remove(e: FoodEntry) {
    if (removeFood(e.id).ok) toasts.show(t('food.removed', { name: e.f.n }), 2500);
    home();
  }
  function saveGoal(v: number | null) {
    if (setKcalGoal(me, v).ok) toasts.show(t(v === null ? 'food.goalCleared' : 'food.goalSaved'), 2500, { reaction: 'pleased' });
    home();
  }
</script>

<div class="food" bind:this={root}>
  {#if m && view && day}
    {#if top?.k === 'search'}
      {@const meal = top.meal}
      <FoodSearch {recent} onpick={(item, g, u) => add(item, meal, g, u)} />
    {:else if top?.k === 'amount'}
      {@const l = top}
      {#key l}
        <FoodAmount item={l.item} meal={l.meal} g0={l.g0} u0={l.u0} editing={!!l.entry} ondone={(v) => done(l, v)} onremove={() => l.entry && remove(l.entry)} />
      {/key}
    {:else if top?.k === 'goal'}
      <ValueInput label={t('food.goal')} sub="" old={goal} unit="kcal" parse={parseKcalGoal}
        hint={t('food.goalRange', { min: KCAL_GOAL.min, max: KCAL_GOAL.max, step: KCAL_GOAL.step })}
        onok={saveGoal} oncancel={up} extra={goal === null ? null : { label: t('food.goalClear'), run: () => saveGoal(null) }} />
    {:else}
      <label class="dd who" data-who={who}>
        <span class="sr-only">{t('food.who')}</span>
        <span class="av" aria-hidden="true"><Avatar person={who} villager={villagerOf(who)} size={28} /></span>
        <select data-pick="who" value={who} data-sfx="none" onchange={(e) => setWho(e.currentTarget.value as Who)}>
          {#each order as p (p)}<option value={p}>{names[p]}</option>{/each}
        </select>
        <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 L8 10.5 L12.5 6" /></svg>
      </label>

      <div class="nav">
        <button type="button" class="nb" data-nav="back" aria-label={t('food.earlier')} data-sfx="tick" onclick={() => shift(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" /></svg>
        </button>
        <b class="rl money" aria-live="polite" data-food-date={date}>{dayTitle(date)}</b>
        <button type="button" class="nb" data-nav="on" aria-label={t('food.later')} aria-disabled={date >= today} data-sfx="tick" onclick={() => shift(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" /></svg>
        </button>
        <button type="button" class="nb today" data-nav="today" aria-disabled={picked_d === null} data-sfx="tick" onclick={() => (picked_d = null)}>{t('food.today')}</button>
      </div>

      <FoodSummary {day} {who} {goal} {protein} onedit={mine ? () => go({ k: 'goal' }) : null} />
      {#each MEALS as k (k)}
        <FoodMeal meal={k} entries={byMeal(k)} {mine} onadd={() => go({ k: 'search', meal: k })}
          onpick={edit} />
      {/each}
      <FoodCredits />
    {/if}
  {/if}
</div>

<style>
  .food { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  /* whose day: けんこう's dropdown pill (Health.svelte) */
  .dd {
    position: relative; display: flex; align-items: center; min-width: 0; min-height: var(--hit);
    border-radius: var(--r-pill); background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl);
  }
  .dd:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .dd:has(select:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
  .dd select {
    appearance: none; -webkit-appearance: none; border: 0; margin: 0; background: transparent; color: inherit; cursor: pointer;
    width: 100%; min-width: 0; height: var(--hit); padding: 0 34px 0 46px; border-radius: inherit;
    font: 700 var(--fs-input)/1 var(--font-ui); text-overflow: ellipsis; white-space: nowrap; outline: none;
  }
  .dd .av { position: absolute; left: 10px; top: 50%; translate: 0 -50%; display: flex; pointer-events: none; }
  .dd .chev { position: absolute; right: 12px; top: 50%; translate: 0 -50%; width: 16px; height: 16px; pointer-events: none;
    fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  /* ‹ the day › きょう: けんこう's range row, sticky over the cards */
  .nav {
    position: sticky; top: -6px; z-index: 2; display: flex; align-items: center; gap: 8px; min-width: 0;
    margin: 0 -8px; padding: 6px 8px calc(var(--lip-h) + 6px); background: var(--surface);
  }
  .nav::after { content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 12px; pointer-events: none; background: linear-gradient(var(--surface), transparent); }
  .nb {
    appearance: none; border: 0; cursor: pointer; flex: none; min-width: var(--hit); height: var(--hit); padding: 0 10px; border-radius: var(--r-pill);
    display: inline-flex; align-items: center; justify-content: center;
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .nb svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }
  .nb:active:not([aria-disabled='true']) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .nb[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; transform: translateY(4px); cursor: default; }
  .rl { flex: 1; min-width: 0; text-align: center; font-size: var(--fs-talk); white-space: nowrap; }
</style>
