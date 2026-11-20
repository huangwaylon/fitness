// マイ食品's editing (Food.svelte's custom level): the draft it edits, kept here as the recipe's; ほぞん goes on where it
// came from (Then: a meal's amount or its one serving logged, a recipe's ingredient, or back to the search).
import { customGrams, type FoodCustom } from '#lib/contract/food.ts';
import { logCustom, removeCustom, saveCustom } from '#lib/store/meals.ts';
import { count } from '#lib/sync/log.ts';
import { customDraft, customItem, customOf, type CustomDraft } from './drafts.ts';
import type { LevelOf, Picked, Then } from './levels.svelte.ts';
import { addedTo, type FoodFlowEnv } from './recipeFlow.svelte.ts';
import { drainPhotos, keepPhoto } from './customPics.svelte.ts';

export class CustomFlow {
  draft = $state<CustomDraft>(customDraft(null));
  /** Its picture (CustomOp `img`, `ig` an illustration's), kept across edits as `jan` is; `blob` a photo just made here
   *  (FoodCustom's), kept with the food at 保存 (customPics keepPhoto), never on its own. */
  photo = $state<{ img: string; ig?: true; blob?: Blob } | null>(null);
  /** What 保存 compares: the fields and the picture. */
  #key = (): string => `${JSON.stringify(this.draft)}|${this.photo?.img ?? ''}`;
  /** The draft as last saved (null: a new one): ほぞん waits while nothing changed. */
  savedAs = $state<string | null>(null);
  readonly clean = $derived(this.savedAs !== null && this.savedAs === this.#key());
  #started = '';
  /** The barcode of the product the food being edited was made from (openDraft's, or its own: CustomOp `jan`). */
  #jan = $state<string | undefined>();
  readonly #e: FoodFlowEnv;

  constructor(env: FoodFlowEnv) {
    this.#e = env;
  }

  get changed(): boolean {
    return this.#e.levels.has('custom') && this.#key() !== this.#started;
  }

  open(c: FoodCustom | null, then: Then, focus: string, name = ''): void {
    this.draft = customDraft(c, name);
    this.#jan = c?.jan;
    this.photo = c?.img ? { img: c.img, ...(c.ig ? { ig: true as const } : {}) } : null;
    this.savedAs = c ? this.#key() : null;
    this.#started = this.#key();
    this.#e.levels.go({ k: 'custom', id: c?.id ?? null, then, who: c?.who }, focus);
  }
  /** A new custom food from a draft made elsewhere (a product's amount: drafts.ts draftOf; `jan` its barcode, kept
   *  with it), opened untouched (its ✕ asks nothing till a field changes). */
  openDraft(d: CustomDraft, then: Then, focus: string, jan?: string): void {
    this.draft = d;
    this.#jan = jan;
    this.photo = null;
    this.savedAs = null;
    this.#started = this.#key();
    this.#e.levels.go({ k: 'custom', id: null, then }, focus);
  }
  /** The scanner's この商品を登録 (a code found nowhere): a new custom food with that barcode, in the scanner's place (its ‹
   *  back to the search), its name field focused in the tap; saved, the next scan of the code finds it (byJan). */
  openScanned(code: string, then: Then): void {
    this.draft = customDraft(null);
    this.#jan = code;
    this.photo = null;
    this.savedAs = null;
    this.#started = this.#key();
    this.#e.levels.swap({ k: 'custom', id: null, then });
  }
  /** The barcode the food being edited keeps (shown under its name). */
  get jan(): string | undefined {
    return this.#jan;
  }
  /** A photo made in the editor (photo.ts makePhoto), or none (写真を削除): kept at 保存. */
  setPhoto(p: { blob: Blob; id: string } | null): void {
    this.photo = p ? { img: p.id, blob: p.blob } : null;
    count(p ? 'act:food.photo.set' : 'act:food.photo.remove');
  }
  /** 保存; true: saved. */
  save(l: LevelOf<'custom'>): boolean {
    const e = this.#e, v = customOf(this.draft);
    const ph = this.photo;
    const res = saveCustom({ id: l.id ?? undefined, ...v, jan: this.#jan, img: ph?.img, ig: ph?.ig });
    if (!res.ok || !res.id) return false;
    if (ph?.blob) {
      // (drawn from its bytes at once; uploaded after: customPics drainPhotos)
      void keepPhoto(ph.img, ph.blob).then(drainPhotos);
      this.photo = { img: ph.img };
    }
    e.said('food.my.saved', { name: v.n });
    if (!l.then) return e.levels.backOver('search'), true;
    const c: FoodCustom = { ...v, id: res.id, at: 0, who: e.me() };
    if ('meal' in l.then && !l.id) {
      // ほぞんして ついか: one serving logged too, back to the meal's search
      const r = logCustom({ customId: res.id, d: e.date(), m: l.then.meal, g: customGrams(c), u: c.u });
      if (r.ok) e.said(...addedTo(l.then.meal)), count('act:food.add.custom');
      return e.logged(r.id), true;
    }
    const p: Picked = { item: customItem(c), cid: res.id, sv: c.g === undefined };
    e.levels.swap('meal' in l.then ? { k: 'amount', meal: l.then.meal, ...p } : { k: 'ritem', ...p });
    return true;
  }
  remove(id: string): void {
    if (removeCustom(id).ok) this.#e.said('food.my.removed', { name: this.draft.n }, true);
    this.#e.levels.backOver('search');
  }
  /** Someone else's (or one deleted) → a custom food of mine with the same values, opened in the editor. */
  copy(l: LevelOf<'custom'>): void {
    // (the same picture: the same bytes, nothing new to upload)
    const res = saveCustom({ ...customOf(this.draft), jan: this.#jan, img: this.photo?.img, ig: this.photo?.ig });
    if (!res.ok || !res.id) return;
    this.savedAs = this.#started = this.#key();
    this.#e.levels.swap({ k: 'custom', id: res.id, then: l.then, who: this.#e.me() });
    this.#e.said('food.my.copied');
  }
}
