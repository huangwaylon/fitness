// マイレシピ's editing (Food.svelte's recipe level): the draft of mine it edits, kept here under the search and the
// amount it opens; its ingredients' trip (each with an id of its own while it's in the draft); save, remove, copy, log.
import { RECIPE, withHalf, type FoodSnap, type RepeatItem } from '#lib/contract/food.ts';
import { findFoods, portionsOf, type FoodDb, type Item } from '#lib/food/index.ts';
import { t } from '#lib/i18n/index.ts';
import type { Recipe } from '#lib/model/food.ts';
import { logRecipe, removeRecipe, saveRecipe } from '#lib/store/meals.ts';
import { count } from '#lib/sync/log.ts';
import type { LocalDate, Who } from '#lib/types.ts';
import { itemOf, recipeItem, type RecipeDraft } from './foodUi.ts';
import { servingOnly, weighItem } from './portions.ts';
import { held } from './dbHold.svelte.ts';
import { newKept, type LevelOf, type Levels, type Picked } from './levels.svelte.ts';

/** What the flows need of the meal log (Food.svelte). */
export interface FoodFlowEnv {
  levels: Levels;
  me(): Who;
  /** The day shown. */
  date(): LocalDate;
  recipes(): readonly Recipe[];
  /** A recipe's ingredients as it logs now (Food.svelte: their foods fetched, then resolved: fresh.ts resolveItems). */
  resolveForLog(id: string): Promise<RepeatItem[] | undefined>;
  /** A confirmation inside the sheet (`sad`: no pleased reaction). */
  said(key: string, vars?: Record<string, string>, sad?: boolean): void;
  /** A new entry logged (`id`; none: it failed): back to the meal's search, else the day. */
  logged(id: string | undefined): void;
  /** The search's field focused in the tap. */
  focusQ(): void;
  /** What a picked food logs as (portion label `u`). */
  snapOf(p: Picked, u: string | null): FoodSnap;
  /** A food as a row's ＋ takes it. */
  asItComes(item: Item, g?: number, u?: string, f?: FoodSnap): { p: Picked; gg: number; uu: string | null };
  /** An amount level for a logged snapshot, open at once, the catalog's item put in when it's in. */
  openSnap(l: LevelOf<'ritem'>, x: { g: number; f: FoodSnap }, focus: string): void;
}

export const mealName = (k: string): string => t(`food.meal.${k}`);

/** A weight to suggest for an ingredient of no known weight: the food data's best match by its name that has one
 *  (しおこんぶ → 塩昆布 大さじ1, 5 g), its name and default portion; null with no catalogue or none. */
export function weighHint(db: FoodDb | null, f: FoodSnap): { n: string; label: string; g: number } | null {
  if (!db) return null;
  const it = findFoods(db, f.n, 5).items.find((x) => !x.sv && x.portions?.length);
  const p = it && portionsOf(it)[0];
  return it && p ? { n: it.name, label: p.label, g: p.g } : null;
}

/** A recipe as its editor's draft. */
const draftOf = (r: Recipe): RecipeDraft => ({ n: r.n, sv: r.sv, it: r.it.map((x) => ({ ...x })), ...(r.cw === undefined ? {} : { cw: r.cw }) });

export class RecipeFlow {
  draft = $state<RecipeDraft>({ n: '', sv: 2, it: [] });
  /** The draft as last saved (null: a new one): ほぞん waits while nothing changed. */
  savedAs = $state<string | null>(null);
  readonly clean = $derived(this.savedAs !== null && this.savedAs === JSON.stringify(this.draft));
  /** The draft as it opened: changed, leaving it (its ‹, the sheet's ✕, backdrop or Esc) asks first. */
  #started = '';
  readonly #e: FoodFlowEnv;
  /** This trip's ingredients' ids (✕ takes out that one: an index would point at the next once a row before it is gone). */
  readonly #tripIds = new WeakMap<RepeatItem, string>();
  #tripN = 0;

  constructor(env: FoodFlowEnv) {
    this.#e = env;
  }

