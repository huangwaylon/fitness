<script lang="ts">
  // 結婚式 (docs/wedding.md): the wedding board's sheet, its own chunk with its strings, full height (Sheet's
  // `full`, the unified kit: docs/design.md), over the board's store (board.svelte.ts), following the time of day. One
  // title bar (NavBar: 結婚式, ✕), one scroller, the bottom tab bar (プラン / メモ / 設定, 設定 a member's only). プラン: the banner (Head),
  // the filters and the months (Plan); a row opens in place, its 編集 and the ＋ over the tab bar open the form
  // (TaskForm, a form sheet). メモ: the letter (Notes, its 編集 inside it); writing it, the title bar says so and the format
  // tools (with キャンセル and 保存) take the tab bar's place. 設定: the names, the day, the categories, the deleted (Settings). The
  // guest's phone (board.canEdit false) reads it all: no tick, 編集, ＋ or 設定. Kept mounted between openings (Sheet's
  // `keep`): a reopening shows it at once, closed() and the open effect resetting what an opening resets.
  import { tick } from 'svelte';
  import '#lib/i18n/wedding.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import TabBar from '../ui/TabBar.svelte';
  import Icon, { type IconName } from '../ui/Icon.svelte';
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
    if (toasts.current) toasts.dismiss();
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


<Sheet bind:open tunes label={t('wed.title')} variant="full" onclose={closed} timed="wedding" keep>
  <div class="wd">
    <NavBar {title} onclose={() => (open = false)} />
    <div class="wd-body sheet-scroll" class:writing class:plan={tab === 'plan'} bind:this={body} data-wedding data-tab={tab} data-guest={!canEdit || undefined}>
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
    {#if tab === 'plan' && canEdit}
      <button type="button" class="fab" aria-label={t('wed.add')} data-wed-add data-sfx="open" onclick={() => edit(null)}><Icon name="plus" size={24} stroke={2.6} /></button>
    {/if}
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
  /* the plan's last row clear of ＋ */
  .wd-body.plan { padding-bottom: 80px; }
  .wd-body.writing { overflow: hidden; padding-bottom: 0; }
  .wd-body > :global(*) { flex: none; }
  .wd-body.writing > :global(*) { flex: 1; }
  /* ＋: a 48px leaf disc with the game lip, over the tab bar's top edge at the right */
  .fab {
    appearance: none; border: 0; cursor: pointer; position: absolute; z-index: 6; right: calc(14px + var(--safe-right)); bottom: calc(60px + max(var(--safe-bottom), 6px) + 14px);
    width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; background: var(--c-leaf); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge), var(--sh-drop);
    transition: transform var(--dur-base) var(--ease-bounce), box-shadow var(--dur-base) var(--ease-bounce); -webkit-tap-highlight-color: transparent;
  }
  .fab::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; }
  .fab:active { transform: translateY(3px); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); transition-duration: var(--dur-tap); }
  .fab:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  @media (prefers-reduced-motion: reduce) { .fab:active { transform: none; } }
</style>
