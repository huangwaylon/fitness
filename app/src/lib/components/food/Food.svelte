<script lang="ts">
  // ごはん (the meal log, docs/design.md "Gohan"): the HUD bowl's popup. Whose day (this phone's person first; the
  // partner, and the guest once it has logged or on its own phone: everyone sees everyone's meals), ‹ the day ›
  // and きょう, the summary card, then the four meals. On my own day ＋ per meal → the search → the amount → 追加;
  // an entry → its amount → 保存 / 削除 (a repeat's: that day leaves the repeat first, detachDay); ✎ → the kcal goal;
  // a meal's 🔁 → いつもの (its repeat, or a new one from the day's entries). Those push a level (FoodSheet's title
  // bar: its ‹). Anyone else's day is read-only. データの出典 at the foot. On top, under the title bar, the tabs (TABS,
  // けんこう's group switch): きろく (whose day, then the day, on each opening), グラフ (FoodChart: the kcal over a
  // period, whose and けんこう's period dropdown, its range row and its Move card; switching whose keeps the tab, the
  // period and the range) and レシピ (マイレシピ, FoodRecipes: everyone's recipes, no whose; a recipe → its level,
  // FoodRecipe: mine to edit, anyone else's to copy; ごはんに ついか → its amount → an entry on the day shown).
  import '#lib/i18n/food.ts'; // the meal log's strings, loaded with it
  import '#lib/i18n/kenkou.ts'; // けんこう's: the period dropdown
  import type { LocalDate, Who } from '#lib/types.ts';
  import { KCAL_GOAL, MEALS, type FoodEntry, type Meal } from '#lib/contract/food.ts';
  import { foodDay, foodEntries, kcalGoal, proteinGoal, recipes, repeatOn, repeats, type Recipe } from '#lib/model/food.ts';
  import {
    detachDay, editFood, logFood, logRecipe, removeFood, removeRecipe, saveRecipe, setKcalGoal, startRepeat, stopRepeat, updateRepeat
  } from '#lib/store/actions.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { t } from '#lib/i18n/index.ts';
  import { PERIODS, type Period } from '#lib/model/health.ts';
  import { FOOD_TAB_ART } from '#lib/art.ts';
  import Segmented from '../ui/Segmented.svelte';
  import RangeNav from '../health/RangeNav.svelte';
  import Pick from '../health/Pick.svelte';
  import FoodChart from './FoodChart.svelte';
  import { cue } from '#lib/sound/cues.ts';
  import { toSnap, type FoodDb, type Item } from '#lib/food/index.ts';
  import ValueInput from '../health/ValueInput.svelte';
  import { dayTitle } from '../kiroku/fmt.ts';
  import FoodSummary from './FoodSummary.svelte';
  import FoodMeal from './FoodMeal.svelte';
  import FoodSearch from './FoodSearch.svelte';
  import FoodAmount from './FoodAmount.svelte';
  import FoodCredits from './FoodCredits.svelte';
  import FoodRepeat from './FoodRepeat.svelte';
  import FoodRecipes from './FoodRecipes.svelte';
  import FoodRecipe from './FoodRecipe.svelte';
  import { DAYS, foodDb, itemOf, mealAt, parseKcalGoal, recentOf, recipeItem, type RecipeDraft } from './foodUi.ts';

  let { title = $bindable(''), back = $bindable(null) }: { title?: string; back?: (() => void) | null } = $props();

  const m = $derived(week.model);
  const view = $derived(week.view);
  /** This phone's person: a member, or the guest. */
  const me = $derived<Who>(view?.viewer ?? 'A');
  const order = $derived.by<Who[]>(() => {
    if (!view || !m) return [me];
    const all: Who[] = [view.me, view.partner];
    if (me === 'G' || foodEntries(m.state, 'G').length || repeats(m.state, 'G').length) all.push('G');
    return [me, ...all.filter((w) => w !== me)];
  });
  const names = $derived<Record<Who, string>>({
    A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B', G: view?.guest.villagerName ?? 'G'
  });
  const villagerOf = (w: Who) => (w === 'G' ? (view?.guest.villager ?? null) : (view?.people[w].villager ?? null));

  /** ごはん's tabs, in order (a new one: its id here, its string, its art and its branch below). */
  const TABS = ['log', 'chart', 'recipe'] as const;
  type Tab = (typeof TABS)[number];
  let tab = $state<Tab>('log');
  /** グラフ's period (1週 on each opening, as けんこう's). */
  let period = $state<Period>('week');
  function setPeriod(p: Period) {
    if (p === period || !PERIODS.includes(p)) return;
    cue('tick');
    period = p;
  }

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
  /** My repeat of a meal still going (the one to manage; an ended one only fills its days). */
  const liveRepeat = (k: Meal) => (m ? (repeats(m.state, me).find((r) => r.m === k && (!r.to || r.to > today)) ?? null) : null);

  type Level =
    | { k: 'search'; meal: Meal }
    | { k: 'amount'; meal: Meal; item: Item; g0?: number; u0?: string; entry?: FoodEntry }
    | { k: 'goal' }
    | { k: 'repeat'; meal: Meal }
    | { k: 'recipe'; id: string | null }
    | { k: 'rsearch' }
    | { k: 'ritem'; item: Item; g0?: number; u0?: string; i?: number }
    | { k: 'rlog'; r: Recipe; meal?: Meal };
  let stack = $state<Level[]>([]);
  const top = $derived(stack.at(-1) ?? null);
  let scroller: Element | null = null;
  let root: HTMLElement | undefined = $state();
  $effect(() => {
    title = !top ? '' : top.k === 'goal' ? t('goal.title') : top.k === 'repeat' ? t('food.rep.title', { meal: t(`food.meal.${top.meal}`) })
      : top.k === 'recipe' ? t(top.id ? 'food.rcp.title' : 'food.rcp.new') : top.k === 'rsearch' ? t('food.rcp.addItem')
      : top.k === 'ritem' ? t('food.rcp.item') : top.k === 'rlog' ? t('food.rcp.log') : t(`food.meal.${top.meal}`);
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
  /** An entry of mine → its amount, with the catalog's portions for it (once the catalog is in). A repeat's: the day
   *  leaves the repeat first (its items become the day's own, in one go), then the amount opens on the real one. */
  function edit(v: FoodEntry) {
    const e = v.rep ? real(v) : v;
    if (!e) return;
    const open = (db: FoodDb | null) => go({ k: 'amount', meal: e.m, item: itemOf(e.f, db), g0: e.g, u0: e.f.u, entry: e });
    foodDb().then(open, () => open(null));
  }
  function real(v: FoodEntry & { rep?: string }): FoodEntry | null {
    const id = v.rep && detachDay(v.rep, date)?.[v.id];
    return (id && m && foodEntries(m.state, me).find((e) => e.id === id)) || null;
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
  const mealName = (k: Meal) => t(`food.meal.${k}`);
  function repStart(meal: Meal, w: number) {
    if (startRepeat({ meal, date, w }).ok) toasts.show(t('food.rep.started', { meal: mealName(meal) }), 2500, { reaction: 'pleased' });
    home();
  }
  function repDays(id: string, w: number) {
    if (updateRepeat(id, { w }).ok) toasts.show(t('food.rep.daysSaved'), 2500, { reaction: 'pleased' });
    home();
  }
  function repFromDay(id: string) {
    if (updateRepeat(id, { itemsFromDate: date }).ok) toasts.show(t('food.rep.fromDaySaved'), 2500, { reaction: 'pleased' });
    home();
  }
  function repStop(id: string, meal: Meal) {
    if (stopRepeat(id).ok) toasts.show(t('food.rep.stopped', { meal: mealName(meal) }), 2500);
    home();
  }
  function saveGoal(v: number | null) {
    if (setKcalGoal(me, v).ok) toasts.show(t(v === null ? 'food.goalCleared' : 'food.goalSaved'), 2500, { reaction: 'pleased' });
    home();
  }

  // ---- マイレシピ: the recipe level edits a draft of mine (kept here, under the search and the amount it opens)
  const allRecipes = $derived(m ? recipes(m.state) : []);
  let draft = $state<RecipeDraft>({ n: '', sv: 2, it: [] });
  /** The draft as last saved (null: a new one): ほぞん waits while nothing changed. */
  let savedAs = $state<string | null>(null);
  const clean = $derived(savedAs !== null && savedAs === JSON.stringify(draft));
  const ownerOf = (r: Recipe) => ({ who: r.who, name: names[r.who], villager: villagerOf(r.who) });
  const toRecipeLevel = () => (stack = stack.slice(0, stack.findIndex((l) => l.k === 'recipe') + 1));

  function openRecipe(r: Recipe | null) {
    draft = r ? { n: r.n, sv: r.sv, it: r.it.map((x) => ({ ...x })) } : { n: '', sv: 2, it: [] };
    savedAs = r ? JSON.stringify(draft) : null;
    go({ k: 'recipe', id: r?.id ?? null });
  }
  function itemDone(l: Extract<Level, { k: 'ritem' }>, v: { g: number; u: string | null }) {
    const x = { g: v.g, f: toSnap(l.item, v.u ?? undefined) };
    if (l.i === undefined) draft.it.push(x);
    else draft.it[l.i] = x;
    toRecipeLevel();
  }
  function itemRemove(i: number) {
    draft.it.splice(i, 1);
    toRecipeLevel();
  }
  function editItem(i: number) {
    const x = draft.it[i];
    const open = (db: FoodDb | null) => go({ k: 'ritem', item: itemOf(x.f, db), g0: x.g, u0: x.f.u, i });
    foodDb().then(open, () => open(null));
  }
  function recipeSave(id: string | null) {
    if (saveRecipe({ id: id ?? undefined, n: draft.n, sv: draft.sv, it: draft.it }).ok) toasts.show(t('food.rcp.saved', { name: draft.n.trim() }), 2000, { reaction: 'pleased' });
    home();
  }
  function recipeRemove(id: string) {
    if (removeRecipe(id).ok) toasts.show(t('food.rcp.removed', { name: draft.n }), 2000);
    home();
  }
  /** Someone else's → a recipe of mine with its name, servings and ingredients, opened in the editor. */
  function recipeCopy() {
    const res = saveRecipe({ n: draft.n, sv: draft.sv, it: draft.it });
    if (!res.ok || !res.id) return;
    savedAs = JSON.stringify(draft);
    stack = [...stack.slice(0, -1), { k: 'recipe', id: res.id }];
    toasts.show(t('food.rcp.copied'), 2000, { reaction: 'pleased' });
  }
  /** A recipe logged as a meal of mine on the day shown; from the レシピ tab, きろく then shows it on my day. */
  function recipeLog(l: Extract<Level, { k: 'rlog' }>, v: { m: Meal; g: number; u: string | null }) {
    if (logRecipe({ recipeId: l.r.id, d: date, m: v.m, g: v.g, u: v.u ?? undefined }).ok) {
      toasts.show(t('food.added', { meal: mealName(v.m), name: l.r.n }), 2000, { reaction: 'pleased' });
    }
    picked = null;
    tab = 'log';
    home();
  }
</script>

<div class="food" bind:this={root}>
  {#if m && view && day}
    {#if top?.k === 'search'}
      {@const meal = top.meal}
      <FoodSearch {recent} onpick={(item, g, u) => add(item, meal, g, u)} recipes={allRecipes} {names} onrecipe={(r) => go({ k: 'rlog', r, meal })} />
    {:else if top?.k === 'amount'}
      {@const l = top}
      {#key l}
        <FoodAmount item={l.item} meal={l.meal} g0={l.g0} u0={l.u0} editing={!!l.entry} ondone={(v) => done(l, v)} onremove={() => l.entry && remove(l.entry)} />
      {/key}
    {:else if top?.k === 'recipe'}
      {@const id = top.id}
      {@const r = id ? allRecipes.find((x) => x.id === id) : undefined}
      {@const theirs = r && r.who !== me ? r : null}
      {#key id}
        <FoodRecipe bind:draft owner={theirs ? ownerOf(theirs) : null} saved={!!r && !theirs} clean={clean} onadd={() => go({ k: 'rsearch' })}
          onitem={editItem} onsave={() => recipeSave(id)} onremove={() => id && recipeRemove(id)} oncopy={recipeCopy}
          onlog={() => theirs && go({ k: 'rlog', r: theirs })} />
      {/key}
    {:else if top?.k === 'rsearch'}
      <FoodSearch {recent} onpick={(item, g, u) => go({ k: 'ritem', item, g0: g, u0: u })} />
    {:else if top?.k === 'ritem'}
      {@const l = top}
      {#key l}
        <FoodAmount item={l.item} meal="b" g0={l.g0} u0={l.u0} editing={l.i !== undefined} pick ondone={(v) => itemDone(l, v)}
          onremove={() => l.i !== undefined && itemRemove(l.i)} />
      {/key}
    {:else if top?.k === 'rlog'}
      {@const l = top}
      {#key l}
        <FoodAmount item={recipeItem(l.r)} meal={l.meal ?? mealAt(m.now)} ondone={(v) => recipeLog(l, v)} />
      {/key}
    {:else if top?.k === 'repeat'}
      {@const meal = top.meal}
      {@const r = liveRepeat(meal)}
      {@const shown = byMeal(meal)}
      {#key r?.id}
        {#if r}
          <FoodRepeat {meal} items={r.it} w0={r.w} live fromDay={shown.length > 0 && (shown.length !== r.it.length || shown.some((e) => e.rep !== r.id))}
            onsavedays={(w) => repDays(r.id, w)} onfromday={() => repFromDay(r.id)} onstop={() => repStop(r.id, meal)} />
        {:else}
          <FoodRepeat {meal} items={shown} w0={DAYS.every} live={false} onstart={(w) => repStart(meal, w)} />
        {/if}
      {/key}
    {:else if top?.k === 'goal'}
      <ValueInput label={t('food.goal')} sub="" old={goal} unit="kcal" parse={parseKcalGoal}
        hint={t('food.goalRange', { min: KCAL_GOAL.min, max: KCAL_GOAL.max, step: KCAL_GOAL.step })}
        onok={saveGoal} oncancel={up} extra={goal === null ? null : { label: t('food.goalClear'), run: () => saveGoal(null) }} />
    {:else}
      <Segmented items={TABS.map((id) => ({ id, label: t(`food.tab.${id}`), art: FOOD_TAB_ART[id] }))} value={tab} label={t('food.tabs')} attr="tab" onpick={(id) => (tab = id)} />
      {#if tab !== 'recipe'}
        <div class="dds" class:two={tab === 'chart'}>
          <Pick kind="who" value={who} options={order.map((id) => ({ id, label: names[id] }))} label={t('food.who')} onpick={setWho}
            person={{ p: who, villager: villagerOf(who) }} />
          <!-- グラフ: けんこう's period dropdown beside whose day, as there -->
          {#if tab === 'chart'}
            <Pick kind="period" value={period} options={PERIODS.map((id) => ({ id, label: t(`health.period.${id}`) }))} label={t('health.period')} onpick={setPeriod} />
          {/if}
        </div>
      {/if}

      {#if tab === 'recipe'}
        <FoodRecipes list={allRecipes} {names} {villagerOf} onnew={() => openRecipe(null)} onopen={openRecipe} onlog={(r) => go({ k: 'rlog', r })} />
      {:else if tab === 'chart'}
        <FoodChart {who} name={names[who]} {period} />
      {:else}
        <RangeNav earlier={t('food.earlier')} later={t('food.later')} today={t('food.today')} canOn={date < today} atToday={picked_d === null}
          onback={() => shift(-1)} onon={() => shift(1)} ontoday={() => (picked_d = null)}>
          <b class="rl money" aria-live="polite" data-food-date={date}>{dayTitle(date)}</b>
        </RangeNav>

        <FoodSummary {day} {who} {goal} {protein} onedit={mine ? () => go({ k: 'goal' }) : null} />
        {#each MEALS as k (k)}
          <!-- the 🔁 chip: on my day my repeat still going (a tap manages it), else the one filling the day (shown only);
               none: 🔁 くりかえす on my today only (from a past day it would fill every day since, today's doubled) -->
          {@const live = mine ? liveRepeat(k) : null}
          {@const r = live ?? repeatOn(m.state, who, k, date)}
          <FoodMeal meal={k} entries={byMeal(k)} {mine} days={r?.w ?? null} onadd={() => go({ k: 'search', meal: k })}
            onrepeat={mine && (live || (!r && date >= today)) ? () => go({ k: 'repeat', meal: k }) : null} onpick={edit} />
        {/each}
        <FoodCredits />
      {/if}
    {/if}
  {/if}
</div>

<style>
  .food { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-bottom: 8px; }
  /* under the tabs (けんこう's Pick pills; none on レシピ): whose day alone, or (グラフ) beside the period as けんこう's two, whose a little wider */
  .dds { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .dds.two { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); }
  .rl { flex: 1; min-width: 0; text-align: center; font-size: var(--fs-talk); white-space: nowrap; }
</style>