  get changed(): boolean {
    return this.#e.levels.has('recipe') && JSON.stringify(this.draft) !== this.#started;
  }
  /** Back to the recipe level (from its ingredient search or amount). */
  toRecipe(): void {
    this.#e.levels.backOver('recipe');
  }

  open(r: Recipe | null, focus = r ? '[data-amount-open]' : '[data-recipe-new]'): void {
    this.draft = r ? draftOf(r) : { n: '', sv: 2, it: [] };
    this.savedAs = r ? JSON.stringify(this.draft) : null;
    this.#started = JSON.stringify(this.draft);
    this.#e.levels.go({ k: 'recipe', id: r?.id ?? null, who: r?.who }, focus);
  }
  /** ＋ 材料を追加: the ingredient search, its field focused in the tap. */
  addItem(): void {
    this.#e.levels.go({ k: 'rsearch', from: this.draft.it.length, s: newKept() }, '[data-recipe-add]');
    this.#e.focusQ();
  }
  /** A new ingredient from the ingredient search (its amount's 追加, a custom food made for it) comes back to that
   *  search, its field focused, for the next (as a meal's trip); a changed one, to the recipe. */
  itemDone(l: LevelOf<'ritem'>, v: { g: number; u: string | null }): void {
    const x = { g: v.g, f: this.#snap(l, v.u) };
    if (l.i === undefined) this.draft.it.push(x);
    else this.draft.it[l.i] = x;
    const i = this.#e.levels.stack.findIndex((s) => s.k === 'rsearch');
    if (l.i !== undefined || i < 0) return this.toRecipe();
    const rs = this.#e.levels.stack[i];
    if (rs.k === 'rsearch') rs.s = newKept();
    this.#e.levels.backTo(i + 1, false);
    this.#e.focusQ();
  }
  /** A row's ＋ in the ingredient search: into the recipe as it comes, the search kept for the next. */
  itemNow(item: Item, g?: number, u?: string, f?: FoodSnap): void {
    if (this.draft.it.length >= RECIPE.items) return;
    const { p, gg, uu } = this.#e.asItComes(item, g, u, f);
    this.draft.it.push({ g: gg, f: this.#snap(p, uu) });
  }
  /** An ingredient's snapshot: a recent entry's without its スープ半分 (how that bowl was eaten, not the food). */
  #snap(p: Picked, u: string | null): FoodSnap {
    return withHalf(this.#e.snapOf(p, u), false);
  }
  #tripId(x: RepeatItem): string {
    let id = this.#tripIds.get(x);
    if (!id) this.#tripIds.set(x, (id = String(++this.#tripN)));
    return id;
  }
  /** This trip's ingredients (`from` on), each with its id. */
  tripOf(from: number): (RepeatItem & { id: string })[] {
    return this.draft.it.slice(from).map((x) => ({ id: this.#tripId(x), ...x }));
  }
  untrip(id: string): void {
    const i = this.draft.it.findIndex((x) => this.#tripIds.get(x) === id);
    if (i >= 0) this.draft.it.splice(i, 1);
  }
  /** An ingredient of no known weight given its weight a serving (weighItem); false when it can't take it. */
  weigh(i: number, w: number): boolean {
    const x = this.draft.it[i];
    const y = x && weighItem(x, w);
    if (!y) return false;
    this.draft.it[i] = y;
    return true;
  }
  /** The finished weight typed (none: cleared). */
  setCw(cw: number | undefined): void {
    if (cw === undefined) delete this.draft.cw;
    else this.draft.cw = cw;
  }
  /** The recipe open, changed meanwhile (its ingredients resolved once the catalogue came in, its owner's edit on the
   *  other phone): an untouched draft takes it. */
  sync(r: Recipe): void {
    const next = JSON.stringify(draftOf(r));
    if (JSON.stringify(this.draft) !== this.#started || next === this.#started) return;
    this.draft = draftOf(r);
    this.savedAs = this.#started = next;
  }
  /** 材料を最新の値にする (a change too big to take unasked: fresh.ts bigChange): those ingredients as they are now
   *  (`now` by index, null: as it is). A saved recipe with nothing else unsaved is saved at once (an edit of mine: a
   *  いつもの holding it then offers レシピの変更をいつものに反映); else the draft takes them, for its 保存. */
  refresh(id: string | null, now: readonly (RepeatItem | null)[]): void {
    const was = this.clean, d = this.draft;
    d.it = d.it.map((x, i) => now[i] ?? x);
    if (!id || !was) return;
    const res = saveRecipe({ id, n: d.n, sv: d.sv, it: d.it, cw: d.cw });
    if (!res.ok) return this.#e.said('food.rcp.saveFailed', {}, true);
    this.savedAs = this.#started = JSON.stringify(d);
    this.#e.said('food.rcp.freshDone');
  }
  itemRemove(i: number): void {
    this.draft.it.splice(i, 1);
    this.toRecipe();
  }
  editItem(i: number): void {
    const x = this.draft.it[i];
    const sv = servingOnly(x.f);
    this.#e.openSnap({ k: 'ritem', item: itemOf(x.f, held.db, x.g), ...(sv ? { sv, snap: x.f } : {}), g0: x.g, u0: x.f.u, i }, x, `[data-recipe-item="${i}"]`);
  }
  /** The meal a new recipe is being made from (its search under it), to log one serving into on 保存して追加. */
  madeFor(id: string | null): LevelOf<'search'>['meal'] | null {
    return id ? null : (this.#e.levels.find('search')?.meal ?? null);
  }
  save(id: string | null): void {
    const e = this.#e, d = this.draft;
    const res = saveRecipe({ id: id ?? undefined, n: d.n, sv: d.sv, it: d.it, cw: d.cw });
    // (refused: the editor stays, the draft kept)
    if (!res.ok) return e.said('food.rcp.saveFailed', {}, true);
    e.said('food.rcp.saved', { name: d.n.trim() });
    const meal = this.madeFor(id);
    const r = meal && res.id ? e.recipes().find((x) => x.id === res.id) : undefined;
    if (!meal || !r) return e.levels.backOver('search');
    // 保存して追加: one serving (1人前) logged too, back to the meal's search
    const one = recipeItem(r).portions![0];
    const lr = logRecipe({ recipeId: r.id, d: e.date(), m: meal, g: one.g, u: one.label });
    if (lr.ok) e.said('food.added', { meal: mealName(meal) }), count('act:food.add.recipe');
    e.logged(lr.id);
  }
  remove(id: string): void {
    if (removeRecipe(id).ok) this.#e.said('food.rcp.removed', { name: this.draft.n }, true);
    this.#e.levels.backOver('search');
  }
  /** Someone else's (or one deleted) → a recipe of mine with its name, servings and ingredients, opened in the editor. */
  copy(): void {
    const res = saveRecipe({ n: this.draft.n, sv: this.draft.sv, it: this.draft.it, cw: this.draft.cw });
    if (!res.ok || !res.id) return;
    this.savedAs = this.#started = JSON.stringify(this.draft);
    const lv = this.#e.levels;
    lv.stack = [...lv.stack.slice(0, -1), { k: 'recipe', id: res.id, who: this.#e.me() }];
    this.#e.said('food.rcp.copied');
  }
  #logging = false;
  /** A recipe logged as a meal of mine on the day shown (スープ半分 as chosen: a 豚汁's), its ingredients as they are
   *  now (resolveForLog; a second tap meanwhile: nothing). */
  async log(l: LevelOf<'rlog'>, v: { m: LevelOf<'rlog'>['meal']; g: number; u: string | null; half: boolean }): Promise<void> {
    if (this.#logging) return;
    this.#logging = true;
    const it = await this.#e.resolveForLog(l.r.id).finally(() => (this.#logging = false));
    const r = logRecipe({ recipeId: l.r.id, d: this.#e.date(), m: v.m, g: v.g, u: v.u ?? undefined, half: v.half, it });
    if (r.ok) this.#e.said('food.added', { meal: mealName(v.m) }), count('act:food.add.recipe');
    this.#e.logged(r.id);
  }
}
