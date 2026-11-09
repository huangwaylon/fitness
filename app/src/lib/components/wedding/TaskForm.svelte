<script lang="ts">
  // A task's form (けっこんしき's ＋ and 編集), the kit's form sheet (ui/Sheet: ✕ in its title bar, 保存 at its foot;
  // Enter in a field saves, the checklist's adds an item): the title, the category (the board's
  // list as chips; one no longer in it stays a chip while it's this task's; a tap on the picked one clears it), the
  // start day (optional, クリア) and the due day (必須), the checklist (renamed, removed and added here, all applied on
  // 保存), and in 編集 the task's 削除 (the banner's とりけす brings it back). ✕, the backdrop or Esc with anything changed
  // ask first (破棄する / 編集を続ける). Every missing field is said at once. A
  // task promoted from a checklist (it names a parent the board no longer holds) has no dates and no checklist.
  import { tick, untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import Chip from '../ui/Chip.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Icon from '../ui/Icon.svelte';
  import { board } from './board.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { WTASK_TITLE } from '#lib/contract/wedding.ts';
  import type { Fields, Task } from './view.ts';

  interface Props {
    open: boolean;
    /** null: a new task. */
    task: Task | null;
    cats: readonly string[];
    /** A new task saved: its id and title. */
    onadded: (id: string, title: string) => void;
    /** The task deleted. */
    onremoved: () => void;
  }
  let { open = $bindable(), task, cats, onadded, onremoved }: Props = $props();

  /** A checklist item as edited: a held one (`id`), or one to add. */
  interface Item { id?: string; title: string; was?: string; gone?: boolean }

  const fieldsOf = (x: Task | null): Fields => (x ? { title: x.title, cat: x.category, start: x.start, due: x.due } : { title: '', cat: '', start: '', due: '' });
  let draft = $state<Fields>(untrack(() => fieldsOf(task)));
  let items = $state<Item[]>(untrack(() => (task ? task.subtasks.map((s) => ({ id: s.id, title: s.title, was: s.title })) : [])));
  let sub = $state('');
  let subEl: HTMLInputElement | undefined = $state();
  let errors = $state({ title: false, due: false });
  const promoted = $derived(!!task?.parentId);
  const options = $derived(draft.cat && !cats.includes(draft.cat) ? [...cats, draft.cat] : cats);
  const uid = $props.id();
  /** Anything typed or changed since it opened: a close asks first (ui/Sheet's `dirty`). */
  const start = untrack(() => JSON.stringify([draft, items]));
  const unsaved = () => !!sub.trim() || JSON.stringify([draft, items]) !== start;

  async function addItem() {
    const title = sub.trim();
    if (!title) return;
    items.push({ title });
    sub = '';
    await tick();
    subEl?.focus({ preventScroll: true });
  }
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (save()) open = false;
  }
  function save(): boolean {
    const title = draft.title.trim();
    errors = { title: !title, due: !promoted && !draft.due };
    if (errors.title || errors.due) return false;
    const pending = sub.trim() ? [...items, { title: sub.trim() }] : items;
    if (!task) {
      const id = board.addTask({ title, cat: draft.cat, due: draft.due, ...(draft.start ? { start: draft.start } : {}) });
      if (!id) return true;
      for (const it of pending) if (!it.gone && it.title.trim()) board.addSub(id, it.title.trim());
      onadded(id, title);
      return true;
    }
    // ('' start: cleared)
    const patch: { title?: string; cat?: string; due?: string; start?: string } = {};
    if (title !== task.title) patch.title = title;
    if (draft.cat !== task.category) patch.cat = draft.cat;
    if (!promoted && draft.due !== task.due) patch.due = draft.due;
    if (!promoted && draft.start !== task.start) patch.start = draft.start;
    if (Object.keys(patch).length) board.editTask(task.id, patch);
    for (const it of pending) {
      const name = it.title.trim();
      if (it.id && it.gone) board.remove(it.id);
      else if (it.id && name && name !== it.was) board.editTask(it.id, { title: name });
      else if (!it.id && !it.gone && name) board.addSub(task.id, name);
    }
    return true;
  }
  function remove() {
    if (!task) return;
    const x = task;
    board.remove(x.id);
    open = false;
    toasts.show(t('wed.removed', { title: x.title }), 5000, { action: { label: t('common.undo'), run: () => void board.restore(x.id) } });
    onremoved();
  }
</script>

