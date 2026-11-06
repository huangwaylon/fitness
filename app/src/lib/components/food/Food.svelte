<script lang="ts">
  // ごはん (the meal log, docs/design.md "Gohan"): the HUD bowl's popup. Whose day (this phone's person first; the
  // partner, and the guest once it has logged or on its own phone: everyone sees everyone's meals), ‹ the day ›
  // and きょう (› to tomorrow too when a いつもの fills it: shown only), the summary card, then the four meals. On my own
  // day ＋ per meal → the search (its field focused in the tap: the iPhone's keyboard up) → the amount → ついか; an
  // entry → its amount at once (from its snapshot; the catalog's portions swapped in when they come) → ほぞん / けす
  // (けす with とりけす in its banner; a いつもの's entry: the day leaves the repeat only then, detachDay, so ‹ changes
  // nothing); the kcal goal at the summary's upper right (GoalEdit, in place); a meal's 🔁 → いつもの (its repeat, or a new one from the day's entries). Those push a
  // level (FoodSheet's title bar: its ‹; back where it was scrolled, the focus on what opened it, as けんこう's).
  // Anyone else's day is read-only. データの出典 at the foot. Whose day sits in the title bar (`lead`, FoodSheet's
  // NavBar; kept for the session as けんこう's); under it the tabs (TABS, けんこう's group switch): きろく (the day,
  // on each opening) and グラフ (FoodChart: the kcal over a period, its range row with けんこう's period dropdown beside
  // きょう, and its Move card; switching whose keeps the tab, the period and the range). A meal's search offers everyone's
  // recipes (マイレシピ) and custom foods (マイ食品), and under its field レシピを つくる (FoodRecipe, the editor) and 食品を
  // つくる (FoodCustom, whose ほぞん goes on to the amount for the new food); a recipe's or custom food's amount opens it
  // (mine to edit, anyone else's to copy). A recipe's ingredient search offers the custom foods and 食品を つくる too.
  // Several foods a trip: a new entry logged from a meal's search (its amount's ついか, a row's own ＋, a recipe's or a
  // custom food's) comes back to that search, listed at its top (each with ✕), its field focused; おわり ends the trip.
  // クイック (the search's ⚡, or a kcal typed): kcal and what else is known as one entry (FoodCustom `quick`), no food saved.
  import '#lib/i18n/food.ts'; // the meal log's strings, loaded with it
  import '#lib/i18n/kenkou.ts'; // けんこう's: the period dropdown
  import { flushSync, tick, type Snippet } from 'svelte';
  import type { LocalDate, Who } from '#lib/types.ts';
  import { customGrams, customSnap, FOOD_GOAL_OF, MEALS, newFoodId, type FoodCustom as Custom, type FoodEntry, type FoodGoalOf, type FoodSnap, type Meal } from '#lib/contract/food.ts';
  import { copySources, customs, foodDay, foodEntries, foodGoal, recipes, repeatOn, repeats, type CopySource, type Recipe } from '#lib/model/food.ts';
  import { mealProteinTarget } from '#lib/model/profile.ts';
  import {
    copyMeal, detachDay, editFood, logCustom, logFood, logRecipe, refreshFood, removeCustom, removeFood, removeRecipe, saveCustom, saveRecipe, startRepeat,
    stopRepeat, updateRepeat
  } from '#lib/store/actions.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { PERIODS, type Period } from '#lib/model/health.ts';
  import { FOOD_TAB_ART } from '#lib/art.ts';
  import Segmented from '../ui/Segmented.svelte';
  import RangeNav from '../health/RangeNav.svelte';
  import Pick from '../health/Pick.svelte';
  import FoodChart from './FoodChart.svelte';
  import { cue } from '#lib/sound/cues.ts';
  import { portionsOf, toSnap, type FoodDb, type Item } from '#lib/food/index.ts';
  import { latestSnap } from './fresh.ts';
  import { dayTitle } from '../kiroku/fmt.ts';
  import FoodSummary from './FoodSummary.svelte';
  import { kcalWarn, saveGoal } from '../health/goals.ts';
  import FoodMeal from './FoodMeal.svelte';
  import FoodSearch from './FoodSearch.svelte';
  import FoodAmount from './FoodAmount.svelte';
  import FoodCredits from './FoodCredits.svelte';
  import FoodRepeat from './FoodRepeat.svelte';
  import FoodRecipe from './FoodRecipe.svelte';
  import FoodCustom from './FoodCustom.svelte';
  import {
    customDraft, customItem, customOf, DAYS, foodDb, foodDbNow, foodLast, inState, itemOf, portionLabel, recentOf, recipeItem,
    quickDraft, quickSnap, recipeServing, sameItems, servingOnly, type CustomDraft, type RecipeDraft
  } from './foodUi.ts';

  let { title = $bindable(''), back = $bindable(null), lead = $bindable(null) }: {
    title?: string; back?: (() => void) | null; lead?: Snippet | null
  } = $props();

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
  const TABS = ['log', 'chart'] as const;
  type Tab = (typeof TABS)[number];
  let tab = $state<Tab>('log');
  /** グラフ's period (1週 on each opening, as けんこう's). */
  let period = $state<Period>('week');
  function setPeriod(p: Period) {
    if (p === period || !PERIODS.includes(p)) return;
    cue('tick');
    period = p;
  }

  let picked = $state<Who | null>(foodLast.who);
  const who = $derived<Who>(picked && order.includes(picked) ? picked : me);
  /** The day shown (null: today, following the clock). */
  let picked_d = $state<LocalDate | null>(null);
  const today = $derived(view?.today ?? '');
  const date = $derived(picked_d ?? today);
  /** My own day, up to today: ＋ and the entries take taps (tomorrow's いつもの is only shown). */
  const mine = $derived(who === me && date <= today);
  /** › goes on past today only to tomorrow, and only when a いつもの fills it (a look at what comes). */
  const canOn = $derived(date < today || (!!m && date === today && foodDay(m.state, who, addDays(today, 1)).entries.some((e) => e.rep)));

  const day = $derived(m && date ? foodDay(m.state, who, date) : null);
  /** Whose goals, kcal and each nutrient (protein's default included). */
  const goals = $derived(Object.fromEntries(FOOD_GOAL_OF.map((n) => [n, m ? foodGoal(m.state, who, n, m.now) : null])) as Record<FoodGoalOf, number | null>);
  /** A meal's protein to aim for: a third of the day's (profile.ts mealProteinTarget). */
  const ptarget = $derived(mealProteinTarget(goals.p));
  const byMeal = (k: Meal) => day?.entries.filter((e) => e.m === k) ?? [];
  const recent = $derived(m ? recentOf(foodEntries(m.state, me)) : []);
  /** My repeat of a meal still going (the one to manage; an ended one only fills its days). */
  const liveRepeat = (k: Meal) => (m ? (repeats(m.state, me).find((r) => r.m === k && (!r.to || r.to > today)) ?? null) : null);

  /** A food picked: a custom food still there logs afresh (`cid`); a serving with no weight (`sv`) by the serving; an
   *  `sv` snapshot whose food is gone (or a recipe's) logs from that snapshot (`snap`). */
  type Picked = { item: Item; cid?: string; sv?: boolean; snap?: FoodSnap };
  /** Where the custom food editor goes on to once saved: a meal's amount, a recipe's ingredient, or back (to the search). */
  type Then = { meal: Meal } | { ingredient: true } | null;
  type Level =
    | { k: 'search'; meal: Meal; added: string[] }
    | ({ k: 'amount'; meal: Meal; g0?: number; u0?: string; entry?: FoodEntry } & Picked)
    | { k: 'custom'; id: string | null; then: Then }
    | { k: 'quick'; meal: Meal }
    | { k: 'repeat'; meal: Meal }
    | { k: 'recipe'; id: string | null }
    | { k: 'rsearch' }
    | ({ k: 'ritem'; g0?: number; u0?: string; i?: number } & Picked)
    | { k: 'rlog'; r: Recipe; meal: Meal };
  let stack = $state<Level[]>([]);
  const top = $derived(stack.at(-1) ?? null);
  /** Under each level: where the one below was scrolled and what opened it (`[data-add="b"]`), restored on ‹. */
  let under: { top: number; focus: string | null }[] = [];
  let scroller: Element | null = null;
  let root: HTMLElement | undefined = $state();
  $effect(() => {
    title = !top ? '' : top.k === 'repeat' ? t('food.rep.title', { meal: t(`food.meal.${top.meal}`) })
      : top.k === 'recipe' ? t(top.id ? 'food.rcp.title' : 'food.rcp.new') : top.k === 'rsearch' ? t('food.rcp.addItem')
      : top.k === 'ritem' ? t('food.rcp.item') : top.k === 'rlog' ? t('food.rcp.log')
      : top.k === 'custom' ? t(top.id ? 'food.my.head' : 'food.my.newTitle') : top.k === 'quick' ? t('food.quick.title') : t(`food.meal.${top.meal}`);
    back = top ? up : null;
    lead = !top ? whoPill : null;
  });
  const sheet = () => (scroller ??= root?.closest('[data-food-sheet]') ?? null);
  /** Push a level; `focus`: what opened it (a selector, found again once the level below is back: Safari never
   *  focuses a tapped button, so it is named, not read off document.activeElement). */
  function go(l: Level, focus: string | null = null) {
    leave();
    under = [...under.slice(0, stack.length), { top: sheet()?.scrollTop ?? 0, focus }];
    stack = [...stack, l];
    void tick().then(() => sheet()?.scrollTo({ top: 0 }));
  }
  /** Back to the level `n` deep (0: the day), where it was scrolled, the focus on what opened the one left. */
  function backTo(n: number) {
    const was = under[n];
    stack = stack.slice(0, n);
    under = under.slice(0, n);
    if (!was) return;
    void tick().then(() => {
      sheet()?.scrollTo({ top: was.top });
      if (was.focus) root?.querySelector<HTMLElement>(was.focus)?.focus({ preventScroll: true });
    });
  }
  /** A level left by hand: its banner goes with it (its とりけす would undo what is no longer on screen). One shown by
   *  what moved the level (追加しました, then back to the search) stays. */
  function leave() {
    if (toasts.current && !toasts.current.code) toasts.dismiss();
  }
  function up() {
    cue('back');
    leave();
    backTo(stack.length - 1);
  }
  const home = () => backTo(0);
  /** Back to the meal's search under the levels (a recipe or custom food saved, removed); none: the day. */
  const toSearch = () => backTo(stack.findIndex((l) => l.k === 'search') + 1);

  function setWho(w: Who) {
    if (w === who || !order.includes(w)) return;
    cue('tick');
    picked = foodLast.who = w;
  }
  function shift(dir: -1 | 1) {
    if (dir > 0 && !canOn) return;
    const next = addDays(date, dir);
    picked_d = next === today ? null : next;
  }
  /** ＋: the search, its field focused in this same tap (iOS raises the keyboard only for a focus inside the gesture). */
  function openSearch(meal: Meal) {
    go({ k: 'search', meal, added: [] }, `[data-add="${meal}"]`);
    focusQ();
  }
  const focusQ = () => {
    flushSync();
    root?.querySelector<HTMLInputElement>('[data-food-q]')?.focus({ preventScroll: true });
  };
  /** A new entry logged from a meal's search (`id`; none: it failed): back to that search, the entry listed at its top
   *  and its field focused in the same tap (the keyboard up for the next food); from anywhere else, the day. */
  function logged(id: string | undefined) {
    const i = stack.findIndex((l) => l.k === 'search');
    const l = stack[i];
    if (!l || l.k !== 'search') return home();
    if (id) l.added = [...l.added, id];
    backTo(i + 1);
    focusQ();
  }
  /** This trip's entries, in the order added (one taken back is gone). */
  function addedOf(ids: readonly string[]): FoodEntry[] {
    const mine = m ? foodEntries(m.state, me) : [];
    return ids.map((id) => mine.find((e) => e.id === id)).filter((e): e is FoodEntry => !!e);
  }
  /** A row's own ＋ (one tap, no amount): its default portion, or a recent one's amount as I had it. */
  function quick(item: Item, meal: Meal, g?: number, u?: string, f?: FoodSnap) {
    const p = pickOf(item, f);
    const d = g === undefined ? (p.sv && p.item.portions?.length ? p.item.portions : portionsOf(p.item))[0] : null;
    const gg = d ? d.g : g!;
    const uu = d ? portionLabel(d, 1) : (u ?? null);
    const r = p.cid ? logCustom({ customId: p.cid, d: date, m: meal, g: gg, u: uu ?? undefined }) : logFood({ d: date, m: meal, g: gg, f: snapOf(p, uu) });
    if (r.ok && r.id) {
      said('food.added', { meal: t(`food.meal.${meal}`) });
      const l = top;
      if (l?.k === 'search') l.added = [...l.added, r.id];
    }
  }
  // ---- クイック: one entry of kcal (and what else is known), no food saved (foodUi.ts quickSnap: an `sv` snapshot)
  let qdraft = $state<CustomDraft>(quickDraft());
  /** The quick form, its kcal field focused in the tap (`k`: a kcal typed in the search). */
  function openQuick(meal: Meal, k?: number) {
    qdraft = quickDraft(k === undefined ? '' : String(k));
    go({ k: 'quick', meal }, k === undefined ? '[data-quick-new]' : '[data-quick-row]');
    flushSync();
    root?.querySelector<HTMLInputElement>('[data-custom-k]')?.focus({ preventScroll: true });
  }
  const logQuick = (meal: Meal, d: CustomDraft) => logFood({ d: date, m: meal, g: 100, f: quickSnap(d, newFoodId(Date.now(), 'q')) });
  function quickDone(l: Extract<Level, { k: 'quick' }>) {
    const r = logQuick(l.meal, qdraft);
    if (r.ok) said('food.added', { meal: mealName(l.meal) });
    logged(r.id);
  }
  /** A kcal typed, its ＋: logged at once as クイック. */
  function quickNow(meal: Meal, k: number) {
    const r = logQuick(meal, quickDraft(String(k)));
    if (r.ok && r.id) {
      said('food.added', { meal: mealName(meal) });
      if (top?.k === 'search') top.added = [...top.added, r.id];
    }
  }
  /** ✕ on one of this trip's: removed (it was only just logged; no とりけす). */
  function unadd(e: FoodEntry) {
    if (removeFood(e.id).ok) cue('undo');
  }

  function add(item: Item, meal: Meal, g0?: number, u0?: string, f?: FoodSnap) {
    go({ k: 'amount', meal, ...pickOf(item, f), g0, u0 });
  }
  /** A food picked (a catalog item, a recent entry's food `f`, a custom food as customItem): a custom food still there
   *  as it is now, logged by logCustom; else an `sv` snapshot kept as logged (its values per serving). */
  function pickOf(item: Item, f?: FoodSnap): Picked {
    const c = item.id.startsWith('custom:') ? allCustoms.find((x) => `custom:${x.id}` === item.id) : undefined;
    if (c) return { item: customItem(c), cid: c.id, sv: c.g === undefined };
    return f && servingOnly(f) ? { item, sv: true, snap: f } : { item: inState(foodDbNow(), item) };
  }
  /** A snapshot as logged, picked by another portion (`u`). */
  function withU(f: FoodSnap, u: string | null): FoodSnap {
    const { u: _, ...rest } = f;
    return u ? { ...rest, u } : rest;
  }
  /** What a picked food logs as (portion label `u`): its custom food's snapshot now, its own, or the catalog item's. */
  function snapOf(l: Picked, u: string | null): FoodSnap {
    const c = l.cid ? allCustoms.find((x) => x.id === l.cid) : undefined;
    return c ? customSnap(c, u ?? undefined) : l.snap ? withU(l.snap, u) : toSnap(l.item, u ?? undefined);
  }
  /** A confirmation inside the sheet: short, docked low (never over the level it lands on). */
  const said = (key: string, vars: Record<string, string> = {}, sad = false) => toasts.show(t(key, vars), 2200, { low: true, ...(sad ? {} : { reaction: 'pleased' }) });
  /** An entry of mine → its amount at once, from its snapshot (its own portion); the catalog's portions swapped in
   *  when it comes. A いつもの's entry stays the repeat's until ほぞん / けす (real()). */
  function edit(e: FoodEntry) {
    openSnap({ k: 'amount', meal: e.m, item: itemOf(e.f, foodDbNow(), e.g), sv: servingOnly(e.f), g0: e.g, u0: e.f.u, entry: e }, e, `[data-entry="${e.id}"]`);
  }
  /** An amount level for a logged snapshot, open at once; the catalog's item put in when it is in (if still open). */
  function openSnap(l: Extract<Level, { item: Item }>, x: { g: number; f: FoodSnap }, focus: string) {
    go(l, focus);
    if (foodDbNow()) return;
    const lv = stack.at(-1);
    foodDb().then((db) => {
      if (lv && 'item' in lv && stack.includes(lv)) lv.item = itemOf(x.f, db, x.g);
    }, () => {});
  }
  /** The entry to change: a いつもの's leaves the repeat now (the day's items its own, in one go), the real one. */
  function real(v: FoodEntry): FoodEntry | null {
    if (!v.rep) return v;
    const id = detachDay(v.rep, date)?.[v.id];
    return (id && m && foodEntries(m.state, me).find((e) => e.id === id)) || null;
  }
  function done(l: Extract<Level, { k: 'amount' }>, v: { m: Meal; g: number; u: string | null }) {
    const e = l.entry && real(l.entry);
    if (l.entry) {
      // another state of it picked (じょうたい): its food too
      const f = e && l.item.id !== e.f.id ? snapOf(l, v.u) : undefined;
      if (e && editFood(e.id, { m: v.m, g: v.g, u: v.u, ...(f ? { f } : {}) }).ok) said('food.saved');
      return home();
    }
    const r = l.cid ? logCustom({ customId: l.cid, d: date, m: v.m, g: v.g, u: v.u ?? undefined }) : logFood({ d: date, m: v.m, g: v.g, f: snapOf(l, v.u) });
    if (r.ok) said('food.added', { meal: t(`food.meal.${v.m}`) });
    logged(r.id);
  }
  /** My meal's copies (きのうと おなじ, 〇〇と おなじ: model/food.ts copySources), on my day while it is empty. */
  function copiesOf(meal: Meal) {
    if (!mine || !m || byMeal(meal).length) return [];
    return copySources(m.state, me, order, date, meal).map((src) => ({
      key: src.who === me ? 'prev' : src.who,
      label: src.who !== me ? t('food.copy.of', { name: names[src.who] }) : t(date === today ? 'food.copy.yesterday' : 'food.copy.prev'),
      meta: t('food.copy.meta', { n: src.items.length, k: formatNum(Math.round(src.items.reduce((a, x) => a + (x.f.k * x.g) / 100, 0))) }),
      run: () => copy(src, meal)
    }));
  }
  /** One tap: the meal's items new entries of mine, its banner's とりけす removing them again. */
  function copy(src: CopySource, meal: Meal) {
    const r = copyMeal({ who: src.who, d: src.date, m: meal }, { d: date, m: meal });
    if (!r.ok) return;
    toasts.show(t('food.copied', { meal: mealName(meal), n: r.ids.length }), 5000, {
      low: true, reaction: 'pleased', action: { label: t('common.undo'), run: () => r.ids.forEach((id) => removeFood(id)) }
    });
  }
  /** けす, one tap: its banner's とりけす logs it again (a removal is final: the same food, day, meal and grams). */
  function remove(v: FoodEntry) {
    const e = real(v);
    if (e && removeFood(e.id).ok) {
      cue('undo');
      toasts.show(t('food.removed', { name: e.f.n }), 5000, {
        action: { label: t('common.undo'), run: () => void logFood({ d: e.d, m: e.m, g: e.g, f: e.f }) }
      });
    }
    home();
  }
  const mealName = (k: Meal) => t(`food.meal.${k}`);
  function repStart(meal: Meal, w: number) {
    if (startRepeat({ meal, date, w }).ok) said('food.rep.started', { meal: mealName(meal) });
    home();
  }
  function repDays(id: string, w: number) {
    if (updateRepeat(id, { w }).ok) said('food.rep.daysSaved');
    home();
  }
  function repFromDay(id: string) {
    if (updateRepeat(id, { itemsFromDate: date }).ok) said('food.rep.fromDaySaved');
    home();
  }
  function repStop(id: string, meal: Meal) {
    if (stopRepeat(id).ok) said('food.rep.stopped', { meal: mealName(meal) }, true);
    home();
  }

  // ---- マイレシピ: the recipe level edits a draft of mine (kept here, under the search and the amount it opens)
  const allRecipes = $derived(m ? recipes(m.state) : []);
  let draft = $state<RecipeDraft>({ n: '', sv: 2, it: [] });
  /** The draft as last saved (null: a new one): ほぞん waits while nothing changed. */
  let savedAs = $state<string | null>(null);
  const clean = $derived(savedAs !== null && savedAs === JSON.stringify(draft));
  const ownerOf = (r: { who: Who }) => ({ who: r.who, name: names[r.who], villager: villagerOf(r.who) });
  const toRecipeLevel = () => backTo(stack.findIndex((l) => l.k === 'recipe') + 1);

  function openRecipe(r: Recipe | null) {
    draft = r ? { n: r.n, sv: r.sv, it: r.it.map((x) => ({ ...x })) } : { n: '', sv: 2, it: [] };
    savedAs = r ? JSON.stringify(draft) : null;
    go({ k: 'recipe', id: r?.id ?? null }, r ? '[data-amount-open]' : '[data-recipe-new]');
  }
  function itemDone(l: Extract<Level, { k: 'ritem' }>, v: { g: number; u: string | null }) {
    const x = { g: v.g, f: snapOf(l, v.u) };
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
    const sv = servingOnly(x.f);
    openSnap({ k: 'ritem', item: itemOf(x.f, foodDbNow(), x.g), ...(sv ? { sv, snap: x.f } : {}), g0: x.g, u0: x.f.u, i }, x, `[data-recipe-item="${i}"]`);
  }
  function recipeSave(id: string | null) {
    if (saveRecipe({ id: id ?? undefined, n: draft.n, sv: draft.sv, it: draft.it }).ok) said('food.rcp.saved', { name: draft.n.trim() });
    toSearch();
  }
  function recipeRemove(id: string) {
    if (removeRecipe(id).ok) said('food.rcp.removed', { name: draft.n }, true);
    toSearch();
  }
  /** Someone else's → a recipe of mine with its name, servings and ingredients, opened in the editor. */
  function recipeCopy() {
    const res = saveRecipe({ n: draft.n, sv: draft.sv, it: draft.it });
    if (!res.ok || !res.id) return;
    savedAs = JSON.stringify(draft);
    stack = [...stack.slice(0, -1), { k: 'recipe', id: res.id }];
    said('food.rcp.copied');
  }
  /** A recipe logged as a meal of mine on the day shown. */
  function recipeLog(l: Extract<Level, { k: 'rlog' }>, v: { m: Meal; g: number; u: string | null }) {
    const r = logRecipe({ recipeId: l.r.id, d: date, m: v.m, g: v.g, u: v.u ?? undefined });
    if (r.ok) said('food.added', { meal: mealName(v.m) });
    logged(r.id);
  }

  // ---- マイ食品: the editor edits a draft (kept here, as the recipe's); ほぞん goes on where it came from (Then)
  const allCustoms = $derived(m ? customs(m.state) : []);
  let cdraft = $state<CustomDraft>(customDraft(null));
  /** The draft as last saved (null: a new one): ほぞん waits while nothing changed. */
  let csaved = $state<string | null>(null);
  const cclean = $derived(csaved !== null && csaved === JSON.stringify(cdraft));

  function openCustom(c: Custom | null, then: Then, focus: string, name = '') {
    cdraft = customDraft(c, name);
    csaved = c ? JSON.stringify(cdraft) : null;
    go({ k: 'custom', id: c?.id ?? null, then }, focus);
  }
  /** Swap the level on top for another (the editor for the amount it goes on to, a copy's editor). */
  function swap(l: Level) {
    stack = [...stack.slice(0, -1), l];
    void tick().then(() => sheet()?.scrollTo({ top: 0 }));
  }
  function customSave(l: Extract<Level, { k: 'custom' }>) {
    const v = customOf(cdraft);
    const res = saveCustom({ id: l.id ?? undefined, ...v });
    if (!res.ok || !res.id) return;
    said('food.my.saved', { name: v.n });
    if (!l.then) return toSearch();
    const c: Custom = { ...v, id: res.id, at: 0, who: me };
    if ('meal' in l.then && !l.id) {
      // ほぞんして ついか: one serving logged too, back to the meal's search
      const r = logCustom({ customId: res.id, d: date, m: l.then.meal, g: customGrams(c), u: c.u });
      if (r.ok) said('food.added', { meal: mealName(l.then.meal) });
      return logged(r.id);
    }
    const p: Picked = { item: customItem(c), cid: res.id, sv: c.g === undefined };
    swap('meal' in l.then ? { k: 'amount', meal: l.then.meal, ...p } : { k: 'ritem', ...p });
  }
  function customRemove(id: string) {
    if (removeCustom(id).ok) said('food.my.removed', { name: cdraft.n }, true);
    toSearch();
  }
  /** Someone else's → a custom food of mine with the same values, opened in the editor. */
  function customCopy(l: Extract<Level, { k: 'custom' }>) {
    const res = saveCustom(customOf(cdraft));
    if (!res.ok || !res.id) return;
    csaved = JSON.stringify(cdraft);
    swap({ k: 'custom', id: res.id, then: l.then });
    said('food.my.copied');
  }

  // ---- 最新の値にする (fresh.ts): my own day's entries (not a いつもの's) whose food has changed since they were logged
  // (the data fixed, the recipe or custom food edited). The catalogue loads for it once my day shows an entry of it,
  // a moment after the day (it is the search's data too); the products when they come. Never updated by itself.
  let catalog = $state.raw<FoodDb | null>(foodDbNow());
  let catalogRev = $state(0);
  $effect(() => {
    if (catalog || !mine || !day?.entries.some((e) => !e.rep && !/^(recipe|custom):/.test(e.f.id))) return;
    const wait = setTimeout(() => foodDb().then((db) => {
      catalog = db;
      void db.more.then(() => catalogRev++);
    }, () => {}), 600);
    return () => clearTimeout(wait);
  });
  /** Entry id → its food as it is now, for my day's entries whose food changed. */
  const fresh = $derived.by(() => {
    void catalogRev;
    const out = new Map<string, FoodSnap>();
    if (!mine || !day) return out;
    const src = { db: catalog, recipes: allRecipes, customs: allCustoms };
    for (const e of day.entries) {
      const f = e.rep ? null : latestSnap(e.f, src);
      if (f) out.set(e.id, f);
    }
    return out;
  });
  function refresh(e: FoodEntry, f: FoodSnap) {
    if (refreshFood(e.id, f).ok) said('food.fresh.done', { name: f.n });
  }
