<script lang="ts">
  // ごはん (the meal log, docs/design.md "Gohan"): the HUD bowl's popup. Whose day (this phone's person first; the
  // partner, and the guest once it has logged or on its own phone: everyone sees everyone's meals), ‹ the day ›
  // and きょう (› to tomorrow too when a いつもの fills it: shown only), the summary card, then the four meals. On my own
  // day ＋ per meal → the search (its field focused in the tap: the iPhone's keyboard up) → the amount → ついか; an
  // entry → its amount at once (from its snapshot; the catalog's portions swapped in when they come) → ほぞん / けす
  // (けす with とりけす in its banner; a いつもの's entry: the day leaves the repeat only then, detachDay, so ‹ changes
  // nothing); the kcal goal at the summary's upper right (GoalEdit, in place); a meal's 🔁 → いつもの (its repeat, or a new one from the day's entries). Those push a
  // level (HealthSheet's title bar: its ‹; back where it was scrolled, the focus on what opened it, as けんこう's).
  // An editor's draft changed (マイレシピ, マイ食品, クイック): its ‹ and the sheet's ✕, backdrop and Esc ask first (ui/discard).
  // Anyone else's day is read-only. データの出典 at the foot. Whose day sits in the title bar (`lead`, HealthSheet's
  // NavBar; one pick with 健康's, kept for the session: whose.svelte.ts); under it the tabs (TABS, けんこう's group switch): きろく (the day,
  // on each opening) and グラフ (FoodChart: the kcal over a period, its range row with けんこう's period dropdown beside
  // きょう, and its Move card; switching whose keeps the tab, the period and the range). A meal's search offers everyone's
  // recipes (マイレシピ) and custom foods (マイ食品), and under its field レシピを つくる (FoodRecipe, the editor) and 食品を
  // つくる (FoodCustom, whose ほぞん goes on to the amount for the new food); a recipe's or custom food's amount opens it
  // (mine to edit, anyone else's to copy), as does my entry of a recipe's amount (レシピを見る); on anyone else's day an
  // entry of a recipe still there opens it read-only (its ingredients; コピーして編集 only, no ついか there). A recipe's
  // ingredient search offers the custom foods and 食品を つくる too.
  // Several foods a trip: a new entry logged from a meal's search (its amount's ついか, a row's own ＋, a recipe's or a
  // custom food's) comes back to that search, listed at its top (each with ✕), its field focused; おわり ends the trip.
  // クイック (the search's ⚡, or a kcal typed): kcal and what else is known as one entry (FoodCustom `quick`), no food saved.
  // Here the levels' router; the stack in levels.svelte.ts, the recipe and custom food editors' drafts and buttons in
  // recipeFlow / customFlow.svelte.ts.
  // Kept mounted between openings (HealthSheet's ごはん tab, Sheet's `keep`): `open` false (closed, or 健康's tab shown) resets what an opening resets (reset()).
  import '#lib/i18n/food.ts'; // the meal log's strings, loaded with it
  import '#lib/i18n/kenkou.ts'; // けんこう's: the period dropdown
  import { flushSync, untrack, type Snippet } from 'svelte';
  import type { LocalDate, Who } from '#lib/types.ts';
  import { customSnap, MEALS, newFoodId, RECIPE, type FoodEntry, type FoodSnap, type Meal } from '#lib/contract/food.ts';
  import { copySources, customs, foodDay, foodEntries, foodGoals, recipes, repeatOn, repeats, type CopySource } from '#lib/model/food.ts';
  import { mealProteinTarget } from '#lib/model/profile.ts';
  import {
    copyMeal, detachDay, editFood, logCustom, logFood, refreshFood, removeFood, startRepeat, stopRepeat, updateRepeat
  } from '#lib/store/meals.ts';
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
  import { itemsKcal, portionsOf, toSnap, type FoodDb, type Item } from '#lib/food/index.ts';
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
  import { askDiscard, guardForm } from '../ui/discard.svelte.ts';
  import { pickWhose, whose } from '../health/whose.svelte.ts';
  import { DAYS, inState, itemOf, recentOf, recipeItem, recipeOfEntry, recipeServing, sameItems } from './foodUi.ts';
  import { portionLabel, servingOnly } from './portions.ts';
  import { customItem, quickDraft, quickSnap, type CustomDraft } from './drafts.ts';
  import { foodDb, foodDbNow, foodDbSoon, holdFoodDb, whenFoodDb } from './dbHold.ts';
  import { Levels, type Level, type Picked } from './levels.svelte.ts';
  import { mealName, RecipeFlow, type FoodFlowEnv } from './recipeFlow.svelte.ts';
  import { CustomFlow } from './customFlow.svelte.ts';

  let { title = $bindable(''), back = $bindable(null), lead = $bindable(null), open = true }: {
    title?: string; back?: (() => void) | null; lead?: Snippet | null; open?: boolean
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

  const who = $derived<Who>(whose.who && order.includes(whose.who) ? whose.who : me);
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
  const goals = $derived(foodGoals(m, who));
  /** A meal's protein to aim for: a third of the day's (profile.ts mealProteinTarget). */
  const ptarget = $derived(mealProteinTarget(goals.p));
  const byMeal = (k: Meal) => day?.entries.filter((e) => e.m === k) ?? [];
  const myEntries = $derived(m ? foodEntries(m.state, me) : []);
  const recent = $derived(recentOf(myEntries));
  /** よく行く店's window: my last 30 days. */
  const since = $derived(today ? addDays(today, -30) : '');
  /** My repeat of a meal still going (the one to manage; an ended one only fills its days). */
  const liveRepeat = (k: Meal) => (m ? (repeats(m.state, me).find((r) => r.m === k && (!r.to || r.to > today)) ?? null) : null);

  let root: HTMLElement | undefined = $state();
  let scroller: Element | null = null;
  const levels = new Levels({ scroller: () => (scroller ??= root?.closest('[data-food-sheet]') ?? null), root: () => root, leave });
  const top = $derived(levels.top);
  $effect(() => {
    title = !top ? '' : top.k === 'repeat' ? t('food.rep.title', { meal: t(`food.meal.${top.meal}`) })
      : top.k === 'recipe' ? t(top.id ? 'food.rcp.title' : 'food.rcp.new') : top.k === 'rsearch' ? t('food.rcp.addItem')
      : top.k === 'ritem' ? t('food.rcp.item')
      : top.k === 'custom' ? t(top.id ? 'food.my.head' : 'food.my.newTitle') : top.k === 'quick' ? t('food.quick.title') : t(`food.meal.${top.meal}`);
    back = top ? up : null;
    lead = !top ? whoPill : null;
  });
  // (unmounted, its sheet let go: HealthSheet's bound ‹ and lead let go of too, else they hold this component, its
  // catalog among it)
  $effect(() => () => void ((back = null), (lead = null)));
  const go = (l: Level, focus: string | null = null) => levels.go(l, focus);
  /** A level left by hand: its banner goes with it (its とりけす would undo what is no longer on screen). One shown by
   *  what moved the level (追加しました, then back to the search) stays. */
  function leave() {
    if (toasts.current && !toasts.current.code) toasts.dismiss();
  }
  function up() {
    const pop = () => {
      cue('back');
      leave();
      levels.backTo(levels.stack.length - 1);
    };
    if (top && (top.k === 'recipe' || top.k === 'custom' || top.k === 'quick') && changed(top.k)) ask(pop);
    else pop();
  }
  const home = () => levels.backTo(0);
  /** データの出典 opened (closed at each opening). */
  let credits = $state(false);
  /** The sheet closed (this kept mounted, not drawn): the next opening as a fresh one, on きろく, today, the day (no
   *  level, so no search, amount or editor), 1週 for グラフ, データの出典 closed; whose day and くわしく are the session's. */
  function reset() {
    tab = 'log';
    period = 'week';
    picked_d = null;
    levels.reset();
    credits = false;
  }
  $effect.pre(() => {
    if (!open) untrack(reset);
  });

  function setWho(w: Who) {
    if (w === who || !order.includes(w)) return;
    cue('tick');
    pickWhose(w);
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
    const i = levels.stack.findIndex((l) => l.k === 'search');
    const l = levels.stack[i];
    if (!l || l.k !== 'search') return home();
    if (id) l.added = [...l.added, id];
    levels.backTo(i + 1);
    focusQ();
  }
  /** This trip's entries, in the order added (one taken back is gone). */
  function addedOf(ids: readonly string[]): FoodEntry[] {
    const mine = m ? foodEntries(m.state, me) : [];
    return ids.map((id) => mine.find((e) => e.id === id)).filter((e): e is FoodEntry => !!e);
  }
  /** A row's own ＋ (one tap, no amount): its default portion, or a recent one's amount as I had it. */
  function quick(item: Item, meal: Meal, g?: number, u?: string, f?: FoodSnap) {
    const { p, gg, uu } = asItComes(item, g, u, f);
    tripLog(p, meal, gg, uu);
  }
  /** A picked food logged as a new entry of mine (a custom food still there afresh, by logCustom). */
  const logPicked = (p: Picked, meal: Meal, g: number, u: string | null) =>
    p.cid ? logCustom({ customId: p.cid, d: date, m: meal, g, u: u ?? undefined }) : logFood({ d: date, m: meal, g, f: snapOf(p, u) });
  /** Logged from the search itself (a row's ＋, a row opened in place): its banner, and on this trip's list. */
  function tripLog(p: Picked, meal: Meal, g: number, u: string | null) {
    const r = logPicked(p, meal, g, u);
    if (r.ok && r.id) {
      said('food.added', { meal: t(`food.meal.${meal}`) });
      const l = top;
      if (l?.k === 'search') l.added = [...l.added, r.id];
    }
  }
  /** A food row of a meal's search opened in place (FoodOpen): what it logs as, its 追加 (the state set kept: `v.item`),
   *  and くわしく (the amount level at what was set). */
  const inlineOf = (meal: Meal) => ({
    of: (item: Item, f?: FoodSnap) => {
      const p = pickOf(item, f);
      return { item: p.item, serving: !!p.sv, swap: !(p.cid || p.snap) };
    },
    add: (item: Item, f: FoodSnap | undefined, v: { item: Item; g: number; u: string | null }) => tripLog({ ...pickOf(item, f), item: v.item }, meal, v.g, v.u),
    more: (item: Item, f: FoodSnap | undefined, v: { item: Item; g: number; u: string | null }) =>
      go({ k: 'amount', meal, ...pickOf(item, f), item: v.item, g0: v.g, u0: v.u ?? undefined })
  });
  /** A food as a row's ＋ takes it: its default portion (a serving's for one with no weight), or a recent one's amount. */
  function asItComes(item: Item, g?: number, u?: string, f?: FoodSnap) {
    const p = pickOf(item, f);
    const d = g === undefined ? portionsOf(p.item)[0] : null;
    return { p, gg: d ? d.g : g!, uu: d ? portionLabel(d, 1) : (u ?? null) };
  }
  // ---- クイック: one entry of kcal (and what else is known), no food saved (drafts.ts quickSnap: an `sv` snapshot)
  let qdraft = $state<CustomDraft>(quickDraft());
  /** The quick form as it opened; each editor's draft changed, leaving it (its ‹, the sheet's ✕, backdrop or Esc) asks
   *  first. */
  let qstarted = '';
  const changed = (k: 'recipe' | 'custom' | 'quick') =>
    k === 'recipe' ? rf.changed : k === 'custom' ? cf.changed : levels.has('quick') && JSON.stringify(qdraft) !== qstarted;
  guardForm(() => changed('recipe') || changed('custom') || changed('quick'));
  const ask = askDiscard();
  /** The quick form, its kcal field focused in the tap (`k`: a kcal typed in the search). */
  function openQuick(meal: Meal, k?: number) {
    qdraft = quickDraft(k === undefined ? '' : String(k));
    qstarted = JSON.stringify(qdraft);
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
  function unadd(id: string) {
    if (removeFood(id).ok) cue('undo');
  }

  function add(item: Item, meal: Meal, g0?: number, u0?: string, f?: FoodSnap) {
    go({ k: 'amount', meal, ...pickOf(item, f), g0, u0 });
  }
  /** A food picked (a catalog item, a recent entry's food `f`, a custom food as customItem): a custom food still there
   *  as it is now, logged by logCustom; else an `sv` snapshot kept as logged (its values per serving); a catalog item by
   *  the serving (`sv`: a chain menu's) as one. */
  function pickOf(item: Item, f?: FoodSnap): Picked {
    const c = item.id.startsWith('custom:') ? allCustoms.find((x) => `custom:${x.id}` === item.id) : undefined;
    if (c) return { item: customItem(c), cid: c.id, sv: c.g === undefined };
    if (f && servingOnly(f)) return { item, sv: true, snap: f };
    const it = inState(foodDbNow(), item);
    return { item: it, sv: !!it.sv };
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
    const lv = levels.top;
    foodDb().then((db) => {
      if (lv && 'item' in lv && levels.stack.includes(lv)) lv.item = itemOf(x.f, db, x.g);
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
    const r = logPicked(l, v.m, v.g, v.u);
    if (r.ok) said('food.added', { meal: t(`food.meal.${v.m}`) });
    logged(r.id);
  }
  /** My meal's copies (きのうと おなじ, 〇〇と おなじ: model/food.ts copySources), on my day while it is empty. */
  function copiesOf(meal: Meal) {
    if (!mine || !m || byMeal(meal).length) return [];
    return copySources(m.state, me, order, date, meal).map((src) => ({
      key: src.who === me ? 'prev' : src.who,
      label: src.who !== me ? t('food.copy.of', { name: names[src.who] }) : t(date === today ? 'food.copy.yesterday' : 'food.copy.prev'),
      meta: t('food.copy.meta', { n: src.items.length, k: formatNum(itemsKcal(src.items)) }),
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

  // ---- マイレシピ and マイ食品: each editor's draft and what its buttons do (recipeFlow, customFlow)
  const allRecipes = $derived(m ? recipes(m.state) : []);
  const recipeById = $derived(new Map(allRecipes.map((r) => [r.id, r])));
  const allCustoms = $derived(m ? customs(m.state) : []);
  const ownerOf = (who: Who) => ({ who, name: names[who], villager: villagerOf(who) });
  const env: FoodFlowEnv = {
    levels, me: () => me, date: () => date, recipes: () => allRecipes, said: (k, v, sad) => void said(k, v, sad), logged, focusQ, snapOf, asItComes, openSnap
  };
  const rf = new RecipeFlow(env), cf = new CustomFlow(env);

  // ---- 最新の値にする (fresh.ts): my own day's entries (not a いつもの's) whose food has changed since they were logged
  // (the data fixed, the recipe or custom food edited). The catalogue comes once a day with an entry of it shows, at
  // idle after the open (dbHold.ts foodDbSoon: never on the open's path; it is the search's data too, and the rows'
  // tiles); the products when they come (only with a product logged that day, or a search). Never updated by itself.
  let catalog = $state.raw<FoodDb | null>(foodDbNow());
  $effect(() => holdFoodDb());
  let catalogRev = $state(0);
  $effect(() => (catalog ? undefined : whenFoodDb((db) => {
    catalog = db;
    void db.more.then(() => catalogRev++);
  })));
  // (the products and chain menus only for a day with one of them logged: never for the open alone, 2.7 MB)
  $effect(() => {
    if (catalog && day?.entries.some((e) => /^(off|kal):/.test(e.f.id))) void catalog.wantMore();
  });
  // (only while open: a quick close cancels it, as an unmount did; the next opening asks again until it is in)
  $effect(() => {
    if (!open || catalog || !day?.entries.some((e) => !/^(recipe|custom):/.test(e.f.id))) return;
    return foodDbSoon();
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
    {#key levels.stack.length}<div class="lv" class:lvl={!!top}>
    {#if top?.k === 'search'}
      {@const meal = top.meal}
      <FoodSearch {recent} mine={myEntries} {since} onpick={(item, g, u, f) => add(item, meal, g, u, f)} recipes={allRecipes} {names} onrecipe={(r) => go({ k: 'rlog', r, meal })}
        onnewrecipe={() => rf.open(null)} customs={allCustoms} oncustom={(c) => go({ k: 'amount', meal, ...pickOf(customItem(c)) })}
        oncreate={(n) => cf.open(null, { meal }, '[data-custom-new]', n)} onquick={(item, g, u, f) => quick(item, meal, g, u, f)}
        oncustomquick={(c) => quick(customItem(c), meal)} added={addedOf(top.added)} onunadd={unadd} onfinish={home}
        onquicknew={(k) => openQuick(meal, k)} onquicklog={(k) => quickNow(meal, k)} inline={inlineOf(meal)} />
    {:else if top?.k === 'quick'}
      {@const l = top}
      <FoodCustom bind:draft={qdraft} quick onsave={() => quickDone(l)} />
    {:else if top?.k === 'amount'}
      {@const l = top}
      {#key l}
        {@const c = !l.entry && l.cid ? allCustoms.find((x) => x.id === l.cid) : undefined}
        {@const r = l.entry && recipeOfEntry(recipeById, l.entry)}
        <FoodAmount item={l.item} meal={l.meal} g0={l.g0} u0={l.u0} serving={!!l.sv} editing={!!l.entry} once={!!l.entry?.rep} ondone={(v) => done(l, v)} onremove={() => l.entry && remove(l.entry)}
          onitem={l.cid || l.snap ? undefined : (it) => (l.item = it)}
          open={c ? { label: t('food.my.open'), run: () => cf.open(c, null, '[data-amount-open]') } : r ? { label: t('food.rcp.open'), run: () => rf.open(r) } : null} />
      {/key}
    {:else if top?.k === 'recipe'}
      <!-- (whose and whether it's still there from what opened it: one deleted meanwhile stays read-only, never an editor) -->
      {@const id = top.id}
      {@const theirs = !!top.who && top.who !== me}
      {@const gone = !!id && !recipeById.has(id)}
      {#key id}
        <FoodRecipe bind:draft={rf.draft} owner={theirs ? ownerOf(top.who!) : null} saved={!!id && !theirs && !gone} {gone} clean={rf.clean} onadd={() => rf.addItem()}
          andLog={!!rf.madeFor(id)} onitem={(i) => rf.editItem(i)} onsave={() => rf.save(id)} onremove={() => id && rf.remove(id)} oncopy={() => rf.copy()}
          onlog={levels.stack.at(-2)?.k === 'rlog' ? up : undefined} />
      {/key}
    {:else if top?.k === 'rsearch'}
      {@const room = rf.draft.it.length < RECIPE.items}
      <FoodSearch {recent} onpick={(item, g, u, f) => go({ k: 'ritem', ...pickOf(item, f), g0: g, u0: u })} {names} recipes={allRecipes} customs={allCustoms}
        oncustom={(c) => go({ k: 'ritem', ...pickOf(customItem(c)) })} oncreate={(n) => cf.open(null, { ingredient: true }, '[data-custom-new]', n)}
        onquick={room ? (item, g, u, f) => rf.itemNow(item, g, u, f) : undefined} oncustomquick={room ? (c) => rf.itemNow(customItem(c)) : undefined}
        added={rf.tripOf(top.from)} onunadd={(id) => rf.untrip(id)} addedHead="food.rcp.addedHead" onfinish={() => rf.toRecipe()} />
    {:else if top?.k === 'custom'}
      {@const l = top}
      {@const theirs = !!l.who && l.who !== me}
      {@const gone = !!l.id && !allCustoms.some((x) => x.id === l.id)}
      {#key l.id}
        <FoodCustom bind:draft={cf.draft} owner={theirs ? ownerOf(l.who!) : null} saved={!!l.id && !theirs && !gone} {gone} clean={cf.clean} onsave={() => cf.save(l)}
          andLog={!l.id && !!l.then && 'meal' in l.then}
          onremove={() => l.id && cf.remove(l.id)} oncopy={() => cf.copy(l)}
          onlog={up} />
      {/key}
    {:else if top?.k === 'ritem'}
      {@const l = top}
      {#key l}
        <FoodAmount item={l.item} meal="b" g0={l.g0} u0={l.u0} serving={!!l.sv} editing={l.i !== undefined} pick ondone={(v) => rf.itemDone(l, v)}
          onitem={l.cid || l.snap ? undefined : (it) => (l.item = it)}
          onremove={() => l.i !== undefined && rf.itemRemove(l.i)} />
      {/key}
    {:else if top?.k === 'rlog'}
      {@const l = top}
      {#key l}
        <FoodAmount item={recipeItem(l.r)} meal={l.meal} serving={recipeServing(l.r)} ondone={(v) => rf.log(l, v)}
          open={{ label: t('food.rcp.open'), run: () => rf.open(allRecipes.find((x) => x.id === l.r.id) ?? l.r) }} />
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
      <div class="sel"><Segmented items={TABS.map((id) => ({ id, label: t(`food.tab.${id}`), art: FOOD_TAB_ART[id] }))} value={tab} label={t('food.tabs')} attr="tab" onpick={(id) => (tab = id)} /></div>
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
            {fresh} onfresh={refresh} recipes={recipeById} onrecipe={mine ? undefined : (r, e) => rf.open(r, `[data-entry="${e.id}"]`)} />
        {/each}
        <FoodCredits bind:open={credits} />
      {/if}
    {/if}
    </div>{/key}
  {/if}
</div>

<style>
  /* the sheet's height, so a level can put its actions at the screen's foot (the amount: .lv:has(> .amt) stretches it) */
  .food { padding-bottom: 8px; display: flex; flex-direction: column; min-height: 100%; }
  .lv { flex: 1 0 auto; display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: var(--kk-gap); }
  /* きろく · グラフ: the row as tall as 健康's (its period pill 44), so both tabs' range rows sit at one height */
  .sel { display: grid; align-items: center; min-height: var(--kk-row); }
  .lv:has(> :global(.amt)) { align-content: stretch; }
  /* a level slides in from the right (design.md "Navigation": one push motion, 240ms; as けんこう's goal level) */
  .lvl { animation: if-lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  .rl { flex: 1; min-width: 0; text-align: center; font-size: var(--fs-talk); white-space: nowrap; }
</style>