{#snippet footer()}
  <button type="submit" form="{uid}-f" class="btn" data-wed-save data-sfx="confirm">{t('common.save')}</button>
{/snippet}

<Sheet bind:open label={task ? t('wed.editTask') : t('wed.newTask')} title={task ? t('wed.editTask') : t('wed.newTask')} focusField {footer} dirty={unsaved}>
  <form class="form" id="{uid}-f" data-wed-form onsubmit={submit}>
    <label class="f">
      <span class="fl">{t('wed.field.title')}<b class="req">{t('wed.field.required')}</b></span>
      <input class="fld" type="text" enterkeyhint="done" maxlength={WTASK_TITLE} bind:value={draft.title} aria-required="true" data-wed-field="title" data-sfx="none"
        aria-invalid={errors.title || undefined} aria-describedby={errors.title ? `${uid}-t` : undefined} />
      {#if errors.title}<span class="err" id="{uid}-t" role="alert" data-wed-error="title">{t('wed.needTitle')}</span>{/if}
    </label>

    {#if !promoted}
      <div class="two">
        <label class="f">
          <span class="fl">{t('wed.field.start')}</span>
          <span class="pair">
            <input class="fld" type="date" bind:value={draft.start} data-wed-field="start" data-sfx="none" />
            {#if draft.start}<button type="button" class="chip s clear" data-sfx="tick" onclick={() => (draft.start = '')}>{t('wed.clear')}</button>{/if}
          </span>
        </label>
        <label class="f">
          <span class="fl">{t('wed.field.due')}<b class="req">{t('wed.field.required')}</b></span>
          <input class="fld" type="date" bind:value={draft.due} aria-required="true" data-wed-field="due" data-sfx="none" aria-invalid={errors.due || undefined}
            aria-describedby={errors.due ? `${uid}-d` : undefined} />
          {#if errors.due}<span class="err" id="{uid}-d" role="alert" data-wed-error="due">{t('wed.needDue')}</span>{/if}
        </label>
      </div>
    {/if}

    {#if options.length}
      <div class="f">
        <span class="fl" id="{uid}-c">{t('wed.field.cat')}</span>
        <div class="cats">
          <ChipRow label={t('wed.field.cat')}>
            {#each options as c (c)}
              <Chip label={c} selected={draft.cat === c} data-wed-cat-pick={c} onclick={() => (draft.cat = draft.cat === c ? '' : c)} />
            {/each}
          </ChipRow>
        </div>
      </div>
    {/if}

    {#if !promoted}
      <div class="f">
        <span class="fl">{t('wed.checklist')}</span>
        <ul class="card dense subs">
          {#each items as it, i (it.id ?? `n${i}`)}
            {#if !it.gone}
              <li class="row">
                <span class="ring" aria-hidden="true"></span>
                <input class="sname" type="text" bind:value={it.title} maxlength={WTASK_TITLE} enterkeyhint="done" aria-label={t('wed.renameSub', { title: it.was ?? it.title })}
                  data-wed-sub-name={it.id ?? ''} data-sfx="none" onkeydown={(e) => e.key === 'Enter' && e.preventDefault()} />
                <button type="button" class="rm" aria-label={t('wed.removeSub', { title: it.title })} data-wed-sub-remove={it.id ?? ''} data-sfx="tick"
                  onclick={() => (it.id ? (it.gone = true) : items.splice(i, 1))}><Icon name="close" size={18} /></button>
              </li>
            {/if}
          {/each}
          <li class="row add">
            <Icon name="plus" size={20} />
            <input class="sname" type="text" bind:this={subEl} bind:value={sub} placeholder={t('wed.addSub')} maxlength={WTASK_TITLE} enterkeyhint="done"
              aria-label={t('wed.addSub')} data-wed-sub-field data-sfx="none"
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addItem(); } }} />
            {#if sub.trim()}<button type="button" class="chip s" data-wed-sub-add data-sfx="confirm" onclick={addItem}>{t('wed.set.addCat')}</button>{/if}
          </li>
        </ul>
      </div>
    {/if}

    {#if task}
      <div class="card dense"><button type="button" class="row danger" data-wed-remove data-sfx="tick" onclick={remove}><Icon name="trash" size={20} />{t('wed.remove')}</button></div>
    {/if}
  </form>
</Sheet>

<style>
  .form { display: grid; gap: 14px; padding-bottom: 4px; }
  .f { display: grid; gap: 6px; min-width: 0; }
  .fl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .03em; padding-left: 4px; }
  .req { margin-left: 6px; color: var(--coral-text); }
  /* a field: the cream control with the edge, 16px (no iOS zoom) */
  .fld {
    width: 100%; min-width: 0; min-height: var(--hit); box-sizing: border-box; padding: 8px 12px; border: 0; border-radius: var(--r-btn);
    font: 400 var(--fs-input)/1.3 var(--font-body); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  .fld:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .fld[aria-invalid='true'] { box-shadow: inset 0 0 0 2px var(--c-coral); }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pair { display: flex; gap: 6px; align-items: center; min-width: 0; }
  .pair input { flex: 1; min-width: 0; }
  input[type='date'] { display: block; text-align: start; -webkit-appearance: none; appearance: none; }
  .err { font-size: var(--fs-s); color: var(--coral-text); padding-left: 4px; }
  .cats { margin: 0 calc(-1 * var(--side)); }
  .cats :global(.chip-row) { padding: 0 var(--side) 4px; }
  .subs { list-style: none; margin: 0; }
  .subs .row { padding: 0 4px 0 12px; }
  .ring { width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--edge); flex: none; }
  .sname { flex: 1; min-width: 0; min-height: var(--hit); border: 0; background: none; padding: 0; color: var(--text); font: 400 var(--fs-input)/1.3 var(--font-body); }
  .sname:focus { outline: none; }
  .sname::placeholder { color: var(--leaf-text); font-weight: 600; }
  .add { color: var(--leaf-text); }
  .add .chip { margin-right: 6px; }
  .rm { appearance: none; border: 0; background: none; cursor: pointer; width: var(--hit); height: var(--hit); display: grid; place-items: center; color: var(--text-soft); flex: none; }
  .danger { color: var(--coral-text); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  @media (max-width: 359px) { .two { grid-template-columns: 1fr; } }
</style>
