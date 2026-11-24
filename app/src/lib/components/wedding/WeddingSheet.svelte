<script lang="ts">
  // 結婚式 (docs/wedding.md): the wedding board's sheet, its own chunk with its strings, full height (Sheet's
  // `full`, the unified kit: docs/design.md), over the board's store (board.svelte.ts), following the time of day. One
  // title bar (NavBar: 結婚式, ✕), one scroller, the bottom tab bar (プラン / メモ / 設定). プラン: the banner (Head),
  // the filters and the months (Plan); a row opens in place, its 編集 and the title bar's ＋ (before ✕, on プラン) open the form
  // (TaskForm, a form sheet). メモ: the letter (Notes, its 編集 inside it); writing it, the title bar says so and the format
  // tools (with キャンセル and 保存) take the tab bar's place. 設定: the names, the day, the categories, the deleted (Settings). The
  // week's view not in yet (board.canEdit false), it reads it all: no tick, 編集, ＋ or 設定. Kept mounted between openings (Sheet's
  // `keep`): a reopening shows it at once, closed() and the open effect resetting what an opening resets.
  import { tick } from 'svelte';
  import '#lib/i18n/wedding.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import type { IconName } from '../ui/Icon.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Head from './Head.svelte';
  import Plan from './Plan.svelte';
  import Notes from './Notes.svelte';
  import TaskForm from './TaskForm.svelte';
  import Settings from './Settings.svelte';
  import { board } from './board.svelte.ts';
  import { flush, pad } from './notepad.svelte.ts';
  import type { Filter } from './view.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import type { Who } from '#lib/types.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  type Tab = 'plan' | 'notes' | 'settings';
  let tab = $state<Tab>('plan');
  let filter = $state<Filter>('all');
  let held = $state(new Set<string>());
  let expanded = $state<string | null>(null);
  const kv = localKV();
  let showDone = $state(kv?.getItem(DEVICE.weddingDone) === '1');
  let body: HTMLElement | undefined = $state();
  /** The form: open, on which task (null: a new one), and a fresh one each opening. */
  let form = $state({ open: false, id: null as string | null, n: 0 });

  const canEdit = $derived(board.canEdit);
  const view = $derived(week.view);
  const names = $derived<Record<Who, string>>({ A: view ? villagerNameOf(view, 'A') : 'A', B: view ? villagerNameOf(view, 'B') : 'B', G: view ? villagerNameOf(view, 'G') : 'G' });
  const tasks = $derived(board.tasks);
  const formTask = $derived(form.id ? (tasks.find((x) => x.id === form.id) ?? null) : null);
  const writing = $derived(pad.editing && tab === 'notes');
  const title = $derived(writing ? t('wed.note.editing') : t('wed.title'));
  const TABS = $derived<{ id: Tab; label: string; icon: IconName }[]>([
    { id: 'plan', label: t('wed.tab.plan'), icon: 'clipboard' },
    { id: 'notes', label: t('wed.tab.notes'), icon: 'file' },
    ...(canEdit ? [{ id: 'settings' as const, label: t('wed.settings'), icon: 'gear' as const }] : [])
  ]);

  // (kept mounted between openings, Sheet's `keep`: the plan's top again, after the dialog shows)
  $effect(() => {
    if (open) queueMicrotask(() => body?.scrollTo({ top: 0 }));
  });

  /** Closed: the next opening is on its tab (設定: the plan), すべて, the plan's top (a note being written stays: back in its editor). */
  function closed() {
    flush();
    if (tab === 'settings') tab = 'plan';
    expanded = null;
    form.open = false;
    setFilter('all');
  }
  function pickTab(id: Tab) {
    tab = id;
    body?.scrollTo({ top: 0 });
  }
  function setFilter(f: Filter) {
    filter = f;
    held = new Set();
  }
  function setShowDone(v: boolean) {
    showDone = v;
    held = new Set();
    try {
      kv?.setItem(DEVICE.weddingDone, v ? '1' : '0');
    } catch {
      /* the pref lasts this opening only */
    }
  }
  function tickTask(id: string, done: boolean) {
    held = new Set([...held, id]);
    board.tick(id, done);
  }
  function edit(id: string | null) {
    form = { open: true, id, n: form.n + 1 };
  }
  async function added(id: string, name: string) {
    expanded = id;
    held = new Set([...held, id]);
    // (a long title clipped: the toast confirms, the list shows it whole)
    const cs = [...name];
    toasts.show(t('wed.added', { title: cs.length > 16 ? `${cs.slice(0, 15).join('')}…` : name }), 2400, { low: true });
    await tick();
    body?.querySelector(`[data-wed-task="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  }
  // a task gone from under its form (deleted on the other phone): the form closes
  $effect(() => {
    if (form.open && form.id && !formTask) form.open = false;
  });
</script>


{#snippet add()}<NavButton kind="tool" icon="plus" popup sfx="open" label={t('wed.add')} data-wed-add onclick={() => edit(null)} />{/snippet}
<Sheet bind:open tunes label={t('wed.title')} variant="full" onclose={closed} timed="wedding" keep>
  <div class="wd">
    <NavBar {title} trailing={tab === 'plan' && canEdit ? add : null} onclose={() => (open = false)} />
    <div class="wd-body sheet-scroll" class:writing bind:this={body} data-wedding data-tab={tab} data-readonly={!canEdit || undefined}>
      {#if tab === 'settings' && canEdit}
        <Settings />
      {:else if tab === 'plan'}
        <Head config={board.config} days={board.countdown} sum={board.overall} />
        <Plan {tasks} overall={board.overall} today={board.today} wedding={board.config.date} {canEdit} {names} {filter} {showDone} {held} {expanded}
          onfilter={setFilter} onshowdone={setShowDone} onexpand={(id) => (expanded = id)} ontick={tickTask} onedit={edit} />
      {:else if tab === 'notes'}
        <Notes {names} />
      {/if}
    </div>
    {#if !writing}
      <TabBar items={TABS} value={tab} label={t('wed.tab')} attr="wed-tab" onpick={pickTab} />
    {/if}
  </div>
  {#if canEdit}
    {#key form.n}
      <TaskForm bind:open={form.open} task={formTask} cats={board.config.cats} onadded={added} onremoved={() => (expanded = null)} />
    {/key}
  {/if}
</Sheet>

<style>
  /* the sheet's column (Sheet's full: edge to edge), the title bar under the safe area */
  .wd { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; padding: var(--ui-top) var(--safe-right) 0 var(--safe-left); }
  .wd > :global(.navbar) { margin-inline: 6px; }
  /* the one scroller */
  .wd-body { display: flex; flex-direction: column; padding-bottom: 24px; }
  .wd-body.writing { overflow: hidden; padding-bottom: 0; }
  .wd-body > :global(*) { flex: none; }
  .wd-body.writing > :global(*) { flex: 1; }
</style>
