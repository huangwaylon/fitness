<script lang="ts">
  // A task's page (けっこんしき, a level with ‹): its category, name, due day (with its weekday and how near) and start;
  // a member's big ✓ (おわった！ / まだ おわってない) and who did it; the checklist (each item a ✓ for a member, its
  // URLs links), a field to add one; ✎ turns the head into its fields (ほぞん / やめる) with 🗑 けす, which deletes it with
  // its checklist and goes back (the banner's とりけす restores it). `task` null: a new task's fields (＋). The guest
  // reads it all and has none of the controls.
  import { tick } from 'svelte';
  import TaskFields from './TaskFields.svelte';
  import Linked from './Linked.svelte';
  import { tagOf } from '#lib/ui-state/viewer.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { dueLine } from './format.ts';
  import { WTASK_TITLE, type WedTask } from '#lib/contract/wedding.ts';
  import type { Who } from '#lib/types.ts';
  import type { Fields, Task, WeddingActions } from './view.ts';

  interface Props {
    /** null: a new task. */
    task: Task | null;
    today: string;
    cats: readonly string[];
    canEdit: boolean;
    names: Record<Who, string>;
    actions?: WeddingActions;
    /** Leave the page (saved new, deleted, or a new one given up). */
    ondone: () => void;
  }
  let { task, today, cats, canEdit, names, actions, ondone }: Props = $props();

  const blank = (): Fields => ({ title: '', cat: '', start: '', due: '' });
  const fieldsOf = (x: Task): Fields => ({ title: x.title, cat: x.category, start: x.start, due: x.due });
  // svelte-ignore state_referenced_locally
  let editing = $state(task === null);
  // svelte-ignore state_referenced_locally
  let draft = $state<Fields>(task ? fieldsOf(task) : blank());
  let error = $state<'title' | 'due' | null>(null);
  let sub = $state('');
  let subEl: HTMLInputElement | undefined = $state();
  const due = $derived(task ? dueLine(task) : null);
  const done = $derived(!!task?.doneAt);

  function edit() {
    if (!task) return;
    draft = fieldsOf(task);
    error = null;
    editing = true;
  }
  function cancel() {
    if (!task) return ondone();
    editing = false;
    error = null;
  }
  function save() {
    const title = draft.title.trim();
    error = !title ? 'title' : !draft.due ? 'due' : null;
    if (error) return;
    if (!task) {
      actions?.addTask({ title, cat: draft.cat, due: draft.due, ...(draft.start ? { start: draft.start } : {}) });
      ondone();
      return;
    }
    // ('' start: cleared)
    const patch: { title?: string; cat?: string; due?: string; start?: string } = {};
    if (title !== task.title) patch.title = title;
    if (draft.cat !== task.category) patch.cat = draft.cat;
    if (draft.due !== task.due) patch.due = draft.due;
    if (draft.start !== task.start) patch.start = draft.start;
    if (Object.keys(patch).length) actions?.editTask(task.id, patch);
    editing = false;
  }
  /** A task (its checklist with it, the store's remove) or one checklist item. */
  function remove(x: WedTask, leave: boolean) {
    actions?.remove(x.id);
    toasts.show(t('wed.removed', { title: x.title }), 5000, { action: { label: t('common.undo'), run: () => void actions?.restore(x.id) } });
    if (leave) ondone();
  }
  async function addSub(e: SubmitEvent) {
    e.preventDefault();
    const title = sub.trim();
    if (!title || !task) return;
    actions?.addSub(task.id, title);
    sub = '';
    await tick();
    subEl?.focus({ preventScroll: true });
  }
</script>

