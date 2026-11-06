<script lang="ts">
  // One task on けっこんしき's plan, a row of its month's card (the old board's tcard): the tick circle at the left (a
  // member's own 44px target), the month small over the day big, the title (16/500, three lines at most) over its
  // category tag and the checklist's count, the relative due at the right (coral past it). A tap on the row opens it
  // in place: the checklist (each item a member's tick, its URLs links), who finished it (muted: 「うめ が完了」, the
  // old Sheet's ticks 「まえの ボードで おわった」), a start day still ahead, and a member's 編集 / 完了. The guest's row
  // has nothing to press but the row itself: a finished task's tick is drawn, an open one's is not.
  import { slide } from 'svelte/transition';
  import Icon from '../quiet/Icon.svelte';
  import Linked from './Linked.svelte';
  import { board } from './board.svelte.ts';
  import { formatDate, md } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { dueLine, monthShort } from './format.ts';
  import type { Who } from '#lib/types.ts';
  import type { Task } from './view.ts';

  interface Props {
    task: Task;
    canEdit: boolean;
    names: Record<Who, string>;
    /** The wedding day: its own row's day in rose. */
    wedding: string;
    /** Opened in place. */
    open: boolean;
    ontoggle: () => void;
    ontick: (id: string, done: boolean) => void;
    onedit: (id: string) => void;
  }
  let { task, canEdit, names, wedding, open, ontoggle, ontick, onedit }: Props = $props();
  const due = $derived(dueLine(task));
  const tally = $derived(task.progress.tally);
  const done = $derived(!!task.doneAt);
  const dated = $derived(task.progress.dated);
  const dateLabel = $derived(dated ? `${Number(task.due.slice(0, 4))}/${md(task.due)}` : t('wed.sec.nodate'));
  /** Promoted from a checklist: no dates, no items of its own. */
  const promoted = $derived(!!task.parentId);
  const uid = $props.id();
</script>