</script>

{#snippet whoPill()}
  <!-- whose day, in the title bar (NavBar's lead) -->
  <Pick kind="who" value={who} options={order.map((id) => ({ id, label: names[id] }))} label={t('food.who')} onpick={setWho}
    person={{ p: who, villager: villagerOf(who) }} compact />
{/snippet}

<div class="food" bind:this={root}>
  {#if m && view && day}
    <!-- a level slides in (けんこう's .lvl); the day comes back as it was -->
    {#key stack.length}<div class="lv" class:lvl={!!top}>
    {#if top?.k === 'search'}
      {@const meal = top.meal}
      <FoodSearch {recent} onpick={(item, g, u, f) => add(item, meal, g, u, f)} recipes={allRecipes} {names} onrecipe={(r) => go({ k: 'rlog', r, meal })}
        onnewrecipe={() => openRecipe(null)} customs={allCustoms} oncustom={(c) => go({ k: 'amount', meal, ...pickOf(customItem(c)) })}
        oncreate={(n) => openCustom(null, { meal }, '[data-custom-new]', n)} onquick={(item, g, u, f) => quick(item, meal, g, u, f)}
        oncustomquick={(c) => quick(customItem(c), meal)} added={addedOf(top.added)} onunadd={unadd} onfinish={home}
        onquicknew={(k) => openQuick(meal, k)} onquicklog={(k) => quickNow(meal, k)} />
    {:else if top?.k === 'quick'}
      {@const l = top}
      <FoodCustom bind:draft={qdraft} quick onsave={() => quickDone(l)} />
    {:else if top?.k === 'amount'}
      {@const l = top}
      {#key l}
        {@const c = !l.entry && l.cid ? allCustoms.find((x) => x.id === l.cid) : undefined}
        <FoodAmount item={l.item} meal={l.meal} g0={l.g0} u0={l.u0} serving={!!l.sv} editing={!!l.entry} ondone={(v) => done(l, v)} onremove={() => l.entry && remove(l.entry)}
          onitem={l.cid || l.snap ? undefined : (it) => (l.item = it)}
          open={c ? { label: t('food.my.open'), run: () => openCustom(c, null, '[data-amount-open]') } : null} />
      {/key}
    {:else if top?.k === 'recipe'}
      {@const id = top.id}
      {@const r = id ? allRecipes.find((x) => x.id === id) : undefined}
      {@const theirs = r && r.who !== me ? r : null}
      {#key id}
        <FoodRecipe bind:draft owner={theirs ? ownerOf(theirs) : null} saved={!!r && !theirs} clean={clean} onadd={() => go({ k: 'rsearch' }, '[data-recipe-add]')}
          onitem={editItem} onsave={() => recipeSave(id)} onremove={() => id && recipeRemove(id)} oncopy={recipeCopy}
          onlog={up} />
      {/key}
    {:else if top?.k === 'rsearch'}
      <FoodSearch {recent} onpick={(item, g, u, f) => go({ k: 'ritem', ...pickOf(item, f), g0: g, u0: u })} {names} customs={allCustoms}
        oncustom={(c) => go({ k: 'ritem', ...pickOf(customItem(c)) })} oncreate={(n) => openCustom(null, { ingredient: true }, '[data-custom-new]', n)} />
    {:else if top?.k === 'custom'}
      {@const l = top}
      {@const c = l.id ? allCustoms.find((x) => x.id === l.id) : undefined}
      {@const theirs = c && c.who !== me ? c : null}
      {#key l.id}
        <FoodCustom bind:draft={cdraft} owner={theirs ? ownerOf(theirs) : null} saved={!!c && !theirs} clean={cclean} onsave={() => customSave(l)}
          andLog={!l.id && !!l.then && 'meal' in l.then}
          onremove={() => l.id && customRemove(l.id)} oncopy={() => customCopy(l)}
          onlog={up} />
      {/key}
    {:else if top?.k === 'ritem'}
      {@const l = top}
      {#key l}
        <FoodAmount item={l.item} meal="b" g0={l.g0} u0={l.u0} serving={!!l.sv} editing={l.i !== undefined} pick ondone={(v) => itemDone(l, v)}
          onitem={l.cid || l.snap ? undefined : (it) => (l.item = it)}
          onremove={() => l.i !== undefined && itemRemove(l.i)} />
      {/key}
    {:else if top?.k === 'rlog'}
      {@const l = top}
      {#key l}
        <FoodAmount item={recipeItem(l.r)} meal={l.meal} serving={recipeServing(l.r)} ondone={(v) => recipeLog(l, v)}
          open={{ label: t('food.rcp.open'), run: () => openRecipe(allRecipes.find((x) => x.id === l.r.id) ?? l.r) }} />
      {/key}
    {:else if top?.k === 'repeat'}
      {@const meal = top.meal}
      {@const r = liveRepeat(meal)}
      {@const shown = byMeal(meal)}
      {#key r?.id}
        {#if r}
          <FoodRepeat {meal} items={r.it} w0={r.w} live fromDay={shown.length > 0 && !sameItems(shown, r.it)}
            onsavedays={(w) => repDays(r.id, w)} onfromday={() => repFromDay(r.id)} onstop={() => repStop(r.id, meal)} />
        {:else}
          <FoodRepeat {meal} items={shown} w0={DAYS.every} live={false} onstart={(w) => repStart(meal, w)} />
        {/if}
      {/key}
    {:else}
      <Segmented items={TABS.map((id) => ({ id, label: t(`food.tab.${id}`), art: FOOD_TAB_ART[id] }))} value={tab} label={t('food.tabs')} attr="tab" onpick={(id) => (tab = id)} />
      {#if tab === 'chart'}
        <FoodChart {who} name={names[who]} {period} onperiod={setPeriod} />
      {:else}
        <RangeNav earlier={t('food.earlier')} later={t('food.later')} today={t('food.today')} {canOn} atToday={picked_d === null}
          onback={() => shift(-1)} onon={() => shift(1)} ontoday={() => (picked_d = null)}>
          <b class="rl money" aria-live="polite" data-food-date={date}>{dayTitle(date)}</b>
        </RangeNav>

        <FoodSummary {day} {who} {goals} when={date < today ? 'past' : date > today ? 'next' : 'today'} onsavegoal={mine ? (v) => saveGoal('k', me, v) : null}
          warngoal={mine && m ? kcalWarn(m.state, me, m.now) : null} />
        {#each MEALS as k (k)}
          <!-- the 🔁 chip: on my day my repeat still going (a tap manages it), else the one filling the day (shown only);
               none: いつものに する on my today only (from a past day it would fill every day since, today's doubled) -->
          {@const live = mine ? liveRepeat(k) : null}
          {@const r = live ?? repeatOn(m.state, who, k, date)}
          <FoodMeal meal={k} entries={byMeal(k)} {mine} days={r?.w ?? null} onadd={() => openSearch(k)} copies={copiesOf(k)}
            onrepeat={mine && (live || (!r && date === today)) ? () => go({ k: 'repeat', meal: k }, `[data-repeat="${k}"], [data-repeat-new="${k}"]`) : null} onpick={edit} {ptarget}
            {fresh} onfresh={refresh} />
        {/each}
        <FoodCredits />
      {/if}
    {/if}
    </div>{/key}
  {/if}
</div>

<style>
  .food { padding-bottom: 8px; }
  .lv { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  /* a level slides in from the right (design.md "Navigation": one push motion, 240ms; as けんこう's goal level) */
  .lvl { animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  .rl { flex: 1; min-width: 0; text-align: center; font-size: var(--fs-talk); white-space: nowrap; }
</style>