<div class="page" data-wed-page={task?.id ?? 'new'} data-editing={editing || undefined}>
  {#if editing}
    <div class="card form">
      <TaskFields bind:value={draft} {cats} {error} />
    </div>
    <div class="acts">
      {#if task}<button type="button" class="btn small paper rm" data-wed-remove data-sfx="tick" onclick={() => remove(task, true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 4h4M7 7l1 13h8l1-13M10 11v6M14 11v6" /></svg>{t('wed.remove')}</button>{/if}
      <span class="sp"></span>
      <button type="button" class="btn small paper" data-wed-cancel data-sfx="back" onclick={cancel}>{t('wed.cancel')}</button>
      <button type="button" class="btn small" data-wed-save data-sfx="confirm" onclick={save}>{t('wed.save')}</button>
    </div>
  {:else if task}
    <div class="card head" class:done>
      <div class="top">
        {#if task.category}<span class="cat">{task.category}</span>{/if}
        {#if canEdit}<button type="button" class="pen-btn" aria-label={t('wed.edit')} data-wed-edit data-sfx="open" onclick={edit}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" /></svg></button>{/if}
      </div>
      <h3 class="ttl" data-wed-title>{task.title}</h3>
      <dl class="dates">
        <div><dt>{t('wed.field.due')}</dt><dd>{task.due ? formatDate(task.due) : t('wed.sec.nodate')}{#if due}<span class="due {due.tone}">{due.text}</span>{/if}</dd></div>
        {#if task.start}<div><dt>{t('wed.field.startShort')}</dt><dd>{formatDate(task.start)}</dd></div>{/if}
      </dl>
      {#if done}
        <p class="by">{#if task.doneBy}<span class="who" style:--tag={tagOf(task.doneBy)}>{t('wed.byWho', { name: names[task.doneBy] })}</span>{:else}<span class="who old" data-wed-imported>{t('wed.imported')}</span>{/if}</p>
      {/if}
    </div>
    {#if canEdit}
      <button type="button" class="btn big-tick" class:paper={done} aria-pressed={done} data-wed-page-tick data-sfx={done ? 'toggle-off' : 'confirm'}
        onclick={() => actions?.tick(task.id, !done)}>
        {#if !done}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg>{/if}{done ? t('wed.markUndone') : t('wed.markDone')}
      </button>
    {:else if done}
      <p class="done-line" data-wed-mark>✓ {t('wed.doneMark')}</p>
    {/if}
  {/if}

  {#if task && (task.subtasks.length || canEdit)}
    <section class="list" aria-labelledby="wed-cl">
      <h4 class="sec-label" id="wed-cl">{t('wed.checklist')}{#if task.progress.tally}<span class="tl">{task.progress.tally.done} / {task.progress.tally.total}</span>{/if}</h4>
      <ul class="card subs">
        {#each task.subtasks as s (s.id)}
          <li class:done={!!s.doneAt} data-wed-sub={s.id} data-done={!!s.doneAt || undefined}>
            {#if canEdit}
              <button type="button" class="stick" aria-pressed={!!s.doneAt} aria-label={s.doneAt ? t('wed.untick', { title: s.title }) : t('wed.tick', { title: s.title })}
                data-wed-sub-tick={s.id} data-sfx={s.doneAt ? 'toggle-off' : 'confirm'} onclick={() => actions?.tick(s.id, !s.doneAt)}>
                <span class="bub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg></span>
              </button>
            {:else}
              <span class="smark" aria-label={s.doneAt ? t('wed.doneMark') : undefined} role={s.doneAt ? 'img' : undefined}>{#if s.doneAt}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg>{/if}</span>
            {/if}
            <span class="stxt"><Linked text={s.title} /></span>
            {#if s.doneAt && s.doneBy}<span class="who mini" style:--tag={tagOf(s.doneBy)} aria-label={t('wed.byWho', { name: names[s.doneBy] })}>{names[s.doneBy]}</span>{/if}
            {#if editing && canEdit}
              <button type="button" class="srm" aria-label={t('wed.remove')} data-wed-sub-remove={s.id} data-sfx="tick" onclick={() => remove(s, false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 4h4M7 7l1 13h8l1-13" /></svg>
              </button>
            {/if}
          </li>
        {/each}
        {#if canEdit}
          <li class="addrow">
            <form onsubmit={addSub}>
              <input type="text" bind:this={subEl} bind:value={sub} placeholder={t('wed.subPlaceholder')} enterkeyhint="done" maxlength={WTASK_TITLE} aria-label={t('wed.addSub')}
                data-wed-sub-field data-sfx="none" />
              <button type="submit" class="sadd" aria-label={t('wed.addSub')} aria-disabled={!sub.trim() ? 'true' : undefined} data-wed-sub-add data-sfx="confirm">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </form>
          </li>
        {/if}
      </ul>
    </section>
  {/if}
</div>

<style>
  /* one column no wider than the sheet (a long pasted URL wraps rather than widening it) */
  .page { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .head { display: grid; gap: 8px; padding: 14px 14px 14px 16px; }
  .top { display: flex; align-items: flex-start; gap: 8px; min-height: 26px; }
  .top .pen-btn { margin-left: auto; margin-top: -4px; margin-right: -4px; }
  .pen-btn svg, .rm svg, .srm svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .cat { padding: 4px 10px 3px; border-radius: var(--r-pill); background: var(--ctl-off); font: 700 var(--fs-s)/1 var(--font-ui); }
  .ttl { font: 700 var(--fs-title)/1.25 var(--font-ui); overflow-wrap: anywhere; }
  .done .ttl { color: var(--text-soft); }
  .dates { margin: 0; display: grid; gap: 4px; }
  .dates div { display: flex; gap: 10px; align-items: baseline; }
  dt { flex: none; min-width: 5.5em; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  dd { margin: 0; display: flex; flex-wrap: wrap; gap: 0 10px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .due.over { color: var(--coral-text); }
  .due.soon { color: var(--leaf-text); }
  .by { margin: 2px 0 0; }
  .who { display: inline-block; padding: 4px 10px 3px; border-radius: var(--r-pill); background: var(--tag); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); }
  .who.old { background: var(--ctl-off); color: var(--text-soft); }
  .who.mini { flex: none; padding: 3px 7px 2px; font-size: var(--fs-xs); }
  .big-tick { margin: 0 0 var(--lip-h); }
  .big-tick svg { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .done-line { margin: 0; text-align: center; font-weight: 700; color: var(--leaf-text); }

  .list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .tl { margin-left: 8px; font-family: var(--font-num); }
  .subs { list-style: none; margin: 0; padding: 4px 6px; display: grid; grid-template-columns: minmax(0, 1fr); }
  .subs li { display: flex; align-items: center; gap: 6px; min-height: 52px; }
  .subs li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .stick, .srm, .sadd {
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; flex: none; width: var(--hit); height: var(--hit);
    display: grid; place-items: center; border-radius: 50%; color: var(--text); -webkit-tap-highlight-color: transparent;
  }
  .bub { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--ctl); box-shadow: var(--sh-ctl); color: transparent; }
  .bub svg, .smark svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
  .stick[aria-pressed='true'] .bub { background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 3px 0 var(--c-leaf-edge); }
  .stick:active .bub { transform: translateY(2px); }
  .smark { flex: none; width: 28px; height: 28px; margin: 0 8px; display: grid; place-items: center; border-radius: 50%; color: var(--leaf-text);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--lip) 70%, transparent); }
  .stxt { flex: 1; min-width: 0; padding: 8px 0; font: 700 var(--fs-body)/1.35 var(--font-ui); overflow-wrap: anywhere; }
  li.done .stxt { color: var(--text-soft); text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: color-mix(in srgb, var(--text-soft) 50%, transparent); }
  .srm { color: var(--coral-text); }
  .addrow form { flex: 1; display: flex; align-items: center; gap: 6px; }
  .addrow input {
    flex: 1; min-width: 0; min-height: var(--hit); padding: 8px 12px; border: 0; border-radius: 14px; margin-left: 2px;
    font: 500 var(--fs-input)/1.3 var(--font-ui); color: var(--c-ink); background: var(--c-card); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-edge) 60%, transparent);
  }
  .sadd { background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 3px 0 var(--c-leaf-edge); width: 40px; height: 40px; margin: 0 2px 3px; }
  .sadd[aria-disabled='true'] { background: var(--ctl-off); box-shadow: none; color: var(--text-soft); transform: translateY(3px); }
  .sadd svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; }
  .form { padding: 14px; }
  .acts { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .acts .btn { margin: 0 0 var(--lip-h); }
  .acts .sp { flex: 1; }
  .rm { color: var(--coral-text); padding: 0 14px; gap: 4px; }
</style>
