<script lang="ts">
  // The treats list's editor (one shared list) in a sheet. Each row: the name and the price in ベル (16px inputs:
  // iOS never zooms), and × to remove; ＋ adds a row; 保存 hands the cleaned list back (empty names and prices out of
  // range are dropped; the page saves it as the shared `pref`). やめる / closing the sheet drops the draft.
  //   <MenuEditor bind:open items={menu} onsave={(items) => …} />
  import { tick, untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import { cleanMenu, MENU_LIMITS, type Treat } from './shapes.ts';
  import { newMenuItemId } from '#lib/store/actions.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    open: boolean;
    items: Treat[];
    onsave: (items: Treat[]) => void;
  }
  let { open = $bindable(), items, onsave }: Props = $props();

  type Row = { id: string; label: string; bells: string };
  let rows = $state<Row[]>([]);
  let list: HTMLElement | undefined = $state();

  // A fresh draft each time the sheet opens.
  $effect(() => {
    if (!open) return;
    untrack(() => {
      rows = items.map((i) => ({ id: i.id, label: i.label, bells: String(i.bells) }));
    });
  });

  const cleaned = $derived(cleanMenu(rows));
  /** A row that would be dropped on save (a name without a price or the other way round) is flagged. */
  const bad = (r: Row) => (r.label.trim() !== '' || r.bells !== '') && !cleanMenu([r]).length;
  const shape = (xs: Treat[]) => JSON.stringify(xs.map((x) => [x.id, x.label, x.bells]));
  const changed = $derived(shape(cleaned) !== shape(items));
  const full = $derived(rows.length >= MENU_LIMITS.items);

  async function add() {
    if (full) return;
    rows = [...rows, { id: newMenuItemId(), label: '', bells: '' }];
    await tick();
    list?.querySelector<HTMLInputElement>('li:last-child input.lbl')?.focus();
  }
  function remove(i: number) {
    rows = rows.filter((_, k) => k !== i);
  }
  function save() {
    onsave(cleaned);
    open = false;
  }
  /** Digits only (a pasted 「1,500」 or full-width digits become 1500). */
  function digits(e: Event & { currentTarget: HTMLInputElement }, r: Row) {
    const v = e.currentTarget.value.normalize('NFKC').replace(/[^\d]/g, '').slice(0, 7);
    r.bells = v;
    if (e.currentTarget.value !== v) e.currentTarget.value = v;
  }
</script>

<Sheet bind:open label={t('menu.edit')} title={t('menu.edit')}>
  <p class="hint">{t('menu.editHint')}</p>
  <ul class="rows" bind:this={list}>
    {#each rows as r, i (r.id)}
      <li class="card row" class:bad={bad(r)}>
        <label class="f name">
          <span class="sr-only">{t('menu.field.name')}</span>
          <input class="lbl" type="text" data-sfx="none" bind:value={r.label} maxlength={MENU_LIMITS.label} placeholder={t('menu.field.name')}
            enterkeyhint="next" autocomplete="off" />
        </label>
        <label class="f price">
          <span class="sr-only">{t('menu.field.price')}</span>
          <input class="num" type="text" data-sfx="none" inputmode="numeric" pattern="[0-9]*" value={r.bells} oninput={(e) => digits(e, r)}
            placeholder="0" enterkeyhint="done" autocomplete="off" />
          <span class="unit" aria-hidden="true">{t('bells.unit')}</span>
        </label>
        <button type="button" class="rm" data-sfx="remove" aria-label={t('menu.remove', { label: r.label || t('menu.field.name') })} onclick={() => remove(i)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-close" /></svg>
        </button>
      </li>
    {/each}
  </ul>
  <button type="button" class="add-btn" data-sfx="open" onclick={add} aria-disabled={full}>＋ {t('menu.add')}</button>
  {#snippet footer()}
    <div class="acts">
      <button type="button" class="btn paper" data-sfx="back" onclick={() => (open = false)}>{t('kiroku.cancel')}</button>
      <button type="button" class="btn" data-sfx="confirm" onclick={save} aria-disabled={!changed}>{t('common.save')}</button>
    </div>
  {/snippet}
</Sheet>

<style>
  .hint { margin: 0 2px 12px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  /* the name and × on top, the price under the name (room for 7 digits + the unit at 320); minmax(0, …) so a long
     name never widens the sheet */
  .row { display: grid; grid-template-columns: minmax(0, 1fr) var(--hit); gap: 6px 8px; align-items: center; padding: 8px 6px 10px 10px; }
  .name { grid-column: 1; grid-row: 1; }
  .rm { grid-column: 2; grid-row: 1; }
  .price { grid-column: 1; grid-row: 2; max-width: 12em; }
  .row.bad { box-shadow: 0 var(--lip-h) 0 var(--lip), inset 0 0 0 2px var(--c-coral); }
  .f { position: relative; display: block; min-width: 0; }
  input {
    width: 100%; min-height: var(--hit); padding: 0 10px; border-radius: var(--r-chip); border: 0; box-sizing: border-box;
    font-size: var(--fs-input); font-weight: 700; color: var(--c-ink); background: var(--c-card);
    box-shadow: inset 0 0 0 2px var(--c-edge);
  }
  input:focus { outline: none; box-shadow: inset 0 0 0 3px var(--c-yuzu-lip); }
  input.num { font-family: var(--font-num); text-align: right; padding-right: 2.6em; font-variant-numeric: tabular-nums; }
  .unit { position: absolute; right: 8px; top: 50%; translate: 0 -50%; font-size: var(--fs-s); font-weight: 700; color: var(--c-ink-soft); pointer-events: none; }
  .rm {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: 50%; display: grid; place-items: center;
    background: transparent; color: var(--text-soft);
  }
  .rm svg { width: 18px; height: 18px; }
  .rm:active { background: color-mix(in srgb, var(--c-coral) 25%, transparent); }
  .add-btn { margin-top: 12px; }
  .acts { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }
</style>
