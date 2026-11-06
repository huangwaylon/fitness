<script lang="ts">
  // A task's form (けっこんしき's ＋ and 編集), a BottomSheet (キャンセル / 保存): the title, the category (the board's
  // list as chips; one no longer in it stays a chip while it's this task's; a tap on the picked one clears it), the
  // start day (optional, クリア) and the due day (必須), the checklist (renamed, removed and added here, all applied on
  // 保存), and in 編集 the task's 削除 (the banner's とりけす brings it back). Every missing field is said at once. A
  // task promoted from a checklist (it names a parent the board no longer holds) has no dates and no checklist.
  import { tick } from 'svelte';
  import BottomSheet from '../quiet/BottomSheet.svelte';
  import Chip from '../quiet/Chip.svelte';
  import ChipRow from '../quiet/ChipRow.svelte';
  import Icon from '../quiet/Icon.svelte';
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
  // svelte-ignore state_referenced_locally
  let draft = $state<Fields>(fieldsOf(task));
  // svelte-ignore state_referenced_locally
  let items = $state<Item[]>(task ? task.subtasks.map((s) => ({ id: s.id, title: s.title, was: s.title })) : []);
  let sub = $state('');
  let subEl: HTMLInputElement | undefined = $state();
  let errors = $state({ title: false, due: false });
  const promoted = $derived(!!task?.parentId);
  const options = $derived(draft.cat && !cats.includes(draft.cat) ? [...cats, draft.cat] : cats);
  const uid = $props.id();

  async function addItem() {
    const title = sub.trim();
    if (!title) return;
    items.push({ title });
    sub = '';
    await tick();
    subEl?.focus({ preventScroll: true });
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

<BottomSheet bind:open title={task ? t('wed.editTask') : t('wed.newTask')} onsave={save}>
  <div class="form" data-wed-form>
    <label class="f">
      <span class="fl">{t('wed.field.title')}<b class="req">{t('wed.field.required')}</b></span>
      <input class="q-field" type="text" enterkeyhint="done" maxlength={WTASK_TITLE} bind:value={draft.title} data-wed-field="title" data-sfx="none"
        aria-invalid={errors.title || undefined} aria-describedby={errors.title ? `${uid}-t` : undefined} />
      {#if errors.title}<span class="err" id="{uid}-t" role="alert" data-wed-error="title">{t('wed.needTitle')}</span>{/if}
    </label>

    {#if !promoted}
      <div class="two">
        <label class="f">
          <span class="fl">{t('wed.field.start')}</span>
          <span class="row">
            <input class="q-field" type="date" bind:value={draft.start} data-wed-field="start" data-sfx="none" />
            {#if draft.start}<button type="button" class="q-btn text clear" data-sfx="tick" onclick={() => (draft.start = '')}>{t('wed.clear')}</button>{/if}
          </span>
        </label>
        <label class="f">
          <span class="fl">{t('wed.field.due')}<b class="req">{t('wed.field.required')}</b></span>
          <input class="q-field" type="date" bind:value={draft.due} required data-wed-field="due" data-sfx="none" aria-invalid={errors.due || undefined}
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
        <ul class="q-card subs">
          {#each items as it, i (it.id ?? `n${i}`)}
            {#if !it.gone}
              <li class="q-row">
                <span class="ring" aria-hidden="true"></span>
                <input class="sname" type="text" bind:value={it.title} maxlength={WTASK_TITLE} enterkeyhint="done" aria-label={t('wed.renameSub', { title: it.was ?? it.title })}
                  data-wed-sub-name={it.id ?? ''} data-sfx="none" onkeydown={(e) => e.key === 'Enter' && e.preventDefault()} />
                <button type="button" class="rm" aria-label={t('wed.removeSub', { title: it.title })} data-wed-sub-remove={it.id ?? ''} data-sfx="tick"
                  onclick={() => (it.id ? (it.gone = true) : items.splice(i, 1))}><Icon name="close" size={16} /></button>
              </li>
            {/if}
          {/each}
          <li class="q-row add">
            <Icon name="plus" size={18} />
            <input class="sname" type="text" bind:this={subEl} bind:value={sub} placeholder={t('wed.addSub')} maxlength={WTASK_TITLE} enterkeyhint="done"
              aria-label={t('wed.addSub')} data-wed-sub-field data-sfx="none"
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addItem(); } }} />
            {#if sub.trim()}<button type="button" class="q-btn text" data-wed-sub-add data-sfx="confirm" onclick={addItem}>{t('wed.set.addCat')}</button>{/if}
          </li>
        </ul>
      </div>
    {/if}

    {#if task}
      <button type="button" class="q-btn danger" data-wed-remove data-sfx="tick" onclick={remove}><Icon name="trash" size={16} />{t('wed.remove')}</button>
    {/if}
  </div>
</BottomSheet>

<style>
  .form { display: grid; gap: 14px; }
  .f { display: grid; gap: 6px; min-width: 0; }
  .fl { font: var(--q-w-b) var(--q-fs-s)/1.2 var(--q-font); color: var(--q-muted); letter-spacing: .03em; padding-left: 2px; }
  .req { margin-left: 6px; font-weight: var(--q-w); color: var(--q-coral); }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .row { display: flex; gap: 4px; align-items: center; min-width: 0; }
  .row input { flex: 1; min-width: 0; }
  .clear { flex: none; padding: 0 6px; }
  input[type='date'] { display: block; text-align: start; -webkit-appearance: none; appearance: none; min-width: 0; }
  :global(.q-field[aria-invalid='true']) { border-color: var(--q-coral) !important; }
  .err { font-size: var(--q-fs-s); color: var(--q-coral); padding-left: 2px; }
  .cats { margin: -6px -16px 0; }
  .subs { list-style: none; margin: 0; padding: 0; }
  .subs .q-row { padding: 0 6px 0 14px; gap: 10px; }
  .ring { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--q-faint); box-sizing: border-box; flex: none; }
  .sname {
    flex: 1; min-width: 0; min-height: 44px; border: 0; background: none; padding: 0; color: var(--q-ink);
    font: 400 16px/1.3 var(--q-font);
  }
  .sname:focus { outline: none; }
  .sname::placeholder { color: var(--q-accent-ink); font-weight: var(--q-w-b); }
  .add { color: var(--q-accent-ink); }
  .rm { appearance: none; border: 0; background: none; cursor: pointer; width: 44px; height: 44px; display: grid; place-items: center; color: var(--q-muted); flex: none; }
  .q-btn.danger { color: var(--q-coral); justify-self: start; border: 0; background: none; padding: 0 2px; }
  @media (max-width: 359px) { .two { grid-template-columns: 1fr; } }
</style>
