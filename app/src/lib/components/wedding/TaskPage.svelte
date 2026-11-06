<script lang="ts">
  // A task's page (けっこんしき, a level with ‹): its category, name, start and due day (with how near); a member's big
  // ✓ (おわった！ / まだ おわってない) and who did it (the old Sheet's ticks, which never recorded who, say so in a soft
  // line); the checklist (each item a ✓ for a member, its URLs links), a field to add one. ✎ turns the head into its
  // fields and the checklist's items into theirs (renamed as each is left, each with 🗑), ほぞん / やめる and 🗑 けす
  // pinned at the foot (けす deletes the task with its checklist and goes back; the banner's とりけす restores it).
  // `task` null: a new task's fields (＋), its page next. A task promoted from a checklist (it names a parent the board
  // no longer holds as a task) has no dates and no checklist. The guest reads it all and has none of the controls.
  import { tick } from 'svelte';
  import TaskFields from './TaskFields.svelte';
  import Linked from './Linked.svelte';
  import Icon from './Icon.svelte';
  import { board } from './board.svelte.ts';
  import { tagOf } from '#lib/ui-state/viewer.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { dueLine } from './format.ts';
  import { WTASK_TITLE, type WedTask } from '#lib/contract/wedding.ts';
  import type { Who } from '#lib/types.ts';
  import type { Fields, Task } from './view.ts';

  interface Props {
    /** null: a new task. */
    task: Task | null;
    cats: readonly string[];
    canEdit: boolean;
    names: Record<Who, string>;
    /** Leave the page (deleted, or a new one given up). */
    ondone: () => void;
    /** A new task saved: its id and name. */
    onadded?: (id: string, title: string) => void;
  }
  let { task, cats, canEdit, names, ondone, onadded }: Props = $props();

  const blank = (): Fields => ({ title: '', cat: '', start: '', due: '' });
  const fieldsOf = (x: Task): Fields => ({ title: x.title, cat: x.category, start: x.start, due: x.due });
  // svelte-ignore state_referenced_locally
  let editing = $state(task === null);
  // svelte-ignore state_referenced_locally
  let draft = $state<Fields>(task ? fieldsOf(task) : blank());
  let errors = $state({ title: false, due: false });
  let sub = $state('');
  let subEl: HTMLInputElement | undefined = $state();
  const due = $derived(task ? dueLine(task) : null);
  const done = $derived(!!task?.doneAt);
  /** Promoted from a checklist: a title and a category only (the record holds no dates on it, nor items under it). */
  const promoted = $derived(!!task?.parentId);

  function edit() {
    if (!task) return;
    draft = fieldsOf(task);
    errors = { title: false, due: false };
    editing = true;
  }
  function cancel() {
    if (!task) return ondone();
    editing = false;
  }
  function save() {
    const title = draft.title.trim();
    errors = { title: !title, due: !promoted && !draft.due };
    if (errors.title || errors.due) return;
    if (!task) {
      const id = board.addTask({ title, cat: draft.cat, due: draft.due, ...(draft.start ? { start: draft.start } : {}) });
      return id ? onadded?.(id, title) : ondone();
    }
    // ('' start: cleared)
    const patch: { title?: string; cat?: string; due?: string; start?: string } = {};
    if (title !== task.title) patch.title = title;
    if (draft.cat !== task.category) patch.cat = draft.cat;
    if (!promoted && draft.due !== task.due) patch.due = draft.due;
    if (!promoted && draft.start !== task.start) patch.start = draft.start;
    if (Object.keys(patch).length) board.editTask(task.id, patch);
    editing = false;
  }
  /** A task (its checklist with it, the store's remove) or one checklist item. */
  function remove(x: WedTask, leave: boolean) {
    board.remove(x.id);
    toasts.show(t('wed.removed', { title: x.title }), 5000, { action: { label: t('common.undo'), run: () => void board.restore(x.id) } });
    if (leave) ondone();
  }
  function rename(s: WedTask, e: Event) {
    const el = e.currentTarget as HTMLInputElement, title = el.value.trim();
    if (title && title !== s.title) board.editTask(s.id, { title });
    else el.value = s.title;
  }
  async function addSub(e: SubmitEvent) {
    e.preventDefault();
    const title = sub.trim();
    if (!title || !task) return;
    board.addSub(task.id, title);
    sub = '';
    await tick();
    subEl?.focus({ preventScroll: true });
  }
