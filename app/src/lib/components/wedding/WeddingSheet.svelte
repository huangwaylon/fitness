<script lang="ts">
  // けっこんしき (docs/wedding.md): the wedding board's sheet, its own chunk with its strings, full height (Sheet's
  // `pop`, grown out of the menu's pill), over the board's store (board.svelte.ts), in the quiet kit's look (following
  // the time of day). One title bar (けっこんしき, ✕; on メモ a member's 編集), one scroller, the bottom tab bar
  // (プラン / メモ). プラン: our photo band (the names, the day and venue, the countdown, a member's ⚙), the progress
  // strip, the filters and the months (Plan); a row opens in place, its 編集 and the ＋ over the tab bar open the form
  // (TaskForm, a bottom sheet). メモ: the note (Notes); writing it, the title bar says so (キャンセル) and the format
  // tools take the tab bar's place. 設定 is a level with ‹ (back on the plan where it was scrolled). The guest's phone
  // (board.canEdit false) reads it all: no tick, 編集, ＋ or ⚙.
  import { tick } from 'svelte';
  import '#lib/i18n/wedding.ts';
  import '../quiet/quiet.css';
  import Sheet from '../ui/Sheet.svelte';
  import SheetHeader from '../quiet/SheetHeader.svelte';
  import TabBar from '../quiet/TabBar.svelte';
  import Icon from '../quiet/Icon.svelte';
  import Head from './Head.svelte';
  import Plan from './Plan.svelte';
  import Notes from './Notes.svelte';
  import TaskForm from './TaskForm.svelte';
  import Settings from './Settings.svelte';
  import { board } from './board.svelte.ts';
  import { cancel, flush, pad, write } from './notepad.svelte.ts';
  import type { Filter } from './view.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import type { Who } from '#lib/types.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  let level = $state<'home' | 'settings'>('home');
  let tab = $state<'plan' | 'notes'>('plan');
  let filter = $state<Filter>('all');
  let held = $state(new Set<string>());
  let expanded = $state<string | null>(null);
  const kv = localKV();
  let showDone = $state(kv?.getItem(DEVICE.weddingDone) === '1');
  let body: HTMLElement | undefined = $state();
  /** The plan's scroll when 設定 was opened over it (‹ comes back to it). */
  let homeScroll = 0;
  /** The form: open, on which task (null: a new one), and a fresh one each opening. */
  let form = $state({ open: false, id: null as string | null, n: 0 });

  const canEdit = $derived(board.canEdit);
  const view = $derived(week.view);
  const names = $derived<Record<Who, string>>({ A: view ? villagerNameOf(view, 'A') : 'A', B: view ? villagerNameOf(view, 'B') : 'B', G: view ? villagerNameOf(view, 'G') : 'G' });
  const tasks = $derived(board.tasks);
  const formTask = $derived(form.id ? (tasks.find((x) => x.id === form.id) ?? null) : null);
  const writing = $derived(pad.editing && tab === 'notes' && level === 'home');
  const title = $derived(level === 'settings' ? t('wed.settings') : writing ? t('wed.note.editing') : t('wed.title'));

  // its open and close tunes (it mounts on the first tap, already open: that is an open too)
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });

  /** Closed: the next opening is home, すべて, the plan's top (a note being written stays: back in its editor). */
  function closed() {
    if (toasts.current) toasts.dismiss();
    flush();
    level = 'home';
    homeScroll = 0;
    expanded = null;
    form.open = false;
    setFilter('all');
  }
  function settings() {
    homeScroll = body?.scrollTop ?? 0;
    level = 'settings';
  }
  async function back() {
    cue('back');
    level = 'home';
    await tick();
    body?.scrollTo({ top: homeScroll });
  }
  function pickTab(id: 'plan' | 'notes') {
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
    toasts.show(t('wed.added', { title: name }), 2400, { low: true });
    await tick();
    body?.querySelector(`[data-wed-task="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  }
  // a task gone from under its form (deleted on the other phone): the form closes
  $effect(() => {
    if (form.open && form.id && !formTask) form.open = false;
  });
</script>

{#snippet trailing()}
  {#if writing}
    <button type="button" class="q-btn text" data-wed-note-cancel data-sfx="back" onclick={cancel}>{t('common.cancel')}</button>
  {:else if tab === 'notes' && level === 'home' && canEdit && !board.conflict}
    <button type="button" class="q-btn text" data-wed-note-edit data-sfx="open" onclick={write}>{t('common.edit')}</button>
  {/if}
{/snippet}

<Sheet bind:open label={t('wed.title')} variant="pop" onclose={closed}>
  <div class="quiet wd">
    <SheetHeader {title} onback={level === 'settings' ? back : null} onclose={() => (open = false)} sfx="self" {trailing} />
    <div class="wd-body" class:writing class:plan={tab === 'plan' && level === 'home'} bind:this={body} data-wedding data-level={level} data-tab={tab} data-guest={!canEdit || undefined}>
      {#if level === 'settings' && canEdit}
        <Settings />
      {:else if tab === 'plan'}
        <Head config={board.config} days={board.countdown} onsettings={canEdit ? settings : null} />
        <Plan {tasks} overall={board.overall} today={board.today} wedding={board.config.date} {canEdit} {names} {filter} {showDone} {held} {expanded}
          onfilter={setFilter} onshowdone={setShowDone} onexpand={(id) => (expanded = id)} ontick={tickTask} onedit={edit} />
      {:else}
        <Notes {names} />
      {/if}
    </div>
    {#if level === 'home' && tab === 'plan' && canEdit}
      <button type="button" class="fab" aria-label={t('wed.add')} data-wed-add data-sfx="open" onclick={() => edit(null)}><Icon name="plus" size={26} stroke={2.2} /></button>
    {/if}
    {#if level === 'home' && !writing}
      <TabBar items={[{ id: 'plan', label: t('wed.tab.plan'), icon: 'clipboard' }, { id: 'notes', label: t('wed.tab.notes'), icon: 'file' }]} value={tab} label={t('wed.tab')} attr="wed-tab" onpick={pickTab} />
    {/if}
  </div>
  {#if canEdit}
    {#key form.n}
      <TaskForm bind:open={form.open} task={formTask} cats={board.config.cats} onadded={added} onremoved={() => (expanded = null)} />
    {/key}
  {/if}
</Sheet>

<style>
  /* the quiet ground over the whole sheet: past the panel's own padding, the title bar under the safe area */
  .wd {
    position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column;
    margin: calc(-1 * (var(--ui-top) + 8px)) calc(-1 * (var(--side) + var(--safe-right))) 0 calc(-1 * (var(--side) + var(--safe-left)));
    padding: var(--ui-top) var(--safe-right) 0 var(--safe-left);
  }
  /* the one scroller */
  .wd-body { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; display: flex; flex-direction: column; padding-bottom: 24px; }
  /* the plan's last row clear of ＋ */
  .wd-body.plan { padding-bottom: 88px; }
  .wd-body.writing { overflow: hidden; padding-bottom: 0; }
  .wd-body > :global(*) { flex: none; }
  .wd-body.writing > :global(*) { flex: 1; }
  /* ＋: over the tab bar's top edge, at the right */
  .fab {
    appearance: none; border: 0; cursor: pointer; position: absolute; z-index: 6; right: calc(16px + var(--safe-right)); bottom: calc(49px + max(var(--safe-bottom), 8px) + 14px);
    width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: var(--q-accent); color: var(--q-on-accent);
    box-shadow: 0 2px 4px rgb(30 60 35 / .2), 0 8px 20px rgb(30 60 35 / .25); -webkit-tap-highlight-color: transparent;
  }
  .fab:active { transform: scale(.96); }
  .fab:focus-visible { outline: 2px solid var(--q-accent); outline-offset: 3px; }
</style>