<article class="tk" class:done class:over={due?.tone === 'over'} class:theday={dated && task.due === wedding} class:open data-wed-task={task.id} data-done={done || undefined}>
  <div class="line">
    {#if canEdit}
      <button type="button" class="tick" aria-pressed={done} aria-label={done ? t('wed.untick', { title: task.title }) : t('wed.tick', { title: task.title })}
        data-wed-tick={task.id} data-sfx={done ? 'toggle-off' : 'confirm'} onclick={() => ontick(task.id, !done)}>
        <span class="ring">{#if done}<Icon name="check" size={14} stroke={2.8} />{/if}</span>
      </button>
    {:else}
      <span class="tick" role={done ? 'img' : undefined} aria-label={done ? t('wed.doneMark') : undefined} data-wed-mark={done || undefined}>
        {#if done}<span class="ring"><Icon name="check" size={14} stroke={2.8} /></span>{/if}
      </span>
    {/if}
    <button type="button" class="head" aria-expanded={open} aria-controls="{uid}-more" data-sfx={open ? 'back' : 'open'}
      aria-label="{task.title}、{dateLabel}{due ? `、${due.text}` : ''}{tally ? `、${t('wed.tallyLabel', tally)}` : ''}" onclick={ontoggle}>
      <span class="dc" aria-hidden="true">
        {#if dated}<span class="mo">{monthShort(task.due)}</span><span class="dd">{Number(task.due.slice(8, 10))}</span>{:else}<span class="dd dash">–</span>{/if}
      </span>
      <span class="body">
        <span class="tt" data-wed-title>{task.title}</span>
        {#if task.category || tally}
          <span class="meta" aria-hidden="true">
            {#if task.category}<span class="q-tag">{task.category}</span>{/if}
            {#if tally}<span class="cl" data-wed-tally="{tally.done}/{tally.total}"><Icon name="checks" size={14} />{tally.done}/{tally.total}</span>{/if}
          </span>
        {/if}
      </span>
      {#if due && !done}<span class="rel" aria-hidden="true">{due.text}</span>{/if}
    </button>
  </div>

  {#if open}
    <div class="more" id="{uid}-more" transition:slide={{ duration: 180 }}>
      {#if !promoted && task.subtasks.length}
        <ul class="subs" aria-label={t('wed.checklist')}>
          {#each task.subtasks as s (s.id)}
            <li class:done={!!s.doneAt} data-wed-sub={s.id} data-done={!!s.doneAt || undefined}>
              {#if canEdit}
                <button type="button" class="stick" aria-pressed={!!s.doneAt} aria-label={s.doneAt ? t('wed.untick', { title: s.title }) : t('wed.tick', { title: s.title })}
                  data-wed-sub-tick={s.id} data-sfx={s.doneAt ? 'toggle-off' : 'confirm'} onclick={() => board.tick(s.id, !s.doneAt)}>
                  <span class="ring">{#if s.doneAt}<Icon name="check" size={12} stroke={2.8} />{/if}</span>
                </button>
              {:else}
                <span class="stick" role={s.doneAt ? 'img' : undefined} aria-label={s.doneAt ? t('wed.doneMark') : undefined}>
                  {#if s.doneAt}<span class="ring"><Icon name="check" size={12} stroke={2.8} /></span>{/if}
                </span>
              {/if}
              <span class="stxt"><Linked text={s.title} /></span>
              {#if s.doneBy}<span class="sby">{names[s.doneBy]}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
      {#if task.start && !done}<p class="note">{t('wed.starts', { d: formatDate(task.start) })}</p>{/if}
      {#if task.doneBy}
        <p class="note" data-wed-by={task.doneBy}>{t('wed.byWho', { name: names[task.doneBy] })}</p>
      {:else if done}
        <p class="note" data-wed-imported>{t('wed.imported.task')}</p>
      {/if}
      {#if canEdit}
        <div class="acts">
          <button type="button" class="q-btn sm" data-wed-edit data-sfx="open" onclick={() => onedit(task.id)}><Icon name="edit" size={15} />{t('common.edit')}</button>
          <button type="button" class="q-btn sm" class:primary={!done} data-wed-page-tick data-sfx={done ? 'toggle-off' : 'confirm'} onclick={() => ontick(task.id, !done)}>
            {#if !done}<Icon name="check" size={15} stroke={2.4} />{/if}{done ? t('wed.reopen') : t('wed.complete')}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</article>

<style>
  /* rows of one month's card, divided by a hairline */
  :global(.tk + .tk) { border-top: 1px solid var(--q-hairline); }
  .line { display: flex; align-items: stretch; }
  /* the tick: a 24px ring, its 44px target the row's left edge */
  .tick {
    appearance: none; border: 0; background: none; padding: 0 0 0 14px; flex: none; width: 50px; display: grid; place-items: center start;
    cursor: pointer; color: var(--q-on-accent); -webkit-tap-highlight-color: transparent;
  }
  span.tick { cursor: default; }
  .ring { width: 24px; height: 24px; border-radius: 50%; box-sizing: border-box; border: 1.5px solid var(--q-faint); display: grid; place-items: center; transition: background-color 160ms, border-color 160ms; }
  .done .tick .ring, .stick[aria-pressed='true'] .ring, span.stick .ring, span.tick .ring { background: var(--q-accent); border-color: var(--q-accent); }
  .tick:focus-visible, .stick:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -4px; border-radius: 12px; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; flex: 1; min-width: 0;
    display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; column-gap: 12px; align-items: center; padding: 10px 14px 10px 0; min-height: 62px;
    -webkit-tap-highlight-color: transparent;
  }
  .head:active { background: var(--q-sunken); }
  .head:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -2px; }
  .dc { display: flex; flex-direction: column; align-items: center; line-height: 1; font-family: var(--q-font-title); }
  .mo { font-size: var(--q-fs-xs); font-weight: 700; color: var(--q-muted); margin-bottom: 3px; }
  .dd { font-size: var(--q-fs-title); font-weight: 700; color: var(--q-ink); }
  .dash { color: var(--q-faint); }
  .over .mo, .over .dd { color: var(--q-coral); }
  .theday .mo, .theday .dd { color: #D46A8F; }
  .tt { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; overflow-wrap: anywhere; font-size: 16px; font-weight: 500; line-height: 1.35; }
  .done .tt { color: var(--q-muted); }
  .meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: var(--q-fs-s); color: var(--q-muted); }
  .cl { display: inline-flex; align-items: center; gap: 3px; }
  .rel { align-self: start; padding-top: 3px; font-size: var(--q-fs-s); color: var(--q-muted); white-space: nowrap; }
  .over .rel { color: var(--q-coral); }

  .more { padding: 0 16px 14px 96px; display: grid; gap: 4px; }
  .subs { list-style: none; margin: 0 0 4px; padding: 0; }
  .subs li { display: flex; align-items: flex-start; gap: 4px; min-height: 36px; }
  .stick {
    appearance: none; border: 0; background: none; padding: 0; flex: none; width: 32px; height: 36px; margin-left: -6px; display: grid; place-items: center;
    cursor: pointer; color: var(--q-on-accent); position: relative; -webkit-tap-highlight-color: transparent;
  }
  .stick::after { content: ''; position: absolute; inset: -4px -6px; }
  span.stick { cursor: default; }
  .stick .ring { width: 20px; height: 20px; }
  .stxt { flex: 1; min-width: 0; padding: 7px 0; font-size: var(--q-fs-body); line-height: 1.45; overflow-wrap: anywhere; }
  li.done .stxt { color: var(--q-muted); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--q-muted) 50%, transparent); }
  .stxt :global(a) { color: var(--q-accent-ink); }
  .sby { flex: none; padding-top: 9px; font-size: var(--q-fs-s); color: var(--q-muted); }
  .note { margin: 0; font-size: var(--q-fs-s); line-height: 1.5; color: var(--q-muted); }
  .acts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  .sm { min-height: 36px; padding: 0 14px; border-radius: 10px; font-size: var(--q-fs-s); }
  .sm::after { content: ''; position: absolute; inset: -4px 0; }
  .sm { position: relative; }
</style>