</script>

<div class="page">
  {#if editing}
    <div class="card form">
      <TaskFields bind:value={draft} {cats} dated={!promoted} {errors} />
    </div>
  {:else if task}
    <div class="card head" class:done>
      <div class="top">
        {#if task.category}<span class="w-cat">{task.category}</span>{/if}
        {#if canEdit}<button type="button" class="pen-btn" aria-label={t('wed.edit')} data-wed-edit data-sfx="open" onclick={edit}><Icon name="pen" /></button>{/if}
      </div>
      <h3 class="ttl" class:long={task.title.length > 40} data-wed-title>{task.title}</h3>
      {#if !promoted}
        <dl class="dates">
          {#if task.start}<div><dt>{t('wed.field.startShort')}</dt><dd>{formatDate(task.start)}</dd></div>{/if}
          <div><dt>{t('wed.field.due')}</dt><dd>{task.due ? formatDate(task.due) : t('wed.sec.nodate')}{#if due}<span class="w-due {due.tone}">{due.text}</span>{/if}</dd></div>
        </dl>
      {/if}
      {#if task.doneBy}
        <p class="by"><span class="w-who" style:--tag={tagOf(task.doneBy)}>{t('wed.byWho', { name: names[task.doneBy] })}</span></p>
      {:else if done}
        <p class="old" data-wed-imported>{t('wed.imported.task')}</p>
      {/if}
    </div>
    {#if canEdit}
      <button type="button" class="btn big-tick" class:paper={done} aria-pressed={done} data-wed-page-tick data-sfx={done ? 'toggle-off' : 'confirm'}
        onclick={() => board.tick(task.id, !done)}>
        {#if !done}<Icon name="tick" />{/if}{done ? t('wed.markUndone') : t('wed.markDone')}
      </button>
    {:else if done}
      <p class="done-line" data-wed-mark>✓ {t('wed.doneMark')}</p>
    {/if}
  {/if}

  {#if task && !promoted && (task.subtasks.length || canEdit)}
    <section class="list" aria-labelledby="wed-cl">
      <h4 class="sec-label" id="wed-cl">{t('wed.checklist')}{#if task.progress.tally}<span class="tl">{task.progress.tally.done} / {task.progress.tally.total}</span>{/if}</h4>
      <ul class="card subs">
        {#each task.subtasks as s (s.id)}
          <li class:done={!!s.doneAt} data-wed-sub={s.id} data-done={!!s.doneAt || undefined}>
            {#if canEdit}
              <button type="button" class="stick" aria-pressed={!!s.doneAt} aria-label={s.doneAt ? t('wed.untick', { title: s.title }) : t('wed.tick', { title: s.title })}
                data-wed-sub-tick={s.id} data-sfx={s.doneAt ? 'toggle-off' : 'confirm'} onclick={() => board.tick(s.id, !s.doneAt)}>
                <span class="bub"><Icon name="tick" size={17} /></span>
              </button>
            {:else}
              <span class="smark" role={s.doneAt ? 'img' : undefined} aria-label={s.doneAt ? t('wed.doneMark') : undefined}>{#if s.doneAt}<Icon name="tick" size={17} />{/if}</span>
            {/if}
            {#if editing && canEdit}
              <input class="w-in sname" type="text" value={s.title} maxlength={WTASK_TITLE} enterkeyhint="done" aria-label={t('wed.renameSub', { title: s.title })}
                data-wed-sub-name={s.id} data-sfx="none" onchange={(e) => rename(s, e)} />
              <button type="button" class="srm" aria-label={t('wed.remove')} data-sfx="tick" onclick={() => remove(s, false)}><Icon name="bin" /></button>
            {:else}
              <span class="stxt"><Linked text={s.title} /></span>
              {#if s.doneBy}<span class="w-who mini" style:--tag={tagOf(s.doneBy)} aria-label={t('wed.byWho', { name: names[s.doneBy] })}>{names[s.doneBy]}</span>{/if}
            {/if}
          </li>
        {/each}
        {#if canEdit && !editing}
          <li class="addrow">
            <form onsubmit={addSub}>
              <input class="w-in" type="text" bind:this={subEl} bind:value={sub} placeholder={t('wed.subPlaceholder')} enterkeyhint="done" maxlength={WTASK_TITLE} aria-label={t('wed.addSub')}
                data-wed-sub-field data-sfx="none" />
              <button type="submit" class="sadd" aria-label={t('wed.addSub')} aria-disabled={!sub.trim() ? 'true' : undefined} data-wed-sub-add data-sfx="confirm"><Icon name="plus" /></button>
            </form>
          </li>
        {/if}
      </ul>
    </section>
  {/if}

  {#if editing}
    <div class="level-acts">
      {#if task}<button type="button" class="btn small paper rm" data-wed-remove data-sfx="tick" onclick={() => remove(task, true)}><Icon name="bin" />{t('wed.remove')}</button>{/if}
      <button type="button" class="btn small paper" data-sfx="back" onclick={cancel}>{t('wed.cancel')}</button>
      <button type="button" class="btn small" data-wed-save data-sfx="confirm" onclick={save}>{t('wed.save')}</button>
    </div>
  {/if}
</div>

<style>
  /* one column no wider than the sheet (a long pasted URL wraps rather than widening it) */
  .page { flex: 1 0 auto; display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 14px; }
  .head { display: grid; gap: 8px; padding: 14px 14px 14px 16px; }
  .top { display: flex; align-items: flex-start; gap: 8px; min-height: 26px; }
  .top .w-cat { padding: 4px 10px 3px; }
  .top .pen-btn { margin-left: auto; margin-top: -4px; margin-right: -4px; }
  .ttl { margin: 0; font: 700 var(--fs-title)/1.25 var(--font-ui); overflow-wrap: anywhere; }
  .ttl.long { font-size: var(--fs-talk); line-height: 1.4; }
  .done .ttl { color: var(--text-soft); }
  .dates { margin: 0; display: grid; gap: 4px; }
  .dates div { display: flex; gap: 10px; align-items: baseline; }
  dt { flex: none; min-width: 5.5em; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  dd { margin: 0; display: flex; flex-wrap: wrap; gap: 0 10px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .by { margin: 2px 0 0; }
  .old { margin: 2px 0 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .big-tick { margin: 0 0 var(--lip-h); }
  .done-line { margin: 0; text-align: center; font-weight: 700; color: var(--leaf-text); }

  .list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .tl { margin-left: 8px; font-family: var(--font-num); }
  .subs { list-style: none; margin: 0; padding: 4px 6px; display: grid; grid-template-columns: minmax(0, 1fr); }
  /* a long item's ✓ at its first line */
  .subs li { display: flex; align-items: flex-start; gap: 6px; min-height: 52px; min-width: 0; }
  .subs li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .stick, .srm, .sadd {
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); margin-top: 4px;
    display: grid; place-items: center; border-radius: 50%; color: var(--text); -webkit-tap-highlight-color: transparent;
  }
  .bub { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--ctl); box-shadow: var(--sh-ctl); color: transparent; }
  .stick[aria-pressed='true'] .bub { background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 3px 0 var(--c-leaf-edge); }
  .stick:active .bub { transform: translateY(2px); }
  /* the guest's: the tick alone, nothing that looks tappable */
  .smark { flex: none; width: 28px; height: 44px; margin: 4px 8px 0; display: grid; place-items: center; color: var(--leaf-text); }
  .stxt { flex: 1; min-width: 0; padding: 14px 0 12px; font: 700 var(--fs-body)/1.35 var(--font-ui); overflow-wrap: anywhere; }
  li.done .stxt { color: var(--text-soft); text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: color-mix(in srgb, var(--text-soft) 50%, transparent); }
  .w-who.mini { flex: none; margin-top: 14px; padding: 3px 7px 2px; font-size: var(--fs-xs); }
  .sname { flex: 1; margin: 4px 0; }
  .srm { color: var(--coral-text); }
  li.addrow { align-items: center; }
  .addrow form { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; }
  .addrow input { flex: 1; margin-left: 2px; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-edge) 60%, transparent); }
  .sadd { background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 3px 0 var(--c-leaf-edge); width: 40px; height: 40px; margin: 0 2px 3px; }
  .sadd[aria-disabled='true'] { background: var(--ctl-off); box-shadow: none; color: var(--text-soft); transform: translateY(3px); }
  .form { padding: 14px; }
  .level-acts { align-self: end; }
  .level-acts .rm { color: var(--coral-text); padding: 0 14px; gap: 4px; margin-right: auto; }
</style>
